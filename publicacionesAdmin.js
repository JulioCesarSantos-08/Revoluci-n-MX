// publicacionesAdmin.js
// ============================
// 🔥 Configuración de Firebase (evitar duplicate-app)
// ============================
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDd1jXzZfR-QUW7iRdYjF4oMZTsVBaIAFM",
  authDomain: "revolucionmx-308c2.firebaseapp.com",
  databaseURL: "https://revolucionmx-308c2-default-rtdb.firebaseio.com",
  projectId: "revolucionmx-308c2",
  storageBucket: "revolucionmx-308c2.appspot.com",
  messagingSenderId: "143264550141",
  appId: "1:143264550141:web:7e5425c2b75c5579d04294"
};

// Evitar inicialización duplicada
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);
const auth = getAuth(app);

// ============================
// 📢 Lógica de publicaciones (admin)
// ============================
const form = document.getElementById("publicacionForm");
const container = document.getElementById("publicacionesContainer");
const publicacionesRef = collection(db, "publicaciones");

let nombreAdminActual = "Administrador"; // valor por defecto

// 🔍 Obtener nombre del admin desde la colección "admins"
async function obtenerNombreAdmin(email) {
  try {
    const adminRef = doc(db, "admins", email);
    const adminSnap = await getDoc(adminRef);
    if (adminSnap.exists()) {
      const data = adminSnap.data();
      return data.nombre || "Administrador";
    }
    return "Administrador";
  } catch (error) {
    console.error("Error al obtener nombre del admin:", error);
    return "Administrador";
  }
}

// 👤 Detectar usuario autenticado
onAuthStateChanged(auth, async (user) => {
  if (user) {
    nombreAdminActual = await obtenerNombreAdmin(user.email);
  }
});

// RENDER: escucha en tiempo real y renderiza las publicaciones
onSnapshot(publicacionesRef, (snapshot) => {
  container.innerHTML = "";

  if (snapshot.empty) {
    container.innerHTML = "<p style='color:#ccc; text-align:center;'>No hay publicaciones aún.</p>";
    return;
  }

  snapshot.forEach((docSnap) => {
    const pub = docSnap.data();
    const id = docSnap.id;

    // formatea fecha si existe
    const fechaText = pub.fecha
      ? (pub.fecha.seconds ? new Date(pub.fecha.seconds * 1000).toLocaleString() : new Date(pub.fecha).toLocaleString())
      : "Fecha no disponible";

    // asegúrate de que pub.imagen sea la ruta (ej. "imagenes/evolucion1.png")
    const imagenHTML = pub.imagen ? `<img src="${pub.imagen}" alt="${escapeHtml(pub.titulo)}">` : "";

    const div = document.createElement("article");
    div.className = "publicacion";
    div.dataset.id = id;
    div.innerHTML = `
      <div class="post-head">
        <div>
          <h3 class="post-title">${escapeHtml(pub.titulo)}</h3>
          <small class="meta">Autor: ${escapeHtml(pub.autor || "Administrador")} · ${escapeHtml(fechaText)}</small>
        </div>
      </div>
      ${imagenHTML}
      <p class="post-body">${escapeHtml(pub.descripcion || "")}</p>
      <div class="acciones">
        <button class="btn-editar" data-id="${id}">✏️ Editar</button>
        <button class="btn-eliminar" data-id="${id}">🗑️ Eliminar</button>
      </div>
    `;
    container.appendChild(div);
  });

  // Eventos eliminar
  container.querySelectorAll(".btn-eliminar").forEach(btn => {
    btn.onclick = async (e) => {
      const id = e.currentTarget.dataset.id;
      if (!confirm("¿Seguro que deseas eliminar esta publicación?")) return;
      try {
        await deleteDoc(doc(db, "publicaciones", id));
      } catch (err) {
        console.error("Error al eliminar:", err);
        alert("Error al eliminar la publicación.");
      }
    };
  });

  // Eventos editar
  container.querySelectorAll(".btn-editar").forEach(btn => {
    btn.onclick = async (e) => {
      const id = e.currentTarget.dataset.id;
      const art = container.querySelector(`.publicacion[data-id="${id}"]`);
      const tituloActual = art.querySelector(".post-title")?.textContent || "";
      const descripcionActual = art.querySelector(".post-body")?.textContent || "";
      const imagenActualAttr = art.querySelector("img")?.getAttribute("src") || "";

      const nuevoTitulo = prompt("Nuevo título:", tituloActual);
      const nuevaDescripcion = prompt("Nuevo contenido:", descripcionActual);
      const nuevaImagenNombre = prompt("Nuevo nombre de imagen (ej. evolucion1.png). Deja vacío para no cambiar:", imagenActualAttr.includes("imagenes/") ? imagenActualAttr.split("/").pop() : "");

      if (!nuevoTitulo || !nuevaDescripcion) return;

      const nuevaImagenRuta = nuevaImagenNombre ? `imagenes/${nuevaImagenNombre.trim()}` : (imagenActualAttr || null);

      try {
        await updateDoc(doc(db, "publicaciones", id), {
          titulo: nuevoTitulo.trim(),
          descripcion: nuevaDescripcion.trim(),
          imagen: nuevaImagenRuta
        });
      } catch (err) {
        console.error("Error al editar:", err);
        alert("Error al editar la publicación.");
      }
    };
  });
});

// 📝 Agregar nueva publicación (admin)
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const titulo = document.getElementById("titulo").value.trim();
  const descripcion = document.getElementById("contenidoPub").value.trim();
  const imagenNombre = document.getElementById("imagenNombre").value.trim();

  if (!titulo || !descripcion) {
    alert("Completa título y contenido.");
    return;
  }

  const imagenRuta = imagenNombre ? `imagenes/${imagenNombre}` : null;

  try {
    await addDoc(publicacionesRef, {
      titulo,
      descripcion,
      imagen: imagenRuta,
      fecha: new Date(),
      autor: nombreAdminActual, // 🔥 ahora guarda el nombre del admin desde Firestore
      likes: 0,
      comentarios: []
    });
    form.reset();
    alert("Publicación creada ✅");
  } catch (err) {
    console.error("Error al crear publicación:", err);
    alert("Error al crear publicación.");
  }
});

// ---------- helpers ----------
function escapeHtml(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}