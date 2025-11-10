import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

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

// Extract single qubit state from full 2-qubit state
function extractQubitState(fullState, qubitIndex) {
  if (!fullState) return { alpha: { real: 1, imag: 0 }, beta: { real: 0, imag: 0 } };

  if (qubitIndex === 0) {
    // Trace out qubit 1 - marginal state of qubit 0
    const p0 = complex.abs(fullState.alpha) ** 2 + complex.abs(fullState.beta) ** 2;
    const p1 = complex.abs(fullState.gamma) ** 2 + complex.abs(fullState.delta) ** 2;
    
    const norm = Math.sqrt(p0 + p1);
    if (norm < 1e-9) {
      return { alpha: { real: 1, imag: 0 }, beta: { real: 0, imag: 0 } };
    }
    
    return {
      alpha: { real: Math.sqrt(p0), imag: 0 },
      beta: { real: Math.sqrt(p1), imag: 0 }
    };
  } else {
    // Trace out qubit 0 - marginal state of qubit 1
    const p0 = complex.abs(fullState.alpha) ** 2 + complex.abs(fullState.gamma) ** 2;
    const p1 = complex.abs(fullState.beta) ** 2 + complex.abs(fullState.delta) ** 2;
    
    const norm = Math.sqrt(p0 + p1);
    if (norm < 1e-9) {
      return { alpha: { real: 1, imag: 0 }, beta: { real: 0, imag: 0 } };
    }
    
    return {
      alpha: { real: Math.sqrt(p0), imag: 0 },
      beta: { real: Math.sqrt(p1), imag: 0 }
    };
  }
}

// helpers: conversions between representations
function stateToBlochCoords(state) {
  // return { theta (rad), phi (rad), x,y,z }
  const alpha = state.alpha || { real: 1, imag: 0 };
  const beta = state.beta || { real: 0, imag: 0 };
  const alphaAbs = complex.abs(alpha);
  const betaAbs = complex.abs(beta);

  // clamp for acos safety
  const cosHalfTheta = Math.max(-1, Math.min(1, alphaAbs));
  const theta = 2 * Math.acos(cosHalfTheta);

  let phi = complex.arg(beta) - complex.arg(alpha);
  if (Math.abs(betaAbs) < 1e-9) phi = 0;

  const x = Math.sin(theta) * Math.cos(phi);
  const z = Math.sin(theta) * Math.sin(phi);
  const y = Math.cos(theta);

  return { theta, phi, x, y, z };
}

function blochToStateFromPolar(thetaRad, phiRad) {
  // alpha = cos(theta/2)
  // beta = e^{i phi} sin(theta/2)
  const half = thetaRad / 2;
  const ca = Math.cos(half);
  const sb = Math.sin(half);
  const alpha = { real: ca, imag: 0 };
  const beta = { real: Math.cos(phiRad) * sb, imag: Math.sin(phiRad) * sb };
  // normalize numerically
  const norm = Math.sqrt(complex.abs(alpha) ** 2 + complex.abs(beta) ** 2);
  if (norm < 1e-9) return { alpha: { real: 1, imag: 0 }, beta: { real: 0, imag: 0 } };
  return {
    alpha: { real: alpha.real / norm, imag: 0 },
    beta: { real: beta.real / norm, imag: beta.imag / norm }
  };
}

