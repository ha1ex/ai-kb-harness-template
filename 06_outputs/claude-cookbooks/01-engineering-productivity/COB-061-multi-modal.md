---
id: COB-061
tier: A
category: "Engineering productivity"
kind: workflow
title: "Multi-Modal"
subtitle: "In this notebook, we show how to use Anthropic MultiModal LLM class/abstraction for image understanding/reasoning."
source: https://github.com/anthropics/claude-cookbooks/blob/main/third_party/LlamaIndex/Multi_Modal.ipynb
upstream_name: "third_party/LlamaIndex/Multi_Modal.ipynb"
upstream_folder: "third_party"
provider: anthropic-cookbooks
license: MIT
license_source: https://github.com/anthropics/claude-cookbooks/blob/main/LICENSE
ingested: 2026-05-27
type: case
version: v0.1
---
# Multi-Modal

> In this notebook, we show how to use Anthropic MultiModal LLM class/abstraction for image understanding/reasoning.

In this notebook, we show how to use Anthropic MultiModal LLM class/abstraction for image understanding/reasoning.

#### Installation

```python
!pip install llama-index
!pip install llama-index-multi-modal-llms-anthropic
!pip install llama-index-embeddings-huggingface
!pip install llama-index-vector-stores-qdrant
!pip install matplotlib
```

#### Setup API key

```python
import os

os.environ["ANTHROPIC_API_KEY"] = "YOUR Claude API KEY"
```

#### Download Sample Images

```python
!wget 'https://raw.githubusercontent.com/run-llama/llama_index/main/docs/examples/data/images/prometheus_paper_card.png' -O 'prometheus_paper_card.png'
!wget 'https://raw.githubusercontent.com/run-llama/llama_index/main/docs/examples/data/images/ark_email_sample.PNG' -O 'ark_email_sample.png'
```

####  Use Anthropic to understand Images from Local directory

```python
import matplotlib.pyplot as plt
from PIL import Image

img = Image.open("./prometheus_paper_card.png")
plt.imshow(img)
```

```python
from llama_index.core import SimpleDirectoryReader
from llama_index.multi_modal_llms.anthropic import AnthropicMultiModal

image_documents = SimpleDirectoryReader(input_files=["prometheus_paper_card.png"]).load_data()

# Initiated Anthropic MultiModal class
anthropic_mm_llm = AnthropicMultiModal(max_tokens=300)
```

```python
response = anthropic_mm_llm.complete(
    prompt="Describe the images as an alternative text",
    image_documents=image_documents,
)
```

```python
print(response)
```

#### Use `AnthropicMultiModal` to reason images from URLs

```python
from io import BytesIO

import matplotlib.pyplot as plt
import requests
from PIL import Image

image_urls = [
    "https://venturebeat.com/wp-content/uploads/2024/03/Screenshot-2024-03-04-at-12.49.41%E2%80%AFAM.png",
]

img_response = requests.get(image_urls[0], timeout=30)
img = Image.open(BytesIO(img_response.content))
plt.imshow(img)
```

#### Load images with url

```python
from llama_index.core.multi_modal_llms.generic_utils import load_image_urls

image_url_documents = load_image_urls(image_urls)
```

```python
response = anthropic_mm_llm.complete(
    prompt="Describe the images as an alternative text",
    image_documents=image_url_documents,
)
```

```python
print(response)
```

#### Structured Output Parsing from an Image

Here, we use our multi-modal Pydantic program to generate structured output from an image.

```python
from llama_index.core import SimpleDirectoryReader

image_documents = SimpleDirectoryReader(input_files=["ark_email_sample.png"]).load_data()
```

```python
import matplotlib.pyplot as plt
from PIL import Image

img = Image.open("ark_email_sample.png")
plt.imshow(img)
```

```python
from pydantic import BaseModel


class TickerInfo(BaseModel):
    """List of ticker info."""

    direction: str
    ticker: str
    company: str
    shares_traded: int
    percent_of_total_etf: float


class TickerList(BaseModel):
    """List of stock tickers."""

    fund: str
    tickers: list[TickerInfo]
```

```python
from llama_index.core.program import MultiModalLLMCompletionProgram
from llama_index.multi_modal_llms.anthropic import AnthropicMultiModal

prompt_template_str = """\
Can you get the stock information in the image \
and return the answer? Pick just one fund.

Make sure the answer is a JSON format corresponding to a Pydantic schema. The Pydantic schema is given below.

"""

# Initiated Anthropic MultiModal class
anthropic_mm_llm = AnthropicMultiModal(max_tokens=300)


llm_program = MultiModalLLMCompletionProgram.from_defaults(
    output_cls=TickerList,
    image_documents=image_documents,
    prompt_template_str=prompt_template_str,
    multi_modal_llm=anthropic_mm_llm,
    verbose=True,
)
```

```python
response = llm_program()
```

```python
print(response)
```
