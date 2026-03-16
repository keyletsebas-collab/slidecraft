# SlideCraft

SlideCraft es una aplicación web intuitiva y potente para crear presentaciones profesionales directamente en tu navegador. 

## Características

- 🎨 **Editor Visual Intuitivo**: Arrastra y suelta elementos, redimensiona y personaliza cada diapositiva.
- 📊 **Nuevos Elementos Interactivos**: 
  - **Tablas Editables**: Crea tablas estilo Excel directamente en tus diapositivas.
  - **Contadores**: Añade contadores interactivos con botones de incremento y decremento.
- 🖼️ **Símbolos y Formas**: Biblioteca completa con círculos, rectángulos, estrellas y más.
- 💾 **Privacidad Total**: Todas tus presentaciones se guardan localmente en tu dispositivo (`localStorage`). Nadie más puede ver tus datos.
- 📤 **Exportación Flexible**: Descarga tus presentaciones en formato **PowerPoint (.pptx)**, **PDF** o **PNG**.
- 📽️ **Modo Proyección**: Presenta tus slides con transiciones suaves y herramientas de puntero.

## Instalación y Uso

1. Descarga este repositorio como un archivo ZIP o clona el repositorio:
   ```bash
   git clone https://github.com/keyletsebas-collab/slidecraft.git
   ```
2. **Ejecutar Localmente (Localhost)**:
   Aunque puedes abrir `index.html` directamente, se recomienda usar un servidor local para una mejor experiencia:
   - **Si tienes VS Code**: Instala la extensión "Live Server" y haz clic en "Go Live".
   - **Si tienes Node.js**: Ejecuta `npx serve .` en la carpeta del proyecto.
   - **Si tienes Python**: Ejecuta `python -m http.server` en la carpeta del proyecto.
3. Abre tu navegador en la dirección que te indique el servidor (ej: `http://localhost:5000` o `http://localhost:8000`).

## Tecnologías Utilizadas

- HTML5 / CSS3 (Vanilla)
- JavaScript (ES6+)
- PptxGenJS (Exportación a PowerPoint)
- jsPDF & html2canvas (Exportación a PDF/PNG)

---
Creado con ❤️ para presentaciones rápidas y privadas.
