// // ################################################# ERASER LOGIC ################################################# //


// let toolMode = 'paint'; // default
// let isErasing = false;
// let eraserRadius = 80; // ✅ default radius value
// let eraserPower = 1.0; // ✅ already defined later, but moved up for clarity

// const eraserBtn = document.getElementById('eraserBtn');
// eraserBtn.onclick = () => {
//   toolMode = toolMode === 'eraser' ? 'paint' : 'eraser';
//   canvas.style.cursor = toolMode === 'eraser' ? 'crosshair' : 'default';
// };


// document.getElementById('radiusSlider').oninput = (e) => {
//   eraserRadius = parseInt(e.target.value);
// };

// document.getElementById('powerSlider').oninput = (e) => {
//   eraserPower = parseFloat(e.target.value);
// };


// // 🟢 Create a custom circle cursor overlay
// const brushCursor = document.createElement('div');
// brushCursor.style.position = 'fixed';
// brushCursor.style.pointerEvents = 'none';
// brushCursor.style.zIndex = '9999';
// brushCursor.style.width = `${eraserRadius * 2}px`;
// brushCursor.style.height = `${eraserRadius * 2}px`;
// brushCursor.style.border = '1px solid rgba(255, 0, 0, 0.8)';
// brushCursor.style.borderRadius = '50%';
// brushCursor.style.transform = 'translate(-50%, -50%)';
// brushCursor.style.display = 'none';
// brushCursor.style.mixBlendMode = 'difference'; // so it's visible on any background
// document.body.appendChild(brushCursor);


// // 🔹 Update brush radius live when slider changes
// document.getElementById('radiusSlider').addEventListener('input', (e) => {
//   eraserRadius = parseInt(e.target.value);
//   brushCursor.style.width = `${eraserRadius * 2}px`;
//   brushCursor.style.height = `${eraserRadius * 2}px`;
// });

// // 🔹 Toggle visibility when switching tool
// // eraserBtn.addEventListener('click', () => {
// //   toolMode = toolMode === 'eraser' ? 'paint' : 'eraser';
// //   if (toolMode === 'eraser') {
// //     canvas.style.cursor = 'none';       // hide default
// //     brushCursor.style.display = 'block';
// //   } else {
// //     canvas.style.cursor = 'default';
// //     brushCursor.style.display = 'none';
// //   }
// // });

// // 🔹 Follow mouse
// // canvas.addEventListener('mousemove', (e) => {
// //   if (toolMode === 'eraser') {
// //     brushCursor.style.left = `${e.clientX}px`;
// //     brushCursor.style.top = `${e.clientY}px`;
// //   }
// // });


// canvas.addEventListener('mousedown', e => {
//   if (toolMode !== 'eraser') return;
//   isErasing = true;
//   const rect = canvas.getBoundingClientRect();
//   const cx = e.clientX - rect.left;
//   const cy = e.clientY - rect.top;
//   eraseAt(cx, cy);
// });

// canvas.onmousemove = (e) => {
//   const x = e.clientX;
//   const y = e.clientY;
//   brushCursor.style.left = `${e.clientX}px`;
//   brushCursor.style.top = `${e.clientY}px`;

//   if (toolMode === 'eraser' && isErasing) {
//     const rect = canvas.getBoundingClientRect();
//     const cx = e.clientX - rect.left;
//     const cy = e.clientY - rect.top;
//     eraseAt(cx, cy);
//   }
// };



// canvas.addEventListener('mouseup', () => {
//   isErasing = false;
// });



// function eraseAt(x, y) {
//   const image = images[currentImageIndex];
//   const layer = image.layers[image.activeLayer];

//   if (!layer.mask) {
//     const maskCanvas = document.createElement('canvas');
//     maskCanvas.width = image.bmp.width;
//     maskCanvas.height = image.bmp.height;
//     const ctx = maskCanvas.getContext('2d');
//     ctx.fillStyle = 'rgba(255,255,255,1)';
//     ctx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
//     layer.mask = maskCanvas;
//     layer.maskTex = gl.createTexture();
//     gl.bindTexture(gl.TEXTURE_2D, layer.maskTex);
//     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
//     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
//     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
//     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
//   }

//   // Correct scaling only — no offset
//   const rect = canvas.getBoundingClientRect();
//   const scaleX = layer.mask.width / rect.width;
//   const scaleY = layer.mask.height / rect.height;
//   const normX = x * scaleX;
//   const normY = y * scaleY;
//   // const normY = layer.mask.height - (y * scaleY); // ← flip Y


//   const ctx = layer.mask.getContext('2d');
//   ctx.globalCompositeOperation = 'destination-out';
//   const grad = ctx.createRadialGradient(normX, normY, 0, normX, normY, eraserRadius);
//   grad.addColorStop(0, `rgba(0,0,0,${eraserPower})`);
//   grad.addColorStop(1, 'rgba(0,0,0,0)');
//   ctx.fillStyle = grad;
//   ctx.fillRect(normX - eraserRadius, normY - eraserRadius, eraserRadius * 2, eraserRadius * 2);

//   updateMaskTexture(layer);
//   draw();
// }




// // ################################################# END ERASER LOGIC ################################################# //










let toolMode = 'paint';
let isErasing = false;
let eraserRadius = 80;
let eraserPower = 1.0;

// batching dla gumki
let pendingEraserPoints = [];
let isRendering = false;

// ELEMENTY UI
const eraserBtn = document.getElementById('tool-eraser');
const brushBtn = document.getElementById('tool-brush');
const moveBtn = document.getElementById('tool-move');
const zoomBtn = document.getElementById('tool-zoom');

