'use strict';
/* Lili Deutsch — offline PWA. Each of up to five local profiles has isolated progress. */
const D = window.DATA;
const $ = (s, el = document) => el.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fa = (n) => String(n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]);
const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

const todayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const dayNum = (key = todayKey()) => Math.round(Date.parse(key + 'T00:00:00Z') / 864e5);
const keyFromNum = (n) => new Date(n * 864e5).toISOString().slice(0, 10);
const mmss = (s) => { s = Math.max(0, Math.round(s)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };

/* ---------------- storage ---------------- */
const DB = (() => {
  let dbp;
  const open = () => dbp || (dbp = new Promise((res, rej) => {
    const r = indexedDB.open('lili-deutsch', 1);
    r.onupgradeneeded = () => { r.result.createObjectStore('kv'); r.result.createObjectStore('rec', { keyPath: 'id' }); };
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  }));
  const tx = async (store, mode, fn) => {
    const db = await open();
    return new Promise((res, rej) => {
      const t = db.transaction(store, mode);
      const req = fn(t.objectStore(store));
      t.oncomplete = () => res(req && req.result);
      t.onerror = t.onabort = () => rej(t.error);
    });
  };
  return {
    get: (k) => tx('kv', 'readonly', (s) => s.get(k)),
    set: (k, v) => tx('kv', 'readwrite', (s) => s.put(v, k)),
    putRec: (r) => tx('rec', 'readwrite', (s) => s.put(r)),
    getRec: (id) => tx('rec', 'readonly', (s) => s.get(id)),
    delRec: (id) => tx('rec', 'readwrite', (s) => s.delete(id))
  };
})();

const DEFAULT = () => ({
  v: 1, start: todayKey(),
  settings: { rate: 0.95, voice: '', newPerDay: 8, theme: 'auto' },
  done: {}, log: {}, srs: {}, userCards: [], gram: {}, pairs: {},
  essays: [], drafts: {}, writingCycles: {}, speaks: [], diag: null, p1i: 0, cardi: 0,
  curriculum: { completed: {}, skillScores: {}, examAttempts: [] }
});
let S = DEFAULT();

const profileStore = {
  read() {
    try { return JSON.parse(localStorage.getItem('ld-profiles')) || { active: 'p1', items: [{ id: 'p1', name: 'زبان‌آموز ۱' }] }; }
    catch (_) { return { active: 'p1', items: [{ id: 'p1', name: 'زبان‌آموز ۱' }] }; }
  },
  write(v) { localStorage.setItem('ld-profiles', JSON.stringify(v)); }
};
let PROFILES = profileStore.read();
const stateKey = () => `state:${PROFILES.active}`;
const activeProfile = () => PROFILES.items.find((p) => p.id === PROFILES.active) || PROFILES.items[0];

async function load() {
  let s = null;
  try { s = await DB.get(stateKey()); } catch (e) { /* IndexedDB unavailable */ }
  if (!s) { try { s = JSON.parse(localStorage.getItem('ld-' + stateKey()) || 'null'); } catch (e) { /* ignore */ } }
  S = Object.assign(DEFAULT(), s || {});
  S.settings = Object.assign(DEFAULT().settings, S.settings || {});
}
let saveT;
function save() {
  clearTimeout(saveT);
  const key = stateKey();
  const snapshot = JSON.parse(JSON.stringify(S));
  saveT = setTimeout(async () => {
    try { await DB.set(key, snapshot); }
    catch (e) { try { localStorage.setItem('ld-' + key, JSON.stringify(snapshot)); } catch (e2) { toast('ذخیره نشد: فضای مرورگر پر است'); } }
  }, 150);
}

/* ---------------- ui helpers ---------------- */
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), 2200);
}
async function copyText(text) {
  try { await navigator.clipboard.writeText(text); }
  catch (e) {
    const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta);
    ta.select(); document.execCommand('copy'); ta.remove();
  }
  toast('کپی شد — در گفتگو با مربی هوش مصنوعی پیست کن');
}
function applyTheme() {
  const t = S.settings.theme;
  if (t === 'auto') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme', t);
}

/* ---------------- speech synthesis ---------------- */
let voices = [];
function loadVoices() { voices = (speechSynthesis.getVoices() || []).filter((v) => /^de[-_]/i.test(v.lang)); }
if ('speechSynthesis' in window) { loadVoices(); speechSynthesis.onvoiceschanged = loadVoices; }
function speak(text, rate, onend) {
  if (!('speechSynthesis' in window)) { toast('این مرورگر TTS ندارد'); return; }
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'de-DE';
  const v = voices.find((x) => x.voiceURI === S.settings.voice) || voices.find((x) => /anna|petra|markus|vicki/i.test(x.name)) || voices[0];
  if (v) u.voice = v;
  u.rate = rate || S.settings.rate;
  if (onend) u.onend = onend;
  speechSynthesis.speak(u);
}

/* ---------------- recorder ---------------- */
const Rec = {
  stream: null, mr: null, chunks: [], t0: 0,
  async ensure() {
    if (this.stream && this.stream.active) return;
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
  },
  async start() {
    await this.ensure();
    const type = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm'].find((t) => window.MediaRecorder && MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t));
    this.mr = new MediaRecorder(this.stream, type ? { mimeType: type } : undefined);
    this.chunks = [];
    this.mr.ondataavailable = (e) => { if (e.data && e.data.size) this.chunks.push(e.data); };
    this.mr.start(1000);
    this.t0 = Date.now();
  },
  get recording() { return !!(this.mr && this.mr.state === 'recording'); },
  stop() {
    return new Promise((res) => {
      if (!this.recording) return res(null);
      this.mr.onstop = () => res({ blob: new Blob(this.chunks, { type: this.mr.mimeType || 'audio/mp4' }), dur: (Date.now() - this.t0) / 1000 });
      this.mr.stop();
    });
  },
  release() { if (this.stream) this.stream.getTracks().forEach((t) => t.stop()); this.stream = null; }
};
const micError = (e) => toast('دسترسی به میکروفون ممکن نشد: ' + (e && e.name ? e.name : 'خطا'));

/* ---------------- progress logging ---------------- */
function markDone(k, minutes) {
  const d = todayKey();
  S.done[d] = S.done[d] || {};
  if (S.done[d][k]) return;
  const task = planFor(d).find((t) => t.k === k);
  S.done[d][k] = true;
  S.log[d] = (S.log[d] || 0) + (minutes || (task ? task.m : 10));
  save();
}
const isDone = (k, d = todayKey()) => !!(S.done[d] && S.done[d][k]);

/* ---------------- daily plan ---------------- */
function monthNo() { return Math.max(1, Math.floor((dayNum() - dayNum(S.start)) / 30.44) + 1); }
function phase() { const m = monthNo(); return D.phases.find((p) => m <= p.to) || D.phases[D.phases.length - 1]; }
function benchDue() {
  const last = S.speaks.filter((s) => s.mode === 'bench').map((s) => dayNum(s.date)).sort((a, b) => b - a)[0];
  return last === undefined || dayNum() - last >= 30;
}
function planFor(key) {
  const tasks = [];
  const wd = new Date(key + 'T12:00:00').getDay(); // 0 Sun … 6 Sat
  tasks.push({ k: 'srs', t: 'مرور کارت‌ها (SRS)', m: 8, h: '#practice/srs' });
  if (wd !== 5) tasks.push({ k: 'pron', t: 'تلفظ: Shadowing یا جفت‌های کمینه', m: 10, h: '#pron' });
  const rot = {
    6: [{ k: 'speak', t: 'ارائه و بحث تکمیلی', m: 12, h: '#speak/p2' }, { k: 'grammar', t: 'گرامر هدفمند (۱۰ سؤال)', m: 10, h: '#practice/gram/weak' }],
    0: [{ k: 'speak', t: 'روانی ۴/۳/۲ (یک موضوع، سه بار)', m: 12, h: '#speak/f432' }, { k: 'write', t: 'نوشتن: یک پاراگراف بدنه', m: 12, h: '#write' }],
    1: [{ k: 'speak', t: 'نقش‌آفرینی موقعیت واقعی', m: 12, h: '#speak/pt' }, { k: 'grammar', t: 'گرامر هدفمند', m: 10, h: '#practice/gram/weak' }],
    2: [{ k: 'speak', t: 'پرسش‌های کوتاه', m: 10, h: '#speak/p1' }, { k: 'write', t: 'نوشتن: نامه یا مقدمه + نتیجه‌گیری', m: 15, h: '#write' }],
    3: [{ k: 'ai', t: 'گفتگوی صوتی با AI (پرامپت آماده)', m: 15, h: '#ai' }, { k: 'grammar', t: 'گرامر هدفمند', m: 7, h: '#practice/gram/weak' }],
    4: [{ k: 'speak', t: 'ارائه و بحث تکمیلی', m: 12, h: '#speak/p2' }, { k: 'write', t: 'نوشتن: طرح یک متن استدلالی', m: 10, h: '#write' }],
    5: [{ k: 'write', t: 'متن کامل با زمان‌سنج (۴۰ دقیقه)', m: 40, h: '#write' }]
  };
  tasks.push(...rot[wd]);
  if (key === todayKey() && benchDue()) tasks.push({ k: 'bench', t: 'ضبط benchmark ماهانه (همان کارت ثابت)', m: 4, h: '#speak/bench' });
  return tasks;
}

/* ---------------- router ---------------- */
let cleanup = null;
function route() {
  if (cleanup) { try { cleanup(); } catch (e) { /* ignore */ } cleanup = null; }
  if ('speechSynthesis' in window) speechSynthesis.cancel();
  const parts = (location.hash.slice(1) || 'today').split('/');
  const name = parts[0];
  const views = { today: vToday, path: vPath, speak: vSpeak, pron: vPron, practice: vPractice, write: vWrite, progress: vProgress, settings: vSettings, diag: vDiag, ai: vAI };
  (views[name] || vToday)(...parts.slice(1));
  document.querySelectorAll('#nav a').forEach((a) => a.classList.toggle('on', a.dataset.r === name));
  $('#daybadge').textContent = `${activeProfile().name} | روز ${fa(dayNum() - dayNum(S.start) + 1)} | ماه ${fa(monthNo())} از ۲۴`;
  window.scrollTo(0, 0);
}
const render = (html) => { $('#view').innerHTML = html; };
const ACT = {};
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-act]');
  if (!b) return;
  const fn = ACT[b.dataset.act];
  if (fn) { e.preventDefault(); fn(b, e); }
});
ACT.say = (b) => speak(b.dataset.text, b.dataset.rate ? Number(b.dataset.rate) : undefined);
ACT.copy = (b) => copyText(b.dataset.text || $(b.dataset.src).textContent);

