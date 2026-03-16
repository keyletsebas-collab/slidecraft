// ===============================================================
// SlideCraft – app.js  (Part 1: State, Slide Engine, Canvas)
// ===============================================================

// ===== STATE =====
let state = {
  slides: [],
  currentSlide: 0,
  selectedElement: null,
  zoom: 1,
  history: [],
  historyIndex: -1,
  codeMode: 'json',
  projecting: false
};

const CANVAS_W = 960, CANVAS_H = 540;

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  initState();
  bindHomeScreen();
  bindToolbar();
  bindSlidePanel();
  bindPropsPanel();
  bindModals();
  bindProjection();
  bindZoom();
  bindExport();
  loadFromStorage();
});

function initState() {
  state.slides = [createBlankSlide()];
  state.currentSlide = 0;
  state.selectedElement = null;
}

function createBlankSlide(title = '') {
  return {
    id: Date.now() + Math.random(),
    background: { type: 'color', value: '#1e1e2e' },
    transition: 'fade',
    notes: '',
    elements: title ? [
      createTextElement('Haz clic para escribir un título', 40, 220, 880, 80, 40, '#ffffff', 'center', true),
      createTextElement('Subtítulo de la diapositiva', 40, 320, 880, 50, 24, '#94a3b8', 'center', false)
    ] : []
  };
}

function createTextElement(text, x, y, w, h, fontSize, color, align, bold) {
  return {
    id: Date.now() + Math.random(),
    type: 'text',
    x, y, w, h,
    text,
    fontSize: fontSize || 24,
    fontFamily: 'Inter',
    color: color || '#ffffff',
    align: align || 'left',
    bold: !!bold,
    italic: false,
    underline: false,
    opacity: 1,
    rotation: 0
  };
}

function createImageElement(src, x, y, w, h) {
  return { id: Date.now() + Math.random(), type: 'image', x, y, w, h, src, opacity: 1, rotation: 0 };
}

function createShapeElement(shape, x, y, w, h, color) {
  return { id: Date.now() + Math.random(), type: 'shape', shape, x, y, w, h, color, opacity: 1, rotation: 0 };
}

function createTableElement(x, y, w, h) {
  return {
    id: Date.now() + Math.random(),
    type: 'table',
    x, y, w, h,
    rows: 3,
    cols: 3,
    data: [['', '', ''], ['', '', ''], ['', '', '']],
    opacity: 1,
    rotation: 0
  };
}

function createCounterElement(x, y, w, h) {
  return {
    id: Date.now() + Math.random(),
    type: 'counter',
    x, y, w, h,
    count: 0,
    fontSize: 48,
    color: '#6366f1',
    opacity: 1,
    rotation: 0
  };
}

// ===== HOME SCREEN =====
function bindHomeScreen() {
  document.getElementById('btn-new-blank').addEventListener('click', () => {
    state.slides = [createBlankSlide('title')];
    state.currentSlide = 0;
    showEditor();
    renderAll();
  });
  document.getElementById('btn-code-create').addEventListener('click', () => {
    showEditor();
    openModal('code-modal');
    loadCodeExample();
  });
}

function showEditor() {
  document.getElementById('home-screen').classList.add('hidden');
  document.getElementById('editor-screen').classList.remove('hidden');
  renderAll();
}

function showHome() {
  document.getElementById('editor-screen').classList.add('hidden');
  document.getElementById('home-screen').classList.remove('hidden');
  // Auto-save current presentation to history before returning home
  if (typeof historyPush === 'function') {
    historyPush();
    setTimeout(() => {
      if (typeof renderHomeHistory === 'function') renderHomeHistory();
    }, 50);
  }
}

// ===== RENDER ALL =====
function renderAll() {
  renderSlideList();
  renderCurrentSlide();
  updatePropsPanel();
}

