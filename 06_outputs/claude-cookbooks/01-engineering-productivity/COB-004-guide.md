---
id: COB-004
tier: A
category: "Engineering productivity"
kind: workflow
title: "Retrieval Augmented Generation"
subtitle: "Claude excels at a wide range of tasks, but it may struggle with queries specific to your unique business context."
source: https://github.com/anthropics/claude-cookbooks/blob/main/capabilities/retrieval_augmented_generation/guide.ipynb
upstream_name: "capabilities/retrieval_augmented_generation/guide.ipynb"
upstream_folder: "capabilities"
provider: anthropic-cookbooks
license: MIT
license_source: https://github.com/anthropics/claude-cookbooks/blob/main/LICENSE
ingested: 2026-05-27
type: case
version: v0.1
---
# Retrieval Augmented Generation

> Claude excels at a wide range of tasks, but it may struggle with queries specific to your unique business context.

Claude excels at a wide range of tasks, but it may struggle with queries specific to your unique business context. This is where Retrieval Augmented Generation (RAG) becomes invaluable. RAG enables Claude to leverage your internal knowledge bases or customer support documents, significantly enhancing its ability to answer domain-specific questions. Enterprises are increasingly building RAG applications to improve workflows in customer support, Q&A over internal company documents, financial & legal analysis, and much more.

In this guide, we'll demonstrate how to build and optimize a RAG system using the Claude Documentation as our knowledge base. We'll walk you through:

1) Setting up a basic RAG system using an in-memory vector database and embeddings from [Voyage AI](https://www.voyageai.com/).

2) Building a robust evaluation suite. We'll go beyond 'vibes' based evals and show you how to measure the retrieval pipeine & end to end performance independently.

3) Implementing advanced techniques to improve RAG including summary indexing and re-ranking with Claude.

Through a series of targeted improvements, we achieved significant performance gains on the following metrics compared to a basic RAG pipeline (we'll explain what all these metrics *mean* in a bit)

- Avg Precision: 0.43 --> 0.44
- Avg Recall: 0.66 --> 0.69
- Avg F1 Score: 0.52 --> 0.54
- Avg Mean Reciprocal Rank (MRR): 0.74 --> 0.87
- End-to-End Accuracy: 71% --> 81%

#### Note:

The evaluations in this cookbook are meant to mirror a production evaluation system, and you should keep in mind that they can take a while to run. Also of note: if you run the evaluations in full, you may come up against rate limits unless you are in [Tier 2 and above](https://docs.claude.com/en/api/rate-limits). Consider skipping the full end to end eval if you're trying to conserve token usage.

## Table of Contents

1) Setup

2) Level 1 - Basic RAG

3) Building an Evaluation System

4) Level 2 - Summary Indexing

5) Level 3 - Summary Indexing and Re-Ranking

## Setup

We'll need a few libraries, including:

1) `anthropic` - to interact with Claude

2) `voyageai` - to generate high quality embeddings

3) `pandas`, `numpy`, `matplotlib`, and `scikit-learn` for data manipulation and visualization


You'll also need API keys from [Anthropic](https://www.anthropic.com/) and [Voyage AI](https://www.voyageai.com/)

```python
## setup
!pip install anthropic
!pip install voyageai
!pip install pandas
!pip install numpy
!pip install matplotlib
!pip install seaborn
!pip install -U scikit-learn
```

```python
import os

os.environ["VOYAGE_API_KEY"] = "VOYAGE KEY HERE"
os.environ["ANTHROPIC_API_KEY"] = "ANTHROPIC KEY HERE"
```

```python
import os

import anthropic

client = anthropic.Anthropic(
    # This is the default and can be omitted
    api_key=os.getenv("ANTHROPIC_API_KEY"),
)
```

### Initialize a Vector DB Class

In this example, we're using an in-memory vector DB, but for a production application, you may want to use a hosted solution.

```python
import json
import os
import pickle

import numpy as np
import voyageai


class VectorDB:
    def __init__(self, name, api_key=None):
        if api_key is None:
            api_key = os.getenv("VOYAGE_API_KEY")
        self.client = voyageai.Client(api_key=api_key)
        self.name = name
        self.embeddings = []
        self.metadata = []
        self.query_cache = {}
        self.db_path = f"./data/{name}/vector_db.pkl"

    def load_data(self, data):
        if self.embeddings and self.metadata:
            print("Vector database is already loaded. Skipping data loading.")
            return
        if os.path.exists(self.db_path):
            print("Loading vector database from disk.")
            self.load_db()
            return

        texts = [f"Heading: {item['chunk_heading']}\n\n Chunk Text:{item['text']}" for item in data]
        self._embed_and_store(texts, data)
        self.save_db()
        print("Vector database loaded and saved.")

    def _embed_and_store(self, texts, data):
        batch_size = 128
        result = [
            self.client.embed(texts[i : i + batch_size], model="voyage-2").embeddings
            for i in range(0, len(texts), batch_size)
        ]
        self.embeddings = [embedding for batch in result for embedding in batch]
        self.metadata = data

    def search(self, query, k=5, similarity_threshold=0.75):
        if query in self.query_cache:
            query_embedding = self.query_cache[query]
        else:
            query_embedding = self.client.embed([query], model="voyage-2").embeddings[0]
            self.query_cache[query] = query_embedding

        if not self.embeddings:
            raise ValueError("No data loaded in the vector database.")

        similarities = np.dot(self.embeddings, query_embedding)
        top_indices = np.argsort(similarities)[::-1]
        top_examples = []

        for idx in top_indices:
            if similarities[idx] >= similarity_threshold:
                example = {
                    "metadata": self.metadata[idx],
                    "similarity": similarities[idx],
                }
                top_examples.append(example)

                if len(top_examples) >= k:
                    break
        self.save_db()
        return top_examples

    def save_db(self):
        data = {
            "embeddings": self.embeddings,
            "metadata": self.metadata,
            "query_cache": json.dumps(self.query_cache),
        }
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        with open(self.db_path, "wb") as file:
            pickle.dump(data, file)

    def load_db(self):
        if not os.path.exists(self.db_path):
            raise ValueError(
                "Vector database file not found. Use load_data to create a new database."
            )
        with open(self.db_path, "rb") as file:
            data = pickle.load(file)
        self.embeddings = data["embeddings"]
        self.metadata = data["metadata"]
        self.query_cache = json.loads(data["query_cache"])
```

