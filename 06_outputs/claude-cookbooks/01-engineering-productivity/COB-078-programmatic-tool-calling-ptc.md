---
id: COB-078
tier: A
category: "Engineering productivity"
kind: workflow
title: "Programatic Tool Calling (PTC) with the Claude API"
subtitle: "Programmatic Tool Calling (PTC) allows Claude to write code that calls tools programmatically within the Code Execution environment, rather than requiring round-trips through the model for each too..."
source: https://github.com/anthropics/claude-cookbooks/blob/main/tool_use/programmatic_tool_calling_ptc.ipynb
upstream_name: "tool_use/programmatic_tool_calling_ptc.ipynb"
upstream_folder: "tool_use"
provider: anthropic-cookbooks
license: MIT
license_source: https://github.com/anthropics/claude-cookbooks/blob/main/LICENSE
ingested: 2026-05-27
type: case
version: v0.1
---
# Programatic Tool Calling (PTC) with the Claude API

> Programmatic Tool Calling (PTC) allows Claude to write code that calls tools programmatically within the Code Execution environment, rather than requiring round-trips through the model for each too...

Programmatic Tool Calling (PTC) allows Claude to write code that calls tools programmatically within the Code Execution environment, rather than requiring round-trips through the model for each tool invocation. This substantially reduces end-to-end latency for multiple tool calls, and can dramatically reduce token consumption by allowing the model to write code that removes irrelevant context before it hits the model’s context window (for example, by grepping for key information within large and noisy files).

When faced with third-party APIs and tools that you may not be able to modify directly, PTC can help reduce usage of context by allowing Claude to write code that can be invoked in the Code Execution environment. 

In this cookbook, we will work with a mock API for team expense management.  The API is designed to require multiple invocations and will return large results which help illustrate the benefits of Programmatic Tool Calling.

## By the end of this cookbook, you'll be able to:

- Understand the difference between regular tool calling and programatic tool calling (PTC)
- Write agents that leverage PTC

## Prerequisites

Before following this guide, ensure you have:

**Required Knowledge**

- Python fundamentals - comfortable with async/await, functions, and basic data structures
- Basic understanding of agentic patterns and tool calling

**Required Tools**

- Python 3.11 or higher
- Anthropic API key
- Anthropic Python SDK >= 0.72

## Setup

First, install the required dependencies:

```python
# %pip install -r requirements.txt
```

Note: Ensure your .env file contains:

`ANTHROPIC_API_KEY=your_key_here`

Load your environment variables and configure the client. We also load a helper utility to visualize Claude message responses.

```python
from dotenv import load_dotenv
from utils.visualize import visualize

load_dotenv()

MODEL = "claude-sonnet-4-6"

viz = visualize(auto_show=True)
```

## Understanding the Third-Party API

In [utils/team_expense_api.py](utils/team_expense_api.py), there are three functions defined: `get_team_members`, `get_expenses`, and `get_custom_budget`. The `get_team_members` function allows us to retrieve all employees in a given department with their role, level, and contact information. The `get_expenses` function returns all expense line items for an employee in a specific quarter—this can be several hundred records per employee, with each record containing extensive metadata including receipt URLs, approval chains, merchant details, and more. The `get_custom_budget` function checks if a specific employee has a custom travel budget exception (otherwise they use the standard $5,000 quarterly limit).

In this scenario, we need to analyze team expenses and identify which employees have exceeded their budgets. Traditionally, we might manually pull expense reports for each person, sum up their expenses by category, compare against budget limits (checking for custom budget exceptions), and compile a report. Instead, we will ask Claude to perform this analysis for us, using the available tools to retrieve team data, fetch potentially hundreds of expense line items with rich metadata, and determine who has gone over budget.

The key challenge here is that each employee may have 100+ expense line items that need to be fetched, parsed, and aggregated—and the `get_custom_budget` tool can only be called after analyzing expenses to see if someone exceeded the standard budget. This creates a sequential dependency chain that makes this an ideal use case for demonstrating the benefits of Programmatic Tool Calling.

We'll pass our tool definitions to the messages API and ask Claude to perform the analysis. Read the docs on [implementing tool use](https://docs.claude.com/en/docs/agents-and-tools/tool-use/implement-tool-use) if you are not familiar with how tool use works with Claude's API.

