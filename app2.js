
// ===============================================================
// SlideCraft – app2.js  (Part 2: Code, Export, Projection)
// ===============================================================

// ===== CODE CREATION – SlideScript DSL =====
// Format: simple indented lines, no JSON/Markdown needed.
const SLIDESCRIPT_EXAMPLE = `
=== SLIDE ===
bg: #0f0f1a
transition: fade
note: Esta es la diapositiva de título

title: Título Principal
  color: #ffffff
  size: 48
  bold: true
  align: center
  y: 200

subtitle: Subtítulo de la presentación
  color: #94a3b8
  size: 24
  align: center

=== SLIDE ===
bg: #1a1a2e
transition: fade

title: Slide 2 – Contenido
  color: #6366f1
  bold: true

bullet: Primera característica importante
bullet: Segunda característica clave
bullet: Tercera característica destacada

=== SLIDE ===
bg: linear-gradient(#0d1b2a, #16213e)
transition: zoom

title: Estadística
  color: #ffffff
  bold: true

text: 98%
  color: #6366f1
  size: 140
  bold: true
  align: center
  y: 100
  x: 0
  w: 960
  h: 200

text: de personas eligen esta opción
  color: #94a3b8
  size: 26
  align: center
  y: 320
  x: 40
  w: 880

=== SLIDE ===
bg: #0a0a14

title: Conclusión
  color: #6366f1
  bold: true
  align: center

bullet: Punto final 1
bullet: Punto final 2
bullet: Punto final 3

text: ¡Gracias!
  color: #8b5cf6
  size: 36
  bold: true
  align: center
  y: 460
  x: 0
  w: 960
`.trim();

function loadCodeExample() {
  setCodeEditor(SLIDESCRIPT_EXAMPLE);
}

function setCodeEditor(val) {
  document.getElementById('code-editor').value = val;
}

document.addEventListener('DOMContentLoaded', () => {
  // Only one mode now: SlideScript
  document.querySelectorAll('.code-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.code-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      if (btn.dataset.mode === 'example') setCodeEditor(SLIDESCRIPT_EXAMPLE);
    });
  });

  document.getElementById('btn-apply-code').addEventListener('click', applyCode);
});

function applyCode() {
  const raw = document.getElementById('code-editor').value.trim();
  const errEl = document.getElementById('code-error');
  errEl.classList.add('hidden');

  try {
    const slides = parseSlideScript(raw);
    if (!slides || slides.length === 0) throw new Error('No se encontraron diapositivas. Usa === SLIDE === para separar slides.');
    state.slides = slides;
    state.currentSlide = 0;
    state.selectedElement = null;
    renderAll();
    saveToStorage();
    closeModal('code-modal');
  } catch(e) {
    errEl.textContent = '⚠ Error: ' + e.message;
    errEl.classList.remove('hidden');
  }
}

