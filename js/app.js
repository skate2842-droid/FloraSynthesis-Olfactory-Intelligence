const fallbackMaterials = [
  {
    nombre: "Bergamota Calabria",
    familia: "Cítrica",
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
  query: "",
  matrixRows: [],
  selectedMaterial: null
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
const downloadTemplateButton = document.querySelector("#downloadTemplateButton");
const matrixFileInput = document.querySelector("#matrixFileInput");
const matrixStatus = document.querySelector("#matrixStatus");
const matrixPreview = document.querySelector("#matrixPreview");
const detailDrawer = document.querySelector("#detailDrawer");
const detailBackdrop = document.querySelector("#detailBackdrop");
const drawerTitle = document.querySelector("#drawerTitle");
const drawerContent = document.querySelector("#drawerContent");
const closeDrawerButton = document.querySelector("#closeDrawerButton");

function normalizeMaterial(material, index = 0) {
  const family = material.familiaOlfativa || material.familia || "Floral";
  const facetas = Array.isArray(material.facetas) && material.facetas.length
    ? material.facetas
    : (Array.isArray(material.descriptores) ? material.descriptores.map((descriptor, descriptorIndex) => ({
        nombre: descriptor,
        porcentaje: Math.max(8, 100 - descriptorIndex * 12)
      })) : []);

  return {
    nombre: material.nombre || `Materia prima ${index + 1}`,
    cas: material.cas || `CAS-${String(index + 1).padStart(3, "0")}`,
    familiaOlfativa: family,
    familia: family,
    notaPrincipal: material.notaPrincipal || material.descripcion || "Perfil en desarrollo",
    naturaleza: material.naturaleza || "En evaluación",
    descripcionOlfativa: material.descripcionOlfativa || material.descripcion || "Detalle técnico disponible en modo demo.",
    facetas,
    aplicacionRecomendada: material.aplicacionRecomendada || "Aplicación en formulación premium",
    sustantividad: material.sustantividad || "En evaluación",
    logP: material.logP || "N/D",
    comentariosTecnicos: material.comentariosTecnicos || "Información técnica disponible en modo demo.",
    intensidad: material.intensidad || deriveIntensity(facetas),
    descripcion: material.descripcionOlfativa || material.descripcion || "Detalle técnico disponible en modo demo.",
    descriptores: material.descriptores || facetas.map((facet) => facet.nombre).slice(0, 4)
  };
}

async function loadMaterials() {
  try {
    const response = await fetch("data/materias-primas.json");

    if (!response.ok) {
      throw new Error("No se pudo cargar la biblioteca");
    }

    state.materials = (await response.json()).map((material, index) => normalizeMaterial(material, index));
  } catch (error) {
    state.materials = fallbackMaterials.map((material, index) => normalizeMaterial(material, index));
  }

  updateDashboard();
  renderMaterials();
}

function updateDashboard() {
  const families = new Set(state.materials.map((material) => material.familia || material.familiaOlfativa));
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
      material.cas,
      material.descripcionOlfativa,
      material.notaPrincipal,
      ...material.descriptores
    ].join(" ");

    return normalizeText(searchable).includes(query);
  });
}

function getFamilyColor(family) {
  const normalizedFamily = String(family || "").trim().toLowerCase();
  const palette = {
    floral: "#e91e63",
    frutal: "#ff8a00",
    cítrica: "#f4c542",
    citrica: "#f4c542",
    verde: "#3cb371",
    amaderada: "#8d6e63",
    ambar: "#d4af37",
    ámbar: "#d4af37",
    musk: "#8e24aa",
    especiada: "#b71c1c",
    herbal: "#6b8e23",
    gourmand: "#5d4037",
    marina: "#1e88e5",
    aldehídica: "#d7d7d7",
    aldehidica: "#d7d7d7"
  };

  return palette[normalizedFamily] || "#94a3b8";
}

function renderMaterials() {
  const materials = getFilteredMaterials();

  if (!materials.length) {
    materialsGrid.innerHTML = '<div class="materials-table-row" role="row"><div class="materials-cell" role="cell">No hay resultados</div></div>';
    emptyState.hidden = false;
    return;
  }

  materialsGrid.innerHTML = materials.map((material, index) => createMaterialRow(material, index)).join("");
  emptyState.hidden = true;
}

