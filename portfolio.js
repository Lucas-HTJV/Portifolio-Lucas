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
      if (!_authenticated) { console.warn('[Portfolio] Acesso negado.'); return; }
      return fn(...args);
    };
  }

  // ── Projetos fixos — aparecem para todos os visitantes ───────────────────
  const FIXED_PROJECTS = [
    {
      id: 'fixed-001',
      title: 'Code Grimoire',
      desc: 'Landing page gamificada de uma plataforma de aprendizado com temática medieval e arcana. Dois temas visuais completos (modo noturno e pergaminho), chuva de código em Three.js, partículas animadas e hierarquia de títulos do Aprendiz ao Arquimago.',
      tags: ['HTML', 'CSS', 'JavaScript', 'Three.js'],
      github: 'https://github.com/Lucas-HTJV/Code-Grimoire-Landing-Page-',
      url: '',
      cover: 'img/CodeGrimoire.png',
      files: [
        { name: 'landing.html' },
        { name: 'landing.css' },
        { name: 'landing.js' }
      ],
      _fixed: true
    },
    {
      id: 'fixed-002',
      title: 'lucas.dev — Portfólio',
      desc: 'Portfólio pessoal desenvolvido do zero com HTML, CSS e JavaScript puro. Painel admin protegido com SHA-256, upload de projetos, tema escuro, cursor customizado, animações, responsividade mobile e sistema de segurança contra acesso indevido.',
      tags: ['HTML', 'CSS', 'JavaScript'],
      github: 'https://github.com/Lucas-HTJV/Portifolio-Lucas',
      url: 'https://lucas-htjv.github.io/Portifolio-Lucas/',
      cover: '_portfolio_cover',
      files: [
        { name: 'index.html' },
        { name: 'portfolio.css' },
        { name: 'portfolio.js' }
      ],
      _fixed: true
    }
  ];

  // ── Storage — combina projetos fixos + projetos do admin ─────────────────
  function _loadProjects() {
    try {
      const raw = JSON.parse(localStorage.getItem('portfolio_projects') || '[]');
      if (!Array.isArray(raw)) return [...FIXED_PROJECTS];
      const adminProjects = raw.filter(p =>
        p && typeof p === 'object' &&
        typeof p.id === 'string' &&
        typeof p.title === 'string' &&
        p.title.length > 0 &&
        p.title.length < 200 &&
        !p._fixed  // não duplicar fixos
      );
      // Fixos sempre primeiro, admin projects depois
      return [...FIXED_PROJECTS, ...adminProjects];
    } catch { return [...FIXED_PROJECTS]; }
  }

  let projects = _loadProjects();
  let pendingPhotoBase64 = '';
  let savedPhotoBase64 = localStorage.getItem('portfolio_photo') || '';
  let currentCoverBase64 = '';
  let currentProjectFiles = [];

  function saveStorage() {
    // Salva APENAS os projetos do admin (não os fixos)
    const adminOnly = projects.filter(p => !p._fixed);
    localStorage.setItem('portfolio_projects', JSON.stringify(adminOnly));
  }

  // ── Foto ──────────────────────────────────────────────────────────────────
  function applySavedPhoto() {
    const heroImg  = document.getElementById('hero-photo-img');
    const heroPH   = document.getElementById('hero-placeholder');
    const aboutImg = document.getElementById('about-photo-img');
    const aboutPH  = document.getElementById('about-placeholder');
    // Se já tem src fixo no HTML (foto.jpeg), mantém
    if (savedPhotoBase64) {
      heroImg.src = savedPhotoBase64; heroImg.style.display = 'block';
      aboutImg.src = savedPhotoBase64; aboutImg.style.display = 'block';
    }
    if (heroImg.src && heroImg.src !== window.location.href) {
      if (heroPH) heroPH.style.display = 'none';
    }
    if (aboutImg.src && aboutImg.src !== window.location.href) {
      if (aboutPH) aboutPH.style.display = 'none';
    }
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

  // ── Gerador de capa automática ────────────────────────────────────────────
  function _genCover(title, coverId) {
    // Capa especial do portfólio
    if (coverId === '_portfolio_cover') {
      return `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;background:linear-gradient(135deg,#0a1628 0%,#0d2347 50%,#0a1e3d 100%);gap:0.4rem;">
        <span style="font-family:'JetBrains Mono',monospace;font-size:2.2rem;font-weight:300;color:#4f9fff;letter-spacing:-0.02em;text-shadow:0 0 20px rgba(79,159,255,0.5);">&lt;/&gt;</span>
        <span style="font-family:'JetBrains Mono',monospace;font-size:0.58rem;letter-spacing:0.2em;color:rgba(79,159,255,0.4);text-transform:uppercase">portfolio</span>
      </div>`;
    }
    const icons = ['⬡','◈','⬢','◇','⟡','✦'];
    const icon = icons[Math.abs([...title].reduce((a,c)=>a+c.charCodeAt(0),0)) % icons.length];
    return `<div class="project-cover-placeholder" style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:0.5rem;height:100%;background:linear-gradient(135deg,rgba(155,48,255,0.15),rgba(100,20,200,0.08));">
      <span style="font-size:2rem;opacity:0.6">${icon}</span>
      <span style="font-family:'JetBrains Mono',monospace;font-size:0.6rem;letter-spacing:0.15em;opacity:0.4;text-transform:uppercase">${title.slice(0,18)}</span>
    </div>`;
  }

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
          ${p.cover
            ? `<img src="${p.cover}" alt="${p.title}" loading="lazy">`
            : _genCover(p.title, p.cover)}
          ${p.github ? `<a class="project-gh-badge" href="${p.github}" target="_blank" rel="noopener" style="position:absolute;top:0.6rem;right:0.6rem;background:rgba(0,0,0,0.6);border:1px solid rgba(155,48,255,0.4);border-radius:6px;padding:0.25rem 0.55rem;font-family:'JetBrains Mono',monospace;font-size:0.62rem;color:#c084fc;text-decoration:none;display:flex;align-items:center;gap:4px;backdrop-filter:blur(4px);">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.929.43.372.823 1.102.823 2.222 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12z"/></svg>
            GitHub
          </a>` : ''}
        </div>
        <div class="project-body">
          <div class="project-title">${p.title}</div>
          <p class="project-desc">${p.desc}</p>
          <div class="project-tags">${(p.tags||[]).map(t=>`<span class="project-tag">${t.trim()}</span>`).join('')}</div>
          ${(p.files||[]).length ? `
          <div class="project-files-bar" onclick="this.classList.toggle('open');this.nextElementSibling.style.display=this.classList.contains('open')?'flex':'none'" style="display:flex;align-items:center;justify-content:space-between;padding:0.45rem 0.7rem;margin-top:0.8rem;background:rgba(155,48,255,0.07);border:1px solid rgba(155,48,255,0.2);border-radius:6px;cursor:pointer;font-family:'JetBrains Mono',monospace;font-size:0.7rem;color:var(--muted);">
            <span>📁 ${p.files.length} arquivo${p.files.length>1?'s':''}</span>
            <span>▾</span>
          </div>
          <div style="display:none;flex-direction:column;gap:0.25rem;padding:0.4rem 0;">
            ${(p.files||[]).map(f=>{
              const ext=(f.name||'').split('.').pop().toLowerCase();
              const color=ext==='html'?'#f97316':ext==='css'?'#38bdf8':ext==='js'?'#facc15':'#a78bfa';
              const icon=ext==='html'?'📄':ext==='css'?'🎨':ext==='js'?'⚡':'📁';
              return `<div style="display:flex;align-items:center;gap:0.5rem;padding:0.2rem 0.4rem;font-family:'JetBrains Mono',monospace;font-size:0.7rem;">
                <span>${icon}</span><span style="color:${color}">${f.name}</span>
              </div>`;
            }).join('')}
          </div>` : ''}
          <div style="display:flex;gap:0.8rem;margin-top:0.9rem;flex-wrap:wrap;align-items:center;">
            ${p.url ? `<a href="${p.url}" target="_blank" rel="noopener" style="font-size:0.75rem;color:var(--purple-bright);text-decoration:none;font-family:'JetBrains Mono',monospace;letter-spacing:0.05em;">→ Ver projeto ↗</a>` : ''}
            ${!p.url && p.github ? `<a href="${p.github}" target="_blank" rel="noopener" style="font-size:0.75rem;color:var(--purple-bright);text-decoration:none;font-family:'JetBrains Mono',monospace;letter-spacing:0.05em;">→ Ver no GitHub ↗</a>` : ''}
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

  let _loginAttempts = 0;
  let _loginBlockedUntil = 0;

  window.tryLogin = async function () {
    const now = Date.now();
    const err = document.getElementById('login-error');
    if (now < _loginBlockedUntil) {
      const secs = Math.ceil((_loginBlockedUntil - now) / 1000);
      err.textContent = `Muitas tentativas. Aguarde ${secs}s.`;
      err.classList.add('show'); return;
    }
    const val = document.getElementById('login-input').value;
    if (!val) return;
    const inputHash = await _hash(val);
    document.getElementById('login-input').value = '';
    if (inputHash === _ADMIN_HASH) {
      _authenticated = true; _loginAttempts = 0;
      err.textContent = 'Senha incorreta. Tente novamente.';
      err.classList.remove('show');
      _closeModal('login-modal'); _openAdmin();
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
  };

  // ── Admin ─────────────────────────────────────────────────────────────────
  function _openAdmin() {
    if (!_authenticated) return;
    _renderAdminList(); _switchTab('tab-add'); _resetForm();
    document.getElementById('admin-modal').classList.add('open');
  }

  function _closeModal(id) { document.getElementById(id).classList.remove('open'); }
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

  function _sanitize(str) {
    const d = document.createElement('div');
    d.textContent = str; return d.innerHTML;
  }

  window.saveProject = _requireAuth(function () {
    const title   = _sanitize(document.getElementById('proj-title').value.trim());
    const desc    = _sanitize(document.getElementById('proj-desc').value.trim());
    const tagsRaw = _sanitize(document.getElementById('proj-tags').value.trim());
    const github  = document.getElementById('proj-github').value.trim();
    const url     = document.getElementById('proj-url').value.trim();
    const editId  = document.getElementById('edit-id').value;
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
    } else { projects.push(proj); }
    saveStorage(); renderProjects(); _resetForm(); _switchTab('tab-list');
  });

  function _resetForm() {
    ['edit-id','proj-title','proj-desc','proj-tags','proj-github','proj-url'].forEach(id => {
      document.getElementById(id).value = '';
    });
    document.getElementById('cover-preview-img').style.display = 'none';
    document.getElementById('cover-file').value = '';
    document.getElementById('proj-files').value = '';
    document.getElementById('proj-files-label').innerHTML = 'Clique para anexar arquivos do projeto<br><span style="font-size:0.71rem;opacity:0.5">ZIP, HTML, CSS, JS, etc.</span>';
    currentCoverBase64 = ''; currentProjectFiles = [];
  }
  window.resetForm = _requireAuth(_resetForm);

  function _renderAdminList() {
    const list = document.getElementById('admin-proj-list');
    const adminProjects = projects.filter(p => !p._fixed);
    if (adminProjects.length === 0) {
      list.innerHTML = `<p style="color:var(--muted);font-size:0.85rem;text-align:center;padding:2rem">Nenhum projeto adicionado ainda.<br><span style="opacity:0.5;font-size:0.8rem">Os projetos fixos são gerenciados no código.</span></p>`;
      return;
    }
    list.innerHTML = adminProjects.map(p => `
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
    const p = projects.find(x => x.id === id && !x._fixed); if (!p) return;
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

  // ── Auto-lock 15min ───────────────────────────────────────────────────────
  let _inactivityTimer;
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
    const fontSize = 11, cols = Math.floor(W / fontSize);
    const drops = Array.from({ length: cols }, () => Math.random() * -H);
    const chars = '01';
    function draw() {
      ctx.fillStyle = 'rgba(7,6,15,0.18)'; ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < drops.length; i++) {
        const y = drops[i] * fontSize;
        ctx.fillStyle = 'rgba(212,128,255,0.95)';
        ctx.font = `${fontSize}px 'JetBrains Mono',monospace`;
        ctx.fillText(chars[Math.floor(Math.random()*2)], i*fontSize, y);
        ctx.fillStyle = 'rgba(160,64,255,0.35)';
        ctx.fillText(chars[Math.floor(Math.random()*2)], i*fontSize, y-fontSize);
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
    el.textContent = ''; el.style.width = '0';
    let started = false;
    const trigger = () => {
      if (started) return; started = true;
      let i = 0;
      el.style.animation = 'none'; el.style.borderRightColor = 'var(--purple)';
      const iv = setInterval(() => {
        el.textContent = fullText.slice(0, ++i); el.style.width = 'auto';
        if (i >= fullText.length) { clearInterval(iv); setTimeout(() => el.classList.add('done'), 1500); }
      }, 90);
    };
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { setTimeout(trigger, 300); io.disconnect(); } });
    }, { threshold: 0.4 });
    const s = document.getElementById('about');
    if (s) io.observe(s); else trigger();
  })();

  // ── Hamburger ─────────────────────────────────────────────────────────────
  window.toggleMenu = function () {
    document.getElementById('nav-links').classList.toggle('mobile-open');
    document.getElementById('nav-hamburger').classList.toggle('open');
  };
  window.closeMenu = function () {
    document.getElementById('nav-links').classList.remove('mobile-open');
    document.getElementById('nav-hamburger').classList.remove('open');
  };
  function checkHamburger() {
    const btn = document.getElementById('nav-hamburger'); if (!btn) return;
    btn.style.display = window.innerWidth <= 640 ? 'flex' : 'none';
    if (window.innerWidth > 640) window.closeMenu();
  }
  window.addEventListener('resize', checkHamburger);
  checkHamburger();

})();
