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
  arrayUnion,
  arrayRemove,
  getDoc,
  increment
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

// 🔧 Configuración Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDd1jXzZfR-QUW7iRdYjF4oMZTsVBaIAFM",
  authDomain: "revolucionmx-308c2.firebaseapp.com",
  projectId: "revolucionmx-308c2",
  storageBucket: "revolucionmx-308c2.appspot.com",
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

// 🌙 Modo oscuro por defecto
document.body.classList.add("dark-mode");
localStorage.setItem("modo", "oscuro");
if (modoBtn) modoBtn.textContent = "☀️";

// 🌗 Cambiar modo
modoBtn?.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
  localStorage.setItem(
    "modo",
    document.body.classList.contains("dark-mode") ? "oscuro" : "claro"
  );
  modoBtn.textContent = document.body.classList.contains("dark-mode") ? "☀️" : "🌙";
});

// 🚪 Cerrar sesión
logoutBtn?.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "index.html";
});

// 🧍‍♂️ Verificar sesión
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    alert("Debes iniciar sesión primero.");
    window.location.href = "index.html";
    return;
  }

  // Obtener nombre del usuario logueado
  const miembrosSnap = await getDocs(collection(db, "miembros"));
  let nombreMiembro = null;
  miembrosSnap.forEach((docu) => {
    const data = docu.data();
    if (data.email === user.email) nombreMiembro = data.nombre;
  });

  if (!nombreMiembro) {
    alert("Tu perfil no tiene datos asignados.");
    await signOut(auth);
    window.location.href = "index.html";
    return;
  }

  mostrarPublicaciones(nombreMiembro, user.email);
});

// 📰 Mostrar publicaciones
async function mostrarPublicaciones(nombreUsuario, emailUsuario) {
  contenido.innerHTML = `
    <section class="saludo">
      <h2>👋 Hola <span class="nombre">${nombreUsuario}</span>, bienvenido</h2>
      <p>Aquí puedes ver y reaccionar a las publicaciones de la comunidad.</p>
    </section>
  `;

  const publicacionesSnap = await getDocs(collection(db, "publicaciones"));
  if (publicacionesSnap.empty) {
    contenido.innerHTML += `<p class="sin-posts">No hay publicaciones aún.</p>`;
    return;
  }

  publicacionesSnap.forEach((docu) => {
    const data = docu.data();

    // Manejo seguro de fecha: si fue guardada como timestamp de Firestore
    let fecha = "Fecha no disponible";
    if (data.fecha) {
      try {
        // Si es timestamp de Firestore
        fecha = new Date(data.fecha.seconds * 1000).toLocaleString();
      } catch (e) {
        // Si es string
        fecha = String(data.fecha);
      }
    }

    const publicacionDiv = document.createElement("div");
    publicacionDiv.classList.add("publicacion");

    const usuariosLikes = Array.isArray(data.usuariosLikes) ? data.usuariosLikes : [];
    const likesIniciales = typeof data.likes === "number" ? data.likes : usuariosLikes.length;
    const yaDioLike = usuariosLikes.includes(emailUsuario);

    publicacionDiv.innerHTML = `
      <div class="header-post">
        <strong>${data.autor || "Anónimo"}</strong>
        <span class="fecha">${fecha}</span>
      </div>
      <h3>${data.titulo || ""}</h3>
      ${data.imagen ? `<img src="${data.imagen}" alt="${data.titulo}">` : ""}
      <p>${data.descripcion || ""}</p>

      <div class="acciones">
        <button class="likeBtn">${yaDioLike ? "💔 Quitar Like" : "❤️ Me gusta"} (${likesIniciales})</button>
        <button class="comentarBtn">💬 Comentar</button>
      </div>

      <div class="comentarios">
        ${(data.comentarios || [])
          .map(c => `<p><strong>${c.usuario}:</strong> ${c.texto}</p>`)
          .join("")}
      </div>
    `;

    // ❤️ Toggle Like con lectura fresca y update atomico (increment + arrayUnion/arrayRemove)
    const likeBtn = publicacionDiv.querySelector(".likeBtn");
    likeBtn.addEventListener("click", async () => {
      try {
        const postRef = doc(db, "publicaciones", docu.id);

        // Leer el documento más reciente
        const freshSnap = await getDoc(postRef);
        if (!freshSnap.exists()) return;
        const fresh = freshSnap.data();
        const usuariosLikesFresh = Array.isArray(fresh.usuariosLikes) ? fresh.usuariosLikes : [];
        const likesFresh = typeof fresh.likes === "number" ? fresh.likes : usuariosLikesFresh.length;

        if (usuariosLikesFresh.includes(emailUsuario)) {
          // quitar like
          await updateDoc(postRef, {
            usuariosLikes: arrayRemove(emailUsuario),
            likes: increment(-1)
          });
        } else {
          // agregar like
          await updateDoc(postRef, {
            usuariosLikes: arrayUnion(emailUsuario),
            likes: increment(1)
          });
        }

        // volver a leer el post para mostrar el estado actualizado
        const updatedSnap = await getDoc(postRef);
        const updated = updatedSnap.exists() ? updatedSnap.data() : null;
        const updatedLikes = updated ? (typeof updated.likes === "number" ? updated.likes : (Array.isArray(updated.usuariosLikes) ? updated.usuariosLikes.length : 0)) : 0;
        const updatedUsuariosLikes = updated && Array.isArray(updated.usuariosLikes) ? updated.usuariosLikes : [];
        const ahoraDio = updatedUsuariosLikes.includes(emailUsuario);

        likeBtn.textContent = `${ahoraDio ? "💔 Quitar Like" : "❤️ Me gusta"} (${updatedLikes})`;
      } catch (err) {
        console.error("Error toggle like:", err);
        alert("No se pudo actualizar el like. Intenta de nuevo.");
      }
    });

    // 💬 Comentar (igual que antes)
    const comentarBtn = publicacionDiv.querySelector(".comentarBtn");
    const comentariosDiv = publicacionDiv.querySelector(".comentarios");
    comentarBtn.addEventListener("click", async () => {
      const comentario = prompt("Escribe tu comentario:");
      if (comentario) {
        const nuevoComentario = { usuario: nombreUsuario, texto: comentario };
        try {
          await updateDoc(doc(db, "publicaciones", docu.id), {
            comentarios: arrayUnion(nuevoComentario),
          });
          const nuevoP = document.createElement("p");
          nuevoP.innerHTML = `<strong>${nuevoComentario.usuario}:</strong> ${nuevoComentario.texto}`;
          comentariosDiv.appendChild(nuevoP);
        } catch (err) {
          console.error("Error agregando comentario:", err);
          alert("No se pudo agregar el comentario.");
        }
      }
    });

    contenido.appendChild(publicacionDiv);
  });
}

// 🧭 Navegación
homeBtn?.addEventListener("click", () => window.location.href = "publicacionesMiembro.html");
puntosBtn?.addEventListener("click", () => window.location.href = "puntosMiembro.html");
recompensasBtn?.addEventListener("click", () => window.location.href = "recompensasMiembro.html");
