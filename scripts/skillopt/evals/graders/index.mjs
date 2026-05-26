// graders/index.mjs — registry graders. Phase 1: contains + label-presence.
// Phase 2 добавит json-schema и llm-judge.

import { CONTAINS_GRADER } from "./contains.mjs";
import { LABEL_PRESENCE_GRADER } from "./label-presence.mjs";

const REGISTRY = {
  [CONTAINS_GRADER.name]: CONTAINS_GRADER,
  [LABEL_PRESENCE_GRADER.name]: LABEL_PRESENCE_GRADER,
};

export function getGrader(name) {
  const g = REGISTRY[name];
  if (!g) {
    throw new Error(
      `[skillopt:graders] неизвестный grader "${name}". Доступны: ${Object.keys(REGISTRY).join(", ")}`,
    );
  }
  return g;
}

export function listGraders() {
  return Object.keys(REGISTRY);
}
