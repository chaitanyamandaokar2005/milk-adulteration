# MilkWise

Light-mode laboratory app for chemical colorimetric milk test strips (formalin, urea, starch, detergent). Upload a pad photo, sample the color, and get a **NEGATIVE** (closer to the normal pad) or **POSITIVE** (closer to the adulterated pad) **screening** result.

This is a color-match aid, not an accredited laboratory or official FSSAI certificate.

Stack: **Node.js, Express, EJS, MongoDB (Atlas or local).** Optional Cloudinary for strip photos on Render. **No AWS.**

---

## Local setup

1. Install [Node.js 18+](https://nodejs.org/) and [MongoDB](https://www.mongodb.com/try/download/community) (or use [MongoDB Atlas](https://www.mongodb.com/atlas)).
2. Copy environment variables:

```bash
cp .env.example .env
```

3. Set at least:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/milkwise
JWT_SECRET=a-long-random-string
PORT=3000
```

4. Install and run:

```bash
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000).

MongoDB must be reachable. There is no local NeDB/SQLite fallback.

Optional: fill `CLOUDINARY_*` so strip photos persist on a CDN instead of `public/uploads`.

---

## After these code changes

Public host: **[DEPLOY.md](./DEPLOY.md)** (Render + MongoDB Atlas).

---

## Detection standards

| Adulterant | Normal pad | Adulterated pad |
| :--- | :--- | :--- |
| Formalin | Crimson `#5A051E` | Deep violet `#3E1A58` |
| Urea | Off-white `#B6B3A4` | Lemon yellow `#B0B63B` |
| Starch | Amber `#594214` | Pitch charcoal `#120F0B` |
| Detergent | Mauve `#856E72` | Dark slate `#3A3B39` |
