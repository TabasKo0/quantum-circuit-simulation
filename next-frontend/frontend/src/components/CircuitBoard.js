import { useState, useRef } from 'react';
import ProbabilityBarChart from './ProbabilityBarChart';

const NUM_QUBITS = 2;
const NUM_COLS = 12;

// Gate information with names, matrices, and descriptions
const GATE_INFO = {
  'H': {
    name: 'Hadamard Gate',
    matrix: [
      ['1/√2', '1/√2'],
      ['1/√2', '-1/√2']
    ],
    description: 'Creates a superposition'
  },
  'X': {
    name: 'Pauli-X Gate',
    matrix: [
      ['0', '1'],
      ['1', '0']
    ],
    description: 'Bit flip (NOT gate)'
  },
  'Y': {
    name: 'Pauli-Y Gate',
    matrix: [
      ['0', '-i'],
      ['i', '0']
    ],
    description: 'Bit and phase flip'
  },
  'Z': {
    name: 'Pauli-Z Gate',
    matrix: [
      ['1', '0'],
      ['0', '-1']
    ],
    description: 'Phase flip'
  },
  'S': {
    name: 'Phase Gate',
    matrix: [
      ['1', '0'],
      ['0', 'i']
    ],
    description: 'π/2 phase rotation'
  },
  'T': {
    name: 'T Gate',
    matrix: [
      ['1', '0'],
      ['0', 'e^(iπ/4)']
    ],
    description: 'π/4 phase rotation'
  },
  'CNOT': {
    name: 'Controlled-NOT Gate',
    matrix: [
      ['1', '0', '0', '0'],
      ['0', '1', '0', '0'],
      ['0', '0', '0', '1'],
      ['0', '0', '1', '0']
    ],
    description: 'Conditional bit flip'
  },
  'CZ': {
    name: 'Controlled-Z Gate',
    matrix: [
      ['1', '0', '0', '0'],
      ['0', '1', '0', '0'],
      ['0', '0', '1', '0'],
      ['0', '0', '0', '-1']
    ],
    description: 'Conditional phase flip'
  }
};

const GATES = [
  { name: 'H', display: 'H', class: 'bg-gray-200' },
  { name: 'X', display: 'X', class: 'bg-gray-200' },
  { name: 'Y', display: 'Y', class: 'bg-gray-200' },
  { name: 'Z', display: 'Z', class: 'bg-gray-200' },
  { name: 'S', display: 'S', class: 'bg-gray-200' },
  { name: 'T', display: 'T', class: 'bg-gray-200' },
  { name: 'CNOT', display: 'CNOT', class: 'bg-pink-100' },
  { name: 'CZ', display: 'CZ', class: 'bg-pink-100' },
];

function emptyBoard() {
  // Each slot: { gate: null, symbol: null }
  return Array(NUM_QUBITS).fill(0).map(() =>
    Array(NUM_COLS).fill(0).map(() => ({ gate: null, symbol: null }))
  );
}

