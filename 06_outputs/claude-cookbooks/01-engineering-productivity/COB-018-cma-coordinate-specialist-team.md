---
id: COB-018
tier: A
category: "Engineering productivity"
kind: workflow
title: "Multiagent: coordinate a specialist team"
subtitle: "We'll use Claude Managed Agents and the multi-agent coordinator pattern to automate sales-proposal writing for a fictional company called Northstar, which sells a workflow-automation platform to mi..."
source: https://github.com/anthropics/claude-cookbooks/blob/main/managed_agents/CMA_coordinate_specialist_team.ipynb
upstream_name: "managed_agents/CMA_coordinate_specialist_team.ipynb"
upstream_folder: "managed_agents"
provider: anthropic-cookbooks
license: MIT
license_source: https://github.com/anthropics/claude-cookbooks/blob/main/LICENSE
ingested: 2026-05-27
type: case
version: v0.1
---
# Multiagent: coordinate a specialist team

> We'll use Claude Managed Agents and the multi-agent coordinator pattern to automate sales-proposal writing for a fictional company called Northstar, which sells a workflow-automation platform to mi...

We'll use Claude Managed Agents and the multi-agent coordinator pattern to automate sales-proposal writing for a fictional company called Northstar, which sells a workflow-automation platform to mid-market operations teams.

Right now, their reps build a tailored proposal for each prospect: research what companies in the prospect's segment typically prioritize, pull two relevant case studies from a library of a few hundred, model pricing from an internal rules sheet, and assemble it into a two-page document. Each step draws on a different source and a different kind of judgment.

We'll have a coordinator agent run three specialists to do this. A researcher uses web search to find what's typical for the prospect's segment. A librarian reads the case-study library and picks the two best matches. A pricing modeler sees only the rules file and the seat count. The coordinator sequences them and writes the proposal.

## 1. Set up the client

First, let's install the SDK and set up the Anthropic client. The multiagent config and event types are part of the Managed Agents beta.

```python
%%capture
%pip install -q anthropic python-dotenv
```

```python
import os

import anthropic
from dotenv import load_dotenv

load_dotenv()

BETAS = ["managed-agents-2026-04-01"]
MODEL = os.environ.get("COOKBOOK_MODEL", "claude-opus-4-6")
client = anthropic.Anthropic()
```

## 2. Define three specialist subagents

Next, we'll create the three teammates. Each one gets its own system prompt, its own output shape, and only the tools it needs for its job. The researcher gets web search, the case-study picker can only read the local library, and the pricing modeler just sees `pricing_rules.md` and the seat count. Scoping tools per role keeps the pricer from pulling a competitor's number off the web and keeps the full case-study library out of the coordinator's context.

```python
def make_agent(name, description, system, tools):
    a = client.beta.agents.create(
        name=name,
        description=description,
        model=MODEL,
        system=system,
        tools=tools,
        betas=BETAS,
    )
    print(f"{name}: {a.id}")
    return a.id


prospect_researcher = make_agent(
    "prospect_researcher",
    "Researches what companies in a given industry segment and size tier typically prioritize.",
    """Given a prospect's industry and size, use web search to find:
- What companies in that segment typically list as strategic priorities
- Recent trends or pressures in that industry
- Common operational pain points at that scale
Return via send_to_parent: {"priorities": [...], "recent_moves": [...], "pain_points": [...], "sources": [...]}""",
    [
        {
            "type": "agent_toolset_20260401",
            "configs": [{"name": "web_search"}, {"name": "web_fetch"}],
        }
    ],
)

case_study_picker = make_agent(
    "case_study_picker",
    "Selects the two most relevant case studies from the library for a given prospect profile.",
    """The case study library is in /mnt/user-data/case_studies/. Each file is one customer story.
You will be given a prospect's industry, size, and top priorities. Read the library, score each study on relevance, and pick the two best matches.
Return via send_to_parent: {"picks": [{"file": ..., "customer": ..., "why_relevant": ...}, ...]}""",
    [{"type": "agent_toolset_20260401"}],
)

pricing_modeler = make_agent(
    "pricing_modeler",
    "Builds two or three pricing options for a prospect based on seat count and expected usage.",
    """Pricing rules are in /mnt/user-data/pricing_rules.md. Given a prospect's estimated seat count and usage tier, build:
- a conservative option (annual commit, lower per-seat)
- a flexible option (monthly, higher per-seat)
- if seat count > 500, an enterprise option with a platform fee
Show the first-year total for each. Return via send_to_parent: {"options": [{"name": ..., "structure": ..., "year_one_total": ...}, ...]}""",
    [{"type": "agent_toolset_20260401"}],
)
```

