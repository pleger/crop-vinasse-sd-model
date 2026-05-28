"use strict";

const populationLookup = [
  [0, 174018282], [1, 176301203], [2, 178503484], [3, 180622688],
  [4, 182675143], [5, 184688101], [6, 186653106], [7, 188552320],
  [8, 190367302], [9, 192079951], [10, 193701929], [11, 195284734],
  [12, 196876111], [13, 198478299], [14, 200085127], [15, 201675532],
  [16, 203218114], [17, 204703445], [18, 206107261], [19, 207455459],
  [20, 208660842], [21, 209550294], [22, 210306415], [23, 211140729],
  [24, 211998573], [25, 212812405], [26, 213600000], [27, 214400000],
  [28, 215200000], [29, 216000000], [30, 216800000]
];

const cropReal = [
  257622, 293051, 320650, 358940, 386090, 387345, 425416, 492382,
  569216, 602193, 615260, 557954, 589784, 653211, 633927, 667116,
  651841, 640935, 621217, 642529, 657653, 578054, 607413, 716336
];

const ethanolReal = [
  10593, 11536, 12623, 14796, 15417, 15943, 17710, 22422, 27526, 25691,
  27170, 22635, 23263, 27553, 28480, 30232, 27254, 27848, 33124, 35587,
  32525, 29782, 31193, 35886
];

const presets = {
  biogas: { label: "Biogas", organic: 0, biogas: 1, water: 0 },
  organic: { label: "Organic Acid", organic: 1, biogas: 0, water: 0 },
  water: { label: "Water Recovery", organic: 0, biogas: 0, water: 1 },
  diversification: { label: "Diversification", organic: 0.333, biogas: 0.333, water: 0.333 }
};

const defaults = {
  adjustTimeYoungCrop: 1.59,
  growthDelayTime: 1.095,
  adjustTimeCrop: 3.59,
  averageDiscardTime: 5.319,
  volConversionFactor: 1000,
  ethanolUsage: 0.15,
  ethanolToCrop: 13.1,
  ethanolYield: 0.046,
  vinasseYield: 10,
  organicAcidFactor: 10.6,
  biogasFactor: 12.115,
  waterRecoveryFactor: 0.7,
  processingTime: 1,
  salesTime: 1,
  costPerPlanting: 15200,
  costPerUnitEthanol: 423000,
  costPerUnitImport: 414680,
  pricePerUnitEthanol: 545455,
  pricePerUnitBiogas: 500,
  pricePerUnitOrganicAcid: 2890,
  tariffImport: 0.18,
  costPerUnitOrganicAcid: 2750,
  costPerUnitBiogas: 75,
  waterCost: 2810,
  policyWater: 0,
  waterCostTreat: 1030
};

