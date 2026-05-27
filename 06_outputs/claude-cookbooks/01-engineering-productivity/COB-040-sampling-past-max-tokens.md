---
id: COB-040
tier: A
category: "Engineering productivity"
kind: workflow
title: "Sampling Responses from Claude Beyond the Max Tokens Limit"
subtitle: "This notebook illustrates how to get Claude to give responses longer than the maximum value of the max_tokens parameter by using a prefill with the content of the previous message."
source: https://github.com/anthropics/claude-cookbooks/blob/main/misc/sampling_past_max_tokens.ipynb
upstream_name: "misc/sampling_past_max_tokens.ipynb"
upstream_folder: "misc"
provider: anthropic-cookbooks
license: MIT
license_source: https://github.com/anthropics/claude-cookbooks/blob/main/LICENSE
ingested: 2026-05-27
type: case
version: v0.1
---
# Sampling Responses from Claude Beyond the Max Tokens Limit

> This notebook illustrates how to get Claude to give responses longer than the maximum value of the max_tokens parameter by using a prefill with the content of the previous message.

# Sampling Responses from Claude Beyond the Max Tokens Limit

This notebook illustrates how to get Claude to give responses longer than the maximum value of the max_tokens parameter by using a prefill with the content of the previous message.

```python
%%capture
!pip install anthropic
```

First, we'll prompt Claude by asking it to write something longer than 4096 tokens.

```python
import anthropic

client = anthropic.Anthropic(
    api_key="YOUR API KEY HERE",
)
message = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=4096,
    messages=[
        {
            "role": "user",
            "content": """
Please write five stories. Each should be at least 1000 words. Number the words to make sure you don't lose track. Make each story about a different animal.
Put them in <story_1>, <story_2>, ... tags
""",
        },
    ],
)
```

```python
print(message.stop_reason)
```

You can see above that Claude stopped sampling because of max_tokens. And you can see below that Claude's message cuts out in the middle of the fifth story.

```python
print(message.content[0].text)
```

Solution? We put the partially completed response, which was cut off in its prime, in an Assistant message to Claude, who then continues sampling and completes the story. You can see that Claude seamlessly picks up in mid-sentence.

```python
message2 = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=4096,
    messages=[
        {
            "role": "user",
            "content": """
Please write five stories. Each should be at least 1000 words. Number the words to make sure you don't lose track. Make each story about a different animal.
Put them in <story_1>, <story_2>, ... tags
""",
        },
        {
            "role": "assistant",
            "content": message.content[0].text,  # The text of Claude's partially completed message.
        },
    ],
)
print(message2.content[0].text)
```

Please be advised that this approach unfortunately entails being "double-charged" for reading the input tokens in your prompt and single-charged for reading the output tokens of Claude's 4096-token response as input tokens. However, they will not be double-charged as output tokens.
