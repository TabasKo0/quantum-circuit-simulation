import { useState, useRef } from 'react';
import ProbabilityBarChart from './ProbabilityBarChart';

const NUM_QUBITS = 2;
const NUM_COLS = 12;

/* (GATE_INFO, GATES, emptyBoard, etc. remain unchanged) */
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
    probabilities: { '00': 100, '01': 0, '10': 0, '11': 0 },
    human_steps: [],
    visualizationHints: {}
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showRich, setShowRich] = useState(false);
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

  // Tooltip handlers (unchanged)
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
      probabilities: { '00': 100, '01': 0, '10': 0, '11': 0 },
      human_steps: [],
      visualizationHints: {}
    });
    onSimulate({
      alpha: { real: 1, imag: 0 },
      beta: { real: 0, imag: 0 },
      gamma: { real: 0, imag: 0 },
      delta: { real: 0, imag: 0 }
    });
  }

  // Robust complex parser: handles "0.707", "-0.707", "0.707+0.707j", "-0.707-0.707j", "0j", etc.
  function parseComplex(str) {
    const s = String(str).replace(/\s+/g, '');
    if (!s.includes('j')) {
      const r = parseFloat(s);
      return [isNaN(r) ? 0 : r, 0];
    }
    // remove trailing j
    const core = s.slice(0, -1);
    // find split point: last '+' or '-' that is not the leading sign
    let splitIdx = -1;
    for (let i = core.length - 1; i > 0; i--) {
      if (core[i] === '+' || core[i] === '-') {
        splitIdx = i;
        break;
      }
    }
    if (splitIdx === -1) {
      // purely imaginary like "0.707j" or "-0.5j"
      const imag = parseFloat(core);
      return [0, isNaN(imag) ? 0 : imag];
    }
    const realPart = core.slice(0, splitIdx);
    const imagPart = core.slice(splitIdx);
    const real = parseFloat(realPart);
    const imag = parseFloat(imagPart);
    return [isNaN(real) ? 0 : real, isNaN(imag) ? 0 : imag];
  }

  // New robust statevector parser that matches backend format like:
  // "(0.707+0.707j)|10⟩(0.000)|11⟩..."
  function parseStatevector(stateStr) {
    const regex = /\(([^)]+)\)\|([01]{2})⟩/g;
    const basisMap = {};
    let m;
    while ((m = regex.exec(stateStr)) !== null) {
      const coeffStr = m[1];
      const ket = m[2]; // '00', '01', '10', '11'
      const [real, imag] = parseComplex(coeffStr);
      basisMap[ket] = [real, imag];
    }
    // Ensure order: |00>, |01>, |10>, |11>
    const arr = [];
    for (let i = 0; i < 4; i++) {
      const ket = i.toString(2).padStart(2, '0');
      const v = basisMap[ket] || [0, 0];
      arr.push(v[0], v[1]);
    }
    return arr; // [r00,i00, r01,i01, r10,i10, r11,i11]
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
      // Use the Next.js API route proxy instead of calling backend directly
      const response = await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ circuit: circuitData }),
      });

      const results = await response.json();
      setResults(results);

      // Update Bloch sphere using robust parser
      const ketStr = results.statevector_str || '';
      const parsed = parseStatevector(ketStr);
      // parsed is [r00,i00, r01,i01, r10,i10, r11,i11]
      onSimulate({
        alpha: { real: parsed[0] || 0, imag: parsed[1] || 0 }, // |00>
        beta:  { real: parsed[2] || 0, imag: parsed[3] || 0 }, // |01>
        gamma: { real: parsed[4] || 0, imag: parsed[5] || 0 }, // |10>
        delta: { real: parsed[6] || 0, imag: parsed[7] || 0 }  // |11>
      });
    } catch (error) {
      alert('Failed to connect to the backend simulator (via /api/simulate).');
      console.error(error);
    }
    setIsLoading(false);
  }

  // Calculate grid minimum width so it can scroll horizontally on small screens.
  // Each cell is 50px, gap is 10px, grid padding left+right = 40px. Compute a safe min width:
  const gridMinWidth = NUM_COLS * 60 + 30; // (50 + 10) * NUM_COLS + extra padding

  // Render
  return (
    <div className="flex flex-col gap-6">
      <div className='flex  md:flex-row flex-col gap-4 flex-stretch'>
        {/* Palette */}
        <div id="gate-palette" className="mb-2 relative bg-gray-800 p-6 rounded-lg shadow-lg md:w-[50vw] w-[93vw]">
          <h3 className="text-xl font-bold mb-4 text-center text-cyan-400 bg-[#0a2540] border border-cyan-500 py-2 px-6 rounded-full inline-block w-auto mx-auto block">Gate Palette</h3>
          <div className="flex flex-wrap gap-3 justify-between">
            {GATES.map(g => {
              const isTwoQubit = g.name === 'CNOT' || g.name === 'CZ';
              return (
                <div
                  key={g.name}
                  className={`gate cursor-pointer text-2xl px-4 py-2 rounded font-bold relative ${
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
          <div className="flex flex-row">
            <div className='flex flex-col p-3 gap-4  '>
              <div className='p-4 bg-gray-900 rounded-[10px] whitespace-nowrap'>Q1: |00⟩</div>
              <div className='p-4 bg-gray-900 rounded-[10px]'>Q0: |00⟩</div>
            </div>

            {/* Wrapper that enables horizontal scrolling on small screens while keeping layout intact */}
            <div
              className="overflow-x-auto w-full"
              style={{
                WebkitOverflowScrolling: 'touch',
              }}
            >
              <div
                id="circuit-board"
                className="grid mb-4"
                style={{
                  gridTemplateColumns: `repeat(${NUM_COLS}, 50px)`,
                  gridTemplateRows: `repeat(${NUM_QUBITS}, 50px)`,
                  gap: '10px',
                  padding: '20px',
                  border: '2px dashed #374151',
                  backgroundColor: '#0f172a',
                  minWidth: `${gridMinWidth}px`, // ensure wide enough to trigger horizontal scroll on narrow viewports
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
            </div>
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
      </div>
      {/* Results */}
      <div id="results-container" className="bg-gray-800 p-6 rounded-lg shadow-lg">
        <h3 className="text-xl font-bold mb-4 text-center text-cyan-400 bg-[#0a2540] border border-cyan-500 py-2 px-6 rounded-full inline-block w-auto mx-auto block">Simulation Output</h3>
        {/* Entanglement badge */}
        {results?.visualizationHints?.entangled && (
          <div className="mb-3 text-sm">
            <span className="inline-block bg-pink-700 text-white px-3 py-1 rounded-full mr-2">Entangled</span>
            <span className="text-gray-300">Qubits appear entangled — outcomes will be correlated.</span>
          </div>
        )}
        <div id="statevector-output" className="mb-4 bg-gray-900 p-4 rounded-lg">
          <p className="font-mono text-lg text-gray-100">
            Final State Vector:
            <span className="ml-2 text-cyan-300 font-bold">{results.statevector_str}</span>
          </p>
        </div>
        <div id="probability-chart" className="bg-gray-900 p-4 rounded-lg">
          <ProbabilityBarChart 
            probabilities={results.probabilities}
            highlightKeys={results?.visualizationHints?.highlight || []}
          />
        </div>

        {/* Human Steps */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-lg font-semibold text-cyan-300">Step Log</h4>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-300">Show details</label>
              <button
                onClick={() => setShowRich(v => !v)}
                className="bg-gray-700 hover:bg-gray-600 text-white text-sm px-3 py-1 rounded"
              >
                {showRich ? 'Rich' : 'Compact'}
              </button>
            </div>
          </div>
          <div id="human-steps-output" className="bg-gray-900 p-3 rounded max-h-48 overflow-auto border border-gray-700">
            {(results.human_steps || []).length === 0 && (
              <div className="text-gray-400 text-sm">No steps yet. Build a circuit and click Simulate.</div>
            )}
            {(results.human_steps || []).map((s) => (
              <div key={s.step} className="text-gray-100 text-sm mb-2 border-b border-gray-800 pb-2 last:border-b-0">
                <div className="font-mono">
                  <span className="text-gray-400">Step {s.step}:</span> <span className="text-cyan-300">{s.text}</span>
                </div>
                {showRich && (
                  <div className="mt-1 pl-4">
                    {s.statevector_str && (
                      <div className="text-gray-300"><span className="text-gray-400">State:</span> <span className="font-mono text-cyan-200">{s.statevector_str}</span></div>
                    )}
                    {s.probabilities && (
                      <div className="text-gray-300">
                        <span className="text-gray-400">Probabilities:</span>{' '}
                        <span className="font-mono">
                          00={s.probabilities['00']?.toFixed ? s.probabilities['00'].toFixed(3) : s.probabilities['00']}%,{' '}
                          01={s.probabilities['01']?.toFixed ? s.probabilities['01'].toFixed(3) : s.probabilities['01']}%,{' '}
                          10={s.probabilities['10']?.toFixed ? s.probabilities['10'].toFixed(3) : s.probabilities['10']}%,{' '}
                          11={s.probabilities['11']?.toFixed ? s.probabilities['11'].toFixed(3) : s.probabilities['11']}%
                        </span>
                      </div>
                    )}
                    {s.explanation && (
                      <div className="text-gray-400 italic">{s.explanation}</div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}