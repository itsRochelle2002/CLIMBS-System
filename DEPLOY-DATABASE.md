# Step-by-Step: Connect PostgreSQL Database sa Render

Para **ma-save ang tanan data** sa system (members, menu, employees, orders, admin profile) bisan ma-restart o ma-redeploy ang app, i-connect ang **PostgreSQL database** sa Render. Human nimo ani, ang app naa na naka-set sa code — kinahanglan nimo ra **i-add ang database** sa Render ug i-connect sa imong Web Service.

---

## 1. Add PostgreSQL sa Render

1. Login sa **https://dashboard.render.com**
2. Click **“New +”** → **“PostgreSQL”**
3. **Name:** `climbs-db` (or bisag unsa)
4. **Region:** Same sa imong Web Service (e.g. Singapore)
5. **Instance Type:** **Free**
6. Click **“Create Database”**
7. Hulat hangtod **Status: Available**. Human ato, naa na ka **Connection** info.

---

## 2. Kuhaa ang Internal Database URL

1. Open ang imong **PostgreSQL** service sa Render.
2. Sa **“Connections”** section, naa **“Internal Database URL”** (starts with `postgres://`).
3. **Copy** ni nga URL. Example shape:
   ```text
   postgres://climbs_db_user:xxxx@dpg-xxxx-a/render_climbs_db
   ```
   Ang **Internal** URL gamiton kay same network ra sa imong Web Service (mas paspas ug libre).

---

## 3. I-connect ang Database sa imong Web Service

1. Adto sa imong **Web Service** (ang CLIMBS app nga na-deploy nimo).
2. Tab **“Environment”** (left sidebar).
3. Click **“Add Environment Variable”**.
4. **Key:** `DATABASE_URL`
5. **Value:** I-paste ang **Internal Database URL** nga gi-copy nimo sa step 2.
6. Click **“Save Changes”**.

Render mo-**redeploy** ang app. Human sa deploy, ang app mo-detect sa `DATABASE_URL` ug mo-use na sa **PostgreSQL** imbes JSON files. Tanan data (members, menu, employees, orders, admin profile) ma-save na sa database.

---

## 4. Verify

1. Human sa redeploy, open ang imong app URL (e.g. `https://climbs-xxx.onrender.com`).
2. Test:
   - **Register** new member → check kung na-save (e.g. login, or check Members sa admin).
   - **Add menu item** or place order → refresh/reopen — data dapat naa pa.
3. Sa **Logs** sa Web Service (Render), makita nimo ang line:
   ```text
   Database initialized (PostgreSQL)
   ```
   kung naa gyud `DATABASE_URL` ug na-connect ang app sa DB.

---

## Summary

| Step | Action |
|------|--------|
| 1 | Render Dashboard → New → PostgreSQL → Create (Free) |
| 2 | Copy **Internal Database URL** sa PostgreSQL service |
| 3 | Web Service → Environment → Add `DATABASE_URL` = (paste URL) → Save |
| 4 | Wait for redeploy, then test register/order — data ma-persist na |

**Note:** Kung wala nimo i-set ang `DATABASE_URL` (e.g. sa local), ang app mo-use pa gihapon sa **JSON files** sa `data/` folder. Sa Render, kung naa na `DATABASE_URL`, **tanan data ma-save na sa database** ug dili mawala bisan ma-redeploy.
