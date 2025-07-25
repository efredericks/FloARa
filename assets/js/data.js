//// global data

// unsure if hd_scale is necessary or if my math is just off
// TBD: probably would be better to render as full-def and then scale to viewport
let QR_map = {
  0: { name: 'Milkweed', scale: 0.04, hd_scale: 0.07 },
  1: { name: 'Nymphaea', scale: 0.04, hd_scale: 0.07 },
  2: { name: 'Arrow-Arum-Peltandra-Virginica', scale: 0.2, hd_scale: 0.07 },
  3: { name: 'Paper-Birch', scale: 0.2, hd_scale: 0.07 },
  4: { name: 'PawPaw', scale: 0.2, hd_scale: 0.07 },
  5: { name: 'Populus-Deltoides', scale: 0.08, hd_scale: 0.07 },
  6: { name: 'Zizania-Aquatica', scale: 0.04, hd_scale: 0.07 },
  99: { name: 'Piranha', scale: 1.8, hd_scale: 1.0 },
}
let plant_images = {};

// windDivider --> larger means less wind (millis() / windDivider)
let plantInfo = {
  'Milkweed': {
    scientificName: "Placeholder",
    description: "A placeholder plant",
    growthStages: [
      "Stage 1",
      "Stage 2",
      "Stage 3",
      "Stage 4",
      "Stage 5"
    ],
    nativeRegion: "Placeholder",
    ecology: "Placeholder",
    propagationRate: 0.1,
    propagationRadius: 100,
    suitableAreas: ['grass'],
    windDivider: 2400,
  },
  'Populus-Deltoides': {
    scientificName: "Placeholder",
    description: "A placeholder plant",
    growthStages: [
      "Stage 1",
      "Stage 2",
      "Stage 3",
      "Stage 4",
      "Stage 5"
    ],
    nativeRegion: "Placeholder",
    ecology: "Placeholder",
    propagationRate: 0.1,
    propagationRadius: 100,
    suitableAreas: ['grass'],
    windDivider: 8400,
  },
  'PawPaw': {
    scientificName: "Placeholder",
    description: "A placeholder plant",
    growthStages: [
      "Stage 1",
      "Stage 2",
      "Stage 3",
      "Stage 4",
      "Stage 5"
    ],
    nativeRegion: "Placeholder",
    ecology: "Placeholder",
    propagationRate: 0.1,
    propagationRadius: 100,
    suitableAreas: ['grass'],
    windDivider: 2400,
  },
  'Zizania-Aquatica': {
    scientificName: "Placeholder",
    description: "A placeholder plant",
    growthStages: [
      "Stage 1",
      "Stage 2",
      "Stage 3",
      "Stage 4",
      "Stage 5"
    ],
    nativeRegion: "Placeholder",
    ecology: "Placeholder",
    propagationRate: 0.1,
    propagationRadius: 100,
    suitableAreas: ['grass'],
    windDivider: 2400,
  },
  'Nymphaea': {
    scientificName: "Placeholder",
    description: "A placeholder plant",
    growthStages: [
      "Stage 1",
      "Stage 2",
      "Stage 3",
      "Stage 4",
      "Stage 5"
    ],
    nativeRegion: "Placeholder",
    ecology: "Placeholder",
    propagationRate: 0.05,
    propagationRadius: 50,
    suitableAreas: ['water'],
    windDivider: 3400,
  },
  'Paper-Birch': {
    scientificName: "Placeholder",
    description: "A placeholder plant",
    growthStages: [
      "Stage 1",
      "Stage 2",
      "Stage 3",
      "Stage 4",
      "Stage 5"
    ],
    nativeRegion: "Placeholder",
    ecology: "Placeholder",
    propagationRate: 0.05,
    propagationRadius: 50,
    suitableAreas: ['grass'],
    windDivider: 6400,
  },
  'Arrow-Arum-Peltandra-Virginica': {
    scientificName: "Placeholder",
    description: "A placeholder plant",
    growthStages: [
      "Stage 1",
      "Stage 2",
      "Stage 3",
      "Stage 4",
      "Stage 5"
    ],
    nativeRegion: "Placeholder",
    ecology: "Placeholder",
    propagationRate: 0.95,
    propagationRadius: 50,
    suitableAreas: ['grass'],
    windDivider: 2400,
  },
  'Piranha': {
    scientificName: "Placeholder",
    description: "A placeholder plant",
    growthStages: [
      "Stage 1",
      "Stage 2",
      "Stage 3",
      "Stage 4",
      "Stage 5"
    ],
    nativeRegion: "Placeholder",
    ecology: "Placeholder",
    propagationRate: 0.15,
    propagationRadius: 150,
    suitableAreas: ['grass', 'water'],
    windDivider: 2400,
  }
};

//// global functions

// Add function to check if location is valid for plant type
function isValidPlantLocation(x, y, suitableAreas) {
  // Get the pixel color at the location
  const maskX = Math.floor(x);
  const maskY = Math.floor(y);
  const maskPixel = mask.get(maskX, maskY);

  // Check if the location is within bounds
  if (maskX < 0 || maskX >= mask.width || maskY < 0 || maskY >= mask.height) {
    return false;
  }

  // Determine the area type based on mask color
  let areaType;
  if (maskPixel[0] === 0 && maskPixel[1] === 0 && maskPixel[2] === 0) {
    areaType = 'grass';
  } else if (maskPixel[0] >= 250 && maskPixel[1] <= 10 && maskPixel[2] <= 10) {
    // } else if (maskPixel[0] === 255 && maskPixel[1] === 255 && maskPixel[2] === 255) {
    areaType = 'water';
  } else {
    return false;
  }

  // Check if the area type is suitable for the plant
  return suitableAreas.includes(areaType);
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

// return difference in days
function dateDifference(start, end) {
  return (start - end) / (1000 * 3600 * 24);
}