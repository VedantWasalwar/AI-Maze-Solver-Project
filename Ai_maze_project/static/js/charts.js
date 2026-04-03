/**
 * charts.js — Comparison Chart rendering using Chart.js
 */

const Charts = (() => {

  const ALGO_COLORS = {
    bfs:    '#4f8ef7',
    dfs:    '#f06b6b',
    astar:  '#3ddba0',
    greedy: '#f5a623',
  };

  const registry = {};

  function make(canvasId, labels, data, title) {
    const el = document.getElementById(canvasId);
    if (!el) return;
    if (registry[canvasId]) { registry[canvasId].destroy(); }

    registry[canvasId] = new Chart(el, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: labels.map(l => (ALGO_COLORS[l.toLowerCase()] || '#4f8ef7') + '33'),
          borderColor:     labels.map(l =>  ALGO_COLORS[l.toLowerCase()] || '#4f8ef7'),
          borderWidth: 2,
          borderRadius: 5,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: ctx => ` ${ctx.parsed.y} ${title === 'Time (ms)' ? 'ms' : title === 'Memory (KB)' ? 'KB' : ''}`
            }
          }
        },
        scales: {
          x: { ticks: { color: '#6b7a99', font: { size: 10, family: 'Space Mono' } }, grid: { color: '#1e2538' } },
          y: { ticks: { color: '#6b7a99', font: { size: 10 } }, grid: { color: '#1e2538' }, beginAtZero: true }
        }
      }
    });
  }

  function renderAll(results) {
    const algos   = Object.keys(results);
    const labels  = algos.map(a => a.toUpperCase());

    make('chartNodes',  labels, algos.map(a => results[a].nodes || 0),             'Nodes');
    make('chartTime',   labels, algos.map(a => +(results[a].time_ms||0).toFixed(3)), 'Time (ms)');
    make('chartPath',   labels, algos.map(a => results[a].path?.length || 0),       'Path');
    make('chartMemory', labels, algos.map(a => results[a].memory_kb || 0),           'Memory (KB)');
  }

  return { renderAll };
})();
