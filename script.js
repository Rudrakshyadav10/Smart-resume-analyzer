// ====================
//  Skills array
// ====================
const SKILLS = [
  "javascript","typescript","python","java","c++","c#","ruby","go","rust",
  "swift","kotlin","php","scala","perl","r","matlab","sql","html","css",
  "react","angular","vue","svelte","next.js","nuxt","jquery","bootstrap",
  "tailwind","sass","scss","less","webpack","vite","redux","graphql",
  "node.js","express","django","flask","fastapi","spring boot","laravel",
  "asp.net","ruby on rails","nest.js","spring",
  "mysql","postgresql","mongodb","redis","elasticsearch","firebase",
  "dynamodb","cassandra","sqlite","nosql","postgres",
  "docker","kubernetes","aws","azure","gcp","ci/cd","jenkins","git",
  "github","gitlab","bitbucket","linux","terraform","ansible","heroku",
  "vercel","netlify","render",
  "machine learning","deep learning","tensorflow","pytorch","pandas",
  "numpy","scikit-learn","data analysis","data science","nlp",
  "computer vision","neural networks","api","data engineering",
  "big data","hadoop","spark","kafka","airflow",
  "ui/ux","figma","sketch","adobe xd","graphic design","user experience",
  "user interface","prototyping","wireframing","design systems",
  "jest","cypress","selenium","unit testing","integration testing",
  "e2e testing","testing","pytest","mocha",
  "rest api","microservices","serverless","websockets","oauth","jwt",
  "agile","scrum","devops","sre","ci","cd","monitoring","logging",
  "security","cybersecurity","blockchain","iot",
  "ios","android","react native","flutter","mobile development",
  "project management","communication","teamwork","leadership",
  "problem solving","critical thinking","time management",
  "collaboration","presentation","negotiation","strategic thinking",
  "stakeholder management","mentoring","coaching"
];

// Sort skills by length (longest first)
const SKILLS_SORTED = [...SKILLS].sort((a, b) => b.length - a.length);

/**
 * Normalize text for matching
 */
function norm(txt) {
  return txt.toLowerCase()
    .replace(/[^a-z0-9\s.+#/\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extract skills from text
 */
function extractSkills(text) {
  const n = ' ' + norm(text) + ' ';
  const found = new Set();

  SKILLS_SORTED.forEach(skill => {
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp('[\\s,;:]' + escaped + '[\\s,;:.!?]');
    if (re.test(n)) found.add(skill.trim());
  });

  return found;
}

/**
 * Analyze resume and job description
 */
function analyse(resumeText, jobText) {
  const rSkills = extractSkills(resumeText);
  const jSkills = extractSkills(jobText);

  if (jSkills.size === 0) {
    // fallback: extract words ≥4 chars from jobText
    norm(jobText).split(' ')
      .filter(w => w.length >= 4)
      .forEach(w => jSkills.add(w));
  }

  const matched = [];
  const missing = [];

  jSkills.forEach(s => {
    (rSkills.has(s) ? matched : missing).push(s);
  });

  matched.sort();
  missing.sort();

  const score = jSkills.size > 0
    ? Math.round((matched.length / jSkills.size) * 100)
    : 0;

  return { score: score, matched: matched, missing: missing, total: jSkills.size };
}

/**
 * Convert PDF to text
 */
async function pdfToText(file) {
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  let text = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map(item => item.str).join(' ') + '\n';
  }

  return text;
}

// ====================
//  DOM elements
// ====================
const fileInput = document.getElementById('fileInput');
const dz = document.getElementById('dz');
const chip = document.getElementById('chip');
const chipName = document.getElementById('chipName');
const chipRm = document.getElementById('chipRm');
const jobTA = document.getElementById('jobTA');
const analyzeBtn = document.getElementById('analyzeBtn');
const btnIcon = document.getElementById('btnIcon');
const btnLabel = document.getElementById('btnLabel');
const resultsEl = document.getElementById('results');
const ringWrap = document.getElementById('ringWrap');
const ringArc = document.getElementById('ringArc');
const ringNum = document.getElementById('ringNum');
const pillEl = document.getElementById('pill');
const resultsSub = document.getElementById('resultsSub');
const matchedSection = document.getElementById('matchedSection');
const missingSection = document.getElementById('missingSection');

let currentFile = null;

/* ── drag & drop visual ── */
dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('dz--over'); });
dz.addEventListener('dragleave', () => dz.classList.remove('dz--over'));
dz.addEventListener('drop', e => {
  e.preventDefault();
  dz.classList.remove('dz--over');
  handleFile(e.dataTransfer.files[0]);
});

/* ── file selected via click ── */
fileInput.addEventListener('change', e => handleFile(e.target.files[0]));