function deriveIntensity(facetas) {
  if (!facetas.length) {
    return 6;
  }

  const total = facetas.reduce((sum, facet) => sum + Number(facet.porcentaje || 0), 0);
  const score = Math.round(total / 10) + 4;

  return Math.min(10, Math.max(4, score));
}

function buildMaterialFromMatrix(row) {
  const facetas = [];

  for (let index = 1; index <= 5; index += 1) {
    const nombre = row[`Faceta ${index}`];
    const porcentaje = row[`% Faceta ${index}`];

    if (!nombre && (porcentaje === undefined || porcentaje === null || porcentaje === "")) {
      continue;
    }

    facetas.push({
      nombre: nombre || `Faceta ${index}`,
      porcentaje: Number(porcentaje) || 0
    });
  }

  return {
    nombre: row.Nombre,
    cas: row.CAS,
    familiaOlfativa: row["Familia Olfativa"],
    notaPrincipal: row["Nota Principal"],
    facetas,
    descripcionOlfativa: row["Descripción Olfativa"] || "",
    naturaleza: row["Naturaleza"] || "",
    aplicacionRecomendada: row["Aplicación Recomendada"] || "",
    sustantividad: row["Sustantividad"] || "",
    logP: row["LogP"] || "",
    comentariosTecnicos: row["Comentarios Técnicos"] || "",
    familia: row["Familia Olfativa"],
    intensidad: deriveIntensity(facetas),
    descripcion: row["Descripción Olfativa"] || `Nota principal: ${row["Nota Principal"] || "-"}`,
    descriptores: facetas.map((facet) => facet.nombre).filter(Boolean).slice(0, 4)
  };
}

function setMatrixStatus(message, type = "success") {
  if (!matrixStatus) {
    return;
  }

  matrixStatus.textContent = message;
  matrixStatus.className = `matrix-status ${type}`;
}

function renderMatrixPreview(rows = []) {
  if (!matrixPreview) {
    return;
  }

  if (!rows.length) {
    matrixPreview.innerHTML = '<p class="matrix-empty">Aún no se ha cargado una matriz de materias primas.</p>';
    return;
  }

  const rowsMarkup = rows
    .slice(0, 8)
    .map((row) => {
      const facetas = row.facetas.map((facet) => `${facet.nombre}: ${facet.porcentaje}%`).join(", ");

      return `
        <tr>
          <td>${row.nombre}</td>
          <td>${row.cas || "-"}</td>
          <td>${row.familia || row.familiaOlfativa || "-"}</td>
          <td>${row.notaPrincipal || "-"}</td>
          <td>${facetas || "-"}</td>
        </tr>
      `;
    })
    .join("");

  matrixPreview.innerHTML = `
    <table class="matrix-table">
      <thead>
        <tr>
          <th>Nombre</th>
          <th>CAS</th>
          <th>Familia</th>
          <th>Nota</th>
          <th>Facetas</th>
        </tr>
      </thead>
      <tbody>${rowsMarkup}</tbody>
    </table>
  `;
}

function createMaterialRow(material, index) {
  const familyColor = getFamilyColor(material.familiaOlfativa || material.familia);
  const isSelected = state.selectedMaterial && state.selectedMaterial.nombre === material.nombre && state.selectedMaterial.cas === material.cas;

  return `
    <div class="materials-table-row ${isSelected ? "is-selected" : ""}" role="row" tabindex="0" data-material-index="${index}">
      <div class="materials-cell color-cell" role="cell" aria-label="Color de familia">
        <span class="color-dot" style="background:${familyColor}"></span>
      </div>
      <div class="materials-cell name-cell" role="cell">${material.nombre}</div>
      <div class="materials-cell cas-cell" role="cell">${material.cas || "N/D"}</div>
      <div class="materials-cell family-cell" role="cell">${material.familiaOlfativa || material.familia || "Sin familia"}</div>
      <div class="materials-cell detail-cell" role="cell">
        <button class="detail-toggle" type="button" aria-label="Ver detalle de ${material.nombre}">↗</button>
      </div>
    </div>
  `;
}

