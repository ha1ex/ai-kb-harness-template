---
id: COB-048
tier: A
category: "Engineering productivity"
kind: workflow
title: "Working with Charts, Graphs, and Slide Decks"
subtitle: "Claude is highly capable of working with charts, graphs, and broader slide decks."
source: https://github.com/anthropics/claude-cookbooks/blob/main/multimodal/reading_charts_graphs_powerpoints.ipynb
upstream_name: "multimodal/reading_charts_graphs_powerpoints.ipynb"
upstream_folder: "multimodal"
provider: anthropic-cookbooks
license: MIT
license_source: https://github.com/anthropics/claude-cookbooks/blob/main/LICENSE
ingested: 2026-05-27
type: case
version: v0.1
---
# Working with Charts, Graphs, and Slide Decks

> Claude is highly capable of working with charts, graphs, and broader slide decks.

Claude is highly capable of working with charts, graphs, and broader slide decks. Depending on your use case, there are a number of tips and tricks that you may want to take advantage of. This recipe will show you common patterns for using Claude with these materials.

## Charts and Graphs
For the most part, using claude with charts and graphs is simple. Let's walk through how to ingest them and pass them to Claude, as well as some common tips to improve your results.

### Ingestion and calling the Claude API
The best way to pass Claude charts and graphs is to take advantage of its vision capabilities and the PDF support feature. That is, give Claude a PDF document of the chart or graph, along with a text question about it.

At the moment, only `claude-sonnet-4-6` supports the PDF feature. Since the feature is still in beta, you will need to provide it with the `pdfs-2024-09-25` beta header.

```python
# Install and create the Anthropic client.
%pip install anthropic
```

```python
import base64

from anthropic import Anthropic

# While PDF support is in beta, you must pass in the correct beta header
client = Anthropic(default_headers={"anthropic-beta": "pdfs-2024-09-25"})
# For now, only claude-sonnet-4-6 supports PDFs
MODEL_NAME = "claude-sonnet-4-6"
```

```python
# Make a useful helper function.
def get_completion(messages):
    response = client.messages.create(
        model=MODEL_NAME, max_tokens=8192, temperature=0, messages=messages
    )
    return response.content[0].text
```

```python
# To start, we'll need a PDF. We will be using the .pdf document located at cvna_2021_annual_report.pdf.
# Start by reading in the PDF and encoding it as base64.
with open("./documents/cvna_2021_annual_report.pdf", "rb") as pdf_file:
    binary_data = pdf_file.read()
    base_64_encoded_data = base64.b64encode(binary_data)
    base64_string = base_64_encoded_data.decode("utf-8")
```

Let's see how we can pass this document to the model alongside a simple question.

```python
messages = [
    {
        "role": "user",
        "content": [
            {
                "type": "document",
                "source": {
                    "type": "base64",
                    "media_type": "application/pdf",
                    "data": base64_string,
                },
            },
            {"type": "text", "text": "What's in this document? Answer in a single sentence."},
        ],
    }
]

print(get_completion(messages))
```

That's pretty good! Now let's ask it some more useful questions.

```python
questions = [
    "What was CVNA revenue in 2020?",
    "How many additional markets has Carvana added since 2014?",
    "What was 2016 revenue per retail unit sold?",
]

for index, question in enumerate(questions):
    messages = [
        {
            "role": "user",
            "content": [
                {
                    "type": "document",
                    "source": {
                        "type": "base64",
                        "media_type": "application/pdf",
                        "data": base64_string,
                    },
                },
                {"type": "text", "text": question},
            ],
        }
    ]

    print(f"\n----------Question {index + 1}----------")
    print(get_completion(messages))
```

As you can see, Claude is capable of answering fairly detailed questions about charts and graphs. However, there are some tips and tricks that will help you get the most out of it.
- Sometimes Claude's arithmetic capabilities get in the way. You'll notice that if you sample the third question above it will occasionally output an incorrect final answer because it messes up the arithmetic. Consider providing Claude with a calculator tool to ensure it doesn't make these types of mistakes.
- With super complicated charts and graphs, we can ask Claude to "First describe every data point you see in the document" as a way to elicit similar improvements to what we seen in traditional Chain of Thought.
- Claude occasionally struggles with charts that depend on lots of colors to convey information, such as grouped bar charts with many groups. Asking Claude to first identify the colors in your graph using HEX codes can boost its accuracy.

