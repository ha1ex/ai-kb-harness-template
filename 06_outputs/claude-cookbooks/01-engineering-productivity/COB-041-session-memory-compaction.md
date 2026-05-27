---
id: COB-041
tier: A
category: "Engineering productivity"
kind: workflow
title: "Session Memory Compaction"
subtitle: "Long-running conversations with Claude can exceed context limits, causing loss of important information."
source: https://github.com/anthropics/claude-cookbooks/blob/main/misc/session_memory_compaction.ipynb
upstream_name: "misc/session_memory_compaction.ipynb"
upstream_folder: "misc"
provider: anthropic-cookbooks
license: MIT
license_source: https://github.com/anthropics/claude-cookbooks/blob/main/LICENSE
ingested: 2026-05-27
type: case
version: v0.1
---
# Session Memory Compaction

> Long-running conversations with Claude can exceed context limits, causing loss of important information.

Long-running conversations with Claude can exceed context limits, causing loss of important information. Whether you're building a coding assistant, creative writing tool, or customer service agent, managing session memory is critical for maintaining continuity and quality.

This cookbook teaches you how to **proactively manage session memory** to avoid jarring context limit interruptions. Unlike reactive approaches that wait until the context is full, you'll learn to build session memory in the background so compaction is instant when needed.

**Related:** For automatic SDK-based compaction in agentic workflows, see [Automatic Context Compaction](../tool_use/automatic-context-compaction.ipynb). This cookbook focuses on manual control patterns for conversational applications.

## Learning Objectives

By the end of this cookbook, you will be able to:

- Write effective session memory prompts that preserve critical context across compaction events
- Implement **instant compaction** using background threading to eliminate user wait time
- Apply prompt caching to reduce the cost of background memory updates by ~80%
- Choose appropriate compaction strategies (traditional vs. instant) based on your use case

## Prerequisites and Setup

Before following this guide, ensure you have:

**Required Knowledge**
- Basic understanding of Claude API usage and message formatting
- Familiarity with Python threading concepts (helpful but not required)

**Required Tools**
- Python 3.11 or higher
- Anthropic API key
- Anthropic SDK

### Installation

First, install the required dependencies:

```python
%%capture
%pip install -U anthropic python-dotenv
```

```python
import anthropic
from anthropic.types import MessageParam, TextBlockParam
from dotenv import load_dotenv

load_dotenv()

client = anthropic.Anthropic()
MODEL = "claude-sonnet-4-6"
```

```python
# Helper functions
def truncate_response(text: str, max_lines: int = 15) -> str:
    """Truncate long responses for cleaner output display."""
    lines = text.strip().split("\n")
    if len(lines) <= max_lines:
        return text
    return "\n".join(lines[:max_lines]) + f"\n... ({len(lines) - max_lines} more lines)"


def remove_thinking_blocks(text: str) -> tuple[str, str]:
    """Remove <think>...</think> blocks from the text."""
    import re

    matches = re.findall(r"<think>.*?</think>", text, flags=re.DOTALL)
    cleaned = re.sub(r"<think>.*?</think>\s*", "", text, flags=re.DOTALL).strip()
    return cleaned, "".join(matches)


def add_cache_control(messages: list[dict]) -> list[MessageParam]:
    """Add cache_control to the last user message for prompt caching.

    For prompt caching to work, the message prefix structure must be identical between requests.
    All messages are converted to list format for consistency, and cache_control is placed on
    the last user message to match the standard API call pattern.
    """
    cached_messages: list[MessageParam] = []
    last_user_idx = None

    # Find last user message index
    for i, msg in enumerate(messages):
        if msg["role"] == "user":
            last_user_idx = i

    for i, msg in enumerate(messages):
        content = msg["content"]
        text = content if isinstance(content, str) else content[0]["text"]

        content_block: TextBlockParam = {"type": "text", "text": text}
        if i == last_user_idx:
            content_block["cache_control"] = {"type": "ephemeral"}

        cached_messages.append({"role": msg["role"], "content": [content_block]})

    return cached_messages


def estimate_tokens(text: str) -> int:
    """Rudimentary token estimation: 1 token per 4 characters."""
    return len(text) // 4
```

