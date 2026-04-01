// ================================================
//  TERRASCORE v2.0 — Environmental Impact Assessment
//  Dashboard personal de huella ambiental
// ================================================

// ================================================
//  CONSTANTS & EMISSION FACTORS
// ================================================
const CHILE_AVG_CO2 = 4.7;   // ton CO2e/year per capita
const WORLD_AVG_CO2 = 4.8;   // ton CO2e/year per capita
const CHILE_AVG_WATER = 170;  // liters/day per capita
const CHILE_POPULATION = 19_500_000;

// Transport emission factors (kg CO2e per km)
const CAR_FACTORS = {
    none: 0,
    gasoline: 0.21,
    diesel: 0.27,
    hybrid: 0.10,
    electric: 0.05
};
const FLIGHT_CO2_PER_ROUND_TRIP = 0.9; // ton CO2e per round trip (avg domestic+intl)
const PUBLIC_TRANSPORT_KG_PER_DAY = 0.3; // kg CO2e per day of public transport use

// Home energy factors
const ELECTRICITY_FACTOR_CL = 0.42; // kg CO2e per kWh (Chile grid avg)
const GAS_FACTOR = 2.0;             // kg CO2e per m3 natural gas

const HEATING_FACTORS = { // kg CO2e per month of use
    none: 0,
    electric: 50,
    gas: 80,
    wood: 120,
    kerosene: 150,
    pellet: 30
};

// Food factors (ton CO2e per year)
const DIET_FACTORS = {
    omnivore: 2.5,
    lowmeat: 1.7,
    vegetarian: 1.2,
    vegan: 0.7
};

// Water factors (liters)
const SHOWER_LITERS_PER_MIN = 9;
const LAUNDRY_LITERS = 50;
const DISH_FACTORS = { 'hand-low': 15, 'hand-high': 40, machine: 12 };
const GARDEN_LITERS_PER_MIN = 12;
const TOILET_FACTORS = { old: 12, standard: 6, dual: 4.5 };

// Challenges
const ECO_CHALLENGES = [
    { id: 'no-car-week', title: 'Semana sin auto', desc: 'Usa transporte publico, bicicleta o camina durante 7 dias seguidos.', points: 50, icon: '\u{1F6B2}' },
    { id: 'compost', title: 'Compostar residuos organicos', desc: 'Inicia o mantiene un compost casero durante todo el mes.', points: 40, icon: '\u{1F331}' },
    { id: 'short-shower', title: 'Duchas de 5 minutos', desc: 'Reduce tu ducha a 5 minutos maximo durante 2 semanas.', points: 30, icon: '\u{1F6BF}' },
    { id: 'zero-waste-lunch', title: 'Almuerzo sin residuos', desc: 'Lleva tu almuerzo en contenedor reutilizable por 5 dias.', points: 25, icon: '\u{1F371}' },
    { id: 'meatless-monday', title: 'Lunes sin carne', desc: 'No consumas carne todos los lunes del mes.', points: 20, icon: '\u{1F966}' },
    { id: 'local-shopping', title: 'Comprar en la feria', desc: 'Compra frutas y verduras en ferias locales por 1 mes.', points: 35, icon: '\u{1F34E}' },
    { id: 'energy-audit', title: 'Auditoria energetica', desc: 'Revisa y desconecta aparatos en standby en toda tu casa.', points: 20, icon: '\u{1F50C}' },
    { id: 'tree-plant', title: 'Plantar un arbol', desc: 'Planta un arbol nativo chileno o colabora en una reforestacion.', points: 60, icon: '\u{1F333}' },
    { id: 'reusable-bottle', title: 'Botella reutilizable', desc: 'Usa solo tu botella reutilizable todo el mes (cero botellas plasticas).', points: 25, icon: '\u{1FAD9}' },
    { id: 'digital-cleanup', title: 'Limpieza digital', desc: 'Borra emails, archivos y fotos innecesarias para reducir huella digital.', points: 15, icon: '\u{1F4BB}' }
];

const ECO_LEVELS = [
    { min: 0, name: 'Semilla', color: '#8892a6' },
    { min: 50, name: 'Brote', color: '#a3e635' },
    { min: 150, name: 'Arbolito', color: '#22c55e' },
    { min: 300, name: 'Bosque', color: '#00ff88' },
    { min: 500, name: 'Guardian del Planeta', color: '#00f0ff' }
];

const SCORE_LABELS = [
    { min: 80, label: 'Ejemplar', color: '#00ff88', desc: 'Tu impacto ambiental es minimo. Eres un ejemplo a seguir.' },
    { min: 60, label: 'Bueno', color: '#a3e635', desc: 'Estas por buen camino. Pequenos ajustes pueden marcarte como ejemplar.' },
    { min: 40, label: 'Regular', color: '#fbbf24', desc: 'Hay oportunidades claras de mejora en tu huella ambiental.' },
    { min: 20, label: 'Deficiente', color: '#f97316', desc: 'Tu impacto es significativo. Revisa las recomendaciones para reducirlo.' },
    { min: 0, label: 'Critico', color: '#ef4444', desc: 'Tu huella ambiental es muy alta. Es urgente tomar accion.' }
];

// ================================================
//  STATE (from localStorage)
// ================================================
let state = loadState();