/* ================= TODAY ================= */
function vToday() {
  const k = todayKey();
  const plan = planFor(k);
  const done = plan.filter((t) => isDone(t.k)).length;
  const total = plan.reduce((a, t) => a + t.m, 0);
  const ph = phase();
  render(`
    ${!S.diag ? `<div class="card accent"><h2>قدم اول: آزمون تعیین سطح</h2><p>${fa(D.diag.length)} سؤال از A1 تا C1، سپس یک متن و یک ضبط گفتار. اگر از صفر شروع می‌کنی، «نمی‌دانم» انتخاب کن.</p><a class="btn" href="#diag">شروع آزمون</a></div>` : ''}
    <div class="card">
      <div class="spread"><h2>برنامهٔ امروز</h2><span class="pill">${fa(done)}/${fa(plan.length)} | حدود ${fa(total)} دقیقه</span></div>
      <div>${plan.map((t) => `
        <div class="task ${isDone(t.k) ? 'done' : ''}">
          <button class="chk" data-act="toggle" data-k="${t.k}" aria-label="انجام شد">${isDone(t.k) ? '✓' : ''}</button>
          <a class="ttl" href="${t.h}">${esc(t.t)}</a><span class="min">${fa(t.m)} دقیقه</span>
        </div>`).join('')}</div>
    </div>
    <div class="card soft">
      <h3>فاز فعلی: ${ph.name}</h3>
      <p class="muted">${ph.focus}</p>
    </div>
    <div class="card">
      <h3>ورودی شنیداری (بیرون از زمان اپ)</h3>
      <p class="muted">در رفت‌وآمد یا ورزش. شنیدن زیاد پایهٔ لهجه است، ولی به‌تنهایی کافی نیست.</p>
      ${D.listen.map((l) => `<p><b class="en">${esc(l.t)}</b><br><span class="muted">${esc(l.n)}</span></p>`).join('')}
    </div>`);
}
ACT.toggle = (b) => {
  const k = todayKey(); const key = b.dataset.k;
  S.done[k] = S.done[k] || {};
  if (S.done[k][key]) {
    const t = planFor(k).find((x) => x.k === key);
    delete S.done[k][key];
    S.log[k] = Math.max(0, (S.log[k] || 0) - (t ? t.m : 10));
    save();
  } else markDone(key);
  vToday();
};

/* ================= MASTERY PATH ================= */
function vPath() {
  const C = window.CURRICULUM;
  if (!C) return render('<div class="card">موتور مسیر آموزشی بارگذاری نشد.</div>');
  S.curriculum = Object.assign({ completed: {}, skillScores: {}, examAttempts: [] }, S.curriculum || {});
  const next = C.nextLesson(S.curriculum);
  const ready = C.b2ExamReadiness(S.curriculum);
  const levelCards = C.levels.map((level) => {
    const p = C.levelProgress(S.curriculum, level);
    const units = C.units.filter((u) => u.level === level);
    return `<div class="card"><div class="spread"><h2 class="en">${level}</h2><span class="pill ${p.gatePassed ? 'on' : ''}">${fa(p.percent)}٪ ${p.gatePassed ? '· عبور' : ''}</span></div>
      <p class="muted">${esc(C.levelDefinitions[level].canDo.join(' · '))}</p>
      ${units.map((u) => { const r = S.curriculum.completed[u.id] || {}; return `<details class="sent"><summary>${esc(u.title)} ${r.score ? `· ${fa(r.score)}٪ / ${fa(r.attempts || 0)} تلاش` : ''}</summary>
        <p>${esc(u.canDo)}</p><div class="row"><input type="number" min="0" max="100" inputmode="numeric" id="unit-${u.id}" placeholder="نمره ۰–۱۰۰" style="width:130px"><button class="btn small" data-act="unitScore" data-id="${u.id}">ثبت تلاش</button></div></details>`; }).join('')}</div>`;
  }).join('');
  render(`<h1>مسیر تسلط A0 تا C1</h1>
    <div class="card accent"><h2>${next ? 'درس پیشنهادی: ' + esc(next.title) : 'همه واحدهای مسیر ثبت‌شده کامل شده‌اند'}</h2>
      ${next ? `<p>${esc(next.canDo)}</p><span class="pill en">${next.level}</span>` : ''}</div>
    <div class="card"><div class="spread"><h2>آمادگی Goethe B2</h2><span class="pill ${ready.ready ? 'on' : ''}">${ready.ready ? 'آماده' : 'در حال پیشرفت'}</span></div>
      <p class="muted">نیازمند سه آزمون کامل متوالی با حداقل ۷۰ در هر ماژول و ارزیابی معتبر خروجی‌های گفتار/نوشتار است. این شاخص تضمین رسمی قبولی نیست.</p>
      <div class="grid2">${['reading','listening','writing','speaking'].map((k) => `<label>${({reading:'خواندن',listening:'شنیدن',writing:'نوشتن',speaking:'گفتار'})[k]}<input type="number" min="0" max="100" id="mock-${k}" style="width:100%" placeholder="۰–۱۰۰"></label>`).join('')}</div>
      <label class="chkrow"><input type="checkbox" id="mock-validated"> نوشتن و گفتار این آزمون با rubric توسط مربی/ارزیاب بررسی شده‌اند</label>
      <button class="btn" data-act="addMock">ثبت آزمون کامل</button></div>
    ${levelCards}`);
}
ACT.unitScore = (b) => {
  const input = $('#unit-' + b.dataset.id); const score = Number(input.value);
  if (!Number.isFinite(score) || score < 0 || score > 100) return toast('نمره معتبر ۰ تا ۱۰۰ وارد کن');
  const old = S.curriculum.completed[b.dataset.id] || { attempts: 0 };
  S.curriculum.completed[b.dataset.id] = { score, attempts: Number(old.attempts || 0) + 1, at: new Date().toISOString() };
  save(); vPath();
};
ACT.addMock = () => {
  const attempt = { at: new Date().toISOString(), validated: $('#mock-validated').checked };
  for (const k of ['reading','listening','writing','speaking']) { const n = Number($('#mock-' + k).value); if (!Number.isFinite(n) || n < 0 || n > 100) return toast('هر چهار نمره آزمون را وارد کن'); attempt[k] = n; }
  S.curriculum.examAttempts.push(attempt); S.curriculum.examAttempts = S.curriculum.examAttempts.slice(-12); save(); vPath();
};

/* ================= SPEAKING ================= */
function vSpeak(mode, arg) {
  if (mode === 'p1') return speakSession({ mode: 'p1', item: D.part1[S.p1i % D.part1.length] });
  if (mode === 'p2') return speakSession({ mode: 'p2', item: arg ? D.cards.find((c) => c.id === arg) : D.cards[S.cardi % D.cards.length] });
  if (mode === 'p3') return speakSession({ mode: 'p3', item: D.cards.find((c) => c.id === arg) || D.cards[0] });
  if (mode === 'f432') return speakSession({ mode: 'f432', item: arg ? D.cards.find((c) => c.id === arg) : pick(D.cards), round: 0 });
  if (mode === 'pt') return speakSession({ mode: 'pt', item: arg ? D.roleplays.find((c) => c.id === arg) : pick(D.roleplays) });
  if (mode === 'bench') return speakSession({ mode: 'bench', item: D.bench });
  if (mode === 'archive') return vArchive();
  render(`
    <h1>گفتار</h1>
    <p class="muted">هر جلسه ضبط می‌شود. شنیدن صدای خودت مؤثرترین بازخورد رایگانی است که داری.</p>
    <div class="grid2">
      <a class="tile" href="#speak/p1"><b>پرسش‌های کوتاه</b><span>جواب مستقیم، دلیل و مثال</span></a>
      <a class="tile" href="#speak/p2"><b>ارائه و گفت‌وگو</b><span>آماده‌سازی، ارائه و پاسخ به پرسش</span></a>
      <a class="tile" href="#speak/f432"><b>روانی ۴/۳/۲</b><span>یک موضوع در ۴، ۳ و ۲ دقیقه</span></a>
      <a class="tile" href="#speak/pt"><b>موقعیت واقعی</b><span>اداره، خرید، شکایت و محیط کار</span></a>
      <a class="tile" href="#ai"><b>گفتگو با AI</b><span>پرامپت‌های آماده برای حالت صوتی</span></a>
      <a class="tile" href="#speak/archive"><b>آرشیو ضبط‌ها</b><span>${fa(S.speaks.length)} ضبط | مقایسهٔ benchmark</span></a>
    </div>
    <div class="card soft" style="margin-top:12px"><b>چرا ۴/۳/۲؟</b><p class="muted">یک موضوع را سه بار پشت هم تعریف می‌کنی، هر بار با زمان کمتر. فشار زمان باعث می‌شود جمله‌هایی را که یک بار ساخته‌ای روان‌تر تکرار کنی. این یکی از روش‌های شناخته‌شده برای افزایش روانی است (Nation).</p></div>`);
}

function promptHTML(sess) {
  const it = sess.item;
  if (sess.mode === 'p1') return `<div class="en prompt"><b>Thema: ${esc(it.t)}</b>${it.q.map((q) => `<div class="qline"><button class="say" data-act="say" data-text="${esc(q)}">▶</button><span>${esc(q)}</span></div>`).join('')}</div>
    <p class="muted">به هر سؤال ۲ تا ۳ جمله جواب بده: جواب مستقیم، دلیل و یک مثال یا جزئیات. کل ضبط حدود ۳ تا ۴ دقیقه.</p>`;
  if (sess.mode === 'p3') return `<div class="en prompt"><b>Diskussion — ${esc(it.t)}</b>${it.p3.map((q) => `<div class="qline"><button class="say" data-act="say" data-text="${esc(q)}">▶</button><span>${esc(q)}</span></div>`).join('')}</div>
    <p class="muted">هر جواب حدود ۴۰ تا ۶۰ ثانیه: موضع، استدلال، مثال و دیدگاه مقابل؛ از عبارت‌هایی مثل „Einerseits …, andererseits …“ استفاده کن.</p>`;
  if (sess.mode === 'pt') return `<div class="en prompt">${esc(it.t)}</div><p class="muted">۲ تا ۳ دقیقه. گفت‌وگو را با عبارت‌های طبیعی سازمان بده: „Zunächst möchte ich …“، „Habe ich Sie richtig verstanden?“ و „Wie wäre es, wenn …?“</p>`;
  const rounds = sess.mode === 'f432' ? `<p><span class="pill on">دور ${fa(sess.round + 1)} از ۳ — ${fa([4, 3, 2][sess.round])} دقیقه</span></p>` : '';
  return `${rounds}<div class="en prompt"><b>${esc(it.t)}</b><div class="muted">Sprechen Sie über:</div><ul>${it.b.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>`;
}

