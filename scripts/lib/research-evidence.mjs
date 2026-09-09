// Evidence receipts are data. Exact quotations and hashes are formal checks, not truth judgments.
import { readFileSync, statSync } from "node:fs";
import { relative, resolve, sep } from "node:path";
import { createHash } from "node:crypto";
import { researchBudget, loadResearchPolicy } from "./research-policy.mjs";
import { assertSafePath } from "./skills.mjs";
export const researchHash = (value) =>
  createHash("sha256").update(value).digest("hex");
const text = (v, label) => {
  if (typeof v !== "string" || !v.trim())
    throw Error(`${label} must be nonempty text`);
  return v;
};
const list = (v, label) => {
  if (!Array.isArray(v)) throw Error(`${label} must be an array`);
  return v;
};
const strings = (v, label) => list(v, label).map((x) => text(x, label));
const id = (v, label) => {
  if (typeof v !== "string" || !/^[a-z][a-z0-9-]*$/.test(v))
    throw Error(`Invalid ${label}`);
  return v;
};
export function readEvidence(root, path) {
  const file = assertSafePath(root, path);
  if (!statSync(file).isFile()) throw Error(`Not an evidence file: ${path}`);
  if (statSync(file).size > 2_000_000)
    throw Error(
      `Evidence file too large: ${path}; register an explicit source excerpt with provenance`,
    );
  const content = readFileSync(file, "utf8");
  text(content, `Evidence ${path}`);
  return {
    path: relative(resolve(root), file).split(sep).join("/"),
    sha256: researchHash(content),
    text: content,
  };
}
export function sourceSnapshot(root, path) {
  const { text, ...snapshot } = readEvidence(root, path);
  return snapshot;
}
export function validatePlan(output, { maxWorkers, sourcePaths }) {
  text(output?.summary, "Plan summary");
  const workers = list(output.workers, "Plan workers");
  if (!workers.length || workers.length > maxWorkers)
    throw Error(`Plan requires 1..${maxWorkers} workers`);
  const seen = new Set();
  return {
    summary: output.summary,
    workers: workers.map((w) => {
      id(w.id, "worker ID");
      if (seen.has(w.id)) throw Error(`Duplicate worker ${w.id}`);
      seen.add(w.id);
      const acceptanceCriteria = strings(
        w.acceptanceCriteria,
        "Worker acceptanceCriteria",
      );
      if (!acceptanceCriteria.length)
        throw Error("Worker needs acceptance criteria");
      const paths = strings(w.sourcePaths ?? [], "Worker sourcePaths");
      for (const p of paths)
        if (!sourcePaths.includes(p))
          throw Error(`Planner refers to unregistered source: ${p}`);
      return {
        id: w.id,
        question: text(w.question, "Worker question"),
        acceptanceCriteria,
        sourcePaths: [...new Set(paths)],
      };
    }),
  };
}
export function validateFindings(
  root,
  output,
  { sourceRoots, registeredPaths },
) {
  text(output?.summary, "Findings summary");
  const seen = new Set();
  const snapshots = new Map();
  const claims = list(output.claims, "Findings claims").map((c) => {
    id(c.id, "claim ID");
    if (seen.has(c.id)) throw Error(`Duplicate claim ${c.id}`);
    seen.add(c.id);
    if (!["high", "medium", "low"].includes(c.confidence))
      throw Error("Claim confidence must be high|medium|low");
    const evidence = list(c.evidence, "Claim evidence");
    if (!evidence.length) throw Error(`Claim ${c.id} has no evidence`);
    return {
      id: c.id,
      text: text(c.text, "Claim text"),
      confidence: c.confidence,
      evidence: evidence.map((e) => {
        text(e.path, "Evidence path");
        const path = relative(resolve(root), assertSafePath(root, e.path))
          .split(sep)
          .join("/");
        if (
          !registeredPaths.includes(path) &&
          !sourceRoots.some((base) => path.startsWith(base + "/"))
        )
          throw Error(
            `Evidence is outside registered sources and KB source layers: ${e.path}`,
          );
        const source = readEvidence(root, path);
        text(e.quote, "Evidence quote");
        if (!source.text.includes(e.quote))
          throw Error(`Quotation not found in source: ${e.path}`);
        snapshots.set(path, { path, sha256: source.sha256 });
        return {
          path,
          sha256: source.sha256,
          quote: e.quote,
          ...(e.url ? { url: text(e.url, "Source URL") } : {}),
          ...(e.date ? { date: text(e.date, "Source date") } : {}),
        };
      }),
    };
  });
  const uncertainties = strings(output.uncertainties, "Uncertainties");
  if (!claims.length && !uncertainties.length)
    throw Error("Findings require evidence or an explicit knowledge gap");
  const contradictions = list(output.contradictions, "Contradictions").map(
    (c) => {
      const claimIds = strings(c.claimIds, "Contradiction claimIds");
      if (new Set(claimIds).size < 2 || claimIds.some((x) => !seen.has(x)))
        throw Error(
          "Contradiction must reference at least two collected claims",
        );
      return {
        description: text(c.description, "Contradiction description"),
        claimIds,
      };
    },
  );
  return {
    summary: output.summary,
    claims,
    uncertainties,
    contradictions,
    sources: [...snapshots.values()],
  };
}
export function collectedClaims(workers) {
  return workers.flatMap((w) =>
    (w.result?.claims ?? []).map((c) => ({ ...c, key: `${w.id}/${c.id}` })),
  );
}
export function validateSynthesis(output, workers) {
  text(output?.summary, "Synthesis summary");
  const known = new Set(collectedClaims(workers).map((c) => c.key)),
    seen = new Set();
  const claims = list(output.claims, "Synthesis claims").map((c) => {
    id(c.id, "Final claim ID");
    if (seen.has(c.id)) throw Error(`Duplicate final claim: ${c.id}`);
    seen.add(c.id);
    const evidence = strings(c.evidence, "Synthesis evidence");
    if (!evidence.length || evidence.some((e) => !known.has(e)))
      throw Error(
        `Final claim ${c.id} cites unknown or missing worker evidence`,
      );
    return {
      id: c.id,
      text: text(c.text, "Final claim"),
      evidence: [...new Set(evidence)],
    };
  });
  const uncertainties = strings(
    output.uncertainties,
    "Synthesis uncertainties",
  );
  const contradictions = strings(
    output.contradictions,
    "Synthesis contradictions",
  );
  for (const w of workers) {
    for (const gap of w.result.uncertainties)
      if (!uncertainties.includes(gap))
        throw Error(`Preserve collected uncertainty: ${gap}`);
    for (const conflict of w.result.contradictions) {
      if (!contradictions.includes(conflict.description))
        throw Error(
          `Preserve collected contradiction: ${conflict.description}`,
        );
      for (const claimId of conflict.claimIds)
        if (!claims.some((c) => c.evidence.includes(`${w.id}/${claimId}`)))
          throw Error(
            "Both sides of a contradiction must remain in final evidence",
          );
    }
  }
  if (!claims.length && !uncertainties.length)
    throw Error("Synthesis has no evidence or explicit uncertainty");
  return { summary: output.summary, claims, uncertainties, contradictions };
}
export function validateResearchReview(output, synthesis) {
  text(output?.summary, "Review summary");
  if (!["passed", "changes-requested"].includes(output.verdict))
    throw Error("Review verdict must be passed|changes-requested");
  const ids = new Set();
  const checks = list(output.checks, "Review checks").map((c) => {
    const claim = synthesis.claims.find((x) => x.id === c.claimId);
    if (!claim || ids.has(c.claimId))
      throw Error("Unknown or duplicate reviewed claim");
    ids.add(c.claimId);
    if (!["supported", "unsupported", "uncertain"].includes(c.verdict))
      throw Error("Invalid claim review verdict");
    const evidence = strings(c.evidence, "Reviewed evidence");
    if (!evidence.length || evidence.some((e) => !claim.evidence.includes(e)))
      throw Error("Review must cite evidence attached to the final claim");
    if (
      output.verdict === "passed" &&
      (c.verdict !== "supported" ||
        claim.evidence.some((e) => !evidence.includes(e)))
    )
      throw Error(
        "Passed review requires support and inspection of all cited evidence",
      );
    return { ...c, evidence, note: text(c.note, "Review explanation") };
  });
  if (
    output.verdict === "passed" &&
    synthesis.claims.some((c) => !ids.has(c.id))
  )
    throw Error("Review must check every final claim");
  return { summary: output.summary, verdict: output.verdict, checks };
}
export function researchStaleness(root, task) {
  if (task?.research?.version !== 1) return [];
  const r = task.research,
    stale = [];
  const snapshots = [
    ...(r.sources ?? []),
    ...(r.workers ?? []).flatMap((w) => w.result?.sources ?? []),
  ];
  const outputs = [
    [r.planAttempt, r.plan],
    [r.synthesisAttempt, r.synthesis],
    [r.reviewAttempt, r.review],
    ...(r.workers ?? []).map((w) => [w.attempt, w.result]),
  ];
  for (const a of r.attempts ?? [])
    if (a.status !== "prepared") {
      try {
        const receipt = readEvidence(root, a.receiptPath);
        snapshots.push({ path: a.receiptPath, sha256: a.receiptHash });
        const saved = JSON.parse(receipt.text);
        if (
          saved.attemptId !== a.id ||
          saved.model !== a.model ||
          saved.contextId !== a.contextId ||
          saved.policyHash !== a.policyHash ||
          saved.inputsHash !== a.inputsHash ||
          saved.role !== a.role
        )
          throw Error("Attempt metadata differs from its immutable receipt");
        if (
          !a.usageReconciliation &&
          JSON.stringify(saved.usage) !== JSON.stringify(a.usage)
        )
          throw Error("Usage differs from receipt without reconciliation");
        for (const [key, output] of outputs)
          if (
            key === a.id &&
            JSON.stringify(saved.output) !== JSON.stringify(output)
          )
            throw Error(
              "Active research result differs from its immutable receipt",
            );
      } catch (e) {
        stale.push({
          path: a.receiptPath ?? ".remember/research",
          reason: e.message,
        });
      }
    }
  for (const [key, output] of outputs)
    if (
      output &&
      !r.attempts?.some((a) => a.id === key && a.status === "complete")
    )
      stale.push({
        path: ".remember/research",
        reason: "Research result has no completed attempt",
      });
  for (const s of snapshots) {
    try {
      if (sourceSnapshot(root, s.path).sha256 !== s.sha256)
        stale.push({
          path: s.path,
          reason: "Research evidence or receipt changed since recording",
        });
    } catch (e) {
      stale.push({ path: s.path, reason: e.message });
    }
  }
  return stale.filter((x, i, a) => a.findIndex((y) => y.path === x.path) === i);
}

