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
