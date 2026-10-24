'use strict';

/**
 * Data-first German curriculum engine (A0-C1).
 *
 * The engine deliberately contains no UI or storage code. A user state is a plain
 * object and can therefore live in localStorage today and a database later.
 * Scores are integers from 0-100; completed lessons are keyed by unit id.
 */
(function exposeCurriculum(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.CURRICULUM = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function buildCurriculum() {
  const LEVELS = ['A0', 'A1', 'A2', 'B1', 'B2', 'C1'];
  const SKILLS = ['vocabulary', 'grammar', 'reading', 'listening', 'writing', 'speaking', 'pronunciation', 'mediation'];
  const OUTPUT_SKILLS = ['writing', 'speaking'];

  const levelDefinitions = {
    A0: { hours: [0, 35], canDo: ['نام، کشور و زبان خود را با عبارت‌های حفظ‌شده می‌گوید.', 'حروف، اعداد و صداهای پایه را تشخیص می‌دهد.'], gate: { minUnits: 2, minAverage: 70, skillFloor: 55 } },
    A1: { hours: [80, 120], canDo: ['در موقعیت‌های روزمره بسیار ساده اطلاعات ردوبدل می‌کند.', 'متن و پیام کوتاه شخصی می‌نویسد.'], gate: { minUnits: 3, minAverage: 72, skillFloor: 58 } },
    A2: { hours: [180, 240], canDo: ['درباره گذشته، برنامه‌ها و نیازهای روزمره گفت‌وگو می‌کند.', 'اطلاعات اصلی اعلان‌ها و متن‌های کوتاه را می‌فهمد.'], gate: { minUnits: 3, minAverage: 74, skillFloor: 60 } },
    B1: { hours: [320, 420], canDo: ['درباره تجربه‌ها و نظر خود پیوسته توضیح می‌دهد.', 'از پس بیشتر موقعیت‌های سفر و زندگی مستقل برمی‌آید.'], gate: { minUnits: 3, minAverage: 76, skillFloor: 62 } },
    B2: { hours: [500, 650], canDo: ['متن پیچیده را می‌فهمد و استدلال روشن و مفصل ارائه می‌کند.', 'با روانی کافی در بحث و تعامل فعال شرکت می‌کند.'], gate: { minUnits: 4, minAverage: 78, skillFloor: 65 } },
    C1: { hours: [700, 900], canDo: ['زبان را منعطف و دقیق برای اهداف اجتماعی، دانشگاهی و حرفه‌ای به کار می‌برد.', 'معانی ضمنی متن و گفتار دشوار را تشخیص می‌دهد.'], gate: { minUnits: 3, minAverage: 80, skillFloor: 68 } }
  };

  // These are representative units proving the shape of the full content bank.
  // Each unit is an assessable learning loop: input -> focus -> output -> retrieval.
  const units = [
    { id: 'a0-sounds', level: 'A0', order: 10, title: 'صداها، حروف و معرفی', prerequisites: [], skills: ['listening', 'pronunciation', 'speaking'], canDo: 'نام خود را هجی و خود را در دو جمله معرفی می‌کنم.', mastery: { minScore: 70, requiredAttempts: 2 } },
    { id: 'a0-numbers', level: 'A0', order: 20, title: 'عدد، ساعت و اطلاعات شخصی', prerequisites: ['a0-sounds'], skills: ['vocabulary', 'listening', 'speaking'], canDo: 'عدد، شماره و ساعت ساده را می‌پرسم و می‌گویم.', mastery: { minScore: 70, requiredAttempts: 2 } },
    { id: 'a1-daily-life', level: 'A1', order: 10, title: 'روزمره و جایگاه فعل', prerequisites: ['a0-numbers'], skills: ['grammar', 'vocabulary', 'reading', 'speaking'], canDo: 'برنامه روزانه‌ام را با جمله‌های اصلی توصیف می‌کنم.', mastery: { minScore: 72, requiredAttempts: 2 } },
    { id: 'a1-services', level: 'A1', order: 20, title: 'خرید، مسیر و خدمات', prerequisites: ['a1-daily-life'], skills: ['listening', 'reading', 'speaking', 'mediation'], canDo: 'در خرید و پرسیدن مسیر نیازم را مؤدبانه بیان می‌کنم.', mastery: { minScore: 72, requiredAttempts: 2 } },
    { id: 'a1-messages', level: 'A1', order: 30, title: 'پیام و قرار کوتاه', prerequisites: ['a1-services'], skills: ['writing', 'reading', 'grammar'], canDo: 'یک پیام کوتاه برای هماهنگی یا عذرخواهی می‌نویسم.', mastery: { minScore: 72, requiredAttempts: 2 } },
    { id: 'a2-past', level: 'A2', order: 10, title: 'روایت گذشته با Perfekt', prerequisites: ['a1-messages'], skills: ['grammar', 'listening', 'speaking'], canDo: 'یک اتفاق گذشته را به ترتیب زمانی تعریف می‌کنم.', mastery: { minScore: 74, requiredAttempts: 2 } },
    { id: 'a2-plans', level: 'A2', order: 20, title: 'برنامه، سفر و حل مسئله', prerequisites: ['a2-past'], skills: ['vocabulary', 'reading', 'speaking', 'mediation'], canDo: 'برای سفر برنامه می‌ریزم و یک مشکل معمول را حل می‌کنم.', mastery: { minScore: 74, requiredAttempts: 2 } },
    { id: 'a2-email', level: 'A2', order: 30, title: 'درخواست و ایمیل رسمی ساده', prerequisites: ['a2-plans'], skills: ['writing', 'grammar', 'reading'], canDo: 'یک درخواست روشن و مؤدبانه با شروع و پایان مناسب می‌نویسم.', mastery: { minScore: 74, requiredAttempts: 2 } },
    { id: 'b1-narrative', level: 'B1', order: 10, title: 'روایت و جمله وابسته', prerequisites: ['a2-email'], skills: ['grammar', 'listening', 'speaking'], canDo: 'تجربه‌ای را با جزئیات و پیونددهنده‌ها روایت می‌کنم.', mastery: { minScore: 76, requiredAttempts: 2 } },
    { id: 'b1-opinion', level: 'B1', order: 20, title: 'نظر، دلیل و واکنش', prerequisites: ['b1-narrative'], skills: ['reading', 'vocabulary', 'speaking', 'mediation'], canDo: 'نظر خود را دلیل‌دار بیان و به نظر دیگری پاسخ می‌دهم.', mastery: { minScore: 76, requiredAttempts: 2 } },
    { id: 'b1-formal', level: 'B1', order: 30, title: 'نامه رسمی و شکایت', prerequisites: ['b1-opinion'], skills: ['writing', 'grammar'], canDo: 'نامه‌ای منظم برای درخواست یا شکایت می‌نویسم.', mastery: { minScore: 76, requiredAttempts: 2 } },
    { id: 'b2-complex-input', level: 'B2', order: 10, title: 'متن و گفتار پیچیده', prerequisites: ['b1-formal'], skills: ['reading', 'listening', 'vocabulary'], canDo: 'موضع و جزئیات مهم گزارش و مصاحبه را استخراج می‌کنم.', mastery: { minScore: 78, requiredAttempts: 3 } },
    { id: 'b2-argument', level: 'B2', order: 20, title: 'استدلال و تعامل', prerequisites: ['b2-complex-input'], skills: ['speaking', 'mediation', 'pronunciation'], canDo: 'از یک موضع دفاع، مخالفت مؤدبانه و جمع‌بندی می‌کنم.', mastery: { minScore: 78, requiredAttempts: 3 } },
    { id: 'b2-writing', level: 'B2', order: 30, title: 'متن استدلالی و پیام رسمی', prerequisites: ['b2-argument'], skills: ['writing', 'grammar', 'vocabulary'], canDo: 'متنی منسجم، متناسب با مخاطب و دارای شواهد می‌نویسم.', mastery: { minScore: 78, requiredAttempts: 3 } },
    { id: 'b2-exam-lab', level: 'B2', order: 40, title: 'آزمایشگاه Goethe B2', prerequisites: ['b2-writing'], skills: ['reading', 'listening', 'writing', 'speaking'], canDo: 'چهار ماژول را با محدودیت زمانی و راهبرد آزمون انجام می‌دهم.', mastery: { minScore: 80, requiredAttempts: 3 } },
    { id: 'c1-nuance', level: 'C1', order: 10, title: 'ظرافت معنا و سبک', prerequisites: ['b2-exam-lab'], skills: ['reading', 'listening', 'vocabulary', 'mediation'], canDo: 'معنای ضمنی و تغییر سبک را در منابع دشوار تشخیص می‌دهم.', mastery: { minScore: 80, requiredAttempts: 3 } },
    { id: 'c1-academic', level: 'C1', order: 20, title: 'نوشتار تحلیلی و ترکیب منابع', prerequisites: ['c1-nuance'], skills: ['writing', 'reading', 'grammar'], canDo: 'چند منبع را در متنی دقیق و ساختاریافته ترکیب می‌کنم.', mastery: { minScore: 80, requiredAttempts: 3 } },
    { id: 'c1-discourse', level: 'C1', order: 30, title: 'ارائه و بحث پیشرفته', prerequisites: ['c1-academic'], skills: ['speaking', 'listening', 'pronunciation', 'mediation'], canDo: 'دیدگاه پیچیده را روان ارائه و واکنش‌های ظریف را مدیریت می‌کنم.', mastery: { minScore: 80, requiredAttempts: 3 } }
  ];

  function cleanState(state) {
    const value = state || {};
    return { completed: value.completed || {}, skillScores: value.skillScores || {}, examAttempts: Array.isArray(value.examAttempts) ? value.examAttempts : [] };
  }

  function resultFor(state, unitId) {
    const raw = cleanState(state).completed[unitId];
    if (typeof raw === 'number') return { score: raw, attempts: 1 };
    return raw || { score: 0, attempts: 0 };
  }

  function isMastered(state, unit) {
    const result = resultFor(state, unit.id);
    return Number(result.score) >= unit.mastery.minScore && Number(result.attempts) >= unit.mastery.requiredAttempts;
  }

  function prerequisitesMet(state, unit) {
    return unit.prerequisites.every(function (id) {
      const dependency = units.find(function (candidate) { return candidate.id === id; });
      return dependency && isMastered(state, dependency);
    });
  }

  function scoreForSkill(state, skill) {
    const explicit = Number(cleanState(state).skillScores[skill]);
    if (Number.isFinite(explicit)) return Math.max(0, Math.min(100, explicit));
    const relevant = units.filter(function (unit) { return unit.skills.includes(skill) && resultFor(state, unit.id).attempts > 0; });
    if (!relevant.length) return 0;
    return Math.round(relevant.reduce(function (sum, unit) { return sum + Number(resultFor(state, unit.id).score || 0); }, 0) / relevant.length);
  }

  function levelProgress(state, level) {
    if (!LEVELS.includes(level)) throw new Error('Unknown CEFR level: ' + level);
    const relevant = units.filter(function (unit) { return unit.level === level; });
    const mastered = relevant.filter(function (unit) { return isMastered(state, unit); });
    const average = relevant.length ? Math.round(relevant.reduce(function (sum, unit) { return sum + Number(resultFor(state, unit.id).score || 0); }, 0) / relevant.length) : 0;
    const requiredSkills = Array.from(new Set(relevant.flatMap(function (unit) { return unit.skills; })));
    const skillFloor = requiredSkills.length ? Math.min.apply(null, requiredSkills.map(function (skill) { return scoreForSkill(state, skill); })) : 0;
    const gate = levelDefinitions[level].gate;
    return {
      level: level,
      masteredUnits: mastered.length,
      totalUnits: relevant.length,
      percent: relevant.length ? Math.round(mastered.length / relevant.length * 100) : 0,
      averageScore: average,
      skillFloor: skillFloor,
      gatePassed: mastered.length >= gate.minUnits && average >= gate.minAverage && skillFloor >= gate.skillFloor
    };
  }

  function nextLesson(state) {
    const available = units.filter(function (unit) { return !isMastered(state, unit) && prerequisitesMet(state, unit); });
    if (!available.length) return null;
    return available.sort(function (a, b) {
      const aTried = resultFor(state, a.id).attempts > 0 ? 0 : 1;
      const bTried = resultFor(state, b.id).attempts > 0 ? 0 : 1;
      if (aTried !== bTried) return aTried - bTried; // finish an opened learning loop first
      return LEVELS.indexOf(a.level) - LEVELS.indexOf(b.level) || a.order - b.order;
    })[0];
  }

  function b2ExamReadiness(state) {
    const attempts = cleanState(state).examAttempts.slice(-3);
    const modules = ['reading', 'listening', 'writing', 'speaking'];
    const latest = attempts[attempts.length - 1] || {};
    const moduleScores = Object.fromEntries(modules.map(function (skill) { return [skill, Number(latest[skill]) || 0]; }));
    const weakestModule = modules.slice().sort(function (a, b) { return moduleScores[a] - moduleScores[b] || a.localeCompare(b); })[0];
    const threePasses = attempts.length === 3 && attempts.every(function (attempt) { return modules.every(function (skill) { return Number(attempt[skill]) >= 70; }); });
    const noRecentWeakSkill = modules.every(function (skill) { return scoreForSkill(state, skill) >= 65; });
    const outputValidated = OUTPUT_SKILLS.every(function (skill) {
      return attempts.filter(function (attempt) { return Number(attempt[skill]) >= 70 && attempt.validated === true; }).length >= 2;
    });
    const curriculumReady = levelProgress(state, 'B2').gatePassed;
    return {
      ready: curriculumReady && threePasses && noRecentWeakSkill && outputValidated,
      curriculumReady: curriculumReady,
      consecutivePassingMocks: threePasses ? 3 : attempts.reduce(function (count, attempt) { return modules.every(function (skill) { return Number(attempt[skill]) >= 70; }) ? count + 1 : 0; }, 0),
      outputValidated: outputValidated,
      moduleScores: moduleScores,
      weakestModule: weakestModule,
      disclaimer: 'این شاخص آموزشی است و قبولی رسمی Goethe را تضمین نمی‌کند.'
    };
  }

  function recommendations(state, limit) {
    const max = Number.isInteger(limit) && limit > 0 ? limit : 3;
    const suggestions = [];
    const next = nextLesson(state);
    if (next) suggestions.push({ type: 'lesson', id: next.id, priority: 100, reason: 'نزدیک‌ترین حلقه یادگیری باز و دارای پیش‌نیاز کامل' });
    SKILLS.map(function (skill) { return { skill: skill, score: scoreForSkill(state, skill) }; })
      .sort(function (a, b) { return a.score - b.score || a.skill.localeCompare(b.skill); })
      .slice(0, 2)
      .forEach(function (item, index) { suggestions.push({ type: 'skill', id: item.skill, priority: 80 - index, score: item.score, reason: 'ضعیف‌ترین مهارت قابل مشاهده' }); });
    const readiness = b2ExamReadiness(state);
    if (levelProgress(state, 'B1').gatePassed && !readiness.ready) suggestions.push({ type: 'exam-practice', id: readiness.weakestModule, priority: 70, reason: 'ضعیف‌ترین ماژول در سنجش آمادگی B2' });
    return suggestions.sort(function (a, b) { return b.priority - a.priority || a.id.localeCompare(b.id); }).slice(0, max);
  }

  return Object.freeze({
    version: '1.0.0',
    levels: LEVELS,
    skills: SKILLS,
    levelDefinitions: levelDefinitions,
    units: units,
    isMastered: isMastered,
    prerequisitesMet: prerequisitesMet,
    nextLesson: nextLesson,
    recommendations: recommendations,
    levelProgress: levelProgress,
    b2ExamReadiness: b2ExamReadiness
  });
});
