import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
  collection,
  addDoc,
  getDocs
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

const listaRecompensas = document.getElementById("listaRecompensas");
const puntosUsuario = document.getElementById("puntosUsuario");
const modalTicket = document.getElementById("modalTicket");
const ticketInfo = document.getElementById("ticketInfo");
const cerrarModal = document.getElementById("cerrarModal");
const backBtn = document.getElementById("backBtn");

let puntosActuales = 0;
let nombreUsuario = "";
let emailUsuario = "";

// 🔹 Ir atrás
backBtn.addEventListener("click", () => {
  window.location.href = "miembros.html";
});

// 🔹 Cerrar modal
cerrarModal.addEventListener("click", () => {
  modalTicket.classList.add("oculto");
});

// 🔹 Esperar sesión activa
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    alert("Debes iniciar sesión.");
    window.location.href = "index.html";
    return;
  }

  emailUsuario = user.email;

  // Buscar nombre y puntos
  const miembroDoc = doc(db, "miembros", emailUsuario);
  const miembroSnap = await getDoc(miembroDoc);

  if (miembroSnap.exists()) {
    const data = miembroSnap.data();
    nombreUsuario = data.nombre || "Miembro";
    puntosActuales = data.puntos || 0;
  } else {
    nombreUsuario = user.email;
    puntosActuales = 0;
  }

  puntosUsuario.textContent = `💰 Tienes ${puntosActuales} puntos`;
  cargarRecompensas();
});

// 🔹 Cargar lista de recompensas desde Firestore
async function cargarRecompensas() {
  listaRecompensas.innerHTML = "<p>Cargando recompensas...</p>";

  const recompensasSnap = await getDocs(collection(db, "recompensas"));
  listaRecompensas.innerHTML = "";

  if (recompensasSnap.empty) {
    listaRecompensas.innerHTML = "<p>No hay recompensas disponibles por ahora.</p>";
    return;
  }

  recompensasSnap.forEach((docu) => {
    const data = docu.data();
    const card = document.createElement("div");
    card.classList.add("recompensa");

    const puedeCanjear = puntosActuales >= data.costo;

    card.innerHTML = `
      <img src="${data.imagen}" alt="${data.nombre}">
      <h3>${data.nombre}</h3>
      <p>${data.descripcion || ""}</p>
      <p><strong>${data.costo} pts</strong></p>
      <button class="canjearBtn" ${!puedeCanjear ? "disabled" : ""}>Canjear</button>
    `;

    const btn = card.querySelector(".canjearBtn");
    btn.addEventListener("click", () => canjearRecompensa(docu.id, data));

    listaRecompensas.appendChild(card);
  });
}

// 🔹 Canjear recompensa
async function canjearRecompensa(id, data) {
  if (puntosActuales < data.costo) {
    alert("No tienes suficientes puntos para canjear esta recompensa.");
    return;
  }

  // Restar puntos
  const nuevoTotal = puntosActuales - data.costo;
  await updateDoc(doc(db, "miembros", emailUsuario), { puntos: nuevoTotal });

  // Guardar ticket de canje
  await addDoc(collection(db, "canjes"), {
    miembro: nombreUsuario,
    email: emailUsuario,
    recompensa: data.nombre,
    costo: data.costo,
    fecha: new Date().toISOString(),
  });

  puntosActuales = nuevoTotal;
  puntosUsuario.textContent = `💰 Tienes ${puntosActuales} puntos`;

  // Mostrar ticket
  ticketInfo.innerHTML = `
    <p><strong>Nombre:</strong> ${nombreUsuario}</p>
    <p><strong>Recompensa:</strong> ${data.nombre}</p>
    <p><strong>Puntos usados:</strong> ${data.costo}</p>
    <p><strong>Fecha:</strong> ${new Date().toLocaleString()}</p>
  `;
  modalTicket.classList.remove("oculto");

  cargarRecompensas(); // Actualiza los botones
}