// ===============================================================
// SlideCraft – app3.js  (Text Styles, Layouts, Templates, Key)
// ===============================================================

document.addEventListener('DOMContentLoaded', () => {
  // Init all new features
  initTextStyles();
  initSlideLayouts();
  initTemplates();
  bindNewButtons();
});

// Save key whenever it changes (bridge to app2.js logic)
document.addEventListener('DOMContentLoaded', () => {});

// ===== BIND NEW BUTTONS =====
function bindNewButtons() {
  // Home screen → Templates
  document.getElementById('btn-templates-home')?.addEventListener('click', () => {
    showEditor();
    openModal('templates-modal');
    renderTemplatesModal();
  });

  // Toolbar → Templates
  document.getElementById('tb-templates')?.addEventListener('click', () => {
    openModal('templates-modal');
    renderTemplatesModal();
  });

  // Override text button to show style picker
  const tbText = document.getElementById('tb-text');
  if (tbText) {
    const cloned = tbText.cloneNode(true);
    tbText.parentNode.replaceChild(cloned, tbText);
    cloned.addEventListener('click', () => {
      openModal('text-style-modal');
    });
  }

  // Override add slide button to show layout picker
  const addSlideBtn = document.getElementById('btn-add-slide');
  if (addSlideBtn) {
    const cloned = addSlideBtn.cloneNode(true);
    addSlideBtn.parentNode.replaceChild(cloned, addSlideBtn);
    cloned.addEventListener('click', () => openModal('layout-modal'));
  }
}

// ===== TEXT STYLES =====
const TEXT_STYLES = [
  { label: 'Título', preview: 'Título', fontSize: 56, color: '#ffffff', bold: true, align: 'center', fontFamily: 'Inter', w: 880, h: 90, x: 40, y: 200 },
  { label: 'Subtítulo', preview: 'Subtítulo', fontSize: 32, color: '#94a3b8', bold: false, align: 'center', fontFamily: 'Inter', w: 880, h: 60, x: 40, y: 310 },
  { label: 'Encabezado', preview: 'Encabezado', fontSize: 40, color: '#6366f1', bold: true, align: 'left', fontFamily: 'Inter', w: 880, h: 70, x: 40, y: 40 },
  { label: 'Cuerpo', preview: 'Texto del cuerpo', fontSize: 22, color: '#e2e8f0', bold: false, align: 'left', fontFamily: 'Inter', w: 800, h: 55, x: 80, y: 150 },
  { label: 'Cita', preview: '"Cita inspiradora"', fontSize: 28, color: '#a78bfa', bold: false, italic: true, align: 'center', fontFamily: 'Georgia', w: 760, h: 100, x: 100, y: 190 },
  { label: 'Caption', preview: 'Pie de foto', fontSize: 16, color: '#64748b', bold: false, align: 'center', fontFamily: 'Inter', w: 600, h: 40, x: 180, y: 490 },
  { label: 'Bullet', preview: '• Punto clave', fontSize: 24, color: '#e2e8f0', bold: false, align: 'left', fontFamily: 'Inter', w: 800, h: 55, x: 80, y: 200 },
  { label: 'Número grande', preview: '01', fontSize: 96, color: '#6366f1', bold: true, align: 'center', fontFamily: 'Inter', w: 300, h: 130, x: 330, y: 180 },
  { label: 'Código', preview: 'const x = 42;', fontSize: 20, color: '#a5f3fc', bold: false, align: 'left', fontFamily: 'Courier New', w: 800, h: 55, x: 80, y: 240 },
];

