# Migration Guide

This guide is intended to be a reference for reusing FloARa in different locations.

## Requirements:

1. Firebase account and project
2. High quality images:
  * Background
  * Plant growth stages

## First:

Either fork or clone this repository.  If using GitHub please fork so you can track changes in your own repo.  If hosting on a webhost just clone it, make your changes, and copy the directory to wherever you plan to host it.

## Code walkthrough

* `index.html`
* `js/sketch.js`
* `js/data.js`
* `js/ar-sketch.js`

Code for the AR aspect of the project that is effectively a stripped-down version of `sketch.js`.  However, it reads from the accelerometer on a phone to pan the image (or allows for arrow key presses on the computer).

**Things to change when updating**:

1. T
2. B
3. D

* `js/shaders.js`

This file has the shader code used for the wind distortion and the glitch effects used for rewind.  For wind, the `Size`, `Wave`, and `uv` variables all have magic numbers that can be tweaked to change the effect.  FYI, very easy to break.