// Single Bloch Sphere Component
function SingleBlochSphere({ qubitIndex, fullState }) {
  const [state, setState] = useState({ alpha: { real: 1, imag: 0 }, beta: { real: 0, imag: 0 } });
  const [coordinateMode, setCoordinateMode] = useState('polar'); // 'polar' or 'amplitudes'
  const [errorMsg, setErrorMsg] = useState('');
  const mountRef = useRef(null);

  // Inputs controlled state
  const [polarInputs, setPolarInputs] = useState({ thetaDeg: 0, phiDeg: 0 });
  const [amplitudeInputs, setAmplitudeInputs] = useState({
    alphaReal: 1, alphaImag: 0, betaReal: 0, betaImag: 0
  });

  // Extract this qubit's state from full state
  useEffect(() => {
    if (fullState) {
      const qubitState = extractQubitState(fullState, qubitIndex);
      setState(qubitState);
    }
  }, [fullState, qubitIndex]);

  // keep polar and amplitude inputs in sync with state vector
  useEffect(() => {
    const { theta, phi } = stateToBlochCoords(state);
    setPolarInputs({
      thetaDeg: Number((theta * 180 / Math.PI).toFixed(6)),
      phiDeg: Number((phi * 180 / Math.PI).toFixed(6))
    });

    // Keep amplitude inputs synced (alpha and beta real/imag)
    setAmplitudeInputs({
      alphaReal: Number((state.alpha?.real ?? 0).toFixed(6)),
      alphaImag: Number((state.alpha?.imag ?? 0).toFixed(6)),
      betaReal: Number((state.beta?.real ?? 0).toFixed(6)),
      betaImag: Number((state.beta?.imag ?? 0).toFixed(6))
    });
  }, [state]);

  // Gate operations
  const applyGate = (gate) => {
    // operate directly on complex amplitudes
    let newAlpha = { ...state.alpha };
    let newBeta = { ...state.beta };

    if (gate === 'X') {
      [newAlpha, newBeta] = [state.beta, state.alpha];
    } else if (gate === 'Y') {
      const i = { real: 0, imag: 1 };
      const neg_i = { real: 0, imag: -1 };
      newAlpha = complex.multiply(neg_i, state.beta);
      newBeta = complex.multiply(i, state.alpha);
    } else if (gate === 'Z') {
      newAlpha = { ...state.alpha };
      newBeta = complex.negate(state.beta);
    }

    setState({ alpha: newAlpha, beta: newBeta });
    setErrorMsg('');
  };

  const resetState = () => {
    const s = { alpha: { real: 1, imag: 0 }, beta: { real: 0, imag: 0 } };
    setState(s);
    setErrorMsg('');
    // inputs will be updated by the effect above
  };

  // Set State handler: supports both polar (theta/phi) and direct amplitudes (alpha/beta)
  const handleSetState = () => {
    try {
      if (coordinateMode === 'polar') {
        const thetaDeg = parseFloat(polarInputs.thetaDeg);
        const phiDeg = parseFloat(polarInputs.phiDeg);
        if (Number.isNaN(thetaDeg) || Number.isNaN(phiDeg)) {
          setErrorMsg('Invalid polar inputs.');
          return;
        }
        const thetaRad = thetaDeg * Math.PI / 180;
        const phiRad = phiDeg * Math.PI / 180;
        const newState = blochToStateFromPolar(thetaRad, phiRad);
        setState(newState);
        setErrorMsg('');
      } else {
        // amplitudes mode
        const ar = parseFloat(amplitudeInputs.alphaReal) || 0;
        const ai = parseFloat(amplitudeInputs.alphaImag) || 0;
        const br = parseFloat(amplitudeInputs.betaReal) || 0;
        const bi = parseFloat(amplitudeInputs.betaImag) || 0;
        const rawAlpha = { real: ar, imag: ai };
        const rawBeta = { real: br, imag: bi };
        const norm = Math.sqrt(complex.abs(rawAlpha) ** 2 + complex.abs(rawBeta) ** 2);
        if (norm < 1e-9) {
          setErrorMsg('State vector cannot be zero.');
          return;
        }
        setState({
          alpha: { real: rawAlpha.real / norm, imag: rawAlpha.imag / norm },
          beta: { real: rawBeta.real / norm, imag: rawBeta.imag / norm }
        });
        setErrorMsg('');
      }
    } catch (e) {
      setErrorMsg('Failed to set state: ' + (e?.message ?? String(e)));
    }
  };

  // Three.js scene refs
  const sceneRef = useRef();
  const rendererRef = useRef();
  const cameraRef = useRef();
  const controlsRef = useRef();
  const sphereRef = useRef();
  const arrowRef = useRef();
  const axesRef = useRef([]);
  const labelsRef = useRef([]);

  // Setup Three.js scene
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // Clear previous content
    while (mount.firstChild) {
      mount.removeChild(mount.firstChild);
    }

    const width = mount.clientWidth || 300;
    const height = mount.clientHeight || 300;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b1020);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 100);
    camera.position.z = 2.5;
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setClearColor(0x0b1020, 1);
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    mount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 1.5;
    controls.maxDistance = 10;
    controlsRef.current = controls;

    // Axes
    axesRef.current = [];
    const axesColors = [0xff7777, 0x77ff77, 0x7777ff];
    [[1,0,0],[0,1,0],[0,0,1]].forEach(([x,y,z],i) => {
      const lineGeom = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-1.5*x, -1.5*y, -1.5*z),
        new THREE.Vector3(1.5*x, 1.5*y, 1.5*z)
      ]);
      const lineMat = new THREE.LineBasicMaterial({ color: axesColors[i], transparent: true, opacity: 0.25 });
      const line = new THREE.Line(lineGeom, lineMat);
      scene.add(line);
      axesRef.current.push(line);
    });

    // Labels
    labelsRef.current = [];
    const labelData = [
      { text: '|0⟩', pos: [0, 1.1, 0], color: '#aaaaff' },
      { text: '|1⟩', pos: [0, -1.25, 0], color: '#aaaaff' },
      { text: 'X', pos: [1.1, 0, 0], color: '#ffaaaa' },
      { text: "X'", pos: [-1.25, 0, 0], color: '#ffaaaa' },
      { text: 'Y', pos: [0, 0, 1.1], color: '#aaffaa' },
      { text: "Y'", pos: [0, 0, -1.25], color: '#aaffaa' },
    ];
    
    labelData.forEach(({ text, pos, color }) => {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = 128;
      canvas.height = 64;
      context.fillStyle = color;
      context.font = '32px Arial';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(text, 64, 32);
      
      const texture = new THREE.CanvasTexture(canvas);
      const material = new THREE.SpriteMaterial({ map: texture });
      const sprite = new THREE.Sprite(material);
      sprite.position.set(pos[0], pos[1], pos[2]);
      sprite.scale.set(0.3, 0.15, 1);
      scene.add(sprite);
      labelsRef.current.push(sprite);
    });

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const light = new THREE.DirectionalLight(0xffffff, 0.8);
    light.position.set(2, 3, 4);
    scene.add(light);

    // Render loop
    let stop = false;
    function animate() {
      if (stop) return;
      controls.update();
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    }
    animate();

    // Resize
    function handleResize() {
      if (!mount) return;
      const width = mount.clientWidth;
      const height = mount.clientHeight;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }
    window.addEventListener("resize", handleResize);

    return () => {
      stop = true;
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      if (mount) {
        while (mount.firstChild) {
          mount.removeChild(mount.firstChild);
        }
      }
    };
  }, []);

  // Update sphere and arrow based on state
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Remove previous sphere/arrow
    if (sphereRef.current) scene.remove(sphereRef.current);
    if (arrowRef.current) scene.remove(arrowRef.current);

    // Sphere
    const geometry = new THREE.SphereGeometry(1, 32, 32);
    const material = new THREE.MeshPhongMaterial({
      color: 0x44aaff,
      transparent: true,
      opacity: 0.2,
      shininess: 50,
      side: THREE.DoubleSide
    });
    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);
    sphereRef.current = sphere;

    // Equator ring
    const ringGeometry = new THREE.RingGeometry(0.98, 1.02, 64);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide
    });
    const equator = new THREE.Mesh(ringGeometry, ringMaterial);
    equator.rotation.x = Math.PI / 2;
    scene.add(equator);

    // State vector arrow
    const alpha = state.alpha || { real: 1, imag: 0 };
    const beta = state.beta || { real: 0, imag: 0 };
    const theta = 2 * Math.acos(complex.abs(alpha));
    let phi = complex.arg(beta) - complex.arg(alpha);
    if (Math.abs(complex.abs(beta)) < 1e-9) phi = 0;
    const x = Math.sin(theta) * Math.cos(phi);
    const z = Math.sin(theta) * Math.sin(phi);
    const y = Math.cos(theta);
    const dir = new THREE.Vector3(x, y, z).normalize();
    const arrow = new THREE.ArrowHelper(dir, new THREE.Vector3(0, 0, 0), 1, 0xffff0f, 0.15, 0.12);
    scene.add(arrow);
    arrowRef.current = arrow;
  }, [state]);

  // Calculate coordinates for display
  const { theta, phi, x, y, z } = stateToBlochCoords(state);

  const qubitColor = qubitIndex === 0 ? 'text-cyan-400' : 'text-pink-400';
  const qubitLabel = `Qubit ${qubitIndex} (q${qubitIndex})`;

  // When toggling coordinate mode, update inputs to reflect current state (already done by state effect).
  const toggleCoordinateMode = () => {
    setCoordinateMode((m) => (m === 'polar' ? 'amplitudes' : 'polar'));
    setErrorMsg('');
    // inputs will refresh from state due to the effect that syncs state -> inputs
  };

  return (
    <div className="flex-1 bg-gray-800 rounded-lg p-4">
      <h2 className={`text-xl font-bold mb-2 text-center ${qubitColor}`}>{qubitLabel}</h2>
      
      {/* 3D Canvas */}
      <div
        ref={mountRef}
        className="bg-gray-900 rounded-lg mb-4"
        style={{ width: '100%', height: 300 }}
      ></div>
      
      {/* Controls */}
      <div className="space-y-3">
        {/* Coordinate toggle */}
        <div className="flex justify-between items-center">
          <h3 className="text-base font-semibold text-gray-200">State & Parameters</h3>
          <button
            onClick={toggleCoordinateMode}
            className="bg-blue-600 hover:bg-blue-700 rounded px-3 py-1 text-xs font-bold transition-colors text-white"
          >
            {coordinateMode === 'polar' ? 'Switch to Amplitudes (α,β)' : 'Switch to Polar (θ,φ)'}
          </button>
        </div>
        
        {/* State display */}
        <div className="bg-gray-900 rounded-lg p-3">
          <div className="text-xs font-mono mb-2">
            |ψ⟩ = (<span className="text-green-400">{complex.format(state.alpha)}</span>)|0⟩ + (<span className="text-yellow-400">{complex.format(state.beta)}</span>)|1⟩
          </div>
          <div className="text-xs font-mono">
            {coordinateMode === 'polar' ? (
              <>
                <span className="text-purple-400">θ: {(theta * 180 / Math.PI).toFixed(2)}°</span><br/>
                <span className="text-pink-400">φ: {(phi * 180 / Math.PI).toFixed(2)}°</span>
              </>
            ) : (
              <>
                <span className="text-green-400">α: {complex.format(state.alpha, 6)}</span><br/>
                <span className="text-yellow-400">β: {complex.format(state.beta, 6)}</span>
              </>
            )}
          </div>
        </div>
        
        {/* Coordinate inputs (polar or amplitudes) */}
        <div className="space-y-2">
          {coordinateMode === 'polar' ? (
            <div className="grid grid-cols-3 gap-2 items-center text-xs">
              <label className="font-mono text-white font-semibold">θ (deg):</label>
              <input
                type="number"
                value={polarInputs.thetaDeg}
                onChange={(e) => setPolarInputs(p => ({ ...p, thetaDeg: e.target.value }))}
                step="0.1"
                className="col-span-2 bg-gray-700 border border-gray-600 rounded p-1 text-white text-xs"
              />
              <label className="font-mono text-white font-semibold">φ (deg):</label>
              <input
                type="number"
                value={polarInputs.phiDeg}
                onChange={(e) => setPolarInputs(p => ({ ...p, phiDeg: e.target.value }))}
                step="0.1"
                className="col-span-2 bg-gray-700 border border-gray-600 rounded p-1 text-white text-xs"
              />
            </div>
          ) : (
            <div className="space-y-2 text-xs">
              <div className="grid grid-cols-4 gap-2 items-center">
                <label className="font-mono text-white font-semibold">α real</label>
                <input
                  type="number"
                  value={amplitudeInputs.alphaReal}
                  onChange={(e) => setAmplitudeInputs(a => ({ ...a, alphaReal: e.target.value }))}
                  step="0.0001"
                  className="bg-gray-700 border border-gray-600 rounded p-1 text-white text-xs col-span-3"
                />
                <label className="font-mono text-white font-semibold">α imag</label>
                <input
                  type="number"
                  value={amplitudeInputs.alphaImag}
                  onChange={(e) => setAmplitudeInputs(a => ({ ...a, alphaImag: e.target.value }))}
                  step="0.0001"
                  className="bg-gray-700 border border-gray-600 rounded p-1 text-white text-xs col-span-3"
                />
                <label className="font-mono text-white font-semibold">β real</label>
                <input
                  type="number"
                  value={amplitudeInputs.betaReal}
                  onChange={(e) => setAmplitudeInputs(a => ({ ...a, betaReal: e.target.value }))}
                  step="0.0001"
                  className="bg-gray-700 border border-gray-600 rounded p-1 text-white text-xs col-span-3"
                />
                <label className="font-mono text-white font-semibold">β imag</label>
                <input
                  type="number"
                  value={amplitudeInputs.betaImag}
                  onChange={(e) => setAmplitudeInputs(a => ({ ...a, betaImag: e.target.value }))}
                  step="0.0001"
                  className="bg-gray-700 border border-gray-600 rounded p-1 text-white text-xs col-span-3"
                />
              </div>
              <div className="text-xs text-gray-400">Enter complex amplitudes for α and β (they will be normalized).</div>
            </div>
          )}
        </div>
        
        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleSetState}
            className="flex-1 bg-cyan-600 hover:bg-cyan-700 rounded py-1 text-xs font-bold transition-colors text-white"
          >
            Set State
          </button>
          <button
            onClick={resetState}
            className="flex-1 bg-gray-600 hover:bg-gray-500 rounded py-1 text-xs font-bold transition-colors text-white"
          >
            Reset
          </button>
        </div>
        {errorMsg && <p className="text-red-400 text-xs">{errorMsg}</p>}
        
        {/* Gate buttons */}
        <div>
          <h4 className="text-xs font-semibold mb-2 text-gray-200">Apply Gates</h4>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => applyGate('X')}
              className="bg-red-500 hover:bg-red-600 rounded p-2 text-base font-bold text-white transition-all hover:scale-105"
            >
              X
            </button>
            <button
              onClick={() => applyGate('Y')}
              className="bg-green-500 hover:bg-green-600 rounded p-2 text-base font-bold text-white transition-all hover:scale-105"
            >
              Y
            </button>
            <button
              onClick={() => applyGate('Z')}
              className="bg-blue-500 hover:bg-blue-600 rounded p-2 text-base font-bold text-white transition-all hover:scale-105"
            >
              Z
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main Dual Sphere Component
export default function DualSphere({ stateVector }) {
  return (
    <div className="flex flex-col md:flex-row gap-4 p-4">
      <SingleBlochSphere qubitIndex={0} fullState={stateVector} />
      <SingleBlochSphere qubitIndex={1} fullState={stateVector} />
    </div>
  );
}