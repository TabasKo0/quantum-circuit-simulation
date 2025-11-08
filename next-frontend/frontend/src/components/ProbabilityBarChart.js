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
          marker: { color: '#6366f1' },
        },
      ]}
      layout={{
        title: { 
          text: 'Measurement Probabilities',
          font: { color: '#e5e7eb' }
        },
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
        margin: { t: 50, l: 60, r: 30, b: 60 }
      }}
      style={{ width: '100%', height: 350 }}
      config={{ displayModeBar: false }}
    />
  );
}