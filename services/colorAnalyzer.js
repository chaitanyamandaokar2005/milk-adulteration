// Color science utilities for strip reaction analysis

function hexToRgb(hex) {
  let cleaned = hex.replace('#', '');
  if (cleaned.length === 3) {
    cleaned = cleaned.split('').map(c => c + c).join('');
  }
  const num = parseInt(cleaned, 16);
  return [
    (num >> 16) & 255,
    (num >> 8) & 255,
    num & 255
  ];
}

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(x => {
    const hex = Math.round(Math.max(0, Math.min(255, x))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('').toUpperCase();
}

// Perceptually weighted Euclidean color distance (redmean formula)
function colorDistance(rgb1, rgb2) {
  const rMean = (rgb1[0] + rgb2[0]) / 2;
  const deltaR = rgb1[0] - rgb2[0];
  const deltaG = rgb1[1] - rgb2[1];
  const deltaB = rgb1[2] - rgb2[2];
  
  const weightR = 2 + (rMean / 256);
  const weightG = 4.0;
  const weightB = 2 + ((255 - rMean) / 256);

  return Math.sqrt(
    weightR * deltaR * deltaR +
    weightG * deltaG * deltaG +
    weightB * deltaB * deltaB
  );
}

// Convert RGB to HSV for hue/saturation evaluation
function rgbToHsv(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;

  if (max !== min) {
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return [h * 360, s * 100, v * 100];
}

/**
 * Analyzes a sampled strip color against an adulterant definition
 * using ground-truth reference pad calibrations extracted from reference photos.
 */
function analyzeStripColor(sampledRgb, adulterantData) {
  const pureRgb = adulterantData.pureColor.rgb;
  const adultRgb = adulterantData.adulteratedColor.rgb;

  const distToPure = colorDistance(sampledRgb, pureRgb);
  const distToAdult = colorDistance(sampledRgb, adultRgb);

  const [h, s, v] = rgbToHsv(sampledRgb[0], sampledRgb[1], sampledRgb[2]);

  // Binary classification: default to closest Euclidean color distance
  let status = distToAdult < distToPure ? 'ADULTERATED' : 'PURE';

  // Fine-tuned chemical reaction checks calibrated against laboratory reference strips:
  if (adulterantData.slug === 'urea') {
    // Normal strip is pale off-white (saturation < 20%)
    // Adulterated strip is saturated lemon yellow (saturation > 30%, hue 40° to 80°)
    if (s > 30 && h >= 40 && h <= 80) {
      status = 'ADULTERATED';
    } else if (s <= 20) {
      status = 'PURE';
    }
  } else if (adulterantData.slug === 'starch') {
    // Normal strip is amber/mustard yellow-brown (brightness v >= 22%)
    // Adulterated strip is pitch dark blue-black/charcoal (brightness v < 18%)
    if (v < 18) {
      status = 'ADULTERATED';
    } else if (v >= 22) {
      status = 'PURE';
    }
  } else if (adulterantData.slug === 'formalin') {
    // Normal strip is deep crimson/magenta (Red strongly dominates Blue)
    // Adulterated strip shifts to violet-purple (Blue rises to comparable or exceeds Red)
    if (sampledRgb[0] > sampledRgb[2] * 1.3 && sampledRgb[0] > 55) {
      status = 'PURE';
    } else if (sampledRgb[2] > 35 && sampledRgb[2] >= sampledRgb[0] * 0.7) {
      status = 'ADULTERATED';
    }
  } else if (adulterantData.slug === 'detergent') {
    // Normal strip is mauve/pink (Red > 95 and Red distinctly higher than Green)
    // Adulterated strip is dark slate charcoal (Red < 75 and low brightness v < 30)
    if (sampledRgb[0] > 95 && sampledRgb[0] > sampledRgb[1] + 12) {
      status = 'PURE';
    } else if (sampledRgb[0] < 75 && v < 30) {
      status = 'ADULTERATED';
    }
  }

  // Calculate confidence score based on margin between pure and adult distances
  const confidence = Math.min(99, Math.max(68, Math.round(
    status === 'PURE'
      ? (distToAdult / (distToPure + distToAdult || 1)) * 100
      : (distToPure / (distToPure + distToAdult || 1)) * 100
  )));

  // Calculate percentage similarity scores against reference pads
  const pureMatchPct = Math.max(5, Math.min(99, Math.round(100 - (distToPure / 2.8))));
  const adultMatchPct = Math.max(5, Math.min(99, Math.round(100 - (distToAdult / 2.8))));
  const minPadDist = Math.min(distToPure, distToAdult);

  return {
    status,
    confidence,
    distToPure: Math.round(distToPure),
    distToAdult: Math.round(distToAdult),
    pureMatchPct,
    adultMatchPct,
    minPadDist: Math.round(minPadDist),
    sampledColor: {
      rgb: sampledRgb,
      hex: rgbToHex(sampledRgb[0], sampledRgb[1], sampledRgb[2]),
      hsv: [Math.round(h), Math.round(s), Math.round(v)]
    }
  };
}

/**
 * Cross-evaluates a sampled strip against all 4 reference standards.
 */
function matchAgainstAllReferences(sampledRgb, allAdulterants) {
  const evaluations = allAdulterants.map(adulterant => {
    const analysis = analyzeStripColor(sampledRgb, adulterant);
    return {
      slug: adulterant.slug,
      name: adulterant.name,
      referenceImage: adulterant.referenceImage,
      pureStripImage: adulterant.pureStripImage,
      adulteratedStripImage: adulterant.adulteratedStripImage,
      pureColor: adulterant.pureColor,
      adulteratedColor: adulterant.adulteratedColor,
      status: analysis.status,
      confidence: analysis.confidence,
      distToPure: analysis.distToPure,
      distToAdult: analysis.distToAdult,
      pureMatchPct: analysis.pureMatchPct,
      adultMatchPct: analysis.adultMatchPct,
      minPadDist: analysis.minPadDist,
      matchingStripImage: analysis.status === 'PURE' ? adulterant.pureStripImage : adulterant.adulteratedStripImage,
      matchingColor: analysis.status === 'PURE' ? adulterant.pureColor : adulterant.adulteratedColor
    };
  });

  // Sort by smallest distance to a calibrated reaction pad
  evaluations.sort((a, b) => a.minPadDist - b.minPadDist);

  return evaluations;
}

module.exports = {
  hexToRgb,
  rgbToHex,
  colorDistance,
  rgbToHsv,
  analyzeStripColor,
  matchAgainstAllReferences
};

