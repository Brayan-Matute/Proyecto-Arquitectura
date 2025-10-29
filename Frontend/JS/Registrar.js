
  import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
  import { getAuth, createUserWithEmailAndPassword, updateProfile, signOut } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
  import { getFirestore, doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

  // Firebase Config
  const firebaseConfig = {
    apiKey: "AIzaSyAipEqvrKnyj0obYcu-WKgRLzEAEqlG0jg",
    authDomain: "login-arquitectura.firebaseapp.com",
    projectId: "login-arquitectura",
    storageBucket: "login-arquitectura.appspot.com",
    messagingSenderId: "546770055389",
    appId: "1:546770055389:web:3b9fdff53e1d258520eb34"
  };
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  const API_CORREO = "http://31.97.139.53:4001/send-code";
  const API_DB     = "http://31.97.139.53:3000/jugadores/nuevo/";

  const form    = document.getElementById('formReg');
  const msg     = document.getElementById('msg');
  const btn     = document.getElementById('btnReg');
  const spin    = document.getElementById('spin');
  const pass    = document.getElementById('password');
  const confirm = document.getElementById('confirm');
  const hint    = document.getElementById('hint');

  // Mostrar/Ocultar contraseña
  document.querySelectorAll('.toggle-pass').forEach(b => {
    b.addEventListener('click', () => {
      const id = b.getAttribute('data-target');
      const input = document.getElementById(id);
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      b.firstElementChild.classList.toggle('bi-eye', !show);
      b.firstElementChild.classList.toggle('bi-eye-slash', show);
      input.focus();
    });
  });

  function loading(s) { btn.disabled = s; spin.classList.toggle('d-none', !s); }
  function flash(type, text) {
    msg.className = `alert alert-${type}`;
    msg.textContent = text;
    msg.classList.remove('d-none');
  }
  function match() {
    return pass.value && confirm.value && pass.value === confirm.value;
  }
  [pass, confirm].forEach(el => el.addEventListener('input', () => hint.classList.toggle('d-none', match())));
  function generarCodigo() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
  function fetchWithTimeout(url, opts = {}, ms = 12000) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), ms);
    return fetch(url, { ...opts, signal: ctrl.signal }).finally(() => clearTimeout(t));
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault(); msg.classList.add('d-none');
    if (!match()) {
      hint.classList.remove('d-none');
      return flash('danger', 'Las contraseñas no coinciden.');
    }
    loading(true);
    try {
      const email = document.getElementById('email').value.trim();
      const name = document.getElementById('name').value.trim();
      const password = pass.value;

      // 1) Crear usuario Firebase
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      if (name) await updateProfile(user, { displayName: name });

      // 2) Guardar en colección "usuarios"
      await setDoc(doc(db, "usuarios", user.uid), {
        nombre_usuario: name.toLowerCase(),
        email: user.email,
        uid: user.uid
      });

      // 3) Código de verificación
      const codigo = generarCodigo();
      await setDoc(doc(db, "verificaciones", user.uid), {
        email, codigo, verificado: false, creado: serverTimestamp()
      });

      // 4) Enviar código por correo
      const respCorreo = await fetchWithTimeout(API_CORREO, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, codigo, nombre: name })
      });
      const outCorreo = await respCorreo.json().catch(() => ({ ok: false, msg: "Respuesta inválida de la API" }));
      if (!respCorreo.ok || !outCorreo.ok) throw new Error(outCorreo.msg || "Error al enviar correo");

      // 5) Registrar también en tu base de datos externa
      const respDB = await fetch(API_DB, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre_usuario: name.toLowerCase(),
          contrasena: password,
          correo: email
        })
      });
      const outDB = await respDB.json().catch(() => ({ msg: "Respuesta inválida del servidor externo" }));
      if (!respDB.ok) throw new Error(outDB.msg || "Error al guardar en base de datos externa");

      flash('success', 'Cuenta creada. Te enviamos un código por correo.');
      await signOut(auth);
      setTimeout(() => location.href = `verificar.html?uid=${user.uid}`, 1200);

    } catch (err) {
      console.error(err);
      const map = {
        'auth/email-already-in-use': 'Ese correo ya está en uso.',
        'auth/weak-password': 'La contraseña es muy corta (mín. 6).',
        'auth/invalid-email': 'Correo inválido.'
      };
      flash('danger', map[err.code] || err.message);
    } finally {
      loading(false);
    }
  });


    const bar = document.getElementById('strength-bar');
    const text = document.getElementById('strength-text');
    const tooltip = new bootstrap.Tooltip(bar);

    function evaluarFuerza(value) {
      let strength = 0;
      if (value.length >= 6) strength++;
      if (/[A-Z]/.test(value)) strength++;
      if (/[0-9]/.test(value)) strength++;
      if (/[^A-Za-z0-9]/.test(value)) strength++;
      return strength;
    }

    function actualizarBarra() {
      const value = pass.value;
      const confirmValue = confirm.value;
      const strength = evaluarFuerza(value);
      const coincide = value && value === confirmValue;

      if (!value) {
        bar.style.width = "0%";
        bar.style.backgroundColor = "#f44336";
        text.textContent = "";
        btn.disabled = true;
        return;
      }

      let color = "#f44336", texto = "Débil", ancho = "33%", clase = "text-danger";
      if (strength >= 2) { color = "#ffb300"; texto = "Media"; ancho = "66%"; clase = "text-warning"; }
      if (strength >= 3) { color = "#4caf50"; texto = "Fuerte"; ancho = "100%"; clase = "text-success"; }

      // Si coincide y es fuerte
      if (strength >= 3 && coincide) {
        texto = "✔ Segura y coincide";
        color = "#2ecc71";
        clase = "text-success fw-semibold";
        btn.disabled = false; // habilitar botón
      } else {
        btn.disabled = true; // bloquear mientras no cumpla
      }

      // Mostrar visualmente
      bar.style.width = ancho;
      bar.style.backgroundColor = color;
      text.textContent = texto;
      text.className = `${clase} small mt-1`;

      // Mostrar/ocultar mensaje de error
      hint.classList.toggle('d-none', coincide || !confirmValue);
    }

    pass.addEventListener('input', actualizarBarra);
    confirm.addEventListener('input', actualizarBarra);