// ===== SLIDE LIST =====
function renderSlideList() {
  const list = document.getElementById('slide-list');
  list.innerHTML = '';
  state.slides.forEach((slide, i) => {
    const thumb = document.createElement('div');
    thumb.className = 'slide-thumb' + (i === state.currentSlide ? ' active' : '');
    thumb.innerHTML = `<div class="slide-thumb-number">${i + 1}</div>`;

    // Mini canvas preview
    const miniCanvas = document.createElement('div');
    miniCanvas.className = 'slide-thumb-canvas';
    miniCanvas.style.cssText = `
      position:relative; width:${CANVAS_W}px; height:${CANVAS_H}px;
      transform: scale(${180/CANVAS_W}); transform-origin:top left;
      overflow:hidden; pointer-events:none;
    `;
    applyBackground(miniCanvas, slide.background);
    slide.elements.forEach(el => miniCanvas.appendChild(buildElementNode(el, false)));
    thumb.appendChild(miniCanvas);

    thumb.addEventListener('click', () => {
      state.currentSlide = i;
      state.selectedElement = null;
      renderAll();
    });

    // Context menu for delete
    thumb.addEventListener('contextmenu', e => {
      e.preventDefault();
      if (state.slides.length > 1) {
        state.slides.splice(i, 1);
        if (state.currentSlide >= state.slides.length) state.currentSlide = state.slides.length - 1;
        renderAll();
      }
    });

    list.appendChild(thumb);
  });
}

// ===== RENDER CURRENT SLIDE =====
function renderCurrentSlide() {
  const canvas = document.getElementById('slide-canvas');
  canvas.innerHTML = '';
  const slide = getCurrentSlide();
  if (!slide) return;

  applyBackground(canvas, slide.background);
  slide.elements.forEach(el => {
    const node = buildElementNode(el, true);
    canvas.appendChild(node);
  });

  canvas.style.transform = `scale(${state.zoom})`;
  updatePropsPanelSlide();
}

function getCurrentSlide() {
  return state.slides[state.currentSlide];
}

// ===== APPLY BACKGROUND =====
function applyBackground(el, bg) {
  if (!bg) return;
  if (bg.type === 'color') {
    el.style.background = bg.value;
  } else if (bg.type === 'gradient') {
    el.style.background = `linear-gradient(${bg.dir}, ${bg.from}, ${bg.to})`;
  } else if (bg.type === 'image') {
    el.style.background = `url('${bg.value}') center/cover no-repeat`;
  }
}

// ===== BUILD ELEMENT NODE =====
function buildElementNode(el, interactive) {
  const wrapper = document.createElement('div');
  wrapper.className = 'slide-element';
  wrapper.dataset.id = el.id;
  wrapper.style.cssText = `
    left:${el.x}px; top:${el.y}px; width:${el.w}px; height:${el.h}px;
    opacity:${el.opacity ?? 1};
    transform:rotate(${el.rotation || 0}deg);
  `;

  if (el.id === state.selectedElement) wrapper.classList.add('selected');

  if (el.type === 'text') {
    const div = document.createElement('div');
    div.className = 'el-text';
    div.contentEditable = interactive ? 'true' : 'false';
    div.innerText = el.text;
    div.style.cssText = `
      font-size:${el.fontSize}px; font-family:${el.fontFamily};
      color:${el.color}; text-align:${el.align};
      font-weight:${el.bold ? 'bold' : 'normal'};
      font-style:${el.italic ? 'italic' : 'normal'};
      text-decoration:${el.underline ? 'underline' : 'none'};
      width:100%; height:100%; overflow:hidden;
    `;
    if (interactive) {
      div.addEventListener('input', () => { el.text = div.innerText; renderSlideList(); });
      div.addEventListener('focus', () => wrapper.classList.add('selected'));
    }
    wrapper.appendChild(div);
  } else if (el.type === 'image') {
    const img = document.createElement('img');
    img.className = 'el-image';
    img.src = el.src;
    img.draggable = false;
    wrapper.appendChild(img);
  } else if (el.type === 'shape') {
    wrapper.appendChild(buildShape(el));
  } else if (el.type === 'table') {
    const table = document.createElement('table');
    table.className = 'el-table';
    for (let r = 0; r < el.rows; r++) {
      const tr = document.createElement('tr');
      for (let c = 0; c < el.cols; c++) {
        const td = document.createElement('td');
        td.contentEditable = interactive ? 'true' : 'false';
        td.innerText = el.data[r][c] || '';
        if (interactive) {
          td.addEventListener('input', () => {
            el.data[r][c] = td.innerText;
            renderSlideList();
          });
        }
        tr.appendChild(td);
      }
      table.appendChild(tr);
    }
    wrapper.appendChild(table);
  } else if (el.type === 'counter') {
    const container = document.createElement('div');
    container.className = 'el-counter';
    
    const countVal = document.createElement('div');
    countVal.className = 'counter-value';
    countVal.innerText = el.count;
    countVal.style.fontSize = el.fontSize + 'px';
    countVal.style.color = el.color;
    
    if (interactive) {
      const btnMinus = document.createElement('button');
      btnMinus.innerHTML = '-';
      btnMinus.addEventListener('click', (e) => { e.stopPropagation(); el.count--; countVal.innerText = el.count; renderSlideList(); });
      
      const btnPlus = document.createElement('button');
      btnPlus.innerHTML = '+';
      btnPlus.addEventListener('click', (e) => { e.stopPropagation(); el.count++; countVal.innerText = el.count; renderSlideList(); });
      
      container.appendChild(btnMinus);
      container.appendChild(countVal);
      container.appendChild(btnPlus);
    } else {
      container.appendChild(countVal);
    }
    wrapper.appendChild(container);
  }

  if (interactive) {
    // Resize handle
    const handle = document.createElement('div');
    handle.className = 'resize-handle';
    wrapper.appendChild(handle);

    wrapper.addEventListener('mousedown', e => {
      if (e.target === handle) return startResize(e, el, wrapper);
      if (e.target.contentEditable === 'true') return;
      selectElement(el.id);
      startDrag(e, el, wrapper);
    });

    wrapper.addEventListener('click', e => {
      e.stopPropagation();
      selectElement(el.id);
    });
  }

  return wrapper;
}

