from flask import Flask, request, jsonify
from flask_cors import CORS
from qiskit import QuantumCircuit
from qiskit_aer import AerSimulator
import numpy as np
import logging
import os

logging.basicConfig(level=logging.INFO)

app = Flask(__name__)
# Enable CORS (you can restrict origins in production)
CORS(app)


def format_statevector(statevector):
    """Formats the statevector into a readable ket notation string."""
    num_qubits = int(np.log2(len(statevector)))
    ket_string = ""
    for i, amp in enumerate(statevector):
        if not np.isclose(amp, 0):
            basis_state = f"|{i:0{num_qubits}b}⟩"
            amp_str = f"{amp.real:.3f}"
            if not np.isclose(amp.imag, 0):
                if amp.imag > 0:
                    amp_str += f" + {amp.imag:.3f}j"
                else:
                    amp_str += f" - {-amp.imag:.3f}j"
            if ket_string:
                ket_string += f" + ({amp_str}){basis_state}"
            else:
                ket_string += f"({amp_str}){basis_state}"
    return ket_string


def probs_from_statevector(statevector):
    """Return probability map {'00': p, ...} in percentages for 2-qubit statevector."""
    probabilities = np.abs(statevector) ** 2 * 100.0
    return {
        '00': float(probabilities[0]),
        '01': float(probabilities[1]),
        '10': float(probabilities[2]),
        '11': float(probabilities[3]),
    }


def gate_text_for_column(col):
    """
    Build a compact human-readable description for a column dict like:
    {'q0':'H'} or {'q0':'CNOT_control'}.
    """
    q0 = (col.get('q0') or '').lower()
    q1 = (col.get('q1') or '').lower()
    # Two-qubit gates (control only provided; target is the other qubit)
    if q0 == 'cnot_control':
        return "CNOT: control=q0 target=q1"
    if q1 == 'cnot_control':
        return "CNOT: control=q1 target=q0"
    if q0 == 'cz_control':
        return "CZ: control=q0 target=q1"
    if q1 == 'cz_control':
        return "CZ: control=q1 target=q0"
    # Single-qubit gates
    single_map = {'h': 'H', 'x': 'X', 'y': 'Y', 'z': 'Z', 's': 'S', 't': 'T'}
    texts = []
    if q0 in single_map:
        texts.append(f"{single_map[q0]} on q0")
    if q1 in single_map:
        texts.append(f"{single_map[q1]} on q1")
    return " & ".join(texts) if texts else "No operation"


def explanation_for_column(col, probs_map):
    """Return a simple 1–2 sentence explanation for the column."""
    q0 = (col.get('q0') or '').lower()
    q1 = (col.get('q1') or '').lower()
    if q0 == 'cnot_control' or q1 == 'cnot_control':
        return "CNOT flips the target when the control is |1⟩, creating correlation and potential entanglement."
    if q0 == 'cz_control' or q1 == 'cz_control':
        return "CZ adds a phase when the control is |1⟩, which can create entanglement with prior superposition."
    if q0 == 'h' or q1 == 'h':
        return "H created a superposition, splitting amplitude across basis states."
    if q0 in ('x', 'y', 'z') or q1 in ('x', 'y', 'z'):
        return "A Pauli gate rotated or flipped the qubit state."
    if q0 in ('s', 't') or q1 in ('s', 't'):
        return "A phase gate adjusted the relative phase of amplitudes."
    return "Applied gate(s) to advance the circuit."


def detect_entanglement(statevector, prob_map):
    """
    Deterministic entanglement test for pure two-qubit states using the determinant criterion:
    |a*d - b*c| > eps  => entangled (where statevector = [a, b, c, d]).
    """
    eps = 1e-8
    a, b, c, d = statevector
    det_val = abs(a * d - b * c)
    entangled = det_val > eps
    highlight = []
    if entangled:
        pair_00_11 = prob_map.get('00', 0.0) + prob_map.get('11', 0.0)
        pair_01_10 = prob_map.get('01', 0.0) + prob_map.get('10', 0.0)
        if pair_00_11 >= pair_01_10 and pair_00_11 > 0:
            highlight = [key for key in ('00', '11') if prob_map.get(key, 0.0) > 0]
        elif pair_01_10 > 0:
            highlight = [key for key in ('01', '10') if prob_map.get(key, 0.0) > 0]
    return entangled, highlight


@app.route('/api/simulate', methods=['POST'])
def simulate():
    """API endpoint to simulate a quantum circuit."""
    try:
        body = request.get_json(silent=True) or {}
        circuit_data = body.get('circuit', [])
        num_qubits = 2

        # Helper to apply a column to a circuit
        def apply_column(qc, col):
            gate_q0 = (col.get('q0') or '').lower()
            gate_q1 = (col.get('q1') or '').lower()
            # Two-qubit gates (control only)
            if gate_q0 == 'cnot_control':
                qc.cx(0, 1)
            if gate_q1 == 'cnot_control':
                qc.cx(1, 0)
            if gate_q0 == 'cz_control':
                qc.cz(0, 1)
            if gate_q1 == 'cz_control':
                qc.cz(1, 0)
            # Single-qubit
            single_handlers = {
                'h': lambda q: qc.h(q),
                'x': lambda q: qc.x(q),
                'y': lambda q: qc.y(q),
                'z': lambda q: qc.z(q),
                's': lambda q: qc.s(q),
                't': lambda q: qc.t(q),
            }
            if gate_q0 in single_handlers:
                single_handlers[gate_q0](0)
            if gate_q1 in single_handlers:
                single_handlers[gate_q1](1)

        simulator = AerSimulator()

        # Build progressively to compute per-step human_steps
        qc_progress = QuantumCircuit(num_qubits, num_qubits)
        human_steps = []
        step_counter = 1
        for col in circuit_data:
            apply_column(qc_progress, col)
            qc_tmp = qc_progress.copy()
            qc_tmp.save_statevector()
            result_step = simulator.run(qc_tmp).result()
            statevector_step = result_step.get_statevector()
            sv = statevector_step.data if hasattr(statevector_step, 'data') else np.array(statevector_step)
            statevector_str_step = format_statevector(sv)
            probs_map_step = probs_from_statevector(sv)
            if gate_text_for_column(col) != "No operation":
                human_steps.append({
                    'step': step_counter,
                    'text': gate_text_for_column(col),
                    'statevector_str': statevector_str_step,
                    'probabilities': probs_map_step,
                    'explanation': explanation_for_column(col, probs_map_step)
                })
                step_counter += 1

        # Final state from full circuit
        qc_final = qc_progress
        qc_final.save_statevector()
        result = simulator.run(qc_final).result()
        statevector = result.get_statevector()
        sv_final = statevector.data if hasattr(statevector, 'data') else np.array(statevector)
        prob_map_final = probs_from_statevector(sv_final)

        entangled, highlight = detect_entanglement(sv_final, prob_map_final)
        visualization_hints = {'entangled': bool(entangled)}
        if highlight:
            visualization_hints['highlight'] = highlight

        response = {
            'statevector_str': format_statevector(sv_final),
            'probabilities': prob_map_final,
            'human_steps': human_steps,
            'visualizationHints': visualization_hints
        }

        logging.info("Simulation response prepared")
        return jsonify(response)
    except Exception as e:
        logging.exception("Simulation failed")
        return jsonify({'error': 'Simulation failed', 'details': str(e)}), 500


@app.route('/api/health', methods=['GET'])
def api_health():
    return jsonify({"status": "ok"})


# Only run the dev server when executed directly (Gunicorn will import this module).
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=True, host='0.0.0.0', port=port)