function speakSession(sess) {
  const conf = {
    p1: { prep: 0, limit: 300 }, p2: { prep: 60, limit: 120 }, p3: { prep: 0, limit: 300 },
    bench: { prep: 60, limit: 120 }, pt: { prep: 30, limit: 180 }, f432: { prep: sess.round === 0 ? 60 : 0, limit: [240, 180, 120][sess.round || 0] }
  }[sess.mode];
  const titles = { p1: 'پرسش‌های کوتاه', p2: 'ارائه', p3: 'بحث تکمیلی', bench: 'Benchmark ماهانه', pt: 'موقعیت واقعی', f432: 'روانی ۴/۳/۲' };
  let tick = null, t0 = 0, result = null;

  render(`
    <a class="back" href="#speak">→ گفتار</a>
    <div class="spread"><h1>${titles[sess.mode]}</h1>
      ${['p1', 'p2', 'pt'].includes(sess.mode) && !sess.round ? '<button class="btn sub small" data-act="nextItem">موضوع دیگر</button>' : ''}</div>
    ${sess.mode === 'bench' ? '<p class="muted">هر ماه همین کارت را ضبط کن. در صفحهٔ آرشیو، ضبط‌های ماه‌های مختلف را کنار هم بشنو.</p>' : ''}
    <div class="card">${promptHTML(sess)}</div>
    <div class="card" id="recbox">
      <div class="timer" id="timer">${conf.prep ? mmss(conf.prep) : '0:00'}</div>
      <p class="muted" id="phase" style="text-align:center">${conf.prep ? `اول ${fa(conf.prep)} ثانیه آماده‌سازی (یادداشت کلیدواژه روی کاغذ)` : 'آماده‌ای؟ ضبط را شروع کن.'}</p>
      <div class="row" style="justify-content:center">
        ${conf.prep ? '<button class="btn" data-act="sPrep">شروع آماده‌سازی</button>' : ''}
        <button class="btn rec" data-act="sRec">${conf.prep ? 'بدون آماده‌سازی: ضبط' : '● شروع ضبط'}</button>
      </div>
    </div>
    <div id="after"></div>`);

  const timerEl = () => $('#timer');
  const setPhase = (t) => { const p = $('#phase'); if (p) p.innerHTML = t; };
  const stopTick = () => { clearInterval(tick); tick = null; };

  async function startRec() {
    stopTick();
    try { await Rec.start(); } catch (e) { micError(e); return; }
    t0 = Date.now();
    $('#recbox .row').innerHTML = '<button class="btn sub" data-act="sStop">■ توقف</button>';
    setPhase('<span class="recdot"></span> در حال ضبط…');
    tick = setInterval(() => {
      const el = (Date.now() - t0) / 1000; const tm = timerEl(); if (!tm) return;
      tm.textContent = mmss(el);
      tm.className = 'timer' + (el > conf.limit ? ' over' : el > conf.limit - 15 ? ' warn' : '');
      if (['p2', 'bench', 'f432'].includes(sess.mode) && el >= conf.limit) stopRec();
    }, 250);
  }
  async function stopRec() {
    stopTick();
    const r = await Rec.stop();
    if (!r) return;
    result = r;
    const url = URL.createObjectURL(r.blob);
    $('#recbox').innerHTML = `<p style="text-align:center"><b>${mmss(r.dur)}</b> ضبط شد</p><audio controls src="${url}"></audio>`;
    $('#after').innerHTML = `
      <div class="card"><h3>خودارزیابی سریع (بعد از یک بار گوش دادن)</h3>
        ${D.selfcheck.map((c, i) => `<label class="chkrow"><input type="checkbox" name="sc" value="${i}">${esc(c)}</label>`).join('')}
        <p style="margin-top:8px">اعتمادبه‌نفس در این ضبط: <select id="conf">${[1, 2, 3, 4, 5].map((n) => `<option value="${n}" ${n === 3 ? 'selected' : ''}>${fa(n)}</option>`).join('')}</select></p>
        <details><summary>متن پیاده‌شده (اختیاری، برای بازخورد مربی)</summary>
          <p class="muted">متن را از روی ضبط، کلمه‌به‌کلمه و با همهٔ خطاها بنویس، یا از transcript اپ Voice Memos استفاده کن. دیکتهٔ کیبورد iOS خطاهایت را خودکار درست می‌کند و به درد این کار نمی‌خورد.</p>
          <textarea class="short" id="trans" placeholder="Transcript…"></textarea></details>
        <details><summary>rubric تمرینی Goethe/CEFR</summary>
          <p class="muted">بعد از گوش‌دادن، هر معیار را از ۰ تا ۴ ارزیابی کن. «فهم‌پذیری» سنجیده می‌شود، نه حذف لهجه یا یک درصد ساختگی تلفظ.</p>
          <div class="grid2">${Object.entries({taskFulfilment:'انجام کامل تکلیف',coherence:'انسجام',interaction:'تعامل',intelligibility:'فهم‌پذیری',range:'دامنه واژگان و ساختار',accuracy:'دقت',fluency:'روانی'}).map(([k, label]) => `<label>${label}<select id="sp-${k}" style="width:100%">${[0,1,2,3,4].map((n) => `<option value="${n}" ${n === 2 ? 'selected' : ''}>${fa(n)}</option>`).join('')}</select></label>`).join('')}</div>
        </details>
        <div class="row" style="margin-top:10px"><button class="btn" data-act="sSave">ذخیره</button><button class="btn sub" data-act="sRetry">دوباره</button></div>
      </div>`;
  }
  ACT.sPrep = async () => {
    try { await Rec.ensure(); } catch (e) { micError(e); return; }
    t0 = Date.now();
    $('#recbox .row').innerHTML = '<button class="btn rec" data-act="sRec">الان شروع کن</button>';
    setPhase('آماده‌سازی… ضبط خودکار شروع می‌شود');
    tick = setInterval(() => {
      const left = conf.prep - (Date.now() - t0) / 1000; const tm = timerEl(); if (!tm) return;
      tm.textContent = mmss(left);
      if (left <= 0) startRec();
    }, 250);
  };
  ACT.sRec = () => startRec();
  ACT.sStop = () => stopRec();
  ACT.sRetry = () => speakSession(sess);
  ACT.nextItem = () => {
    if (sess.mode === 'p1') { S.p1i++; save(); speakSession({ mode: 'p1', item: D.part1[S.p1i % D.part1.length] }); }
    else if (sess.mode === 'p2') { S.cardi++; save(); speakSession({ mode: 'p2', item: D.cards[S.cardi % D.cards.length] }); }
    else speakSession({ mode: sess.mode, item: pick(D.roleplays.filter((x) => x !== sess.item)) });
  };
  ACT.sSave = async () => {
    if (!result) return;
    const id = uid();
    const checks = [...document.querySelectorAll('input[name=sc]:checked')].map((x) => Number(x.value));
    const entry = {
      id, date: todayKey(), ts: Date.now(), mode: sess.mode, itemId: sess.item.id || sess.item.t, title: sess.item.t,
      round: sess.mode === 'f432' ? sess.round : undefined, dur: Math.round(result.dur), checks,
      conf: Number($('#conf').value), trans: ($('#trans') || {}).value || ''
    };
    if (window.LearningEngine) {
      const scores = {}; for (const k of Object.keys(LearningEngine.SPEAKING_WEIGHTS)) scores[k] = Number($('#sp-' + k).value);
      entry.assessment = LearningEngine.createSpeakingAttempt({ id, taskId: entry.itemId, at: entry.ts, durationSeconds: entry.dur, transcript: entry.trans, scores });
    }
    try {
      const buf = await result.blob.arrayBuffer();
      await DB.putRec({ id, type: result.blob.type, buf });
    } catch (e) { toast('صدا ذخیره نشد (فضا؟) — فقط ارزیابی ذخیره شد'); }
    S.speaks.push(entry);
    if (sess.mode === 'bench') markDone('bench');
    else if (sess.mode !== 'f432' || sess.round === 2) markDone('speak');
    if (sess.mode === 'p1') S.p1i++;
    if (sess.mode === 'p2') S.cardi++;
    save();
    toast('ذخیره شد');
    if (sess.mode === 'f432' && sess.round < 2) return speakSession({ mode: 'f432', item: sess.item, round: sess.round + 1 });
    if (sess.mode === 'p2') { location.hash = `#speak/p3/${sess.item.id}`; return; }
    location.hash = '#speak/archive';
  };
  cleanup = () => { stopTick(); if (Rec.recording) Rec.stop().then(() => Rec.release()); else Rec.release(); };
}

async function playRec(id, holder) {
  const r = await DB.getRec(id);
  if (!r) { toast('فایل صوتی پیدا نشد'); return; }
  const url = URL.createObjectURL(new Blob([r.buf], { type: r.type }));
  holder.innerHTML = `<audio controls autoplay src="${url}"></audio>`;
}
function vArchive() {
  const list = S.speaks.slice().sort((a, b) => b.ts - a.ts);
  const bench = list.filter((s) => s.mode === 'bench');
  const row = (s) => `<div class="sent"><div class="spread"><div><b class="en">${esc(s.title)}</b><div class="muted">${s.date} | ${s.mode}${s.round !== undefined ? ' | round ' + (s.round + 1) : ''} | ${mmss(s.dur)} | اعتمادبه‌نفس ${fa(s.conf)}/۵${s.assessment ? ' | rubric ' + fa(s.assessment.overall) + '/۱۰۰' : ''}</div></div>
    <div class="row"><button class="btn small" data-act="play" data-id="${s.id}">▶</button><button class="btn sub small" data-act="shareRec" data-id="${s.id}">خروجی</button><button class="btn sub small" data-act="delRec" data-id="${s.id}">حذف</button></div></div><div id="p-${s.id}"></div></div>`;
  render(`<a class="back" href="#speak">→ گفتار</a><h1>آرشیو ضبط‌ها</h1>
    ${bench.length ? `<div class="card accent"><h3>Benchmark ماهانه (${fa(bench.length)})</h3><p class="muted">اولین و آخرین ضبط را پشت هم گوش کن. پیشرفت واقعی را این‌جا می‌شنوی، نه در عددها.</p>${bench.map(row).join('')}</div>` : ''}
    <div class="card">${list.filter((s) => s.mode !== 'bench').map(row).join('') || '<p class="muted">هنوز ضبطی نداری.</p>'}</div>`);
}
ACT.play = (b) => playRec(b.dataset.id, $('#p-' + b.dataset.id));
ACT.delRec = async (b) => {
  if (!confirm('این ضبط حذف شود؟')) return;
  await DB.delRec(b.dataset.id).catch(() => {});
  S.speaks = S.speaks.filter((s) => s.id !== b.dataset.id); save(); vArchive();
};
ACT.shareRec = async (b) => {
  const r = await DB.getRec(b.dataset.id); if (!r) return toast('فایل پیدا نشد');
  const s = S.speaks.find((x) => x.id === b.dataset.id);
  const ext = /mp4|aac|m4a/.test(r.type) ? 'm4a' : 'webm';
  const file = new File([r.buf], `speaking-${s.date}-${s.mode}.${ext}`, { type: r.type });
  if (navigator.canShare && navigator.canShare({ files: [file] })) { try { await navigator.share({ files: [file] }); } catch (e) { /* cancelled */ } return; }
  const a = document.createElement('a'); a.href = URL.createObjectURL(file); a.download = file.name; a.click();
};

