// in theory, speed up
// https://github.com/processing/p5.js/wiki/Optimizing-p5.js-Code-for-Performance#p5-performance-tips
p5.disableFriendlyErrors = true; // disables FES

// load in background and flowers at full resolution
function preload() {
}
function setup() {
  createCanvas(windowWidth, windowHeight);
  drawEverything();
}
function draw() {
}

// draw everything with respect to the canvas size
function drawEverything() {
  background(0);
}

// resize all images wrt aspect ratio
function resizeImages() {

}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  resizeImages();
  drawEverything();
}
