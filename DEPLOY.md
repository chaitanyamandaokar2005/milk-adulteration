# Deploy on Render + MongoDB Atlas

No AWS keys are used. Color matching is local. Photos can stay on disk or go to **Cloudinary** (optional CDN).

## Atlas

1. Create a cluster and a database named `milkwise`.
2. Create a database user (read/write).
3. Network Access: allow Render (`0.0.0.0/0` is fine for a first deploy).
4. Connection string:

```
mongodb+srv://USER:PASSWORD@CLUSTER.mongodb.net/milkwise?retryWrites=true&w=majority
```

URL-encode special characters in the password.

## Render

Create a **Web Service** from this repo (`render.yaml` is included).

| Variable | Required | Value |
| :--- | :--- | :--- |
| `NODE_ENV` | yes | `production` |
| `MONGODB_URI` | yes | Atlas SRV string |
| `JWT_SECRET` | yes | Long random string (Render can generate) |
| `APP_URL` | yes | `https://milkwise.onrender.com` |
| `CLOUDINARY_*` | no | Only if strip photos must survive restarts |
| `PORT` | no | Render sets this |

Live URL: **https://milkwise.onrender.com**  
Health check: [https://milkwise.onrender.com/api/health](https://milkwise.onrender.com/api/health).

Start command: `node server.js`. Build: `npm ci`.

Adulterant standards seed on boot. Old `data/*.db` files are not migrated.

## Cloudinary (optional, not AWS)

Without it, pad photos sit in `public/uploads` and vanish when Render recycles the instance. Hex results still live in Atlas.

If you add it: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`. Health should then show `"storage": "cloudinary"`.

## After deploy

1. Register (password ≥ 8 characters).
2. Run a strip test, open History, print the screening certificate.
3. Confirm `/api/health` is `ok`.
