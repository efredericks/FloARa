// in theory, speed up
// https://github.com/processing/p5.js/wiki/Optimizing-p5.js-Code-for-Performance#p5-performance-tips
p5.disableFriendlyErrors = true; // disables FES

// global vars
let bg, mask, overlay;
let flowers;
let redraw;

let wind_fs;

let temp_milkweed;

// temp variables
let debug = false;
let wind_on = true;

// load in background and flowers at full resolution
function preload() {
  // bg = loadImage("assets/img/gvsu-bg.jpg");
  bg = loadImage("assets/img/131028_Fall_Campus-6934_Pano-2.png");;
  mask = loadImage("assets/img/131028_Fall_Campus-6934_Pano-2.mask.png");
  overlay = loadImage("assets/img/131028_Fall_Campus-6934_Pano-2.overlay.png");

  temp_milkweed = loadImage("assets/img/milkweed/Milkweed_0000_5_sm.cropped.png");
}
function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);
  textAlign(CENTER);

  // loadData();

  flowers = setupRandomData(bg.width, bg.height, mask);
  // wind_fs = temp_milkweed_gfx.createFilterShader(wind_src);

  drawEverything();

  redraw = false;
  debug = false;

  frameRate(24);
}
function draw() {
  if (redraw) drawEverything();

}

// draw everything with respect to the canvas size
function drawEverything() {
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

    for (let f of flowers) {
      let h_aspect = bg.height / h;
      let x = (f.location.x / w_aspect);
      let y = (f.location.y / h_aspect);

      // perspective for 'farther away'
      let sc = map(y, height, height * 0.2, 1.0, 0.001);
      let _w = temp_milkweed.width * sc;
      let _h = temp_milkweed.height * sc;

      // magic numbers help with offset within image
      image(temp_milkweed, x-_w*.5, y - _h * .5, _w, _h, 0, 0, temp_milkweed.width, temp_milkweed.height);
    }

    image(overlay, 0, 0, width, h, 0, 0, bg.width, bg.height);
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