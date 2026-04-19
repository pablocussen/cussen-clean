// Artemis II Multi-Scale Scientific Viewer
// Scale A: Solar System (heliocentric, ECLIPJ2000, real positions from SPICE DE440)
// Scale B: Lunar flyby (Moon-centered, IAU_MOON, synthesized Artemis II trajectory)

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const container = document.getElementById('moon-globe');
if (!container) throw new Error('Missing #moon-globe');

const W = () => container.clientWidth;
const H = () => container.clientHeight || 520;

// Overlay for 2D labels
const labelLayer = document.createElement('div');
labelLayer.className = 'globe-labels';
Object.assign(labelLayer.style, {
    position: 'absolute',
    inset: '0',
    pointerEvents: 'none',
    zIndex: '2',
});
container.style.position = 'relative';
container.appendChild(labelLayer);

// ═══════════════════════════════════════════════
// RENDERER + SCENE
// ═══════════════════════════════════════════════
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050810);

const camera = new THREE.PerspectiveCamera(45, W() / H(), 0.001, 10000);
camera.position.set(0, 30, 70);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(W(), H());
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.9;
container.appendChild(renderer.domElement);

const loader = new THREE.TextureLoader();

// ═══════════════════════════════════════════════
// SOLAR SYSTEM GROUP (Scale A)
// ═══════════════════════════════════════════════
const solarRoot = new THREE.Group();
scene.add(solarRoot);

// Ecliptic plane grid (subtle)
const gridHelper = new THREE.PolarGridHelper(70, 12, 8, 64, 0x1e293b, 0x0f172a);
gridHelper.material.transparent = true;
gridHelper.material.opacity = 0.35;
solarRoot.add(gridHelper);

// Unit scale: 1 unit = 1 AU compressed via sqrt (so all planets visible)
const AU_SCALE = (au) => au > 0 ? Math.pow(au, 0.6) * 4 : 0;

// Distance rings at canonical AU (for scientific reference)
function addRing(au, color = 0x334155, opacity = 0.25) {
    const r = AU_SCALE(au);
    const curve = new THREE.EllipseCurve(0, 0, r, r, 0, Math.PI * 2);
    const pts = curve.getPoints(128).map(p => new THREE.Vector3(p.x, 0, p.y));
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity });
    solarRoot.add(new THREE.Line(geo, mat));
    return r;
}

// ── Sun ──
const SUN_SIZE = 1.6;
const sunGeo = new THREE.SphereGeometry(SUN_SIZE, 48, 48);
const sunTex = loader.load('assets/planets/sun.jpg');
sunTex.colorSpace = THREE.SRGBColorSpace;
const sunMat = new THREE.MeshBasicMaterial({ map: sunTex });
const sunMesh = new THREE.Mesh(sunGeo, sunMat);
solarRoot.add(sunMesh);

// Corona subtle
const coronaGeo = new THREE.SphereGeometry(SUN_SIZE * 1.25, 32, 32);
const coronaMat = new THREE.MeshBasicMaterial({
    color: 0xffd88a, transparent: true, opacity: 0.15, side: THREE.BackSide,
});
solarRoot.add(new THREE.Mesh(coronaGeo, coronaMat));

// Point light
const sunLight = new THREE.PointLight(0xffffff, 2.5, 0, 0);
solarRoot.add(sunLight);
scene.add(new THREE.AmbientLight(0x334155, 0.35));

// ── Planets ──
let solarSystemData = null;
const planets = [];

fetch('assets/solar_system.json')
    .then(r => r.json())
    .then(data => {
        solarSystemData = data;
        buildPlanets(data);
    });

