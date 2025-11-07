// ################################################# ERASER LOGIC ################################################# //


let toolMode = 'paint'; // default
let isErasing = false;
let eraserRadius = 80; // ✅ default radius value
let eraserPower = 1.0; // ✅ already defined later, but moved up for clarity

const eraserBtn = document.getElementById('eraserBtn');
eraserBtn.onclick = () => {
  toolMode = toolMode === 'eraser' ? 'paint' : 'eraser';
  canvas.style.cursor = toolMode === 'eraser' ? 'crosshair' : 'default';
};


document.getElementById('radiusSlider').oninput = (e) => {
  eraserRadius = parseInt(e.target.value);
};

document.getElementById('powerSlider').oninput = (e) => {
  eraserPower = parseFloat(e.target.value);
};


// 🟢 Create a custom circle cursor overlay
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
brushCursor.style.mixBlendMode = 'difference'; // so it's visible on any background
document.body.appendChild(brushCursor);


// 🔹 Update brush radius live when slider changes
document.getElementById('radiusSlider').addEventListener('input', (e) => {
  eraserRadius = parseInt(e.target.value);
  brushCursor.style.width = `${eraserRadius * 2}px`;
  brushCursor.style.height = `${eraserRadius * 2}px`;
});

// 🔹 Toggle visibility when switching tool
// eraserBtn.addEventListener('click', () => {
//   toolMode = toolMode === 'eraser' ? 'paint' : 'eraser';
//   if (toolMode === 'eraser') {
//     canvas.style.cursor = 'none';       // hide default
//     brushCursor.style.display = 'block';
//   } else {
//     canvas.style.cursor = 'default';
//     brushCursor.style.display = 'none';
//   }
// });

// 🔹 Follow mouse
// canvas.addEventListener('mousemove', (e) => {
//   if (toolMode === 'eraser') {
//     brushCursor.style.left = `${e.clientX}px`;
//     brushCursor.style.top = `${e.clientY}px`;
//   }
// });


canvas.addEventListener('mousedown', e => {
  if (toolMode !== 'eraser') return;
  isErasing = true;
  const rect = canvas.getBoundingClientRect();
  const cx = e.clientX - rect.left;
  const cy = e.clientY - rect.top;
  eraseAt(cx, cy);
});

canvas.onmousemove = (e) => {
  const x = e.clientX;
  const y = e.clientY;
  brushCursor.style.left = `${e.clientX}px`;
  brushCursor.style.top = `${e.clientY}px`;

  if (toolMode === 'eraser' && isErasing) {
    const rect = canvas.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    eraseAt(cx, cy);
  }
};



canvas.addEventListener('mouseup', () => {
  isErasing = false;
});



function eraseAt(x, y) {
  const image = images[currentImageIndex];
  const layer = image.layers[image.activeLayer];

  if (!layer.mask) {
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = image.bmp.width;
    maskCanvas.height = image.bmp.height;
    const ctx = maskCanvas.getContext('2d');
    ctx.fillStyle = 'rgba(255,255,255,1)';
    ctx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
    layer.mask = maskCanvas;
    layer.maskTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, layer.maskTex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  }

  // Correct scaling only — no offset
  const rect = canvas.getBoundingClientRect();
  const scaleX = layer.mask.width / rect.width;
  const scaleY = layer.mask.height / rect.height;
  const normX = x * scaleX;
  const normY = y * scaleY;
  // const normY = layer.mask.height - (y * scaleY); // ← flip Y


  const ctx = layer.mask.getContext('2d');
  ctx.globalCompositeOperation = 'destination-out';
  const grad = ctx.createRadialGradient(normX, normY, 0, normX, normY, eraserRadius);
  grad.addColorStop(0, `rgba(0,0,0,${eraserPower})`);
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(normX - eraserRadius, normY - eraserRadius, eraserRadius * 2, eraserRadius * 2);

  updateMaskTexture(layer);
  draw();
}




// ################################################# END ERASER LOGIC ################################################# //