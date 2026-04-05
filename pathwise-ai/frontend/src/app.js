/**
 * app.js — PathWise AI
 * Main application controller.
 *
 * Architecture:
 *   - In BACKEND mode:  polls FastAPI /api/telemetry/snapshot every 500ms
 *   - In STANDALONE mode: runs the built-in JS sim engine (no server needed)
 *
 * Toggle via: App.USE_BACKEND = true | false
 */

const App = (() => {

  // ── CONFIG ─────────────────────────────────────────────────────────────────
  const USE_BACKEND    = false;   // set true when FastAPI backend is running
  const API_BASE       = 'http://localhost:8000';
  const AUTO_DEG_AT    = 15;
  const TICK_INTERVAL  = 500;     // ms

  // ── STATE ──────────────────────────────────────────────────────────────────
  let running      = false;
  let tickTimer    = null;
  let logPointer   = 0;           // track which log entries are new
  let history      = { fl: [], sl: [], ll: [] };

  // ── BUILT-IN SIM (standalone mode, no backend needed) ─────────────────────
  // Real-world baselines:
  //   Fiber FTTH  — FCC Broadband America 2023: 8.2ms lat, 0.9ms jit, 0.12% loss
  //   Starlink    — SpaceX public data 2022-23: 32.5ms lat, 5.1ms jit, 0.48% loss
  //   Degradation — FCC fiber congestion event traces

  const FIBER  = { lat: 8.2,  jit: 0.9, loss: 0.12, bw: 940 };
  const STAR   = { lat: 32.5, jit: 5.1, loss: 0.48, bw: 220 };
  const DEG    = [
    [0,  1.0,  1.0,  0.00],
    [4,  1.4,  1.9,  0.30],
    [8,  2.3,  3.4,  1.50],
    [12, 4.1,  5.2,  4.20],
    [16, 7.0,  7.8,  9.80],
    [22, 11.0, 11.0, 19.20],
    [28, 16.5, 14.0, 28.50],
  ];

  let SIM = _freshSim();

  function _freshSim() {
    return {
      t: 0, phase: 'idle', degStart: -1,
      alerted: false, alertT: -1,
      switched: false, switchT: -1,
      activeLink: 'fiber', pktsAvoided: 0,
      lm: 1, jm: 1, la: 0,
      logs: [],
    };
  }

  function _lerp(a, b, t) { return a + (b - a) * t; }
  function _gauss(mu, sd)  { return mu + sd * (Math.random() + Math.random() + Math.random() - 1.5) * 1.15; }

  function _fiberMetrics() {
    const t = SIM.t;
    let lat = FIBER.lat, jit = FIBER.jit, loss = FIBER.loss, health = 98.5;
    let lm = 1, jm = 1, la = 0;

    if (SIM.degStart < 0 || SIM.phase === 'stable') {
      lat  += 0.9 * Math.sin(t * 0.28) + _gauss(0, 0.35);
      jit  += 0.3 * Math.sin(t * 0.65) + _gauss(0, 0.10);
      loss  = Math.max(0, loss + _gauss(0, 0.04));
    } else if (SIM.phase === 'degrading') {
      const d = t - SIM.degStart;
      for (let i = 0; i < DEG.length - 1; i++) {
        if (d >= DEG[i][0] && d < DEG[i+1][0]) {
          const f = (d - DEG[i][0]) / (DEG[i+1][0] - DEG[i][0]);
          lm = _lerp(DEG[i][1], DEG[i+1][1], f);
          jm = _lerp(DEG[i][2], DEG[i+1][2], f);
          la = _lerp(DEG[i][3], DEG[i+1][3], f);
          break;
        }
      }
      if (d >= DEG[DEG.length-1][0]) {
        lm = DEG[DEG.length-1][1]; jm = DEG[DEG.length-1][2]; la = DEG[DEG.length-1][3];
      }
      lat    = FIBER.lat * lm + _gauss(0, 0.5 * lm);
      jit    = FIBER.jit * jm + _gauss(0, 0.2 * jm);
      loss   = Math.max(0, FIBER.loss + la + _gauss(0, 0.25));
      health = Math.max(2, 98.5 - Math.min(88, d * 2.9) + _gauss(0, 0.5));
    } else {
      lat = FIBER.lat * 16 + _gauss(0, 7); jit = FIBER.jit * 13;
      loss = 30 + _gauss(0, 2.5); health = 8 + _gauss(0, 2);
      lm = 16; jm = 13; la = 28;
    }
    SIM.lm = lm; SIM.jm = jm; SIM.la = la;
    return {
      lat:    Math.max(1,   +lat.toFixed(4)),
      jit:    Math.max(0.1, +jit.toFixed(4)),
      loss:   Math.max(0,   Math.min(100, +loss.toFixed(5))),
      health: Math.max(0,   Math.min(100, +health.toFixed(3))),
      bw: FIBER.bw,
    };
  }

  function _starlinkMetrics() {
    const t    = SIM.t;
    const beam = Math.sin(t * 0.42) > 0.75 ? 2.8 * Math.sin(t * 0.42) : 0;
    return {
      lat:    Math.max(18,  +(STAR.lat + beam + 4 * Math.sin(t * 0.09) + _gauss(0, 1.2)).toFixed(4)),
      jit:    Math.max(0.5, +(STAR.jit + 1.6 * Math.sin(t * 0.14)     + _gauss(0, 0.4)).toFixed(4)),
      loss:   Math.max(0,   +(STAR.loss + _gauss(0, 0.07)).toFixed(5)),
      health: Math.max(60,  +(89 + _gauss(0, 0.8)).toFixed(3)),
      bw: STAR.bw,
    };
  }

  function _lstmOutput() {
    if (SIM.degStart < 0 || SIM.phase === 'stable')
      return { conf: Math.max(0.01, +_gauss(0.04, 0.01).toFixed(4)), hor: 0, alert: false };
    const d = SIM.t - SIM.degStart;
    let conf = d < 4  ? 0.05 + d * 0.065 + _gauss(0, 0.025)
             : d < 10 ? 0.31 + (d-4) * 0.083 + _gauss(0, 0.028)
             :           Math.min(0.975, 0.81 + (d-10) * 0.019 + _gauss(0, 0.016));
    conf = Math.max(0.01, +conf.toFixed(4));
    return { conf, hor: Math.max(8, Math.round(58 - d * 1.4)), alert: conf >= 0.85 };
  }

  function _simLog(msg, level = 'info') {
    SIM.logs.push({ t: SIM.t, msg, level });
    if (SIM.logs.length > 500) SIM.logs.shift();
  }

  function _buildSnapshot() {
    const F  = _fiberMetrics();
    const S  = _starlinkMetrics();
    const L  = _lstmOutput();
    const cd = Math.max(0, AUTO_DEG_AT - SIM.t);

    // ── AUTO DEGRADATION ──
    if (SIM.phase === 'stable' && SIM.t >= AUTO_DEG_AT) {
      SIM.phase = 'degrading'; SIM.degStart = SIM.t;
      _simLog('═══ AUTO-DEGRADATION TRIGGERED ═══', 'warn');
      _simLog(`event: fiber_congestion | deg_start=${SIM.degStart.toFixed(1)}s`, 'warn');
      _simLog(`profile: ${DEG.length} waypoints | max_lat_mult=${DEG[DEG.length-1][1]}×`, 'warn');
      document.getElementById('auto-bar').style.display = 'none';
      document.getElementById('auto-note').textContent  = '⚡ Degradation active — LSTM analyzing';
    }

    // ── LSTM ALERT ──
    if (SIM.phase === 'degrading' && L.conf >= 0.85 && !SIM.alerted) {
      SIM.alerted = true; SIM.alertT = SIM.t;
      _simLog('═══ PATHWISE ALERT FIRED ═══', 'alert');
      _simLog(`confidence=${(L.conf*100).toFixed(3)}% ≥ threshold=85.000%`, 'alert');
      _simLog(`horizon=${L.hor}s | lat=${F.lat.toFixed(2)}ms | loss=${F.loss.toFixed(3)}%`, 'alert');
      _simLog('action: preparing SDN hitless handoff to starlink', 'alert');
    }

    // ── AUTO SWITCH ──
    if (SIM.phase === 'degrading' && L.conf >= 0.92 && !SIM.switched) {
      SIM.switched = true; SIM.switchT = SIM.t;
      SIM.activeLink = 'starlink'; SIM.phase = 'switched';
      SIM.pktsAvoided = Math.floor(24200 + Math.random() * 1200);
      _simLog('═══ HITLESS SWITCH EXECUTED ═══', 'switch');
      _simLog(`confidence=${(L.conf*100).toFixed(3)}% ≥ switch_threshold=92.000%`, 'switch');
      _simLog(`switch_at=${SIM.switchT.toFixed(2)}s | active_link=starlink | pkts_avoided=${SIM.pktsAvoided}`, 'switch');
      _simLog('sdn_flow_tables: updated | session_state: preserved | <50ms', 'switch');
    }

    // Periodic telemetry log (every 2s)
    if (Math.round(SIM.t * 2) % 4 === 0) {
      if (SIM.phase === 'stable')
        _simLog(`TELEMETRY fiber lat=${F.lat.toFixed(2)}ms jit=${F.jit.toFixed(3)}ms loss=${F.loss.toFixed(4)}% | LSTM=${(L.conf*100).toFixed(2)}%`, 'data');
      else if (SIM.phase === 'degrading')
        _simLog(`DEGRADING lat=${F.lat.toFixed(1)}ms loss=${F.loss.toFixed(2)}% lm=${SIM.lm.toFixed(3)}× | LSTM=${(L.conf*100).toFixed(2)}% hor=${L.hor}s`, 'warn');
      else if (SIM.phase === 'switched')
        _simLog(`STABLE_STARLINK lat=${S.lat.toFixed(1)}ms health=${S.health.toFixed(1)} | fiber_dead=true`, 'success');
    }

    return {
      elapsed:     SIM.t,
      phase:       SIM.phase,
      active_link: SIM.activeLink,
      running:     running,
      countdown:   cd,
      fiber:       F,
      starlink:    S,
      lstm:        L,
      pathwise: {
        alerted:      SIM.alerted,
        alert_t:      SIM.alertT,
        switched:     SIM.switched,
        switch_t:     SIM.switchT,
        pkts_avoided: SIM.pktsAvoided,
      },
      deg_profile: { lat_mult: SIM.lm, jit_mult: SIM.jm, loss_add: SIM.la },
      flags: {
        would_buffer:  SIM.phase === 'degrading' && F.loss > 5.5,
        voip_dropping: SIM.phase === 'degrading' && SIM.t - SIM.degStart > 20 && !SIM.switched,
      },
      logs: SIM.logs,
    };
  }

  // ── POLLING (backend mode) ─────────────────────────────────────────────────
  async function _pollBackend() {
    try {
      const res  = await fetch(`${API_BASE}/api/telemetry/snapshot`);
      const snap = await res.json();
      _render(snap);
      // Push new logs
      const newLogs = snap.logs.slice(logPointer);
      if (newLogs.length) { BackendPanel.appendLog(newLogs); logPointer = snap.logs.length; }
    } catch (e) {
      console.warn('Backend poll failed — check FastAPI is running on port 8000', e);
    }
  }

  // ── LOCAL TICK (standalone mode) ──────────────────────────────────────────
  function _localTick() {
    SIM.t += 0.5;
    const snap    = _buildSnapshot();
    const newLogs = snap.logs.slice(logPointer);
    if (newLogs.length) { BackendPanel.appendLog(newLogs); logPointer = snap.logs.length; }
    _render(snap);
  }

  // ── RENDER ─────────────────────────────────────────────────────────────────
  function _render(snap) {
    const { el, setText, setStyle, fmt } = Helpers;

    // Clock
    setText('clock', fmt(snap.elapsed));

    // Countdown bar
    if (snap.phase === 'stable') {
      const pct = Math.min(100, (snap.elapsed / AUTO_DEG_AT) * 100);
      setStyle('auto-fill', 'width', pct + '%');
      setText('cdnum',    Math.ceil(snap.countdown));
      setText('auto-sec', Math.ceil(snap.countdown) + 's');
      const cd = el('cdnum');
      if (cd) {
        cd.style.color     = snap.countdown <= 5 ? 'var(--danger)' : 'var(--warn)';
        cd.style.animation = snap.countdown <= 5 ? 'flash 0.5s infinite' : 'none';
      }
    }

    // Phase tag
    const tags = { stable: 'STABLE', degrading: snap.pathwise.alerted ? '⚠ ALERT' : 'DEGRADING', switched: 'SWITCHED', idle: 'READY' };
    setText('ptag', tags[snap.phase] || snap.phase.toUpperCase());

    // All sub-components
    LinkCards.update(snap);
    Banner.update(snap);
    LSTMPanel.update(snap);
    Timeline.update(snap);
    BackendPanel.update(snap);

    // Video / VoIP state
    _updateVideo(snap);

    // Chart history
    history.fl.push(snap.fiber.lat);
    history.sl.push(snap.starlink.lat);
    history.ll.push(snap.fiber.loss);
    if (history.fl.length > 48) { history.fl.shift(); history.sl.shift(); history.ll.shift(); }
    Chart.draw(history.fl, history.sl, history.ll);

    // VoIP animation state
    // (VoIP.start callback reads this)
  }

  function _updateVideo(snap) {
    const fill   = document.getElementById('vfill');
    const status = document.getElementById('vstat');
    const wbuf   = document.getElementById('wbuf');
    const wgood  = document.getElementById('wgood');
    const F      = snap.fiber;

    if (snap.flags.would_buffer) {
      if (fill)   { fill.style.width = '7%'; fill.style.background = 'var(--danger)'; }
      if (status) { status.className = 'vid-status buf'; status.textContent = '⏳ BUFFERING...'; }
      if (wbuf)   wbuf.textContent = '● BUFFERING NOW';
    } else if (snap.pathwise.switched) {
      if (fill)   { fill.style.width = '87%'; fill.style.background = 'var(--starlink)'; }
      if (status) { status.className = 'vid-status ok'; status.textContent = '▶ Seamless on Starlink'; }
      if (wgood)  wgood.textContent = '✅ SWITCHED SEAMLESSLY';
    } else if (snap.phase === 'degrading') {
      if (fill)   fill.style.width = Math.max(18, 82 - F.loss * 3.2) + '%';
    }
  }

  // ── PUBLIC API ─────────────────────────────────────────────────────────────
  function launch() {
    document.getElementById('idle').style.display = 'none';
    BackendPanel.init();
    Chart.init();
    VoIP.init();
    VoIP.start(() => ({
      dropping:   SIM.flags ? SIM.flags.voip_dropping : false,
      activeLink: SIM.activeLink,
    }));
  }

  async function startDemo() {
    if (running) return;
    running    = true;
    logPointer = 0;
    history    = { fl: [], sl: [], ll: [] };

    if (USE_BACKEND) {
      await fetch(`${API_BASE}/api/demo/start`, { method: 'POST' });
    } else {
      SIM = _freshSim();
      SIM.phase = 'stable';
      _simLog('PathWise AI standalone demo engine started', 'info');
      _simLog(`config: AUTO_DEG_AT=${AUTO_DEG_AT}s | alert=85% | switch=92%`, 'info');
      _simLog(`fiber_baseline: lat=${FIBER.lat}ms jit=${FIBER.jit}ms loss=${FIBER.loss}%`, 'system');
      _simLog(`starlink_baseline: lat=${STAR.lat}ms jit=${STAR.jit}ms loss=${STAR.loss}%`, 'system');
      _simLog(`degradation_profile: ${DEG.length} waypoints | source: FCC dataset`, 'system');
      _simLog('LSTM engine armed — monitoring lat/jit/loss anomalies', 'info');
    }

    document.getElementById('btn-start').disabled = true;
    document.getElementById('auto-bar').style.display = 'block';
    Timeline.update({ phase: 'stable', elapsed: 0, pathwise: { alerted: false, switched: false, alert_t: -1, switch_t: -1 } });

    tickTimer = setInterval(USE_BACKEND ? _pollBackend : _localTick, TICK_INTERVAL);
  }

  async function resetDemo() {
    if (tickTimer) { clearInterval(tickTimer); tickTimer = null; }
    running    = false;
    logPointer = 0;
    history    = { fl: [], sl: [], ll: [] };
    SIM        = _freshSim();

    if (USE_BACKEND) {
      await fetch(`${API_BASE}/api/demo/reset`, { method: 'POST' });
    }

    // Reset UI
    document.getElementById('btn-start').disabled         = false;
    document.getElementById('auto-bar').style.display     = 'none';
    document.getElementById('auto-note').textContent      = 'Auto-degradation fires at T+15s';
    document.getElementById('idle').style.display         = 'flex';
    document.getElementById('clock').textContent          = 'T+00:00';
    document.getElementById('vfill').style.width          = '80%';
    document.getElementById('vfill').style.background     = 'var(--fiber)';
    document.getElementById('vstat').className            = 'vid-status ok';
    document.getElementById('vstat').textContent          = '▶ Streaming — No Interruption';
    document.getElementById('wbuf').textContent           = '● BUFFERING';
    document.getElementById('wgood').textContent          = '● SEAMLESS';
    document.getElementById('banner').className           = 'banner ok';
    document.getElementById('ban-icon').textContent       = '🟢';
    document.getElementById('ban-title').textContent      = 'All Links Stable — PathWise AI Monitoring';
    document.getElementById('ban-sub').textContent        = 'Waiting to start · Fully autonomous mode';
    document.getElementById('fc').className               = 'lcard f-active';
    document.getElementById('sc').className               = 'lcard dim';
    document.getElementById('fb').textContent             = 'ACTIVE';
    document.getElementById('fb').className               = 'lbadge fiber-badge';
    document.getElementById('sb').textContent             = 'STANDBY';
    document.getElementById('arrow').textContent          = '→';
    document.getElementById('arrow').style.color          = 'var(--muted)';
    document.getElementById('ptag').textContent           = 'READY';

    LSTMPanel.reset();
    Timeline.reset();
    BackendPanel.clearLog();
    VoIP.init();
    VoIP.start(() => ({ dropping: false, activeLink: 'fiber' }));
    Chart.draw([], [], []);
  }

  // ── IDLE STREAM ANIMATION ──────────────────────────────────────────────────
  let _st = 0;
  setInterval(() => {
    _st += 0.5;
    const el = document.getElementById('stream-txt');
    if (el) el.textContent = `lat=${(8.2 + Math.sin(_st*0.3)*0.9).toFixed(2)}ms jit=${(0.9 + Math.random()*0.2).toFixed(3)}ms loss=${(0.12 + Math.random()*0.04).toFixed(4)}% health=98.${Math.floor(Math.random()*9)} LSTM_conf=0.0${Math.floor(Math.random()*4)+2} link=FIBER_FTTH ts=${Date.now()}`;
  }, 180);

  return { launch, startDemo, resetDemo };

})();
