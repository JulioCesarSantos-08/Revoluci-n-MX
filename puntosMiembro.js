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
  getDoc
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
const recompensasBtn = document.getElementById("recompensasBtn");
const nombreUsuario = document.getElementById("nombreUsuario");
const totalPuntos = document.getElementById("totalPuntos");
const listaHistorial = document.getElementById("listaHistorial");

// 🌙 Activar modo oscuro por defecto
document.body.classList.add("dark-mode");
localStorage.setItem("modo", "oscuro");
modoBtn.textContent = "☀️";

// 🔹 Cambiar modo oscuro / claro
modoBtn?.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
  localStorage.setItem(
    "modo",
    document.body.classList.contains("dark-mode") ? "oscuro" : "claro"
  );
  modoBtn.textContent = document.body.classList.contains("dark-mode")
    ? "☀️"
    : "🌙";
});

// 🔹 Cerrar sesión
logoutBtn?.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "index.html";
});

// 🔹 Verificar usuario activo
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    alert("Debes iniciar sesión primero.");
    window.location.href = "index.html";
    return;
  }

  // Buscar al miembro correspondiente
  const miembrosSnap = await getDocs(collection(db, "miembros"));
  let miembroDoc = null;
  let nombre = null;

  miembrosSnap.forEach((docu) => {
    const data = docu.data();
    if (data.email === user.email) {
      miembroDoc = { id: docu.id, ...data };
      nombre = data.nombre;
    }
  });

  if (!miembroDoc) {
    alert("Tu perfil no tiene datos registrados.");
    await signOut(auth);
    window.location.href = "index.html";
    return;
  }

  // Mostrar información
  nombreUsuario.textContent = nombre;
  totalPuntos.textContent = miembroDoc.puntos || 0;

  mostrarHistorial(miembroDoc.id);
});

// 🔹 Mostrar historial de puntos
async function mostrarHistorial(idMiembro) {
  const miembroRef = doc(db, "miembros", idMiembro);
  const miembroSnap = await getDoc(miembroRef);

  if (!miembroSnap.exists()) {
    listaHistorial.innerHTML = `<li>No se encontró historial.</li>`;
    return;
  }

  const data = miembroSnap.data();
  const historial = data.historialPuntos || [];

  if (historial.length === 0) {
    listaHistorial.innerHTML = `<li>Aún no tienes movimientos de puntos.</li>`;
    return;
  }

  listaHistorial.innerHTML = "";
  historial.slice().reverse().forEach((mov) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <strong>${mov.fecha || "Sin fecha"}:</strong> ${mov.descripcion} 
      <span class="${mov.cambio > 0 ? 'positivo' : 'negativo'}">
        ${mov.cambio > 0 ? "+" : ""}${mov.cambio}
      </span>
    `;
    listaHistorial.appendChild(li);
  });
}

// 🔹 Navegación
homeBtn.addEventListener("click", () => window.location.href = "publicacionesMiembro.html");
recompensasBtn.addEventListener("click", () => window.location.href = "recompensasMiembro.html");