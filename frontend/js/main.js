let gl, program, texture;
let zoom = 1.0, offsetX = 0, offsetY = 0;
let isDragging = false, lastX, lastY;
let imgWidth, imgHeight;
let hue = 0, sat = 1, light = 1;

const canvas = document.getElementById("glcanvas");
const hueSlider = document.getElementById("hue");
const satSlider = document.getElementById("sat");
const lightSlider = document.getElementById("light");

// Load image and create thumbnail
let img = new Image();
document.getElementById("fileInput").onchange = e => {
  img.src = URL.createObjectURL(e.target.files[0]);
};
img.onload = () => {
  imgWidth = img.width;
  imgHeight = img.height;
  initWebGL();
};

// Slider events
[hueSlider, satSlider, lightSlider].forEach(slider => {
  slider.addEventListener("input", () => {
    hue = parseFloat(hueSlider.value);
    sat = parseFloat(satSlider.value);
    light = parseFloat(lightSlider.value);
    drawImage();
  });
});

// Zoom & Pan
canvas.addEventListener("wheel", e => {
  e.preventDefault();
  zoom *= e.deltaY > 0 ? 0.9 : 1.1;
  drawImage();
});

canvas.addEventListener("mousedown", e => {
  isDragging = true;
  lastX = e.clientX;
  lastY = e.clientY;
});
canvas.addEventListener("mousemove", e => {
  if (isDragging) {
    offsetX += (e.clientX - lastX) / zoom;
    offsetY += (e.clientY - lastY) / zoom;
    lastX = e.clientX;
    lastY = e.clientY;
    drawImage();
  }
});
canvas.addEventListener("mouseup", () => isDragging = false);
canvas.addEventListener("mouseleave", () => isDragging = false);

// --- WebGL setup ---
function initWebGL() {
  gl = canvas.getContext("webgl");
  if (!gl) { alert("WebGL not supported"); return; }

  // Vertex shader
  const vsSource = `
    attribute vec2 aPos;
    attribute vec2 aTex;
    varying vec2 vTex;
    uniform float uZoom;
    uniform vec2 uOffset;
    void main() {
      gl_Position = vec4(aPos, 0, 1);
      vTex = (aTex - 0.5)/uZoom + 0.5 - uOffset;
    }
  `;

  // Fragment shader (HSL adjustment)
  const fsSource = `
    precision mediump float;
    varying vec2 vTex;
    uniform sampler2D uTexture;
    uniform float uHue;
    uniform float uSat;
    uniform float uLight;

    vec3 rgb2hsl(vec3 c){
        float maxC = max(c.r,max(c.g,c.b));
        float minC = min(c.r,min(c.g,c.b));
        float l = (maxC + minC)/2.0;
        float s = 0.0;
        float h = 0.0;
        if(maxC != minC){
            float d = maxC - minC;
            s = l>0.5? d/(2.0-maxC-minC): d/(maxC+minC);
            if(maxC==c.r) h=(c.g-c.b)/d + (c.g<c.b?6.0:0.0);
            else if(maxC==c.g) h=(c.b-c.r)/d + 2.0;
            else h=(c.r-c.g)/d + 4.0;
            h/=6.0;
        }
        return vec3(h,s,l);
    }

    vec3 hsl2rgb(vec3 c){
        float r, g, b;
        if(c.y==0.0) r=g=b=c.z;
        else{
            float q = c.z<0.5? c.z*(1.0+c.y): c.z+c.y-c.z*c.y;
            float p = 2.0*c.z - q;
            float hk = c.x;
            float t[3];
            t[0]=hk+1.0/3.0;
            t[1]=hk;
            t[2]=hk-1.0/3.0;
            for(int i=0;i<3;i++){
                if(t[i]<0.0) t[i]+=1.0;
                if(t[i]>1.0) t[i]-=1.0;
            }
            float tc;
            // r
            tc=t[0]; if(tc<1.0/6.0) r=p+(q-p)*6.0*tc;
            else if(tc<1.0/2.0) r=q;
            else if(tc<2.0/3.0) r=p+(q-p)*(2.0/3.0-tc)*6.0;
            else r=p;
            // g
            tc=t[1]; if(tc<1.0/6.0) g=p+(q-p)*6.0*tc;
            else if(tc<1.0/2.0) g=q;
            else if(tc<2.0/3.0) g=p+(q-p)*(2.0/3.0-tc)*6.0;
            else g=p;
            // b
            tc=t[2]; if(tc<1.0/6.0) b=p+(q-p)*6.0*tc;
            else if(tc<1.0/2.0) b=q;
            else if(tc<2.0/3.0) b=p+(q-p)*(2.0/3.0-tc)*6.0;
            else b=p;
        }
        return vec3(r,g,b);
    }

    void main(){
        vec4 color = texture2D(uTexture,vTex);
        vec3 hsl = rgb2hsl(color.rgb);
        hsl.x += uHue/360.0;
        hsl.y *= uSat;
        hsl.z *= uLight;
        gl_FragColor = vec4(hsl2rgb(hsl), color.a);
    }
  `;

  program = createProgram(vsSource, fsSource);
  gl.useProgram(program);

  // Create quad
  const vertices = new Float32Array([
    -1,-1, 0,0,
     1,-1, 1,0,
    -1, 1, 0,1,
     1, 1, 1,1
  ]);

  const vbo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER,vbo);
  gl.bufferData(gl.ARRAY_BUFFER,vertices,gl.STATIC_DRAW);

  const aPos = gl.getAttribLocation(program,"aPos");
  const aTex = gl.getAttribLocation(program,"aTex");
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos,2,gl.FLOAT,false,16,0);
  gl.enableVertexAttribArray(aTex);
  gl.vertexAttribPointer(aTex,2,gl.FLOAT,false,16,8);

  // Upload texture
  texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D,texture);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  drawImage();
}