## Level 1 - Basic RAG

To get started, we'll set up a basic RAG pipeline using a bare bones approach. This is sometimes called 'Naive RAG' by many in the industry. A basic RAG pipeline includes the following 3 steps:

1) Chunk documents by heading - containing only the content from each subheading

2) Embed each document

3) Use Cosine similarity to retrieve documents in order to answer query

```python
import json
import logging
import xml.etree.ElementTree as ET  # noqa: S314
from collections.abc import Callable
from typing import Any

import matplotlib.pyplot as plt
from tqdm import tqdm

# Load the evaluation dataset
with open("evaluation/docs_evaluation_dataset.json") as f:
    eval_data = json.load(f)

# Load the Claude Documentation
with open("data/anthropic_docs.json") as f:
    anthropic_docs = json.load(f)

# Initialize the VectorDB
db = VectorDB("anthropic_docs")
db.load_data(anthropic_docs)


def retrieve_base(query, db):
    results = db.search(query, k=3)
    context = ""
    for result in results:
        chunk = result["metadata"]
        context += f"\n{chunk['text']}\n"
    return results, context


def answer_query_base(query, db):
    documents, context = retrieve_base(query, db)
    prompt = f"""
    You have been tasked with helping us to answer the following query:
    <query>
    {query}
    </query>
    You have access to the following documents which are meant to provide context as you answer the query:
    <documents>
    {context}
    </documents>
    Please remain faithful to the underlying context, and only deviate from it if you are 100% sure that you know the answer already.
    Answer the question now, and avoid providing preamble such as 'Here is the answer', etc
    """
    response = client.messages.create(
        model="claude-haiku-4-5",
        max_tokens=2500,
        messages=[{"role": "user", "content": prompt}],
        temperature=0,
    )
    return response.content[0].text
```

## Eval Setup

When evaluating RAG applications, it's critical to evaluate the performance of the retrieval system and end to end system separately.

We synthetically generated an evaluation dataset consisting of 100 samples which include the following:
- A question
- Chunks from our docs which are relevant to that question. This is what we expect our retrieval system to retrieve when the question is asked
- A correct answer to the question.

This is a relatively challenging dataset. Some of our questions require synthesis between more than one chunk in order to be answered correctly, so it's important that our system can load in more than one chunk at a time. You can inspect the dataset by opening `evaluation/docs_evaluation_dataset.json`

Run the next cell to see a preview of the dataset

```python
# previewing our eval dataset
import json


def preview_json(file_path, num_items=3):
    try:
        with open(file_path) as file:
            data = json.load(file)

        if isinstance(data, list):
            preview_data = data[:num_items]
        elif isinstance(data, dict):
            preview_data = dict(list(data.items())[:num_items])
        else:
            print(f"Unexpected data type: {type(data)}. Cannot preview.")
            return

        print(f"Preview of the first {num_items} items from {file_path}:")
        print(json.dumps(preview_data, indent=2))
        print(f"\nTotal number of items: {len(data)}")

    except FileNotFoundError:
        print(f"File not found: {file_path}")
    except json.JSONDecodeError:
        print(f"Invalid JSON in file: {file_path}")
    except Exception as e:
        print(f"An error occurred: {str(e)}")


preview_json("evaluation/docs_evaluation_dataset.json")
```

# Metric Definitions
We'll evaluate our system based on 5 key metrics: Precision, Recall, F1 Score, Mean Reciprocal Rank (MRR), and End-to-End Accuracy.

## Retrieval Metrics:

### Precision
Precision represents the proportion of retrieved chunks that are actually relevant. It answers the question: "Of the chunks we retrieved, how many were correct?"

Key points:
- High precision indicates an efficient system with few false positives.
- Low precision suggests many irrelevant chunks are being retrieved.
- Our system retrieves a minimum of 3 chunks per query, which may affect precision scores.

Formula:
$$
\text{Precision} = \frac{\text{True Positives}}{\text{Total Retrieved}} = \frac{|\text{Retrieved} \cap \text{Correct}|}{|\text{Retrieved}|}
$$

