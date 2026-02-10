# Step-by-Step: Deploy CLIMBS System sa Render (Option 3)

Kini nga guide para ma-deploy nimo ang system sa **Render** aron **tanan maka-access** pinaagi sa permanent link (e.g. `https://climbs-system.onrender.com`). Human sa deploy, **walay code setup** na sa mga tao — open lang nila ang link sa browser.

---

## Before You Start

- Naa na ang project (climbs-system) sa imong PC.
- Naa **Git** installed (https://git-scm.com/downloads).
- Naa **GitHub account** (https://github.com — free).

---

## Step 1: I-prepare ang project (naa na)

Ang `package.json` naa na ug **"start": "node server.js"**. Ang server karon mogamit na sa `process.env.PORT` kung naa sa Render, so **walay change** nga kinahanglan nimo buhaton sa code for Render. Skip kung wala ka mag-edit.

---

## Step 2: I-upload ang project sa GitHub

### 2.1 Open terminal sa folder sa project

```text
cd c:\Users\JULMAR\climbs-system
```

### 2.2 Kung wala pa na-initialize ang Git

```bash
git init
```

### 2.3 Create file nga `.gitignore` (optional pero recommended)

Sa project folder, create **.gitignore** nga naa ani:

```text
node_modules
.env
*.log
.DS_Store
```

Para dili ma-upload ang `node_modules` ug uban sensitive files.

### 2.4 Add ug commit

```bash
git add .
git commit -m "Initial commit - CLIMBS system"
```

### 2.5 Create repo sa GitHub

1. Open **https://github.com** → login.
2. Click **“+”** (top right) → **“New repository”**.
3. **Repository name:** `climbs-system` (or bisag unsa).
4. **Public** → **Create repository** (ayaw i-check “Add a README” kung naa na ka local code).

### 2.6 I-connect ang local project sa GitHub ug i-push

Sa terminal (ilisan ang `YOUR_USERNAME` sa imong GitHub username):

```bash
git remote add origin https://github.com/YOUR_USERNAME/climbs-system.git
git branch -M main
git push -u origin main
```

Kung naa na ka existing `origin`, pwede:

```bash
git remote set-url origin https://github.com/YOUR_USERNAME/climbs-system.git
git push -u origin main
```

Human ani, naa na ang code sa **GitHub**.

---

## Step 3: Create account sa Render

1. Open **https://render.com**.
2. Click **“Get Started for Free”**.
3. Sign up gamit **GitHub** (recommended) — click **“Sign up with GitHub”** ug i-allow ang Render sa GitHub.
4. Human login, naa ka na sa **Render Dashboard**.

---

## Step 4: Create Web Service (deploy ang app)

### 4.1 New Web Service

1. Sa Render Dashboard, click **“New +”** (blue button).
2. Pilion **“Web Service”**.

### 4.2 Connect GitHub repository

1. Sa **“Connect a repository”**, pilion ang **climbs-system** (o ang name sa repo nga gi-push nimo).
2. Kung wala makita, click **“Configure account”** ug i-allow ang Render sa GitHub org/repos nga naa ang **climbs-system**.
3. Human ma-connect, pilion ang **climbs-system** repo → click **“Connect”**.

### 4.3 I-fill ang settings

| Field | Value |
|--------|--------|
| **Name** | `climbs-system` (or bisag unsa, e.g. `climbs-canteen`) |
| **Region** | Pilion ang pinakaduol (e.g. Singapore) |
| **Branch** | `main` |
| **Runtime** | **Node** |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` (o `node server.js`) |
| **Instance Type** | **Free** (para free tier) |

Ayaw usba ang **Root Directory** kung ang `package.json` ug `server.js` naa sa root sa repo.

### 4.4 (Optional) Environment variables

Kung naa ka `.env` o config nga kinahanglan (e.g. database URL), i-add sa **Environment** tab. Para karon, **walay required** env vars — pwede nimo i-skip.

### 4.5 Deploy

1. Click **“Create Web Service”**.
2. Render mag-build ug mag-deploy (mga 2–5 minutes).
3. Sa **Logs** makita nimo ang build (`npm install`) ug start (`node server.js`).

---

## Step 5: Kuhaa ang permanent URL

1. Human successful ang deploy, sa top sa Web Service page naa ang **URL**, e.g.:
   - **https://climbs-system-xxxx.onrender.com**
2. **Copy** ni nga link — kini na ang **permanent link** sa imong system.

---

## Step 6: I-share ang link

- I-share nimo ang **https://your-app-name.onrender.com** sa bisag kinsa.
- Sila: **open lang sa browser** — walay install, walay code.
- Pwede nila:
  - Open **/** (home) → pilion **Ordering** o **Membership**
  - Direct: **https://your-app-name.onrender.com/ordering-system** (canteen)
  - Direct: **https://your-app-name.onrender.com/membership** (membership)

**Dili na nila kailangan i-program o i-setup ang code.**

---

## Important notes (Free tier)

1. **Sleep:** Sa free tier, kung walay gamit ug ~15 minutes, ang server ma-**sleep**. First visitor human sleep mo-take ug ~30–50 seconds (Render mo-wake sa service). Normal na na.
2. **Limit:** Free tier naa limit sa hours per month; usually enough para demo/small use.
3. **Data:** Ang `data/` folder (members.json, menu.json, etc.) naa sa Render server. Kung ma-redeploy (e.g. new push), ang files sa disk mahimong reset kung wala ka persistent disk. Para permanent data, later pwede nimo i-connect database (e.g. PostgreSQL sa Render).

---

## Summary checklist

- [ ] Project naa sa GitHub (git init → add → commit → remote → push).
- [ ] Render account (sign up with GitHub).
- [ ] New Web Service → connect **climbs-system** repo.
- [ ] Build: `npm install` | Start: `npm start`.
- [ ] Create Web Service → wait for deploy.
- [ ] Copy URL (e.g. https://climbs-system-xxxx.onrender.com).
- [ ] Share link — tanan maka-access, open lang sa browser.

Human ani, **Option 3** na — permanent link, **walay code setup** sa side sa mga tao nga mo-access.
