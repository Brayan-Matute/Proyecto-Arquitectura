import { doc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

// --- Función para mostrar toasts ---
function mostrarToast(mensaje, tipo = "success") {
  const toastContainer = document.getElementById("toastContainer");
  const colores = {
    success: "bg-success text-white",
    error: "bg-danger text-white",
    warning: "bg-warning text-dark",
    info: "bg-info text-dark"
  };

  const toast = document.createElement("div");
  toast.className = `toast align-items-center ${colores[tipo]} border-0`;
  toast.setAttribute("role", "alert");
  toast.setAttribute("aria-live", "assertive");
  toast.setAttribute("aria-atomic", "true");
  toast.innerHTML = `
    <div class="d-flex">
      <div class="toast-body fw-semibold">${mensaje}</div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
    </div>
  `;

  toastContainer.appendChild(toast);
  const bsToast = new bootstrap.Toast(toast, { delay: 3000 });
  bsToast.show();

  toast.addEventListener("hidden.bs.toast", () => toast.remove());
}

// --- Variables iniciales ---
const userId = localStorage.getItem('userId');
const username = localStorage.getItem('nombre_usuario');
const correo = localStorage.getItem('correo');

document.getElementById('nombreJugador').textContent = username || "Jugador";
document.getElementById('correoJugador').textContent = correo || "—";
document.getElementById('navUserName').textContent = username || "Jugador";

// Icono aleatorio
document.getElementById('animalIcon').src = 'https://cdn-icons-png.flaticon.com/512/616/616430.png';

// Botones de Salir
[document.getElementById('btnSalir'), document.getElementById('logoutBtn')].forEach(btn => {
  btn.addEventListener('click', () => {
    localStorage.clear();
    window.location.href = "/Frontend/login.html";
  });
});

// Mostrar / Ocultar contraseñas
function togglePassword(btnId, inputId) {
  const btn = document.getElementById(btnId);
  const input = document.getElementById(inputId);
  btn.addEventListener('click', () => {
    const isHidden = input.type === 'password';
    input.type = isHidden ? 'text' : 'password';
    btn.innerHTML = isHidden ? '<i class="bi bi-eye-slash"></i>' : '<i class="bi bi-eye"></i>';
  });
}
togglePassword('toggleNew', 'nuevaPass');
togglePassword('toggleConfirm', 'confirmPass');

//Cambiar nombre (Django + Firebase + Firestore)
document.getElementById('guardarNombre').addEventListener('click', async () => {
  const nuevoNombre = document.getElementById('nuevoNombre').value.trim();
  if (!nuevoNombre) return mostrarToast("Ingresa un nombre válido", "warning");

  try {
    const res = await fetch(`https://eberaplicano.com/michi/jugadores/${userId}/editar/`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre_usuario: nuevoNombre })
    });

    if (res.ok && window.auth?.currentUser) {
      const user = window.auth.currentUser;
      await window.updateProfile(user, { displayName: nuevoNombre });

      const userRef = doc(window.db, "usuarios", user.uid);
      await updateDoc(userRef, { nombre_usuario: nuevoNombre, actualizado: serverTimestamp() });

      localStorage.setItem('nombre_usuario', nuevoNombre);
      document.getElementById('nombreJugador').textContent = nuevoNombre;
      document.getElementById('navUserName').textContent = nuevoNombre;

      bootstrap.Modal.getInstance(document.getElementById('modalNombre')).hide();
      mostrarToast("✅ Nombre actualizado correctamente", "success");
    } else mostrarToast("❌ Error al actualizar nombre", "error");
  } catch (err) {
    console.error(err);
    mostrarToast("Error de conexión con el servidor", "error");
  }
});

//Cambiar contraseña
document.getElementById('guardarPass').addEventListener('click', async () => {
  const nueva = document.getElementById('nuevaPass').value.trim();
  const confirm = document.getElementById('confirmPass').value.trim();
  const msg = document.getElementById('msgPass');

  if (nueva.length < 6) return mostrarToast("La contraseña debe tener al menos 6 caracteres", "warning");
  msg.classList.toggle('d-none', nueva === confirm);
  if (nueva !== confirm) return mostrarToast("Las contraseñas no coinciden", "warning");

  try {
    const res = await fetch(`https://eberaplicano.com/michi/jugadores/${userId}/editar/`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contrasena: nueva })
    });

    if (res.ok && window.auth?.currentUser) {
      await window.updatePassword(window.auth.currentUser, nueva);

      const userRef = doc(window.db, "usuarios", window.auth.currentUser.uid);
      await updateDoc(userRef, { ultima_actualizacion: serverTimestamp() });

      bootstrap.Modal.getInstance(document.getElementById('modalPassword')).hide();
      mostrarToast("🔒 Contraseña actualizada correctamente", "success");
    } else mostrarToast("❌ Error al actualizar contraseña", "error");
  } catch (err) {
    console.error(err);
    mostrarToast("Error al conectar con el servidor", "error");
  }
});
