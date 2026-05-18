// Piano Deri V6.1 — Firebase API Katmanı
// Google Sheets/Apps Script yerine Firebase Realtime Database kullanır

// Firebase SDK'yı CDN'den import et
let db = null;

async function initFirebase() {
  if (db) return db;
  const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js");
  const { getDatabase, ref, get, set, push, update, remove, query, orderByChild, equalTo, onValue } =
    await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js");

  const app = initializeApp(FIREBASE_CONFIG);
  db = getDatabase(app);

  window._fb = { ref, get, set, push, update, remove, query, orderByChild, equalTo, onValue };
  return db;
}

async function fbGet(path) {
  const database = await initFirebase();
  const snap = await window._fb.get(window._fb.ref(database, path));
  return snap.exists() ? snap.val() : null;
}

async function fbSet(path, data) {
  const database = await initFirebase();
  await window._fb.set(window._fb.ref(database, path), data);
}

async function fbPush(path, data) {
  const database = await initFirebase();
  const r = await window._fb.push(window._fb.ref(database, path), data);
  return r.key;
}

async function fbUpdate(path, data) {
  const database = await initFirebase();
  await window._fb.update(window._fb.ref(database, path), data);
}

async function fbRemove(path) {
  const database = await initFirebase();
  await window._fb.remove(window._fb.ref(database, path));
}

// ── PIN Yönetimi ─────────────────────────────────────────────
async function getPin() {
  const pin = await fbGet("ayarlar/adminPin");
  return pin || DEFAULT_PIN;
}

async function setPin(newPin) {
  await fbSet("ayarlar/adminPin", newPin);
}

// ── Rezervasyonlar ────────────────────────────────────────────
async function getReservations(date) {
  const data = await fbGet("rezervasyonlar");
  if (!data) return [];
  return Object.entries(data)
    .map(([key, val]) => ({ ...val, _key: key }))
    .filter(r => !date || r.date === date)
    .sort((a, b) => String(a.time).localeCompare(String(b.time)));
}

