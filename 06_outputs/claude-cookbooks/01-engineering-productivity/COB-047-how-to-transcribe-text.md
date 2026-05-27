---
id: COB-047
tier: A
category: "Engineering productivity"
kind: workflow
title: "How to transcribe documents with Claude"
subtitle: "Claude 3 is great at reading unstructured text and information within images and PDFs and turning it into structured text."
source: https://github.com/anthropics/claude-cookbooks/blob/main/multimodal/how_to_transcribe_text.ipynb
upstream_name: "multimodal/how_to_transcribe_text.ipynb"
upstream_folder: "multimodal"
provider: anthropic-cookbooks
license: MIT
license_source: https://github.com/anthropics/claude-cookbooks/blob/main/LICENSE
ingested: 2026-05-27
type: case
version: v0.1
---
# How to transcribe documents with Claude

> Claude 3 is great at reading unstructured text and information within images and PDFs and turning it into structured text.

Claude 3 is great at reading unstructured text and information within images and PDFs and turning it into structured text. We'll take a look at a few examples but first let's setup the code we need to run the notebook.

```python
%pip install anthropic IPython
```

```python
import base64

from anthropic import Anthropic

client = Anthropic()
MODEL_NAME = "claude-opus-4-1"


def get_base64_encoded_image(image_path):
    with open(image_path, "rb") as image_file:
        binary_data = image_file.read()
        base_64_encoded_data = base64.b64encode(binary_data)
        base64_string = base_64_encoded_data.decode("utf-8")
        return base64_string
```

## Transcribing typed text

The advantage of using Claude 3 over traditional OCR systems is that you can specify exactly what you want to transcribe due to Claude 3's advanced reasoning capabilities. For this image, let’s transcribe just the code in the answer.

```python
from IPython.display import Image

Image(filename="../images/transcribe/stack_overflow.png")
```

```python
message_list = [
    {
        "role": "user",
        "content": [
            {
                "type": "image",
                "source": {
                    "type": "base64",
                    "media_type": "image/png",
                    "data": get_base64_encoded_image("../images/transcribe/stack_overflow.png"),
                },
            },
            {"type": "text", "text": "Transcribe the code in the answer. Only output the code."},
        ],
    }
]

response = client.messages.create(model=MODEL_NAME, max_tokens=2048, messages=message_list)
print(response.content[0].text)
```

## Transcribing handwritten text

That's good but let's try something a little harder. Claude 3 excels at transcribing handwritten text as well. Let's ask Claude 3 to transcribe this handwritten prescription note.

```python
Image(filename="../images/transcribe/school_notes.png")
```

```python
message_list = [
    {
        "role": "user",
        "content": [
            {
                "type": "image",
                "source": {
                    "type": "base64",
                    "media_type": "image/png",
                    "data": get_base64_encoded_image("../images/transcribe/school_notes.png"),
                },
            },
            {
                "type": "text",
                "text": "Transcribe this text. Only output the text and nothing else.",
            },
        ],
    }
]

response = client.messages.create(model=MODEL_NAME, max_tokens=2048, messages=message_list)
print(response.content[0].text)
```

## Transcribing forms
How about we try a combination of typed and handwritten text? This is common across a variety of documents like insurance and report forms.

```python
Image(filename="../images/transcribe/vehicle_form.jpg")
```

```python
message_list = [
    {
        "role": "user",
        "content": [
            {
                "type": "image",
                "source": {
                    "type": "base64",
                    "media_type": "image/jpeg",
                    "data": get_base64_encoded_image("../images/transcribe/vehicle_form.jpg"),
                },
            },
            {"type": "text", "text": "Transcribe this form exactly."},
        ],
    }
]

response = client.messages.create(model=MODEL_NAME, max_tokens=2048, messages=message_list)
print(response.content[0].text)
```

## Complicated document QA
With Claude 3 we can go beyond just transcription and ask specific questions about our information in our unstructured documents.

```python
Image(filename="../images/transcribe/page.jpeg")
```

```python
message_list = [
    {
        "role": "user",
        "content": [
            {
                "type": "image",
                "source": {
                    "type": "base64",
                    "media_type": "image/jpeg",
                    "data": get_base64_encoded_image("../images/transcribe/page.jpeg"),
                },
            },
            {"type": "text", "text": "Which is the most critical issue for live rep support?"},
        ],
    }
]

response = client.messages.create(model=MODEL_NAME, max_tokens=2048, messages=message_list)
print(response.content[0].text)
```

## Unstructured information -> JSON

Let's take a look at how you can use Claude to turn unstructured information in an image into a structured JSON output.

```python
Image(filename="../images/transcribe/org_chart.jpeg")
```

```python
message_list = [
    {
        "role": "user",
        "content": [
            {
                "type": "image",
                "source": {
                    "type": "base64",
                    "media_type": "image/jpeg",
                    "data": get_base64_encoded_image("../images/transcribe/org_chart.jpeg"),
                },
            },
            {
                "type": "text",
                "text": "Turn this org chart into JSON indicating who reports to who. Only output the JSON and nothing else.",
            },
        ],
    }
]

response = client.messages.create(model=MODEL_NAME, max_tokens=2048, messages=message_list)
print(response.content[0].text)
```
