---
id: COB-046
tier: A
category: "Engineering productivity"
kind: workflow
title: "Getting started - how to pass images into Claude"
subtitle: "The Claude 3 model family supports image inputs in the API."
source: https://github.com/anthropics/claude-cookbooks/blob/main/multimodal/getting_started_with_vision.ipynb
upstream_name: "multimodal/getting_started_with_vision.ipynb"
upstream_folder: "multimodal"
provider: anthropic-cookbooks
license: MIT
license_source: https://github.com/anthropics/claude-cookbooks/blob/main/LICENSE
ingested: 2026-05-27
type: case
version: v0.1
---
# Getting started - how to pass images into Claude

> The Claude 3 model family supports image inputs in the API.

The Claude 3 model family supports image inputs in the API. Here’s how you can pass images to Claude:

```python
%pip install anthropic IPython
```

```python
from IPython.display import Image

Image(filename="../images/sunset.jpeg")
```

```python
import base64

from anthropic import Anthropic

client = Anthropic()
MODEL_NAME = "claude-opus-4-1"

with open("../images/sunset.jpeg", "rb") as image_file:
    binary_data = image_file.read()
    base_64_encoded_data = base64.b64encode(binary_data)
    base64_string = base_64_encoded_data.decode("utf-8")


message_list = [
    {
        "role": "user",
        "content": [
            {
                "type": "image",
                "source": {"type": "base64", "media_type": "image/jpeg", "data": base64_string},
            },
            {"type": "text", "text": "Write a sonnet based on this image."},
        ],
    }
]

response = client.messages.create(model=MODEL_NAME, max_tokens=2048, messages=message_list)
print(response.content[0].text)
```

## Passing an image through a url

If you only have a URL of the image you can still pass it to Claude with just a few short lines of code.

```python
IMAGE_URL = "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Machu_Picchu%2C_Peru_%282018%29.jpg/2560px-Machu_Picchu%2C_Peru_%282018%29.jpg"
Image(url=IMAGE_URL)
```

```python
import httpx

IMAGE_DATA = base64.b64encode(httpx.get(IMAGE_URL).content).decode("utf-8")

message_list = [
    {
        "role": "user",
        "content": [
            {
                "type": "image",
                "source": {"type": "base64", "media_type": "image/jpeg", "data": IMAGE_DATA},
            },
            {"type": "text", "text": "Describe this image in two sentences."},
        ],
    }
]

response = client.messages.create(model=MODEL_NAME, max_tokens=2048, messages=message_list)
print(response.content[0].text)
```
