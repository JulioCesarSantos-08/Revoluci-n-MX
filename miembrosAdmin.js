import {
  getAuth,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  collection,
  getDocs,
  getDoc,
  setDoc,
  doc,
  deleteDoc
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

// 🔹 Protección de acceso
const admins = [
  "ti43300@uvp.edu.mx",
  "andrespersandoval@gmail.com",
  "luisramirezd86@gmail.com"
];

onAuthStateChanged(auth, (user) => {
  if (!user || !admins.includes(user.email)) {
    alert("⚠️ Acceso denegado.");
    signOut(auth);
    window.location.href = "index.html";
  } else {
    mostrarMiembros();
  }
});

// 🔹 Cerrar sesión
document.getElementById("logoutBtn")?.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "index.html";
});

// 👥 Mostrar miembros y formulario
async function mostrarMiembros() {
  const contenido = document.getElementById("contenido");
  contenido.innerHTML = `
    <h2>Lista de miembros</h2>
    <table id="tablaMiembros">
      <thead>
        <tr>
          <th>Correo</th>
          <th>Nombre (Juego)</th>
          <th>ID / Etiqueta</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody id="cuerpoMiembros">
        <tr><td colspan="4">Cargando miembros...</td></tr>
      </tbody>
    </table>

    <h3>Agregar / Actualizar Información</h3>
    <form id="formMiembro">
      <label>Correo del miembro:</label>
      <input type="email" id="correoMiembro" placeholder="ejemplo@correo.com" required>

      <label>Nombre (Juego):</label>
      <input type="text" id="nombreMiembro" required>

      <label>ID / Etiqueta:</label>
      <input type="text" id="idMiembro" required>

      <button type="submit">Guardar información</button>
    </form>
  `;

  const cuerpo = document.getElementById("cuerpoMiembros");

  try {
    const miembrosSnap = await getDocs(collection(db, "miembros"));
    cuerpo.innerHTML = "";

    miembrosSnap.forEach((docSnap) => {
      const data = docSnap.data();
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${data.email}</td>
        <td>${data.nombre || "-"}</td>
        <td>${data.idJuego || "-"}</td>
        <td>
          <button class="editarBtn" data-id="${docSnap.id}">✏️</button>
          <button class="eliminarBtn" data-id="${docSnap.id}">🗑️</button>
        </td>
      `;
      cuerpo.appendChild(tr);
    });

    // Editar miembro
    document.querySelectorAll(".editarBtn").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const id = e.target.dataset.id;
        const docSnap = await getDoc(doc(db, "miembros", id));
        if (docSnap.exists()) {
          const data = docSnap.data();
          document.getElementById("correoMiembro").value = data.email || "";
          document.getElementById("nombreMiembro").value = data.nombre || "";
          document.getElementById("idMiembro").value = data.idJuego || "";
        }
      });
    });

    // Eliminar miembro
    document.querySelectorAll(".eliminarBtn").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const id = e.target.dataset.id;
        if (confirm("¿Seguro que deseas eliminar este miembro?")) {
          await deleteDoc(doc(db, "miembros", id));
          alert("Miembro eliminado ✅");
          mostrarMiembros();
        }
      });
    });

    // Guardar / actualizar miembro
    document.getElementById("formMiembro").addEventListener("submit", async (e) => {
      e.preventDefault();
      const correo = document.getElementById("correoMiembro").value.trim().toLowerCase();
      const nombre = document.getElementById("nombreMiembro").value.trim();
      const idJuego = document.getElementById("idMiembro").value.trim();

      if (!correo) return alert("Por favor, ingresa un correo válido.");

      await setDoc(
        doc(db, "miembros", correo),
        { email: correo, nombre, idJuego },
        { merge: true }
      );

      alert("Información guardada correctamente ✅");
      mostrarMiembros();
    });
  } catch (err) {
    console.error("Error al cargar miembros:", err);
    cuerpo.innerHTML = `<tr><td colspan='4'>Error al cargar miembros.</td></tr>`;
  }
}