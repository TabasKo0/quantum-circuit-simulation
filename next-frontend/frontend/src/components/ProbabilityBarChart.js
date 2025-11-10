import React, { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';

// Load Plotly only on the client
const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

export default function ProbabilityBarChart({
  probabilities = {},
  reverseBitOrder = false,
  highlightKeys = []
}) {
  const containerRef = useRef(null);
  const [chartHeight, setChartHeight] = useState(350);
  const [containerWidth, setContainerWidth] = useState(0);

  const basis = ['|00⟩', '|01⟩', '|10⟩', '|11⟩'];

  // Normalize highlight keys into binary strings like "00","01","10","11"
  const normalizedHighlightSet = (() => {
    const out = new Set();
    (highlightKeys || []).forEach((h) => {
      if (h === null || h === undefined) return;
      if (typeof h === 'number' && Number.isFinite(h)) {
        out.add(String(h.toString(2).padStart(2, '0')));
        return;
      }
      const s = String(h).trim();
      // prefer extracting explicit binary substring like "10" from "|10⟩" or "10"
      const binMatch = s.match(/[01]{1,}/);
      if (binMatch) {
        out.add(binMatch[0].padStart(2, '0'));
        return;
      }
      // fallback: try parse as integer index
      const n = parseInt(s, 10);
      if (!Number.isNaN(n)) out.add(n.toString(2).padStart(2, '0'));
    });
    return out;
  })();

  // compute values and keys used for x axis
  const keys = basis.map((_, i) => i.toString(2).padStart(2, '0'));
  const values = keys.map((k) => {
    let key = k;
    if (reverseBitOrder) key = key.split('').reverse().join('');
    let val = probabilities?.[key];
    if (val === undefined) val = probabilities?.[parseInt(key, 2)];
    if (val === undefined) val = 0;
    if (typeof val === 'number' && val <= 1) val = val * 100;
    return Number(val) || 0;
  });

  // compute bar colors with highlight support (highlight uses normalized key in same bit-order as displayed)
  const colors = keys.map((k) => {
    let keyDisplayed = k;
    if (reverseBitOrder) keyDisplayed = k.split('').reverse().join('');
    return normalizedHighlightSet.has(keyDisplayed) ? '#f472b6' : '#6366f1';
  });

  // Responsive behavior
  useEffect(() => {
    if (!containerRef.current) return;
    const ResizeObs = window.ResizeObserver ?? null;
    let observer;
    const handleResize = (width) => {
      setContainerWidth(width);
      const h = Math.round(Math.max(220, Math.min(600, width * 0.6)));
      setChartHeight(h);
    };

    const rect = containerRef.current.getBoundingClientRect();
    handleResize(rect.width || 0);

    if (ResizeObs) {
      observer = new ResizeObs((entries) => {
        for (const entry of entries) {
          const w = entry.contentRect?.width ?? entry.target.getBoundingClientRect().width;
          handleResize(w);
        }
      });
      observer.observe(containerRef.current);
    } else {
      const onWin = () => {
        const w = containerRef.current?.getBoundingClientRect().width ?? 0;
        handleResize(w);
      };
      window.addEventListener('resize', onWin);
      return () => window.removeEventListener('resize', onWin);
    }

    return () => {
      if (observer && containerRef.current) observer.unobserve(containerRef.current);
    };
  }, []);

  // layout font sizes based on width
  const isNarrow = containerWidth > 0 && containerWidth < 480;
  const titleFontSize = isNarrow ? 14 : 18;
  const axisTitleSize = isNarrow ? 11 : 13;
  const tickFontSize = isNarrow ? 10 : 12;
  const textFontSize = isNarrow ? 10 : 12;

  const layout = {
    title: {
      text: 'Measurement Probabilities',
      font: { color: '#e5e7eb', size: titleFontSize }
    },
    paper_bgcolor: '#111827',
    plot_bgcolor: '#0b1020',
    font: { color: '#e5e7eb', size: tickFontSize },
    xaxis: {
      title: { text: 'Basis States', font: { color: '#e5e7eb', size: axisTitleSize } },
      tickfont: { color: '#cbd5e1', size: tickFontSize },
      gridcolor: '#1f2937',
      zerolinecolor: '#374151',
      linecolor: '#374151',
      automargin: true
    },
    yaxis: {
      title: { text: 'Probability (%)', font: { color: '#e5e7eb', size: axisTitleSize } },
      tickfont: { color: '#cbd5e1', size: tickFontSize },
      gridcolor: '#1f2937',
      zerolinecolor: '#374151',
      linecolor: '#374151',
      range: [0, 100],
      automargin: true
    },
    autosize: true,
    height: chartHeight,
    margin: {
      t: isNarrow ? 40 : 50,
      l: isNarrow ? 50 : 60,
      r: isNarrow ? 20 : 30,
      b: isNarrow ? 50 : 60
    }
  };

  const data = [
    {
      x: basis,
      y: values,
      type: 'bar',
      text: values.map((v) => `${v.toFixed(1)}%`),
      textposition: 'auto',
      textfont: { size: textFontSize, color: '#e5e7eb' },
      marker: { color: colors }
    }
  ];

  const config = {
    displayModeBar: false,
    responsive: true
  };

  return (
    <div ref={containerRef} style={{ width: '100%', display: 'block' }}>
      <Plot
        data={data}
        layout={layout}
        config={config}
        useResizeHandler={true}
        style={{ width: '100%', height: chartHeight }}
      />
    </div>
  );
}