function initTextStyles() {
  const grid = document.getElementById('text-style-grid');
  if (!grid) return;
  TEXT_STYLES.forEach(style => {
    const opt = document.createElement('div');
    opt.className = 'ts-opt';
    const preview = document.createElement('div');
    preview.textContent = style.preview;
    preview.style.cssText = `
      font-size:${Math.min(style.fontSize, 28)}px;
      font-family:${style.fontFamily};
      color:${style.color};
      font-weight:${style.bold ? 'bold':'normal'};
      font-style:${style.italic ? 'italic':'normal'};
      text-align:center; line-height:1.2;
      max-width:100%; overflow:hidden; white-space:nowrap; text-overflow:ellipsis;
    `;
    const label = document.createElement('div');
    label.className = 'ts-label';
    label.textContent = style.label;
    opt.appendChild(preview);
    opt.appendChild(label);
    opt.addEventListener('click', () => {
      const el = createTextElement(
        style.label === 'Bullet' ? '• Escribe tu punto aquí' :
        style.label === 'Cita' ? '"Escribe tu cita aquí"' :
        style.label === 'Número grande' ? '01' :
        style.label === 'Código' ? 'const variable = valor;' :
        'Escribe aquí...',
        style.x, style.y, style.w, style.h,
        style.fontSize, style.color, style.align, style.bold
      );
      el.fontFamily = style.fontFamily;
      el.italic = style.italic || false;
      getCurrentSlide().elements.push(el);
      selectElement(el.id);
      closeModal('text-style-modal');
      saveToStorage();
    });
    grid.appendChild(opt);
  });
}

// ===== SLIDE LAYOUTS =====
const SLIDE_LAYOUTS = [
  {
    name: 'Título', bg: '#1e1e2e',
    elements: [
      { type:'text', text:'Título principal', x:40, y:190, w:880, h:90, fontSize:52, color:'#fff', align:'center', bold:true },
      { type:'text', text:'Subtítulo de la presentación', x:40, y:300, w:880, h:50, fontSize:26, color:'#94a3b8', align:'center' }
    ]
  },
  {
    name: 'Contenido', bg: '#16213e',
    elements: [
      { type:'text', text:'Título del slide', x:40, y:30, w:880, h:70, fontSize:40, color:'#6366f1', align:'left', bold:true },
      { type:'shape', shape:'line', x:40, y:108, w:880, h:4, color:'#6366f1' },
      { type:'text', text:'• Punto 1\n• Punto 2\n• Punto 3', x:60, y:130, w:820, h:360, fontSize:26, color:'#e2e8f0', align:'left' }
    ]
  },
  {
    name: 'Dos columnas', bg: '#0f0f1a',
    elements: [
      { type:'text', text:'Título', x:40, y:30, w:880, h:70, fontSize:40, color:'#fff', align:'center', bold:true },
      { type:'text', text:'• Columna izquierda\n• Punto A\n• Punto B', x:40, y:120, w:420, h:380, fontSize:22, color:'#e2e8f0', align:'left' },
      { type:'text', text:'• Columna derecha\n• Punto C\n• Punto D', x:500, y:120, w:420, h:380, fontSize:22, color:'#a5f3fc', align:'left' }
    ]
  },
  {
    name: 'Imagen + Texto', bg: '#0d1b2a',
    elements: [
      { type:'shape', shape:'rect', x:40, y:40, w:420, h:460, color:'#1e3a5f' },
      { type:'text', text:'Tu imagen aquí', x:40, y:240, w:420, h:60, fontSize:18, color:'#64748b', align:'center' },
      { type:'text', text:'Título del contenido', x:500, y:80, w:420, h:70, fontSize:34, color:'#fff', align:'left', bold:true },
      { type:'text', text:'Descripción del contenido de esta diapositiva con información relevante.', x:500, y:170, w:420, h:280, fontSize:20, color:'#94a3b8', align:'left' }
    ]
  },
  {
    name: 'Cita', bg: '#1a0533',
    elements: [
      { type:'shape', shape:'rect', x:0, y:0, w:960, h:540, color:'#1a0533' },
      { type:'text', text:'"', x:40, y:80, w:120, h:180, fontSize:160, color:'#8b5cf6', align:'left', bold:true },
      { type:'text', text:'Una gran cita que inspira y motiva a tu audiencia.', x:60, y:160, w:840, h:180, fontSize:34, color:'#e2e8f0', align:'center', italic:true },
      { type:'text', text:'— Autor de la cita', x:40, y:430, w:880, h:50, fontSize:20, color:'#8b5cf6', align:'center', bold:true }
    ]
  },
  {
    name: 'Estadística', bg: '#0a0a14',
    elements: [
      { type:'text', text:'98%', x:0, y:100, w:960, h:200, fontSize:140, color:'#6366f1', align:'center', bold:true },
      { type:'text', text:'de usuarios prefieren este diseño', x:40, y:320, w:880, h:60, fontSize:28, color:'#94a3b8', align:'center' },
      { type:'shape', shape:'line', x:240, y:300, w:480, h:4, color:'#6366f1' }
    ]
  },
  {
    name: 'Título solo', bg: '#0d1b2a',
    elements: [
      { type:'text', text:'Sección', x:0, y:200, w:960, h:140, fontSize:72, color:'#fff', align:'center', bold:true }
    ]
  },
  {
    name: 'Conclusión', bg: '#0f0f1a',
    elements: [
      { type:'text', text:'Conclusiones', x:40, y:40, w:880, h:70, fontSize:44, color:'#6366f1', align:'center', bold:true },
      { type:'shape', shape:'line', x:200, y:118, w:560, h:3, color:'#6366f1' },
      { type:'text', text:'• Punto final 1\n• Punto final 2\n• Punto final 3', x:100, y:150, w:760, h:280, fontSize:24, color:'#e2e8f0', align:'left' },
      { type:'text', text:'¡Gracias!', x:0, y:450, w:960, h:60, fontSize:32, color:'#8b5cf6', align:'center', bold:true }
    ]
  }
];

