# MilkWise

**[Live app](https://milkwise.onrender.com)**  
**[Health](https://milkwise.onrender.com/api/health)**

Photograph a chemical milk test strip pad, sample the color, and get a **NEGATIVE** (closer to the normal pad) or **POSITIVE** (closer to the adulterated pad) screening result for formalin, urea, starch, or detergent.

This is a color-match aid, not an accredited laboratory or official FSSAI certificate.

Hosted on **Render**, data on **MongoDB Atlas**. Strip photos are stored on the server (not Cloudinary/AWS). Color matching does not need a CDN.

---

## Local setup

1. Install [Node.js 18+](https://nodejs.org/) and use [MongoDB Atlas](https://www.mongodb.com/atlas) (or a local Mongo process).
2. Copy environment variables:

```bash
cp .env.example .env
```

3. Set at least:

```env
MONGODB_URI=mongodb+srv://USER:PASSWORD@CLUSTER.mongodb.net/milkwise?retryWrites=true&w=majority
JWT_SECRET=a-long-random-string
PORT=3000
APP_URL=http://localhost:3000
```

4. Install and run:

```bash
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000).

---

## Production (already live)

Public URL: **https://milkwise.onrender.com**

On Render, set:

| Variable | Value |
| :--- | :--- |
| `NODE_ENV` | `production` |
| `MONGODB_URI` | Atlas SRV string (database `milkwise`) |
| `JWT_SECRET` | Long random string |
| `APP_URL` | `https://milkwise.onrender.com` |
| `CLOUDINARY_*` | Not used |

Atlas **Network Access** must allow Render (`0.0.0.0/0` for a first deploy). Sessions last **3 days**. New passwords need **8+** characters.

More detail: [DEPLOY.md](./DEPLOY.md).

---

## Detection standards

| Adulterant | Normal pad | Adulterated pad |
| :--- | :--- | :--- |
| Formalin | Crimson `#5A051E` | Deep violet `#3E1A58` |
| Urea | Off-white `#B6B3A4` | Lemon yellow `#B0B63B` |
| Starch | Amber `#594214` | Pitch charcoal `#120F0B` |
| Detergent | Mauve `#856E72` | Dark slate `#3A3B39` |
