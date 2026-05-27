---
id: COB-039
tier: A
category: "Engineering productivity"
kind: workflow
title: "Summarizing Web Page Content with Claude 3 Haiku"
subtitle: "In this recipe, we'll learn how to fetch the content of a web page given its URL and then use Anthropic's Claude API to generate a summary of the page's content."
source: https://github.com/anthropics/claude-cookbooks/blob/main/misc/read_web_pages_with_haiku.ipynb
upstream_name: "misc/read_web_pages_with_haiku.ipynb"
upstream_folder: "misc"
provider: anthropic-cookbooks
license: MIT
license_source: https://github.com/anthropics/claude-cookbooks/blob/main/LICENSE
ingested: 2026-05-27
type: case
version: v0.1
---
# Summarizing Web Page Content with Claude 3 Haiku

> In this recipe, we'll learn how to fetch the content of a web page given its URL and then use Anthropic's Claude API to generate a summary of the page's content.

In this recipe, we'll learn how to fetch the content of a web page given its URL and then use Anthropic's Claude API to generate a summary of the page's content.

Let's start by installing the Anthropic library.

## Setup
First, let's install the necessary libraries and setup our Anthropic client with our API key.

```python
# Install the necessary libraries
%pip install anthropic
```

```python
# Import the required libraries
from anthropic import Anthropic

# Set up the Claude API client
client = Anthropic()
MODEL_NAME = "claude-haiku-4-5"
```

## Step 1: Fetching the Web Page Content
First, we need to fetch the content of the web page using the provided URL. We'll use the requests library for this purpose.

```python
import requests

url = "https://en.wikipedia.org/wiki/96th_Academy_Awards"
response = requests.get(url, timeout=30)

if response.status_code == 200:
    page_content = response.text
else:
    print(f"Failed to fetch the web page. Status code: {response.status_code}")
    exit(1)
```

## Step 2: Preparing the Input for Claude
Next, we'll prepare the input for the Claude API. We'll create a message that includes the page content and a prompt asking Claude to summarize it.

```python
prompt = (
    f"<content>{page_content}</content>Please produce a concise summary of the web page content."
)

messages = [{"role": "user", "content": prompt}]
```

## Step 3: Generating the Summary
Now, we'll call the Haiku to generate a summary of the web page content.

```python
response = client.messages.create(model="claude-haiku-4-5", max_tokens=1024, messages=messages)

summary = response.content[0].text
print(summary)
```
