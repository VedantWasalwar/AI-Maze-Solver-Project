/**
 * graph.js — D3.js Graph + Search Tree Visualisation
 * Builds a force-directed node-edge graph from the maze grid.
 * Also renders a top-down search tree from algorithm results.
 */

const GraphVis = (() => {

  const ALGO_COLORS = {
    bfs:    '#4f8ef7',
    dfs:    '#f06b6b',
    astar:  '#3ddba0',
    greedy: '#f5a623',
  };

  let svgG    = null;   // D3 graph group
  let treeSvg = null;   // D3 tree SVG
  let simul   = null;   // D3 force simulation
  let gNodes  = [];     // current graph nodes
  let gEdges  = [];     // current graph edges
  let currentAlgo = 'bfs';

  /* ════════════════════════════════════
     Graph visualisation (force layout)
  ════════════════════════════════════ */
  function buildGraph(nodesData, edgesData, rows, cols, exploredSet=new Set(), pathSet=new Set()) {
    gNodes = nodesData;
    gEdges = edgesData;

    const svgEl = document.getElementById('graphSvg');
    if (!svgEl) return;
    const W = svgEl.clientWidth  || 280;
    const H = svgEl.clientHeight || 300;

    // Clear previous
    d3.select('#graphSvg').selectAll('*').remove();

    const svg = d3.select('#graphSvg')
      .attr('viewBox', `0 0 ${W} ${H}`)
      .call(d3.zoom().scaleExtent([0.3, 4]).on('zoom', e => svgG.attr('transform', e.transform)));

    svgG = svg.append('g');

    // Arrow marker
    svg.append('defs').append('marker')
      .attr('id','arrow').attr('viewBox','0 -5 10 10').attr('refX',14)
      .attr('markerWidth',6).attr('markerHeight',6).attr('orient','auto')
      .append('path').attr('d','M0,-5L10,0L0,5').attr('fill','#2e3a58');

    // Use grid layout for clarity (not pure force) since mazes are grids
    const cellW = W / cols;
    const cellH = H / rows;

    gNodes.forEach(n => {
      n.x = n.col * cellW + cellW / 2;
      n.y = n.row * cellH + cellH / 2;
      n.fx = n.x; n.fy = n.y;  // fix positions to grid
    });

    const nodeMap = Object.fromEntries(gNodes.map(n => [n.id, n]));

    // Edges
    const link = svgG.append('g').selectAll('line')
      .data(gEdges).join('line')
      .attr('stroke', '#2e3a58').attr('stroke-width', 1)
      .attr('x1', d => nodeMap[d.source]?.x || 0).attr('y1', d => nodeMap[d.source]?.y || 0)
      .attr('x2', d => nodeMap[d.target]?.x || 0).attr('y2', d => nodeMap[d.target]?.y || 0);

    // Node circles
    const r = Math.min(cellW, cellH) * 0.35;
    const node = svgG.append('g').selectAll('circle')
      .data(gNodes).join('circle')
      .attr('r', r).attr('cx', d => d.x).attr('cy', d => d.y)
      .attr('fill', d => {
        const key = d.row+','+d.col;
        if (d.wall)               return '#1e2538';
        if (pathSet.has(key))     return ALGO_COLORS[currentAlgo];
        if (exploredSet.has(key)) return ALGO_COLORS[currentAlgo]+'66';
        return '#1a2540';
      })
      .attr('stroke', d => {
        const key = d.row+','+d.col;
        if (d.wall)               return '#0a0d16';
        if (pathSet.has(key))     return ALGO_COLORS[currentAlgo];
        if (exploredSet.has(key)) return ALGO_COLORS[currentAlgo]+'aa';
        return '#2e3a58';
      })
      .attr('stroke-width', 1.5)
      .style('cursor', 'pointer')
      .on('click', (_, d) => {
        if (!d.wall) MazeEditor.highlightCell(d.row, d.col);
      })
      .on('mouseover', (e, d) => {
        const tt = document.getElementById('tooltip');
        tt.style.display = 'block';
        tt.style.left = (e.clientX+14)+'px'; tt.style.top = (e.clientY+14)+'px';
        tt.textContent = `Node (${d.row},${d.col}) — ${d.wall?'wall':'open'}`;
      })
      .on('mouseout', () => document.getElementById('tooltip').style.display='none');

    // Labels (only show if cells are large enough)
    if (Math.min(cellW,cellH) > 22) {
      svgG.append('g').selectAll('text')
        .data(gNodes.filter(n => !n.wall)).join('text')
        .attr('x', d => d.x).attr('y', d => d.y)
        .attr('text-anchor','middle').attr('dominant-baseline','middle')
        .attr('font-size', Math.min(8, r * 0.9))
        .attr('font-family','Space Mono').attr('fill','#6b7a99')
        .text(d => `${d.row},${d.col}`);
    }
  }

  function updateGraphHighlight(exploredArr, pathArr, algo) {
    currentAlgo = algo || currentAlgo;
    const expSet  = new Set(exploredArr.map(([r,c])=>r+','+c));
    const pathSet = new Set(pathArr.map(([r,c])=>r+','+c));
    if (!svgG) return;
    svgG.selectAll('circle')
      .attr('fill', d => {
        const key = d.row+','+d.col;
        if (d.wall)               return '#1e2538';
        if (pathSet.has(key))     return ALGO_COLORS[currentAlgo];
        if (expSet.has(key))      return ALGO_COLORS[currentAlgo]+'66';
        return '#1a2540';
      })
      .attr('stroke', d => {
        const key = d.row+','+d.col;
        if (d.wall)               return '#0a0d16';
        if (pathSet.has(key))     return ALGO_COLORS[currentAlgo];
        if (expSet.has(key))      return ALGO_COLORS[currentAlgo]+'aa';
        return '#2e3a58';
      });
  }

  /* ════════════════════════════════════
     Search Tree visualisation
  ════════════════════════════════════ */
  function drawTree(treeData, algo) {
    const svgEl = document.getElementById('treeSvg');
    if (!svgEl || !treeData || !treeData.length) return;
    currentAlgo = algo || currentAlgo;

    const W = svgEl.clientWidth  || 280;
    const H = svgEl.clientHeight || 220;
    d3.select('#treeSvg').selectAll('*').remove();

    // Build adjacency from parent array
    const nodeMap = {};
    treeData.forEach(t => {
      const key = t.node.join(',');
      nodeMap[key] = { id: key, children: [], row: t.node[0], col: t.node[1] };
    });
    let root = null;
    treeData.forEach(t => {
      const key = t.node.join(',');
      if (t.parent === null) { root = nodeMap[key]; }
      else {
        const pk = t.parent.join(',');
        if (nodeMap[pk]) nodeMap[pk].children.push(nodeMap[key]);
      }
    });
    if (!root) return;

    const hierarchy = d3.hierarchy(root, d => d.children);
    const treeLayout = d3.tree().size([W - 30, H - 40]);
    treeLayout(hierarchy);

    const svg = d3.select('#treeSvg')
      .attr('viewBox', `0 0 ${W} ${H}`)
      .append('g').attr('transform','translate(15,20)');

    // Links
    svg.selectAll('path.tree-link')
      .data(hierarchy.links()).join('path')
      .attr('class','tree-link')
      .attr('fill','none').attr('stroke','#1e2538').attr('stroke-width',1)
      .attr('d', d3.linkVertical().x(d=>d.x).y(d=>d.y));

    // Nodes
    const n = svg.selectAll('g.tree-node')
      .data(hierarchy.descendants()).join('g')
      .attr('class','tree-node')
      .attr('transform', d => `translate(${d.x},${d.y})`);

    n.append('circle').attr('r', 5)
      .attr('fill', d => {
        if (!d.parent) return ALGO_COLORS[currentAlgo];
        if (!d.children || d.children.length===0) return ALGO_COLORS[currentAlgo]+'55';
        return ALGO_COLORS[currentAlgo]+'99';
      })
      .attr('stroke', ALGO_COLORS[currentAlgo]).attr('stroke-width', 1);

    n.append('text')
      .attr('dy','0.31em').attr('x', d => d.children ? -8 : 8)
      .attr('text-anchor', d => d.children ? 'end' : 'start')
      .attr('font-size', 7).attr('font-family','Space Mono')
      .attr('fill','#6b7a99')
      .text(d => `${d.data.row},${d.data.col}`);
  }

  /* ════════════════════════════════════
     Queue/Stack visualiser
  ════════════════════════════════════ */
  function updateQueueVis(items, algo) {
    const el = document.getElementById('queueVis');
    if (!el) return;
    const color = ALGO_COLORS[algo] || '#4f8ef7';
    el.innerHTML = items.slice(0, 12).map(([r,c]) =>
      `<span class="q-item" style="color:${color};border-color:${color}44;background:${color}11">(${r},${c})</span>`
    ).join('') + (items.length > 12 ? `<span style="color:#6b7a99;font-size:10px">+${items.length-12} more</span>` : '');
  }

  function setCurrentAlgo(a) { currentAlgo = a; }

  return { buildGraph, updateGraphHighlight, drawTree, updateQueueVis, setCurrentAlgo };

})();