/* ================= PRONUNCIATION ================= */
let abRec = null; // last shadow recording {url, key}
function vPron(sub, id) {
  if (sub === 'shadow' && id) return vShadowSet(id);
  if (sub === 'shadow') {
    const all = D.shadow;
    const setId = all[(dayNum() - dayNum(S.start)) % all.length].id;
    return vShadowSet(setId, true);
  }
  if (sub === 'pairs' && id) return vPairSet(id);
  render(`
    <h1>تلفظ آلمانی</h1>
    <div class="card soft"><p>هدف تقلید لهجهٔ بومی نیست؛ <b>فهم‌پذیری، طول واکه، اوملاوت‌ها، ch و تکیه</b> است. هر نمونه را سه بار تمرین کن: گوش‌دادن، همراه‌خوانی و ضبط مستقل.</p></div>
    <h2>Shadowing</h2>
    <p class="muted">روش: ۱) جمله را گوش کن ۲) هم‌زمان با مدل زمزمه کن ۳) ضبط کن ۴) پشت‌سرهم مدل و صدای خودت را مقایسه کن (A/B).</p>
    <div class="grid2">${D.shadow.map((s) => `<a class="tile" href="#pron/shadow/${s.id}"><b>${esc(s.t)}</b><span>${fa(s.items.length)} جمله</span></a>`).join('')}</div>
    <h2 style="margin-top:18px">جفت‌های کمینه (Minimal pairs)</h2>
    <p class="muted">اول گوش را آموزش بده: صدایی را که نمی‌شنوی، نمی‌توانی درست تولید کنی.</p>
    <div class="grid2">${D.pairs.map((p) => { const st = S.pairs[p.id]; const acc = st && st.n ? Math.round(100 * st.r / st.n) : null; return `<a class="tile" href="#pron/pairs/${p.id}"><b class="en">${esc(p.t)}</b><span>${acc === null ? 'هنوز تمرین نشده' : 'دقت شنیداری ' + fa(acc) + '٪'}</span></a>`; }).join('')}</div>`);
}
function vShadowSet(id, todays) {
  const set = D.shadow.find((s) => s.id === id) || D.shadow[0];
  const items = set.items;
  render(`<a class="back" href="#pron">→ تلفظ</a><h1>${esc(set.t)}</h1>
    <div class="card soft"><p>${esc(set.n)}</p><p class="muted">حروف بزرگ = هجای تکیه‌دار | | = مرز chunk و مکث کوتاه | _ = اتصال</p>
    <div class="row"><span class="muted">سرعت:</span>${[0.7, 0.85, 1].map((r) => `<button class="btn sub small" data-act="rate" data-r="${r}">${r === 1 ? 'عادی' : r}</button>`).join('')}</div></div>
    <div class="card">${items.map((it, i) => `
      <div class="sent">
        <div class="en"><b>${esc(it.s)}</b></div>
        <div class="mark en">${esc(it.m)}</div>
        <div class="row" style="margin-top:6px">
          <button class="btn small" data-act="say" data-text="${esc(it.s)}">▶ مدل</button>
          <button class="btn rec small" data-act="shRec" data-i="${i}">● ضبط من</button>
          <button class="btn sub small" data-act="shAB" data-i="${i}" data-text="${esc(it.s)}">A/B</button>
        </div><div id="sh-${i}"></div>
      </div>`).join('')}</div>
    <button class="btn block" data-act="pronDone">جلسه تمام شد</button>`);
  cleanup = () => { if (Rec.recording) Rec.stop().then(() => Rec.release()); else Rec.release(); };
}
ACT.rate = (b) => { S.settings.rate = Number(b.dataset.r); save(); toast('سرعت: ' + b.textContent); };
ACT.shRec = async (b) => {
  const i = b.dataset.i;
  if (Rec.recording) {
    const r = await Rec.stop(); b.textContent = '● ضبط من'; if (!r) return;
    abRec = { url: URL.createObjectURL(r.blob), i };
    $('#sh-' + i).innerHTML = `<audio controls src="${abRec.url}"></audio>`;
    return;
  }
  try { await Rec.start(); } catch (e) { micError(e); return; }
  b.textContent = '■ توقف';
};
ACT.shAB = (b) => {
  if (!abRec || abRec.i !== b.dataset.i) { toast('اول این جمله را ضبط کن'); return; }
  const audio = $('#sh-' + b.dataset.i + ' audio');
  speak(b.dataset.text, undefined, () => setTimeout(() => { audio.currentTime = 0; audio.play(); }, 350));
};
ACT.pronDone = () => { markDone('pron'); toast('ثبت شد'); location.hash = '#today'; };

function vPairSet(id) {
  const set = D.pairs.find((p) => p.id === id);
  render(`<a class="back" href="#pron">→ تلفظ</a><h1 class="en" style="text-align:right">${esc(set.t)}</h1>
    <div class="card soft"><p>${esc(set.n)}</p></div>
    <div class="card"><h3>آزمون شنیداری (۱۰ بار)</h3><p class="muted">صدای یکی از دو کلمه پخش می‌شود. کدام بود؟</p>
      <div id="quiz"><button class="btn" data-act="pqStart" data-id="${id}">شروع</button></div></div>
    <div class="card"><h3>تمرین تولید</h3>
      ${set.p.map(([a, b2]) => `<div class="sent spread"><span class="en"><button class="say" data-act="say" data-text="${a}">▶ ${a}</button> &nbsp; <button class="say" data-act="say" data-text="${b2}">▶ ${b2}</button></span>
        <button class="say" data-act="say" data-rate="0.85" data-text="${a}. ${b2}. ${a}. ${b2}.">▶ پشت‌سرهم</button></div>`).join('')}
      <p class="muted" style="margin-top:8px">هر جفت را بلند تکرار کن و با گزینهٔ «ضبط من» در Shadowing مقایسه کن. آینه و دیدن شکل لب برای /v/–/w/ و th کمک زیادی می‌کند.</p>
    </div>
    <button class="btn block" data-act="pronDone">جلسه تمام شد</button>`);
}
ACT.pqStart = (b) => {
  const set = D.pairs.find((p) => p.id === b.dataset.id);
  let n = 0, right = 0, cur = null;
  const next = () => {
    if (n >= 10) {
      const st = S.pairs[set.id] || { r: 0, n: 0 }; st.r += right; st.n += 10; S.pairs[set.id] = st; save();
      $('#quiz').innerHTML = `<p><b>${fa(right)} از ۱۰</b> ${right >= 9 ? '— عالی، سراغ تمرین تولید برو.' : '— این تمایز را چند روز دیگر هم تمرین کن.'}</p><button class="btn sub" data-act="pqStart" data-id="${set.id}">دوباره</button>`;
      return;
    }
    const pr = pick(set.p); const w = pick(pr); cur = { pr, w };
    const order = shuffle(pr);
    $('#quiz').innerHTML = `<p class="muted">${fa(n + 1)} / ۱۰</p><button class="btn sub" data-act="pqAgain">▶ دوباره پخش کن</button>
      <div class="pairbtns">${order.map((x) => `<button class="btn ghost" data-act="pqAns" data-w="${x}">${x}</button>`).join('')}</div><div id="pqfb"></div>`;
    speak(w, 0.9);
  };
  ACT.pqAgain = () => speak(cur.w, 0.8);
  ACT.pqAns = (bb) => {
    const ok = bb.dataset.w === cur.w; n++; if (ok) right++;
    document.querySelectorAll('[data-act=pqAns]').forEach((x) => { x.disabled = true; if (x.dataset.w === cur.w) x.classList.replace('ghost', 'btn'); });
    $('#pqfb').innerHTML = `<p style="margin-top:8px">${ok ? '✓ درست' : '✗ کلمه ' + cur.w + ' بود'}</p>`;
    setTimeout(next, ok ? 700 : 1600);
  };
  next();
};