```python
SESSION_MEMORY_PROMPT = """
Compress the conversation into a structured summary
that preserves all information needed to continue work seamlessly. Optimize for the assistant's
ability to continue working, not human readability.

<analysis-instructions>
Before generating your summary, analyze the transcript in <think>...</think> tags:
1. What did the user originally request? (Exact phrasing)
2. What actions succeeded? What failed and why?
3. Did the user correct or redirect the assistant at any point?
4. What was actively being worked on at the end?
5. What tasks remain incomplete or pending?
6. What specific details (IDs, paths, values, names) must survive compression?
</analysis-instructions>

<summary-format>
## User Intent
The user's original request and any refinements. Use direct quotes for key requirements.
If the user's goal evolved during the conversation, capture that progression.

## Completed Work
Actions successfully performed. Be specific:
- What was created, modified, or deleted
- Exact identifiers (file paths, record IDs, URLs, names)
- Specific values, configurations, or settings applied

## Errors & Corrections
- Problems encountered and how they were resolved
- Approaches that failed (so they aren't retried)
- User corrections: "don't do X", "actually I meant Y", "that's wrong because..."
Capture corrections verbatim—these represent learned preferences.

## Active Work
What was in progress when the session ended. Include:
- The specific task being performed
- Direct quotes showing exactly where work left off
- Any partial results or intermediate state

## Pending Tasks
Remaining items the user requested that haven't been started.
Distinguish between "explicitly requested" and "implied/assumed."

## Key References
Important details needed to continue:
- Identifiers: IDs, paths, URLs, names, keys
- Values: numbers, dates, configurations, credentials (redacted)
- Context: relevant background information, constraints, preferences
- Citations: sources referenced during the conversation
</summary-format>

<preserve-rules>
Always preserve when present:
- Exact identifiers (IDs, paths, URLs, keys, names)
- Error messages verbatim
- User corrections and negative feedback
- Specific values, formulas, or configurations
- Technical constraints or requirements discovered
- The precise state of any in-progress work
</preserve-rules>

<compression-rules>
- Weight recent messages more heavily—the end of the transcript is the active context
- Omit pleasantries, acknowledgments, and filler ("Sure!", "Great question")
- Omit system context that will be re-injected separately
- Keep each section under 500 words; condense older content to make room for recent
- If you must cut details, preserve: user corrections > errors > active work > completed work
</compression-rules>
"""
```

### Code example using traditional compacting
In traditional compaction, you generate one summary once the token threshold is reached.
Traditional compaction is slow: when you hit the context limit, you wait for a summary.

```
TRADITIONAL COMPACTION (slow)
─────────────────────────────
Turn 1 → Turn 2 → Turn 3 → ... → Turn N → CONTEXT FULL!
                                              │
                                              ▼
                                    ┌─────────────────┐
                                    │ Generate summary│
                                    │ ( USER WAITS !) │
                                    └─────────────────┘
                                              │
                                              ▼
                                         Continue

```

