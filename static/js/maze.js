/**
 * maze.js — Interactive Maze Canvas
 * Handles: draw walls, set start/end, animate exploration, random maze generation
 */

const MazeEditor = (() => {

  /* ── State ── */
  let rows = 10, cols = 10;
  let grid = [];          // 0=path, 1=wall
  let startCell = [0, 0];
  let endCell   = [rows-1, cols-1];
  let explored  = [];     // list of [r,c] in order
  let pathCells = [];     // final path
  let animStep  = -1;
  let animTimer = null;
  let mode      = 'wall'; // 'wall' | 'start' | 'end' | 'erase'
  let isDragging = false;
  let cellSize  = 36;

  const canvas = document.getElementById('mazeCanvas');
  const ctx    = canvas.getContext('2d');

  const COLORS = {
    wall:     () => getVar('--border-hi') || '#2e3a58',
    path:     () => getVar('--bg-input')  || '#0a0d16',
    explored: () => 'rgba(79,142,247,0.35)',
    pathCell: () => 'rgba(61,219,160,0.55)',
    start:    () => getVar('--accent')    || '#4f8ef7',
    end:      () => getVar('--accent2')   || '#3ddba0',
    grid:     () => 'rgba(255,255,255,0.04)',
    text:     () => '#ffffff',
  };

  function getVar(v) {
    return getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  }

  /* ── Init ── */
  function init(r=10, c=10) {
    rows = r; cols = c;
    startCell = [0, 0];
    endCell   = [rows-1, cols-1];
    grid = Array.from({length: rows}, () => Array(cols).fill(0));
    explored = []; pathCells = []; animStep = -1;
    resize();
    draw();
  }

  function resize() {
    const container = canvas.parentElement;
    const maxW = container.clientWidth  - 28;
    const maxH = Math.max(300, window.innerHeight * 0.42);
    cellSize = Math.floor(Math.min(maxW / cols, maxH / rows, 48));
    cellSize = Math.max(cellSize, 14);
    canvas.width  = cols * cellSize;
    canvas.height = rows * cellSize;
  }

  /* ── Draw ── */
  function draw(exploredSlice=[], pathSlice=[]) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const expSet  = new Set(exploredSlice.map(([r,c]) => r+','+c));
    const pathSet = new Set(pathSlice.map(([r,c]) => r+','+c));

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = c*cellSize, y = r*cellSize, s = cellSize;
        const key = r+','+c;

        /* Fill */
        if (grid[r][c] === 1)        ctx.fillStyle = COLORS.wall();
        else if (pathSet.has(key))   ctx.fillStyle = COLORS.pathCell();
        else if (expSet.has(key))    ctx.fillStyle = COLORS.explored();
        else                         ctx.fillStyle = COLORS.path();
        ctx.fillRect(x, y, s, s);

        /* Grid line */
        ctx.strokeStyle = COLORS.grid();
        ctx.lineWidth = 0.5;
        ctx.strokeRect(x, y, s, s);

        /* Start / End labels */
        const isStart = r===startCell[0] && c===startCell[1];
        const isEnd   = r===endCell[0]   && c===endCell[1];
        if (isStart || isEnd) {
          const col = isStart ? COLORS.start() : COLORS.end();
          ctx.fillStyle = col + '44';
          ctx.fillRect(x+1, y+1, s-2, s-2);
          ctx.fillStyle = col;
          ctx.font = `bold ${Math.max(10,s-10)}px "Space Mono"`;
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(isStart ? 'S' : 'E', x+s/2, y+s/2);
        }

        /* Path dot */
        if (pathSet.has(key) && !isStart && !isEnd) {
          ctx.fillStyle = COLORS.end();
          ctx.beginPath();
          ctx.arc(x+s/2, y+s/2, s/5, 0, Math.PI*2);
          ctx.fill();
        }

        /* Explored dot */
        if (expSet.has(key) && !pathSet.has(key) && !isStart && !isEnd) {
          ctx.fillStyle = 'rgba(79,142,247,0.7)';
          ctx.beginPath();
          ctx.arc(x+s/2, y+s/2, s/6, 0, Math.PI*2);
          ctx.fill();
        }
      }
    }
  }

  /* ── Animation ── */
  function animate(exploredArr, pathArr, speed, onDone) {
    stopAnim();
    explored  = exploredArr;
    pathCells = pathArr;
    animStep  = 0;
    const delay = Math.max(6, 110 - speed * 10);
    const step  = Math.max(1, Math.ceil(speed / 2));

    function tick() {
      if (animStep <= explored.length) {
        draw(explored.slice(0, animStep), []);
        animStep += step;
        animTimer = setTimeout(tick, delay);
      } else {
        draw(explored, pathCells);
        onDone && onDone();
      }
    }
    tick();
  }

  function stopAnim() {
    if (animTimer) clearTimeout(animTimer);
    animTimer = null;
  }

  function resetDraw() {
    stopAnim(); explored = []; pathCells = []; animStep = -1;
    draw();
  }

  /* ── Mouse / Touch ── */
  function cellAt(e) {
    const rect = canvas.getBoundingClientRect();
    const cx   = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const cy   = (e.clientY || e.touches?.[0]?.clientY) - rect.top;
    const c    = Math.floor(cx / cellSize);
    const r    = Math.floor(cy / cellSize);
    if (r >= 0 && r < rows && c >= 0 && c < cols) return [r, c];
    return null;
  }

  function handleCell(cell) {
    if (!cell) return;
    const [r, c] = cell;
    if (mode === 'start') {
      startCell = [r, c]; grid[r][c] = 0; draw(explored.slice(0,animStep), pathCells);
    } else if (mode === 'end') {
      endCell = [r, c]; grid[r][c] = 0; draw(explored.slice(0,animStep), pathCells);
    } else if (mode === 'wall') {
      if ((r===startCell[0]&&c===startCell[1])||(r===endCell[0]&&c===endCell[1])) return;
      grid[r][c] = 1; draw();
    } else if (mode === 'erase') {
      grid[r][c] = 0; draw();
    }
    // notify graph panel
    window.dispatchEvent(new CustomEvent('maze-changed'));
  }

  canvas.addEventListener('mousedown', e => {
    isDragging = true;
    handleCell(cellAt(e));
    e.preventDefault();
  });
  canvas.addEventListener('mousemove', e => {
    if (!isDragging) return;
    if (mode === 'wall' || mode === 'erase') handleCell(cellAt(e));
    // Tooltip
    const cell = cellAt(e);
    if (cell) {
      const tt = document.getElementById('tooltip');
      tt.style.display = 'block';
      tt.style.left = (e.clientX+14)+'px';
      tt.style.top  = (e.clientY+14)+'px';
      tt.textContent = `(${cell[0]}, ${cell[1]}) = ${grid[cell[0]][cell[1]]===1?'wall':'path'}`;
    }
  });
  canvas.addEventListener('mouseup',    () => { isDragging=false; });
  canvas.addEventListener('mouseleave', () => {
    isDragging=false;
    document.getElementById('tooltip').style.display='none';
  });
  canvas.addEventListener('click', e => handleCell(cellAt(e)));

  /* ── Random Maze (Recursive Division simplified) ── */
  function randomMaze() {
    grid = Array.from({length: rows}, () =>
      Array.from({length: cols}, () => (Math.random() < 0.3 ? 1 : 0))
    );
    grid[startCell[0]][startCell[1]] = 0;
    grid[endCell[0]][endCell[1]]     = 0;
    resetDraw();
    window.dispatchEvent(new CustomEvent('maze-changed'));
  }

  /* ── Export / Import ── */
  function getMazeText() {
    return grid.map(row => row.join(' ')).join('\n');
  }

  function setMazeText(text) {
    const parsed = text.trim().split('\n').map(r => r.trim().split(/\s+/).map(Number));
    if (!parsed.length || !parsed[0].length) return;
    rows = parsed.length; cols = parsed[0].length;
    grid = parsed;
    startCell = [0, 0]; endCell = [rows-1, cols-1];
    resize(); resetDraw();
    window.dispatchEvent(new CustomEvent('maze-changed'));
  }

  function setMode(m) { mode = m; }
  function getGrid()  { return grid; }
  function getStart() { return startCell; }
  function getEnd()   { return endCell; }
  function getRows()  { return rows; }
  function getCols()  { return cols; }

  function highlightCell(r, c) {
    // Briefly flash a cell (called from graph click)
    ctx.save();
    ctx.fillStyle = 'rgba(197,130,252,0.6)';
    ctx.fillRect(c*cellSize+2, r*cellSize+2, cellSize-4, cellSize-4);
    ctx.restore();
    setTimeout(() => draw(explored.slice(0,animStep), pathCells), 600);
  }

  /* ── Public API ── */
  return { init, draw, animate, stopAnim, resetDraw, randomMaze, getMazeText, setMazeText,
           setMode, getGrid, getStart, getEnd, getRows, getCols, resize, highlightCell };

})();
