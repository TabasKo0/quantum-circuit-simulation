'use client';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import CircuitBoard from '../components/CircuitBoard';

const Sphere = dynamic(() => import('../components/Sphere'), { ssr: false });

export default function Home() {
  const [stateVector, setStateVector] = useState({
    alpha: { real: 1, imag: 0 },
    beta: { real: 0, imag: 0 },
    gamma: { real: 0, imag: 0 },
    delta: { real: 0, imag: 0 }
  });

  return (
    <main>
      <h1 className="text-4xl font-bold mb-8 text-center pt-8">Quantum Computing Simulator Suite</h1>
      <div className="main-container flex flex-col md:flex-row gap-8 justify-center items-start">
        <CircuitBoard onSimulate={setStateVector} />
        <div id="canvas-container" className="flex-grow w-full md:w-2/3 h-1/2 md:h-full bg-[#D4D4D4] rounded flex items-center justify-center" style={{ minHeight: 420 }}>
          <Sphere stateVector={stateVector} />
        </div>
      </div>
    </main>
  );
}