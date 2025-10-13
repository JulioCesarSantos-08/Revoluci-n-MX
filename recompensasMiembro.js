// recompensasMiembro.js
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// 🔧 Config Firebase (usa tu config)
const firebaseConfig = {
  apiKey: "AIzaSyDd1jXzZfR-QUW7iRdYjF4oMZTsVBaIAFM",
  authDomain: "revolucionmx-308c2.firebaseapp.com",
  projectId: "revolucionmx-308c2",
  storageBucket: "revolucionmx-308c2.appspot.com",
  messagingSenderId: "143264550141",
  appId: "1:143264550141:web:7e5425c2b75c5579d04294",
};

// Evitar duplicate app
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);

// DOM
const logoutBtn = document.getElementById("logoutBtn");
const modoBtn = document.getElementById("modoBtn");
const homeBtn = document.getElementById("homeBtn");
const puntosBtn = document.getElementById("puntosBtn");
const nombreUsuarioEl = document.getElementById("nombreUsuario");
const totalPuntosEl = document.getElementById("totalPuntos");
const listaRecompensasEl = document.getElementById("listaRecompensas");

// Modal
const ticketModal = document.getElementById("ticketModal");
const ticketNombre = document.getElementById("ticketNombre");
const ticketRecompensa = document.getElementById("ticketRecompensa");
const ticketFecha = document.getElementById("ticketFecha");
const cerrarTicket = document.getElementById("cerrarTicket");

// Modo oscuro por defecto (mantener tu tema oscuro)
if (!localStorage.getItem("modo")) localStorage.setItem("modo", "oscuro");
if (localStorage.getItem("modo") === "oscuro") {
  document.body.classList.add("dark-mode");
  if (modoBtn) modoBtn.textContent = "☀️";
} else {
  document.body.classList.remove("dark-mode");
  if (modoBtn) modoBtn.textContent = "🌙";
}
modoBtn?.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
  const modo = document.body.classList.contains("dark-mode") ? "oscuro" : "claro";
  localStorage.setItem("modo", modo);
  modoBtn.textContent = modo === "oscuro" ? "☀️" : "🌙";
});

// Cerrar sesión
logoutBtn?.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "index.html";
});

// ----------------- helpers Firestore -----------------

/**
 * Devuelve todos los documentos de historialPuntos para un email dado.
 * @param {string} email
 * @returns {Array} array de objetos { puntos, descripcion, fecha, adminEmail, ... }
 */
async function obtenerHistorialParaEmail(email) {
  const historialRef = collection(db, "historialPuntos");
  const q = query(historialRef, where("emailMiembro", "==", email));
  const snap = await getDocs(q);
  const items = [];
  snap.forEach(docu => {
    items.push({ id: docu.id, ...docu.data() });
  });
  return items;
}

/**
 * Suma puntos del historial para un email (considera positivos y negativos).
 * @param {string} email
 * @returns {number} total puntos
 */
async function calcularTotalPuntos(email) {
  const items = await obtenerHistorialParaEmail(email);
  let total = 0;
  for (const it of items) {
    total += Number(it.puntos || 0);
  }
  return total;
}

// ----------------- Recompensas (inventadas) -----------------
const recompensas = [
  { nombre: "Taza personalizada", costo: 50 },
  { nombre: "Gorra oficial", costo: 80 },
  { nombre: "Playera Revolución MX", costo: 120 },
  { nombre: "Acceso VIP a evento", costo: 200 },
  { nombre: "Sticker pack", costo: 30 }
];

// Render de recompensas
function mostrarRecompensas(totalActual, miembroData) {
  listaRecompensasEl.innerHTML = "";
  recompensas.forEach(r => {
    const card = document.createElement("div");
    card.className = "recompensa-card";
    card.innerHTML = `
      <h3>${escapeHtml(r.nombre)}</h3>
      <p>💰 Costo: <strong>${r.costo}</strong> puntos</p>
      <button class="canjearBtn" ${totalActual < r.costo ? "disabled" : ""}>Canjear</button>
    `;
    const btn = card.querySelector(".canjearBtn");
    btn.addEventListener("click", () => canjearRecompensa(r, miembroData));
    listaRecompensasEl.appendChild(card);
  });
}

