---
id: COB-066
tier: A
category: "Engineering productivity"
kind: workflow
title: "Claude 3 RAG Agents with LangChain v1"
subtitle: "LangChain v1 brought a lot of changes and when comparing the LangChain of versions `0.0.3xx` to `0.1.x` there's plenty of changes to the preferred way of doing things."
source: https://github.com/anthropics/claude-cookbooks/blob/main/third_party/Pinecone/claude_3_rag_agent.ipynb
upstream_name: "third_party/Pinecone/claude_3_rag_agent.ipynb"
upstream_folder: "third_party"
provider: anthropic-cookbooks
license: MIT
license_source: https://github.com/anthropics/claude-cookbooks/blob/main/LICENSE
ingested: 2026-05-27
type: case
version: v0.1
---
# Claude 3 RAG Agents with LangChain v1

> LangChain v1 brought a lot of changes and when comparing the LangChain of versions `0.0.3xx` to `0.1.x` there's plenty of changes to the preferred way of doing things.

```python
!python --version
```

# Claude 3 RAG Agents with LangChain v1

LangChain v1 brought a lot of changes and when comparing the LangChain of versions `0.0.3xx` to `0.1.x` there's plenty of changes to the preferred way of doing things. That is very much the case for agents.

The way that we initialize and use agents is generally clearer than it was in the past — there are still many abstractions, but we can (and are encouraged to) get closer to the agent logic itself. This can make for some confusion at first, but once understood the new logic can be much clearer than with previous versions.

In this example, we'll be building a RAG agent with LangChain v1. We will use Claude 3 for our LLM, Voyage AI for knowledge embeddings, and Pinecone to power our knowledge retrieval.

To begin, let's install the prerequisites:

```python
!pip install -qU \
    langchain==0.1.11 \
    langchain-core==0.1.30 \
    langchain-community==0.0.27 \
    langchain-anthropic==0.1.4 \
    langchainhub==0.1.15 \
    anthropic==0.19.1 \
    voyageai==0.2.1 \
    pinecone-client==3.1.0 \
    datasets==2.16.1
```

