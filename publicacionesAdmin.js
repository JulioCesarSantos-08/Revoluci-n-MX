// Arreglo para almacenar publicaciones temporalmente
let publicaciones = JSON.parse(localStorage.getItem("publicaciones")) || [];

// Elementos del DOM
const form = document.getElementById("publicacionForm");
const container = document.getElementById("publicacionesContainer");

// Mostrar publicaciones guardadas al cargar la página
mostrarPublicaciones();

// Evento para agregar nueva publicación
form.addEventListener("submit", (e) => {
  e.preventDefault();
  
  const titulo = document.getElementById("titulo").value.trim();
  const contenido = document.getElementById("contenidoPub").value.trim();
  const imagen = document.getElementById("imagenNombre").value.trim();

  if (!titulo || !contenido || !imagen) return alert("Por favor llena todos los campos.");

  const nuevaPublicacion = {
    id: Date.now(),
    titulo,
    contenido,
    imagen
  };

  publicaciones.push(nuevaPublicacion);
  guardarEnLocalStorage();
  mostrarPublicaciones();
  form.reset();
});

// Función para mostrar publicaciones
function mostrarPublicaciones() {
  container.innerHTML = "";

  if (publicaciones.length === 0) {
    container.innerHTML = "<p>No hay publicaciones aún.</p>";
    return;
  }

  publicaciones.forEach((pub) => {
    const div = document.createElement("div");
    div.classList.add("publicacion");

    div.innerHTML = `
      <h3>${pub.titulo}</h3>
      <img src="imagen/${pub.imagen}" alt="${pub.titulo}">
      <p>${pub.contenido}</p>
      <div class="acciones">
        <button onclick="editarPublicacion(${pub.id})">✏️ Editar</button>
        <button onclick="eliminarPublicacion(${pub.id})">🗑️ Eliminar</button>
      </div>
    `;
    container.appendChild(div);
  });
}

// Guardar en localStorage
function guardarEnLocalStorage() {
  localStorage.setItem("publicaciones", JSON.stringify(publicaciones));
}

// Función para eliminar publicación
function eliminarPublicacion(id) {
  if (confirm("¿Seguro que deseas eliminar esta publicación?")) {
    publicaciones = publicaciones.filter((pub) => pub.id !== id);
    guardarEnLocalStorage();
    mostrarPublicaciones();
  }
}

// Función para editar publicación
function editarPublicacion(id) {
  const pub = publicaciones.find((p) => p.id === id);
  if (!pub) return;

  const nuevoTitulo = prompt("Nuevo título:", pub.titulo);
  const nuevoContenido = prompt("Nuevo contenido:", pub.contenido);
  const nuevaImagen = prompt("Nuevo nombre de imagen:", pub.imagen);

  if (nuevoTitulo && nuevoContenido && nuevaImagen) {
    pub.titulo = nuevoTitulo.trim();
    pub.contenido = nuevoContenido.trim();
    pub.imagen = nuevaImagen.trim();
    guardarEnLocalStorage();
    mostrarPublicaciones();
  }
}