// ===== SLIDESCRIPT PARSER =====
// Simple, forgiving line-by-line parser. No JSON, no Markdown.
function parseSlideScript(raw) {
  const lines = raw.split('\n');
  const slides = [];
  let currentSlide = null;
  let currentBlock = null; // { type, props }

  function flushBlock() {
    if (!currentBlock || !currentSlide) return;
    const p = currentBlock.props;
    const type = currentBlock.type;
    const id = Date.now() + Math.random();

    if (type === 'title') {
      currentSlide.elements.push(createTextElement(
        currentBlock.text,
        parseNum(p.x, 40), parseNum(p.y, currentSlide._titleY || 40),
        parseNum(p.w, 880), parseNum(p.h, 80),
        parseNum(p.size, 44), p.color || '#ffffff',
        p.align || 'center', parseBool(p.bold, true)
      ));
      currentSlide._bodyY = Math.max(currentSlide._bodyY || 0, parseNum(p.y, 40) + parseNum(p.h, 80) + 20);
    } else if (type === 'subtitle') {
      const y = parseNum(p.y, currentSlide._bodyY || 140);
      currentSlide.elements.push(createTextElement(
        currentBlock.text,
        parseNum(p.x, 40), y,
        parseNum(p.w, 880), parseNum(p.h, 55),
        parseNum(p.size, 26), p.color || '#94a3b8',
        p.align || 'center', parseBool(p.bold, false)
      ));
      currentSlide._bodyY = (currentSlide._bodyY || 140) + parseNum(p.h, 55) + 15;
    } else if (type === 'bullet') {
      const y = parseNum(p.y, currentSlide._bodyY || 160);
      currentSlide.elements.push(createTextElement(
        '• ' + currentBlock.text,
        parseNum(p.x, 80), y,
        parseNum(p.w, 800), parseNum(p.h, 55),
        parseNum(p.size, 22), p.color || '#e2e8f0',
        'left', parseBool(p.bold, false)
      ));
      currentSlide._bodyY = y + parseNum(p.h, 55) + 10;
    } else if (type === 'text') {
      const el = createTextElement(
        currentBlock.text,
        parseNum(p.x, 40), parseNum(p.y, currentSlide._bodyY || 160),
        parseNum(p.w, 880), parseNum(p.h, 60),
        parseNum(p.size, 24), p.color || '#ffffff',
        p.align || 'left', parseBool(p.bold, false)
      );
      el.italic = parseBool(p.italic, false);
      el.underline = parseBool(p.underline, false);
      if (p.font) el.fontFamily = p.font;
      currentSlide.elements.push(el);
      if (!p.y) currentSlide._bodyY = (currentSlide._bodyY || 160) + parseNum(p.h, 60) + 10;
    }
    currentBlock = null;
  }

  function parseNum(val, def) {
    if (val === undefined || val === null || val === '') return def;
    const n = parseFloat(val);
    return isNaN(n) ? def : n;
  }
  function parseBool(val, def) {
    if (val === undefined || val === null || val === '') return def;
    return val === 'true' || val === '1' || val === 'yes' || val === 'sí' || val === 'si';
  }

  function parseBg(bgStr) {
    if (!bgStr) return { type: 'color', value: '#1e1e2e' };
    bgStr = bgStr.trim();
    if (bgStr.startsWith('linear-gradient') || bgStr.startsWith('gradient(')) {
      // Parse simple gradient(from, to) or linear-gradient(dir, from, to)
      const m = bgStr.match(/linear-gradient\(([^,]+),\s*([^,]+),\s*([^)]+)\)/);
      if (m) return { type: 'gradient', dir: m[1].trim(), from: m[2].trim(), to: m[3].trim() };
      const m2 = bgStr.match(/gradient\(([^,]+),\s*([^)]+)\)/);
      if (m2) return { type: 'gradient', dir: 'to bottom', from: m2[1].trim(), to: m2[2].trim() };
    }
    return { type: 'color', value: bgStr };
  }

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    const trimmed = line.trim();

    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('#!')) continue;

    // Slide separator
    if (trimmed.match(/^={2,}\s*SLIDE\s*={2,}$/i)) {
      flushBlock();
      if (currentSlide) slides.push(currentSlide);
      currentSlide = {
        id: Date.now() + Math.random(),
        background: { type: 'color', value: '#1e1e2e' },
        transition: 'fade',
        notes: '',
        elements: [],
        _bodyY: 140,
        _titleY: 40
      };
      continue;
    }

    if (!currentSlide) {
      // Auto-create first slide if user forgot separator
      currentSlide = { id: Date.now() + Math.random(), background: { type: 'color', value: '#1e1e2e' }, transition: 'fade', notes: '', elements: [], _bodyY: 140, _titleY: 40 };
    }

    // Slide-level props (no leading whitespace)
    const isIndented = line.startsWith('  ') || line.startsWith('\t');

    if (!isIndented) {
      // Check for key: value slide props
      const kvMatch = trimmed.match(/^(bg|background|transition|note|notes):\s*(.*)$/i);
      if (kvMatch) {
        flushBlock();
        const key = kvMatch[1].toLowerCase();
        const val = kvMatch[2].trim();
        if (key === 'bg' || key === 'background') currentSlide.background = parseBg(val);
        else if (key === 'transition') currentSlide.transition = val;
        else if (key === 'note' || key === 'notes') currentSlide.notes = val;
        continue;
      }

      // Block starters
      const blockMatch = trimmed.match(/^(title|subtitle|text|bullet):\s*(.*)$/i);
      if (blockMatch) {
        flushBlock();
        currentBlock = { type: blockMatch[1].toLowerCase(), text: blockMatch[2].trim(), props: {} };
        // Auto-update bodyY for title
        if (currentBlock.type === 'title') currentSlide._titleY = 40;
        continue;
      }
    } else {
      // Indented: prop of current block
      if (currentBlock) {
        const propMatch = trimmed.match(/^([\w-]+):\s*(.*)$/);
        if (propMatch) {
          currentBlock.props[propMatch[1].toLowerCase()] = propMatch[2].trim();
        }
        continue;
      }
    }
  }

  flushBlock();
  if (currentSlide) slides.push(currentSlide);

  // Clean up internal tracking props
  slides.forEach(s => { delete s._bodyY; delete s._titleY; });

  return slides;
}

