---
id: COB-079
tier: A
category: "Engineering productivity"
kind: workflow
title: "Threat Intelligence Enrichment Agent"
subtitle: "Security analysts spend hours manually pivoting across threat intelligence sources — querying VirusTotal for a file hash, checking AbuseIPDB for an IP, cross-referencing MITRE ATT&CK, then synthesi..."
source: https://github.com/anthropics/claude-cookbooks/blob/main/tool_use/threat_intel_enrichment_agent.ipynb
upstream_name: "tool_use/threat_intel_enrichment_agent.ipynb"
upstream_folder: "tool_use"
provider: anthropic-cookbooks
license: MIT
license_source: https://github.com/anthropics/claude-cookbooks/blob/main/LICENSE
ingested: 2026-05-27
type: case
version: v0.1
---
# Threat Intelligence Enrichment Agent

> Security analysts spend hours manually pivoting across threat intelligence sources — querying VirusTotal for a file hash, checking AbuseIPDB for an IP, cross-referencing MITRE ATT&CK, then synthesi...

Security analysts spend hours manually pivoting across threat intelligence sources — querying VirusTotal for a file hash, checking AbuseIPDB for an IP, cross-referencing MITRE ATT&CK, then synthesizing it all into a report. This cookbook shows how to build a Claude-powered agent that automates that entire workflow.

The agent takes raw Indicators of Compromise (IOCs) — IP addresses, file hashes, or domains — and uses Claude's tool-use capabilities to decide which intelligence sources to query, correlate findings across sources, and produce structured, analyst-ready threat reports. The tools in this example are simulated, but the architecture is designed so you can swap in real APIs (VirusTotal, AbuseIPDB, Shodan, etc.) without changing the orchestration logic.

This pattern is directly applicable whether you're building threat intelligence features into a security product (ISVs) or automating enrichment workflows for an enterprise SOC.

## What you'll learn

- How to design tool schemas that give Claude enough context to choose the right intelligence source
- How to build an agentic loop that lets Claude chain tool calls based on what it discovers
- How to prompt for multi-source correlation and MITRE ATT&CK mapping
- How to convert free-text analysis into structured JSON reports for downstream systems

## Prerequisites