const parameterRows = [
  ["adjustTimeYoungCrop", "Adjust Time Young Crop", defaults.adjustTimeYoungCrop, "year"],
  ["growthDelayTime", "Growth Delay Time", defaults.growthDelayTime, "year"],
  ["adjustTimeCrop", "Adjust Time Crop", defaults.adjustTimeCrop, "year"],
  ["averageDiscardTime", "Average Discard Time", defaults.averageDiscardTime, "year"],
  ["volConversionFactor", "Vol Conversion Factor", defaults.volConversionFactor, "L/m3"],
  ["ethanolUsage", "Ethanol Usage", defaults.ethanolUsage, "m3/person/year"],
  ["ethanolToCrop", "Ethanol To Crop", defaults.ethanolToCrop, "t crop/m3 ethanol"],
  ["ethanolYield", "Ethanol Yield", defaults.ethanolYield, "m3 ethanol/t crop"],
  ["vinasseYield", "Vinasse Yield", defaults.vinasseYield, "m3 vinasse/m3 ethanol"],
  ["organicAcidFactor", "Organic Acid Factor", defaults.organicAcidFactor, "kg/m3 vinasse"],
  ["biogasFactor", "Biogas Factor", defaults.biogasFactor, "m3/m3 vinasse"],
  ["waterRecoveryFactor", "Water Recovery Factor", defaults.waterRecoveryFactor, "m3/m3 vinasse"],
  ["processingTime", "Processing Time", defaults.processingTime, "year"],
  ["salesTime", "Sales Time", defaults.salesTime, "year"],
  ["costPerPlanting", "Cost Per Planting", defaults.costPerPlanting, "USD/unit"],
  ["costPerUnitEthanol", "Cost Per Unit Ethanol", defaults.costPerUnitEthanol, "USD/unit"],
  ["costPerUnitImport", "Cost Per Unit Import", defaults.costPerUnitImport, "USD/unit"],
  ["pricePerUnitEthanol", "Price Per Unit Ethanol", defaults.pricePerUnitEthanol, "USD/unit"],
  ["pricePerUnitBiogas", "Price Per Unit Biogas", defaults.pricePerUnitBiogas, "USD/unit"],
  ["pricePerUnitOrganicAcid", "Price Per Unit Organic Acid", defaults.pricePerUnitOrganicAcid, "USD/unit"],
  ["tariffImport", "Tariff Import", defaults.tariffImport, "fraction"],
  ["costPerUnitOrganicAcid", "Cost Per Unit Organic Acid", defaults.costPerUnitOrganicAcid, "USD/unit"],
  ["costPerUnitBiogas", "Cost Per Unit Biogas", defaults.costPerUnitBiogas, "USD/unit"],
  ["waterCost", "Water Cost", defaults.waterCost, "USD/unit"],
  ["policyWater", "Policy Water", defaults.policyWater, "fraction"],
  ["waterCostTreat", "Water Cost Treat", defaults.waterCostTreat, "USD/unit"]
];

const parameterKeyByLabel = Object.fromEntries(
  parameterRows.flatMap(([key, label]) => [
    [normalizeName(key), key],
    [normalizeName(label), key]
  ])
);

const defaultValidation = cropReal.map((crop, index) => ({
  year: 2000 + index,
  cropReal: crop,
  ethanolReal: ethanolReal[index],
  populationReal: populationLookup[index] ? populationLookup[index][1] : null
}));

const controls = {
  scenario: document.getElementById("scenarioSelect"),
  biogasShare: document.getElementById("biogasShare"),
  organicShare: document.getElementById("organicShare"),
  waterShare: document.getElementById("waterShare"),
  biogasShareValue: document.getElementById("biogasShareValue"),
  organicShareValue: document.getElementById("organicShareValue"),
  waterShareValue: document.getElementById("waterShareValue"),
  allocationStatus: document.getElementById("allocationStatus"),
  ethanolYield: document.getElementById("ethanolYield"),
  ethanolUsage: document.getElementById("ethanolUsage"),
  growthDelay: document.getElementById("growthDelay"),
  discardTime: document.getElementById("discardTime"),
  biogasPrice: document.getElementById("biogasPrice"),
  organicPrice: document.getElementById("organicPrice"),
  waterValue: document.getElementById("waterValue"),
  inputWorkbook: document.getElementById("inputWorkbook"),
  workbookStatus: document.getElementById("workbookStatus"),
  runButton: document.getElementById("runButton"),
  templateButton: document.getElementById("templateButton"),
  resetButton: document.getElementById("resetButton"),
  exportButton: document.getElementById("exportButton")
};

const views = {
  metricProfit: document.getElementById("metricProfit"),
  metricMargin: document.getElementById("metricMargin"),
  metricCropMape: document.getElementById("metricCropMape"),
  metricEthanolMape: document.getElementById("metricEthanolMape"),
  metricPopulationMape: document.getElementById("metricPopulationMape"),
  financialChart: document.getElementById("financialChart"),
  validationChart: document.getElementById("validationChart"),
  resultBody: document.getElementById("resultBody"),
  tableCount: document.getElementById("tableCount")
};

