// ===========================================
// DLS 26 CARDS SPA
// API Local: dls26-cards.json
// ===========================================

const URL = './dls26-cards.json';

// ==============================
// VARIABLES DE DATOS Y PAGINACIÓN
// ==============================

let todosLosJugadores = [];
let jugadoresFiltrados = [];
let offset = 0;
const limite = 8;

// ==============================
// ELEMENTOS DEL DOM
// ==============================

const playerContainer = document.getElementById("playerContainer");
const detailContainer = document.getElementById("detailContainer");

const previousBtn = document.getElementById("previousBtn");
const nextBtn = document.getElementById("nextBtn");

const searchInput = document.getElementById("searchInput");
const searchButton = document.getElementById("searchButton");

const loading = document.getElementById("loading");
const errorMessage = document.getElementById("errorMessage");

const playerCounter = document.getElementById("playerCounter");

// Mini Reproductor DOM
const audioTrack = document.getElementById("audioTrack");
const playPauseBtn = document.getElementById("playPauseBtn");
const trackSelect = document.getElementById("trackSelect");
const trackTitle = document.getElementById("trackTitle");

// ==============================
// LÓGICA DEL REPRODUCTOR
// ==============================

function inicializarReproductor(playlist) {
    if (!playlist || playlist.length === 0) return;

    trackSelect.innerHTML = "";
    playlist.forEach(track => {
        const option = document.createElement("option");
        option.value = track.file;
        option.textContent = track.title;
        trackSelect.appendChild(option);
    });

    audioTrack.src = playlist[0].file;
    trackTitle.textContent = `🎵 ${playlist[0].title}`;
}

playPauseBtn.addEventListener("click", () => {
    if (audioTrack.paused) {
        audioTrack.play();
        playPauseBtn.textContent = "⏸";
    } else {
        audioTrack.pause();
        playPauseBtn.textContent = "▶";
    }
});

trackSelect.addEventListener("change", (e) => {
    const selectedFile = e.target.value;
    const selectedText = e.target.options[e.target.selectedIndex].text;

    audioTrack.src = selectedFile;
    trackTitle.textContent = `🎵 ${selectedText}`;

    audioTrack.play();
    playPauseBtn.textContent = "⏸";
});

// ==============================
// MAPEO DE COLORES POR POSICIÓN Y ATRIBUTO
// ==============================

function obtenerClasePosicion(posicion) {
    if (!posicion) return "pos-default";
    const pos = posicion.toUpperCase();

    if (["GK", "POR"].includes(pos)) return "pos-gk";
    if (["DC", "SD", "EI", "ED"].includes(pos)) return "pos-del";
    if (["DFC", "LD", "LI"].includes(pos)) return "pos-def";
    if (["MC", "CAI", "CAD", "MCO", "MCD"].includes(pos)) return "pos-med";

    return "pos-default";
}

function obtenerColorStat(valor) {
    if (valor === 0) return "#ff66cc";       // Rosa (0)
    if (valor < 60) return "#ff3333";        // Rojo (1-59)
    if (valor < 70) return "#ff9900";        // Naranja (60-69)
    if (valor < 80) return "#ffd700";        // Dorado (70-79)
    if (valor < 90) return "#2ecc71";        // Verde (80-89)
    return "#00bfff";                        // Celeste (90-100)
}

// ==============================
// ESTADOS (LOADING / ERROR)
// ==============================

function mostrarLoading() {
    loading.classList.remove("hidden");
}

function ocultarLoading() {
    loading.classList.add("hidden");
}

function mostrarError(texto = "Error de procesamiento.") {
    errorMessage.textContent = texto;
    errorMessage.classList.remove("hidden");

    setTimeout(() => {
        errorMessage.classList.add("hidden");
    }, 2500);
}

// ==============================
// OBTENER DATOS DE LA API
// ==============================

async function cargarDatosAPI() {
    mostrarLoading();

    try {
        const respuesta = await fetch(URL);
        if (!respuesta.ok) throw new Error("No se pudo cargar la API");

        const data = await respuesta.json();

        // Cargar Playlist si está en el JSON
        if (data.playlist) {
            inicializarReproductor(data.playlist);
            todosLosJugadores = data.players || [];
        } else {
            todosLosJugadores = Array.isArray(data) ? data : [];
        }

        jugadoresFiltrados = [...todosLosJugadores];
        renderizarPaginaActual();
    } catch (error) {
        mostrarError("Error cargando la base de datos.");
    }

    ocultarLoading();
}

// ==============================
// RENDERIZAR PÁGINA
// ==============================

function renderizarPaginaActual() {
    playerContainer.innerHTML = "";
    playerCounter.textContent = `${jugadoresFiltrados.length} Jugadores`;

    if (jugadoresFiltrados.length === 0) {
        playerContainer.innerHTML = `<p style="grid-column: 1/-1; text-align: center;">No se encontraron resultados.</p>`;
        return;
    }

    const corte = jugadoresFiltrados.slice(offset, offset + limite);
    corte.forEach(jugador => crearCard(jugador));

    previousBtn.disabled = offset === 0;
    nextBtn.disabled = offset + limite >= jugadoresFiltrados.length;
}