function renderDetailDrawer(material) {
  if (!material) {
    drawerTitle.textContent = "Materia prima";
    drawerContent.innerHTML = "";
    return;
  }

  const facetasMarkup = (material.facetas || []).length
    ? `<div class="facet-list">${(material.facetas || []).map((facet) => `
        <div class="facet-item">
          <div class="facet-row">
            <span>${facet.nombre}</span>
            <strong>${facet.porcentaje}%</strong>
          </div>
          <div class="facet-bar"><i style="width:${Math.min(100, facet.porcentaje || 0)}%"></i></div>
        </div>
      `).join("")}</div>`
    : "<p>No hay facetas registradas.</p>";

  drawerTitle.textContent = material.nombre;
  drawerContent.innerHTML = `
    <section class="drawer-section">
      <div class="drawer-meta">
        <div class="meta-row"><span>CAS</span><strong>${material.cas || "N/D"}</strong></div>
        <div class="meta-row"><span>Familia olfativa</span><strong>${material.familiaOlfativa || material.familia || "Sin familia"}</strong></div>
        <div class="meta-row"><span>Nota principal</span><strong>${material.notaPrincipal || "Sin nota principal"}</strong></div>
        <div class="meta-row"><span>Naturaleza</span><strong>${material.naturaleza || "En evaluación"}</strong></div>
      </div>
    </section>

    <section class="drawer-section">
      <h4>Descripción olfativa</h4>
      <p>${material.descripcionOlfativa || "Sin descripción disponible."}</p>
    </section>

    <section class="drawer-section">
      <h4>Facetas olfativas</h4>
      ${facetasMarkup}
    </section>

    <section class="drawer-section">
      <h4>Propiedades fisicoquímicas</h4>
      <div class="drawer-meta">
        <div class="meta-row"><span>LogP</span><strong>${material.logP || "N/D"}</strong></div>
        <div class="meta-row"><span>Sustantividad</span><strong>${material.sustantividad || "En evaluación"}</strong></div>
      </div>
    </section>

    <section class="drawer-section">
      <h4>Aplicaciones recomendadas</h4>
      <p>${material.aplicacionRecomendada || "No disponible"}</p>
    </section>

    <section class="drawer-section">
      <h4>Comentarios técnicos</h4>
      <p>${material.comentariosTecnicos || "Sin comentarios técnicos."}</p>
    </section>
  `;
}

function openDetailDrawer(material) {
  state.selectedMaterial = material;
  renderDetailDrawer(material);

  if (detailDrawer && detailBackdrop) {
    detailDrawer.classList.add("is-open");
    detailBackdrop.classList.add("is-open");
    detailDrawer.setAttribute("aria-hidden", "false");
    detailBackdrop.hidden = false;
  }
}

function closeDetailDrawer() {
  if (detailDrawer && detailBackdrop) {
    detailDrawer.classList.remove("is-open");
    detailBackdrop.classList.remove("is-open");
    detailDrawer.setAttribute("aria-hidden", "true");
    detailBackdrop.hidden = true;
  }

  state.selectedMaterial = null;
  renderMaterials();
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

materialsGrid.addEventListener("click", (event) => {
  const row = event.target.closest(".materials-table-row");

  if (!row) {
    return;
  }

  const materialIndex = Number(row.dataset.materialIndex || 0);
  const materials = getFilteredMaterials();
  const material = materials[materialIndex];

  if (material) {
    openDetailDrawer(material);
  }
});

materialsGrid.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    const row = event.target.closest(".materials-table-row");

    if (row) {
      event.preventDefault();
      const materialIndex = Number(row.dataset.materialIndex || 0);
      const materials = getFilteredMaterials();
      const material = materials[materialIndex];

      if (material) {
        openDetailDrawer(material);
      }
    }
  }
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
  state.matrixRows = [];
  state.selectedMaterial = null;
  closeDetailDrawer();
  renderMatrixPreview();
  loadMaterials();
  closeUserMenu();
}

function showDashboardView() {
  loginScreen.classList.add("is-hidden");
  appShell.classList.remove("is-hidden");
  closeDetailDrawer();
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
  demoButton.addEventListener("click", async () => {
    // Enable demo mode and show dashboard UI
    setDemoMode(true);
    setActiveSectionKey('materias');
    // Show dashboard UI
    showDashboardView();

    // Ensure materials are loaded and UI is rendered.
    // If materials not yet loaded, load them; otherwise refresh render.
    try {
      if (!state.materials || !state.materials.length) {
        await loadMaterials();
      } else {
        updateDashboard();
        renderMaterials();
      }
    } catch (e) {
      // fallback: render with whatever state is available
      console.warn('Demo load/render fallback', e);
      updateDashboard();
      renderMaterials();
    }

    // Focus the search input so the user sees the content
    if (searchInput) {
      searchInput.focus();
    }
  });
}

