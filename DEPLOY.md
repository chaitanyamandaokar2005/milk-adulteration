# Deploy on Render + MongoDB Atlas

Live URL: **https://milkwise.onrender.com**  
Health: [https://milkwise.onrender.com/api/health](https://milkwise.onrender.com/api/health)

No AWS. No Cloudinary. Color matching is local. Strip photos are written to disk on the instance (they can disappear when Render restarts; the hex result still lives in Atlas).

## Atlas

1. Cluster + database `milkwise`.
2. Database user with read/write.
3. Network Access: `0.0.0.0/0` so Render can connect.
4. Connection string:

```
mongodb+srv://USER:PASSWORD@CLUSTER.mongodb.net/milkwise?retryWrites=true&w=majority
```

URL-encode special characters in the password.

## Render environment

| Variable | Required | Value |
| :--- | :--- | :--- |
| `NODE_ENV` | yes | `production` |
| `MONGODB_URI` | yes | Atlas SRV string |
| `JWT_SECRET` | yes | Long random string |
| `APP_URL` | yes | `https://milkwise.onrender.com` |
| `PORT` | no | Render sets this |

Start: `node server.js`. Build: `npm ci`. Health: `/api/health`.

Sessions last 3 days. Passwords need 8+ characters.
