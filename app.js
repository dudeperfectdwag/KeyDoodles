// “THIS FILE IS THE ACTIVE ENTRY POINT. DO NOT DUPLICATE.”
console.log("APP JS LOADED");
(function(){
  const canvas = document.getElementById('canvas');
  if (!canvas) {
    console.error('Canvas element with id "canvas" not found.');
    return; // Stop: cannot proceed without canvas
  }
  const ctx = canvas.getContext('2d');
  console.log('Canvas acquired, context:', !!ctx);

  const statWpm = document.getElementById('statWpm');
  const statAcc = document.getElementById('statAcc');
  const statChars = document.getElementById('statChars');
  const statTime = document.getElementById('statTime');
  console.log('Stats elements present:', !!statWpm && !!statAcc && !!statChars && !!statTime);
  const statStroke = document.getElementById('statStroke');

  // Shape selection UI
  const shapeSelect = document.getElementById('shapeSelect');
  const shapeList = [
    'circle','circle-fill','square','square-fill','rectangle',
    'triangle-up','triangle-down','triangle-left','triangle-right',
    'diamond','line','arc','spiral','star-5','star-8',
    'polygon-3','polygon-4','polygon-5','polygon-6','polygon-7','polygon-8','polygon-9','polygon-10',
    'wave','zigzag','cross','plus','heart','infinity','flower',
    'ellipse','half-circle','quarter-circle','jitter'
  ];
  let currentShapeIndex = shapeList.indexOf('circle-fill');
  let currentShape = shapeList[currentShapeIndex];
  if (shapeSelect) {
    shapeSelect.innerHTML = '';
    shapeList.forEach(name => {
      const opt = document.createElement('option');
      opt.value = name; opt.textContent = name;
      if (name === currentShape) opt.selected = true;
      shapeSelect.appendChild(opt);
    });
    shapeSelect.addEventListener('change', (e) => {
      currentShape = e.target.value;
      currentShapeIndex = shapeList.indexOf(currentShape);
    });
  }

  // Theme system
  const themeSelect = document.getElementById('themeSelect');
  const THEMES = [
    { name: 'Light', background: '#ffffff', paint: '#000000', text: '#111111', subtleUI: 'rgba(0,0,0,0.06)' },
    { name: 'Dark', background: '#0f0f0f', paint: '#b0b0b0', text: '#e6e6e6', subtleUI: 'rgba(255,255,255,0.08)' },
    { name: 'Midnight', background: '#05070a', paint: '#4ea8ff', text: '#e0e8f5', subtleUI: 'rgba(255,255,255,0.08)' },
    { name: 'Paper', background: '#f5f3ee', paint: '#2b2b2b', text: '#2b2b2b', subtleUI: 'rgba(0,0,0,0.06)' },
    { name: 'Terminal', background: '#000000', paint: '#00ff66', text: '#e6ffe6', subtleUI: 'rgba(255,255,255,0.08)' },
    { name: 'Neon', background: '#0b0014', paint: '#ff00ff', text: '#ffeaff', subtleUI: 'rgba(255,255,255,0.08)' },
    { name: 'Solarized Dark', background: '#002b36', paint: '#93a1a1', text: '#eee8d5', subtleUI: 'rgba(255,255,255,0.08)' },
    { name: 'Solarized Light', background: '#fdf6e3', paint: '#586e75', text: '#586e75', subtleUI: 'rgba(0,0,0,0.06)' },
    { name: 'Monochrome Gray', background: '#e5e5e5', paint: '#555555', text: '#222222', subtleUI: 'rgba(0,0,0,0.06)' },
    { name: 'Blood Moon', background: '#120000', paint: '#ff3b3b', text: '#ffe5e5', subtleUI: 'rgba(255,255,255,0.08)' }
  ];
  let paintColor = '#000000';
  let currentTheme = null;
  let strokeTarget = parseFloat(localStorage.getItem('strokeScale') || '1.0');
  if (!isFinite(strokeTarget)) strokeTarget = 1.0;
  let strokeScale = strokeTarget;
  const minStroke = 0.4;
  const maxStroke = 3.0;
  const strokeLerp = 0.18;
  // Background image option removed per user request
  function loadTheme(){
    const saved = localStorage.getItem('themeName') || 'Light';
    const t = THEMES.find(x => x.name === saved) || THEMES[0];
    applyTheme(t);
    if (themeSelect){
      themeSelect.innerHTML = '';
      THEMES.forEach(t2 => {
        const opt = document.createElement('option');
        opt.value = t2.name; opt.textContent = t2.name; if (t2.name === t.name) opt.selected = true;
        themeSelect.appendChild(opt);
      });
      const autoToggle = document.getElementById('autoRefreshToggle');
      const autoSaved = localStorage.getItem('autoRefreshOnThemeChange');
      if (autoToggle) {
        // default ON if unset to mirror screenshot behavior
        if (autoSaved == null) localStorage.setItem('autoRefreshOnThemeChange','true');
        autoToggle.checked = (localStorage.getItem('autoRefreshOnThemeChange') === 'true');
      }
      if (autoToggle){
        autoToggle.addEventListener('change', () => {
          localStorage.setItem('autoRefreshOnThemeChange', autoToggle.checked ? 'true' : 'false');
        });
      }
      themeSelect.addEventListener('change', (e) => {
        const chosen = THEMES.find(x => x.name === e.target.value);
        if (!chosen) return;
        const autoRefresh = (autoToggle && autoToggle.checked) || localStorage.getItem('autoRefreshOnThemeChange') === 'true';
        if (autoRefresh){
          // Persist selection then hard reload
          localStorage.setItem('themeName', chosen.name);
          setTimeout(() => { location.reload(); }, 10);
        } else {
          applyTheme(chosen);
        }
      });
    }
  }
  function applyTheme(t){
    localStorage.setItem('themeName', t.name);
    currentTheme = t;
    // Update UI colors and document background
    document.body.style.backgroundColor = t.background;
    const stats = document.getElementById('stats');
    const shapePanel = document.getElementById('shapePanel');
    const themePanel = document.getElementById('themePanel');
    const imagePanel = document.getElementById('imagePanel');
    const helpBtn = document.getElementById('helpBtn');
    const paraBtn = document.getElementById('paraBtn');
    const musicBtn = document.getElementById('musicBtn');
    const saveBtn = document.getElementById('saveBtn');
    const clearBtn = document.getElementById('clearBtn');
    const paraModal = document.getElementById('paraModal');
    const paragraphView = document.getElementById('paragraphView');
    if (stats){ stats.style.background = t.subtleUI; stats.style.color = t.text; stats.style.borderTopColor = t.text + '22'; }
    if (shapePanel){ shapePanel.style.background = t.subtleUI; shapePanel.style.color = t.text; shapePanel.style.borderColor = t.text + '22'; }
    if (themePanel){ themePanel.style.background = t.subtleUI; themePanel.style.color = t.text; themePanel.style.borderColor = t.text + '22'; }
    if (imagePanel){ imagePanel.style.background = t.subtleUI; imagePanel.style.color = t.text; imagePanel.style.borderColor = t.text + '22'; }
    const sketchPanel = document.getElementById('sketchPanel');
    if (sketchPanel){ sketchPanel.style.background = t.subtleUI; sketchPanel.style.color = t.text; sketchPanel.style.borderColor = t.text + '22'; }
    const lum = hexLuminance(t.background);
    const outline = lum < 0.35 ? '#ffffff' : '#444444';
    function styleRound(btn){
      if (!btn) return; btn.style.borderColor = outline; btn.style.color = outline; btn.style.boxShadow = `0 0 0 1px ${outline}`; btn.style.background = 'transparent';
    }
    styleRound(helpBtn); styleRound(paraBtn); styleRound(musicBtn); styleRound(saveBtn); styleRound(clearBtn);
    if (paraModal){
      const hc = paraModal.querySelector('.help-content');
      if (hc){
        const modalBg = mixHex(t.background, t.text, 0.12);
        hc.style.background = modalBg;
        hc.style.color = t.text;
      }
    }
    if (paragraphView){
      const pvBg = mixHex(t.background, t.text, 0.12);
      const caretColor = ensureReadableColor(t.paint, pvBg, t.text);
      const textColor = ensureReadableColor(t.text, pvBg, t.paint);
      const doneBg = mixHex(t.background, t.paint, 0.18);
      const nextBg = mixHex(t.background, t.paint, 0.28);
      const remainingText = mixHex(t.text, t.background, 0.15);
      paragraphView.style.setProperty('--pv-bg', pvBg);
      paragraphView.style.setProperty('--pv-text', textColor);
      paragraphView.style.setProperty('--pv-done-bg', doneBg);
      paragraphView.style.setProperty('--pv-done-text', textColor);
      paragraphView.style.setProperty('--pv-next-bg', nextBg);
      paragraphView.style.setProperty('--pv-caret', caretColor);
      paragraphView.style.setProperty('--pv-remaining-text', remainingText);
    }
    // Future strokes use paintColor
    paintColor = t.paint;
    // sync brush color default to theme paint if user hasn't changed it
    const brushColor = document.getElementById('brushColor');
    if (brushColor && !brushColor.dataset.userPicked){ brushColor.value = t.paint; }
    // Ensure canvas background is repainted from theme on next frames
    setMascotTheme(t);
  }

  const state = {
    startedAt: null,
    elapsed: 0,
    keystrokes: 0,
    typedCount: 0,       // total valid characters typed
    backspaceCount: 0,   // total backspaces
    errors: 0,           // non-printable, non-modifier, non-backspace keys
    x: 0,
    y: 0,
    angle: 0
  };

  // Physics state
  let vx = 0, vy = 0;            // velocity (px/sec)
  let forceDir = Math.PI/4;      // direction of applied force, slowly rotates
  const maxSpeed = 320;          // px/sec clamp
  const impulse = 90;            // velocity impulse per keypress (px/sec)
  const damping = 2.5;           // exponential decay coefficient (per second)
  const rotateRate = 0.6;        // rad/sec, slow rotation of force direction
  const padding = 20;            // hard boundary padding
  const bounceFactor = 0.72;     // energy loss on bounce (0.6–0.8)
  const edgeZone = 120;          // distance from edge to start resistance
  const centerForce = 320;       // inward acceleration near edges (px/sec^2)

  // Curve trail buffer
  const trail = [];
  const minSegment = 3;          // min movement before adding a trail point

  // Strict sizing per requirements
  const statsBarHeight = 28;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight - statsBarHeight; // account for fixed stats bar
  // Fill canvas with initial theme background without recreating canvas
  const initThemeName = localStorage.getItem('themeName') || 'Light';
  const initTheme = (THEMES || []).find(t => t.name === initThemeName) || { background: '#ffffff', paint: '#000000', text: '#111', subtleUI: 'rgba(0,0,0,0.06)' };
  currentTheme = initTheme;
  // Center dot
  state.x = canvas.width/2;
  state.y = canvas.height/2;
  drawShape(currentShape, state.x, state.y, 8);
  trail.push({x: state.x, y: state.y});

  // Idle fade state
  let lastKeyTime = performance.now();
  const idleThreshold = 1.8;       // seconds without typing to consider idle
  const idleFadeRate = 0.25;       // per-second alpha decay when idle (subtle)
  let lastFrameDt = 0;             // store frame dt for smooth fading


  // Central shape drawing function
  function drawShape(type, x, y, size){
    switch(type){
      case 'circle':
        ctx.lineWidth = 1.5; ctx.strokeStyle = paintColor;
        ctx.beginPath(); ctx.arc(x, y, size, 0, Math.PI*2); ctx.stroke(); break;
      case 'circle-fill':
        ctx.fillStyle = paintColor;
        ctx.beginPath(); ctx.arc(x, y, size, 0, Math.PI*2); ctx.fill(); break;
      case 'square': {
        ctx.lineWidth = 1.5; ctx.strokeStyle = paintColor;
        const d = size*2; ctx.strokeRect(x - size, y - size, d, d); break; }
      case 'square-fill': {
        ctx.fillStyle = paintColor; const d = size*2; ctx.fillRect(x - size, y - size, d, d); break; }
      case 'rectangle': {
        ctx.lineWidth = 1.5; ctx.strokeStyle = paintColor;
        ctx.strokeRect(x - size*1.5, y - size, size*3, size*2); break; }
      case 'triangle-up': {
        ctx.lineWidth = 1.5; ctx.strokeStyle = paintColor;
        ctx.beginPath(); ctx.moveTo(x, y - size); ctx.lineTo(x - size, y + size); ctx.lineTo(x + size, y + size); ctx.closePath(); ctx.stroke(); break; }
      case 'triangle-down': {
        ctx.lineWidth = 1.5; ctx.strokeStyle = paintColor;
        ctx.beginPath(); ctx.moveTo(x, y + size); ctx.lineTo(x - size, y - size); ctx.lineTo(x + size, y - size); ctx.closePath(); ctx.stroke(); break; }
      case 'triangle-left': {
        ctx.lineWidth = 1.5; ctx.strokeStyle = paintColor;
        ctx.beginPath(); ctx.moveTo(x - size, y); ctx.lineTo(x + size, y - size); ctx.lineTo(x + size, y + size); ctx.closePath(); ctx.stroke(); break; }
      case 'triangle-right': {
        ctx.lineWidth = 1.5; ctx.strokeStyle = paintColor;
        ctx.beginPath(); ctx.moveTo(x + size, y); ctx.lineTo(x - size, y - size); ctx.lineTo(x - size, y + size); ctx.closePath(); ctx.stroke(); break; }
      case 'diamond': {
        ctx.lineWidth = 1.5; ctx.strokeStyle = paintColor;
        ctx.beginPath(); ctx.moveTo(x, y - size); ctx.lineTo(x + size, y); ctx.lineTo(x, y + size); ctx.lineTo(x - size, y); ctx.closePath(); ctx.stroke(); break; }
      case 'line': {
        ctx.lineWidth = 1.5; ctx.strokeStyle = paintColor;
        ctx.beginPath(); ctx.moveTo(x - size, y); ctx.lineTo(x + size, y); ctx.stroke(); break; }
      case 'arc': {
        ctx.lineWidth = 1.5; ctx.strokeStyle = paintColor;
        ctx.beginPath(); ctx.arc(x, y, size, 0, Math.PI); ctx.stroke(); break; }
      case 'spiral': {
        ctx.lineWidth = 1; ctx.strokeStyle = paintColor;
        ctx.beginPath(); let a=0; for(let r=1;r<=size*1.8;r+=0.6){ a += 0.35; const px=x+Math.cos(a)*r; const py=y+Math.sin(a)*r; if(r===1) ctx.moveTo(px,py); else ctx.lineTo(px,py);} ctx.stroke(); break; }
      case 'star-5': drawStar(x,y,size,5); break;
      case 'star-8': drawStar(x,y,size,8); break;
      case 'wave': {
        ctx.lineWidth = 1.5; ctx.strokeStyle = paintColor;
        ctx.beginPath(); for(let i=-size;i<=size;i+=2){ const px=x+i; const py=y+Math.sin(i*0.4)*4; if(i===-size) ctx.moveTo(px,py); else ctx.lineTo(px,py);} ctx.stroke(); break; }
      case 'zigzag': {
        ctx.lineWidth = 1.5; ctx.strokeStyle = paintColor;
        ctx.beginPath(); let up=true; for(let i=-size;i<=size;i+=4){ const px=x+i; const py=y+(up? -4:4); if(i===-size) ctx.moveTo(px,py); else ctx.lineTo(px,py); up=!up;} ctx.stroke(); break; }
      case 'cross': {
        ctx.lineWidth = 1.5; ctx.strokeStyle = paintColor;
        ctx.beginPath(); ctx.moveTo(x - size, y - size); ctx.lineTo(x + size, y + size); ctx.moveTo(x - size, y + size); ctx.lineTo(x + size, y - size); ctx.stroke(); break; }
      case 'plus': {
        ctx.lineWidth = 1.5; ctx.strokeStyle = paintColor;
        ctx.beginPath(); ctx.moveTo(x - size, y); ctx.lineTo(x + size, y); ctx.moveTo(x, y - size); ctx.lineTo(x, y + size); ctx.stroke(); break; }
      case 'heart': {
        ctx.lineWidth = 1.5; ctx.strokeStyle = paintColor;
        const s=size; ctx.beginPath(); ctx.moveTo(x, y + s*0.6);
        ctx.bezierCurveTo(x - s, y - s*0.2, x - s*0.6, y - s, x, y - s*0.4);
        ctx.bezierCurveTo(x + s*0.6, y - s, x + s, y - s*0.2, x, y + s*0.6);
        ctx.stroke(); break; }
      case 'infinity': {
        ctx.lineWidth = 1.5; ctx.strokeStyle = paintColor;
        const s=size; ctx.beginPath();
        for(let t=0;t<=Math.PI*2;t+=0.1){ const px=x + s*Math.cos(t); const py=y + s*Math.sin(2*t)/2; if(t===0) ctx.moveTo(px,py); else ctx.lineTo(px,py);} ctx.stroke(); break; }
      case 'flower': {
        ctx.lineWidth = 1; ctx.strokeStyle = paintColor;
        const petals=6; const r=size; ctx.beginPath(); for(let i=0;i<=Math.PI*2;i+=0.02){ const k=petals; const rad=r*(1+0.3*Math.sin(k*i)); const px=x+Math.cos(i)*rad; const py=y+Math.sin(i)*rad; if(i===0) ctx.moveTo(px,py); else ctx.lineTo(px,py);} ctx.stroke(); break; }
      case 'ellipse': {
        ctx.lineWidth = 1.5; ctx.strokeStyle = paintColor;
        ctx.beginPath(); ctx.ellipse(x,y,size*1.5,size,0,0,Math.PI*2); ctx.stroke(); break; }
      case 'half-circle': {
        ctx.lineWidth = 1.5; ctx.strokeStyle = paintColor;
        ctx.beginPath(); ctx.arc(x,y,size,0,Math.PI); ctx.stroke(); break; }
      case 'quarter-circle': {
        ctx.lineWidth = 1.5; ctx.strokeStyle = paintColor;
        ctx.beginPath(); ctx.arc(x,y,size,0,Math.PI/2); ctx.stroke(); break; }
      case 'jitter': {
        ctx.lineWidth = 1; ctx.strokeStyle = paintColor;
        ctx.beginPath(); for(let i=0;i<8;i++){ const px=x+(Math.random()-0.5)*size*2; const py=y+(Math.random()-0.5)*size*2; if(i===0) ctx.moveTo(px,py); else ctx.lineTo(px,py);} ctx.closePath(); ctx.stroke(); break; }
      default: // fallback to filled circle
        ctx.fillStyle = paintColor; ctx.beginPath(); ctx.arc(x,y,size,0,Math.PI*2); ctx.fill();
    }
  }

  function drawStar(x,y,size,points){
    const outer=size, inner=size*0.45; const step=Math.PI/points; ctx.beginPath();
    for(let i=0;i<points*2;i++){ const r=(i%2===0)?outer:inner; const a=i*step - Math.PI/2; const px=x+Math.cos(a)*r; const py=y+Math.sin(a)*r; if(i===0) ctx.moveTo(px,py); else ctx.lineTo(px,py);} ctx.closePath(); ctx.strokeStyle=paintColor; ctx.lineWidth=1.5*strokeScale; ctx.stroke();
  }

  function drawLine(x1,y1,x2,y2){
    ctx.lineWidth = 1.5*strokeScale; // theme-scaled stroke
    ctx.strokeStyle = paintColor; // theme-controlled paint color
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  // Draw smooth Catmull–Rom curve through last four points
  function drawCurveSegment(p0, p1, p2, p3){
    ctx.lineWidth = 1.5*strokeScale;
    ctx.strokeStyle = paintColor;
    ctx.beginPath();
    // sample the parametric curve from t=0..1
    const steps = 12;
    for (let i=0; i<=steps; i++){
      const t = i/steps;
      const t2 = t*t;
      const t3 = t2*t;
      // Catmull-Rom basis matrix with tension = 0.5
      const b0 = -0.5*t3 + t2 - 0.5*t;
      const b1 =  1.5*t3 - 2.5*t2 + 1.0;
      const b2 = -1.5*t3 + 2.0*t2 + 0.5*t;
      const b3 =  0.5*t3 - 0.5*t2;
      const x = b0*p0.x + b1*p1.x + b2*p2.x + b3*p3.x;
      const y = b0*p0.y + b1*p1.y + b2*p2.y + b3*p3.y;
      if (i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    }
    ctx.stroke();
  }

  function isPrintable(e){
    if (e.ctrlKey || e.altKey || e.metaKey) return false; // ignore modifiers
    // printable: single characters and space; exclude Enter from char count
    return (e.key.length === 1 || e.key === ' ');
  }

  function onKeydown(e){
    // Exit idle immediately on any keypress
    lastKeyTime = performance.now();
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown'){
      const delta = (e.key === 'ArrowUp') ? 0.2 : -0.2;
      strokeTarget = Math.min(maxStroke, Math.max(minStroke, strokeTarget + delta));
      try { localStorage.setItem('strokeScale', String(strokeTarget)); } catch {}
      if (statStroke) statStroke.textContent = `Stroke: ${strokeTarget.toFixed(2)}x`;
      e.preventDefault();
      return;
    }
    // Stats update only on input events; handle keys deterministically
    const printable = isPrintable(e);
    const isBackspace = (e.key === 'Backspace');
    const isIgnoredModifier = (e.ctrlKey || e.altKey || e.metaKey || e.shiftKey);

    if (!state.startedAt && (printable || isBackspace)) {
      state.startedAt = performance.now();
    }

    if (printable) {
      if (e.key === ' ') e.preventDefault();
      state.keystrokes++;
      state.typedCount++;

      const code = e.key.charCodeAt(0);
      const delta = ((code % 17) - 8) * 0.06; // influence heading subtly
      state.angle += delta;

      // Apply an impulse along the rotating force direction
      vx += Math.cos(forceDir) * impulse;
      vy += Math.sin(forceDir) * impulse;
      // Slightly rotate direction on each key for organic feel
      forceDir += 0.25 * delta;

      // Draw shape at current position on keypress
      drawShape(currentShape, state.x, state.y, 8);
    } else if (isBackspace) {
      state.keystrokes++;
      // backspace removes a previously counted char
      state.backspaceCount++;
      // and removes an error if any exist
      if (state.errors > 0) state.errors--;
    } else if (!isIgnoredModifier) {
      // count as an error (Tab, Enter, Escape, arrows, etc.)
      state.keystrokes++;
      state.errors++;
    }

    updateStats();
  }

  // Continuous physics update and curved drawing
  let lastTime = performance.now();
  function update(){
    const now = performance.now();
    const dt = Math.max(0, (now - lastTime)/1000); // seconds
    lastTime = now;
    lastFrameDt = dt;
    // smooth stroke scale toward target every frame
    strokeScale += (strokeTarget - strokeScale) * strokeLerp;

    // Rotate force direction slowly over time
    forceDir += rotateRate * dt;

    // Exponential damping (inertia + friction)
    const damp = Math.exp(-damping * dt);
    vx *= damp; vy *= damp;

    // Soft edge steering: apply inward force when near edges
    const cx = canvas.width/2, cy = canvas.height/2;
    const distLeft = state.x - padding;
    const distRight = (canvas.width - padding) - state.x;
    const distTop = state.y - padding;
    const distBottom = (canvas.height - padding) - state.y;
    const nearX = Math.max(0, (edgeZone - Math.min(distLeft, distRight)) / edgeZone);
    const nearY = Math.max(0, (edgeZone - Math.min(distTop, distBottom)) / edgeZone);
    const near = Math.max(nearX, nearY);
    if (near > 0){
      let dx = cx - state.x, dy = cy - state.y;
      const len = Math.hypot(dx, dy) || 1;
      dx /= len; dy /= len;
      vx += dx * centerForce * near * dt;
      vy += dy * centerForce * near * dt;
    }

    // Clamp speed
    const speed = Math.hypot(vx, vy);
    if (speed > maxSpeed){
      const s = maxSpeed / speed; vx *= s; vy *= s;
    }

    // Integrate position
    const px = state.x, py = state.y;
    let nx = state.x + vx * dt;
    let ny = state.y + vy * dt;

    // Physics-safe collision with hard bounds (with padding)
    if (nx < padding){
      nx = padding;
      if (vx < 0) vx = -vx * bounceFactor;
    } else if (nx > canvas.width - padding){
      nx = canvas.width - padding;
      if (vx > 0) vx = -vx * bounceFactor;
    }
    if (ny < padding){
      ny = padding;
      if (vy < 0) vy = -vy * bounceFactor;
    } else if (ny > canvas.height - padding){
      ny = canvas.height - padding;
      if (vy > 0) vy = -vy * bounceFactor;
    }

    state.x = nx;
    state.y = ny;

    // Add to trail and draw a smooth curve segment
    const last = trail[trail.length-1];
    const dx = state.x - last.x, dy = state.y - last.y;
    if (Math.hypot(dx, dy) >= minSegment){
      trail.push({x: state.x, y: state.y});
      if (trail.length >= 4){
        const p0 = trail[trail.length-4];
        const p1 = trail[trail.length-3];
        const p2 = trail[trail.length-2];
        const p3 = trail[trail.length-1];
        drawCurveSegment(p0, p1, p2, p3);
      } else {
        // fallback for initial few points
        drawLine(px, py, state.x, state.y);
      }
    }
  }

  function applyIdleFade(){
    const now = performance.now();
    const idleSec = (now - lastKeyTime)/1000;
    if (idleSec >= idleThreshold){
      const a = 1 - Math.exp(-idleFadeRate * Math.max(0.001, lastFrameDt));
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.globalAlpha = a;
      ctx.fillRect(0,0,canvas.width,canvas.height);
      ctx.restore();
    }
  }

  function updateStats(){
    // Time uses performance.now, starts on first valid input
    const now = performance.now();
    const timeSec = state.startedAt ? (now - state.startedAt)/1000 : 0;
    state.elapsed = timeSec;

    // Deterministic chars: totalTyped - totalBackspaces, never negative
    const chars = Math.max(0, state.typedCount - state.backspaceCount);

    // WPM strict definition with 1s minimum clamp in denominator
    const denomSec = Math.max(1, timeSec);
    const wpmVal = (chars / 5) / (denomSec / 60);

    // Accuracy: if no errors => 100%; else ((correctChars - errors)/correctChars) * 100
    const correctChars = chars;
    let accVal = 100;
    if (state.errors > 0 && correctChars > 0){
      accVal = ((correctChars - state.errors) / correctChars) * 100;
    }
    // Clamp 0..100
    accVal = Math.max(0, Math.min(100, accVal));

    // Display with rounding at output only
    statWpm.textContent = `WPM: ${wpmVal.toFixed(1)}`;
    statAcc.textContent = `Accuracy: ${accVal.toFixed(1)}%`;
    statChars.textContent = `Chars: ${chars}`;
    statTime.textContent = `Time: ${timeSec.toFixed(2)}s`;
    if (statStroke) statStroke.textContent = `Stroke: ${strokeTarget.toFixed(2)}x`;
  }

  // Paint themed background behind existing strokes every frame
  function paintBackground(){
    if (!currentTheme) return;
    ctx.save();
    ctx.globalCompositeOperation = 'destination-over';
    ctx.fillStyle = currentTheme.background;
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.restore();
  }

  function tick(){
    update();
    applyIdleFade();
    paintBackground();
    // Stats are updated only on input events (frame independent)
    requestAnimationFrame(tick);
  }

  // Freehand sketch mode
  (function(){
    const sizeEl = document.getElementById('brushSize');
    const colorEl = document.getElementById('brushColor');
    const toggleEl = document.getElementById('freehandToggle'); // may not exist anymore
    const panel = document.getElementById('sketchPanel');
    const toggleBtn = document.getElementById('sketchToggle');
    if (!sizeEl || !colorEl || !panel) return;
    let isDrawing = false; let lastX = 0, lastY = 0; let freehandOn = false;
    function getBrush(){
      const s = Math.max(1, Math.min(80, parseInt(sizeEl.value||'10',10)));
      const c = colorEl.value || paintColor;
      return { s, c };
    }
    colorEl.addEventListener('input', ()=>{ colorEl.dataset.userPicked = '1'; });
    sizeEl.addEventListener('input', ()=>{});
    function setFreehand(on){ freehandOn = !!on; panel.classList.toggle('active', freehandOn); }
    // Expose toggler for mobile default enable
    if (window.__TC) { window.__TC.setFreehand = setFreehand; }
    if (toggleEl) toggleEl.addEventListener('change', ()=> setFreehand(toggleEl.checked));
    if (toggleBtn){
      const handler = ()=> setFreehand(!freehandOn);
      toggleBtn.addEventListener('click', handler);
      toggleBtn.addEventListener('keydown', (e)=>{ if (e.key==='Enter' || e.key===' ') { e.preventDefault(); handler(); } });
    } else {
      panel.addEventListener('click', (e)=>{ if (e.target === colorEl || e.target === sizeEl) return; setFreehand(!freehandOn); });
    }
    canvas.addEventListener('mousedown', (e)=>{
      if (!freehandOn) return;
      isDrawing = true;
      const rect = canvas.getBoundingClientRect();
      lastX = e.clientX - rect.left; lastY = e.clientY - rect.top;
    });
    window.addEventListener('mouseup', ()=>{ isDrawing = false; });
    canvas.addEventListener('mousemove', (e)=>{
      if (!isDrawing || !freehandOn) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left; const y = e.clientY - rect.top;
      const { s, c } = getBrush();
      ctx.save();
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.strokeStyle = c; ctx.lineWidth = s * strokeScale;
      ctx.beginPath(); ctx.moveTo(lastX,lastY); ctx.lineTo(x,y); ctx.stroke();
      ctx.restore();
      lastX = x; lastY = y;
    });
    // Touch support
    canvas.addEventListener('touchstart', (e)=>{
      if (!freehandOn) return; const t=e.touches[0]; if(!t) return;
      isDrawing = true; const rect = canvas.getBoundingClientRect(); lastX = t.clientX-rect.left; lastY=t.clientY-rect.top; e.preventDefault();
    }, {passive:false});
    canvas.addEventListener('touchend', ()=>{ isDrawing = false; });
    canvas.addEventListener('touchmove', (e)=>{
      if (!isDrawing || !freehandOn) return; const t=e.touches[0]; if(!t) return;
      const rect = canvas.getBoundingClientRect(); const x=t.clientX-rect.left; const y=t.clientY-rect.top;
      const { s, c } = getBrush();
      ctx.save(); ctx.lineCap='round'; ctx.lineJoin='round'; ctx.strokeStyle=c; ctx.lineWidth=s*strokeScale;
      ctx.beginPath(); ctx.moveTo(lastX,lastY); ctx.lineTo(x,y); ctx.stroke(); ctx.restore(); lastX=x; lastY=y; e.preventDefault();
    }, {passive:false});
  })();

  // Mascot theming and accessory per theme
  function setMascotTheme(t){
    const svg = document.getElementById('mascotSvg');
    if (!svg) return;
    const body = svg.querySelector('#m-body rect');
    const eyes = svg.querySelectorAll('#m-eyes circle');
    const accs = svg.querySelectorAll('.acc');
    accs.forEach(g => g.style.display = 'none');
    const mapping = {
      'Light': 'acc-tie',
      'Dark': 'acc-glasses',
      'Midnight': 'acc-cape',
      'Paper': 'acc-hat',
      'Terminal': 'acc-bandana',
      'Neon': 'acc-headphones',
      'Solarized Dark': 'acc-star',
      'Solarized Light': 'acc-bow',
      'Monochrome Gray': 'acc-badge',
      'Blood Moon': 'acc-fangs'
    };
    const accId = mapping[t.name];
    if (accId){ const el = svg.querySelector(`#${accId}`); if (el) el.style.display = 'block'; }
    const paint = t.paint;
    const text = t.text;
    if (body){ body.setAttribute('fill', hexToRGBA(paint, 0.15)); body.setAttribute('stroke', text); }
    eyes.forEach(c => { c.setAttribute('fill', text); });
    accs.forEach(g => { g.setAttribute('fill', text); g.setAttribute('stroke', text); });
  }

  function hexToRGBA(hex, a){
    const v = hex.replace('#','');
    const r = parseInt(v.substring(0,2),16);
    const g = parseInt(v.substring(2,4),16);
    const b = parseInt(v.substring(4,6),16);
    return `rgba(${r},${g},${b},${a})`;
  }

  function hexToRGB(hex){
    const v = hex.replace('#','');
    return {
      r: parseInt(v.substring(0,2),16),
      g: parseInt(v.substring(2,4),16),
      b: parseInt(v.substring(4,6),16)
    };
  }
  function rgbToHex(r,g,b){
    const h = (n)=> ('0'+n.toString(16)).slice(-2);
    return `#${h(r)}${h(g)}${h(b)}`;
  }
  function mixHex(aHex, bHex, ratio){
    const a = hexToRGB(aHex), b = hexToRGB(bHex);
    const r = Math.round(a.r*(1-ratio) + b.r*ratio);
    const g = Math.round(a.g*(1-ratio) + b.g*ratio);
    const b2 = Math.round(a.b*(1-ratio) + b.b*ratio);
    return rgbToHex(r,g,b2);
  }
  function wcagLuminance(hex){
    const v = hexToRGB(hex);
    const srgb = [v.r/255, v.g/255, v.b/255].map(c => c <= 0.03928 ? c/12.92 : Math.pow((c+0.055)/1.055, 2.4));
    return 0.2126*srgb[0] + 0.7152*srgb[1] + 0.0722*srgb[2];
  }
  function contrastRatio(hex1, hex2){
    const L1 = wcagLuminance(hex1), L2 = wcagLuminance(hex2);
    const hi = Math.max(L1, L2), lo = Math.min(L1, L2);
    return (hi + 0.05) / (lo + 0.05);
  }
  function ensureReadableColor(preferredHex, bgHex, altHex){
    // choose color with better contrast vs background (>=4.5 preferred)
    const cr = contrastRatio(preferredHex, bgHex);
    if (cr >= 4.5) return preferredHex;
    const altCr = altHex ? contrastRatio(altHex, bgHex) : 0;
    return altCr > cr ? altHex : preferredHex;
  }

  function hexLuminance(hex){
    const v = hex.replace('#','');
    const r = parseInt(v.substring(0,2),16)/255;
    const g = parseInt(v.substring(2,4),16)/255;
    const b = parseInt(v.substring(4,6),16)/255;
    // sRGB luminance
    const srgb = [r,g,b].map(c => c <= 0.03928 ? c/12.92 : Math.pow((c+0.055)/1.055, 2.4));
    return 0.2126*srgb[0] + 0.7152*srgb[1] + 0.0722*srgb[2];
  }

  window.addEventListener('keydown', onKeydown);
  // Optional shortcuts: [ and ] cycle shapes, 1-9 quick select
  window.addEventListener('keydown', (e) => {
    if (e.key === '[') { currentShapeIndex = (currentShapeIndex - 1 + shapeList.length) % shapeList.length; currentShape = shapeList[currentShapeIndex]; if (shapeSelect) shapeSelect.value = currentShape; }
    else if (e.key === ']') { currentShapeIndex = (currentShapeIndex + 1) % shapeList.length; currentShape = shapeList[currentShapeIndex]; if (shapeSelect) shapeSelect.value = currentShape; }
    else if (/^[1-9]$/.test(e.key)) { const map = ['circle-fill','square-fill','triangle-up','star-5','star-8','heart','diamond','cross','plus']; const idx = parseInt(e.key,10)-1; currentShape = map[idx] || currentShape; currentShapeIndex = shapeList.indexOf(currentShape); if (shapeSelect) shapeSelect.value = currentShape; }
  });
  console.log('Keydown listener attached to window');
  loadTheme();
  tick();
  // expose minimal internals for auxiliary features (read-only accessors)
  window.__TC = {
    get canvas(){ return canvas; },
    get ctx(){ return ctx; },
    get paint(){ return paintColor; },
    get theme(){ return currentTheme; },
    THEMES,
    applyTheme,
    state
  };
})();

// Mobile overlay controls: collapse panels into gear on small screens (additive)
(function(){
  const mql = window.matchMedia('(max-width: 768px)');
  const gearBtn = document.getElementById('mobileControlsBtn');
  const overlay = document.getElementById('mobileControlsOverlay');
  const container = document.getElementById('mobileControlsContainer');
  const closeBtn = overlay ? overlay.querySelector('.mc-close') : null;
  const backdrop = overlay ? overlay.querySelector('.mc-backdrop') : null;

  const panels = ['shapePanel','themePanel','sketchPanel']
    .map(id => document.getElementById(id))
    .filter(Boolean);
  const originalParents = new Map();
  panels.forEach(el => { if (el && el.parentElement) originalParents.set(el, el.parentElement); });

  function toMobile(){
    if (!container) return;
    panels.forEach(el => { if (el && el.parentElement !== container) container.appendChild(el); });
    // Enable freehand by default on mobile
    if (window.__TC && typeof window.__TC.setFreehand === 'function') { try{ window.__TC.setFreehand(true); }catch{} }
  }
  function toDesktop(){
    panels.forEach(el => {
      const parent = originalParents.get(el);
      if (parent && el && el.parentElement !== parent) parent.appendChild(el);
    });
    if (overlay){ overlay.classList.remove('open'); overlay.setAttribute('aria-hidden','true'); }
  }
  function updateMode(){
    const isMobile = mql.matches;
    if (isMobile){ if (gearBtn) gearBtn.style.display = 'grid'; toMobile(); }
    else { if (gearBtn) gearBtn.style.display = 'none'; toDesktop(); }
  }
  if (gearBtn && overlay){
    gearBtn.addEventListener('click', ()=>{ overlay.classList.add('open'); overlay.setAttribute('aria-hidden','false'); });
    closeBtn && closeBtn.addEventListener('click', ()=>{ overlay.classList.remove('open'); overlay.setAttribute('aria-hidden','true'); });
    backdrop && backdrop.addEventListener('click', ()=>{ overlay.classList.remove('open'); overlay.setAttribute('aria-hidden','true'); });
  }
  if (mql.addEventListener) mql.addEventListener('change', updateMode); else mql.addListener(updateMode);
  // initial application after DOM is ready
  setTimeout(updateMode, 0);
})();

// Help modal behavior (non-intrusive)
(function(){
  const helpBtn = document.getElementById('helpBtn');
  const helpModal = document.getElementById('helpModal');
  if (!helpBtn || !helpModal) return;
  const backdrop = helpModal.querySelector('.help-backdrop');
  const closeBtn = helpModal.querySelector('.help-close');

  function openModal(){ helpModal.classList.add('open'); helpModal.setAttribute('aria-hidden', 'false'); }
  function closeModal(){ helpModal.classList.remove('open'); helpModal.setAttribute('aria-hidden', 'true'); }

  helpBtn.addEventListener('click', openModal);
  closeBtn && closeBtn.addEventListener('click', closeModal);
  backdrop && backdrop.addEventListener('click', closeModal);
})();

// Toolbar actions: music, save, clear
(function(){
  const TC = window.__TC; if (!TC) return;
  const musicBtn = document.getElementById('musicBtn');
  const saveBtn = document.getElementById('saveBtn');
  const clearBtn = document.getElementById('clearBtn');
  // Simple ambient audio using Web Audio API (no external files)
  (function(){
    let ctx = null, gain = null, nodes = [];
    function create(){
      if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (!gain){ gain = ctx.createGain(); gain.gain.value = 0.02; gain.connect(ctx.destination); }
      if (nodes.length === 0){
        const osc1 = ctx.createOscillator(); osc1.type = 'sine'; osc1.frequency.value = 220;
        const osc2 = ctx.createOscillator(); osc2.type = 'sine'; osc2.frequency.value = 330;
        const lfo = ctx.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 0.2;
        const lfoGain = ctx.createGain(); lfoGain.gain.value = 30; lfo.connect(lfoGain); lfoGain.connect(osc1.frequency);
        osc1.connect(gain); osc2.connect(gain);
        nodes = [osc1, osc2, lfo];
      }
    }
    function start(){
      create();
      if (ctx.state === 'suspended') ctx.resume();
      nodes.forEach(n=>{ try{ n.start && n.start(); }catch{} });
    }
    function stop(){ if (ctx) ctx.suspend(); }
    window.__MUSIC = {
      start, stop,
      get enabled(){ return !!ctx && ctx.state === 'running'; }
    };
  })();
  if (musicBtn){
    const saved = localStorage.getItem('musicOn') === 'true';
    const setIcon = (on)=>{ musicBtn.textContent = on ? '🔊' : '🔇'; };
    setIcon(saved);
    if (saved) { try{ window.__MUSIC.start(); }catch{} }
    musicBtn.addEventListener('click', async ()=>{
      const on = localStorage.getItem('musicOn') === 'true';
      if (on){ window.__MUSIC.stop(); localStorage.setItem('musicOn','false'); setIcon(false); }
      else { try{ await window.__MUSIC.start(); }catch{} localStorage.setItem('musicOn','true'); setIcon(true); }
    });
  }
  if (saveBtn){
    saveBtn.addEventListener('click', ()=>{
      try{
        const url = TC.canvas.toDataURL('image/png');
        const a = document.createElement('a'); a.href = url; a.download = 'typing-canvas.png'; a.click();
      }catch(err){ console.error('Save failed', err); }
    });
  }
  if (clearBtn){
    clearBtn.addEventListener('click', ()=>{
      const t = TC.theme || {background:'#ffffff'};
      const ctx = TC.ctx; ctx.save(); ctx.globalCompositeOperation='source-over'; ctx.fillStyle=t.background; ctx.fillRect(0,0,TC.canvas.width,TC.canvas.height); ctx.restore();
    });
  }
})();

// Paragraph Mode
(function(){
  const TC = window.__TC;
  if (!TC) return;
  const paraBtn = document.getElementById('paraBtn');
  const paraModal = document.getElementById('paraModal');
  const paraList = paraModal ? paraModal.querySelector('#paraList') : null;
  const paraClose = paraModal ? paraModal.querySelector('.para-close') : null;
  const pv = document.getElementById('paragraphView');
  const pvTitle = document.getElementById('pvTitle');
  const pvText = document.getElementById('pvText');
  const pvExit = document.getElementById('pvExit');
  if (!paraBtn || !paraModal || !paraList || !pv || !pvTitle || !pvText || !pvExit) return;

  const PARAS = [
    { id:'sus', title:'Sussy Stroll', text:'Red is sus, Blue is chill, and Yellow absolutely did not vent (probably). You are a very responsible crewmate typing official space paperwork: “Do not press emergency meeting for vibes.” Bop through this paragraph while our round little astronauts wobble past the cafeteria, pretend to fix wires, and definitely do not swipe ID fourteen times. Your mission: type smoothly, avoid sussiness, and reveal the doodle of two goofy beans high-fiving under a big neon “Tasks?” sign. High accuracy keeps the lines clean and crisp like a perfect card swipe; mistakes add a funny jelly wobble that screams “who sabotaged my keyboard?” Type faster to energize the strokes, making the beans bounce with heroic impostor energy. If you bonk backspace, the drawing rewinds a smidge, the beans shake their tiny visors, and everyone agrees we saw nothing. When you finish, the crew celebrates with suspicious pizza and non-suspicious friendship.', drawing:{ type:'poly', points:[ [10,70],[20,70],[25,45],[40,40],[55,45],[60,70],[70,70],[70,80],[10,80],[10,70], [35,52],[50,52],[50,60],[35,60],[35,52] ] } },
    { id:'cat', title:'Sneaky Cat', text:'Behold the midnight gremlin: a glossy void cat that materializes exactly when you open a document. It tiptoes across the keyboard, sits on the paragraph you need, and says “meow” in lowercase for aesthetic. Type this text to reveal our doodle of a sneaky feline scooting between the lines, leaving faint paw-prints of chaos. High accuracy keeps the whiskers smooth like artisan spaghetti; mistakes add playful wobble, as if the cat hopped onto Caps Lock and refused to explain itself. Speed gives the strokes extra pep, like turbo zoomies at 3am when your soul is elsewhere. Backspace performs a tiny reverse-scoot, tail flicking, eyes narrowing with polite disapproval. Finish the paragraph and the cat proudly loafs, claiming moral victory and your warm laptop ventilation. No crumbs were harmed, but a single paperclip has vanished forever into the void.', drawing:{ type:'poly', points:[ [15,65],[25,50],[30,60],[35,48],[40,60],[55,60],[65,70],[60,80],[45,78],[30,75],[20,72],[15,65] ] } },
    { id:'coffee', title:'Coffee Quest', text:'You brewed the hero’s cup: a legally powerful potion that upgrades focus, unlocks side quests, and grants +2 charisma in meetings. Type steadily to reveal a cozy mug doodle with steam curls that look like tiny musical notes doing a victory lap. Keep your accuracy high and the steam stays elegant—barista-level latte art for your keyboard. Slip up and the foam gets a silly wiggle, an espresso boop that admits “we are human, it is Monday.” Type faster and the lines perk up like freshly roasted beans sprinting toward productivity. Tap backspace and the mug clinks softly as if rewinding a sip, then resolves into polite calm. Complete the paragraph and your mug becomes legendary: it promises zero spills, unlimited vibes, and the ability to finish the thing you started three weeks ago. Refill responsibly. Or irresponsibly. We don’t judge.', drawing:{ type:'poly', points:[ [20,40],[60,40],[60,75],[20,75],[20,40], [60,50],[72,52],[74,60],[70,68],[60,70] ] } },
    { id:'duck', title:'Goofy Duck', text:'This is not a regular duck; this is a certified quack professional with aerodynamic bread storage and deluxe honk mode. As you type, a cheerful cartoon duck appears in crisp strokes, marching toward destiny (a puddle). High accuracy makes the bill perfect and the feathers neat, like a tuxedo that honks. Mistakes add a wobbly jiggle that screams “someone dropped a croissant.” Fast typing animates splash lines with extra zip, like the duck discovered rocket sandals. When you backspace, the duck does a tiny rewind shimmy, then nods solemnly as if signing a treaty with breadcrumbs. Finish this paragraph and our mighty waterfowl salutes you for excellence in quack-related operations. Awards include: honorary bread voucher, pond parking privileges, and lifetime subscription to Gentle Honk Weekly. Waddle forth, keyboard champion.', drawing:{ type:'poly', points:[ [15,60],[25,55],[40,55],[55,60],[65,70],[55,72],[45,70],[35,68],[28,72],[20,70],[15,60], [40,55],[50,48],[60,50],[50,52],[40,55] ] } }
  ];

  let paraMode = false;
  let para = null;
  let paraIndex = 0;
  let paraPoints = [];
  let paraCumLen = [];
  let paraTotal = 0;
  let typedIdx = 0;
  let mistakes = 0;
  let lastPrintableAt = 0;
  let shakeTimer = 0;

  function openModal(){ paraModal.classList.add('open'); paraModal.setAttribute('aria-hidden','false'); }
  function closeModal(){ paraModal.classList.remove('open'); paraModal.setAttribute('aria-hidden','true'); }
  paraBtn.addEventListener('click', openModal);
  paraClose && paraClose.addEventListener('click', closeModal);
  paraModal.querySelector('.help-backdrop').addEventListener('click', closeModal);

  function buildList(){
    paraList.innerHTML = '';
    PARAS.forEach((p,i)=>{
      const div = document.createElement('div');
      div.className = 'para-item';
      div.innerHTML = `<strong>${p.title}</strong><div style="opacity:.85;margin-top:4px;">${p.text}</div>`;
      div.addEventListener('click', ()=>{ selectPara(i); closeModal(); });
      paraList.appendChild(div);
    });
  }
  buildList();

  function selectPara(i){
    paraMode = true; para = PARAS[i]; paraIndex = i; typedIdx = 0; mistakes = 0; shakeTimer = 0; lastPrintableAt = performance.now();
    pv.classList.add('open'); pv.setAttribute('aria-hidden','false'); pvTitle.textContent = para.title;
    renderParagraphView();
    prepareDrawing();
  }
  pvExit.addEventListener('click', ()=>{ paraMode = false; pv.classList.remove('open'); pv.setAttribute('aria-hidden','true'); });

  function renderParagraphView(){
    const t = para.text;
    const done = t.slice(0, typedIdx);
    const next = t.slice(typedIdx, typedIdx+1);
    const rest = t.slice(typedIdx+1);
    pvText.innerHTML = `<span class="pv-done">${escapeHtml(done)}</span><span class="pv-next">${escapeHtml(next)}</span><span class="pv-remaining">${escapeHtml(rest)}</span>`;
  }

  function escapeHtml(s){ return s.replace(/[&<>]/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c])); }

  function prepareDrawing(){
    const pts = para.drawing.points; // normalized 0-100 space
    const inset = 120;
    const w = Math.max(100, TC.canvas.width - inset*2);
    const h = Math.max(100, TC.canvas.height - 200);
    // scale and center to right-middle area to align with paragraph panel
    const sx = w/100, sy = h/100; const s = Math.min(sx, sy);
    const ox = inset; const oy = (TC.canvas.height - (100*s))/2;
    paraPoints = pts.map(([x,y])=>({x: ox + x*s, y: oy + y*s}));
    paraCumLen = [0];
    for(let i=1;i<paraPoints.length;i++){
      const a=paraPoints[i-1], b=paraPoints[i];
      paraCumLen[i] = paraCumLen[i-1] + Math.hypot(b.x-a.x,b.y-a.y);
    }
    paraTotal = paraCumLen[paraCumLen.length-1] || 1;
  }

  function pointAtLength(L){
    if (L<=0) return paraPoints[0];
    if (L>=paraTotal) return paraPoints[paraPoints.length-1];
    let i=1; while(i<paraCumLen.length && paraCumLen[i] < L) i++;
    const a = paraPoints[i-1], b = paraPoints[i];
    const segL = paraCumLen[i]-paraCumLen[i-1]; const t = (L - paraCumLen[i-1]) / (segL||1);
    return { x: a.x + (b.x-a.x)*t, y: a.y + (b.y-a.y)*t };
  }

  function drawReveal(){
    if (!paraMode || !para) return;
    const totalChars = para.text.length;
    const pct = Math.max(0, Math.min(1, typedIdx/totalChars));
    const L = paraTotal * pct;
    const now = performance.now();
    const since = (now - lastPrintableAt)/1000;
    const energy = Math.max(0, 1.3 - Math.min(1.3, since*2.2));
    const wobble = Math.min(10, mistakes*0.8 + (shakeTimer>0?4:0));
    if (shakeTimer>0) shakeTimer -= 1;

    const ctx = TC.ctx;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = TC.paint;
    ctx.lineWidth = (2 + energy*1.5) * (window.__TC ? (parseFloat(localStorage.getItem('strokeScale')||'1.0') || 1.0) : 1.0);
    // slight global wobble
    if (wobble>0){ ctx.translate(Math.sin(now*0.02)*wobble*0.3, Math.cos(now*0.017)*wobble*0.3); }
    ctx.beginPath();
    for(let i=0;i<paraPoints.length;i++){
      const curL = paraCumLen[i];
      if (curL > L) {
        const pt = pointAtLength(L);
        if (i===0) ctx.moveTo(paraPoints[0].x, paraPoints[0].y);
        else ctx.lineTo(pt.x, pt.y);
        break;
      } else {
        const p = paraPoints[i];
        if (i===0) ctx.moveTo(p.x,p.y); else ctx.lineTo(p.x,p.y);
      }
    }
    ctx.stroke();
    ctx.restore();

    // force dot to follow path point with small offset based on wobble/energy
    const targ = pointAtLength(L);
    const offA = now*0.01;
    const offR = wobble*0.3;
    TC.state.x = targ.x + Math.cos(offA)*offR;
    TC.state.y = targ.y + Math.sin(offA*1.3)*offR;
  }

  // augment input handling for paragraph mode without changing existing logic
  window.addEventListener('keydown', (e)=>{
    if (!paraMode) return;
    const printable = isPrintable(e);
    const isBackspace = (e.key === 'Backspace');
    if (printable){
      lastPrintableAt = performance.now();
      const expected = para.text[typedIdx] || '';
      if (e.key === expected){ typedIdx = Math.min(para.text.length, typedIdx+1); mistakes = Math.max(0, mistakes-0.25); }
      else { mistakes += 1; }
      renderParagraphView();
    } else if (isBackspace){
      typedIdx = Math.max(0, typedIdx-1); shakeTimer = 6; renderParagraphView();
    }
  });

  // hook draw
  // independent overlay loop to draw paragraph reveal without touching core loop
  (function loop(){ if (paraMode) drawReveal(); requestAnimationFrame(loop); })();
})();

// Replay controls removed

// Image loaders: background and mascot
// Mascot image loader (background image option removed)
(function(){
  const mascotInput = document.getElementById('mascotImageInput');
  const mascotImg = document.getElementById('mascotImg');
  if (mascotInput && mascotImg){
    mascotInput.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const fr = new FileReader();
      fr.onload = () => {
        mascotImg.src = fr.result;
        mascotImg.style.display = 'block';
      };
      fr.readAsDataURL(file);
    });
  }
})();
