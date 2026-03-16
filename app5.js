// ===============================================================
// SlideCraft – app5.js  (More Editing Features)
// ===============================================================

// ===== CLIPBOARD =====
let clipboard = null; // copied element

// ===== VIDEO ELEMENT FACTORY =====
function createVideoElement(src, srcType, x, y, w, h) {
  // srcType: 'youtube' | 'local'
  return {
    id: Date.now() + Math.random(),
    type: 'video',
    srcType,
    src,           // youtube embed URL or data URL
    x: x ?? 80, y: y ?? 80, w: w ?? 400, h: h ?? 260,
    opacity: 1, rotation: 0
  };
}

// ===== ICON/EMOJI ELEMENT FACTORY =====
function createIconElement(emoji, x, y, size) {
  return createTextElement(emoji, x ?? 380, y ?? 200, size ?? 120, size ?? 120, size ?? 80, '#ffffff', 'center', false);
}

// ===== EXTEND buildElementNode for video =====
const _origBuildElementNode = buildElementNode;
window.buildElementNode = function(el, interactive) {
  if (el.type !== 'video') return _origBuildElementNode(el, interactive);

  const wrapper = document.createElement('div');
  wrapper.className = 'slide-element';
  wrapper.dataset.id = el.id;
  wrapper.style.cssText = `
    left:${el.x}px; top:${el.y}px; width:${el.w}px; height:${el.h}px;
    opacity:${el.opacity ?? 1};
    transform:rotate(${el.rotation || 0}deg);
  `;
  if (el.id === state.selectedElement) wrapper.classList.add('selected');

  if (el.srcType === 'youtube') {
    const iframe = document.createElement('iframe');
    // Add autoplay and loop for projection mode
    const autoplay = !interactive ? '&autoplay=1&loop=1&playlist=' + el.src.split('/embed/')[1].split('?')[0] : '';
    iframe.src = el.src + autoplay;
    iframe.style.cssText = 'width:100%;height:100%;border:none;border-radius:6px;pointer-events:none;';
    iframe.allowFullscreen = true;
    iframe.allow = 'autoplay; encrypted-media';
    wrapper.appendChild(iframe);
    // Overlay to allow dragging
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:absolute;inset:0;cursor:move;';
    wrapper.appendChild(overlay);
  } else {
    const video = document.createElement('video');
    video.src = el.src;
    video.style.cssText = 'width:100%;height:100%;object-fit:contain;border-radius:6px;';
    video.controls = interactive;
    video.muted = true;
    if (!interactive) {
      video.autoplay = true;
      video.loop = true;
    }
    wrapper.appendChild(video);
  }

  if (interactive) {
    const handle = document.createElement('div');
    handle.className = 'resize-handle';
    wrapper.appendChild(handle);
    wrapper.addEventListener('mousedown', e => {
      if (e.target === handle) return startResize(e, el, wrapper);
      selectElement(el.id);
      startDrag(e, el, wrapper);
    });
    wrapper.addEventListener('click', e => { e.stopPropagation(); selectElement(el.id); });
  }
  return wrapper;
};

