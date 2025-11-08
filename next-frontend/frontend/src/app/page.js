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
    <main className="min-h-screen bg-[#0b1020] text-gray-100">
      <h1 className="text-4xl font-bold mb-8 text-center pt-8 text-gray-100">Quantum Computing Simulator Suite</h1>
      <div className="flex flex-col gap-8 px-4">
        <CircuitBoard onSimulate={setStateVector} />
        <div className="bg-gray-900 rounded-lg shadow-lg overflow-hidden" style={{ height: 'calc(100vh - 400px)', minHeight: 500 }}>
          <h3 className="text-2xl font-bold text-center py-4 bg-gray-800 border-b-2 border-cyan-500">Bloch Sphere Visualization</h3>
          <Sphere stateVector={stateVector} />
        </div>
      </div>
    </main>
  );
}