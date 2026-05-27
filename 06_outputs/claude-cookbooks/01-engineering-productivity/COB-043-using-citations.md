---
id: COB-043
tier: A
category: "Engineering productivity"
kind: workflow
title: "Citations"
subtitle: "The Claude API features citation support that enables Claude to provide detailed citations when answering questions about documents."
source: https://github.com/anthropics/claude-cookbooks/blob/main/misc/using_citations.ipynb
upstream_name: "misc/using_citations.ipynb"
upstream_folder: "misc"
provider: anthropic-cookbooks
license: MIT
license_source: https://github.com/anthropics/claude-cookbooks/blob/main/LICENSE
ingested: 2026-05-27
type: case
version: v0.1
---
# Citations

> The Claude API features citation support that enables Claude to provide detailed citations when answering questions about documents.

The Claude API features citation support that enables Claude to provide detailed citations when answering questions about documents. Citations are a valuable affordance in many LLM powered applications to help users track and verify the sources of information in responses.

Citations are supported on:
* `claude-sonnet-4-6`
* `claude-3-5-haiku-20241022`

The citations feature is an alternative to prompt-based citation techniques. Using this featue has the following advantages:
- Prompt-based techniques often require Claude to output full quotes from the source document it intends to cite. This increases output tokens and therefore cost.
- The citation feature will not return citations pointing to documents or locations that were not provided as valid sources.
- While testing we found the citation feature to generate citations with higher recall and percision than prompt based techniques.

