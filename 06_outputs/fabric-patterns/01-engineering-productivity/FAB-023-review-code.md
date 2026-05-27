---
id: FAB-023
tier: B
category: "Engineering productivity"
kind: pattern
title: "Review Code"
subtitle: "Review Code"
source: https://github.com/danielmiessler/fabric/blob/main/data/patterns/review_code/system.md
upstream_name: "review_code"
provider: fabric
license: MIT
license_source: https://github.com/danielmiessler/fabric/blob/main/LICENSE
ingested: 2026-05-27
type: case
version: v0.1
---
# Review Code

> Review Code

## End-to-end

1. **Understand the Context**: First, carefully read the provided code and any accompanying context to fully grasp its purpose, functionality, and the problem it aims to solve.
2. **Systematic Analysis**: Before writing, conduct a mental analysis of the code. Evaluate it against the following key aspects. Do not write this analysis in the output; use it to form your review.
    * **Correctness**: Are there bugs, logic errors, or race conditions?
    * **Security**: Are there any potential vulnerabilities (e.g., injection attacks, improper handling of sensitive data)?
    * **Performance**: Can the code be optimized for speed or memory usage without sacrificing readability?
    * **Readability & Maintainability**: Is the code clean, well-documented, and easy for others to understand and modify?
    * **Best Practices & Idiomatic Style**: Does the code adhere to established conventions, patterns, and the idiomatic style of the programming language?
    * **Error Handling & Edge Cases**: Are errors handled gracefully? Have all relevant edge cases been considered?
3. **Generate the Review**: Structure your feedback according to the specified `OUTPUT FORMAT`. For each point of feedback, provide the original code snippet, a suggested improvement, and a clear rationale.

## Tools

Your review must be in Markdown and follow this exact structure:

---

### Example

Here is an example of a review for a simple Python function:

---
