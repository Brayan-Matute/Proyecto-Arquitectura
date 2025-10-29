import { doc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

    const userId = localStorage.getItem('userId');
    const username = localStorage.getItem('nombre_usuario');
    const correo = localStorage.getItem('correo');

    document.getElementById('nombreJugador').textContent = username || "Jugador";
    document.getElementById('correoJugador').textContent = correo || "—";
    document.getElementById('navUserName').textContent = username || "Jugador";

    // 🐾 Icono aleatorio
    document.getElementById('animalIcon').src = 'https://cdn-icons-png.flaticon.com/512/616/616430.png';

    // 🟠 Botones Salir
    [document.getElementById('btnSalir'), document.getElementById('logoutBtn')].forEach(btn => {
      btn.addEventListener('click', () => {
        localStorage.clear();
        window.location.href = "/Frontend/login.html";
      });
    });

    // 👁️ Mostrar / Ocultar contraseñas
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

    // 🟢 Cambiar nombre (Django + Firebase + Firestore)
    document.getElementById('guardarNombre').addEventListener('click', async () => {
      const nuevoNombre = document.getElementById('nuevoNombre').value.trim();
      if (!nuevoNombre) return alert("Ingresa un nombre válido");

      try {
        const res = await fetch(`http://31.97.139.53:3000/jugadores/${userId}/editar/`, {
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
          alert("✅ Nombre actualizado correctamente");
          bootstrap.Modal.getInstance(document.getElementById('modalNombre')).hide();
        } else alert("❌ Error al actualizar nombre");
      } catch (err) {
        console.error(err);
        alert("Error de conexión");
      }
    });

    // 🟡 Cambiar contraseña
    document.getElementById('guardarPass').addEventListener('click', async () => {
      const nueva = document.getElementById('nuevaPass').value.trim();
      const confirm = document.getElementById('confirmPass').value.trim();
      const msg = document.getElementById('msgPass');

      if (nueva.length < 6) return alert("La contraseña debe tener al menos 6 caracteres");
      msg.classList.toggle('d-none', nueva === confirm);
      if (nueva !== confirm) return;

      try {
        const res = await fetch(`http://31.97.139.53:3000/jugadores/${userId}/editar/`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contrasena: nueva })
        });

        if (res.ok && window.auth?.currentUser) {
          await window.updatePassword(window.auth.currentUser, nueva);

          const userRef = doc(window.db, "usuarios", window.auth.currentUser.uid);
          await updateDoc(userRef, { ultima_actualizacion: serverTimestamp() });

          alert("🔒 Contraseña actualizada correctamente");
          bootstrap.Modal.getInstance(document.getElementById('modalPassword')).hide();
        } else alert("❌ Error al actualizar contraseña");
      } catch (err) {
        console.error(err);
        alert("Error al conectar con el servidor");
      }
    });
 