// Dispatch ceilings use >=; a completed review may settle exactly at the ceiling.
export function researchCompletionIssues(research) {
  const b = researchBudget(research.budgetPolicy, research.attempts),
    l = research.budgetPolicy.limits,
    issues = [];
  if (b.pending) issues.push("Pending calls");
  if (b.calls > l.maxCalls) issues.push("Call budget exceeded");
  if (
    l.maxTotalTokens !== null &&
    (b.totalTokens === null || b.totalTokens > l.maxTotalTokens)
  )
    issues.push("Token budget exceeded or unknown");
  if (l.maxCostUsd !== null && (b.costUsd === null || b.costUsd > l.maxCostUsd))
    issues.push("Cost budget exceeded or unknown");
  return issues;
}
export function validateResearchTaskState(root, next, previous) {
  if (previous?.research && !next.research)
    throw Error("Cannot remove research history");
  if (!next.research) return;
  const r = next.research;
  if (
    r.version !== 1 ||
    next.workflow !== "research" ||
    !Array.isArray(r.attempts)
  )
    throw Error("Invalid research state");
  researchBudget(r.budgetPolicy, r.attempts);
  if (previous?.research) {
    const p = previous.research;
    for (const key of ["question", "policyHash", "budgetPolicy", "sourceRoots"])
      if (JSON.stringify(r[key]) !== JSON.stringify(p[key]))
        throw Error(
          `Cannot replace recorded research ${key}; start a new task`,
        );
    for (const old of p.attempts) {
      const a = r.attempts.find((x) => x.id === old.id);
      if (!a) throw Error("Cannot remove research attempt history");
      for (const key of [
        "role",
        "workerId",
        "modelAlias",
        "model",
        "provider",
        "mode",
        "policyHash",
        "inputsHash",
        "sourceInputs",
        "promptPath",
        "promptHash",
        "reservation",
      ])
        if (JSON.stringify(a[key]) !== JSON.stringify(old[key]))
          throw Error("Cannot rewrite prepared research attempt");
      if (old.status !== "prepared")
        for (const key of [
          "status",
          "contextId",
          "receiptPath",
          "receiptHash",
          "error",
        ])
          if (JSON.stringify(a[key]) !== JSON.stringify(old[key]))
            throw Error("Cannot rewrite settled research attempt");
      if (
        old.usage !== null &&
        JSON.stringify(a.usage) !== JSON.stringify(old.usage)
      )
        throw Error("Cannot rewrite known usage");
    }
  }
  const stale = researchStaleness(root, next);
  if (stale.some((s) => s.path.startsWith(".remember/")))
    throw Error("Research receipt or recorded output changed");
  if (next.status === "complete") {
    if (stale.length) throw Error("Research sources changed");
    if (r.policyHash !== loadResearchPolicy(root).sha256)
      throw Error("Research policy changed");
    if (
      !r.plan ||
      !r.workers.length ||
      r.workers.some((w) => !w.result) ||
      !r.synthesis ||
      r.review?.verdict !== "passed"
    )
      throw Error(
        "Research completion requires plan, findings, synthesis and passed review",
      );
    const reviewer = r.attempts.find((a) => a.id === r.reviewAttempt);
    if (
      r.attempts.some(
        (a) => a.role !== "reviewer" && a.contextId === reviewer.contextId,
      )
    )
      throw Error("Research review requires a separate context");
    validateResearchReview(r.review, r.synthesis);
    const issues = researchCompletionIssues(r);
    if (issues.length) throw Error(issues.join("; "));
  }
}
