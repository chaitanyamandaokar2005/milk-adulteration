const { analyzeStripColor } = require('./services/colorAnalyzer');
const { INITIAL_ADULTERANTS } = require('./models/Adulterant');

console.log('=== TESTING COLOR ANALYZER WITH ACTUAL STRIP VALUES ===\n');

INITIAL_ADULTERANTS.forEach(adulterant => {
  console.log(`--- Testing ${adulterant.name} (${adulterant.slug}) ---`);
  console.log(`Calibrated Pure: ${adulterant.pureColor.hex} | Calibrated Adult: ${adulterant.adulteratedColor.hex}`);

  // Test 1: User samples normal / pure pad
  const pureRes = analyzeStripColor(adulterant.pureColor.rgb, adulterant);
  console.log(`Pure Sample Result -> Status: ${pureRes.status} | DistPure: ${pureRes.distToPure} | DistAdult: ${pureRes.distToAdult} | Conf: ${pureRes.confidence}%`);

  // Test 2: User samples adulterated pad
  const adultRes = analyzeStripColor(adulterant.adulteratedColor.rgb, adulterant);
  console.log(`Adult Sample Result -> Status: ${adultRes.status} | DistPure: ${adultRes.distToPure} | DistAdult: ${adultRes.distToAdult} | Conf: ${adultRes.confidence}%`);

  // Test 3: What if user uploads an unreacted/white/cream pad or normal photo?
  // e.g. RGB(182, 179, 164) (the actual left pad of Urea)
  if (adulterant.slug === 'urea') {
    const leftPadRes = analyzeStripColor([182, 179, 164], adulterant);
    console.log(`Actual Urea Left Pad RGB(182, 179, 164) -> Status: ${leftPadRes.status} | DistPure: ${leftPadRes.distToPure} | DistAdult: ${leftPadRes.distToAdult}`);
    const rightPadRes = analyzeStripColor([176, 182, 59], adulterant);
    console.log(`Actual Urea Right Pad RGB(176, 182, 59) -> Status: ${rightPadRes.status} | DistPure: ${rightPadRes.distToPure} | DistAdult: ${rightPadRes.distToAdult}`);
  }

  // Test 4: What if user uploads Starch left pad RGB(89, 66, 20) vs right pad RGB(18, 15, 11)?
  if (adulterant.slug === 'starch') {
    const leftPadRes = analyzeStripColor([89, 66, 20], adulterant);
    console.log(`Actual Starch Left Pad RGB(89, 66, 20) -> Status: ${leftPadRes.status} | DistPure: ${leftPadRes.distToPure} | DistAdult: ${leftPadRes.distToAdult}`);
    const rightPadRes = analyzeStripColor([18, 15, 11], adulterant);
    console.log(`Actual Starch Right Pad RGB(18, 15, 11) -> Status: ${rightPadRes.status} | DistPure: ${rightPadRes.distToPure} | DistAdult: ${rightPadRes.distToAdult}`);
  }

  // Test 5: Detergent left pad RGB(133, 110, 114) vs right pad RGB(58, 59, 57)
  if (adulterant.slug === 'detergent') {
    const leftPadRes = analyzeStripColor([133, 110, 114], adulterant);
    console.log(`Actual Det Left Pad RGB(133, 110, 114) -> Status: ${leftPadRes.status} | DistPure: ${leftPadRes.distToPure} | DistAdult: ${leftPadRes.distToAdult}`);
    const rightPadRes = analyzeStripColor([58, 59, 57], adulterant);
    console.log(`Actual Det Right Pad RGB(58, 59, 57) -> Status: ${rightPadRes.status} | DistPure: ${rightPadRes.distToPure} | DistAdult: ${rightPadRes.distToAdult}`);
  }

  // Test 6: Formalin magenta pad RGB(83, 0, 26) vs violet pad RGB(52, 20, 67)
  if (adulterant.slug === 'formalin') {
    const leftPadRes = analyzeStripColor([83, 0, 26], adulterant);
    console.log(`Actual Form Normal Pad RGB(83, 0, 26) -> Status: ${leftPadRes.status} | DistPure: ${leftPadRes.distToPure} | DistAdult: ${leftPadRes.distToAdult}`);
    const rightPadRes = analyzeStripColor([52, 20, 67], adulterant);
    console.log(`Actual Form Adult Pad RGB(52, 20, 67) -> Status: ${rightPadRes.status} | DistPure: ${rightPadRes.distToPure} | DistAdult: ${rightPadRes.distToAdult}`);
  }

  console.log('');
});
