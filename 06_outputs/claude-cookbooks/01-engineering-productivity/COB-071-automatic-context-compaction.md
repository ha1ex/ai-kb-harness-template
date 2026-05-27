---
id: COB-071
tier: A
category: "Engineering productivity"
kind: workflow
title: "Automatic Context Compaction"
subtitle: "Long-running agentic tasks can often exceed context limits."
source: https://github.com/anthropics/claude-cookbooks/blob/main/tool_use/automatic-context-compaction.ipynb
upstream_name: "tool_use/automatic-context-compaction.ipynb"
upstream_folder: "tool_use"
provider: anthropic-cookbooks
license: MIT
license_source: https://github.com/anthropics/claude-cookbooks/blob/main/LICENSE
ingested: 2026-05-27
type: case
version: v0.1
---
# Automatic Context Compaction

> Long-running agentic tasks can often exceed context limits.

Long-running agentic tasks can often exceed context limits. Tool heavy workflows or long conversations quickly consume the token context window. In [Effective Context Engineering for AI Agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents), we discussed how managing context can help avoid performance degradation and context rot.

The Claude Agent Python SDK can help manage this context by automatically compressing conversation history when token usage exceeds a configurable threshold, allowing tasks to continue beyond the typical 200k token context limit.

In this cookbook, we'll demonstrate context compaction through an **agentic customer service workflow**. Imagine you've built an AI customer service agent tasked with processing a queue of support tickets. For each ticket, you must classify the issue, search the knowledge base, set priority, route to the appropriate team, draft a response, and mark it complete. As you process ticket after ticket, the conversation history fills with classifications, knowledge base searches, and drafted responses—quickly consuming thousands of tokens.

## What is Context Compaction?

When building agentic workflows with tool use, conversations can grow very large as the agent iterates on complex tasks. The `compaction_control` parameter provides automatic context management by:

1. Monitoring token usage per turn in the conversation
2. When a threshold is exceeded, injecting a summary prompt as a user turn
3. Having the model generate a summary wrapped in `<summary></summary>` tags. These tags aren't parsed, but are there to help guide the model.
4. Clearing the conversation history and resuming with only the summary
5. Continuing the task with the compressed context

## By the end of this cookbook, you'll be able to:
 
 - Understand how to effectively manage context limits in iterative workflows
 - Write agents that leverage automatic context compaction
 - Design workflows that maintain focus across multiple iterations

##  Prerequisites

Before following this guide, ensure you have:

**Required Knowledge**

- Basic understanding of agentic patterns and tool calling

**Required Tools**

- Python 3.11 or higher
- Anthropic API key
- Anthropic SDK >= 0.74.1