/* ================= PRACTICE: SRS + GRAMMAR ================= */
const allCards = () => D.deck.map((c) => ({ ...c, src: 'deck' })).concat(S.userCards.map((c) => ({ ...c, src: 'user' })));
function srsQueue() {
  const today = dayNum();
  const cards = allCards();
  const isDue = (state) => typeof state.due === 'string' ? Date.parse(state.due) <= Date.now() : state.due <= today;
  const due = cards.filter((c) => S.srs[c.id] && isDue(S.srs[c.id]));
  const introducedToday = cards.filter((c) => S.srs[c.id] && S.srs[c.id].first === today).length;
  const fresh = cards.filter((c) => !S.srs[c.id]);
  // user cards (from your own mistakes) come first among new cards
  fresh.sort((a, b) => (a.src === 'user' ? -1 : 0) - (b.src === 'user' ? -1 : 0));
  return { due, fresh: fresh.slice(0, Math.max(0, S.settings.newPerDay - introducedToday)) };
}
function grade(card, g) {
  const today = dayNum();
  const old = S.srs[card.id];
  const base = old && typeof old.due === 'string' ? old : LearningEngine.createReviewCard();
  const reviewed = LearningEngine.reviewCard(base, g + 1);
  S.srs[card.id] = Object.assign(reviewed, { first: old?.first ?? today, reps: reviewed.repetitions, ivl: reviewed.intervalDays });
  save();
}
function vPractice(sub, arg) {
  if (sub === 'srs') return srsSession();
  if (sub === 'gram') return gramSession(arg || 'mix');
  if (sub === 'add') return vAddCard();
  const q = srsQueue();
  const gs = Object.keys(D.gramCats).map((c) => { const st = S.gram[c] || { r: 0, n: 0 }; return { c, acc: st.n ? st.r / st.n : null, n: st.n }; });
  render(`
    <h1>تمرین</h1>
    <div class="card">
      <div class="spread"><h2>مرور فاصله‌دار (SRS)</h2><span class="pill">${fa(q.due.length)} مرور | ${fa(q.fresh.length)} جدید</span></div>
      <p class="muted">collocationها و خطاهای خودت. کارت‌هایی که از اشتباه‌های گرامری‌ات ساخته می‌شوند زودتر نمایش داده می‌شوند.</p>
      <div class="row"><a class="btn" href="#practice/srs">شروع مرور</a><a class="btn sub" href="#practice/add">+ کارت دستی</a></div>
    </div>
    <div class="card">
      <div class="spread"><h2>گرامر (خطاهای رایج فارسی‌زبان‌ها)</h2><a class="btn small" href="#practice/gram/weak">نقاط ضعف من</a></div>
      ${gs.map((g) => `<a href="#practice/gram/${g.c}" style="text-decoration:none;color:inherit"><div class="sent"><div class="spread"><span>${esc(D.gramCats[g.c])}</span><span class="muted">${g.acc === null ? '—' : fa(Math.round(g.acc * 100)) + '٪'}</span></div>
        <div class="meter"><i style="width:${g.acc === null ? 0 : Math.round(g.acc * 100)}%"></i></div></div></a>`).join('')}
    </div>
    <div class="card soft"><a href="#diag">آزمون تعیین سطح ${S.diag ? '(انجام شده | ' + fa(S.diag.score) + '/' + fa(D.diag.length) + ')' : ''}</a></div>`);
}
function srsSession() {
  const q = srsQueue();
  let queue = shuffle(q.due).concat(q.fresh);
  const again = new Set();
  let reviewed = 0;
  const show = () => {
    if (!queue.length) {
      if (reviewed) markDone('srs');
      render(`<a class="back" href="#practice">→ تمرین</a><div class="card flash"><h2>${reviewed ? 'مرور امروز تمام شد' : 'امروز کارتی برای مرور نداری'}</h2><p class="muted">${fa(reviewed)} کارت</p><a class="btn" href="#today">برگشت به برنامه</a></div>`);
      return;
    }
    const c = queue[0];
    render(`<a class="back" href="#practice">→ تمرین</a><p class="muted">${fa(queue.length)} کارت باقی‌مانده</p>
      <div class="card flash">
        <div class="front en" style="text-align:center">${esc(c.f)}</div>
        ${c.h ? `<p class="muted" style="margin-top:8px">${esc(c.h)}</p>` : ''}
        <div id="back"><button class="btn" style="margin-top:14px" data-act="reveal">نمایش جواب (اول بلند بگو)</button></div>
      </div>`);
    ACT.reveal = () => {
      $('#back').innerHTML = `<div class="ans en" style="text-align:center">${esc(c.b)}</div>${c.e ? `<p class="explain">${esc(c.e)}</p>` : ''}
        <button class="say" data-act="say" data-text="${esc(c.b.replace(/\(.*?\)/g, '').replace(/→.*$/, ''))}" style="margin-top:8px">▶ تلفظ</button>
        <div class="grades"><button class="btn sub" data-g="0" data-act="gr">بلد نبودم</button><button class="btn sub" data-g="1" data-act="gr">سخت</button><button class="btn" data-g="2" data-act="gr">خوب</button><button class="btn ghost" data-g="3" data-act="gr">آسان</button></div>`;
    };
    ACT.gr = (b) => {
      const g = Number(b.dataset.g);
      grade(c, g); reviewed++;
      queue.shift();
      if (g === 0 && !again.has(c.id)) { again.add(c.id); queue.push(c); }
      show();
    };
  };
  show();
}
function vAddCard() {
  render(`<a class="back" href="#practice">→ تمرین</a><h1>کارت جدید</h1>
    <div class="card"><p class="muted">برای اصلاحاتی که مربی یا خودت پیدا کرده‌ای. بهترین فرمت: جلو = جملهٔ غلط یا جای‌خالی؛ پشت = نسخهٔ درست.</p>
      <p>جلو:</p><textarea class="short" id="cf" placeholder="Ich helfe den Mann. → ?"></textarea>
      <p>پشت:</p><textarea class="short" id="cb" placeholder="Ich helfe dem Mann."></textarea>
      <p>توضیح (اختیاری، فارسی):</p><input type="text" id="ce" style="width:100%">
      <button class="btn" style="margin-top:10px" data-act="addCard">افزودن</button></div>
    <div class="card"><h3>کارت‌های خودت (${fa(S.userCards.length)})</h3>${S.userCards.slice().reverse().slice(0, 30).map((c) => `<div class="sent en">${esc(c.f)}<br><b>${esc(c.b)}</b> <button class="say" data-act="delCard" data-id="${c.id}">حذف</button></div>`).join('') || '<p class="muted">—</p>'}</div>`);
}
ACT.addCard = () => {
  const f = $('#cf').value.trim(), b = $('#cb').value.trim();
  if (!f || !b) return toast('جلو و پشت هر دو لازم است');
  S.userCards.push({ id: 'u' + uid(), f, b, e: $('#ce').value.trim() }); save(); toast('اضافه شد'); vAddCard();
};
ACT.delCard = (b) => { S.userCards = S.userCards.filter((c) => c.id !== b.dataset.id); delete S.srs[b.dataset.id]; save(); vAddCard(); };

function gramSession(cat) {
  let pool;
  if (cat === 'weak') {
    // weight each category by error rate; unseen categories count as weak
    const w = (c) => { const st = S.gram[c]; return !st || st.n < 5 ? 0.6 : 1 - st.r / st.n + 0.05; };
    const cats = Object.keys(D.gramCats).sort((a, b) => w(b) - w(a)).slice(0, 4);
    pool = D.gram.filter((q) => cats.includes(q.c));
  } else if (cat === 'mix') pool = D.gram;
  else pool = D.gram.filter((q) => q.c === cat);
  const items = shuffle(pool).slice(0, 10);
  let i = 0, right = 0;
  const show = () => {
    if (i >= items.length) {
      markDone('grammar');
      render(`<a class="back" href="#practice">→ تمرین</a><div class="card flash"><h2>${fa(right)} از ${fa(items.length)}</h2><p class="muted">اشتباه‌ها به‌صورت کارت به مرور فاصله‌دار اضافه شدند.</p><div class="row" style="justify-content:center"><a class="btn" href="#practice/gram/${cat}">دور بعد</a><a class="btn sub" href="#today">برنامهٔ امروز</a></div></div>`);
      return;
    }
    const q = items[i];
    const opts = shuffle(q.o.map((o, k) => ({ o, k })));
    render(`<a class="back" href="#practice">→ تمرین</a><div class="spread"><span class="pill">${esc(D.gramCats[q.c])}</span><span class="muted">${fa(i + 1)}/${fa(items.length)}</span></div>
      <div class="card"><p class="en prompt">${esc(q.s)}</p>${opts.map((x) => `<button class="opt" data-act="gAns" data-k="${x.k}">${esc(x.o)}</button>`).join('')}<div id="gfb"></div></div>`);
    ACT.gAns = (b) => {
      if ($('#gfb').innerHTML) return;
      const ok = Number(b.dataset.k) === q.a;
      document.querySelectorAll('.opt').forEach((x) => { if (Number(x.dataset.k) === q.a) x.classList.add('right'); });
      if (!ok) b.classList.add('wrong');
      const st = S.gram[q.c] || { r: 0, n: 0 }; st.n++; if (ok) { st.r++; right++; } S.gram[q.c] = st;
      if (!ok) {
        const id = 'g' + D.gram.indexOf(q);
        if (!S.userCards.find((c) => c.id === id)) S.userCards.push({ id, f: q.s, b: q.o[q.a], e: q.e });
      }
      save();
      $('#gfb').innerHTML = `<div class="explain">${esc(q.e)}</div><button class="btn block" style="margin-top:10px" data-act="gNext">بعدی</button>`;
    };
    ACT.gNext = () => { i++; show(); };
  };
  show();
}

