const { colorDistance, hexToRgb, rgbToHsv } = require('./services/colorAnalyzer');

const STANDARDS = {
  formalin: {
    pure: { hex: '#5A051E', rgb: [90, 5, 30] }, // Left / Top: Crimson-Magenta (normal / pure milk)
    adult: { hex: '#3E1A58', rgb: [62, 26, 88] } // Right / Bottom: Deep Violet-Purple (adulterated)
  },
  urea: {
    pure: { hex: '#B6B3A4', rgb: [182, 179, 164] }, // Left: Pale Off-White control (normal / pure milk)
    adult: { hex: '#B0B63B', rgb: [176, 182, 59] } // Right: Vivid Lemon Yellow (adulterated)
  },
  starch: {
    pure: { hex: '#594214', rgb: [89, 66, 20] }, // Left: Amber / Mustard Brown (normal / pure milk)
    adult: { hex: '#120F0B', rgb: [18, 15, 11] } // Right: Deep Blue-Black / Pitch Charcoal (adulterated)
  },
  detergent: {
    pure: { hex: '#856E72', rgb: [133, 110, 114] }, // Left: Light Mauve / Lavender-Pink (normal / pure milk)
    adult: { hex: '#3A3B39', rgb: [58, 59, 57] } // Right: Dark Slate Charcoal (adulterated)
  }
};

function classify(sampledRgb, slug) {
  const std = STANDARDS[slug];
  const dPure = colorDistance(sampledRgb, std.pure.rgb);
  const dAdult = colorDistance(sampledRgb, std.adult.rgb);
  const [h, s, v] = rgbToHsv(sampledRgb[0], sampledRgb[1], sampledRgb[2]);

  // Strict binary classification: Closer to Pure -> PURE (NEGATIVE), Closer to Adult -> ADULTERATED (POSITIVE)
  let status = dAdult < dPure ? 'ADULTERATED' : 'PURE';

  // Specific chemical shift checks based on the reference reaction:
  if (slug === 'urea') {
    // Urea adulterated pad is distinctively saturated yellow (s > 35, h between 45 and 75)
    // Normal pad has almost no yellow saturation (s < 15, pale gray/off-white)
    if (s > 35 && h >= 45 && h <= 75) {
      status = 'ADULTERATED';
    } else if (s <= 20) {
      status = 'PURE';
    }
  } else if (slug === 'starch') {
    // Starch adulterated pad is intensely dark (v < 18, charcoal black)
    // Normal pad is brownish-yellow (v >= 25, clearly brighter)
    if (v < 16) {
      status = 'ADULTERATED';
    } else if (v >= 24) {
      status = 'PURE';
    }
  } else if (slug === 'formalin') {
    // Formalin normal pad has strong red dominance (R > B * 1.5)
    // Formalin adulterated pad has purple/violet shift (B >= R * 0.9 or Blue > 40 with low red)
    if (sampledRgb[0] > sampledRgb[2] * 1.4 && sampledRgb[0] > 60) {
      status = 'PURE';
    } else if (sampledRgb[2] > 40 && sampledRgb[2] >= sampledRgb[0] * 0.7) {
      status = 'ADULTERATED';
    }
  } else if (slug === 'detergent') {
    // Detergent normal pad is mauve/pinkish (R > 100, R > G and R > B)
    // Detergent adulterated pad is dark slate gray (R, G, B are all low and roughly equal, R < 75)
    if (sampledRgb[0] > 105 && sampledRgb[0] > sampledRgb[1] + 15) {
      status = 'PURE';
    } else if (sampledRgb[0] < 75 && v < 30) {
      status = 'ADULTERATED';
    }
  }

  const confidence = Math.min(99, Math.max(70, Math.round(
    status === 'PURE'
      ? (dAdult / (dPure + dAdult || 1)) * 100
      : (dPure / (dPure + dAdult || 1)) * 100
  )));

  return { status, confidence, dPure: Math.round(dPure), dAdult: Math.round(dAdult) };
}

console.log('Testing calibrated classifier:');
for (const [slug, std] of Object.entries(STANDARDS)) {
  const pCheck = classify(std.pure.rgb, slug);
  const aCheck = classify(std.adult.rgb, slug);
  console.log(`${slug.toUpperCase()}:`);
  console.log(`  LEFT (Normal) RGB(${std.pure.rgb}) => ${pCheck.status} (dPure:${pCheck.dPure}, dAdult:${pCheck.dAdult}, conf:${pCheck.confidence}%)`);
  console.log(`  RIGHT (Adult) RGB(${std.adult.rgb}) => ${aCheck.status} (dPure:${aCheck.dPure}, dAdult:${aCheck.dAdult}, conf:${aCheck.confidence}%)`);
}

console.log('\nTesting Real-world Lighting Variations:');
console.log('Urea Normal Light/Dark variations:', classify([170, 168, 155], 'urea').status, classify([200, 195, 185], 'urea').status);
console.log('Urea Adulterated variations:', classify([160, 170, 45], 'urea').status, classify([190, 195, 70], 'urea').status);
console.log('Starch Normal variations:', classify([105, 80, 25], 'starch').status, classify([75, 55, 15], 'starch').status);
console.log('Starch Adulterated variations:', classify([25, 22, 18], 'starch').status, classify([10, 8, 6], 'starch').status);
console.log('Formalin Normal variations:', classify([105, 10, 35], 'formalin').status, classify([75, 2, 22], 'formalin').status);
console.log('Formalin Adulterated variations:', classify([50, 18, 65], 'formalin').status, classify([70, 30, 95], 'formalin').status);
console.log('Detergent Normal variations:', classify([145, 120, 125], 'detergent').status, classify([120, 100, 105], 'detergent').status);
console.log('Detergent Adulterated variations:', classify([65, 66, 64], 'detergent').status, classify([45, 46, 44], 'detergent').status);