function initSlideLayouts() {
  const grid = document.getElementById('layout-grid');
  if (!grid) return;
  SLIDE_LAYOUTS.forEach(layout => {
    const opt = document.createElement('div');
    opt.className = 'layout-opt';

    // Mini preview
    const preview = document.createElement('div');
    preview.className = 'layout-preview';
    preview.style.background = layout.bg;
    const inner = document.createElement('div');
    inner.style.cssText = `position:absolute;width:960px;height:518px;top:0;left:0;transform-origin:top left;transform:scale(${120/960})`;
    layout.elements.forEach(el => {
      const d = document.createElement('div');
      if (el.type === 'text') {
        d.style.cssText = `position:absolute;left:${el.x}px;top:${el.y}px;width:${el.w}px;height:${el.h}px;
          font-size:${el.fontSize}px;color:${el.color};font-weight:${el.bold?'bold':'normal'};
          font-style:${el.italic?'italic':'normal'};text-align:${el.align||'left'};
          overflow:hidden;white-space:pre-wrap;line-height:1.2;font-family:Inter,sans-serif;`;
        d.textContent = el.text;
      } else if (el.type === 'shape') {
        if (el.shape === 'rect') {
          d.style.cssText = `position:absolute;left:${el.x}px;top:${el.y}px;width:${el.w}px;height:${el.h}px;background:${el.color};border-radius:4px;`;
        } else if (el.shape === 'line') {
          d.style.cssText = `position:absolute;left:${el.x}px;top:${el.y}px;width:${el.w}px;height:${Math.max(el.h,4)}px;background:${el.color};border-radius:2px;`;
        }
      }
      inner.appendChild(d);
    });
    preview.appendChild(inner);
    opt.appendChild(preview);

    const label = document.createElement('div');
    label.className = 'lo-label';
    label.textContent = layout.name;
    opt.appendChild(label);

    opt.addEventListener('click', () => {
      const slide = {
        id: Date.now() + Math.random(),
        background: { type: 'color', value: layout.bg },
        transition: 'fade',
        notes: '',
        elements: layout.elements.map(el => {
          const e = { ...el, id: Date.now() + Math.random(), opacity: 1, rotation: 0, fontFamily: el.fontFamily || 'Inter', italic: el.italic || false, underline: false };
          return e;
        })
      };
      state.slides.push(slide);
      state.currentSlide = state.slides.length - 1;
      state.selectedElement = null;
      closeModal('layout-modal');
      renderAll();
      saveToStorage();
    });

    grid.appendChild(opt);
  });
}

