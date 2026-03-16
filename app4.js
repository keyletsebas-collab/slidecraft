// ===============================================================
// SlideCraft – app4.js  (Presentation History)
// ===============================================================

const HISTORY_KEY = 'slidecraft_history';
const HISTORY_MAX = 50; // max entries stored

// ===== HISTORY DATA LAYER =====

function historyLoad() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
  } catch(e) {
    return [];
  }
}

function historySave(entries) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(entries));
  } catch(e) {
    // If storage is full, remove oldest 5 entries and retry
    entries.splice(0, 5);
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(entries)); } catch(e2) {}
  }
}

// Save or update the current presentation in history
function historyPush() {
  const title = document.getElementById('pres-title')?.value?.trim() || 'Sin título';
  const slides = state.slides;
  if (!slides || slides.length === 0) return;

  const entries = historyLoad();

  // Build a compact entry (don't store full base64 images to save space)
  const entry = {
    id: Date.now(),
    title,
    date: new Date().toISOString(),
    slideCount: slides.length,
    preview: getPreviewInfo(slides[0]), // first slide color/gradient for thumbnail
    // Store full data but strip large images
    slides: compactSlides(slides)
  };

  // Remove existing entry with same title (update it)
  const idx = entries.findIndex(e => e.title === title);
  if (idx !== -1) entries.splice(idx, 1);

  // Add to front
  entries.unshift(entry);

  // Keep max entries
  if (entries.length > HISTORY_MAX) entries.splice(HISTORY_MAX);

  historySave(entries);
}

// Get color info from first slide for thumbnail
function getPreviewInfo(slide) {
  if (!slide) return { type: 'color', value: '#1e1e2e' };
  const bg = slide.background;
  if (bg.type === 'gradient') return { type: 'gradient', from: bg.from, to: bg.to, dir: bg.dir };
  if (bg.type === 'color') return { type: 'color', value: bg.value };
  return { type: 'color', value: '#1e1e2e' };
}

// Remove large base64 images from slides to keep localStorage lean
function compactSlides(slides) {
  return slides.map(s => ({
    ...s,
    background: s.background.type === 'image'
      ? { type: 'color', value: '#1e1e2e' }
      : s.background,
    elements: s.elements.map(el => {
      if (el.type === 'image') {
        // Keep images but try to flag them; they may be large
        return { ...el };
      }
      return { ...el };
    })
  }));
}

function historyDelete(id) {
  const entries = historyLoad().filter(e => e.id !== id);
  historySave(entries);
}

function historyClearAll() {
  localStorage.removeItem(HISTORY_KEY);
}

// ===== LOAD A PRESENTATION FROM HISTORY =====
function historyOpen(entry) {
  if (!entry || !entry.slides) return;
  // Deep copy to avoid mutating stored data
  state.slides = JSON.parse(JSON.stringify(entry.slides));
  state.currentSlide = 0;
  state.selectedElement = null;
  // Update title
  const titleEl = document.getElementById('pres-title');
  if (titleEl) titleEl.value = entry.title || 'Sin título';
  // Save to current slot too
  saveToStorage();
  closeModal('history-modal');
  showEditor();
  renderAll();
}

// ===== RENDER HELPERS =====

function bgToCss(preview) {
  if (!preview) return '#1e1e2e';
  if (preview.type === 'gradient') {
    return `linear-gradient(${preview.dir || 'to bottom right'}, ${preview.from}, ${preview.to})`;
  }
  return preview.value || '#1e1e2e';
}

function formatDate(iso) {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now - d;
    const diffMin = Math.floor(diffMs / 60000);
    const diffH = Math.floor(diffMs / 3600000);
    const diffD = Math.floor(diffMs / 86400000);
    if (diffMin < 1) return 'Ahora mismo';
    if (diffMin < 60) return `Hace ${diffMin} min`;
    if (diffH < 24) return `Hace ${diffH}h`;
    if (diffD === 1) return 'Ayer';
    if (diffD < 7) return `Hace ${diffD} días`;
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch(e) { return ''; }
}

