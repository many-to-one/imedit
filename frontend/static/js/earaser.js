// ################################################# ERASER LOGIC ################################################# //


let toolMode = 'paint'; // default
let isErasing = false;

const eraserBtn = document.getElementById('eraserBtn');
eraserBtn.onclick = () => {
  toolMode = toolMode === 'eraser' ? 'paint' : 'eraser';
  canvas.style.cursor = toolMode === 'eraser' ? 'crosshair' : 'default';
};


document.getElementById('radiusSlider').oninput = (e) => {
  eraserRadius = parseInt(e.target.value);
};

let eraserPower = 1.0;
document.getElementById('powerSlider').oninput = (e) => {
  eraserPower = parseFloat(e.target.value);
};


canvas.addEventListener('mousedown', e => {
  if (toolMode !== 'eraser') return;
  isErasing = true;
  const rect = canvas.getBoundingClientRect();
  const cx = e.clientX - rect.left;
  const cy = e.clientY - rect.top;
  eraseAt(cx, cy);
});


const eraserCursor = document.getElementById('eraserCursor');
let eraserRadius = 20;

canvas.onmousemove = (e) => {
  const x = e.clientX;
  const y = e.clientY;

  if (toolMode === 'eraser') {
    eraserCursor.style.display = 'block';
    eraserCursor.style.width = `${eraserRadius * 2}px`;
    eraserCursor.style.height = `${eraserRadius * 2}px`;
    eraserCursor.style.left = `${x - eraserRadius}px`;
    eraserCursor.style.top = `${y - eraserRadius}px`;
    eraserCursor.style.border = '1px solid red';
    // console.log('eraserCursor active');
    // console.log('eraserCursor top', eraserCursor.style.top);
  } else {
    eraserCursor.style.display = 'none';
    console.log('eraserCursor none');
  }

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