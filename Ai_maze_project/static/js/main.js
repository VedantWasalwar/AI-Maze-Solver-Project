/**
 * main.js — App orchestration
 * Connects MazeEditor, GraphVis, Charts, and Flask API.
 */

/* ── Constants ── */
const ALGO_COLORS = { bfs:'#4f8ef7', dfs:'#f06b6b', astar:'#3ddba0', greedy:'#f5a623' };
const PRESETS = {
  s4:  { rows:4,  cols:4,  text:`0 0 1 0\n1 0 1 0\n0 0 0 0\n0 1 1 0` },
  m6:  { rows:6,  cols:6,  text:`0 0 1 0 0 0\n1 0 1 0 1 0\n0 0 0 0 1 0\n0 1 1 0 1 0\n0 0 0 0 0 0\n1 1 0 1 1 0` },
  h8:  { rows:8,  cols:8,  text:`0 0 1 0 0 0 1 0\n1 0 1 0 1 0 0 0\n0 0 0 0 1 1 1 0\n0 1 1 0 0 0 1 0\n0 0 0 0 1 0 1 0\n1 1 0 1 1 0 1 0\n0 0 0 0 0 0 1 0\n0 1 1 1 1 1 1 0` },
  open:{ rows:6,  cols:6,  text:`0 0 0 0 0 0\n0 0 0 0 0 0\n0 0 0 0 0 0\n0 0 0 0 0 0\n0 0 0 0 0 0\n0 0 0 0 0 0` },
};

/* ── App State ── */
let results     = {};
let activeTab   = 'bfs';
let allResults  = {};  // store last full results for tab switching
let activeAlgos = new Set(['bfs','dfs','astar','greedy']);

/* ═══════════════════
   Boot
═══════════════════ */
window.addEventListener('DOMContentLoaded', () => {
  MazeEditor.init(8, 8);
  loadPreset('m6');
  refreshGraph();
  setupEventListeners();
});

window.addEventListener('resize', () => {
  MazeEditor.resize();
  MazeEditor.draw();
});

window.addEventListener('maze-changed', () => {
  refreshGraph();
  results = {};
  document.getElementById('resultsCard').style.display = 'none';
  document.getElementById('statsRow').style.display    = 'none';
  document.getElementById('chartsRow').style.display   = 'none';
});

/* ═══════════════════
   Event Listeners
═══════════════════ */
function setupEventListeners() {

  /* Mode buttons */
  document.getElementById('modeWall').addEventListener('click',  () => setMode('wall'));
  document.getElementById('modeErase').addEventListener('click', () => setMode('erase'));
  document.getElementById('modeStart').addEventListener('click', () => setMode('start'));
  document.getElementById('modeEnd').addEventListener('click',   () => setMode('end'));

  /* Preset buttons */
  document.querySelectorAll('[data-preset]').forEach(btn =>
    btn.addEventListener('click', () => loadPreset(btn.dataset.preset))
  );

  /* Resize inputs */
  document.getElementById('applySize').addEventListener('click', () => {
    const r = Math.max(2, Math.min(20, +document.getElementById('rowsInput').value || 8));
    const c = Math.max(2, Math.min(20, +document.getElementById('colsInput').value || 8));
    MazeEditor.init(r, c);
    refreshGraph();
  });

  /* Random maze */
  document.getElementById('btnRandom').addEventListener('click', () => {
    MazeEditor.randomMaze();
    setStatus('idle', 'Random maze generated');
  });

  /* Reset */
  document.getElementById('btnReset').addEventListener('click', () => {
    const r = MazeEditor.getRows(), c = MazeEditor.getCols();
    MazeEditor.init(r, c); refreshGraph();
    setStatus('idle', 'Maze reset');
  });

  /* Algo toggles */
  document.querySelectorAll('.algo-toggle').forEach(btn => {
    btn.classList.add('active');
    btn.addEventListener('click', () => {
      const a = btn.dataset.algo;
      if (activeAlgos.has(a)) {
        if (activeAlgos.size > 1) { activeAlgos.delete(a); btn.classList.remove('active'); }
      } else { activeAlgos.add(a); btn.classList.add('active'); }
    });
  });

  /* Individual algo run buttons */
  document.querySelectorAll('[data-run]').forEach(btn =>
    btn.addEventListener('click', () => runSingle(btn.dataset.run))
  );

  /* Solve All */
  document.getElementById('btnSolveAll').addEventListener('click', runAll);

  /* Maze text import */
  document.getElementById('mazeTextInput').addEventListener('change', e => {
    MazeEditor.setMazeText(e.target.value);
  });

  /* Theme toggle */
  document.getElementById('themeToggle').addEventListener('click', toggleTheme);

  /* Speed synced label */
  document.getElementById('speedSlider').addEventListener('input', e => {
    document.getElementById('speedVal').textContent = e.target.value;
  });
}

/* ═══════════════════
   Mode
═══════════════════ */
function setMode(m) {
  MazeEditor.setMode(m);
  document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
  const map = { wall:'modeWall', erase:'modeErase', start:'modeStart', end:'modeEnd' };
  document.getElementById(map[m])?.classList.add('active');
}

/* ═══════════════════
   Presets
═══════════════════ */
function loadPreset(key) {
  const p = PRESETS[key];
  if (!p) return;
  document.getElementById('rowsInput').value = p.rows;
  document.getElementById('colsInput').value = p.cols;
  MazeEditor.init(p.rows, p.cols);
  MazeEditor.setMazeText(p.text);
  refreshGraph();
  setStatus('idle', `Preset loaded (${p.rows}×${p.cols})`);
}