let currentRecords = [];
let activeDefaults = { ...defaults };
let activePopulationLookup = populationLookup.map((row) => [...row]);
let activeValidation = defaultValidation.map((row) => ({ ...row }));

function normalizeName(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function lookupLinear(table, x) {
  if (x <= table[0][0]) return table[0][1];
  if (x >= table[table.length - 1][0]) return table[table.length - 1][1];
  for (let i = 0; i < table.length - 1; i += 1) {
    const [x0, y0] = table[i];
    const [x1, y1] = table[i + 1];
    if (x >= x0 && x <= x1) {
      return y0 + ((x - x0) / (x1 - x0)) * (y1 - y0);
    }
  }
  return table[table.length - 1][1];
}

function getParameters() {
  return {
    ...activeDefaults,
    ethanolYield: Number(controls.ethanolYield.value),
    ethanolUsage: Number(controls.ethanolUsage.value),
    growthDelayTime: Number(controls.growthDelay.value),
    averageDiscardTime: Number(controls.discardTime.value),
    pricePerUnitBiogas: Number(controls.biogasPrice.value),
    pricePerUnitOrganicAcid: Number(controls.organicPrice.value),
    waterCost: Number(controls.waterValue.value)
  };
}

function getScenario() {
  return {
    label: controls.scenario.options[controls.scenario.selectedIndex].text,
    proportionBiogas: Number(controls.biogasShare.value),
    proportionOrganicAcid: Number(controls.organicShare.value),
    proportionWater: Number(controls.waterShare.value)
  };
}

function auxiliaries(state, delayOut, p, s) {
  const population = lookupLinear(activePopulationLookup, state.time);
  const demandVolume = population * p.ethanolUsage / p.volConversionFactor;
  const cropDemand = demandVolume * p.ethanolToCrop;
  const desiredCrop = cropDemand;
  const adjustCrop = (desiredCrop - state.Crop) / p.adjustTimeCrop;
  const expectedLossRate = state.Crop / p.averageDiscardTime;
  const desiredGrowthRate = Math.max(0, expectedLossRate + adjustCrop);
  const desiredYoungCrop = desiredGrowthRate * p.growthDelayTime;
  const adjustYoungCrop = (desiredYoungCrop - state.YoungCrop) / p.adjustTimeYoungCrop;
  const indicatedPlanting = adjustYoungCrop + desiredGrowthRate;
  const PlantingRate = Math.max(0, indicatedPlanting);
  const GrowthRate = delayOut;
  const DiscardRate = state.Crop / p.averageDiscardTime;
  const EthanolProduction = (state.Crop / p.processingTime) * p.ethanolYield;
  const salesCapacity = state.Ethanol / p.salesTime;
  const Sales = Math.min(salesCapacity, demandVolume);
  const shortage = Math.max(0, demandVolume - salesCapacity);
  const Imports = shortage;
  const VinasseProduction = EthanolProduction * p.vinasseYield;
  const BiogasProduction = VinasseProduction * s.proportionBiogas * p.biogasFactor;
  const OrganicAcidProduction = VinasseProduction * s.proportionOrganicAcid * p.organicAcidFactor;
  const WaterRecovery = VinasseProduction * s.proportionWater * p.waterRecoveryFactor;
  const plantingCost = p.costPerPlanting * PlantingRate;
  const productionCost = p.costPerUnitEthanol * EthanolProduction;
  const importCost = Imports * p.costPerUnitImport * (1 + p.tariffImport);
  const organicAcidCost = p.costPerUnitOrganicAcid * OrganicAcidProduction;
  const biogasCost = BiogasProduction * p.costPerUnitBiogas;
  const waterCost = p.waterCostTreat * WaterRecovery;
  const totalCost = importCost + plantingCost + productionCost + organicAcidCost + biogasCost + waterCost;
  const salesRevenue = p.pricePerUnitEthanol * Sales;
  const organicAcidRevenue = p.pricePerUnitOrganicAcid * OrganicAcidProduction;
  const biogasRevenue = BiogasProduction * p.pricePerUnitBiogas;
  const byProductRevenue = biogasRevenue + organicAcidRevenue;
  const waterRecoveryCredits = (p.waterCost + p.policyWater * p.waterCostTreat) * WaterRecovery;
  const totalRevenue = salesRevenue + byProductRevenue + waterRecoveryCredits;
  const NetProfit = totalRevenue - totalCost;

  return {
    population, demandVolume, cropDemand, desiredCrop, adjustCrop,
    expectedLossRate, desiredGrowthRate, desiredYoungCrop, adjustYoungCrop,
    indicatedPlanting, PlantingRate, GrowthRate, DiscardRate, EthanolProduction,
    Sales, shortage, Imports, VinasseProduction, BiogasProduction,
    OrganicAcidProduction, WaterRecovery, totalCost, totalRevenue, NetProfit
  };
}

function simulate(scenario, params, finalTime = 30, dt = 0.001) {
  const targets = Array.from({ length: finalTime + 1 }, (_, i) => i);
  let targetIndex = 0;
  const state = {
    time: 0,
    YoungCrop: 0,
    Crop: 0,
    Ethanol: 0,
    CumulativeProfit: 0,
    OrganicAcid: 0,
    Biogas: 0,
    Water: 0,
    delay1: 0,
    delay2: 0,
    delay3: 0
  };
  const initial = auxiliaries(state, 0, params, scenario);
  state.delay1 = initial.PlantingRate;
  state.delay2 = initial.PlantingRate;
  state.delay3 = initial.PlantingRate;
  const records = [];

  function snapshot() {
    records.push({ ...state, ...auxiliaries(state, state.delay3, params, scenario) });
  }

  if (targets[targetIndex] === 0) {
    snapshot();
    targetIndex += 1;
  }

  const steps = Math.round(finalTime / dt);
  const tau = params.growthDelayTime / 3;

  for (let step = 0; step < steps; step += 1) {
    const aux = auxiliaries(state, state.delay3, params, scenario);
    const delay1Dot = (aux.PlantingRate - state.delay1) / tau;
    const delay2Dot = (state.delay1 - state.delay2) / tau;
    const delay3Dot = (state.delay2 - state.delay3) / tau;

    state.YoungCrop += (aux.PlantingRate - aux.GrowthRate) * dt;
    state.Crop += (aux.GrowthRate - aux.DiscardRate) * dt;
    state.Ethanol += (aux.EthanolProduction + aux.Imports - aux.Sales) * dt;
    state.CumulativeProfit += aux.NetProfit * dt;
    state.OrganicAcid += aux.OrganicAcidProduction * dt;
    state.Biogas += aux.BiogasProduction * dt;
    state.Water += aux.WaterRecovery * dt;
    state.delay1 += delay1Dot * dt;
    state.delay2 += delay2Dot * dt;
    state.delay3 += delay3Dot * dt;
    state.time += dt;

    if (targetIndex < targets.length && state.time + dt / 2 >= targets[targetIndex]) {
      state.time = targets[targetIndex];
      snapshot();
      targetIndex += 1;
    }
  }

  return records.map((row) => ({ ...row, year: 2000 + Math.round(row.time) }));
}

function getFinalTime() {
  const maxPopulationTime = activePopulationLookup[activePopulationLookup.length - 1][0];
  return Math.max(30, Math.round(maxPopulationTime));
}

function validationValueByYear(key) {
  return new Map(activeValidation
    .filter((row) => Number.isFinite(row.year) && Number.isFinite(row[key]) && row[key] !== 0)
    .map((row) => [row.year, row[key]]));
}

function mape(records, validationKey, modelKey, startYear = null, endYear = null) {
  const actuals = validationValueByYear(validationKey);
  const values = records
    .filter((row) => (startYear === null || row.year >= startYear) && (endYear === null || row.year <= endYear))
    .map((row) => {
      const actual = actuals.get(row.year);
      return actual ? Math.abs((actual - row[modelKey]) / actual) * 100 : null;
    })
    .filter((value) => value !== null);
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
}

function formatMMUSD(value) {
  return `${(value / 1000000).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function formatNumber(value, digits = 0) {
  return value.toLocaleString(undefined, { maximumFractionDigits: digits });
}

function getFirstValue(row, names) {
  for (const name of names) {
    if (row[name] !== undefined && row[name] !== null && row[name] !== "") return row[name];
  }
  const normalized = Object.fromEntries(Object.entries(row).map(([key, value]) => [normalizeName(key), value]));
  for (const name of names) {
    const value = normalized[normalizeName(name)];
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return null;
}

function numberOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(String(value).replace(",", "."));
  return Number.isFinite(number) ? number : null;
}

function findSheet(workbook, names) {
  const byName = new Map(workbook.SheetNames.map((name) => [normalizeName(name), name]));
  for (const name of names) {
    const match = byName.get(normalizeName(name));
    if (match) return workbook.Sheets[match];
  }
  return null;
}

function sheetRows(sheet) {
  return XLSX.utils.sheet_to_json(sheet, { defval: null });
}

function parseParameterSheet(sheet) {
  const params = {};
  sheetRows(sheet).forEach((row) => {
    const rawName = getFirstValue(row, ["Key", "Parameter", "Parameter Name", "Variable", "Name"]);
    const rawValue = getFirstValue(row, ["Value", "Default", "Parameter Value", "Setup", "Base Value"]);
    const value = numberOrNull(rawValue);
    if (!rawName || value === null) return;
    const key = parameterKeyByLabel[normalizeName(rawName)];
    if (key) params[key] = value;
  });
  return params;
}

function parsePopulationSheet(sheet) {
  const rows = sheetRows(sheet)
    .map((row) => {
      const year = numberOrNull(getFirstValue(row, ["Year", "year"]));
      const rawTime = numberOrNull(getFirstValue(row, ["Time", "time", "t"]));
      const population = numberOrNull(getFirstValue(row, ["Population", "Population Real", "Brazil Population", "Value"]));
      const time = rawTime !== null ? rawTime : year !== null ? year - 2000 : null;
      return time !== null && population !== null ? [time, population] : null;
    })
    .filter(Boolean)
    .sort((a, b) => a[0] - b[0]);
  if (rows.length < 2) {
    throw new Error("Table A1 must include at least two rows with Time/Year and Population.");
  }
  return rows;
}

function parseValidationSheet(sheet) {
  return sheetRows(sheet)
    .map((row) => {
      const year = numberOrNull(getFirstValue(row, ["Year", "year"]));
      return {
        year,
        cropReal: numberOrNull(getFirstValue(row, ["Crop Real", "Real Crop", "Observed Crop", "Crop"])),
        ethanolReal: numberOrNull(getFirstValue(row, ["Ethanol Real", "Real Ethanol", "Observed Ethanol", "Ethanol"])),
        populationReal: numberOrNull(getFirstValue(row, ["Population Real", "Real Population", "Observed Population", "Population"]))
      };
    })
    .filter((row) => Number.isFinite(row.year));
}

function applyWorkbook(workbook) {
  const parameterSheet = findSheet(workbook, ["Table 4", "Parameters", "Parameter Setups"]);
  const populationSheet = findSheet(workbook, ["Table A1", "Population"]);
  const validationSheet = findSheet(workbook, ["Validation"]);
  if (!parameterSheet) throw new Error("Missing sheet: Table 4.");
  if (!populationSheet) throw new Error("Missing sheet: Table A1.");

  const params = parseParameterSheet(parameterSheet);
  activeDefaults = { ...defaults, ...params };
  activePopulationLookup = parsePopulationSheet(populationSheet);
  activeValidation = validationSheet ? parseValidationSheet(validationSheet) : [];
  setControlValuesFromDefaults();
  controls.workbookStatus.textContent = `Loaded ${workbook.SheetNames.length} sheets. Validation ${activeValidation.length ? "included" : "not included"}.`;
  controls.workbookStatus.classList.remove("invalid");
}

function setControlValuesFromDefaults() {
  controls.ethanolYield.value = activeDefaults.ethanolYield;
  controls.ethanolUsage.value = activeDefaults.ethanolUsage;
  controls.growthDelay.value = activeDefaults.growthDelayTime;
  controls.discardTime.value = activeDefaults.averageDiscardTime;
  controls.biogasPrice.value = activeDefaults.pricePerUnitBiogas;
  controls.organicPrice.value = activeDefaults.pricePerUnitOrganicAcid;
  controls.waterValue.value = activeDefaults.waterCost;
}

async function loadWorkbookFromFile(file) {
  if (!window.XLSX) throw new Error("The spreadsheet parser is still loading. Try again in a moment.");
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: "array" });
  applyWorkbook(workbook);
  runModel();
}

function downloadTemplate() {
  if (!window.XLSX) {
    controls.workbookStatus.textContent = "Spreadsheet tools are not available yet.";
    controls.workbookStatus.classList.add("invalid");
    return;
  }
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.aoa_to_sheet([
      ["Key", "Parameter", "Value", "Unit"],
      ...parameterRows.map(([key, label, value, unit]) => [key, label, value, unit])
    ]),
    "Table 4"
  );
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.aoa_to_sheet([
      ["Time", "Year", "Population"],
      ...populationLookup.map(([time, population]) => [time, 2000 + time, population])
    ]),
    "Table A1"
  );
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.aoa_to_sheet([
      ["Year", "Crop Real", "Ethanol Real", "Population Real"],
      ...defaultValidation.map((row) => [row.year, row.cropReal, row.ethanolReal, row.populationReal])
    ]),
    "Validation"
  );
  XLSX.writeFile(workbook, "crop_vinasse_model_inputs.xlsx");
}

function updateAllocationLabels() {
  controls.biogasShareValue.textContent = Number(controls.biogasShare.value).toFixed(3);
  controls.organicShareValue.textContent = Number(controls.organicShare.value).toFixed(3);
  controls.waterShareValue.textContent = Number(controls.waterShare.value).toFixed(3);
  const total = Number(controls.biogasShare.value) + Number(controls.organicShare.value) + Number(controls.waterShare.value);
  controls.allocationStatus.textContent = `Allocated vinasse: ${(total * 100).toFixed(1)}%`;
  controls.allocationStatus.classList.toggle("invalid", total > 1.0001);
}

function drawLineChart(canvas, series, options = {}) {
  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  ctx.clearRect(0, 0, width, height);

  const pad = { left: 66, right: 22, top: 18, bottom: 52 };
  const points = series.flatMap((line) => line.values.map((value, index) => ({ x: line.x[index], y: value })));
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  let minY = Math.min(...ys);
  let maxY = Math.max(...ys);
  if (options.zeroBase) minY = Math.min(0, minY);
  if (Math.abs(maxY - minY) < 1e-9) maxY += 1;

  const chartW = width - pad.left - pad.right;
  const chartH = height - pad.top - pad.bottom;
  const xScale = (x) => pad.left + ((x - minX) / (maxX - minX || 1)) * chartW;
  const yScale = (y) => pad.top + (1 - (y - minY) / (maxY - minY)) * chartH;

  ctx.strokeStyle = "#d6ddd8";
  ctx.lineWidth = 1;
  ctx.fillStyle = "#66706b";
  ctx.font = "22px system-ui";
  for (let i = 0; i <= 4; i += 1) {
    const y = pad.top + (chartH / 4) * i;
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(width - pad.right, y);
    ctx.stroke();
    const value = maxY - ((maxY - minY) / 4) * i;
    ctx.fillText(options.formatY ? options.formatY(value) : formatNumber(value), 8, y + 7);
  }

  ctx.strokeStyle = "#91a19c";
  ctx.beginPath();
  ctx.moveTo(pad.left, pad.top);
  ctx.lineTo(pad.left, height - pad.bottom);
  ctx.lineTo(width - pad.right, height - pad.bottom);
  ctx.stroke();

  ctx.font = "22px system-ui";
  [minX, Math.round((minX + maxX) / 2), maxX].forEach((year) => {
    ctx.fillText(String(year), xScale(year) - 22, height - 16);
  });

  series.forEach((line) => {
    ctx.strokeStyle = line.color;
    ctx.lineWidth = 4;
    ctx.beginPath();
    line.values.forEach((value, index) => {
      const x = xScale(line.x[index]);
      const y = yScale(value);
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  });

  let legendX = pad.left;
  series.forEach((line) => {
    ctx.fillStyle = line.color;
    ctx.fillRect(legendX, 18, 22, 8);
    ctx.fillStyle = "#1d2525";
    ctx.font = "20px system-ui";
    ctx.fillText(line.name, legendX + 30, 26);
    legendX += 150;
  });
}

function renderTable(records) {
  views.resultBody.innerHTML = "";
  records.forEach((row) => {
    const tr = document.createElement("tr");
    const values = [
      row.year,
      formatNumber(row.Crop, 0),
      formatNumber(row.Ethanol, 0),
      formatMMUSD(row.totalRevenue),
      formatMMUSD(row.totalCost),
      formatMMUSD(row.NetProfit)
    ];
    values.forEach((value) => {
      const td = document.createElement("td");
      td.textContent = value;
      tr.appendChild(td);
    });
    views.resultBody.appendChild(tr);
  });
  views.tableCount.textContent = `${records.length} years`;
}

function runModel() {
  updateAllocationLabels();
  const scenario = getScenario();
  const total = scenario.proportionBiogas + scenario.proportionOrganicAcid + scenario.proportionWater;
  const params = getParameters();
  currentRecords = simulate(scenario, params, getFinalTime());

  const last = currentRecords[currentRecords.length - 1];
  const margin = last.totalRevenue ? (last.NetProfit / last.totalRevenue) * 100 : 0;
  const cropMape = mape(currentRecords, "cropReal", "Crop", 2008, 2018);
  const ethanolMape = mape(currentRecords, "ethanolReal", "Ethanol", 2008, 2018);
  const populationMape = mape(currentRecords, "populationReal", "population");
  views.metricProfit.textContent = formatMMUSD(last.CumulativeProfit);
  views.metricMargin.textContent = `${margin.toFixed(2)}%`;
  views.metricCropMape.textContent = cropMape === null ? "n/a" : `${cropMape.toFixed(2)}%`;
  views.metricEthanolMape.textContent = ethanolMape === null ? "n/a" : `${ethanolMape.toFixed(2)}%`;
  views.metricPopulationMape.textContent = populationMape === null ? "n/a" : `${populationMape.toFixed(4)}%`;

  drawLineChart(
    views.financialChart,
    [
      { name: "Revenue", color: "#0f766e", x: currentRecords.map((r) => r.year), values: currentRecords.map((r) => r.totalRevenue / 1000000) },
      { name: "Cost", color: "#b45309", x: currentRecords.map((r) => r.year), values: currentRecords.map((r) => r.totalCost / 1000000) },
      { name: "Profit", color: "#5b6f95", x: currentRecords.map((r) => r.year), values: currentRecords.map((r) => r.NetProfit / 1000000) }
    ],
    { formatY: (value) => formatNumber(value, 0) }
  );

  const validationRows = currentRecords.filter((row) => row.year <= 2023);
  const cropActuals = validationValueByYear("cropReal");
  const ethanolActuals = validationValueByYear("ethanolReal");
  drawLineChart(
    views.validationChart,
    [
      { name: "Crop", color: "#0f766e", x: validationRows.map((r) => r.year), values: validationRows.map((r) => r.Crop) },
      { name: "Ethanol x10", color: "#5b6f95", x: validationRows.map((r) => r.year), values: validationRows.map((r) => r.Ethanol * 10) },
      ...(cropActuals.size ? [{ name: "Crop Real", color: "#8a6f33", x: validationRows.map((r) => r.year), values: validationRows.map((r) => cropActuals.get(r.year) ?? null) }] : []),
      ...(ethanolActuals.size ? [{ name: "Ethanol Real x10", color: "#b45309", x: validationRows.map((r) => r.year), values: validationRows.map((r) => ethanolActuals.has(r.year) ? ethanolActuals.get(r.year) * 10 : null) }] : [])
    ].map((line) => ({
      ...line,
      x: line.x.filter((_, index) => line.values[index] !== null),
      values: line.values.filter((value) => value !== null)
    })).filter((line) => line.values.length),
    { zeroBase: true, formatY: (value) => formatNumber(value, 0) }
  );

  renderTable(currentRecords);
  controls.exportButton.disabled = total > 1.0001;
}

function setPreset(key) {
  const preset = presets[key] || presets.biogas;
  controls.biogasShare.value = preset.biogas;
  controls.organicShare.value = preset.organic;
  controls.waterShare.value = preset.water;
}

function resetControls() {
  activeDefaults = { ...defaults };
  activePopulationLookup = populationLookup.map((row) => [...row]);
  activeValidation = defaultValidation.map((row) => ({ ...row }));
  controls.inputWorkbook.value = "";
  controls.workbookStatus.textContent = "Using bundled input tables.";
  controls.workbookStatus.classList.remove("invalid");
  controls.scenario.value = "biogas";
  setPreset("biogas");
  setControlValuesFromDefaults();
  runModel();
}

function exportCsv() {
  const header = ["Year", "Crop", "Ethanol", "Revenue", "Cost", "Profit", "BiogasProduction", "OrganicAcidProduction", "WaterRecovery"];
  const rows = currentRecords.map((row) => [
    row.year,
    row.Crop,
    row.Ethanol,
    row.totalRevenue,
    row.totalCost,
    row.NetProfit,
    row.BiogasProduction,
    row.OrganicAcidProduction,
    row.WaterRecovery
  ]);
  const csv = [header, ...rows].map((row) => row.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "crop_vinasse_results.csv";
  anchor.click();
  URL.revokeObjectURL(url);
}

controls.scenario.addEventListener("change", () => {
  if (controls.scenario.value !== "custom") {
    setPreset(controls.scenario.value);
  }
  runModel();
});

[controls.biogasShare, controls.organicShare, controls.waterShare].forEach((control) => {
  control.addEventListener("input", () => {
    controls.scenario.value = "custom";
    runModel();
  });
});

[
  controls.ethanolYield,
  controls.ethanolUsage,
  controls.growthDelay,
  controls.discardTime,
  controls.biogasPrice,
  controls.organicPrice,
  controls.waterValue
].forEach((control) => control.addEventListener("input", runModel));

controls.runButton.addEventListener("click", runModel);
controls.inputWorkbook.addEventListener("change", (event) => {
  const [file] = event.target.files;
  if (!file) return;
  loadWorkbookFromFile(file).catch((error) => {
    controls.workbookStatus.textContent = error.message;
    controls.workbookStatus.classList.add("invalid");
  });
});
controls.templateButton.addEventListener("click", downloadTemplate);
controls.resetButton.addEventListener("click", resetControls);
controls.exportButton.addEventListener("click", exportCsv);
window.addEventListener("resize", runModel);

resetControls();
