// in theory, speed up
// https://github.com/processing/p5.js/wiki/Optimizing-p5.js-Code-for-Performance#p5-performance-tips
p5.disableFriendlyErrors = true; // disables FES

// global vars
let bg;
let flowers;

// load in background and flowers at full resolution
function preload() {
  bg = loadImage("assets/img/gvsu-bg.jpg");
}
function setup() {
  createCanvas(windowWidth, windowHeight);
  textAlign(CENTER);

  // loadData();
  flowers = setupRandomData(bg.width, bg.height);

  drawEverything();
}
function draw() {
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

    for (let f of flowers) {
      fill(f.color);

      let h_aspect = bg.height / h;


      circle(f.location.x / w_aspect, f.location.y / h_aspect, 20/w_aspect);
    }
  }
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
  resizeImages();
  drawEverything();
}
