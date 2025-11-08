import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

const complex = {
  abs: (c) => Math.sqrt(c.real * c.real + c.imag * c.imag),
  arg: (c) => Math.atan2(c.imag, c.real),
};

const initialSingleState = {
  alpha: { real: 1, imag: 0 },
  beta: { real: 0, imag: 0 },
};

export default function Sphere({ stateVector }) {
  const [state, setState] = useState(initialSingleState);
  const mountRef = useRef(null);

  // Keep in sync with parent prop
  useEffect(() => {
    if (!stateVector) return;
    setState({
      alpha: stateVector.alpha || { real: 1, imag: 0 },
      beta: stateVector.beta || { real: 0, imag: 0 }
    });
  }, [stateVector]);

  // Setup Three.js scene ONCE
  const sceneRef = useRef();
  const rendererRef = useRef();
  const cameraRef = useRef();
  const controlsRef = useRef();
  const sphereRef = useRef();
  const arrowRef = useRef();
  const axesRef = useRef([]);

  useEffect(() => {
    // Remove any extra canvases added by hot reloads or remounts
    if (mountRef.current) {
      // Remove all child nodes (including old canvases) before adding new
      while (mountRef.current.firstChild) {
        mountRef.current.removeChild(mountRef.current.firstChild);
      }
    }

    const width = mountRef.current.clientWidth || 400;
    const height = mountRef.current.clientHeight || 400;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xD4D4D4);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 100);
    camera.position.z = 2.5;
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setClearColor(0xffffff, 1);
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controlsRef.current = controls;

    // Axes: Remove on next mount
    axesRef.current = [];
    const axesColors = [0xff4444, 0x44ff44, 0x4444ff];
    [[1,0,0],[0,1,0],[0,0,1]].forEach(([x,y,z],i) => {
      // Use TubeGeometry for thick axes
      const path = new THREE.LineCurve3(
        new THREE.Vector3(-1.5*x, -1.5*y, -1.5*z),
        new THREE.Vector3(1.5*x, 1.5*y, 1.5*z)
      );
      const tubeGeom = new THREE.TubeGeometry(path, 1, 0.025, 8, false);
      const tubeMat = new THREE.MeshBasicMaterial({ color: axesColors[i], transparent: true, opacity: 0.7 });
      const tube = new THREE.Mesh(tubeGeom, tubeMat);
      scene.add(tube);
      axesRef.current.push(tube);
    });

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const light = new THREE.PointLight(0xffffff, 0.5);
    light.position.set(2,2,2);
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
      if (!mountRef.current) return;
      const width = mountRef.current.clientWidth;
      const height = mountRef.current.clientHeight;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }
    window.addEventListener("resize", handleResize);

    return () => {
      stop = true;
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      // Remove all children (canvas) on cleanup
      if (mountRef.current) {
        while (mountRef.current.firstChild) {
          mountRef.current.removeChild(mountRef.current.firstChild);
        }
      }
    };
  }, []);

  // Only draw objects after the scene is ready, and clean up previous ones
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Remove previous sphere/arrow
    if (sphereRef.current) scene.remove(sphereRef.current);
    if (arrowRef.current) scene.remove(arrowRef.current);

    // Sphere (translucent blue)
    const geometry = new THREE.SphereGeometry(1, 32, 32);
    const material = new THREE.MeshPhongMaterial({
      color: 0x23659c,
      transparent: true,
      opacity: 0.25,
      shininess: 80,
      side: THREE.DoubleSide
    });
    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);
    sphereRef.current = sphere;

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
    const arrow = new THREE.ArrowHelper(dir, new THREE.Vector3(0, 0, 0), 1.2, 0xffff00, 0.2, 0.1);
    scene.add(arrow);
    arrowRef.current = arrow;
  }, [state]);

  return (
    <div
      ref={mountRef}
      style={{
        width: 400,
        height: 400,
        margin: "0 auto",
        background: "#fff"
      }}
    ></div>
  );
}