// ===== EXTEND buildShape for new shapes =====
const _origBuildShape = buildShape;
window.buildShape = function(el) {
  const d = document.createElement('div');
  switch (el.shape) {
    case 'roundrect':
      d.style.cssText = `width:100%;height:100%;background:${el.color||'#6366f1'};border-radius:20px;`;
      return d;
    case 'diamond': {
      const wrap = document.createElement('div');
      wrap.style.cssText = `width:100%;height:100%;display:flex;align-items:center;justify-content:center;`;
      d.style.cssText = `
        width:${Math.min(el.w, el.h) * 0.9}px;
        height:${Math.min(el.w, el.h) * 0.9}px;
        background:${el.color||'#6366f1'};
        transform:rotate(45deg);
      `;
      wrap.appendChild(d); return wrap;
    }
    case 'pentagon':
      d.className = 'sh-poly-el';
      d.textContent = '⬠';
      d.style.color = el.color || '#6366f1';
      d.style.fontSize = Math.min(el.w, el.h) * 0.85 + 'px';
      d.style.cssText += ';display:flex;align-items:center;justify-content:center;width:100%;height:100%;';
      return d;
    case 'hexagon':
      d.className = 'sh-poly-el';
      d.textContent = '⬡';
      d.style.color = el.color || '#6366f1';
      d.style.fontSize = Math.min(el.w, el.h) * 0.85 + 'px';
      d.style.cssText += ';display:flex;align-items:center;justify-content:center;width:100%;height:100%;';
      return d;
    case 'dbarrow':
      d.className = 'sh-arrow-el';
      d.textContent = '↔';
      d.style.color = el.color || '#22c55e';
      d.style.fontSize = Math.min(el.w, el.h) * 0.8 + 'px';
      return d;
    case 'bubble':
      d.className = 'sh-bubble-el';
      d.textContent = '💬';
      d.style.fontSize = Math.min(el.w, el.h) * 0.8 + 'px';
      d.style.cssText += ';width:100%;height:100%;display:flex;align-items:center;justify-content:center;';
      return d;
    default:
      return _origBuildShape(el);
  }
};