function defaultState() {
    return {
        carbon: { kmWeek: 0, carType: 'none', flightsYear: 0, publicTransport: 0, electricityKwh: 0, gasM3: 0, heatingType: 'none', heatingMonths: 0, dietType: 'omnivore', foodWaste: 15, localFood: 30 },
        water: { showerMin: 8, showersDay: 1, laundryWeek: 3, dishwashing: 'hand-low', gardenMin: 0, toiletFlushes: 5, toiletType: 'standard' },
        wasteLog: [],       // [{ date, recycling, organic, general }]
        waterLog: [],       // [{ date, liters }]
        challenges: {},     // { challengeId: { completed: bool, date } }
        points: 0,
        pointsHistory: [],  // [{ date, points }]
        scoreHistory: []    // [{ date, score }]
    };
}

function loadState() {
    try {
        const raw = localStorage.getItem('terrascore_state');
        if (raw) {
            const parsed = JSON.parse(raw);
            // Merge with defaults in case of schema changes
            const def = defaultState();
            return { ...def, ...parsed, carbon: { ...def.carbon, ...parsed.carbon }, water: { ...def.water, ...parsed.water } };
        }
    } catch (e) { /* ignore */ }
    return defaultState();
}

function saveState() {
    try { localStorage.setItem('terrascore_state', JSON.stringify(state)); } catch (e) { /* ignore */ }
}

