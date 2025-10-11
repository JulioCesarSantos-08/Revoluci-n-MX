import {
  getAuth,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  query,
  where,
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

// 🔹 Elementos del DOM
const nombreMiembro = document.getElementById("nombreMiembro");
const listaPublicaciones = document.getElementById("listaPublicaciones");
const formPublicacion = document.getElementById("formPublicacion");
const logoutBtn = document.getElementById("logoutBtn");
const toggleMode = document.getElementById("toggleMode");
const inicioBtn = document.getElementById("inicioBtn");

// 🔹 Redirección inicio
inicioBtn?.addEventListener("click", () => {
  window.location.href = "miembro.html";
});

// 🔹 Cerrar sesión
logoutBtn?.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "index.html";
});

// 🔹 Modo oscuro
toggleMode?.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
  localStorage.setItem(
    "modo",
    document.body.classList.contains("dark-mode") ? "oscuro" : "claro"
  );
});
if (localStorage.getItem("modo") === "oscuro") {
  document.body.classList.add("dark-mode");
}

// 👤 Verificar sesión
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    alert("Debes iniciar sesión primero.");
    window.location.href = "index.html";
    return;
  }

  // Buscar nombre del miembro
  const miembrosSnap = await getDocs(collection(db, "miembros"));
  let nombreEncontrado = "";
  miembrosSnap.forEach((docu) => {
    const data = docu.data();
    if (data.email === user.email) nombreEncontrado = data.nombre;
  });

  nombreMiembro.textContent = nombreEncontrado || user.email;

  // Mostrar publicaciones personales
  mostrarPublicaciones(user.email);

  // Guardar nueva publicación
  formPublicacion.addEventListener("submit", async (e) => {
    e.preventDefault();
    const titulo = document.getElementById("tituloPub").value.trim();
    const descripcion = document.getElementById("descPub").value.trim();

    if (!titulo || !descripcion) return alert("Completa todos los campos.");

    await addDoc(collection(db, "publicaciones"), {
      email: user.email,
      titulo,
      descripcion,
      fecha: new Date().toISOString(),
    });

    alert("Publicación agregada ✅");
    formPublicacion.reset();
    mostrarPublicaciones(user.email);
  });
});

// 🔹 Mostrar publicaciones del miembro
async function mostrarPublicaciones(correo) {
  listaPublicaciones.innerHTML = "<p>Cargando publicaciones...</p>";

  const q = query(collection(db, "publicaciones"), where("email", "==", correo));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    listaPublicaciones.innerHTML = "<p>No tienes publicaciones aún.</p>";
    return;
  }

  listaPublicaciones.innerHTML = "";
  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const div = document.createElement("div");
    div.classList.add("publicacion");
    div.innerHTML = `
      <h4>${data.titulo}</h4>
      <p>${data.descripcion}</p>
      <small>${new Date(data.fecha).toLocaleString()}</small>
      <button data-id="${docSnap.id}" class="eliminarBtn">Eliminar</button>
    `;
    listaPublicaciones.appendChild(div);
  });

  // Eliminar publicación
  document.querySelectorAll(".eliminarBtn").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const id = e.target.dataset.id;
      if (confirm("¿Eliminar esta publicación?")) {
        await deleteDoc(doc(db, "publicaciones", id));
        mostrarPublicaciones(correo);
      }
    });
  });
}