// ===== EXPORT =====
function bindExport() {}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('exp-pptx').addEventListener('click', exportPPTX);
  document.getElementById('exp-pdf').addEventListener('click', exportPDF);
  document.getElementById('exp-png').addEventListener('click', exportPNG);
});

async function exportPPTX() {
  document.getElementById('export-menu').classList.remove('open');
  const title = document.getElementById('pres-title').value || 'Presentación';

  let pptx;
  try {
    pptx = new PptxGenJS();
  } catch(e) {
    alert('Error al inicializar PptxGenJS: ' + e.message);
    return;
  }

  pptx.layout = 'LAYOUT_16x9';
  pptx.title = title;
  pptx.author = 'SlideCraft';

  for (const slide of state.slides) {
    const pSlide = pptx.addSlide();

    // Background color (PptxGenJS requires hex without #)
    try {
      if (slide.background.type === 'color') {
        pSlide.background = { color: slide.background.value.replace('#', '') };
      } else if (slide.background.type === 'gradient') {
        // PPTX doesn't support CSS gradients natively; use starting color
        pSlide.background = { color: (slide.background.from || '#1e1e2e').replace('#', '') };
      } else if (slide.background.type === 'image') {
        pSlide.background = { path: slide.background.value };
      }
    } catch(e) {
      pSlide.background = { color: '1e1e2e' };
    }

    for (const el of slide.elements) {
      // Convert from 960x540 canvas pixels to inches (16:9 = 10" x 5.625")
      const xIn = (el.x / 960) * 10;
      const yIn = (el.y / 540) * 5.625;
      const wIn = Math.max(0.1, (el.w / 960) * 10);
      const hIn = Math.max(0.1, (el.h / 540) * 5.625);

      try {
        if (el.type === 'text' && el.text) {
          const color = (el.color || '#ffffff').replace('#', '');
          const opts = {
            x: xIn, y: yIn, w: wIn, h: hIn,
            fontSize: Math.max(8, Math.round((el.fontSize || 24) * 0.75)),
            color: color,
            bold: !!el.bold,
            italic: !!el.italic,
            align: el.align || 'left',
            fontFace: el.fontFamily === 'Courier New' ? 'Courier New' : 'Arial',
            valign: 'top',
            wrap: true
          };
          if (el.underline) opts.underline = { style: 'sng', color: color };
          pSlide.addText(el.text, opts);

        } else if (el.type === 'image' && el.src) {
          pSlide.addImage({ path: el.src, x: xIn, y: yIn, w: wIn, h: hIn });

        } else if (el.type === 'shape') {
          // Use pptx.ShapeType enum for correct PptxGenJS v3 API
          const fillColor = (el.color || '#6366f1').replace('#', '');
          if (el.shape === 'line') {
            // Lines use addShape with line prop
            pSlide.addShape(pptx.ShapeType.line, {
              x: xIn, y: yIn + hIn / 2, w: wIn, h: 0,
              line: { color: fillColor, width: Math.max(1, Math.round(el.h || 2)) }
            });
          } else if (el.shape === 'circle') {
            pSlide.addShape(pptx.ShapeType.ellipse, {
              x: xIn, y: yIn, w: wIn, h: hIn,
              fill: { color: fillColor },
              line: { color: fillColor }
            });
          } else if (el.shape === 'roundrect') {
            pSlide.addShape(pptx.ShapeType.roundRect, {
              x: xIn, y: yIn, w: wIn, h: hIn,
              fill: { color: fillColor },
              line: { color: fillColor }
            });
          } else if (el.shape === 'diamond') {
            pSlide.addShape(pptx.ShapeType.diamond, {
              x: xIn, y: yIn, w: wIn, h: hIn,
              fill: { color: fillColor },
              line: { color: fillColor }
            });
          } else if (el.shape === 'pentagon') {
            pSlide.addShape(pptx.ShapeType.pentagon, {
              x: xIn, y: yIn, w: wIn, h: hIn,
              fill: { color: fillColor },
              line: { color: fillColor }
            });
          } else if (el.shape === 'hexagon') {
            pSlide.addShape(pptx.ShapeType.hexagon, {
              x: xIn, y: yIn, w: wIn, h: hIn,
              fill: { color: fillColor },
              line: { color: fillColor }
            });
          } else if (el.shape === 'bubble') {
            pSlide.addShape(pptx.ShapeType.wedgeRoundCallout, {
              x: xIn, y: yIn, w: wIn, h: hIn,
              fill: { color: fillColor },
              line: { color: fillColor }
            });
          } else {
            // Default: rect
            pSlide.addShape(pptx.ShapeType.rect, {
              x: xIn, y: yIn, w: wIn, h: hIn,
              fill: { color: fillColor },
              line: { color: fillColor }
            });
          }
        }
      } catch(elErr) {
        console.warn('Elemento omitido en PPTX:', elErr.message, el);
      }
    }

    if (slide.notes) {
      try { pSlide.addNotes(slide.notes); } catch(e) {}
    }
  }

  try {
    await pptx.writeFile({ fileName: title + '.pptx' });
  } catch(e) {
    alert('Error al guardar el archivo: ' + e.message);
  }
}