function buildShape(el) {
  const d = document.createElement('div');
  if (el.shape === 'rect') {
    d.className = 'sh-rect-el';
    d.style.background = el.color || '#6366f1';
  } else if (el.shape === 'circle') {
    d.className = 'sh-circle-el';
    d.style.background = el.color || '#8b5cf6';
  } else if (el.shape === 'triangle') {
    d.className = 'sh-triangle-el';
    d.style.cssText = `width:0;height:0;border-left:${el.w/2}px solid transparent;border-right:${el.w/2}px solid transparent;border-bottom:${el.h}px solid ${el.color || '#ec4899'}`;
  } else if (el.shape === 'line') {
    d.className = 'sh-line-el';
    d.style.background = el.color || '#06b6d4';
    d.style.marginTop = el.h/2 - 2 + 'px';
  } else if (el.shape === 'star') {
    d.className = 'sh-star-el';
    d.textContent = '★';
    d.style.color = el.color || '#f59e0b';
    d.style.fontSize = Math.min(el.w, el.h) + 'px';
  } else if (el.shape === 'arrow') {
    d.className = 'sh-arrow-el';
    d.textContent = '→';
    d.style.color = el.color || '#22c55e';
    d.style.fontSize = Math.min(el.w, el.h) * 0.8 + 'px';
  }
  return d;
}

// ===== SELECT ELEMENT =====
function selectElement(id) {
  state.selectedElement = id;
  renderCurrentSlide();
  renderSlideList();
  updatePropsPanel();
}

document.addEventListener('click', e => {
  if (e.target.id === 'slide-canvas' || e.target.closest('#slide-canvas') === null) {
    if (!e.target.closest('.slide-element') && !e.target.closest('.props-panel')) {
      state.selectedElement = null;
      renderCurrentSlide();
      renderSlideList();
      updatePropsPanel();
    }
  }
});

// ===== DRAG =====
function startDrag(e, el, wrapper) {
  e.preventDefault();
  const startX = e.clientX - el.x * state.zoom;
  const startY = e.clientY - el.y * state.zoom;

  function onMove(me) {
    el.x = Math.round((me.clientX - startX) / state.zoom);
    el.y = Math.round((me.clientY - startY) / state.zoom);
    wrapper.style.left = el.x + 'px';
    wrapper.style.top = el.y + 'px';
    updateElPositionInputs(el);
  }
  function onUp() {
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
    renderSlideList();
  }
  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onUp);
}