### Recall
Recall measures the completeness of our retrieval system. It answers the question: "Of all the correct chunks that exist, how many did we manage to retrieve?"

Key points:
- High recall indicates comprehensive coverage of necessary information.
- Low recall suggests important chunks are being missed.
- Recall is crucial for ensuring the LLM has access to all needed information.

Formula:
$$
\text{Recall} = \frac{\text{True Positives}}{\text{Total Correct}} = \frac{|\text{Retrieved} \cap \text{Correct}|}{|\text{Correct}|}
$$

### F1 Score
The F1 score provides a balanced measure between precision and recall. It's particularly useful when you need a single metric to evaluate system performance, especially with uneven class distributions.

Key points:
- F1 score ranges from 0 to 1, with 1 representing perfect precision and recall.
- It's the harmonic mean of precision and recall, tending towards the lower of the two values.
- Useful in scenarios where both false positives and false negatives are important.

Formula:
$$
\text{F1 Score} = 2 \times \frac{\text{Precision} \times \text{Recall}}{\text{Precision} + \text{Recall}}
$$

Interpreting F1 score:
- An F1 score of 1.0 indicates perfect precision and recall.
- An F1 score of 0.0 indicates the worst performance.
- Generally, the higher the F1 score, the better the overall performance.

### Balancing Precision, Recall, and F1 Score:
- There's often a trade-off between precision and recall.
- Our system's minimum chunk retrieval favors recall over precision.
- The optimal balance depends on the specific use case.
- In many RAG systems, high recall is often prioritized, as LLMs can filter out less relevant information during generation.

### Mean Reciprocal Rank (MRR) @k
MRR measures how well our system ranks relevant information. It helps us understand how quickly a user would find what they're looking for if they started from the top of our retrieved results.

Key points:
- MRR ranges from 0 to 1, where 1 is perfect (correct answer always first).
- It only considers the rank of the first correct result for each query.
- Higher MRR indicates better ranking of relevant information.

Formula:
$$
\text{MRR} = \frac{1}{|Q|} \sum_{i=1}^{|Q|} \frac{1}{\text{rank}_i}
$$

Where:
- |Q| is the total number of queries
- rank_i is the position of the first relevant item for the i-th query

## End to End Metrics:

### End to End Accuracy
We use an LLM-as-judge (Claude 3.5 Sonnet) to evaluate whether the generated answer is correct based on the question and ground truth answer.

Formula:
$$
\text{End to End Accuracy} = \frac{\text{Number of Correct Answers}}{\text{Total Number of Questions}}
$$

This metric evaluates the entire pipeline, from retrieval to answer generation.

## Defining Our Metric Calculation Functions

```python
def calculate_mrr(retrieved_links: list[str], correct_links: set[str]) -> float:
    for i, link in enumerate(retrieved_links, 1):
        if link in correct_links:
            return 1 / i
    return 0


def evaluate_retrieval(
    retrieval_function: Callable, evaluation_data: list[dict[str, Any]], db: Any
) -> tuple[float, float, float, float, list[float], list[float], list[float]]:
    precisions = []
    recalls = []
    mrrs = []

    for i, item in enumerate(tqdm(evaluation_data, desc="Evaluating Retrieval")):
        try:
            retrieved_chunks, _ = retrieval_function(item["question"], db)
            retrieved_links = [
                chunk["metadata"].get("chunk_link", chunk["metadata"].get("url", ""))
                for chunk in retrieved_chunks
            ]
        except Exception as e:
            logging.error(f"Error in retrieval function: {e}")
            continue

        correct_links = set(item["correct_chunks"])

        true_positives = len(set(retrieved_links) & correct_links)
        precision = true_positives / len(retrieved_links) if retrieved_links else 0
        recall = true_positives / len(correct_links) if correct_links else 0
        mrr = calculate_mrr(retrieved_links, correct_links)

        precisions.append(precision)
        recalls.append(recall)
        mrrs.append(mrr)

        if (i + 1) % 10 == 0:
            print(
                f"Processed {i + 1}/{len(evaluation_data)} items. Current Avg Precision: {sum(precisions) / len(precisions):.4f}, Avg Recall: {sum(recalls) / len(recalls):.4f}, Avg MRR: {sum(mrrs) / len(mrrs):.4f}"
            )

    avg_precision = sum(precisions) / len(precisions) if precisions else 0
    avg_recall = sum(recalls) / len(recalls) if recalls else 0
    avg_mrr = sum(mrrs) / len(mrrs) if mrrs else 0
    f1 = (
        2 * (avg_precision * avg_recall) / (avg_precision + avg_recall)
        if (avg_precision + avg_recall) > 0
        else 0
    )

    return avg_precision, avg_recall, avg_mrr, f1, precisions, recalls, mrrs


def evaluate_end_to_end(answer_query_function, db, eval_data):
    correct_answers = 0
    results = []
    total_questions = len(eval_data)

    for i, item in enumerate(tqdm(eval_data, desc="Evaluating End-to-End")):
        query = item["question"]
        correct_answer = item["correct_answer"]
        generated_answer = answer_query_function(query, db)

        prompt = f"""
        You are an AI assistant tasked with evaluating the correctness of answers to questions about Anthropic's documentation.

        Question: {query}

        Correct Answer: {correct_answer}

        Generated Answer: {generated_answer}

        Is the Generated Answer correct based on the Correct Answer? You should pay attention to the substance of the answer, and ignore minute details that may differ.

        Small differences or changes in wording don't matter. If the generated answer and correct answer are saying essentially the same thing then that generated answer should be marked correct.

        However, if there is any critical piece of information which is missing from the generated answer in comparison to the correct answer, then we should mark this as incorrect.

        Finally, if there are any direct contradictions between the correect answer and generated answer, we should deem the generated answer to be incorrect.

        Respond in the following XML format:
        <evaluation>
        <content>
        <explanation>Your explanation here</explanation>
        <is_correct>true/false</is_correct>
        </content>
        </evaluation>
        """

        try:
            response = client.messages.create(
                model="claude-sonnet-4-6",
                max_tokens=1500,
                messages=[
                    {"role": "user", "content": prompt},
                    {"role": "assistant", "content": "<evaluation>"},
                ],
                temperature=0,
                stop_sequences=["</evaluation>"],
            )

            response_text = response.content[0].text
            print(response_text)
            # Parse XML from trusted LLM response
            evaluation = ET.fromstring(response_text)  # noqa: S314
            is_correct = evaluation.find("is_correct").text.lower() == "true"

            if is_correct:
                correct_answers += 1
            results.append(is_correct)

            logging.info(f"Question {i + 1}/{total_questions}: {query}")
            logging.info(f"Correct: {is_correct}")
            logging.info("---")

        except ET.ParseError as e:
            logging.error(f"XML parsing error: {e}")
            is_correct = "true" in response_text.lower()
            results.append(is_correct)
        except Exception as e:
            logging.error(f"Unexpected error: {e}")
            results.append(False)

        if (i + 1) % 10 == 0:
            current_accuracy = correct_answers / (i + 1)
            print(
                f"Processed {i + 1}/{total_questions} questions. Current Accuracy: {current_accuracy:.4f}"
            )
        # time.sleep(2)
    accuracy = correct_answers / total_questions
    return accuracy, results
```

