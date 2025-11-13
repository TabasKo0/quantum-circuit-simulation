# Quantum Circuit Simulation

A comprehensive visual quantum circuit simulator with an intuitive drag-and-drop interface, built using Python (Qiskit) backend and Next.js (React) frontend. Create quantum circuits visually, simulate them in real-time, and visualize results with state vectors, probability distributions, and dual 3D Bloch sphere representations.

## 📋 Table of Contents

- [Features](#-features)
- [Mathematical Foundations](#-mathematical-foundations)
  - [Quantum States and Qubits](#quantum-states-and-qubits)
  - [Quantum Gates](#quantum-gates)
  - [Superposition](#superposition)
  - [Entanglement](#entanglement)
- [Supported Quantum Gates](#-supported-quantum-gates)
- [Technology Stack](#-technology-stack)
- [Prerequisites](#-prerequisites)
- [Setup Instructions](#-setup-instructions)
- [Usage Guide](#-usage-guide)
- [Example Circuits](#-example-circuits)
- [API Reference](#-api-reference)
- [Project Structure](#-project-structure)
- [Development](#-development)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [License](#-license)

## ✨ Features

- **Visual Circuit Builder**: Intuitive drag-and-drop interface for building quantum circuits
- **Real-time Simulation**: Powered by Qiskit for accurate quantum simulation
- **Dual Bloch Sphere Visualization**: Interactive 3D visualization of two-qubit states
- **Step-by-Step Execution**: Watch how your circuit evolves gate-by-gate with explanations
- **Multiple Visualizations**: 
  - State vector display in Dirac (ket) notation
  - Probability distribution bar charts
  - Dual 3D Bloch sphere representation for each qubit
  - Entanglement detection and highlighting
- **Comprehensive Gate Support**: H, X, Y, Z, S, T, CNOT, and CZ gates with matrix tooltips
- **Two-Qubit System**: Full support for 2-qubit quantum circuits with entanglement capabilities

## 📐 Mathematical Foundations

### Quantum States and Qubits

A **qubit** (quantum bit) is the fundamental unit of quantum information. Unlike classical bits that are either 0 or 1, a qubit exists in a **superposition** of both states simultaneously.

#### Single Qubit State

A single qubit state is represented as a vector in a 2-dimensional complex Hilbert space:

```
|ψ⟩ = α|0⟩ + β|1⟩
```

Where:
- `|0⟩` and `|1⟩` are the computational basis states (equivalent to classical 0 and 1)
- `α` and `β` are complex probability amplitudes
- The normalization condition must hold: `|α|² + |β|² = 1`
- `|α|²` is the probability of measuring the qubit in state `|0⟩`
- `|β|²` is the probability of measuring the qubit in state `|1⟩`

In vector notation:
```
|0⟩ = [1]    |1⟩ = [0]    |ψ⟩ = [α]
      [0]          [1]           [β]
```

#### Two Qubit State

For a two-qubit system, the state vector lives in a 4-dimensional complex Hilbert space:

```
|ψ⟩ = α|00⟩ + β|01⟩ + γ|10⟩ + δ|11⟩
```

Where:
- `|00⟩, |01⟩, |10⟩, |11⟩` are the four computational basis states
- Normalization: `|α|² + |β|² + |γ|² + |δ|² = 1`
- Vector form: `|ψ⟩ = [α, β, γ, δ]ᵀ`

### Quantum Gates

Quantum gates are **unitary operators** that transform quantum states. A unitary operator `U` satisfies `U†U = I`, where `U†` is the conjugate transpose and `I` is the identity matrix. This ensures that quantum gates preserve the normalization of quantum states.

For single-qubit gates, they are represented by 2×2 unitary matrices. For two-qubit gates, they are 4×4 unitary matrices.

### Superposition

**Superposition** is the principle that a quantum system can exist in multiple states simultaneously until measured. The Hadamard gate is the most common gate for creating superposition:

```
H|0⟩ = 1/√2(|0⟩ + |1⟩) = |+⟩
H|1⟩ = 1/√2(|0⟩ - |1⟩) = |-⟩
```

This creates an equal superposition where the qubit has a 50% probability of being measured as 0 or 1.

### Entanglement

**Entanglement** is a uniquely quantum phenomenon where two or more qubits become correlated in such a way that the state of one qubit cannot be described independently of the others.

#### Bell States

The most famous example of entanglement is the Bell states. The Bell state Φ⁺ can be created by:

```
|Φ⁺⟩ = 1/√2(|00⟩ + |11⟩)
```

Circuit to create Bell state:
1. Apply H gate to qubit 0: creates superposition 1/√2(|0⟩ + |1⟩)
2. Apply CNOT with control on qubit 0 and target on qubit 1

Mathematically:
```
Initial state: |00⟩
After H on q0: 1/√2(|00⟩ + |10⟩)
After CNOT:    1/√2(|00⟩ + |11⟩) = |Φ⁺⟩
```

In this entangled state:
- If we measure qubit 0 and get 0, qubit 1 will definitely be 0
- If we measure qubit 0 and get 1, qubit 1 will definitely be 1
- The correlation exists even though each individual qubit appears random!

#### Mathematical Test for Entanglement

For a two-qubit pure state `|ψ⟩ = α|00⟩ + β|01⟩ + γ|10⟩ + δ|11⟩`, the state is entangled if and only if:

```
|αδ - βγ| > 0
```

This is equivalent to saying the state cannot be written as a tensor product of two single-qubit states.

## 🚪 Supported Quantum Gates

### Single-Qubit Gates

#### 1. Hadamard Gate (H)

**Matrix:**
```
H = 1/√2 [ 1   1 ]
         [ 1  -1 ]
```

**Effect:** Creates an equal superposition. Transforms:
- `|0⟩ → (|0⟩ + |1⟩)/√2 = |+⟩`
- `|1⟩ → (|0⟩ - |1⟩)/√2 = |-⟩`

**Use Case:** Essential for creating superposition states and is used in nearly every quantum algorithm.

#### 2. Pauli-X Gate (X)

**Matrix:**
```
X = [ 0  1 ]
    [ 1  0 ]
```

**Effect:** Bit flip (quantum NOT gate). Transforms:
- `|0⟩ → |1⟩`
- `|1⟩ → |0⟩`

**Use Case:** Flips the computational basis states, analogous to classical NOT.

#### 3. Pauli-Y Gate (Y)

**Matrix:**
```
Y = [ 0  -i ]
    [ i   0 ]
```

**Effect:** Bit flip combined with phase flip. Transforms:
- `|0⟩ → i|1⟩`
- `|1⟩ → -i|0⟩`

**Use Case:** Rotation around the Y-axis of the Bloch sphere by π radians.

#### 4. Pauli-Z Gate (Z)

**Matrix:**
```
Z = [ 1   0 ]
    [ 0  -1 ]
```

**Effect:** Phase flip. Transforms:
- `|0⟩ → |0⟩`
- `|1⟩ → -|1⟩`

**Use Case:** Applies a phase of π to the `|1⟩` state without changing probabilities.

#### 5. S Gate (Phase Gate)

**Matrix:**
```
S = [ 1  0 ]
    [ 0  i ]
```

**Effect:** Applies a π/2 phase rotation. Equivalent to `√Z`.
- `|0⟩ → |0⟩`
- `|1⟩ → i|1⟩`

**Use Case:** Quarter turn phase shift, useful in quantum Fourier transforms.

#### 6. T Gate (π/8 Gate)

**Matrix:**
```
T = [ 1      0     ]
    [ 0  e^(iπ/4) ]
```

**Effect:** Applies a π/4 phase rotation. Equivalent to `√S`.
- `|0⟩ → |0⟩`
- `|1⟩ → e^(iπ/4)|1⟩`

**Use Case:** Eighth turn phase shift, forms a universal gate set with H and CNOT.

### Two-Qubit Gates

#### 7. CNOT Gate (Controlled-NOT)

**Matrix:**
```
CNOT = [ 1  0  0  0 ]
       [ 0  1  0  0 ]
       [ 0  0  0  1 ]
       [ 0  0  1  0 ]
```

**Effect:** Flips the target qubit if and only if the control qubit is `|1⟩`.

**Truth Table:**
```
|00⟩ → |00⟩
|01⟩ → |01⟩
|10⟩ → |11⟩
|11⟩ → |10⟩
```

**Use Case:** Essential for creating entanglement. Forms a universal gate set with single-qubit rotations.

#### 8. CZ Gate (Controlled-Z)

**Matrix:**
```
CZ = [ 1  0  0   0 ]
     [ 0  1  0   0 ]
     [ 0  0  1   0 ]
     [ 0  0  0  -1 ]
```

**Effect:** Applies a phase flip to the `|11⟩` state only.

**Truth Table:**
```
|00⟩ → |00⟩
|01⟩ → |01⟩
|10⟩ → |10⟩
|11⟩ → -|11⟩
```

**Use Case:** Symmetric two-qubit gate useful for phase-based entanglement and certain quantum algorithms.

## 🛠 Technology Stack

### Backend
- **Python 3.8+**: Core programming language
- **Flask**: Lightweight web framework for REST API
- **Qiskit**: IBM's open-source quantum computing framework
- **Qiskit Aer**: High-performance quantum circuit simulator
- **NumPy**: Numerical computing for vector operations
- **Flask-CORS**: Cross-origin resource sharing support
- **Gunicorn**: Production WSGI HTTP server

### Frontend
- **Next.js 15**: React framework with server-side rendering
- **React 19**: Component-based UI library
- **Three.js**: 3D graphics library for Bloch sphere visualization
- **Plotly.js**: Interactive plotting and charting
- **Tailwind CSS**: Utility-first CSS framework
- **JavaScript ES6+**: Modern JavaScript features

### Architecture
- **RESTful API**: Clean separation between frontend and backend
- **Microservices**: Independent frontend and backend deployments
- **Real-time Simulation**: Immediate feedback for circuit changes
- **Progressive Enhancement**: Step-by-step circuit execution with intermediate states

## 📦 Prerequisites

- **Python 3.8 or higher**: Required for backend quantum simulation
- **pip**: Python package manager (usually comes with Python)
- **Node.js 18+**: Required for Next.js frontend (if developing locally)
- **npm or yarn**: Node package manager
- **Modern web browser**: Chrome, Firefox, Safari, or Edge with WebGL support

## 🚀 Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/TabasKo0/quantum-circuit-simulation.git
cd quantum-circuit-simulation
```

### 2. Backend Setup

Navigate to the backend directory and install dependencies:

```bash
cd backend
pip install -r requirements.txt
```

**Backend Dependencies:**
- `Flask`: Web framework for REST API
- `flask-cors`: CORS support for cross-origin requests
- `qiskit`: Quantum computing framework
- `qiskit-aer`: Quantum circuit simulator
- `numpy`: Numerical computing
- `gunicorn`: Production server

Start the Flask development server:

```bash
python app.py
```

The backend API will be available at `http://localhost:5000`

**API Endpoints:**
- `POST /api/simulate`: Simulate quantum circuit
- `GET /api/health`: Health check endpoint

### 3. Frontend Setup

Open a new terminal window and navigate to the frontend directory:

```bash
cd frontend
npm install
```

**Frontend Dependencies:**
- `next`: React framework
- `react` & `react-dom`: React libraries
- `three`: 3D graphics library
- `plotly.js` & `react-plotly.js`: Plotting libraries
- `tailwindcss`: CSS framework

Start the Next.js development server:

```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

### 4. Access the Application

Open your web browser and navigate to `http://localhost:3000`

## 📖 Usage Guide

### Building Quantum Circuits

1. **Drag Gates**: From the Gate Palette on the left, drag quantum gates onto the circuit board
2. **Place Gates**: Drop gates on either qubit line (q0 or q1) at any time step
3. **Two-Qubit Gates**: CNOT and CZ gates automatically span both qubits
   - The row you drop on becomes the control qubit
   - The other row becomes the target qubit

### Available Gates

#### Single-Qubit Gates:
- **H (Hadamard)**: Creates superposition - 50/50 probability of 0 or 1
- **X (Pauli-X)**: Bit flip - swaps |0⟩ and |1⟩
- **Y (Pauli-Y)**: Bit and phase flip combined
- **Z (Pauli-Z)**: Phase flip - adds minus sign to |1⟩
- **S (Phase)**: Quarter turn phase rotation (π/2)
- **T (T Gate)**: Eighth turn phase rotation (π/4)

#### Two-Qubit Gates:
- **CNOT**: Controlled-NOT - flips target if control is |1⟩
- **CZ**: Controlled-Z - phase flips |11⟩ state

### Running Simulations

1. **Build Circuit**: Add gates to your circuit board
2. **Simulate**: Click the "Simulate" button to run the quantum simulation
3. **View Results**: 
   - **State Vector**: Quantum state in Dirac notation (e.g., `0.707|00⟩ + 0.707|11⟩`)
   - **Probability Chart**: Bar chart showing measurement probabilities
   - **Bloch Spheres**: 3D representation of each qubit's state
   - **Step-by-Step**: Detailed breakdown of how each gate transforms the state

4. **Clear Circuit**: Click "Clear Circuit" to reset and start over

### Understanding the Visualizations

#### State Vector Display
Shows the quantum state in ket notation:
```
(0.707)|00⟩ + (0.707)|11⟩
```
- Coefficients are complex probability amplitudes
- `|00⟩, |01⟩, |10⟩, |11⟩` are the basis states
- Only non-zero amplitudes are shown

#### Probability Bar Chart
- Shows `|amplitude|²` as percentages
- Must sum to 100%
- Represents measurement probabilities

#### Dual Bloch Sphere
- Each qubit visualized as a point on a 3D sphere
- North pole: |0⟩ state
- South pole: |1⟩ state
- Equator: Superposition states
- Vector length and direction show quantum state

#### Entanglement Detection
- System automatically detects entangled states
- Entangled basis states are highlighted in the probability chart
- Mathematical criterion: `|αδ - βγ| > 0` for state `α|00⟩ + β|01⟩ + γ|10⟩ + δ|11⟩`

## 🎓 Example Circuits

### Example 1: Creating Superposition

**Circuit:** H gate on qubit 0

**Mathematical Steps:**
```
Initial:    |ψ₀⟩ = |00⟩
After H:    |ψ₁⟩ = 1/√2(|00⟩ + |10⟩)
```

**Result:**
- State: `0.707|00⟩ + 0.707|10⟩`
- Probabilities: |00⟩: 50%, |10⟩: 50%
- Qubit 0 is in superposition, qubit 1 is in |0⟩

### Example 2: Bell State (Entanglement)

**Circuit:** H gate on qubit 0, then CNOT with control on qubit 0

**Mathematical Steps:**
```
Initial:      |ψ₀⟩ = |00⟩
After H(q0):  |ψ₁⟩ = 1/√2(|00⟩ + |10⟩)
After CNOT:   |ψ₂⟩ = 1/√2(|00⟩ + |11⟩) = |Φ⁺⟩
```

**Matrix Calculation:**
```
H ⊗ I applied to |00⟩:
[1/√2]   [1  1]   [1]   [1/√2]
[1/√2] = [1 -1] × [0] = [1/√2]
[0   ]   [      ]   [0]   [0   ]
[0   ]                   [0   ]

After tensor product with I on second qubit:
|ψ₁⟩ = 1/√2(|00⟩ + |10⟩)

CNOT applied:
[1 0 0 0]   [1/√2]   [1/√2]
[0 1 0 0] × [0   ] = [0   ]
[0 0 0 1]   [1/√2]   [1/√2]
[0 0 1 0]   [0   ]   [0   ]

|ψ₂⟩ = 1/√2(|00⟩ + |11⟩)
```

**Result:**
- State: `0.707|00⟩ + 0.707|11⟩` (Bell state Φ⁺)
- Probabilities: |00⟩: 50%, |11⟩: 50%
- **Entangled!** Measuring one qubit instantly determines the other
- If q0 is measured as 0, q1 must be 0
- If q0 is measured as 1, q1 must be 1

### Example 3: Phase Manipulation

**Circuit:** H gate on qubit 0, S gate on qubit 0, H gate on qubit 0

**Mathematical Steps:**
```
Initial:      |ψ₀⟩ = |00⟩
After H(q0):  |ψ₁⟩ = 1/√2(|00⟩ + |10⟩)
After S(q0):  |ψ₂⟩ = 1/√2(|00⟩ + i|10⟩)
After H(q0):  |ψ₃⟩ = 1/2[(1+i)|00⟩ + (1-i)|10⟩]
```

**Result:**
- Complex amplitudes with phase information
- Demonstrates phase interference effects
- H-S-H sequence creates specific phase patterns

### Example 4: GHZ-like State (for 2 qubits)

**Circuit:** H on q0, CNOT(q0→q1), X on q1

**Mathematical Steps:**
```
Initial:          |ψ₀⟩ = |00⟩
After H(q0):      |ψ₁⟩ = 1/√2(|00⟩ + |10⟩)
After CNOT:       |ψ₂⟩ = 1/√2(|00⟩ + |11⟩)
After X(q1):      |ψ₃⟩ = 1/√2(|01⟩ + |10⟩)
```

**Result:**
- State: `0.707|01⟩ + 0.707|10⟩`
- Entangled state with different correlation pattern
- Anti-correlated: if q0=0 then q1=1, if q0=1 then q1=0

## 📁 Project Structure

```
quantum-circuit-simulation/
├── backend/                          # Python Flask API server
│   ├── app.py                       # Main Flask application with simulation logic
│   └── requirements.txt             # Python dependencies (Flask, Qiskit, etc.)
│
├── frontend/                        # Next.js React application
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.js             # Main page component
│   │   │   ├── layout.js           # Application layout
│   │   │   ├── globals.css         # Global styles
│   │   │   └── api/
│   │   │       └── simulate/
│   │   │           └── route.js    # API route proxy to backend
│   │   └── components/
│   │       ├── CircuitBoard.jsx    # Main circuit builder component
│   │       ├── DualSphere.jsx      # Dual Bloch sphere visualization
│   │       ├── Sphere.js           # Single Bloch sphere (Three.js)
│   │       └── ProbabilityBarChart.js # Probability distribution chart
│   ├── public/                      # Static assets
│   ├── package.json                 # Node.js dependencies
│   ├── next.config.mjs             # Next.js configuration
│   ├── tailwind.config.js          # Tailwind CSS configuration
│   └── postcss.config.mjs          # PostCSS configuration
│
├── .vscode/                         # VS Code settings
├── .gitignore                       # Git ignore file
├── supervisord.conf                # Process management configuration
└── README.md                        # This file
```

### Key Components

#### Backend (`app.py`)

The backend handles all quantum simulation logic:

**Core Functions:**
- `format_statevector(statevector)`: Formats state vectors into readable ket notation
- `probs_from_statevector(statevector)`: Calculates measurement probabilities
- `gate_text_for_column(col)`: Generates human-readable gate descriptions
- `explanation_for_column(col, probs_map)`: Provides educational explanations for each gate
- `detect_entanglement(statevector, prob_map)`: Mathematically detects entangled states

**API Endpoints:**
- `/api/simulate`: Main simulation endpoint
- `/api/health`: Health check endpoint

**Simulation Process:**
1. Receives circuit description as JSON
2. Builds Qiskit QuantumCircuit progressively
3. Simulates using AerSimulator after each gate
4. Captures intermediate states for step-by-step display
5. Detects entanglement using determinant criterion
6. Returns state vectors, probabilities, and explanations

#### Frontend Components

**`CircuitBoard.jsx`**
- Drag-and-drop quantum circuit builder
- Manages circuit state (12 time steps × 2 qubits)
- Handles single-qubit gates (H, X, Y, Z, S, T)
- Handles two-qubit gates (CNOT, CZ)
- Displays gate information tooltips with matrices
- Shows step-by-step execution results
- Probability bar chart integration

**`DualSphere.jsx`**
- Renders two Bloch spheres side-by-side
- Visualizes each qubit's reduced state
- Uses Three.js for 3D graphics
- Interactive camera controls
- Color-coded axes (X=red, Y=green, Z=blue)

**`Sphere.js`**
- Individual Bloch sphere implementation
- Converts state vector to Bloch sphere coordinates
- Formulas used:
  ```
  θ = 2 * arccos(|α|)
  φ = arg(β) - arg(α)
  x = sin(θ) * cos(φ)
  y = sin(θ) * sin(φ)
  z = cos(θ)
  ```

**`ProbabilityBarChart.js`**
- Plotly.js bar chart for measurement probabilities
- Highlights entangled basis states
- Color-coded bars for visual clarity
- Shows percentages for each basis state

## 📚 API Reference

### POST /api/simulate

Simulates a quantum circuit and returns comprehensive results.

**Endpoint:** `POST http://localhost:5000/api/simulate`

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "circuit": [
    {"q0": "H", "q1": null},
    {"q0": "CNOT_control", "q1": null}
  ]
}
```

**Circuit Format:**
- Array of time step objects
- Each object has keys `q0` and `q1` for the two qubits
- Single-qubit gates: `"H"`, `"X"`, `"Y"`, `"Z"`, `"S"`, `"T"`
- Two-qubit control: `"CNOT_control"` or `"CZ_control"`
- Empty slot: `null`

**Response:**
```json
{
  "statevector_str": "(0.707)|00⟩ + (0.707)|11⟩",
  "probabilities": {
    "00": 50.0,
    "01": 0.0,
    "10": 0.0,
    "11": 50.0
  },
  "human_steps": [
    {
      "step": 1,
      "text": "H on q0",
      "statevector_str": "(0.707)|00⟩ + (0.707)|10⟩",
      "probabilities": {"00": 50.0, "01": 0.0, "10": 50.0, "11": 0.0},
      "explanation": "H created a superposition, splitting amplitude across basis states."
    },
    {
      "step": 2,
      "text": "CNOT: control=q0 target=q1",
      "statevector_str": "(0.707)|00⟩ + (0.707)|11⟩",
      "probabilities": {"00": 50.0, "01": 0.0, "10": 0.0, "11": 50.0},
      "explanation": "CNOT flips the target when the control is |1⟩, creating correlation and potential entanglement."
    }
  ],
  "visualizationHints": {
    "entangled": true,
    "highlight": ["00", "11"]
  }
}
```

**Response Fields:**
- `statevector_str`: Final quantum state in Dirac notation
- `probabilities`: Measurement probabilities for each basis state (%)
- `human_steps`: Array of intermediate steps with explanations
- `visualizationHints`: Metadata for visualization
  - `entangled`: Boolean indicating if state is entangled
  - `highlight`: Basis states to highlight (if entangled)

**Error Response:**
```json
{
  "error": "Simulation failed",
  "details": "Error message here"
}
```

### GET /api/health

Health check endpoint to verify backend is running.

**Response:**
```json
{
  "status": "ok"
}
```

## 🔧 Development

### Backend Development

**Environment Setup:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

**Running in Development Mode:**
```bash
python app.py
```

**Adding New Gates:**

1. Add gate to `apply_column` function in `app.py`:
```python
if gate_q0 == 'my_gate':
    qc.my_gate(0)  # Use appropriate Qiskit gate method
```

2. Add explanation in `explanation_for_column`:
```python
if q0 == 'my_gate':
    return "My gate does something interesting."
```

3. Update frontend gate palette (see Frontend Development)

**Testing Simulation:**
```bash
curl -X POST http://localhost:5000/api/simulate \
  -H "Content-Type: application/json" \
  -d '{"circuit": [{"q0": "H", "q1": null}]}'
```

### Frontend Development

**Environment Setup:**
```bash
cd frontend
npm install
```

**Running Development Server:**
```bash
npm run dev
```

**Building for Production:**
```bash
npm run build
npm start
```

**Linting:**
```bash
npm run lint
```

**Adding New Gates to UI:**

1. Add gate to `GATE_INFO` object in `CircuitBoard.jsx`:
```javascript
'MY_GATE': {
  name: 'My Gate Name',
  matrix: [['a', 'b'], ['c', 'd']],
  description: 'What my gate does'
}
```

2. Add to `GATES` array:
```javascript
{ name: 'MY_GATE', display: 'MG', class: 'bg-gray-200' }
```

3. Update backend to handle the new gate

**Component Structure:**
- `CircuitBoard.jsx`: Main UI logic and state management
- `DualSphere.jsx`: Wraps two Sphere components
- `Sphere.js`: Three.js Bloch sphere rendering
- `ProbabilityBarChart.js`: Plotly chart configuration

### Development Tips

1. **Hot Reload**: Both frontend and backend support hot reload during development
2. **CORS**: Already configured for local development (ports 3000 and 5000)
3. **Debugging**: Use browser DevTools for frontend, Python debugger for backend
4. **State Inspection**: Check browser console for circuit state and API responses
5. **Qiskit Documentation**: Reference [Qiskit docs](https://qiskit.org/documentation/) for gate implementations

### Testing Circuits

Common test circuits for validation:

**Identity Test:**
```json
{"circuit": []}
```
Expected: `(1.000)|00⟩`, Probabilities: 100% for |00⟩

**Hadamard Test:**
```json
{"circuit": [{"q0": "H", "q1": null}]}
```
Expected: Equal superposition on q0

**Bell State Test:**
```json
{"circuit": [
  {"q0": "H", "q1": null},
  {"q0": "CNOT_control", "q1": null}
]}
```
Expected: Entangled state `0.707|00⟩ + 0.707|11⟩`

## 🔍 Troubleshooting

### Common Issues

#### 1. CORS Error
**Problem:** Browser console shows CORS policy error

**Solution:**
- Ensure backend is running on port 5000
- Ensure frontend is running on port 3000 (or configured port)
- Check that `flask-cors` is installed in backend
- Verify CORS is enabled in `app.py`

#### 2. Module Not Found (Backend)
**Problem:** `ModuleNotFoundError: No module named 'qiskit'`

**Solution:**
```bash
cd backend
pip install -r requirements.txt
```

If issues persist:
```bash
pip install --upgrade pip
pip install Flask flask-cors qiskit qiskit-aer numpy gunicorn
```

#### 3. Connection Refused
**Problem:** Frontend cannot connect to backend

**Solution:**
- Verify backend is running: `curl http://localhost:5000/api/health`
- Check backend terminal for errors
- Ensure no firewall blocking port 5000
- Try restarting backend server

#### 4. npm Install Errors (Frontend)
**Problem:** `npm install` fails with dependency errors

**Solution:**
```bash
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

If using older Node.js version:
```bash
# Update Node.js to version 18 or higher
nvm install 18
nvm use 18
npm install
```

#### 5. Blank Page or JavaScript Errors
**Problem:** Frontend loads but shows blank page

**Solution:**
- Check browser console for errors (F12)
- Verify all dependencies installed: `npm install`
- Clear browser cache
- Check that backend API is reachable
- Verify Next.js is running: should see compilation messages

#### 6. Bloch Sphere Not Rendering
**Problem:** 3D visualization not showing

**Solution:**
- Verify WebGL is enabled in browser
- Check browser console for Three.js errors
- Test WebGL support: visit https://get.webgl.org/
- Try different browser (Chrome recommended)
- Update graphics drivers if using desktop

#### 7. Simulation Returns Errors
**Problem:** Clicking "Simulate" returns error message

**Solution:**
- Check backend logs for detailed error
- Verify circuit format is correct (see API Reference)
- Ensure Qiskit is properly installed
- Try simpler circuit (e.g., just H gate)
- Check Python version: requires 3.8+

#### 8. Performance Issues
**Problem:** Simulation is slow or UI is laggy

**Solution:**
- Reduce number of gates in circuit
- Close other applications to free memory
- Check CPU usage in task manager
- For production, use Gunicorn instead of Flask dev server
- Consider using cloud deployment for heavy computations

### Debug Mode

**Enable Backend Debug Logging:**
```python
# In app.py
logging.basicConfig(level=logging.DEBUG)
```

**Enable Frontend Debug Mode:**
```bash
# Set environment variable
export NODE_ENV=development
npm run dev
```

**Check Backend Health:**
```bash
curl http://localhost:5000/api/health
```

**Test Backend Simulation:**
```bash
curl -X POST http://localhost:5000/api/simulate \
  -H "Content-Type: application/json" \
  -d '{"circuit": [{"q0": "H", "q1": null}]}'
```

### Dependency Issues

**Backend Requirements:**
```
Flask>=2.0.0
flask-cors>=3.0.10
qiskit>=0.43.0
qiskit-aer>=0.12.0
numpy>=1.21.0
gunicorn>=20.1.0
```

**Frontend Requirements:**
- Node.js 18+ (LTS recommended)
- npm 9+ or yarn 1.22+

**Verify Installations:**
```bash
# Python version
python --version  # Should be 3.8+

# Node.js version
node --version    # Should be 18+

# Package versions
pip list | grep -E "qiskit|Flask|numpy"
npm list next react three plotly
```

### Getting Help

If you encounter issues not listed here:

1. **Check Logs**: Review terminal output from both frontend and backend
2. **Browser Console**: Press F12 and check Console and Network tabs
3. **GitHub Issues**: Search existing issues or create a new one
4. **Qiskit Forums**: For quantum computing specific questions
5. **Stack Overflow**: Tag questions with `qiskit`, `quantum-computing`, `next.js`

### Known Limitations

- **Two Qubits Only**: Currently supports maximum of 2 qubits
- **Circuit Size**: Maximum 12 time steps per circuit
- **Browser Compatibility**: Best on Chrome, Firefox, Edge; Safari may have WebGL issues
- **Mobile**: Optimized for desktop; mobile experience may be limited
- **State Complexity**: Very complex states may have truncated display

## 🤝 Contributing

We welcome contributions! Here's how to get started:

### Development Workflow

1. **Fork the Repository**
```bash
git clone https://github.com/YOUR_USERNAME/quantum-circuit-simulation.git
cd quantum-circuit-simulation
```

2. **Create a Feature Branch**
```bash
git checkout -b feature/your-feature-name
```

3. **Set Up Development Environment**
```bash
# Backend
cd backend
pip install -r requirements.txt
python app.py

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

4. **Make Your Changes**
- Follow existing code style
- Add comments for complex logic
- Update documentation if needed

5. **Test Your Changes**
- Test manually with various circuits
- Verify backend API with curl/Postman
- Check browser console for errors
- Test on multiple browsers if UI changes

6. **Commit and Push**
```bash
git add .
git commit -m "feat: add your feature description"
git push origin feature/your-feature-name
```

7. **Create Pull Request**
- Go to GitHub and create PR from your fork
- Describe your changes clearly
- Reference any related issues

### Contribution Guidelines

**Code Style:**
- Python: Follow PEP 8
- JavaScript: Use ES6+ features
- React: Functional components with hooks
- Comments: Explain "why", not "what"

**Commit Messages:**
- Use conventional commits format
- Examples:
  - `feat: add Y gate support`
  - `fix: correct Bell state calculation`
  - `docs: update API reference`
  - `refactor: simplify circuit rendering`

**Areas for Contribution:**
- 🐛 Bug fixes
- ✨ New quantum gates
- 📊 Additional visualizations
- 📚 Documentation improvements
- 🧪 Test coverage
- ♿ Accessibility improvements
- 🌐 Internationalization
- 📱 Mobile responsiveness
- ⚡ Performance optimizations
- 🎨 UI/UX enhancements

### Ideas for Enhancement

**Short Term:**
- Add more single-qubit gates (Rx, Ry, Rz rotations)
- Implement gate parameters (custom rotation angles)
- Circuit export/import functionality
- Circuit diagram SVG export
- Measurement operations
- Conditional operations

**Medium Term:**
- Support for 3+ qubits
- Quantum algorithm templates (Deutsch-Jozsa, Grover, etc.)
- Circuit optimization suggestions
- Real quantum hardware integration (IBM Q, etc.)
- Interactive tutorials for beginners

**Long Term:**
- Visual quantum algorithm builder
- Circuit composer with timing controls
- Quantum error correction visualization
- Educational lesson plans integration
- Collaborative circuit building

### Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on the problem, not the person
- Help newcomers learn and grow
- Follow project conventions

## 📄 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

### Libraries and Frameworks

- **[Qiskit](https://qiskit.org/)**: IBM's open-source quantum computing framework
  - Developed by IBM Research
  - Provides quantum circuit construction and simulation
  - Industry-standard quantum computing toolkit

- **[Three.js](https://threejs.org/)**: 3D graphics library
  - Created by Ricardo Cabello (mrdoob)
  - Powers the Bloch sphere visualization
  - Makes WebGL accessible

- **[Plotly.js](https://plotly.com/javascript/)**: Plotting library
  - Open-source graphing library
  - Interactive probability bar charts
  - Responsive and customizable

- **[Next.js](https://nextjs.org/)**: React framework
  - Developed by Vercel
  - Server-side rendering and optimization
  - Modern web development

- **[React](https://react.dev/)**: UI library
  - Developed by Meta
  - Component-based architecture
  - Efficient rendering

- **[Tailwind CSS](https://tailwindcss.com/)**: CSS framework
  - Utility-first styling
  - Rapid UI development
  - Responsive design made easy

### Educational Resources

- **Quantum Computation and Quantum Information** by Nielsen & Chuang
- **IBM Quantum Learning**: [https://learning.quantum.ibm.com/](https://learning.quantum.ibm.com/)
- **Qiskit Textbook**: [https://qiskit.org/learn](https://qiskit.org/learn)
- **Quantum Country**: [https://quantum.country/](https://quantum.country/)

### Inspiration

This project was inspired by:
- IBM Quantum Composer
- Microsoft Q# quantum simulators
- Quirk quantum circuit simulator
- The need for educational quantum computing tools

## 📞 Contact & Support

- **GitHub Issues**: [Report bugs or request features](https://github.com/TabasKo0/quantum-circuit-simulation/issues)
- **Discussions**: Share ideas and ask questions
- **Email**: For private inquiries

## 🚀 Future Roadmap

### Version 2.0
- [ ] Support for 4+ qubits
- [ ] Custom gate parameters (rotation angles)
- [ ] Circuit import/export (QASM format)
- [ ] Quantum algorithm library
- [ ] Real-time collaboration

### Version 3.0
- [ ] Integration with real quantum hardware
- [ ] Advanced visualization modes
- [ ] Quantum error correction
- [ ] Performance optimizations for large circuits
- [ ] Mobile app version

---

**Built with ❤️ for quantum computing education and exploration**

*For questions, suggestions, or contributions, please open an issue or submit a pull request on GitHub.*