```python
import time


class TraditionalCompactingChatSession:
    """Traditional chat session with compaction after the fact."""

    def __init__(self, system_message="You are a helpful assistant", context_limit: int = 10000):
        self.system_message = system_message
        self.context_limit = context_limit  # the point at which the conversation is compacted so it does not exceed model limits.
        self.messages = []
        self.current_context_window_tokens = 0
        self.summary = None

    def chat(self, user_message: str) -> tuple[str, anthropic.types.Usage]:
        # In traditional compaction, we check if we need to compact when the user sends a message. NOT IDEAL!
        if self.current_context_window_tokens >= self.context_limit:
            print(
                f"\n🧹 Context window at {self.current_context_window_tokens} tokens. Limit exceeded, compacting session memory..."
            )
            self.compact()  # compacts everything before the new user message

        self.messages.append({"role": "user", "content": user_message})
        print(f"\nUser: {user_message}")

        response = client.messages.create(
            model=MODEL,
            max_tokens=3500,
            system=self.system_message,
            messages=add_cache_control(self.messages),
        )
        assistant_message = response.content[0].text
        self.messages.append({"role": "assistant", "content": assistant_message})

        print(f"\nAssistant: \n{truncate_response(assistant_message, max_lines=15)}")

        # approximate current token count in the conversation before the next user message
        cache_read = getattr(response.usage, "cache_read_input_tokens", 0) or 0
        total_input = response.usage.input_tokens + cache_read
        self.current_context_window_tokens = total_input + response.usage.output_tokens

        print(
            f"Input={total_input:,}, Prompt cached used= {cache_read > 0} | "
            f"Output={response.usage.output_tokens:,} | "
            f"Messages={len(self.messages)}"
        )
        return assistant_message, response.usage

    def compact(self) -> None:
        start_time = time.perf_counter()

        response = client.messages.create(
            model=MODEL,
            max_tokens=5000,
            system=self.system_message,  # Same as main chat for cache sharing
            messages=add_cache_control(self.messages)
            + [{"role": "user", "content": SESSION_MEMORY_PROMPT}],
        )
        elapsed = time.perf_counter() - start_time

        # Generate new summary message
        self.summary, removed_text = remove_thinking_blocks(
            response.content[0].text
        )  # clean up any <think> blocks because they are not needed in the session memory
        approximate_summary_tokens = response.usage.output_tokens - round(
            len(removed_text) / 4
        )  # rough estimate of tokens removed from summary

        # Replace prior messages with new summary message
        self.messages = [
            {
                "role": "user",
                "content": f"""This session is being continued from a previous conversation. Here is the session memory: {self.summary}.Continue from where we left off.""",
            }
        ]

        # Show token reduction if we just compacted
        reduction = self.current_context_window_tokens - approximate_summary_tokens
        pct = (reduction / self.current_context_window_tokens) * 100

        print(f"\n{'-' * 60}")
        print("📝 New session memory created.")
        print(
            f"✅ Tokens reduced: {self.current_context_window_tokens:,} → {approximate_summary_tokens:.0f} ({reduction:,} tokens saved, {pct:.0f}% reduction)"
        )
        print(f"⏱️ Compaction time: {elapsed:.2f}s (user waiting...)")
        print(f" Cache used: {getattr(response.usage, 'cache_read_input_tokens', 0) > 0}")
        print(f"{'-' * 60}")

        # Update token count to reflect compacted state
        self.current_context_window_tokens = approximate_summary_tokens
```

Below we simulate a conversation between an author and an LLM that helps write stories.

```python
SYSTEM_PROMPT = """
You are a short story writer who helps authors develop their ideas into compelling narratives.

## What You Do

**Plot Development**
- Help authors work through story structure, pacing, and narrative arc
- Identify plot holes, inconsistencies, or missed opportunities
- Suggest ways to raise stakes, add tension, or deepen conflict
- Brainstorm twists, resolutions, and scene transitions

**Character Development**
- Develop backstories, motivations, and internal conflicts
- Ensure characters have distinct voices and consistent behavior
- Explore character relationships and how they drive the plot
- Help authors understand what their characters want vs. what they need

**Drafting**
- Write short stories or scenes based on the author's ideas and direction
- Match tone, genre conventions, and stylistic preferences
- Show rather than tell when bringing scenes to life
- Craft dialogue that reveals character and advances plot

## How You Work
- You are the lead writer. When you disagree with a creative choice, say so respectfully, but ultimately defer to what the author wants.
- DO NOT ask the user to provide more context or clarify their request. Assume you have enough information to proceed.
"""
```

