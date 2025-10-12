import { 
  getAuth, onAuthStateChanged, signOut 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import { 
  getFirestore, collection, getDocs, doc, getDoc, setDoc, addDoc, serverTimestamp, query, orderBy 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

// 🔥 Config Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDd1jXzZfR-QUW7iRdYjF4oMZTsVBaIAFM",
  authDomain: "revolucionmx-308c2.firebaseapp.com",
  databaseURL: "https://revolucionmx-308c2-default-rtdb.firebaseio.com",
  projectId: "revolucionmx-308c2",
  storageBucket: "revolucionmx-308c2.appspot.com",
  messagingSenderId: "143264550141",
  appId: "1:143264550141:web:7e5425c2b75c5579d04294"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);

// 🔐 Validar que sea admin
const admins = [
  "ti43300@uvp.edu.mx",
  "andrespersandoval@gmail.com",
  "luisramirezd86@gmail.com"
];

let adminEmail = "";

onAuthStateChanged(auth, (user) => {
  if (!user || !admins.includes(user.email)) {
    alert("⚠️ Acceso denegado.");
    signOut(auth);
    window.location.href = "index.html";
  } else {
    adminEmail = user.email;
    cargarMiembros();
    cargarHistorial();
  }
});

// 🚪 Cerrar sesión
document.getElementById("logoutBtn")?.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "index.html";
});

// 👥 Cargar miembros al select (solo nombre visible)
async function cargarMiembros() {
  const select = document.getElementById("emailMiembro");
  select.innerHTML = `<option value="">Cargando miembros...</option>`;

  const miembrosSnap = await getDocs(collection(db, "miembros"));
  select.innerHTML = `<option value="">Selecciona un miembro</option>`;

  miembrosSnap.forEach((docSnap) => {
    const data = docSnap.data();
    const option = document.createElement("option");
    option.value = data.email; // 🔸 el valor interno sigue siendo el correo
    option.textContent = data.nombre || data.email; // 🔸 visible solo el nombre
    select.appendChild(option);
  });
}

// ➕ Agregar puntos
document.getElementById("puntosForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("emailMiembro").value;
  const puntos = Number(document.getElementById("cantidadPuntos").value);
  const descripcion = document.getElementById("descripcionPuntos").value.trim();

  if (!email || !puntos || !descripcion) {
    alert("Completa todos los campos.");
    return;
  }

  try {
    await addDoc(collection(db, "historialPuntos"), {
      emailMiembro: email,
      puntos,
      descripcion,
      adminEmail,
      fecha: serverTimestamp()
    });

    alert("✅ Puntos asignados correctamente");
    document.getElementById("puntosForm").reset();
    cargarHistorial();
  } catch (err) {
    console.error("❌ Error al asignar puntos:", err);
    alert("Error al asignar puntos.");
  }
});

// 📜 Cargar historial
async function cargarHistorial() {
  const contenedor = document.getElementById("historialPuntos");
  contenedor.innerHTML = `<p style="text-align:center; color:#aaa;">Cargando...</p>`;

  const q = query(collection(db, "historialPuntos"), orderBy("fecha", "desc"));
  const snap = await getDocs(q);

  if (snap.empty) {
    contenedor.innerHTML = `<p style="text-align:center; color:#aaa;">Aún no hay registros.</p>`;
    return;
  }

  contenedor.innerHTML = "";
  for (const docSnap of snap.docs) {
    const data = docSnap.data();
    const fecha = data.fecha?.toDate().toLocaleString() || "Sin fecha";

    // 📌 obtener nombre del miembro a partir del correo
    let nombreMiembro = data.emailMiembro;
    const miembroDoc = await getDoc(doc(db, "miembros", data.emailMiembro));
    if (miembroDoc.exists()) {
      nombreMiembro = miembroDoc.data().nombre || data.emailMiembro;
    }

    const div = document.createElement("div");
    div.classList.add("registro");

    div.innerHTML = `
      <p><strong>👤 Miembro:</strong> ${nombreMiembro}</p>
      <p><strong>✨ Puntos:</strong> ${data.puntos}</p>
      <p><strong>📝 Motivo:</strong> ${data.descripcion}</p>
      <p><strong>👮‍♂️ Asignado por:</strong> ${data.adminEmail}</p>
      <p><strong>🕒 Fecha:</strong> ${fecha}</p>
    `;

    contenedor.appendChild(div);
  }
}