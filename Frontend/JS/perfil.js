const userId = localStorage.getItem('userId');
const username = localStorage.getItem('username');

if (!userId) {
  window.location.href = 'login.html';
} else {
  cargarPerfil(userId);
}

// Icono aleatorio
document.getElementById('animalIcon').src = elegirIconoAleatorio();

// Logout
document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.clear();
  window.location.href = 'login.html';
});

async function cargarPerfil(idJugador) {
  try {
    const res = await fetch(`http://31.97.139.53:3000/jugadores/${idJugador}/stats/`);
    if (!res.ok) throw new Error(`Error ${res.status}`);
    const data = await res.json();

    const jugador = data.jugador || {};
    const stats = data.stats || data;

    document.getElementById('nombreJugador').textContent = jugador.nombre_usuario || username;
    document.getElementById('correoJugador').textContent = jugador.correo || '—';

    document.getElementById('victorias').textContent = stats.total_victorias ?? 0;
    document.getElementById('derrotas').textContent = stats.total_derrotas ?? 0;
    document.getElementById('partidas').textContent = stats.partidas_jugadas ?? 0;
    document.getElementById('promedio').textContent = `${(stats.promedio_tiempo ?? 0).toFixed(2)} s`;
    document.getElementById('nivel').textContent = stats.nivel_mas_jugado ?? '—';
  } catch (err) {
    console.error(err);
    alert('No se pudieron cargar los datos del perfil.');
  }
}

function elegirIconoAleatorio() {
  const urls = [
    'https://cdn-icons-png.flaticon.com/512/616/616430.png'
  ];
  const indice = Math.floor(Math.random() * urls.length);
  return urls[indice];
}


 document.getElementById('btnSalir').addEventListener('click', () => {
    localStorage.clear();
    window.location.href = "/Frontend/login.html";
  });