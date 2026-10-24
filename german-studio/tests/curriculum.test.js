'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const curriculum = require('../curriculum.js');

function masteredThrough(level) {
  const completed = {};
  const skillScores = {};
  curriculum.skills.forEach((skill) => { skillScores[skill] = 85; });
  curriculum.units.filter((unit) => curriculum.levels.indexOf(unit.level) <= curriculum.levels.indexOf(level)).forEach((unit) => {
    completed[unit.id] = { score: 85, attempts: 3 };
  });
  return { completed, skillScores, examAttempts: [] };
}

test('starts with the first A0 unit and honors prerequisites', () => {
  assert.equal(curriculum.nextLesson({}).id, 'a0-sounds');
  const partial = { completed: { 'a0-sounds': { score: 90, attempts: 1 } } };
  assert.equal(curriculum.nextLesson(partial).id, 'a0-sounds');
  partial.completed['a0-sounds'].attempts = 2;
  assert.equal(curriculum.nextLesson(partial).id, 'a0-numbers');
});

test('reports deterministic level progress and gate status', () => {
  const state = masteredThrough('A1');
  const progress = curriculum.levelProgress(state, 'A1');
  assert.deepEqual(progress, { level: 'A1', masteredUnits: 3, totalUnits: 3, percent: 100, averageScore: 85, skillFloor: 85, gatePassed: true });
  assert.equal(curriculum.nextLesson(state).id, 'a2-past');
});

test('B2 readiness requires curriculum, three mocks, and validated output', () => {
  const state = masteredThrough('B2');
  state.examAttempts = [
    { reading: 74, listening: 72, writing: 71, speaking: 70, validated: true },
    { reading: 76, listening: 75, writing: 73, speaking: 72, validated: true },
    { reading: 80, listening: 78, writing: 76, speaking: 74, validated: false }
  ];
  const readiness = curriculum.b2ExamReadiness(state);
  assert.equal(readiness.ready, true);
  assert.equal(readiness.weakestModule, 'speaking');
  state.examAttempts[0].speaking = 69;
  assert.equal(curriculum.b2ExamReadiness(state).ready, false);
});

test('recommendations consistently prioritize an opened lesson', () => {
  const state = { completed: { 'a0-sounds': { score: 60, attempts: 1 } }, skillScores: { speaking: 40, listening: 60 } };
  const first = curriculum.recommendations(state, 3);
  const second = curriculum.recommendations(state, 3);
  assert.deepEqual(first, second);
  assert.deepEqual(first[0], { type: 'lesson', id: 'a0-sounds', priority: 100, reason: 'نزدیک‌ترین حلقه یادگیری باز و دارای پیش‌نیاز کامل' });
});