async function addReservation(rez) {
  const id = Date.now() + Math.floor(Math.random() * 1000);
  const data = { ...rez, id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  await fbSet(`rezervasyonlar/${id}`, data);
  return id;
}

async function updateReservation(id, data) {
  await fbUpdate(`rezervasyonlar/${id}`, { ...data, updatedAt: new Date().toISOString() });
}

async function deleteReservation(id) {
  await fbRemove(`rezervasyonlar/${id}`);
}

// ── Oteller ──────────────────────────────────────────────────
async function getHotels() {
  const data = await fbGet("oteller");
  if (!data) return [];
  return Object.entries(data)
    .map(([key, val]) => ({ ...val, _key: key }))
    .sort((a, b) => String(a.hotel).localeCompare(String(b.hotel), "tr"));
}

async function addHotel(hotel) {
  const id = Date.now();
  await fbSet(`oteller/${id}`, { ...hotel, id, createdAt: new Date().toISOString() });
  return id;
}

async function updateHotel(id, data) {
  const key = (id && id.value !== undefined) ? id.value : id;
  if (!key || key === "undefined") throw new Error("Otel ID bulunamadı");
  await fbUpdate(`oteller/${key}`, data);
}

async function deleteHotel(id) {
  const key = (id && id.value !== undefined) ? id.value : id;
  if (!key || key === "undefined") throw new Error("Otel ID bulunamadı");
  await fbRemove(`oteller/${key}`);
}

async function loginHotel(code, password) {
  const hotels = await getHotels();
  return hotels.find(h =>
    h.status === "ACTIVE" &&
    String(h.code || "").toLowerCase() === String(code).toLowerCase() &&
    String(h.password || "") === String(password)
  ) || null;
}

// ── Personel ─────────────────────────────────────────────────
async function getStaff() {
  const data = await fbGet("personel");
  if (!data) return [];
  return Object.entries(data)
    .map(([key, val]) => ({ ...val, _key: key }))
    .sort((a, b) => String(a.name).localeCompare(String(b.name), "tr"));
}

async function addStaff(staff) {
  const id = Date.now();
  await fbSet(`personel/${id}`, { ...staff, id, status: staff.status || "ACTIVE", createdAt: new Date().toISOString() });
  return id;
}

async function updateStaff(id, data) {
  const key = (id && id.value !== undefined) ? id.value : id;
  if (!key || key === "undefined") throw new Error("Personel ID bulunamadı");
  await fbUpdate(`personel/${key}`, data);
}

async function deleteStaff(id) {
  const key = (id && id.value !== undefined) ? id.value : id;
  if (!key || key === "undefined") throw new Error("Personel ID bulunamadı");
  await fbRemove(`personel/${key}`);
}

// ── İzin ─────────────────────────────────────────────────────
async function getOffDates(staffName) {
  const data = await fbGet("izinler");
  if (!data) return [];
  return Object.values(data)
    .filter(v => v.personel === staffName)
    .map(v => v.tarih);
}

async function setStaffOff(staffName, date, off) {
  const data = await fbGet("izinler");
  const entries = data ? Object.entries(data) : [];
  const existing = entries.find(([, v]) => v.personel === staffName && v.tarih === date);
  if (off) {
    if (!existing) {
      await fbPush("izinler", { personel: staffName, tarih: date, durum: "AKTIF", createdAt: new Date().toISOString() });
    }
  } else {
    if (existing) await fbRemove(`izinler/${existing[0]}`);
  }
}

async function getStaffWithOffDates() {
  const [staffList, izinData] = await Promise.all([getStaff(), fbGet("izinler")]);
  const izinler = izinData ? Object.values(izinData) : [];
  return staffList.map(s => ({
    ...s,
    offDates: izinler.filter(i => i.personel === s.name).map(i => i.tarih).join(",")
  }));
}

// ── Plakalar ─────────────────────────────────────────────────
async function getPlakalar() {
  const data = await fbGet("plakalar");
  if (!data) return [];
  return Object.entries(data)
    .map(([key, val]) => ({ ...val, _key: key }))
    .sort((a, b) => String(a.plaka).localeCompare(String(b.plaka)));
}

async function addPlaka(plaka, model) {
  const id = Date.now();
  await fbSet(`plakalar/${id}`, { id, plaka: plaka.toUpperCase(), model: model || "", status: "ACTIVE", createdAt: new Date().toISOString() });
  return id;
}

async function deletePlaka(id) {
  await fbRemove(`plakalar/${id}`);
}

// ── Log ──────────────────────────────────────────────────────
async function logAction(action, user, details) {
  await fbPush("logs", { action, user, details: String(details || "").slice(0, 300), date: new Date().toISOString() });
}

// ── Kullanıcı Yönetimi ────────────────────────────────────────
async function getUsers() {
  const data = await fbGet("kullanicilar");
  if (!data) return [];
  return Object.entries(data)
    .map(([key, val]) => ({ ...val, _key: key }))
    .sort((a, b) => String(a.username||"").localeCompare(String(b.username||""), "tr"));
}

async function addUser(user) {
  const id = Date.now();
  await fbSet(`kullanicilar/${id}`, { ...user, id, status: user.status||"ACTIVE", createdAt: new Date().toISOString() });
  return id;
}

async function updateUser(id, data) {
  const key = (id && id.value !== undefined) ? id.value : id;
  if (!key || key==="undefined") throw new Error("Kullanıcı ID bulunamadı");
  await fbUpdate(`kullanicilar/${key}`, data);
}

async function deleteUser(id) {
  const key = (id && id.value !== undefined) ? id.value : id;
  if (!key || key==="undefined") throw new Error("Kullanıcı ID bulunamadı");
  await fbRemove(`kullanicilar/${key}`);
}

async function loginUser(username, password) {
  const users = await getUsers();
  return users.find(u =>
    u.status === "ACTIVE" &&
    String(u.username||"").toLowerCase() === String(username).toLowerCase() &&
    String(u.password||"") === String(password)
  ) || null;
}

// ── Admin Doğrulama ───────────────────────────────────────────
async function adminAuth(pin) {
  const correctPin = await getPin();
  return String(pin) === String(correctPin);
}

// Dashboard ile çakışmayı önlemek için alias
window._fbAddStaff    = addStaff;
window._fbDeleteStaff = deleteStaff;
window._fbAddPlaka    = addPlaka;
window._fbDeletePlaka = deletePlaka;

// Global API referansı - dashboard ile çakışmayı önler
window._fbAPI = {
  addStaff, deleteStaff, addPlaka, deletePlaka,
  updateStaff, getStaff, getStaffWithOffDates, setStaffOff,
  addHotel, updateHotel, deleteHotel, getHotels,
  addReservation, updateReservation, deleteReservation, getReservations
};


// ── Eski apiGet/apiPost çağrıları için Firebase uyumluluk katmanı ─────────
// Otel, bölgeci, patron, boss ve region ekranlarında kalan eski Apps Script
// çağrılarını aynı Firebase veritabanına yönlendirir. Böylece otelden girilen
// rezervasyon merkez ekranında aynı kaynaktan görünür.
async function apiGet(action, params = {}) {
  try {
    if (action === "getReservations") {
      let list = await getReservations(params.date || "");
      if (params.hotel) list = list.filter(r => String(r.hotel || "") === String(params.hotel || ""));
      return list;
    }
    if (action === "cancelReservation") {
      await updateReservation(params.id, { status: "CANCELLED", updatedAt: new Date().toISOString() });
      return { success: true };
    }
    if (action === "deleteReservation") {
      await deleteReservation(params.id);
      return { success: true };
    }
    if (action === "getHotels") return await getHotels();
    if (action === "getStaff") return await getStaff();
    if (action === "getPlakalar") return await getPlakalar();
    return [];
  } catch (err) {
    console.error("Firebase apiGet hata:", action, err);
    return { success: false, message: err.message || "Firebase okuma hatası" };
  }
}

async function apiPost(action, body = {}) {
  try {
    if (action === "addReservation") {
      const id = await addReservation(body);
      return { success: true, id };
    }
    if (action === "updateReservation") {
      const id = body.id;
      const data = { ...body };
      delete data.id;
      await updateReservation(id, data);
      return { success: true, id };
    }
    return { success: false, message: "Unknown action: " + action };
  } catch (err) {
    console.error("Firebase apiPost hata:", action, err);
    return { success: false, message: err.message || "Firebase yazma hatası" };
  }
}


// ZORUNLU GLOBAL BAĞLANTI — eski common.js / cache çakışmalarını engeller
window.getUsers    = getUsers;
window.addUser     = addUser;
window.updateUser  = updateUser;
window.deleteUser  = deleteUser;
window.loginUser   = loginUser;
window.getReservations = getReservations;
window.addReservation = addReservation;
window.updateReservation = updateReservation;
window.deleteReservation = deleteReservation;
window.getHotels = getHotels;
window.addHotel = addHotel;
window.updateHotel = updateHotel;
window.deleteHotel = deleteHotel;
window.loginHotel = loginHotel;
window.getStaff = getStaff;
window.addStaff = addStaff;
window.updateStaff = updateStaff;
window.deleteStaff = deleteStaff;
window.getStaffWithOffDates = getStaffWithOffDates;
window.getPlakalar = getPlakalar;
window._firebaseApiGet = apiGet;
window._firebaseApiPost = apiPost;
window._firebaseApiReady = true;
window.apiGet = apiGet;
window.apiPost = apiPost;