function buildPlanets(data) {
    data.bodies.slice(1).forEach(b => {
        const dist = AU_SCALE(b.dist_au);
        // Log size so outer planets are visible without swallowing inner ones
        const size = 0.12 + Math.log10(b.radius_km / 1000 + 1) * 0.18;
        const geo = new THREE.SphereGeometry(size, 32, 32);
        const texPath = `assets/planets/${b.name.toLowerCase()}.jpg`;
        const tex = loader.load(texPath);
        tex.colorSpace = THREE.SRGBColorSpace;
        const mat = new THREE.MeshStandardMaterial({
            map: tex,
            roughness: 0.9,
            metalness: 0.0,
        });
        const mesh = new THREE.Mesh(geo, mat);
        // Position on ecliptic plane using actual ecliptic longitude
        const angle = Math.atan2(b.pos_au[1], b.pos_au[0]);
        mesh.position.set(dist * Math.cos(angle), 0, dist * Math.sin(angle));
        mesh.rotation.z = (b.tilt_deg || 0) * Math.PI / 180;
        solarRoot.add(mesh);

        // Orbit ring at real compressed distance
        const curve = new THREE.EllipseCurve(0, 0, dist, dist, 0, Math.PI * 2);
        const pts = curve.getPoints(128).map(p => new THREE.Vector3(p.x, 0, p.y));
        const orbGeo = new THREE.BufferGeometry().setFromPoints(pts);
        const isEarth = b.name === 'Earth';
        const orbMat = new THREE.LineBasicMaterial({
            color: isEarth ? 0x06b6d4 : 0x475569,
            transparent: true,
            opacity: isEarth ? 0.7 : 0.35,
        });
        solarRoot.add(new THREE.Line(orbGeo, orbMat));

        // Saturn rings
        if (b.name === 'Saturn') {
            const ringGeo = new THREE.RingGeometry(size * 1.35, size * 2.2, 64);
            const ringTex = loader.load('assets/planets/saturn_rings.jpg');
            const ringMat = new THREE.MeshBasicMaterial({
                map: ringTex, side: THREE.DoubleSide,
                transparent: true, opacity: 0.75,
            });
            const ring = new THREE.Mesh(ringGeo, ringMat);
            ring.rotation.x = Math.PI / 2.1;
            mesh.add(ring);
        }

        // HTML label
        const label = document.createElement('div');
        label.className = 'planet-label' + (isEarth ? ' highlight' : '');
        label.innerHTML = `<span class="pl-name">${b.name.toUpperCase()}</span><span class="pl-dist">${b.dist_au.toFixed(2)} AU</span>`;
        labelLayer.appendChild(label);

        planets.push({ mesh, data: b, dist, angle, label, size });
    });
}

// Sun label
const sunLabel = document.createElement('div');
sunLabel.className = 'planet-label sun-label';
sunLabel.innerHTML = '<span class="pl-name">SOL</span><span class="pl-dist">0.00 AU</span>';
labelLayer.appendChild(sunLabel);

// Scale indicator (static, bottom-left of overlay)
const scaleIndicator = document.createElement('div');
scaleIndicator.className = 'scale-indicator';
scaleIndicator.innerHTML = `
    <div class="si-title">ESCALA</div>
    <div class="si-bar"></div>
    <div class="si-label">1 AU = 149.6 ×10⁶ km</div>
    <div class="si-ref">Época: 2026-04-08 12:00 UTC</div>
    <div class="si-ref">Marco: ECLIPJ2000 heliocéntrico</div>
    <div class="si-ref">Fuente: NAIF SPICE DE440</div>
`;
labelLayer.appendChild(scaleIndicator);

// ═══════════════════════════════════════════════
// LUNAR SCALE (Scale B)
// ═══════════════════════════════════════════════
const lunarRoot = new THREE.Group();
lunarRoot.visible = false;
scene.add(lunarRoot);

const moonRadius = 1.5;
const moonGeo = new THREE.SphereGeometry(moonRadius, 96, 96);
const moonMat = new THREE.MeshStandardMaterial({
    color: 0xcccccc, roughness: 0.95, metalness: 0.0,
});
loader.load('assets/moon_texture_2k.jpg', (tex) => {
    tex.colorSpace = THREE.SRGBColorSpace;
    moonMat.map = tex;
    moonMat.needsUpdate = true;
});
loader.load('assets/moon_displacement_2k.jpg', (tex) => {
    moonMat.bumpMap = tex;
    moonMat.bumpScale = 0.015;
    moonMat.needsUpdate = true;
});
const moonMesh = new THREE.Mesh(moonGeo, moonMat);
moonMesh.rotation.y = Math.PI;
lunarRoot.add(moonMesh);

// CLPI-ART overlay as a slightly larger translucent sphere
const clpiGeo = new THREE.SphereGeometry(moonRadius * 1.003, 96, 96);
const clpiMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.8,
    depthWrite: false,
    side: THREE.FrontSide,
});
loader.load('assets/clpi_art_texture.png', (tex) => {
    tex.colorSpace = THREE.SRGBColorSpace;
    clpiMat.map = tex;
    clpiMat.needsUpdate = true;
});
const clpiOverlay = new THREE.Mesh(clpiGeo, clpiMat);
clpiOverlay.rotation.y = Math.PI;
clpiOverlay.visible = true;
lunarRoot.add(clpiOverlay);

const moonLight = new THREE.DirectionalLight(0xffffff, 2.0);
moonLight.position.set(10, 5, 10);
lunarRoot.add(moonLight);
lunarRoot.add(new THREE.AmbientLight(0xffffff, 0.18));

