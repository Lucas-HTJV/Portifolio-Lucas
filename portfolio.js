// ── PORTFOLIO JS — Firebase Edition ──────────────────────────────────────────
import { initializeApp }                       from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, getDocs,
         addDoc, updateDoc, deleteDoc,
         doc, query, orderBy }                 from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ── CONFIG FIREBASE ───────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey:            "AIzaSyBaZyXXkh5Pw-pVQJHCh7UktvH6kXt2wdA",
  authDomain:        "portifolio-lucas-dd45a.firebaseapp.com",
  databaseURL:       "https://portifolio-lucas-dd45a-default-rtdb.firebaseio.com",
  projectId:         "portifolio-lucas-dd45a",
  storageBucket:     "portifolio-lucas-dd45a.firebasestorage.app",
  messagingSenderId: "11838766349",
  appId:             "1:11838766349:web:6adfaab537ca874b104444"
};

const _app = initializeApp(firebaseConfig);
const _db  = getFirestore(_app);
const _col = collection(_db, 'projects');

// ── SENHA ADMIN (SHA-256) ─────────────────────────────────────────────────────
const _ADMIN_HASH = 'f65e05c8dffb29962a8d5b33cbf4d1326b05f23831eb8ed8855379a602340327';

// ── ESTADO ────────────────────────────────────────────────────────────────────
let _authenticated      = false;
let projects            = [];
let pendingPhotoBase64  = '';
let savedPhotoBase64    = localStorage.getItem('portfolio_photo') || '';
let currentCoverBase64  = '';
let currentProjectFiles = [];
let _loginAttempts      = 0;
let _loginBlockedUntil  = 0;
let _inactivityTimer;

// ── HASH SHA-256 ──────────────────────────────────────────────────────────────
async function _hash(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
}

// ── SANITIZE ──────────────────────────────────────────────────────────────────
function _sanitize(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

// ── FOTO ──────────────────────────────────────────────────────────────────────
function applySavedPhoto() {
  if (!savedPhotoBase64) return;
  const heroImg  = document.getElementById('hero-photo-img');
  const heroPH   = document.getElementById('hero-placeholder');
  const aboutImg = document.getElementById('about-photo-img');
  const aboutPH  = document.getElementById('about-placeholder');
  if (heroImg)  { heroImg.src  = savedPhotoBase64; heroImg.style.display  = 'block'; }
  if (heroPH)   heroPH.style.display  = 'none';
  if (aboutImg) { aboutImg.src = savedPhotoBase64; aboutImg.style.display = 'block'; }
  if (aboutPH)  aboutPH.style.display = 'none';
}

// ── SCROLL REVEAL ─────────────────────────────────────────────────────────────
const obs = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.1 });
document.querySelectorAll('.reveal').forEach(r => obs.observe(r));