```python
session = TraditionalCompactingChatSession(system_message=SYSTEM_PROMPT)

# Simulated conversation
messages = [
    "I want to create a story about a young detective solving a mysterious case in a small town. Generate 3 well thought out plot ideas for me to consider.",
    "I don't like those ideas, can you think of one plot something more unique and unexpected?",
    "Ok I like it. Can you help me develop the main character's backstory and motivations?",
    "Can you draft a detailed outline for the story, breaking it down into chapters and key events?",
    "Can you draft me a first chapter based on the plot and character ideas we've discussed so far? Make it around 2,000 words.",
    "Can you draft a second chapter that builds on the first one, introducing a new twist in the mystery?",
]

print("Starting conversation...\n")

turn_count = 0

for _i, message in enumerate(messages, 1):
    turn_count += 1
    print(f"==============================================\nTurn {turn_count}:\n")
    response, usage = session.chat(message)
```

This is a long conversation with several turns. You'll notice a few things here:

Prompt caching: You'll notice here that the input tokens eventually grew to a point where prompt caching was used (turn 6). This helps reduce costs and speed as these conversations grow!

On the next turn, we are going to hit our 10K context window limit, which triggers compaction:

```python
response, usage = session.chat("Propose a title for the book")
```

You'll notice here that it took **over 40 seconds** for the agent to compact the conversation. Because we used traditional compaction, the user would be waiting on Claude to compact the conversation, which is not an ideal user experience.

Below you can see the result of the compaction. It captures the key elements of conversation in less than 2K tokens.

```python
print(session.summary)
```

## Instant Compaction

With **Instant compaction** the session memory is PROACTIVELY generated once a soft token threshold is reached. 

Once the user triggers a compaction or a hard limit is reached, the summary is already available, so the user doesn't need to wait.

Result: Instant compaction, no waiting.

SESSION MEMORY COMPACTION (instant)
```
────────────────────────────────────
Turn 1 → Turn 2 → ... → Turn K → Turn K+1 → ... → Turn N → ..  → CONTEXT FULL!
                            │                         │            │
                (soft token threshold met:        (update          │
               initialize session memory)          trigger)        │
                            │                                      │
                            │                         │            │
                            ▼                         ▼            │
                       ┌────────┐                ┌────────┐        │
                       │ Create │                │ Update │        │
                       │ memory │ (background)   │ memory │        │
                       └────────┘                └────────┘        │
                            │                         │            │
                            ▼                         ▼            ▼
                     📝 session-memory.md ──────────────────► INSTANT SWAP!
                       (continuously updated)
```

**Update triggers:** The first summary is generated after the initial soft token limit. Updates can be triggered after every subsequent turn, or at periodically at natural breakpoints intervals (e.g. every ~10k tokens or 3+ tool calls).

This `InstantCompactingChatSession` class uses **threading** for background execution:
1. **`threading.Thread`** - runs memory updates in background without blocking
2. **Thread-safe state** - uses `threading.Lock` to safely update shared memory
3. **Daemon threads** - background work doesn't prevent program exit
4. **Instant compaction** - when context is full, just swap in the pre-built memory