// Earth direction indicator
const earthDirGeo = new THREE.SphereGeometry(0.35, 24, 24);
const earthDirMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
const earthDir = new THREE.Mesh(earthDirGeo, earthDirMat);
earthDir.position.set(-15, 0, 0);
lunarRoot.add(earthDir);

// Line from Moon to Earth
const earthLineGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(-15, 0, 0),
]);
const earthLineMat = new THREE.LineDashedMaterial({ color: 0x06b6d4, dashSize: 0.3, gapSize: 0.2, transparent: true, opacity: 0.4 });
const earthLine = new THREE.Line(earthLineGeo, earthLineMat);
earthLine.computeLineDistances();
lunarRoot.add(earthLine);

// Earth label (2D overlay, only visible in lunar mode)
const earthLabel = document.createElement('div');
earthLabel.className = 'planet-label earth-label';
earthLabel.style.display = 'none';
earthLabel.innerHTML = '<span class="pl-name">TIERRA</span><span class="pl-dist">384,400 km</span>';
labelLayer.appendChild(earthLabel);

const moonLabel = document.createElement('div');
moonLabel.className = 'planet-label moon-label';
moonLabel.style.display = 'none';
moonLabel.innerHTML = '<span class="pl-name">LUNA</span><span class="pl-dist">R = 1,737 km</span>';
labelLayer.appendChild(moonLabel);

// Trajectory
let orionMarker = null;
let orionTrail = null;
let animIndex = 0;
let closestApproachData = null;
const hotspotMarkers = [];

fetch('assets/trajectory.json')
    .then(r => r.json())
    .then(data => {
        closestApproachData = data.closest_approach;
        buildTrajectory(data);
    });

fetch('assets/clpi_art.json')
    .then(r => r.json())
    .then(data => buildHotspots(data.top_hotspots));

function buildHotspots(hotspots) {
    hotspots.forEach(h => {
        const pos = latlonToVec3(h.lat_deg, h.lon_deg, moonRadius * 1.02);
        // Bright marker — red for #1, orange for others
        const color = h.rank === 1 ? 0xef4444 : 0xf97316;
        const geo = new THREE.SphereGeometry(0.035, 16, 16);
        const mat = new THREE.MeshBasicMaterial({ color });
        const marker = new THREE.Mesh(geo, mat);
        marker.position.copy(pos);
        lunarRoot.add(marker);

        // Outward-pointing ring (oriented away from Moon center)
        const ringGeo = new THREE.RingGeometry(0.05, 0.065, 24);
        const ringMat = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, transparent: true, opacity: 0.75 });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.position.copy(pos);
        ring.lookAt(new THREE.Vector3(0, 0, 0));
        lunarRoot.add(ring);

        // HTML label
        const label = document.createElement('div');
        label.className = 'planet-label hotspot-label';
        label.style.display = 'none';
        label.innerHTML = `<span class="pl-name">#${h.rank} ${h.region.toUpperCase()}</span><span class="pl-dist">CLPI-ART ${h.score.toFixed(0)}/100</span>`;
        labelLayer.appendChild(label);
        marker.userData.label = label;
        hotspotMarkers.push(marker);
    });
}

function latlonToVec3(lat, lon, r) {
    const phi = (90 - lat) * Math.PI / 180;
    const theta = (lon + 180) * Math.PI / 180;
    return new THREE.Vector3(
        -r * Math.sin(phi) * Math.cos(theta),
         r * Math.cos(phi),
         r * Math.sin(phi) * Math.sin(theta)
    );
}