// ── ANO ───────────────────────────────────────────────────────────────────────
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// ── RENDER PROJETOS ───────────────────────────────────────────────────────────
function renderProjects() {
  const grid   = document.getElementById('projects-grid');
  const statEl = document.getElementById('stat-projects');
  if (statEl) statEl.textContent = projects.length;
  if (!grid) return;
  if (projects.length === 0) {
    grid.innerHTML = `
      <div class="no-projects reveal">
        <div style="font-size:2.2rem;margin-bottom:0.6rem">🚀</div>
        <strong style="color:var(--purple-bright);font-size:1rem;font-family:'Fraunces',serif;font-style:italic;">Projetos em breve</strong>
        <p>Adicione seus projetos pelo painel admin.</p>
      </div>`;
    return;
  }
  grid.innerHTML = projects.map((p, i) => `
    <div class="project-card reveal" style="transition-delay:${i * 0.07}s">
      <div class="project-cover">
        ${p.cover ? `<img src="${p.cover}" alt="${p.title}">` : `<div class="project-cover-placeholder">◈</div>`}
      </div>
      <div class="project-body">
        <div class="project-title">${p.title}</div>
        <p class="project-desc">${p.desc}</p>
        <div class="project-tags">${(p.tags||[]).map(t=>`<span class="project-tag">${t.trim()}</span>`).join('')}</div>
        <div style="display:flex;gap:0.8rem;margin-top:0.9rem;flex-wrap:wrap;align-items:center;">
          ${p.github ? `<a href="${p.github}" target="_blank" style="font-size:0.75rem;color:var(--muted);text-decoration:none;font-family:'JetBrains Mono',monospace;letter-spacing:0.05em;display:flex;align-items:center;gap:4px;transition:color 0.2s;" onmouseover="this.style.color='var(--purple-bright)'" onmouseout="this.style.color='var(--muted)'">⌥ GitHub</a>` : ''}
          ${p.url ? `<a href="${p.url}" target="_blank" style="font-size:0.75rem;color:var(--purple-bright);text-decoration:none;font-family:'JetBrains Mono',monospace;letter-spacing:0.05em;">→ Ver projeto</a>` : ''}
          ${(p.files||[]).map(f=>`<a href="${f.dataUrl}" download="${f.name}" style="font-size:0.72rem;color:var(--neon);text-decoration:none;font-family:'JetBrains Mono',monospace;letter-spacing:0.04em;background:rgba(160,64,255,0.1);border:1px solid rgba(160,64,255,0.3);padding:2px 8px;border-radius:4px;">⬇ ${f.name}</a>`).join('')}
        </div>
      </div>
    </div>
  `).join('');
  document.querySelectorAll('.reveal:not(.visible)').forEach(r => obs.observe(r));
}

// ── FIREBASE: CARREGAR ────────────────────────────────────────────────────────
async function _loadFromFirebase() {
  try {
    const q    = query(_col, orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    projects   = snap.docs.map(d => ({ ...d.data(), _firebaseId: d.id }));
    renderProjects();
  } catch (err) {
    console.error('[Firebase] Erro ao carregar:', err);
  }
}

// ── MODAL ─────────────────────────────────────────────────────────────────────
function _closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('open');
}
function _openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('open');
}
document.querySelectorAll('.modal-overlay').forEach(o => {
  o.addEventListener('click', e => { if (e.target === o) _closeModal(o.id); });
});

// ── LOGIN ─────────────────────────────────────────────────────────────────────
function openLogin() {
  _openModal('login-modal');
  setTimeout(() => { const inp = document.getElementById('login-input'); if (inp) inp.focus(); }, 100);
}

async function tryLogin() {
  const now = Date.now();
  const err = document.getElementById('login-error');
  if (now < _loginBlockedUntil) {
    const secs = Math.ceil((_loginBlockedUntil - now) / 1000);
    err.textContent = `Muitas tentativas. Aguarde ${secs}s.`;
    err.classList.add('show'); return;
  }
  const inp = document.getElementById('login-input');
  const val = inp ? inp.value : '';
  if (!val) return;
  const inputHash = await _hash(val);
  inp.value = '';
  if (inputHash === _ADMIN_HASH) {
    _authenticated = true; _loginAttempts = 0;
    err.classList.remove('show');
    _closeModal('login-modal');
    _openAdmin();
  } else {
    _authenticated = false; _loginAttempts++;
    if (_loginAttempts >= 5) {
      _loginBlockedUntil = now + 30000; _loginAttempts = 0;
      err.textContent = 'Bloqueado por 30s após muitas tentativas.';
    } else {
      err.textContent = `Senha incorreta. Tentativa ${_loginAttempts}/5.`;
    }
    err.classList.add('show');
  }
}

// ── ADMIN ─────────────────────────────────────────────────────────────────────
function _openAdmin() {
  if (!_authenticated) return;
  _renderAdminList(); _switchTabInternal('tab-add'); _resetForm();
  _openModal('admin-modal');
}

function closeModal(id) {
  if (id === 'admin-modal' && !_authenticated) return;
  _closeModal(id);
}