// ================================================
//  PARTICLES
// ================================================
function initParticles() {
    const canvas = document.getElementById('particles');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let particles = [];
    const COUNT = 40;

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    for (let i = 0; i < COUNT; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            r: Math.random() * 1.5 + 0.5,
            dx: (Math.random() - 0.5) * 0.3,
            dy: (Math.random() - 0.5) * 0.3,
            a: Math.random() * 0.3 + 0.1
        });
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (const p of particles) {
            p.x += p.dx; p.y += p.dy;
            if (p.x < 0) p.x = canvas.width;
            if (p.x > canvas.width) p.x = 0;
            if (p.y < 0) p.y = canvas.height;
            if (p.y > canvas.height) p.y = 0;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(0, 240, 255, ${p.a})`;
            ctx.fill();
        }
        requestAnimationFrame(draw);
    }
    draw();
}

// ================================================
//  NAVIGATION
// ================================================
function initNav() {
    const tabs = document.querySelectorAll('.nav-tab');
    const sections = document.querySelectorAll('.app-section');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.section;
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            sections.forEach(s => {
                s.classList.toggle('active', s.id === `sec-${target}`);
            });
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });
}

// ================================================
//  CARBON FOOTPRINT CALCULATIONS
// ================================================
function calcTransportCO2() {
    const km = parseFloat(document.getElementById('kmWeek')?.value) || 0;
    const carType = document.getElementById('carType')?.value || 'none';
    const flights = parseFloat(document.getElementById('flightsYear')?.value) || 0;
    const pt = parseFloat(document.getElementById('publicTransport')?.value) || 0;

    const carCO2 = (km * 52 * CAR_FACTORS[carType]) / 1000; // ton
    const flightCO2 = flights * FLIGHT_CO2_PER_ROUND_TRIP;
    const ptCO2 = (pt * 52 * PUBLIC_TRANSPORT_KG_PER_DAY) / 1000;

    return carCO2 + flightCO2 + ptCO2;
}

function calcHomeCO2() {
    const elec = parseFloat(document.getElementById('electricityKwh')?.value) || 0;
    const gas = parseFloat(document.getElementById('gasM3')?.value) || 0;
    const heating = document.getElementById('heatingType')?.value || 'none';
    const months = parseFloat(document.getElementById('heatingMonths')?.value) || 0;

    const elecCO2 = (elec * 12 * ELECTRICITY_FACTOR_CL) / 1000;
    const gasCO2 = (gas * 12 * GAS_FACTOR) / 1000;
    const heatingCO2 = (HEATING_FACTORS[heating] * months) / 1000;

    return elecCO2 + gasCO2 + heatingCO2;
}

function calcFoodCO2() {
    const diet = document.getElementById('dietType')?.value || 'omnivore';
    const waste = parseFloat(document.getElementById('foodWaste')?.value) || 0;
    const local = parseFloat(document.getElementById('localFood')?.value) || 0;

    let base = DIET_FACTORS[diet];
    // Food waste adds proportional emissions
    base *= (1 + waste / 100);
    // Local food reduces transport emissions by up to 15%
    base *= (1 - (local / 100) * 0.15);

    return base;
}

function calcTotalCO2() {
    return calcTransportCO2() + calcHomeCO2() + calcFoodCO2();
}

// Carbon score: 100 = zero emissions, 0 = 2x world average or more
function calcCarbonScore() {
    const co2 = calcTotalCO2();
    if (co2 <= 0) return 100;
    // Scale: 0 ton = 100, 10 ton (2x world avg) = 0
    const score = Math.max(0, Math.min(100, 100 - (co2 / 10) * 100));
    return Math.round(score);
}

// ================================================
//  WATER FOOTPRINT CALCULATIONS
// ================================================
function calcDailyWater() {
    const showerMin = parseFloat(document.getElementById('showerMin')?.value) || 0;
    const showersDay = parseFloat(document.getElementById('showersDay')?.value) || 0;
    const laundryWeek = parseFloat(document.getElementById('laundryWeek')?.value) || 0;
    const dish = document.getElementById('dishwashing')?.value || 'hand-low';
    const gardenMin = parseFloat(document.getElementById('gardenMin')?.value) || 0;
    const toiletFlushes = parseFloat(document.getElementById('toiletFlushes')?.value) || 0;
    const toiletType = document.getElementById('toiletType')?.value || 'standard';

    const shower = showerMin * showersDay * SHOWER_LITERS_PER_MIN;
    const laundry = (laundryWeek * LAUNDRY_LITERS) / 7;
    const dishes = DISH_FACTORS[dish] || 15;
    const garden = gardenMin * GARDEN_LITERS_PER_MIN;
    const toilet = toiletFlushes * TOILET_FACTORS[toiletType];

    return { shower, laundry, dishes, garden, toilet, total: shower + laundry + dishes + garden + toilet };
}

// Water score: 100 = 50L/day, 0 = 400L+/day
function calcWaterScore() {
    const w = calcDailyWater().total;
    if (w <= 50) return 100;
    const score = Math.max(0, Math.min(100, 100 - ((w - 50) / 350) * 100));
    return Math.round(score);
}

// ================================================
//  WASTE CALCULATIONS
// ================================================
function calcWasteScore() {
    if (state.wasteLog.length === 0) return 50; // neutral if no data
    // Use last 4 entries (roughly a month)
    const recent = state.wasteLog.slice(-4);
    let totalRecycling = 0, totalOrganic = 0, totalGeneral = 0;
    recent.forEach(e => {
        totalRecycling += e.recycling || 0;
        totalOrganic += e.organic || 0;
        totalGeneral += e.general || 0;
    });
    const total = totalRecycling + totalOrganic + totalGeneral;
    if (total === 0) return 50;
    const recycleRate = ((totalRecycling + totalOrganic) / total) * 100;
    // Score: 0% recycle = 0, 80%+ = 100
    return Math.round(Math.min(100, (recycleRate / 80) * 100));
}

function getRecycleRate() {
    if (state.wasteLog.length === 0) return 0;
    const recent = state.wasteLog.slice(-4);
    let totalRecycling = 0, totalOrganic = 0, totalGeneral = 0;
    recent.forEach(e => {
        totalRecycling += e.recycling || 0;
        totalOrganic += e.organic || 0;
        totalGeneral += e.general || 0;
    });
    const total = totalRecycling + totalOrganic + totalGeneral;
    if (total === 0) return 0;
    return Math.round(((totalRecycling + totalOrganic) / total) * 100);
}

// ================================================
//  COMPOSITE TERRASCORE
// ================================================
function calcTerraScore() {
    const carbon = calcCarbonScore();
    const water = calcWaterScore();
    const waste = calcWasteScore();
    return Math.round(carbon * 0.4 + water * 0.3 + waste * 0.3);
}

function getScoreLabel(score) {
    for (const s of SCORE_LABELS) {
        if (score >= s.min) return s;
    }
    return SCORE_LABELS[SCORE_LABELS.length - 1];
}

function getEcoLevel(points) {
    let level = ECO_LEVELS[0];
    for (const l of ECO_LEVELS) {
        if (points >= l.min) level = l;
    }
    return level;
}

// ================================================
//  UI UPDATES
// ================================================
function updateAll() {
    updateCarbonUI();
    updateWaterUI();
    updateWasteUI();
    updateGauge();
    updateQuickStats();
    updateImpact();
    updateChallenges();
    updateCharts();
    saveCarbonState();
    saveWaterState();
    saveState();
}

function saveCarbonState() {
    state.carbon = {
        kmWeek: parseFloat(document.getElementById('kmWeek')?.value) || 0,
        carType: document.getElementById('carType')?.value || 'none',
        flightsYear: parseFloat(document.getElementById('flightsYear')?.value) || 0,
        publicTransport: parseFloat(document.getElementById('publicTransport')?.value) || 0,
        electricityKwh: parseFloat(document.getElementById('electricityKwh')?.value) || 0,
        gasM3: parseFloat(document.getElementById('gasM3')?.value) || 0,
        heatingType: document.getElementById('heatingType')?.value || 'none',
        heatingMonths: parseFloat(document.getElementById('heatingMonths')?.value) || 0,
        dietType: document.getElementById('dietType')?.value || 'omnivore',
        foodWaste: parseFloat(document.getElementById('foodWaste')?.value) || 15,
        localFood: parseFloat(document.getElementById('localFood')?.value) || 30
    };
}

function saveWaterState() {
    state.water = {
        showerMin: parseFloat(document.getElementById('showerMin')?.value) || 0,
        showersDay: parseFloat(document.getElementById('showersDay')?.value) || 1,
        laundryWeek: parseFloat(document.getElementById('laundryWeek')?.value) || 0,
        dishwashing: document.getElementById('dishwashing')?.value || 'hand-low',
        gardenMin: parseFloat(document.getElementById('gardenMin')?.value) || 0,
        toiletFlushes: parseFloat(document.getElementById('toiletFlushes')?.value) || 5,
        toiletType: document.getElementById('toiletType')?.value || 'standard'
    };
}

function restoreInputs() {
    // Carbon
    const c = state.carbon;
    setVal('kmWeek', c.kmWeek);
    setVal('carType', c.carType);
    setVal('flightsYear', c.flightsYear);
    setVal('publicTransport', c.publicTransport);
    setVal('electricityKwh', c.electricityKwh);
    setVal('gasM3', c.gasM3);
    setVal('heatingType', c.heatingType);
    setVal('heatingMonths', c.heatingMonths);
    setVal('dietType', c.dietType);
    setVal('foodWaste', c.foodWaste);
    setVal('localFood', c.localFood);
    // Water
    const w = state.water;
    setVal('showerMin', w.showerMin);
    setVal('showersDay', w.showersDay);
    setVal('laundryWeek', w.laundryWeek);
    setVal('dishwashing', w.dishwashing);
    setVal('gardenMin', w.gardenMin);
    setVal('toiletFlushes', w.toiletFlushes);
    setVal('toiletType', w.toiletType);
    // Range labels
    updateRangeLabel('foodWaste', 'foodWasteVal', '%');
    updateRangeLabel('localFood', 'localFoodVal', '%');
}

function setVal(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val;
}

function updateRangeLabel(inputId, labelId, suffix) {
    const el = document.getElementById(inputId);
    const lbl = document.getElementById(labelId);
    if (el && lbl) lbl.textContent = el.value + (suffix || '');
}

// ================================================
//  CARBON UI
// ================================================
function updateCarbonUI() {
    const transport = calcTransportCO2();
    const home = calcHomeCO2();
    const food = calcFoodCO2();
    const total = transport + home + food;

    setText('transportCO2', transport.toFixed(2) + ' ton CO2e/ano');
    setText('homeCO2', home.toFixed(2) + ' ton CO2e/ano');
    setText('foodCO2', food.toFixed(2) + ' ton CO2e/ano');
    setText('totalCarbonSummary', total.toFixed(2));
    setText('yourCarbonVal', total.toFixed(1));

    // Comparison bars (max scale = 10 ton)
    const maxScale = 10;
    setBarWidth('yourCarbonBar', (total / maxScale) * 100);
    setBarWidth('chileCarbonBar', (CHILE_AVG_CO2 / maxScale) * 100);
    setBarWidth('worldCarbonBar', (WORLD_AVG_CO2 / maxScale) * 100);
}

// ================================================
//  WATER UI
// ================================================
function updateWaterUI() {
    const w = calcDailyWater();
    setText('totalWaterSummary', Math.round(w.total));
    setText('yourWaterVal', Math.round(w.total));

    // Comparison bars (max scale = 400 L)
    const maxScale = 400;
    setBarWidth('yourWaterBar', (w.total / maxScale) * 100);
    setBarWidth('chileWaterBar', (CHILE_AVG_WATER / maxScale) * 100);
}

// ================================================
//  WASTE UI
// ================================================
function updateWasteUI() {
    const rate = getRecycleRate();
    setText('recyclePercent', rate + '%');

    // Animated ring
    const ring = document.getElementById('recycleRing');
    if (ring) {
        const circumference = 2 * Math.PI * 80;
        const offset = (rate / 100) * circumference;
        ring.style.strokeDasharray = `${offset} ${circumference}`;
    }

    // Totals
    if (state.wasteLog.length > 0) {
        const recent = state.wasteLog.slice(-4);
        let tr = 0, to = 0, tg = 0;
        recent.forEach(e => { tr += e.recycling || 0; to += e.organic || 0; tg += e.general || 0; });
        setText('wasteRecyclingTotal', tr.toFixed(1));
        setText('wasteOrganicTotal', to.toFixed(1));
        setText('wasteGeneralTotal', tg.toFixed(1));
    }
}

// ================================================
//  GAUGE (TerraScore)
// ================================================
function updateGauge() {
    const score = calcTerraScore();
    const label = getScoreLabel(score);

    // Animate number
    animateNumber('gaugeNumber', score);

    // Gauge fill (arc from 0 to score%)
    const gaugeFill = document.getElementById('gaugeFill');
    if (gaugeFill) {
        // Total arc length approximately 377 (half-circle of r=120)
        const totalArc = 377;
        const fillArc = (score / 100) * totalArc;
        setTimeout(() => {
            gaugeFill.style.transition = 'stroke-dasharray 1.5s ease-out';
            gaugeFill.style.strokeDasharray = `${fillArc} ${totalArc}`;
        }, 100);
    }

    // Needle position
    const needle = document.getElementById('gaugeNeedle');
    if (needle) {
        const angle = -180 + (score / 100) * 180;
        const rad = angle * Math.PI / 180;
        const cx = 150 + 120 * Math.cos(rad);
        const cy = 160 + 120 * Math.sin(rad);
        setTimeout(() => {
            needle.style.transition = 'all 1.5s ease-out';
            needle.setAttribute('cx', cx);
            needle.setAttribute('cy', cy);
        }, 100);
    }

    // Label
    const labelEl = document.getElementById('gaugeLabel');
    if (labelEl) {
        labelEl.textContent = label.label;
        labelEl.style.color = label.color;
    }

    // Sub-scores
    const carbonScore = calcCarbonScore();
    const waterScore = calcWaterScore();
    const wasteScore = calcWasteScore();

    setText('carbonScoreDisplay', carbonScore + '/100');
    setText('waterScoreDisplay', waterScore + '/100');
    setText('wasteScoreDisplay', wasteScore + '/100');

    setBarWidth('carbonBar', carbonScore);
    setBarWidth('waterBar', waterScore);
    setBarWidth('wasteBar', wasteScore);
}

// ================================================
//  QUICK STATS
// ================================================
function updateQuickStats() {
    const co2 = calcTotalCO2();
    const water = calcDailyWater().total;
    const recycle = getRecycleRate();

    setText('totalCO2', co2.toFixed(1));
    setText('totalWater', Math.round(water));
    setText('recycleRate', recycle);
    setText('challengePoints', state.points);

    // Comparisons
    const co2Diff = co2 - CHILE_AVG_CO2;
    const co2CompareEl = document.getElementById('co2Compare');
    if (co2CompareEl) {
        if (co2 === 0) {
            co2CompareEl.textContent = 'Ingresa tus datos';
            co2CompareEl.className = 'stat-compare neutral';
        } else if (co2Diff <= 0) {
            co2CompareEl.textContent = `${Math.abs(co2Diff).toFixed(1)} ton bajo promedio CL`;
            co2CompareEl.className = 'stat-compare good';
        } else {
            co2CompareEl.textContent = `${co2Diff.toFixed(1)} ton sobre promedio CL`;
            co2CompareEl.className = 'stat-compare bad';
        }
    }

    const waterDiff = water - CHILE_AVG_WATER;
    const waterCompareEl = document.getElementById('waterCompare');
    if (waterCompareEl) {
        if (water === 0) {
            waterCompareEl.textContent = 'Ingresa tus datos';
            waterCompareEl.className = 'stat-compare neutral';
        } else if (waterDiff <= 0) {
            waterCompareEl.textContent = `${Math.abs(Math.round(waterDiff))} L bajo promedio CL`;
            waterCompareEl.className = 'stat-compare good';
        } else {
            waterCompareEl.textContent = `${Math.round(waterDiff)} L sobre promedio CL`;
            waterCompareEl.className = 'stat-compare bad';
        }
    }

    const recycleCompareEl = document.getElementById('recycleCompare');
    if (recycleCompareEl) {
        if (recycle >= 60) recycleCompareEl.textContent = 'Excelente tasa de reciclaje';
        else if (recycle >= 30) recycleCompareEl.textContent = 'Buena, pero puedes mejorar';
        else if (state.wasteLog.length === 0) recycleCompareEl.textContent = 'Registra tus residuos';
        else recycleCompareEl.textContent = 'Necesitas reciclar mas';
    }
}

// ================================================
//  IMPACT COMPARISON
// ================================================
function updateImpact() {
    const co2 = calcTotalCO2();
    const water = calcDailyWater().total;
    const recycle = getRecycleRate();

    const impactCards = document.getElementById('impactCards');
    if (!impactCards) return;

    const co2Saved = Math.max(0, CHILE_AVG_CO2 - co2);
    const waterSaved = Math.max(0, CHILE_AVG_WATER - water);
    const treesEquiv = (co2 > 0) ? Math.round(co2 * 1000 / 22) : 0; // 1 tree absorbs ~22 kg CO2/year
    const bottlesEquiv = Math.round(water * 365 / 0.5); // 500ml bottles per year

    // National multiplier
    const nationalCO2Saved = co2Saved * CHILE_POPULATION;
    const nationalWaterSaved = waterSaved * CHILE_POPULATION;

    impactCards.innerHTML = `
        <div class="impact-card">
            <div class="impact-icon">\u{1F30D}</div>
            <div class="impact-value">${formatBigNumber(nationalCO2Saved)} ton</div>
            <div class="impact-desc">CO2 menos al ano si todos en Chile tuvieran tu huella</div>
        </div>
        <div class="impact-card">
            <div class="impact-icon">\u{1F4A7}</div>
            <div class="impact-value">${formatBigNumber(nationalWaterSaved * 365)} L</div>
            <div class="impact-desc">litros de agua ahorrados al ano a nivel nacional</div>
        </div>
        <div class="impact-card">
            <div class="impact-icon">\u{1F333}</div>
            <div class="impact-value">${treesEquiv}</div>
            <div class="impact-desc">arboles necesarios para absorber tu huella de carbono anual</div>
        </div>
        <div class="impact-card">
            <div class="impact-icon">\u{1FAD9}</div>
            <div class="impact-value">${formatBigNumber(bottlesEquiv)}</div>
            <div class="impact-desc">botellas de 500ml equivalentes a tu consumo de agua anual</div>
        </div>
    `;

    // Equivalences
    const equivGrid = document.getElementById('equivGrid');
    if (equivGrid) {
        const kgCO2 = co2 * 1000;
        const smartphoneCharges = Math.round(kgCO2 / 0.008); // ~8g per charge
        const carKm = Math.round(kgCO2 / 0.21);
        const flightKm = Math.round(kgCO2 / 0.255);
        const burgers = Math.round(kgCO2 / 3.6);

        equivGrid.innerHTML = `
            <div class="equiv-item">
                <span class="equiv-icon">\u{1F4F1}</span>
                <span class="equiv-val">${formatBigNumber(smartphoneCharges)}</span>
                <span class="equiv-desc">cargas de celular</span>
            </div>
            <div class="equiv-item">
                <span class="equiv-icon">\u{1F697}</span>
                <span class="equiv-val">${formatBigNumber(carKm)} km</span>
                <span class="equiv-desc">en auto a gasolina</span>
            </div>
            <div class="equiv-item">
                <span class="equiv-icon">\u{2708}\u{FE0F}</span>
                <span class="equiv-val">${formatBigNumber(flightKm)} km</span>
                <span class="equiv-desc">de vuelo en avion</span>
            </div>
            <div class="equiv-item">
                <span class="equiv-icon">\u{1F354}</span>
                <span class="equiv-val">${formatBigNumber(burgers)}</span>
                <span class="equiv-desc">hamburguesas de carne</span>
            </div>
        `;
    }

    // Tips
    updateTips(co2, water, recycle);
}

function updateTips(co2, water, recycle) {
    const tipsList = document.getElementById('tipsList');
    if (!tipsList) return;

    const tips = [];

    // Carbon tips
    if (co2 > CHILE_AVG_CO2) {
        tips.push({ icon: '\u{26A0}\u{FE0F}', text: 'Tu huella de carbono supera el promedio chileno. Considera reducir viajes en auto o cambiar a transporte publico.' });
    }
    if ((state.carbon.carType === 'gasoline' || state.carbon.carType === 'diesel') && state.carbon.kmWeek > 100) {
        tips.push({ icon: '\u{1F697}', text: 'Conducir mas de 100 km/semana en vehiculo de combustion genera alto impacto. Un hibrido o electrico reduciria hasta 75% tus emisiones de transporte.' });
    }
    if (state.carbon.flightsYear > 2) {
        tips.push({ icon: '\u{2708}\u{FE0F}', text: 'Cada vuelo emite aprox. 0.9 ton CO2e. Considera videoconferencias o trenes para viajes nacionales.' });
    }
    if (state.carbon.dietType === 'omnivore') {
        tips.push({ icon: '\u{1F969}', text: 'Una dieta omnivora produce 2.5 ton CO2e/ano. Reducir carne roja a 1-2 veces/semana ahorra hasta 0.8 toneladas.' });
    }

    // Water tips
    if (water > CHILE_AVG_WATER) {
        tips.push({ icon: '\u{1F4A7}', text: 'Tu consumo de agua supera el promedio chileno de 170 L/dia. Duchas mas cortas y riego eficiente pueden ayudar.' });
    }
    if (state.water.showerMin > 10) {
        tips.push({ icon: '\u{1F6BF}', text: 'Duchas de mas de 10 minutos usan +90 litros. Reduce a 5 minutos y ahorraras 45 litros por ducha.' });
    }
    if (state.water.gardenMin > 15) {
        tips.push({ icon: '\u{1F33F}', text: 'Regar mas de 15 min/dia es alto. Usa riego por goteo y riega temprano en la manana para evitar evaporacion.' });
    }

    // Waste tips
    if (recycle < 30 && state.wasteLog.length > 0) {
        tips.push({ icon: '\u{267B}\u{FE0F}', text: 'Tu tasa de reciclaje esta bajo 30%. Separa plasticos, vidrio, carton y metales. Muchas municipalidades tienen puntos limpios.' });
    }

    // General tips
    if (state.carbon.electricityKwh > 200) {
        tips.push({ icon: '\u{1F4A1}', text: 'Consumir mas de 200 kWh/mes es alto. Desconecta aparatos en standby y usa iluminacion LED.' });
    }

    if (tips.length === 0) {
        tips.push({ icon: '\u{2B50}', text: 'Tu impacto ambiental es bajo. Sigue asi y comparte tus habitos con otros para multiplicar el efecto.' });
    }

    tipsList.innerHTML = tips.map(t => `
        <div class="tip-item">
            <span class="tip-icon">${t.icon}</span>
            <span class="tip-text">${t.text}</span>
        </div>
    `).join('');
}

// ================================================
//  ECO-CHALLENGES
// ================================================
function updateChallenges() {
    const grid = document.getElementById('challengesGrid');
    if (!grid) return;

    grid.innerHTML = ECO_CHALLENGES.map(ch => {
        const done = state.challenges[ch.id]?.completed;
        return `
            <div class="challenge-card ${done ? 'completed' : ''}" data-id="${ch.id}">
                <div class="challenge-icon">${ch.icon}</div>
                <div class="challenge-info">
                    <h4>${ch.title}</h4>
                    <p>${ch.desc}</p>
                    <span class="challenge-points">+${ch.points} pts</span>
                </div>
                <button class="challenge-btn ${done ? 'done' : ''}" onclick="toggleChallenge('${ch.id}')">
                    ${done ? '\u{2705} Completado' : 'Completar'}
                </button>
            </div>
        `;
    }).join('');

    // Points & Level
    setText('totalPoints', state.points);
    const level = getEcoLevel(state.points);
    const levelEl = document.getElementById('ecoLevel');
    if (levelEl) {
        levelEl.textContent = `Nivel: ${level.name}`;
        levelEl.style.color = level.color;
    }
}

function toggleChallenge(id) {
    const ch = ECO_CHALLENGES.find(c => c.id === id);
    if (!ch) return;

    if (state.challenges[id]?.completed) {
        // Uncomplete
        state.challenges[id].completed = false;
        state.points = Math.max(0, state.points - ch.points);
    } else {
        // Complete
        state.challenges[id] = { completed: true, date: new Date().toISOString() };
        state.points += ch.points;
        state.pointsHistory.push({ date: new Date().toISOString(), points: state.points });
        showToast(`+${ch.points} puntos! ${ch.title} completado`);
    }

    saveState();
    updateChallenges();
    updateQuickStats();
    updateCharts();
}

// ================================================
//  CHARTS (Chart.js)
// ================================================
let scoreHistoryChartInstance = null;
let carbonBreakdownChartInstance = null;
let waterBreakdownChartInstance = null;
let waterTrendChartInstance = null;
let wasteHistoryChartInstance = null;
let pointsChartInstance = null;

const chartDefaults = {
    color: '#b0b8c8',
    borderColor: 'rgba(255,255,255,0.08)',
    font: { family: "'Inter', sans-serif" }
};

function updateCharts() {
    updateScoreHistoryChart();
    updateCarbonBreakdownChart();
    updateWaterBreakdownChart();
    updateWaterTrendChart();
    updateWasteHistoryChart();
    updatePointsChart();
}

function updateScoreHistoryChart() {
    const ctx = document.getElementById('scoreHistoryChart');
    if (!ctx) return;

    // Add today's score if not already logged today
    const today = new Date().toISOString().split('T')[0];
    const score = calcTerraScore();
    const existing = state.scoreHistory.findIndex(e => e.date === today);
    if (existing >= 0) {
        state.scoreHistory[existing].score = score;
    } else {
        state.scoreHistory.push({ date: today, score });
    }
    // Keep last 30 days
    state.scoreHistory = state.scoreHistory.slice(-30);

    const labels = state.scoreHistory.map(e => {
        const d = new Date(e.date);
        return `${d.getDate()}/${d.getMonth() + 1}`;
    });
    const data = state.scoreHistory.map(e => e.score);

    if (scoreHistoryChartInstance) scoreHistoryChartInstance.destroy();
    scoreHistoryChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'TerraScore',
                data,
                borderColor: '#00f0ff',
                backgroundColor: 'rgba(0, 240, 255, 0.1)',
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#00f0ff',
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { min: 0, max: 100, ticks: { color: chartDefaults.color }, grid: { color: chartDefaults.borderColor } },
                x: { ticks: { color: chartDefaults.color, maxRotation: 45 }, grid: { color: chartDefaults.borderColor } }
            }
        }
    });
}

function updateCarbonBreakdownChart() {
    const ctx = document.getElementById('carbonBreakdownChart');
    if (!ctx) return;

    const transport = calcTransportCO2();
    const home = calcHomeCO2();
    const food = calcFoodCO2();

    if (carbonBreakdownChartInstance) carbonBreakdownChartInstance.destroy();
    carbonBreakdownChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Transporte', 'Hogar', 'Alimentacion'],
            datasets: [{
                data: [transport, home, food],
                backgroundColor: ['#f97316', '#a855f7', '#22c55e'],
                borderColor: 'rgba(0,0,0,0.3)',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: chartDefaults.color, font: { size: 12 }, padding: 16 }
                },
                tooltip: {
                    callbacks: {
                        label: (ctx) => `${ctx.label}: ${ctx.parsed.toFixed(2)} ton CO2e`
                    }
                }
            }
        }
    });
}

function updateWaterBreakdownChart() {
    const ctx = document.getElementById('waterBreakdownChart');
    if (!ctx) return;

    const w = calcDailyWater();

    if (waterBreakdownChartInstance) waterBreakdownChartInstance.destroy();
    waterBreakdownChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Ducha', 'Lavadora', 'Loza', 'Jardin', 'WC'],
            datasets: [{
                data: [w.shower, w.laundry, w.dishes, w.garden, w.toilet],
                backgroundColor: ['#3b82f6', '#8b5cf6', '#06b6d4', '#22c55e', '#f59e0b'],
                borderColor: 'rgba(0,0,0,0.3)',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: chartDefaults.color, font: { size: 12 }, padding: 16 }
                },
                tooltip: {
                    callbacks: {
                        label: (ctx) => `${ctx.label}: ${Math.round(ctx.parsed)} L/dia`
                    }
                }
            }
        }
    });
}

function updateWaterTrendChart() {
    const ctx = document.getElementById('waterTrendChart');
    if (!ctx) return;

    const labels = state.waterLog.slice(-30).map(e => {
        const d = new Date(e.date);
        return `${d.getDate()}/${d.getMonth() + 1}`;
    });
    const data = state.waterLog.slice(-30).map(e => e.liters);

    if (waterTrendChartInstance) waterTrendChartInstance.destroy();
    waterTrendChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels.length > 0 ? labels : ['Sin datos'],
            datasets: [{
                label: 'Litros/dia',
                data: data.length > 0 ? data : [0],
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 3
            }, {
                label: 'Promedio Chile',
                data: Array(Math.max(labels.length, 1)).fill(CHILE_AVG_WATER),
                borderColor: 'rgba(251, 191, 36, 0.6)',
                borderDash: [5, 5],
                pointRadius: 0,
                fill: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { labels: { color: chartDefaults.color } } },
            scales: {
                y: { beginAtZero: true, ticks: { color: chartDefaults.color }, grid: { color: chartDefaults.borderColor } },
                x: { ticks: { color: chartDefaults.color, maxRotation: 45 }, grid: { color: chartDefaults.borderColor } }
            }
        }
    });
}

function updateWasteHistoryChart() {
    const ctx = document.getElementById('wasteHistoryChart');
    if (!ctx) return;

    const recent = state.wasteLog.slice(-12);
    const labels = recent.map((e, i) => {
        const d = new Date(e.date);
        return `Sem ${d.getDate()}/${d.getMonth() + 1}`;
    });

    if (wasteHistoryChartInstance) wasteHistoryChartInstance.destroy();
    wasteHistoryChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels.length > 0 ? labels : ['Sin datos'],
            datasets: [
                {
                    label: 'Reciclaje',
                    data: recent.map(e => e.recycling),
                    backgroundColor: '#22c55e'
                },
                {
                    label: 'Organico',
                    data: recent.map(e => e.organic),
                    backgroundColor: '#f59e0b'
                },
                {
                    label: 'General',
                    data: recent.map(e => e.general),
                    backgroundColor: '#ef4444'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { labels: { color: chartDefaults.color } },
                tooltip: {
                    callbacks: {
                        label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y} kg`
                    }
                }
            },
            scales: {
                x: { stacked: true, ticks: { color: chartDefaults.color }, grid: { color: chartDefaults.borderColor } },
                y: { stacked: true, beginAtZero: true, ticks: { color: chartDefaults.color }, grid: { color: chartDefaults.borderColor },
                    title: { display: true, text: 'kg', color: chartDefaults.color } }
            }
        }
    });
}