export default function CircuitBoard({ onSimulate }) {
  const [board, setBoard] = useState(emptyBoard());
  const [results, setResults] = useState({
    statevector_str: '(1.000)|00⟩',
    probabilities: { '00': 100, '01': 0, '10': 0, '11': 0 }
  });
  const [isLoading, setIsLoading] = useState(false);
  const draggedGate = useRef(null);
  const [tooltip, setTooltip] = useState({ show: false, gate: null, x: 0, y: 0 });
  const tooltipTimeoutRef = useRef(null);

  // Drag and Drop Handlers
  function handleDragStart(gate) {
    draggedGate.current = gate;
  }

  function handleDrop(row, col) {
    if (!draggedGate.current) return;
    const gateType = draggedGate.current;
    const newBoard = emptyBoard().map((_, r) => board[r].map((x) => ({ ...x }))); // deep copy
    // Remove all gates from this col
    for (let r = 0; r < NUM_QUBITS; r++) {
      newBoard[r][col] = { gate: null, symbol: null };
    }

    if (gateType === 'CNOT' || gateType === 'CZ') {
      // Place control on drop row, target on other row
      const symbol = gateType === 'CNOT' ? '⊕' : '●';
      newBoard[row][col] = { gate: gateType, symbol: null };
      newBoard[1 - row][col] = { gate: null, symbol };
    } else {
      newBoard[row][col] = { gate: gateType, symbol: null };
    }
    setBoard(newBoard);
  }

  function handleDragOver(e) {
    e.preventDefault();
  }

  // Tooltip handlers
  function handleMouseEnter(e, gateName) {
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
    }
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({
      show: true,
      gate: gateName,
      x: rect.left + rect.width / 2,
      y: rect.top - 10
    });
  }

  function handleMouseLeave() {
    tooltipTimeoutRef.current = setTimeout(() => {
      setTooltip(prev => ({ ...prev, show: false }));
    }, 100);
  }

  function handleDragStartWithTooltip(gate) {
    // Hide tooltip when dragging starts
    setTooltip({ show: false, gate: null, x: 0, y: 0 });
    handleDragStart(gate);
  }

  function handleTouchStart(e, gateName) {
    // Only show tooltip if not dragging
    if (e.touches.length === 1) {
      const rect = e.currentTarget.getBoundingClientRect();
      setTooltip({
        show: true,
        gate: gateName,
        x: rect.left + rect.width / 2,
        y: rect.top - 10
      });
    }
  }

  function handleTouchEnd() {
    setTimeout(() => {
      setTooltip(prev => ({ ...prev, show: false }));
    }, 2000); // Show for 2 seconds on touch
  }

  // Clear board
  function clearBoard() {
    setBoard(emptyBoard());
    setResults({
      statevector_str: '(1.000)|00⟩',
      probabilities: { '00': 100, '01': 0, '10': 0, '11': 0 }
    });
    onSimulate({
      alpha: { real: 1, imag: 0 },
      beta: { real: 0, imag: 0 },
      gamma: { real: 0, imag: 0 },
      delta: { real: 0, imag: 0 }
    });
  }

  // Parse ket string to amplitudes
  function parseKetString(str) {
    const regex = /\(([^)]+)\)\|(\d+⟩)/g;
    let match;
    const basis = {};
    while ((match = regex.exec(str)) !== null) {
      let coeff = match[1].replace(/\s+/g, '');
      let ket = match[2].replace('⟩', '');
      let real = 0, imag = 0;
      if (/^[+-]?[\d.]+$/.test(coeff)) {
        real = parseFloat(coeff);
      } else if (/^[+-]?[\d.]+j$/.test(coeff)) {
        imag = parseFloat(coeff.replace('j', ''));
      } else if (/^[+-]?[\d.]+[+-][\d.]+j$/.test(coeff)) {
        let realPart = coeff.split(/[+-]/)[0];
        let imagPart = coeff.slice(realPart.length);
        real = parseFloat(realPart);
        imag = parseFloat(imagPart.replace('j', ''));
      }
      basis[ket] = [real, imag];
    }
    // |00⟩, |01⟩, |10⟩, |11⟩
    let arr = [];
    for (let i = 0; i < 4; i++) {
      let ket = i.toString(2).padStart(2, '0');
      let v = basis[ket] || [0, 0];
      arr.push(v[0], v[1]);
    }
    return arr;
  }

  // Compose board to API data
  function boardToCircuitData() {
    const circuitData = [];
    for (let col = 0; col < NUM_COLS; col++) {
      const colGates = {};
      for (let row = 0; row < NUM_QUBITS; row++) {
        const slot = board[row][col];
        if (slot.gate) {
          if (slot.gate === 'CNOT' || slot.gate === 'CZ') {
            colGates[`q${row}`] = `${slot.gate}_control`;
          } else {
            colGates[`q${row}`] = slot.gate;
          }
        }
      }
      circuitData.push(colGates);
    }
    return circuitData;
  }

  // Simulate
  async function simulateCircuit() {
    setIsLoading(true);
    try {
      const circuitData = boardToCircuitData();
      const response = await fetch('http://127.0.0.1:5000/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ circuit: circuitData }),
      });
      const results = await response.json();
      setResults(results);

      // Update Bloch sphere
      const ketStr = results.statevector_str;
      const jinga = parseKetString(ketStr);
      onSimulate({
        alpha: { real: jinga[0], imag: jinga[1] },
        beta: { real: jinga[2], imag: jinga[3] },
        gamma: { real: jinga[4], imag: jinga[5] },
        delta: { real: jinga[6], imag: jinga[7] }
      });
    } catch (error) {
      alert('Failed to connect to the backend simulator.');
    }
    setIsLoading(false);
  }

  // Render
  return (
    <div className="flex flex-col gap-6">
      {/* Palette */}
      <div id="gate-palette" className="mb-2 relative bg-gray-800 p-6 rounded-lg shadow-lg">
        <h3 className="text-xl font-bold mb-4 text-center text-cyan-400 bg-[#0a2540] border border-cyan-500 py-2 px-6 rounded-full inline-block w-auto mx-auto block">Gate Palette</h3>
        <div className="flex flex-wrap gap-3 justify-center">
          {GATES.map(g => {
            const isTwoQubit = g.name === 'CNOT' || g.name === 'CZ';
            return (
              <div
                key={g.name}
                className={`gate cursor-pointer px-4 py-2 rounded font-bold relative ${
                  isTwoQubit 
                    ? 'bg-pink-600 hover:bg-pink-700 text-white border border-pink-400' 
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-100 border border-gray-600'
                }`}
                draggable
                onDragStart={() => handleDragStartWithTooltip(g.name)}
                onMouseEnter={(e) => handleMouseEnter(e, g.name)}
                onMouseLeave={handleMouseLeave}
                onTouchStart={(e) => handleTouchStart(e, g.name)}
                onTouchEnd={handleTouchEnd}
              >
                {g.display}
              </div>
            );
          })}
        </div>
        
        {/* Tooltip */}
        {tooltip.show && tooltip.gate && (
          <div
            className="gate-tooltip"
            style={{
              position: 'fixed',
              left: `${tooltip.x}px`,
              top: `${tooltip.y}px`,
              transform: 'translate(-50%, -100%)',
              zIndex: 1000,
              pointerEvents: 'none'
            }}
          >
            <div className="bg-gray-900 text-white rounded-lg shadow-xl p-4 border border-gray-700 min-w-[200px] relative">
              <div className="font-bold text-lg mb-2 text-cyan-400">
                {GATE_INFO[tooltip.gate].name}
              </div>
              <div className="mb-2">
                <div className="text-xs text-gray-400 mb-1">Matrix:</div>
                <div className="bg-gray-800 p-2 rounded font-mono text-sm">
                  <table className="mx-auto">
                    <tbody>
                      {GATE_INFO[tooltip.gate].matrix.map((row, i) => (
                        <tr key={i}>
                          {row.map((cell, j) => (
                            <td key={j} className="px-2 py-1 text-center">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="text-sm text-gray-300 italic">
                {GATE_INFO[tooltip.gate].description}
              </div>
              <div 
                className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full"
                style={{
                  width: 0,
                  height: 0,
                  borderLeft: '8px solid transparent',
                  borderRight: '8px solid transparent',
                  borderTop: '8px solid #374151'
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Board */}
      <div id="circuit-container" className="mb-2 bg-gray-800 p-6 rounded-lg shadow-lg">
        <h3 className="text-xl font-bold mb-4 text-center text-cyan-400 bg-[#0a2540] border border-cyan-500 py-2 px-6 rounded-full inline-block w-auto mx-auto block">Quantum Circuit</h3>
        <div
          id="circuit-board"
          className="grid mb-4"
          style={{
            gridTemplateColumns: `repeat(${NUM_COLS}, 50px)`,
            gridTemplateRows: `repeat(${NUM_QUBITS}, 50px)`,
            gap: '10px',
            padding: '20px',
            border: '2px dashed #374151',
            backgroundColor: '#0f172a'
          }}
        >
          {Array(NUM_QUBITS * NUM_COLS).fill(0).map((_, i) => {
            const row = Math.floor(i / NUM_COLS);
            const col = i % NUM_COLS;
            const slot = board[row][col];
            return (
              <div
                key={i}
                className="circuit-slot flex items-center justify-center border border-gray-700 rounded relative bg-gray-900"
                style={{ width: 50, height: 50 }}
                data-row={row}
                data-col={col}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(row, col)}
              >
                {slot.gate && (
                  <div className={`gate font-bold text-sm ${slot.gate === 'CNOT' || slot.gate === 'CZ' ? 'text-white' : 'text-gray-100'}`}>
                    {slot.gate}
                  </div>
                )}
                {slot.symbol && <div className="gate text-pink-400 font-bold text-xl">{slot.symbol}</div>}
                {/* Control line for CNOT/CZ */}
                {slot.gate && (slot.gate === 'CNOT' || slot.gate === 'CZ') && (
                  <div className="control-line absolute left-1/2" style={{
                    width: '2px',
                    height: '60px',
                    backgroundColor: '#c76f8e',
                    top: row === 0 ? '0' : '-60px',
                  }}></div>
                )}
              </div>
            );
          })}
        </div>
        {/* Controls */}
        <div className="controls mt-4 flex gap-4 justify-center">
          <button 
            id="simulate-btn" 
            onClick={simulateCircuit} 
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded font-bold transition-colors disabled:bg-blue-400"
          >
            {isLoading ? "Simulating..." : "Simulate"}
          </button>
          <button 
            id="clear-btn" 
            onClick={clearBoard} 
            className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-2 rounded font-bold transition-colors"
          >
            Clear Circuit
          </button>
        </div>
      </div>

      {/* Results */}
      <div id="results-container" className="bg-gray-800 p-6 rounded-lg shadow-lg">
        <h3 className="text-xl font-bold mb-4 text-center text-cyan-400 bg-[#0a2540] border border-cyan-500 py-2 px-6 rounded-full inline-block w-auto mx-auto block">Simulation Output</h3>
        <div id="statevector-output" className="mb-4 bg-gray-900 p-4 rounded-lg">
          <p className="font-mono text-lg text-gray-100">
            Final State Vector:
            <span className="ml-2 text-cyan-300 font-bold">{results.statevector_str}</span>
          </p>
        </div>
        <div id="probability-chart" className="bg-gray-900 p-4 rounded-lg">
          <ProbabilityBarChart probabilities={results.probabilities} />
        </div>
      </div>
    </div>
  );
}