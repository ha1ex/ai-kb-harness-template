---
id: COB-069
tier: A
category: "Engineering productivity"
kind: workflow
title: "Using the Wolfram Alpha LLM API as a Tool with Claude"
subtitle: "In this recipe, we'll show you how to integrate the Wolfram Alpha LLM API as a tool for Claude to use."
source: https://github.com/anthropics/claude-cookbooks/blob/main/third_party/WolframAlpha/using_llm_api.ipynb
upstream_name: "third_party/WolframAlpha/using_llm_api.ipynb"
upstream_folder: "third_party"
provider: anthropic-cookbooks
license: MIT
license_source: https://github.com/anthropics/claude-cookbooks/blob/main/LICENSE
ingested: 2026-05-27
type: case
version: v0.1
---
# Using the Wolfram Alpha LLM API as a Tool with Claude

> In this recipe, we'll show you how to integrate the Wolfram Alpha LLM API as a tool for Claude to use.

In this recipe, we'll show you how to integrate the Wolfram Alpha LLM API as a tool for Claude to use. Claude will be able to send queries to the Wolfram Alpha API and receive computed responses, which it can then use to provide answers to user questions.

## Step 1: Set up the environment
First, let's install the required libraries and set up the Claude API client. We also will need to set our APP ID for using WolframAlpha. You can sign up and create a new App ID for this project for free [here](https://developer.wolframalpha.com/access).

```python
import json
import urllib.parse

import requests
from anthropic import Anthropic

client = Anthropic()

# Replace 'YOUR_APP_ID' with your actual Wolfram Alpha AppID
WOLFRAM_APP_ID = "YOUR_APP_ID"
MODEL_NAME = "claude-haiku-4-5"
```

## Step 2: Define the Wolfram Alpha LLM API tool
We'll define a tool that allows Claude to send queries to the Wolfram Alpha LLM API and receive the computed response.

```python
import urllib.parse

import requests


def wolfram_alpha_query(query):
    # URL-encode the query
    encoded_query = urllib.parse.quote(query)

    # Make a request to the Wolfram Alpha LLM API
    url = (
        f"https://www.wolframalpha.com/api/v1/llm-api?input={encoded_query}&appid={WOLFRAM_APP_ID}"
    )
    response = requests.get(url, timeout=30)

    if response.status_code == 200:
        return response.text
    else:
        return f"Error: {response.status_code}: {response.text}"


tools = [
    {
        "name": "wolfram_alpha",
        "description": "A tool that allows querying the Wolfram Alpha knowledge base. Useful for mathematical calculations, scientific data, and general knowledge questions.",
        "input_schema": {
            "type": "object",
            "properties": {
                "search_query": {
                    "type": "string",
                    "description": "The query to send to the Wolfram Alpha API.",
                }
            },
            "required": ["query"],
        },
    }
]
```

In this code, we define a wolfram_alpha_query function that takes a query as input, URL-encodes it, and sends a request to the Wolfram Alpha LLM API using the provided AppID. The function returns the computed response from the API if the request is successful, or an error message if there's an issue.

We then define the wolfram_alpha tool with an input schema that expects a single query property of type string.

## Step 3: Interact with Claude
Now, let's see how Claude can interact with the Wolfram Alpha tool to answer user questions.

```python
def process_tool_call(tool_name, tool_input):
    if tool_name == "wolfram_alpha":
        return wolfram_alpha_query(tool_input["search_query"])


def chat_with_claude(user_message):
    print(f"\n{'=' * 50}\nUser Message: {user_message}\n{'=' * 50}")
    prompt = f"""Here is a question: {user_message}. Please use the Wolfram Alpha tool to answer it. Do not reflect on the quality of the returned search results in your response."""

    message = client.beta.tools.messages.create(
        model=MODEL_NAME,
        max_tokens=4096,
        tools=tools,
        messages=[{"role": "user", "content": prompt}],
    )

    print("\nInitial Response:")
    print(f"Stop Reason: {message.stop_reason}")
    print(f"Content: {message.content}")

    if message.stop_reason == "tool_use":
        tool_use = next(block for block in message.content if block.type == "tool_use")
        tool_name = tool_use.name
        tool_input = tool_use.input

        print(f"\nTool Used: {tool_name}")
        print("Tool Input:")
        print(json.dumps(tool_input, indent=2))

        tool_result = process_tool_call(tool_name, tool_input)

        print("\nTool Result:")
        print(str(json.dumps(tool_result, indent=2)))

        response = client.beta.tools.messages.create(
            model=MODEL_NAME,
            max_tokens=2000,
            tools=tools,
            messages=[
                {"role": "user", "content": prompt},
                {"role": "assistant", "content": message.content},
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "tool_result",
                            "tool_use_id": tool_use.id,
                            "content": str(tool_result),
                        }
                    ],
                },
            ],
        )

        print("\nResponse:")
        print(f"Stop Reason: {response.stop_reason}")
        print(f"Content: {response.content}")
    else:
        response = message

    final_response = None
    for block in response.content:
        if hasattr(block, "text"):
            final_response = block.text
            break

    print(f"\nFinal Response: {final_response}")

    return final_response
```

## Step 4: Try it out!
Let's try giving Claude a few example questions now that it has access to Wolfram Alpha.

```python
# Example usage
print(chat_with_claude("What are the 5 largest countries in the world by population?"))
print(chat_with_claude("Calculate the square root of 1764."))
print(chat_with_claude("What is the distance between Earth and Mars?"))
```
