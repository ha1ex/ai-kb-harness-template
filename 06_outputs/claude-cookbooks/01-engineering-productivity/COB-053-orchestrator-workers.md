---
id: COB-053
tier: A
category: "Engineering productivity"
kind: workflow
title: "Orchestrator-Workers Workflow"
subtitle: "## Introduction Have you ever needed multiple perspectives on the same task, but couldn't predict in advance which perspectives would be most valuable?"
source: https://github.com/anthropics/claude-cookbooks/blob/main/patterns/agents/orchestrator_workers.ipynb
upstream_name: "patterns/agents/orchestrator_workers.ipynb"
upstream_folder: "patterns"
provider: anthropic-cookbooks
license: MIT
license_source: https://github.com/anthropics/claude-cookbooks/blob/main/LICENSE
ingested: 2026-05-27
type: case
version: v0.1
---
# Orchestrator-Workers Workflow

> ## Introduction Have you ever needed multiple perspectives on the same task, but couldn't predict in advance which perspectives would be most valuable?

## Introduction

Have you ever needed multiple perspectives on the same task, but couldn't predict in advance which perspectives would be most valuable? The orchestrator-workers pattern solves this by having a central LLM analyze each unique task and dynamically determine the best subtasks to delegate to specialized worker LLMs.

Traditional approaches either require manual prompting multiple times or use hardcoded parallelization that generates the same variations regardless of context.

With this approach, an orchestrator LLM analyzes the task, determines which variations would be most valuable for this specific case, then delegates to worker LLMs that generate each variation.

### What You'll Build

A system that takes a product description request and:

1. Analyzes what types of marketing copy would be valuable
2. Dynamically generates specialized task descriptions for workers
3. Produces multiple content variations optimized for different audiences
4. Returns coordinated results from all workers

### Prerequisites

- Python 3.9 or higher
- Anthropic API key set as environment variable: `export ANTHROPIC_API_KEY='your-key'`
- Basic understanding of prompt engineering
- Familiarity with Python classes and type hints


### When to use this workflow

This workflow is well-suited for complex tasks where you can't predict the subtasks needed in advance. The key difference from simple parallelization is its flexibility—subtasks aren't pre-defined, but determined by the orchestrator based on the specific input.

**Use this pattern when:**

- Tasks require multiple distinct approaches or perspectives
- The optimal subtasks depend on the specific input
- You need to compare different strategies or styles

**Don't use this pattern when:**

- You have simple, single-output tasks (unnecessary complexity)
- Latency is critical (multiple LLM calls add overhead)
- Subtasks are predictable and can be pre-defined (use simpler parallelization)

## How It Works

The orchestrator-workers pattern operates in two phases:

1. **Analysis & Planning Phase**: The orchestrator LLM receives the task and context, analyzes what approaches would be valuable, and generates structured subtask descriptions in XML format.

2. **Execution Phase**: Each worker LLM receives:
   - The original task for context
   - Its specific subtask type and description
   - Any additional context provided

The orchestrator decides *at runtime* what subtasks to create, making this more adaptive than pre-defined parallel workflows.

## Setup

### Installation
```bash
pip install anthropic
```

### Helper Functions
This example uses helper functions from `util.py` for making LLM calls and parsing XML responses:

- `llm_call(prompt, system_prompt="", model="claude-sonnet-4-6")`: Sends a prompt to Claude and returns the text response
- `extract_xml(text, tag)`: Extracts content from XML tags using regex

These utilities handle API authentication (reading `ANTHROPIC_API_KEY` from environment) and provide a simple interface for the orchestrator-workers pattern. You can view the complete implementation in [util.py](util.py).

## Implementation

The `FlexibleOrchestrator` class coordinates the two-phase workflow:

**Key design decisions:**
- Prompts are templates that accept runtime variables (`task`, `context`) for flexibility
- XML is used for structured output parsing (reliable and language-model-friendly format)
- Workers receive both the original task AND their specific instructions for better context
- Error handling validates that workers return non-empty responses

