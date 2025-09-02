from flask import Flask, request, jsonify
from flask_cors import CORS
from qiskit import QuantumCircuit
from qiskit_aer import AerSimulator
import numpy as np
import json

app = Flask(__name__)
# Enable CORS to allow requests from the frontend
CORS(app)

def format_statevector(statevector):
    """Formats the statevector into a readable ket notation string."""
    num_qubits = int(np.log2(len(statevector)))
    ket_string = ""
    for i, amp in enumerate(statevector):
        if not np.isclose(amp, 0):
            # Format the basis state (e.g., |01⟩ for i=1)
            basis_state = f"|{i:0{num_qubits}b}⟩"
            
            # Format the complex amplitude
            amp_str = f"{amp.real:.3f}"
            if not np.isclose(amp.imag, 0):
                if amp.imag > 0:
                    amp_str += f" + {amp.imag:.3f}j"
                else:
                    amp_str += f" - {-amp.imag:.3f}j"
            
            if ket_string: # Add a "+" if it's not the first term
                ket_string += f" + ({amp_str}){basis_state}"
            else:
                ket_string += f"({amp_str}){basis_state}"
    return ket_string

@app.route('/simulate', methods=['POST'])
def simulate():
    """API endpoint to simulate a quantum circuit."""
    circuit_data = request.json['circuit']
    num_qubits = 2
    
    # Create a QuantumCircuit object from the frontend data
    qc = QuantumCircuit(num_qubits, num_qubits)

    # The circuit_data is a list of columns (time-steps)
    for col in circuit_data:
        # col is a dict like {'q0': 'H', 'q1': 'X'} or {'q0': 'CNOT_control', 'q1': 'CNOT_target'}
        
        gate_q0 = col.get('q0')
        gate_q1 = col.get('q1')

        if gate_q0:
            if gate_q0.lower() == 'h': qc.h(0)
            elif gate_q0.lower() == 'x': qc.x(0)
            elif gate_q0.lower() == 's': qc.s(0)
            elif gate_q0.lower() == 't': qc.t(0)
            elif gate_q0.lower() == 'cnot_control': qc.cx(0, 1)
            elif gate_q0.lower() == 'cz_control': qc.cz(0, 1)

        if gate_q1:
            if gate_q1.lower() == 'h': qc.h(1)
            elif gate_q1.lower() == 'x': qc.x(1)
            elif gate_q1.lower() == 's': qc.s(1)
            elif gate_q1.lower() == 't': qc.t(1)
            elif gate_q1.lower() == 'cnot_control': qc.cx(1, 0)
            elif gate_q1.lower() == 'cz_control': qc.cz(1, 0)

    # Use the AerSimulator to get the final statevector
    simulator = AerSimulator()
    qc.save_statevector()
    result = simulator.run(qc).result()
    statevector = result.get_statevector()
    
    # Calculate probabilities from the statevector amplitudes
    probabilities = np.abs(statevector)**2 * 100 # In percentage
    
    # Format the results into a JSON response
    response = {
        'statevector_str': format_statevector(statevector.data),
        'probabilities': {
            '00': float(probabilities[0]),
            '01': float(probabilities[1]),
            '10': float(probabilities[2]),
            '11': float(probabilities[3]),
        }
    }

    return jsonify(response)

if __name__ == '__main__':
    app.run(debug=True, port=5000)