## 3. Give the team something to work with

The librarian needs a library to choose from. We'll give it seven short case studies across healthcare, manufacturing, logistics, retail, fintech, and public sector, so you can see it actually pick the two that fit our prospect.

```python
CASE_STUDIES = [
    {
        "slug": "stclair_health",
        "title": "St. Clair Health",
        "industry": "regional hospital network",
        "employees": 6200,
        "summary": """Challenge: credentialing and prior-auth workflows spread across 11 systems.
Result with Northstar: consolidated to 3 automated workflows; prior-auth turnaround down 58%; $1.9M annual labor savings.""",
    },
    {
        "slug": "blueridge_health_plan",
        "title": "BlueRidge Health Plan",
        "industry": "regional payer",
        "employees": 2800,
        "summary": """Challenge: claims-adjudication exceptions queued in email; 19% required manual rework.
Result with Northstar: exception routing automated end-to-end; rework rate down to 6%; 11-day faster average claim resolution.""",
    },
    {
        "slug": "calder_mfg",
        "title": "Calder Manufacturing",
        "industry": "industrial",
        "employees": 3100,
        "summary": """Challenge: purchase-order approvals averaging 9 days.
Result with Northstar: PO cycle time cut to 2.1 days; 14% reduction in maverick spend.""",
    },
    {
        "slug": "northwind",
        "title": "Northwind Logistics",
        "industry": "3PL",
        "employees": 4400,
        "summary": """Challenge: carrier-onboarding paperwork took 3 weeks per carrier.
Result with Northstar: onboarding down to 4 days; 22% more carriers activated in Q1.""",
    },
    {
        "slug": "harborview_retail",
        "title": "Harborview Retail Group",
        "industry": "specialty retail",
        "employees": 5600,
        "summary": """Challenge: store-level inventory exceptions handled by regional managers over Slack and spreadsheets.
Result with Northstar: exception triage automated across 140 stores; stockout incidents down 31%.""",
    },
    {
        "slug": "aperture_fintech",
        "title": "Aperture Payments",
        "industry": "fintech",
        "employees": 1900,
        "summary": """Challenge: KYC and merchant-onboarding reviews averaging 6 business days.
Result with Northstar: review SLA cut to 36 hours; onboarding throughput up 2.4x with the same team.""",
    },
    {
        "slug": "summit_county",
        "title": "Summit County Government",
        "industry": "public sector",
        "employees": 3700,
        "summary": """Challenge: building-permit applications routed through five departments by paper packet.
Result with Northstar: single digital intake with parallel department review; median permit time 41 to 17 days.""",
    },
]
```

### Product and pricing collateral

We'll also provide the product one-pager that the coordinator reads when writing the "How we help" section, and the pricing rules file that the modeler uses to build options.

```python
PRODUCT = """# Northstar Platform — One-Pager
Northstar is a workflow automation platform for mid-market operations teams.
Core capabilities: visual process builder, 200+ SaaS connectors, role-based approvals, SOC 2 Type II.
Typical results: 40-60% reduction in manual ticket handling, 3-week time-to-first-workflow."""

PRICING = """# Pricing Rules (internal)
- Per-seat list: $65/mo (monthly) or $52/mo (annual commit).
- Usage tiers: light = 1.0x, standard = 1.15x, heavy = 1.30x multiplier on per-seat.
- Enterprise (>500 seats): add $48,000/yr platform fee, per-seat drops to $44/mo annual.
- All options include onboarding; enterprise includes a named CSM."""
```

### Wire up the coordinator and start a session

Now let's create an environment, upload the nine files, and create the coordinator with its `multiagent` roster of three specialists. Each entry is a full agent with its own model, prompt, and toolset, so you could mix model tiers per role.

