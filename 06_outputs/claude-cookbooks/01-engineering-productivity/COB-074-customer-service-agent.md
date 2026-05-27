---
id: COB-074
tier: A
category: "Engineering productivity"
kind: workflow
title: "Creating a Customer Service Agent with Client-Side Tools"
subtitle: "In this recipe, we'll demonstrate how to create a customer service chatbot using Claude 3 plus client-side tools."
source: https://github.com/anthropics/claude-cookbooks/blob/main/tool_use/customer_service_agent.ipynb
upstream_name: "tool_use/customer_service_agent.ipynb"
upstream_folder: "tool_use"
provider: anthropic-cookbooks
license: MIT
license_source: https://github.com/anthropics/claude-cookbooks/blob/main/LICENSE
ingested: 2026-05-27
type: case
version: v0.1
---
# Creating a Customer Service Agent with Client-Side Tools

> In this recipe, we'll demonstrate how to create a customer service chatbot using Claude 3 plus client-side tools.

In this recipe, we'll demonstrate how to create a customer service chatbot using Claude 3 plus client-side tools. The chatbot will be able to look up customer information, retrieve order details, and cancel orders on behalf of the customer. We'll define the necessary tools and simulate synthetic responses to showcase the chatbot's capabilities.

## Step 1: Set up the environment

First, let's install the required libraries and set up the Claude API client.

```python
%pip install anthropic
```

```python
import anthropic

client = anthropic.Client()
MODEL_NAME = "claude-opus-4-1"
```

## Step 2: Define the client-side tools

Next, we'll define the client-side tools that our chatbot will use to assist customers. We'll create three tools: get_customer_info, get_order_details, and cancel_order.

```python
tools = [
    {
        "name": "get_customer_info",
        "description": "Retrieves customer information based on their customer ID. Returns the customer's name, email, and phone number.",
        "input_schema": {
            "type": "object",
            "properties": {
                "customer_id": {
                    "type": "string",
                    "description": "The unique identifier for the customer.",
                }
            },
            "required": ["customer_id"],
        },
    },
    {
        "name": "get_order_details",
        "description": "Retrieves the details of a specific order based on the order ID. Returns the order ID, product name, quantity, price, and order status.",
        "input_schema": {
            "type": "object",
            "properties": {
                "order_id": {
                    "type": "string",
                    "description": "The unique identifier for the order.",
                }
            },
            "required": ["order_id"],
        },
    },
    {
        "name": "cancel_order",
        "description": "Cancels an order based on the provided order ID. Returns a confirmation message if the cancellation is successful.",
        "input_schema": {
            "type": "object",
            "properties": {
                "order_id": {
                    "type": "string",
                    "description": "The unique identifier for the order to be cancelled.",
                }
            },
            "required": ["order_id"],
        },
    },
]
```

## Step 3: Simulate synthetic tool responses

Since we don't have real customer data or order information, we'll simulate synthetic responses for our tools. In a real-world scenario, these functions would interact with your actual customer database and order management system.

```python
def get_customer_info(customer_id):
    # Simulated customer data
    customers = {
        "C1": {"name": "John Doe", "email": "john@example.com", "phone": "123-456-7890"},
        "C2": {"name": "Jane Smith", "email": "jane@example.com", "phone": "987-654-3210"},
    }
    return customers.get(customer_id, "Customer not found")


def get_order_details(order_id):
    # Simulated order data
    orders = {
        "O1": {
            "id": "O1",
            "product": "Widget A",
            "quantity": 2,
            "price": 19.99,
            "status": "Shipped",
        },
        "O2": {
            "id": "O2",
            "product": "Gadget B",
            "quantity": 1,
            "price": 49.99,
            "status": "Processing",
        },
    }
    return orders.get(order_id, "Order not found")


def cancel_order(order_id):
    # Simulated order cancellation
    if order_id in ["O1", "O2"]:
        return True
    else:
        return False
```

## Step 4: Process tool calls and return results

We'll create a function to process the tool calls made by Claude and return the appropriate results.

```python
def process_tool_call(tool_name, tool_input):
    if tool_name == "get_customer_info":
        return get_customer_info(tool_input["customer_id"])
    elif tool_name == "get_order_details":
        return get_order_details(tool_input["order_id"])
    elif tool_name == "cancel_order":
        return cancel_order(tool_input["order_id"])
```

## Step 5: Interact with the chatbot

Now, let's create a function to interact with the chatbot. We'll send a user message, process any tool calls made by Claude, and return the final response to the user.

```python
import json


def chatbot_interaction(user_message):
    print(f"\n{'=' * 50}\nUser Message: {user_message}\n{'=' * 50}")

    messages = [{"role": "user", "content": user_message}]

    response = client.messages.create(
        model=MODEL_NAME, max_tokens=4096, tools=tools, messages=messages
    )

    print("\nInitial Response:")
    print(f"Stop Reason: {response.stop_reason}")
    print(f"Content: {response.content}")

    while response.stop_reason == "tool_use":
        tool_use = next(block for block in response.content if block.type == "tool_use")
        tool_name = tool_use.name
        tool_input = tool_use.input

        print(f"\nTool Used: {tool_name}")
        print("Tool Input:")
        print(json.dumps(tool_input, indent=2))

        tool_result = process_tool_call(tool_name, tool_input)

        print("\nTool Result:")
        print(json.dumps(tool_result, indent=2))

        messages = [
            {"role": "user", "content": user_message},
            {"role": "assistant", "content": response.content},
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
        ]

        response = client.messages.create(
            model=MODEL_NAME, max_tokens=4096, tools=tools, messages=messages
        )

        print("\nResponse:")
        print(f"Stop Reason: {response.stop_reason}")
        print(f"Content: {response.content}")

    final_response = next(
        (block.text for block in response.content if hasattr(block, "text")),
        None,
    )

    print(f"\nFinal Response: {final_response}")

    return final_response
```

## Step 6: Test the chatbot
Let's test our customer service chatbot with a few sample queries.

```python
chatbot_interaction("Can you tell me the email address for customer C1?")
chatbot_interaction("What is the status of order O2?")
chatbot_interaction("Please cancel order O1 for me.")
```

And that's it! We've created a customer service chatbot using Claude 3 models and client-side tools. The chatbot can look up customer information, retrieve order details, and cancel orders based on the user's requests. By defining clear tool descriptions and schemas, we enable Claude to effectively understand and utilize the available tools to assist customers.

Feel free to expand on this example by integrating with your actual customer database and order management system, and by adding more tools to handle a wider range of customer service tasks.
