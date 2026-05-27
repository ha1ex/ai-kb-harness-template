---
id: COB-062
tier: A
category: "Engineering productivity"
kind: workflow
title: "ReAct Agent"
subtitle: "In this notebook we will look into creating ReAct Agent over tools."
source: https://github.com/anthropics/claude-cookbooks/blob/main/third_party/LlamaIndex/ReAct_Agent.ipynb
upstream_name: "third_party/LlamaIndex/ReAct_Agent.ipynb"
upstream_folder: "third_party"
provider: anthropic-cookbooks
license: MIT
license_source: https://github.com/anthropics/claude-cookbooks/blob/main/LICENSE
ingested: 2026-05-27
type: case
version: v0.1
---
# ReAct Agent

> In this notebook we will look into creating ReAct Agent over tools.

In this notebook we will look into creating ReAct Agent over tools.

1. ReAct Agent over simple calculator tools.
2. ReAct Agent over QueryEngine (RAG) tools.

### Installation

```python
!pip install llama-index
!pip install llama-index-llms-anthropic
!pip install llama-index-embeddings-huggingface
```

### Setup API Keys

```python
# llama-parse is async-first, running the async code in a notebook requires the use of nest_asyncio
import nest_asyncio

nest_asyncio.apply()

import os

# Using Anthropic LLM API for LLM
os.environ["ANTHROPIC_API_KEY"] = "YOUR Claude API KEY"

from IPython.display import HTML, display
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

## ReAct Agent over Tools

### Define Tools

```python
from llama_index.core.agent import ReActAgent
from llama_index.core.tools import FunctionTool
```

```python
def multiply(a: int, b: int) -> int:
    """Multiply two integers and returns the result integer"""
    return a * b


def add(a: int, b: int) -> int:
    """Add two integers and returns the result integer"""
    return a + b


add_tool = FunctionTool.from_defaults(fn=add)
multiply_tool = FunctionTool.from_defaults(fn=multiply)
```

### Create ReAct Agent 

Create agent over tools and test out queries

```python
agent = ReActAgent.from_tools([multiply_tool, add_tool], llm=llm, verbose=True)
```

```python
response = agent.chat("What is 20+(2*4)? Calculate step by step ")
```

```python
display(HTML(f'<p style="font-size:20px">{response.response}</p>'))
```

### Visit Prompts

You can check prompts that the agent used to select the tools.

```python
prompt_dict = agent.get_prompts()
for k, v in prompt_dict.items():
    print(f"Prompt: {k}\n\nValue: {v.template}")
```

## ReAct Agent over `QueryEngine` Tools

```python
from llama_index.core.tools import QueryEngineTool, ToolMetadata
```

### Download data

We will define ReAct agent over tools created on QueryEngines with Uber and Lyft 10K SEC Filings.

```python
!mkdir -p 'data/10k/'
!wget 'https://raw.githubusercontent.com/run-llama/llama_index/main/docs/examples/data/10k/uber_2021.pdf' -O 'data/10k/uber_2021.pdf'
!wget 'https://raw.githubusercontent.com/run-llama/llama_index/main/docs/examples/data/10k/lyft_2021.pdf' -O 'data/10k/lyft_2021.pdf'
```

### Load Data

```python
from llama_index.core import SimpleDirectoryReader, VectorStoreIndex

lyft_docs = SimpleDirectoryReader(input_files=["./data/10k/lyft_2021.pdf"]).load_data()
uber_docs = SimpleDirectoryReader(input_files=["./data/10k/uber_2021.pdf"]).load_data()
```

### Build Index

```python
lyft_index = VectorStoreIndex.from_documents(lyft_docs)
uber_index = VectorStoreIndex.from_documents(uber_docs)
```

### Create QueryEngines

```python
lyft_engine = lyft_index.as_query_engine(similarity_top_k=3)
uber_engine = uber_index.as_query_engine(similarity_top_k=3)
```

#### Create QueryEngine Tools

```python
query_engine_tools = [
    QueryEngineTool(
        query_engine=lyft_engine,
        metadata=ToolMetadata(
            name="lyft_10k",
            description=(
                "Provides information about Lyft financials for year 2021. "
                "Use a detailed plain text question as input to the tool."
            ),
        ),
    ),
    QueryEngineTool(
        query_engine=uber_engine,
        metadata=ToolMetadata(
            name="uber_10k",
            description=(
                "Provides information about Uber financials for year 2021. "
                "Use a detailed plain text question as input to the tool."
            ),
        ),
    ),
]
```

### ReAct Agent

```python
agent = ReActAgent.from_tools(
    query_engine_tools,
    llm=llm,
    verbose=True,
)
```

### Querying with ReAct Agent

```python
response = agent.chat("What was Lyft's revenue growth in 2021?")
```

```python
display(HTML(f'<p style="font-size:20px">{response.response}</p>'))
```

```python
response = agent.chat(
    "Compare and contrast the revenue growth of Uber and Lyft in 2021, then give an analysis"
)
```

```python
display(HTML(f'<p style="font-size:20px">{response.response}</p>'))
```
