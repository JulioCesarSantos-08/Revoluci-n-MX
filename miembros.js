// Importar Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

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
const db = getDatabase(app);

const contenido = document.getElementById("contenido");
const homeBtn = document.getElementById("homeBtn");
const puntosBtn = document.getElementById("puntosBtn");
const recompensasBtn = document.getElementById("recompensasBtn");
const logoutBtn = document.getElementById("logoutBtn");
const modoBtn = document.getElementById("modoBtn");

// Verificar usuario autenticado
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  // Si es admin, redirigirlo al panel admin
  if (user.email === "ti43300@uvp.edu.mx") {
    window.location.href = "admin.html";
    return;
  }

  cargarPublicaciones(); // mostrar por defecto las publicaciones
});

// 🔘 Modo oscuro / claro
modoBtn.addEventListener("click", () => {
  document.body.classList.toggle("claro");
  const esClaro = document.body.classList.contains("claro");
  modoBtn.textContent = esClaro ? "🌞" : "🌙";
});

// 🏠 Inicio (Publicaciones)
homeBtn.addEventListener("click", cargarPublicaciones);
function cargarPublicaciones() {
  const publicacionesRef = ref(db, "publicaciones/");
  onValue(publicacionesRef, (snapshot) => {
    contenido.innerHTML = "<h2>📰 Publicaciones del Clan</h2>";
    if (!snapshot.exists()) {
      contenido.innerHTML += "<p>No hay publicaciones aún.</p>";
      return;
    }
    snapshot.forEach((pub) => {
      const data = pub.val();
      contenido.innerHTML += `
        <div class="publicacion">
          <h3>${data.titulo}</h3>
          <p>${data.contenido}</p>
          <small>📅 ${data.fecha}</small>
        </div>
      `;
    });
  });
}

// 🎯 Puntos personales
puntosBtn.addEventListener("click", () => {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      const puntosRef = ref(db, `miembros/${user.uid}/puntos`);
      onValue(puntosRef, (snapshot) => {
        const puntos = snapshot.val() || 0;
        contenido.innerHTML = `
          <div class="puntos-card">
            <h2>🎯 Mis puntos</h2>
            <h3>${puntos}</h3>
            <p>Sigue participando en las actividades del clan para ganar más puntos.</p>
          </div>
        `;
      });
    }
  });
});

// 🎁 Recompensas
recompensasBtn.addEventListener("click", () => {
  contenido.innerHTML = `
    <section>
      <h2>🎁 Recompensas Disponibles</h2>
      <ul>
        <li>🧢 Gorra oficial - 100 puntos</li>
        <li>👕 Camiseta exclusiva - 250 puntos</li>
        <li>🎫 Entrada a evento - 500 puntos</li>
      </ul>
    </section>
  `;
});

// 🚪 Cerrar sesión
logoutBtn.addEventListener("click", () => {
  signOut(auth).then(() => {
    window.location.href = "index.html";
  });
});