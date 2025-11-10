import drawSphere from './sphere.js';

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
    'y': {
        name: 'Pauli-Y Gate',
        matrix: [
            ['0', '-i'],
            ['i', '0']
        ],
        description: 'Bit and phase flip'
    },
    'z': {
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

document.addEventListener('DOMContentLoaded', () => {
    const circuitBoard = document.getElementById('circuit-board');
    const gates = document.querySelectorAll('#gate-palette .gate');
    const simulateBtn = document.getElementById('simulate-btn');
    const clearBtn = document.getElementById('clear-btn');

    const NUM_QUBITS = 2;
    const NUM_COLS = 12;

    // Create tooltip element
    const tooltip = document.createElement('div');
    tooltip.className = 'gate-tooltip';
    tooltip.style.cssText = 'position: fixed; z-index: 1000; pointer-events: none; display: none;';
    document.body.appendChild(tooltip);

    let tooltipTimeout = null;

    // Initialize Circuit Board
    function initializeBoard() {
        circuitBoard.innerHTML = '';
        for (let i = 0; i < NUM_QUBITS * NUM_COLS; i++) {
            const slot = document.createElement('div');
            slot.classList.add('circuit-slot');
            slot.dataset.row = Math.floor(i / NUM_COLS);
            slot.dataset.col = i % NUM_COLS;
            circuitBoard.appendChild(slot);
        }
        addDragDropListeners();
    }

    // Tooltip functions
    function showTooltip(e, gateName) {
        if (tooltipTimeout) {
            clearTimeout(tooltipTimeout);
        }
        const gateInfo = GATE_INFO[gateName];
        if (!gateInfo) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const matrixHTML = gateInfo.matrix.map(row => 
            `<tr>${row.map(cell => `<td style="padding: 4px 8px; text-align: center;">${cell}</td>`).join('')}</tr>`
        ).join('');

        tooltip.innerHTML = `
            <div style="background: #111827; color: white; border-radius: 8px; padding: 16px; border: 1px solid #374151; box-shadow: 0 10px 25px rgba(0,0,0,0.5); min-width: 200px; position: relative;">
                <div style="font-weight: bold; font-size: 18px; margin-bottom: 8px; color: #22d3ee;">${gateInfo.name}</div>
                <div style="margin-bottom: 8px;">
                    <div style="font-size: 12px; color: #9ca3af; margin-bottom: 4px;">Matrix:</div>
                    <div style="background: #1f2937; padding: 8px; border-radius: 4px; font-family: monospace; font-size: 14px;">
                        <table style="margin: 0 auto;">
                            <tbody>${matrixHTML}</tbody>
                        </table>
                    </div>
                </div>
                <div style="font-size: 14px; color: #d1d5db; font-style: italic;">${gateInfo.description}</div>
                <div style="position: absolute; bottom: -8px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 8px solid transparent; border-right: 8px solid transparent; border-top: 8px solid #374151;"></div>
            </div>
        `;

        const tooltipRect = tooltip.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top - 10;

        tooltip.style.left = `${x}px`;
        tooltip.style.top = `${y}px`;
        tooltip.style.transform = 'translate(-50%, -100%)';
        tooltip.style.display = 'block';
        tooltip.style.animation = 'tooltipFadeIn 0.2s ease-in-out';
    }

    function hideTooltip() {
        tooltipTimeout = setTimeout(() => {
            tooltip.style.animation = 'tooltipFadeOut 0.2s ease-in-out';
            setTimeout(() => {
                tooltip.style.display = 'none';
            }, 200);
        }, 100);
    }

    // Drag and Drop Logic
    let draggedGate = null;
    gates.forEach(gate => {
        gate.addEventListener('dragstart', (e) => {
            draggedGate = e.target;
            tooltip.style.display = 'none';
        });

        // Mouse events for tooltip
        gate.addEventListener('mouseenter', (e) => {
            showTooltip(e, gate.dataset.gate);
        });

        gate.addEventListener('mouseleave', () => {
            hideTooltip();
        });

        // Touch events for mobile
        gate.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                showTooltip(e, gate.dataset.gate);
            }
        });

        gate.addEventListener('touchend', () => {
            setTimeout(() => {
                hideTooltip();
            }, 2000);
        });
    });

    function addDragDropListeners() {
        const slots = document.querySelectorAll('.circuit-slot');
        slots.forEach(slot => {
            slot.addEventListener('dragover', (e) => {
                e.preventDefault();
            });
            slot.addEventListener('drop', (e) => {
                e.preventDefault();
                if (draggedGate) {
                    placeGate(slot, draggedGate.dataset.gate);
                }
            });
        });
    }

    function placeGate(slot, gateType) {
        const row = parseInt(slot.dataset.row);
        const col = parseInt(slot.dataset.col);
        clearColumn(col);

        const newGate = document.createElement('div');
        newGate.classList.add('gate');
        newGate.textContent = gateType;
        newGate.dataset.gate = gateType;

        if (gateType === 'CNOT' || gateType === 'CZ') {
            newGate.classList.add('two-qubit');
            const targetRow = 1 - row;
            const targetSlot = document.querySelector(`.circuit-slot[data-row='${targetRow}'][data-col='${col}']`);
            const targetSymbol = document.createElement('div');
            targetSymbol.classList.add('gate');
            targetSymbol.textContent = gateType === 'CNOT' ? '⊕' : '●';

            const line = document.createElement('div');
            line.classList.add('control-line');
            line.style.height = '60px';
            line.style.top = row === 0 ? '0' : '-60px';

            slot.appendChild(newGate);
            targetSlot.appendChild(targetSymbol);
            slot.appendChild(line);
        } else {
            slot.appendChild(newGate);
        }
    }

    function clearColumn(col) {
        for (let row = 0; row < NUM_QUBITS; row++) {
            const slot = document.querySelector(`.circuit-slot[data-row='${row}'][data-col='${col}']`);
            slot.innerHTML = '';
        }
    }

    // Parse ket string to get amplitudes
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

    // API Communication and Simulation
    async function simulateCircuit() {
        const circuitData = [];
        for (let col = 0; col < NUM_COLS; col++) {
            const colGates = {};
            const q0_slot = document.querySelector(`.circuit-slot[data-row='0'][data-col='${col}']`);
            const q1_slot = document.querySelector(`.circuit-slot[data-row='1'][data-col='${col}']`);
            if (q0_slot.hasChildNodes()) {
                const gate = q0_slot.querySelector('.gate');
                if (gate) {
                    if (gate.dataset.gate === 'CNOT' || gate.dataset.gate === 'CZ') {
                        colGates['q0'] = `${gate.dataset.gate}_control`;
                    } else {
                        colGates['q0'] = gate.dataset.gate;
                    }
                }
            }
            if (q1_slot.hasChildNodes()) {
                const gate = q1_slot.querySelector('.gate');
                if (gate) {
                    if (gate.dataset.gate === 'CNOT' || gate.dataset.gate === 'CZ') {
                        colGates['q1'] = `${gate.dataset.gate}_control`;
                    } else if (gate.textContent !== '⊕' && gate.textContent !== '●') {
                        colGates['q1'] = gate.dataset.gate;
                    }
                }
            }
            circuitData.push(colGates);
        }

        try {
            const response = await fetch('http://127.0.0.1:5000/simulate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ circuit: circuitData }),
            });
            const results = await response.json();
            updateResults(results);
            console.log(JSON.stringify(results));

            // --- Key: update sphere.js state and redraw ---
            const ketStr = results.statevector_str;
            const jinga = parseKetString(ketStr);
            const newState = {
                alpha: { real: jinga[0], imag: jinga[1] },
                beta: { real: jinga[2], imag: jinga[3] },
                gamma: { real: jinga[4], imag: jinga[5] },
                delta: { real: jinga[6], imag: jinga[7] }
            };
            drawSphere(newState);

        } catch (error) {
            console.error('Error simulating circuit:', error);
            alert('Failed to connect to the backend simulator.');
        }
    }

    function updateResults(results) {
        const stateVectorEl = document.querySelector('#statevector-output span');
        stateVectorEl.textContent = results.statevector_str;
        const probs = results.probabilities;
        const data = [{
            x: ['|00⟩', '|01⟩', '|10⟩', '|11⟩'],
            y: [probs['00'], probs['01'], probs['10'], probs['11']],
            type: 'bar',
            text: [
                probs['00'].toFixed(1) + '%',
                probs['01'].toFixed(1) + '%',
                probs['10'].toFixed(1) + '%',
                probs['11'].toFixed(1) + '%'
            ],
            textposition: 'auto',
            marker: { color: '#6366f1' },
        }];
        const layout = {
            title: { text: 'Measurement Probabilities', font: { color: '#e5e7eb' } },
            paper_bgcolor: '#111827',
            plot_bgcolor: '#0b1020',
            font: { color: '#e5e7eb' },
            xaxis: {
                title: { text: 'Basis States', font: { color: '#e5e7eb' } },
                tickfont: { color: '#cbd5e1' },
                gridcolor: '#1f2937',
                zerolinecolor: '#374151',
                linecolor: '#374151'
            },
            yaxis: {
                title: { text: 'Probability (%)', font: { color: '#e5e7eb' } },
                tickfont: { color: '#cbd5e1' },
                gridcolor: '#1f2937',
                zerolinecolor: '#374151',
                linecolor: '#374151',
                range: [0, 100]
            },
            margin: { t: 50, r: 30, b: 60, l: 60 }
        };
        Plotly.newPlot('probability-chart', data, layout);
    }

    // Event Listeners
    simulateBtn.addEventListener('click', simulateCircuit);
    clearBtn.addEventListener('click', initializeBoard);

    // Initial load
    initializeBoard();
    updateResults({
        statevector_str: '(1.000)|00⟩',
        probabilities: { '00': 100, '01': 0, '10': 0, '11': 0 }
    });

    // Draw sphere at startup (default state)
    drawSphere({
        alpha: { real: 1, imag: 0 },
        beta: { real: 0, imag: 0 },
        gamma: { real: 0, imag: 0 },
        delta: { real: 0, imag: 0 }
    });
});