```python
env = client.beta.environments.create(
    name="proposal-meridian",
    config={"type": "anthropic_cloud", "networking": {"type": "unrestricted"}},
)

resources = []


def mount(path, content):
    f = client.beta.files.upload(
        file=(os.path.basename(path), content.encode(), "text/plain")
    )
    resources.append({"type": "file", "file_id": f.id, "mount_path": path})


for cs in CASE_STUDIES:
    body = f"# {cs['title']} ({cs['industry']}, {cs['employees']:,} employees)\n{cs['summary']}"
    mount(f"/mnt/user-data/case_studies/{cs['slug']}.md", body)
mount("/mnt/user-data/product_one_pager.md", PRODUCT)
mount("/mnt/user-data/pricing_rules.md", PRICING)

coordinator = client.beta.agents.create(
    name="Proposal Writer",
    model=MODEL,
    system="""You assemble tailored sales proposals.
Given a prospect name and basic profile:
1. Send the prospect's industry and size to prospect_researcher.
2. Send the prospect's industry, size, and (once the researcher reports back) their priorities to case_study_picker.
3. Send the seat count and usage tier to pricing_modeler.
4. Read /mnt/user-data/product_one_pager.md, then write /mnt/session/outputs/proposal.md with sections:
   Executive summary (tied to their priorities), How we help (from the one-pager),
   Proof (the two case studies), Investment (the pricing options), Next steps.
Keep it to two pages.""",
    tools=[{"type": "agent_toolset_20260401"}],
    multiagent={
        "type": "coordinator",
        "agents": [prospect_researcher, case_study_picker, pricing_modeler],
    },
    betas=BETAS,
)

session = client.beta.sessions.create(
    agent={"type": "agent", "id": coordinator.id, "version": coordinator.version},
    environment_id=env.id,
    resources=resources,
    title="Proposal: Meridian Health",
    betas=BETAS,
)
print(f"Session {session.id} ready with {len(resources)} files mounted")
```

## 4. Kick off the proposal

Let's send the prospect profile and watch the coordinator work. It will start the researcher and the pricing modeler in parallel, then run the case-study picker once the researcher's findings come back, since the picker needs those priorities to score relevance.

```python
PROSPECT = {
    "name": "Meridian Health",
    "industry": "regional healthcare system",
    "employees": 8500,
    "estimated_seats": 600,
    "usage_tier": "heavy",
}

client.beta.sessions.events.send(
    session.id,
    betas=BETAS,
    events=[
        {
            "type": "user.message",
            "content": [
                {
                    "type": "text",
                    "text": f"Build a proposal for {PROSPECT['name']}, a {PROSPECT['industry']} with "
                    f"~{PROSPECT['employees']} employees. Estimate {PROSPECT['estimated_seats']} seats "
                    f"at {PROSPECT['usage_tier']} usage. Write to /mnt/session/outputs/proposal.md.",
                }
            ],
        }
    ],
)

with client.beta.sessions.events.stream(session.id, betas=BETAS) as stream:
    for ev in stream:
        if ev.type == "session.thread_created":
            print(f"[spawn] {ev.agent_name}")
        elif ev.type == "agent.thread_message_received":
            print(f"[report] {ev.from_agent_name} returned")
        elif ev.type == "session.status_idle":
            print("[done]")
            break
```

### What each teammate sent back

Before we look at the assembled proposal, let's print the three raw `send_to_parent` payloads. Each subagent ran in its own context with only its own tools, so the three reports look quite different from one another.

```python
def text_of(content):
    return "".join(b.text for b in content if b.type == "text")


for ev in client.beta.sessions.events.list(session.id, limit=1000, betas=BETAS):
    if ev.type == "agent.thread_message_received":
        body = text_of(ev.content)
        print(f"━━━ send_to_parent from {ev.from_agent_name} ({len(body)} chars) ━━━")
        print(body[:1200] + (f"\n…[{len(body) - 1200} more chars]" if len(body) > 1200 else ""))
        print()
```

## 5. Read the proposal

Finally, let's pull the assembled proposal. The coordinator wrote it to `proposal.md` with the `write` tool, so we'll find that event in the log and look at the sections it produced. Print `proposal` itself if you want to read the full document.

```python
proposal = ""
for ev in client.beta.sessions.events.list(session.id, limit=1000, betas=BETAS):
    if (
        ev.type == "agent.tool_use"
        and ev.name == "write"
        and ev.input["file_path"].endswith("proposal.md")
    ):
        proposal = ev.input["content"]
        break

# Show the section structure rather than the full proposal.
for line in proposal.splitlines():
    if line.startswith("#"):
        print(line)
```

## Why three subagents instead of one

A single agent with all three tools could write this proposal, so why split it up? Scoping each role to its own tools means the pricing modeler can't pull a competitor's list price off the web, because it only has the rules file. The case-study picker reads seven files here, but in production it would read hundreds, and that volume stays in the subagent's context instead of the coordinator's. And the coordinator gets to decide the order and the hand-offs without doing any of the specialist work itself.

For more on multi-agent coordination, see the [Managed Agents documentation](https://platform.claude.com/docs/en/managed-agents/multi-agent).