// ===== RESIZE =====
function startResize(e, el, wrapper) {
  e.preventDefault();
  const startX = e.clientX, startY = e.clientY;
  const startW = el.w, startH = el.h;
  function onMove(me) {
    el.w = Math.max(40, startW + (me.clientX - startX) / state.zoom);
    el.h = Math.max(20, startH + (me.clientY - startY) / state.zoom);
    wrapper.style.width = el.w + 'px';
    wrapper.style.height = el.h + 'px';
    updateElSizeInputs(el);
  }
  function onUp() {
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
    renderAll();
  }
  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onUp);
}

// ===== TOOLBAR =====
function bindToolbar() {
  document.getElementById('btn-home').addEventListener('click', () => {
    saveToStorage();
    showHome();
  });

  document.getElementById('tb-text').addEventListener('click', () => {
    const slide = getCurrentSlide();
    const el = createTextElement('Nuevo texto', 80, 80, 400, 60, 28, '#ffffff', 'left', false);
    slide.elements.push(el);
    selectElement(el.id);
    saveToStorage();
  });

  document.getElementById('tb-image').addEventListener('click', () => {
    document.getElementById('img-upload').click();
  });
  document.getElementById('img-upload').addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const el = createImageElement(ev.target.result, 80, 80, 400, 280);
      getCurrentSlide().elements.push(el);
      selectElement(el.id);
      saveToStorage();
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  });

  document.getElementById('tb-shape').addEventListener('click', () => openModal('shape-modal'));
  
  document.getElementById('tb-table').addEventListener('click', () => {
    const el = createTableElement(100, 100, 400, 200);
    getCurrentSlide().elements.push(el);
    selectElement(el.id);
    saveToStorage();
  });

  document.getElementById('tb-counter').addEventListener('click', () => {
    const el = createCounterElement(100, 100, 200, 100);
    getCurrentSlide().elements.push(el);
    selectElement(el.id);
    saveToStorage();
  });

  document.getElementById('tb-code').addEventListener('click', () => { openModal('code-modal'); loadCodeExample(); });

  document.getElementById('btn-add-slide').addEventListener('click', () => {
    state.slides.push(createBlankSlide());
    state.currentSlide = state.slides.length - 1;
    renderAll();
    saveToStorage();
  });

  document.getElementById('btn-home-nav')?.addEventListener('click', showHome);
}

// ===== ZOOM =====
function bindZoom() {
  document.getElementById('zoom-in').addEventListener('click', () => {
    state.zoom = Math.min(2, +(state.zoom + 0.1).toFixed(1));
    updateZoom();
  });
  document.getElementById('zoom-out').addEventListener('click', () => {
    state.zoom = Math.max(0.3, +(state.zoom - 0.1).toFixed(1));
    updateZoom();
  });
  document.getElementById('zoom-fit').addEventListener('click', () => {
    const wrapper = document.getElementById('canvas-wrapper');
    const scaleX = (wrapper.clientWidth - 80) / CANVAS_W;
    const scaleY = (wrapper.clientHeight - 80) / CANVAS_H;
    state.zoom = Math.min(scaleX, scaleY);
    updateZoom();
  });
}

function updateZoom() {
  document.getElementById('zoom-label').textContent = Math.round(state.zoom * 100) + '%';
  document.getElementById('slide-canvas').style.transform = `scale(${state.zoom})`;
}

// ===== SLIDE PANEL =====
function bindSlidePanel() {
  document.getElementById('btn-delete-slide').addEventListener('click', deleteCurrentSlide);
}

function deleteCurrentSlide() {
  if (state.slides.length <= 1) return;
  state.slides.splice(state.currentSlide, 1);
  if (state.currentSlide >= state.slides.length) state.currentSlide = state.slides.length - 1;
  state.selectedElement = null;
  renderAll();
  saveToStorage();
}

