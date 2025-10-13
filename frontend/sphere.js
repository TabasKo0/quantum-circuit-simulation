// sphere.js – Bloch and Q Sphere renderer for single-page setup (no tabs)

let scene, camera, renderer, controls;
let blochSphereObjects = [];
let qSphereObjects = [];
let axesObjects = [];
let stateVectorArrow;
let initialized = false;

// Default state: 2 qubit |00⟩
let state = {
    alpha: { real: 1, imag: 0 },
    beta: { real: 0, imag: 0 },
    gamma: { real: 0, imag: 0 },
    delta: { real: 0, imag: 0 }
};
let mode = 'single'; // 'single' or 'dual'

const complex = {
    abs: (c) => Math.sqrt(c.real * c.real + c.imag * c.imag),
    arg: (c) => Math.atan2(c.imag, c.real),
    format: (c, precision = 2) => {
        if (Math.abs(c.real) < 1e-9 && Math.abs(c.imag) < 1e-9) return "0.00";
        const realPart = Math.abs(c.real) > 1e-9 ? c.real.toFixed(precision) : null;
        const imagPart = Math.abs(c.imag) > 1e-9 ? c.imag.toFixed(precision) : null;
        if (realPart && imagPart) {
            return `${realPart} ${c.imag >= 0 ? '+' : '-'} ${Math.abs(c.imag).toFixed(precision)}i`;
        }
        return realPart ? `${realPart}` : `${imagPart}i`;
    },
    multiply: (c1, c2) => ({
        real: c1.real * c2.real - c1.imag * c2.imag,
        imag: c1.real * c2.imag + c1.imag * c2.real
    }),
    negate: (c) => ({ real: -c.real, imag: -c.imag })
};

function resetScene() {
    if (scene) {
        blochSphereObjects.forEach(obj => scene.remove(obj));
        qSphereObjects.forEach(obj => scene.remove(obj));
        axesObjects.forEach(obj => scene.remove(obj));
        blochSphereObjects = [];
        qSphereObjects = [];
        axesObjects = [];
    }
}

function drawAxes(length = 1.5) {
    const xMat = new THREE.LineBasicMaterial({ color: 0xff7777, transparent: true, opacity: 0.25 });
    const xGeom = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-length, 0, 0), new THREE.Vector3(length, 0, 0)
    ]);
    const xLine = new THREE.Line(xGeom, xMat);
    scene.add(xLine); axesObjects.push(xLine);

    const yMat = new THREE.LineBasicMaterial({ color: 0x77ff77, transparent: true, opacity: 0.25 });
    const yGeom = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, -length, 0), new THREE.Vector3(0, length, 0)
    ]);
    const yLine = new THREE.Line(yGeom, yMat);
    scene.add(yLine); axesObjects.push(yLine);

    const zMat = new THREE.LineBasicMaterial({ color: 0x7777ff, transparent: true, opacity: 0.25 });
    const zGeom = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, -length), new THREE.Vector3(0, 0, length)
    ]);
    const zLine = new THREE.Line(zGeom, zMat);
    scene.add(zLine); axesObjects.push(zLine);
    const fontLoader = new THREE.FontLoader();
        fontLoader.load('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/fonts/helvetiker_regular.typeface.json', function (font) {
            const textMaterial = (color) => new THREE.MeshBasicMaterial({ color: color });
            const textParams = { font: font, size: 0.1, height: 0.01 };
            const label0 = new THREE.Mesh(new THREE.TextGeometry('|0 >', textParams), textMaterial(0xaaaaff));
            label0.position.set(0.05, 1.1, 0);
            scene.add(label0);
            const label1 = new THREE.Mesh(new THREE.TextGeometry('|1 >', textParams), textMaterial(0xaaaaff));
            label1.position.set(0.05, -1.25, 0);
            scene.add(label1);
            const labelX = new THREE.Mesh(new THREE.TextGeometry('X', textParams), textMaterial(0xffaaaa));
            labelX.position.set(1.1, 0.05, 0);
            scene.add(labelX);
            const labelX_ = new THREE.Mesh(new THREE.TextGeometry('X\'', textParams), textMaterial(0xffaaaa));
            labelX_.position.set(-1.25, 0.05, 0);
            scene.add(labelX_);
            const labelY = new THREE.Mesh(new THREE.TextGeometry('Y', textParams), textMaterial(0xaaffaa));
            labelY.position.set(0.05, 0.05, 1.1);
            scene.add(labelY);
            const labelY_ = new THREE.Mesh(new THREE.TextGeometry('Y\'', textParams), textMaterial(0xffaaaa));
            labelY_.position.set(0, 0.05,-1.25 );
            scene.add(labelY_);
        });
}