// Navigation: ensure clicking side nav items activates section and triggers renders
{
  const navItems = document.querySelectorAll('.side-nav .nav-item');
  navItems.forEach((item) => {
    item.addEventListener('click', async (e) => {
      e.preventDefault();

      // manage active class
      navItems.forEach((n) => n.classList.remove('active'));
      item.classList.add('active');

      const text = (item.textContent || '').trim().toLowerCase();
      // persist active section
      if (text.includes('materias')) setActiveSectionKey('materias');
      else setActiveSectionKey(text.split(' ')[0] || text);

      // If user clicked 'materias primas', ensure materials are loaded and rendered
      if (text.includes('materias')) {
        try {
          if (!state.materials || !state.materials.length) {
            await loadMaterials();
          } else {
            updateDashboard();
            renderMaterials();
          }
        } catch (err) {
          console.warn('Error loading materials on nav click', err);
          // fallback render
          renderMaterials();
        }

        // scroll to materials section header to ensure visibility in Safari
        const hdr = document.querySelector('#materials-title');
        if (hdr && hdr.scrollIntoView) hdr.scrollIntoView({behavior: 'auto', block: 'start'});
      }

      // If other nav items require actions, keep minimal: close drawer and user menu
      closeDetailDrawer();
      closeUserMenu();
    });
  });
}

if (closeDrawerButton) {
  closeDrawerButton.addEventListener("click", closeDetailDrawer);
}

if (detailBackdrop) {
  detailBackdrop.addEventListener("click", closeDetailDrawer);
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeDetailDrawer();
  }
});

