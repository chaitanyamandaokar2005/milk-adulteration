const express = require('express');
const router = express.Router();
const { getAllAdulterants, getAdulterantBySlug } = require('../controllers/adulterantController');

router.get('/', getAllAdulterants);
router.get('/:slug', getAdulterantBySlug);

module.exports = router;