/* ── remove file ── */
chipRm.addEventListener('click', e => {
  e.stopPropagation();
  currentFile = null;
  chip.classList.remove('chip--show');
  fileInput.value = '';
  updateBtn();
});

/* ── job textarea input → re-check button state ── */
jobTA.addEventListener('input', updateBtn);

/* ── analyze click ── */
analyzeBtn.addEventListener('click', runAnalysis);

/* ── handle file input/drop ── */
function handleFile(f) {
  if (!f) return;
  if (f.type !== 'application/pdf' && !f.name.toLowerCase().endsWith('.pdf')) {
    alert('Only PDF files are supported.');
    return;
  }
  currentFile = f;
  chipName.textContent = f.name;
  chip.classList.add('chip--show');
  updateBtn();
  hideResults();
}

/* ── enable/disable analyze button ── */
function updateBtn() {
  const ready = currentFile && jobTA.value.trim().length > 10;
  analyzeBtn.classList.toggle('btn--disabled', !ready);
}

/* ── hide results panel ── */
function hideResults() {
  resultsEl.classList.remove('results--visible');
  setTimeout(() => resultsEl.classList.remove('results--show'), 420);
}

/* ── show results panel ── */
function showResults() {
  resultsEl.classList.add('results--show');
  void resultsEl.offsetWidth;
  resultsEl.classList.add('results--visible');
}

/* ── main analysis function ── */
async function runAnalysis() {
  if (!currentFile || jobTA.value.trim().length < 10) return;

  // show spinner
  analyzeBtn.classList.add('btn--disabled');
  btnIcon.style.display = 'none';
  btnLabel.textContent = 'Analyzing…';
  const spinner = document.createElement('div');
  spinner.className = 'spinner';
  analyzeBtn.insertBefore(spinner, btnLabel);

  hideResults();

  try {
    const resumeText = await pdfToText(currentFile);
    await new Promise(r => setTimeout(r, 550));
    const result = analyse(resumeText, jobTA.value);
    renderResults(result);
  } catch (err) {
    console.error('PDF read error:', err);
    alert('Could not read the PDF. Please try a different file.');
  }

  // restore button
  spinner.remove();
  btnIcon.style.display = '';
  btnLabel.textContent = 'Analyze Resume';
  analyzeBtn.classList.remove('btn--disabled');
  updateBtn();
}

/* ── render results ── */
function renderResults(data) {
  const tier = data.score >= 70 ? 'high' : data.score >= 45 ? 'mid' : 'low';
  const labels = { high: '🎯 Strong Match', mid: '⚡ Moderate Match', low: '📋 Needs Work' };

  resultsSub.textContent = `${data.matched.length} of ${data.total} required skills detected`;

  // ring
  ringWrap.className = 'ring ring--' + tier;
  ringArc.style.strokeDashoffset = 377 - (377 * data.score / 100);
  ringNum.textContent = data.score + '%';

  // pill
  pillEl.className = 'pill pill--' + tier;
  pillEl.textContent = labels[tier];

  // matched skills
  renderSkillSection(matchedSection, data.matched, 'hit');

  // missing skills
  if (data.missing.length > 0) {
    renderSkillSection(missingSection, data.missing, 'miss');
  } else {
    missingSection.innerHTML =
      '<div class="empty"><div class="empty__ico">🎉</div>No missing skills — excellent match!</div>';
  }

  showResults();
}

/**
 * Render skill section (matched or missing)
 */
function renderSkillSection(container, skills, type) {
  const isHit = type === 'hit';
  const iconSvg = isHit
    ? `<svg viewBox="0 0 24 24" fill="none" stroke="#2e7d46" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`
    : `<svg viewBox="0 0 24 24" fill="none" stroke="#c94a2f" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="13"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
  const tagIcon = isHit
    ? `<svg viewBox="0 0 24 24" fill="none" stroke="#2e7d46" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`
    : `<svg viewBox="0 0 24 24" fill="none" stroke="#c94a2f" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
  const title = isHit ? 'Matched Skills' : 'Missing Skills';

  const tagsHTML = skills.map((s, i) =>
    `<span class="tag tag--${type}" style="transition-delay:${i * 0.04}s">${tagIcon}${escapeHtml(s)}</span>`
  ).join('');

  container.innerHTML = `
    <div class="sh">
      <div class="sh__ico sh__ico--${type}">${iconSvg}</div>
      <span class="sh__title">${title}</span>
      <span class="sh__count">${skills.length}</span>
    </div>
    <div class="tags" id="tags_${type}">${tagsHTML}</div>
  `;

  requestAnimationFrame(() => {
    container.querySelectorAll('.tag').forEach(tag => tag.classList.add('tag--in'));
  });
}

/** Escape HTML entities */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}