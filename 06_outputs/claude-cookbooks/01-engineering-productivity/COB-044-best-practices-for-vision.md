---
id: COB-044
tier: A
category: "Engineering productivity"
kind: workflow
title: "Best practices for using vision with Claude"
subtitle: "Vision allows for a new mode of interaction with Claude."
source: https://github.com/anthropics/claude-cookbooks/blob/main/multimodal/best_practices_for_vision.ipynb
upstream_name: "multimodal/best_practices_for_vision.ipynb"
upstream_folder: "multimodal"
provider: anthropic-cookbooks
license: MIT
license_source: https://github.com/anthropics/claude-cookbooks/blob/main/LICENSE
ingested: 2026-05-27
type: case
version: v0.1
---
# Best practices for using vision with Claude

> Vision allows for a new mode of interaction with Claude.

Vision allows for a new mode of interaction with Claude. We’ve compiled a few tips for getting the best performance on your images. Before we get to that, let's first setup the code we need to run the notebook.

```python
%pip install anthropic IPython
```

```python
import base64

from anthropic import Anthropic
from IPython.display import Image

client = Anthropic()
MODEL_NAME = "claude-opus-4-1"


def get_base64_encoded_image(image_path):
    with open(image_path, "rb") as image_file:
        binary_data = image_file.read()
        base_64_encoded_data = base64.b64encode(binary_data)
        base64_string = base_64_encoded_data.decode("utf-8")
        return base64_string
```

## Applying traditional techniques to multimodal

You can fix hallucination issues with traditional prompt engineering techniques like role assignment. Let’s see an example of this:

Suppose I want Claude to count the number of dogs in this image:

```python
Image(filename="../images/best_practices/nine_dogs.jpg")
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
                    "data": get_base64_encoded_image("../images/best_practices/nine_dogs.jpg"),
                },
            },
            {"type": "text", "text": "How many dogs are in this picture?"},
        ],
    }
]

response = client.messages.create(model=MODEL_NAME, max_tokens=2048, messages=message_list)
print(response.content[0].text)
```

There's only 9 dogs but Claude thinks there is 10! Let’s apply a little prompt engineering and and try again.

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
                    "data": get_base64_encoded_image("../images/best_practices/nine_dogs.jpg"),
                },
            },
            {
                "type": "text",
                "text": "You have perfect vision and pay great attention to detail which makes you an expert at counting objects in images. How many dogs are in this picture? Before providing the answer in <answer> tags, think step by step in <thinking> tags and analyze every part of the image.",
            },
        ],
    }
]

response = client.messages.create(model=MODEL_NAME, max_tokens=2048, messages=message_list)
print(response.content[0].text)
```

Great! After applying some prompt engineering to the prompt, we see that Claude now counts correctly that there is 9 dogs.

## Visual prompting 

Images as input allows for prompts to now be given within the image itself. Let’s take a look at some examples.

In this image, we write some text and draw an arrow on it. Let’s just pass this in to Claude with no accompanying text prompt.

```python
Image(filename="../images/best_practices/circle.png")
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
                    "data": get_base64_encoded_image("../images/best_practices/circle.png"),
                },
            },
        ],
    }
]

response = client.messages.create(model=MODEL_NAME, max_tokens=2048, messages=message_list)
print(response.content[0].text)
```

As you can see, Claude tried to describe the image as we didn’t give it a question. Let’s add a question to the image and pass it in again.

```python
Image(filename="../images/best_practices/labeled_circle.png")
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
                    "data": get_base64_encoded_image("../images/best_practices/labeled_circle.png"),
                },
            },
        ],
    }
]

response = client.messages.create(model=MODEL_NAME, max_tokens=2048, messages=message_list)
print(response.content[0].text)
```

We can also highlight specific parts of the image and ask questions about it.

What’s the difference between these two numbers?

```python
Image(filename="../images/best_practices/table.png")
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
                    "data": get_base64_encoded_image("../images/best_practices/table.png"),
                },
            },
            {"type": "text", "text": "What’s the difference between these two numbers?"},
        ],
    }
]

