'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const course = require('../course.js');
global.window = {};
require('../beginner-content.js');
require('../study-content.js');
const { labs, followUps } = window.STUDY_CONTENT;
const steps = course.build(window.BEGINNER_LESSONS, labs);

test('starts from zero and transitions through every level without skipping prior work', () => {
  const state = { lessonProgress: {}, studyLabs: { city: { done: true } } };
  assert.equal(course.next(steps, state).id, 'a0-01');
  assert.equal(new Set(steps.map((step) => step.id)).size, steps.length);
  assert.deepEqual([...new Set(steps.map((step) => step.level))], course.levels);
  for (const step of steps) {
    if (step.id === 'city') continue;
    assert.equal(course.next(steps, state).id, step.id);
    const progress = step.type === 'lesson' ? state.lessonProgress : state.studyLabs;
    progress[step.id] = { done: true };
  }
  assert.equal(course.next(steps, state), undefined);
});

test('every beginner lesson has a second scored question and lab answers are valid', () => {
  for (const lesson of window.BEGINNER_LESSONS) {
    const [question, options, answer] = followUps[lesson.id];
    assert.ok(question && options.length > 1 && options[answer], lesson.id);
  }
  for (const lab of labs) {
    assert.ok(lab.checks.length >= 2);
    for (const [, options, answer] of lab.checks) assert.ok(options[answer], lab.id);
  }
});

test('deduplication ignores punctuation and spacing while preserving capitalization and distinct meanings', () => {
  const cards = [
    { id: 'a', f: 'سلام!', b: 'Hallo!' },
    { id: 'b', f: 'سلام', b: 'Hallo' },
    { id: 'c', f: 'شما', b: 'Sie' },
    { id: 'd', f: 'شما', b: 'sie' },
    { id: 'e', f: 'فرستادن', b: 'senden' },
    { id: 'f', f: 'پخش کردن', b: 'senden' }
  ];
  assert.deepEqual(course.uniqueCards(cards).map((card) => card.id), ['a', 'c', 'd', 'e', 'f']);
});
