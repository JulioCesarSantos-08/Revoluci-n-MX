import { 
  getAuth, signOut, onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { 
  getFirestore, collection, getDocs, updateDoc, doc, deleteDoc 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

// Configuración Firebase
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

const contenido = document.getElementById('contenido');
const logoutBtn = document.getElementById('logoutBtn');
const toggleMode = document.getElementById('toggleMode');

// 🔹 Protección de acceso
const admins = ["ti43300@uvp.edu.mx", "andrespersandoval@gmail.com", "luisramirezd86@gmail.com"];
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
logoutBtn.addEventListener('click', async () => {
  await signOut(auth);
  window.location.href = "index.html";
});

// 🔹 Modo oscuro/claro
toggleMode.addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
});

// 👥 Mostrar miembros
async function mostrarMiembros() {
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
      <tbody id="cuerpoMiembros"></tbody>
    </table>

    <h3>Agregar / Actualizar Información</h3>
    <form id="formMiembro">
      <label>Selecciona miembro:</label>
      <select id="miembroSelect" required></select>
      <label>Nombre (Juego)</label>
      <input type="text" id="nombreMiembro" required>
      <label>ID / Etiqueta</label>
      <input type="text" id="idMiembro" required>
      <button type="submit">Guardar información</button>
    </form>
  `;

  const cuerpo = document.getElementById('cuerpoMiembros');
  const miembroSelect = document.getElementById('miembroSelect');

  const querySnapshot = await getDocs(collection(db, "miembros"));
  cuerpo.innerHTML = '';
  miembroSelect.innerHTML = '<option value="">Selecciona un miembro</option>';

  querySnapshot.forEach(docSnap => {
    const data = docSnap.data();
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${data.email}</td>
      <td>${data.nombre || '-'}</td>
      <td>${data.idJuego || '-'}</td>
      <td>
        <button class="editarBtn" data-id="${docSnap.id}">Editar</button>
        <button class="eliminarBtn" data-id="${docSnap.id}">Eliminar</button>
      </td>
    `;
    cuerpo.appendChild(tr);

    // Select de miembros
    const option = document.createElement('option');
    option.value = docSnap.id;
    option.textContent = data.email;
    miembroSelect.appendChild(option);
  });

  // Editar miembro
  document.querySelectorAll('.editarBtn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const docId = e.target.dataset.id;
      const docRef = doc(db, "miembros", docId);
      const docSnap = await docRef.get();
      const data = docSnap.data();
      miembroSelect.value = docId;
      document.getElementById('nombreMiembro').value = data.nombre || '';
      document.getElementById('idMiembro').value = data.idJuego || '';
    });
  });

  // Eliminar miembro
  document.querySelectorAll('.eliminarBtn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const docId = e.target.dataset.id;
      if (confirm("¿Seguro que quieres eliminar a este miembro?")) {
        await deleteDoc(doc(db, "miembros", docId));
        alert("Miembro eliminado ✅");
        mostrarMiembros();
      }
    });
  });

  // Guardar información
  document.getElementById('formMiembro').addEventListener('submit', async (e) => {
    e.preventDefault();
    const docId = miembroSelect.value;
    const nombre = document.getElementById('nombreMiembro').value.trim();
    const idJuego = document.getElementById('idMiembro').value.trim();
    if (!docId) return alert("Selecciona un miembro");

    await updateDoc(doc(db, "miembros", docId), { nombre, idJuego });
    alert("Información actualizada ✅");
    mostrarMiembros();
  });
}