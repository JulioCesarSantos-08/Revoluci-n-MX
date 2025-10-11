import { 
  getAuth, signOut, onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { 
  getFirestore, collection, addDoc, getDocs, updateDoc, doc 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { app } from "./firebaseConfig.js";

const auth = getAuth(app);
const db = getFirestore(app);

// Botones principales
const verMiembrosBtn = document.getElementById('verMiembrosBtn');
const publicacionesBtn = document.getElementById('publicacionesBtn');
const puntosBtn = document.getElementById('puntosBtn');
const logoutBtn = document.getElementById('logoutBtn');
const contenido = document.getElementById('contenido');

// ✅ Protección: Solo el admin autorizado puede acceder
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "index.html";
  } else if (user.email !== "ti43300@uvp.edu.mx", "andrespersandoval@gmail.com", "luisramirezd86@gmail.com") {
    alert("⚠️ Acceso denegado. No eres administrador.");
    signOut(auth);
    window.location.href = "index.html";
  }
});

// 🚪 Cerrar sesión
logoutBtn.addEventListener('click', async () => {
  await signOut(auth);
  window.location.href = "index.html";
});

// 🧩 Mostrar secciones
verMiembrosBtn.addEventListener('click', mostrarMiembros);
publicacionesBtn.addEventListener('click', mostrarPublicaciones);
puntosBtn.addEventListener('click', mostrarPuntos);

// 👥 Mostrar lista de miembros
async function mostrarMiembros() {
  contenido.innerHTML = `<h2>👥 Lista de miembros</h2><div id="miembrosContainer">Cargando...</div>`;

  const miembrosContainer = document.getElementById('miembrosContainer');
  const querySnapshot = await getDocs(collection(db, "miembros"));
  miembrosContainer.innerHTML = '';

  querySnapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const div = document.createElement('div');
    div.classList.add('miembro-card');
    div.innerHTML = `
      <strong>${data.nombre}</strong><br>
      Puntos: ${data.puntos || 0}<br>
      Email: ${data.email}
    `;
    miembrosContainer.appendChild(div);
  });
}

// 📰 Subir publicaciones
function mostrarPublicaciones() {
  contenido.innerHTML = `
    <h2>📰 Subir publicación</h2>
    <section>
      <form id="publicacionForm">
        <label>Título</label>
        <input type="text" id="titulo" required>

        <label>Contenido</label>
        <textarea id="contenidoPub" rows="5" required></textarea>

        <button type="submit" class="submit">Publicar</button>
      </form>
    </section>
  `;

  document.getElementById('publicacionForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const titulo = document.getElementById('titulo').value;
    const contenidoPub = document.getElementById('contenidoPub').value;

    await addDoc(collection(db, "publicaciones"), {
      titulo,
      contenido: contenidoPub,
      fecha: new Date().toLocaleString()
    });

    alert("✅ Publicación subida con éxito");
    document.getElementById('publicacionForm').reset();
  });
}

// 🎯 Asignar puntos a miembros
async function mostrarPuntos() {
  contenido.innerHTML = `
    <h2>🎯 Asignar puntos</h2>
    <section>
      <form id="puntosForm">
        <label>Email del miembro</label>
        <input type="email" id="emailMiembro" required>
        <label>Cantidad de puntos</label>
        <input type="number" id="cantidadPuntos" required>
        <button type="submit" class="submit">Agregar puntos</button>
      </form>
    </section>
  `;

  document.getElementById('puntosForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('emailMiembro').value.trim();
    const puntos = parseInt(document.getElementById('cantidadPuntos').value);

    const querySnapshot = await getDocs(collection(db, "miembros"));
    let encontrado = false;

    for (const docSnap of querySnapshot.docs) {
      const data = docSnap.data();
      if (data.email === email) {
        encontrado = true;
        const ref = doc(db, "miembros", docSnap.id);
        await updateDoc(ref, { puntos: (data.puntos || 0) + puntos });
        alert("✅ Puntos actualizados correctamente");
        break;
      }
    }

    if (!encontrado) {
      alert("❌ No se encontró al miembro con ese correo.");
    }

    document.getElementById('puntosForm').reset();
  });
}