/* ================= WRITING ================= */
function vWrite(sub, id) {
  if (sub === 'e') return writeEditor(id);
  if (sub === 'v') return viewEssay(id);
  const drafts = Object.keys(S.drafts).filter((k) => S.drafts[k] && S.drafts[k].text);
  const group = (k) => D.writing.filter((w) => w.k === k && w.id !== 'diag');
  render(`<h1>نوشتار</h1>
    <div class="card soft"><b>چرا نوشتن مهم است:</b> <span class="muted">از A1 جمله‌های کوتاه بنویس و به‌تدریج به ایمیل رسمی، خلاصه و متن استدلالی C1 برس. «کپی برای مربی» یک درخواست ارزیابی CEFR می‌سازد.</span></div>
    ${drafts.length ? `<div class="card"><h3>پیش‌نویس‌ها</h3>${drafts.map((k) => { const w = D.writing.find((x) => x.id === k); return w ? `<a class="sent" style="display:block;color:inherit" href="#write/e/${k}"><span class="en">${esc(w.t.slice(0, 90))}…</span></a>` : ''; }).join('')}</div>` : ''}
    ${Object.keys(D.writeKinds).map((k) => `<div class="card"><h3>${D.writeKinds[k].t} <span class="muted">· ${fa(D.writeKinds[k].min)} دقیقه | ${fa(D.writeKinds[k].words)}+ کلمه</span></h3>
      ${group(k).map((w) => { const doneN = S.essays.filter((e) => e.pid === w.id).length; return `<a class="sent" style="display:block;color:inherit;text-decoration:none" href="#write/e/${w.id}"><span class="en">${esc(w.t)}</span>${doneN ? ` <span class="pill">✓ ${fa(doneN)}</span>` : ''}</a>`; }).join('')}</div>`).join('')}
    <div class="card"><h3>نوشته‌های ثبت‌شده (${fa(S.essays.length)})</h3>${S.essays.slice().reverse().map((e) => `<a class="sent" style="display:block;color:inherit;text-decoration:none" href="#write/v/${e.id}"><div class="spread"><span class="en">${esc((D.writing.find((w) => w.id === e.pid) || { t: '' }).t.slice(0, 60))}…</span><span class="muted">${e.date} | ${fa(e.words)} کلمه</span></div></a>`).join('') || '<p class="muted">—</p>'}</div>`);
}
const wordCount = (t) => (t.trim().match(/\S+/g) || []).length;
function coachText(w, text, minutes) {
  const kind = D.writeKinds[w.k];
  const crit = 'Estimate its CEFR level and assess task completion, coherence, vocabulary range, grammatical accuracy, register, and orthography.';
  return `Act as a careful German teacher and Goethe/telc exam coach. My long-term target is CEFR C1.
${crit}
Then list my 8 most important errors (exact words → correction → short reason in Persian), suggest 5 natural German expressions, and rewrite my weakest paragraph one CEFR level higher. Finally, give me 3 flashcards in the format "front → back".

Task (${kind.t}):
${w.t}

My answer (${wordCount(text)} words, written in ${minutes} minutes):
${text}`;
}
function writeEditor(pid) {
  const w = D.writing.find((x) => x.id === pid); if (!w) return vWrite();
  const kind = D.writeKinds[w.k];
  const dr = S.drafts[pid] || { text: '', sec: 0 };
  let running = false, tick = null, last = 0;
  render(`<a class="back" href="#write">→ نوشتار</a>
    <div class="card"><div class="en prompt">${esc(w.t)}</div>
      ${w.k === 'essay' ? `<details style="margin-top:8px"><summary>قالب پیشنهادی</summary><p class="muted">Einleitung → موضع روشن → دو استدلال با مثال → دیدگاه مقابل → Schluss. برای B2 ارتباط منطقی، دامنه واژگان و درستی ساختار مهم‌تر از طول غیرضروری متن است.</p></details>` : ''}
    </div>
    <div class="card"><div class="spread"><div class="timer" id="wt" style="font-size:1.6rem">${mmss(kind.min * 60 - dr.sec)}</div>
      <div class="row"><button class="btn small" data-act="wGo">شروع</button><span class="muted" id="wc">${fa(wordCount(dr.text))} / ${fa(kind.words)} کلمه</span></div></div>
      <textarea id="wtext" spellcheck="false" autocorrect="off" autocapitalize="sentences" placeholder="Start writing…">${esc(dr.text)}</textarea>
      <p class="muted">غلط‌یاب خودکار خاموش است، چون در آزمون هم نیست.</p>
      <div class="row"><button class="btn" data-act="wSubmit">ثبت نهایی</button><button class="btn sub" data-act="wCopy">کپی برای مربی</button></div></div>`);
  const ta = $('#wtext');
  const upd = () => {
    const tl = kind.min * 60 - dr.sec; const el = $('#wt'); if (!el) return;
    el.textContent = (tl < 0 ? '-' : '') + mmss(Math.abs(tl)); el.className = 'timer' + (tl < 0 ? ' over' : tl < 300 ? ' warn' : ''); el.style.fontSize = '1.6rem';
  };
  ta.addEventListener('input', () => { dr.text = ta.value; S.drafts[pid] = dr; $('#wc').textContent = `${fa(wordCount(dr.text))} / ${fa(kind.words)} کلمه`; save(); });
  ACT.wGo = (b) => {
    running = !running; b.textContent = running ? 'مکث' : 'ادامه';
    if (running) { last = Date.now(); tick = setInterval(() => { const n = Date.now(); dr.sec += (n - last) / 1000; last = n; S.drafts[pid] = dr; upd(); }, 1000); }
    else { clearInterval(tick); save(); }
  };
  ACT.wCopy = () => copyText(coachText(w, ta.value, Math.round(dr.sec / 60)));
  ACT.wSubmit = () => {
    const text = ta.value.trim(); if (wordCount(text) < 40) return toast('متن خیلی کوتاه است');
    const e = { id: uid(), pid, date: todayKey(), text, words: wordCount(text), minutes: Math.round(dr.sec / 60) };
    S.essays.push(e); delete S.drafts[pid];
    if (window.LearningEngine) {
      let cycle = S.writingCycles[pid] || LearningEngine.createWritingCycle({ taskId: pid, targetLevel: 'B2' });
      cycle = LearningEngine.addWritingDraft(cycle, { at: Date.now(), text });
      S.writingCycles[pid] = cycle; e.version = cycle.drafts.length;
    }
    markDone('write', Math.max(5, e.minutes));
    save(); location.hash = '#write/v/' + e.id;
  };
  cleanup = () => { clearInterval(tick); save(); };
}
function viewEssay(id) {
  const e = S.essays.find((x) => x.id === id); if (!e) return vWrite();
  const w = D.writing.find((x) => x.id === e.pid);
  render(`<a class="back" href="#write">→ نوشتار</a>
    <div class="card"><p class="muted">${e.date} | ${fa(e.words)} کلمه | ${fa(e.minutes)} دقیقه ${e.version ? '| نسخه ' + fa(e.version) : ''}</p><div class="en prompt" style="font-size:.95rem"><i>${esc(w.t)}</i></div>
    <div class="en" style="white-space:pre-wrap;margin-top:12px">${esc(e.text)}</div></div>
    <div class="card"><h3>ارزیابی Writing با rubric</h3><p class="muted">امتیازها را پس از بازخورد مربی یا ارزیاب وارد کن؛ سپس همان تمرین را بازنویسی کن تا نسخه‌ها قابل مقایسه باشند.</p>
      <div class="grid2">${Object.entries({taskFulfilment:'انجام تکلیف',coherence:'انسجام',range:'دامنه واژگان و ساختار',accuracy:'دقت',register:'لحن و register'}).map(([k,label]) => `<label>${label}<select id="wr-${k}" style="width:100%">${[0,1,2,3,4].map((n) => `<option value="${n}" ${Number(e.assessment?.scores?.[k]) === n ? 'selected' : ''}>${fa(n)}</option>`).join('')}</select></label>`).join('')}</div>
      <textarea class="short" id="wr-feedback" placeholder="بازخورد و برنامه بازنویسی…">${esc(e.assessment?.feedback || '')}</textarea>
      <button class="btn" data-act="wAssess">ثبت ارزیابی</button> ${e.assessment ? `<span class="pill on">${fa(e.assessment.overall)}/۱۰۰</span>` : ''}</div>
    <div class="row"><button class="btn" data-act="eCopy">کپی برای مربی</button><button class="btn sub" data-act="eDel">حذف</button></div>`);
  ACT.eCopy = () => copyText(coachText(w, e.text, e.minutes));
  ACT.wAssess = () => {
    const scores = {}; for (const k of Object.keys(LearningEngine.WRITING_WEIGHTS)) scores[k] = Number($('#wr-' + k).value);
    e.assessment = { scores, overall: LearningEngine.scoreRubric(scores, LearningEngine.WRITING_WEIGHTS), feedback: $('#wr-feedback').value.trim(), at: new Date().toISOString() };
    const cycle = S.writingCycles[e.pid]; if (cycle && e.version && cycle.drafts[e.version - 1]) { cycle.drafts[e.version - 1].scores = scores; cycle.drafts[e.version - 1].overall = e.assessment.overall; cycle.drafts[e.version - 1].feedback = [e.assessment.feedback].filter(Boolean); }
    save(); viewEssay(id);
  };
  ACT.eDel = () => { if (confirm('حذف شود؟')) { S.essays = S.essays.filter((x) => x.id !== id); save(); location.hash = '#write'; } };
}

/* ================= DIAGNOSTIC ================= */
function vDiag() {
  if (S.diag && location.hash !== '#diag/retake') return diagResult();
  const order = D.diag.map((q, i) => ({ q, i, opts: shuffle(q.o.map((o, k) => ({ o, k }))) }));
  const ans = {};
  render(`<a class="back" href="#today">→ امروز</a><h1>آزمون تعیین سطح</h1>
    <div class="card soft"><p>${fa(D.diag.length)} سؤال از A1 تا C1. بدون دیکشنری و حدس. اگر از صفر شروع می‌کنی یا نمی‌دانی، «نمی‌دانم» را بزن. این بخش فقط گرامر و واژگان را می‌سنجد.</p></div>
    ${order.map((x, n) => `<div class="card"><p class="muted">${fa(n + 1)}</p><p class="en prompt">${esc(x.q.s)}</p>
      ${x.opts.map((o) => `<button class="opt" data-act="dAns" data-q="${x.i}" data-k="${o.k}">${esc(o.o)}</button>`).join('')}
      <button class="opt" data-act="dAns" data-q="${x.i}" data-k="-1" style="font-family:Vazirmatn;text-align:right;direction:rtl">نمی‌دانم</button></div>`).join('')}
    <button class="btn block" data-act="dSubmit">پایان و نتیجه</button>`);
  ACT.dAns = (b) => {
    ans[b.dataset.q] = Number(b.dataset.k);
    document.querySelectorAll(`[data-act=dAns][data-q="${b.dataset.q}"]`).forEach((x) => x.classList.toggle('sel', x === b));
  };
  ACT.dSubmit = () => {
    const missing = D.diag.length - Object.keys(ans).length;
    if (missing && !confirm(`${fa(missing)} سؤال بی‌جواب است. ادامه؟`)) return;
    const byLevel = {}; let score = 0; const wrong = [];
    D.diag.forEach((q, i) => {
      byLevel[q.l] = byLevel[q.l] || { r: 0, n: 0 }; byLevel[q.l].n++;
      if (ans[i] === q.a) { score++; byLevel[q.l].r++; } else wrong.push({ s: q.s, got: ans[i] >= 0 ? q.o[ans[i]] : '(no answer)', right: q.o[q.a], l: q.l });
    });
    S.diag = { date: todayKey(), score, byLevel, wrong };
    save();
    if (location.hash === '#diag') route(); else location.hash = '#diag';
  };
}
function estimate(d) {
  const lv = (l) => (d.byLevel[l] ? d.byLevel[l].r / d.byLevel[l].n : 0);
  if (lv('C1') >= .6 && lv('B2') >= .75) return 'C1 مقدماتی';
  if (lv('B2') >= .6 && lv('B1') >= .75) return 'B2';
  if (lv('B1') >= .6 && lv('A2') >= .75) return 'B1';
  if (lv('A2') >= .6 && lv('A1') >= .75) return 'A2';
  if (lv('A1') >= .5) return 'A1';
  return 'A0 — شروع از صفر';
}
function diagResult() {
  const d = S.diag;
  const wEss = S.essays.filter((e) => e.pid === 'diag').slice(-1)[0];
  const bench = S.speaks.filter((s) => s.mode === 'bench')[0];
  const report = `PLACEMENT REPORT (${d.date})
Grammar/vocabulary: ${d.score}/30 — by level: ${Object.entries(d.byLevel).map(([l, v]) => `${l} ${v.r}/${v.n}`).join(', ')}
Wrong answers:
${d.wrong.map((w) => `- [${w.l}] ${w.s} — I chose: ${w.got}; correct: ${w.right}`).join('\n')}
${wEss ? `\nWriting task (${wEss.words} words, ${wEss.minutes} min):\n${D.writing.find((w) => w.id === 'diag').t}\n\n${wEss.text}\n` : '\n(Writing task not done yet)\n'}
${bench ? `\nSpeaking benchmark: ${bench.dur}s, self-rated confidence ${bench.conf}/5.${bench.trans ? '\nTranscript:\n' + bench.trans : ' (no transcript)'}` : '\n(Speaking benchmark not recorded yet)'}

Please analyse this as my German coach: estimate my CEFR level per skill, identify my 5 most important weaknesses, and give me a realistic plan for the next 12 weeks.`;
  render(`<a class="back" href="#today">→ امروز</a><h1>نتیجهٔ تعیین سطح</h1>
    <div class="card"><div class="stat">${fa(d.score)} / ${fa(D.diag.length)}</div><p>برآورد تقریبی: <b>${estimate(d)}</b></p>
      ${Object.entries(d.byLevel).map(([l, v]) => `<div class="sent"><div class="spread"><span class="en">${l}</span><span class="muted">${fa(v.r)}/${fa(v.n)}</span></div><div class="meter"><i style="width:${Math.round(100 * v.r / v.n)}%"></i></div></div>`).join('')}
      <p class="muted" style="margin-top:8px">این تست کوتاه است و فقط دانش گرامر و واژگان را می‌سنجد. اعتبارش محدود است؛ تصویر کامل بعد از Writing و Speaking به دست می‌آید.</p></div>
    <div class="card"><h3>مرحلهٔ ۲ و ۳</h3>
      <div class="task ${wEss ? 'done' : ''}"><span class="chk">${wEss ? '✓' : ''}</span><a class="ttl" href="#write/e/diag">Writing Task 2 تعیین سطح (۴۰ دقیقه)</a></div>
      <div class="task ${bench ? 'done' : ''}"><span class="chk">${bench ? '✓' : ''}</span><a class="ttl" href="#speak/bench">ضبط معیار اولیه گفتار</a></div></div>
    <div class="card"><h3>گزارش برای مربی</h3><p class="muted">بعد از انجام هر سه بخش، گزارش را در گفتگو با مربی هوش مصنوعی پیست کن.</p>
      <pre class="copybox" id="rep">${esc(report)}</pre><div class="row"><button class="btn" data-act="copy" data-src="#rep">کپی گزارش</button><a class="btn sub" href="#diag/retake">آزمون مجدد</a></div></div>`);
}

