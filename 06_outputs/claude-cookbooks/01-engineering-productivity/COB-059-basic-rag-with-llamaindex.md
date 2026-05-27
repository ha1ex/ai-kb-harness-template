---
id: COB-059
tier: A
category: "Engineering productivity"
kind: workflow
title: "RAG Pipeline with LlamaIndex"
subtitle: "In this notebook we will look into building Basic RAG Pipeline with LlamaIndex."
source: https://github.com/anthropics/claude-cookbooks/blob/main/third_party/LlamaIndex/Basic_RAG_With_LlamaIndex.ipynb
upstream_name: "third_party/LlamaIndex/Basic_RAG_With_LlamaIndex.ipynb"
upstream_folder: "third_party"
provider: anthropic-cookbooks
license: MIT
license_source: https://github.com/anthropics/claude-cookbooks/blob/main/LICENSE
ingested: 2026-05-27
type: case
version: v0.1
---
# RAG Pipeline with LlamaIndex

> In this notebook we will look into building Basic RAG Pipeline with LlamaIndex.

In this notebook we will look into building Basic RAG Pipeline with LlamaIndex. The pipeline has following steps.

1. Setup LLM and Embedding Model.
2. Download Data.
3. Load Data.
4. Index Data.
5. Create Query Engine.
6. Querying.

### Installation

```python
!pip install llama-index
!pip install llama-index-llms-anthropic
!pip install llama-index-embeddings-huggingface
```

### Setup API Keys

```python
import os

os.environ["ANTHROPIC_API_KEY"] = "YOUR Claude API KEY"
```

### Setup LLM and Embedding model

We will use anthropic latest released `Claude 3 Opus` models

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

### Download Data

```python
!mkdir -p 'data/paul_graham/'
!wget 'https://raw.githubusercontent.com/run-llama/llama_index/main/docs/examples/data/paul_graham/paul_graham_essay.txt' -O 'data/paul_graham/paul_graham_essay.txt'
```

```python
from llama_index.core import (
    SimpleDirectoryReader,
    VectorStoreIndex,
)
```

### Load Data

```python
documents = SimpleDirectoryReader("./data/paul_graham").load_data()
```

### Index Data

```python
index = VectorStoreIndex.from_documents(
    documents,
)
```

### Create Query Engine

```python
query_engine = index.as_query_engine(similarity_top_k=3)
```

### Test Query

```python
response = query_engine.query("What did author do growing up?")
```

```python
print(response)
```
