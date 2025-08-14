//// global data

// unsure if hd_scale is necessary or if my math is just off
// TBD: probably would be better to render as full-def and then scale to viewport
const scale_bands = [0.30, 0.40, 0.50, 0.60];
let QR_map = {
  0: { name: 'Milkweed', scale: 1.00, hd_scale: 1.0 },
  1: { name: 'Nymphaea', scale: 1.00, hd_scale: 0.7 },
  2: { name: 'Arrow-Arum-Peltandra-Virginica', scale: 1.0, hd_scale: 0.7 },
  3: { name: 'Paper-Birch', scale: 1.0, hd_scale: 0.7 },
  4: { name: 'PawPaw', scale: 1.0, hd_scale: 0.7 },
  5: { name: 'Populus-Deltoides', scale: 0.60, hd_scale: 0.7 },
  6: { name: 'Zizania-Aquatica', scale: 1.00, hd_scale: 0.7 },
  99: { name: 'Piranha', scale: 5.0, hd_scale: 8.0 },
}
let plant_images = {};

// windDivider --> larger means less wind (millis() / windDivider)
let plantInfo = {
  'Milkweed': {
    scientificName: "Asclepias syriaca",
    description: "Common milkweed is a perennial wildflower native to North America. It's the primary host plant for monarch butterfly caterpillars and produces distinctive pink to purple flower clusters.",
    growthStages: [
      "Seedling - Small rosette of leaves",
      "Vegetative - Stems growing, leaves developing",
      "Budding - Flower buds forming",
      "Flowering - Pink-purple flower clusters",
      "Fruiting - Seed pods developing and dispersing"
    ],
    nativeRegion: "Eastern and Central North America",
    ecology: "Essential host plant for monarch butterflies. Produces toxic compounds that protect caterpillars from predators. Important nectar source for many pollinators.",
    propagationRate: 0.1,
    propagationRadius: 100,
    suitableAreas: ['grass'],
    windDivider: 6400,
  },
  'Populus-Deltoides': {
    scientificName: "Populus deltoides",
    description: "Eastern cottonwood is a large, fast-growing deciduous tree native to North America. It's known for its triangular leaves and cotton-like seeds that disperse in the wind.",
    growthStages: [
      "Seedling - Small tree with simple leaves",
      "Sapling - Rapid vertical growth",
      "Young tree - Developing crown structure",
      "Mature tree - Full height, flowering",
      "Reproductive - Producing cottony seeds"
    ],
    nativeRegion: "Eastern and Central North America",
    ecology: "Pioneer species that colonizes disturbed areas. Provides habitat for birds and mammals. Important riparian species that stabilizes riverbanks.",
    propagationRate: 0.1,
    propagationRadius: 100,
    suitableAreas: ['grass'],
    windDivider: 10400,
  },
  'PawPaw': {
    scientificName: "Asimina triloba",
    description: "Pawpaw is a small deciduous tree native to eastern North America. It produces the largest edible fruit native to the United States, with a tropical flavor.",
    growthStages: [
      "Seedling - Small tree with simple leaves",
      "Sapling - Developing branching structure",
      "Young tree - Beginning to flower",
      "Mature tree - Regular flowering and fruiting",
      "Fruiting - Large green fruits developing"
    ],
    nativeRegion: "Eastern United States",
    ecology: "Understory tree that thrives in rich, moist soils. Fruits are eaten by mammals and birds. Flowers are pollinated by flies and beetles.",
    propagationRate: 0.1,
    propagationRadius: 100,
    suitableAreas: ['grass'],
    windDivider: 2400,
  },
  'Zizania-Aquatica': {
    scientificName: "Zizania aquatica",
    description: "Wild rice is an annual aquatic grass native to North America. It grows in shallow water and produces edible grains that have been harvested by indigenous peoples for centuries.",
    growthStages: [
      "Seedling - Floating leaves in water",
      "Vegetative - Tall stems growing above water",
      "Flowering - Inflorescence developing",
      "Grain formation - Seeds developing",
      "Mature - Seeds ready for dispersal"
    ],
    nativeRegion: "Eastern and Central North America",
    ecology: "Important food source for waterfowl and other wildlife. Provides habitat for aquatic organisms. Traditional food crop for indigenous communities.",
    propagationRate: 0.1,
    propagationRadius: 100,
    suitableAreas: ['water'],
    windDivider: 2400,
  },
  'Nymphaea': {
    scientificName: "Nymphaea odorata",
    description: "American white water lily is a perennial aquatic plant with floating leaves and fragrant white flowers. It creates beautiful lily pads on the water's surface.",
    growthStages: [
      "Seedling - Small floating leaves",
      "Vegetative - Expanding lily pads",
      "Budding - Flower buds developing",
      "Flowering - White fragrant flowers",
      "Fruiting - Seeds developing underwater"
    ],
    nativeRegion: "North America",
    ecology: "Provides shade and shelter for aquatic life. Flowers are pollinated by beetles. Important for water quality and aquatic ecosystem health.",
    propagationRate: 0.05,
    propagationRadius: 50,
    suitableAreas: ['water'],
    windDivider: 3400,
  },
  'Paper-Birch': {
    scientificName: "Betula papyrifera",
    description: "Paper birch is a medium-sized deciduous tree known for its distinctive white, papery bark that peels in thin layers. It's a pioneer species that colonizes disturbed areas.",
    growthStages: [
      "Seedling - Small tree with smooth bark",
      "Sapling - White bark developing",
      "Young tree - Bark beginning to peel",
      "Mature tree - Full white bark display",
      "Reproductive - Catkins and seeds"
    ],
    nativeRegion: "Northern North America",
    ecology: "Pioneer species that establishes after fires or disturbances. Provides food for birds and mammals. Bark was traditionally used by indigenous peoples.",
    propagationRate: 0.05,
    propagationRadius: 50,
    suitableAreas: ['grass'],
    windDivider: 9400,
  },
  'Arrow-Arum-Peltandra-Virginica': {
    scientificName: "Peltandra virginica",
    description: "Arrow arum is a perennial aquatic plant with distinctive arrow-shaped leaves. It grows in wetlands and produces greenish-white flowers on a spadix.",
    growthStages: [
      "Seedling - Small arrow-shaped leaves",
      "Vegetative - Expanding leaves",
      "Flowering - Spadix developing",
      "Fruiting - Green berries forming",
      "Mature - Seeds ready for dispersal"
    ],
    nativeRegion: "Eastern North America",
    ecology: "Important wetland species that provides habitat for aquatic wildlife. Helps stabilize wetland soils and improve water quality.",
    propagationRate: 0.95,
    propagationRadius: 50,
    suitableAreas: ['grass'],
    windDivider: 2400,
  },
  'Piranha': {
    scientificName: "Piranha plantus specialis",
    description: "A special carnivorous plant with unique properties. This plant has adapted to thrive in various environments and displays unusual growth patterns.",
    growthStages: [
      "Seedling - Small carnivorous leaves",
      "Vegetative - Expanding trap structures",
      "Flowering - Specialized flowers",
      "Fruiting - Unique seed dispersal",
      "Mature - Full carnivorous capacity"
    ],
    nativeRegion: "Special ecosystem",
    ecology: "Carnivorous plant with unique adaptations. Plays a special role in its ecosystem with unusual propagation methods.",
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
  // if (maskPixel[0] === 0 && maskPixel[1] === 0 && maskPixel[2] === 0) {
  if (maskPixel[0] <= 20 && maskPixel[1] === 0 && maskPixel[2] === 255) {
    areaType = 'grass';
  } else if (maskPixel[0] >= 250 && maskPixel[1] <= 10 && maskPixel[2] <= 10) {
    // } else if (maskPixel[0] === 255 && maskPixel[1] === 255 && maskPixel[2] === 255) {
    areaType = 'water';
  } else {
    return false;
  }



  // console.log("heyoo", x, y, maskX, maskY, areaType, maskPixel[0], maskPixel[1], maskPixel[2])

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