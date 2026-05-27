---
id: COB-037
tier: A
category: "Engineering productivity"
kind: workflow
title: "\"Uploading\" PDFs to Claude Via the API"
subtitle: "One really nice feature of [Claude.ai](https://www.claude.ai) is the ability to upload PDFs."
source: https://github.com/anthropics/claude-cookbooks/blob/main/misc/pdf_upload_summarization.ipynb
upstream_name: "misc/pdf_upload_summarization.ipynb"
upstream_folder: "misc"
provider: anthropic-cookbooks
license: MIT
license_source: https://github.com/anthropics/claude-cookbooks/blob/main/LICENSE
ingested: 2026-05-27
type: case
version: v0.1
---
# "Uploading" PDFs to Claude Via the API

> One really nice feature of [Claude.ai](https://www.claude.ai) is the ability to upload PDFs.

# "Uploading" PDFs to Claude Via the API

One really nice feature of [Claude.ai](https://www.claude.ai) is the ability to upload PDFs. Let's mock up that feature in a notebook, and then test it out by summarizing a long PDF.

We'll start by installing the Anthropic client and create an instance of it we will use throughout the notebook.

```python
%pip install anthropic
```

```python
from anthropic import Anthropic
# While PDF support is in beta, you must pass in the correct beta header
client = Anthropic(default_headers={
    "anthropic-beta": "pdfs-2024-09-25"
  }
)
# For now, only claude-sonnet-4-6 supports PDFs
MODEL_NAME = "claude-sonnet-4-6"
```

We already have a PDF available in the `../multimodal/documents` directory. We'll convert the PDF file into base64 encoded bytes. This is the format required for the [PDF document block](https://docs.claude.com/en/docs/build-with-claude/pdf-support) in the Claude API. Note that this type of extraction works for both text and visual elements (like charts and graphs).

```python
import base64


# Start by reading in the PDF and encoding it as base64
file_name = "../multimodal/documents/constitutional-ai-paper.pdf"
with open(file_name, "rb") as pdf_file:
  binary_data = pdf_file.read()
  base64_encoded_data = base64.standard_b64encode(binary_data)
  base64_string = base64_encoded_data.decode("utf-8")
```

With the paper downloaded and in memory, we can ask Claude to perform various fun tasks with it. We'll pass the document ot the model alongside a simple question.

```python
prompt = """
Please do the following:
1. Summarize the abstract at a kindergarten reading level. (In <kindergarten_abstract> tags.)
2. Write the Methods section as a recipe from the Moosewood Cookbook. (In <moosewood_methods> tags.)
3. Compose a short poem epistolizing the results in the style of Homer. (In <homer_results> tags.)
"""
messages = [
    {
        "role": 'user',
        "content": [
            {"type": "document", "source": {"type": "base64", "media_type": "application/pdf", "data": base64_string}},
            {"type": "text", "text": prompt}
        ]
    }
]
```

```python
def get_completion(client, messages):
    return client.messages.create(
        model=MODEL_NAME,
        max_tokens=2048,
        messages=messages
    ).content[0].text
```

```python
completion = get_completion(client, messages)
print(completion)
```