## Helper Function to Plot Performance

```python
import json
import os

import matplotlib.pyplot as plt
import seaborn as sns


def plot_performance(results_folder="evaluation/json_results", include_methods=None, colors=None):
    # Set default colors
    default_colors = ["skyblue", "lightgreen", "salmon"]
    if colors is None:
        colors = default_colors

    # Load JSON files
    results = []
    for filename in os.listdir(results_folder):
        if filename.endswith(".json"):
            file_path = os.path.join(results_folder, filename)
            with open(file_path) as f:
                try:
                    data = json.load(f)
                    if "name" not in data:
                        print(f"Warning: {filename} does not contain a 'name' field. Skipping.")
                        continue
                    if include_methods is None or data["name"] in include_methods:
                        results.append(data)
                except json.JSONDecodeError:
                    print(f"Warning: {filename} is not a valid JSON file. Skipping.")

    if not results:
        print("No JSON files found with matching 'name' fields.")
        return

    # Validate data
    required_metrics = [
        "average_precision",
        "average_recall",
        "average_f1",
        "average_mrr",
        "end_to_end_accuracy",
    ]
    for result in results.copy():
        if not all(metric in result for metric in required_metrics):
            print(f"Warning: {result['name']} is missing some required metrics. Skipping.")
            results.remove(result)

    if not results:
        print("No valid results remaining after validation.")
        return

    # Sort results based on end-to-end accuracy
    results.sort(key=lambda x: x["end_to_end_accuracy"])

    # Prepare data for plotting
    methods = [result["name"] for result in results]
    metrics = required_metrics

    # Set up the plot
    plt.figure(figsize=(14, 6))
    sns.set_style("whitegrid")

    x = range(len(metrics))
    width = 0.8 / len(results)

    # Create color palette
    num_methods = len(methods)
    color_palette = colors[:num_methods] + sns.color_palette("husl", num_methods - len(colors))

    # Plot bars for each method
    for i, (result, color) in enumerate(zip(results, color_palette, strict=False)):
        values = [result[metric] for metric in metrics]
        offset = (i - len(results) / 2 + 0.5) * width
        bars = plt.bar([xi + offset for xi in x], values, width, label=result["name"], color=color)

        # Add value labels on the bars
        for bar in bars:
            height = bar.get_height()
            plt.text(
                bar.get_x() + bar.get_width() / 2.0,
                height,
                f"{height:.2f}",
                ha="center",
                va="bottom",
                fontsize=8,
            )

    # Customize the plot
    plt.xlabel("Metrics", fontsize=12)
    plt.ylabel("Values", fontsize=12)
    plt.title("RAG Performance Metrics (Sorted by End-to-End Accuracy)", fontsize=16)
    plt.xticks(x, metrics, rotation=45, ha="right")
    plt.legend(title="Methods", bbox_to_anchor=(1.05, 1), loc="upper left")
    plt.ylim(0, 1)

    plt.tight_layout()
    plt.show()
```

## Evaluating Our Base Case