const eraserSettings = document.getElementById('eraserSettings');

// klik poza panelem = dezaktywacja narzędzi
document.addEventListener('click', (e) => {
  const clickedInsideTools =
    e.target.closest('#toolPanel') ||
    e.target.closest('#toolSettings');

  if (!clickedInsideTools) {
    toolMode = 'paint';

    document.querySelectorAll('.toolBtn')
      .forEach(btn => btn.classList.remove('active'));

    eraserSettings.style.display = 'none';
    canvas.style.cursor = 'default';
  }
});

// 🔹 Funkcja aktywująca narzędzie
function activateTool(name) {
  toolMode = name;

  document.querySelectorAll('.toolBtn').forEach(btn => btn.classList.remove('active'));

  if (name === 'eraser') eraserBtn.classList.add('active');
  if (name === 'brush') brushBtn.classList.add('active');
  if (name === 'move') moveBtn.classList.add('active');
  if (name === 'zoom') zoomBtn.classList.add('active');

  eraserSettings.style.display = name === 'eraser' ? 'block' : 'none';
  canvas.style.cursor = name === 'eraser' ? 'crosshair' : 'default';
}

// 🔹 Kliknięcia narzędzi
eraserBtn.onclick = () => activateTool('eraser');
brushBtn.onclick = () => activateTool('brush');
moveBtn.onclick = () => activateTool('move');
zoomBtn.onclick = () => activateTool('zoom');

// 🔹 Customowy okrąg kursora
const brushCursor = document.createElement('div');
brushCursor.style.position = 'fixed';
brushCursor.style.pointerEvents = 'none';
brushCursor.style.zIndex = '9999';
brushCursor.style.width = `${eraserRadius * 2}px`;
brushCursor.style.height = `${eraserRadius * 2}px`;
brushCursor.style.border = '1px solid rgba(255, 0, 0, 0.8)';
brushCursor.style.borderRadius = '50%';
brushCursor.style.transform = 'translate(-50%, -50%)';
brushCursor.style.display = 'none';
brushCursor.style.mixBlendMode = 'difference';
document.body.appendChild(brushCursor);

// 🔹 Slidery gumki
document.getElementById('radiusSlider').oninput = (e) => {
  eraserRadius = parseInt(e.target.value);
};

document.getElementById('powerSlider').oninput = (e) => {
  eraserPower = parseFloat(e.target.value);
};

// 🔹 Ruch kursora + kolejka punktów do gumki
canvas.onmousemove = (e) => {
  brushCursor.style.left = `${e.clientX}px`;
  brushCursor.style.top = `${e.clientY}px`;

  if (toolMode === 'eraser') {
    brushCursor.style.display = 'block';

    const image = images[currentImageIndex];
    const layer = image.layers[image.activeLayer];

    const rect = canvas.getBoundingClientRect();
    const baseW = layer.mask ? layer.mask.width : image.bmp.width;
    const baseH = layer.mask ? layer.mask.height : image.bmp.height;
    const scaleX = baseW / rect.width;
    const scaleY = baseH / rect.height;
    const scale = (scaleX + scaleY) / 2;

    brushCursor.style.width = `${(eraserRadius / scale) * 2}px`;
    brushCursor.style.height = `${(eraserRadius / scale) * 2}px`;
  } else {
    brushCursor.style.display = 'none';
  }

  if (toolMode === 'eraser' && isErasing) {
    const rect = canvas.getBoundingClientRect();
    pendingEraserPoints.push({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });

    if (!isRendering) requestAnimationFrame(processEraserQueue);
  }
};

// 🔹 Erasing – start
canvas.addEventListener('mousedown', e => {
  if (toolMode !== 'eraser') return;
  isErasing = true;

  const rect = canvas.getBoundingClientRect();
  pendingEraserPoints.push({
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  });

  if (!isRendering) requestAnimationFrame(processEraserQueue);
});

canvas.addEventListener('mouseup', () => {
  isErasing = false;
});

// 🔹 Przetwarzanie kolejki punktów gumki (batching)
function processEraserQueue() {
  isRendering = true;

  if (pendingEraserPoints.length === 0) {
    isRendering = false;
    return;
  }

  const image = images[currentImageIndex];
  const layer = image.layers[image.activeLayer];

  if (!layer.mask) {
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = image.bmp.width;
    maskCanvas.height = image.bmp.height;
    const initCtx = maskCanvas.getContext('2d');
    initCtx.fillStyle = 'rgba(255,255,255,1)';
    initCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
    layer.mask = maskCanvas;
    layer.maskTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, layer.maskTex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  }

  const rect = canvas.getBoundingClientRect();
  const scaleX = layer.mask.width / rect.width;
  const scaleY = layer.mask.height / rect.height;

  const ctx = layer.mask.getContext('2d');
  ctx.globalCompositeOperation = 'destination-out';

  for (const p of pendingEraserPoints) {
    const normX = p.x * scaleX;
    const normY = p.y * scaleY;

    const grad = ctx.createRadialGradient(normX, normY, 0, normX, normY, eraserRadius);
    grad.addColorStop(0, `rgba(0,0,0,${eraserPower})`);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(normX - eraserRadius, normY - eraserRadius, eraserRadius * 2, eraserRadius * 2);
  }

  pendingEraserPoints = [];

  updateMaskTexture(layer);
  draw();

  requestAnimationFrame(processEraserQueue);
}

// 🔹 Zachowana funkcja eraseAt – teraz korzysta z kolejki
function eraseAt(x, y) {
  pendingEraserPoints.push({ x, y });
  if (!isRendering) requestAnimationFrame(processEraserQueue);
}

