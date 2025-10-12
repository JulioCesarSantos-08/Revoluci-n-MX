import {
  getAuth,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  getFirestore,
  getDocs,
  collection,
  query,
  where,
  addDoc,
  updateDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

// 🔧 Configuración Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDd1jXzZfR-QUW7iRdYjF4oMZTsVBaIAFM",
  authDomain: "revolucionmx-308c2.firebaseapp.com",
  projectId: "revolucionmx-308c2",
  storageBucket: "revolucionmx-308c2.appspot.com",
  messagingSenderId: "143264550141",
  appId: "1:143264550141:web:7e5425c2b75c5579d04294",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// 🌟 Elementos del DOM
const logoutBtn = document.getElementById("logoutBtn");
const modoBtn = document.getElementById("modoBtn");
const homeBtn = document.getElementById("homeBtn");
const puntosBtn = document.getElementById("puntosBtn");
const nombreUsuarioEl = document.getElementById("nombreUsuario");
const totalPuntosEl = document.getElementById("totalPuntos");
const listaRecompensasEl = document.getElementById("listaRecompensas");

// Ticket modal
const ticketModal = document.getElementById("ticketModal");
const ticketNombre = document.getElementById("ticketNombre");
const ticketRecompensa = document.getElementById("ticketRecompensa");
const ticketFecha = document.getElementById("ticketFecha");
const cerrarTicket = document.getElementById("cerrarTicket");

// 🌙 Modo oscuro activado por defecto
document.body.classList.add("dark-mode");
localStorage.setItem("modo", "oscuro");
modoBtn.textContent = "☀️";

// 🌗 Cambiar modo
modoBtn?.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
  localStorage.setItem(
    "modo",
    document.body.classList.contains("dark-mode") ? "oscuro" : "claro"
  );
  modoBtn.textContent = document.body.classList.contains("dark-mode") ? "☀️" : "🌙";
});

// 🚪 Cerrar sesión
logoutBtn?.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "index.html";
});

// 🧍 Obtener nombre y puntos
async function obtenerMiembro(email) {
  const q = query(collection(db, "miembros"), where("email", "==", email));
  const snapshot = await getDocs(q);
  if (!snapshot.empty) {
    const docu = snapshot.docs[0];
    return { id: docu.id, ...docu.data() };
  }
  return null;
}

// 🎁 Recompensas inventadas (puedes editarlas luego)
const recompensas = [
  { nombre: "Taza personalizada", costo: 50 },
  { nombre: "Gorra oficial", costo: 80 },
  { nombre: "Playera Revolución MX", costo: 120 },
  { nombre: "Acceso VIP a evento", costo: 200 },
  { nombre: "Sticker pack", costo: 30 }
];

// 🧾 Mostrar recompensas
function mostrarRecompensas(miembro) {
  listaRecompensasEl.innerHTML = "";
  recompensas.forEach((r) => {
    const card = document.createElement("div");
    card.classList.add("recompensa-card");
    card.innerHTML = `
      <h3>${r.nombre}</h3>
      <p>💰 Costo: ${r.costo} puntos</p>
      <button class="canjearBtn" ${miembro.puntos < r.costo ? "disabled" : ""}>
        Canjear
      </button>
    `;

    const btn = card.querySelector(".canjearBtn");
    btn.addEventListener("click", () => canjearRecompensa(r, miembro));

    listaRecompensasEl.appendChild(card);
  });
}

// 🪙 Canjear recompensa
async function canjearRecompensa(recompensa, miembro) {
  if (miembro.puntos < recompensa.costo) {
    alert("No tienes suficientes puntos para esta recompensa.");
    return;
  }

  const confirmar = confirm(
    `¿Seguro que quieres canjear "${recompensa.nombre}" por ${recompensa.costo} puntos?`
  );
  if (!confirmar) return;

  // ✨ Actualizar puntos
  const nuevosPuntos = miembro.puntos - recompensa.costo;
  await updateDoc(doc(db, "miembros", miembro.id), { puntos: nuevosPuntos });

  // 🧾 Crear ticket en Firestore
  const fecha = new Date();
  await addDoc(collection(db, "ticketsCanje"), {
    emailMiembro: miembro.email,
    nombreMiembro: miembro.nombre,
    recompensa: recompensa.nombre,
    costo: recompensa.costo,
    fecha: fecha,
    estado: "pendiente" // luego los admins pueden validarlo
  });

  // 🪪 Mostrar ticket en modal
  ticketNombre.textContent = miembro.nombre;
  ticketRecompensa.textContent = recompensa.nombre;
  ticketFecha.textContent = fecha.toLocaleString();
  ticketModal.classList.remove("oculto");

  // 🆙 Actualizar puntos mostrados y botones
  miembro.puntos = nuevosPuntos;
  totalPuntosEl.textContent = nuevosPuntos;
  mostrarRecompensas(miembro);
}

// ❌ Cerrar modal
cerrarTicket.addEventListener("click", () => {
  ticketModal.classList.add("oculto");
});

// 🧍 Verificar sesión
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    alert("Debes iniciar sesión primero.");
    window.location.href = "index.html";
    return;
  }

  const miembro = await obtenerMiembro(user.email);
  if (!miembro) {
    alert("Tu perfil no está registrado.");
    await signOut(auth);
    window.location.href = "index.html";
    return;
  }

  nombreUsuarioEl.textContent = miembro.nombre;
  totalPuntosEl.textContent = miembro.puntos || 0;

  mostrarRecompensas(miembro);
});

// 🧭 Navegación
homeBtn?.addEventListener("click", () => window.location.href = "publicacionesMiembro.html");
puntosBtn?.addEventListener("click", () => window.location.href = "puntosMiembro.html");