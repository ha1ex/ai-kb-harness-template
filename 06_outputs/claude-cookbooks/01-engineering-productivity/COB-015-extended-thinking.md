---
id: COB-015
tier: A
category: "Engineering productivity"
kind: workflow
title: "Extended Thinking"
subtitle: "## Table of contents - [Setup](#setup) - [Basic example](#basic-example) - [Streaming with extended thinking](#streaming-with-extended-thinking) - [Token counting and context window management](#to..."
source: https://github.com/anthropics/claude-cookbooks/blob/main/extended_thinking/extended_thinking.ipynb
upstream_name: "extended_thinking/extended_thinking.ipynb"
upstream_folder: "extended_thinking"
provider: anthropic-cookbooks
license: MIT
license_source: https://github.com/anthropics/claude-cookbooks/blob/main/LICENSE
ingested: 2026-05-27
type: case
version: v0.1
---
# Extended Thinking

> ## Table of contents - [Setup](#setup) - [Basic example](#basic-example) - [Streaming with extended thinking](#streaming-with-extended-thinking) - [Token counting and context window management](#to...

## Table of contents
- [Setup](#setup)
- [Basic example](#basic-example)
- [Streaming with extended thinking](#streaming-with-extended-thinking)
- [Token counting and context window management](#token-counting-and-context-window-management)
- [Understanding redacted thinking](#understanding-redacted-thinking-blocks)
- [Handling error cases](#handling-error-cases)

This notebook demonstrates how to use Claude 3.7 Sonnet's extended thinking feature with various examples and edge cases.

Extended thinking gives Claude 3.7 Sonnet enhanced reasoning capabilities for complex tasks, while also providing transparency into its step-by-step thought process before it delivers its final answer. When extended thinking is turned on, Claude creates `thinking` content blocks where it outputs its internal reasoning. Claude incorporates insights from this reasoning before crafting a final response. For more information on extended thinking, see our [documentation](https://docs.claude.com/en/docs/build-with-claude/extended-thinking).

## Setup

First, let's install the necessary packages and set up our environment.

```python
%pip install anthropic
```

```python
import anthropic
import os

# Set your API key as an environment variable or directly
# os.environ["ANTHROPIC_API_KEY"] = "your-api-key-here"

# Initialize the client
client = anthropic.Anthropic()

# Helper functions
def print_thinking_response(response):
    """Pretty print a message response with thinking blocks."""
    print("\n==== FULL RESPONSE ====")
    for block in response.content:
        if block.type == "thinking":
            print("\n🧠 THINKING BLOCK:")
            # Show truncated thinking for readability
            print(block.thinking[:500] + "..." if len(block.thinking) > 500 else block.thinking)
            print(f"\n[Signature available: {bool(getattr(block, 'signature', None))}]")
            if hasattr(block, 'signature') and block.signature:
                print(f"[Signature (first 50 chars): {block.signature[:50]}...]")
        elif block.type == "redacted_thinking":
            print("\n🔒 REDACTED THINKING BLOCK:")
            print(f"[Data length: {len(block.data) if hasattr(block, 'data') else 'N/A'}]")
        elif block.type == "text":
            print("\n✓ FINAL ANSWER:")
            print(block.text)
    
    print("\n==== END RESPONSE ====")

def count_tokens(messages):
    """Count tokens for a given message list."""
    result = client.messages.count_tokens(
        model="claude-sonnet-4-6",
        messages=messages
    )
    return result.input_tokens
```

## Basic example

Let's start with a basic example to show extended thinking in action:

```python
def basic_thinking_example():
    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=4000,
        thinking= {
            "type": "enabled",
            "budget_tokens": 2000
        },
        messages=[{
            "role": "user",
            "content": "Solve this puzzle: Three people check into a hotel. They pay $30 to the manager. The manager finds out that the room only costs $25 so he gives $5 to the bellboy to return to the three people. The bellboy, however, decides to keep $2 and gives $1 back to each person. Now, each person paid $10 and got back $1, so they paid $9 each, totaling $27. The bellboy kept $2, which makes $29. Where is the missing $1?"
        }]
    )
    
    print_thinking_response(response)

basic_thinking_example()
```

## Streaming with extended thinking

This example shows how to handle streaming with thinking:

```python
def streaming_with_thinking():
    with client.messages.stream(
        model="claude-sonnet-4-6",
        max_tokens=4000,
        thinking={
            "type": "enabled",
            "budget_tokens": 2000
        },
        messages=[{
            "role": "user",
            "content": "Solve this puzzle: Three people check into a hotel. They pay $30 to the manager. The manager finds out that the room only costs $25 so he gives $5 to the bellboy to return to the three people. The bellboy, however, decides to keep $2 and gives $1 back to each person. Now, each person paid $10 and got back $1, so they paid $9 each, totaling $27. The bellboy kept $2, which makes $29. Where is the missing $1?"
        }]
    ) as stream:
        # Track what we're currently building
        current_block_type = None
        current_content = ""
        
        for event in stream:
            if event.type == "content_block_start":
                current_block_type = event.content_block.type
                print(f"\n--- Starting {current_block_type} block ---")
                current_content = ""
                
            elif event.type == "content_block_delta":
                if event.delta.type == "thinking_delta":
                    print(event.delta.thinking, end="", flush=True)  # Just print dots for thinking to avoid clutter
                    current_content += event.delta.thinking
                elif event.delta.type == "text_delta":
                    print(event.delta.text, end="", flush=True)
                    current_content += event.delta.text
                    
            elif event.type == "content_block_stop":
                if current_block_type == "thinking":
                    # Just show a summary for thinking
                    print(f"\n[Completed thinking block, {len(current_content)} characters]")
                elif current_block_type == "redacted_thinking":
                    print("\n[Redacted thinking block]")
                print(f"--- Finished {current_block_type} block ---\n")
                current_block_type = None
                
            elif event.type == "message_stop":
                print("\n--- Message complete ---")

streaming_with_thinking()
```

## Token counting and context window management

This example demonstrates how to track token usage with extended thinking:

```python
def token_counting_example():
    # Define a function to create a sample prompt
    def create_sample_messages():
        messages = [{
            "role": "user",
            "content": "Solve this puzzle: Three people check into a hotel. They pay $30 to the manager. The manager finds out that the room only costs $25 so he gives $5 to the bellboy to return to the three people. The bellboy, however, decides to keep $2 and gives $1 back to each person. Now, each person paid $10 and got back $1, so they paid $9 each, totaling $27. The bellboy kept $2, which makes $29. Where is the missing $1?"
        }]
        return messages
    
    # Count tokens without thinking
    base_messages = create_sample_messages()
    base_token_count = count_tokens(base_messages)
    print(f"Base token count (input only): {base_token_count}")
    
    # Make a request with thinking and check actual usage
    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=8000,
        thinking = {
            "type": "enabled",
            "budget_tokens": 2000
        },
        messages=base_messages
    )
    
    # Calculate and print token usage stats
    thinking_tokens = sum(
        len(block.thinking.split()) * 1.3  # Rough estimate
        for block in response.content 
        if block.type == "thinking"
    )
    
    final_answer_tokens = sum(
        len(block.text.split()) * 1.3  # Rough estimate
        for block in response.content 
        if block.type == "text"
    )
    
    print(f"\nEstimated thinking tokens used: ~{int(thinking_tokens)}")
    print(f"Estimated final answer tokens: ~{int(final_answer_tokens)}")
    print(f"Total estimated output tokens: ~{int(thinking_tokens + final_answer_tokens)}")
    print(f"Input tokens + max_tokens = {base_token_count + 8000}")
    print(f"Available for final answer after thinking: ~{8000 - int(thinking_tokens)}")
    
    # Demo with escalating thinking budgets
    thinking_budgets = [1024, 2000, 4000, 8000, 16000, 32000]
    context_window = 200000
    for budget in thinking_budgets:
        print(f"\nWith thinking budget of {budget} tokens:")
        print(f"Input tokens: {base_token_count}")
        print(f"Max tokens needed: {base_token_count + budget + 1000}")  # Add 1000 for final answer
        print(f"Remaining context window: {context_window - (base_token_count + budget + 1000)}")
        
        if base_token_count + budget + 1000 > context_window:
            print("WARNING: This would exceed the context window of 200k tokens!")

# Uncomment to run the example
token_counting_example()
```

## Understanding redacted thinking blocks

Occasionally Claude's internal reasoning will be flagged by safety systems. When this occurs, we encrypt some or all of the `thinking` block and return it to you as a `redacted_thinking` block. These redacted thinking blocks are decrypted when passed back to the API, allowing Claude to continue its response without losing context.

This example demonstrates working with redacted thinking blocks using a special test string that triggers them:

```python
def redacted_thinking_example():
    # Using the special test string that triggers redacted thinking
    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=4000,
        thinking={
            "type": "enabled",
            "budget_tokens": 2000
        },
        messages=[{
            "role": "user",
            "content": "ANTHROPIC_MAGIC_STRING_TRIGGER_REDACTED_THINKING_46C9A13E193C177646C7398A98432ECCCE4C1253D5E2D82641AC0E52CC2876CB"
        }]
    )
    
    # Identify redacted thinking blocks
    redacted_blocks = [block for block in response.content if block.type == "redacted_thinking"]
    thinking_blocks = [block for block in response.content if block.type == "thinking"]
    text_blocks = [block for block in response.content if block.type == "text"]
    print(response.content)
    print(f"Response includes {len(response.content)} total blocks:")
    print(f"- {len(redacted_blocks)} redacted thinking blocks")
    print(f"- {len(thinking_blocks)} regular thinking blocks")
    print(f"- {len(text_blocks)} text blocks")
    
    # Show data properties of redacted blocks
    if redacted_blocks:
        print(f"\nRedacted thinking blocks contain encrypted data:")
        for i, block in enumerate(redacted_blocks[:3]):  # Show first 3 at most
            print(f"Block {i+1} data preview: {block.data[:50]}...")
    
    # Print the final text output
    if text_blocks:
        print(f"\nFinal text response:")
        print(text_blocks[0].text)

# Uncomment to run the example
redacted_thinking_example()
```

## Handling error cases

When using extended thinking, keep in mind:

1. **Minimum budget**: The minimum thinking budget is 1,024 tokens. We suggest starting at the minimum and increasing incrementally to find the optimal range.

2. **Incompatible features**: Thinking isn't compatible with temperature, top_p, or top_k modifications, and you cannot pre-fill responses.

3. **Pricing**: Extended thinking tokens count towards the context window and are billed as output tokens. They also count towards your rate limits.

For more details on extended thinking with tool use, see the "Extended Thinking with Tool Use" notebook.

```python
def demonstrate_common_errors():
    # 1. Error from setting thinking budget too small
    try:
        response = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=4000,
            thinking={
                "type": "enabled",
                "budget_tokens": 500  # Too small, minimum is 1024
            },
            messages=[{
                "role": "user",
                "content": "Explain quantum computing."
            }]
        )
    except Exception as e:
        print(f"\nError with too small thinking budget: {e}")
    
    # 2. Error from using temperature with thinking
    try:
        response = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=4000,
            temperature=0.7,  # Not compatible with thinking
            thinking={
                "type": "enabled",
                "budget_tokens": 2000
            },
            messages=[{
                "role": "user",
                "content": "Write a creative story."
            }]
        )
    except Exception as e:
        print(f"\nError with temperature and thinking: {e}")
    
    # 3. Error from exceeding context window
    try:
        # Create a very large prompt
        long_content = "Please analyze this text. " + "This is sample text. " * 150000
        
        response = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=20000,  # This plus the long prompt will exceed context window
            thinking={
                "type": "enabled",
                "budget_tokens": 10000
            },
            messages=[{
                "role": "user",
                "content": long_content
            }]
        )
    except Exception as e:
        print(f"\nError from exceeding context window: {e}")

# Run the common error examples
demonstrate_common_errors()
```
