import { drawSphere } from './sphere.js';
document.addEventListener('DOMContentLoaded', () => {
    const circuitBoard = document.getElementById('circuit-board');
    const gates = document.querySelectorAll('#gate-palette .gate');
    const simulateBtn = document.getElementById('simulate-btn');
    const clearBtn = document.getElementById('clear-btn');

    const NUM_QUBITS = 2;
    const NUM_COLS = 8;

    let i1_0=0;
    let i1_1=0;
    let i2_0=0;
    let i2_1=0;

    // Initialize Circuit Board
    function initializeBoard() {
        circuitBoard.innerHTML = ''; // Clear previous board
        for (let i = 0; i < NUM_QUBITS * NUM_COLS; i++) {
            const slot = document.createElement('div');
            slot.classList.add('circuit-slot');
            slot.dataset.row = Math.floor(i / NUM_COLS);
            slot.dataset.col = i % NUM_COLS;
            circuitBoard.appendChild(slot);
        }
        addDragDropListeners();
    }

    // Drag and Drop Logic
    let draggedGate = null;

    gates.forEach(gate => {
        gate.addEventListener('dragstart', (e) => {
            draggedGate = e.target;
        });
    });

    function addDragDropListeners() {
        const slots = document.querySelectorAll('.circuit-slot');
        slots.forEach(slot => {
            slot.addEventListener('dragover', (e) => {
                e.preventDefault(); // Necessary to allow dropping
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

        // Clear any existing gate in the column for both qubits
        clearColumn(col);

        const newGate = document.createElement('div');
        newGate.classList.add('gate');
        newGate.textContent = gateType;
        newGate.dataset.gate = gateType;

        if (gateType === 'CNOT' || gateType === 'CZ') {
            newGate.classList.add('two-qubit');
            const targetRow = 1 - row; // The other qubit wire
            const targetSlot = document.querySelector(`.circuit-slot[data-row='${targetRow}'][data-col='${col}']`);
            
            const targetSymbol = document.createElement('div');
            targetSymbol.classList.add('gate');
            if (gateType === 'CNOT') targetSymbol.textContent = '⊕'; // Target symbol
            if (gateType === 'CZ') targetSymbol.textContent = '●'; // Target symbol
            
            // Add line connecting control and target
            const line = document.createElement('div');
            line.classList.add('control-line');
            line.style.height = '60px'; // Height of slot + gap
            line.style.top = row === 0 ? '0' : '-60px';

            slot.appendChild(newGate); // Control
            targetSlot.appendChild(targetSymbol); // Target
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
                    } else if (gate.textContent !== '⊕' && gate.textContent !== '●') { // Don't add targets
                        colGates['q1'] = gate.dataset.gate;
                    }
                }
            }
            circuitData.push(colGates);
        }
        console.log(circuitData);

        try {
            const response = await fetch('http://127.0.0.1:5000/simulate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ circuit: circuitData }),
            });
            const results = await response.json();
            updateResults(results);
            console.log(results);
        } catch (error) {
            console.error('Error simulating circuit:', error);
            alert('Failed to connect to the backend simulator.');
        }
        drawSphere();
    }

    function updateResults(results) {
        // Update State Vector
        const stateVectorEl = document.querySelector('#statevector-output span');
        stateVectorEl.textContent = results.statevector_str;

        // Update Probability Chart
        const probs = results.probabilities;
        const data = [{
            x: ['|00⟩', '|01⟩', '|10⟩', '|11⟩'],
            y: [probs['00'], probs['01'], probs['10'], probs['11']],
            type: 'bar',
            text: [probs['00'].toFixed(1) + '%', probs['01'].toFixed(1) + '%', probs['10'].toFixed(1) + '%', probs['11'].toFixed(1) + '%'],
            textposition: 'auto',
            marker: { color: '#4a4a8a' },
        }];

        const layout = {
            title: 'Measurement Probabilities',
            xaxis: { title: 'Basis States' },
            yaxis: { title: 'Probability (%)', range: [0, 100] },
        };

        Plotly.newPlot('probability-chart', data, layout);
    }
    
    // Event Listeners
    simulateBtn.addEventListener('click', simulateCircuit);
    clearBtn.addEventListener('click', initializeBoard);
    
    // Initial load
    initializeBoard();
    updateResults({ // Initial state
        statevector_str: '(1.000)|00⟩',
        probabilities: { '00': 100, '01': 0, '10': 0, '11': 0 }
    });
});