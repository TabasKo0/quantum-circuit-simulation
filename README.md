# Quantum Circuit Simulation

A visual quantum circuit simulator with drag-and-drop interface built using Python (Qiskit) backend and HTML/JavaScript frontend. Created quantum circuits visually, simulate them in real-time, and visualize results with state vectors, probability distributions, and 3D Bloch sphere representations. 

## Features

- **Visual Circuit Builder**: Drag-and-drop interface for building quantum circuits
- **Real-time Simulation**: Powered by Qiskit for accurate quantum simulation
- **Multiple Visualizations**: 
  - State vector display in ket notation
  - Probability distribution charts
  - 3D Bloch sphere visualization
- **Supported Gates**: H (Hadamard), X (Pauli-X), S, T, CNOT, and CZ gates
- **Two-Qubit System**: Currently supports circuits with up to 2 qubits

## Technology Stack

- **Backend**: Python, Flask, Qiskit, Qiskit Aer, NumPy
- **Frontend**: HTML5, CSS3, JavaScript, Three.js, Plotly.js, Tailwind CSS
- **Architecture**: RESTful API with separated frontend and backend

## Prerequisites

- Python 3.8 or higher
- pip (Python package manager)
- Modern web browser (Chrome, Firefox, Safari, Edge)

## Setup Instructions

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

Start the Flask development server:

```bash
python app.py
```

The backend API will be available at `http://localhost:5000`

### 3. Frontend Setup

The frontend consists of static files that need to be served by a web server. You have several options:

#### Option A: Python HTTP Server (Recommended)
Open a new terminal window and navigate to the frontend directory:

```bash
cd frontend
python -m http.server 8080
```

#### Option B: Node.js HTTP Server
If you have Node.js installed:

```bash
cd frontend
npx http-server -p 8080
```

#### Option C: Live Server (VS Code Extension)
If using VS Code, install the "Live Server" extension and right-click on `index.html` to open with Live Server.

### 4. Access the Application

Open your web browser and go to `http://localhost:8080` (or the port specified by your chosen server method).

## Usage

### Building Quantum Circuits

1. **Drag Gates**: From the Gate Palette on the left, drag quantum gates onto the circuit board
2. **Supported Gates**:
   - **H**: Hadamard gate (creates superposition)
   - **X**: Pauli-X gate (bit flip)
   - **S**: S gate (phase gate)
   - **T**: T gate (π/8 phase gate)
   - **CNOT**: Controlled-NOT gate (two-qubit entangling gate)
   - **CZ**: Controlled-Z gate (two-qubit phase gate)

3. **Circuit Layout**: The circuit board shows two qubit lines (q0 and q1) with time steps progressing from left to right

### Running Simulations

1. **Simulate**: Click the "Simulate" button to run the quantum simulation
2. **View Results**: 
   - **State Vector**: Displayed in ket notation showing quantum amplitudes
   - **Probability Chart**: Bar chart showing measurement probabilities for each basis state
   - **3D Visualization**: Bloch sphere representation (if applicable)

3. **Clear Circuit**: Use the "Clear Circuit" button to reset and start over

### Example Circuits

- **Superposition**: Place an H gate on q0 to create |+⟩ = (|0⟩ + |1⟩)/√2
- **Entanglement**: Place H on q0, then CNOT with q0 as control and q1 as target to create a Bell state
- **Phase Manipulation**: Use S and T gates to apply phase rotations

## Project Structure

```
quantum-circuit-simulation/
├── backend/                    # Python Flask API server
│   ├── app.py                 # Main Flask application
│   └── requirements.txt       # Python dependencies
├── frontend/                  # Static web application
│   ├── index.html            # Main HTML page
│   ├── style.css             # Styling
│   ├── circuit.js            # Circuit building logic
│   ├── sphere.js             # 3D Bloch sphere visualization
│   └── three.min.js          # Three.js library
├── backups/                   # Development backup files
└── README.md                  # This file
```

## API Reference

### POST /simulate

Simulates a quantum circuit and returns the results.

**Request Body:**
```json
{
  "circuit": [
    {"q0": "H", "q1": null},
    {"q0": "CNOT_control", "q1": "CNOT_target"}
  ]
}
```

**Response:**
```json
{
  "statevector_str": "(0.707)|00⟩ + (0.707)|11⟩",
  "probabilities": {
    "00": 50.0,
    "01": 0.0,
    "10": 0.0,
    "11": 50.0
  }
}
```

## Development

### Backend Development

The backend is a Flask application that:
1. Receives circuit descriptions via REST API
2. Converts them to Qiskit quantum circuits
3. Simulates using Qiskit Aer
4. Returns state vectors and probabilities

To modify gate support, edit the gate mapping in `app.py`.

### Frontend Development

The frontend uses vanilla JavaScript with:
- Drag-and-drop API for circuit building
- Fetch API for backend communication
- Three.js for 3D visualizations
- Plotly.js for charts

### Adding New Gates

1. **Backend**: Add gate logic in `app.py` simulation endpoint
2. **Frontend**: Add gate to palette in `index.html` and handle in `circuit.js`

## Troubleshooting

### Common Issues

1. **"CORS Error"**: Ensure both backend (port 5000) and frontend (port 8080) are running
2. **"Module Not Found"**: Run `pip install -r requirements.txt` in the backend directory
3. **"Connection Refused"**: Check that the Flask server is running on port 5000
4. **Blank Page**: Ensure you're serving the frontend through a web server, not opening `index.html` directly

### Dependencies

**Backend Python packages:**
- Flask: Web framework
- qiskit: Quantum computing framework
- qiskit-aer: Quantum circuit simulator
- numpy: Numerical computing
- Flask-Cors: Cross-origin resource sharing

**Frontend dependencies (loaded via CDN):**
- Three.js: 3D graphics library
- Plotly.js: Plotting library  
- Tailwind CSS: Utility-first CSS framework

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source. See the repository for license details.

## Acknowledgments

- Built with [Qiskit](https://qiskit.org/) for quantum simulation
- Uses [Three.js](https://threejs.org/) for 3D visualizations
- Plotting powered by [Plotly.js](https://plotly.com/javascript/)