/* ================= AI CONVERSATION ================= */
function vAI() {
  render(`<a class="back" href="#speak">→ گفتار</a><h1>گفتگوی صوتی با AI</h1>
    <div class="card soft"><p>برای مکالمهٔ آزاد، حالت صوتی اپ‌های Claude یا ChatGPT از هر چیزی که بشود داخل این اپ ساخت بهتر است (تأخیر کم، صدای طبیعی). ولی این اپ‌ها به‌طور پیش‌فرض خطاهایت را اصلاح نمی‌کنند. یکی از پرامپت‌های زیر را کپی کن، در حالت صوتی بفرست و شروع کن.</p>
    <p class="muted"><b>محدودیت:</b> AI صدای تو را به متن تبدیل می‌کند و در این مرحله خطاهای تلفظ پاک می‌شوند. پس بازخوردش دربارهٔ گرامر، واژگان و روانی معتبر است ولی دربارهٔ تلفظ نه. تلفظ را با ضبط و مقایسه در بخش تلفظ کار کن.</p></div>
    ${D.ai.map((a, i) => `<div class="card"><h3>${esc(a.t)}</h3><pre class="copybox" id="ai${i}">${esc(a.p)}</pre><button class="btn small" data-act="copy" data-src="#ai${i}">کپی پرامپت</button></div>`).join('')}
    <button class="btn block" data-act="aiDone">گفتگو انجام شد (ثبت در برنامه)</button>`);
}
ACT.aiDone = () => { markDone('ai'); toast('ثبت شد'); location.hash = '#today'; };

