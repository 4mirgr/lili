"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const E = require("../learning-engine.js");

const NOW = Date.parse("2026-01-01T00:00:00.000Z");

test("scheduler is deterministic and persists memory state", () => {
  const fresh = E.createReviewCard(NOW);
  assert.equal(fresh.due, "2026-01-01T00:00:00.000Z");
  const good = E.reviewCard(fresh, "good", NOW);
  assert.deepEqual(good, E.reviewCard(fresh, 3, NOW));
  assert.equal(good.state, "review");
  assert.equal(good.repetitions, 1);
  assert.ok(good.stability > 0.35);
  assert.ok(Date.parse(good.due) > NOW);
  const lapse = E.reviewCard(good, "again", NOW + 3 * 86400000);
  assert.equal(lapse.state, "relearning");
  assert.equal(lapse.lapses, 1);
  assert.equal(Date.parse(lapse.due), NOW + 3 * 86400000 + 10 * 60000);
  assert.throws(() => E.reviewCard(fresh, "perfect"), /rating/);
});

test("retrievability decays with elapsed time", () => {
  const card = { lastReview: "2026-01-01T00:00:00.000Z", stability: 10 };
  assert.equal(E.retrievability(card, NOW), 1);
  assert.ok(E.retrievability(card, NOW + 20 * 86400000) < E.retrievability(card, NOW + 5 * 86400000));
});

test("vocabulary notes represent German noun and verb knowledge", () => {
  const noun = E.createVocabularyNote({ lemma: "Wohnung", kind: "noun", article: "die", plural: "Wohnungen", meaningFa: "آپارتمان", collocations: ["eine Wohnung mieten", "eine Wohnung mieten"], now: NOW });
  assert.equal(noun.forms.article, "die");
  assert.equal(noun.forms.plural, "Wohnungen");
  assert.deepEqual(noun.collocations, ["eine Wohnung mieten"]);
  const verb = E.createVocabularyNote({ lemma: "beginnen", kind: "verb", forms: { thirdPerson: "beginnt", preterite: "begann", participleII: "begonnen", auxiliary: "haben" }, audio: { url: "/audio/beginnen.mp3", license: "CC BY" }, now: NOW });
  assert.equal(verb.forms.participleII, "begonnen");
  assert.equal(verb.audio.license, "CC BY");
  assert.throws(() => E.createVocabularyNote({ lemma: "Auto", kind: "noun", article: "den" }), /article/);
});

test("speaking rubric values intelligibility and avoids fake pronunciation score", () => {
  const attempt = E.createSpeakingAttempt({
    id: "s1", taskId: "b2-discussion", at: NOW, durationSeconds: 180,
    scores: { taskFulfilment: 3, coherence: 3, interaction: 4, intelligibility: 3, range: 3, accuracy: 2, fluency: 3 }
  });
  assert.equal(attempt.overall, 76.3);
  assert.equal(Object.hasOwn(attempt.scores, "pronunciationAccuracy"), false);
  assert.match(attempt.assessmentNotice, /intelligibility/);
  assert.throws(() => E.createSpeakingAttempt({ scores: { taskFulfilment: 5 } }), /missing rubric/);
});

test("writing supports draft-feedback-rewrite with measurable improvement", () => {
  let cycle = E.createWritingCycle({ taskId: "forum-1", targetLevel: "B2" });
  cycle = E.addWritingDraft(cycle, { at: NOW, text: "Erster Entwurf", scores: { taskFulfilment: 2, coherence: 2, range: 2, accuracy: 2, register: 2 }, feedback: ["Add evidence"], revisionPlan: ["Add an example"] });
  assert.equal(cycle.status, "feedback-received");
  cycle = E.addWritingDraft(cycle, { at: NOW + 1000, text: "Überarbeiteter Entwurf", scores: { taskFulfilment: 3, coherence: 3, range: 3, accuracy: 3, register: 3 } });
  assert.equal(cycle.status, "rewritten");
  assert.equal(cycle.drafts[0].overall, 50);
  assert.equal(E.writingImprovement(cycle), 25);
});

test("readiness requires robust module results and reviewed productive work", () => {
  const mockExams = [0, 1, 2].map((i) => ({ at: new Date(NOW + i * 86400000).toISOString(), reading: 76, listening: 72, writing: 71, speaking: 70 }));
  const ready = E.computeReadiness({ targetLevel: "B2", mockExams, reviewedWriting: 2, reviewedSpeaking: 2 });
  assert.equal(ready.ready, true);
  assert.equal(ready.weakestSkill, "speaking");
  assert.deepEqual(ready.blockers, []);
  const notReady = E.computeReadiness({ mockExams: mockExams.slice(0, 2), reviewedWriting: 1, reviewedSpeaking: 2 });
  assert.equal(notReady.ready, false);
  assert.ok(notReady.blockers.length >= 2);
});