```python
import json

import anthropic
from utils.team_expense_api import get_custom_budget, get_expenses, get_team_members

client = anthropic.Anthropic()

# Tool definitions for the team expense API
tools = [
    {
        "name": "get_team_members",
        "description": 'Returns a list of team members for a given department. Each team member includes their ID, name, role, level (junior, mid, senior, staff, principal), and contact information. Use this to get a list of people whose expenses you want to analyze. Available departments are: engineering, sales, and marketing.\n\nRETURN FORMAT: Returns a JSON string containing an ARRAY of team member objects (not wrapped in an outer object). Parse with json.loads() to get a list. Example: [{"id": "ENG001", "name": "Alice", ...}, {"id": "ENG002", ...}]',
        "input_schema": {
            "type": "object",
            "properties": {
                "department": {
                    "type": "string",
                    "description": "The department name. Case-insensitive.",
                }
            },
            "required": ["department"],
        },
        "input_examples": [
            {"department": "engineering"},
            {"department": "sales"},
            {"department": "marketing"},
        ],
    },
    {
        "name": "get_expenses",
        "description": "Returns all expense line items for a given employee in a specific quarter. Each expense includes extensive metadata: date, category, description, amount (in USD), currency, status (approved, pending, rejected), receipt URL, approval chain, merchant name and location, payment method, and project codes. An employee may have 20-50+ expense line items per quarter, and each line item contains substantial metadata for audit and compliance purposes. Categories include: 'travel' (flights, trains, rental cars, taxis, parking), 'lodging' (hotels, airbnb), 'meals', 'software', 'equipment', 'conference', 'office', and 'internet'. IMPORTANT: Only expenses with status='approved' should be counted toward budget limits.\n\nRETURN FORMAT: Returns a JSON string containing an ARRAY of expense objects (not wrapped in an outer object with an 'expenses' key). Parse with json.loads() to get a list directly. Example: [{\"expense_id\": \"ENG001_Q3_001\", \"amount\": 1250.50, \"category\": \"travel\", ...}, {...}]",
        "input_schema": {
            "type": "object",
            "properties": {
                "employee_id": {
                    "type": "string",
                    "description": "The unique employee identifier",
                },
                "quarter": {
                    "type": "string",
                    "description": "Quarter identifier: 'Q1', 'Q2', 'Q3', or 'Q4'",
                },
            },
            "required": ["employee_id", "quarter"],
        },
        "input_examples": [
            {"employee_id": "ENG001", "quarter": "Q3"},
            {"employee_id": "SAL002", "quarter": "Q1"},
            {"employee_id": "MKT001", "quarter": "Q4"},
        ],
    },
    {
        "name": "get_custom_budget",
        "description": 'Get the custom quarterly travel budget for a specific employee. Most employees have a standard $5,000 quarterly travel budget. However, some employees have custom budget exceptions based on their role requirements. This function checks if a specific employee has a custom budget assigned.\n\nRETURN FORMAT: Returns a JSON string containing a SINGLE OBJECT (not an array). Parse with json.loads() to get a dict. Example: {"user_id": "ENG001", "has_custom_budget": false, "travel_budget": 5000, "reason": "Standard", "currency": "USD"}',
        "input_schema": {
            "type": "object",
            "properties": {
                "user_id": {
                    "type": "string",
                    "description": "The unique employee identifier",
                }
            },
            "required": ["user_id"],
        },
        "input_examples": [
            {"user_id": "ENG001"},
            {"user_id": "SAL002"},
            {"user_id": "MKT001"},
        ],
    },
]

tool_functions = {
    "get_team_members": get_team_members,
    "get_expenses": get_expenses,
    "get_custom_budget": get_custom_budget,
}
```

## Traditional Tool Calling (Baseline)

In this first example, we'll use traditional tool calling to establish our baseline.

We'll call the `messages.create` API with our initial query. When the model stops with a `tool_use` reason, we will execute the tool as requested, and then add the output from the tool to the messages and call the model again.

