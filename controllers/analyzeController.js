const path = require('path');
const fs = require('fs');
const { AdulterantModel } = require('../models/Adulterant');
const TestResultModel = require('../models/TestResult');
const { hexToRgb, rgbToHex, analyzeStripColor, matchAgainstAllReferences } = require('../services/colorAnalyzer');

/**
 * Strict Binary FSSAI Lab Terminology:
 * NEGATIVE = Pure & safe (no adulterant detected)
 * POSITIVE = Adulterated & unsafe (adulterant detected)
 */
function deriveLabTerminology(detectedStatus) {
  return detectedStatus === 'PURE' ? 'NEGATIVE' : 'POSITIVE';
}

function getTerminologyDescription(terminology) {
  if (terminology === 'NEGATIVE') {
    return 'Pad color is closer to the normal standard. This is a screening result, not a certified laboratory finding.';
  }
  return 'Pad color is closer to the adulterated standard. Treat as a screening alert and confirm with an accredited lab if required.';
}

const analyzeStrip = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload an image of your test strip.' });
    }

    const {
      adulterantSlug = 'formalin',
      sampledColorHex,
      sampleName = 'Milk Sample',
      milkSource = '',
      notes = ''
    } = req.body;

    if (!milkSource || !milkSource.trim()) {
      return res.status(400).json({ error: 'Milk source / supplier is required for traceability.' });
    }

    const imageUrl = req.file.publicUrl || '';

    // Load adulterants from DB
    const allAdulterants = await AdulterantModel.find({});
    if (!allAdulterants || allAdulterants.length === 0) {
      return res.status(500).json({ error: 'Adulterants reference database is not initialized.' });
    }
    const ADULTERANT_ORDER = ['formalin', 'urea', 'starch', 'detergent'];
    allAdulterants.sort((a, b) => {
      const idxA = ADULTERANT_ORDER.indexOf(a.slug);
      const idxB = ADULTERANT_ORDER.indexOf(b.slug);
      return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
    });

    // Determine sampled RGB
    let sampledRgb = [200, 200, 200];
    let finalHex = sampledColorHex;

    if (finalHex && /^#[0-9A-F]{6}$/i.test(finalHex)) {
      sampledRgb = hexToRgb(finalHex);
    } else {
      finalHex = rgbToHex(sampledRgb[0], sampledRgb[1], sampledRgb[2]);
    }

    // Cross-evaluate against all 4 genuine reference standards
    const all4Comparisons = matchAgainstAllReferences(sampledRgb, allAdulterants);

    // Select target adulterant: either user-specified test or auto-detected best match
    let targetAdulterant = null;
    let analysis = null;

    if (adulterantSlug && adulterantSlug !== 'auto') {
      targetAdulterant = allAdulterants.find(a => a.slug === adulterantSlug);
      if (targetAdulterant) {
        analysis = analyzeStripColor(sampledRgb, targetAdulterant);
      }
    }

    if (!targetAdulterant) {
      const best = all4Comparisons[0];
      targetAdulterant = allAdulterants.find(a => a.slug === best.slug) || allAdulterants[0];
      analysis = analyzeStripColor(sampledRgb, targetAdulterant);
    }

    const matchingStripImage = analysis.status === 'PURE'
      ? (targetAdulterant.pureStripImage || targetAdulterant.referenceImage)
      : (targetAdulterant.adulteratedStripImage || targetAdulterant.referenceImage);

    const matchingPadColor = analysis.status === 'PURE'
      ? targetAdulterant.pureColor
      : targetAdulterant.adulteratedColor;

    // Derive FSSAI lab terminology: strictly POSITIVE or NEGATIVE
    const labTerminology = deriveLabTerminology(analysis.status);
    const terminologyDescription = getTerminologyDescription(labTerminology);

    // Generate unique report ID
    const reportId = `MW-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    const testRecordData = {
      userId: req.user.id,
      userEmail: req.user.email,
      adulterantSlug: targetAdulterant.slug,
      adulterantName: targetAdulterant.name,
      imageUrl,
      sampledColorHex: analysis.sampledColor.hex,
      sampledColorRgb: analysis.sampledColor.rgb,
      detectedStatus: analysis.status,
      confidenceScore: analysis.confidence,
      distanceToPure: analysis.distToPure,
      distanceToAdulterated: analysis.distToAdult,
      milkSource: (milkSource || '').trim(),
      labTerminology,
      chemicalReport: {
        purpose: targetAdulterant.purpose,
        snfImpact: targetAdulterant.snfImpact,
        densityImpact: targetAdulterant.densityImpact,
        chemicalMechanism: targetAdulterant.chemicalMechanism,
        healthHazards: targetAdulterant.healthHazards,
        fssaiLimit: targetAdulterant.fssaiLimit
      },
      notes: notes.trim(),
      sampleName: sampleName.trim() || 'Milk Sample'
    };

    const savedRecord = await TestResultModel.create(testRecordData);

    return res.json({
      message: 'Strip analysis completed successfully!',
      testResult: {
        id: savedRecord._id,
        reportId,
        sampleName: savedRecord.sampleName,
        milkSource: savedRecord.milkSource,
        labTerminology,
        terminologyDescription,
        adulterant: {
          slug: targetAdulterant.slug,
          name: targetAdulterant.name,
          chemicalFormula: targetAdulterant.chemicalFormula,
          referenceImage: targetAdulterant.referenceImage,
          pureStripImage: targetAdulterant.pureStripImage,
          adulteratedStripImage: targetAdulterant.adulteratedStripImage,
          matchingStripImage,
          matchingPadColor,
          pureColor: targetAdulterant.pureColor,
          adulteratedColor: targetAdulterant.adulteratedColor,
          detectionTips: targetAdulterant.detectionTips
        },
        imageUrl: savedRecord.imageUrl,
        detectedStatus: savedRecord.detectedStatus,
        confidenceScore: savedRecord.confidenceScore,
        sampledColor: analysis.sampledColor,
        chemicalReport: savedRecord.chemicalReport,
        distanceToPure: analysis.distToPure,
        distanceToAdulterated: analysis.distToAdult,
        pureMatchPct: analysis.pureMatchPct,
        adultMatchPct: analysis.adultMatchPct,
        all4Comparisons,
        createdAt: savedRecord.createdAt,
        user: {
          username: req.user.username,
          fullName: req.user.fullName || req.user.username
        }
      }
    });
  } catch (err) {
    console.error('Error during strip analysis:', err);
    return res.status(500).json({ error: 'Failed to process strip image analysis.' });
  }
};

const getTestHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const history = await TestResultModel.find({ userId });
    return res.json({ history });
  } catch (err) {
    console.error('Error fetching test history:', err);
    return res.status(500).json({ error: 'Failed to retrieve test history.' });
  }
};

const getUserDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const allTests = await TestResultModel.find({ userId });

    const totalTests = allTests.length;
    const pureCount = allTests.filter(t => t.detectedStatus === 'PURE').length;
    const adulteratedCount = allTests.filter(t => t.detectedStatus === 'ADULTERATED').length;
    const lastTestDate = totalTests > 0 ? allTests[0].createdAt : null;
    const avgConfidence = totalTests > 0
      ? Math.round(allTests.reduce((sum, t) => sum + (t.confidenceScore || 0), 0) / totalTests)
      : 0;

    return res.json({
      stats: {
        totalTests,
        pureCount,
        adulteratedCount,
        avgConfidence,
        lastTestDate
      },
      user: {
        username: req.user.username,
        email: req.user.email,
        fullName: req.user.fullName || req.user.username
      }
    });
  } catch (err) {
    console.error('Error fetching dashboard stats:', err);
    return res.status(500).json({ error: 'Failed to fetch dashboard data.' });
  }
};

const deleteTest = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    await TestResultModel.deleteById(id, userId);
    return res.json({ message: 'Test record deleted successfully.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete test record.' });
  }
};

module.exports = {
  analyzeStrip,
  getTestHistory,
  getUserDashboardStats,
  deleteTest
};
