import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
  import { getFirestore, doc, getDoc, updateDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

  // Configuración Firebase
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
  const db  = getFirestore(app);

  const API_URL = "http://31.97.139.53:4001/send-code";

  const params = new URLSearchParams(location.search);
  const uid = params.get("uid");

  const msg = document.getElementById("msg");
  const form = document.getElementById("formVerify");
  const inp  = document.getElementById("codigo");
  const btnReenviar = document.getElementById("btnReenviar");

  //Funciones auxiliares
  function flash(type, text){ 
    msg.className = `alert alert-${type}`; 
    msg.textContent = text; 
    msg.classList.remove('d-none'); 
  }
  function generarCodigo(){ return Math.floor(100000 + Math.random() * 900000).toString(); }

  //Verificar código
  form.addEventListener("submit", async (e) => {
    e.preventDefault(); 
    msg.classList.add("d-none");

    const code = (inp.value || "").trim();
    if (code.length !== 6) return flash("warning", "Ingresa el código de 6 dígitos.");

    try {
      const ref = doc(db, "verificaciones", uid);
      const snap = await getDoc(ref);

      if (!snap.exists()) return flash("danger", "No se encontró una verificación pendiente.");
      const data = snap.data();

      if (data.codigo === code) {
        await updateDoc(ref, { verificado: true, verificadoEn: serverTimestamp() }); //Solo actualiza, no borra
        flash("success", "¡Cuenta verificada correctamente! Serás redirigido al login…");
        setTimeout(() => location.href = "/Frontend/login.html?verify=1", 1500);
      } else {
        flash("danger", "El código no es correcto.");
      }
    } catch (err) {
      flash("danger", err.message);
    }
  });

  //Reenviar código
  let cooldown = false;
  btnReenviar.addEventListener("click", async () => {
    if (cooldown) return;
    cooldown = true;
    btnReenviar.disabled = true;
    btnReenviar.textContent = "Reenviando…";

    try {
      const ref = doc(db, "verificaciones", uid);
      const snap = await getDoc(ref);
      if (!snap.exists()) throw new Error("No se encontró la verificación.");
      const data = snap.data();

      const nuevo = generarCodigo();
      await setDoc(ref, {
        ...data,
        codigo: nuevo,
        verificado: false,
        creado: serverTimestamp()
      }, { merge: true });

      const resp = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email, codigo: nuevo, nombre: "" })
      });
      const out = await resp.json().catch(() => ({ ok: false, msg: "Respuesta inválida de la API" }));
      if (!resp.ok || !out.ok) throw new Error(out.msg || `send-code falló (${resp.status})`);

      flash("success", "Te reenviamos un nuevo código. Revisa tu bandeja.");
    } catch (err) {
      flash("danger", err.message);
    } finally {
      setTimeout(() => {
        cooldown = false;
        btnReenviar.disabled = false;
        btnReenviar.textContent = "Reenviar código";
      }, 30000);
    }
  });