And grab the required API keys. We will need API keys for [Claude](https://docs.claude.com/claude/reference/getting-started-with-the-api), [Voyage AI](https://docs.voyageai.com/install/), and [Pinecone](https://docs.pinecone.io/docs/quickstart).

```python
# Insert your API keys here
ANTHROPIC_API_KEY = "<YOUR_ANTHROPIC_API_KEY>"
PINECONE_API_KEY = "<YOUR_PINECONE_API_KEY>"
VOYAGE_API_KEY = "<YOUR_VOYAGE_API_KEY>"
```

## Finding Knowledge

The first thing we need for an agent using RAG is somewhere we want to pull knowledge from. We will use v2 of the AI ArXiv dataset, available on Hugging Face Datasets at [`jamescalam/ai-arxiv2-chunks`](https://huggingface.co/datasets/jamescalam/ai-arxiv2-chunks).

_Note: we're using the prechunked dataset. For the raw version see [`jamescalam/ai-arxiv2`](https://huggingface.co/datasets/jamescalam/ai-arxiv2)._

```python
from datasets import load_dataset

dataset = load_dataset("jamescalam/ai-arxiv2-chunks", split="train[:20000]")
dataset
```

```python
dataset[1]
```

## Building the Knowledge Base

To build our knowledge base we need _two things_:

1. Embeddings, for this we will use `VoyageEmbeddings` using Voyage AI's embedding models, which do need an [API key](https://dash.voyageai.com/api-keys).
2. A vector database, where we store our embeddings and query them. We use Pinecone which again requires a [free API key](https://app.pinecone.io).

First we initialize our connection to Voyage AI and define an `embed` object for embeddings:

```python
from langchain_community.embeddings import VoyageEmbeddings

embed = VoyageEmbeddings(voyage_api_key=VOYAGE_API_KEY, model="voyage-2")
```

Then we initialize our connection to Pinecone:

```python
from pinecone import Pinecone

# configure client
pc = Pinecone(api_key=PINECONE_API_KEY)
```

Now we setup our index specification, this allows us to define the cloud provider and region where we want to deploy our index. You can find a list of all [available providers and regions here](https://docs.pinecone.io/docs/projects).

```python
from pinecone import ServerlessSpec

spec = ServerlessSpec(cloud="aws", region="us-west-2")
```

Before creating an index, we need the dimensionality of our Voyage AI embedding model, which we can find easily by creating an embedding and checking the length:

```python
vec = embed.embed_documents(["ello"])
len(vec[0])
```

Now we create the index using our embedding dimensionality, and a metric also compatible with the model (this can be either cosine or dotproduct). We also pass our spec to index initialization.

```python
import time

index_name = "claude-3-rag"

# check if index already exists (it shouldn't if this is first time)
if index_name not in pc.list_indexes().names():
    # if does not exist, create index
    pc.create_index(
        index_name,
        dimension=len(vec[0]),  # dimensionality of voyage model
        metric="dotproduct",
        spec=spec,
    )
    # wait for index to be initialized
    while not pc.describe_index(index_name).status["ready"]:
        time.sleep(1)

# connect to index
index = pc.Index(index_name)
time.sleep(1)
# view index stats
index.describe_index_stats()
```

### Populating our Index

Now our knowledge base is ready to be populated with our data. We will use the `embed` helper function to embed our documents and then add them to our index.

We will also include metadata from each record.

```python
from tqdm.auto import tqdm

# easier to work with dataset as pandas dataframe
data = dataset.to_pandas()

batch_size = 100

for i in tqdm(range(0, len(data), batch_size)):
    i_end = min(len(data), i + batch_size)
    # get batch of data
    batch = data.iloc[i:i_end]
    # generate unique ids for each chunk
    ids = [f"{x['doi']}-{x['chunk-id']}" for i, x in batch.iterrows()]
    # get text to embed
    texts = [x["chunk"] for _, x in batch.iterrows()]
    # embed text
    embeds = embed.embed_documents(texts)
    # get metadata to store in Pinecone
    metadata = [
        {"text": x["chunk"], "source": x["source"], "title": x["title"]}
        for i, x in batch.iterrows()
    ]
    # add to Pinecone
    index.upsert(vectors=zip(ids, embeds, metadata, strict=False))
```

Create a tool for our agent to use when searching for ArXiv papers:

```python
from langchain.agents import tool


@tool
def arxiv_search(query: str) -> str:
    """Use this tool when answering questions about AI, machine learning, data
    science, or other technical questions that may be answered using arXiv
    papers.
    """
    # create query vector
    xq = embed.embed_query(query)
    # perform search
    out = index.query(vector=xq, top_k=5, include_metadata=True)
    # reformat results into string
    results_str = "\n\n".join([x["metadata"]["text"] for x in out["matches"]])
    return results_str


tools = [arxiv_search]
```

When this tool is used by our agent it will execute it like so:

```python
print(arxiv_search.run(tool_input={"query": "can you tell me about llama 2?"}))
```

## Defining XML Agent

The XML agent is built primarily to support Anthropic models. Anthropic models have been trained to use XML tags like `<input>{some input}</input` or when using a tool they use:

```
<tool>{tool name}</tool>
<tool_input>{tool input}</tool_input>
```

This is much different to the format produced by typical ReAct agents, which is not as well supported by Anthropic models.

To create an XML agent we need a `prompt`, `llm`, and list of `tools`. We can download a prebuilt prompt for conversational XML agents from LangChain hub.

```python
from langchain import hub

prompt = hub.pull("hwchase17/xml-agent-convo")
prompt
```

We can see the XML format being used throughout the prompt when explaining to the LLM how it should use tools.

Next we initialize our connection to Anthropic, for this we need an [Claude API key](https://console.anthropic.com/).

```python
from langchain_anthropic import ChatAnthropic

# chat completion llm
llm = ChatAnthropic(
    ANTHROPIC_API_KEY=ANTHROPIC_API_KEY,
    model_name="claude-opus-4-1",  # change "opus" -> "sonnet" for speed
    temperature=0.0,
)
```

When the agent is run we will provide it with a single `input` — this is the input text from a user. However, within the agent logic an *agent_scratchpad* object will be passed too, which will include tool information. To feed this information into our LLM we will need to transform it into the XML format described above, we define the `convert_intermediate_steps` function to handle that.

```python
def convert_intermediate_steps(intermediate_steps):
    log = ""
    for action, observation in intermediate_steps:
        log += (
            f"<tool>{action.tool}</tool><tool_input>{action.tool_input}"
            f"</tool_input><observation>{observation}</observation>"
        )
    return log
```

We must also parse the tools into a string containing `tool_name: tool_description` — we handle that with the `convert_tools` function.

```python
def convert_tools(tools):
    return "\n".join([f"{tool.name}: {tool.description}" for tool in tools])
```

With everything ready we can go ahead and initialize our agent object using [**L**ang**C**hain **E**xpression **L**anguage (LCEL)](https://www.pinecone.io/learn/series/langchain/langchain-expression-language/). We add instructions for when the LLM should _stop_ generating with `llm.bind(stop=[...])` and finally we parse the output from the agent using an `XMLAgentOutputParser` object.

```python
from langchain.agents.output_parsers import XMLAgentOutputParser

agent = (
    {
        "input": lambda x: x["input"],
        # without "chat_history", tool usage has no context of prev interactions
        "chat_history": lambda x: x["chat_history"],
        "agent_scratchpad": lambda x: convert_intermediate_steps(x["intermediate_steps"]),
    }
    | prompt.partial(tools=convert_tools(tools))
    | llm.bind(stop=["</tool_input>", "</final_answer>"])
    | XMLAgentOutputParser()
)
```

With our `agent` object initialized we pass it to an `AgentExecutor` object alongside our original `tools` list:

```python
from langchain.agents import AgentExecutor

agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True)
```

Now we can use the agent via the `invoke` method:

```python
user_msg = "can you tell me about llama 2?"

out = agent_executor.invoke({"input": user_msg, "chat_history": ""})

print(out["output"])
```

That looks pretty good, but right now our agent is _stateless_ — making it hard to have a conversation with. We can give it memory in many different ways, but one the easiest ways to do so is to use `ConversationBufferWindowMemory`.

```python
from langchain.chains.conversation.memory import ConversationBufferWindowMemory

# conversational memory
conversational_memory = ConversationBufferWindowMemory(
    memory_key="chat_history", k=5, return_messages=True
)
```

We haven't attached our conversational memory to our agent — so the `conversational_memory` object will remain empty:

```python
conversational_memory.chat_memory.messages
```

We must manually add the interactions between ourselves and the agent to our memory.

```python
conversational_memory.chat_memory.add_user_message(user_msg)
conversational_memory.chat_memory.add_ai_message(out["output"])

conversational_memory.chat_memory.messages
```

Now we can see that _two_ messages have been added, our `HumanMessage` the agent's `AIMessage` response. Unfortunately, we cannot send these messages to our XML agent directly. Instead, we need to pass a string in the format:

```
Human: {human message}
AI: {AI message}
```

Let's write a quick `memory2str` helper function to handle this for us:

```python
from langchain_core.messages.human import HumanMessage


def memory2str(memory: ConversationBufferWindowMemory):
    messages = memory.chat_memory.messages
    memory_list = [
        f"Human: {mem.content}" if isinstance(mem, HumanMessage) else f"AI: {mem.content}"
        for mem in messages
    ]
    memory_str = "\n".join(memory_list)
    return memory_str
```

```python
print(memory2str(conversational_memory))
```

Now let's put together another helper function called `chat` to help us handle the _state_ part of our agent.

```python
def chat(text: str):
    out = agent_executor.invoke({"input": text, "chat_history": memory2str(conversational_memory)})
    conversational_memory.chat_memory.add_user_message(text)
    conversational_memory.chat_memory.add_ai_message(out["output"])
    return out["output"]
```

Now we simply chat with our agent and it will remember the context of previous interactions.

```python
print(chat("was any red teaming done with the model?"))
```

We can ask follow up questions that miss key information but thanks to the conversational history the LLM understands the context and uses that to adjust the search query. For example we asked about `red teaming` but did not mention `llama 2` — Claude 3 added this context to the search query of `"llama 2 red teaming"` based on the chat history.

---
