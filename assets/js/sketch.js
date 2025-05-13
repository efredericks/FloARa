// in theory, speed up
// https://github.com/processing/p5.js/wiki/Optimizing-p5.js-Code-for-Performance#p5-performance-tips
p5.disableFriendlyErrors = true; // disables FES

// global vars
let bg, mask, overlay;
let flowers = [];
let redraw;

let wind_fs;
let wind_material;

let dither_fs, tv_fs, rgb_fs;

let temp_milkweed;

// temp variables
let debug = false;
let wind_on = true;

let font;

// load in background and flowers at full resolution
function preload() {
  // bg = loadImage("assets/img/gvsu-bg.jpg");
  // bg = loadImage("assets/img/131028_Fall_Campus-6934_Pano-2.png");;
  bg = loadImage("assets/img/gvsu-hd.jpeg");
  mask = loadImage("assets/img/gvsu-hd-mask.jpg");

  // mask = loadImage("assets/img/131028_Fall_Campus-6934_Pano-2.mask.png");
  overlay = loadImage("assets/img/131028_Fall_Campus-6934_Pano-2.overlay.png");

  // temp_milkweed = loadImage("assets/img/milkweed/Milkweed_0000_5_sm.cropped.png");
  temp_milkweed = loadImage("assets/img/milkweed/Milkweed_5_outerglow.png");

  font = loadFont("assets/fonts/Quicksand-Medium.ttf");
}

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  pixelDensity(1);

  textFont(font);
  textAlign(CENTER);

  wind_material = baseMaterialShader().modify({
    uniforms: {
      'float time': null, // You can put a value here if you want a default
      'float offset': null,
      // ...or a function returning a value if you want a dynamically set default
    },
    'Inputs getPixelInputs': `(Inputs inputs) {
      vec2 coord = inputs.texCoord;

      vec2 Size = vec2(201,463);//256, 128);
      vec2 Wave = vec2(48, 10);

    // uv = vTexCoord + vec2(cos((uv.y / Wave.x + _time) * 6.2831) * Wave.y, 0) / Size * (1.0 - vTexCoord.y);

      coord = coord + vec2(cos(offset + (coord.y / Wave.x + time) * 6.2831) * Wave.y, 0) / Size * (1.0 - coord.y);
      // coord.x += 0.1 * sin(time * 0.001 + coord.y * 10.0);

      inputs.color = texture(uSampler, coord);
      return inputs;
    }`
  })

  // loadData();

  flowers = setupRandomData(bg.width, bg.height, mask, 250);
  // wind_fs = temp_milkweed_gfx.createFilterShader(wind_src);

  drawEverything();

  redraw = false;
  debug = false;

  dither_fs = createFilterShader(dither_src);
  tv_fs = createFilterShader(tv_noise_src);
  rgb_fs = createFilterShader(rgb_src);

  frameRate(24);
}


function draw() {
  if (redraw) drawEverything();

  if (frameCount % 20 == 0 && flowers.length < 10000) {
    flowers = addIndividualPlant(bg.width, bg.height, mask, flowers);
    redraw = true;
  }
  redraw = true;

  /*
  rgb_fs.setUniform("_noise", 0.1);
  filter(rgb_fs);
  tv_fs.setUniform("_noise", 0.5*cos(millis()*0.001));
  filter(tv_fs);
  dither_fs.setUniform("which", 2);
  filter(dither_fs);
  */
}

// draw everything with respect to the canvas size
function drawEverything() {
  translate(-width / 2, -height / 2);

  background(0);

  // force landscape mode
  if (width < height) {
    push();
    fill(255);
    textSize(width * 0.05);
    textAlign(CENTER, CENTER);
    translate(width * 0.5, height * 0.5);
    text("Please rotate your device", 0, 0);
    pop();
  } else {
    background(0);

    // landscape image - maintain aspect ratio wrt width
    let w_aspect = bg.width / width;
    let h = bg.height / w_aspect;
    image(bg, 0, 0, width, h, 0, 0, bg.width, bg.height);

    // debug
    if (debug) {
      tint(255, 127);
      image(mask, 0, 0, width, h, 0, 0, bg.width, bg.height);
      noTint();
    }

    let i = 0;
    for (let f of flowers) {
      let h_aspect = bg.height / h;
      let x = (f.location.x / w_aspect);
      let y = (f.location.y / h_aspect);

      // perspective for 'farther away'
      let sc = map(y, height, height * 0.2, 1.0, 0.001);
      let _w = (temp_milkweed.width * 0.4) * sc;
      let _h = (temp_milkweed.height * 0.4) * sc;

      // magic numbers help with offset within image
      push();

      shader(wind_material);
      wind_material.setUniform("offset", i);
      wind_material.setUniform('time', millis() / 2400);
      i++;


      // drawingContext.shadowOffsetX = 0;
      // drawingContext.shadowOffsetY = 0;
      // drawingContext.shadowBlur = 15;
      // drawingContext.shadowColor = color(0, 255, 0, 80);
      image(temp_milkweed, x - _w * .5, y - _h * .5, _w, _h, 0, 0, temp_milkweed.width, temp_milkweed.height);
      pop();
    }

    // image(overlay, 0, 0, width, h, 0, 0, bg.width, bg.height);
  }

  redraw = false;
}

// reads in plant information from database
// -though temporary reads from temp-data.js
function loadData() {
}

// resize all images wrt aspect ratio
function resizeImages() {

}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  temp_milkweed_gfx = createGraphics(width, height);

  for (let f of flowers) {
    let w_aspect = bg.width / width;
    let h = bg.height / w_aspect;
    let h_aspect = bg.height / h;
    temp_milkweed_gfx.image(temp_milkweed, f.location.x / w_aspect, f.location.y / h_aspect);
  }

  resizeImages();
  drawEverything();
}

function keyPressed() {
  // toggle debug
  if (key == " ") {
    debug = !debug;
    redraw = true;
  }

  // toggle wind shader
  if (key == "w") {
    wind_on = !wind_on;
  }
}

// get pixel ID for pixels array
function getPixelID(x, y, g = null) {
  let idx;
  if (g == null) {
    const d = pixelDensity();
    idx = 4 * d * (int(y) * d * width + int(x));

  } else {
    const d = g.pixelDensity();
    idx = 4 * d * (int(y) * d * g.width + int(x));
  }
  return idx;
}