// ===== PROPERTIES PANEL =====
function bindPropsPanel() {
  // Tab switching
  document.querySelectorAll('.props-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.props-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const which = tab.dataset.tab;
      document.getElementById('slide-props').classList.toggle('hidden', which !== 'slide');
      document.getElementById('element-props').classList.toggle('hidden', which !== 'element');
    });
  });

  // Background color
  document.getElementById('bg-color').addEventListener('input', e => {
    getCurrentSlide().background = { type: 'color', value: e.target.value };
    renderCurrentSlide();
    renderSlideList();
    saveToStorage();
  });

  // Gradient button
  document.getElementById('bg-gradient').addEventListener('click', () => openModal('gradient-modal'));

  // Background image
  document.getElementById('bg-image-btn').addEventListener('click', () => {
    document.getElementById('bg-image-file').click();
  });
  document.getElementById('bg-image-file').addEventListener('change', e => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      getCurrentSlide().background = { type: 'image', value: ev.target.result };
      renderCurrentSlide(); renderSlideList(); saveToStorage();
    };
    reader.readAsDataURL(file);
  });

  // Transition
  document.getElementById('slide-transition').addEventListener('change', e => {
    getCurrentSlide().transition = e.target.value;
    saveToStorage();
  });

  // Speaker notes
  document.getElementById('speaker-notes').addEventListener('input', e => {
    getCurrentSlide().notes = e.target.value;
    saveToStorage();
  });

  // Element position/size
  ['el-x','el-y','el-w','el-h'].forEach(id => {
    document.getElementById(id).addEventListener('change', () => applyElPosSize());
  });

  // Element text properties
  document.getElementById('el-font').addEventListener('change', e => {
    const el = getSelectedEl(); if (!el || el.type !== 'text') return;
    el.fontFamily = e.target.value; renderAll(); saveToStorage();
  });
  document.getElementById('el-fontsize').addEventListener('change', e => {
    const el = getSelectedEl(); if (!el || el.type !== 'text') return;
    el.fontSize = +e.target.value; renderAll(); saveToStorage();
  });
  document.getElementById('el-color').addEventListener('input', e => {
    const el = getSelectedEl(); if (!el || el.type !== 'text') return;
    el.color = e.target.value; renderAll(); saveToStorage();
  });

  document.querySelectorAll('.fmt-btn[data-fmt]').forEach(btn => {
    btn.addEventListener('click', () => {
      const el = getSelectedEl(); if (!el || el.type !== 'text') return;
      const fmt = btn.dataset.fmt;
      el[fmt] = !el[fmt];
      btn.classList.toggle('active', el[fmt]);
      renderAll(); saveToStorage();
    });
  });
  document.querySelectorAll('.fmt-btn[data-align]').forEach(btn => {
    btn.addEventListener('click', () => {
      const el = getSelectedEl(); if (!el || el.type !== 'text') return;
      el.align = btn.dataset.align;
      renderAll(); saveToStorage();
    });
  });

  // Opacity and rotation
  document.getElementById('el-opacity').addEventListener('input', e => {
    const el = getSelectedEl(); if (!el) return;
    el.opacity = e.target.value / 100; renderAll(); saveToStorage();
  });
  document.getElementById('el-rotation').addEventListener('input', e => {
    const el = getSelectedEl(); if (!el) return;
    el.rotation = +e.target.value; renderAll(); saveToStorage();
  });

  // Delete element
  document.getElementById('btn-delete-el').addEventListener('click', () => {
    if (!state.selectedElement) return;
    const slide = getCurrentSlide();
    slide.elements = slide.elements.filter(e => e.id !== state.selectedElement);
    state.selectedElement = null;
    renderAll(); saveToStorage();
  });
}

function getSelectedEl() {
  if (!state.selectedElement) return null;
  return getCurrentSlide().elements.find(e => e.id === state.selectedElement);
}

function updatePropsPanel() {
  updatePropsPanelSlide();
  updatePropsPanelElement();
}

function updatePropsPanelSlide() {
  const slide = getCurrentSlide();
  if (!slide) return;
  if (slide.background.type === 'color') {
    document.getElementById('bg-color').value = slide.background.value || '#1e1e2e';
  }
  document.getElementById('slide-transition').value = slide.transition || 'none';
  document.getElementById('speaker-notes').value = slide.notes || '';
}

