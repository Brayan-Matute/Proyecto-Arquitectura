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
    const res = await fetch(`https://eberaplicano.com/michi/jugadores/${idJugador}/stats/`);
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

  // 🟢 Abrir historial de partidas
document.getElementById("btnHistorial").addEventListener("click", async () => {
  const userId = localStorage.getItem("userId");
  const tabla = document.getElementById("tablaHistorial");
  tabla.innerHTML = `<tr><td colspan="5" class="text-muted">Cargando partidas...</td></tr>`;

  try {
    const res = await fetch(`https://eberaplicano.com/michi/partidas/${userId}/`);
    if (!res.ok) throw new Error(`Error ${res.status}`);
    const data = await res.json();

    if (!data.length) {
      tabla.innerHTML = `<tr><td colspan="5" class="text-muted">No hay partidas registradas aún.</td></tr>`;
      return;
    }

    tabla.innerHTML = data.map((p, i) => `
      <tr>
        <td>${i + 1}</td>
        <td class="${p.resultado === 'Victoria' ? 'text-success fw-bold' : 'text-danger fw-bold'}">${p.resultado}</td>
        <td>${p.nivel}</td>
        <td>${parseFloat(p.tiempo).toFixed(2)}</td>
        <td>${new Date(p.fecha).toLocaleString('es-ES')}</td>
      </tr>
    `).join('');
  } catch (err) {
    console.error(err);
    tabla.innerHTML = `<tr><td colspan="5" class="text-danger">Error al cargar el historial.</td></tr>`;
  }

  const modal = new bootstrap.Modal(document.getElementById('modalHistorial'));
  modal.show();
});