function drawBlochSphere() {
    const geometry = new THREE.SphereGeometry(1, 32, 32);
    const material = new THREE.MeshPhongMaterial({ color: 0x44aaff, transparent: true, opacity: 0.2, shininess: 50 });
    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere); blochSphereObjects.push(sphere);

    // Equator ring
    const ringGeometry = new THREE.RingGeometry(1, 1, 64);
    const ringMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3, side: THREE.DoubleSide });
    const equator = new THREE.Mesh(ringGeometry, ringMaterial);
    equator.rotation.x = Math.PI / 2;
    scene.add(equator); blochSphereObjects.push(equator);

    // State Vector Arrow
    const theta = 2 * Math.acos(complex.abs(state.alpha));
    let phi = complex.arg(state.beta) - complex.arg(state.alpha);
    if (Math.abs(complex.abs(state.beta)) < 1e-9) phi = 0;
    const x = Math.sin(theta) * Math.cos(phi);
    const z = Math.sin(theta) * Math.sin(phi);
    const y = Math.cos(theta);
    const dir = new THREE.Vector3(x, y, z).normalize();
    stateVectorArrow = new THREE.ArrowHelper(dir, new THREE.Vector3(0, 0, 0), 1, 0xffff0f, 0.15, 0.12);
    scene.add(stateVectorArrow); blochSphereObjects.push(stateVectorArrow);
}


// UI update functions
function updateUI() {
    const statevectorText = document.getElementById('statevector-text');
    const thetaVal = document.getElementById('theta-val');
    const phiVal = document.getElementById('phi-val');
        statevectorText.innerHTML = `|Ψ⟩ = (<span class="text-green-400">${complex.format(state.alpha)}</span>)|0⟩ + (<span class="text-yellow-400">${complex.format(state.beta)}</span>)|1⟩`;
        const theta = 2 * Math.acos(complex.abs(state.alpha));
        let phi = complex.arg(state.beta) - complex.arg(state.alpha);
        if (Math.abs(complex.abs(state.beta)) < 1e-9) phi = 0;
        thetaVal.textContent = (theta * 180 / Math.PI).toFixed(2);
        phiVal.textContent = (phi * 180 / Math.PI).toFixed(2);
    
}

function renderStateInputs() {
    const stateInputs = document.getElementById('state-inputs');
    if (!stateInputs) return;
   
        stateInputs.innerHTML = `
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                <label class="font-mono text-lg sm:col-span-1 text-white font-semibold">α (|0⟩):</label>
                <div class="sm:col-span-2 grid grid-cols-2 gap-2 text-white">
                    <input type="number" id="alpha-real" value="${state.alpha.real}" placeholder="Real" class="bg-gray-700 border border-gray-600 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white ">
                    <input type="number" id="alpha-imag" value="${state.alpha.imag}" placeholder="Imaginary" class="bg-gray-700 border border-gray-600 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white">
                </div>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                <label class="font-mono text-lg sm:col-span-1 text-white font-semibold">β (|1⟩):</label>
                <div class="sm:col-span-2 grid grid-cols-2 gap-2 text-white">
                    <input type="number" id="beta-real" value="${state.beta.real}" placeholder="Real" class="bg-gray-700 border border-gray-600 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white">
                    <input type="number" id="beta-imag" value="${state.beta.imag}" placeholder="Imaginary" class="bg-gray-700 border border-gray-600 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white">
                </div>
            </div>
        `;
    
}

