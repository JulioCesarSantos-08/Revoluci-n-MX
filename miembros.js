import {
  getAuth,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  getFirestore,
  getDocs,
  collection
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
const contenido = document.getElementById("contenido");
const logoutBtn = document.getElementById("logoutBtn");
const modoBtn = document.getElementById("modoBtn");
const homeBtn = document.getElementById("homeBtn");
const puntosBtn = document.getElementById("puntosBtn");
const recompensasBtn = document.getElementById("recompensasBtn");

// 🔹 Cambiar modo oscuro / claro
modoBtn?.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
  localStorage.setItem(
    "modo",
    document.body.classList.contains("dark-mode") ? "oscuro" : "claro"
  );
  actualizarIconoModo();
});

function actualizarIconoModo() {
  if (document.body.classList.contains("dark-mode")) {
    modoBtn.textContent = "☀️";
  } else {
    modoBtn.textContent = "🌙";
  }
}

if (localStorage.getItem("modo") === "oscuro") {
  document.body.classList.add("dark-mode");
}
actualizarIconoModo();

// 🔹 Cerrar sesión
logoutBtn?.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "index.html";
});

// 🔹 Escuchar sesión activa
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    alert("Debes iniciar sesión primero.");
    window.location.href = "index.html";
    return;
  }

  // Buscar nombre en la colección "miembros"
  const miembrosSnap = await getDocs(collection(db, "miembros"));
  let nombreMiembro = null;

  miembrosSnap.forEach((docu) => {
    const data = docu.data();
    if (data.email === user.email) {
      nombreMiembro = data.nombre;
    }
  });

  if (!nombreMiembro) {
    alert("Tu perfil no tiene datos asignados.");
    await signOut(auth);
    window.location.href = "index.html";
    return;
  }

  // Cargar vista de inicio
  mostrarInicio(nombreMiembro);

  // Asignar eventos del menú
  homeBtn.addEventListener("click", () => mostrarInicio(nombreMiembro));
  puntosBtn.addEventListener("click", mostrarPuntos);
  recompensasBtn.addEventListener("click", mostrarRecompensas);
});

// 🏠 Sección Inicio
function mostrarInicio(nombre) {
  contenido.innerHTML = `
    <section class="inicio">
      <h2>👋 Bienvenido, <span class="nombre">${nombre}</span></h2>
      <p>Nos alegra verte nuevamente en Revolución MX.</p>
      <p>Aquí podrás consultar tus puntos, ver tus recompensas y mantenerte al tanto de las publicaciones de la comunidad.</p>
      <img src="imagenes/bienvenida.png" alt="Bienvenida" class="banner">
    </section>
  `;
}

// 🎯 Sección Puntos
function mostrarPuntos() {
  window.location.href = "puntosMiembro.html";
}

// 🎁 Sección Recompensas
function mostrarRecompensas() {
  window.location.href = "recompensasMiembro.html";
}