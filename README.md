# 🥛 PureMilk AI - Milk Adulteration Test Strip Detection Web App

A modern, aesthetic, light-themed full-stack web application designed for chemical colorimetric test strip detection of milk adulterants (Formalin preservative, Detergent/Soap, Urea, Starch/Maltodextrin). Built with **HTML5, CSS3, JavaScript, Node.js, Express, and MongoDB** (with seamless embedded fallback).

---

## 🌟 Key Features

1. **Light-Themed Aesthetic Laboratory UI**:
   - Clean, modern layout with soft ivory surfaces, glassmorphism cards, responsive grids, and high-contrast health status badges (`✓ PURE` vs `⚠ ADULTERATED`).
   - Smooth animations, micro-interactions, and toast notifications.

2. **Interactive Strip Upload & Colorimeter Canvas**:
   - Drag-and-drop file uploader accepting PNG, JPG, and WebP strip photos.
   - Interactive HTML5 canvas with **eyedropper / magnifying loupe** allowing users to click anywhere on their test strip to inspect the reaction zone.
   - **Auto-Sample Pad**: Automatically detects and extracts the dominant reaction pad color in the lower zone of the strip.
   - Target Adulterant selector: Auto-Detect, Urea, Starch, Detergent, or Formalin.

3. **Database-Driven Scientific Results**:
   - Cross-references uploaded strip color against the calibrated reference standards.
   - **Confidence Score (%)** and **Color Matching Triad** (Your Strip vs Pure Standard vs Adulterated Reference).
   - Side-by-side visual comparison against the genuine laboratory strip photo.
   - Comprehensive chemical report from MongoDB:
     - **Purpose**: Why adulterators add it (falsifying protein, preservative shelf life, artificial lather).
     - **SNF (Solids-Not-Fat) & Density Impact**: Chemical and physical physics alterations.
     - **Reaction Mechanism**: e.g., DMAB condensation, Iodine-amylose helical complex, Schiff reagent oxidation.
     - **Health Hazards & Toxicology**: Group 1 carcinogen, kidney damage, gastric erosion, infant diarrhea.
     - **Regulatory Limits**: FSSAI statutory zero tolerance thresholds.

4. **User Authentication (Login & Sign Up)**:
   - Secure account registration and authentication backed by MongoDB.
   - Password hashing using `bcryptjs`.
   - Session management with JWT tokens (`jsonwebtoken`) stored securely in localStorage and cookies.
   - Guest testing support with immediate user profile association.

5. **Test History Dashboard**:
   - Logged-in users can browse their complete test history with strip photo thumbnails, sampled hex colors, status badges, timestamps, and confidence ratings.
   - One-click deletion of historical records.
   - Printable Certificate of Analysis / Report export.

6. **Laboratory Reference Strips Included**:
   - Calibrated directly against the reaction pads of the four genuine strip photographs provided:
     - **Urea / Ammonium Sulphate**: Pure (Off-White Control `#B2AFA0`) vs Adulterated (Lemon Yellow `#AFB43A`)
     - **Starch / Maltodextrin**: Pure (Mustard Amber `#67551B`) vs Adulterated (Deep Blue-Black `#0E0D0A`)
     - **Detergent / Commercial Soap**: Pure (Mauve `#857275`) vs Adulterated (Dark Slate Charcoal `#3E3F3D`)
     - **Formalin (Formaldehyde)**: Pure (Crimson/Magenta `#C0354A`) vs Adulterated (Deep Violet `#3E1A58`)

---

## 📁 Project Structure

```
milk-adulteration-detector/
├── .env                          # Configuration (PORT, MONGODB_URI, JWT_SECRET)
├── package.json                  # Dependencies & scripts
├── server.js                     # Express server & API routes mount
├── config/
│   └── db.js                     # MongoDB connection via Mongoose + local fallback
├── models/
│   ├── User.js                   # MongoDB User schema (auth)
│   ├── Adulterant.js             # Scientific adulterants encyclopedia & calibration colors
│   └── TestResult.js             # Test records & chemical reports
├── middleware/
│   └── auth.js                   # JWT authentication middleware
├── controllers/
│   ├── authController.js         # Register, Login, Me, Logout
│   ├── adulterantController.js   # Adulterants reference API
│   └── analyzeController.js      # Image upload, colorimetry matching & history
├── routes/
│   ├── authRoutes.js
│   ├── adulterantRoutes.js
│   └── analyzeRoutes.js
├── services/
│   └── colorAnalyzer.js          # Redmean perceptual color distance & HSV science
└── public/
    ├── index.html                # Aesthetic light-themed SPA interface
    ├── css/
    │   └── style.css             # Design system, typography & responsive styling
    ├── js/
    │   ├── app.js                # App runner, health monitor & notifications
    │   ├── auth.js               # Modal controls & JWT session handling
    │   ├── upload.js             # Canvas colorimetry & analysis submission
    │   └── history.js            # MongoDB test history table manager
    ├── references/               # Uploaded calibration laboratory strips
    │   ├── urea_reference.png
    │   ├── starch_reference.jpg
    │   ├── detergent_reference.png
    │   └── water_reference.png
    └── uploads/                  # User uploaded test strip photographs
```

---

## 🚀 Quick Start Guide

### 1. Requirements
- Node.js (v18 or newer)
- MongoDB (optional for local standalone mode, or connect your local/Atlas MongoDB URI)

### 2. Running the Application
From the project folder:
```bash
# Start the server
node server.js
```

Open your browser at:
```
http://localhost:3000
```

### 3. Connecting to MongoDB
The application automatically checks for an active MongoDB instance at the URI defined in `.env`:
```env
MONGODB_URI=mongodb://127.0.0.1:27017/milkadulteration
```
- If MongoDB is running, it connects via **Mongoose** and displays `MongoDB Connected` in the top bar.
- If MongoDB is not yet running, the server automatically uses an embedded persistent datastore so you can test, register, upload, and save records immediately without any crashes!

---

## 🧪 Scientific Detection Reference Table

| Adulterant | Primary Purpose | Chemical Mechanism | Pure Calibrated Pad | Adulterated Calibrated Pad | Health Hazard |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Urea** | Artificially inflate SNF & nitrogen | DMAB condensation forming lemon chromogen | Off-White (`#B2AFA0`) | **Lemon Yellow (`#AFB43A`)** | Nephrotoxicity, kidney failure, toxic nitrosamines |
| **Starch** | Thicken watered milk & restore viscosity | Iodine-amylose helical inclusion complex | Amber Mustard (`#67551B`) | **Pitch Blue-Black (`#0E0D0A`)** | Glycemic spikes in diabetics, acute infantile diarrhea |
| **Detergent** | Create synthetic froth & emulsify oil | Anionic surfactant displacement of cationic dye | Mauve Lavender (`#857275`) | **Dark Slate Charcoal (`#3E3F3D`)** | Esophageal erosion, alkaline gastroenteritis, liver damage |
| **Formalin** | Toxic preservative to mask bacterial souring | Acidic Schiff reagent chromophoric oxidation | Crimson Magenta (`#C0354A`) | **Deep Violet (`#3E1A58`)** | Group 1 carcinogen, corrosive GI damage, liver necrosis |
