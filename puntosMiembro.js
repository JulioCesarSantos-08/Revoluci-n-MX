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
  where
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

// 🔸 Elementos del DOM
const logoutBtn = document.getElementById("logoutBtn");
const modoBtn = document.getElementById("modoBtn");
const homeBtn = document.getElementById("homeBtn");
const recompensasBtn = document.getElementById("recompensasBtn");
const nombreUsuarioEl = document.getElementById("nombreUsuario");
const totalPuntosEl = document.getElementById("totalPuntos");
const listaHistorial = document.getElementById("listaHistorial");

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

// 🧍‍♂️ Obtener nombre desde colección "miembros"
async function obtenerNombreUsuario(email) {
  const miembrosRef = collection(db, "miembros");
  const q = query(miembrosRef, where("email", "==", email));
  const snapshot = await getDocs(q);
  if (!snapshot.empty) {
    const data = snapshot.docs[0].data();
    return data.nombre || email;
  }
  return email;
}

// 🧍 Verificar usuario logueado
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    alert("Debes iniciar sesión primero.");
    window.location.href = "index.html";
    return;
  }

  const emailUsuario = user.email;
  const nombre = await obtenerNombreUsuario(emailUsuario);
  nombreUsuarioEl.textContent = nombre;

  await mostrarHistorial(emailUsuario);
});

// 📜 Mostrar historial desde "historialPuntos"
async function mostrarHistorial(email) {
  listaHistorial.innerHTML = "<li>Cargando historial...</li>";

  const snapshot = await getDocs(collection(db, "historialPuntos"));
  let total = 0;
  const historialUsuario = [];

  snapshot.forEach((docu) => {
    const data = docu.data();
    if (data.emailMiembro === email) {
      historialUsuario.push(data);
      total += data.puntos || 0;
    }
  });

  totalPuntosEl.textContent = total;

  if (historialUsuario.length === 0) {
    listaHistorial.innerHTML = "<li>Aún no tienes movimientos de puntos.</li>";
    return;
  }

  historialUsuario.sort((a, b) => b.fecha.seconds - a.fecha.seconds);

  listaHistorial.innerHTML = "";
  historialUsuario.forEach((item) => {
    const fecha = new Date(item.fecha.seconds * 1000).toLocaleString();
    const li = document.createElement("li");
    li.innerHTML = `
      <strong>+${item.puntos} pts</strong> — ${item.descripcion || "Sin descripción"}<br>
      <span class="fecha">🕒 ${fecha}</span><br>
      <span class="admin">👤 Admin: ${item.adminEmail || "Desconocido"}</span>
    `;
    listaHistorial.appendChild(li);
  });
}

// 🧭 Navegación
homeBtn?.addEventListener("click", () => window.location.href = "publicacionesMiembro.html");
recompensasBtn?.addEventListener("click", () => window.location.href = "recompensasMiembro.html");