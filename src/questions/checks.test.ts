import { describe, expect, it } from "vitest";
import { CONCEPT_GROUPS } from "./concept/bank";
import {
  buildCheck,
  CHECK_IDS,
  CHECK_LENGTH,
  CHECK_PLANS,
  newQuestionLike,
  shownVersions,
} from "./checks";

const SEEDS = Array.from({ length: 40 }, (_, i) => i * 104729 + 3);

describe("buildCheck", () => {
  it.each(CHECK_IDS)("%s has 5 questions, so 4 correct is 80%%", (checkId) => {
    for (const seed of SEEDS)
      expect(buildCheck(checkId, seed)).toHaveLength(CHECK_LENGTH);
  });

  it.each(CHECK_IDS)("%s mixes at least two question types", (checkId) => {
    const formats = new Set(buildCheck(checkId, 1).map((q) => q.format));
    expect(formats.size).toBeGreaterThanOrEqual(2);
  });

  it.each(CHECK_IDS)(
    "%s never asks two questions from the same concept group or with the same id",
    (checkId) => {
      for (const seed of SEEDS) {
        const questions = buildCheck(checkId, seed);
        const groups = questions.flatMap((q) =>
          q.concept ? [q.concept.groupId] : [],
        );
        expect(new Set(groups).size).toBe(groups.length);
        expect(new Set(questions.map((q) => q.id)).size).toBe(questions.length);
      }
    },
  );

  it("asks module checks only about their own module", () => {
    for (const m of [1, 2, 3, 4] as const) {
      for (const q of buildCheck(`module-${m}`, 7)) expect(q.objective).toBe(m);
    }
    for (const q of buildCheck("module-5", 7)) {
      expect(q.source).toBe("trace");
      expect(q.objective).toBe(5);
    }
  });

  it("covers every objective once in the final check", () => {
    expect(buildCheck("final", 7).map((q) => q.objective)).toEqual([
      1, 2, 3, 4, 5,
    ]);
  });

  it("covers every Module 4 concept plus one applied next-vertex trace", () => {
    const requiredGroups = new Set([
      "m4-start-values",
      "m4-next-rule",
      "m4-update-rule",
      "m4-is-final",
    ]);
    for (const seed of SEEDS) {
      const questions = buildCheck("module-4", seed);
      const concepts = questions.filter((q) => q.concept !== null);
      const traces = questions.filter((q) => q.trace !== null);
      expect(new Set(concepts.map((q) => q.concept!.groupId))).toEqual(
        requiredGroups,
      );
      expect(traces).toHaveLength(1);
      expect(traces[0]).toMatchObject({
        format: "select-vertex",
        trace: { skill: "next-vertex" },
      });
    }
  });

  it("keeps Module 5 trace skills balanced across every attempt", () => {
    for (const seed of SEEDS) {
      const traces = buildCheck("module-5", seed).map((q) => q.trace!.skill);
      expect(traces.filter((skill) => skill === "next-vertex")).toHaveLength(2);
      expect(traces.filter((skill) => skill === "new-distance")).toHaveLength(
        2,
      );
      expect(traces.filter((skill) => skill === "predict-update")).toHaveLength(
        1,
      );
    }
  });

  it("uses the four formats the brief asks for across the checks", () => {
    const formats = new Set(
      CHECK_IDS.flatMap((id) => buildCheck(id, 2).map((q) => q.format)),
    );
    expect(formats).toEqual(
      new Set(["multiple-choice", "select-vertex", "fill-in", "predict"]),
    );
  });

  it("gives the same questions for the same seed, and different ones for a new seed", () => {
    for (const id of CHECK_IDS) {
      expect(buildCheck(id, 99)).toEqual(buildCheck(id, 99));
      const ids = (seed: number) =>
        buildCheck(id, seed)
          .map((q) => q.id)
          .join();
      expect(new Set(SEEDS.map(ids)).size).toBeGreaterThan(1);
    }
  });

  it("never repeats the concept version shown last time", () => {
    for (const id of CHECK_IDS) {
      for (const seed of SEEDS) {
        const first = buildCheck(id, seed);
        const retry = buildCheck(id, seed + 1, shownVersions(first));
        const before = shownVersions(first);
        for (const q of retry) {
          if (q.concept && before[q.concept.groupId])
            expect(q.concept.versionId).not.toBe(before[q.concept.groupId]);
        }
      }
    }
  });

  it("only names concept groups that exist, with enough groups for each slot", () => {
    for (const plan of Object.values(CHECK_PLANS)) {
      const conceptSlots = plan.filter((p) => p.kind === "concept");
      for (const slot of conceptSlots) {
        for (const id of slot.from)
          expect(
            CONCEPT_GROUPS.some((g) => g.id === id),
            id,
          ).toBe(true);
      }
      const pool = new Set(conceptSlots.flatMap((s) => s.from));
      expect(pool.size).toBeGreaterThanOrEqual(conceptSlots.length);
    }
  });
});

describe("newQuestionLike", () => {
  const questions = CHECK_IDS.flatMap((id) =>
    SEEDS.slice(0, 10).flatMap((seed) => buildCheck(id, seed)),
  );

  it("gives a question of the same type but not the same question", () => {
    for (const q of questions) {
      const next = newQuestionLike(q, 12345);
      expect(next.typeKey, q.id).toBe(q.typeKey);
      expect(next.format, q.id).toBe(q.format);
      expect(next.objective, q.id).toBe(q.objective);
      expect(next.id, q.id).not.toBe(q.id);
    }
  });

  it("gives a different trace question even when asked with the same seed", () => {
    const q = questions.find((x) => x.trace)!;
    expect(newQuestionLike(q, q.trace!.seed).id).not.toBe(q.id);
  });

  it("gives a different concept version from the one just shown", () => {
    for (const q of questions.filter((x) => x.concept)) {
      for (const seed of [1, 2, 3])
        expect(newQuestionLike(q, seed).concept!.versionId).not.toBe(
          q.concept!.versionId,
        );
    }
  });
});

describe("shownVersions", () => {
  it("records the concept version of each concept question", () => {
    const questions = buildCheck("module-1", 5);
    const shown = shownVersions(questions);
    expect(Object.keys(shown)).toHaveLength(5);
    for (const q of questions)
      expect(shown[q.concept!.groupId]).toBe(q.concept!.versionId);
  });
});
