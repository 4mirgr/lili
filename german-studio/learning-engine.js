(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.LearningEngine = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const DAY = 86400000;
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const round = (value, places = 2) => Number(value.toFixed(places));
  const iso = (value) => new Date(value).toISOString();

  /**
   * Lightweight, deterministic FSRS-inspired scheduler. It keeps the useful
   * FSRS concepts (difficulty, stability and retrievability) without a runtime
   * dependency. It intentionally does not claim to reproduce trained FSRS
   * weights; callers may later migrate these fields to a full FSRS library.
   */
  function createReviewCard(now = Date.now()) {
    return {
      state: "new", due: iso(now), lastReview: null, repetitions: 0,
      lapses: 0, difficulty: 5, stability: 0, intervalDays: 0
    };
  }

  function retrievability(card, now = Date.now()) {
    if (!card.lastReview || !card.stability) return 0;
    const elapsed = Math.max(0, now - Date.parse(card.lastReview)) / DAY;
    return round(Math.pow(0.9, elapsed / card.stability), 4);
  }

  function reviewCard(card, rating, now = Date.now()) {
    const grades = { again: 1, hard: 2, good: 3, easy: 4 };
    const grade = typeof rating === "number" ? rating : grades[rating];
    if (![1, 2, 3, 4].includes(grade)) throw new RangeError("rating must be again, hard, good, easy or 1..4");
    const current = Object.assign(createReviewCard(now), card || {});
    const oldStability = Math.max(0.35, Number(current.stability) || 0.35);
    const oldDifficulty = clamp(Number(current.difficulty) || 5, 1, 10);
    const r = retrievability(current, now);
    let stability;
    let intervalDays;
    let state = "review";
    let lapses = Number(current.lapses) || 0;

    if (grade === 1) {
      stability = clamp(oldStability * 0.42, 0.35, 3650);
      intervalDays = 10 / 1440; // relearn in ten minutes
      state = "relearning";
      lapses += 1;
    } else {
      const gradeFactor = { 2: 0.72, 3: 1, 4: 1.38 }[grade];
      const growth = 1 + gradeFactor * (11 - oldDifficulty) * 0.17 * (1.08 - 0.55 * r);
      stability = clamp(oldStability * Math.max(1.08, growth), 0.35, 3650);
      intervalDays = Math.max(grade === 2 ? 1 : 2, Math.round(stability * ({ 2: 0.72, 3: 1, 4: 1.3 }[grade])));
    }
    const difficulty = clamp(oldDifficulty + ({ 1: 1.2, 2: 0.35, 3: -0.15, 4: -0.65 }[grade]), 1, 10);
    return {
      state,
      due: iso(now + intervalDays * DAY),
      lastReview: iso(now),
      repetitions: (Number(current.repetitions) || 0) + 1,
      lapses,
      difficulty: round(difficulty),
      stability: round(stability),
      intervalDays: round(intervalDays, 4)
    };
  }

  function createVocabularyNote(input) {
    if (!input || !String(input.lemma || "").trim()) throw new TypeError("lemma is required");
    const kind = input.kind || "other";
    if (!["noun", "verb", "adjective", "phrase", "other"].includes(kind)) throw new RangeError("invalid vocabulary kind");
    const forms = Object.assign({}, input.forms);
    if (kind === "noun") {
      if (input.article && !["der", "die", "das"].includes(input.article)) throw new RangeError("invalid German article");
      forms.article = input.article || forms.article || null;
      forms.plural = input.plural || forms.plural || null;
    }
    if (kind === "verb") {
      forms.thirdPerson = forms.thirdPerson || null;
      forms.preterite = forms.preterite || null;
      forms.participleII = forms.participleII || null;
      forms.auxiliary = forms.auxiliary || null;
      forms.preposition = forms.preposition || null;
    }
    return {
      id: input.id || String(input.lemma).trim().toLocaleLowerCase("de-DE").replace(/\s+/g, "-"),
      lemma: String(input.lemma).trim(), kind,
      meaningFa: String(input.meaningFa || "").trim(),
      level: input.level || "A1", forms,
      collocations: Array.from(new Set(input.collocations || [])),
      examples: (input.examples || []).map((x) => typeof x === "string" ? { de: x, fa: "" } : { de: x.de || "", fa: x.fa || "" }),
      audio: input.audio ? { url: input.audio.url || input.audio, speaker: input.audio.speaker || null, license: input.audio.license || null } : null,
      tags: Array.from(new Set(input.tags || [])),
      review: Object.assign(createReviewCard(input.now), input.review || {})
    };
  }

  const SPEAKING_WEIGHTS = Object.freeze({
    taskFulfilment: 0.2, coherence: 0.15, interaction: 0.15,
    intelligibility: 0.2, range: 0.1, accuracy: 0.1, fluency: 0.1
  });
  const WRITING_WEIGHTS = Object.freeze({ taskFulfilment: 0.3, coherence: 0.25, range: 0.2, accuracy: 0.2, register: 0.05 });

  function scoreRubric(scores, weights) {
    const missing = Object.keys(weights).filter((key) => !Number.isFinite(scores && scores[key]));
    if (missing.length) throw new TypeError("missing rubric scores: " + missing.join(", "));
    Object.keys(weights).forEach((key) => {
      if (scores[key] < 0 || scores[key] > 4) throw new RangeError(key + " must be between 0 and 4");
    });
    return round(Object.keys(weights).reduce((sum, key) => sum + scores[key] * weights[key], 0) * 25, 1);
  }

  function createSpeakingAttempt(input) {
    const overall = scoreRubric(input.scores, SPEAKING_WEIGHTS);
    return {
      id: input.id || "speaking-" + (input.at || Date.now()), taskId: input.taskId,
      at: iso(input.at || Date.now()), durationSeconds: input.durationSeconds || 0,
      transcript: input.transcript || "", audioUrl: input.audioUrl || null,
      scores: Object.assign({}, input.scores), overall,
      feedback: input.feedback || [], nextTry: input.nextTry || [],
      assessmentNotice: "This estimates CEFR/Goethe performance and intelligibility; it is not a phoneme-level pronunciation diagnosis."
    };
  }

  function createWritingCycle(input) {
    if (!input || !input.taskId) throw new TypeError("taskId is required");
    return { taskId: input.taskId, targetLevel: input.targetLevel || "B2", drafts: [] };
  }

  function addWritingDraft(cycle, draft) {
    if (!draft || !String(draft.text || "").trim()) throw new TypeError("draft text is required");
    const result = Object.assign({}, cycle, { drafts: (cycle.drafts || []).slice() });
    const entry = {
      version: result.drafts.length + 1, at: iso(draft.at || Date.now()), text: draft.text,
      scores: draft.scores ? Object.assign({}, draft.scores) : null,
      overall: draft.scores ? scoreRubric(draft.scores, WRITING_WEIGHTS) : null,
      feedback: draft.feedback || [], revisionPlan: draft.revisionPlan || []
    };
    result.drafts.push(entry);
    result.status = entry.scores ? "feedback-received" : "awaiting-feedback";
    if (result.drafts.length > 1) result.status = "rewritten";
    return result;
  }

  function writingImprovement(cycle) {
    const scored = (cycle.drafts || []).filter((d) => Number.isFinite(d.overall));
    return scored.length < 2 ? null : round(scored[scored.length - 1].overall - scored[0].overall, 1);
  }

  function computeReadiness(input) {
    const modules = ["reading", "listening", "writing", "speaking"];
    const exams = (input && input.mockExams || []).slice().sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
    const recent = exams.slice(0, 3);
    const averages = {};
    modules.forEach((m) => {
      const values = recent.map((e) => e[m]).filter(Number.isFinite);
      averages[m] = values.length ? round(values.reduce((a, b) => a + b, 0) / values.length, 1) : 0;
    });
    const weakest = modules.reduce((a, b) => averages[a] <= averages[b] ? a : b);
    const threeComplete = recent.length === 3 && recent.every((e) => modules.every((m) => Number.isFinite(e[m])));
    const eachExamPasses = threeComplete && recent.every((e) => modules.every((m) => e[m] >= 60));
    const averagesStrong = modules.every((m) => averages[m] >= 70);
    const reviewedOutputs = Number(input && input.reviewedWriting) >= 2 && Number(input && input.reviewedSpeaking) >= 2;
    const ready = threeComplete && eachExamPasses && averagesStrong && reviewedOutputs;
    return {
      ready, level: input && input.targetLevel || "B2", averages, weakestSkill: weakest,
      confidence: ready ? "high" : recent.length >= 2 ? "developing" : "insufficient-data",
      blockers: [
        !threeComplete && "Complete three full timed mock exams.",
        threeComplete && !eachExamPasses && "Reach at least 60 in every module of each recent mock.",
        !averagesStrong && "Raise every three-mock module average to at least 70.",
        !reviewedOutputs && "Get at least two reviewed Writing and two reviewed Speaking samples."
      ].filter(Boolean)
    };
  }

  return {
    version: "1.0.0", createReviewCard, retrievability, reviewCard,
    createVocabularyNote, createSpeakingAttempt, SPEAKING_WEIGHTS,
    createWritingCycle, addWritingDraft, writingImprovement, WRITING_WEIGHTS,
    scoreRubric, computeReadiness
  };
});
