import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

// 🔹 Configuración Firebase (igual que en admin.html)
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
const db = getFirestore(app);

// 🔹 Subir publicaciones
document.getElementById('publicacionForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const titulo = document.getElementById('titulo').value.trim();
  const contenido = document.getElementById('contenidoPub').value.trim();

  if (!titulo || !contenido) return;

  try {
    await addDoc(collection(db, "publicaciones"), {
      titulo,
      contenido,
      fecha: new Date().toLocaleString()
    });

    alert("✅ Publicación subida con éxito");
    document.getElementById('publicacionForm').reset();
  } catch (error) {
    console.error(error);
    alert("❌ Error al subir la publicación: " + error.message);
  }
});