// ===== TEMPLATES =====
const TEMPLATES = [
  {
    name: '🎬 Netflix Style',
    desc: 'Tema oscuro estilo streaming premium',
    color: '#141414',
    accent: '#e50914',
    slides: buildNetflixTemplate()
  },
  {
    name: '🌌 Galaxia Púrpura',
    desc: 'Diseño espacial con gradientes profundos',
    color: '#0d0021',
    accent: '#8b5cf6',
    slides: buildGalaxyTemplate()
  },
  {
    name: '🌊 Océano Azul',
    desc: 'Profesional con colores azul marlno',
    color: '#0c1445',
    accent: '#3b82f6',
    slides: buildOceanTemplate()
  },
  {
    name: '🔥 Fuego Naranja',
    desc: 'Energético y vibrante estilo startup',
    color: '#1a0a00',
    accent: '#f97316',
    slides: buildFireTemplate()
  },
  {
    name: '💎 Diamante Gris',
    desc: 'Minimalista y elegante corporate',
    color: '#0f172a',
    accent: '#e2e8f0',
    slides: buildDiamondTemplate()
  },
  {
    name: '🌿 Naturaleza Verde',
    desc: 'Fresco y orgánico para sostenibilidad',
    color: '#052e16',
    accent: '#22c55e',
    slides: buildGreenTemplate()
  }
];

