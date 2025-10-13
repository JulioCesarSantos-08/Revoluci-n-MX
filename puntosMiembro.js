// puntosMiembro.js
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ----------------- Config Firebase -----------------
const firebaseConfig = {
  apiKey: "AIzaSyDd1jXzZfR-QUW7iRdYjF4oMZTsVBaIAFM",
  authDomain: "revolucionmx-308c2.firebaseapp.com",
  projectId: "revolucionmx-308c2",
  storageBucket: "revolucionmx-308c2.appspot.com",
  messagingSenderId: "143264550141",
  appId: "1:143264550141:web:7e5425c2b75c5579d04294",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);

// ----------------- DOM -----------------
const nombreUsuarioEl = document.getElementById("nombreUsuario");
const totalPuntosEl = document.getElementById("totalPuntos");
const listaHistorial = document.getElementById("listaHistorial");
const tablaReglasBody = document.querySelector("#tablaReglas tbody");
const buscarHistorialInput = document.getElementById("buscarHistorial");

const logoutBtn = document.getElementById("logoutBtn");
const modoBtn = document.getElementById("modoBtn");
const homeBtn = document.getElementById("homeBtn");
const recompensasBtn = document.getElementById("recompensasBtn");

// ----------------- Reglas -----------------
const reglas = [
  { accion: "Tener TAG RMX", puntos: 40 },
  { accion: "Guerras - Quedar TOP 1", puntos: 30 },
  { accion: "Guerras - Quedar TOP 2", puntos: 20 },
  { accion: "Guerras - Quedar TOP 3", puntos: 10 },
  { accion: "Realizar 16 ataques de guerra", puntos: 20 },
  { accion: "Donaciones - Top 1", puntos: 30 },
  { accion: "Donaciones - Top 2", puntos: 20 },
  { accion: "Donaciones - Top 3", puntos: 10 },
  { accion: "Estar en grupo de WhatsApp", puntos: 10 },
  { accion: "Seguirnos en redes", puntos: 10 }
];

function renderReglas() {
  tablaReglasBody.innerHTML = "";
  reglas.forEach(r => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${escapeHtml(r.accion)}</td><td>${r.puntos}</td>`;
    tablaReglasBody.appendChild(tr);
  });
}

// ----------------- Helpers Firestore -----------------
async function obtenerHistorial(email) {
  const ref = collection(db, "historialPuntos");
  const q = query(ref, where("emailMiembro", "==", email));
  const snap = await getDocs(q);
  const items = [];
  snap.forEach(d => items.push({ id: d.id, ...d.data() }));
  return items;
}

function parseFecha(itemFecha) {
  if (!itemFecha) return "Fecha no disponible";
  if (itemFecha.seconds) return new Date(itemFecha.seconds * 1000).toLocaleString();
  try {
    return new Date(itemFecha).toLocaleString();
  } catch {
    return String(itemFecha);
  }
}

function sumarPuntosDelHistorial(items) {
  let total = 0;
  for (const it of items) total += Number(it.puntos || 0);
  return total;
}

// ----------------- Interacción UI -----------------
async function mostrarHistorialUI(email) {
  listaHistorial.innerHTML = "<li>Cargando historial...</li>";
  const items = await obtenerHistorial(email);
  if (!items.length) {
    listaHistorial.innerHTML = "<li>No tienes puntos registrados aún.</li>";
    return;
  }

  items.sort((a,b) => {
    const ta = a.fecha?.seconds ? a.fecha.seconds : new Date(a.fecha || 0).getTime()/1000;
    const tb = b.fecha?.seconds ? b.fecha.seconds : new Date(b.fecha || 0).getTime()/1000;
    return tb - ta;
  });

  function renderLista(filtrado) {
    listaHistorial.innerHTML = "";
    if (!filtrado.length) {
      listaHistorial.innerHTML = "<li>No hay registros que coincidan.</li>";
      return;
    }
    for (const it of filtrado) {
      const li = document.createElement("li");
      li.innerHTML = `
        <div class="hist-row">
          <div class="hist-left">
            <strong class="hist-pts ${Number(it.puntos) >= 0 ? 'positivo' : 'negativo'}">
              ${Number(it.puntos) >= 0 ? '+' : ''}${it.puntos} pts
            </strong>
            <span class="hist-desc">${escapeHtml(it.descripcion || "Sin descripción")}</span>
          </div>
          <div class="hist-right">
            <span class="hist-fecha">${escapeHtml(parseFecha(it.fecha))}</span><br>
            <span class="hist-admin">Admin: ${escapeHtml(it.adminEmail || "—")}</span>
          </div>
        </div>
      `;
      listaHistorial.appendChild(li);
    }
  }

  renderLista(items);

  buscarHistorialInput.oninput = (e) => {
    const q = String(e.target.value || "").toLowerCase().trim();
    if (!q) return renderLista(items);
    const filtrado = items.filter(it => (it.descripcion || "").toLowerCase().includes(q));
    renderLista(filtrado);
  };

  const total = sumarPuntosDelHistorial(items);
  totalPuntosEl.textContent = total;
}

// ----------------- Flujo principal -----------------
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    alert("Debes iniciar sesión primero.");
    window.location.href = "index.html";
    return;
  }

  const miembrosRef = collection(db, "miembros");
  const q = query(miembrosRef, where("email", "==", user.email));
  const snap = await getDocs(q);
  if (snap.empty) {
    alert("Tu perfil no está registrado. Contacta un admin.");
    await signOut(auth);
    window.location.href = "index.html";
    return;
  }

  const docu = snap.docs[0];
  const miembro = { id: docu.id, ...docu.data() };
  nombreUsuarioEl.textContent = miembro.nombre || user.email;

  renderReglas();
  await mostrarHistorialUI(user.email);
});

// ----------------- Botones -----------------
logoutBtn?.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "index.html";
});

// --------------- BOTÓN MODO OSCURO / CLARO ---------------
const savedMode = localStorage.getItem("modo");
if (savedMode === "claro") {
  document.body.classList.remove("dark-mode");
  modoBtn.textContent = "🌙";
} else {
  document.body.classList.add("dark-mode");
  modoBtn.textContent = "☀️";
}

modoBtn?.addEventListener("click", () => {
  const isDark = document.body.classList.toggle("dark-mode");
  const modo = isDark ? "oscuro" : "claro";
  localStorage.setItem("modo", modo);
  modoBtn.textContent = isDark ? "☀️" : "🌙";
});

homeBtn?.addEventListener("click", () => window.location.href = "publicacionesMiembro.html");
recompensasBtn?.addEventListener("click", () => window.location.href = "recompensasMiembro.html");

// ----------------- helpers -----------------
function escapeHtml(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}