```python
import pandas as pd

avg_precision, avg_recall, avg_mrr, f1, precisions, recalls, mrrs = evaluate_retrieval(
    retrieve_base, eval_data, db
)
e2e_accuracy, e2e_results = evaluate_end_to_end(answer_query_base, db, eval_data)

# Create a DataFrame
df = pd.DataFrame(
    {
        "question": [item["question"] for item in eval_data],
        "retrieval_precision": precisions,
        "retrieval_recall": recalls,
        "retrieval_mrr": mrrs,
        "e2e_correct": e2e_results,
    }
)

# Save to CSV
df.to_csv("evaluation/csvs/evaluation_results_detailed.csv", index=False)
print("Detailed results saved to evaluation/csvs/evaluation_results_one.csv")

# Print the results
print(f"Average Precision: {avg_precision:.4f}")
print(f"Average Recall: {avg_recall:.4f}")
print(f"Average MRR: {avg_mrr:.4f}")
print(f"Average F1: {f1:.4f}")
print(f"End-to-End Accuracy: {e2e_accuracy:.4f}")

# Save the results to a file
with open("evaluation/json_results/evaluation_results_one.json", "w") as f:
    json.dump(
        {
            "name": "Basic RAG",
            "average_precision": avg_precision,
            "average_recall": avg_recall,
            "average_f1": f1,
            "average_mrr": avg_mrr,
            "end_to_end_accuracy": e2e_accuracy,
        },
        f,
        indent=2,
    )

print(
    "Evaluation complete. Results saved to evaluation_results_one.json, evaluation_results_one.csv"
)
```

```python
# let's visualize our performance
plot_performance("evaluation/json_results", ["Basic RAG"], colors=["skyblue"])
```

# Level 2: Document Summarization for Enhanced Retrieval

In this section, we'll implement an improved approach to our retrieval system by incorporating document summaries. Instead of embedding chunks directly from the documents, we'll create a concise summary for each chunk and use this summary along with the original content in our embedding process.

This approach aims to capture the essence of each document chunk more effectively, potentially leading to improved retrieval performance.

Key steps in this process:
1. We load the original document chunks.
2. For each chunk, we generate a 2-3 sentence summary using Claude.
3. We store both the original content and the summary for each chunk in a new json file: `data/anthropic_summary_indexed_docs.json`

This summary-enhanced approach is designed to provide more context during the embedding and retrieval phases, potentially improving the system's ability to understand and match the most relevant documents to user queries.

## Generating the Summaries and Storing Them

```python
import json

from tqdm import tqdm


def generate_summaries(input_file, output_file):
    # Load the original documents
    with open(input_file) as f:
        docs = json.load(f)

    # Prepare the context about the overall knowledge base
    knowledge_base_context = "This is documentation for Anthropic's, a frontier AI lab building Claude, an LLM that excels at a variety of general purpose tasks. These docs contain model details and documentation on Anthropic's APIs."

    summarized_docs = []

    for doc in tqdm(docs, desc="Generating summaries"):
        prompt = f"""
        You are tasked with creating a short summary of the following content from Anthropic's documentation.

        Context about the knowledge base:
        {knowledge_base_context}

        Content to summarize:
        Heading: {doc["chunk_heading"]}
        {doc["text"]}

        Please provide a brief summary of the above content in 2-3 sentences. The summary should capture the key points and be concise. We will be using it as a key part of our search pipeline when answering user queries about this content.

        Avoid using any preamble whatsoever in your response. Statements such as 'here is the summary' or 'the summary is as follows' are prohibited. You should get straight into the summary itself and be concise. Every word matters.
        """

        response = client.messages.create(
            model="claude-haiku-4-5",
            max_tokens=150,
            messages=[{"role": "user", "content": prompt}],
            temperature=0,
        )

        summary = response.content[0].text.strip()

        summarized_doc = {
            "chunk_link": doc["chunk_link"],
            "chunk_heading": doc["chunk_heading"],
            "text": doc["text"],
            "summary": summary,
        }
        summarized_docs.append(summarized_doc)

    # Save the summarized documents to a new JSON file
    with open(output_file, "w") as f:
        json.dump(summarized_docs, f, indent=2)

    print(f"Summaries generated and saved to {output_file}")


# generate_summaries('data/anthropic_docs.json', 'data/anthropic_summary_indexed_docs.json')
```

# Summary-Indexed Vector Database Creation

Here, we're creating a new vector database that incorporates our summary-enhanced document chunks. This approach combines the original text, the chunk heading, and the newly generated summary into a single text for embedding.

Key features of this process:
1. We create embeddings for the combined text (heading + summary + original content) using the Voyage AI API.
2. The embeddings and full metadata (including summaries) are stored in our vector database.
3. We implement caching mechanisms to improve efficiency in repeated queries.
4. The database is saved to disk for persistence and quick loading in future sessions.

This summary-indexed approach aims to create more informative embeddings, potentially leading to more accurate and contextually relevant document retrieval.