function buildNetflixTemplate() {
  const bg = '#141414'; const red = '#e50914'; const w = '#ffffff'; const g = '#b3b3b3';
  return [
    { id:0, background:{type:'color',value:bg}, transition:'fade', notes:'Slide de apertura', elements:[
      { id:1, type:'shape',shape:'rect',x:0,y:0,w:960,h:540,color:'#000',opacity:1,rotation:0 },
      { id:2, type:'shape',shape:'line',x:0,y:0,w:960,h:8,color:red,opacity:1,rotation:0 },
      { id:3, type:'text',text:'SLIDECRAFT',x:40,y:30,w:400,h:50,fontSize:24,color:red,align:'left',bold:true,fontFamily:'Inter',italic:false,underline:false,opacity:1,rotation:0 },
      { id:4, type:'text',text:'TÍTULO DE LA SERIE',x:40,y:160,w:880,h:120,fontSize:72,color:w,align:'left',bold:true,fontFamily:'Inter',italic:false,underline:false,opacity:1,rotation:0 },
      { id:5, type:'text',text:'Temporada 1 · 2025 · 8 episodios',x:40,y:300,w:600,h:40,fontSize:20,color:g,align:'left',bold:false,fontFamily:'Inter',italic:false,underline:false,opacity:1,rotation:0 },
      { id:6, type:'text',text:'▶  Reproducir',x:40,y:370,w:220,h:55,fontSize:20,color:'#000',align:'center',bold:true,fontFamily:'Inter',italic:false,underline:false,opacity:1,rotation:0 },
      { id:7, type:'shape',shape:'rect',x:40,y:370,w:220,h:55,color:w,opacity:1,rotation:0 },
      { id:8, type:'text',text:'▶  Reproducir',x:40,y:384,w:220,h:55,fontSize:20,color:'#000',align:'center',bold:true,fontFamily:'Inter',italic:false,underline:false,opacity:1,rotation:0 },
      { id:9, type:'text',text:'+ Mi lista',x:280,y:370,w:150,h:55,fontSize:20,color:w,align:'center',bold:false,fontFamily:'Inter',italic:false,underline:false,opacity:1,rotation:0 },
    ]},
    { id:10, background:{type:'color',value:bg}, transition:'fade', notes:'Slide de contenido', elements:[
      { id:11, type:'shape',shape:'line',x:0,y:0,w:960,h:6,color:red,opacity:1,rotation:0 },
      { id:12, type:'text',text:'SLIDECRAFT',x:40,y:18,w:200,h:40,fontSize:24,color:red,align:'left',bold:true,fontFamily:'Inter',italic:false,underline:false,opacity:1,rotation:0 },
      { id:13, type:'text',text:'En este episodio',x:40,y:80,w:880,h:60,fontSize:40,color:w,align:'left',bold:true,fontFamily:'Inter',italic:false,underline:false,opacity:1,rotation:0 },
      { id:14, type:'shape',shape:'rect',x:40,y:160,w:270,h:280,color:'#1f1f1f',opacity:1,rotation:0 },
      { id:15, type:'shape',shape:'rect',x:345,y:160,w:270,h:280,color:'#1f1f1f',opacity:1,rotation:0 },
      { id:16, type:'shape',shape:'rect',x:650,y:160,w:270,h:280,color:'#1f1f1f',opacity:1,rotation:0 },
      { id:17, type:'text',text:'Capítulo 1',x:40,y:450,w:270,h:36,fontSize:16,color:g,align:'center',bold:false,fontFamily:'Inter',italic:false,underline:false,opacity:1,rotation:0 },
      { id:18, type:'text',text:'Capítulo 2',x:345,y:450,w:270,h:36,fontSize:16,color:g,align:'center',bold:false,fontFamily:'Inter',italic:false,underline:false,opacity:1,rotation:0 },
      { id:19, type:'text',text:'Capítulo 3',x:650,y:450,w:270,h:36,fontSize:16,color:g,align:'center',bold:false,fontFamily:'Inter',italic:false,underline:false,opacity:1,rotation:0 },
    ]},
    { id:20, background:{type:'color',value:'#0a0a0a'}, transition:'fade', notes:'Datos y info', elements:[
      { id:21, type:'shape',shape:'line',x:0,y:0,w:960,h:6,color:red,opacity:1,rotation:0 },
      { id:22, type:'text',text:'¿DE QUÉ TRATA?',x:40,y:40,w:880,h:70,fontSize:44,color:w,align:'center',bold:true,fontFamily:'Inter',italic:false,underline:false,opacity:1,rotation:0 },
      { id:23, type:'text',text:'Una presentación apasionante sobre el tema principal.\nExplica el contexto y la relevancia del contenido.',x:100,y:140,w:760,h:160,fontSize:26,color:g,align:'center',bold:false,fontFamily:'Inter',italic:false,underline:false,opacity:1,rotation:0 },
      { id:24, type:'text',text:'⭐ ⭐ ⭐ ⭐ ⭐',x:0,y:340,w:960,h:60,fontSize:36,color:red,align:'center',bold:false,fontFamily:'Inter',italic:false,underline:false,opacity:1,rotation:0 },
      { id:25, type:'text',text:'Clasificación: Apto para todo público',x:0,y:410,w:960,h:40,fontSize:18,color:g,align:'center',bold:false,fontFamily:'Inter',italic:false,underline:false,opacity:1,rotation:0 },
    ]},
    { id:30, background:{type:'gradient',from:'#141414',to:'#8b0000',dir:'to bottom right'}, transition:'fade', notes:'Cierre', elements:[
      { id:31, type:'text',text:'N',x:0,y:80,w:960,h:200,fontSize:200,color:red,align:'center',bold:true,fontFamily:'Inter',italic:false,underline:false,opacity:0.15,rotation:0 },
      { id:32, type:'text',text:'¡Siguiente capítulo!',x:0,y:180,w:960,h:120,fontSize:64,color:w,align:'center',bold:true,fontFamily:'Inter',italic:false,underline:false,opacity:1,rotation:0 },
      { id:33, type:'text',text:'Gracias por ver esta presentación',x:0,y:320,w:960,h:50,fontSize:24,color:g,align:'center',bold:false,fontFamily:'Inter',italic:false,underline:false,opacity:1,rotation:0 },
    ]}
  ];
}

