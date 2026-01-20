// Removed
      const lane = document.createElement('div');
      lane.className = 'lane';
      const icon = document.createElement('div');
      icon.className = `icon`;
      icon.style.color = p.color || (p.vehicle_type === 'car' ? '#ef4444' : '#3b82f6');
      icon.style.left = '0px';
      const svgPath = p.vehicle_type === 'car' ? '/static/svg/car.svg' : '/static/svg/plane.svg';
      fetch(svgPath).then(r => r.text()).then(svg => { icon.innerHTML = svg; });
      const name = document.createElement('div');
      name.className = 'nameplate';
      name.textContent = p.name;
      const metric = document.createElement('div');
      metric.className = 'metric';
      metric.textContent = 'WPM: 0';
      lane.appendChild(icon);
      lane.appendChild(name);
      lane.appendChild(metric);
      lane.dataset.pid = p.id;
      trackEl.appendChild(lane);
    });
  }

  function updateTrack(){
    state.participants.forEach(p => {
      const lane = trackEl.querySelector(`.lane[data-pid="${p.id}"]`);
      if (!lane) return;
      const icon = lane.querySelector('.icon');
      const width = trackEl.clientWidth - 40; // padding for icon
      const progress = Math.min(1, (p.progress_chars || 0) / state.totalChars);
      icon.style.left = `${Math.floor(progress * width)}px`;
      const metric = lane.querySelector('.metric');
      const startedAt = state.start_time || Date.now()/1000;
      const now = Date.now()/1000;
      const minutes = Math.max(0.01, (now - startedAt));
      const words = (p.progress_chars || 0) / 5.0;
      const wpm = Math.floor((words / (minutes/60)));
      metric.textContent = `WPM: ${isFinite(wpm)?wpm:0}`;
    });
    // Update HUD with player's WPM
    const me = state.participants.find(x => x.id === state.playerId);
    if (me){
      const startedAt = state.start_time || Date.now()/1000;
      const now = Date.now()/1000;
      const minutes = Math.max(0.01, (now - startedAt));
      const words = (me.progress_chars || 0) / 5.0;
      const wpm = Math.floor((words / (minutes/60)));
      hudWpm.textContent = `WPM: ${isFinite(wpm)?wpm:0}`;
    }
  }

  async function createRace(){
    const playerName = qs('#playerName').value || 'Player';
    const botCount = parseInt(qs('#botCount').value || '5', 10);
    const difficulty = qs('#difficulty').value;
    const passageId = qs('#passageSelect').value;
    const payload = {
      player_name: playerName,
      vehicle_id: state.selectedVehicle?.id,
      vehicle_type: state.selectedVehicle?.type || 'car',
      bot_count: botCount,
      difficulty,
      passage_id: passageId,
      custom_text: (useCustomText.checked ? customText.value : undefined)
    };
    const res = await fetch('/api/race/create', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
    });
    const data = await res.json();
    state.raceId = data.race_id; state.playerId = data.player_id;
    await refreshState();
    buildTrack(state.participants);
    passageText.textContent = state.passage_text;
    typingArea.value = '';
    state.typedChars = 0;
    typingArea.setAttribute('aria-live', 'polite');
    show('race');
    await doCountdown();
    await fetch('/api/race/start', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ race_id: state.raceId }) });
    typingArea.disabled = false;
    typingArea.focus();
    startPolling();
  }

  async function refreshState(){
    const res = await fetch(`/api/race/state/${state.raceId}`);
    const data = await res.json();
    state.totalChars = data.total_chars; state.started = data.started; state.finished = data.finished;
    // Merge color info from vehicles
    state.participants = data.participants.map(p => {
      const v = state.vehicles.find(x => x.id === p.vehicle_id);
      return { ...p, color: v?.color };
    });
    updateTrack();
  }

  let pollHandle = null;
  function startPolling(){
    if (pollHandle) clearInterval(pollHandle);
    pollHandle = setInterval(async () => {
      await refreshState();
      if (state.finished){
        clearInterval(pollHandle);
        showResults();
        if (state.audioOn) playFinish();
      }
    }, 300);
  }

  async function submitTyping(){
    const text = typingArea.value;
    const target = passageText.textContent;
    // count correct contiguous chars
    let count = 0;
    for (let i=0; i<Math.min(text.length, target.length); i++){
      if (text[i] === target[i]) count++; else break;
    }
    state.typedChars = count;
    await fetch(`/api/race/typing/${state.raceId}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ participant_id: state.playerId, typed_chars: count })
    });
  }

  function showResults(){
    fetch(`/api/race/results/${state.raceId}`).then(r => r.json()).then(res => {
      const list = qs('#resultsList');
      list.innerHTML = '';
      res.results.forEach((p, idx) => {
        const li = document.createElement('li');
        li.textContent = `#${idx+1} • ${p.name} (${p.vehicle_type})`;
        list.appendChild(li);
      });
      show('results');
    });
  }

  function exportResults(){
    fetch(`/api/race/results/${state.raceId}`).then(r => r.json()).then(res => {
      const blob = new Blob([JSON.stringify(res, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `race-${state.raceId}.json`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
  }

  async function togglePause(){
    state.paused = !state.paused;
    pauseBtn.textContent = state.paused ? 'Resume' : 'Pause';
    typingArea.disabled = state.paused;
    await fetch('/api/race/pause', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ race_id: state.raceId, paused: state.paused }) });
  }

  function toggleAudio(){
    state.audioOn = !state.audioOn;
    audioToggle.textContent = `Sound: ${state.audioOn ? 'On' : 'Off'}`;
  }

  async function doCountdown(){
    typingArea.disabled = true;
    const seq = ['3','2','1','Go!'];
    countdownEl.hidden = false;
    for (let i=0;i<seq.length;i++){
      countdownEl.textContent = seq[i];
      if (state.audioOn) playBeep(i === seq.length-1 ? 660 : 440, 0.15);
      await new Promise(r => setTimeout(r, 700));
    }
    countdownEl.hidden = true;
  }

  // Simple WebAudio beeps
  let audioCtx = null;
  function ensureAudio(){
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  function playBeep(freq=440, duration=0.1){
    ensureAudio();
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = 'sine'; o.frequency.value = freq;
    g.gain.value = 0.05;
    o.connect(g); g.connect(audioCtx.destination);
    o.start(); o.stop(audioCtx.currentTime + duration);
  }
  function playFinish(){
    playBeep(523, 0.15); setTimeout(() => playBeep(659, 0.15), 180); setTimeout(() => playBeep(784, 0.25), 360);
  }

  function wire(){
    qs('#startBtn').addEventListener('click', createRace);
    typingArea.addEventListener('input', submitTyping);
    qs('#backToHome').addEventListener('click', () => { show('home'); });
    qs('#newRace').addEventListener('click', () => { show('home'); });
    qs('#exportResults').addEventListener('click', exportResults);
    pauseBtn.addEventListener('click', togglePause);
    audioToggle.addEventListener('click', toggleAudio);
    useCustomText.addEventListener('change', () => { customText.disabled = !useCustomText.checked; });
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (views.race.classList.contains('active')){
        if (e.key === ' ') { e.preventDefault(); togglePause(); }
        if (e.key === 'Escape') { show('home'); }
      } else if (views.home.classList.contains('active')){
        if (e.key === 'Enter') { createRace(); }
      }
    });
  }

  async function init(){
    setThemeToggle();
    wire();
    await Promise.all([loadVehicles(), loadPassages()]);
    // Restore basic settings
    try {
      const cfg = JSON.parse(localStorage.getItem('tr_cfg')||'{}');
      if (cfg.botCount) qs('#botCount').value = cfg.botCount;
      if (cfg.difficulty) qs('#difficulty').value = cfg.difficulty;
      if (cfg.audioOn !== undefined){ state.audioOn = !!cfg.audioOn; audioToggle.textContent = `Sound: ${state.audioOn ? 'On' : 'Off'}`; }
    } catch {}
    // Persist on change
    ['botCount','difficulty'].forEach(id => qs('#'+id).addEventListener('change', () => {
      const cfg = { botCount: parseInt(qs('#botCount').value||'5',10), difficulty: qs('#difficulty').value, audioOn: state.audioOn };
      localStorage.setItem('tr_cfg', JSON.stringify(cfg));
    }));
  }

  init();
})();
