(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const STORAGE_KEY = 'kkos-custom-data-v1';
  const LAYOUT_KEY = 'kkos-wall-layout-v1';
  const fresh = value => JSON.parse(JSON.stringify(value));
  const baseData = fresh(window.KK_DATA || {});
  const manifest = window.KK_MEDIA || { items: [], profiles: {} };
  let data = mergeDeep(fresh(baseData), window.KK_OVERRIDES || {});
  let currentUser = 'kartik';
  let activeWindow = null;
  let zIndex = 20;
  let windowCount = 0;
  let arrangeMode = false;
  let wallScale = 1;
  let wallOffset = { x: 0, y: 0 };
  let wallLayout = {};
  let wallItems = [];
  let focusedMemory = null;
  let toastTimer = null;
  let birthdayUnlocked = false;

  function mergeDeep(target, source) {
    if (!source || typeof source !== 'object') return target;
    for (const key of Object.keys(source)) {
      const value = source[key];
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        if (!target[key] || typeof target[key] !== 'object' || Array.isArray(target[key])) target[key] = {};
        mergeDeep(target[key], value);
      } else {
        target[key] = value;
      }
    }
    return target;
  }
  function safeJSON(raw, fallback) { try { return JSON.parse(raw); } catch { return fallback; } }
  try { const saved = localStorage.getItem(STORAGE_KEY); if (saved) data = mergeDeep(data, safeJSON(saved, {})); } catch { /* private browsing may disable local storage */ }
  try { wallLayout = safeJSON(localStorage.getItem(LAYOUT_KEY) || '{}', {}); } catch { wallLayout = {}; }

  const boot = $('#boot-screen'), users = $('#user-screen'), desktop = $('#desktop-screen');
  const windowLayer = $('#window-layer'), editPanel = $('#edit-panel'), editToggle = $('#edit-toggle'), toastEl = $('#toast');
  const profileData = () => data.profiles[currentUser] || data.profiles.kartik;
  const displayName = user => (data.profiles[user] && data.profiles[user].name) || (user === 'kartik' ? 'Kartik' : 'Kritika');
  const userMemoryItems = user => (manifest.items || []).filter(item => item.owner === user || item.owner === 'shared');
  const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const safeUrl = value => String(value || '').replace(/["'<>\s]/g, char => encodeURIComponent(char));
  function notify(message) {
    toastEl.textContent = message; toastEl.classList.add('visible');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => toastEl.classList.remove('visible'), 2600);
  }
  function saveLocal() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch { /* allow edit mode to continue even when storage is unavailable */ }
  }
  function saveLayout() {
    try { localStorage.setItem(LAYOUT_KEY, JSON.stringify(wallLayout)); } catch { /* optional */ }
  }
  function downloadText(filename, text) {
    const blob = new Blob([text], { type: 'text/javascript;charset=utf-8' });
    const url = URL.createObjectURL(blob); const link = document.createElement('a');
    link.href = url; link.download = filename; document.body.appendChild(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function mediaSource(item) { return safeUrl(item.src || ''); }
  function profileSource(profile, user = currentUser) {
    if (!profile) return '';
    const configured = profile.profileImage || '';
    if (!configured || configured.startsWith('ADD-') || configured.startsWith('REPLACE-')) return '';
    const manifestProfile = manifest.profiles && manifest.profiles[user];
    const isDefaultPortraitName = configured.toLowerCase() === `${user}.jpg` || configured.toLowerCase() === `${user}.jpeg`;
    if (manifestProfile && (isDefaultPortraitName || manifestProfile.split('/').pop() === configured || !configured)) return safeUrl(manifestProfile);
    if (/^(https?:|data:|media\/)/i.test(configured)) return safeUrl(configured);
    return safeUrl('media/profiles/' + configured.replace(/^.*[\\/]/, ''));
  }
  function makeAvatar(container, profile, fallback, user = currentUser) {
    if (!container) return;
    const src = profileSource(profile, user);
    container.innerHTML = src ? `<img src="${src}" alt="${escapeHTML(profile.name || fallback)} profile photo">` : `<span>${escapeHTML((profile.name || fallback || '?').slice(0,1).toUpperCase())}</span>`;
  }
  function updateSelectionCards() {
    ['kartik','kritika'].forEach(user => {
      const profile = data.profiles[user] || {};
      const originalProfile = baseData.profiles[user] || {};
      let handle = profile.handle || `${profile.name || displayName(user)}.exe`;
      // If the handle is still the untouched default, let it follow a renamed display name.
      if (originalProfile.handle && profile.handle === originalProfile.handle && originalProfile.handle.toLowerCase() === `${(originalProfile.name || '').toLowerCase()}.exe`) {
        handle = `${profile.name || displayName(user)}.exe`;
      }
      const nameEl = $(`#select-name-${user}`);
      if (nameEl) {
        const match = handle.match(/\.exe$/i);
        nameEl.innerHTML = match ? `${escapeHTML(handle.slice(0,-4))}<span>${escapeHTML(handle.slice(-4))}</span>` : escapeHTML(handle);
      }
      const roleEl = $(`#select-role-${user}`); if (roleEl) roleEl.textContent = profile.role || '';
      const taglineEl = $(`#select-tagline-${user}`); if (taglineEl) taglineEl.textContent = profile.tagline || '';
      makeAvatar($(`#select-avatar-${user}`), profile, 'K', user);
    });
  }

  // Startup and user selection
  $('#boot-enter').addEventListener('click', () => {
    $('#boot-status').textContent = 'USER PROFILES LOADED';
    boot.classList.add('hidden'); users.classList.remove('hidden'); document.body.className = 'theme-boot';
    updateSelectionCards();
  });
  $$('.user-card').forEach(card => card.addEventListener('click', () => launchDesktop(card.dataset.user)));
  function launchDesktop(user) {
    currentUser = user === 'kritika' ? 'kritika' : 'kartik';
    users.classList.add('hidden'); boot.classList.add('hidden'); desktop.classList.remove('hidden');
    desktop.classList.toggle('theme-kritika', currentUser === 'kritika');
    desktop.classList.toggle('theme-kartik', currentUser === 'kartik');
    document.body.className = currentUser === 'kritika' ? 'theme-kritika' : 'theme-kartik';
    closeAllWindows(); arrangeMode = false; wallScale = 1; wallOffset = {x:0,y:0}; editPanel.classList.add('hidden'); editToggle.classList.remove('active');
    updateDesktop();
    // Start with a quiet desktop; the user can open any app or click the welcome card.
  }
  function updateDesktop() {
    const person = profileData();
    $('#topbar-user').textContent = `${person.name.toUpperCase()} PERSONAL SYSTEM`;
    $('#dock-user').textContent = `${person.name.toUpperCase()} / PERSONAL SPACE`;
    $('#welcome-date').textContent = `PERSONAL SPACE / ${person.birthday || 'BIRTHDAY MODE'}`;
    $('#welcome-name').innerHTML = `Good chaos,<br><em>${escapeHTML(person.name)}.</em>`;
    $('#welcome-subtitle').textContent = person.welcomeLine || person.tagline || 'Personal space. Questionable settings.';
    updateSelectionCards();
  }
  $('#desktop-brand').addEventListener('click', returnToUsers);
  $('#user-switch').addEventListener('click', returnToUsers);
  function returnToUsers() {
    closeAllWindows(); editPanel.classList.add('hidden'); desktop.classList.add('hidden'); users.classList.remove('hidden');
    document.body.className = 'theme-boot';
    updateSelectionCards();
  }
  function clockTick() { const now = new Date(); $('#topbar-clock').textContent = now.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}); }
  clockTick(); setInterval(clockTick, 30000);

  // Desktop apps / windows
  $$('.app-icon,.dock-apps [data-app]').forEach(button => button.addEventListener('click', () => openApp(button.dataset.app)));
  function closeAllWindows() { closeMemoryFocus(); windowLayer.innerHTML = ''; activeWindow = null; windowCount = 0; }
  function openApp(app) {
    if (!app) return;
    if (app === 'birthday') birthdayUnlocked = true;
    const existing = $(`.app-window[data-window-app="${app}"]`, windowLayer);
    if (existing) { existing.style.zIndex = ++zIndex; activeWindow = existing; existing.classList.remove('hidden'); existing.classList.remove('minimised'); return; }
    const config = {
      profile: ['Profile.sys', renderProfile], vault: ['Memory Vault', renderVault], quotes: ['Quote Archive.exe', renderQuotes],
      lore: ['THE LORE FOLDER', renderLore], stats: ['Stats.exe', renderStats], birthday: ['Birthday.exe', renderBirthday],
      wrapped: ['Wrapped.exe — Story Studio', renderWrapped]
    }[app];
    if (!config) return;
    const win = document.createElement('section'); win.className = 'app-window'; win.dataset.windowApp = app;
    const offset = windowCount++;
    const mobile = window.innerWidth <= 600;
    win.style.left = mobile ? '7px' : `${Math.max(18, Math.min(window.innerWidth - 550, 170 + offset * 36))}px`;
    win.style.top = mobile ? '7px' : `${Math.max(12, Math.min(window.innerHeight - 560, 82 + offset * 25))}px`;
    win.style.width = mobile ? 'calc(100% - 14px)' : (app === 'vault' || app === 'wrapped' ? 'min(980px, calc(100vw - 110px))' : (app === 'birthday' ? 'min(700px, calc(100vw - 170px))' : 'min(610px, calc(100vw - 150px))'));
    win.style.height = mobile ? 'calc(100% - 14px)' : (app === 'wrapped' ? 'min(820px, calc(100vh - 100px))' : (app === 'vault' ? 'min(670px, calc(100vh - 150px))' : 'min(590px, calc(100vh - 150px))'));
    win.style.zIndex = ++zIndex;
    win.innerHTML = `<div class="window-titlebar"><div class="window-controls"><button type="button" class="window-close" aria-label="Close window"></button><button type="button" class="window-min" aria-label="Minimise window"></button><button type="button" class="window-max-dot" aria-label="Maximise window"></button></div><div class="window-name">${escapeHTML(config[0])}</div><button class="window-max" type="button" title="Toggle full size">⤢</button></div><div class="window-body"></div>`;
    windowLayer.appendChild(win); activeWindow = win;
    $('.window-body', win).innerHTML = config[1]();
    $('.window-close', win).addEventListener('click', () => { if (focusedMemory) closeMemoryFocus(); win.remove(); });
    $('.window-min', win).addEventListener('click', () => { win.classList.add('hidden'); notify('Window minimised. Reopen it from the desktop or dock.'); });
    $('.window-max-dot', win).addEventListener('click', () => win.classList.toggle('maximized'));
    $('.window-max', win).addEventListener('click', () => win.classList.toggle('maximized'));
    win.addEventListener('pointerdown', () => { win.style.zIndex = ++zIndex; activeWindow = win; });
    makeWindowDraggable(win);
    if (app === 'vault') initVault(win);
    if (app === 'stats') animateStats(win);
    if (app === 'birthday') initBirthday(win);
    if (app === 'wrapped') initWrapped(win);
  }
  function makeWindowDraggable(win) {
    const bar = $('.window-titlebar', win); let dragging = false, sx = 0, sy = 0, left = 0, top = 0;
    bar.addEventListener('pointerdown', e => {
      if (e.target.closest('button') || window.innerWidth <= 600 || win.classList.contains('maximized')) return;
      dragging = true; sx = e.clientX; sy = e.clientY; left = win.offsetLeft; top = win.offsetTop; bar.setPointerCapture(e.pointerId); e.preventDefault();
    });
    bar.addEventListener('pointermove', e => { if (!dragging) return; win.style.left = `${Math.max(0, Math.min(window.innerWidth - 120, left + e.clientX - sx))}px`; win.style.top = `${Math.max(55, Math.min(window.innerHeight - 130, top + e.clientY - sy))}px`; });
    const stop = () => { dragging = false; }; bar.addEventListener('pointerup', stop); bar.addEventListener('pointercancel', stop);
  }
  function appIntro(kicker, title, subtitle) { return `<div class="window-kicker">${escapeHTML(kicker)}</div><h1 class="window-heading">${escapeHTML(title)}</h1><div class="window-subheading">${escapeHTML(subtitle)}</div>`; }

  function renderProfile() {
    const p = profileData(); const src = profileSource(p, currentUser); const person = p.name || displayName(currentUser);
    return `${appIntro('PROFILE.SYS / IDENTITY RECORD', p.title || 'User profile', 'A highly unofficial personnel file. Data is subject to affection-based exaggeration.')}<div class="profile-layout" style="margin-top:22px"><div><div class="profile-big-avatar">${src ? `<img src="${src}" alt="${escapeHTML(person)}">` : escapeHTML(person.slice(0,1))}</div><div class="profile-pill">${escapeHTML(p.birthday || 'BIRTHDAY MODE')}</div></div><div class="profile-details"><div class="role">${escapeHTML(p.role || 'USER PROFILE')}</div><h2>${escapeHTML(person)}</h2><div style="font-size:11px;color:var(--muted)">${escapeHTML(p.tagline || '')}</div><p>${escapeHTML(p.description || '')}</p><div class="profile-facts"><div class="profile-fact"><small>OFFICIAL TITLE</small><strong>${escapeHTML(p.title || 'Certified Legend')}</strong></div><div class="profile-fact"><small>STATUS</small><strong>Birthday protocol active</strong></div><div class="profile-fact"><small>SPECIAL SKILL</small><strong>${escapeHTML(currentUser === 'kartik' ? 'Turning ideas into projects' : 'Reading the plot before it happens')}</strong></div><div class="profile-fact"><small>THREAT LEVEL</small><strong>${escapeHTML(currentUser === 'kartik' ? 'Accidentally productive' : 'Narratively dangerous')}</strong></div></div></div></div><div class="shared-note">Edit this profile through <strong>EDIT MODE</strong> in the top bar, or directly in <code>data.js</code>. Put the chosen portrait in <code>media/profiles/</code>.</div>`;
  }

  function renderVault() {
    return `${appIntro('MEMORY VAULT / PHYSICAL ARCHIVE', 'Little things. Permanent evidence.', 'A wall of moments. Click a Polaroid to move in closer; drag the wall to explore. Turn on Arrange Mode when you want to rearrange the photos.')}<div class="memory-toolbar"><button class="memory-filter active" data-filter="all" type="button">ALL MOMENTS</button><button class="memory-filter" data-filter="${currentUser}" type="button">${displayName(currentUser).toUpperCase()}</button><button class="memory-filter" data-filter="shared" type="button">SHARED</button><span class="wall-help">${arrangeMode ? 'ARRANGE MODE · DRAG POLAROIDS' : 'DRAG EMPTY SPACE TO PAN'}</span></div><div class="memory-wall-viewport"><div class="wall-stage"><div class="wall-empty"><div><div class="empty-icon">▧</div><strong>No memories pinned here yet.</strong><p>Add JPG, PNG, JPEG, WebP, MP4 or WebM files to <code>media/memory-vault/${currentUser}/</code> or <code>shared/</code>, then run <code>refresh_gallery.bat</code>.</p></div></div></div></div><div class="wall-controls"><button class="small-button arrange-toggle" type="button">↔ Arrange Mode: OFF</button><button class="small-button wall-zoom-out" type="button" aria-label="Zoom out">−</button><button class="small-button wall-zoom-in" type="button" aria-label="Zoom in">+</button><button class="small-button wall-reset" type="button">Reset view</button><span class="wall-zoom-label">100%</span></div><div class="wall-wall-note">Each filename becomes its title automatically. Add the date and memory line in Edit Mode or by editing the matching entry in <code>data.js</code>. Local wall arrangements stay saved in this browser; export your publish file to keep your final layout when you deploy.</div>`;
  }
  function normaliseMedia(item) {
    const key = item.key || `${item.owner}/${item.filename || item.title}`;
    const meta = (data.memories && data.memories[key]) || {};
    return { ...item, key, title: item.title || item.name || 'Untitled memory', date: meta.date || 'A MOMENT IN TIME', caption: meta.caption || 'Add the story behind this moment in Edit Mode.', cover: meta.cover || item.cover || '', featured: !!meta.featured };
  }
  function initVault(win) {
    const viewport = $('.memory-wall-viewport', win), stage = $('.wall-stage', win), empty = $('.wall-empty', win);
    let filter = 'all', panning = null;
    function getItems() { return (manifest.items || []).filter(it => it.type === 'image' || it.type === 'video').map(normaliseMedia).filter(it => filter === 'all' ? (it.owner === currentUser || it.owner === 'shared') : it.owner === filter); }
    function renderWall() {
      wallItems = getItems(); stage.querySelectorAll('.polaroid,.wall-string').forEach(el => el.remove());
      const noItems = wallItems.length === 0; empty.classList.toggle('hidden', !noItems);
      const stageWidth = Math.max(stage.clientWidth || viewport.clientWidth, 1);
      const cols = Math.max(1, Math.floor((stageWidth - 30) / 145));
      const rows = Math.max(1, Math.ceil(wallItems.length / cols));
      stage.style.height = `${Math.max(viewport.clientHeight, rows * 195 + 70, 650)}px`;
      const stageHeight = Math.max(stage.clientHeight || 650, 1);
      // One slightly curved horizontal string per row; each Polaroid gets its own hanging thread.
      for (let row = 0; row < rows; row++) {
        const rope = document.createElement('div'); rope.className = `wall-string rope-row-${row % 3}`;
        rope.style.top = `${16 + row * 195}px`; rope.style.transform = `rotate(${[-1.5,1,-.7][row % 3]}deg)`;
        if (empty.parentNode === stage) stage.insertBefore(rope, empty); else stage.appendChild(rope);
      }
      wallItems.forEach((item, idx) => {
        const savedPosition = wallLayout[item.key];
        const row = Math.floor(idx / cols);
        const col = idx % cols;
        const xStep = cols > 1 ? (stageWidth - 160) / (cols - 1) : 0;
        const left = savedPosition ? savedPosition.x : ((18 + col * xStep) / stageWidth) * 100;
        const top = savedPosition ? savedPosition.y : ((34 + row * 195 + ((idx * 3) % 5)) / stageHeight) * 100;
        const topPx = top * stageHeight / 100;
        const nearestRope = Math.max(16, 16 + Math.floor(Math.max(0, topPx - 16) / 195) * 195);
        const cordHeight = Math.max(8, Math.min(90, topPx - nearestRope));
        const tilt = savedPosition && Number.isFinite(savedPosition.tilt) ? savedPosition.tilt : [-4,2,-2,3,1,-3][idx % 6];
        const el = document.createElement('button'); el.type = 'button'; el.className = 'polaroid'; el.dataset.key = item.key; el.dataset.index = idx;
        el.style.left = `${left}%`; el.style.top = `${top}%`; el.style.setProperty('--tilt', `${tilt}deg`); el.style.setProperty('--cord-height', `${cordHeight}px`); el.style.zIndex = String(2 + idx);
        let mediaHTML = item.type === 'video' ? `<div class="photo-frame">${item.cover ? `<img src="${mediaSource({src:item.cover})}" alt="">` : `<span class="placeholder-art">▶</span>`}<span class="photo-type">VIDEO</span><span class="video-play">▶</span></div>` : `<div class="photo-frame"><img loading="lazy" src="${mediaSource(item)}" alt="" onerror="this.style.display='none';this.parentElement.querySelector('.placeholder-art').style.display='block'"><span class="placeholder-art" style="display:none">▧</span></div>`;
        el.innerHTML = `<span class="polaroid-pin"></span>${mediaHTML}<span class="polaroid-title">${escapeHTML(item.title)}</span><span class="polaroid-date">${escapeHTML(item.date || '')}</span>`;
        el.addEventListener('pointerdown', e => { if (!arrangeMode) return; e.stopPropagation(); const startX = e.clientX, startY = e.clientY, box = el.getBoundingClientRect(); const wrap = viewport.getBoundingClientRect(); el.classList.add('dragging'); el.setPointerCapture(e.pointerId); const startL = parseFloat(el.style.left), startT = parseFloat(el.style.top); const move = ev => { const dx = (ev.clientX - startX) / wrap.width * 100; const dy = (ev.clientY - startY) / Math.max(stage.clientHeight,1) * 100; const nextL = Math.max(0, Math.min(86, startL + dx)); const nextT = Math.max(0, Math.min(96, startT + dy)); el.style.left = `${nextL}%`; el.style.top = `${nextT}%`; const topPx = nextT * stage.clientHeight / 100; const nearestRope = Math.max(16, 16 + Math.floor(Math.max(0, topPx - 16) / 195) * 195); el.style.setProperty('--cord-height', `${Math.max(8, Math.min(90, topPx-nearestRope))}px`); const old = wallLayout[item.key] || {}; wallLayout[item.key] = { ...old, x: nextL, y: nextT, tilt: Number((old.tilt ?? tilt).toFixed(1)) }; }; const finish = () => { el.classList.remove('dragging'); el.removeEventListener('pointermove', move); saveLayout(); }; el.addEventListener('pointermove', move); el.addEventListener('pointerup', finish, { once:true }); el.addEventListener('pointercancel', finish, { once:true }); });
        el.addEventListener('click', e => { if (arrangeMode) return; if (panning && panning.moved) return; openMemoryFocus(item, wallItems); });
        stage.appendChild(el);
      });
      stage.style.transform = `translate(${wallOffset.x}px, ${wallOffset.y}px) scale(${wallScale})`;
      $('.wall-zoom-label', win).textContent = `${Math.round(wallScale * 100)}%`;
      $('.arrange-toggle', win).textContent = `↔ Arrange Mode: ${arrangeMode ? 'ON' : 'OFF'}`;
      $('.arrange-toggle', win).classList.toggle('active', arrangeMode);
      $('.wall-help', win).textContent = arrangeMode ? 'ARRANGE MODE · DRAG POLAROIDS' : 'DRAG EMPTY SPACE TO PAN';
    }
    $$('.memory-filter', win).forEach(btn => btn.addEventListener('click', () => { filter = btn.dataset.filter; $$('.memory-filter', win).forEach(b => b.classList.toggle('active', b === btn)); renderWall(); }));
    $('.arrange-toggle', win).addEventListener('click', () => { arrangeMode = !arrangeMode; renderWall(); });
    $('.wall-zoom-in', win).addEventListener('click', () => { wallScale = Math.min(1.8, wallScale + .1); renderWall(); });
    $('.wall-zoom-out', win).addEventListener('click', () => { wallScale = Math.max(.65, wallScale - .1); renderWall(); });
    $('.wall-reset', win).addEventListener('click', () => { wallScale = 1; wallOffset = {x:0,y:0}; renderWall(); });
    viewport.addEventListener('pointerdown', e => { if (arrangeMode || e.target.closest('.polaroid') || e.target.closest('.memory-focus')) return; panning = { x:e.clientX, y:e.clientY, ox:wallOffset.x, oy:wallOffset.y, moved:false }; viewport.setPointerCapture(e.pointerId); });
    viewport.addEventListener('pointermove', e => { if (!panning) return; const dx=e.clientX-panning.x, dy=e.clientY-panning.y; if (Math.abs(dx)+Math.abs(dy)>4) panning.moved=true; wallOffset={x:panning.ox+dx,y:panning.oy+dy}; stage.style.transform=`translate(${wallOffset.x}px, ${wallOffset.y}px) scale(${wallScale})`; });
    const stopPan = () => { if (panning && panning.moved) setTimeout(() => {panning=null;},0); else panning=null; };
    viewport.addEventListener('pointerup', stopPan); viewport.addEventListener('pointercancel', stopPan);
    renderWall();
  }
  function openMemoryFocus(item, items) {
    closeMemoryFocus(); focusedMemory = item;
    const isVideo = item.type === 'video';
    const overlay = document.createElement('div'); overlay.className = 'memory-focus'; overlay.id = 'memory-focus';
    const media = isVideo ? `<video src="${mediaSource(item)}" ${item.cover ? `poster="${mediaSource({src:item.cover})}"` : ''} controls playsinline preload="metadata"></video>` : `<img src="${mediaSource(item)}" alt="${escapeHTML(item.title)}">`;
    const canEdit = !editPanel.classList.contains('hidden');
    overlay.innerHTML = `<button class="memory-focus-close" type="button" aria-label="Close photo">×</button><article class="memory-focus-card"><div class="memory-focus-media">${media}</div><h2>${escapeHTML(item.title)}</h2><div class="memory-focus-date">${escapeHTML(item.date || 'A MOMENT IN TIME')} · ${escapeHTML((item.owner || 'shared').toUpperCase())}</div><div class="memory-focus-caption">${escapeHTML(item.caption || '')}</div>${canEdit ? `<div class="memory-edit-mini"><input class="focus-date" aria-label="Memory date" placeholder="Date (e.g. 12 Aug 2026)" value="${escapeHTML(item.date === 'A MOMENT IN TIME' ? '' : item.date)}"><input class="focus-caption" aria-label="Memory caption" placeholder="Memory line" value="${escapeHTML(item.caption === 'Add the story behind this moment in Edit Mode.' ? '' : item.caption)}"><button class="focus-save" type="button">SAVE MEMORY</button></div>` : ''}<div class="focus-nav"><button class="focus-arrange" type="button">${arrangeMode ? 'Arrange mode is on' : 'Back to the wall'}</button><button class="focus-next" type="button">Close memory ↗</button></div></article>`;
    desktop.appendChild(overlay);
    $('.memory-focus-close', overlay).addEventListener('click', closeMemoryFocus);
    overlay.addEventListener('click', e => { if (e.target === overlay) closeMemoryFocus(); });
    $('.focus-next', overlay).addEventListener('click', closeMemoryFocus);
    $('.focus-arrange', overlay).addEventListener('click', () => { closeMemoryFocus(); arrangeMode = true; const toggler = $('.arrange-toggle', activeWindow || document); if(toggler) toggler.click(); });
    if (canEdit) $('.focus-save', overlay).addEventListener('click', () => {
      const date = $('.focus-date', overlay).value.trim() || 'ADD THE DATE'; const caption = $('.focus-caption', overlay).value.trim() || 'Add the story behind this moment in Edit Mode.';
      data.memories = data.memories || {}; data.memories[item.key] = { ...(data.memories[item.key] || {}), date, caption }; saveLocal();
      item.date = date; item.caption = caption; notify('Memory note saved locally. Export the publish file to keep it on the live site.');
      const labelDate = $('.memory-focus-date', overlay); if(labelDate) labelDate.textContent = `${date} · ${(item.owner || 'shared').toUpperCase()}`;
      const cap = $('.memory-focus-caption', overlay); if(cap) cap.textContent = caption;
      const card = $(`.polaroid[data-key="${CSS.escape(item.key)}"]`); if(card){$('.polaroid-date',card).textContent=date;}
    });
  }
  function closeMemoryFocus() { const overlay = $('#memory-focus'); if(overlay) overlay.remove(); focusedMemory = null; }

  function renderQuotes() {
    const all = [...(data.quotes[currentUser] || []).map(q => ({...q, source:displayName(currentUser)})), ...(data.quotes.shared || []).map(q => ({...q, source:'SHARED LORE'}))];
    return `${appIntro('QUOTE ARCHIVE / AUDIO MEMORY', 'Things that actually got said.', 'A tiny museum of repeated lines, accidental catchphrases and quotes that lost their original context.')}<div class="quote-stack">${all.map((q,i)=>`<article class="quote-card"><div class="quote-mark">“</div><div class="quote-text">${escapeHTML(q.quote || '[Quote goes here]')}</div><div class="quote-context">${escapeHTML(q.context || '[Add the context]')}</div><div class="quote-date">${escapeHTML(q.source)} ${q.date ? '· '+escapeHTML(q.date) : ''}</div></article>`).join('')}</div><div class="shared-note">Quote entries are editable in <code>data.js</code> or in Edit Mode as a simple JSON list. Starter entries are placeholders until you replace them.</div>`;
  }
  function renderLore() {
    const entries = [...(data.lore[currentUser] || []), ...(data.lore.shared || [])];
    return `${appIntro('RESTRICTED ARCHIVE / ACCESS GRANTED', 'The Lore Folder.', 'Events, running jokes and incidents that would sound fake if there weren’t witnesses.')}<div class="lore-list">${entries.map(item=>`<details class="lore-file"><summary><span class="lore-file-title">${escapeHTML(item.title || 'UNTITLED CASE')}</span><span class="lore-tag">${escapeHTML(item.tag || 'UNCLASSIFIED')}</span></summary><div class="lore-body">${escapeHTML(item.body || '')}</div></details>`).join('')}</div><div class="shared-note">Replace the case files with real inside jokes and stories in <code>data.js</code> or Edit Mode. No lore will be invented and passed off as real.</div>`;
  }
  function renderStats() {
    const stats = [...(data.stats[currentUser] || []), ...(data.stats.shared || []).slice(0,1)];
    return `${appIntro('STATISTICS / PEER-REVIEWED BY NO ONE', 'A very serious report.', 'Metrics that should never be used for any kind of formal assessment. Values are editable in the source.')}<div class="stats-grid">${stats.map((s,i)=>`<div class="stat-tile"><div class="stat-value" data-count="${Math.max(0,Math.min(10000,Number(s.value)||0))}">0${escapeHTML(s.suffix||'')}</div><div class="stat-label">${escapeHTML(s.label||'Custom metric')}</div><div class="stat-bar"><span style="width:0" data-bar="${Math.max(0,Math.min(100,Number(s.value)||0))}%"></span></div></div>`).join('')}</div><div class="stat-note">These numbers are deliberately comedic example values, not factual measurements. Change them to your own numbers—or make up an entirely different metric in <code>data.js</code>.</div>`;
  }
  function animateStats(win) {
    $$('.stat-value', win).forEach(el => { const target = Number(el.dataset.count || 0); let n = 0; const start = performance.now(); const duration = 850; const suffix = el.textContent.replace(/^0/,''); const step = now => { const p=Math.min(1,(now-start)/duration); n=Math.round(target*(1-Math.pow(1-p,3))); el.textContent=n+suffix; if(p<1)requestAnimationFrame(step); }; requestAnimationFrame(step); });
    $$('.stat-bar span', win).forEach((bar,i)=>setTimeout(()=>bar.style.width=bar.dataset.bar,70+i*100));
  }
  function renderBirthday() {
    const letter = data.letters[currentUser] || {}; const shared = data.sharedBirthday || {};
    return `<div class="birthday-letter"><div class="birthday-seal">✳</div><div class="window-kicker">BIRTHDAY.EXE / MESSAGE UNLOCKED</div><h1 class="window-heading">${escapeHTML(letter.title || `A note for ${displayName(currentUser)}`)}</h1><div class="opening">${escapeHTML(letter.opening || `Happy birthday, ${displayName(currentUser)}.`)}</div><div class="letter-body">${escapeHTML(letter.body || '[Your personal message goes here.]')}</div><div class="signoff">${escapeHTML(letter.signoff || '— From someone who cares about you')}</div><div class="shared-note"><strong>${escapeHTML(shared.title || 'TWO USERS. ONE BIRTHDAY.')}</strong><br>${escapeHTML(shared.message || '')}</div><button class="primary-button birthday-confetti" type="button" style="margin-top:18px">✦ ACTIVATE CELEBRATION PROTOCOL</button></div>`;
  }
  function initBirthday(win) { $('.birthday-confetti', win).addEventListener('click', celebrate); }
  function celebrate() {
    const colors = currentUser === 'kritika' ? ['#d58bb0','#b4a1db','#f6d5e3','#fff2bc'] : ['#72b7ff','#a9d8ff','#d2c1ff','#a5efd0'];
    for(let i=0;i<85;i++) { const piece=document.createElement('i'); piece.style.cssText=`position:fixed;z-index:200;left:${Math.random()*100}vw;top:-12px;width:${5+Math.random()*7}px;height:${8+Math.random()*9}px;background:${colors[i%colors.length]};border-radius:${Math.random()>.5?'50%':'2px'};pointer-events:none;`; desktop.appendChild(piece); const duration=1800+Math.random()*1800; piece.animate([{transform:'translateY(0) rotate(0deg)',opacity:1},{transform:`translate(${(Math.random()-.5)*180}px, ${window.innerHeight+50}px) rotate(${Math.random()*680}deg)`,opacity:.15}],{duration,easing:'cubic-bezier(.12,.62,.4,1)'}).onfinish=()=>piece.remove(); }
    notify('Celebration protocol activated. Please resume normal operations.');
  }

  // Wrapped Studio: a client-side, exportable recap of the existing K&K OS content.
  function renderWrapped() { return '<div class="wrapped-root"></div>'; }

  function wrappedTextIsPlaceholder(value) {
    const text = String(value || '').trim();
    return !text || /^\[.*\]$/s.test(text) || /^(add|replace|write|copy-paste)\b/i.test(text);
  }
  function wrappedSlug(value) {
    return String(value || 'card').normalize('NFKD').replace(/[^\w-]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase().slice(0,52) || 'card';
  }
  function wrappedPublicSiteUrl() {
    const localHost = /^(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])$/i.test(window.location.hostname);
    return window.location.protocol === 'file:' || localHost ? 'Your public link appears after K&K OS is published.' : window.location.href;
  }
  function wrappedMediaFor(edition) {
    return (manifest.items || []).filter(item => edition === 'shared' ? true : (item.owner === edition || item.owner === 'shared'))
      .filter(item => item.type === 'image' || item.type === 'video')
      .map(item => {
        const key = item.key || `${item.owner}/${item.filename || item.title || ''}`;
        const meta = (data.memories && data.memories[key]) || {};
        return { ...item, key, title: item.title || item.name || 'Untitled memory', date: meta.date || '', caption: meta.caption || '', featured: !!meta.featured, displaySrc: item.type === 'video' ? (meta.cover || item.cover || '') : (item.src || '') };
      });
  }
  function buildWrappedSlides(edition) {
    const shared = edition === 'shared';
    const person = shared ? null : (data.profiles[edition] || {});
    const name = shared ? `${displayName('kartik')} & ${displayName('kritika')}` : (person.name || displayName(edition));
    const profile = person || {};
    const slides = [];
    slides.push({ id:`cover-${edition}`, type:'cover', shortTitle:'Identity card', name, edition, title: shared ? 'TWO USERS. ONE LORE ARCHIVE.' : `${name.toUpperCase()} / YEAR IN LORE`, subtitle: shared ? 'The shared edition' : (profile.tagline || profile.role || 'Personal recap'), role: shared ? 'THE SHARED EDITION' : (profile.role || 'BIRTHDAY USER'), imageSrc: shared ? '' : profileSource(profile, edition), draft:false });

    let stats = [];
    if (shared) {
      stats = [ ...(data.stats.shared || []).slice(0,2), ...(data.stats.kartik || []).slice(0,2).map(s => ({...s,label:`${displayName('kartik')}: ${s.label}`})), ...(data.stats.kritika || []).slice(0,2).map(s => ({...s,label:`${displayName('kritika')}: ${s.label}`})) ];
    } else {
      stats = [ ...(data.stats[edition] || []), ...(data.stats.shared || []).slice(0,1) ];
    }
    stats = stats.filter(s => s && String(s.label || '').trim()).slice(0,6);
    if (stats.length) slides.push({id:`stats-${edition}`,type:'stats',shortTitle:'Stats.exe',name,edition,title:'THE OFFICIAL REPORT',subtitle:'Peer-reviewed by absolutely nobody.',stats,draft:false});

    let quotes = [];
    if (shared) {
      quotes = [ ...(data.quotes.shared || []).map(q=>({...q,source:'SHARED LORE'})), ...(data.quotes.kartik || []).filter(q=>!wrappedTextIsPlaceholder(q.quote)).slice(0,1).map(q=>({...q,source:displayName('kartik')})), ...(data.quotes.kritika || []).filter(q=>!wrappedTextIsPlaceholder(q.quote)).slice(0,1).map(q=>({...q,source:displayName('kritika')})) ];
    } else {
      quotes = [ ...(data.quotes[edition] || []).map(q=>({...q,source:name})), ...(data.quotes.shared || []).map(q=>({...q,source:'SHARED LORE'})) ];
    }
    quotes = quotes.filter(q => !wrappedTextIsPlaceholder(q.quote)).slice(0,3);
    quotes.forEach((q,i)=>slides.push({id:`quote-${edition}-${i}`,type:'quote',shortTitle:`Quote ${i+1}`,name,edition,title:'OUT OF CONTEXT',quote:q.quote,context:q.context,date:q.date,source:q.source,draft:false}));

    let lore = [];
    if (shared) {
      lore = [ ...(data.lore.shared || []).map(x=>({...x,source:'SHARED ARCHIVE'})), ...(data.lore.kartik || []).filter(x=>!wrappedTextIsPlaceholder(x.body)).slice(0,1).map(x=>({...x,source:displayName('kartik')})), ...(data.lore.kritika || []).filter(x=>!wrappedTextIsPlaceholder(x.body)).slice(0,1).map(x=>({...x,source:displayName('kritika')})) ];
    } else {
      lore = [ ...(data.lore[edition] || []).map(x=>({...x,source:name})), ...(data.lore.shared || []).map(x=>({...x,source:'SHARED ARCHIVE'})) ];
    }
    lore = lore.filter(x => !wrappedTextIsPlaceholder(x.body)).slice(0,3);
    lore.forEach((entry,i)=>slides.push({id:`lore-${edition}-${i}`,type:'lore',shortTitle:`Lore file ${i+1}`,name,edition,title:'CLASSIFIED / PERSONAL LORE',loreTitle:entry.title,loreTag:entry.tag,loreBody:entry.body,source:entry.source,draft:false}));

    const memories = wrappedMediaFor(edition).slice(0,8);
    memories.forEach((item,i)=>slides.push({id:`memory-${edition}-${item.key}`,type:'memory',shortTitle:item.title,name,edition,title:item.title,date:item.date,caption:item.caption,imageSrc:item.displaySrc,mediaType:item.type,mediaKey:item.key,draft:false}));

    if (!shared) {
      const letter = data.letters[edition] || {};
      const draft = wrappedTextIsPlaceholder(letter.body);
      slides.push({id:`birthday-${edition}`,type:'birthday',shortTitle:'Birthday letter',name,edition,title:letter.title || `A note for ${name}`,opening:letter.opening || `Happy birthday, ${name}.`,body:draft ? 'Finish your personal birthday letter in Edit Mode before publishing this card.' : letter.body,signoff:letter.signoff || '',draft});
    } else {
      const sharedBirthday = data.sharedBirthday || {};
      const msg = sharedBirthday.message || '';
      slides.push({id:'birthday-shared',type:'birthday',shortTitle:'Shared birthday note',name,edition,title:sharedBirthday.title || 'TWO USERS. ONE BIRTHDAY.',opening:'A note for both of you.',body:msg,signoff:'K&K OS / THE BIRTHDAY EDITION',draft:wrappedTextIsPlaceholder(msg)});
    }
    slides.push({id:`closing-${edition}`,type:'closing',shortTitle:'The closing card',name,edition,title:shared ? 'STAY ICONIC. BOTH OF YOU.' : 'END OF SESSION. STAY ICONIC.',subtitle:'A little operating system built around a lot of memories.',url:wrappedPublicSiteUrl(),draft:false});
    return slides;
  }
  function wrappedSlideLabel(slide) {
    return ({cover:'PROFILE.SYS',stats:'STATS.EXE',quote:'QUOTE ARCHIVE',lore:'THE LORE FOLDER',memory:'MEMORY VAULT',birthday:'BIRTHDAY.EXE',closing:'K&K OS'})[slide.type] || 'K&K OS';
  }
  function renderWrappedPreview(slide,index,total) {
    const personClass = slide.edition === 'kritika' ? 'kritika' : (slide.edition === 'shared' ? 'shared' : 'kartik');
    let inner = '';
    if (slide.type === 'cover') {
      inner = `<div class="wrapped-preview-orbit">${slide.imageSrc ? `<span>${escapeHTML((slide.name||'K').slice(0,1))}</span><img src="${escapeHTML(slide.imageSrc)}" alt="${escapeHTML(slide.name)} profile photo" onerror="this.remove()">` : `<span>${escapeHTML((slide.name||'K').slice(0,1))}</span>`}</div><div class="wrapped-preview-role">${escapeHTML(slide.role || 'BIRTHDAY USER')}</div><h2>${escapeHTML(slide.title)}</h2><p>${escapeHTML(slide.subtitle || '')}</p><div class="wrapped-preview-foot">A PERSONALITY REPORT, NOT A PERFORMANCE REVIEW.</div>`;
    } else if (slide.type === 'stats') {
      inner = `<div class="wrapped-preview-kicker">THE DATA IS DEFINITELY REAL* </div><h2>${escapeHTML(slide.title)}</h2><p>${escapeHTML(slide.subtitle)}</p><div class="wrapped-preview-stats">${slide.stats.slice(0,4).map(st=>`<div><strong>${escapeHTML(st.value)}${escapeHTML(st.suffix||'')}</strong><span>${escapeHTML(st.label)}</span></div>`).join('')}</div><small>*Real enough for the lore. Edit these numbers before sharing.</small>`;
    } else if (slide.type === 'quote') {
      inner = `<div class="wrapped-preview-quote-mark">“</div><h2>${escapeHTML(slide.quote || '')}</h2><p>${escapeHTML(slide.context || '')}</p><div class="wrapped-preview-foot">${escapeHTML(slide.source || '')}${slide.date ? ` · ${escapeHTML(slide.date)}` : ''}</div>`;
    } else if (slide.type === 'lore') {
      inner = `<div class="wrapped-preview-kicker">${escapeHTML(slide.loreTag || 'RESTRICTED FILE')}</div><h2>${escapeHTML(slide.loreTitle || slide.title)}</h2><p>${escapeHTML(slide.loreBody || '')}</p><div class="wrapped-preview-foot">SOURCE: ${escapeHTML(slide.source || 'THE LORE FOLDER')}</div>`;
    } else if (slide.type === 'memory') {
      inner = `<div class="wrapped-preview-polaroid"><div class="wrapped-preview-photo-wrap">${slide.imageSrc ? `<img src="${escapeHTML(slide.imageSrc)}" alt="${escapeHTML(slide.title)}" onerror="this.remove()">` : `<div class="wrapped-preview-video">▶<span>VIDEO MEMORY</span></div>`}${slide.mediaType === 'video' ? '<span class="wrapped-video-stamp">▶ VIDEO</span>' : ''}</div><strong>${escapeHTML(slide.title)}</strong><small>${escapeHTML(slide.date || 'A MOMENT IN TIME')}</small><p>${escapeHTML(slide.caption || 'A memory worth keeping.')}</p></div>`;
    } else if (slide.type === 'birthday') {
      inner = `<div class="wrapped-preview-seal">✳</div><div class="wrapped-preview-kicker">A PERSONAL NOTE</div><h2>${escapeHTML(slide.title)}</h2><h3>${escapeHTML(slide.opening || '')}</h3><p>${escapeHTML(slide.body || '')}</p><div class="wrapped-preview-foot">${escapeHTML(slide.signoff || '')}</div>${slide.draft ? '<span class="wrapped-draft-stamp">DRAFT</span>' : ''}`;
    } else {
      inner = `<div class="wrapped-preview-seal">K&K</div><div class="wrapped-preview-kicker">SESSION COMPLETE</div><h2>${escapeHTML(slide.title)}</h2><p>${escapeHTML(slide.subtitle || '')}</p><div class="wrapped-preview-link">${escapeHTML(slide.url || '')}</div><div class="wrapped-preview-foot">SAVE THE CARDS. KEEP THE LORE.</div>`;
    }
    return `<div class="wrapped-story-preview wrapped-theme-${personClass} wrapped-type-${slide.type}"><div class="wrapped-preview-top"><span>K&K OS <i>✳</i></span><span>${String(index+1).padStart(2,'0')} / ${String(total).padStart(2,'0')}</span></div><div class="wrapped-preview-content">${inner}</div><div class="wrapped-preview-bottom"><span>THE BIRTHDAY EDITION</span><span>${escapeHTML(wrappedSlideLabel(slide))}</span></div></div>`;
  }
  function renderWrappedBody(win) {
    const state = win._wrappedState || (win._wrappedState = { edition:currentUser, activeIndex:0, selectedIds:null, slides:[] });
    state.slides = buildWrappedSlides(state.edition);
    const ids = new Set(state.slides.map(s=>s.id));
    const priorIds = new Set(state._lastSlideIds || []);
    if (!state.selectedIds) state.selectedIds = new Set(state.slides.filter(s=>!s.draft).map(s=>s.id));
    else {
      state.selectedIds = new Set([...state.selectedIds].filter(id=>ids.has(id)));
      // Any newly added, non-draft card appears selected; removing a card never disturbs the others.
      state.slides.filter(s=>!s.draft && !priorIds.has(s.id)).forEach(s=>state.selectedIds.add(s.id));
    }
    state._lastSlideIds = [...ids];
    state._selectionInitialised = true;
    if (!state.slides[state.activeIndex]) state.activeIndex=0;
    const active = state.slides[state.activeIndex];
    const selectedCount = state.slides.filter(s=>state.selectedIds.has(s.id)).length;
    const omittedMemories = Math.max(0, wrappedMediaFor(state.edition).length - 8);
    return `${appIntro('WRAPPED.EXE / SHAREABLE STORY STUDIO','Make the memories travel.','Build a polished recap from your real K&K OS content. Preview every card, choose what to share, then save PNGs or a complete ZIP.')}
      <div class="wrapped-edition-picker" role="group" aria-label="Choose Wrapped edition"><button type="button" data-wrap-edition="kartik" class="${state.edition==='kartik'?'active':''}">KARTIK OS</button><button type="button" data-wrap-edition="kritika" class="${state.edition==='kritika'?'active':''}">KRITIKA OS</button><button type="button" data-wrap-edition="shared" class="${state.edition==='shared'?'active':''}">SHARED K&K</button></div>
      <div class="wrapped-toolbar"><span><strong>${selectedCount}</strong> / ${state.slides.length} cards selected</span><div><button type="button" class="small-button" data-wrap-select="all">Select all</button><button type="button" class="small-button" data-wrap-select="none">Select none</button></div></div>
      ${omittedMemories ? `<p class="wrapped-note">This recap shows the first 8 memories in filename order. ${omittedMemories} additional item(s) remain safely in the Memory Vault.</p>` : ''}
      <div class="wrapped-workspace"><div class="wrapped-slide-list" aria-label="Story cards">${state.slides.map((slide,i)=>`<div class="wrapped-slide-row ${i===state.activeIndex?'active':''} ${slide.draft?'is-draft':''}"><button type="button" class="wrapped-slide-pick" data-wrap-index="${i}"><span class="wrapped-slide-num">${String(i+1).padStart(2,'0')}</span><span class="wrapped-slide-text"><strong>${escapeHTML(slide.shortTitle)}</strong><small>${escapeHTML(wrappedSlideLabel(slide))}${slide.draft?' · DRAFT':''}</small></span></button><label class="wrapped-include" title="Include this card in the export"><input type="checkbox" data-wrap-toggle="${i}" ${state.selectedIds.has(slide.id)?'checked':''}><span></span></label></div>`).join('')}</div>
        <div class="wrapped-preview-column"><div class="wrapped-preview-caption"><span>STORY PREVIEW</span><span>1080 × 1920 · 9:16</span></div><div class="wrapped-preview-shell">${renderWrappedPreview(active,state.activeIndex,state.slides.length)}</div><div class="wrapped-preview-nav"><button type="button" class="small-button" data-wrap-prev ${state.activeIndex===0?'disabled':''}>← Previous</button><span>${state.activeIndex+1} of ${state.slides.length}</span><button type="button" class="small-button" data-wrap-next ${state.activeIndex===state.slides.length-1?'disabled':''}>Next →</button></div></div></div>
      <div class="wrapped-action-grid"><button type="button" class="primary-button" data-wrap-action="download-current">↓ DOWNLOAD THIS PNG</button><button type="button" class="primary-button" data-wrap-action="download-zip" ${selectedCount?'':'disabled'}>↓ DOWNLOAD SELECTED ZIP</button><button type="button" class="secondary-button" data-wrap-action="download-poster" ${selectedCount?'':'disabled'}>▣ DOWNLOAD RECAP POSTER</button><button type="button" class="secondary-button" data-wrap-action="share-card">↗ SHARE CURRENT CARD</button><button type="button" class="secondary-button" data-wrap-action="share-site">↗ SHARE WEBSITE LINK</button><button type="button" class="secondary-button" data-wrap-action="edit-content">✎ OPEN EDIT MODE</button></div>
      <p class="wrapped-note">Draft birthday cards are excluded by default. Story cards are generated from your current edits and media catalogue. Photo/video source files are never uploaded by this feature; exports are created on this device.</p>`;
  }
  function initWrapped(win) {
    const root = $('.wrapped-root', win); if (!root) return;
    const oldState = win._wrappedState;
    if (!oldState) win._wrappedState = { edition:currentUser, activeIndex:0, selectedIds:null, slides:[] };
    function redraw() { root.innerHTML = renderWrappedBody(win); wire(); }
    function wire() {
      const state = win._wrappedState;
      $$('[data-wrap-edition]', root).forEach(btn=>btn.addEventListener('click',()=>{
        state.edition = btn.dataset.wrapEdition; state.activeIndex=0; state.selectedIds=null; state._selectionInitialised=false; redraw();
      }));
      $$('[data-wrap-index]', root).forEach(btn=>btn.addEventListener('click',()=>{state.activeIndex=Number(btn.dataset.wrapIndex)||0;redraw();}));
      $$('[data-wrap-toggle]', root).forEach(input=>input.addEventListener('change',()=>{
        const slide=state.slides[Number(input.dataset.wrapToggle)]; if(!slide)return;
        if(input.checked)state.selectedIds.add(slide.id);else state.selectedIds.delete(slide.id);
        root.innerHTML=renderWrappedBody(win);wire();
      }));
      $('[data-wrap-select="all"]',root)?.addEventListener('click',()=>{state.selectedIds=new Set(state.slides.map(s=>s.id));redraw();});
      $('[data-wrap-select="none"]',root)?.addEventListener('click',()=>{state.selectedIds=new Set();redraw();});
      $('[data-wrap-prev]',root)?.addEventListener('click',()=>{state.activeIndex=Math.max(0,state.activeIndex-1);redraw();});
      $('[data-wrap-next]',root)?.addEventListener('click',()=>{state.activeIndex=Math.min(state.slides.length-1,state.activeIndex+1);redraw();});
      $$('[data-wrap-action]',root).forEach(btn=>btn.addEventListener('click',async()=>{
        const action=btn.dataset.wrapAction; const st=win._wrappedState; const slide=st.slides[st.activeIndex];
        try {
          if(action==='download-current') { notify('Rendering story card…'); const blob=await wrappedCardBlob(slide,st.activeIndex,st.slides.length,st.edition); downloadBlob(`${String(st.activeIndex+1).padStart(2,'0')}-${wrappedSlug(slide.shortTitle)}.png`,blob); notify('Story card saved as a high-resolution PNG.'); }
          else if(action==='download-zip') { const chosen=st.slides.filter(s=>st.selectedIds.has(s.id)); if(!chosen.length){notify('Select at least one card first.');return;} btn.disabled=true; const files=[]; for(let i=0;i<chosen.length;i++){notify(`Rendering card ${i+1} of ${chosen.length}…`); const blob=await wrappedCardBlob(chosen[i],i,chosen.length,st.edition); files.push({name:`${String(i+1).padStart(2,'0')}-${wrappedSlug(chosen[i].shortTitle)}.png`,data:new Uint8Array(await blob.arrayBuffer())});} const zip=new Blob([makeZip(files)],{type:'application/zip'});downloadBlob(`KKOS-${wrappedSlug(st.edition)}-Wrapped-Story-Pack.zip`,zip);notify(`${chosen.length} PNG story card(s) saved in a ZIP.`);btn.disabled=false; }
          else if(action==='download-poster') { const chosen=st.slides.filter(s=>st.selectedIds.has(s.id));if(!chosen.length){notify('Select at least one card before making a poster.');return;}notify('Composing your recap poster…'); const blob=await wrappedPosterBlob(chosen,st.edition); downloadBlob(`KKOS-${wrappedSlug(st.edition)}-Wrapped-Poster.png`,blob);notify('Recap poster saved as a high-resolution PNG.'); }
          else if(action==='share-card') { const blob=await wrappedCardBlob(slide,st.activeIndex,st.slides.length,st.edition); const file=new File([blob],`${wrappedSlug(slide.shortTitle)}.png`,{type:'image/png'}); if(navigator.share&&navigator.canShare&&navigator.canShare({files:[file]})){await navigator.share({files:[file],title:`${slide.name} — K&K Wrapped`,text:'A little piece of K&K OS.'});} else {downloadBlob(file.name,blob);notify('This browser cannot share image files directly. The PNG was downloaded so you can add it to your Story.');} }
          else if(action==='share-site') { const localHost=/^(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])$/i.test(window.location.hostname);if(window.location.protocol==='file:'||localHost){notify('Publish the website first; a local preview address will not work for other people.');return;}const shareData={title:'K&K OS — The Birthday Edition',text:'Explore the K&K OS birthday experience and its Wrapped story cards.',url:window.location.href}; if(navigator.share){await navigator.share(shareData);}else{try{await navigator.clipboard.writeText(window.location.href);notify('Website link copied.');}catch{notify('Website address: '+window.location.href);}} }
          else if(action==='edit-content') { if(editPanel.classList.contains('hidden'))editToggle.click(); }
        } catch(err) { if(err && err.name==='AbortError') return; console.error('Wrapped Studio action failed:',err); notify('That action could not finish in this browser. Try Download PNG or Download ZIP instead.'); }
        finally { btn.disabled=false; }
      }));
    }
    redraw();
  }
  function downloadBlob(filename, blob) {
    const url=URL.createObjectURL(blob); const link=document.createElement('a'); link.href=url; link.download=filename; document.body.appendChild(link); link.click(); link.remove(); setTimeout(()=>URL.revokeObjectURL(url),5000);
  }
  function wrappedPalette(edition) {
    if(edition==='kritika') return {bg1:'#fff7fb',bg2:'#e5dcf4',accent:'#a96791',accent2:'#8d7ac4',text:'#53384f',muted:'#8b7086',paper:'#fffaf5',ink:'#563d50'};
    if(edition==='shared') return {bg1:'#101a2c',bg2:'#49304e',accent:'#83c7ff',accent2:'#f0b7d2',text:'#fff8fc',muted:'#d4dbea',paper:'#fffaf5',ink:'#483444'};
    return {bg1:'#071120',bg2:'#123c65',accent:'#7ec4ff',accent2:'#a5f1df',text:'#f1f7ff',muted:'#c4d7ee',paper:'#fffdf8',ink:'#3c3239'};
  }
  function canvasRoundRect(ctx,x,y,w,h,r) {
    const rad=Math.min(r,w/2,h/2); ctx.beginPath();ctx.moveTo(x+rad,y);ctx.arcTo(x+w,y,x+w,y+h,rad);ctx.arcTo(x+w,y+h,x,y+h,rad);ctx.arcTo(x,y+h,x,y,rad);ctx.arcTo(x,y,x+w,y,rad);ctx.closePath();
  }
  function canvasText(ctx,text,x,y,maxWidth,lineHeight,maxLines=5) {
    const words=String(text||'').split(/\s+/).filter(Boolean); let line='', lines=[];
    for(const word of words){const trial=line?line+' '+word:word;if(ctx.measureText(trial).width>maxWidth&&line){lines.push(line);line=word;}else line=trial;}
    if(line)lines.push(line);
    if(lines.length>maxLines){lines=lines.slice(0,maxLines);let last=lines[maxLines-1];while(last.length&&ctx.measureText(last+'…').width>maxWidth)last=last.slice(0,-1);lines[maxLines-1]=last.replace(/[.,;:]?$/,'')+'…';}
    lines.forEach((row,i)=>ctx.fillText(row,x,y+i*lineHeight));return y+lines.length*lineHeight;
  }
  function canvasImage(src) {
    return new Promise(resolve=>{if(!src){resolve(null);return;}const img=new Image();if(/^https?:/i.test(src))img.crossOrigin='anonymous';img.onload=()=>resolve(img);img.onerror=()=>resolve(null);img.src=src;});
  }
  function drawImageContain(ctx,img,x,y,w,h) {
    const scale=Math.min(w/img.width,h/img.height);const dw=img.width*scale,dh=img.height*scale;ctx.drawImage(img,x+(w-dw)/2,y+(h-dh)/2,dw,dh);
  }
  function drawImageCover(ctx,img,x,y,w,h) {
    const scale=Math.max(w/img.width,h/img.height);const dw=img.width*scale,dh=img.height*scale;ctx.save();ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();ctx.drawImage(img,x+(w-dw)/2,y+(h-dh)/2,dw,dh);ctx.restore();
  }
  async function wrappedCardBlob(slide,index,total,edition) {
    if(document.fonts && document.fonts.ready) { try { await document.fonts.ready; } catch {} }
    const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1920;const ctx=canvas.getContext('2d');const p=wrappedPalette(edition);
    const grad=ctx.createLinearGradient(0,0,1080,1920);grad.addColorStop(0,p.bg1);grad.addColorStop(1,p.bg2);ctx.fillStyle=grad;ctx.fillRect(0,0,1080,1920);
    ctx.globalAlpha=.16;ctx.fillStyle=p.accent;ctx.beginPath();ctx.arc(970,270,290,0,Math.PI*2);ctx.fill();ctx.fillStyle=p.accent2;ctx.beginPath();ctx.arc(110,1490,350,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
    ctx.fillStyle=p.text;ctx.textAlign='left';ctx.font='700 28px Manrope, Arial, sans-serif';ctx.fillText('K&K OS',80,100);ctx.fillStyle=p.accent;ctx.font='600 20px "DM Mono", monospace';ctx.textAlign='right';ctx.fillText(`${String(index+1).padStart(2,'0')} / ${String(total).padStart(2,'0')}`,1000,100);
    ctx.textAlign='left';ctx.fillStyle=p.muted;ctx.font='500 20px "DM Mono", monospace';ctx.fillText(wrappedSlideLabel(slide).toUpperCase(),80,155);ctx.fillStyle=p.accent;ctx.fillRect(80,185,920,2);
    const image = await canvasImage(slide.imageSrc);
    if(slide.type==='cover') {
      ctx.strokeStyle=p.accent;ctx.lineWidth=3;ctx.beginPath();ctx.arc(540,470,160,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=.35;ctx.beginPath();ctx.arc(540,470,185,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;
      if(image){ctx.save();ctx.beginPath();ctx.arc(540,470,142,0,Math.PI*2);ctx.clip();drawImageCover(ctx,image,398,328,284,284);ctx.restore();}else{ctx.fillStyle=p.accent;ctx.font='800 112px Manrope, Arial';ctx.textAlign='center';ctx.fillText((slide.name||'K').slice(0,1).toUpperCase(),540,510);}
      ctx.textAlign='center';ctx.fillStyle=p.text;ctx.font='800 77px Manrope, Arial';let y=760;y=canvasText(ctx,slide.title,540,y,900,92,3);ctx.fillStyle=p.accent2;ctx.font='600 35px Manrope, Arial';canvasText(ctx,slide.name,540,y+35,890,48,2);ctx.fillStyle=p.muted;ctx.font='400 29px Manrope, Arial';canvasText(ctx,slide.subtitle,540,1180,840,42,3);ctx.fillStyle=p.text;ctx.font='600 20px "DM Mono", monospace';ctx.fillText('A PERSONALITY REPORT, NOT A PERFORMANCE REVIEW.',540,1590);
    } else if(slide.type==='stats') {
      ctx.textAlign='left';ctx.fillStyle=p.text;ctx.font='800 78px Manrope, Arial';canvasText(ctx,slide.title,80,300,900,90,3);ctx.fillStyle=p.muted;ctx.font='400 29px Manrope, Arial';canvasText(ctx,slide.subtitle,80,540,900,43,2);
      const vals=(slide.stats||[]).slice(0,6),cols=2,rows=Math.ceil(vals.length/cols),tileW=440,tileH=210,startY=650;
      vals.forEach((st,i)=>{const col=i%2,row=Math.floor(i/2),x=80+col*480,y=startY+row*tileH;ctx.fillStyle='rgba(255,255,255,.09)';canvasRoundRect(ctx,x,y,tileW,tileH-20,22);ctx.fill();ctx.strokeStyle='rgba(255,255,255,.16)';ctx.stroke();ctx.textAlign='left';ctx.fillStyle=p.accent;ctx.font='800 56px Manrope, Arial';ctx.fillText(`${String(st.value??'—')}${st.suffix||''}`.slice(0,20),x+25,y+75);ctx.fillStyle=p.text;ctx.font='500 25px Manrope, Arial';canvasText(ctx,st.label,x+25,y+115,tileW-50,32,2);});
      ctx.textAlign='left';ctx.fillStyle=p.muted;ctx.font='400 22px Manrope, Arial';canvasText(ctx,'*Comedic metrics. Customise the figures and labels before sharing.',80,1570,880,34,2);
    } else if(slide.type==='quote') {
      ctx.textAlign='left';ctx.fillStyle=p.accent;ctx.font='800 180px Georgia, serif';ctx.fillText('“',75,470);ctx.fillStyle=p.text;ctx.font='700 66px Manrope, Arial';const end=canvasText(ctx,slide.quote,100,610,850,83,8);ctx.fillStyle=p.muted;ctx.font='400 31px Manrope, Arial';canvasText(ctx,slide.context,100,end+50,820,43,4);ctx.fillStyle=p.accent2;ctx.font='600 24px "DM Mono", monospace';ctx.fillText(`${slide.source||''}${slide.date?' · '+slide.date:''}`.slice(0,60),100,1430);
    } else if(slide.type==='lore') {
      ctx.fillStyle=p.accent;ctx.font='600 21px "DM Mono", monospace';ctx.fillText(String(slide.loreTag||'CLASSIFIED').toUpperCase(),80,330);ctx.fillStyle=p.text;ctx.font='800 68px Manrope, Arial';let end=canvasText(ctx,slide.loreTitle||slide.title,80,465,920,78,4);ctx.strokeStyle=p.accent;ctx.lineWidth=2;ctx.strokeRect(80, end+10,920,2);ctx.fillStyle=p.muted;ctx.font='400 34px Manrope, Arial';canvasText(ctx,slide.loreBody,80,end+110,900,50,10);ctx.fillStyle=p.accent2;ctx.font='600 22px "DM Mono", monospace';ctx.fillText(`FILE SOURCE: ${slide.source||'THE LORE FOLDER'}`.slice(0,70),80,1580);
    } else if(slide.type==='memory') {
      ctx.save();ctx.translate(540,930);ctx.rotate(-.018);ctx.translate(-540,-930);ctx.fillStyle='rgba(0,0,0,.25)';canvasRoundRect(ctx,95,310,890,1250,8);ctx.fill();ctx.fillStyle=p.paper;canvasRoundRect(ctx,85,295,890,1250,5);ctx.fill();
      const ix=125,iy=335,iw=810,ih=860;ctx.fillStyle='#eae7e6';ctx.fillRect(ix,iy,iw,ih);
      if(image)drawImageContain(ctx,image,ix+6,iy+6,iw-12,ih-12);else{ctx.fillStyle='#394459';ctx.fillRect(ix,iy,iw,ih);ctx.fillStyle='#fff';ctx.textAlign='center';ctx.font='800 58px Manrope, Arial';ctx.fillText('▶ VIDEO MEMORY',540,iy+420);}if(slide.mediaType==='video'){ctx.fillStyle='rgba(9,17,29,.82)';canvasRoundRect(ctx,740,iy+25,170,48,10);ctx.fill();ctx.fillStyle='#fff';ctx.textAlign='center';ctx.font='600 17px "DM Mono", monospace';ctx.fillText('▶ VIDEO',825,iy+55);}
      ctx.textAlign='center';ctx.fillStyle=p.ink;ctx.font='800 46px "Patrick Hand", Manrope, Arial';canvasText(ctx,slide.title,540,1260,790,54,2);ctx.fillStyle='#8f7f89';ctx.font='600 19px "DM Mono", monospace';ctx.fillText(String(slide.date||'A MOMENT IN TIME').toUpperCase().slice(0,55),540,1378);ctx.fillStyle='#6e5b65';ctx.font='400 24px Manrope, Arial';canvasText(ctx,slide.caption||'A memory worth keeping.',540,1430,790,34,3);ctx.restore();
    } else if(slide.type==='birthday') {
      ctx.textAlign='center';ctx.fillStyle=p.accent;ctx.font='700 70px Georgia, serif';ctx.fillText('✳',540,340);ctx.fillStyle=p.text;ctx.font='800 63px Manrope, Arial';let end=canvasText(ctx,slide.title,540,460,880,75,4);ctx.fillStyle=p.accent2;ctx.font='600 38px "Patrick Hand", Manrope, Arial';end=canvasText(ctx,slide.opening,540,end+80,850,50,2);ctx.textAlign='left';ctx.fillStyle=p.muted;ctx.font='400 30px Manrope, Arial';end=canvasText(ctx,slide.body,110,end+65,860,45,11);ctx.textAlign='center';ctx.fillStyle=p.accent;ctx.font='600 35px "Patrick Hand", Manrope, Arial';canvasText(ctx,slide.signoff,540,Math.min(1550,end+60),850,45,3);if(slide.draft){ctx.fillStyle='#d4475b';ctx.font='700 25px "DM Mono", monospace';ctx.fillText('DRAFT · FINISH IN EDIT MODE',540,1700);}
    } else {
      ctx.textAlign='center';ctx.fillStyle=p.accent;ctx.font='700 80px Georgia, serif';ctx.fillText('✳',540,440);ctx.fillStyle=p.text;ctx.font='800 75px Manrope, Arial';let end=canvasText(ctx,slide.title,540,600,900,90,4);ctx.fillStyle=p.muted;ctx.font='400 31px Manrope, Arial';canvasText(ctx,slide.subtitle,540,end+50,880,44,4);ctx.fillStyle=p.accent2;ctx.font='500 22px "DM Mono", monospace';canvasText(ctx,slide.url,540,1370,860,32,5);ctx.fillStyle=p.text;ctx.font='700 24px "DM Mono", monospace';ctx.fillText('SAVE THE CARDS. KEEP THE LORE.',540,1600);
    }
    ctx.textAlign='left';ctx.fillStyle=p.muted;ctx.globalAlpha=.72;ctx.font='500 18px "DM Mono", monospace';ctx.fillText('K&K OS  •  THE BIRTHDAY EDITION',80,1840);ctx.globalAlpha=1;
    return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('PNG export failed')), 'image/png'));
  }
  async function wrappedPosterBlob(slides,edition) {
    if(document.fonts && document.fonts.ready) { try { await document.fonts.ready; } catch {} }
    const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1920;const ctx=canvas.getContext('2d');const p=wrappedPalette(edition);
    const g=ctx.createLinearGradient(0,0,1080,1920);g.addColorStop(0,p.bg1);g.addColorStop(1,p.bg2);ctx.fillStyle=g;ctx.fillRect(0,0,1080,1920);ctx.fillStyle=p.accent;ctx.globalAlpha=.14;ctx.beginPath();ctx.arc(950,280,300,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
    const name=slides.find(s=>s.name)?.name || (edition==='shared'?'Kartik & Kritika':displayName(edition));ctx.fillStyle=p.text;ctx.font='700 28px Manrope,Arial';ctx.fillText('K&K OS / WRAPPED',80,100);ctx.fillStyle=p.accent;ctx.font='600 20px "DM Mono",monospace';ctx.fillText('HIGHLIGHTS / MEMORY ARCHIVE',80,145);
    ctx.fillStyle=p.text;ctx.font='800 76px Manrope,Arial';let y=270;y=canvasText(ctx,name.toUpperCase(),80,y,920,86,2);ctx.fillStyle=p.muted;ctx.font='400 28px Manrope,Arial';canvasText(ctx,'A tiny recap of a very large amount of lore.',80,y+35,900,40,2);
    const st=slides.find(s=>s.type==='stats');if(st){ctx.fillStyle=p.accent;ctx.font='600 22px "DM Mono",monospace';ctx.fillText('THE OFFICIAL REPORT',80,500);const list=st.stats.slice(0,4);list.forEach((v,i)=>{const x=80+(i%2)*470,yy=545+Math.floor(i/2)*165;ctx.fillStyle='rgba(255,255,255,.09)';canvasRoundRect(ctx,x,yy,430,140,20);ctx.fill();ctx.fillStyle=p.accent;ctx.font='800 43px Manrope,Arial';ctx.fillText(`${v.value}${v.suffix||''}`.slice(0,18),x+22,yy+54);ctx.fillStyle=p.text;ctx.font='500 22px Manrope,Arial';canvasText(ctx,v.label,x+22,yy+88,385,27,2);});}
    const quote=slides.find(s=>s.type==='quote');if(quote){ctx.fillStyle=p.accent2;ctx.font='700 25px "DM Mono",monospace';ctx.fillText('MOST QUOTABLE MOMENT',80,915);ctx.fillStyle=p.text;ctx.font='700 39px Manrope,Arial';canvasText(ctx,quote.quote,80,980,900,49,3);}
    const mem=slides.find(s=>s.type==='memory'&&s.mediaType==='image');const img=mem?await canvasImage(mem.imageSrc):null;if(img){ctx.fillStyle=p.paper;canvasRoundRect(ctx,700,1115,290,410,4);ctx.fill();drawImageContain(ctx,img,718,1130,254,270);ctx.fillStyle=p.ink;ctx.textAlign='center';ctx.font='700 23px "Patrick Hand",Manrope,Arial';canvasText(ctx,mem.title,845,1430,240,27,2);ctx.textAlign='left';}else{ctx.fillStyle='rgba(255,255,255,.08)';canvasRoundRect(ctx,700,1115,290,410,4);ctx.fill();ctx.fillStyle=p.muted;ctx.font='500 20px "DM Mono",monospace';ctx.textAlign='center';canvasText(ctx,'MEMORY VAULT',845,1300,240,27,3);ctx.textAlign='left';}
    ctx.fillStyle=p.accent;ctx.font='600 22px "DM Mono",monospace';ctx.fillText('SAVE THE CARDS. KEEP THE LORE.',80,1650);ctx.fillStyle=p.muted;ctx.font='400 22px Manrope,Arial';canvasText(ctx,wrappedPublicSiteUrl(),80,1710,900,30,4);ctx.fillStyle=p.text;ctx.font='600 18px "DM Mono",monospace';ctx.fillText('BUILT WITH QUESTIONABLE AMOUNTS OF AFFECTION.',80,1840);
    return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('Poster export failed')),'image/png'));
  }
  function makeZip(files) {
    const crcTable=makeZip.crcTable||(makeZip.crcTable=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=(c&1)?(0xedb88320^(c>>>1)):(c>>>1);t[n]=c>>>0;}return t;})());
    const crc32=data=>{let c=0xffffffff;for(let i=0;i<data.length;i++)c=crcTable[(c^data[i])&0xff]^(c>>>8);return (c^0xffffffff)>>>0;};
    const enc=new TextEncoder(),locals=[],centrals=[];let offset=0;const now=new Date(),time=((now.getHours()&31)<<11)|((now.getMinutes()&63)<<5)|((Math.floor(now.getSeconds()/2))&31),date=(((Math.max(1980,now.getFullYear())-1980)&127)<<9)|(((now.getMonth()+1)&15)<<5)|(now.getDate()&31);
    const u16=n=>new Uint8Array([n&255,(n>>>8)&255]);const u32=n=>new Uint8Array([n&255,(n>>>8)&255,(n>>>16)&255,(n>>>24)&255]);const join=parts=>{const total=parts.reduce((n,p)=>n+p.length,0),out=new Uint8Array(total);let at=0;for(const part of parts){out.set(part,at);at+=part.length;}return out;};
    files.forEach(file=>{const name=enc.encode(file.name),bytes=file.data,crc=crc32(bytes);const local=join([u32(0x04034b50),u16(20),u16(0),u16(0),u16(time),u16(date),u32(crc),u32(bytes.length),u32(bytes.length),u16(name.length),u16(0),name,bytes]);locals.push(local);const central=join([u32(0x02014b50),u16(20),u16(20),u16(0),u16(0),u16(time),u16(date),u32(crc),u32(bytes.length),u32(bytes.length),u16(name.length),u16(0),u16(0),u16(0),u16(0),u32(0),u32(offset),name]);centrals.push(central);offset+=local.length;});
    const centralSize=centrals.reduce((n,p)=>n+p.length,0),end=join([u32(0x06054b50),u16(0),u16(0),u16(files.length),u16(files.length),u32(centralSize),u32(offset),u16(0)]);return join([...locals,...centrals,end]);
  }

  // Edit mode uses browser-local storage, then can export a publishable JS file.
  editToggle.addEventListener('click', () => { editPanel.classList.toggle('hidden'); editToggle.classList.toggle('active', !editPanel.classList.contains('hidden')); if(!editPanel.classList.contains('hidden')) renderEditor(); });
  $('#close-edit').addEventListener('click', () => { editPanel.classList.add('hidden'); editToggle.classList.remove('active'); });
  $('#edit-person').addEventListener('change', renderEditor);
  function field(label, path, value, type='input', hint='') {
    const control = type === 'textarea' ? `<textarea class="edit-textarea" data-path="${escapeHTML(path)}" rows="3">${escapeHTML(value ?? '')}</textarea>` : `<input class="edit-input" data-path="${escapeHTML(path)}" value="${escapeHTML(value ?? '')}">`;
    return `<div class="edit-field-wrap"><label>${escapeHTML(label)}</label>${control}${hint?`<div style="font-size:9px;color:var(--muted);line-height:1.5;margin-top:5px">${escapeHTML(hint)}</div>`:''}</div>`;
  }
  function section(label, children) { return `<div class="edit-group-label">${escapeHTML(label)}</div>${children}`; }
  function jsonField(label, path, value, hint) { return field(label, path, JSON.stringify(value || [], null, 2), 'textarea', hint || 'Edit the JSON entries; keep the brackets, quotes and commas valid.'); }
  function renderEditor() {
    const who = $('#edit-person').value; let html='';
    if(who === 'shared') {
      html += section('Shared birthday message', field('Headline','sharedBirthday.title',data.sharedBirthday?.title) + field('Message','sharedBirthday.message',data.sharedBirthday?.message,'textarea'));
      html += section('Shared content', jsonField('Shared quotes','quotes.shared',data.quotes?.shared,'Each entry uses quote, context and date.'));
      html += section('Shared lore files', jsonField('Shared lore','lore.shared',data.lore?.shared,'Each entry uses title, tag and body.'));
      html += section('Shared stats', jsonField('Shared stats','stats.shared',data.stats?.shared,'Each entry uses label, value and suffix.'));
    } else {
      const p=data.profiles[who]||{}; const prefix=`profiles.${who}.`;
      html += section('Profile details', field('Display name',prefix+'name',p.name)+field('Handle',prefix+'handle',p.handle)+field('Role / eyebrow',prefix+'role',p.role)+field('Tagline',prefix+'tagline',p.tagline)+field('Custom title',prefix+'title',p.title)+field('Birthday / status label',prefix+'birthday',p.birthday)+field('Welcome subtitle',prefix+'welcomeLine',p.welcomeLine)+field('Profile picture filename',prefix+'profileImage',p.profileImage,'input','Put that file inside media/profiles/. Example: kartik.jpg. Then refresh the media catalogue. If using source code, set the full path instead.')+field('Description',prefix+'description',p.description,'textarea'));
      html += section('Quote archive', jsonField(`Quotes for ${p.name || who}`,'quotes.'+who,data.quotes?.[who],'Add 5–10 or more objects like { "quote": "...", "context": "...", "date": "..." }.'));
      html += section('Personal stats', jsonField('Stats tiles','stats.'+who,data.stats?.[who],'Each object has label, numeric value and optional suffix.'));
      html += section('Lore files', jsonField('Case files','lore.'+who,data.lore?.[who],'Each object has title, tag and body.'));
      const l=data.letters?.[who]||{}; const lp=`letters.${who}.`;
      html += section('Birthday letter', field('Letter headline',lp+'title',l.title)+field('Opening line',lp+'opening',l.opening)+field('Letter body',lp+'body',l.body,'textarea')+field('Sign-off',lp+'signoff',l.signoff,'textarea'));
    }
    html += section('Memory wall notes', `<p style="font-size:10px;line-height:1.7;color:var(--muted);margin:0 0 10px">Open Memory Vault, turn on EDIT MODE, click a Polaroid, and edit its date and caption inside the close-up. Its title continues to come from the filename. To change position, close the note and use Arrange Mode.</p>`);
    $('#edit-fields').innerHTML=html;
    $$('[data-path]', $('#edit-fields')).forEach(control => control.addEventListener('change', () => {
      const path=control.dataset.path; let value=control.value;
      if (control.tagName === 'TEXTAREA' && (path.startsWith('quotes.') || path.startsWith('stats.') || path.startsWith('lore.'))) {
        const parsed=safeJSON(value,null); if(parsed===null){control.style.borderColor='#ff8989';notify('That JSON is not valid yet. Keep the commas and quotes balanced.');return;} value=parsed;control.style.borderColor='';
      }
      setPath(data,path,value); saveLocal(); updateDesktop(); refreshOpenWindows(); notify('Saved on this computer. Export the publish file to share it online.');
    }));
  }
  function setPath(object, path, value) { const keys=path.split('.'); let target=object; for(let i=0;i<keys.length-1;i++){if(!target[keys[i]]||typeof target[keys[i]]!=='object')target[keys[i]]={};target=target[keys[i]];} target[keys[keys.length-1]]=value; }
  function refreshOpenWindows() {
    const open=$$('.app-window',windowLayer).map(win=>win.dataset.windowApp);
    open.forEach(app=>{const win=$(`.app-window[data-window-app="${app}"]`,windowLayer);if(!win)return;const body=$('.window-body',win); if(app==='vault'){body.innerHTML=renderVault();initVault(win);} else {const config={profile:renderProfile,quotes:renderQuotes,lore:renderLore,stats:renderStats,birthday:renderBirthday,wrapped:renderWrapped};body.innerHTML=(config[app]||(()=>''))();if(app==='stats')animateStats(win);if(app==='birthday')initBirthday(win);if(app==='wrapped')initWrapped(win);}});
  }
  $('#export-overrides').addEventListener('click', () => {
    const exportable = { ...fresh(data), wallPositions: fresh(wallLayout) };
    downloadText('custom-overrides.js', '/* K&K OS PUBLISH OVERRIDES — exported from Edit Mode. */\nwindow.KK_OVERRIDES = ' + JSON.stringify(exportable, null, 2) + ';\n');
    notify('Publish file downloaded. Replace custom-overrides.js in your website folder, then upload the whole folder.');
  });
  $('#reset-local').addEventListener('click', () => {
    const okay = window.confirm('Remove edits saved in this browser and reload the base source data? Your photos and source files will not be deleted.');
    if(!okay)return; try{localStorage.removeItem(STORAGE_KEY);localStorage.removeItem(LAYOUT_KEY);}catch{}
    location.reload();
  });

  // Restore/exportable wall arrangements after media refreshes.
  if (data.wallPositions && Object.keys(wallLayout).length === 0) { wallLayout = fresh(data.wallPositions); saveLayout(); }
  // Helpful keyboard controls.
  document.addEventListener('keydown', e => { if(e.key==='Escape' && $('#memory-focus')) closeMemoryFocus(); if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='e'){e.preventDefault();editToggle.click();} });
  // If the source data references profile images, use them right on the selection screen.
  updateSelectionCards();
})();