const TAB_MAP = { 'tab-add': 0, 'tab-list': 1, 'tab-photo': 2 };
function _switchTabInternal(tabId) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
  const tabEl = document.getElementById(tabId);
  if (tabEl) tabEl.classList.add('active');
  const tabs = document.querySelectorAll('.admin-tab');
  if (tabs[TAB_MAP[tabId]]) tabs[TAB_MAP[tabId]].classList.add('active');
  if (tabId === 'tab-list') _renderAdminList();
}
function switchTab(tabId) {
  if (!_authenticated) return;
  _switchTabInternal(tabId);
}

// ── CAPA ──────────────────────────────────────────────────────────────────────
function previewCover(e) {
  const file = e.target.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    currentCoverBase64 = ev.target.result;
    const img = document.getElementById('cover-preview-img');
    if (img) { img.src = currentCoverBase64; img.style.display = 'block'; }
  };
  reader.readAsDataURL(file);
}

// ── ARQUIVOS ──────────────────────────────────────────────────────────────────
function handleProjectFiles(e) {
  const files = Array.from(e.target.files); if (!files.length) return;
  currentProjectFiles = []; let loaded = 0;
  const label = document.getElementById('proj-files-label');
  if (label) label.innerHTML = `<span style="color:var(--purple-bright)">Carregando ${files.length} arquivo(s)...</span>`;
  files.forEach(file => {
    const reader = new FileReader();
    reader.onload = ev => {
      currentProjectFiles.push({ name: file.name, dataUrl: ev.target.result });
      loaded++;
      if (loaded === files.length && label) {
        label.innerHTML = `<span style="color:var(--purple-bright)">✓ ${files.length} arquivo(s) anexado(s):<br>${files.map(f=>'<span style="opacity:0.7;font-size:0.7rem">'+f.name+'</span>').join(' &nbsp;')}</span>`;
      }
    };
    reader.readAsDataURL(file);
  });
}

// ── FOTO ADMIN ────────────────────────────────────────────────────────────────
function handleAdminPhotoUpload(e) {
  if (!_authenticated) return;
  const file = e.target.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    pendingPhotoBase64 = ev.target.result;
    const prev = document.getElementById('photo-admin-preview');
    if (prev) { prev.src = pendingPhotoBase64; prev.style.display = 'block'; }
  };
  reader.readAsDataURL(file);
}

function applyPhoto() {
  if (!_authenticated) return;
  if (!pendingPhotoBase64) { alert('Selecione uma foto primeiro.'); return; }
  savedPhotoBase64 = pendingPhotoBase64;
  localStorage.setItem('portfolio_photo', savedPhotoBase64);
  applySavedPhoto();
  _closeModal('admin-modal');
}

// ── SALVAR PROJETO ────────────────────────────────────────────────────────────
async function saveProject() {
  if (!_authenticated) return;
  const title   = _sanitize(document.getElementById('proj-title').value.trim());
  const desc    = _sanitize(document.getElementById('proj-desc').value.trim());
  const tagsRaw = _sanitize(document.getElementById('proj-tags').value.trim());
  const github  = document.getElementById('proj-github').value.trim();
  const url     = document.getElementById('proj-url').value.trim();
  const editId  = document.getElementById('edit-id').value;
  if (!title) { alert('Adicione um título ao projeto.'); return; }
  const tags = tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : [];
  const btn  = document.querySelector('#tab-add .btn-full');
  if (btn) { btn.textContent = 'Salvando...'; btn.disabled = true; }
  try {
    if (editId) {
      const existing = projects.find(p => p.id === editId);
      const proj = {
        id: editId, title, desc, tags, github, url,
        cover: currentCoverBase64 || (existing ? existing.cover : ''),
        files: currentProjectFiles.length ? currentProjectFiles : (existing ? existing.files || [] : []),
        createdAt: existing ? existing.createdAt : Date.now()
      };
      if (existing && existing._firebaseId) await updateDoc(doc(_db, 'projects', existing._firebaseId), proj);
    } else {
      await addDoc(_col, { id: Date.now().toString(), title, desc, tags, github, url, cover: currentCoverBase64, files: currentProjectFiles, createdAt: Date.now() });
    }
    await _loadFromFirebase();
    _resetForm(); _switchTabInternal('tab-list');
  } catch (err) {
    console.error('[Firebase] Erro ao salvar:', err);
    alert('Erro ao salvar. Verifique o console.');
  } finally {
    if (btn) { btn.textContent = 'Salvar Projeto'; btn.disabled = false; }
  }
}

