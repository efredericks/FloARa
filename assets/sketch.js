// in theory, speed up
// https://github.com/processing/p5.js/wiki/Optimizing-p5.js-Code-for-Performance#p5-performance-tips
p5.disableFriendlyErrors = true; // disables FES

function preload() {
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  background(0);
}

function draw() {
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  background(0);
}