function updatePointsChart() {
    const ctx = document.getElementById('pointsChart');
    if (!ctx) return;

    const recent = state.pointsHistory.slice(-20);
    const labels = recent.map(e => {
        const d = new Date(e.date);
        return `${d.getDate()}/${d.getMonth() + 1}`;
    });
    const data = recent.map(e => e.points);

    if (pointsChartInstance) pointsChartInstance.destroy();
    pointsChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels.length > 0 ? labels : ['Sin datos'],
            datasets: [{
                label: 'Puntos',
                data: data.length > 0 ? data : [0],
                borderColor: '#00f0ff',
                backgroundColor: 'rgba(0, 240, 255, 0.1)',
                fill: true,
                tension: 0.3,
                pointRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, ticks: { color: chartDefaults.color }, grid: { color: chartDefaults.borderColor } },
                x: { ticks: { color: chartDefaults.color }, grid: { color: chartDefaults.borderColor } }
            }
        }
    });
}

// ================================================
//  EVENT LISTENERS
// ================================================
function initListeners() {
    // Carbon inputs
    const carbonInputs = ['kmWeek', 'carType', 'flightsYear', 'publicTransport', 'electricityKwh', 'gasM3', 'heatingType', 'heatingMonths', 'dietType', 'foodWaste', 'localFood'];
    carbonInputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', () => {
                if (id === 'foodWaste') updateRangeLabel('foodWaste', 'foodWasteVal', '%');
                if (id === 'localFood') updateRangeLabel('localFood', 'localFoodVal', '%');
                updateAll();
            });
        }
    });

    // Water inputs
    const waterInputs = ['showerMin', 'showersDay', 'laundryWeek', 'dishwashing', 'gardenMin', 'toiletFlushes', 'toiletType'];
    waterInputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', () => updateAll());
    });

    // Log waste button
    const logWasteBtn = document.getElementById('logWasteBtn');
    if (logWasteBtn) {
        logWasteBtn.addEventListener('click', () => {
            const recycling = parseFloat(document.getElementById('wasteRecycling')?.value) || 0;
            const organic = parseFloat(document.getElementById('wasteOrganic')?.value) || 0;
            const general = parseFloat(document.getElementById('wasteGeneral')?.value) || 0;

            if (recycling + organic + general === 0) {
                showToast('Ingresa al menos un tipo de residuo');
                return;
            }

            state.wasteLog.push({
                date: new Date().toISOString(),
                recycling, organic, general
            });

            // Keep last 52 weeks
            state.wasteLog = state.wasteLog.slice(-52);
            saveState();
            updateAll();
            showToast('Registro de residuos guardado');

            // Reset inputs
            document.getElementById('wasteRecycling').value = 0;
            document.getElementById('wasteOrganic').value = 0;
            document.getElementById('wasteGeneral').value = 0;
        });
    }

    // Log water button
    const logWaterBtn = document.getElementById('logWaterBtn');
    if (logWaterBtn) {
        logWaterBtn.addEventListener('click', () => {
            const liters = calcDailyWater().total;
            const today = new Date().toISOString().split('T')[0];

            // Check if already logged today
            const existing = state.waterLog.findIndex(e => e.date.startsWith(today));
            if (existing >= 0) {
                state.waterLog[existing].liters = Math.round(liters);
            } else {
                state.waterLog.push({ date: new Date().toISOString(), liters: Math.round(liters) });
            }

            // Keep last 90 days
            state.waterLog = state.waterLog.slice(-90);
            saveState();
            updateAll();
            showToast('Consumo de agua registrado');
        });
    }
}