```python
import threading
import time


class InstantCompactingChatSession:
    """
    Maintains session memory via incremental background updates.

    Key insight: By updating memory in the background after each turn,
    the summary is already ready when compaction is needed - instant swap!
    """

    def __init__(
        self,
        system_message="You are a helpful assistant",
        context_limit: int = 12000,
        min_tokens_to_init: int = 7500,
        min_tokens_between_updates: int = 2000,
    ):
        # Thresholds
        self.context_limit = context_limit  # the point at which the conversation is compacted so it does not exceed model limits
        self.min_tokens_to_init = min_tokens_to_init  # tokens needed to trigger initial memory creation; note this happens PROACTIVELY in background unlike traditional compaction
        self.min_tokens_between_updates = min_tokens_between_updates  # tokens needed to trigger memory update. only comes into play after initial memory is created and additional compaction (memory update) is needed after that

        # Conversation state
        self.system_message = system_message
        self.messages = []
        self.current_context_window_tokens = 0

        # Session memory state
        self.session_memory = None  # this is the compacted conversation in session memory; for the demo we are storing this in memory, but in production you would write to session_memory.md file
        self.last_summarized_index = (
            0  # The index of the last message included in the session memory
        )
        self.tokens_at_last_update = 0  # To track tokens at last memory update and see if enough new tokens have been added to trigger another update

        # Background update tracking
        self._update_thread: threading.Thread | None = None
        self.last_update_time = None
        self._lock = threading.Lock()

    def chat(self, user_message: str) -> tuple[str, anthropic.types.Usage, str | None]:
        """Process a chat turn with background session memory updates."""

        if self.current_context_window_tokens + estimate_tokens(user_message) >= self.context_limit:
            self.compact()  # note that when this is triggered, the compaction has already been created and is just swapped in instantly

        self.messages.append({"role": "user", "content": user_message})

        response = client.messages.create(
            model=MODEL,
            max_tokens=3500,
            system=self.system_message,
            messages=add_cache_control(self.messages),
        )

        assistant_message = response.content[0].text
        self.messages.append({"role": "assistant", "content": assistant_message})

        # Calculate token usage including cache
        cache_read = getattr(response.usage, "cache_read_input_tokens", 0) or 0
        total_input = response.usage.input_tokens + cache_read

        # Update context window tokens (includes cached tokens since they still count toward context)
        self.current_context_window_tokens = total_input + response.usage.output_tokens

        # KEY DIFFERENCE: Trigger background memory update if needed proactively, before compaction is needed
        background_status = None
        if self._should_init_memory() or self._should_update_memory():
            self._trigger_background_update()
            background_status = "initializing" if self.session_memory is None else "updating"

        # Return usage info with cache stats
        return assistant_message, response.usage, background_status

    # Helper methods to determine when to init session memory
    def _should_init_memory(self) -> bool:
        return (
            self.session_memory is None
            and self.current_context_window_tokens >= self.min_tokens_to_init
        )

    # Helper method to determine if memory should be updated
    def _should_update_memory(self) -> bool:
        if self.session_memory is None:
            return False
        tokens_since = self.current_context_window_tokens - self.tokens_at_last_update
        return tokens_since >= self.min_tokens_between_updates

    # Methods to create initial session memory
    def _create_session_memory(self, messages: list[dict]) -> str:
        """Generate initial session memory from messages."""
        # Put compaction instructions in user message to share cache with main chat
        compaction_messages = [{"role": "user", "content": SESSION_MEMORY_PROMPT}]
        response = client.messages.create(
            model=MODEL,
            max_tokens=5000,
            system=self.system_message,  # Same as main chat for cache sharing
            messages=add_cache_control(messages) + compaction_messages,
        )
        summary, _ = remove_thinking_blocks(
            response.content[0].text
        )  # clean up any <think> blocks because they are not needed in the session memory
        print(
            f"   [Background] Initial session memory created. Cache hit={getattr(response.usage, 'cache_read_input_tokens', 0) > 0}"
        )
        return summary

    def _update_session_memory(self, new_messages: list[dict]) -> str:
        """Update existing session memory with new messages. In practice, you may want to do this via file edit rather than full re-generation. But for demo purposes we do full regeneration here."""
        # Put compaction instructions in user message to share cache with main chat
        compaction_update_messages = [
            {
                "role": "user",
                "content": SESSION_MEMORY_PROMPT
                + f"""There is an existing session memory: {self.session_memory}. Return the entire session memory with updates to reflect new messages.""",
            }
        ]
        response = client.messages.create(
            model=MODEL,
            max_tokens=5000,
            system=self.system_message,
            messages=new_messages
            + compaction_update_messages,  # you may want to use prompt caching instead, in which case you'd use add_cache_control(self.messages) here
        )
        updated_summary, _ = remove_thinking_blocks(
            response.content[0].text
        )  # clean up any <think> blocks because they are not needed in the session memory
        print("   [Background] Session memory updated.")
        return updated_summary

    # Background memory update methods
    def _background_memory_update(
        self, messages_snapshot: list[dict], snapshot_index: int, current_tokens: int
    ) -> None:
        """Run session memory update in a background thread."""
        try:
            with self._lock:
                current_session_memory = self.session_memory
                last_index = self.last_summarized_index

            if current_session_memory is None:
                new_memory = self._create_session_memory(messages_snapshot)
            else:
                # Get new messages since last summary
                new_messages = messages_snapshot[last_index:]
                if not new_messages:
                    return
                new_memory = self._update_session_memory(new_messages)

            # Update state (thread-safe)
            with self._lock:
                self.session_memory = new_memory
                self.last_summarized_index = snapshot_index
                self.tokens_at_last_update = current_tokens
                self.last_update_time = time.time()

        except Exception as e:
            print(f"   [Background] Error updating memory: {e}")

    # This makes sure only one background update runs at a time. If one is already running, we skip starting another. If not, we start a new thread to do the update.
    def _trigger_background_update(self):
        """Trigger a background session memory update."""
        if self._update_thread is not None and self._update_thread.is_alive():
            return

        messages_snapshot = self.messages.copy()
        snapshot_index = len(messages_snapshot)
        current_tokens = self.current_context_window_tokens

        self._update_thread = threading.Thread(
            target=self._background_memory_update,
            args=(messages_snapshot, snapshot_index, current_tokens),
            daemon=True,
        )
        self._update_thread.start()

    # Function to compact
    def compact(self) -> None:
        """INSTANT compaction using pre-built session memory."""
        prev_msg_count = len(self.messages)

        # Ensure session memory is ready. Shouldn't be an issue normally, but here for safety.
        if self.session_memory is None:
            if self._update_thread is not None and self._update_thread.is_alive():
                print("   ⏳ Waiting for background memory update...")
                self._update_thread.join(timeout=30.0)

            if self.session_memory is None:
                print("   ⚠️  No pre-built memory, creating synchronously...")
                start = time.perf_counter()
                self.session_memory = self._create_session_memory(self.messages)
                elapsed = time.perf_counter() - start
                print(f"   ⏱️  Took {elapsed:.2f}s (but should be instant normally!)")
                self.last_summarized_index = len(self.messages)

        with self._lock:
            unsummarized = self.messages[self.last_summarized_index :]
            summary_message = [
                {
                    "role": "user",
                    "content": f"""This session is being continued from a previous conversation. Here is the session memory: {self.session_memory}.Continue from where we left off.""",
                }
            ]
            self.messages = summary_message + unsummarized
            self.last_summarized_index = 1

            print(f"\n{'=' * 60}")
            print(f"⚡ INSTANT COMPACTION! Messages: {prev_msg_count} → {len(self.messages)}")
            print("   Session memory was pre-built (no wait time!)")
            print(f"{'=' * 60}")
```

