/**
 * components/BackendPanel.js — PathWise AI
 * Renders raw values table + live log stream
 */

const BackendPanel = (() => {

  const MAX_LOG = 250;

  function init() {
    _buildTable();
  }

  function _buildTable() {
    const container = document.getElementById('raw-values-container');
    if (!container) return;
    container.innerHTML = `
      <table class="raw-table">
        <thead><tr><th>VARIABLE</th><th>FIBER</th><th>STARLINK</th></tr></thead>
        <tbody>
          <tr class="raw-section"><td colspan="3">── TELEMETRY INPUTS ──</td></tr>
          <tr><td>latency_ms</td>    <td class="rv-fiber"    id="rv-flat">—</td><td class="rv-starlink" id="rv-slat">—</td></tr>
          <tr><td>jitter_ms</td>     <td class="rv-fiber"    id="rv-fjit">—</td><td class="rv-starlink" id="rv-sjit">—</td></tr>
          <tr><td>packet_loss_%</td> <td class="rv-fiber"    id="rv-floss">—</td><td class="rv-starlink" id="rv-sloss">—</td></tr>
          <tr><td>bandwidth_mbps</td><td class="rv-fiber">940</td><td class="rv-starlink">220</td></tr>
          <tr><td>health_score</td>  <td class="rv-fiber"    id="rv-fh">—</td><td class="rv-starlink" id="rv-sh">—</td></tr>
          <tr class="raw-section"><td colspan="3">── LSTM OUTPUTS ──</td></tr>
          <tr><td>confidence_%</td>  <td class="rv-lstm" id="rv-conf" colspan="2">—</td></tr>
          <tr><td>alert_threshold</td><td class="rv-dim" colspan="2">85.000%</td></tr>
          <tr><td>switch_threshold</td><td class="rv-dim" colspan="2">92.000%</td></tr>
          <tr><td>horizon_sec</td>   <td class="rv-lstm" id="rv-hor" colspan="2">—</td></tr>
          <tr><td>alert_fired</td>   <td id="rv-alerted"  class="rv-dim" colspan="2">false</td></tr>
          <tr><td>switch_exec</td>   <td id="rv-switched" class="rv-dim" colspan="2">false</td></tr>
          <tr class="raw-section"><td colspan="3">── SYSTEM STATE ──</td></tr>
          <tr><td>phase</td>         <td class="rv-sys" id="rv-phase"   colspan="2">idle</td></tr>
          <tr><td>active_link</td>   <td class="rv-sys" id="rv-link"    colspan="2">fiber</td></tr>
          <tr><td>elapsed_s</td>     <td class="rv-sys" id="rv-elapsed" colspan="2">0.0</td></tr>
          <tr><td>deg_start_s</td>   <td class="rv-sys" id="rv-degstart" colspan="2">—</td></tr>
          <tr><td>alert_at_s</td>    <td class="rv-sys" id="rv-alertt"  colspan="2">—</td></tr>
          <tr><td>switch_at_s</td>   <td class="rv-sys" id="rv-switcht" colspan="2">—</td></tr>
          <tr><td>auto_deg_at_s</td> <td class="rv-dim" colspan="2">15.0</td></tr>
          <tr><td>countdown_s</td>   <td class="rv-sys" id="rv-cdwn"   colspan="2">15.0</td></tr>
          <tr><td>pkts_avoided</td>  <td class="rv-ok"  id="rv-pkts"   colspan="2">0</td></tr>
          <tr class="raw-section"><td colspan="3">── DEG PROFILE (live) ──</td></tr>
          <tr><td>lat_multiplier</td><td class="rv-fiber" id="rv-lm" colspan="2">1.000×</td></tr>
          <tr><td>jit_multiplier</td><td class="rv-fiber" id="rv-jm" colspan="2">1.000×</td></tr>
          <tr><td>loss_addend_%</td> <td class="rv-fiber" id="rv-la" colspan="2">0.0000</td></tr>
          <tr><td>would_buffer</td>  <td id="rv-wb" class="rv-dim" colspan="2">false</td></tr>
          <tr><td>voip_dropping</td> <td id="rv-vd" class="rv-dim" colspan="2">false</td></tr>
        </tbody>
      </table>`;
  }

  function update(snap) {
    const F  = snap.fiber;
    const S  = snap.starlink;
    const L  = snap.lstm;
    const PW = snap.pathwise;
    const DP = snap.deg_profile;
    const FL = snap.flags;

    const s = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
    const c = (id, cls) => { const e = document.getElementById(id); if (e) e.className = cls; };

    s('rv-flat',    F.lat.toFixed(4)    + 'ms');
    s('rv-slat',    S.lat.toFixed(4)    + 'ms');
    s('rv-fjit',    F.jit.toFixed(4)    + 'ms');
    s('rv-sjit',    S.jit.toFixed(4)    + 'ms');
    s('rv-floss',   F.loss.toFixed(5)   + '%');
    s('rv-sloss',   S.loss.toFixed(5)   + '%');
    s('rv-fh',      F.health.toFixed(3));
    s('rv-sh',      S.health.toFixed(3));
    s('rv-conf',   (L.conf * 100).toFixed(4) + '%');
    s('rv-hor',     L.hor > 0 ? L.hor + 's' : '—');
    s('rv-alerted', PW.alerted  ? 'TRUE' : 'false');
    c('rv-alerted', PW.alerted  ? 'rv-danger' : 'rv-dim');
    s('rv-switched', PW.switched ? 'TRUE' : 'false');
    c('rv-switched', PW.switched ? 'rv-ok' : 'rv-dim');
    s('rv-phase',   snap.phase);
    s('rv-link',    snap.active_link);
    s('rv-elapsed', snap.elapsed.toFixed(1) + 's');
    s('rv-degstart', PW.alert_t >= 0 ? snap.deg_start + 's' : '—');
    s('rv-alertt',  PW.alert_t  >= 0 ? PW.alert_t.toFixed(1) + 's' : '—');
    s('rv-switcht', PW.switch_t >= 0 ? PW.switch_t.toFixed(1) + 's' : '—');
    s('rv-cdwn',    snap.countdown > 0 ? snap.countdown.toFixed(1) + 's' : 'fired');
    s('rv-pkts',    PW.pkts_avoided > 0 ? PW.pkts_avoided.toLocaleString() : '0');
    s('rv-lm',      DP.lat_mult.toFixed(4) + '×');
    s('rv-jm',      DP.jit_mult.toFixed(4) + '×');
    s('rv-la',      DP.loss_add.toFixed(4));
    s('rv-wb',      FL.would_buffer  ? 'TRUE' : 'false');
    c('rv-wb',      FL.would_buffer  ? 'rv-danger' : 'rv-dim');
    s('rv-vd',      FL.voip_dropping ? 'TRUE' : 'false');
    c('rv-vd',      FL.voip_dropping ? 'rv-danger' : 'rv-dim');
  }

  function appendLog(entries) {
    const stream = document.getElementById('log-stream');
    if (!stream) return;
    entries.forEach(entry => {
      const p       = document.createElement('p');
      p.className   = 'll ' + entry.level;
      p.textContent = `[T+${String(Math.floor(entry.t / 60)).padStart(2,'0')}:${String(Math.floor(entry.t % 60)).padStart(2,'0')}] ${entry.msg}`;
      stream.appendChild(p);
    });
    while (stream.children.length > MAX_LOG) stream.removeChild(stream.firstChild);
    stream.scrollTop = stream.scrollHeight;
  }

  function clearLog() {
    const stream = document.getElementById('log-stream');
    if (stream) stream.innerHTML = '';
  }

  return { init, update, appendLog, clearLog };

})();