/**
 * Canjear recompensa:
 * - verifica puntos reales (desde historialPuntos)
 * - crea ticket en ticketsCanje
 * - agrega una entrada en historialPuntos con puntos negativos para registrar la resta
 */
async function canjearRecompensa(recompensa, miembro) {
  // recalcula total por seguridad
  const totalReal = await calcularTotalPuntos(miembro.email);
  if (totalReal < recompensa.costo) {
    alert("No tienes suficientes puntos para esta recompensa.");
    // actualizar UI por si acaso
    totalPuntosEl.textContent = totalReal;
    mostrarRecompensas(totalReal, miembro);
    return;
  }

  const confirmar = confirm(`¿Deseas canjear "${recompensa.nombre}" por ${recompensa.costo} puntos?`);
  if (!confirmar) return;

  try {
    // 1) Crear ticketCanje (documento)
    const ticketRef = await addDoc(collection(db, "ticketsCanje"), {
      emailMiembro: miembro.email,
      nombreMiembro: miembro.nombre || miembro.email,
      recompensa: recompensa.nombre,
      costo: recompensa.costo,
      fecha: serverTimestamp(),
      estado: "pendiente"
    });

    // 2) Crear registro en historialPuntos (entrada NEGATIVA para restar puntos)
    await addDoc(collection(db, "historialPuntos"), {
      emailMiembro: miembro.email,
      adminEmail: miembro.email, // quien generó la acción (el propio usuario). Puedes cambiarlo si quieres.
      descripcion: `Canje: ${recompensa.nombre}`,
      puntos: -Math.abs(recompensa.costo),
      fecha: serverTimestamp(),
      ticketId: ticketRef.id
    });

    // 3) Actualizar UI: recalcular total y mostrar modal con ticket
    const nuevoTotal = await calcularTotalPuntos(miembro.email);
    totalPuntosEl.textContent = nuevoTotal;
    ticketNombre.textContent = miembro.nombre || miembro.email;
    ticketRecompensa.textContent = recompensa.nombre;
    ticketFecha.textContent = new Date().toLocaleString();
    ticketModal?.classList.remove("oculto");
    mostrarRecompensas(nuevoTotal, miembro);

    alert("¡Canje realizado! Se generó el ticket y se registró el movimiento.");
  } catch (err) {
    console.error("Error al canjear:", err);
    alert("Ocurrió un error al procesar el canje. Intenta de nuevo.");
  }
}

// cerrar modal
cerrarTicket?.addEventListener("click", () => {
  ticketModal?.classList.add("oculto");
});

// ----------------- Flujo de inicio (usuario logueado) -----------------
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    alert("Debes iniciar sesión primero.");
    window.location.href = "index.html";
    return;
  }

  // obtener datos del miembro desde la colección 'miembros'
  // (su documento puede contener nombre y otros datos)
  const miembrosRef = collection(db, "miembros");
  const q = query(miembrosRef, where("email", "==", user.email));
  const snap = await getDocs(q);
  if (snap.empty) {
    alert("Tu perfil no está registrado en la colección 'miembros'. Contacta a un admin.");
    await signOut(auth);
    window.location.href = "index.html";
    return;
  }
  const docu = snap.docs[0];
  const miembro = { id: docu.id, ...docu.data() };

  // mostrar nombre
  nombreUsuarioEl.textContent = miembro.nombre || user.email;

  // calcular total real desde historialPuntos
  const total = await calcularTotalPuntos(user.email);
  totalPuntosEl.textContent = total;

  // mostrar recompensas habilitadas según total
  mostrarRecompensas(total, miembro);
});

// navegación
homeBtn?.addEventListener("click", () => window.location.href = "publicacionesMiembro.html");
puntosBtn?.addEventListener("click", () => window.location.href = "puntosMiembro.html");

// ---------- helper ----------
function escapeHtml(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}