async function exportPDF() {
  document.getElementById('export-menu').classList.remove('open');
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [960, 540] });
  const title = document.getElementById('pres-title').value || 'Presentación';
  const origSlide = state.currentSlide;
  const origSelected = state.selectedElement;
  state.selectedElement = null;
  for (let i = 0; i < state.slides.length; i++) {
    state.currentSlide = i;
    renderCurrentSlide();
    const canvas = document.getElementById('slide-canvas');
    canvas.style.transform = 'scale(1)';
    await new Promise(r => setTimeout(r, 80));
    await html2canvas(canvas, { scale: 1, useCORS: true, backgroundColor: null }).then(c => {
      if (i > 0) pdf.addPage();
      pdf.addImage(c.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, 960, 540);
    });
  }
  state.currentSlide = origSlide;
  state.selectedElement = origSelected;
  renderCurrentSlide();
  updateZoom();
  pdf.save(title + '.pdf');
}

async function exportPNG() {
  document.getElementById('export-menu').classList.remove('open');
  const origSlide = state.currentSlide;
  const origSelected = state.selectedElement;
  state.selectedElement = null;
  for (let i = 0; i < state.slides.length; i++) {
    state.currentSlide = i;
    renderCurrentSlide();
    document.getElementById('slide-canvas').style.transform = 'scale(1)';
    await new Promise(r => setTimeout(r, 80));
    await html2canvas(document.getElementById('slide-canvas'), { scale: 1.5, useCORS: true }).then(c => {
      const a = document.createElement('a');
      a.href = c.toDataURL('image/png');
      a.download = `slide-${i+1}.png`;
      a.click();
    });
  }
  state.currentSlide = origSlide;
  state.selectedElement = origSelected;
  renderCurrentSlide();
  updateZoom();
}

