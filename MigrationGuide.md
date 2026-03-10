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

Global data that controls the sketches.  

`scale_bands` defines the scaling factor based where on the screen the plant is placed.  It is a percentage multiplied against the width/height of the original image.

`QR_map` is a dictionary that contains:

* `key` value is its QR code index
* `name` is used in the sketch
* `scale` further scales the plant image to support individual scaling
* `hd_scale` is used for the high quality saving scale.  Note that this feature seems a bit buggy (saving)

`plant_info` is intended to be the 'common' dictionary of information for each plant.  The key for each entry must match the name in `QR_map.name`

* The number of entries for `growthStages` need to match the number of plant stage images.  This info is shown in the popup when selecting a plant.
* `propagationRate/propagationRadius` involves how often plants spread and how far from the original they an propagate
* `windDivider` influences the wind shader.  IIRC a higher value makes the plant more 'rigid'


* `js/ar-sketch.js`

Code for the AR aspect of the project that is effectively a stripped-down version of `sketch.js`.  However, it reads from the accelerometer on a phone to pan the image (or allows for arrow key presses on the computer).

**Things to change when updating**:

1. T
2. B
3. D

* `js/shaders.js`

This file has the shader code used for the wind distortion and the glitch effects used for rewind.  For wind, the `Size`, `Wave`, and `uv` variables all have magic numbers that can be tweaked to change the effect.  FYI, very easy to break.