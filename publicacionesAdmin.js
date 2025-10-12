// ============================
// 🔥 Configuración de Firebase
// ============================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDd1jXzZfR-QUW7iRdYjF4oMZTsVBaIAFM",
  authDomain: "revolucionmx-308c2.firebaseapp.com",
  databaseURL: "https://revolucionmx-308c2-default-rtdb.firebaseio.com",
  projectId: "revolucionmx-308c2",
  storageBucket: "revolucionmx-308c2.appspot.com",
  messagingSenderId: "143264550141",
  appId: "1:143264550141:web:7e5425c2b75c5579d04294"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ============================
// 📢 Lógica de publicaciones
// ============================
const form = document.getElementById("publicacionForm");
const container = document.getElementById("publicacionesContainer");
const publicacionesRef = collection(db, "publicaciones");

// 📌 Escuchar publicaciones en tiempo real
onSnapshot(publicacionesRef, (snapshot) => {
  container.innerHTML = "";
  if (snapshot.empty) {
    container.innerHTML = "<p>No hay publicaciones aún.</p>";
    return;
  }

  snapshot.forEach((docSnap) => {
    const pub = docSnap.data();
    const id = docSnap.id;
    const div = document.createElement("div");
    div.classList.add("publicacion");

    div.innerHTML = `
      <h3>${pub.titulo}</h3>
      <img src="imagen/${pub.imagen}" alt="${pub.titulo}">
      <p>${pub.contenido}</p>
      <div class="acciones">
        <button onclick="editarPublicacion('${id}', '${pub.titulo}', '${pub.contenido}', '${pub.imagen}')">✏️ Editar</button>
        <button onclick="eliminarPublicacion('${id}')">🗑️ Eliminar</button>
      </div>
    `;
    container.appendChild(div);
  });
});

// 📝 Agregar nueva publicación
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const titulo = document.getElementById("titulo").value.trim();
  const contenido = document.getElementById("contenidoPub").value.trim();
  const imagen = document.getElementById("imagenNombre").value.trim();

  if (!titulo || !contenido || !imagen) return alert("Por favor llena todos los campos.");

  try {
    await addDoc(publicacionesRef, {
      titulo,
      contenido,
      imagen,
      fecha: new Date().toISOString()
    });
    form.reset();
  } catch (error) {
    console.error("Error al subir publicación:", error);
    alert("Ocurrió un error al subir la publicación.");
  }
});

// 🗑️ Eliminar publicación
window.eliminarPublicacion = async (id) => {
  if (confirm("¿Seguro que deseas eliminar esta publicación?")) {
    try {
      await deleteDoc(doc(db, "publicaciones", id));
    } catch (error) {
      console.error("Error al eliminar:", error);
      alert("Ocurrió un error al eliminar.");
    }
  }
};

// ✏️ Editar publicación
window.editarPublicacion = async (id, tituloActual, contenidoActual, imagenActual) => {
  const nuevoTitulo = prompt("Nuevo título:", tituloActual);
  const nuevoContenido = prompt("Nuevo contenido:", contenidoActual);
  const nuevaImagen = prompt("Nuevo nombre de imagen:", imagenActual);

  if (nuevoTitulo && nuevoContenido && nuevaImagen) {
    try {
      const ref = doc(db, "publicaciones", id);
      await updateDoc(ref, {
        titulo: nuevoTitulo.trim(),
        contenido: nuevoContenido.trim(),
        imagen: nuevaImagen.trim()
      });
    } catch (error) {
      console.error("Error al editar:", error);
      alert("Ocurrió un error al editar la publicación.");
    }
  }
};