---
id: A-014
tier: A
category: "HR & hiring"
kind: workflow
title: "Two-stage AI hiring pipeline (screening + full evaluation)"
subtitle: "80%+ of CVs are mis-fits and every reviewer scores them differently. Same rubric, every candidate, with cited quotes."
source: https://www.cybos.ai/cases/A-014
ingested: 2026-05-26
meta_tier: "A Deep — Full research, prompts, gotchas, demo-ready"
effort: "M · Weeks"
for: "hiring manager · recruiter · founder · in the heavy variant · a commercial-functional executive who has lived the hiring criteria"
type: case
version: v0.1
---
# Two-stage AI hiring pipeline (screening + full evaluation)

> 80%+ of CVs are mis-fits and every reviewer scores them differently. Same rubric, every candidate, with cited quotes.

## What

A two-stage agentic hiring pipeline. **Stage 1 (Screening Agent):** reads a candidate's CV + screening interview transcript, scores them against a role competency matrix on a 1–5 scale with evidence status (Mentioned in CV / Self-Reported / Missing), runs a fixed 6-category red-flag analysis, and outputs a proceed/no-proceed recommendation with rationale. **Stage 2 (Full Evaluation Agent):** triggered after the technical interview, reads everything (CV + screening + tech interview + role matrix + scoring rules), and outputs a final evaluation, score, and AI-notes file. Both run as Python + Markdown + LLM with versioned per-candidate folders. Humans approve every advance.

