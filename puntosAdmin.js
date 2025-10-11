import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, getDocs, updateDoc, doc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// 🔹 Configuración Firebase
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
const auth = getAuth(app);

const emailMiembroSelect = document.getElementById('emailMiembro');
const puntosForm = document.getElementById('puntosForm');

// 🔹 Cargar miembros en el select
async function cargarMiembros() {
  const querySnapshot = await getDocs(collection(db, "miembros"));
  emailMiembroSelect.innerHTML = '<option value="">Selecciona un miembro</option>';
  querySnapshot.forEach(docSnap => {
    const data = docSnap.data();
    const option = document.createElement('option');
    option.value = data.email;
    option.textContent = data.email;
    emailMiembroSelect.appendChild(option);
  });
}

cargarMiembros();

// 🔹 Asignar puntos
puntosForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = emailMiembroSelect.value;
  const puntos = parseInt(document.getElementById('cantidadPuntos').value);

  if (!email || isNaN(puntos)) return;

  const querySnapshot = await getDocs(collection(db, "miembros"));
  let encontrado = false;

  for (const docSnap of querySnapshot.docs) {
    const data = docSnap.data();
    if (data.email === email) {
      encontrado = true;
      const ref = doc(db, "miembros", docSnap.id);
      await updateDoc(ref, { puntos: (data.puntos || 0) + puntos });
      alert(`✅ Se agregaron ${puntos} puntos a ${email}`);
      break;
    }
  }

  if (!encontrado) {
    alert("❌ Miembro no encontrado.");
  }

  puntosForm.reset();
});