```python
import time

from anthropic.types import TextBlock, ToolUseBlock
from anthropic.types.beta import (
    BetaMessageParam as MessageParam,
)
from anthropic.types.beta import (
    BetaTextBlock,
    BetaToolUseBlock,
)

messages: list[MessageParam] = []


def run_agent_without_ptc(user_message):
    """Run agent using traditional tool calling"""
    messages.append({"role": "user", "content": user_message})
    total_tokens = 0
    start_time = time.time()
    api_counter = 0

    while True:
        response = client.beta.messages.create(
            model=MODEL,
            max_tokens=4000,
            tools=tools,
            messages=messages,
            betas=["advanced-tool-use-2025-11-20"],
        )

        api_counter += 1

        # Track token usage
        total_tokens += response.usage.input_tokens + response.usage.output_tokens
        viz.capture(response)
        if response.stop_reason == "end_turn":
            # Extract the first text block from the response
            final_response = next(
                (
                    block.text
                    for block in response.content
                    if isinstance(block, (BetaTextBlock, TextBlock))
                ),
                None,
            )
            elapsed_time = time.time() - start_time
            return final_response, messages, total_tokens, elapsed_time, api_counter

        # Process tool calls
        if response.stop_reason == "tool_use":
            # First, add the assistant's response to messages
            messages.append({"role": "assistant", "content": response.content})

            # Collect all tool results
            tool_results = []

            for block in response.content:
                if isinstance(block, (BetaToolUseBlock, ToolUseBlock)):
                    tool_name = block.name
                    tool_input = block.input
                    tool_use_id = block.id

                    result = tool_functions[tool_name](**tool_input)

                    content = str(result)

                    tool_result = {
                        "type": "tool_result",
                        "tool_use_id": tool_use_id,
                        "content": content,
                    }
                    tool_results.append(tool_result)

            # Append all tool results at once after collecting them
            messages.append({"role": "user", "content": tool_results})

        else:
            print(f"\nUnexpected stop reason: {response.stop_reason}")
            elapsed_time = time.time() - start_time

            final_response = next(
                (
                    block.text
                    for block in response.content
                    if isinstance(block, (BetaTextBlock, TextBlock))
                ),
                f"Stopped with reason: {response.stop_reason}",
            )
            return final_response, messages, total_tokens, elapsed_time, api_counter
```

Our initial query to the model provides some instructions to help guide the model. For brevity, we've asked the model to only call each tool once. For deeper investigations, the model may wish to look into multiple systems or time spans.

```python
query = "Which engineering team members exceeded their Q3 travel budget? Standard quarterly travel budget is $5,000. However, some employees have custom budget limits. For anyone who exceeded the $5,000 standard budget, check if they have a custom budget exception. If they do, use that custom limit instead to determine if they truly exceeded their budget."
```

```python
# Run the agent
result, conversation, total_tokens, elapsed_time, api_count_without_ptc = run_agent_without_ptc(
    query
)

print(f"Result: {result}")
print(f"API calls made: {api_count_without_ptc}")
print(f"Total tokens used: {total_tokens:,}")
print(f"Total time taken: {elapsed_time:.2f}s")
```

Great! We can see that Claude was able to use the available tools successfully to identify which team members exceeded their travel budgets. However, we can also see that we used a lot of tokens to accomplish this task. Claude had to ingest all the expense line items through its context window—potentially 100+ records per employee, each with extensive metadata including receipt URLs, approval chains, merchant information, and more—in order to parse them, sum up the totals by category, and compare against budget limits.

Additionally, the traditional tool calling approach requires multiple sequential round trips: first fetching team members, then expenses for each person, then checking custom budgets for those who exceeded the standard limit. Each round trip adds latency, and all the rich metadata from expense records flows through the model's context.

Let's see if we can use PTC to improve performance by allowing Claude to write code that processes these large datasets in the code execution environment instead.

To enable PTC on tools, we must first add the `allowed_callers` field to any tool that should be callable via code execution.

**Key points to consider**

- Tools without allowed_callers default to model-only invocation
- Tools can be invoked by both the model AND code execution by including multiple callers: `["direct", "code_execution_20250825"]`
- Only opt in tools that are safe for programmatic/repeated execution.

```python
import copy

ptc_tools = copy.deepcopy(tools)
for tool in ptc_tools:
    tool["allowed_callers"] = ["code_execution_20250825"]  # type: ignore


# Add the code execution tool
ptc_tools.append(
    {
        "type": "code_execution_20250825",  # type: ignore
        "name": "code_execution",
    }
)
```