```python
import json
import os
import pickle

import numpy as np
import voyageai


class SummaryIndexedVectorDB:
    def __init__(self, name, api_key=None):
        if api_key is None:
            api_key = os.getenv("VOYAGE_API_KEY")
        self.client = voyageai.Client(api_key=api_key)
        self.name = name
        self.embeddings = []
        self.metadata = []
        self.query_cache = {}
        self.db_path = f"./data/{name}/summary_indexed_vector_db.pkl"

    def load_data(self, data_file):
        # Check if the vector database is already loaded
        if self.embeddings and self.metadata:
            print("Vector database is already loaded. Skipping data loading.")
            return
        # Check if vector_db.pkl exists
        if os.path.exists(self.db_path):
            print("Loading vector database from disk.")
            self.load_db()
            return

        with open(data_file) as f:
            data = json.load(f)

        texts = [
            f"{item['chunk_heading']}\n\n{item['text']}\n\n{item['summary']}" for item in data
        ]  # Embed Chunk Heading + Text + Summary Together
        # Embed more than 128 documents with a for loop
        batch_size = 128
        result = [
            self.client.embed(texts[i : i + batch_size], model="voyage-2").embeddings
            for i in range(0, len(texts), batch_size)
        ]

        # Flatten the embeddings
        self.embeddings = [embedding for batch in result for embedding in batch]
        self.metadata = data  # Store the entire item as metadata
        self.save_db()
        # Save the vector database to disk
        print("Vector database loaded and saved.")

    def search(self, query, k=3, similarity_threshold=0.75):
        query_embedding = None
        if query in self.query_cache:
            query_embedding = self.query_cache[query]
        else:
            query_embedding = self.client.embed([query], model="voyage-2").embeddings[0]
            self.query_cache[query] = query_embedding

        if not self.embeddings:
            raise ValueError("No data loaded in the vector database.")

        similarities = np.dot(self.embeddings, query_embedding)
        top_indices = np.argsort(similarities)[::-1]
        top_examples = []

        for idx in top_indices:
            if similarities[idx] >= similarity_threshold:
                example = {
                    "metadata": self.metadata[idx],
                    "similarity": similarities[idx],
                }
                top_examples.append(example)

                if len(top_examples) >= k:
                    break
        self.save_db()
        return top_examples

    def save_db(self):
        data = {
            "embeddings": self.embeddings,
            "metadata": self.metadata,
            "query_cache": json.dumps(self.query_cache),
        }

        # Ensure the directory exists
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)

        with open(self.db_path, "wb") as file:
            pickle.dump(data, file)

    def load_db(self):
        if not os.path.exists(self.db_path):
            raise ValueError(
                "Vector database file not found. Use load_data to create a new database."
            )

        with open(self.db_path, "rb") as file:
            data = pickle.load(file)

        self.embeddings = data["embeddings"]
        self.metadata = data["metadata"]
        self.query_cache = json.loads(data["query_cache"])
```

# Enhanced Retrieval Using Summary-Indexed Embeddings

In this section, we implement the retrieval process using our new summary-indexed vector database. This approach leverages the enhanced embeddings we created, which incorporate document summaries along with the original content.

Key aspects of this updated retrieval process:
1. We search the vector database using the query embedding, retrieving the top k most similar documents.
2. For each retrieved document, we include the chunk heading, summary, and full text in the context provided to the LLM.
3. This enriched context is then used to generate an answer to the user's query.

By including summaries in both the embedding and retrieval phases, we aim to provide the LLM with a more comprehensive and focused context. This could potentially lead to more accurate and relevant answers, as the LLM has access to both a concise overview (the summary) and the detailed information (the full text) for each relevant document chunk.

```python
def retrieve_level_two(query, db):
    results = db.search(query, k=3)
    context = ""
    for result in results:
        chunk = result["metadata"]
        context += f"\n <document> \n {chunk['chunk_heading']}\n\nText\n {chunk['text']} \n\nSummary: \n {chunk['summary']} \n </document> \n"  # show model all 3 items
    return results, context


def answer_query_level_two(query, db):
    documents, context = retrieve_base(query, db)
    prompt = f"""
    You have been tasked with helping us to answer the following query:
    <query>
    {query}
    </query>
    You have access to the following documents which are meant to provide context as you answer the query:
    <documents>
    {context}
    </documents>
    Please remain faithful to the underlying context, and only deviate from it if you are 100% sure that you know the answer already.
    Answer the question now, and avoid providing preamble such as 'Here is the answer', etc
    """
    response = client.messages.create(
        model="claude-haiku-4-5",
        max_tokens=2500,
        messages=[{"role": "user", "content": prompt}],
        temperature=0,
    )
    return response.content[0].text
```

```python
# Initialize the SummaryIndexedVectorDB
level_two_db = SummaryIndexedVectorDB("anthropic_docs_v2")
level_two_db.load_data("data/anthropic_summary_indexed_docs.json")

import pandas as pd

# Run the evaluations
avg_precision, avg_recall, avg_mrr, f1, precisions, recalls, mrrs = evaluate_retrieval(
    retrieve_level_two, eval_data, level_two_db
)
e2e_accuracy, e2e_results = evaluate_end_to_end(answer_query_level_two, level_two_db, eval_data)

# Create a DataFrame
df = pd.DataFrame(
    {
        "question": [item["question"] for item in eval_data],
        "retrieval_precision": precisions,
        "retrieval_recall": recalls,
        "retrieval_mrr": mrrs,
        "e2e_correct": e2e_results,
    }
)

# Save to CSV
df.to_csv("evaluation/csvs/evaluation_results_detailed_level_two.csv", index=False)
print("Detailed results saved to evaluation_results_detailed.csv")

# Print the results
print(f"Average Precision: {avg_precision:.4f}")
print(f"Average Recall: {avg_recall:.4f}")
print(f"Average MRR: {avg_mrr:.4f}")
print(f"Average F1: {f1:.4f}")
print(f"End-to-End Accuracy: {e2e_accuracy:.4f}")

# Save the results to a file
with open("evaluation/json_results/evaluation_results_level_two.json", "w") as f:
    json.dump(
        {
            "name": "Summary Indexing",
            "average_precision": avg_precision,
            "average_recall": avg_recall,
            "average_f1": f1,
            "average_mrr": avg_mrr,
            "end_to_end_accuracy": e2e_accuracy,
        },
        f,
        indent=2,
    )

print(
    "Evaluation complete. Results saved to evaluation_results_level_two.json, evaluation_results_detailed_level_two.csv"
)
```

