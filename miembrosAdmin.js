// 📌 Importaciones Firebase
import { 
  getAuth,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  getFirestore,
  collection,
  onSnapshot,
  getDoc,
  setDoc,
  doc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

// 🔧 Configuración Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDd1jXzZfR-QUW7iRdYjF4oMZTsVBaIAFM",
  authDomain: "revolucionmx-308c2.firebaseapp.com",
  databaseURL: "https://revolucionmx-308c2-default-rtdb.firebaseio.com",
  projectId: "revolucionmx-308c2",
  storageBucket: "revolucionmx-308c2.appspot.com",
  messagingSenderId: "143264550141",
  appId: "1:143264550141:web:7e5425c2b75c5579d04294"
};

// 🚀 Inicializar Firebase solo una vez
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);

// 🛡️ Emails autorizados como administradores
const admins = [
  "ti43300@uvp.edu.mx",
  "andrespersandoval@gmail.com",
  "luisramirezd86@gmail.com"
];

// 👮 Protección de acceso a esta página
onAuthStateChanged(auth, (user) => {
  if (!user || !admins.includes(user.email)) {
    alert("⚠️ Acceso denegado.");
    signOut(auth);
    window.location.href = "index.html";
  } else {
    mostrarMiembrosTiempoReal();
  }
});

// 🔚 Cerrar sesión
document.getElementById("logoutBtn")?.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "index.html";
});

// 🧾 Mostrar miembros en tiempo real
function mostrarMiembrosTiempoReal() {
  const tbody = document.getElementById("tablaMiembros");
  if (!tbody) return;

  tbody.innerHTML = `
    <tr>
      <td colspan="5" class="loading">Cargando miembros...</td>
    </tr>
  `;

  onSnapshot(collection(db, "miembros"), (snapshot) => {
    tbody.innerHTML = "";

    if (snapshot.empty) {
      tbody.innerHTML = `<tr><td colspan="5" class="loading">No hay miembros registrados.</td></tr>`;
      return;
    }

    let index = 1;
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>${index++}</td>
        <td>${data.email || "-"}</td>
        <td>${data.nombre || "-"}</td>
        <td>${data.idJuego || "-"}</td>
        <td>
          <button class="editarBtn" data-id="${docSnap.id}" title="Editar">✏️</button>
          <button class="eliminarBtn" data-id="${docSnap.id}" title="Eliminar">🗑️</button>
        </td>
      `;

      tbody.appendChild(tr);
    });

    activarBotones();
  });
}

// ✏️ Activar botones editar / eliminar
function activarBotones() {
  document.querySelectorAll(".editarBtn").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const id = e.currentTarget.dataset.id;
      const docSnap = await getDoc(doc(db, "miembros", id));
      if (docSnap.exists()) {
        const data = docSnap.data();
        document.getElementById("correo").value = data.email || "";
        document.getElementById("nombreJuego").value = data.nombre || "";
        document.getElementById("etiqueta").value = data.idJuego || "";
      }
    });
  });

  document.querySelectorAll(".eliminarBtn").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const id = e.currentTarget.dataset.id;
      if (confirm("¿Seguro que deseas eliminar este miembro?")) {
        await deleteDoc(doc(db, "miembros", id));
        alert("✅ Miembro eliminado");
      }
    });
  });
}

// 💾 Guardar / actualizar miembro
document.getElementById("formMiembro")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("correo").value.trim().toLowerCase();
  const nombre = document.getElementById("nombreJuego").value.trim();
  const idJuego = document.getElementById("etiqueta").value.trim();

  if (!email || !nombre || !idJuego) {
    alert("Completa todos los campos.");
    return;
  }

  try {
    await setDoc(doc(db, "miembros", email), { email, nombre, idJuego });
    alert("✅ Información guardada correctamente");
    document.getElementById("formMiembro").reset();
  } catch (error) {
    console.error("❌ Error al guardar:", error);
    alert("Error al guardar el miembro.");
  }
});