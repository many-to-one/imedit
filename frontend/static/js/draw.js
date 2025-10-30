// function draw() {
//   if (!tex || currentImageIndex === null) return;

//   const image = images[currentImageIndex];
//   const layers = image.layers;

//   if (image.layers.length === 0) {
//     image.activeLayer = null;
//     gl.clearColor(0, 0, 0, 1);
//     gl.clear(gl.COLOR_BUFFER_BIT);
//     return;
//   }


//   // Find the topmost visible layer
//   // const visibleLayer = layers.find(layer => layer.visible);
//   const visibleLayer = layers.find(layer => layer.visible !== false);
//   if (!visibleLayer) {
//     gl.clearColor(0, 0, 0, 1);
//     gl.clear(gl.COLOR_BUFFER_BIT);
//     return;
//   }

//   const s = visibleLayer.settings;

//   gl.clearColor(0, 0, 0, 1);
//   gl.clear(gl.COLOR_BUFFER_BIT);
//   gl.useProgram(prog);
//   gl.uniform1i(gl.getUniformLocation(prog, "u_tex"), 0);

//   for (const key in s.basic) {
//     gl.uniform1f(basicUniforms[key], s.basic[key]);
//   }

//   for (let i = 0; i < 8; i++) {
//     gl.uniform1f(uniforms[`hue${i}`], s.hsl[i].hue);
//     gl.uniform1f(uniforms[`sat${i}`], s.hsl[i].sat);
//     gl.uniform1f(uniforms[`lig${i}`], s.hsl[i].lig);
//   }

//   for (const key in s.calibration) {
//     gl.uniform1f(calUniforms[key], s.calibration[key]);
//   }

//   gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
// }


let tex = null;
// let maskTex = null;
// layer.maskTex = gl.createTexture();


function draw() {
  if (!tex || currentImageIndex === null) return;

  const image = images[currentImageIndex];
  const layer = image.layers.find(l => l.visible);

  if (!layer) {
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    return;
  }

  const s = layer.settings;

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.useProgram(prog);

  // Bind image texture
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.uniform1i(gl.getUniformLocation(prog, "u_tex"), 0);

  // Bind mask texture (already uploaded)
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, layer.maskTex);
  gl.uniform1i(gl.getUniformLocation(prog, "u_mask"), 1);

  // Set uniforms
  for (const key in s.basic) {
    gl.uniform1f(basicUniforms[key], s.basic[key]);
  }

  for (let i = 0; i < 8; i++) {
    gl.uniform1f(uniforms[`hue${i}`], s.hsl[i].hue);
    gl.uniform1f(uniforms[`sat${i}`], s.hsl[i].sat);
    gl.uniform1f(uniforms[`lig${i}`], s.hsl[i].lig);
  }

  for (const key in s.calibration) {
    gl.uniform1f(calUniforms[key], s.calibration[key]);
  }

  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}