Now that we've updated our tool definitions to allow programmatic tool calling, we can run our agent with PTC. In order to do so, we've had to make a few changes to our function. We must use the `beta` messages API. 

1. We've added `"advanced-tool-use-2025-11-20"` to betas. 
2. We pass in the `container_id` if it is defined with our request. This is only necessary for stateful workflows like ours. In single-turn workflows this is not required.
3. We can check the `caller` field in the `tool_use` block to determine if this tool call is from a direct model invocation or from programmatic invocation. 

Note that in either case, we send our tool results via the Claude API, however only `direct` invocations will be "seen" by the model. `code_execution_20250825` types will only be seen my the code execution container.

```python
messages = []


def run_agent_with_ptc(user_message):
    """Run agent using PTC"""
    messages.append({"role": "user", "content": user_message})
    total_tokens = 0
    start_time = time.time()
    container_id = None
    api_counter = 0

    while True:
        # Build request with PTC beta headers
        request_params = {
            "model": MODEL,
            "max_tokens": 4000,
            "tools": ptc_tools,
            "messages": messages,
        }

        response = client.beta.messages.create(
            **request_params,
            betas=[
                "advanced-tool-use-2025-11-20",
            ],
            extra_body={"container": container_id} if container_id else None,
        )
        viz.capture(response)
        api_counter += 1

        # Track container for stateful execution
        if hasattr(response, "container") and response.container:
            container_id = response.container.id
            print(f"\n[Container] ID: {container_id}")
            if hasattr(response.container, "expires_at"):
                # If the container has expired, we would need to restart our workflow. In our case, it completes before expiration.
                print(f"[Container] Expires at: {response.container.expires_at}")

        # Track token usage
        total_tokens += response.usage.input_tokens + response.usage.output_tokens

        if response.stop_reason == "end_turn":
            # Extract the first text block from the response
            final_response = next(
                (block.text for block in response.content if isinstance(block, BetaTextBlock)),
                None,
            )
            elapsed_time = time.time() - start_time
            return final_response, messages, total_tokens, elapsed_time, api_counter

        # As before, we process tool calls
        if response.stop_reason == "tool_use":
            # First, add the assistant's response to messages
            messages.append({"role": "assistant", "content": response.content})

            # Collect all tool results
            tool_results = []

            for block in response.content:
                if isinstance(block, BetaToolUseBlock):
                    tool_name = block.name
                    tool_input = block.input
                    tool_use_id = block.id

                    # We can use caller type to understand how the tool was invoked
                    caller_type = block.caller["type"]  # type: ignore

                    if caller_type == "code_execution_20250825":
                        print(f"[PTC] Tool called from code execution environment: {tool_name}")

                    elif caller_type == "direct":
                        print(f"[Direct] Tool called by model: {tool_name}")

                    result = tool_functions[tool_name](**tool_input)

                    # Format result as proper content for the API
                    if isinstance(result, list) and result and isinstance(result[0], str):
                        content = "\n".join(result)
                    elif isinstance(result, (dict, list)):
                        content = json.dumps(result)
                    else:
                        content = str(result)

                    tool_results.append(
                        {
                            "type": "tool_result",
                            "tool_use_id": tool_use_id,
                            "content": content,
                        }
                    )

            messages.append({"role": "user", "content": tool_results})

        else:
            print(f"\nUnexpected stop reason: {response.stop_reason}")
            elapsed_time = time.time() - start_time

            final_response = next(
                (block.text for block in response.content if isinstance(block, BetaTextBlock)),
                f"Stopped with reason: {response.stop_reason}",
            )
            return final_response, messages, total_tokens, elapsed_time, api_counter
```

```python
# Run the PTC agent
result_ptc, conversation_ptc, total_tokens_ptc, elapsed_time_ptc, api_count_with_ptc = (
    run_agent_with_ptc(query)
)
```

```python
print(f"\n{'=' * 60}")
print(f"Result: {result_ptc}")
print(f"\n{'=' * 60}")
print("Performance Metrics:")
print(
    f"  Total API calls to Claude: {len([m for m in conversation_ptc if m['role'] == 'assistant'])}"
)
print(f"  Total tokens used: {total_tokens_ptc:,}")
print(f"  Total time taken: {elapsed_time_ptc:.2f}s")
```