> **Using Opus 4.6?** We recommend using [server-side compaction](https://docs.anthropic.com/en/docs/build-with-claude/compaction), which handles context management automatically without any SDK-level configuration.
>
> This cookbook covers **SDK-based compaction**, which is useful if you're using an older model or want to use a different (cheaper) model for summarization.

## Setup

First, install the required dependencies:

```python
# %pip install -qU anthropic python-dotenv
```

Note: Ensure your .env file contains:

`ANTHROPIC_API_KEY=your_key_here`

Load your environment variables and configure the client. We also load a helper utility to visualize Claude message responses.

```python
from dotenv import load_dotenv

load_dotenv()

MODEL = "claude-sonnet-4-6"
```

## Setting the Stage

In [utils/customer_service_tools.py](utils/customer_service_tools.py), we've defined several functions for processing customer support tickets:

- `get_next_ticket()` - Retrieves the next unprocessed ticket from the queue
- `classify_ticket(ticket_id, category)` - Categorizes issues as billing, technical, account, product, or shipping
- `search_knowledge_base(query)` - Finds relevant help articles and solutions
- `set_priority(ticket_id, priority)` - Assigns priority levels (low, medium, high, urgent)
- `route_to_team(ticket_id, team)` - Routes tickets to the appropriate support team
- `draft_response(ticket_id, response_text)` - Creates customer-facing responses
- `mark_complete(ticket_id)` - Finalizes processed tickets

For a customer service agent, these tools enable processing tickets systematically. Each ticket requires classification, research, prioritization, routing, and response drafting. When processing 20-30 tickets in sequence, the conversation history fills with tool results from every classification, every knowledge base search, and every drafted response, causing linear token growth.

The `beta_tool` decorator is used on the tools to make them accessible to the Claude agent. The decorator extracts the function arguments and docstring and provides these to Claude as tool metadata.

```python
import anthropic
from anthropic import beta_tool

@beta_tool
def get_next_ticket() -> dict:
    """Retrieve the next unprocessed support ticket from the queue."""
    ...
```

```python
import anthropic
from utils.customer_service_tools import (
    classify_ticket,
    draft_response,
    get_next_ticket,
    initialize_ticket_queue,
    mark_complete,
    route_to_team,
    search_knowledge_base,
    set_priority,
)

client = anthropic.Anthropic()

tools = [
    get_next_ticket,
    classify_ticket,
    search_knowledge_base,
    set_priority,
    route_to_team,
    draft_response,
    mark_complete,
]
```

## Baseline: Running Without Compaction

Let's start with a realistic customer service scenario: Processing a queue of support tickets. 

The workflow looks like this:

**For Each Ticket:**
1. Fetch the ticket using `get_next_ticket()`
2. Classify the issue category (billing, technical, account, product, shipping)
3. Search the knowledge base for relevant information
4. Set appropriate priority (low, medium, high, urgent)
5. Route to the correct team
6. Draft a customer response
7. Mark the ticket complete
8. Move to the next ticket

**The Challenge**: With 5 tickets in the queue, and each requiring 7 tool calls, Claude will make 35 or more tool calls. The results from each step including classification knowledge base search, and drafted responses accumulate in the conversation history. Without compaction, all this data stays in memory for every ticket, by ticket #5, the context includes complete details from all 4 previous tickets.

Let's run this workflow **without compaction** first and observe what happens:

```python
from anthropic.types.beta import BetaMessageParam

num_tickets = 5
initialize_ticket_queue(num_tickets)

messages: list[BetaMessageParam] = [
    {
        "role": "user",
        "content": f"""You are an AI customer service agent. Your task is to process support tickets from a queue.

For EACH ticket, you must complete ALL these steps:

1. **Fetch ticket**: Call get_next_ticket() to retrieve the next unprocessed ticket
2. **Classify**: Call classify_ticket() to categorize the issue (billing/technical/account/product/shipping)
3. **Research**: Call search_knowledge_base() to find relevant information for this ticket type
4. **Prioritize**: Call set_priority() to assign priority (low/medium/high/urgent) based on severity
5. **Route**: Call route_to_team() to assign to the appropriate team
6. **Draft**: Call draft_response() to create a helpful customer response using KB information
7. **Complete**: Call mark_complete() to finalize this ticket
8. **Continue**: Immediately fetch the next ticket and repeat

IMPORTANT RULES:
- Process tickets ONE AT A TIME in sequence
- Complete ALL 7 steps for each ticket before moving to the next
- Keep fetching and processing tickets until you get an error that the queue is empty
- There are {num_tickets} tickets total - process all of them
- Be thorough but efficient

Begin by fetching the first ticket.""",
    }
]

total_input = 0
total_output = 0
turn_count = 0

runner = client.beta.messages.tool_runner(
    model=MODEL,
    max_tokens=4096,
    tools=tools,
    messages=messages,
)

for message in runner:
    messages_list = list(runner._params["messages"])
    turn_count += 1
    total_input += message.usage.input_tokens
    total_output += message.usage.output_tokens
    print(
        f"Turn {turn_count:2d}: Input={message.usage.input_tokens:7,} tokens | "
        f"Output={message.usage.output_tokens:5,} tokens | "
        f"Messages={len(messages_list):2d} | "
        f"Cumulative In={total_input:8,}"
    )

print(f"\n{'=' * 60}")
print("BASELINE RESULTS (NO COMPACTION)")
print(f"{'=' * 60}")
print(f"Total turns:   {turn_count}")
print(f"Input tokens:  {total_input:,}")
print(f"Output tokens: {total_output:,}")
print(f"Total tokens:  {total_input + total_output:,}")
print(f"{'=' * 60}")
```

Now that we have our baseline, we have a better picture of how context grows without compaction. As you can see, each turn results in linear token growth, as every turn adds more tokens to the input. 

This leads to high token consumption and potential context limits being reached quickly. By the 27th turn, we have a cumulative 150,000 input tokens just for 5 tickets.

Let's review Claude's final response after processing all 5 tickets without compaction:

```python
print(message.content[-1].text)
```

### Understanding the Problem

In the baseline workflow above, Claude had to:
- Process **5 support tickets** sequentially
- Complete **7 steps per ticket** (fetch, classify, research, prioritize, route, draft, complete)
- Make **35 tool calls** with results accumulating in conversation history
- Store **every classification, every knowledge base search, every drafted response** in memory

**Why This Happens**:
1. **Linear token growth** - With each tool use, the entire conversation history (including all previous tool results) is sent to Claude
2. **Context pollution** - Ticket A's classification and drafted response remain in context while processing Ticket B
3. **Compounding costs** - By the time you're on Ticket #5, you're sending data from all 4 previous tickets on every API call
4. **Slower responses** - Processing massive contexts takes longer
5. **Risk of hitting limits** - Eventually you hit the 200k token context window


**What We Actually Need**: After completing Ticket A, we only need a **brief summary** (ticket resolved, category, priority) - not the full classification result, knowledge base search, and complete drafted response. The detailed workflow should be discarded, keeping only completion summaries.

Let's see how automatic context compaction solves this problem.

## Enabling Automatic Context Compaction

Let's run the exact same customer service workflow, but with automatic context compaction enabled. We simply add the `compaction_control` parameter to our tool runner.

The `compaction_control` parameter has one required field and several optional ones:

- **`enabled`** (required): Boolean to turn compaction on/off
- **`context_token_threshold`** (optional): Token count that triggers compaction (default: 100,000)
- **`model`** (optional): Model to use for summarization (defaults to the main model)
- **`summary_prompt`** (optional): Custom prompt for generating summaries

For this customer service workflow, we'll use a **5,000 token threshold**. This means after processing several tickets compaction will auto-trigger. This allows Claude to:
1. **Keep completion summaries** (tickets resolved, categories, outcomes)
2. **Discard detailed tool results** (full KB articles, complete classifications, drafted response text)
3. **Start fresh** when processing the next batch of tickets

This mimics how a real support agent works: resolve the ticket, document it briefly, move to the next case.

```python
# Re-initialize queue and run with compaction
initialize_ticket_queue(num_tickets)

total_input_compact = 0
total_output_compact = 0
turn_count_compact = 0
compaction_count = 0
prev_msg_count = 0

runner = client.beta.messages.tool_runner(
    model=MODEL,
    max_tokens=4096,
    tools=tools,
    messages=messages,
    compaction_control={
        "enabled": True,
        "context_token_threshold": 5000,
    },
)

for message in runner:
    turn_count_compact += 1
    total_input_compact += message.usage.input_tokens
    total_output_compact += message.usage.output_tokens
    messages_list = list(runner._params["messages"])
    curr_msg_count = len(messages_list)

    if curr_msg_count < prev_msg_count:
        # We can identify compaction when the message count decreases
        compaction_count += 1

        print(f"\n{'=' * 60}")
        print(f"🔄 Compaction occurred! Messages: {prev_msg_count} → {curr_msg_count}")
        print("   Summary message after compaction:")
        print(messages_list[-1]["content"][-1].text)  # type: ignore
        print(f"\n{'=' * 60}")

    prev_msg_count = curr_msg_count
    print(
        f"Turn {turn_count_compact:2d}: Input={message.usage.input_tokens:7,} tokens | "
        f"Output={message.usage.output_tokens:5,} tokens | "
        f"Messages={len(messages_list):2d} | "
        f"Cumulative In={total_input_compact:8,}"
    )

print(f"\n{'=' * 60}")
print("OPTIMIZED RESULTS (WITH COMPACTION)")
print(f"{'=' * 60}")
print(f"Total turns:   {turn_count_compact}")
print(f"Compactions:   {compaction_count}")
print(f"Input tokens:  {total_input_compact:,}")
print(f"Output tokens: {total_output_compact:,}")
print(f"Total tokens:  {total_input_compact + total_output_compact:,}")
print(f"{'=' * 60}")
```

With automatic context compaction enabled, we can see that our token usage per turn does not grow linearly, but is reduced after each compaction event. There were two compaction events during the processing of tickets, and the follow turn shows a reduction in total token usage.

Compared to the baseline version, we only used 79,000 tokens. We've also printed out the summary messages generated after each compaction event, showing how Claude effectively condensed prior ticket details into summaries.

Let's look at the final response after processing all 5 tickets with compaction enabled.

```python
print(message.content[-1].text)
```

### Comparing Results

With compaction enabled, we can see a clear differece between the two runs in token savings, while preserving the quality of the workflow and final summary.

Here's what changed with automatic context compaction:

1. **Context resets after several tickets** - When processing 5-7 tickets generates 5k+ tokens of tool results, the SDK automatically:
   - Injects a summary prompt
   - Has Claude generate a completion summary wrapped in `<summary></summary>` tags
   - Clears the conversation history and discards detailed classifications, KB searches, and responses
   - Continues with only the completion summary

2. **Input tokens stay bounded** - Instead of accumulating to 100k+ as we process more tickets, input tokens reset after each compaction. When processing Ticket #5, we're NOT carrying the full tool results from Tickets #1-4.

3. **Task completes successfully** - The workflow continues smoothly through all tickets without hitting context limits

4. **Quality is preserved** - The summaries retain critical information:
   - Tickets processed with their IDs
   - Categories and priorities assigned
   - Teams routed to
   - Overall progress status
   
   All tickets are still properly classified, prioritized, routed, and responded to.

5. **Natural workflow** - This mirrors how real support agents work: resolve a ticket, document it briefly in the system, close it, move to the next one. You don't keep every knowledge base article and full response draft open while working on new tickets.

Let's visualize the token savings:

```python
# Compare baseline vs compaction
print("=" * 70)
print("TOKEN USAGE COMPARISON")
print("=" * 70)
print(f"{'Metric':<30} {'Baseline':<20} {'With Compaction':<20}")
print("-" * 70)
print(f"{'Input tokens:':<30} {total_input:>19,} {total_input_compact:>19,}")
print(f"{'Output tokens:':<30} {total_output:>19,} {total_output_compact:>19,}")
print(
    f"{'Total tokens:':<30} {total_input + total_output:>19,} {total_input_compact + total_output_compact:>19,}"
)
print(f"{'Compactions:':<30} {'N/A':>19} {compaction_count:>19}")
print("=" * 70)

# Calculate savings
token_savings = (total_input + total_output) - (total_input_compact + total_output_compact)
savings_percent = (
    (token_savings / (total_input + total_output)) * 100 if (total_input + total_output) > 0 else 0
)

print(f"\n💰 Token Savings: {token_savings:,} tokens ({savings_percent:.1f}% reduction)")
```

## How Compaction Works Under the Hood

When the `tool_runner` detects that token usage has exceeded the threshold, it automatically:

1. **Pauses the workflow** before making the next API call
2. **Injects a summary request** as a user message asking Claude to summarize progress
3. **Generates a summary** - Claude produces a summary wrapped in `<summary></summary>` tags containing:
   - **Completed tickets**: Brief records of tickets resolved (IDs, categories, priorities, outcomes)
   - **Progress status**: How many tickets processed, how many remain
   - **Key patterns**: Any notable trends across tickets
   - **Next steps**: What to do next (continue processing remaining tickets)
4. **Clears history** - The entire conversation history (including all tool results) is replaced with just the summary
5. **Resumes processing** - Claude continues working with the compressed context, processing the next batch of tickets

## Customizing Compaction Configuration

You can customize how compaction works to fit your specific use case. Here are the key configuration options:

### Adjusting the Threshold

The `context_token_threshold` determines when compaction triggers:

```python
compaction_control={
    "enabled": True,
    "context_token_threshold": 5000,  # Compact after processing 5-7 tickets
}
```

The threshold should not be set too low, otherwise the summary itself could trigger a compaction. We set a threshold of 5,000 tokens for demonstration purposes, but in practice, experiment with different settings to find what works best for your workflow.

Here some general guidelines:

- **Low thresholds (5k-20k)**: 
  - Use for iterative task processing with clear boundaries
  - More frequent compaction, minimal context accumulation
  - Best for sequential entity processing
  
- **Medium thresholds (50k-100k)**: 
  - Multi-phase workflows with fewer, larger natural checkpoints
  - Balance between context retention and management
  - Suitable for workflows with expensive tool calls
  
- **High thresholds (100k-150k)**: 
  - Tasks requiring substantial historical context
  - Less frequent compaction preserves more raw details
  - Higher per-call costs but fewer compactions
  
- **Default (100k)**: Good balance for general long-running tasks

**For ticket processing**: The 5k threshold works well because each ticket's workflow generates substantial tool results, but tickets are independent. After resolving Ticket A, you don't need its detailed KB searches when processing Ticket B.

### Using a Different Model for Summarization

You can also use a faster/cheaper model for generating summaries:

```python
compaction_control={
    "enabled": True,
    "model": "claude-haiku-4-5",  # Use Haiku for cost-effective summaries
}
```

### Custom Summary Prompts

You can provide a custom prompt to guide how summaries are generated. This is especially useful for customer service workflows where you need to preserve specific types of information.

For example, we could define a custom prompt based on our requirements:
- **Ticket summaries** for all completed tickets
- **Categories and priorities** assigned
- **Teams routed to**
- **Progress status** (tickets completed, tickets remaining)
- **Next steps** in the workflow

```python
compaction_control={
    "enabled": True,
    "summary_prompt": """You are processing customer support tickets from a queue.

Create a focused summary that preserves:

1. **COMPLETED TICKETS**: For each ticket you've fully processed:
   - Ticket ID and customer name
   - Issue category and priority assigned
   - Team routed to
   - Brief outcome

2. **PROGRESS STATUS**: 
   - How many tickets you've completed
   - Approximately how many remain in the queue

3. **NEXT STEPS**: Continue processing the next ticket

Format with clear sections and wrap in <summary></summary> tags."""
}
```

## Compaction Without Tools: Simple Chat Loop

While the examples above focus on tool-heavy agentic workflows, context compaction is also valuable for **simple conversational applications** where users drive the conversation.

 **Note:** The `compaction_control` parameter demonstrated above works with `tool_runner` for agentic workflows with tools. For simple chat applications without tools, you'll implement compaction manually using the same principles.

Consider a chat application where users are having extended conversations with Claude—discussing complex topics, iterating on ideas, or working through problems. As the conversation grows, you face the same context accumulation challenges.

**The Difference**: Instead of tool use triggering token growth, it's the back-and-forth conversation itself. Each exchange adds messages to the history:
- User asks a question
- Claude provides a detailed response
- User asks for clarification or elaboration
- Claude responds with more context
- This repeats dozens or hundreds of times

Without compaction, by turn 50 you're sending the entire conversation history (all 50 exchanges) on every API call.

**The Solution**: Implement compaction manually in your chat loop using the same pattern:
1. Track token usage after each turn
2. When threshold is exceeded, request a summary
3. Replace conversation history with the summary
4. Continue the conversation with compressed context

Let's see how to implement this:

```python
#!/usr/bin/env python3
"""
Simple Compaction Example - User-Driven Chat Loop

This shows the basic pattern for a chat application with compaction.
No tools required - just a simple loop where the user drives continuation.
"""

# Configuration
COMPACTION_THRESHOLD = 3000  # Compact when tokens exceed this (low for demo purposes)

# Structured summarization prompt for compaction
SUMMARY_PROMPT = """You have been working on the task described above but have not yet completed it. Write a continuation summary that will allow you (or another instance of yourself) to resume work efficiently in a future context window where the conversation history will be replaced with this summary. Your summary should be structured, concise, and actionable. Include:

1. **Task Overview**
   - The user's core request and success criteria
   - Any clarifications or constraints they specified

2. **Current State**
   - What has been completed so far
   - Files created, modified, or analyzed (with paths if relevant)
   - Key outputs or artifacts produced

3. **Important Discoveries**
   - Technical constraints or requirements uncovered
   - Decisions made and their rationale
   - Errors encountered and how they were resolved
   - What approaches were tried that didn't work (and why)

4. **Next Steps**
   - Specific actions needed to complete the task
   - Any blockers or open questions to resolve
   - Priority order if multiple steps remain

5. **Context to Preserve**
   - User preferences or style requirements
   - Domain-specific details that aren't obvious
   - Any promises made to the user

Be concise but complete—err on the side of including information that would prevent duplicate work or repeated mistakes.
 Write in a way that enables immediate resumption of the task.

Wrap your summary in <summary></summary> tags."""

# Message history
messages = []

print("Chat with Claude (type 'quit' to exit, or just hit Enter to continue)")
print("This is a demonstration - try having a conversation and watch compaction trigger")
print("=" * 60)

# Simulate a conversation for demo purposes
demo_messages = [
    "Help me understand how Python decorators work",
    "Can you show me an example with a timing decorator?",
    "How would I make a decorator that takes arguments?",
]

for user_input in demo_messages:
    print(f"\nYou: {user_input}")

    # Add user message
    messages.append({"role": "user", "content": user_input})

    # Get Claude's response
    response = client.messages.create(
        model=MODEL,
        max_tokens=2048,
        messages=messages,
    )

    messages.append(
        {
            "role": "assistant",
            "content": response.content,
        }
    )

    print("\nClaude: ", end="")
    for block in response.content:
        if block.type == "text":
            print(f"{block.text[:300]} ...")

    # Check if we should compact
    usage = response.usage

    # Calculate total tokens (includes cache tokens)
    total_input_tokens = (
        usage.input_tokens
        + (usage.cache_creation_input_tokens or 0)
        + (usage.cache_read_input_tokens or 0)
    )
    total_tokens = total_input_tokens + usage.output_tokens

    cache_info = ""
    if usage.cache_creation_input_tokens or usage.cache_read_input_tokens:
        cache_info = f" (cache: {usage.cache_creation_input_tokens or 0} write + {usage.cache_read_input_tokens or 0} read)"

    print(
        f"\n[Tokens: {total_input_tokens} in{cache_info} + {usage.output_tokens} out = {total_tokens} total]"
    )

    if total_tokens > COMPACTION_THRESHOLD:
        print(f"\n{'=' * 60}")
        print(f"🔄 Compacting conversation... {len(messages)} messages → ", end="", flush=True)

        # Get summary using structured prompt
        summary_response = client.messages.create(
            model=MODEL,
            max_tokens=4096,
            messages=messages + [{"role": "user", "content": SUMMARY_PROMPT}],
        )

        summary_text = "".join(
            block.text for block in summary_response.content if block.type == "text"
        )

        # Replace history with summary
        messages = [{"role": "user", "content": summary_text}]

        print("1 message")
        print(f"{'=' * 60}\n")

print(f"Final conversation messages: {messages[-1].get('content')}")

print("\nDemo complete! In a real application, this loop would continue with user input.")
```

### Understanding the Chat Loop Pattern

The example above demonstrates manual compaction in a conversational context. Here's how it works:

**Key Components**:

1. **Token Tracking**: After each response, calculate total tokens (input + output + cache tokens)
2. **Threshold Check**: When total exceeds threshold, trigger compaction
3. **Summary Request**: Send the same structured SUMMARY_PROMPT to Claude
4. **History Replacement**: Replace entire message history with just the summary
5. **Continue**: Next user message builds on the summary, not full history

**When to Use This Pattern**:

- **Extended brainstorming sessions**: Users exploring ideas with Claude over many turns
- **Learning conversations**: Tutorials or explanations that span dozens of exchanges
- **Iterative refinement**: Users providing feedback on drafts, designs, or solutions
- **Chat applications**: Any multi-turn conversation interface

**Key Differences from Tool Runner**:

| Aspect | Tool Runner (Automatic) | Chat Loop (Manual) |
|--------|------------------------|-------------------|
| **Trigger** | Automatic when threshold reached | You implement threshold check |
| **Summary** | SDK handles summary request | You make explicit API call |
| **History Management** | SDK replaces messages | You manually replace list |
| **Use Case** | Agentic workflows with tools | User-driven conversations |

**Production Considerations**:

1. **Adjust threshold**: Use larger thresholds for real applications
2. **Customize summary prompt**: Tailor to your conversation type (brainstorming vs. technical support vs. tutoring)
3. **Show user indicators**: Display a message like "Summarizing conversation..." so users understand the pause
4. **Preserve key context**: Ensure the summary prompt captures domain-specific information your users care about

This pattern gives you full control over when and how compaction happens, making it ideal for conversational applications where the SDK's automatic tool-runner compaction isn't available.

## Limitations and Considerations

While automatic context compaction is powerful, there are important limitations to understand:

### Server-Side Sampling Loops

**Current Limitation**: Compaction does not work optimally with server-side sampling loops, such as server-side web search tools.

**Why**: Cache tokens accumulate across sampling loops, which can trigger compaction prematurely based on cached content rather than actual conversation history.

This feature works best with:
- ✅ Client-side tools (like the customer service API in this cookbook)
- ✅ Standard agentic workflows with regular tool use
- ✅ File operations, database queries, API calls
- ❌ Server-side Extended Thinking
- ❌ Server-side web search tools

### Information Loss

**Trade-off**: Summaries inherently lose some information. While Claude is good at identifying key points, some details will be compressed or omitted.

**In ticket processing**: 
- ✅ **Retained**: Ticket IDs, categories, priorities, teams, outcomes, progress status
- ❌ **Lost**: Full knowledge base article text, complete drafted response text, detailed classification reasoning

This is usually acceptable, you don't need every KB article and full response text in perpetuity, just the completion records.

**Mitigation**:
- Use custom summary prompts to preserve critical information
- Set higher thresholds for tasks requiring extensive historical context
- Structure your tasks to be modular (each phase builds on summaries, not raw details)

### When NOT to Use Compaction

Avoid compaction for:

1. **Short tasks**: If your task completes within 50k-100k tokens, compaction adds unnecessary overhead
2. **Tasks requiring full audit trails**: Some tasks need access to ALL previous details
3. **Server-side sampling workflows**: As mentioned above, wait for this limitation to be addressed
4. **Highly iterative refinement**: Tasks where each step critically depends on exact details from all previous steps

### When TO Use Compaction

Compaction is ideal for:

1. **Sequential processing**: Like our ticket workflow—process multiple items one after another
2. **Multi-phase workflows**: Where each phase can summarize progress before moving on
3. **Iterative data processing**: Processing large datasets in chunks or entities one at a time
4. **Extended analysis sessions**: Analyzing data across many entities
5. **Batch operations**: Processing hundreds of items where each is independent

**Ticket processing is a perfect use case** because:
- Each ticket workflow is largely independent
- You need completion summaries, not full tool results
- Natural compaction points exist (after completing several tickets)
- The workflow is iterative and sequential

## Summary

Automatic context compaction is a powerful feature that enables long-running agentic workflows to exceed typical context limits. In this cookbook, we've explored compaction through a customer service ticket processing workflow.

### Next Steps

Try implementing compaction in your own workflows:
1. Identify natural compaction points (after processing each item, completing each phase, etc.)
2. Start with an aggressive threshold (5k-10k) if you have clear per-item boundaries
3. Use custom summary prompts to preserve critical information
4. Monitor when compaction triggers and verify quality is maintained
5. Adjust threshold based on your specific needs

For more on effective context management, see [Effective Context Engineering for AI Agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents).