/* ================= PROGRESS ================= */
function vProgress() {
  const today = dayNum();
  const weeks = [];
  for (let w = 7; w >= 0; w--) {
    let m = 0; for (let d = 0; d < 7; d++) m += S.log[keyFromNum(today - w * 7 - d)] || 0;
    weeks.push(m);
  }
  const max = Math.max(60, ...weeks);
  const totalMin = Object.values(S.log).reduce((a, b) => a + b, 0);
  const activeDays = Object.values(S.log).filter((m) => m > 0).length;
  const learned = Object.values(S.srs).filter((s) => s.reps > 0).length;
  const mature = Object.values(S.srs).filter((s) => s.ivl >= 21).length;
  const gAll = Object.values(S.gram).reduce((a, s) => ({ r: a.r + s.r, n: a.n + s.n }), { r: 0, n: 0 });
  render(`<h1>پیشرفت</h1>
    <div class="grid2">
      <div class="card"><div class="stat">${fa(Math.round(totalMin / 60 * 10) / 10)}</div><span class="muted">ساعت تمرین | ${fa(activeDays)} روز فعال</span></div>
      <div class="card"><div class="stat">${fa(S.speaks.length)}</div><span class="muted">ضبط Speaking</span></div>
      <div class="card"><div class="stat">${fa(S.essays.length)}</div><span class="muted">متن نوشته‌شده</span></div>
      <div class="card"><div class="stat">${fa(learned)}</div><span class="muted">کارت یادگرفته | ${fa(mature)} پایدار (۲۱+ روز)</span></div>
    </div>
    <div class="card"><h3>دقیقه در هفته (۸ هفتهٔ اخیر)</h3><p class="muted">هدف: ۲۵۰ تا ۳۰۰ دقیقه در هفته</p>
      <div class="bars">${weeks.map((m) => `<div class="b" style="height:${Math.round(100 * m / max)}%"><span>${m}</span></div>`).join('')}</div>
      <div class="barlabels">${weeks.map((_, i) => `<span>${i === 7 ? 'now' : '-' + (7 - i) + 'w'}</span>`).join('')}</div></div>
    <div class="card"><h3>گرامر: ${gAll.n ? fa(Math.round(100 * gAll.r / gAll.n)) + '٪' : '—'} دقت کل</h3>
      ${Object.keys(D.gramCats).filter((c) => S.gram[c]).map((c) => `<div class="sent"><div class="spread"><span>${esc(D.gramCats[c])}</span><span class="muted">${fa(Math.round(100 * S.gram[c].r / S.gram[c].n))}٪ | ${fa(S.gram[c].n)} سؤال</span></div><div class="meter"><i style="width:${Math.round(100 * S.gram[c].r / S.gram[c].n)}%"></i></div></div>`).join('') || '<p class="muted">—</p>'}</div>
    <div class="card"><h3>تمایز شنیداری واکه‌ها و صامت‌ها</h3>
      ${D.pairs.filter((p) => S.pairs[p.id]).map((p) => `<div class="sent"><div class="spread"><span class="en">${esc(p.t)}</span><span class="muted">${fa(Math.round(100 * S.pairs[p.id].r / S.pairs[p.id].n))}٪</span></div><div class="meter"><i style="width:${Math.round(100 * S.pairs[p.id].r / S.pairs[p.id].n)}%"></i></div></div>`).join('') || '<p class="muted">—</p>'}</div>
    <div class="card accent"><h3>پشتیبان‌گیری (مهم)</h3>
      <p>داده‌ها فقط روی همین گوشی ذخیره می‌شوند. پاک کردن دادهٔ Safari یا عوض کردن گوشی یعنی از دست رفتن همه‌چیز. <b>هر هفته یک بار</b> خروجی بگیر و در Files یا iCloud نگه دار. ضبط‌های صوتی در این فایل نیستند؛ ضبط‌های مهم، مثل benchmarkها، را از آرشیو جداگانه خروجی بگیر.</p>
      <div class="row"><button class="btn" data-act="export">خروجی (JSON)</button><label class="btn sub">بازیابی از فایل<input type="file" accept="application/json,.json" id="imp" hidden></label></div>
      <p class="muted" style="margin-top:6px">آخرین پشتیبان: ${S.lastBackup ? S.lastBackup : 'هرگز'}</p></div>`);
  $('#imp').addEventListener('change', async (e) => {
    const f = e.target.files[0]; if (!f) return;
    try {
      const data = JSON.parse(await f.text());
      if (!data || !data.v || !data.settings) throw new Error('bad');
      if (!confirm('همهٔ داده‌های فعلی با فایل جایگزین شود؟')) return;
      S = Object.assign(DEFAULT(), data); save(); toast('بازیابی شد'); route();
    } catch (err) { toast('فایل معتبر نیست'); }
  });
}
ACT.export = async () => {
  S.lastBackup = todayKey(); save();
  const file = new File([JSON.stringify(S)], `lili-deutsch-${PROFILES.active}-${todayKey()}.json`, { type: 'application/json' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) { try { await navigator.share({ files: [file] }); } catch (e) { /* cancelled */ } return; }
  const a = document.createElement('a'); a.href = URL.createObjectURL(file); a.download = file.name; a.click();
};

/* ================= SETTINGS ================= */
function vSettings() {
  loadVoices();
  const syncUrl = window.SyncClient ? SyncClient.configuredUrl() : '';
  const loggedIn = window.SyncClient && SyncClient.isLoggedIn();
  render(`<h1>تنظیمات</h1>
    <div class="card"><div class="spread"><h3>زبان‌آموزان</h3><span class="pill">${fa(PROFILES.items.length)} از ۵</span></div>
      <select id="profile" style="width:100%">${PROFILES.items.map((p) => `<option value="${p.id}" ${p.id === PROFILES.active ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</select>
      <div class="row" style="margin-top:10px"><input id="profileName" type="text" maxlength="30" placeholder="نام زبان‌آموز"><button class="btn small" data-act="addProfile">افزودن</button><button class="btn sub small" data-act="renameProfile">تغییر نام</button></div>
      <p class="muted">پیشرفت، کارت‌ها و نوشته‌های هر نفر جدا ذخیره می‌شود. سقف این نسخه پنج نفر است.</p></div>
    <div class="card accent"><div class="spread"><h3>حساب و همگام‌سازی امن</h3><span class="pill">${loggedIn ? 'وارد شده' : (syncUrl ? 'سرور تنظیم شده' : 'آفلاین')}</span></div>
      <p class="muted">اپ بدون حساب هم کار می‌کند. برای استفاده روی چند دستگاه، نشانی Worker را تنظیم و وارد حساب خود شو. همگام‌سازی عمداً دستی است تا هیچ داده‌ای ناخواسته جایگزین نشود.</p>
      <label>نشانی API</label><input id="apiUrl" type="url" dir="ltr" autocomplete="url" placeholder="https://lili-german-backend.example.workers.dev" value="${esc(syncUrl)}" style="width:100%">
      <div class="row" style="margin-top:10px"><button class="btn sub small" data-act="syncConfigure">ذخیره نشانی</button><button class="btn sub small" data-act="syncStatus">بررسی اتصال</button></div>
      <details style="margin-top:12px" ${loggedIn ? '' : 'open'}><summary>ورود یا ثبت‌نام</summary>
        <div class="grid2" style="margin-top:10px"><input id="syncUser" dir="ltr" autocomplete="username" placeholder="نام کاربری"><input id="syncPass" type="password" dir="ltr" autocomplete="current-password" minlength="12" placeholder="رمز عبور (حداقل ۱۲ نویسه)"></div>
        <div class="row" style="margin-top:10px"><button class="btn small" data-act="syncLogin">ورود</button><input id="inviteCode" dir="ltr" autocomplete="one-time-code" placeholder="کد دعوت"><button class="btn sub small" data-act="syncRegister">ثبت‌نام با دعوت</button></div>
      </details>
      <details style="margin-top:12px"><summary>راه‌اندازی مدیر و دعوت کاربر</summary>
        <p class="muted">فقط برای اولین حساب: توکن bootstrap را همراه نام کاربری و رمز بالا وارد کن. پس از ورود مدیر، کد دعوت یک‌بارمصرف بساز.</p>
        <div class="row"><input id="bootstrapToken" type="password" dir="ltr" autocomplete="off" placeholder="توکن bootstrap"><button class="btn sub small" data-act="syncBootstrap">ساخت مدیر اول</button><button class="btn sub small" data-act="syncInvite">ساخت کد دعوت</button></div>
        <p id="inviteOut" class="muted"></p>
      </details>
      <div class="row" style="margin-top:12px"><button class="btn small" data-act="syncPush" ${loggedIn ? '' : 'disabled'}>ارسال این پروفایل به سرور</button><button class="btn sub small" data-act="syncPull" ${loggedIn ? '' : 'disabled'}>دریافت از سرور</button><button class="btn sub small" data-act="syncLogout" ${loggedIn ? '' : 'disabled'}>خروج</button></div>
      <p id="syncOut" class="muted"></p>
    </div>
    <div class="card"><h3>صدای مدل (آلمانی)</h3>
      <select id="voice" style="width:100%"><option value="">پیش‌فرض</option>${voices.map((v) => `<option value="${esc(v.voiceURI)}" ${v.voiceURI === S.settings.voice ? 'selected' : ''}>${esc(v.name)}</option>`).join('')}</select>
      <p class="muted">در iPhone می‌توانی صدای بهتر آلمانی را از Settings → Accessibility → Spoken Content → Voices → German دانلود کنی. ${voices.length ? '' : 'هنوز صدای آلمانی پیدا نشد.'}</p>
      <div class="row"><span>سرعت:</span><input type="number" id="rate" min="0.5" max="1.2" step="0.05" value="${S.settings.rate}" style="width:90px"><button class="btn sub small" data-act="say" data-text="Hallo! Lass uns gemeinsam Deutsch lernen.">آزمایش</button></div></div>
    <div class="card"><h3>مرور فاصله‌دار</h3><div class="row"><span>کارت جدید در روز:</span><input type="number" id="npd" min="0" max="30" value="${S.settings.newPerDay}" style="width:90px"></div></div>
    <div class="card"><h3>شروع برنامه</h3><input type="date" id="start" value="${S.start}"></div>
    <div class="card"><h3>ظاهر</h3><select id="theme"><option value="auto">خودکار</option><option value="light">روشن</option><option value="dark">تیره</option></select></div>
    <div class="card"><h3>ماندگاری داده</h3><p class="muted">روی iPhone حتماً اپ را از Safari با «Add to Home Screen» نصب کن. داده‌های وب‌سایت‌های معمولی ممکن است بعد از مدتی استفاده نکردن پاک شوند.</p><button class="btn sub" data-act="persist">درخواست ذخیره‌سازی دائمی</button></div>
    <div class="card"><button class="btn sub" data-act="reset" style="color:var(--bad)">پاک کردن همهٔ داده‌ها</button></div>`);
  $('#theme').value = S.settings.theme;
  $('#profile').onchange = async (e) => { PROFILES.active = e.target.value; profileStore.write(PROFILES); S = DEFAULT(); await load(); applyTheme(); route(); };
  $('#voice').onchange = (e) => { S.settings.voice = e.target.value; save(); };
  $('#rate').onchange = (e) => { S.settings.rate = Math.min(1.2, Math.max(0.5, Number(e.target.value) || 0.95)); save(); };
  $('#npd').onchange = (e) => { S.settings.newPerDay = Math.max(0, Math.min(30, Number(e.target.value) || 0)); save(); };
  $('#start').onchange = (e) => { if (e.target.value) { S.start = e.target.value; save(); } };
  $('#theme').onchange = (e) => { S.settings.theme = e.target.value; applyTheme(); save(); };
}
const syncMessage = (error) => ({
  api_not_configured: 'ابتدا نشانی API را ذخیره کن.', https_required: 'نشانی API باید HTTPS باشد.',
  invalid_credentials: 'نام کاربری یا رمز معتبر نیست.', invalid_registration: 'اطلاعات ثبت‌نام کامل نیست.',
  invalid_invite: 'کد دعوت نامعتبر یا منقضی است.', username_unavailable: 'این نام کاربری قبلاً استفاده شده است.',
  user_limit_reached: 'سقف پنج کاربر پر شده است.', forbidden: 'دسترسی مجاز نیست.', unauthorized: 'نشست منقضی شده؛ دوباره وارد شو.',
  already_bootstrapped: 'مدیر قبلاً ساخته شده است.', version_conflict: 'نسخهٔ سرور جدیدتر است؛ ابتدا دریافت کن و سپس تصمیم بگیر.'
}[error && error.message] || ('خطای اتصال: ' + (error && error.message ? error.message : 'نامشخص')));
const syncCredentials = () => ({ username: ($('#syncUser') || {}).value?.trim(), password: ($('#syncPass') || {}).value || '' });
ACT.syncConfigure = () => { try { SyncClient.configure(($('#apiUrl') || {}).value); toast('نشانی سرور ذخیره شد'); route(); } catch (e) { toast(syncMessage(e)); } };
ACT.syncStatus = async () => { try { const data = await SyncClient.me(); $('#syncOut').textContent = `متصل: ${data.user.username} (${data.user.role})`; } catch (e) { $('#syncOut').textContent = syncMessage(e); } };
ACT.syncLogin = async () => { try { const c = syncCredentials(); await SyncClient.login(c.username, c.password); toast('ورود موفق'); route(); } catch (e) { toast(syncMessage(e)); } };
ACT.syncRegister = async () => { try { const c = syncCredentials(); await SyncClient.register(c.username, c.password, ($('#inviteCode') || {}).value?.trim()); toast('حساب ساخته شد'); route(); } catch (e) { toast(syncMessage(e)); } };
ACT.syncBootstrap = async () => { try { const c = syncCredentials(); await SyncClient.bootstrap(c.username, c.password, ($('#bootstrapToken') || {}).value || ''); toast('مدیر ساخته شد'); route(); } catch (e) { toast(syncMessage(e)); } };
ACT.syncInvite = async () => { try { const data = await SyncClient.createInvite(); $('#inviteOut').textContent = `کد دعوت: ${data.inviteCode} — تا ۲۴ ساعت معتبر و فقط یک‌بار قابل استفاده`; } catch (e) { toast(syncMessage(e)); } };
ACT.syncPush = async () => { try { await SyncClient.push(S); toast('پروفایل روی سرور ذخیره شد'); } catch (e) { toast(syncMessage(e)); } };
ACT.syncPull = async () => {
  if (!confirm('دادهٔ این پروفایل با نسخهٔ سرور جایگزین شود؟ ابتدا از بخش پیشرفت خروجی بگیر.')) return;
  try { const data = await SyncClient.pull(); S = Object.assign(DEFAULT(), data.state || {}); S.settings = Object.assign(DEFAULT().settings, S.settings || {}); await DB.set(stateKey(), S); toast('نسخهٔ سرور دریافت شد'); route(); } catch (e) { toast(syncMessage(e)); }
};
ACT.syncLogout = async () => { try { await SyncClient.logout(); toast('از حساب خارج شدی'); route(); } catch (e) { toast(syncMessage(e)); } };
ACT.addProfile = async () => {
  const name = ($('#profileName') || {}).value?.trim();
  if (!name) return toast('نام را وارد کن');
  if (PROFILES.items.length >= 5) return toast('حداکثر پنج زبان‌آموز مجاز است');
  const id = 'p' + Date.now().toString(36);
  PROFILES.items.push({ id, name }); PROFILES.active = id; profileStore.write(PROFILES);
  S = DEFAULT(); await DB.set(stateKey(), S); route();
};
ACT.renameProfile = () => {
  const name = ($('#profileName') || {}).value?.trim(); if (!name) return toast('نام جدید را وارد کن');
  activeProfile().name = name; profileStore.write(PROFILES); route();
};
ACT.persist = async () => {
  if (navigator.storage && navigator.storage.persist) { const ok = await navigator.storage.persist(); toast(ok ? 'ذخیره‌سازی دائمی فعال شد' : 'مرورگر قبول نکرد. نصب روی Home Screen کافی است'); }
  else toast('این مرورگر پشتیبانی نمی‌کند');
};
ACT.reset = async () => {
  if (!confirm('همهٔ پیشرفت پاک شود؟ (اول خروجی بگیر)')) return;
  if (!confirm('مطمئنی؟ این کار برگشت‌پذیر نیست.')) return;
  for (const s of S.speaks) await DB.delRec(s.id).catch(() => {});
  S = DEFAULT(); save(); route();
};

/* ---------------- boot ---------------- */
(async () => {
  await load();
  applyTheme();
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
  window.addEventListener('hashchange', route);
  route();
})();