function buildTrajectory(data) {
    const MAX = 10; // max distance in moon radii to display
    const points = [];
    data.orion_moon_fixed_units.forEach(p => {
        const v = new THREE.Vector3(p[0], p[1], p[2]);
        const len = v.length();
        if (len > MAX) v.normalize().multiplyScalar(MAX);
        points.push(new THREE.Vector3(
            v.x * moonRadius,
            v.z * moonRadius,
            -v.y * moonRadius
        ));
    });

    const curve = new THREE.CatmullRomCurve3(points);
    const tubeGeo = new THREE.TubeGeometry(curve, 400, 0.02, 8, false);
    const tubeMat = new THREE.MeshBasicMaterial({
        color: 0xfbbf24, transparent: true, opacity: 0.85,
    });
    const tube = new THREE.Mesh(tubeGeo, tubeMat);
    lunarRoot.add(tube);

    orionTrail = { points };

    // Orion spacecraft marker
    const orionGeo = new THREE.SphereGeometry(0.05, 16, 16);
    orionMarker = new THREE.Mesh(orionGeo, new THREE.MeshBasicMaterial({ color: 0xfbbf24 }));
    lunarRoot.add(orionMarker);

    // Closest approach
    const cp = data.closest_approach.orion_moon_fixed_units;
    const cpVec = new THREE.Vector3(cp[0] * moonRadius, cp[2] * moonRadius, -cp[1] * moonRadius);
    const cpLen = cpVec.length();
    if (cpLen > MAX * moonRadius) cpVec.normalize().multiplyScalar(MAX * moonRadius);
    const cpGeo = new THREE.SphereGeometry(0.06, 16, 16);
    const cpMarker = new THREE.Mesh(cpGeo, new THREE.MeshBasicMaterial({ color: 0xef4444 }));
    cpMarker.position.copy(cpVec);
    lunarRoot.add(cpMarker);

    // Orion + CP labels
    const orionLabel = document.createElement('div');
    orionLabel.className = 'planet-label orion-label';
    orionLabel.style.display = 'none';
    orionLabel.innerHTML = '<span class="pl-name">ORION</span><span class="pl-dist">Artemis II</span>';
    labelLayer.appendChild(orionLabel);
    orionMarker.userData.label = orionLabel;

    const cpLabel = document.createElement('div');
    cpLabel.className = 'planet-label cp-label';
    cpLabel.style.display = 'none';
    cpLabel.innerHTML = `<span class="pl-name">CERCANÍA MÁX.</span><span class="pl-dist">${data.closest_approach.altitude_km.toFixed(0)} km</span>`;
    labelLayer.appendChild(cpLabel);
    cpMarker.userData.label = cpLabel;
}

// ═══════════════════════════════════════════════
// SCALE CONTROL
// ═══════════════════════════════════════════════
let currentMode = 'solar'; // 'solar' | 'lunar'
let camDistance = 70;
let rotY = 0, rotX = 0.35;
let autoRotate = true;
let isDragging = false;
let prevX = 0, prevY = 0;

window.setMoonGlobeScale = (s) => {
    if (s === 0 || s === 'solar') {
        currentMode = 'solar';
        solarRoot.visible = true;
        lunarRoot.visible = false;
        camDistance = 70;
        rotX = 0.35;
        // Show solar labels, hide lunar
        labelLayer.querySelectorAll('.planet-label').forEach(l => {
            const isLunar = l.classList.contains('earth-label') || l.classList.contains('moon-label') || l.classList.contains('orion-label') || l.classList.contains('cp-label') || l.classList.contains('hotspot-label');
            l.style.display = isLunar ? 'none' : '';
        });
    } else {
        currentMode = 'lunar';
        solarRoot.visible = false;
        lunarRoot.visible = true;
        camDistance = 8;
        rotX = 0.2;
        labelLayer.querySelectorAll('.planet-label').forEach(l => {
            const isLunar = l.classList.contains('earth-label') || l.classList.contains('moon-label') || l.classList.contains('orion-label') || l.classList.contains('cp-label') || l.classList.contains('hotspot-label');
            l.style.display = isLunar ? '' : 'none';
        });
    }
};

// ═══════════════════════════════════════════════
// INTERACTION
// ═══════════════════════════════════════════════
const canvas = renderer.domElement;
canvas.style.cursor = 'grab';

canvas.addEventListener('mousedown', (e) => {
    isDragging = true; autoRotate = false;
    prevX = e.clientX; prevY = e.clientY;
    canvas.style.cursor = 'grabbing';
});
canvas.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    rotY += (e.clientX - prevX) * 0.005;
    rotX += (e.clientY - prevY) * 0.005;
    rotX = Math.max(-1.4, Math.min(1.4, rotX));
    prevX = e.clientX; prevY = e.clientY;
});
window.addEventListener('mouseup', () => { isDragging = false; canvas.style.cursor = 'grab'; });

canvas.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 1) return;
    isDragging = true; autoRotate = false;
    prevX = e.touches[0].clientX; prevY = e.touches[0].clientY;
}, { passive: true });
canvas.addEventListener('touchmove', (e) => {
    if (!isDragging || e.touches.length !== 1) return;
    rotY += (e.touches[0].clientX - prevX) * 0.005;
    rotX += (e.touches[0].clientY - prevY) * 0.005;
    rotX = Math.max(-1.4, Math.min(1.4, rotX));
    prevX = e.touches[0].clientX; prevY = e.touches[0].clientY;
}, { passive: true });
canvas.addEventListener('touchend', () => { isDragging = false; });

canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 1.08 : 0.92;
    if (currentMode === 'solar') {
        camDistance = Math.max(15, Math.min(200, camDistance * factor));
    } else {
        camDistance = Math.max(3, Math.min(20, camDistance * factor));
    }
}, { passive: false });

window.addEventListener('resize', () => {
    camera.aspect = W() / H();
    camera.updateProjectionMatrix();
    renderer.setSize(W(), H());
});

// ═══════════════════════════════════════════════
// LABEL PROJECTION
// ═══════════════════════════════════════════════
function updateLabels() {
    const rect = container.getBoundingClientRect();
    const projectTo2D = (worldPos) => {
        const v = worldPos.clone().project(camera);
        return {
            x: (v.x * 0.5 + 0.5) * rect.width,
            y: (-v.y * 0.5 + 0.5) * rect.height,
            z: v.z,
        };
    };

    if (currentMode === 'solar') {
        // Sun
        const sunP = projectTo2D(new THREE.Vector3(0, 0, 0));
        sunLabel.style.transform = `translate(${sunP.x}px, ${sunP.y}px)`;
        sunLabel.style.opacity = sunP.z > 1 ? 0 : 1;

        planets.forEach(({ mesh, data, label }) => {
            const p = projectTo2D(mesh.position);
            label.style.transform = `translate(${p.x}px, ${p.y}px)`;
            label.style.opacity = p.z > 1 ? 0 : 1;
        });
    } else {
        // Lunar mode
        const moonP = projectTo2D(new THREE.Vector3(0, 0, 0));
        moonLabel.style.transform = `translate(${moonP.x}px, ${moonP.y}px)`;
        moonLabel.style.opacity = moonP.z > 1 ? 0 : 1;

        const earthP = projectTo2D(earthDir.position);
        earthLabel.style.transform = `translate(${earthP.x}px, ${earthP.y}px)`;
        earthLabel.style.opacity = earthP.z > 1 ? 0 : 1;

        if (orionMarker && orionMarker.userData.label) {
            const p = projectTo2D(orionMarker.position);
            orionMarker.userData.label.style.transform = `translate(${p.x}px, ${p.y}px)`;
            orionMarker.userData.label.style.opacity = p.z > 1 ? 0 : 1;
        }

        // Hotspots
        hotspotMarkers.forEach(m => {
            if (!m.userData.label) return;
            const p = projectTo2D(m.position);
            // Occlusion check — only show if on near side of moon relative to camera
            const worldPos = m.position.clone();
            const camToPoint = worldPos.clone().sub(camera.position);
            const camToCenter = new THREE.Vector3(0, 0, 0).sub(camera.position);
            const dot = camToPoint.normalize().dot(camToCenter.normalize());
            const visible = p.z < 1 && dot > 0.15;
            m.userData.label.style.display = visible ? '' : 'none';
            m.userData.label.style.transform = `translate(${p.x}px, ${p.y}px)`;
        });
    }
}

// ═══════════════════════════════════════════════
// ANIMATION
// ═══════════════════════════════════════════════
function animate() {
    requestAnimationFrame(animate);

    if (autoRotate) rotY += 0.0012;

    camera.position.x = camDistance * Math.sin(rotY) * Math.cos(rotX);
    camera.position.y = camDistance * Math.sin(rotX);
    camera.position.z = camDistance * Math.cos(rotY) * Math.cos(rotX);
    camera.lookAt(0, 0, 0);

    // Rotate sun + planets
    if (currentMode === 'solar' && sunMesh) {
        sunMesh.rotation.y += 0.002;
        planets.forEach(p => {
            p.mesh.rotation.y += 0.004;
            // Gentle orbital motion
            p.angle += 0.0006 / Math.max(0.5, p.data.orbit_years);
            p.mesh.position.x = p.dist * Math.cos(p.angle);
            p.mesh.position.z = p.dist * Math.sin(p.angle);
        });
    }

    if (currentMode === 'lunar') {
        moonMesh.rotation.y += 0.002;
        if (orionTrail && orionMarker) {
            animIndex = (animIndex + 0.2) % orionTrail.points.length;
            const i = Math.floor(animIndex);
            const next = (i + 1) % orionTrail.points.length;
            const t = animIndex - i;
            const pos = orionTrail.points[i].clone().lerp(orionTrail.points[next], t);
            orionMarker.position.copy(pos);
        }
    }

    updateLabels();
    renderer.render(scene, camera);
}
animate();
setMoonGlobeScale('solar');