### Example use of Instant Compaction

```python
# Low thresholds for demo - in production you'd use higher values
session = InstantCompactingChatSession(
    system_message=SYSTEM_PROMPT,
)

messages = [
    "I want to create a story about a young detective solving a mysterious case in a small town. Generate 3 well thought out plot ideas for me to consider.",
    "I don't like those ideas, can you think of one plot something more unique and unexpected?",
    "Ok I like it. Can you help me develop the main character's backstory and motivations?",
    "Can you draft a detailed outline for the story, breaking it down into chapters and key events?",
    "Can you draft me a first chapter based on the plot and character ideas we've discussed so far? Make it around 2,000 words.",
    "Can you draft a second chapter that builds on the first one?",
]
print("Starting conversation with instant compacting chat session...\n")

turn_count = 0
for message in messages:
    response, usage, background_status = session.chat(message)
    turn_count += 1

    # Calculate cache stats
    cache_read = getattr(usage, "cache_read_input_tokens", 0) or 0
    cache_created = getattr(usage, "cache_creation_input_tokens", 0) or 0
    total_input = usage.input_tokens + cache_read

    print(f"{'=' * 60}")
    print(f"Turn {turn_count}:")
    print(f"\nUser: {message}")
    print(f"\nAssistant: \n{truncate_response(response, max_lines=3)}")
    print("\nToken Usage:")
    print(f"  Input: {total_input:,} (new: {usage.input_tokens:,}, cached: {cache_read:,})")
    print(f"  Output: {usage.output_tokens:,}")
    print(
        f"  Messages: {len(session.messages)} | Memory: {'ready' if session.session_memory else 'not yet'}"
    )

    if cache_read > 0:
        cache_pct = (cache_read / total_input) * 100
        print(f"  ✓ Cache hit! {cache_pct:.0f}% of input from cache")

    if background_status:
        print(f"\n  [Background] Proactively {background_status} session memory...")
        print(f"  Context window: {session.current_context_window_tokens:,} tokens")

    print()
```