function buildGalaxyTemplate() {
  const makeSlide = (bg, els) => ({id:Date.now()+Math.random(), background:bg, transition:'zoom', notes:'', elements: els.map(e=>({...e,id:Date.now()+Math.random(),opacity:1,rotation:0,fontFamily:e.fontFamily||'Inter',italic:e.italic||false,underline:false}))});
  return [
    makeSlide({type:'gradient',from:'#0d0021',to:'#1a0050',dir:'135deg'},[
      {type:'text',text:'✦ GALAXIA ✦',x:0,y:60,w:960,h:60,fontSize:22,color:'#a78bfa',align:'center',bold:false},
      {type:'text',text:'Título Galáctico',x:40,y:150,w:880,h:150,fontSize:80,color:'#fff',align:'center',bold:true},
      {type:'text',text:'Explorando el universo del conocimiento',x:40,y:330,w:880,h:60,fontSize:28,color:'#c4b5fd',align:'center'},
    ]),
    makeSlide({type:'gradient',from:'#0d0021',to:'#160040',dir:'to bottom'},[
      {type:'text',text:'Descubrimientos',x:40,y:40,w:880,h:70,fontSize:44,color:'#a78bfa',align:'center',bold:true},
      {type:'shape',shape:'circle',x:100,y:140,w:180,h:180,color:'#4c1d95'},
      {type:'shape',shape:'circle',x:390,y:120,w:220,h:220,color:'#5b21b6'},
      {type:'shape',shape:'circle',x:680,y:150,w:180,h:180,color:'#6d28d9'},
      {type:'text',text:'Idea 1',x:100,y:215,w:180,h:40,fontSize:18,color:'#e9d5ff',align:'center',bold:true},
      {type:'text',text:'Idea 2',x:390,y:225,w:220,h:40,fontSize:18,color:'#e9d5ff',align:'center',bold:true},
      {type:'text',text:'Idea 3',x:680,y:225,w:180,h:40,fontSize:18,color:'#e9d5ff',align:'center',bold:true},
    ]),
  ];
}

function buildOceanTemplate() {
  const makeSlide = (bg, els) => ({id:Date.now()+Math.random(), background:bg, transition:'slide', notes:'', elements: els.map(e=>({...e,id:Date.now()+Math.random(),opacity:1,rotation:0,fontFamily:e.fontFamily||'Inter',italic:e.italic||false,underline:false}))});
  return [
    makeSlide({type:'gradient',from:'#0c1445',to:'#1e3a8a',dir:'to bottom'},[
      {type:'text',text:'OCEAN BLUE',x:0,y:40,w:960,h:50,fontSize:18,color:'#60a5fa',align:'center',bold:false},
      {type:'text',text:'Título Principal',x:40,y:130,w:880,h:130,fontSize:74,color:'#fff',align:'center',bold:true},
      {type:'shape',shape:'line',x:240,y:275,w:480,h:4,color:'#3b82f6'},
      {type:'text',text:'Subtítulo descriptivo de tu presentación',x:40,y:300,w:880,h:60,fontSize:26,color:'#93c5fd',align:'center'},
    ]),
    makeSlide({type:'color',value:'#0c1445'},[
      {type:'text',text:'Puntos clave',x:40,y:40,w:880,h:70,fontSize:42,color:'#3b82f6',align:'left',bold:true},
      {type:'shape',shape:'line',x:40,y:120,w:880,h:3,color:'#1e40af'},
      {type:'text',text:'→  Primer punto importante',x:60,y:145,w:820,h:55,fontSize:26,color:'#e2e8f0',align:'left'},
      {type:'text',text:'→  Segundo punto importante',x:60,y:210,w:820,h:55,fontSize:26,color:'#e2e8f0',align:'left'},
      {type:'text',text:'→  Tercer punto importante',x:60,y:275,w:820,h:55,fontSize:26,color:'#e2e8f0',align:'left'},
      {type:'text',text:'→  Cuarto punto importante',x:60,y:340,w:820,h:55,fontSize:26,color:'#bfdbfe',align:'left'},
    ]),
  ];
}