/* ═══════════════════
   Graph refresh
═══════════════════ */
async function refreshGraph() {
  try {
    const resp = await fetch('/graph', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ maze: MazeEditor.getMazeText() })
    });
    const data = await resp.json();
    GraphVis.buildGraph(data.nodes, data.edges, data.rows, data.cols);
  } catch(e) { /* silent fail during offline dev */ }
}

/* ═══════════════════
   Solve (single)
═══════════════════ */
async function runSingle(algo) {
  activeAlgos = new Set([algo]);
  document.querySelectorAll('.algo-toggle').forEach(b => {
    b.classList.toggle('active', b.dataset.algo === algo);
  });
  await runAll();
}

/* ═══════════════════
   Solve All
═══════════════════ */
async function runAll() {
  const maze = MazeEditor.getMazeText();
  const algos = Array.from(activeAlgos);
  const speed = +document.getElementById('speedSlider').value;

  setSolveDisabled(true);
  setStatus('running', `Running ${algos.join(', ').toUpperCase()}…`);

  let data;
  try {
    const resp = await fetch('/solve', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ maze, algorithms: algos })
    });
    data = await resp.json();
    if (data.error) { alert(data.error); setSolveDisabled(false); return; }
  } catch(e) {
    alert('Cannot connect to Flask server. Is it running on localhost:5000?');
    setSolveDisabled(false); return;
  }

  allResults = data;

  /* Animate the first algo on the maze canvas */
  const firstAlgo = algos[0];
  const first     = data[firstAlgo];

  MazeEditor.animate(
    first.explored || [],
    first.path     || [],
    speed,
    () => {
      /* After animation completes */
      GraphVis.updateGraphHighlight(first.explored||[], first.path||[], firstAlgo);
      GraphVis.drawTree(first.tree || [], firstAlgo);
      Charts.renderAll(data);
      showResults(firstAlgo);
      setSolveDisabled(false);
      setStatus('done', `Done — ${algos.length} algorithm(s) compared`);
      document.getElementById('chartsRow').style.display = 'grid';
      document.getElementById('statsRow').style.display  = 'grid';
    }
  );

  /* Show queue / stack hint */
  GraphVis.updateQueueVis(first.explored?.slice(0,8) || [], firstAlgo);
}

/* ═══════════════════
   Results Panel
═══════════════════ */
function showResults(algo) {
  const r = allResults[algo];
  if (!r) return;
  activeTab = algo;

  /* Tabs */
  const tabsEl = document.getElementById('resultTabs');
  tabsEl.innerHTML = '';
  Object.keys(allResults).forEach(a => {
    const b = document.createElement('button');
    b.className = 'rtab' + (a === algo ? ` active-${a}` : '');
    b.textContent = a.toUpperCase();
    b.onclick = () => showResults(a);
    tabsEl.appendChild(b);
  });

  /* Detail rows */
  const color = ALGO_COLORS[algo];
  document.getElementById('resultDetails').innerHTML = `
    <div class="result-row">
      <span class="result-lbl">Found path</span>
      <span class="result-val" style="color:${r.path?.length?'#3ddba0':'#f06b6b'}">${r.path?.length ? '✓ Yes' : '✗ No'}</span>
    </div>
    <div class="result-row">
      <span class="result-lbl">Path length</span>
      <span class="result-val" style="color:${color}">${r.path?.length || '—'}</span>
    </div>
    <div class="result-row">
      <span class="result-lbl">Nodes explored</span>
      <span class="result-val">${r.nodes}</span>
    </div>
    <div class="result-row">
      <span class="result-lbl">Execution time</span>
      <span class="result-val">${(r.time_ms||0).toFixed(3)} ms</span>
    </div>
    <div class="result-row">
      <span class="result-lbl">Memory used</span>
      <span class="result-val">${r.memory_kb || '0'} KB</span>
    </div>
    <div class="result-row">
      <span class="result-lbl">Efficiency</span>
      <span class="result-val">${r.nodes&&r.path?.length ? ((r.path.length/r.nodes)*100).toFixed(1)+'%' : '—'}</span>
    </div>
  `;

  /* Path display */
  document.getElementById('pathDisplay').textContent = r.path?.length
    ? r.path.map(([rr,cc]) => `(${rr},${cc})`).join(' → ')
    : 'No path found';

  /* Stats cards */
  document.getElementById('sPath').textContent   = r.path?.length || '—';
  document.getElementById('sNodes').textContent  = r.nodes;
  document.getElementById('sTime').textContent   = (r.time_ms||0).toFixed(2);
  document.getElementById('sMemory').textContent = (r.memory_kb||0) + ' KB';

  document.getElementById('resultsCard').style.display = 'block';

  /* Update graph and tree for this algo */
  GraphVis.updateGraphHighlight(r.explored||[], r.path||[], algo);
  GraphVis.drawTree(r.tree||[], algo);
  GraphVis.updateQueueVis(r.explored?.slice(0,8)||[], algo);
}

/* ═══════════════════
   Status
═══════════════════ */
function setStatus(state, msg) {
  const dot = document.getElementById('statusDot');
  const txt = document.getElementById('statusText');
  dot.className = 'status-dot' + (state==='running'?' running':state==='done'?' done':'');
  txt.textContent = msg;
}

function setSolveDisabled(v) {
  document.getElementById('btnSolveAll').disabled = v;
  document.getElementById('btnSolveAll').textContent = v ? 'Solving…' : '▶ Solve All';
}

/* ═══════════════════
   Theme
═══════════════════ */
function toggleTheme() {
  const curr = document.documentElement.getAttribute('data-theme');
  const next = curr === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', next === 'dark' ? '' : 'light');
  document.getElementById('themeToggle').textContent = next === 'dark' ? '☀' : '☾';
}