// ===== PROJECTION / STUDY MODE =====
function bindProjection() {}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('tb-present').addEventListener('click', startProjection);
  document.getElementById('proj-prev').addEventListener('click', () => projNavigate(-1));
  document.getElementById('proj-next').addEventListener('click', () => projNavigate(1));
  document.getElementById('proj-exit').addEventListener('click', stopProjection);

  document.addEventListener('keydown', e => {
    if (!state.projecting) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') projNavigate(1);
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') projNavigate(-1);
    if (e.key === 'Escape') stopProjection();
  });

  // Laser pointer
  const projScreen = document.getElementById('projection-screen');
  const laser = document.getElementById('proj-laser');
  projScreen.addEventListener('mousemove', e => {
    if (!state.projecting) return;
    laser.style.left = e.clientX + 'px';
    laser.style.top = e.clientY + 'px';
    laser.classList.remove('hidden');
  });
  projScreen.addEventListener('mouseleave', () => laser.classList.add('hidden'));
});

let projCurrentSlide = 0;

function startProjection() {
  projCurrentSlide = state.currentSlide;
  state.projecting = true;
  const screen = document.getElementById('projection-screen');
  screen.classList.remove('hidden');
  if (screen.requestFullscreen) screen.requestFullscreen();
  else if (screen.webkitRequestFullscreen) screen.webkitRequestFullscreen();
  renderProjectionSlide();
}

function stopProjection() {
  state.projecting = false;
  document.getElementById('projection-screen').classList.add('hidden');
  if (document.exitFullscreen) document.exitFullscreen();
}

function projNavigate(dir) {
  projCurrentSlide = Math.max(0, Math.min(state.slides.length - 1, projCurrentSlide + dir));
  renderProjectionSlide();
}

function renderProjectionSlide() {
  const slide = state.slides[projCurrentSlide];
  if (!slide) return;

  const container = document.getElementById('proj-slide');

  // Transition animation
  const trans = slide.transition || 'none';
  container.className = 'proj-slide';
  if (trans === 'fade') container.classList.add('fade-in');
  else if (trans === 'slide') container.classList.add('slide-in');
  else if (trans === 'zoom') container.classList.add('zoom-in');

  // Build slide HTML
  container.innerHTML = '';
  applyBackground(container, slide.background);

  // Scale content to fill viewport
  const scaleX = window.innerWidth / CANVAS_W;
  const scaleY = window.innerHeight / CANVAS_H;
  const scale = Math.min(scaleX, scaleY);

  const inner = document.createElement('div');
  inner.style.cssText = `
    position:absolute;
    width:${CANVAS_W}px; height:${CANVAS_H}px;
    top:50%; left:50%;
    transform: translate(-50%, -50%) scale(${scale});
    transform-origin: center center;
  `;
  slide.elements.forEach(el => inner.appendChild(buildElementNode(el, false)));
  container.appendChild(inner);

  // Counter
  document.getElementById('proj-counter').textContent = `${projCurrentSlide + 1} / ${state.slides.length}`;

  // Notes
  const notesEl = document.getElementById('proj-notes');
  if (slide.notes && slide.notes.trim()) {
    notesEl.textContent = '📝 ' + slide.notes;
    notesEl.style.display = 'block';
  } else {
    notesEl.style.display = 'none';
  }
}

// ===== KEYBOARD SHORTCUTS (editor) =====
document.addEventListener('keydown', e => {
  if (state.projecting) return;
  const tag = document.activeElement?.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA') return;
  if ((e.ctrlKey || e.metaKey) && e.key === 'z') { /* undo placeholder */ }
  if (e.key === 'Delete' || e.key === 'Backspace') {
    if (state.selectedElement) {
      const slide = getCurrentSlide();
      slide.elements = slide.elements.filter(e => e.id !== state.selectedElement);
      state.selectedElement = null;
      renderAll();
      saveToStorage();
    }
  }
});

// ===== AUTO-SAVE TITLE =====
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('pres-title')?.addEventListener('input', () => saveToStorage());
});
