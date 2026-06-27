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
  query: "",
  matrixRows: []
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

function createMaterialCard(material) {
  const tags = (material.descriptores || [])
    .map((descriptor) => `<li>${descriptor}</li>`)
    .join("");
  const intensityWidth = Math.min((material.intensidad || 6) * 10, 100);

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
  state.matrixRows = [];
  renderMatrixPreview();
  loadMaterials();
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

      state.materials = loadedMaterials;
      state.matrixRows = loadedMaterials;
      updateDashboard();
      renderMaterials();
      renderMatrixPreview(loadedMaterials);

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
