document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const canvasContainer = document.getElementById('canvas-container');
    const loader = document.getElementById('loader-container');
    const app = document.getElementById('app');
    const alphaVal = document.getElementById('alpha-val');
    const betaVal = document.getElementById('beta-val');
    const thetaVal = document.getElementById('theta-val');
    const phiVal = document.getElementById('phi-val');
    const errorMsg = document.getElementById('error-msg');

    // --- State Variables ---
    let scene, camera, renderer, controls, sphere, stateVectorArrow;
    let state = {
        alpha: { real: 1, imag: 0 },
        beta: { real: 0, imag: 0 }
    };

    // --- Helper for Complex Numbers ---
    const complex = {
        abs: (c) => Math.sqrt(c.real * c.real + c.imag * c.imag),
        arg: (c) => Math.atan2(c.imag, c.real),
        multiply: (c1, c2) => ({
            real: c1.real * c2.real - c1.imag * c2.imag,
            imag: c1.real * c2.imag + c1.imag * c2.real
        }),
        add: (c1, c2) => ({
            real: c1.real + c2.real,
            imag: c1.imag + c2.imag
        }),
        negate: (c) => ({ real: -c.real, imag: -c.imag }),
        format: (c, precision = 2) => {
            if (Math.abs(c.real) < 1e-9 && Math.abs(c.imag) < 1e-9) return "0.00";
            const realPart = Math.abs(c.real) > 1e-9 ? c.real.toFixed(precision) : null;
            const imagPart = Math.abs(c.imag) > 1e-9 ? c.imag.toFixed(precision) : null;
            if (realPart && imagPart) {
                return `${realPart} ${c.imag >= 0 ? '+' : '-'} ${Math.abs(c.imag).toFixed(precision)}i`;
            }
            return realPart ? `${realPart}` : `${imagPart}i`;
        }
    };

    const i = { real: 0, imag: 1 };
    const neg_i = { real: 0, imag: -1 };

    function init() {
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(75, canvasContainer.clientWidth / canvasContainer.clientHeight, 0.1, 1000);
        camera.position.z = 2.5;
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(canvasContainer.clientWidth, canvasContainer.clientHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        canvasContainer.appendChild(renderer.domElement);
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.screenSpacePanning = false;
        controls.minDistance = 1.5;
        controls.maxDistance = 10;
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(1, 1, 1).normalize();
        scene.add(directionalLight);

        window.addEventListener('resize', onWindowResize, false);
        document.getElementById('x-gate').addEventListener('click', applyXGate);
        document.getElementById('y-gate').addEventListener('click', applyYGate);
        document.getElementById('z-gate').addEventListener('click', applyZGate);
        document.getElementById('set-state').addEventListener('click', handleSetState);
        document.getElementById('reset-state').addEventListener('click', resetState);

        drawBlochSphere();
        updateStateVector();
        updateUI();

        animate();

        setTimeout(() => {
            if (loader) loader.style.display = 'none';
            if (app) app.classList.remove('opacity-0');
        }, 500);
    }

    function drawBlochSphere() {
        const geometry = new THREE.SphereGeometry(1, 32, 32);
        const material = new THREE.MeshPhongMaterial({ color: 0x44aaff, transparent: true, opacity: 0.2, shininess: 50 });
        sphere = new THREE.Mesh(geometry, material);
        scene.add(sphere);
        const axisLength = 1.3;
        const axisMaterial = {
            x: new THREE.LineBasicMaterial({ color: 0xff7777 }),
            y: new THREE.LineBasicMaterial({ color: 0x77ff77 }),
            z: new THREE.LineBasicMaterial({ color: 0x7777ff })
        };
        scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, -axisLength, 0), new THREE.Vector3(0, axisLength, 0)]), axisMaterial.z));
        scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-axisLength, 0, 0), new THREE.Vector3(axisLength, 0, 0)]), axisMaterial.x));
        scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, -axisLength), new THREE.Vector3(0, 0, axisLength)]), axisMaterial.y));

        const fontLoader = new THREE.FontLoader();
        fontLoader.load('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/fonts/helvetiker_regular.typeface.json', function (font) {
            const textMaterial = (color) => new THREE.MeshBasicMaterial({ color: color });
            const textParams = { font: font, size: 0.1, height: 0.01 };
            const label0 = new THREE.Mesh(new THREE.TextGeometry('|0⟩', textParams), textMaterial(0xaaaaff));
            label0.position.set(0.05, 1.1, 0);
            scene.add(label0);
            const label1 = new THREE.Mesh(new THREE.TextGeometry('|1⟩', textParams), textMaterial(0xaaaaff));
            label1.position.set(0.05, -1.25, 0);
            scene.add(label1);
            const labelX = new THREE.Mesh(new THREE.TextGeometry('X', textParams), textMaterial(0xffaaaa));
            labelX.position.set(1.1, 0.05, 0);
            scene.add(labelX);
            const labelY = new THREE.Mesh(new THREE.TextGeometry('Y', textParams), textMaterial(0xaaffaa));
            labelY.position.set(0.05, 0.05, 1.1);
            scene.add(labelY);
        });
        const ringGeometry = new THREE.RingGeometry(1, 1, 64);
        const ringMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3 });
        const equator = new THREE.Mesh(ringGeometry, ringMaterial);
        equator.rotation.x = Math.PI / 2;
        scene.add(equator);

        const dir = new THREE.Vector3(0, 1, 0);
        const origin = new THREE.Vector3(0, 0, 0);
        stateVectorArrow = new THREE.ArrowHelper(dir, origin, 1, 0xffff00, 0.1, 0.08);
        scene.add(stateVectorArrow);
    }

    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    }

    function onWindowResize() {
        camera.aspect = canvasContainer.clientWidth / canvasContainer.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(canvasContainer.clientWidth, canvasContainer.clientHeight);
    }

    function applyXGate() {
        const newAlpha = state.beta;
        const newBeta = state.alpha;
        state.alpha = newAlpha;
        state.beta = newBeta;
        updateStateVector();
        updateUI();
    }

    function applyYGate() {
        const newAlpha = complex.multiply(neg_i, state.beta);
        const newBeta = complex.multiply(i, state.alpha);
        state.alpha = newAlpha;
        state.beta = newBeta;
        updateStateVector();
        updateUI();
    }

    function applyZGate() {
        state.beta = complex.negate(state.beta);
        updateStateVector();
        updateUI();
    }

    function resetState() {
        state = { alpha: { real: 1, imag: 0 }, beta: { real: 0, imag: 0 }};
        document.getElementById('alpha-real').value = 1;
        document.getElementById('alpha-imag').value = 0;
        document.getElementById('beta-real').value = 0;
        document.getElementById('beta-imag').value = 0;
        errorMsg.textContent = '';
        updateStateVector();
        updateUI();
    }

    function handleSetState() {
        const alphaReal = parseFloat(document.getElementById('alpha-real').value) || 0;
        const alphaImag = parseFloat(document.getElementById('alpha-imag').value) || 0;
        const betaReal = parseFloat(document.getElementById('beta-real').value) || 0;
        const betaImag = parseFloat(document.getElementById('beta-imag').value) || 0;
        const rawAlpha = { real: alphaReal, imag: alphaImag };
        const rawBeta = { real: betaReal, imag: betaImag };
        const norm = Math.sqrt(complex.abs(rawAlpha) * complex.abs(rawAlpha) + complex.abs(rawBeta) * complex.abs(rawBeta));
        if (norm < 1e-9) {
            errorMsg.textContent = 'State vector cannot be zero.';
            return;
        }
        errorMsg.textContent = '';
        state.alpha = { real: rawAlpha.real / norm, imag: rawAlpha.imag / norm };
        state.beta = { real: rawBeta.real / norm, imag: rawBeta.imag / norm };
        updateStateVector();
        updateUI();
    }

    function updateStateVector() {
        const theta = 2 * Math.acos(complex.abs(state.alpha));
        const phi = complex.arg(state.beta) - complex.arg(state.alpha);
        const x = Math.sin(theta) * Math.cos(phi);
        const z = Math.sin(theta) * Math.sin(phi);
        const y = Math.cos(theta);
        const newDirection = new THREE.Vector3(x, y, z).normalize();
        stateVectorArrow.setDirection(newDirection);
    }

    function updateUI() {
        alphaVal.textContent = complex.format(state.alpha);
        betaVal.textContent = complex.format(state.beta);
        const theta = 2 * Math.acos(complex.abs(state.alpha));
        let phi = complex.arg(state.beta) - complex.arg(state.alpha);
        if (Math.abs(complex.abs(state.beta)) < 1e-9) {
            phi = 0;
        }
        thetaVal.textContent = (theta * 180 / Math.PI).toFixed(2);
        phiVal.textContent = (phi * 180 / Math.PI).toFixed(2);
    }
    init();
});