function buildFireTemplate() {
  const makeSlide = (bg, els) => ({id:Date.now()+Math.random(), background:bg, transition:'zoom', notes:'', elements: els.map(e=>({...e,id:Date.now()+Math.random(),opacity:1,rotation:0,fontFamily:e.fontFamily||'Inter',italic:e.italic||false,underline:false}))});
  return [
    makeSlide({type:'gradient',from:'#1a0a00',to:'#7c2d12',dir:'to bottom right'},[
      {type:'text',text:'🔥 IGNITE',x:0,y:60,w:960,h:60,fontSize:22,color:'#fb923c',align:'center',bold:false},
      {type:'text',text:'TU STARTUP AQUÍ',x:40,y:140,w:880,h:150,fontSize:72,color:'#fff',align:'center',bold:true},
      {type:'text',text:'Disrupting the industry since 2024',x:40,y:310,w:880,h:60,fontSize:24,color:'#fdba74',align:'center',italic:true},
      {type:'shape',shape:'rect',x:340,y:400,w:280,h:60,color:'#f97316'},
      {type:'text',text:'EMPEZAR AHORA →',x:340,y:414,w:280,h:40,fontSize:18,color:'#fff',align:'center',bold:true},
    ]),
    makeSlide({type:'color',value:'#1a0a00'},[
      {type:'text',text:'El Problema',x:40,y:40,w:880,h:70,fontSize:44,color:'#f97316',align:'left',bold:true},
      {type:'shape',shape:'line',x:40,y:120,w:400,h:4,color:'#f97316'},
      {type:'text',text:'Los usuarios sufren de X, Y y Z.\nNuestra solución resuelve todo esto.',x:60,y:150,w:840,h:150,fontSize:26,color:'#fed7aa',align:'left'},
      {type:'text',text:'$4.2B\nmercado total',x:40,y:340,w:250,h:140,fontSize:34,color:'#fb923c',align:'center',bold:true},
      {type:'text',text:'10M+\nusuarios objetivo',x:360,y:340,w:250,h:140,fontSize:34,color:'#fb923c',align:'center',bold:true},
      {type:'text',text:'3X\ncrecimiento',x:680,y:340,w:250,h:140,fontSize:34,color:'#fb923c',align:'center',bold:true},
    ]),
  ];
}

function buildDiamondTemplate() {
  const makeSlide = (bg, els) => ({id:Date.now()+Math.random(), background:bg, transition:'fade', notes:'', elements: els.map(e=>({...e,id:Date.now()+Math.random(),opacity:1,rotation:0,fontFamily:e.fontFamily||'Inter',italic:e.italic||false,underline:false}))});
  return [
    makeSlide({type:'color',value:'#0f172a'},[
      {type:'shape',shape:'rect',x:0,y:0,w:4,h:540,color:'#e2e8f0'},
      {type:'text',text:'PRESENTACIÓN CORPORATIVA',x:40,y:80,w:880,h:40,fontSize:14,color:'#64748b',align:'left',bold:false},
      {type:'text',text:'Informe\nAnual',x:40,y:140,w:880,h:200,fontSize:80,color:'#f8fafc',align:'left',bold:true},
      {type:'shape',shape:'line',x:40,y:360,w:500,h:2,color:'#334155'},
      {type:'text',text:'Ejercicio Fiscal 2025  ·  Confidencial',x:40,y:380,w:880,h:40,fontSize:16,color:'#475569',align:'left'},
    ]),
    makeSlide({type:'color',value:'#0f172a'},[
      {type:'shape',shape:'rect',x:0,y:0,w:4,h:540,color:'#e2e8f0'},
      {type:'text',text:'RESUMEN EJECUTIVO',x:40,y:50,w:880,h:50,fontSize:14,color:'#64748b',align:'left',bold:false},
      {type:'text',text:'Resultados',x:40,y:110,w:880,h:80,fontSize:52,color:'#f8fafc',align:'left',bold:true},
      {type:'text',text:'• KPI principal: +24% vs año anterior\n• Ingresos totales: $12.4M\n• Nuevos clientes: 1,240',x:60,y:210,w:820,h:220,fontSize:24,color:'#94a3b8',align:'left'},
    ]),
  ];
}