// ===== RENDER HOME HISTORY GRID (compact, last 4) =====
function renderHomeHistory() {
  const grid = document.getElementById('home-history-grid');
  if (!grid) return;
  const entries = historyLoad();
  grid.innerHTML = '';

  if (entries.length === 0) {
    grid.innerHTML = '<div class="hist-empty-msg">No hay presentaciones guardadas aún. ¡Crea una!</div>';
    return;
  }

  // Show latest 4
  entries.slice(0, 4).forEach(entry => {
    grid.appendChild(buildHistoryCard(entry, true));
  });
}

// ===== RENDER FULL HISTORY MODAL GRID =====
function renderHistoryModal() {
  const grid = document.getElementById('hist-modal-grid');
  const countEl = document.getElementById('hist-count');
  if (!grid) return;
  const entries = historyLoad();
  grid.innerHTML = '';

  if (countEl) countEl.textContent = `${entries.length} presentación${entries.length !== 1 ? 'es' : ''} guardada${entries.length !== 1 ? 's' : ''}`;

  if (entries.length === 0) {
    grid.innerHTML = '<div class="hist-empty-msg">No hay presentaciones en el historial.</div>';
    return;
  }

  entries.forEach(entry => {
    grid.appendChild(buildHistoryCard(entry, false));
  });
}

// Build a single history card element
function buildHistoryCard(entry, compact) {
  const card = document.createElement('div');
  card.className = 'hist-card';

  // Thumbnail
  const thumb = document.createElement('div');
  thumb.className = 'hist-thumb';
  thumb.style.background = bgToCss(entry.preview);

  // Slide count badge
  const badge = document.createElement('div');
  badge.className = 'hist-thumb-badge';
  badge.textContent = `${entry.slideCount} slide${entry.slideCount !== 1 ? 's' : ''}`;
  thumb.appendChild(badge);

  // Click thumb to open
  thumb.addEventListener('click', () => historyOpen(entry));
  card.appendChild(thumb);

  // Info row
  const info = document.createElement('div');
  info.className = 'hist-info';

  const titleEl = document.createElement('div');
  titleEl.className = 'hist-title';
  titleEl.textContent = entry.title || 'Sin título';
  titleEl.title = entry.title;

  const dateEl = document.createElement('div');
  dateEl.className = 'hist-date';
  dateEl.textContent = formatDate(entry.date);

  info.appendChild(titleEl);
  info.appendChild(dateEl);

  // Actions
  const actions = document.createElement('div');
  actions.className = 'hist-actions';

  const openBtn = document.createElement('button');
  openBtn.className = 'hist-btn hist-open-btn';
  openBtn.innerHTML = '<i class="fa-solid fa-folder-open"></i> Abrir';
  openBtn.addEventListener('click', () => historyOpen(entry));

  const delBtn = document.createElement('button');
  delBtn.className = 'hist-btn hist-del-btn';
  delBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
  delBtn.title = 'Eliminar del historial';
  delBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    historyDelete(entry.id);
    renderHomeHistory();
    renderHistoryModal();
    // Also update for home if visible
  });

  actions.appendChild(openBtn);
  actions.appendChild(delBtn);

  card.appendChild(info);
  card.appendChild(actions);

  return card;
}

// ===== HOOK INTO SAVE: auto-save to history =====
// Patch saveToStorage to also push to history
document.addEventListener('DOMContentLoaded', () => {
  // Render home history on load
  renderHomeHistory();

  // Wire history buttons
  document.getElementById('btn-history-manage')?.addEventListener('click', () => {
    renderHistoryModal();
    openModal('history-modal');
  });

  document.getElementById('btn-hist-clear-all')?.addEventListener('click', () => {
    if (confirm('¿Borrar todo el historial? Esta acción no se puede deshacer.')) {
      historyClearAll();
      renderHomeHistory();
      renderHistoryModal();
    }
  });

  // Auto-refresh home history when returning to home
  document.getElementById('btn-home')?.addEventListener('click', () => {
    historyPush(); // save current before going home
    setTimeout(renderHomeHistory, 100);
  });
});

// showHome in app.js already calls historyPush() and renderHomeHistory()
// No override needed here.

