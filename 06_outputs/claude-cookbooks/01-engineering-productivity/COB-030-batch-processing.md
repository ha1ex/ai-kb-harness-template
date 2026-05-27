---
id: COB-030
tier: A
category: "Engineering productivity"
kind: workflow
title: "Batch Processing with Message Batches API"
subtitle: "Message Batches allow you to process large volumes of Messages requests asynchronously and cost-effectively."
source: https://github.com/anthropics/claude-cookbooks/blob/main/misc/batch_processing.ipynb
upstream_name: "misc/batch_processing.ipynb"
upstream_folder: "misc"
provider: anthropic-cookbooks
license: MIT
license_source: https://github.com/anthropics/claude-cookbooks/blob/main/LICENSE
ingested: 2026-05-27
type: case
version: v0.1
---
# Batch Processing with Message Batches API

> Message Batches allow you to process large volumes of Messages requests asynchronously and cost-effectively.

Message Batches allow you to process large volumes of Messages requests asynchronously and cost-effectively. This cookbook demonstrates how to use the Message Batches API to handle bulk operations while reducing costs by 50%.

In this cookbook, we will demonstrate how to:

1. Create and submit message batches
2. Monitor batch processing status
3. Retrieve and handle batch results
4. Implement best practices for effective batching

## Setup

First, let's set up our environment with the necessary imports:

```python
%pip install anthropic
```

```python
import time

import anthropic

client = anthropic.Anthropic()
MODEL_NAME = "claude-sonnet-4-6"
```

## Example 1: Basic Batch Processing

Let's start with a simple example that demonstrates creating and monitoring a batch of message requests.

```python
# Prepare a list of questions for batch processing
questions = [
    "How do solar panels convert sunlight into electricity?",
    "What's the difference between mutual funds and ETFs?",
    "What is a pick and roll in basketball?",
    "Why do leaves change color in autumn?",
]

# Create batch requests
batch_requests = [
    {
        "custom_id": f"question-{i}",
        "params": {
            "model": MODEL_NAME,
            "max_tokens": 1024,
            "messages": [{"role": "user", "content": question}],
        },
    }
    for i, question in enumerate(questions)
]

# Submit the batch
response = client.beta.messages.batches.create(requests=batch_requests)

print(f"Batch ID: {response.id}")
print(f"Status: {response.processing_status}")
print(f"Created at: {response.created_at}")
```

# Monitoring Batch Progress

Now let's monitor the batch processing status:

```python
def monitor_batch(batch_id, polling_interval=5):
    while True:
        batch_update = client.beta.messages.batches.retrieve(batch_id)
        batch_update_status = batch_update.processing_status
        print(batch_update)
        print(f"Status: {batch_update_status}")
        if batch_update_status == "ended":
            return batch_update

        time.sleep(polling_interval)


# Monitor our batch
batch_result = monitor_batch(response.id)
print("\nBatch processing complete!")
print("\nRequest counts:")
print(f"  Succeeded: {batch_result.request_counts.succeeded}")
print(f"  Errored: {batch_result.request_counts.errored}")
print(f"  Processing: {batch_result.request_counts.processing}")
print(f"  Canceled: {batch_result.request_counts.canceled}")
print(f"  Expired: {batch_result.request_counts.expired}")
```

# Retrieving Results

Once the batch is complete, we can retrieve and process the results:

```python
def process_results(batch_id):
    # First get the batch status
    batch = client.beta.messages.batches.retrieve(batch_id)

    print(f"\nBatch {batch.id} Summary:")
    print(f"Status: {batch.processing_status}")
    print(f"Created: {batch.created_at}")
    print(f"Ended: {batch.ended_at}")
    print(f"Expires: {batch.expires_at}")

    if batch.processing_status == "ended":
        print("\nIndividual Results:")
        for result in client.beta.messages.batches.results(batch_id):
            print(f"\nResult for {result.custom_id}:")
            print(f"Status: {result.result.type}")

            if result.result.type == "succeeded":
                print(f"Content: {result.result.message.content[0].text[:200]}...")
            elif result.result.type == "errored":
                print("Request errored")
            elif result.result.type == "canceled":
                print("Request was canceled")
            elif result.result.type == "expired":
                print("Request expired")


# Example usage:
batch_status = monitor_batch(response.id)
if batch_status.processing_status == "ended":
    process_results(batch_status.id)
```

## Example 2: Advanced Batch Processing for Different Message Types

This example demonstrates more advanced usage, including error handling and processing different types of requests in a single batch including a simple message, a message with a system prompt, a multi-turn message, and a message with an image.

```python
import base64


def create_complex_batch():
    # Get base64 encoded image
    def get_base64_encoded_image(image_path):
        with open(image_path, "rb") as image_file:
            binary_data = image_file.read()
            base_64_encoded_data = base64.b64encode(binary_data)
            base64_string = base_64_encoded_data.decode("utf-8")
            return base64_string

    # Mix of different request types
    batch_requests = [
        {
            "custom_id": "simple-question",
            "params": {
                "model": MODEL_NAME,
                "max_tokens": 1024,
                "messages": [{"role": "user", "content": "What is quantum computing?"}],
            },
        },
        {
            "custom_id": "image-analysis",
            "params": {
                "model": MODEL_NAME,
                "max_tokens": 1024,
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "image",
                                "source": {
                                    "type": "base64",
                                    "media_type": "image/jpeg",
                                    "data": get_base64_encoded_image(
                                        "../images/sunset-dawn-nature-mountain-preview.jpg"
                                    ),
                                },
                            },
                            {
                                "type": "text",
                                "text": "Describe this mountain landscape. What time of day does it appear to be, and what weather conditions do you observe?",
                            },
                        ],
                    }
                ],
            },
        },
        {
            "custom_id": "system-prompt",
            "params": {
                "model": MODEL_NAME,
                "max_tokens": 1024,
                "system": "You are a helpful science teacher.",
                "messages": [{"role": "user", "content": "Explain gravity to a 5-year-old."}],
            },
        },
        {
            "custom_id": "multi-turn",
            "params": {
                "model": MODEL_NAME,
                "max_tokens": 1024,
                "messages": [
                    {"role": "user", "content": "What is DNA?"},
                    {
                        "role": "assistant",
                        "content": "DNA is like a blueprint for living things...",
                    },
                    {"role": "user", "content": "How is DNA copied?"},
                ],
            },
        },
    ]

    try:
        response = client.beta.messages.batches.create(requests=batch_requests)
        return response.id
    except Exception as e:
        print(f"Error creating batch: {e}")
        return None


complex_batch_id = create_complex_batch()
print(f"Complex batch ID: {complex_batch_id}")
```

Great now let's view the results of the batch:

```python
# Example usage:
batch_status = monitor_batch(complex_batch_id)
if batch_status.processing_status == "ended":
    process_results(batch_status.id)
```