function buildGreenTemplate() {
  const makeSlide = (bg, els) => ({id:Date.now()+Math.random(), background:bg, transition:'fade', notes:'', elements: els.map(e=>({...e,id:Date.now()+Math.random(),opacity:1,rotation:0,fontFamily:e.fontFamily||'Inter',italic:e.italic||false,underline:false}))});
  return [
    makeSlide({type:'gradient',from:'#052e16',to:'#14532d',dir:'to bottom'},[
      {type:'text',text:'🌿',x:0,y:80,w:960,h:80,fontSize:60,color:'#22c55e',align:'center'},
      {type:'text',text:'Sostenibilidad',x:40,y:170,w:880,h:130,fontSize:72,color:'#fff',align:'center',bold:true},
      {type:'text',text:'Hacia un futuro más verde y sostenible',x:40,y:320,w:880,h:60,fontSize:26,color:'#86efac',align:'center',italic:true},
    ]),
    makeSlide({type:'color',value:'#052e16'},[
      {type:'text',text:'Nuestro Impacto',x:40,y:40,w:880,h:70,fontSize:44,color:'#22c55e',align:'center',bold:true},
      {type:'shape',shape:'circle',x:80,y:140,w:220,h:220,color:'#14532d'},
      {type:'shape',shape:'circle',x:370,y:140,w:220,h:220,color:'#14532d'},
      {type:'shape',shape:'circle',x:660,y:140,w:220,h:220,color:'#14532d'},
      {type:'text',text:'🌍\nEcología',x:80,y:195,w:220,h:120,fontSize:20,color:'#86efac',align:'center',bold:true},
      {type:'text',text:'♻️\nReciclaje',x:370,y:195,w:220,h:120,fontSize:20,color:'#86efac',align:'center',bold:true},
      {type:'text',text:'⚡\nEnergía',x:660,y:195,w:220,h:120,fontSize:20,color:'#86efac',align:'center',bold:true},
    ]),
  ];
}

// ===== RENDER TEMPLATES MODAL =====
function renderTemplatesModal() {
  const grid = document.getElementById('tpl-grid');
  if (!grid) return;
  grid.innerHTML = '';
  TEMPLATES.forEach(tpl => {
    const card = document.createElement('div');
    card.className = 'tpl-card-item';

    // Preview
    const preview = document.createElement('div');
    preview.className = 'tpl-preview';
    const slide0 = tpl.slides[0];
    if (slide0) {
      const previewInner = document.createElement('div');
      previewInner.style.cssText = `position:relative;width:100%;height:100%;`;
      if (slide0.background.type === 'color') previewInner.style.background = slide0.background.value;
      else if (slide0.background.type === 'gradient') previewInner.style.background = `linear-gradient(${slide0.background.dir},${slide0.background.from},${slide0.background.to})`;
      // Mini elements
      const scaleW = 240, scaleH = 135;
      const inner = document.createElement('div');
      inner.style.cssText = `position:absolute;width:960px;height:540px;top:0;left:0;transform-origin:top left;transform:scale(${scaleW/960})`;
      slide0.elements.slice(0,6).forEach(el => {
        if (el.type === 'text') {
          const d = document.createElement('div');
          d.style.cssText = `position:absolute;left:${el.x}px;top:${el.y}px;width:${el.w}px;height:${el.h}px;font-size:${el.fontSize}px;color:${el.color};font-weight:${el.bold?'bold':'normal'};text-align:${el.align||'left'};overflow:hidden;line-height:1.2;font-family:Inter,sans-serif;white-space:nowrap;`;
          d.textContent = el.text;
          inner.appendChild(d);
        } else if (el.type === 'shape' && (el.shape === 'rect' || el.shape === 'line')) {
          const d = document.createElement('div');
          d.style.cssText = `position:absolute;left:${el.x}px;top:${el.y}px;width:${el.w}px;height:${Math.max(el.h,4)}px;background:${el.color};border-radius:${el.shape==='rect'?'4px':'2px'};`;
          inner.appendChild(d);
        }
      });
      previewInner.appendChild(inner);
      preview.appendChild(previewInner);
    }
    card.appendChild(preview);

    // Meta
    const meta = document.createElement('div');
    meta.className = 'tpl-meta';
    meta.innerHTML = `<h4>${tpl.name}</h4><p>${tpl.desc}</p><span class="tpl-slides-badge">${tpl.slides.length} slides</span>`;
    card.appendChild(meta);

    card.addEventListener('click', () => {
      // Deep copy slides
      const newSlides = JSON.parse(JSON.stringify(tpl.slides)).map(s => ({...s, id: Date.now()+Math.random(), elements: s.elements.map(e=>({...e, id:Date.now()+Math.random()}))}));
      state.slides = newSlides;
      state.currentSlide = 0;
      state.selectedElement = null;
      closeModal('templates-modal');
      renderAll();
      saveToStorage();
    });

    grid.appendChild(card);
  });
}

function initTemplates() {
  // Templates modal is rendered lazily when opened
}
