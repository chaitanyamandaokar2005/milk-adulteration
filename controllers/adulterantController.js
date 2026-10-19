const { AdulterantModel } = require('../models/Adulterant');

const ORDER = ['formalin', 'urea', 'starch', 'detergent'];

const getAllAdulterants = async (req, res) => {
  try {
    const list = await AdulterantModel.find({});
    list.sort((a, b) => {
      const idxA = ORDER.indexOf(a.slug);
      const idxB = ORDER.indexOf(b.slug);
      return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
    });
    return res.json({ adulterants: list });
  } catch (err) {
    console.error('Error fetching adulterants:', err);
    return res.status(500).json({ error: 'Failed to load adulterants reference database.' });
  }
};

const getAdulterantBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const item = await AdulterantModel.findOne({ slug });
    if (!item) {
      return res.status(404).json({ error: 'Adulterant not found in database.' });
    }
    return res.json({ adulterant: item });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch adulterant details.' });
  }
};

module.exports = {
  getAllAdulterants,
  getAdulterantBySlug
};