// ==============================
// TARJETAS
// ==============================

function crearCard(player) {
    const card = document.createElement("article");
    card.classList.add("card");

    const clasePosicion = obtenerClasePosicion(player.position);
    const bandera = player.country?.flag ? player.country.flag : '';

    card.innerHTML = `
        <div class="card-img-wrapper">
            <img src="${player.image}" alt="${player.name}" class="player-img" onerror="this.onerror=null; this.src='./download.jpg';">
        </div>
        <div class="card-body">
            <span class="id">#${player.year || ''} • ${bandera}</span>
            <h3>${player.name}</h3>
            <p><strong>${player.team}</strong></p>
            <span class="tipo ${clasePosicion}">${player.position}</span>
            <span class="tipo dark">${player.rating} OVR</span>
            <button class="btn-info">Ver Información</button>
        </div>
    `;

    card.querySelector(".btn-info").addEventListener("click", () => {
        mostrarDetalle(player);
    });

    playerContainer.appendChild(card);
}

// ==============================
// DETALLE DEL JUGADOR
// ==============================

function mostrarDetalle(player) {
    const posUpper = player.position ? player.position.toUpperCase() : "";
    const esPortero = posUpper === "GK" || posUpper === "POR";
    const clasePosicion = obtenerClasePosicion(player.position);

    let statsHTML = "";

    if (player.stats) {
        if (player.stats.physical) {
            statsHTML += renderBarraStat("Velocidad", player.stats.physical.speed);
            statsHTML += renderBarraStat("Aceleración", player.stats.physical.acceleration);
            if (!esPortero) {
                statsHTML += renderBarraStat("Resistencia", player.stats.physical.stamina);
            }
            statsHTML += renderBarraStat("Fuerza", player.stats.physical.strength);
        }

        if (player.stats.technical) {
            statsHTML += renderBarraStat("Control", player.stats.technical.control);
            statsHTML += renderBarraStat("Pases", player.stats.technical.passing);
            if (!esPortero) {
                statsHTML += renderBarraStat("Tiro", player.stats.technical.shooting);
            }
            statsHTML += renderBarraStat("Entrada", player.stats.technical.tackling);
        }

        if (esPortero && player.stats.goalkeeping) {
            statsHTML += renderBarraStat("Reflejos", player.stats.goalkeeping.reflexes);
            statsHTML += renderBarraStat("Paradas", player.stats.goalkeeping.handling);
        }
    }

    detailContainer.innerHTML = `
        <div class="detail-img-wrapper">
            <img src="${player.image}" alt="${player.name}" class="detail-player-img" onerror="this.src='./download.jpg'">
        </div>
        <h2>${player.name} ${player.country ? player.country.flag : ''}</h2>
        <p><strong>Posición:</strong> <span class="tipo ${clasePosicion}">${player.position}</span> | <strong>Media:</strong> ${player.rating}</p>
        <p><strong>Equipo:</strong> ${player.team}</p>
        <p><strong>País:</strong> ${player.country ? `${player.country.name}${player.country.flag}` : 'N/A'}</p>
        <p><strong>Tipo de carta:</strong> ${player.cardType || 'Estándar'} (${player.year || ''})</p>
        <p><strong>Pie preferido:</strong> ${player.preferredFoot || 'N/A'} ${player.heightCm ? `| <strong>Altura:</strong> ${player.heightCm} cm` : ''}</p>

        <div class="stats">
            <h3>Atributos</h3>
            ${statsHTML}
        </div>
    `;
}

function renderBarraStat(label, valor) {
    if (valor === undefined) return '';
    const color = obtenerColorStat(valor);
    return `
        <div class="stat">
            <div class="stat-header">
                <span>${label}</span>
                <span style="color: ${color};">${valor}</span>
            </div>
            <div class="progress">
                <span style="width: ${Math.min(valor, 100)}%; background-color: ${color};"></span>
            </div>
        </div>
    `;
}

// ==============================
// BUSCADOR EN TIEMPO REAL
// ==============================

function buscarJugador() {
    const busqueda = searchInput.value.trim().toLowerCase();

    jugadoresFiltrados = todosLosJugadores.filter(p =>
        p.name?.toLowerCase().includes(busqueda) ||
        p.team?.toLowerCase().includes(busqueda) ||
        (p.country && p.country.name?.toLowerCase().includes(busqueda)) ||
        p.position?.toLowerCase().includes(busqueda) ||
        (p.cardType && p.cardType.toLowerCase().includes(busqueda)) ||
        (p.rating !== undefined && String(p.rating).includes(busqueda))
    );

    offset = 0;
    renderizarPaginaActual();
}

// ==============================
// EVENTOS Y EVENT LISTENERS
// ==============================

searchButton.addEventListener("click", buscarJugador);

searchInput.addEventListener("keyup", () => {
    buscarJugador();
});

nextBtn.addEventListener("click", () => {
    if (offset + limite < jugadoresFiltrados.length) {
        offset += limite;
        renderizarPaginaActual();
    }
});

previousBtn.addEventListener("click", () => {
    if (offset - limite >= 0) {
        offset -= limite;
        renderizarPaginaActual();
    }
});

// INICIALIZAR
cargarDatosAPI();