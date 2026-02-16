# Unsaon Pag-setup: Deposit → GCash → Auto-Credit

Kini nga guide para ma-enable nimo ang **Cash In via GCash**: mag-click ang member ug **Pay with GCash** → mu-open ang GCash → human bayad **ma-credit dayon** sa savings (walay form nga pwede ma-fake).

---

## Step 1: Create account sa PayMongo

1. Open **https://dashboard.paymongo.com**
2. Click **Sign up** ug i-register (email, password).
3. I-verify ang email kung naa instruction.
4. Human login, naa ka na sa **PayMongo Dashboard**.

---

## Step 2: Kuhaa ang API keys

1. Sa PayMongo dashboard, adto sa **Developers** o **API Keys** (sidebar).
2. Makita nimo:
   - **Live** ug **Test** mode. Para testing, gamita **Test** sa una.
3. **Copy** ni duha:
   - **Public key** (nagsugod ug `pk_test_` o `pk_live_`)
   - **Secret key** (nagsugod ug `sk_test_` o `sk_live_`)

Ayaw i-share ang **Secret key** sa uban. I-save lang nimo sa safe.

---

## Step 3: I-set ang keys sa imong app

### Kung naa ka sa **Render** (deployed):

1. Open imong **Web Service** sa Render.
2. Tab **Environment**.
3. Click **Add Environment Variable**.
4. I-add ni nga **3 variables**:

| Key | Value |
|-----|--------|
| `PAYMONGO_PUBLIC_KEY` | `pk_test_xxxx` (o pk_live_ kung production) |
| `PAYMONGO_SECRET_KEY` | `sk_test_xxxx` (o sk_live_) |
| `BASE_URL` | Full URL sa app, e.g. `https://climbs-system-xxxx.onrender.com` |

5. **Save**. Render mo-redeploy; hulat 1–2 min.

### Kung nag-run **local** (sa imong PC):

1. Sa project folder, create o edit **`.env`** (same folder sa `server.js`).
2. Sulod sa `.env`, i-butang:

```
PAYMONGO_PUBLIC_KEY=pk_test_xxxxxxxxxxxx
PAYMONGO_SECRET_KEY=sk_test_xxxxxxxxxxxx
BASE_URL=http://localhost:3000
```

3. I-restart ang server (`npm start`).

**Note:** Para ma-read ang `.env` sa Node, kinahanglan naa `dotenv`. Kung wala pa:

```bash
npm install dotenv
```

Sa **pinaka-una** sa `server.js` (line 1), i-add:

```js
require('dotenv').config();
```

---

## Step 4: I-set ang Webhook (para ma-credit human sa bayad)

Ang webhook mao ang mo-detect kung human na bayad sa GCash, unya mo-credit sa member.

1. Sa PayMongo dashboard, adto **Webhooks** (Developers → Webhooks).
2. Click **Create Webhook** o **Add endpoint**.
3. I-fill:
   - **Endpoint URL:**  
     - Kung sa Render: `https://IMONG-APP-NAME.onrender.com/api/webhooks/paymongo`  
     - Ilisan `IMONG-APP-NAME` sa tinuod nga URL sa imong app.
   - **Events:** pilia **`source.chargeable`** (kung naa list, check lang ni).
4. **Save**. PayMongo mo-send ug test; okay lang kung naa “failed” sa test kung first time (basta naa na ang URL sakto).

**Kung local (localhost):**  
PayMongo dili maka-reach sa `http://localhost`. So ang **auto-credit** mo-work lang kung naa na naka-deploy sa public URL (e.g. Render). Sa local, ang **Pay with GCash** mura’g “not configured” / manual form gihapon.

---

## Step 5: Test

1. Open imong app (Render URL o localhost).
2. **Login** as member (verified).
3. **Savings** → **Cash In / Deposit** → pili amount → **Pay with GCash**.
4. Dapat ma-redirect ka sa **GCash checkout** (PayMongo page).
5. Human bayad (test mode: naa test card / GCash test flow), ma-redirect ka balik sa app ug **ma-credit** ang amount sa savings.

Kung mo-error ug “PayMongo not configured”, balik sa Step 3 ug check nga sakto ang keys ug **BASE_URL**.

---

## Summary checklist

- [ ] PayMongo account (dashboard.paymongo.com)
- [ ] Nakuha ang **Public** ug **Secret** key
- [ ] Na-set sa Render (Environment) o sa `.env` local: `PAYMONGO_PUBLIC_KEY`, `PAYMONGO_SECRET_KEY`, `BASE_URL`
- [ ] Na-create ang **Webhook** nga event `source.chargeable`, URL = `https://imong-app.com/api/webhooks/paymongo`
- [ ] Na-test: Pay with GCash → bayad → na-credit sa savings

Human ani, ang **Deposit** mudiretso na sa **GCash** ug **ma-credit dayon** human sa bayad — sama sa imong gipangayo.
