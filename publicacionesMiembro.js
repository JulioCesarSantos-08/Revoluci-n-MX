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
  updateDoc,
  arrayUnion
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

// 🔹 Elementos
const contenido = document.getElementById("contenido");
const logoutBtn = document.getElementById("logoutBtn");
const modoBtn = document.getElementById("modoBtn");
const homeBtn = document.getElementById("homeBtn");
const puntosBtn = document.getElementById("puntosBtn");
const recompensasBtn = document.getElementById("recompensasBtn");

// 🔹 Activar modo oscuro por defecto
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

// 🔹 Sesión activa
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    alert("Debes iniciar sesión primero.");
    window.location.href = "index.html";
    return;
  }

  // Buscar nombre en colección miembros
  const miembrosSnap = await getDocs(collection(db, "miembros"));
  let nombreMiembro = null;

  miembrosSnap.forEach((docu) => {
    const data = docu.data();
    if (data.email === user.email) {
      nombreMiembro = data.nombre;
    }
  });

  if (!nombreMiembro) {
    alert("Tu perfil no tiene datos asignados.");
    await signOut(auth);
    window.location.href = "index.html";
    return;
  }

  // Mostrar publicaciones
  mostrarPublicaciones(nombreMiembro);
});

// 🔹 Mostrar publicaciones
async function mostrarPublicaciones(nombreUsuario) {
  contenido.innerHTML = `
    <section class="saludo">
      <h2>👋 Hola <span class="nombre">${nombreUsuario}</span>, bienvenido</h2>
      <p>Aquí puedes ver las publicaciones de la comunidad.</p>
    </section>
  `;

  const publicacionesSnap = await getDocs(collection(db, "publicaciones"));
  if (publicacionesSnap.empty) {
    contenido.innerHTML += `<p class="sin-posts">No hay publicaciones aún.</p>`;
    return;
  }

  publicacionesSnap.forEach((docu) => {
    const data = docu.data();
    const publicacionDiv = document.createElement("div");
    publicacionDiv.classList.add("publicacion");

    publicacionDiv.innerHTML = `
      <h3>${data.titulo}</h3>
      <img src="${data.imagen || "imagenes/default.png"}" alt="${data.titulo}" />
      <p>${data.descripcion}</p>

      <div class="acciones">
        <button class="likeBtn">❤️ ${data.likes || 0}</button>
        <button class="comentarBtn">💬 Comentar</button>
      </div>

      <div class="comentarios"></div>
    `;

    // ❤️ Like
    const likeBtn = publicacionDiv.querySelector(".likeBtn");
    likeBtn.addEventListener("click", async () => {
      const newLikes = (data.likes || 0) + 1;
      await updateDoc(doc(db, "publicaciones", docu.id), { likes: newLikes });
      likeBtn.textContent = `❤️ ${newLikes}`;
    });

    // 💬 Comentar
    const comentarBtn = publicacionDiv.querySelector(".comentarBtn");
    comentarBtn.addEventListener("click", async () => {
      const comentario = prompt("Escribe tu comentario:");
      if (comentario) {
        await updateDoc(doc(db, "publicaciones", docu.id), {
          comentarios: arrayUnion({ usuario: nombreUsuario, texto: comentario }),
        });
        alert("Comentario agregado 👍");
      }
    });

    contenido.appendChild(publicacionDiv);
  });
}

// 🔹 Navegación
homeBtn?.addEventListener("click", () => window.location.href = "publicacionesMiembro.html");
puntosBtn?.addEventListener("click", () => window.location.href = "puntosMiembro.html");
recompensasBtn?.addEventListener("click", () => window.location.href = "recompensasMiembro.html");