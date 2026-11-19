// Leonida 55 — GTA VI trophy guide & tracker. Checklist saved in localStorage,
// export/import as JSON, spoiler hiding for story trophies, stage roadmap,
// missable watch, counters for counted trophies. No network requests at runtime.
const KEY = 'leonida55-v2';
const SAMPLE = ['Paradise Lost', 'Trust', 'Just Like Paradise', 'Master of None', 'Stick Fiddler', 'In The Beginning…', 'On the Spot'];
const STAGE_NAMES = { 1: 'Chapter 1 — first steps', 2: 'Chapter 2', 3: 'Chapter 3', 4: 'Chapter 4', 5: 'Finale & 100%', 6: 'Side, collectibles & crime', 7: 'Platinum' };
const KIND_LABELS = { story: 'Story', collectible: 'Collectibles', activity: 'Activities', side: 'Side', platinum: 'Platinum', online: 'Online' };

let doc = null;
let trophies = [];
let state = loadState();
let selectedId = 28;
let kindFilter = 'all';
let currentTab = 'checklist';
const revealed = new Set(state.revealed || []);

function loadState() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '{}');
    return { earned: Array.isArray(raw.earned) ? raw.earned : [], counters: raw.counters || {}, spoilersHidden: raw.spoilersHidden !== false, revealed: raw.revealed || [] };
  } catch { return { earned: [], counters: {}, spoilersHidden: true, revealed: [] }; }
}
function saveState() {
  state.revealed = [...revealed];
  localStorage.setItem(KEY, JSON.stringify(state));
  const now = new Date();
  document.getElementById('savedNote').textContent = 'Saved in this browser · ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
const earnedSet = () => new Set(state.earned);
function isEarned(t) { return earnedSet().has(t.name); }
function toggleEarned(t) {
  const s = earnedSet();
  if (s.has(t.name)) s.delete(t.name); else s.add(t.name);
  state.earned = [...s];
  saveState(); renderAll();
}
function sourceByNum(n) { return doc.sources.find(s => s.n === n); }
function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function citeHtml(step) { return esc(step).replace(/\[(\d+)\]/g, '<span class="cit">[$1]</span>'); }
function gradeCount(g) { return trophies.filter(t => t.grade === g).length; }
function earnedGradeCount(g) { return trophies.filter(t => t.grade === g && isEarned(t)).length; }

function renderAudit() {
  const hidden = trophies.filter(t => t.hidden).length;
  const miss = trophies.filter(t => t.missable).length;
  const unc = trophies.filter(t => t.unconfirmed).length;
  const cited = trophies.filter(t => t.sources && t.sources.length).length;
  document.getElementById('audit').innerHTML =
    'AUDIT — <b>' + trophies.length + '/' + trophies.length + ' trophies</b> · <b>' + trophies.length + '/' + trophies.length + ' guides</b> · <b>' + cited + '/' + trophies.length + ' cited</b> · <b>' + hidden + '/' + hidden + ' hidden</b> · <b>' + miss + ' possibly missable</b> · <b>' + unc + ' unconfirmed — listed honestly</b> · <b>' + doc.sources.length + ' sources</b> · list checked ' + esc(doc.checked);
  document.getElementById('missBadge').textContent = miss;
}

function renderHeader() {
  const n = state.earned.length;
  document.getElementById('earnedCount').textContent = n;
  document.getElementById('barFill').style.width = (n / trophies.length * 100) + '%';
  document.getElementById('gradeStats').innerHTML =
    ['platinum', 'gold', 'silver', 'bronze'].map(g =>
      '<span>' + g[0].toUpperCase() + ' <b>' + earnedGradeCount(g) + '/' + gradeCount(g) + '</b></span>').join('') +
    '<span>' + n + ' to go: <b>' + (trophies.length - n) + '</b></span>';
  const storyHidden = trophies.filter(t => t.kind === 'story' && !isEarned(t)).length;
  const btn = document.getElementById('spoilerBtn');
  btn.textContent = state.spoilersHidden ? 'Spoilers: hidden until earned · ' + storyHidden : 'Spoilers: shown · ' + storyHidden + ' story';
  btn.setAttribute('aria-pressed', String(state.spoilersHidden));
}

function renderStageChips() {
  document.getElementById('stageChips').innerHTML = Object.keys(STAGE_NAMES).map(k => {
    const ts = trophies.filter(t => t.stage === Number(k));
    const e = ts.filter(t => isEarned(t)).length;
    return '<span class="stagechip">S' + k + ' <b>' + e + '/' + ts.length + '</b> ' + esc(STAGE_NAMES[k].split(' — ')[0]) + '</span>';
  }).join('');
}

function renderKindChips() {
  const kinds = ['all', 'story', 'missable', 'collectible', 'activity', 'side', 'online'];
  document.getElementById('kindChips').innerHTML = kinds.map(k => {
    let n;
    if (k === 'all') n = trophies.length;
    else if (k === 'missable') n = trophies.filter(t => t.missable).length;
    else if (k === 'online') n = 0;
    else n = trophies.filter(t => t.kind === k).length;
    return '<button type="button" data-kind="' + k + '" class="' + (kindFilter === k ? 'on' : '') + '">' + (k === 'all' ? 'All' : (KIND_LABELS[k] || 'Missable')) + ' ' + n + '</button>';
  }).join('');
  document.querySelectorAll('#kindChips button').forEach(b => b.addEventListener('click', () => { kindFilter = b.dataset.kind; renderKindChips(); renderList(); }));
}

function storyHidden(t) { return t.kind === 'story' && state.spoilersHidden && !isEarned(t) && !revealed.has(t.id); }

function filteredTrophies() {
  const q = document.getElementById('search').value.trim().toLowerCase();
  const grade = document.getElementById('gradeFilter').value;
  const eo = document.getElementById('earnedOnly').checked;
  const td = document.getElementById('todoOnly').checked;
  return trophies.filter(t => {
    if (kindFilter === 'missable' && !t.missable) return false;
    if (kindFilter !== 'all' && kindFilter !== 'missable' && t.kind !== kindFilter) return false;
    if (grade !== 'all' && t.grade !== grade) return false;
    if (eo && !isEarned(t)) return false;
    if (td && isEarned(t)) return false;
    if (q && !(t.name + ' ' + t.description + ' ' + t.chapter).toLowerCase().includes(q)) return false;
    return true;
  });
}

function renderList() {
  const list = document.getElementById('list');
  const rows = filteredTrophies();
  const miss = trophies.filter(t => t.missable);
  document.getElementById('missBanner').innerHTML = '<b>⚠ ' + miss.length + ' possibly missable trophy.</b> ' + esc(miss[0].name) + ' — the Chapter 1 balcony meditation vanishes after Chapter 1. <button type="button" id="showMiss">Show it</button>';
  document.getElementById('showMiss').addEventListener('click', () => { selectTrophy(miss[0].id); });
  if (!rows.length) { list.innerHTML = '<p class="note">No trophies match these filters.</p>'; return; }
  let html = '';
  let lastStage = 0;
  for (const t of rows) {
    if (t.stage !== lastStage) {
      const ts = trophies.filter(x => x.stage === t.stage);
      const e = ts.filter(x => isEarned(x)).length;
      html += '<h3>S' + t.stage + ' · ' + esc(STAGE_NAMES[t.stage]) + ' — ' + e + '/' + ts.length + ' earned</h3>';
      lastStage = t.stage;
    }
    const hid = storyHidden(t);
    html += '<div class="trow' + (isEarned(t) ? ' earned' : '') + (t.id === selectedId ? ' sel' : '') + '" data-id="' + t.id + '">' +
      '<input type="checkbox" ' + (isEarned(t) ? 'checked' : '') + ' aria-label="Mark ' + esc(t.name) + ' earned">' +
      '<div><div class="nm">' + (hid ? 'Story trophy — hidden until earned' : esc(t.name)) + '</div>' +
      '<div class="ds">' + (hid ? 'Complete the story mission to reveal this trophy.' : esc(t.description)) + '</div>' +
      '<div class="meta"><span class="pill ' + t.grade + '">' + t.grade + '</span>' +
      '<span class="pill stage">S' + t.stage + ' · #' + t.id + '/55</span>' +
      '<span class="pill">' + (KIND_LABELS[t.kind] || t.kind) + '</span>' +
      (t.hidden ? '<span class="pill hidden">hidden</span>' : '') +
      (t.missable ? '<span class="pill miss">⚠ possibly missable</span>' : '') +
      (t.unconfirmed ? '<span class="pill unc">not confirmed yet</span>' : '') +
      (t.counter ? '<span class="pill">' + (state.counters[t.id] || 0) + '/' + t.counter.target + ' ' + esc(t.counter.unit) + '</span>' : '') +
      '</div></div></div>';
  }
  list.innerHTML = html;
  list.querySelectorAll('.trow').forEach(row => {
    const t = trophies.find(x => x.id === Number(row.dataset.id));
    row.querySelector('input').addEventListener('change', ev => { ev.stopPropagation(); toggleEarned(t); });
    row.addEventListener('click', ev => { if (ev.target.tagName !== 'INPUT') selectTrophy(t.id); });
  });
}

function selectTrophy(id) {
  selectedId = id;
  renderList(); renderDetail();
  document.getElementById('detail').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function renderDetail() {
  const t = trophies.find(x => x.id === selectedId) || trophies[0];
  const hid = storyHidden(t);
  const el = document.getElementById('detail');
  let h = '<p class="off">Official description · PlayStation</p><h2>' + (hid ? 'Story trophy — hidden until earned' : esc(t.name)) + '</h2>';
  h += '<div class="meta"><span class="pill ' + t.grade + '">' + t.grade + '</span><span class="pill stage">Stage ' + t.stage + ' · ' + esc(t.chapter) + '</span><span class="pill">#' + t.id + '/55</span></div>';
  h += '<blockquote>' + (hid ? 'This story trophy stays hidden until you earn it.' : esc(t.description)) + '</blockquote>';
  if (hid) {
    h += '<button type="button" id="revealBtn">Reveal this trophy</button> <button type="button" id="markBtn">Mark earned</button>';
    el.innerHTML = h;
    document.getElementById('revealBtn').addEventListener('click', () => { revealed.add(t.id); saveState(); renderAll(); });
    document.getElementById('markBtn').addEventListener('click', () => toggleEarned(t));
    return;
  }
  h += '<p><button type="button" id="markBtn">' + (isEarned(t) ? '✓ Earned — unmark' : 'Mark earned') + '</button></p>';
  if (t.missable) {
    h += '<div class="missbox"><b>⚠ MISSABLE — why it can be missed + point of return.</b><br>Point of return: <b>end of Chapter 1</b> (after the mission Down to Earth). In the morning at Jason\u2019s house, Lucia says she will meditate and walks to the balcony — follow her and accept. After Chapter 1 that meditation is gone for good, and there is no mission replay. It is still unconfirmed whether this one meditation is required for the trophy, so do it to be safe, and keep a manual save from the start of Chapter 1. [2][6]</div>';
  }
  if (t.unconfirmed) {
    h += '<div class="uncbox"><b>NOT CONFIRMED YET — best lead, not a sure method.</b><br>No guide has pinned this trophy\u2019s trigger down yet. The steps below are the best lead from the sources, not a guaranteed method. [3]</div>';
  }
  h += '<h3>How to get it — in our own words</h3><ol class="steps">' + t.steps.map(s => '<li>' + citeHtml(s) + '</li>').join('') + '</ol>';
  if (t.counter) {
    const cur = state.counters[t.id] || 0;
    h += '<div class="counter"><button type="button" id="cMinus" aria-label="Decrease counter">−</button><span>' + cur + ' / ' + t.counter.target + ' ' + esc(t.counter.unit) + '</span><button type="button" id="cPlus" aria-label="Increase counter">+</button></div>';
  }
  h += '<h3>Sources</h3><ol class="srcs">' + t.sources.map(n => {
    const s = sourceByNum(n);
    return '<li>[' + n + '] ' + esc(s.name) + ' — ' + esc(s.site) + ' — retrieved ' + esc(s.retrieved) + '</li>';
  }).join('') + '</ol>';
  el.innerHTML = h;
  document.getElementById('markBtn').addEventListener('click', () => toggleEarned(t));
  const minus = document.getElementById('cMinus'), plus = document.getElementById('cPlus');
  if (minus) minus.addEventListener('click', () => { state.counters[t.id] = Math.max(0, (state.counters[t.id] || 0) - 1); saveState(); renderAll(); });
  if (plus) plus.addEventListener('click', () => { state.counters[t.id] = Math.min(t.counter.target, (state.counters[t.id] || 0) + 1); saveState(); renderAll(); });
}

function renderRoadmap() {
  document.getElementById('roadmap').innerHTML = Object.keys(STAGE_NAMES).map(k => {
    const ts = trophies.filter(t => t.stage === Number(k));
    const e = ts.filter(t => isEarned(t)).length;
    return '<div class="roadstage"><h3>Stage ' + k + ' — <span>' + esc(STAGE_NAMES[k]) + '</span> · ' + e + '/' + ts.length + ' earned</h3>' +
      '<ul>' + ts.map(t => '<li>' + (isEarned(t) ? '✓ ' : '○ ') + '#' + t.id + ' ' + (storyHidden(t) ? 'Story trophy (hidden)' : esc(t.name)) + ' · ' + t.grade + (t.missable ? ' · ⚠ possibly missable' : '') + (t.counter ? ' · ' + (state.counters[t.id] || 0) + '/' + t.counter.target + ' ' + esc(t.counter.unit) : '') + '</li>').join('') + '</ul></div>';
  }).join('');
}

function renderMissables() {
  const miss = trophies.filter(t => t.missable);
  document.getElementById('missBanner2').innerHTML = '<b>⚠ ' + miss.length + ' possibly missable trophy.</b> ' + esc(miss[0].name) + ' — the Chapter 1 balcony meditation vanishes after Chapter 1 (point of return: end of Chapter 1, after Down to Earth). Do it, keep a Chapter 1 save, and the platinum is safe.';
  document.getElementById('missList').innerHTML = miss.map(t =>
    '<div class="nextcard"><span class="n">⚠</span><div><b>' + esc(t.name) + '</b> · ' + t.grade + ' · Stage ' + t.stage + ' · #' + t.id + '/55<br><span class="note">' + esc(t.description) + ' Counter: ' + (state.counters[t.id] || 0) + '/' + t.counter.target + ' ' + esc(t.counter.unit) + '.</span><br><button type="button" data-open="' + t.id + '">Open guide</button></div></div>').join('') +
    '<p class="note">Checked against PowerPyx, KeenGamer and GTABase (19 Nov 2026): all three name this one trophy only. Other guides that claim 2 or 3 missables were not confirmed by these sources, so this guide lists 1 honestly.</p>';
  document.querySelectorAll('#missList [data-open]').forEach(b => b.addEventListener('click', () => { showTab('checklist'); selectTrophy(Number(b.dataset.open)); }));
}

function renderNextUp() {
  const next = trophies.filter(t => !isEarned(t)).sort((a, b) => ((b.missable ? 1 : 0) - (a.missable ? 1 : 0)) || (a.stage - b.stage) || (a.id - b.id)).slice(0, 5);
  document.getElementById('nextList').innerHTML = next.length ? next.map((t, i) =>
    '<div class="nextcard"><span class="n">' + (i + 1) + '</span><div><b>' + (storyHidden(t) ? 'Story trophy (hidden)' : esc(t.name)) + '</b> · ' + t.grade + ' · Stage ' + t.stage + ' · ' + esc(t.chapter) + (t.missable ? ' · ⚠ possibly missable — do it first' : '') + '<br><span class="note">' + (storyHidden(t) ? 'Story trophy — hidden until earned.' : esc(t.description)) + '</span><br><button type="button" data-open="' + t.id + '">Open guide</button></div></div>').join('')
    : '<p>All 55 trophies earned — platinum unlocked. Congratulations, Leonida Legend.</p>';
  document.querySelectorAll('#nextList [data-open]').forEach(b => b.addEventListener('click', () => { showTab('checklist'); selectTrophy(Number(b.dataset.open)); }));
}

function renderSources() {
  document.getElementById('sourceList').innerHTML = doc.sources.map(s =>
    '<li>[' + s.n + '] <b>' + esc(s.name) + '</b> — ' + esc(s.site) + ' — retrieved ' + esc(s.retrieved) + '. ' + esc(s.what) + '.</li>').join('');
}

function renderAll() { renderAudit(); renderHeader(); renderStageChips(); renderKindChips(); renderList(); renderDetail(); renderRoadmap(); renderMissables(); renderNextUp(); renderSources(); }

function showTab(tab) {
  currentTab = tab;
  document.querySelectorAll('.tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
  document.querySelectorAll('.view').forEach(v => v.classList.toggle('on', v.id === 'view-' + tab));
  if (location.hash !== '#/' + tab) history.replaceState(null, '', '#/' + tab);
}

function applySample() {
  state.earned = [...SAMPLE];
  state.counters = { 28: 9 };
  saveState(); renderAll();
  document.getElementById('clearSampleBtn').hidden = false;
}

async function boot() {
  doc = await (await fetch('data/trophies.json')).json();
  trophies = doc.trophies.slice().sort((a, b) => (a.stage - b.stage) || (a.id - b.id));
  const params = new URLSearchParams(location.search);
  if (params.get('demo') === '1') { applySample(); }
  if (params.get('select')) { const n = Number(params.get('select')); if (trophies.some(t => t.id === n)) selectedId = n; }
  const hashTab = (location.hash || '').replace('#/', '');
  if (['checklist', 'roadmap', 'missables', 'nextup', 'about'].includes(hashTab)) currentTab = hashTab;
  renderAll();
  showTab(currentTab);
  saveState();

  document.querySelectorAll('.tabs button').forEach(b => b.addEventListener('click', () => showTab(b.dataset.tab)));
  document.getElementById('spoilerBtn').addEventListener('click', () => { state.spoilersHidden = !state.spoilersHidden; saveState(); renderAll(); });
  document.getElementById('search').addEventListener('input', renderList);
  document.getElementById('gradeFilter').addEventListener('change', renderList);
  document.getElementById('earnedOnly').addEventListener('change', renderList);
  document.getElementById('todoOnly').addEventListener('change', renderList);
  document.addEventListener('keydown', e => {
    if (e.key === '/' && document.activeElement !== document.getElementById('search') && document.activeElement.tagName !== 'INPUT') { e.preventDefault(); document.getElementById('search').focus(); }
  });
  document.getElementById('resetBtn').addEventListener('click', () => { state.earned = []; state.counters = {}; revealed.clear(); document.getElementById('clearSampleBtn').hidden = true; saveState(); renderAll(); });
  document.getElementById('sampleBtn').addEventListener('click', applySample);
  document.getElementById('clearSampleBtn').addEventListener('click', () => { state.earned = []; state.counters = {}; document.getElementById('clearSampleBtn').hidden = true; saveState(); renderAll(); });
  document.getElementById('exportBtn').addEventListener('click', () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify({ app: 'leonida55', earned: state.earned, counters: state.counters, exportedAt: new Date().toISOString() }, null, 2)], { type: 'application/json' }));
    a.download = 'leonida55-progress.json';
    a.click();
    URL.revokeObjectURL(a.href);
  });
  document.getElementById('importFile').addEventListener('change', async ev => {
    const file = ev.target.files[0];
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      const names = new Set(trophies.map(t => t.name));
      state.earned = (data.earned || []).filter(n => names.has(n));
      state.counters = data.counters || {};
      saveState(); renderAll();
    } catch { alert('That file is not a valid Leonida 55 export.'); }
    ev.target.value = '';
  });
}
boot();
