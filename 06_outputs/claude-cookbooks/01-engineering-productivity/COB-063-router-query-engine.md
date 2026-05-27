---
id: COB-063
tier: A
category: "Engineering productivity"
kind: workflow
title: "RouterQuery Engine"
subtitle: "In this notebook we will look into `RouterQueryEngine` to route the user queries to one of the available query engine tools."
source: https://github.com/anthropics/claude-cookbooks/blob/main/third_party/LlamaIndex/Router_Query_Engine.ipynb
upstream_name: "third_party/LlamaIndex/Router_Query_Engine.ipynb"
upstream_folder: "third_party"
provider: anthropic-cookbooks
license: MIT
license_source: https://github.com/anthropics/claude-cookbooks/blob/main/LICENSE
ingested: 2026-05-27
type: case
version: v0.1
---
# RouterQuery Engine

> In this notebook we will look into `RouterQueryEngine` to route the user queries to one of the available query engine tools.

In this notebook we will look into `RouterQueryEngine` to route the user queries to one of the available query engine tools. These tools can be different indices/ query engine on same documents/ different documents.

### Installation

```python
!pip install llama-index
!pip install llama-index-llms-anthropic
!pip install llama-index-embeddings-huggingface
```

### Set Logging

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

### Set Claude API Key

```python
import os

os.environ["ANTHROPIC_API_KEY"] = "YOUR Claude API KEY"
```

### Set LLM and Embedding model

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

### Download Document

```python
!mkdir -p 'data/paul_graham/'
!wget 'https://raw.githubusercontent.com/jerryjliu/llama_index/main/docs/examples/data/paul_graham/paul_graham_essay.txt' -O 'data/paul_graham/paul_graham_essay.txt'
```

### Load Document

```python
# load documents
from llama_index.core import SimpleDirectoryReader

documents = SimpleDirectoryReader("data/paul_graham").load_data()
```

### Create Indices and Query Engines.

```python
from llama_index.core import SummaryIndex, VectorStoreIndex

# Summary Index for summarization questions
summary_index = SummaryIndex.from_documents(documents)

# Vector Index for answering specific context questions
vector_index = VectorStoreIndex.from_documents(documents)
```

```python
# Summary Index Query Engine
summary_query_engine = summary_index.as_query_engine(
    response_mode="tree_summarize",
    use_async=True,
)

# Vector Index Query Engine
vector_query_engine = vector_index.as_query_engine()
```

### Create tools for summary and vector query engines.

```python
from llama_index.core.tools.query_engine import QueryEngineTool

# Summary Index tool
summary_tool = QueryEngineTool.from_defaults(
    query_engine=summary_query_engine,
    description="Useful for summarization questions related to Paul Graham eassy on What I Worked On.",
)

# Vector Index tool
vector_tool = QueryEngineTool.from_defaults(
    query_engine=vector_query_engine,
    description="Useful for retrieving specific context from Paul Graham essay on What I Worked On.",
)
```

### Create Router Query Engine

```python
from llama_index.core.query_engine.router_query_engine import RouterQueryEngine
from llama_index.core.selectors.llm_selectors import LLMSingleSelector
```

```python
# Create Router Query Engine
query_engine = RouterQueryEngine(
    selector=LLMSingleSelector.from_defaults(),
    query_engine_tools=[
        summary_tool,
        vector_tool,
    ],
)
```

### Test Queries

```python
response = query_engine.query("What is the summary of the document?")
```

```python
display(HTML(f'<p style="font-size:20px">{response.response}</p>'))
```

```python
response = query_engine.query("What did Paul Graham do growing up?")
```

```python
display(HTML(f'<p style="font-size:20px">{response.response}</p>'))
```