function drawImage(){
  gl.viewport(0,0,canvas.width,canvas.height);
  gl.clearColor(0,0,0,0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  gl.useProgram(program);
  gl.uniform1f(gl.getUniformLocation(program,"uHue"),hue);
  gl.uniform1f(gl.getUniformLocation(program,"uSat"),sat);
  gl.uniform1f(gl.getUniformLocation(program,"uLight"),light);
  gl.uniform1f(gl.getUniformLocation(program,"uZoom"),zoom);
  gl.uniform2f(gl.getUniformLocation(program,"uOffset"),offsetX,offsetY);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D,texture);
  gl.uniform1i(gl.getUniformLocation(program,"uTexture"),0);

  gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
}

// Helper: create shader program
function createProgram(vsSource, fsSource){
  const vs = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vs,vsSource);
  gl.compileShader(vs);
  if(!gl.getShaderParameter(vs,gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(vs));

  const fs = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fs,fsSource);
  gl.compileShader(fs);
  if(!gl.getShaderParameter(fs,gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(fs));

  const prog = gl.createProgram();
  gl.attachShader(prog,vs);
  gl.attachShader(prog,fs);
  gl.linkProgram(prog);
  if(!gl.getProgramParameter(prog,gl.LINK_STATUS)) console.error(gl.getProgramInfoLog(prog));
  return prog;
}

// --- Export full-res ---
document.getElementById("exportBtn").onclick = () => {
  const fullCanvas = document.createElement("canvas");
  fullCanvas.width = imgWidth;
  fullCanvas.height = imgHeight;
  const ctx = fullCanvas.getContext("2d");
  ctx.drawImage(img, 0, 0);
  // TODO: apply same HSL adjustments to full-res (can use JS or WebGL offscreen)
  const dataURL = fullCanvas.toDataURL("image/png");
  const a = document.createElement("a");
  a.href = dataURL;
  a.download = "edited.png";
  a.click();
};