function resetState() {
    if (mode === 'single') {
        state = { alpha: { real: 1, imag: 0 }, beta: { real: 0, imag: 0 } };
    } else {
        state = { alpha: { real: 1, imag: 0 }, beta: { real: 0, imag: 0 }, gamma: { real: 0, imag: 0 }, delta: { real: 0, imag: 0 } };
    }
    renderStateInputs();
    drawSphere();
    updateUI();
}

function handleSetState() {
    const errorMsg = document.getElementById('error-msg');
    errorMsg.textContent = '';
    console.log('mode:', mode, typeof mode);
        const alphaReal = parseFloat(document.getElementById('alpha-real').value) || 0;
        const alphaImag = parseFloat(document.getElementById('alpha-imag').value) || 0;
        const betaReal = parseFloat(document.getElementById('beta-real').value) || 0;
        const betaImag = parseFloat(document.getElementById('beta-imag').value) || 0;
        const rawAlpha = { real: alphaReal, imag: alphaImag };
        const rawBeta = { real: betaReal, imag: betaImag };
        const norm = Math.sqrt(complex.abs(rawAlpha) ** 2 + complex.abs(rawBeta) ** 2);
        if (norm < 1e-9) {
            errorMsg.textContent = 'State vector cannot be zero.';
            return;
        }
        state.alpha = { real: rawAlpha.real / norm, imag: rawAlpha.imag / norm };
        state.beta = { real: rawBeta.real / norm, imag: rawBeta.imag / norm };
    
    drawSphere();
    updateUI();
}

function handleModeChange() {
    mode = document.getElementById('mode-selector').value;
    renderStateInputs();
    drawSphere();
    updateUI();
}

// Gate buttons for single qubit
function applyGate(gate) {
    if (mode !== 'single') return;
    // Pauli gates for single qubit
    if (gate === 'X') {
        const newAlpha = state.beta;
        const newBeta = state.alpha;
        state.alpha = newAlpha;
        state.beta = newBeta;
    } else if (gate === 'Y') {
        const i = { real: 0, imag: 1 };
        const neg_i = { real: 0, imag: -1 };
        const newAlpha = complex.multiply(neg_i, state.beta);
        const newBeta = complex.multiply(i, state.alpha);
        state.alpha = newAlpha;
        state.beta = newBeta;
    } else if (gate === 'Z') {
        state.beta = complex.negate(state.beta);
    }
    drawSphere();
    updateUI();
}

// Main drawSphere function (can be called externally)
export default function drawSphere(newState) {
    if (newState) {
        state = newState;
        mode = (typeof state.gamma !== 'undefined' && typeof state.delta !== 'undefined') ? 'dual' : 'single';
    }
    console.log(state);
    if (!initialized) return; // Only draw after init
    resetScene();
    drawAxes();
    if (mode === 'single') {
        drawBlochSphere();
    } else {
        drawBlochSphere();
    }
}

// DOMContentLoaded: Initialize Three.js, set up UI, event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Three.js setup
    const container = document.getElementById('canvas-container');
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.z = 2.5;
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 1.5;
    controls.maxDistance = 10;

    window.addEventListener('resize', () => {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });

    initialized = true;

    // Hide loader, show app
    const loader = document.getElementById('loader-container');
    const app = document.getElementById('app');
    if (loader) loader.style.display = 'none';
    if (app) app.classList.remove('opacity-0');

    // Animation loop
    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    }
    animate();

    // UI listeners
    document.getElementById('mode-selector').addEventListener('change', handleModeChange);
    document.getElementById('set-state').addEventListener('click', handleSetState);
    document.getElementById('reset-state').addEventListener('click', resetState);

    document.getElementById('x-gate').addEventListener('click', () => applyGate('X'));
    document.getElementById('y-gate').addEventListener('click', () => applyGate('Y'));
    document.getElementById('z-gate').addEventListener('click', () => applyGate('Z'));

    // Initial UI render
    renderStateInputs();
    drawSphere();
    updateUI();
});