let segundos = 60;
let contador = document.getElementById("contador");
let intervalo = null;
let iniciado = false;
let nivel = localStorage.getItem("nivel_juego") || "facil";
let intentos = 6;
let musica;
const musicaIniciada = localStorage.getItem("musica_iniciada") === "true";
const jugadorId = localStorage.getItem("userId");

// 🔊 Sonidos
const sonidoCarta = new Audio("/Frontend/cartas-frontal/cartas.wav");
const sonidoVictoria = new Audio("/Frontend/cartas-frontal/Win1.mp3");
const sonidoDerrota = new Audio("/Frontend/cartas-frontal/perdio.mp3");

// 📦 Reproduce sonido de carta
function reproducirCarta() {
  sonidoCarta.currentTime = 0;
  sonidoCarta.play().catch(() => {});
}

// 🪄 Toasts visuales
function mostrarToast(mensaje, tipo = "info") {
  const toastContainer = document.getElementById("toastContainer");
  const colores = {
    success: "bg-success text-white",
    danger: "bg-danger text-white",
    warning: "bg-warning text-dark",
    info: "bg-primary text-white"
  };

  const toast = document.createElement("div");
  toast.className = `toast align-items-center border-0 shadow-sm ${colores[tipo]}`;
  toast.setAttribute("role", "alert");
  toast.innerHTML = `
    <div class="d-flex">
      <div class="toast-body fw-semibold">${mensaje}</div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
    </div>
  `;
  toastContainer.appendChild(toast);
  const bsToast = new bootstrap.Toast(toast, { delay: 4000 });
  bsToast.show();
  toast.addEventListener("hidden.bs.toast", () => toast.remove());
}

// 🎵 Música de fondo
if (musicaIniciada) {
  musica = new Audio("/Frontend/cartas-frontal/game_1mn12s_130bpm_STD.wav");
  musica.loop = true;
  musica.volume = 0.5;
  setTimeout(() => {
    musica.play().catch(err => console.warn("🎵 No se pudo continuar la música:", err));
  }, 200);
}

// 🧩 Intentos según nivel
switch (nivel) {
  case "medio":
    intentos = 4;
    break;
  case "dificil":
    intentos = 2;
    break;
  default:
    intentos = 6;
}

const intentosSpan = document.getElementById("intentos");
intentosSpan.textContent = intentos;

// 🕒 Contador regresivo
function iniciarContador() {
  if (!iniciado) {
    iniciado = true;
    intervalo = setInterval(() => {
      segundos--;
      contador.textContent = segundos;

      if (segundos === 0) {
        detenerContador();
        if (musica) musica.pause();
        //localStorage.removeItem("musica_iniciada");
        registrarPartida("Derrota", 60, nivel);
        //sonidoDerrota.play();
        setTimeout(() => (window.location.href = "perdiste.html"), 1500);
      }
    }, 1000);
  }
}

function detenerContador() {
  clearInterval(intervalo);
}

// 🎵 Botón de música
const btnMusica = document.getElementById("btnMusica");
btnMusica.addEventListener("click", () => {
  if (musica.paused) {
    musica.play();
    btnMusica.textContent = "🔊 Música";
    btnMusica.classList.remove("off");
  } else {
    musica.pause();
    btnMusica.textContent = "🔇 Silencio";
    btnMusica.classList.add("off");
  }
});

// 🧩 Registrar partidas (API)
async function registrarPartida(resultado, tiempo, nivel) {
  const fechaActual = new Date().toISOString();
  const nivelesValidos = { facil: "Básico", medio: "Medio", dificil: "Avanzado" };
  const nivelBackend = nivelesValidos[nivel.toLowerCase()] || "Básico";

  const data = {
    jugador_id: parseInt(jugadorId) || 0,
    resultado,
    tiempo: tiempo.toFixed(2),
    nivel: nivelBackend,
    fecha: fechaActual
  };

  try {
    const response = await fetch("http://31.97.139.53:3000/partidas/nueva/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    if (response.ok) console.log("✅ Partida registrada:", data);
    else console.error("⚠️ Error al registrar partida:", await response.text());
  } catch (error) {
    console.error("❌ Error de conexión:", error);
  }
}

// ----------------- Lógica del juego -----------------
const cartas = [
  "cartas-frontal/cartasA-1.png", "cartas-frontal/cartasA-2.png",
  "cartas-frontal/cartasB-1.png", "cartas-frontal/cartasB-2.png",
  "cartas-frontal/cartasC-1.png", "cartas-frontal/cartasC-2.png",
  "cartas-frontal/cartasD-1.png", "cartas-frontal/cartasD-2.png",
  "cartas-frontal/cartasE-1.png", "cartas-frontal/cartasE-2.png",
  "cartas-frontal/cartasF-1.png", "cartas-frontal/cartasF-2.png",
  "cartas-frontal/cartasG-1.png", "cartas-frontal/cartasG-2.png",
  "cartas-frontal/cartasH-1.png", "cartas-frontal/cartasH-2.png"
];

// 🔀 Barajar
for (let i = cartas.length - 1; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1));
  [cartas[i], cartas[j]] = [cartas[j], cartas[i]];
}