if (downloadTemplateButton) {
  downloadTemplateButton.addEventListener("click", () => {
    const headers = [
      "Nombre",
      "CAS",
      "Familia Olfativa",
      "Nota Principal",
      "Faceta 1",
      "% Faceta 1",
      "Faceta 2",
      "% Faceta 2",
      "Faceta 3",
      "% Faceta 3",
      "Faceta 4",
      "% Faceta 4",
      "Faceta 5",
      "% Faceta 5",
      "Descripción Olfativa",
      "Naturaleza",
      "Aplicación Recomendada",
      "Sustantividad",
      "LogP",
      "Comentarios Técnicos"
    ];

    const worksheet = XLSX.utils.aoa_to_sheet([headers]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Matriz");
    XLSX.writeFile(workbook, "plantilla_materias_primas_florasynthesis.xlsx");
  });
}

if (matrixFileInput) {
  matrixFileInput.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.name.toLowerCase().endsWith(".xlsx")) {
      setMatrixStatus("Solo se aceptan archivos .xlsx.", "error");
      event.target.value = "";
      return;
    }

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

      if (!rows.length) {
        setMatrixStatus("El archivo no contiene materias primas para cargar.", "error");
        event.target.value = "";
        return;
      }

      const requiredHeaders = ["Nombre", "CAS", "Familia Olfativa", "Nota Principal"];
      const normalizedHeaders = Object.keys(rows[0]).map((header) => String(header).trim());
      const missingHeaders = requiredHeaders.filter((header) => !normalizedHeaders.includes(header));

      if (missingHeaders.length) {
        setMatrixStatus(`Faltan columnas obligatorias: ${missingHeaders.join(", ")}.`, "error");
        event.target.value = "";
        return;
      }

      const loadedMaterials = [];
      const warnings = [];
      const errors = [];

      rows.forEach((row, index) => {
        const rowNumber = index + 2;
        const nombre = String(row.Nombre || "").trim();
        const cas = String(row.CAS || "").trim();
        const familia = String(row["Familia Olfativa"] || "").trim();
        const nota = String(row["Nota Principal"] || "").trim();

        if (!nombre && !cas && !familia && !nota) {
          return;
        }

        if (!nombre || !cas || !familia || !nota) {
          errors.push(`Fila ${rowNumber}: faltan datos obligatorios.`);
          return;
        }

        let totalFacetas = 0;
        const facetas = [];

        for (let facetIndex = 1; facetIndex <= 5; facetIndex += 1) {
          const facetName = row[`Faceta ${facetIndex}`];
          const facetPercent = row[`% Faceta ${facetIndex}`];
          const hasFacetValue = facetName !== undefined && facetName !== null && String(facetName).trim() !== "";
          const hasPercentValue = facetPercent !== undefined && facetPercent !== null && String(facetPercent).trim() !== "";

          if (hasFacetValue || hasPercentValue) {
            if (hasPercentValue && Number.isNaN(Number(facetPercent))) {
              errors.push(`Fila ${rowNumber}: el porcentaje de ${facetName || `Faceta ${facetIndex}`} no es numérico.`);
              return;
            }

            const numericValue = hasPercentValue ? Number(facetPercent) : 0;
            totalFacetas += numericValue;

            if (hasFacetValue || numericValue > 0) {
              facetas.push({
                nombre: String(facetName || `Faceta ${facetIndex}`).trim(),
                porcentaje: numericValue
              });
            }
          }
        }

        if (totalFacetas > 100) {
          errors.push(`Fila ${rowNumber}: la suma de facetas supera 100%.`);
          return;
        }

        if (totalFacetas < 100) {
          warnings.push(`Fila ${rowNumber}: la suma de facetas es menor a 100%.`);
        }

        loadedMaterials.push(buildMaterialFromMatrix({
          Nombre: nombre,
          CAS: cas,
          "Familia Olfativa": familia,
          "Nota Principal": nota,
          "Descripción Olfativa": row["Descripción Olfativa"] || "",
          Naturaleza: row.Naturaleza || "",
          "Aplicación Recomendada": row["Aplicación Recomendada"] || "",
          Sustantividad: row.Sustantividad || "",
          LogP: row.LogP || "",
          "Comentarios Técnicos": row["Comentarios Técnicos"] || "",
          ...Object.fromEntries(
            Array.from({ length: 5 }, (_, facetIndex) => [
              `Faceta ${facetIndex + 1}`,
              row[`Faceta ${facetIndex + 1}`] || ""
            ])
          ),
          ...Object.fromEntries(
            Array.from({ length: 5 }, (_, facetIndex) => [`% Faceta ${facetIndex + 1}`, row[`% Faceta ${facetIndex + 1}`] || ""])
          )
        }));
      });

      if (errors.length) {
        setMatrixStatus(`No se pudo cargar la matriz: ${errors[0]}`, "error");
        event.target.value = "";
        return;
      }

      if (!loadedMaterials.length) {
        setMatrixStatus("No se encontraron materias primas válidas para cargar.", "error");
        event.target.value = "";
        return;
      }

      state.materials = loadedMaterials.map((material, index) => normalizeMaterial(material, index));
      state.matrixRows = loadedMaterials.map((material, index) => normalizeMaterial(material, index));
      updateDashboard();
      renderMaterials();
      renderMatrixPreview(state.matrixRows);

      if (warnings.length) {
        setMatrixStatus("Matriz cargada correctamente en modo demo. La suma de facetas es menor a 100% en una o más materias primas.", "warning");
      } else {
        setMatrixStatus("Matriz cargada correctamente en modo demo", "success");
      }
    } catch (error) {
      setMatrixStatus("No se pudo leer el archivo. Verifica que sea un Excel válido.", "error");
    }

    event.target.value = "";
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
      // clear demo/session info
      try {
        localStorage.removeItem('fs_demo');
        localStorage.removeItem('fs_active');
      } catch (e) {}
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

function setDemoMode(on) {
  try {
    if (on) localStorage.setItem('fs_demo', '1');
    else {
      localStorage.removeItem('fs_demo');
      localStorage.removeItem('fs_active');
    }
  } catch (e) {}
}

function setActiveSectionKey(key) {
  try { localStorage.setItem('fs_active', key); } catch (e) {}
}

function activateSectionByKey(key) {
  const navItems = document.querySelectorAll('.side-nav .nav-item');
  navItems.forEach((n) => n.classList.remove('active'));
  let matched = false;
  navItems.forEach((n) => {
    const txt = (n.textContent || '').trim().toLowerCase();
    if ((key === 'materias' && txt.includes('materias')) || txt.includes(key)) {
      n.classList.add('active');
      matched = true;
    }
  });

  // If key is materias ensure materials are rendered
  if (key === 'materias') {
    if (!state.materials || !state.materials.length) {
      return loadMaterials();
    }
    updateDashboard();
    renderMaterials();
  }

  return Promise.resolve();
}

async function initAppState() {
  const demo = localStorage.getItem('fs_demo') === '1';
  const active = (localStorage.getItem('fs_active') || 'materias').toLowerCase();

  if (demo) {
    showDashboardView();
    setDemoMode(true);
    await activateSectionByKey(active.includes('materias') ? 'materias' : active);
  } else {
    showLoginView();
  }
}

// Initialize app state on load
initAppState();