## Slide Decks
Now that we know Claude is a charts and graphs wizard, it is only logical that we extend it to the true home of charts and graphs - slide decks!

Slides represent a critical source of information for many domains, including financial services. While you *can* use packages like PyPDF to extract text from slide decks, their chart/graph heavy nature often makes this a poor choice as models will struggle to access the information they actually need.

The PDF support feature can be a great replacement as a result. It uses both extracted text and vision in order when processing PDF documents. In this section we will go over how to use PDF documents in Claude to review slide decks, and how to deal with some common pitfalls of this approach.

The best way to get a typical slide deck into claude is to download it as a PDF and provide it directly to Claude.

```python
# Open the multi-page PDF document the same way we did earlier.
with open("./documents/twilio_q4_2023.pdf", "rb") as pdf_file:
    binary_data = pdf_file.read()
    base_64_encoded_data = base64.b64encode(binary_data)
    base64_string = base_64_encoded_data.decode("utf-8")
```

```python
# Now let's pass the document directly to Claude. Note that Claude will process both the text and visual elements of the document.
question = "What was Twilio y/y revenue growth for fiscal year 2023?"
content = [
    {
        "type": "document",
        "source": {"type": "base64", "media_type": "application/pdf", "data": base64_string},
    },
    {"type": "text", "text": question},
]

messages = [{"role": "user", "content": content}]

print(get_completion(messages))
```

This approach is a great way to get started, and for some use cases offers the best performance. However, there are some limitations.
- You can only include a total of 100 pages across all provided documents in a request (we intend to increase this limit over time).
- If you are using slide content as part of RAG, introducing multimodal PDFs into your embeddings can cause problems

Luckily, we can take advantage of Claude's vision capabilities to get a much higher quality representation of the slide deck **in text form** than normal pdf text extraction allows.

We find the best way to do this is to ask Claude to sequentially narrate the deck from start to finish, passing it the current slide and its prior narration. Let's see how.

```python
# Define a prompt for narrating our slide deck. We would adjut this prompt based on the nature of the deck, but keep the structure largely the same.
prompt = """
You are the Twilio CFO, narrating your Q4 2023 earnings presentation.

The entire earnings presentation document is provided to you.
Please narrate this presentation from Twilio's Q4 2023 Earnings as if you were the presenter. Do not talk about any things, especially acronyms, if you are not exactly sure you know what they mean.

Do not leave any details un-narrated as some of your viewers are vision-impaired, so if you don't narrate every number they won't know the number.

Structure your response like this:
<narration>
    <page_narration id=1>
    [Your narration for page 1]
    </page_narration>

    <page_narration id=2>
    [Your narration for page 2]
    </page_narration>

    ... and so on for each page
</narration>

Use excruciating detail for each page, ensuring you describe every visual element and number present. Show the full response in a single message.
"""
messages = [
    {
        "role": "user",
        "content": [
            {
                "type": "document",
                "source": {
                    "type": "base64",
                    "media_type": "application/pdf",
                    "data": base64_string,
                },
            },
            {"type": "text", "text": prompt},
        ],
    }
]

# Now we use our prompt to narrate the entire deck. Note that this may take a few minutes to run (often up to 10).
completion = get_completion(messages)
```

```python
import re

# Next we'll parse the response from Claude using regex
pattern = r"<narration>(.*?)</narration>"
match = re.search(pattern, completion.strip(), re.DOTALL)
if match:
    narration = match.group(1)
else:
    raise ValueError("No narration available. Likely due to the model response being truncated.")
```

Now that we have a text-based narration (it's far from perfect but it's pretty good), we have the ability to use this deck with any text-only workflow. Including vector search!

As a final sanity check, let's ask a few questions of our narration-only setup!

```python
questions = [
    "What percentage of q4 total revenue was the Segment business line?",
    "Has the rate of growth of quarterly revenue been increasing or decreasing? Give just an answer.",
    "What was acquisition revenue for the year ended december 31, 2023 (including negative revenues)?",
]

for index, question in enumerate(questions):
    prompt = f"""You are an expert financial analyst analyzing a transcript of Twilio's earnings call.
Here is the transcript:
<transcript>
{narration}
</transcript>

Please answer the following question:
<question>
{question}
</question>"""
    messages = [{"role": "user", "content": [{"type": "text", "text": prompt}]}]

    print(f"\n----------Question {index + 1}----------")
    print(get_completion(messages))
```

Looks good! With these techniques at your side, you are ready to start applying models to chart and graph heavy content like slide decks.
