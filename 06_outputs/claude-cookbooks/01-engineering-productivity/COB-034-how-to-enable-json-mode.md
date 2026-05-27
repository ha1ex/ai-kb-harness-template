---
id: COB-034
tier: A
category: "Engineering productivity"
kind: workflow
title: "Prompting Claude for \"JSON Mode\""
subtitle: "Claude doesn't have a formal \"JSON Mode\" with constrained sampling."
source: https://github.com/anthropics/claude-cookbooks/blob/main/misc/how_to_enable_json_mode.ipynb
upstream_name: "misc/how_to_enable_json_mode.ipynb"
upstream_folder: "misc"
provider: anthropic-cookbooks
license: MIT
license_source: https://github.com/anthropics/claude-cookbooks/blob/main/LICENSE
ingested: 2026-05-27
type: case
version: v0.1
---
# Prompting Claude for "JSON Mode"

> Claude doesn't have a formal "JSON Mode" with constrained sampling.

# Prompting Claude for "JSON Mode"

Claude doesn't have a formal "JSON Mode" with constrained sampling. But not to worry -- you can still get reliable JSON from Claude! This recipe will show you how.

First, let's look at Claude's default behavior.

```python
%pip install anthropic
```

```python
import json
import re
from pprint import pprint

from anthropic import Anthropic
```

```python
client = Anthropic()
MODEL_NAME = "claude-opus-4-1"
```

```python
message = (
    client.messages.create(
        model=MODEL_NAME,
        max_tokens=1024,
        messages=[
            {
                "role": "user",
                "content": "Give me a JSON dict with names of famous athletes & their sports.",
            },
        ],
    )
    .content[0]
    .text
)
print(message)
```

Claude followed instructions and outputted a nice dictionary, which we can extract with code:

```python
def extract_json(response):
    json_start = response.index("{")
    json_end = response.rfind("}")
    return json.loads(response[json_start : json_end + 1])


extract_json(message)
```

But what if we want Claude to skip the preamble and go straight to the JSON? One simple way is to prefill Claude's response and include a "{" character.

```python
message = (
    client.messages.create(
        model=MODEL_NAME,
        max_tokens=1024,
        messages=[
            {
                "role": "user",
                "content": "Give me a JSON dict with names of famous athletes & their sports.",
            },
            {"role": "assistant", "content": "Here is the JSON requested:\n{"},
        ],
    )
    .content[0]
    .text
)
print(message)
```

Now all we have to do is add back the "{" that we prefilled and we can extract the JSON.

```python
output_json = json.loads("{" + message[: message.rfind("}") + 1])
output_json
```

For very long and complicated prompts, which contain multiple JSON outputs so that a string search for "{" and "}" don't do the trick, you can also have Claude output each JSON item in specified tags for future extraction.

```python
message = (
    client.messages.create(
        model=MODEL_NAME,
        max_tokens=1024,
        messages=[
            {
                "role": "user",
                "content": """Give me a JSON dict with the names of 5 famous athletes & their sports.
Put this dictionary in <athlete_sports> tags.

Then, for each athlete, output an additional JSON dictionary. In each of these additional dictionaries:
- Include two keys: the athlete's first name and last name.
- For the values, list three words that start with the same letter as that name.
Put each of these additional dictionaries in separate <athlete_name> tags.""",
            },
            {"role": "assistant", "content": "Here is the JSON requested:"},
        ],
    )
    .content[0]
    .text
)
print(message)
```

Now, we can use an extraction regex to get all the dictionaries.

```python
import re


def extract_between_tags(tag: str, string: str, strip: bool = False) -> list[str]:
    ext_list = re.findall(f"<{tag}>(.+?)</{tag}>", string, re.DOTALL)
    if strip:
        ext_list = [e.strip() for e in ext_list]
    return ext_list


athlete_sports_dict = json.loads(extract_between_tags("athlete_sports", message)[0])
athlete_name_dicts = [json.loads(d) for d in extract_between_tags("athlete_name", message)]
```

```python
pprint(athlete_sports_dict)
```

```python
pprint(athlete_name_dicts, width=1)
```

So to recap:

- You can use string parsing to extract the text between "```json" and "```" to get the JSON.
- You can remove preambles *before* the JSON via a partial Assistant message. (However, this removes the possibility of having Claude do "Chain of Thought" for increased intelligence before beginning to output the JSON.)
- You can get rid of text that comes *after* the JSON by using a stop sequence.
- You can instruct Claude to output JSON in XML tags to make it easy to collect afterward for more complex prompts.