// 🖼️ Asignar imágenes
const backs = document.querySelectorAll(".card-face.back img");
backs.forEach((img, i) => (img.src = cartas[i]));

const cards = document.querySelectorAll(".card");
let flippedCards = [];

// 👀 Mostrar todas las cartas 3s
function mostrarCartasTemporalmente() {
  cards.forEach(card => card.classList.add("flipped"));
  setTimeout(() => {
    cards.forEach(card => card.classList.remove("flipped"));
    iniciarContador();
  }, 3000);
}

// 🃏 Lógica de clic en cartas
cards.forEach(card => {
  card.addEventListener("click", () => {
    reproducirCarta();

    const container = card.parentElement;
    if (card.classList.contains("flipped") || container.classList.contains("hidden")) return;

    if (flippedCards.length === 2) {
      flippedCards.forEach(c => c.classList.remove("flipped"));
      flippedCards = [];
    }

    card.classList.add("flipped");
    flippedCards.push(card);

    if (flippedCards.length === 2) {
      const [c1, c2] = flippedCards;
      const src1 = c1.querySelector(".back img").src.split("/").pop();
      const src2 = c2.querySelector(".back img").src.split("/").pop();
      const pair1 = src1.split("-")[0];
      const pair2 = src2.split("-")[0];

      if (pair1 === pair2) {
        setTimeout(() => {
          c1.parentElement.classList.add("hidden");
          c2.parentElement.classList.add("hidden");
          flippedCards = [];

          if (document.querySelectorAll(".card-container:not(.hidden)").length === 0) {
            detenerContador();
            if (musica) musica.pause();
            //localStorage.removeItem("musica_iniciada");
            registrarPartida("Victoria", 60 - segundos, nivel);
            sonidoVictoria.play();
            setTimeout(() => (window.location.href = "ganaste.html"), 1500);
          }
        }, 600);
      } else {
        setTimeout(() => {
          c1.classList.remove("flipped");
          c2.classList.remove("flipped");
          flippedCards = [];

          intentos--;
          intentosSpan.textContent = intentos;

          if (intentos === 0) {
            detenerContador();
            if (musica) musica.pause();
            //localStorage.removeItem("musica_iniciada");
            registrarPartida("Derrota", 60 - segundos, nivel);
            //sonidoDerrota.play();
            setTimeout(() => (window.location.href = "perdiste.html"), 1500);
          }
        }, 800);
      }
    }
  });
});

// 🐾 Dorsos aleatorios
const dorsos = [
  "cartas-frontal/cartas-01.png",
  "cartas-frontal/cartas-02.png",
  "cartas-frontal/cartas-03.png",
  "cartas-frontal/cartas-04.png",
  "cartas-frontal/cartas-05.png",
  "cartas-frontal/cartas-06.png",
  "cartas-frontal/cartas-07.png",
  "cartas-frontal/cartas-08.png",
  "cartas-frontal/cartas-21.png",
  "cartas-frontal/cartas-22.png",
  "cartas-frontal/cartas-25.png",
  "cartas-frontal/cartas-26.png"
];

const fronts = document.querySelectorAll(".card-face.front");
fronts.forEach(front => {
  const img = document.createElement("img");
  const randomIndex = Math.floor(Math.random() * dorsos.length);
  img.src = dorsos[randomIndex];
  img.alt = "Dorso";
  img.classList.add("img-fluid");
  front.innerHTML = "";
  front.appendChild(img);
});

// 👀 Mostrar cartas al cargar
mostrarCartasTemporalmente();