The documentation for citations can be found [here](https://docs.claude.com/en/docs/build-with-claude/citations).

## Setup

First, let's install the required libraries and initalize our Anthropic client.

```python
!pip install anthropic  --quiet
```

```python
import json
import os

import anthropic

ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY")
# ANTHROPIC_API_KEY = "" # Put your API key here!

client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
```

## Document Types

Citations support three different document types. The type of citation outputted depends on the type of document being cited from:

* Plain text document citation → char location format
* PDF document citation → page location format
* Custom content document citation → content block location format

We will explore working with each of these in the examples below.

### Plain Text Documents

With plain text document citations you provide your document as raw text to the model. You can provide one or multiple documents. This text will get automatically chunked into sentences. The model will cite these sentences as appropriate. The model is able to cite multiple sentences together at once in a single citation but will not cite text smaller than a sentence.

Along with the outputted text the API response will include structured data for all citations. 

Let's see a complete example using a help center customer chatbot for a made up company PetWorld.

```python
# Read all help center articles and create a list of documents
articles_dir = "./data/help_center_articles"
documents = []

for filename in sorted(os.listdir(articles_dir)):
    if filename.endswith(".txt"):
        with open(os.path.join(articles_dir, filename)) as f:
            content = f.read()
            # Split into title and body
            title_line, body = content.split("\n", 1)
            title = title_line.replace("title: ", "")
            documents.append(
                {
                    "type": "document",
                    "source": {"type": "text", "media_type": "text/plain", "data": body},
                    "title": title,
                    "citations": {"enabled": True},
                }
            )

QUESTION = "I just checked out, where is my order tracking number? Track package is not available on the website yet for my order."

# Add the question to the content
content = documents

response = client.messages.create(
    model="claude-sonnet-4-6",
    temperature=0.0,
    max_tokens=1024,
    system="You are a customer support bot working for PetWorld. Your task is to provide short, helpful answers to user questions. Since you are in a chat interface avoid providing extra details. You will be given access to PetWorld's help center articles to help you answer questions.",
    messages=[
        {"role": "user", "content": documents},
        {
            "role": "user",
            "content": [{"type": "text", "text": f"Here is the user's question: {QUESTION}"}],
        },
    ],
)


def visualize_raw_response(response):
    raw_response = {"content": []}

    print("\n" + "=" * 80 + "\nRaw response:\n" + "=" * 80)

    for content in response.content:
        if content.type == "text":
            block = {"type": "text", "text": content.text}
            if hasattr(content, "citations") and content.citations:
                block["citations"] = []
                for citation in content.citations:
                    citation_dict = {
                        "type": citation.type,
                        "cited_text": citation.cited_text,
                        "document_title": citation.document_title,
                    }
                    if citation.type == "page_location":
                        citation_dict.update(
                            {
                                "start_page_number": citation.start_page_number,
                                "end_page_number": citation.end_page_number,
                            }
                        )
                    block["citations"].append(citation_dict)
            raw_response["content"].append(block)

    return json.dumps(raw_response, indent=2)


print(visualize_raw_response(response))
```

#### Visualizing Citations
By leveraging the citation data, we can create UIs that:

1. Show users exactly where information comes from
2. Link directly to source documents
3. Highlight cited text in context
4. Build trust through transparent sourcing

Below is a simple visualization function that transforms Claude's structured citations into a readable format with numbered references, similar to academic papers.

The function takes Claude's response object and outputs:
- Text with numbered citation markers (e.g., "The answer [1] includes this fact [2]")
- A numbered reference list showing each cited text and its source document

```python
def visualize_citations(response):
    """
    Takes a response object and returns a string with numbered citations.
    Example output: "here is the plain text answer [1][2] here is some more text [3]"
    with a list of citations below.
    """
    # Dictionary to store unique citations
    citations_dict = {}
    citation_counter = 1

    # Final formatted text
    formatted_text = ""
    citations_list = []

    print("\n" + "=" * 80 + "\nFormatted response:\n" + "=" * 80)

    for content in response.content:
        if content.type == "text":
            text = content.text
            if hasattr(content, "citations") and content.citations:
                # Sort citations by their appearance in the text
                def get_sort_key(citation):
                    if hasattr(citation, "start_char_index"):
                        return citation.start_char_index
                    elif hasattr(citation, "start_page_number"):
                        return citation.start_page_number
                    elif hasattr(citation, "start_block_index"):
                        return citation.start_block_index
                    return 0  # fallback

                sorted_citations = sorted(content.citations, key=get_sort_key)

                # Process each citation
                for citation in sorted_citations:
                    doc_title = citation.document_title
                    cited_text = citation.cited_text.replace("\n", " ").replace("\r", " ")
                    # Remove any multiple spaces that might have been created
                    cited_text = " ".join(cited_text.split())

                    # Create a unique key for this citation
                    citation_key = f"{doc_title}:{cited_text}"

                    # If this is a new citation, add it to our dictionary
                    if citation_key not in citations_dict:
                        citations_dict[citation_key] = citation_counter
                        citations_list.append(
                            f'[{citation_counter}] "{cited_text}" found in "{doc_title}"'
                        )
                        citation_counter += 1

                    # Add the citation number to the text
                    citation_num = citations_dict[citation_key]
                    text += f" [{citation_num}]"

            formatted_text += text

    # Combine the formatted text with the citations list
    final_output = formatted_text + "\n\n" + "\n".join(citations_list)
    return final_output


formatted_response = visualize_citations(response)
print(formatted_response)
```

### PDF Documents

When working with PDFs, Claude can provide citations that reference specific page numbers, making it easy to track information sources. Here's how PDF citations work:

- PDF document content is provided as base64-encoded data
- Text is automatically chunked into sentences
- Citations include page numbers (1-indexed) where the information was found
- The model can cite multiple sentences together in a single citation but won't cite text smaller than a sentence
- While images are processed, only text content can be cited at this time

Below is an example using the Constitutional AI paper to demonstrate PDF citations:

```python
import base64
import json

# Read and encode the PDF
pdf_path = "data/Constitutional AI.pdf"
with open(pdf_path, "rb") as f:
    pdf_data = base64.b64encode(f.read()).decode()

pdf_response = client.messages.create(
    model="claude-sonnet-4-6",
    temperature=0.0,
    max_tokens=1024,
    messages=[
        {
            "role": "user",
            "content": [
                {
                    "type": "document",
                    "source": {"type": "base64", "media_type": "application/pdf", "data": pdf_data},
                    "title": "Constitutional AI Paper",
                    "citations": {"enabled": True},
                },
                {"type": "text", "text": "What is the main idea of Constitutional AI?"},
            ],
        }
    ],
)

print(visualize_raw_response(pdf_response))
print(visualize_citations(pdf_response))
```

### Custom Content Documents

While plain text documents are automatically chunked into sentences, custom content documents give you complete control over citation granularity. This API shape allows you to:

* Define your own chunks of any size
* Control the minimum citation unit
* Optimize for documents that don't work well with sentence chunking

In the example below, we use the same help center articles as the plain text example above, but instead of allowing sentence-level citations, we'll treat each article as a single chunk. This demonstrates how the choice of document type affects citation behavior and granularity. You will notice that the `cited_text` is the entire article in contrast to a sentence from the source article.

```python
# Read all help center articles and create a list of custom content documents
articles_dir = "./data/help_center_articles"
documents = []

for filename in sorted(os.listdir(articles_dir)):
    if filename.endswith(".txt"):
        with open(os.path.join(articles_dir, filename)) as f:
            content = f.read()
            # Split into title and body
            title_line, body = content.split("\n", 1)
            title = title_line.replace("title: ", "")

            documents.append(
                {
                    "type": "document",
                    "source": {"type": "content", "content": [{"type": "text", "text": body}]},
                    "title": title,
                    "citations": {"enabled": True},
                }
            )

QUESTION = "I just checked out, where is my order tracking number? Track package is not available on the website yet for my order."

custom_content_response = client.messages.create(
    model="claude-sonnet-4-6",
    temperature=0.0,
    max_tokens=1024,
    system="You are a customer support bot working for PetWorld. Your task is to provide short, helpful answers to user questions. Since you are in a chat interface avoid providing extra details. You will be given access to PetWorld's help center articles to help you answer questions.",
    messages=[
        {"role": "user", "content": documents},
        {
            "role": "user",
            "content": [{"type": "text", "text": f"Here is the user's question: {QUESTION}"}],
        },
    ],
)

print(visualize_raw_response(custom_content_response))
print(visualize_citations(custom_content_response))
```

### Using the Context Field

The `context` field allows you to provide additional information about a document that Claude can use when generating responses, but that won't be cited. This is useful for:

* Providing metadata about the document (e.g., publication date, author)
* [Contextual retrieval](https://www.anthropic.com/news/contextual-retrieval)
* Including usage instructions or context that shouldn't be directly cited

In the example below, we provide a loyalty program article with a warning in the context field. Notice how Claude can use the information in the context to inform its response but the context field content is not available for citation.

```python
import json

# Create a document with context field
document = {
    "type": "document",
    "source": {
        "type": "text",
        "media_type": "text/plain",
        "data": "PetWorld offers a loyalty program where customers earn 1 point for every dollar spent. Once you accumulate 100 points, you'll receive a $5 reward that can be used on your next purchase. Points expire 12 months after they are earned. You can check your point balance in your account dashboard or by asking customer service.",
    },
    "title": "Loyalty Program Details",
    "context": "WARNING: This article has not been updated in 12 months. Content may be out of date. Be sure to inform the user this content may be incorrect after providing guidance.",
    "citations": {"enabled": True},
}

QUESTION = "How does PetWorld's loyalty program work? When do points expire?"

context_response = client.messages.create(
    model="claude-sonnet-4-6",
    temperature=0.0,
    max_tokens=1024,
    messages=[{"role": "user", "content": [document, {"type": "text", "text": QUESTION}]}],
)

print(visualize_raw_response(context_response))
print(visualize_citations(context_response))
```

### PDF Highlighting

One limitation with PDF citations is only the page numbers are returned. You can use third party libraries to match the returned cited text with page contents to draw attention to the cited content. This cell demonstrates PDF citation highlighting using Claude and PyMuPDF, creating a new annotated PDF:

```python
import fitz  # PyMuPDF

# Setup paths and read PDF
pdf_path = "data/Amazon-com-Inc-2023-Shareholder-Letter.pdf"
output_pdf_path = "data/Amazon-com-Inc-2023-Shareholder-Letter-highlighted.pdf"

# Read and encode the PDF
with open(pdf_path, "rb") as f:
    pdf_data = base64.b64encode(f.read()).decode()

response = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=1024,
    temperature=0,
    messages=[
        {
            "role": "user",
            "content": [
                {
                    "type": "document",
                    "source": {"type": "base64", "media_type": "application/pdf", "data": pdf_data},
                    "title": "Amazon 2023 Shareholder Letter",
                    "citations": {"enabled": True},
                },
                {
                    "type": "text",
                    "text": "What was Amazon's total revenue in 2023 and how much did it grow year-over-year?",
                },
            ],
        }
    ],
)

print(visualize_raw_response(response))

# Collect PDF citations
pdf_citations = []
for content in response.content:
    if hasattr(content, "citations") and content.citations:
        for citation in content.citations:
            if citation.type == "page_location":
                pdf_citations.append(citation)

doc = fitz.open(pdf_path)

# Process each citation
for citation in pdf_citations:
    if citation.type == "page_location":
        text_to_find = citation.cited_text.replace("\u0002", "")
        start_page = citation.start_page_number - 1  # Convert to 0-based index
        end_page = citation.end_page_number - 2

        # Process each page in the citation range
        for page_num in range(start_page, end_page + 1):
            page = doc[page_num]

            text_instances = page.search_for(text_to_find.strip())

            if text_instances:
                print(f"Found cited text on page {page_num + 1}")
                for inst in text_instances:
                    highlight = page.add_highlight_annot(inst)
                    highlight.set_colors({"stroke": (1, 1, 0)})  # Yellow highlight
                    highlight.update()
            else:
                print(f"{text_to_find} not found on page {page_num + 1}")

# Save the new PDF
doc.save(output_pdf_path)
doc.close()

print(f"\nCreated highlighted PDF at: {output_pdf_path}")
```
