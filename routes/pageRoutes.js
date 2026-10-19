const express = require('express');
const { AdulterantModel } = require('../models/Adulterant');

const router = express.Router();
const ORDER = ['formalin', 'urea', 'starch', 'detergent'];

function toPlain(doc) {
  if (!doc) return doc;
  if (typeof doc.toObject === 'function') return doc.toObject();
  return doc;
}

async function loadAdulterants() {
  const list = await AdulterantModel.find({});
  return list
    .map(toPlain)
    .sort((a, b) => {
      const idxA = ORDER.indexOf(a.slug);
      const idxB = ORDER.indexOf(b.slug);
      return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
    });
}

function pageLocals(page, title, extra = {}) {
  return {
    page,
    title,
    layout: extra.layout || 'app',
    scripts: extra.scripts || [],
    adulterants: extra.adulterants || []
  };
}

router.get('/', async (req, res) => {
  const adulterants = await loadAdulterants();
  res.render('home', pageLocals('home', 'Home', { adulterants }));
});

router.get('/test', async (req, res) => {
  const adulterants = await loadAdulterants();
  res.render('test', pageLocals('test', 'Test Strip', {
    adulterants,
    scripts: ['/js/upload.js']
  }));
});

router.get('/result', (req, res) => {
  res.render('result', pageLocals('result', 'Test Result', {
    scripts: ['/js/result.js']
  }));
});

router.get('/calibration', async (req, res) => {
  const adulterants = await loadAdulterants();
  res.render('calibration', pageLocals('calibration', 'Calibration Color Codes', { adulterants }));
});

router.get('/adulterants', async (req, res) => {
  const adulterants = await loadAdulterants();
  res.render('adulterants', pageLocals('adulterants', 'Adulterants Guide', { adulterants }));
});

router.get('/dashboard', (req, res) => {
  res.render('dashboard', pageLocals('dashboard', 'My Dashboard', {
    scripts: ['/js/history.js']
  }));
});

router.get('/login', (req, res) => {
  res.render('login', pageLocals('login', 'Login', { layout: 'auth' }));
});

router.get('/register', (req, res) => {
  res.render('register', pageLocals('register', 'Create Account', { layout: 'auth' }));
});

module.exports = router;