## Performance Comparison

Let's compare the performance between traditional tool calling and PTC:

**Note on API Call Count:** You may notice that PTC requires more API calls in this example. This is because PTC writes more structured, sequential code that follows best practices—for instance, separating the expense fetching step from the budget checking step. Traditional tool calling can sometimes batch operations together in a single turn, but at the cost of sending all raw data through the model's context. The token efficiency gains from PTC far outweigh the minimal increase in round trips, especially when working with large, metadata-rich datasets.

```python
import pandas as pd

# Create comparison dataframe
comparison_data = {
    "Metric": [
        "API Calls",
        "Total Tokens",
        "Elapsed Time (s)",
        "Token Reduction",
        "Time Reduction",
    ],
    "Traditional": [
        api_count_without_ptc,
        f"{total_tokens:,}",
        f"{elapsed_time:.2f}",
        "-",
        "-",
    ],
    "PTC": [
        api_count_with_ptc,
        f"{total_tokens_ptc:,}",
        f"{elapsed_time_ptc:.2f}",
        f"{((total_tokens - total_tokens_ptc) / total_tokens * 100):.1f}%",
        f"{((elapsed_time - elapsed_time_ptc) / elapsed_time * 100):.1f}%",
    ],
}

df = pd.DataFrame(comparison_data)
print(df.to_string(index=False))
```

## Key Takeaways

In this example, PTC demonstrated significant performance improvements through three core capabilities:

### 1. Context Preservation Through Large Data Parsing
This was the primary benefit demonstrated in our workflow. Claude wrote code to fetch and process hundreds of expense line items within the code execution environment. By processing this data programmatically, Claude parsed JSON, filtered by status, summed amounts by category, and compared against budget limits—all without sending the raw expense data and metadata through the model's context window. This resulted in a **significant reduction in token usage**.

### 2. Sequential Dependency Optimization  
The API has a sequential dependency: `get_custom_budget(user_id)` which can only be called after analyzing expenses to identify who exceeded the standard $5,000 budget. In traditional tool calling, this requires multiple round trips—fetch team members, fetch expenses for each person, identify those over budget, then check their custom budgets one by one. With PTC, Claude writes code that orchestrates this entire workflow in the code execution environment, making programmatic tool calls in a loop and maintaining state across calls. This transforms what would be many sequential API round trips into fewer calls with smarter orchestration.

### 3. Computational Logic in Code Execution
Rather than requiring the model to mentally track and sum dozens of expenses with complex metadata, Claude delegated the arithmetic and aggregation logic to Python code. This reduced cognitive load on the model, ensured precise calculations, and kept irrelevant metadata (like receipt URLs and merchant locations) out of the model's context entirely.

--- 

## When to Use PTC

PTC is most beneficial when:

- **Working with large, metadata-rich datasets** that need filtering, parsing, or aggregation (like our expense analysis with receipt URLs, approval chains, merchant details, etc.)
- **Sequential dependencies exist** where one tool call depends on the results of previous calls (like checking custom budgets only for employees who exceeded standard limits)
- **Multiple tool calls are needed** in sequence or in loops across similar entities (checking expenses and budgets for each team member)
- **Computational logic** can reduce what needs to flow through the model's context
- **Tools are safe** for programmatic/repeated execution without human oversight

## Conclusion

Our team expense analysis demonstrated PTC's strengths: **dramatically reducing context consumption when working with large, metadata-rich datasets** and **optimizing workflows with sequential dependencies**. By allowing Claude to write code that orchestrates tool calls and processes results programmatically, we achieved substantial token savings while maintaining accuracy and insight quality. 

PTC is particularly valuable for workflows involving bulk data processing with rich metadata, repeated tool invocations with dependencies, or scenarios where raw tool outputs would otherwise pollute the model's context.

## Next Steps

Try adapting this pattern to your own use cases:
- Financial data analysis and reporting with sequential lookups
- Multi-entity health checks that depend on initial scan results  
- Large file processing with metadata (CSV, JSON, XML parsing)
- Database query result aggregation with follow-up queries
- Batch API operations with conditional logic based on initial results
