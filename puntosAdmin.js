import {
  getAuth, onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  getFirestore, collection, getDocs, doc, getDoc, setDoc, addDoc, serverTimestamp,
  query, orderBy, deleteDoc, updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

// 🔥 Config Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDd1jXzZfR-QUW7iRdYjF4oMZTsVBaIAFM",
  authDomain: "revolucionmx-308c2.firebaseapp.com",
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

// 🔒 Verificar autenticación
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

// 👥 Cargar miembros
async function cargarMiembros() {
  const select = document.getElementById("emailMiembro");
  select.innerHTML = `<option value="">Cargando miembros...</option>`;

  const miembrosSnap = await getDocs(collection(db, "miembros"));
  select.innerHTML = `<option value="">Selecciona un miembro</option>`;

  miembrosSnap.forEach((docSnap) => {
    const data = docSnap.data();
    const option = document.createElement("option");
    option.value = data.email;
    option.textContent = data.nombre || data.email;
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
    const id = docSnap.id;
    const fecha = data.fecha?.toDate().toLocaleString() || "Sin fecha";
    const ultimaEdicion = data.ultimaEdicion
      ? `<p class="editado">🕓 Última edición: ${data.ultimaEdicion.toDate().toLocaleString()}</p>`
      : "";

    // 🔹 obtener nombre del miembro
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
      ${ultimaEdicion}
      <div class="acciones">
        <button class="editar" data-id="${id}">✏️ Editar</button>
        <button class="eliminar" data-id="${id}">🗑️ Eliminar</button>
      </div>
    `;

    contenedor.appendChild(div);
  }

  // 🗑️ Eliminar registro
  document.querySelectorAll(".eliminar").forEach(btn => {
    btn.addEventListener("click", async () => {
      if (confirm("¿Eliminar este registro de puntos?")) {
        await deleteDoc(doc(db, "historialPuntos", btn.dataset.id));
        alert("🗑️ Registro eliminado correctamente");
        cargarHistorial();
      }
    });
  });

  // ✏️ Editar registro
  document.querySelectorAll(".editar").forEach(btn => {
    btn.addEventListener("click", async () => {
      const docRef = doc(db, "historialPuntos", btn.dataset.id);
      const snap = await getDoc(docRef);
      if (!snap.exists()) return;

      const datos = snap.data();
      const nuevoMotivo = prompt("Editar motivo:", datos.descripcion);
      const nuevosPuntos = prompt("Editar cantidad de puntos:", datos.puntos);

      if (nuevoMotivo && nuevosPuntos) {
        await updateDoc(docRef, {
          descripcion: nuevoMotivo,
          puntos: Number(nuevosPuntos),
          ultimaEdicion: serverTimestamp()
        });
        alert("✅ Registro actualizado correctamente");
        cargarHistorial();
      }
    });
  });
}