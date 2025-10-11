import {
  getAuth,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

// 🔧 Configuración Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDd1jXzZfR-QUW7iRdYjF4oMZTsVBaIAFM",
  authDomain: "revolucionmx-308c2.firebaseapp.com",
  databaseURL: "https://revolucionmx-308c2-default-rtdb.firebaseio.com",
  projectId: "revolucionmx-308c2",
  storageBucket: "revolucionmx-308c2.firebasestorage.app",
  messagingSenderId: "143264550141",
  appId: "1:143264550141:web:7e5425c2b75c5579d04294"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// 🔹 Elementos
const logoutBtn = document.getElementById("logoutBtn");
const toggleMode = document.getElementById("toggleMode");
const mensajeBienvenida = document.getElementById("mensajeBienvenida");
const puntosTotales = document.getElementById("puntosTotales");
const cuerpoPuntos = document.getElementById("cuerpoPuntos");

// 🔹 Administradores (para redirigir)
const admins = [
  "ti43300@uvp.edu.mx",
  "andrespersandoval@gmail.com",
  "luisramirezd86@gmail.com"
];

// 🔹 Verificación de sesión
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  if (admins.includes(user.email)) {
    window.location.href = "puntosAdmin.html";
    return;
  }

  // 🔹 Buscar nombre del miembro
  const miembroRef = doc(db, "miembros", user.email);
  const miembroSnap = await getDoc(miembroRef);

  if (miembroSnap.exists()) {
    const data = miembroSnap.data();
    mensajeBienvenida.textContent = `Bienvenido, ${data.nombre || "miembro"}`;
  } else {
    mensajeBienvenida.textContent = `Bienvenido, ${user.email}`;
  }

  // 🔹 Cargar puntos
  await cargarPuntos(user.email);
});

// 🔹 Cerrar sesión
logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "index.html";
});

// 🔹 Modo oscuro / claro
toggleMode.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
  localStorage.setItem(
    "modo",
    document.body.classList.contains("dark-mode") ? "oscuro" : "claro"
  );
});

if (localStorage.getItem("modo") === "oscuro") {
  document.body.classList.add("dark-mode");
}

// 🔹 Función para cargar los puntos
async function cargarPuntos(correo) {
  try {
    const puntosRef = collection(db, "puntos");
    const snapshot = await getDocs(puntosRef);
    let total = 0;
    let registros = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.email === correo) {
        registros.push(data);
        total += data.cantidad || 0;
      }
    });

    puntosTotales.textContent = `${total} puntos`;

    if (registros.length === 0) {
      cuerpoPuntos.innerHTML = `<tr><td colspan="3">No tienes puntos registrados aún.</td></tr>`;
      return;
    }

    cuerpoPuntos.innerHTML = "";
    registros.forEach((p) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${p.fecha || "-"}</td>
        <td>${p.motivo || "-"}</td>
        <td>${p.cantidad || 0}</td>
      `;
      cuerpoPuntos.appendChild(tr);
    });
  } catch (err) {
    console.error("Error al cargar puntos:", err);
    cuerpoPuntos.innerHTML = `<tr><td colspan="3">Error al cargar datos.</td></tr>`;
  }
}