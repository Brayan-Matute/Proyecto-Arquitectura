import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, sendPasswordResetEmail, signOut } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
import { getFirestore, doc, getDoc, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAipEqvrKnyj0obYcu-WKgRLzEAEqlG0jg",
  authDomain: "login-arquitectura.firebaseapp.com",
  projectId: "login-arquitectura",
  storageBucket: "login-arquitectura.firebasestorage.app",
  messagingSenderId: "546770055389",
  appId: "1:546770055389:web:3b9fdff53e1d258520eb34",
  measurementId: "G-2JS71G1C5M"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const f = document.getElementById('formLogin');
const msg = document.getElementById('msg');
const spin = document.getElementById('spin');
const btn = document.getElementById('btnLogin');
const email = document.getElementById('email');
const pass = document.getElementById('password');
const toggle = document.getElementById('togglePass');
const linkReset = document.getElementById('linkReset');
const verifyBox = document.getElementById('verifyBox');
const btnGoVerify = document.getElementById('btnGoVerify');

function loading(s) { btn.disabled = s; spin.classList.toggle('d-none', !s); }
function flash(type, text) { msg.className = `alert alert-${type}`; msg.textContent = text; msg.classList.remove('d-none'); }
function hideFlash() { msg.classList.add('d-none'); msg.textContent = ""; }

toggle.addEventListener('click', () => {
  const show = pass.type === 'password';
  pass.type = show ? 'text' : 'password';
  toggle.firstElementChild.classList.toggle('bi-eye', !show);
  toggle.firstElementChild.classList.toggle('bi-eye-slash', show);
  pass.focus();
});

f.addEventListener('submit', async (e) => {
  e.preventDefault(); hideFlash(); verifyBox.classList.add('d-none'); loading(true);
  try {
    let loginInput = email.value.trim();
    let correoLogin = loginInput;
    let userDoc = null;

    // Permitir login con nombre de usuario
    if (!loginInput.includes("@")) {
      const q = query(collection(db, "usuarios"), where("nombre_usuario", "==", loginInput));
      const snap = await getDocs(q);
      if (snap.empty) throw new Error("Usuario no encontrado.");
      userDoc = snap.docs[0];
      correoLogin = userDoc.data().email;
    }

    const { user } = await signInWithEmailAndPassword(auth, correoLogin, pass.value);

    // Verificar si ya está verificado
    const ref = doc(db, "verificaciones", user.uid);
    const snap = await getDoc(ref);
    if (!snap.exists() || !snap.data().verificado) {
      await signOut(auth);
      verifyBox.classList.remove('d-none');
      flash('warning', 'Verifica tu cuenta con el código enviado a tu correo.');
      btnGoVerify.onclick = () => location.href = `/Frontend/verificar.html?uid=${user.uid}`;
      return;
    }

    // 🔥 Solicitud a tu API Django para obtener más datos
    const res = await fetch("http://31.97.139.53:3000/login/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre_usuario: correoLogin, contrasena: pass.value })
    });

    const data = await res.json();
    if (!data.ok) throw new Error("Error al obtener datos del usuario.");

    // Guardar en localStorage
    localStorage.setItem('nombre_usuario', data.usuario.nombre_usuario); // para panel
    localStorage.setItem('username', data.usuario.nombre_usuario);       // para perfil
    localStorage.setItem('userId', data.usuario.id);                     // ID para stats
    localStorage.setItem('token', await user.getIdToken());

    // Redirigir
    window.location.href = '/Frontend/panel.html';

  } catch (err) {
    console.error(err);
    const map = {
      'auth/invalid-credential': 'Credenciales inválidas.',
      'auth/user-not-found': 'Usuario no encontrado.',
      'auth/wrong-password': 'Contraseña incorrecta.'
    };
    flash('danger', map[err.code] || err.message);
  } finally {
    loading(false);
  }
});

linkReset.addEventListener('click', e => {
  e.preventDefault();
  window.location.href = "/Frontend/reset.html";
});