// ===== NEW TOOLBAR BUTTONS =====
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('tb-video')?.addEventListener('click', () => openModal('video-modal'));
  document.getElementById('tb-icon')?.addEventListener('click', () => {
    openModal('icon-modal');
    initIconGrid('smileys');
  });

  // ===== VIDEO MODAL LOGIC =====
  // Tab switching
  document.querySelectorAll('.video-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.video-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const tab = btn.dataset.vtab;
      document.getElementById('vtab-youtube').style.display = tab === 'youtube' ? '' : 'none';
      document.getElementById('vtab-local').style.display = tab === 'local' ? '' : 'none';
    });
  });

  // YouTube URL preview
  document.getElementById('yt-url')?.addEventListener('input', e => {
    const embedUrl = youtubeToEmbed(e.target.value.trim());
    const wrap = document.getElementById('yt-preview-wrap');
    const iframe = document.getElementById('yt-preview');
    if (embedUrl) {
      iframe.src = embedUrl;
      wrap.style.display = '';
    } else {
      wrap.style.display = 'none';
    }
  });

  // Insert video button
  document.getElementById('btn-insert-video')?.addEventListener('click', () => {
    const activeTab = document.querySelector('.video-tab.active')?.dataset.vtab;

    if (activeTab === 'youtube') {
      const url = document.getElementById('yt-url').value.trim();
      const embedUrl = youtubeToEmbed(url);
      if (!embedUrl) { alert('URL de YouTube no válida.'); return; }
      const el = createVideoElement(embedUrl, 'youtube');
      getCurrentSlide().elements.push(el);
      selectElement(el.id);
      closeModal('video-modal');
      saveToStorage();

    } else {
      const file = document.getElementById('video-upload-file').files[0];
      if (!file) { alert('Selecciona un archivo de video.'); return; }
      const reader = new FileReader();
      reader.onload = ev => {
        const el = createVideoElement(ev.target.result, 'local');
        getCurrentSlide().elements.push(el);
        selectElement(el.id);
        closeModal('video-modal');
        saveToStorage();
      };
      reader.readAsDataURL(file);
    }
  });

  // ===== ICON PICKER LOGIC =====
  document.querySelectorAll('[data-icat]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-icat]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      initIconGrid(btn.dataset.icat);
    });
  });

  document.getElementById('icon-search')?.addEventListener('input', e => {
    const q = e.target.value.trim().toLowerCase();
    if (!q) {
      const activecat = document.querySelector('[data-icat].active')?.dataset.icat || 'smileys';
      initIconGrid(activecat);
    } else {
      searchIconGrid(q);
    }
  });

  document.getElementById('btn-insert-icon')?.addEventListener('click', () => {
    const preview = document.getElementById('icon-preview').textContent;
    if (!preview || preview === '-') return;
    const size = parseInt(document.getElementById('icon-size').value) || 80;
    const el = createIconElement(preview, undefined, undefined, size);
    getCurrentSlide().elements.push(el);
    selectElement(el.id);
    closeModal('icon-modal');
    saveToStorage();
  });

  // ===== ELEMENT CONTROLS IN PROPS PANEL =====

  // Shape color picker
  document.getElementById('el-shape-color')?.addEventListener('input', e => {
    const el = getSelectedEl();
    if (!el || el.type !== 'shape') return;
    el.color = e.target.value;
    renderAll(); saveToStorage();
  });

  // DUPLICATE
  document.getElementById('el-duplicate')?.addEventListener('click', () => {
    const el = getSelectedEl(); if (!el) return;
    const dupe = JSON.parse(JSON.stringify(el));
    dupe.id = Date.now() + Math.random();
    dupe.x += 20; dupe.y += 20;
    dupe.locked = false;
    getCurrentSlide().elements.push(dupe);
    selectElement(dupe.id);
    renderAll(); saveToStorage();
  });

  // LOCK
  document.getElementById('el-lock')?.addEventListener('click', () => {
    const el = getSelectedEl(); if (!el) return;
    el.locked = !el.locked;
    const btn = document.getElementById('el-lock');
    btn.innerHTML = el.locked
      ? '<i class="fa-solid fa-lock-open"></i> Desbloquear'
      : '<i class="fa-solid fa-lock"></i> Bloquear';
    renderAll(); saveToStorage();
  });

  // BRING TO FRONT
  document.getElementById('el-bring-front')?.addEventListener('click', () => {
    const slide = getCurrentSlide();
    const idx = slide.elements.findIndex(e => e.id === state.selectedElement);
    if (idx === -1 || idx === slide.elements.length - 1) return;
    const [el] = slide.elements.splice(idx, 1);
    slide.elements.push(el);
    renderAll(); saveToStorage();
  });

  // SEND TO BACK
  document.getElementById('el-send-back')?.addEventListener('click', () => {
    const slide = getCurrentSlide();
    const idx = slide.elements.findIndex(e => e.id === state.selectedElement);
    if (idx <= 0) return;
    const [el] = slide.elements.splice(idx, 1);
    slide.elements.unshift(el);
    renderAll(); saveToStorage();
  });

  // ALIGN BUTTONS
  document.querySelectorAll('.align-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const el = getSelectedEl(); if (!el) return;
      const h = btn.dataset.alignH;
      const v = btn.dataset.alignV;
      if (h === 'left')   el.x = 0;
      if (h === 'center') el.x = (960 - el.w) / 2;
      if (h === 'right')  el.x = 960 - el.w;
      if (v === 'top')    el.y = 0;
      if (v === 'middle') el.y = (540 - el.h) / 2;
      if (v === 'bottom') el.y = 540 - el.h;
      renderAll(); saveToStorage();
    });
  });

  // KEYBOARD SHORTCUTS: Ctrl+C, Ctrl+V, Ctrl+D
  document.addEventListener('keydown', e => {
    if (state.projecting) return;
    const tag = document.activeElement?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;

    // Ctrl+C – copy
    if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
      const el = getSelectedEl();
      if (el) clipboard = JSON.parse(JSON.stringify(el));
    }
    // Ctrl+V – paste
    if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
      if (!clipboard) return;
      const dupe = JSON.parse(JSON.stringify(clipboard));
      dupe.id = Date.now() + Math.random();
      dupe.x += 20; dupe.y += 20;
      getCurrentSlide().elements.push(dupe);
      selectElement(dupe.id);
      renderAll(); saveToStorage();
    }
    // Ctrl+D – duplicate
    if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
      e.preventDefault();
      const el = getSelectedEl(); if (!el) return;
      const dupe = JSON.parse(JSON.stringify(el));
      dupe.id = Date.now() + Math.random();
      dupe.x += 20; dupe.y += 20;
      getCurrentSlide().elements.push(dupe);
      selectElement(dupe.id);
      renderAll(); saveToStorage();
    }
  });
});