response = client.messages.create(model=MODEL_NAME, max_tokens=2048, messages=message_list)
print(response.content[0].text)
```

## Few-shot examples

Adding examples to prompts still improves accuracy with visual tasks as well. Let’s ask Claude to read a picture of a speedometer.

```python
Image(filename="../images/best_practices/140.png")
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
                    "data": get_base64_encoded_image("../images/best_practices/140.png"),
                },
            },
            {"type": "text", "text": "What speed am I going?"},
        ],
    }
]

response = client.messages.create(model=MODEL_NAME, max_tokens=2048, messages=message_list)
print(response.content[0].text)
```

Claude’s answer doesn’t look quite right here, it thinks we are going 140km/hour and not 140 miles/hour! Let’s try again but this time let’s add some examples to the prompt.

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
                    "data": get_base64_encoded_image("../images/best_practices/70.png"),
                },
            },
            {"type": "text", "text": "What speed am I going?"},
        ],
    },
    {
        "role": "assistant",
        "content": [{"type": "text", "text": "You are going 70 miles per hour."}],
    },
    {
        "role": "user",
        "content": [
            {
                "type": "image",
                "source": {
                    "type": "base64",
                    "media_type": "image/png",
                    "data": get_base64_encoded_image("../images/best_practices/100.png"),
                },
            },
            {"type": "text", "text": "What speed am I going?"},
        ],
    },
    {
        "role": "assistant",
        "content": [{"type": "text", "text": "You are going 100 miles per hour."}],
    },
    {
        "role": "user",
        "content": [
            {
                "type": "image",
                "source": {
                    "type": "base64",
                    "media_type": "image/png",
                    "data": get_base64_encoded_image("../images/best_practices/140.png"),
                },
            },
            {"type": "text", "text": "What speed am I going?"},
        ],
    },
]

response = client.messages.create(
    model=MODEL_NAME, max_tokens=2048, messages=message_list, temperature=0
)
print(response.content[0].text)
```

Perfect! With those examples, Claude learned how to read the speed on the speedometer. Note though that few-shot prompting with images doesn't always work but it is worth trying on your use case.

## Multiple images as input
Claude can also accept and reason over multiple images at once within the prompt as well! For example, let’s say you had a really large image - like an image of a long receipt! We can split that image up into chunks and feed each one of those chunks into Claude.

```python
Image(filename="../images/best_practices/receipt1.png")
```

```python
Image(filename="../images/best_practices/receipt2.png")
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
                    "data": get_base64_encoded_image("../images/best_practices/receipt1.png"),
                },
            },
            {
                "type": "image",
                "source": {
                    "type": "base64",
                    "media_type": "image/png",
                    "data": get_base64_encoded_image("../images/best_practices/receipt2.png"),
                },
            },
            {"type": "text", "text": "Output the name of the restaurant and the total."},
        ],
    }
]

response = client.messages.create(model=MODEL_NAME, max_tokens=2048, messages=message_list)
print(response.content[0].text)
```

## Object identification from examples

With image input, you can pass in other images to the prompt and Claude will use that information to answer questions. Let’s see an example of this. 

Suppose we were trying to identify the type of pant in an image. We can provide Claude some examples of different types of pants in the prompt.

```python
Image(filename="../images/best_practices/officer_example.png")
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
                    "data": get_base64_encoded_image("../images/best_practices/wrinkle.png"),
                },
            },
            {
                "type": "image",
                "source": {
                    "type": "base64",
                    "media_type": "image/png",
                    "data": get_base64_encoded_image("../images/best_practices/officer.png"),
                },
            },
            {
                "type": "image",
                "source": {
                    "type": "base64",
                    "media_type": "image/png",
                    "data": get_base64_encoded_image("../images/best_practices/chinos.png"),
                },
            },
            {
                "type": "image",
                "source": {
                    "type": "base64",
                    "media_type": "image/png",
                    "data": get_base64_encoded_image(
                        "../images/best_practices/officer_example.png"
                    ),
                },
            },
            {
                "type": "text",
                "text": "These pants are (in order) WRINKLE-RESISTANT DRESS PANT, ITALIAN MELTON OFFICER PANT, SLIM RAPID MOVEMENT CHINO. What pant is shown in the last image?",
            },
        ],
    }
]

response = client.messages.create(model=MODEL_NAME, max_tokens=2048, messages=message_list)
print(response.content[0].text)
```