**Heavy variant (sales-recruiting / B2B commercial hires).** Same pipeline, but the role-competency matrix is replaced by a ~6,500-line methodology document — written by the founder in Claude before any agent is built — that codifies the full sales-skill rubric (e.g., the Bar / SI sales methodology, U.S. frameworks adapted for B2B). Output adds two emergent report sections that Claude invented unprompted on early candidates and that the operator then formalised: a **"Voice of the Candidate"** block (~1.5-page synthesis of victories and failures in the candidate's own voice, structured by quotes) and a **"Yellow ethics block"** that surfaces reputational red flags (e.g., a candidate boasting about forging tender documents). And the close-the-loop: the operator **acquired a small recruiting agency** to handle execution and feed 90-day post-hire performance data back into the model, so the rubric learns from outcomes.

## Why it matters

Recruiting is the first function AI-ified at most reference deployments because the funnel signal-to-noise is terrible: 80%+ of CVs are mis-fits. Mechanizing screening and tech-interview scoring delivers consistent rubric application across reviewers (the same candidate gets the same score from different reviewers), cuts the "did we miss someone?" anxiety because every candidate hits the same matrix, and frees the founder/manager hours/week. At one reference AI media-buying agency a sales-assistant role was eliminated outright; some analyst roles were cut.

In the heavy sales-recruiting variant: 15 real candidates scored through the system; partners using it; the partner has committed to **spinning up a recruiting agency around the score reports** — i.e. the product was sold before it was finished. Founder framing: "all resumes are garbage; all interviews most recruiters run are garbage; this methodology gives you signal." The agency-acquisition close-the-loop turns 90-day post-hire performance data into training signal — the rubric is no longer the founder's opinion, it is the cumulative outcome across all placed candidates.

The **codify-emergent-extracts** meta-pattern (see below) generalises far beyond hiring: any agent that produces structured reports will, on occasion, output a section that wasn't in the template. If the section is useful, formalise it into the template; if not, tighten the constraints. The hiring pipeline produced two such sections in its first batch.

## End-to-end

1. **Set up the directory structure.** Under `Docs/Operations/Hiring/Job-Openings/[Role-Name]/`:

- `Global-Rules/General-Hiring-Policy.md`, `Scoring-Framework.md`, `Interview-Guidelines.md` (universal).
- `Position-Description.md`, `Role-Competency-Matrix.md`, `Scoring-Rules.md`, `Candidate-Pipeline.md` (per role).
- `Screening-Agent/` and `Full Evaluation Agent/` subfolders, each containing `agent.py`, `agent-config.json`, `agent-prompt.md`, `run-agent.sh`, `README.md`.

1. **Role competency matrix.** The matrix is the single source of truth for what each role requires. Per competency: name, weight, required level (junior/mid/senior), evidence types accepted, sample questions. The screening prompt scores against this matrix; do not skip building it.
2. **(Heavy variant) Author the full methodology document first.** Before any agent is wired, the operator writes the full sales-skill methodology in Claude — at the reference deployment, ~6,500 lines covering 4 skill axes, the Bar/SI framework, role-specific behavioural probes, and the verbatim sample questions that elicit concrete behavioural stories. The methodology lives in `Methodology/` and is referenced by both agents. This is a 2–3 week single-person effort; do it before wiring anything else.
3. **`agent-config.json` per role.** Lists critical competencies, fit thresholds, red-flag categories, role expectations. Replace `[COMPANY_NAME]` placeholder via `sed` once per repo.
4. **Per-candidate folder.** `Candidates/Candidate-[First-Last]/CV.md`, then `Screening-Interview.md` after the screening call, then `Technical-Interview.md` after the tech call. The transcripts come from any meeting recorder (Fathom, Fireflies, Otter, Granola).
5. **Run screening.** `./run-agent.sh --candidate Candidate-John-Doe` reads `CV.md` + `Screening-Interview.md` + `Role-Competency-Matrix.md` + `agent-config.json`, calls the LLM, and writes `Screening-Evaluation.md` in the candidate folder. Strict scope: the screening agent ONLY produces this one file — it does not generate tech-interview prep content.
6. **Human review of screening.** Hiring manager reads the screening evaluation, accepts/rejects the proceed flag. If proceed, schedule the tech interview.
7. **Run full evaluation.** After the tech interview transcript is in the folder, `./run-agent.sh --stage=full --candidate Candidate-John-Doe` produces three files: `Evaluation.md` (narrative across all competencies), `Final-Score.md` (numeric rollup against threshold), `AI-Notes.md` (the model's chain-of-reasoning + flags for the human to verify).
8. **(Heavy variant) Chat-bot intake.** Drop interview audio into a small chat bot; the bot transcribes, runs the screening pipeline, and posts the report back into chat. Operator-friendly because no terminal is required to score a candidate.
9. **Watch the first batch for emergent sections.** Track which report sections Claude generated that weren't explicitly requested in the prompt. The reference deployment's first batch produced two new sections without being asked: a candidate's-own-voice synthesis and an ethics/reputational-risk yellow block. Decide for each: (a) keep and formalise as a required section in the template with an explicit rubric, (b) tighten the prompt to suppress it, or (c) leave as optional. This is the **codify-emergent-extracts loop** — observe, decide, formalise.
10. **Final decision.** Human approves before the offer. The agent recommends; humans decide.
11. **(Heavy variant) Close the loop with 90-day post-hire feedback.** The most powerful and least-shipped step. At the reference deployment, the operator acquired a small recruiting agency to (a) handle execution end-to-end and (b) collect structured 90-day performance reports on placed candidates. Those reports feed back into the methodology document — every quarter the rubric is updated based on which signals actually predicted outcomes. Without this loop, the rubric is just the founder's opinion. With it, the rubric is empirical.

## Prompts

Screening agent system prompt (synthesised from the corpus role-matrix + 6-category red-flag analysis):

```
`You are a screening evaluator for the role: [ROLE_NAME] at [COMPANY_NAME].

Inputs you will read:
 - Candidates/Candidate-[Name]/CV.md
 - Candidates/Candidate-[Name]/Screening-Interview.md
 - Role-Competency-Matrix.md
 - Scoring-Rules.md
 - agent-config.json (critical competencies, fit thresholds, red flags)

Produce EXACTLY ONE output file:
 Candidates/Candidate-[Name]/Screening-Evaluation.md

Required sections, in this order:
 1. Salary-range check
 - Candidate-stated range vs role band from agent-config.json.
 - If outside band: flag and stop scoring further; explain.

 2. Per-competency scoring
 For each competency in Role-Competency-Matrix.md:
 - Score 1-5.
 - Evidence status: one of
 [Mentioned in CV] / [Self-Reported in Interview] / [Demonstrated with Example] / [Missing].
 - Verbatim quote or CV line that justifies the score.
 - NEVER score on the absence of evidence; missing = score 1 with [Missing] tag.

 3. Red-flag analysis (all 6 categories, always in this order)
 a. Technical stack mismatch
 b. Industry mismatch
 c. Communication concerns
 d. Experience gaps (unexplained > 6 months, role-hopping pattern)
 e. Cultural concerns (red phrases from agent-config.json)
 f. Compensation mismatch
 For each: PASS / CAUTION / FAIL + 1-2 sentence rationale citing source.

 4. Preliminary decision
 - PROCEED / NO-PROCEED.
 - 3-5 sentence rationale referencing scores and flags.
 - 3 questions the technical interviewer should prioritise.

Hard rules:
 - You MUST only create and update Screening-Evaluation.md. Do not generate
 technical-interview prep content, candidate emails, or rejection letters.
 - Always check salary first. Always run all 6 red-flag categories. Never skip the order.
 - Cite verbatim evidence for every claim. No paraphrase without [PARAPHRASE] tag.
`
```

Full evaluation agent prompt (synthesised, follow-on stage):

```
`You are the final evaluator for the role: [ROLE_NAME] at [COMPANY_NAME].

Inputs:
 - Candidates/Candidate-[Name]/CV.md
 - Candidates/Candidate-[Name]/Screening-Interview.md
 - Candidates/Candidate-[Name]/Technical-Interview.md
 - Candidates/Candidate-[Name]/Screening-Evaluation.md
 - Role-Competency-Matrix.md
 - Scoring-Rules.md

Produce THREE output files:
 1. Evaluation.md — full narrative across all competencies, 600-1000 words.
 2. Final-Score.md — numeric rollup table + weighted total vs role threshold.
 3. AI-Notes.md — your reasoning, uncertainties, and 3 questions the human MUST verify.

Hard rules:
 - Anchor every claim to a transcript quote with timestamp.
 - If the tech interview contradicts the screening, surface the contradiction explicitly.
 - Never recommend HIRE without a corroborating example for each critical competency.
 - Output AI-Notes.md with the 3 most-uncertain claims at the top.
`
```

Heavy variant — Voice-of-the-Candidate block (the section Claude invented; rubric formalised after observation):

```
`After scoring is complete, produce a separate section: "Voice of the Candidate" (~1-1.5 pages).

Structure:
 - Victories (3-5): each is a paragraph in the candidate's own voice. Verbatim
 quotes preferred. Capture the moment they were proudest of and WHY in their words.
 - Failures (3-5): same structure. Look specifically for failures they own vs. failures
 they attribute externally — note which pattern.
 - Words / phrases they used repeatedly: list with frequency, brief interpretation.
 - One signal you would have missed if you read only the CV: what is it.

Hard rule: this section uses ONLY the candidate's quotes. No paraphrase. No
interpretation outside the labeled "interpretation" lines.
`
```

Heavy variant — Yellow ethics block:

```
`Append a "Yellow Ethics" section if and only if you observe one of the following
in the transcript:

 - the candidate describes performing an action that, in your reading, violates a
 normal commercial-ethics line (e.g., forging documents, mis-stating credentials,
 misappropriating credit, undisclosed conflict of interest)
 - the candidate boasts about an action that, in context, indicates ethical drift
 (proud of cutting a corner the buyer didn't notice)
 - the candidate's account of leaving a prior role is inconsistent across CV vs.
 interview

Format:
 - YELLOW FLAG: <one-sentence summary>
 - Evidence: verbatim quote(s) with timestamp(s)
 - Rationale: 2-3 sentence reasoning (do not assume guilt; describe risk)
 - Recommended human follow-up: 1-2 questions to ask in the next interview

If none observed, omit the section entirely. Do not invent a yellow flag.
`
```

`run-agent.sh` invocation:

```
``
```

## Gotchas

- **Strict scope per agent.** The screening agent's prompt explicitly forbids it from generating tech-interview prep content. This isn't pedantic — without scope guards the agent drifts into recommendation territory and humans defer.
- **Always check salary first.** A candidate outside the band ends scoring immediately. Don't let the agent "evaluate competencies anyway" — it wastes context window and biases the human toward stretching the band.
- **Codify emergent sections — don't silently drift.** When Claude invents a section that wasn't in the template (as it did in the reference deployment with Voice-of-the-Candidate and Yellow Ethics), either formalise it with an explicit rubric and required-format rule, or tighten the prompt to suppress it. Letting an emergent section appear inconsistently across candidates is worse than either keeping it or killing it — it makes the rubric stop being a rubric.
- **The "stray dog" mental model.** Operators have framed Claude as "a smart stray dog you took home — if you don't set boundaries it shits in random rooms." The template, the explicit per-section format rules, and the verbatim-evidence rule are the boundaries. Without them, even the heavy variant drifts.
- **Acquire-the-agency is heavy.** The close-the-loop step in the heavy variant requires actually buying or merging with a placement firm to get reliable 90-day post-hire data. For most operators, a partnership with one recruiting agency (paid for placement + data-sharing agreement) is more realistic than acquisition. The data-sharing is the load-bearing piece; ownership is optional.

## Tools

- Python 3.7+, `markdown` and `argparse` packages.
- An LLM API (Anthropic / OpenAI) wired into `agent.py`. Template ships with placeholder logic — wire to a real LLM before production.
- A meeting recorder for interview transcripts (Fathom, Fireflies, Otter, Granola).
- The role competency matrix and scoring rules MUST be in place before running — the agent's quality is bounded by their quality.
- (Heavy variant) ~2–3 weeks of founder time to author the multi-thousand-line methodology document.
- (Heavy variant) A chat bot for audio intake; a route to acquire / partner with a small recruiting agency for the close-the-loop step.