function updatePropsPanelElement() {
  const el = getSelectedEl();
  const panel = document.getElementById('element-props');
  const textProps = document.getElementById('text-props');
  if (!el) { panel.classList.add('hidden'); return;}
  panel.classList.remove('hidden');
  document.getElementById('el-x').value = Math.round(el.x);
  document.getElementById('el-y').value = Math.round(el.y);
  document.getElementById('el-w').value = Math.round(el.w);
  document.getElementById('el-h').value = Math.round(el.h);
  document.getElementById('el-opacity').value = Math.round((el.opacity ?? 1) * 100);
  document.getElementById('el-rotation').value = el.rotation || 0;
  if (el.type === 'text') {
    textProps.classList.remove('hidden');
    document.getElementById('el-font').value = el.fontFamily || 'Inter';
    document.getElementById('el-fontsize').value = el.fontSize || 24;
    document.getElementById('el-color').value = el.color || '#ffffff';
    document.querySelectorAll('.fmt-btn[data-fmt]').forEach(b => {
      b.classList.toggle('active', !!el[b.dataset.fmt]);
    });
  } else {
    textProps.classList.add('hidden');
  }
}

function updateElPositionInputs(el) {
  document.getElementById('el-x').value = Math.round(el.x);
  document.getElementById('el-y').value = Math.round(el.y);
}
function updateElSizeInputs(el) {
  document.getElementById('el-w').value = Math.round(el.w);
  document.getElementById('el-h').value = Math.round(el.h);
}
function applyElPosSize() {
  const el = getSelectedEl(); if (!el) return;
  el.x = +document.getElementById('el-x').value;
  el.y = +document.getElementById('el-y').value;
  el.w = +document.getElementById('el-w').value;
  el.h = +document.getElementById('el-h').value;
  renderAll(); saveToStorage();
}

// ===== MODALS =====
function bindModals() {
  // Close buttons
  document.querySelectorAll('.close-modal, .cancel-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.modal;
      if (id) closeModal(id);
    });
  });

  // Gradient modal
  const updateGradPreview = () => {
    const f = document.getElementById('gm-from').value;
    const t = document.getElementById('gm-to').value;
    const d = document.getElementById('gm-dir').value;
    document.getElementById('gm-preview').style.background = `linear-gradient(${d}, ${f}, ${t})`;
  };
  ['gm-from','gm-to','gm-dir'].forEach(id => {
    document.getElementById(id).addEventListener('input', updateGradPreview);
    document.getElementById(id).addEventListener('change', updateGradPreview);
  });
  document.getElementById('btn-apply-gradient').addEventListener('click', () => {
    const f = document.getElementById('gm-from').value;
    const t = document.getElementById('gm-to').value;
    const d = document.getElementById('gm-dir').value;
    getCurrentSlide().background = { type: 'gradient', from: f, to: t, dir: d };
    renderCurrentSlide(); renderSlideList(); saveToStorage();
    closeModal('gradient-modal');
  });

  // Shape modal
  document.querySelectorAll('.shape-opt').forEach(opt => {
    opt.addEventListener('click', () => {
      const shape = opt.dataset.shape;
      const color = document.getElementById('shape-color').value;
      const el = createShapeElement(shape, 100, 100, 200, 150, color);
      getCurrentSlide().elements.push(el);
      selectElement(el.id);
      closeModal('shape-modal');
      saveToStorage();
    });
  });

  // Export dropdown
  document.getElementById('tb-export').addEventListener('click', e => {
    e.stopPropagation();
    document.getElementById('export-menu').classList.toggle('open');
  });
  document.addEventListener('click', () => {
    document.getElementById('export-menu').classList.remove('open');
  });
}

function openModal(id) { document.getElementById(id).classList.remove('hidden'); }
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

// ===== STORAGE =====
function saveToStorage() {
  try {
    const data = { slides: state.slides, title: document.getElementById('pres-title')?.value };
    const str = JSON.stringify(data);
    if (str.length < 5 * 1024 * 1024) localStorage.setItem('slidecraft_pres', str);
  } catch(e) { console.warn('Storage full or error:', e); }
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem('slidecraft_pres');
    if (!raw) return;
    const data = JSON.parse(raw);
    if (data.slides && data.slides.length) {
      state.slides = data.slides;
      state.currentSlide = 0;
    }
    if (data.title) {
      const el = document.getElementById('pres-title');
      if (el) el.value = data.title;
    }
  } catch(e) { console.warn('Load error:', e); }
}