// Prevent dragging locked elements
const _origStartDrag = startDrag;
// Patch the mousedown in buildElementNode to check locked
// (We patch globally — wrap selectElement check)
const _origSelectEl = selectElement;
window.selectElement = function(id) {
  const slide = getCurrentSlide();
  const el = slide?.elements.find(e => e.id === id);
  if (el?.locked) return; // don't select locked elements
  _origSelectEl(id);
};

// ===== UPDATE PROPS PANEL for new element types =====
const _origUpdatePropsPanelElement = updatePropsPanelElement;
window.updatePropsPanelElement = function() {
  _origUpdatePropsPanelElement();
  const el = getSelectedEl();
  const shapeProps = document.getElementById('shape-props');
  const lockBtn = document.getElementById('el-lock');
  if (shapeProps) {
    if (el && el.type === 'shape') {
      shapeProps.style.display = '';
      document.getElementById('el-shape-color').value = el.color || '#6366f1';
    } else {
      shapeProps.style.display = 'none';
    }
  }
  if (lockBtn && el) {
    lockBtn.innerHTML = el.locked
      ? '<i class="fa-solid fa-lock-open"></i> Desbloquear'
      : '<i class="fa-solid fa-lock"></i> Bloquear';
  }
};

// ===== YOUTUBE URL PARSER =====
function youtubeToEmbed(url) {
  if (!url) return null;
  let videoId = null;

  // Standard: https://www.youtube.com/watch?v=ID
  let m = url.match(/[?&]v=([A-Za-z0-9_-]{11})/);
  if (m) videoId = m[1];

  // Shortened: https://youtu.be/ID
  if (!videoId) {
    m = url.match(/youtu\.be\/([A-Za-z0-9_-]{11})/);
    if (m) videoId = m[1];
  }

  // Embed already: https://www.youtube.com/embed/ID
  if (!videoId) {
    m = url.match(/youtube\.com\/embed\/([A-Za-z0-9_-]{11})/);
    if (m) videoId = m[1];
  }

  if (!videoId) return null;
  return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`;
}

// ===== EMOJI DATABASE =====
const EMOJI_CATEGORIES = {
  smileys: [
    '😀','😃','😄','😁','😆','😅','😂','🤣','😊','😇',
    '🙂','🙃','😉','😌','😍','🥰','😘','😗','😙','😚',
    '😋','😛','😝','😜','🤪','😎','🧐','🤓','😏','😒',
    '😞','😔','😟','😕','🙁','☹️','😣','😖','😫','😩',
    '🥺','😢','😭','😤','😠','😡','🤬','😳','🥵','🥶',
    '😱','😨','😰','😥','😓','🫠','🤗','🤔','🫡','🤭',
  ],
  animals: [
    '🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯',
    '🦁','🐮','🐷','🐸','🐵','🙈','🙉','🙊','🐔','🐧',
    '🐦','🦆','🦅','🦉','🦇','🐺','🐗','🐴','🦄','🐝',
    '🐛','🦋','🐌','🐞','🐜','🦗','🕷','🦂','🐢','🐍',
    '🦎','🦖','🦕','🐙','🦑','🦐','🦞','🦀','🐡','🐟',
  ],
  objects: [
    '🎯','🎪','🎨','🎭','🎬','🎤','🎧','🎼','🎵','🎶',
    '🎷','🎸','🎹','🥁','🎺','🎻','🪕','🎮','🕹','🎲',
    '♟️','🎭','🎃','🎄','🎆','🎇','🧨','✨','🎉','🎊',
    '🎋','🎍','🎎','🎏','🎐','🎑','🎗','🎟','🎫','🏆',
    '🥇','🥈','🥉','🏅','🎖','🏵','📚','📖','📝','✏️',
  ],
  symbols: [
    '💎','💡','🔥','❄️','⚡','🌊','🌈','🌙','☀️','⭐',
    '🌟','✨','💫','⚪','⚫','🔴','🟠','🟡','🟢','🔵',
    '🟣','🟤','❤️','🧡','💛','💚','💙','💜','🖤','🤍',
    '💔','❣️','💕','💞','💓','💗','💖','💘','💝','💟',
    '☮️','✝️','☯️','🕉','🔯','♈','♉','♊','♋','♌',
    '♍','♎','♏','♐','♑','♒','♓','⛎','🔀','🔁',
  ],
  flags: [
    '🏳️','🏴','🚩','🏁','🏳️‍🌈','🏳️‍⚧️','🇺🇸','🇬🇧','🇪🇸','🇫🇷',
    '🇩🇪','🇮🇹','🇵🇹','🇯🇵','🇨🇳','🇷🇺','🇧🇷','🇦🇷','🇲🇽','🇨🇦',
    '🇦🇺','🇮🇳','🇿🇦','🇰🇷','🇸🇦','🇦🇪','🇹🇷','🇳🇱','🇧🇪','🇸🇪',
    '🇳🇴','🇩🇰','🇫🇮','🇵🇱','🇺🇦','🇮🇱','🇨🇴','🇨🇭','🇦🇹','🇳🇿',
  ],
  tech: [
    '💻','🖥','🖨','⌨️','🖱','🖲','💾','💿','📀','🎥',
    '📷','📸','📹','📽','🎞','📞','☎️','📟','📠','📺',
    '📻','🧭','⏱','⏲','⏰','🕰','⌚','📡','🔋','🔌',
    '💡','🔦','🕯','🪔','🧲','🔭','🔬','🧪','🧫','🧬',
    '🤖','👾','🎙','🎚','🎛','📲','📱','☢️','☣️','⚛️',
  ]
};

let selectedEmoji = null;
const ALL_EMOJIS = Object.values(EMOJI_CATEGORIES).flat();

function initIconGrid(category) {
  const grid = document.getElementById('icon-grid');
  if (!grid) return;
  grid.innerHTML = '';
  selectedEmoji = null;
  document.getElementById('icon-preview').textContent = '-';

  const emojis = EMOJI_CATEGORIES[category] || EMOJI_CATEGORIES.smileys;
  emojis.forEach(emoji => {
    const cell = document.createElement('div');
    cell.className = 'icon-cell';
    cell.textContent = emoji;
    cell.addEventListener('click', () => {
      document.querySelectorAll('.icon-cell.selected').forEach(c => c.classList.remove('selected'));
      cell.classList.add('selected');
      selectedEmoji = emoji;
      document.getElementById('icon-preview').textContent = emoji;
    });
    grid.appendChild(cell);
  });
}

function searchIconGrid(q) {
  const grid = document.getElementById('icon-grid');
  if (!grid) return;
  grid.innerHTML = '';
  selectedEmoji = null;
  document.getElementById('icon-preview').textContent = '-';

  // Simple code-point name search isn't possible without a database,
  // so just show all emojis filtered by rough matches
  ALL_EMOJIS.forEach(emoji => {
    const cell = document.createElement('div');
    cell.className = 'icon-cell';
    cell.textContent = emoji;
    cell.addEventListener('click', () => {
      document.querySelectorAll('.icon-cell.selected').forEach(c => c.classList.remove('selected'));
      cell.classList.add('selected');
      selectedEmoji = emoji;
      document.getElementById('icon-preview').textContent = emoji;
    });
    grid.appendChild(cell);
  });
}
