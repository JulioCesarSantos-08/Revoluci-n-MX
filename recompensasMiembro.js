import {
  getAuth,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  getFirestore,
  getDocs,
  collection,
  doc,
  getDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

// 🔧 Configuración Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDd1jXzZfR-QUW7iRdYjF4oMZTsVBaIAFM",
  authDomain: "revolucionmx-308c2.firebaseapp.com",
  projectId: "revolucionmx-308c2",
  storageBucket: "revolucionmx-308c2.firebasestorage.app",
  messagingSenderId: "143264550141",
  appId: "1:143264550141:web:7e5425c2b75c5579d04294",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// 🔹 Elementos del DOM
const logoutBtn = document.getElementById("logoutBtn");
const modoBtn = document.getElementById("modoBtn");
const homeBtn = document.getElementById("homeBtn");
const puntosBtn = document.getElementById("puntosBtn");
const nombreUsuario = document.getElementById("nombreUsuario");
const totalPuntos = document.getElementById("totalPuntos");
const listaRecompensas = document.getElementById("listaRecompensas");

// 🎟️ Modal
const modal = document.getElementById("ticketModal");
const cerrarTicket = document.getElementById("cerrarTicket");
const ticketNombre = document.getElementById("ticketNombre");
const ticketRecompensa = document.getElementById("ticketRecompensa");
const ticketFecha = document.getElementById("ticketFecha");

// 🌙 Activar modo oscuro por defecto
document.body.classList.add("dark-mode");
localStorage.setItem("modo", "oscuro");
modoBtn.textContent = "☀️";

// 🔹 Cambiar modo oscuro / claro
modoBtn.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
  localStorage.setItem(
    "modo",
    document.body.classList.contains("dark-mode") ? "oscuro" : "claro"
  );
  modoBtn.textContent = document.body.classList.contains("dark-mode") ? "☀️" : "🌙";
});

// 🔹 Cerrar sesión
logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "index.html";
});

// 🔹 Detectar sesión activa
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    alert("Debes iniciar sesión primero.");
    window.location.href = "index.html";
    return;
  }

  const miembrosSnap = await getDocs(collection(db, "miembros"));
  let miembroDoc = null;

  miembrosSnap.forEach((docu) => {
    const data = docu.data();
    if (data.email === user.email) {
      miembroDoc = { id: docu.id, ...data };
    }
  });

  if (!miembroDoc) {
    alert("Tu perfil no tiene datos registrados.");
    await signOut(auth);
    window.location.href = "index.html";
    return;
  }

  nombreUsuario.textContent = miembroDoc.nombre;
  totalPuntos.textContent = miembroDoc.puntos || 0;

  cargarRecompensas(miembroDoc);
});

// 🔹 Cargar recompensas desde Firestore
async function cargarRecompensas(miembro) {
  const recompensasSnap = await getDocs(collection(db, "recompensas"));
  listaRecompensas.innerHTML = "";

  recompensasSnap.forEach((docu) => {
    const data = docu.data();

    const card = document.createElement("div");
    card.className = "recompensa";

    const puedeCanjear = miembro.puntos >= data.puntos;

    card.innerHTML = `
      <img src="${data.imagen}" alt="${data.nombre}">
      <h3>${data.nombre}</h3>
      <p>${data.descripcion}</p>
      <p class="puntos">💎 ${data.puntos} puntos</p>
      <button ${!puedeCanjear ? "disabled" : ""}>Canjear</button>
    `;

    const btn = card.querySelector("button");
    btn.addEventListener("click", () => canjearRecompensa(miembro, docu.id, data));

    listaRecompensas.appendChild(card);
  });
}

// 🔹 Canjear recompensa
async function canjearRecompensa(miembro, recompensaId, data) {
  if (miembro.puntos < data.puntos) {
    alert("No tienes suficientes puntos para esta recompensa.");
    return;
  }

  const nuevoTotal = miembro.puntos - data.puntos;

  const miembroRef = doc(db, "miembros", miembro.id);
  await updateDoc(miembroRef, {
    puntos: nuevoTotal,
    historialPuntos: [
      ...(miembro.historialPuntos || []),
      {
        fecha: new Date().toLocaleString(),
        descripcion: `Canjeó "${data.nombre}"`,
        cambio: -data.puntos
      }
    ]
  });

  totalPuntos.textContent = nuevoTotal;
  mostrarTicket(miembro.nombre, data.nombre);
}

// 🎟️ Mostrar ticket
function mostrarTicket(nombre, recompensa) {
  ticketNombre.textContent = nombre;
  ticketRecompensa.textContent = recompensa;
  ticketFecha.textContent = new Date().toLocaleString();
  modal.classList.remove("oculto");
}

cerrarTicket.addEventListener("click", () => modal.classList.add("oculto"));

// 🔹 Navegación
homeBtn.addEventListener("click", () => window.location.href = "publicacionesMiembro.html");
puntosBtn.addEventListener("click", () => window.location.href = "puntosMiembro.html");