## Evaluating This Method vs Basic RAG

```python
# visualizing our performance
plot_performance("evaluation/json_results", ["Basic RAG", "Summary Indexing"])
```

## Level 3 - Re-Ranking with Claude
In this final enhancement to our retrieval system, we introduce a reranking step to further improve the relevance of the retrieved documents. This approach leverages Claude's power to better understand the context and nuances of both the query and the retrieved documents.

The `rerank_results` function uses Claude to reassess and reorder the initially retrieved documents:
1. It presents Claude with the query and summaries of all retrieved documents.
2. Claude is asked to select and rank the most relevant documents.
3. The function parses Claude's response to get the reranked document indices.
4. It includes fallback mechanisms in case of errors or insufficient results.
5. Finally, it assigns descending relevance scores to the reranked results.

The `retrieve_advanced` function implements the new retrieval pipeline:
1. We initially retrieve more documents than needed (default 20, configurable via `initial_k`) from the vector database.
2. We then use the `rerank_results` function to refine this larger set down to the most relevant documents (default 3, configurable via `k`).
3. Finally, it generates a new context string from these reranked documents.

This process casts a wider net initially and then uses AI to focus on the most pertinent information. By combining vector-based retrieval with LLM reranking, this approach aims to provide more accurate and contextually appropriate responses to user queries.

Our evaluations show significant improvements:
- Accuracy increased from 78% in our previous system to 85%.
- Precision was improved by using our re-ranker to reduce the number of documents shown to the LLM.
- MRR (Mean Reciprocal Rank) was likely improved by asking Claude to rank the relevance of each document in order.

These improvements demonstrate the effectiveness of incorporating AI-powered reranking in our retrieval process.

```python
def rerank_results(query: str, results: list[dict], k: int = 5) -> list[dict]:
    # Prepare the summaries with their indices
    summaries = []
    print(len(results))

    for i, result in enumerate(results):
        summary = f"[{i}] Document Summary: {result['metadata']['summary']}"
        summaries.append(summary)
    joined_summaries = "\n\n".join(summaries)

    prompt = f"""
    Query: {query}
    You are about to be given a group of documents, each preceded by its index number in square brackets. Your task is to select the only {k} most relevant documents from the list to help us answer the query.

    <documents>
    {joined_summaries}
    </documents>

    Output only the indices of {k} most relevant documents in order of relevance, separated by commas, enclosed in XML tags here:
    <relevant_indices>put the numbers of your indices here, seeparted by commas</relevant_indices>
    """
    try:
        response = client.messages.create(
            model="claude-haiku-4-5",
            max_tokens=50,
            messages=[
                {"role": "user", "content": prompt},
                {"role": "assistant", "content": "<relevant_indices>"},
            ],
            temperature=0,
            stop_sequences=["</relevant_indices>"],
        )

        # Extract the indices from the response
        response_text = response.content[0].text.strip()
        indices_str = response_text
        relevant_indices = []
        for idx in indices_str.split(","):
            try:
                relevant_indices.append(int(idx.strip()))
            except ValueError:
                continue  # Skip invalid indices
        print(indices_str)
        print(relevant_indices)
        # If we didn't get enough valid indices, fall back to the top k by original order
        if len(relevant_indices) == 0:
            relevant_indices = list(range(min(k, len(results))))

        # Ensure we don't have out-of-range indices
        relevant_indices = [idx for idx in relevant_indices if idx < len(results)]

        # Return the reranked results
        reranked_results = [results[idx] for idx in relevant_indices[:k]]
        # Assign descending relevance scores
        for i, result in enumerate(reranked_results):
            result["relevance_score"] = (
                100 - i
            )  # Highest score is 100, decreasing by 1 for each rank

        return reranked_results

    except Exception as e:
        print(f"An error occurred during reranking: {str(e)}")
        # Fall back to returning the top k results without reranking
        return results[:k]


def retrieve_advanced(
    query: str, db: SummaryIndexedVectorDB, k: int = 3, initial_k: int = 20
) -> tuple[list[dict], str]:
    # Step 1: Get initial results
    initial_results = db.search(query, k=initial_k)

    # Step 2: Re-rank results
    reranked_results = rerank_results(query, initial_results, k=k)

    # Step 3: Generate new context string from re-ranked results
    new_context = ""
    for result in reranked_results:
        chunk = result["metadata"]
        new_context += (
            f"\n <document> \n {chunk['chunk_heading']}\n\n{chunk['text']} \n </document> \n"
        )

    return reranked_results, new_context


# The answer_query_advanced function remains unchanged
def answer_query_advanced(query: str, db: SummaryIndexedVectorDB):
    documents, context = retrieve_advanced(query, db)
    prompt = f"""
    You have been tasked with helping us to answer the following query:
    <query>
    {query}
    </query>
    You have access to the following documents which are meant to provide context as you answer the query:
    <documents>
    {context}
    </documents>
    Please remain faithful to the underlying context, and only deviate from it if you are 100% sure that you know the answer already.
    Answer the question now, and avoid providing preamble such as 'Here is the answer', etc
    """
    response = client.messages.create(
        model="claude-haiku-4-5",
        max_tokens=2500,
        messages=[{"role": "user", "content": prompt}],
        temperature=0,
    )
    return response.content[0].text
```