```python
message = "What did we just talk about? Give me one sentence"
response, usage, background_status = session.chat(message)

# Calculate cache stats
cache_read = getattr(usage, "cache_read_input_tokens", 0) or 0
total_input = usage.input_tokens + cache_read

print(f"\nUser: {message}")
print(f"\nAssistant: \n{truncate_response(response, max_lines=3)}")
print("\nToken Usage:")
print(f"  Input: {total_input:,} (new: {usage.input_tokens:,}, cached: {cache_read:,})")
print(f"  Output: {usage.output_tokens:,}")
print(
    f"  Messages: {len(session.messages)} | Memory: {'ready' if session.session_memory else 'not yet'}"
)

if cache_read > 0:
    cache_pct = (cache_read / total_input) * 100
    print(f"  ✓ Cache hit! {cache_pct:.0f}% of input from cache")
```

You'll notice here that once we hit the context limit, the session memory was instantaly swapped in, meaning the user had zero waiting time for a response!

## Advanced: Understanding Prompt Caching

The background updates can be made **~10x cheaper** by using prompt caching. The trick:
1. Pass the **full conversation** to the background summarizer
2. Add `cache_control` markers so subsequent requests hit the cache
3. Only the new "summarize this" instruction is billed at full price

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    PROMPT CACHING FOR LONG CONVERSATIONS                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  WITHOUT CACHING: Pay full price for entire context every turn                 │
│  ════════════════════════════════════════════════════════════                   │
│                                                                                 │
│  Turn 1:  [System][User1][Asst1]                         →  500 tokens  @ $3/M │
│  Turn 2:  [System][User1][Asst1][User2][Asst2]           → 1500 tokens  @ $3/M │
│  Turn 3:  [System][User1][Asst1][User2][Asst2][User3]... → 3000 tokens  @ $3/M │
│  Turn 4:  [System][User1][Asst1][User2][Asst2][User3]... → 5000 tokens  @ $3/M │
│           ─────────────────────────────────────────────                         │
│                                              Total: 10,000 tokens = $0.030      │
│                                                                                 │
│                                                                                 │
│  WITH CACHING: Pay full price once, then 90% discount on prefix                │
│  ═══════════════════════════════════════════════════════════════                │
│                                                                                 │
│  Turn 1:  [System][User1][Asst1]◆                        →  500 tokens  @ $3/M │
│                                ▲                            (cache created)    │
│                          cache breakpoint                                       │
│                                                                                 │
│  Turn 2:  [System][User1][Asst1][User2][Asst2]◆                                │
│           ╰─────── cached ──────╯                                              │
│                500 @ $0.30/M + 1000 new @ $3/M  =  $0.0032                     │
│                                                                                 │
│  Turn 3:  [System][User1][Asst1][User2][Asst2][User3][Asst3]◆                  │
│           ╰──────────── cached ─────────────╯                                  │
│               1500 @ $0.30/M + 1500 new @ $3/M  =  $0.0050                     │
│                                                                                 │
│  Turn 4:  [System][User1][Asst1][User2][Asst2][User3][Asst3][User4][Asst4]◆    │
│           ╰───────────────────── cached ─────────────────────╯                 │
│                     3000 @ $0.30/M + 2000 new @ $3/M  =  $0.0069               │
│           ─────────────────────────────────────────────                         │
│                                              Total: $0.0166  (45% savings)     │
│                                                                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  COMPACTION + CACHING: Double benefit                                           │
│  ════════════════════════════════════                                           │
│                                                                                 │
│    Main Chat                      Background Summarizer                         │
│    ─────────                      ─────────────────────                         │
│                                                                                 │
│  [Conversation grows...]          [Same conversation prefix]◆ + [Summarize!]   │
│         │                                    │                                  │
│         │                         Cache hit! Only pays for                      │
│         │                         the summarization prompt                      │
│         │                                    │                                  │
│         ▼                                    ▼                                  │
│  Context limit reached  ──────►  Session memory ready instantly                │
│                                  (built cheaply in background)                  │
│                                                                                 │
│  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │  Key insight: The background summarizer reuses the same conversation     │  │
│  │  prefix that was just sent to the main chat - automatic cache hit!       │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘

