const fs = require('fs');
const path = require('path');

async function testAll() {
  console.log('=== TESTING API WITH LEFT (NORMAL) & RIGHT (ADULTERATED) STRIP VALUES ===\n');

  // Register & login test user
  const regRes = await fetch('http://localhost:3000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Lab Analyst',
      username: `analyst_${Date.now()}`,
      email: `analyst_${Date.now()}@milklab.in`,
      password: 'password123'
    })
  });
  const regText = await regRes.text();
  let regData;
  try {
    regData = JSON.parse(regText);
  } catch(e) {
    console.error('Registration failed with status:', regRes.status, 'Response:', regText.substring(0, 300));
    process.exit(1);
  }
  const token = regData.token;

  const testCases = [
    {
      name: 'Formalin - Left Strip (Normal / Pure)',
      slug: 'formalin',
      file: 'public/references/formalin_reference.png',
      hex: '#5A051E',
      expected: 'NEGATIVE'
    },
    {
      name: 'Formalin - Right Strip (Adulterated)',
      slug: 'formalin',
      file: 'public/references/formalin_reference.png',
      hex: '#3E1A58',
      expected: 'POSITIVE'
    },
    {
      name: 'Urea - Left Strip (Normal / Pure)',
      slug: 'urea',
      file: 'public/references/urea_reference.png',
      hex: '#B6B3A4',
      expected: 'NEGATIVE'
    },
    {
      name: 'Urea - Right Strip (Adulterated)',
      slug: 'urea',
      file: 'public/references/urea_reference.png',
      hex: '#B0B63B',
      expected: 'POSITIVE'
    },
    {
      name: 'Starch - Left Strip (Normal / Pure)',
      slug: 'starch',
      file: 'public/references/starch_reference.jpg',
      hex: '#594214',
      expected: 'NEGATIVE'
    },
    {
      name: 'Starch - Right Strip (Adulterated)',
      slug: 'starch',
      file: 'public/references/starch_reference.jpg',
      hex: '#120F0B',
      expected: 'POSITIVE'
    },
    {
      name: 'Detergent - Left Strip (Normal / Pure)',
      slug: 'detergent',
      file: 'public/references/detergent_reference.png',
      hex: '#856E72',
      expected: 'NEGATIVE'
    },
    {
      name: 'Detergent - Right Strip (Adulterated)',
      slug: 'detergent',
      file: 'public/references/detergent_reference.png',
      hex: '#3A3B39',
      expected: 'POSITIVE'
    }
  ];

  let passed = 0;
  for (const tc of testCases) {
    const fileBuffer = fs.readFileSync(path.resolve(tc.file));
    const blob = new Blob([fileBuffer], { type: 'image/png' });
    const formData = new FormData();
    formData.append('stripImage', blob, path.basename(tc.file));
    formData.append('adulterantSlug', tc.slug);
    formData.append('sampledColorHex', tc.hex);
    formData.append('sampleName', tc.name);
    formData.append('milkSource', 'Fresh Farm Dairy');

    const res = await fetch('http://localhost:3000/api/analyze/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    const data = await res.json();
    const result = data.testResult;
    const ok = result && result.labTerminology === tc.expected;
    if (ok) passed++;

    console.log(`[${ok ? '✓ PASS' : '✗ FAIL'}] ${tc.name}`);
    if (result) {
      console.log(`       Hex: ${tc.hex} -> Terminology: ${result.labTerminology} (Expected: ${tc.expected}) | Status: ${result.detectedStatus} | Confidence: ${result.confidenceScore}%\n`);
    } else {
      console.log(`       Error: ${JSON.stringify(data)}\n`);
    }
  }

  console.log(`===============================================`);
  console.log(`Summary: ${passed} / ${testCases.length} Tests Passed Perfectly!`);
  console.log(`===============================================`);
  process.exit(passed === testCases.length ? 0 : 1);
}

testAll().catch(e => {
  console.error(e);
  process.exit(1);
});
