import { 
  getAuth, signOut, onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import { 
  getFirestore, collection, addDoc, getDocs, updateDoc, deleteDoc, doc, getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { app } from "./firebaseConfig.js";

const auth = getAuth(app);
const db = getFirestore(app);

const verMiembrosBtn = document.getElementById('verMiembrosBtn');
const publicacionesBtn = document.getElementById('publicacionesBtn');
const puntosBtn = document.getElementById('puntosBtn');
const logoutBtn = document.getElementById('logoutBtn');
const contenido = document.getElementById('contenido');


// ✅ Protección REAL de administradores desde Firestore
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  try {
    const ref = doc(db, "admins", user.email);
    const snap = await getDoc(ref);

    // ❌ Si no existe en la colección admins → no tiene permiso
    if (!snap.exists()) {
      alert("⚠️ Acceso denegado. No estás registrado como administrador.");
      await signOut(auth);
      window.location.href = "index.html";
      return;
    }

    // ❌ Si existe pero no tiene rol admin
    if (snap.data().rol !== "admin") {
      alert("⚠️ Acceso denegado. No tienes permisos de administrador.");
      await signOut(auth);
      window.location.href = "index.html";
      return;
    }

    // ✔ Si llega aquí → acceso correcto

  } catch (error) {
    console.error("Error verificando rol:", error);
    alert("Error verificando permisos.");
    window.location.href = "index.html";
  }
});


// 🚪 Cerrar sesión
logoutBtn.addEventListener('click', async () => {
  await signOut(auth);
  window.location.href = "index.html";
});


// 🧩 Botones de navegación
verMiembrosBtn.addEventListener('click', mostrarMiembros);
publicacionesBtn.addEventListener('click', mostrarPublicaciones);
puntosBtn.addEventListener('click', mostrarPuntos);



// ------------------------------------------------------
// 👥 MIEMBROS
// ------------------------------------------------------
async function mostrarMiembros() {
  contenido.innerHTML = `
    <h2>👥 Lista de miembros</h2>
    <div class="tabla-contenedor">
      <table class="tabla-miembros">
        <thead>
          <tr>
            <th>#</th>
            <th>Correo</th>
            <th>Nombre (Juego)</th>
            <th>ID / Etiqueta</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody id="tablaBody">
          <tr><td colspan="5" class="loading">Cargando...</td></tr>
        </tbody>
      </table>
    </div>

    <h3 style="margin-top: 40px;">Agregar / Actualizar Información</h3>
    <section>
      <form id="agregarMiembroForm">
        <label>Correo del miembro:</label>
        <input type="email" id="emailMiembro" placeholder="ejemplo@correo.com" required>

        <label>Nombre (Juego):</label>
        <input type="text" id="nombreMiembro" required>

        <label>ID / Etiqueta:</label>
        <input type="text" id="idMiembro" required>

        <button type="submit" class="submit">Guardar información</button>
      </form>
    </section>
  `;

  const tablaBody = document.getElementById('tablaBody');
  const miembrosSnap = await getDocs(collection(db, "miembros"));
  tablaBody.innerHTML = "";

  let contador = 1;
  miembrosSnap.forEach((docSnap) => {
    const data = docSnap.data();
    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td>${contador++}</td>
      <td>${data.email || ""}</td>
      <td>${data.nombre || ""}</td>
      <td>${data.id || ""}</td>
      <td>
        <button class="btn-editar" data-id="${docSnap.id}" data-email="${data.email}" data-nombre="${data.nombre}" data-idjuego="${data.id}">✏️</button>
        <button class="btn-eliminar" data-id="${docSnap.id}">🗑️</button>
      </td>
    `;
    tablaBody.appendChild(fila);
  });

  // Editar
  document.querySelectorAll(".btn-editar").forEach(btn => {
    btn.addEventListener("click", () => {
      document.getElementById("emailMiembro").value = btn.dataset.email;
      document.getElementById("nombreMiembro").value = btn.dataset.nombre;
      document.getElementById("idMiembro").value = btn.dataset.idjuego;
    });
  });

  // Eliminar
  document.querySelectorAll(".btn-eliminar").forEach(btn => {
    btn.addEventListener("click", async () => {
      const confirmacion = confirm("¿Estás seguro de eliminar este miembro?");
      if (confirmacion) {
        await deleteDoc(doc(db, "miembros", btn.dataset.id));
        alert("✅ Miembro eliminado.");
        mostrarMiembros();
      }
    });
  });

  // Agregar / actualizar
  document.getElementById('agregarMiembroForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('emailMiembro').value.trim();
    const nombre = document.getElementById('nombreMiembro').value.trim();
    const id = document.getElementById('idMiembro').value.trim();

    if (!email || !nombre || !id) {
      alert("❌ Todos los campos son obligatorios.");
      return;
    }

    let miembroRef = null;
    const querySnapshot = await getDocs(collection(db, "miembros"));
    for (const docSnap of querySnapshot.docs) {
      if (docSnap.data().email === email) {
        miembroRef = doc(db, "miembros", docSnap.id);
        break;
      }
    }

    if (miembroRef) {
      await updateDoc(miembroRef, { nombre, id });
      alert("✅ Información actualizada.");
    } else {
      await addDoc(collection(db, "miembros"), { email, nombre, id, puntos: 0 });
      alert("✅ Miembro agregado.");
    }

    mostrarMiembros();
  });
}



// ------------------------------------------------------
// 📰 PUBLICACIONES
// ------------------------------------------------------
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



// ------------------------------------------------------
// 🎯 PUNTOS
// ------------------------------------------------------
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
