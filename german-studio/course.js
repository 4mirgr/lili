(function (root) {
  'use strict';

  const levels = ['A0', 'A1', 'A2', 'B1', 'B2', 'C1'];

  function build(lessons, labs) {
    return levels.flatMap((level) => [
      ...lessons.filter((item) => item.level === level).map((item) => ({
        ...item, type: 'lesson', href: '#lesson/' + item.id
      })),
      ...labs.filter((item) => item.level === level).map((item) => ({
        ...item, type: 'lab', href: '#studio/lab/' + item.id, minutes: 15
      }))
    ]);
  }

  function done(step, state) {
    const progress = step.type === 'lesson' ? state.lessonProgress : state.studyLabs;
    return Boolean(progress?.[step.id]?.done);
  }

  function next(steps, state) {
    return steps.find((step) => !done(step, state));
  }

  function cardKey(card) {
    const normalize = (text) => String(text).normalize('NFC')
      .replace(/[\u200c\u200d]/g, ' ').replace(/\s+/g, ' ')
      .trim().replace(/[.!?؟،]+$/u, '').trim();
    return normalize(card.f) + '\u001f' + normalize(card.b);
  }

  function uniqueCards(cards) {
    const seen = new Set();
    return cards.filter((card) => {
      const key = cardKey(card);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  const course = { levels, build, done, next, cardKey, uniqueCards };
  if (typeof module !== 'undefined' && module.exports) module.exports = course;
  else root.LiliCourse = course;
})(globalThis);