// ── RESET FORM ────────────────────────────────────────────────────────────────
function _resetForm() {
  ['edit-id','proj-title','proj-desc','proj-tags','proj-github','proj-url'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
  const coverImg = document.getElementById('cover-preview-img');
  if (coverImg) coverImg.style.display = 'none';
  const coverFile = document.getElementById('cover-file'); if (coverFile) coverFile.value = '';
  const projFiles = document.getElementById('proj-files'); if (projFiles) projFiles.value = '';
  const label = document.getElementById('proj-files-label');
  if (label) label.innerHTML = 'Clique para anexar arquivos do projeto<br><span style="font-size:0.71rem;opacity:0.5">ZIP, HTML, CSS, JS, etc.</span>';
  currentCoverBase64 = ''; currentProjectFiles = [];
}
function resetForm() { if (_authenticated) _resetForm(); }

// ── LISTA ADMIN ───────────────────────────────────────────────────────────────
function _renderAdminList() {
  const list = document.getElementById('admin-proj-list'); if (!list) return;
  if (projects.length === 0) {
    list.innerHTML = `<p style="color:var(--muted);font-size:0.85rem;text-align:center;padding:2rem">Nenhum projeto ainda.</p>`;
    return;
  }
  list.innerHTML = projects.map(p => `
    <div class="admin-proj-item">
      <span class="admin-proj-name">${p.title}</span>
      <div class="admin-proj-actions">
        <button class="btn-sm btn-edit" onclick="window.__editProject('${p.id}')">Editar</button>
        <button class="btn-sm btn-delete" onclick="window.__deleteProject('${p.id}')">Excluir</button>
      </div>
    </div>
  `).join('');
}

function editProject(id) {
  if (!_authenticated) return;
  const p = projects.find(x => x.id === id); if (!p) return;
  document.getElementById('edit-id').value    = p.id;
  document.getElementById('proj-title').value = p.title;
  document.getElementById('proj-desc').value  = p.desc;
  document.getElementById('proj-tags').value  = (p.tags||[]).join(', ');
  document.getElementById('proj-github').value = p.github || '';
  document.getElementById('proj-url').value   = p.url || '';
  currentCoverBase64 = p.cover || ''; currentProjectFiles = p.files || [];
  if (p.cover) { const img = document.getElementById('cover-preview-img'); if(img){img.src=p.cover;img.style.display='block';} }
  if (currentProjectFiles.length) {
    const lbl = document.getElementById('proj-files-label');
    if (lbl) lbl.innerHTML = `<span style="color:var(--purple-bright)">✓ ${currentProjectFiles.length} arquivo(s) já anexado(s)</span>`;
  }
  _switchTabInternal('tab-add');
}

async function deleteProject(id) {
  if (!_authenticated) return;
  if (!confirm('Excluir este projeto?')) return;
  try {
    const p = projects.find(x => x.id === id);
    if (p && p._firebaseId) await deleteDoc(doc(_db, 'projects', p._firebaseId));
    await _loadFromFirebase(); _renderAdminList();
  } catch (err) {
    console.error('[Firebase] Erro ao excluir:', err);
    alert('Erro ao excluir projeto.');
  }
}

// ── AUTO-LOCK ─────────────────────────────────────────────────────────────────
function _resetInactivity() {
  clearTimeout(_inactivityTimer);
  if (!_authenticated) return;
  _inactivityTimer = setTimeout(() => {
    _authenticated = false;
    _closeModal('admin-modal'); _closeModal('login-modal');
  }, 15 * 60 * 1000);
}
['click','keydown','mousemove','touchstart'].forEach(ev =>
  document.addEventListener(ev, _resetInactivity, { passive: true })
);

// ── EXPOR FUNÇÕES GLOBAIS (obrigatório com type="module") ─────────────────────
window.openLogin              = openLogin;
window.tryLogin               = tryLogin;
window.closeModal             = closeModal;
window.switchTab              = switchTab;
window.previewCover           = previewCover;
window.handleProjectFiles     = handleProjectFiles;
window.handleAdminPhotoUpload = handleAdminPhotoUpload;
window.applyPhoto             = applyPhoto;
window.saveProject            = saveProject;
window.resetForm              = resetForm;
window.__editProject          = editProject;
window.__deleteProject        = deleteProject;
window.toggleMenu             = function () {
  document.getElementById('nav-links').classList.toggle('mobile-open');
  document.getElementById('nav-hamburger').classList.toggle('open');
};
window.closeMenu = function () {
  document.getElementById('nav-links').classList.remove('mobile-open');
  document.getElementById('nav-hamburger').classList.remove('open');
};

// ── BINARY RAIN ───────────────────────────────────────────────────────────────
(function () {
  const canvas = document.getElementById('binary-canvas'); if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = 320, H = 380; canvas.width = W; canvas.height = H;
  const fontSize = 11, cols = Math.floor(W / fontSize);
  const drops = Array.from({ length: cols }, () => Math.random() * -H);
  const chars = '01';
  function draw() {
    ctx.fillStyle = 'rgba(7,6,15,0.18)'; ctx.fillRect(0,0,W,H);
    for (let i = 0; i < drops.length; i++) {
      const ch = chars[Math.floor(Math.random() * chars.length)];
      const y  = drops[i] * fontSize;
      ctx.fillStyle = 'rgba(212,128,255,0.95)';
      ctx.font = `${fontSize}px 'JetBrains Mono', monospace`;
      ctx.fillText(ch, i * fontSize, y);
      ctx.fillStyle = 'rgba(160,64,255,0.35)';
      ctx.fillText(chars[Math.floor(Math.random() * chars.length)], i * fontSize, y - fontSize);
      drops[i] += 0.4 + Math.random() * 0.3;
      if (drops[i] * fontSize > H && Math.random() > 0.975) drops[i] = Math.random() * -20;
    }
  }
  setInterval(draw, 45);
})();

// ── TYPEWRITER ────────────────────────────────────────────────────────────────
(function () {
  const el = document.getElementById('typewriter-title'); if (!el) return;
  const fullText = el.textContent; el.textContent = ''; el.style.width = '0';
  let started = false;
  const triggerTypewriter = () => {
    if (started) return; started = true; let i = 0;
    el.style.width = '0'; el.style.animation = 'none'; el.style.borderRightColor = 'var(--purple)';
    const interval = setInterval(() => {
      el.textContent = fullText.slice(0, i + 1); el.style.width = 'auto'; i++;
      if (i >= fullText.length) { clearInterval(interval); setTimeout(() => el.classList.add('done'), 1500); }
    }, 90);
  };
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => { if (entry.isIntersecting) { setTimeout(triggerTypewriter, 300); observer.disconnect(); } });
  }, { threshold: 0.4 });
  const section = document.getElementById('about');
  if (section) observer.observe(section); else triggerTypewriter();
})();

// ── HAMBURGER ─────────────────────────────────────────────────────────────────
function checkHamburger() {
  const btn = document.getElementById('nav-hamburger'); if (!btn) return;
  btn.style.display = window.innerWidth <= 640 ? 'flex' : 'none';
  if (window.innerWidth > 640) window.closeMenu();
}
window.addEventListener('resize', checkHamburger);
checkHamburger();

// ── INIT ──────────────────────────────────────────────────────────────────────
_loadFromFirebase();
applySavedPhoto();
