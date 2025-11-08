import { useState, useRef } from 'react';
import ProbabilityBarChart from './ProbabilityBarChart';

const NUM_QUBITS = 2;
const NUM_COLS = 12;
<<<<<<< HEAD

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

=======
>>>>>>> 80c10939dfb232cb38f61121f812c39a7a8d1835
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
<<<<<<< HEAD
  const [tooltip, setTooltip] = useState({ show: false, gate: null, x: 0, y: 0 });
  const tooltipTimeoutRef = useRef(null);
=======
>>>>>>> 80c10939dfb232cb38f61121f812c39a7a8d1835

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

<<<<<<< HEAD
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

=======
>>>>>>> 80c10939dfb232cb38f61121f812c39a7a8d1835
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
<<<<<<< HEAD
      <div id="gate-palette" className="mb-2 relative">
=======
      <div id="gate-palette" className="mb-2">
>>>>>>> 80c10939dfb232cb38f61121f812c39a7a8d1835
        <h3 className="text-lg font-bold mb-3">Gate Palette</h3>
        <div className="flex flex-wrap gap-2">
          {GATES.map(g => (
            <div
              key={g.name}
<<<<<<< HEAD
              className={`gate cursor-pointer px-4 py-2 rounded ${g.class} relative`}
              draggable
              onDragStart={() => handleDragStartWithTooltip(g.name)}
              onMouseEnter={(e) => handleMouseEnter(e, g.name)}
              onMouseLeave={handleMouseLeave}
              onTouchStart={(e) => handleTouchStart(e, g.name)}
              onTouchEnd={handleTouchEnd}
=======
              className={`gate cursor-pointer px-4 py-2 rounded ${g.class}`}
              draggable
              onDragStart={() => handleDragStart(g.name)}
>>>>>>> 80c10939dfb232cb38f61121f812c39a7a8d1835
            >
              {g.display}
            </div>
          ))}
        </div>
<<<<<<< HEAD
        
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
=======
>>>>>>> 80c10939dfb232cb38f61121f812c39a7a8d1835
      </div>

      {/* Board */}
      <div id="circuit-container" className="mb-2">
        <h3 className="text-lg font-bold mb-3">Quantum Circuit</h3>
        <div
          id="circuit-board"
          className="grid"
          style={{
            gridTemplateColumns: `repeat(${NUM_COLS}, 50px)`,
            gridTemplateRows: `repeat(${NUM_QUBITS}, 50px)`,
            gap: '10px',
            padding: '20px',
            border: '2px dashed #ccc',
            backgroundColor: '#fafafa'
          }}
        >
          {Array(NUM_QUBITS * NUM_COLS).fill(0).map((_, i) => {
            const row = Math.floor(i / NUM_COLS);
            const col = i % NUM_COLS;
            const slot = board[row][col];
            return (
              <div
                key={i}
                className="circuit-slot flex items-center justify-center border rounded relative"
                style={{ width: 50, height: 50 }}
                data-row={row}
                data-col={col}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(row, col)}
              >
                {slot.gate && (
                  <div className={`gate ${slot.gate === 'CNOT' || slot.gate === 'CZ' ? 'two-qubit' : ''}`}>
                    {slot.gate}
                  </div>
                )}
                {slot.symbol && <div className="gate">{slot.symbol}</div>}
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
        <div className="controls mt-4 flex gap-4">
          <button id="simulate-btn" onClick={simulateCircuit} className="bg-cyan-600 text-white px-4 py-2 rounded">
            {isLoading ? "Simulating..." : "Simulate"}
          </button>
          <button id="clear-btn" onClick={clearBoard} className="bg-pink-400 text-white px-4 py-2 rounded">
            Clear Circuit
          </button>
        </div>
      </div>

      {/* Results */}
      <div id="results-container" className="bg-white p-4 rounded shadow">
        <h3 className="text-lg font-bold mb-3">Simulation Output</h3>
        <div id="statevector-output" className="mb-2">
          <p className="font-mono text-lg">
            Final State Vector:
            <span className="ml-2 align-middle text-blue-700">{results.statevector_str}</span>
          </p>
        </div>
        <div id="probability-chart">
          <div className="flex gap-6 font-mono">
            {['00', '01', '10', '11'].map(basis => (
              <div key={basis}>
                <div className="text-gray-700">{'|' + basis + '⟩'}</div>
                <div className="font-bold">{results.probabilities[basis]?.toFixed(1) || 0}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div id="results-container" className="bg-white p-4 rounded shadow">
  <h3 className="text-lg font-bold mb-3">Simulation Output</h3>
  <div id="statevector-output" className="mb-2">
    <p className="font-mono text-lg">
      Final State Vector:
      <span className="ml-2 align-middle text-blue-700">{results.statevector_str}</span>
    </p>
  </div>
  <div id="probability-chart">
    <ProbabilityBarChart probabilities={results.probabilities} />
  </div>
</div>
    </div>
  );
}