The implementation includes:
- `parse_tasks()`: Parses the orchestrator's XML output into structured task dictionaries
- `FlexibleOrchestrator.process()`: Main coordination logic that calls orchestrator, then workers
- Response validation to catch and handle empty worker outputs

```python
from util import extract_xml, llm_call

# Model configuration
MODEL = "claude-sonnet-4-6"  # Fast, capable model for both orchestrator and workers


def parse_tasks(tasks_xml: str) -> list[dict]:
    """Parse XML tasks into a list of task dictionaries."""
    tasks = []
    current_task = {}

    for line in tasks_xml.split("\n"):
        line = line.strip()
        if not line:
            continue

        if line.startswith("<task>"):
            current_task = {}
        elif line.startswith("<type>"):
            current_task["type"] = line[6:-7].strip()
        elif line.startswith("<description>"):
            current_task["description"] = line[12:-13].strip()
        elif line.startswith("</task>"):
            if "description" in current_task:
                if "type" not in current_task:
                    current_task["type"] = "default"
                tasks.append(current_task)

    return tasks


class FlexibleOrchestrator:
    """Break down tasks and run them in parallel using worker LLMs."""

    def __init__(
        self,
        orchestrator_prompt: str,
        worker_prompt: str,
        model: str = MODEL,
    ):
        """Initialize with prompt templates and model selection."""
        self.orchestrator_prompt = orchestrator_prompt
        self.worker_prompt = worker_prompt
        self.model = model

    def _format_prompt(self, template: str, **kwargs) -> str:
        """Format a prompt template with variables."""
        try:
            return template.format(**kwargs)
        except KeyError as e:
            raise ValueError(f"Missing required prompt variable: {e}") from e

    def process(self, task: str, context: dict | None = None) -> dict:
        """Process task by breaking it down and running subtasks in parallel."""
        context = context or {}

        # Step 1: Get orchestrator response
        orchestrator_input = self._format_prompt(self.orchestrator_prompt, task=task, **context)
        orchestrator_response = llm_call(orchestrator_input, model=self.model)

        # Parse orchestrator response
        analysis = extract_xml(orchestrator_response, "analysis")
        tasks_xml = extract_xml(orchestrator_response, "tasks")
        tasks = parse_tasks(tasks_xml)

        print("\n" + "=" * 80)
        print("ORCHESTRATOR ANALYSIS")
        print("=" * 80)
        print(f"\n{analysis}\n")

        print("\n" + "=" * 80)
        print(f"IDENTIFIED {len(tasks)} APPROACHES")
        print("=" * 80)
        for i, task_info in enumerate(tasks, 1):
            print(f"\n{i}. {task_info['type'].upper()}")
            print(f"   {task_info['description']}")

        print("\n" + "=" * 80)
        print("GENERATING CONTENT")
        print("=" * 80 + "\n")

        # Step 2: Process each task
        worker_results = []
        for i, task_info in enumerate(tasks, 1):
            print(f"[{i}/{len(tasks)}] Processing: {task_info['type']}...")

            worker_input = self._format_prompt(
                self.worker_prompt,
                original_task=task,
                task_type=task_info["type"],
                task_description=task_info["description"],
                **context,
            )

            worker_response = llm_call(worker_input, model=self.model)
            worker_content = extract_xml(worker_response, "response")

            # Validate worker response - handle empty outputs
            if not worker_content or not worker_content.strip():
                print(f"⚠️  Warning: Worker '{task_info['type']}' returned no content")
                worker_content = f"[Error: Worker '{task_info['type']}' failed to generate content]"

            worker_results.append(
                {
                    "type": task_info["type"],
                    "description": task_info["description"],
                    "result": worker_content,
                }
            )

        # Display results
        print("\n" + "=" * 80)
        print("RESULTS")
        print("=" * 80)
        for i, result in enumerate(worker_results, 1):
            print(f"\n{'-' * 80}")
            print(f"Approach {i}: {result['type'].upper()}")
            print(f"{'-' * 80}")
            print(f"\n{result['result']}\n")

        return {
            "analysis": analysis,
            "worker_results": worker_results,
        }
```

