// ── PORTFOLIO JS ─────────────────────────────────────────────────────────────
// Senha protegida por SHA-256 — impossível reverter para a original
const _ADMIN_HASH = 'f65e05c8dffb29962a8d5b33cbf4d1326b05f23831eb8ed8855379a602340327';

(function () {
  'use strict';

  // ── Flag de autenticação (privada, inacessível pelo console) ──────────────
  let _authenticated = false;

  // ── Hash SHA-256 via Web Crypto API ───────────────────────────────────────
  async function _hash(str) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // ── Guard: bloqueia acesso ao admin sem autenticação ─────────────────────
  function _requireAuth(fn) {
    return function (...args) {
      if (!_authenticated) {
        console.warn('[Portfolio] Acesso negado.');
        return;
      }
      return fn(...args);
    };
  }

  // ── Storage ───────────────────────────────────────────────────────────────
  // Carrega projetos com validação básica de estrutura
  function _loadProjects() {
    try {
      const raw = JSON.parse(localStorage.getItem('portfolio_projects') || '[]');
      if (!Array.isArray(raw)) return [];
      return raw.filter(p =>
        p && typeof p === 'object' &&
        typeof p.id === 'string' &&
        typeof p.title === 'string' &&
        p.title.length > 0 &&
        p.title.length < 200
      );
    } catch { return []; }
  }
  let projects = _loadProjects();
  let pendingPhotoBase64 = '';
  let savedPhotoBase64 = localStorage.getItem('portfolio_photo') || '';
  let currentCoverBase64 = '';
  let currentProjectFiles = [];

  function saveStorage() { localStorage.setItem('portfolio_projects', JSON.stringify(projects)); }

  // ── Foto ──────────────────────────────────────────────────────────────────
  function applySavedPhoto() {
    if (!savedPhotoBase64) return;
    const heroImg  = document.getElementById('hero-photo-img');
    const heroPH   = document.getElementById('hero-placeholder');
    const aboutImg = document.getElementById('about-photo-img');
    const aboutPH  = document.getElementById('about-placeholder');
    heroImg.src = savedPhotoBase64; heroImg.style.display = 'block';
    if (heroPH)  heroPH.style.display  = 'none';
    aboutImg.src = savedPhotoBase64; aboutImg.style.display = 'block';
    if (aboutPH) aboutPH.style.display = 'none';
  }

  window.uploadPhoto = function (e) {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      savedPhotoBase64 = ev.target.result;
      localStorage.setItem('portfolio_photo', savedPhotoBase64);
      applySavedPhoto();
    };
    reader.readAsDataURL(file);
  };

  window.handleAdminPhotoUpload = _requireAuth(function (e) {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      pendingPhotoBase64 = ev.target.result;
      const prev = document.getElementById('photo-admin-preview');
      prev.src = pendingPhotoBase64; prev.style.display = 'block';
    };
    reader.readAsDataURL(file);
  });

  window.applyPhoto = _requireAuth(function () {
    if (!pendingPhotoBase64) { alert('Selecione uma foto primeiro.'); return; }
    savedPhotoBase64 = pendingPhotoBase64;
    localStorage.setItem('portfolio_photo', savedPhotoBase64);
    applySavedPhoto();
    _closeModal('admin-modal');
  });

  // ── Scroll Reveal ─────────────────────────────────────────────────────────
  const reveals = document.querySelectorAll('.reveal');
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.1 });
  reveals.forEach(r => obs.observe(r));

  document.getElementById('year').textContent = new Date().getFullYear();

  // ── Render Projetos ───────────────────────────────────────────────────────
  function renderProjects() {
    const grid = document.getElementById('projects-grid');
    document.getElementById('stat-projects').textContent = projects.length;
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
            ${(p.files||[]).map(f => `<a href="${f.dataUrl}" download="${f.name}" style="font-size:0.72rem;color:var(--neon);text-decoration:none;font-family:'JetBrains Mono',monospace;letter-spacing:0.04em;background:rgba(160,64,255,0.1);border:1px solid rgba(160,64,255,0.3);padding:2px 8px;border-radius:4px;" title="Baixar ${f.name}">⬇ ${f.name}</a>`).join('')}
          </div>
        </div>
      </div>
    `).join('');
    document.querySelectorAll('.reveal:not(.visible)').forEach(r => obs.observe(r));
  }

  // ── Login ─────────────────────────────────────────────────────────────────
  window.openLogin = function () {
    document.getElementById('login-modal').classList.add('open');
    setTimeout(() => document.getElementById('login-input').focus(), 100);
  };

  // Rate limit: bloqueia após 5 tentativas erradas por 30s
  let _loginAttempts = 0;
  let _loginBlockedUntil = 0;

  window.tryLogin = async function () {
    const now = Date.now();
    const err = document.getElementById('login-error');

    // Bloqueio temporário
    if (now < _loginBlockedUntil) {
      const secs = Math.ceil((_loginBlockedUntil - now) / 1000);
      err.textContent = `Muitas tentativas. Aguarde ${secs}s.`;
      err.classList.add('show');
      return;
    }

    const val = document.getElementById('login-input').value;
    if (!val) return;

    const inputHash = await _hash(val);
    document.getElementById('login-input').value = '';

    if (inputHash === _ADMIN_HASH) {
      _authenticated = true;
      _loginAttempts = 0;
      err.textContent = 'Senha incorreta. Tente novamente.';
      err.classList.remove('show');
      _closeModal('login-modal');
      _openAdmin();
    } else {
      _authenticated = false;
      _loginAttempts++;
      if (_loginAttempts >= 5) {
        _loginBlockedUntil = now + 30000; // 30 segundos
        _loginAttempts = 0;
        err.textContent = 'Bloqueado por 30s após muitas tentativas.';
      } else {
        err.textContent = `Senha incorreta. Tentativa ${_loginAttempts}/5.`;
      }
      err.classList.add('show');
    }
  };

  // ── Admin (privado — não exposto no window) ───────────────────────────────
  function _openAdmin() {
    if (!_authenticated) return;
    _renderAdminList(); _switchTab('tab-add'); _resetForm();
    document.getElementById('admin-modal').classList.add('open');
  }

  function _closeModal(id) { document.getElementById(id).classList.remove('open'); }
  // closeModal: login-modal pode fechar livremente, admin-modal só autenticado
  window.closeModal = function(id) {
    if (id === 'admin-modal' && !_authenticated) return;
    _closeModal(id);
  };

  document.querySelectorAll('.modal-overlay').forEach(o => {
    o.addEventListener('click', e => { if (e.target === o) _closeModal(o.id); });
  });

  const TAB_MAP = { 'tab-add': 0, 'tab-list': 1, 'tab-photo': 2 };
  function _switchTab(tabId) {
    if (!_authenticated) return;
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    document.querySelectorAll('.admin-tab')[TAB_MAP[tabId]].classList.add('active');
    if (tabId === 'tab-list') _renderAdminList();
  }
  window.switchTab = _requireAuth(_switchTab);

  window.previewCover = function (e) {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      currentCoverBase64 = ev.target.result;
      const img = document.getElementById('cover-preview-img');
      img.src = currentCoverBase64; img.style.display = 'block';
    };
    reader.readAsDataURL(file);
  };

  window.handleProjectFiles = function (e) {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    currentProjectFiles = [];
    let loaded = 0;
    const label = document.getElementById('proj-files-label');
    label.innerHTML = `<span style="color:var(--purple-bright)">Carregando ${files.length} arquivo(s)...</span>`;
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => {
        currentProjectFiles.push({ name: file.name, dataUrl: ev.target.result });
        loaded++;
        if (loaded === files.length) {
          label.innerHTML = `<span style="color:var(--purple-bright)">✓ ${files.length} arquivo(s) anexado(s):<br>${files.map(f=>'<span style="opacity:0.7;font-size:0.7rem">'+f.name+'</span>').join(' &nbsp;')}</span>`;
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Sanitiza texto removendo tags HTML
  function _sanitize(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  window.saveProject = _requireAuth(function () {
    const title  = _sanitize(document.getElementById('proj-title').value.trim());
    const desc   = _sanitize(document.getElementById('proj-desc').value.trim());
    const tagsRaw= _sanitize(document.getElementById('proj-tags').value.trim());
    const github = document.getElementById('proj-github').value.trim();
    const url    = document.getElementById('proj-url').value.trim();
    const editId = document.getElementById('edit-id').value;
    if (!title) { alert('Adicione um título ao projeto.'); return; }
    const tags = tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : [];
    const id = editId || Date.now().toString();
    const proj = { id, title, desc, tags, github, url, cover: currentCoverBase64, files: currentProjectFiles };
    if (editId) {
      const idx = projects.findIndex(p => p.id === editId);
      if (idx !== -1) {
        if (!currentCoverBase64) proj.cover = projects[idx].cover;
        if (!currentProjectFiles.length) proj.files = projects[idx].files || [];
        projects[idx] = proj;
      }
    } else { projects.unshift(proj); }
    saveStorage(); renderProjects(); _resetForm(); _switchTab('tab-list');
  });

  function _resetForm() {
    document.getElementById('edit-id').value = '';
    document.getElementById('proj-title').value = '';
    document.getElementById('proj-desc').value = '';
    document.getElementById('proj-tags').value = '';
    document.getElementById('proj-github').value = '';
    document.getElementById('proj-url').value = '';
    document.getElementById('cover-preview-img').style.display = 'none';
    document.getElementById('cover-file').value = '';
    document.getElementById('proj-files').value = '';
    document.getElementById('proj-files-label').innerHTML = 'Clique para anexar arquivos do projeto<br><span style="font-size:0.71rem;opacity:0.5">ZIP, HTML, CSS, JS, etc.</span>';
    currentCoverBase64 = '';
    currentProjectFiles = [];
  }
  window.resetForm = _requireAuth(_resetForm);

  function _renderAdminList() {
    const list = document.getElementById('admin-proj-list');
    if (projects.length === 0) {
      list.innerHTML = `<p style="color:var(--muted);font-size:0.85rem;text-align:center;padding:2rem">Nenhum projeto ainda.</p>`;
      return;
    }
    list.innerHTML = projects.map(p => `
      <div class="admin-proj-item">
        <span class="admin-proj-name">${p.title}</span>
        <div class="admin-proj-actions">
          <button class="btn-sm btn-edit" onclick="editProject('${p.id}')">Editar</button>
          <button class="btn-sm btn-delete" onclick="deleteProject('${p.id}')">Excluir</button>
        </div>
      </div>
    `).join('');
  }

  window.editProject = _requireAuth(function (id) {
    const p = projects.find(x => x.id === id); if (!p) return;
    document.getElementById('edit-id').value = p.id;
    document.getElementById('proj-title').value = p.title;
    document.getElementById('proj-desc').value = p.desc;
    document.getElementById('proj-tags').value = (p.tags||[]).join(', ');
    document.getElementById('proj-github').value = p.github || '';
    document.getElementById('proj-url').value = p.url || '';
    currentCoverBase64 = p.cover || '';
    currentProjectFiles = p.files || [];
    if (p.cover) { const img = document.getElementById('cover-preview-img'); img.src = p.cover; img.style.display = 'block'; }
    if (currentProjectFiles.length) {
      document.getElementById('proj-files-label').innerHTML = `<span style="color:var(--purple-bright)">✓ ${currentProjectFiles.length} arquivo(s) já anexado(s)</span>`;
    }
    _switchTab('tab-add');
  });

  window.deleteProject = _requireAuth(function (id) {
    if (!confirm('Excluir este projeto?')) return;
    projects = projects.filter(p => p.id !== id);
    saveStorage(); renderProjects(); _renderAdminList();
  });

  // ── Auto-lock: desloga após 15min de inatividade ─────────────────────────
  let _inactivityTimer;
  function _resetInactivity() {
    clearTimeout(_inactivityTimer);
    if (!_authenticated) return;
    _inactivityTimer = setTimeout(() => {
      _authenticated = false;
      _closeModal('admin-modal');
      _closeModal('login-modal');
      console.info('[Portfolio] Sessão expirada por inatividade.');
    }, 15 * 60 * 1000); // 15 minutos
  }
  ['click','keydown','mousemove','touchstart'].forEach(ev =>
    document.addEventListener(ev, _resetInactivity, { passive: true })
  );

  // ── Init ──────────────────────────────────────────────────────────────────
  renderProjects();
  applySavedPhoto();

  // ── Binary Rain ───────────────────────────────────────────────────────────
  (function () {
    const canvas = document.getElementById('binary-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = 320, H = 380;
    canvas.width = W; canvas.height = H;
    const fontSize = 11;
    const cols = Math.floor(W / fontSize);
    const drops = Array.from({ length: cols }, () => Math.random() * -H);
    const chars = '01';
    function draw() {
      ctx.fillStyle = 'rgba(7,6,15,0.18)';
      ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < drops.length; i++) {
        const ch = chars[Math.floor(Math.random() * chars.length)];
        const y = drops[i] * fontSize;
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

  // ── Typewriter ────────────────────────────────────────────────────────────
  (function () {
    const el = document.getElementById('typewriter-title');
    if (!el) return;
    const fullText = el.textContent;
    el.textContent = '';
    el.style.width = '0';
    let started = false;
    const triggerTypewriter = () => {
      if (started) return;
      started = true;
      let i = 0;
      el.style.width = '0';
      el.style.animation = 'none';
      el.style.borderRightColor = 'var(--purple)';
      const interval = setInterval(() => {
        el.textContent = fullText.slice(0, i + 1);
        el.style.width = 'auto';
        i++;
        if (i >= fullText.length) {
          clearInterval(interval);
          setTimeout(() => el.classList.add('done'), 1500);
        }
      }, 90);
    };
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { setTimeout(triggerTypewriter, 300); observer.disconnect(); }
      });
    }, { threshold: 0.4 });
    const section = document.getElementById('about');
    if (section) observer.observe(section);
    else triggerTypewriter();
  })();

  // ── Hamburger Menu ────────────────────────────────────────────────────────
  window.toggleMenu = function () {
    document.getElementById('nav-links').classList.toggle('mobile-open');
    document.getElementById('nav-hamburger').classList.toggle('open');
  };
  window.closeMenu = function () {
    document.getElementById('nav-links').classList.remove('mobile-open');
    document.getElementById('nav-hamburger').classList.remove('open');
  };
  function checkHamburger() {
    const btn = document.getElementById('nav-hamburger');
    if (!btn) return;
    btn.style.display = window.innerWidth <= 640 ? 'flex' : 'none';
    if (window.innerWidth > 640) window.closeMenu();
  }
  window.addEventListener('resize', checkHamburger);
  checkHamburger();

})(); // fim da closure — nada aqui dentro vaza pro console
