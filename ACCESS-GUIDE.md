# CLIMBS System – Unsaon Pag-Access (Access Guide)

Kung **asa** ug **unsaon** pag-access ang system (local: `http://localhost:3000`).

---

## 1. Home / Main Portal

| URL | Description |
|-----|-------------|
| **http://localhost:3000/** | Homepage – duha ka module: Membership ug Ordering |

From here, people choose: **Membership** or **Ordering System**.

---

## 2. Ordering System (Canteen)

| URL | Who uses it |
|-----|--------------|
| **http://localhost:3000/ordering-system** | **Login/portal page** – pilion: Employee, Visitor, or Admin |

### Unsaon pag-access:

- **Employee**  
  - Sa ordering-system page: click **Employee Login** → enter Employee ID ug Password → maka-order na (wallet/credit).  
  - **Register:** click **Register New Employee** → **http://localhost:3000/employee-register**

- **Visitor**  
  - Sa ordering-system page: click **Order as Visitor** → diretso **http://localhost:3000/visitor-ordering** (walay login, cash/visitor order).

- **Admin**  
  - Sa ordering-system page: click **Admin Login** → enter username/password from Admin Profile → **http://localhost:3000/admin-ordering** (dashboard, menu, orders, reports).  
  - Profile settings: **http://localhost:3000/admin-profile**

### Direct URLs (after you know the flow):

| Role    | Direct URL |
|---------|------------|
| Portal  | `/ordering-system` |
| Employee| `/employee-ordering` (need login first from portal) |
| Visitor | `/visitor-ordering` |
| Admin   | `/admin-ordering` (need login first from portal) |
| Admin Profile | `/admin-profile` |

---

## 3. Membership Portal (Separate module)

| URL | Who uses it |
|-----|--------------|
| **http://localhost:3000/membership** | Member login |
| **http://localhost:3000/member-register** | New member registration |
| **http://localhost:3000/member-dashboard** | Member dashboard (after login) |
| **http://localhost:3000/admin-dashboard** | Membership admin (after admin login from membership) |

---

## Summary – Mga tao unsaon pag-access

1. **Open browser** → `http://localhost:3000`
2. **Pili:** **Go to Ordering** (canteen) or **Go to Membership**
3. **Kung Ordering:**  
   - **Employee** → Employee Login (or Register New Employee)  
   - **Visitor** → Order as Visitor  
   - **Admin** → Admin Login  
4. **Kung Membership:** Login as member or admin from membership page.

---

## Unsaon pag-open bisan asa (walay code, same WiFi/LAN)

1. **I-run ang server** sa PC nga naa ang code: `node server.js`
2. Sa terminal, makita nimo ang line: **Access from other devices: http://192.168.x.x:3000** (example).
3. Sa **bisag unsa nga device** sa **same WiFi** (phone, lain PC, tablet):
   - Open **browser** → type ang **http://192.168.x.x:3000** (ilisan ang 192.168.x.x sa IP nga gi-print sa server).
   - Pwede na sila mo-order, mag-login as employee/admin, or mag-visitor — **dili na nila kailangan ang code**.

**Note:** Kung ang server naa sa lain nga computer sa network, gamita ang **IP address** nga gi-print sa server (e.g. `http://192.168.1.10:3000`). Ang PC nga nag-run sa server kinahanglan **naka-on** ug **same WiFi/LAN** sa mga tao nga mo-access.

---

## Unsaon pag-open sa TANAN (bisag asa, walay code setup)

Kung gusto nimo nga **bisag kinsa** (dili lang same WiFi) maka-open — phone sa gawas, uban nga office, etc. — naa duha ka practical options. **Dili na nila kailangan i-program o i-setup ang code;** sila ra mo-open ug link sa browser.

### Option 1: Same WiFi / Same building (no extra setup)

- Sa PC nga naa ang project: **i-run** `node server.js`
- Sa terminal makita: **Access from other devices: http://192.168.x.x:3000**
- **I-share** nimo ang maong link (e.g. `http://192.168.1.5:3000`) sa uban
- Sila: **open lang sa browser** — walay install, walay code. Same WiFi ra kinahanglan.

### Option 2: Internet (bisag asa na device) — gamit **ngrok**

Kini para **temporary** public link (e.g. for demo o testing). Walay code change; one-time install ra sa ngrok sa imong PC.

1. **Download ngrok:** https://ngrok.com/download (create free account, then download)
2. **I-run ang imong server:** `node server.js`
3. **Sa lain terminal:** `ngrok http 3000`
4. Makita nimo ang **public URL** (e.g. `https://abc123.ngrok.io`)
5. **I-share** nimo ang link sa bisag kinsa — sila ra mo-open sa browser. **Dili na nila kailangan i-program o i-setup ang code.**

**Tip:** Sa free ngrok, ang URL mausab kada restart. Kung need nimo same URL always, naa paid plan o pwede ka mo-**deploy** (Option 3).

### Option 3: Internet permanently — **i-deploy** (e.g. Render)

Kung gusto nimo **permanent link** nga naa sa internet (e.g. `https://climbs-system.onrender.com`) — **one-time deploy** ra. Human ato, **tanan maka-access** pinaagi sa link; **dili na nila kailangan i-program o i-setup ang code.**

1. **Create account:** https://render.com (free)
2. **New Web Service** → connect imong **GitHub** repo (or upload code)
3. **Build command:** `npm install`
4. **Start command:** `node server.js`
5. **Deploy** → after a few minutes, makakuha ka ug URL (e.g. `https://your-app.onrender.com`)
6. **I-share** nimo ang URL — bisag kinsa, bisag asa, **open lang sa browser.** Walay code setup sa ilang side.

**Note:** Sa free tier, ang server ma-sleep kung walay gamit; first open might take ~30 seconds. Kung need nimo always-on, naa paid plans or other hosts (Railway, Fly.io, etc.).

---

### Summary

| Gusto nimo                     | Unsaon                                                                 |
|-------------------------------|------------------------------------------------------------------------|
| Same WiFi / same building     | Run `node server.js` → share **http://192.168.x.x:3000**              |
| Internet, temporary (demo)    | Run server + **ngrok http 3000** → share ngrok link                   |
| Internet, permanent           | **Deploy** sa Render (or similar) → share app URL                    |

Sa tanang cases, **ang mga tao nga mo-access:** open lang nila ang link sa browser — **dili na need nga i-program o i-set up nila ang code.**
