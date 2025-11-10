import React, { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';

// Load Plotly only on the client
const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

export default function ProbabilityBarChart({ probabilities = {}, reverseBitOrder = false }) {
  const containerRef = useRef(null);
  const [chartHeight, setChartHeight] = useState(350);
  const [containerWidth, setContainerWidth] = useState(0);

  // compute values from probabilities (kept your original logic)
  const basis = ['|00⟩', '|01⟩', '|10⟩', '|11⟩'];
  const values = basis.map((_, i) => {
    let key = i.toString(2).padStart(2, '0');
    if (reverseBitOrder) key = key.split('').reverse().join('');
    let val = probabilities?.[key];
    if (val === undefined) val = probabilities?.[parseInt(key, 2)];
    if (val === undefined) val = 0;
    if (typeof val === 'number' && val <= 1) val = val * 100;
    return Number(val) || 0;
  });

  // Responsive behavior:
  // - use ResizeObserver to watch the container size
  // - compute a reasonable height and font sizes based on width
  useEffect(() => {
    if (!containerRef.current) return;
    // ResizeObserver guard for older browsers
    const ResizeObs = window.ResizeObserver ?? null;
    let observer;
    const handleResize = (width) => {
      setContainerWidth(width);

      // Choose a height based on width to keep aspect ratio reasonable.
      // clamp between 220 and 600.
      const h = Math.round(Math.max(220, Math.min(600, width * 0.6)));
      setChartHeight(h);
    };

    // initial measurement
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
      // fallback: window resize
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
  }, [containerRef]);

  // adjust layout/fonts for small screens
  const isNarrow = containerWidth > 0 && containerWidth < 480;
  const titleFontSize = isNarrow ? 14 : 18;
  const axisTitleSize = isNarrow ? 11 : 13;
  const tickFontSize = isNarrow ? 10 : 12;
  const textFontSize = isNarrow ? 10 : 12;

  const layout = {
    title: {
      text: 'Measurement Probabilities',
      font: { color: '#e5e7eb', size: titleFontSize },
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
      automargin: true,
    },
    yaxis: {
      title: { text: 'Probability (%)', font: { color: '#e5e7eb', size: axisTitleSize } },
      tickfont: { color: '#cbd5e1', size: tickFontSize },
      gridcolor: '#1f2937',
      zerolinecolor: '#374151',
      linecolor: '#374151',
      range: [0, 100],
      automargin: true,
    },
    autosize: true,
    height: chartHeight,
    margin: {
      t: isNarrow ? 40 : 50,
      l: isNarrow ? 50 : 60,
      r: isNarrow ? 20 : 30,
      b: isNarrow ? 50 : 60,
    },
  };

  const data = [
    {
      x: basis,
      y: values,
      type: 'bar',
      // show percentage text. use texttemplate for consistent formatting
      text: values.map((v) => `${v.toFixed(1)}%`),
      textposition: 'auto',
      textfont: { size: textFontSize, color: '#e5e7eb' },
      marker: { color: '#6366f1' },
    },
  ];

  const config = {
    displayModeBar: false,
    responsive: true, // Plotly-level responsiveness
  };

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        // allow container to shrink on small screens; height handled by plot
        display: 'block',
      }}
    >
      <Plot
        data={data}
        layout={layout}
        config={config}
        // enable react-plotly's resize handler so it redraws on its own
        useResizeHandler={true}
        style={{ width: '100%', height: chartHeight }}
      />
    </div>
  );
}