## Evaluation

```python
# Initialize the SummaryIndexedVectorDB
level_three_db = SummaryIndexedVectorDB("anthropic_docs_v3")
level_three_db.load_data("data/anthropic_summary_indexed_docs.json")

import pandas as pd

# Run the evaluations
avg_precision, avg_recall, avg_mrr, f1, precisions, recalls, mrrs = evaluate_retrieval(
    retrieve_advanced, eval_data, level_three_db
)
e2e_accuracy, e2e_results = evaluate_end_to_end(answer_query_advanced, level_two_db, eval_data)

# Create a DataFrame
df = pd.DataFrame(
    {
        "question": [item["question"] for item in eval_data],
        "retrieval_precision": precisions,
        "retrieval_recall": recalls,
        "retrieval_mrr": mrrs,
        "e2e_correct": e2e_results,
    }
)

# Save to CSV
df.to_csv("evaluation/csvs/evaluation_results_detailed_level_three.csv", index=False)
print("Detailed results saved to evaluation_results_detailed_level_three.csv")

# Plot the results
# Print the results
print(f"Average Precision: {avg_precision:.4f}")
print(f"Average Recall: {avg_recall:.4f}")
print(f"Average F1: {f1:.4f}")
print(f"Average Mean Reciprocal Rank: {avg_mrr:4f}")
print(f"End-to-End Accuracy: {e2e_accuracy:.4f}")

# Save the results to a file
with open("evaluation/json_results/evaluation_results_level_three.json", "w") as f:
    json.dump(
        {
            "name": "Summary Indexing + Re-Ranking",
            "average_precision": avg_precision,
            "average_recall": avg_recall,
            "average_f1": f1,
            "average_mrr": avg_mrr,
            "end_to_end_accuracy": e2e_accuracy,
        },
        f,
        indent=2,
    )

print(
    "Evaluation complete. Results saved to evaluation_results_level_three.json, evaluation_results_detailed_level_three.csv, and evaluation_results_level_three.png"
)
```

```python
# visualizing our performance
plot_performance(
    "evaluation/json_results",
    ["Basic RAG", "Summary Indexing", "Summary Indexing + Re-Ranking"],
    colors=["skyblue", "lightgreen", "salmon"],
)
```

## Evaluation - Going Deeper with Promptfoo

This guide has illustrated the importance of measuring prompt performance empirically when prompt engineering. You can read more about our empirical methodology to prompt engineering here. Using a Jupyter Notebook is a great way to start prompt engineering but as your datasets grow larger and your prompts more numerous it is important to leverage tooling that will scale with you.

In this section of the guide we will explore using Promptfoo an open source LLM evaluation toolkit. To get started head over to the ./evaluation directory and checkout the ./evaluation/README.md.

Promptfoo makes it very easy to build automated test suites that compare different models, hyperparameter choices, and prompts against one another. 

As an example, you can run the below cell to see the average performance of Haiku vs 3.5 Sonnet across all of our test cases.

```python
import json

import numpy as np
import pandas as pd

# Load the JSON file
with open("data/end_to_end_results.json") as f:
    data = json.load(f)

# Extract the results
results = data["results"]["results"]

# Create a DataFrame
df = pd.DataFrame(results)

# Extract provider, prompt, and score information
df["provider"] = df["provider"].apply(lambda x: x["label"] if isinstance(x, dict) else x)
df["prompt"] = df["prompt"].apply(lambda x: x["label"] if isinstance(x, dict) else x)


# Function to safely extract scores
def extract_score(x):
    if isinstance(x, dict) and "score" in x:
        return x["score"] * 100  # Convert to percentage
    return np.nan


df["score"] = df["gradingResult"].apply(extract_score)

# Group by provider and prompt, then calculate mean scores
result = df.groupby(["provider", "prompt"])["score"].mean().unstack()

# Fill NaN values with 0
result = result.fillna(0)

# Calculate the average score across all prompts for each provider
result["Average"] = result.mean(axis=1)

# Sort the result by the average score
result = result.sort_values(by="Average", ascending=False)

# Round the results to 2 decimal places
result = result.round(2)
# Calculate overall statistics
overall_average = result["Average"].mean()
overall_std = result["Average"].std()
best_provider = result["Average"].idxmax()
worst_provider = result["Average"].idxmin()

print("\nOverall Statistics:")
print(f"Best Performing Provider: {best_provider} ({result.loc[best_provider, 'Average']:.2f}%)")
print(f"Worst Performing Provider: {worst_provider} ({result.loc[worst_provider, 'Average']:.2f}%)")
```