◆ = cache_control breakpoint (cache everything before this point)
```

### Why this matters for compaction

| Scenario | Cost per background update | Notes |
|----------|---------------------------|-------|
| No caching | Full input cost | 5,000 tokens × $3/M = $0.015 |
| With caching | ~10% of input cost | 500 new + 4,500 cached = $0.003 |
| **Savings** | **~80%** | Compounds over many updates |

The longer the conversation, the bigger the savings—exactly when you need compaction most!

### How the Caching Works

The key is in `_add_cache_control()` and `_create_session_memory_cached()`:

```python
# 1. Mark the last conversation message with cache_control
{
    "role": "user",
    "content": [{
        "type": "text",
        "text": msg["content"],
        "cache_control": {"type": "ephemeral"}  # <-- This creates a cache breakpoint
    }]
}

# 2. Also mark the system prompt
system=[{
    "type": "text",
    "text": "You are a session memory agent...",
    "cache_control": {"type": "ephemeral"}
}]
```

**Why this works:**
- The first background update creates a cache entry for `[System + Messages]`
- Subsequent updates with the same message prefix get **cache hits**
- Only the new summarization instruction is billed at full price
- Cache entries have a 5-minute TTL, so rapid updates benefit most

**Cost math:**
- Without caching: 5,000 tokens × $3.00/1M = $0.015 per update
- With caching: 500 new tokens × $3.00/1M + 4,500 cached × $0.30/1M = $0.00285
- **Savings: ~80%** on background summarization costs

## Conclusion

In this cookbook, you learned how to manage long-running Claude conversations through session memory compaction.

### What We Covered

✅ **Effective compaction prompts** - Structure your session memory to preserve user intent, completed work, errors, active work, and key references while discarding filler

✅ **Instant compaction** - Use background threading to proactively build session memory, eliminating user wait time when context limits are reached

✅ **Prompt caching for cost savings** - Reduce background update costs by ~80% by reusing the conversation prefix cache

✅ **Traditional vs. instant patterns** - Understand when to use each approach based on your application needs

### Key Takeaways

1. **Weight recency heavily** - The end of a conversation is the active working context
2. **Preserve user corrections verbatim** - Prevents the model from reverting to old behaviors
3. **Build memory proactively** - Don't wait for context limits; start background updates early
4. **Leverage prompt caching** - Background summarization can share cache with the main conversation

### Next Steps

- **For agentic workflows**: See [Automatic Context Compaction](../tool_use/automatic-context-compaction.ipynb) for SDK-based automatic compaction with tool use
- **For production**: Consider persisting session memory to disk rather than keeping it in memory
- **For optimization**: Experiment with update frequency thresholds to balance cost vs. freshness
