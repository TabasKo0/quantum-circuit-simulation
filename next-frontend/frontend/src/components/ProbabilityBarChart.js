import dynamic from 'next/dynamic';

// Use dynamic import to ensure Plotly is only loaded on the client (avoids "self is not defined" SSR error)
const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

export default function ProbabilityBarChart({ probabilities }) {
  const basis = ['|00⟩', '|01⟩', '|10⟩', '|11⟩'];
  const values = basis.map((b, i) => {
    const key = String(i).padStart(2, '0');
    return probabilities[key] || 0;
  });

  return (
    <Plot
      data={[
        {
          x: basis,
          y: values,
          type: 'bar',
          text: values.map(v => v.toFixed(1) + '%'),
          textposition: 'auto',
          marker: { color: '#4a4a8a' },
        },
      ]}
      layout={{
        title: 'Measurement Probabilities',
        xaxis: { title: 'Basis States' },
        yaxis: { title: 'Probability (%)', range: [0, 100] },
        margin: { t: 40, l: 40, r: 20, b: 40 }
      }}
      style={{ width: '100%', height: 300 }}
      config={{ displayModeBar: false }}
    />
  );
}