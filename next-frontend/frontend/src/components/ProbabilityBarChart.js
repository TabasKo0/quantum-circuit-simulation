import dynamic from 'next/dynamic';

// Use dynamic import to ensure Plotly is only loaded on the client (avoids "self is not defined" SSR error)
const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

export default function ProbabilityBarChart({ probabilities = {}, reverseBitOrder = false, highlightKeys = [] }) {
  const basis = ['|00⟩', '|01⟩', '|10⟩', '|11⟩'];

  const values = basis.map((_, i) => {
    // produce binary key: "00", "01", "10", "11"
    let key = i.toString(2).padStart(2, '0');

    // optionally reverse bit order if your backend uses little-endian ordering
    if (reverseBitOrder) {
      key = key.split('').reverse().join('');
    }

    // try to read value as either probabilities["10"] or probabilities[2] (some APIs use numeric keys)
    let val = probabilities?.[key];
    if (val === undefined) val = probabilities?.[parseInt(key, 2)];
    if (val === undefined) val = 0;

    // if the value looks like a fraction 0..1 convert to percent
    if (typeof val === 'number' && val <= 1) val = val * 100;

    return Number(val) || 0;
  });

  const colors = basis.map((_, i) => {
    let key = i.toString(2).padStart(2, '0');
    if (reverseBitOrder) key = key.split('').reverse().join('');
    return highlightKeys.includes(key) ? '#f472b6' : '#6366f1'; // highlight in pink
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
          marker: { color: colors },
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