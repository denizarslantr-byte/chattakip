// Piano Deri V6.1 — Firebase API Katmanı
// Google Sheets/Apps Script yerine Firebase Realtime Database kullanır

// Firebase SDK'yı CDN'den import et
let db = null;

async function initFirebase() {
  if (db) return db;
  const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js");
  const { getDatabase, ref, get, set, push, update, remove, query, orderByChild, equalTo, limitToLast, onValue } =
    await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js");

  const app = initializeApp(FIREBASE_CONFIG);
  db = getDatabase(app);

  window._fb = { ref, get, set, push, update, remove, query, orderByChild, equalTo, limitToLast, onValue };
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

// ── Rezervasyonlar (TARİH BAZLI OKUMA) ─────────────────────────────
// Yeni yapı:
// rezervasyonlar/2026-05-24/<id>
// rezervasyon_index/<id> = "2026-05-24"
// Böylece merkez/otel ekranı sadece seçilen günü okur; eski günler Firebase download tüketmez.
function rezDateKey(date) {
  return String(date || todayStr?.() || new Date().toISOString().slice(0,10)).slice(0,10);
}

function normalizeRezList(data, date) {
  if (!data) return [];
  // Yeni tarih bazlı node: rezervasyonlar/YYYY-MM-DD/id
  const dateKey = date ? rezDateKey(date) : null;
  const out = [];
  Object.entries(data).forEach(([key, val]) => {
    if (!val || typeof val !== 'object') return;
    // Eğer val.date varsa bu tek rezervasyondur.
    if (val.date || val.time || val.hotel) {
      out.push({ ...val, id: val.id || key, _key: key });
      return;
    }
    // Eğer val içinde rezervasyonlar varsa bu tarih klasörüdür.
    Object.entries(val).forEach(([rid, r]) => {
      if (r && typeof r === 'object') out.push({ ...r, id: r.id || rid, _key: rid, date: r.date || key });
    });
  });
  return out
    .filter(r => !dateKey || String(r.date) === dateKey)
    .sort((a, b) => String(a.time || '').localeCompare(String(b.time || '')));
}

async function getReservations(date) {
  if (date) {
    const day = rezDateKey(date);
    const dayData = await fbGet(`rezervasyonlar/${day}`);
    if (dayData) return normalizeRezList(dayData, day);

    // Eski düz yapıdan geçiş dönemi fallback: sadece gerekirse eski node okunur.
    const legacy = await fbGet('rezervasyonlar');
    return normalizeRezList(legacy, day);
  }

  // Rapor/export ekranları için tüm veri. Günlük ekranlarda bunu kullanmayın.
  const data = await fbGet('rezervasyonlar');
  return normalizeRezList(data, '');
}

async function findReservationDate(id) {
  const key = String(id);
  const indexed = await fbGet(`rezervasyon_index/${key}`);
  if (indexed) return indexed;

  // Index yoksa sadece bugün ve yarını hızlı kontrol et.
  const today = (typeof todayStr === 'function') ? todayStr() : new Date().toISOString().slice(0,10);
  const dates = [today];
  try { dates.push(addDays(today, 1), addDays(today, -1)); } catch(_) {}
  for (const d of [...new Set(dates)]) {
    const item = await fbGet(`rezervasyonlar/${d}/${key}`);
    if (item) { await fbSet(`rezervasyon_index/${key}`, d); return d; }
  }

  // Son çare: tüm rezervasyonları tara. Bu sadece eski veriden kalan tekil işlemlerde çalışır.
  const data = await fbGet('rezervasyonlar');
  if (data) {
    for (const [dateOrId, val] of Object.entries(data)) {
      if (!val || typeof val !== 'object') continue;
      if (String(dateOrId) === key && val.date) { await fbSet(`rezervasyon_index/${key}`, val.date); return val.date; }
      if (val[key]) { const d = val[key].date || dateOrId; await fbSet(`rezervasyon_index/${key}`, d); return d; }
    }
  }
  return null;
}

async function addReservation(rez) {
  const id = String(Date.now() + Math.floor(Math.random() * 1000));
  const day = rezDateKey(rez.date);
  const data = { ...rez, id, date: day, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  await fbSet(`rezervasyonlar/${day}/${id}`, data);
  await fbSet(`rezervasyon_index/${id}`, day);
  return id;
}

async function updateReservation(id, data) {
  const key = String(id);
  const oldDate = await findReservationDate(key);
  const newDate = data.date ? rezDateKey(data.date) : oldDate;
  if (!newDate) throw new Error('Rezervasyon tarihi bulunamadı: ' + key);

  const payload = { ...data, updatedAt: new Date().toISOString() };
  if (data.date) payload.date = newDate;

  if (oldDate && oldDate !== newDate) {
    const oldData = await fbGet(`rezervasyonlar/${oldDate}/${key}`);
    await fbSet(`rezervasyonlar/${newDate}/${key}`, { ...(oldData || {}), ...payload, id: key, date: newDate });
    await fbRemove(`rezervasyonlar/${oldDate}/${key}`);
  } else {
    await fbUpdate(`rezervasyonlar/${newDate}/${key}`, payload);
  }
  await fbSet(`rezervasyon_index/${key}`, newDate);
}

async function deleteReservation(id) {
  const key = String(id);
  const day = await findReservationDate(key);
  if (day) await fbRemove(`rezervasyonlar/${day}/${key}`);
  else await fbRemove(`rezervasyonlar/${key}`); // eski düz yapı fallback
  await fbRemove(`rezervasyon_index/${key}`);
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