// ================================================
//  PWA INSTALL
// ================================================
let deferredInstallPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    const prompt = document.getElementById('installPrompt');
    if (prompt) prompt.classList.remove('hidden');
});

document.getElementById('installBtn')?.addEventListener('click', async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    const result = await deferredInstallPrompt.userChoice;
    if (result.outcome === 'accepted') {
        document.getElementById('installPrompt')?.classList.add('hidden');
    }
    deferredInstallPrompt = null;
});

// ================================================
//  HELPERS
// ================================================
function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

function setBarWidth(id, pct) {
    const el = document.getElementById(id);
    if (el) el.style.width = Math.min(100, Math.max(0, pct)) + '%';
}

function animateNumber(id, target) {
    const el = document.getElementById(id);
    if (!el) return;
    const start = parseInt(el.textContent) || 0;
    const duration = 1200;
    const startTime = performance.now();

    function step(time) {
        const elapsed = time - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
        const current = Math.round(start + (target - start) * eased);
        el.textContent = current;
        if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
}

function formatBigNumber(n) {
    if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + ' B';
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + ' M';
    if (n >= 1_000) return (n / 1_000).toFixed(1) + ' K';
    return Math.round(n).toLocaleString('es-CL');
}

function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3000);
}

// ================================================
//  SERVICE WORKER REGISTRATION
// ================================================
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
}

// ================================================
//  INIT
// ================================================
document.addEventListener('DOMContentLoaded', () => {
    initParticles();
    initNav();
    restoreInputs();
    initListeners();
    updateAll();
});
