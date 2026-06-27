const fallbackMaterials = [
  {
    nombre: "Bergamota Calabria",
    familia: "Citrica",
    intensidad: 7,
    descripcion: "Salida luminosa, fresca y elegante con facetas verdes y florales.",
    descriptores: ["chispeante", "verde", "limpia"]
  },
  {
    nombre: "Jazmin Sambac",
    familia: "Floral",
    intensidad: 9,
    descripcion: "Corazón floral opulento con textura cremosa y un fondo ligeramente frutal.",
    descriptores: ["blanco", "cremoso", "sensual"]
  },
  {
    nombre: "Cedro Virginia",
    familia: "Amaderada",
    intensidad: 6,
    descripcion: "Madera seca, limpia y estructural ideal para fijar composiciones modernas.",
    descriptores: ["seco", "lapiz", "elegante"]
  }
];

const state = {
  materials: [],
  query: ""
};

const materialsGrid = document.querySelector("#materialsGrid");
const emptyState = document.querySelector("#emptyState");
const searchInput = document.querySelector("#searchInput");
const resetSearch = document.querySelector("#resetSearch");
const totalMaterials = document.querySelector("#totalMaterials");
const totalFamilies = document.querySelector("#totalFamilies");
const averageIntensity = document.querySelector("#averageIntensity");
const loginScreen = document.querySelector("#loginScreen");
const appShell = document.querySelector("#appShell");
const loginForm = document.querySelector("#loginForm");
const authMessage = document.querySelector("#authMessage");
const demoButton = document.querySelector("#demoButton");
const userMenuButton = document.querySelector("#userMenuButton");
const userMenu = document.querySelector("#userMenu");
const dropdownStatus = document.querySelector("#dropdownStatus");

async function loadMaterials() {
  try {
    const response = await fetch("data/materias-primas.json");

    if (!response.ok) {
      throw new Error("No se pudo cargar la biblioteca");
    }

    state.materials = await response.json();
  } catch (error) {
    state.materials = fallbackMaterials;
  }

  updateDashboard();
  renderMaterials();
}

function updateDashboard() {
  const families = new Set(state.materials.map((material) => material.familia));
  const intensityTotal = state.materials.reduce((total, material) => total + material.intensidad, 0);
  const average = state.materials.length ? intensityTotal / state.materials.length : 0;

  totalMaterials.textContent = state.materials.length;
  totalFamilies.textContent = families.size;
  averageIntensity.textContent = average.toFixed(1);
}

function normalizeText(value) {
  return value
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function getFilteredMaterials() {
  const query = normalizeText(state.query.trim());

  if (!query) {
    return state.materials;
  }

  return state.materials.filter((material) => {
    const searchable = [
      material.nombre,
      material.familia,
      material.descripcion,
      ...material.descriptores
    ].join(" ");

    return normalizeText(searchable).includes(query);
  });
}

function renderMaterials() {
  const materials = getFilteredMaterials();

  materialsGrid.innerHTML = materials.map(createMaterialCard).join("");
  emptyState.hidden = materials.length > 0;
}

function createMaterialCard(material) {
  const tags = material.descriptores
    .map((descriptor) => `<li>${descriptor}</li>`)
    .join("");
  const intensityWidth = Math.min(material.intensidad * 10, 100);

  return `
    <article class="material-card">
      <header>
        <div>
          <span>Materia prima</span>
          <h3>${material.nombre}</h3>
        </div>
        <strong class="family-badge">${material.familia}</strong>
      </header>
      <p class="description">${material.descripcion}</p>
      <ul class="profile-tags" aria-label="Descriptores olfativos">
        ${tags}
      </ul>
      <div class="intensity" aria-label="Intensidad ${material.intensidad} de 10">
        <div class="intensity-row">
          <span>Intensidad</span>
          <span>${material.intensidad}/10</span>
        </div>
        <div class="intensity-bar" aria-hidden="true">
          <i style="width: ${intensityWidth}%"></i>
        </div>
      </div>
    </article>
  `;
}

searchInput.addEventListener("input", (event) => {
  state.query = event.target.value;
  renderMaterials();
});

resetSearch.addEventListener("click", () => {
  state.query = "";
  searchInput.value = "";
  searchInput.focus();
  renderMaterials();
});

function showLoginView() {
  loginScreen.classList.remove("is-hidden");
  appShell.classList.add("is-hidden");

  if (authMessage) {
    authMessage.textContent = "";
  }

  if (loginForm) {
    loginForm.reset();
  }

  if (searchInput) {
    searchInput.value = "";
  }

  state.query = "";
  renderMaterials();
  closeUserMenu();
}

function showDashboardView() {
  loginScreen.classList.add("is-hidden");
  appShell.classList.remove("is-hidden");
  closeUserMenu();
}

function closeUserMenu() {
  if (userMenu) {
    userMenu.classList.remove("is-open");
  }

  if (userMenuButton) {
    userMenuButton.setAttribute("aria-expanded", "false");
  }

  if (dropdownStatus) {
    dropdownStatus.textContent = "";
  }
}

if (loginForm) {
  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();

    if (authMessage) {
      authMessage.textContent = "Acceso no habilitado en esta versión demo";
    }
  });
}

if (demoButton) {
  demoButton.addEventListener("click", () => {
    showDashboardView();
  });
}

if (userMenuButton && userMenu) {
  userMenuButton.addEventListener("click", () => {
    const isOpen = userMenu.classList.toggle("is-open");
    userMenuButton.setAttribute("aria-expanded", String(isOpen));
  });

  userMenu.addEventListener("click", (event) => {
    const action = event.target.closest("button")?.dataset.action;

    if (!action) {
      return;
    }

    if (action === "logout") {
      showLoginView();
      return;
    }

    if (dropdownStatus) {
      dropdownStatus.textContent = "Disponible en una próxima versión.";
    }
  });
}

document.addEventListener("click", (event) => {
  if (!event.target.closest(".user-menu")) {
    closeUserMenu();
  }
});

showLoginView();
loadMaterials();
