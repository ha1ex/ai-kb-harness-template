---
id: COB-064
tier: A
category: "Engineering productivity"
kind: workflow
title: "SubQuestionQueryEngine"
subtitle: "Often, we encounter scenarios where our queries span across multiple documents."
source: https://github.com/anthropics/claude-cookbooks/blob/main/third_party/LlamaIndex/SubQuestion_Query_Engine.ipynb
upstream_name: "third_party/LlamaIndex/SubQuestion_Query_Engine.ipynb"
upstream_folder: "third_party"
provider: anthropic-cookbooks
license: MIT
license_source: https://github.com/anthropics/claude-cookbooks/blob/main/LICENSE
ingested: 2026-05-27
type: case
version: v0.1
---
# SubQuestionQueryEngine

> Often, we encounter scenarios where our queries span across multiple documents.

Often, we encounter scenarios where our queries span across multiple documents. 

In this notebook, we delve into addressing complex queries that extend over various documents by breaking them down into simpler sub-queries and generate answers using the `SubQuestionQueryEngine`.

### Installation

```python
!pip install llama-index
!pip install llama-index-llms-anthropic
!pip install llama-index-embeddings-huggingface
```

### Setup API Key

```python
import os

os.environ["ANTHROPIC_API_KEY"] = "YOUR Claude API KEY"
```

### Setup LLM and Embedding model

We will use anthropic latest released `Claude-3 Opus` LLM.

```python
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from llama_index.llms.anthropic import Anthropic
```

```python
llm = Anthropic(temperature=0.0, model="claude-opus-4-1")
embed_model = HuggingFaceEmbedding(model_name="BAAI/bge-base-en-v1.5")
```

```python
from llama_index.core import Settings

Settings.llm = llm
Settings.embed_model = embed_model
Settings.chunk_size = 512
```

### Setup logging

```python
# NOTE: This is ONLY necessary in jupyter notebook.
# Details: Jupyter runs an event-loop behind the scenes.
#          This results in nested event-loops when we start an event-loop to make async queries.
#          This is normally not allowed, we use nest_asyncio to allow it for convenience.
import nest_asyncio

nest_asyncio.apply()

import logging
import sys

# Set up the root logger
logger = logging.getLogger()
logger.setLevel(logging.INFO)  # Set logger level to INFO

# Clear out any existing handlers
logger.handlers = []

# Set up the StreamHandler to output to sys.stdout (Colab's output)
handler = logging.StreamHandler(sys.stdout)
handler.setLevel(logging.INFO)  # Set handler level to INFO

# Add the handler to the logger
logger.addHandler(handler)

from IPython.display import HTML, display
```

### Download Data

We will use Uber and Lyft 2021 10K SEC Filings

```python
!wget 'https://raw.githubusercontent.com/run-llama/llama_index/main/docs/examples/data/10k/uber_2021.pdf' -O './uber_2021.pdf'
!wget 'https://raw.githubusercontent.com/run-llama/llama_index/main/docs/examples/data/10k/lyft_2021.pdf' -O './lyft_2021.pdf'
```

### Load Data

```python
from llama_index.core import SimpleDirectoryReader

lyft_docs = SimpleDirectoryReader(input_files=["lyft_2021.pdf"]).load_data()
uber_docs = SimpleDirectoryReader(input_files=["uber_2021.pdf"]).load_data()
```

```python
print(f"Loaded lyft 10-K with {len(lyft_docs)} pages")
print(f"Loaded Uber 10-K with {len(uber_docs)} pages")
```

### Index Data

```python
from llama_index.core import VectorStoreIndex

lyft_index = VectorStoreIndex.from_documents(lyft_docs[:100])
uber_index = VectorStoreIndex.from_documents(uber_docs[:100])
```

### Create Query Engines

```python
lyft_engine = lyft_index.as_query_engine(similarity_top_k=5)
```

```python
uber_engine = uber_index.as_query_engine(similarity_top_k=5)
```

### Querying

```python
response = await lyft_engine.aquery(
    "What is the revenue of Lyft in 2021? Answer in millions with page reference"
)
display(HTML(f'<p style="font-size:20px">{response.response}</p>'))
```

```python
response = await uber_engine.aquery(
    "What is the revenue of Uber in 2021? Answer in millions, with page reference"
)
display(HTML(f'<p style="font-size:20px">{response.response}</p>'))
```

### Create Tools

```python
from llama_index.core.query_engine import SubQuestionQueryEngine
from llama_index.core.tools import QueryEngineTool, ToolMetadata

query_engine_tools = [
    QueryEngineTool(
        query_engine=lyft_engine,
        metadata=ToolMetadata(
            name="lyft_10k", description="Provides information about Lyft financials for year 2021"
        ),
    ),
    QueryEngineTool(
        query_engine=uber_engine,
        metadata=ToolMetadata(
            name="uber_10k", description="Provides information about Uber financials for year 2021"
        ),
    ),
]
```

### Create `SubQuestionQueryEngine`

```python
sub_question_query_engine = SubQuestionQueryEngine.from_defaults(
    query_engine_tools=query_engine_tools
)
```

### Querying

```python
response = await sub_question_query_engine.aquery(
    "Compare revenue growth of Uber and Lyft from 2020 to 2021"
)
```

```python
display(HTML(f'<p style="font-size:20px">{response.response}</p>'))
```

```python
response = await sub_question_query_engine.aquery("Compare the investments made by Uber and Lyft")
```

```python
display(HTML(f'<p style="font-size:20px">{response.response}</p>'))
```