- Python 3.10+
- An Anthropic API key — set it in a `.env` file as `ANTHROPIC_API_KEY=sk-ant-...`
- Familiarity with [Claude's tool use](https://docs.anthropic.com/en/docs/build-with-claude/tool-use/overview) is helpful but not required

## Step 1: Set up the environment

Install the Anthropic SDK and `python-dotenv`. Create a `.env` file in the same directory as this notebook with your API key:

```
ANTHROPIC_API_KEY=sk-ant-...
```

```python
%pip install anthropic python-dotenv --quiet
```

```python
import json

import anthropic
from dotenv import load_dotenv

load_dotenv()

client = anthropic.Anthropic()
MODEL_NAME = "claude-sonnet-4-6"
```

## Step 2: Define threat intelligence tools

We define four tools that represent common threat intelligence data sources. Each tool has a clear description that helps Claude understand when and why to use it — this is critical for effective agentic behavior. In production, these would wrap real API calls; the schemas stay the same.

```python
# Define tools for threat intelligence gathering
tools = [
    {
        "name": "lookup_ip_reputation",
        "description": "Query IP reputation database to get geolocation, ISP information, abuse history, open ports, and known malicious associations for an IP address. Returns threat types, malware associations, and abuse confidence scoring.",
        "input_schema": {
            "type": "object",
            "properties": {
                "ip_address": {
                    "type": "string",
                    "description": "The IPv4 or IPv6 address to investigate.",
                }
            },
            "required": ["ip_address"],
        },
    },
    {
        "name": "lookup_file_hash",
        "description": "Query file reputation service with a cryptographic hash. Returns detection ratio across antivirus engines, malware family classification, behavioral summary, contacted infrastructure, and temporal indicators (first/last seen).",
        "input_schema": {
            "type": "object",
            "properties": {
                "file_hash": {
                    "type": "string",
                    "description": "The MD5, SHA1, or SHA256 hash of the suspicious file.",
                },
                "hash_type": {
                    "type": "string",
                    "enum": ["md5", "sha1", "sha256"],
                    "description": "The type of hash provided.",
                },
            },
            "required": ["file_hash", "hash_type"],
        },
    },
    {
        "name": "lookup_domain",
        "description": "Investigate a domain's reputation including registration details, DNS records, SSL certificate information, hosting provider, and threat categorization. Useful for analyzing phishing domains, malware distribution sites, and C2 infrastructure.",
        "input_schema": {
            "type": "object",
            "properties": {
                "domain": {
                    "type": "string",
                    "description": "The domain name to investigate (e.g., example.com).",
                }
            },
            "required": ["domain"],
        },
    },
    {
        "name": "get_mitre_techniques",
        "description": "Map observed behaviors, malware families, or attack patterns to the MITRE ATT&CK framework. Returns matching technique IDs, tactic categories, associated threat groups, and detection recommendations.",
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "Description of the behavior, malware family, or attack pattern to map (e.g., 'command and control beaconing', 'credential theft', 'lateral movement').",
                }
            },
            "required": ["query"],
        },
    },
]

print(f"Defined {len(tools)} threat intelligence tools:")
for tool in tools:
    print(f"  - {tool['name']}: {tool['description'][:80]}...")
```

## Step 3: Build simulated threat intel backends

These functions simulate real threat intelligence APIs. Each returns realistic data structures that mirror what you'd get from services like VirusTotal, AbuseIPDB, or a MITRE ATT&CK lookup. To go to production, replace the body of each function with an API call — the interface stays the same.

```python
# Simulated threat intelligence data sources
# In production, replace each function body with real API calls:
#   lookup_ip_reputation  -> AbuseIPDB, GreyNoise, Shodan
#   lookup_file_hash      -> VirusTotal, MalwareBazaar, Hybrid Analysis
#   lookup_domain         -> URLhaus, DomainTools, WHOIS
#   get_mitre_techniques  -> MITRE ATT&CK STIX/TAXII feed


def lookup_ip_reputation(ip_address: str) -> dict:
    """Query IP reputation. In production: AbuseIPDB, GreyNoise, or Shodan API."""
    ip_database = {
        "203.0.113.42": {
            "ip": "203.0.113.42",
            "country": "Russia",
            "city": "Saint Petersburg",
            "asn": "AS48666",
            "isp": "MnogoByte LLC",
            "abuse_confidence_score": 87,
            "total_reports": 1243,
            "last_reported": "2026-03-10T14:22:00Z",
            "threat_types": ["botnet_c2", "malware_distribution", "brute_force"],
            "known_malware_associations": ["Emotet", "Trickbot"],
            "open_ports": [443, 8080, 4444],
            "is_tor_exit_node": False,
            "is_known_proxy": True,
            "first_seen": "2025-08-15T00:00:00Z",
            "tags": ["banking-trojan-c2", "spam-source"],
        },
        "198.51.100.17": {
            "ip": "198.51.100.17",
            "country": "China",
            "city": "Shanghai",
            "asn": "AS4134",
            "isp": "ChinaNet",
            "abuse_confidence_score": 94,
            "total_reports": 3891,
            "last_reported": "2026-03-12T09:15:00Z",
            "threat_types": ["apt_c2", "data_exfiltration", "scanning"],
            "known_malware_associations": ["PlugX", "ShadowPad"],
            "open_ports": [443, 8443, 53],
            "is_tor_exit_node": False,
            "is_known_proxy": False,
            "first_seen": "2024-11-02T00:00:00Z",
            "tags": ["apt-infrastructure", "state-sponsored"],
        },
    }
    return ip_database.get(
        ip_address,
        {
            "ip": ip_address,
            "country": "Unknown",
            "abuse_confidence_score": 0,
            "total_reports": 0,
            "threat_types": [],
            "note": "No records found for this IP",
        },
    )


def lookup_file_hash(file_hash: str, hash_type: str) -> dict:
    """Query file reputation. In production: VirusTotal or MalwareBazaar API."""
    hash_database = {
        "d131dd02c5e6eec4693d9a0698aff95c": {
            "hash": "d131dd02c5e6eec4693d9a0698aff95c",
            "hash_type": "md5",
            "sha256": "a1b2c3d4e5f6789012345678abcdef0123456789abcdef0123456789abcdef01",
            "detections": 58,
            "total_engines": 72,
            "detection_rate": "80.6%",
            "malware_family": "Emotet",
            "malware_type": "banking_trojan",
            "severity": "critical",
            "file_type": "PE32 executable (DLL)",
            "file_size_bytes": 237568,
            "file_name": "update_service.dll",
            "first_seen": "2025-12-01T08:30:00Z",
            "last_seen": "2026-03-09T22:14:00Z",
            "ssdeep": "6144:Kl2a8JG1oPRqMDFlOGnA8g0ZFBFSqBKiDEF:Kl2a8Q1oPRDF3",
            "tags": ["emotet", "epoch5", "banking-trojan", "dropper"],
            "behavior_summary": "Drops secondary payload via regsvr32, establishes persistence via scheduled task, communicates with C2 over HTTPS on non-standard ports",
            "contacted_ips": ["203.0.113.42", "203.0.113.88", "192.0.2.101"],
            "contacted_domains": ["update-service-cdn.ru", "cdn-api-gateway.cc"],
        },
        "7b3a0c8f2e1d4a5b6c9d8e7f0a1b2c3d": {
            "hash": "7b3a0c8f2e1d4a5b6c9d8e7f0a1b2c3d",
            "hash_type": "md5",
            "sha256": "f0e1d2c3b4a5968778695a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d",
            "detections": 47,
            "total_engines": 70,
            "detection_rate": "67.1%",
            "malware_family": "Trickbot",
            "malware_type": "modular_trojan",
            "severity": "critical",
            "file_type": "PE32 executable (EXE)",
            "file_size_bytes": 524288,
            "file_name": "windefupdate.exe",
            "first_seen": "2025-10-18T12:00:00Z",
            "last_seen": "2026-03-11T06:45:00Z",
            "tags": ["trickbot", "gtag-mor84", "credential-stealer", "lateral-movement"],
            "behavior_summary": "Injects into svchost.exe, harvests browser credentials, performs network reconnaissance, attempts lateral movement via EternalBlue",
            "contacted_ips": ["198.51.100.17", "198.51.100.22"],
            "contacted_domains": ["api-check-update.cc", "telemetry-cdn.ru"],
        },
    }
    return hash_database.get(
        file_hash,
        {
            "hash": file_hash,
            "hash_type": hash_type,
            "detections": 0,
            "total_engines": 72,
            "malware_family": "Unknown",
            "severity": "unknown",
            "note": "No records found for this hash",
        },
    )


def lookup_domain(domain: str) -> dict:
    """Query domain reputation. In production: URLhaus, DomainTools, or WHOIS API."""
    domain_database = {
        "secure-bankofamerica-login.com": {
            "domain": "secure-bankofamerica-login.com",
            "reputation_score": 98,
            "category": "phishing",
            "subcategory": "credential_harvesting",
            "active": True,
            "registrar": "NameSilo LLC",
            "registration_date": "2026-02-28T00:00:00Z",
            "registrant_country": "Panama",
            "hosting_provider": "BulletProof Hosting Ltd",
            "hosting_country": "Moldova",
            "ip_addresses": ["192.0.2.55", "192.0.2.56"],
            "mx_records": [],
            "ssl_issuer": "Let's Encrypt",
            "ssl_valid_from": "2026-02-28T00:00:00Z",
            "targeted_brand": "Bank of America",
            "similar_domains_found": 12,
            "urlhaus_reference": "https://urlhaus.abuse.ch/url/2345678/",
            "tags": ["phishing-kit", "credential-harvest", "typosquat"],
            "associated_ips_with_other_malicious_domains": True,
            "dns_records": {
                "A": ["192.0.2.55"],
                "NS": ["ns1.bulletproof-dns.cc", "ns2.bulletproof-dns.cc"],
                "TXT": [],
            },
        },
        "update-service-cdn.ru": {
            "domain": "update-service-cdn.ru",
            "reputation_score": 91,
            "category": "malware",
            "subcategory": "c2_server",
            "active": True,
            "registrar": "REG.RU LLC",
            "registration_date": "2025-07-14T00:00:00Z",
            "registrant_country": "Russia",
            "hosting_provider": "MnogoByte LLC",
            "hosting_country": "Russia",
            "ip_addresses": ["203.0.113.42"],
            "ssl_issuer": "Self-signed",
            "tags": ["emotet-c2", "malware-distribution", "fast-flux"],
            "associated_malware": ["Emotet", "Trickbot"],
            "dns_records": {
                "A": ["203.0.113.42", "203.0.113.88"],
                "NS": ["ns1.reg.ru", "ns2.reg.ru"],
                "TXT": [],
            },
        },
    }
    return domain_database.get(
        domain,
        {
            "domain": domain,
            "reputation_score": 0,
            "category": "unknown",
            "active": None,
            "note": "No records found for this domain",
        },
    )


def get_mitre_techniques(query: str) -> dict:
    """Map behaviors to MITRE ATT&CK. In production: query ATT&CK STIX/TAXII feed or local DB."""
    mitre_mappings = {
        "command and control": {
            "techniques": [
                {
                    "id": "T1071.001",
                    "name": "Web Protocols",
                    "tactic": "Command and Control",
                    "description": "Adversaries communicate using application layer protocols associated with web traffic to avoid detection",
                },
                {
                    "id": "T1573.002",
                    "name": "Asymmetric Cryptography",
                    "tactic": "Command and Control",
                    "description": "Use asymmetric encryption for C2 communications",
                },
                {
                    "id": "T1008",
                    "name": "Fallback Channels",
                    "tactic": "Command and Control",
                    "description": "Use alternate communication channels if primary C2 is disrupted",
                },
            ],
            "associated_groups": ["APT28", "APT29", "Lazarus Group", "Wizard Spider"],
            "detection_suggestions": [
                "Monitor for unusual outbound HTTPS to non-standard ports",
                "Inspect TLS certificates for self-signed or recently issued certs",
                "Track beaconing patterns in network flow data",
            ],
        },
        "credential theft": {
            "techniques": [
                {
                    "id": "T1056.001",
                    "name": "Keylogging",
                    "tactic": "Collection",
                    "description": "Log keystrokes to intercept credentials as they are typed",
                },
                {
                    "id": "T1555.003",
                    "name": "Credentials from Web Browsers",
                    "tactic": "Credential Access",
                    "description": "Acquire credentials from web browser credential stores",
                },
                {
                    "id": "T1003.001",
                    "name": "LSASS Memory",
                    "tactic": "Credential Access",
                    "description": "Access credential material stored in LSASS process memory",
                },
            ],
            "associated_groups": ["Trickbot operators", "Emotet operators", "FIN7"],
            "detection_suggestions": [
                "Monitor for LSASS access by unusual processes",
                "Alert on credential store file access",
                "Deploy credential guard on endpoints",
            ],
        },
        "phishing": {
            "techniques": [
                {
                    "id": "T1566.001",
                    "name": "Spearphishing Attachment",
                    "tactic": "Initial Access",
                    "description": "Send emails with a malicious attachment to gain access",
                },
                {
                    "id": "T1566.002",
                    "name": "Spearphishing Link",
                    "tactic": "Initial Access",
                    "description": "Send emails with malicious links to credential-harvesting sites",
                },
                {
                    "id": "T1598.003",
                    "name": "Spearphishing Link (for Information)",
                    "tactic": "Reconnaissance",
                    "description": "Send spearphishing links to gather information for targeting",
                },
            ],
            "associated_groups": ["APT28", "Lazarus Group", "Kimsuky", "TA505"],
            "detection_suggestions": [
                "Implement DMARC/DKIM/SPF for email authentication",
                "Deploy URL rewriting and sandboxing for links",
                "Monitor for newly registered look-alike domains",
            ],
        },
        "lateral movement": {
            "techniques": [
                {
                    "id": "T1210",
                    "name": "Exploitation of Remote Services",
                    "tactic": "Lateral Movement",
                    "description": "Exploit remote services to move laterally within the environment",
                },
                {
                    "id": "T1021.002",
                    "name": "SMB/Windows Admin Shares",
                    "tactic": "Lateral Movement",
                    "description": "Use valid accounts to interact with remote network shares using SMB",
                },
            ],
            "associated_groups": ["Wizard Spider", "FIN6", "Sandworm Team"],
            "detection_suggestions": [
                "Monitor for anomalous SMB traffic patterns",
                "Alert on use of PsExec or similar tools",
                "Track authentication events across endpoints",
            ],
        },
    }
    query_lower = query.lower()
    for key, mapping in mitre_mappings.items():
        if key in query_lower:
            return mapping
    # Fuzzy fallback: check if any keyword appears
    for key, mapping in mitre_mappings.items():
        for word in key.split():
            if word in query_lower:
                return mapping
    return {
        "techniques": [],
        "associated_groups": [],
        "note": "No direct MITRE ATT&CK mapping found for this query. Try broader terms like 'command and control', 'credential theft', 'phishing', or 'lateral movement'.",
    }


print(
    "Simulated threat intel backends ready. In production, replace function bodies with real API calls."
)
```

## Step 4: Create the agent loop

This is the core orchestration. We give Claude a system prompt that positions it as a senior threat intelligence analyst, then let it decide which tools to call and in what order. The `while` loop continues as long as Claude wants to call tools — it may call one tool, inspect the results, then decide to call another based on what it found. This multi-turn reasoning is what makes this an agent rather than a simple API wrapper.

```python
SYSTEM_PROMPT = """You are a senior threat intelligence analyst. When given an Indicator of Compromise (IOC), you systematically investigate it by:

1. Identifying the IOC type and querying the most relevant intelligence source first
2. Analyzing initial results to determine what follow-up queries would be valuable
3. Cross-referencing findings across multiple sources when related indicators are found
4. Mapping observed behaviors and malware families to MITRE ATT&CK techniques
5. Synthesizing all findings into a clear, evidence-based assessment

Always query multiple sources when possible. If an IP lookup reveals associated malware, look up the MITRE techniques for that malware. If a hash lookup reveals contacted domains or IPs, investigate those too. Build the fullest picture you can before forming your assessment.

State your confidence level (low/medium/high) and explain what evidence supports it."""

MAX_TURNS = 10  # cap the agent loop to prevent runaway costs


def process_tool_call(tool_name: str, tool_input: dict) -> str:
    """Route tool calls to the appropriate backend function."""
    handlers = {
        "lookup_ip_reputation": lambda inp: lookup_ip_reputation(inp["ip_address"]),
        "lookup_file_hash": lambda inp: lookup_file_hash(inp["file_hash"], inp["hash_type"]),
        "lookup_domain": lambda inp: lookup_domain(inp["domain"]),
        "get_mitre_techniques": lambda inp: get_mitre_techniques(inp["query"]),
    }
    handler = handlers.get(tool_name)
    if handler is None:
        return json.dumps({"error": f"Unknown tool: {tool_name}"})
    return json.dumps(handler(tool_input), indent=2)


def run_threat_intel_agent(ioc: str, ioc_type: str) -> tuple[str, list[dict]]:
    """
    Run the threat intel enrichment agent on a single IOC.
    Returns (analysis_text, list_of_tool_calls_made).
    """
    user_message = (
        f"Investigate this indicator of compromise and provide a threat assessment:\n"
        f"  IOC: {ioc}\n"
        f"  Type: {ioc_type}\n\n"
        f"Query all relevant intelligence sources, cross-reference findings, "
        f"map to MITRE ATT&CK where applicable, and provide your assessment with "
        f"severity rating, confidence score, and recommended response actions."
    )

    messages = [{"role": "user", "content": user_message}]
    tool_calls_made = []

    for _turn in range(MAX_TURNS):
        response = client.messages.create(
            model=MODEL_NAME,
            max_tokens=4096,
            system=SYSTEM_PROMPT,
            tools=tools,
            messages=messages,
        )

        # If Claude is done reasoning, extract final text
        if response.stop_reason == "end_turn":
            final_text = next(
                (block.text for block in response.content if hasattr(block, "text")),
                "No analysis generated.",
            )
            return final_text, tool_calls_made

        # If Claude wants to use tools, process all tool calls in this turn
        if response.stop_reason == "tool_use":
            # Add assistant's response (contains both text and tool_use blocks)
            messages.append({"role": "assistant", "content": response.content})

            # Process each tool call and collect results
            tool_results = []
            for block in response.content:
                if block.type == "tool_use":
                    print(f"  -> Calling {block.name}({json.dumps(block.input)})")
                    tool_calls_made.append({"tool": block.name, "input": block.input})
                    result = process_tool_call(block.name, block.input)
                    tool_results.append(
                        {
                            "type": "tool_result",
                            "tool_use_id": block.id,
                            "content": result,
                        }
                    )

            # Send tool results back to Claude
            messages.append({"role": "user", "content": tool_results})
        else:
            # Unexpected stop reason
            return f"Agent stopped unexpectedly: {response.stop_reason}", tool_calls_made

    # Hit turn limit without end_turn
    return (
        f"Agent reached max_turns limit ({MAX_TURNS}) without completing analysis. "
        f"Consider raising MAX_TURNS or simplifying the investigation scope.",
        tool_calls_made,
    )


print("Agent loop ready.")
```

## Step 5: Run the agent on sample IOCs

Let's test the agent with three different IOC types. Watch the tool call trace — Claude will decide which sources to query and may follow up with additional lookups based on what it finds (e.g., looking up a domain discovered in a hash analysis).

```python
# Three test cases covering different IOC types
test_cases = [
    {
        "ioc": "203.0.113.42",
        "type": "ip_address",
        "description": "Suspicious IP flagged by firewall for outbound C2 beaconing",
    },
    {
        "ioc": "d131dd02c5e6eec4693d9a0698aff95c",
        "type": "file_hash",
        "description": "File hash from endpoint detection alert (suspected Emotet)",
    },
    {
        "ioc": "secure-bankofamerica-login.com",
        "type": "domain",
        "description": "Domain found in phishing email reported by employee",
    },
]

# Store results for structured report generation
all_results = []

for i, test in enumerate(test_cases, 1):
    print(f"\n{'=' * 70}")
    print(f"  Test Case {i}: {test['description']}")
    print(f"  IOC: {test['ioc']} (Type: {test['type']})")
    print(f"{'=' * 70}\n")
    print("Tool call trace:")

    analysis, tools_used = run_threat_intel_agent(test["ioc"], test["type"])

    all_results.append(
        {
            "ioc": test["ioc"],
            "type": test["type"],
            "description": test["description"],
            "analysis": analysis,
            "tools_used": tools_used,
        }
    )

    print(f"\n--- Agent queried {len(tools_used)} tool(s) ---")
    print(f"\nAnalysis:\n{analysis}")
    print()
```

## Step 6: Generate structured threat reports

The raw agent analysis is great for a human analyst, but downstream systems (SIEMs, ticketing, SOC dashboards) need structured data. This step takes the agent's free-text analysis and transforms it into a standardized JSON report. In production, you could output STIX 2.1 objects or feed directly into your incident response platform.

```python
REPORT_SCHEMA = {
    "type": "object",
    "properties": {
        "ioc": {
            "type": "string",
            "description": "The indicator of compromise that was investigated",
        },
        "ioc_type": {
            "type": "string",
            "enum": ["ip_address", "file_hash", "domain", "url", "email"],
        },
        "severity": {
            "type": "string",
            "enum": ["critical", "high", "medium", "low", "informational"],
        },
        "confidence": {"type": "integer", "description": "Confidence score from 0-100"},
        "threat_classification": {
            "type": "string",
            "description": "Primary threat category (e.g., 'banking_trojan_c2', 'phishing', 'apt_infrastructure')",
        },
        "summary": {"type": "string", "description": "One-paragraph executive summary of findings"},
        "related_malware": {"type": "array", "items": {"type": "string"}},
        "related_threat_groups": {"type": "array", "items": {"type": "string"}},
        "mitre_techniques": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "technique_id": {"type": "string"},
                    "technique_name": {"type": "string"},
                    "tactic": {"type": "string"},
                },
            },
        },
        "recommended_actions": {"type": "array", "items": {"type": "string"}},
        "related_iocs": {
            "type": "array",
            "items": {"type": "string"},
            "description": "Other IOCs discovered during investigation",
        },
    },
    "required": [
        "ioc",
        "ioc_type",
        "severity",
        "confidence",
        "threat_classification",
        "summary",
        "recommended_actions",
    ],
}


def generate_structured_report(analysis: str, ioc: str, ioc_type: str) -> dict:
    """Transform free-text agent analysis into a structured JSON report."""
    response = client.messages.create(
        model=MODEL_NAME,
        max_tokens=4096,
        system=(
            "You are a threat intelligence report formatter. Convert the analyst's "
            "findings into a structured JSON report matching the provided schema EXACTLY. "
            "Include ONLY the fields listed in the schema — do not add extra fields, "
            "nested objects, or elaboration. Keep array values as simple strings, not "
            "objects. Keep the summary to 2-3 sentences. Return ONLY valid JSON, no "
            "markdown fences."
        ),
        messages=[
            {
                "role": "user",
                "content": (
                    f"Convert this threat intelligence analysis into a structured JSON report.\n\n"
                    f"IOC investigated: {ioc} (type: {ioc_type})\n\n"
                    f"Analysis:\n{analysis}\n\n"
                    f"Schema (include ONLY these fields):\n{json.dumps(REPORT_SCHEMA, indent=2)}\n\n"
                    f"Return the JSON object directly with no markdown formatting."
                ),
            }
        ],
    )

    response_text = response.content[0].text

    # Extract JSON from response (handle markdown code blocks if present)
    if "```json" in response_text:
        json_str = response_text.split("```json")[1].split("```")[0].strip()
    elif "```" in response_text:
        json_str = response_text.split("```")[1].split("```")[0].strip()
    else:
        json_str = response_text.strip()

    try:
        return json.loads(json_str)
    except json.JSONDecodeError as e:
        return {"error": f"Failed to parse structured report: {e}", "raw": response_text}


# Generate structured reports for all test cases
print("=" * 70)
print("  STRUCTURED THREAT INTELLIGENCE REPORTS")
print("=" * 70)

structured_reports = []
for result in all_results:
    report = generate_structured_report(result["analysis"], result["ioc"], result["type"])
    structured_reports.append(report)

    print(f"\n--- {result['ioc']} ---")
    print(json.dumps(report, indent=2))
    print()
```

## Summary and next steps

This cookbook demonstrated how to build a threat intelligence enrichment agent that autonomously investigates IOCs by querying multiple data sources, cross-referencing findings, and producing structured reports. The key patterns you can take away:

- **Tool-use agentic loop**: Claude decides which tools to call and follows up based on results — no hardcoded query sequences
- **Modular tool design**: Each intelligence source is a clean function with a well-defined schema, making it straightforward to swap in real APIs
- **Multi-source correlation**: The system prompt encourages Claude to pivot across sources (e.g., hash → contacted IPs → IP reputation → MITRE mapping)
- **Structured output**: Raw analysis is transformed into machine-readable reports for downstream systems

### Making this production-ready

**Swap in real APIs**: Replace mock functions with calls to VirusTotal, AbuseIPDB, Shodan, GreyNoise, URLhaus, DomainTools, or your organization's internal threat intel feeds. The tool schemas and agent loop stay the same.

**Add more tools**: WHOIS lookups, passive DNS, SSL certificate transparency logs, sandbox detonation (e.g., Joe Sandbox, Hybrid Analysis), and EDR/SIEM enrichment queries.

**Scale with async**: For bulk IOC processing, use `asyncio` to run tool calls in parallel and process IOC queues. Consider caching results with TTLs to avoid redundant API calls.

**Harden structured output**: Use Claude's tool-use capability to force JSON schema compliance instead of parsing free text, or validate reports against the `REPORT_SCHEMA` defined in Step 6.

**Integrate with your stack**: Export structured reports as STIX 2.1 bundles, push to Splunk/Elastic/SOAR platforms, or feed into ticketing systems for automated incident creation.

**Add confidence calibration**: Weight confidence scores based on source reliability, data freshness, and cross-source corroboration. Sources that agree independently should boost confidence.

### Further reading

- [Building effective agents](https://anthropic.com/research/building-effective-agents) — Anthropic's research on agent patterns
- [Tool use documentation](https://docs.anthropic.com/en/docs/build-with-claude/tool-use/overview) — Complete guide to Claude's tool-use capabilities
- [MITRE ATT&CK](https://attack.mitre.org/) — Framework referenced in this cookbook