## Example Use Case: Marketing Variation Generation

Now let's see the orchestrator-workers pattern in action with a practical example: generating multiple styles of marketing copy for a product.

**Why this example demonstrates the pattern well:**
- Different products benefit from different marketing angles
- The "best" variations depend on the specific product features and target audience
- The orchestrator can adapt its strategy based on the input rather than using a fixed template

**Prompt design notes:**
- The orchestrator prompt asks for 2-3 approaches and provides XML structure guidance
- The worker prompt gives workers full context (original task, their style, and guidelines)
- Both prompts use clear XML formatting to ensure reliable parsing

```python
ORCHESTRATOR_PROMPT = """
Analyze this task and break it down into 2-3 distinct approaches:

Task: {task}

Return your response in this format:

<analysis>
Explain your understanding of the task and which variations would be valuable.
Focus on how each approach serves different aspects of the task.
</analysis>

<tasks>
    <task>
    <type>formal</type>
    <description>Write a precise, technical version that emphasizes specifications</description>
    </task>
    <task>
    <type>conversational</type>
    <description>Write an engaging, friendly version that connects with readers</description>
    </task>
</tasks>
"""

WORKER_PROMPT = """
Generate content based on:
Task: {original_task}
Style: {task_type}
Guidelines: {task_description}

Return your response in this format:

<response>
Your content here, maintaining the specified style and fully addressing requirements.
</response>
"""


orchestrator = FlexibleOrchestrator(
    orchestrator_prompt=ORCHESTRATOR_PROMPT,
    worker_prompt=WORKER_PROMPT,
)

results = orchestrator.process(
    task="Write a product description for a new eco-friendly water bottle",
    context={
        "target_audience": "environmentally conscious millennials",
        "key_features": ["plastic-free", "insulated", "lifetime warranty"],
    },
)
```

## Summary

You've now implemented an orchestrator-workers pattern that dynamically adapts its task breakdown based on the specific input. This pattern generated multiple marketing copy variations—each tailored to different audiences and contexts—without requiring you to pre-define what those variations should be.

### Key Takeaways

**Pattern benefits:**
- **Adaptability**: The orchestrator determines the best approach for each unique input
- **Flexibility**: Easy to apply to different domains by changing the prompts
- **Structured coordination**: XML-based communication ensures reliable parsing
- **Error resilience**: Validation catches and handles worker failures

**When this pattern excels:**
- Content generation requiring multiple perspectives (marketing, documentation, creative writing)
- Analysis tasks benefiting from different analytical lenses
- Problem-solving where the decomposition strategy depends on the problem

### Limitations & Considerations

**Cost & Latency:**
- Requires N+1 LLM calls (1 orchestrator + N workers)
- Sequential processing in this implementation (workers run one at a time)
- For better performance, consider parallelizing worker calls with `asyncio` or thread pools

**When NOT to use this pattern:**
- Simple tasks with single, clear outputs (the added complexity isn't justified)
- Latency-critical applications (multiple API calls add overhead)
- Tasks where subtasks are always the same (use pre-defined parallelization instead)

**Failure modes to consider:**
- Orchestrator might not break down tasks optimally (prompt engineering is critical)
- Workers may return empty or malformed responses (we handle this with validation)
- XML parsing can fail if models don't follow format exactly (consider using JSON as an alternative)

### Next Steps

**Enhance this implementation:**
1. Add parallel worker execution using `asyncio` for better performance
2. Implement retry logic for failed workers
3. Add a synthesis phase where an LLM combines worker outputs
4. Experiment with different orchestrator strategies (e.g., asking for more/fewer subtasks)

**Adapt to your use case:**
- Modify the orchestrator prompt to guide task decomposition for your domain
- Adjust worker prompts to provide domain-specific instructions
- Add context parameters relevant to your application
- Consider using Claude Opus for the orchestrator and Claude Haiku for workers to optimize cost vs. quality
