/**
 * components/LinkCards.js — PathWise AI
 * Updates the Fiber / Starlink WAN link card UI
 */

const LinkCards = (() => {

  function update(snap) {
    const F   = snap.fiber;
    const S   = snap.starlink;
    const active = snap.active_link;
    const { el, latColor, healthColor, setText, setStyle, setClass } = Helpers;

    // Fiber metrics
    setText('f-lat',  F.lat.toFixed(1));
    setText('f-loss', F.loss.toFixed(2));
    setText('f-jit',  F.jit.toFixed(2));
    setStyle('f-lat',  'color', latColor(F.lat, false));
    setStyle('f-loss', 'color', F.loss > 3 ? 'var(--danger)' : F.loss > 1 ? 'var(--warn)' : 'var(--fiber)');

    // Starlink metrics
    setText('s-lat',  S.lat.toFixed(1));
    setText('s-loss', S.loss.toFixed(2));
    setText('s-jit',  S.jit.toFixed(2));
    setStyle('s-lat', 'color', latColor(S.lat, true));

    // Health scores
    const fh = Math.min(100, Math.max(0, F.health));
    const sh = Math.min(100, Math.max(0, S.health));
    setText('hf', fh.toFixed(0));
    setText('hs2', sh.toFixed(0));
    setStyle('hf',  'color', healthColor(fh));
    setStyle('hfb', 'width', fh + '%');
    setStyle('hfb', 'background', healthColor(fh));
    setStyle('hsb', 'width', sh + '%');

    // Active link indicator
    const isStar = active === 'starlink';
    setClass('fc', isStar ? 'lcard dim'      : 'lcard f-active');
    setClass('sc', isStar ? 'lcard s-active' : 'lcard dim');

    const fb = el('fb'), sb = el('sb');
    if (isStar) {
      fb.textContent = 'DEGRADED';
      fb.className   = 'lbadge danger-badge';
      sb.textContent = 'ACTIVE';
      sb.className   = 'lbadge starlink-badge';
      setText('arrow', '←');
      setStyle('arrow', 'color', 'var(--starlink)');
    } else {
      fb.textContent = 'ACTIVE';
      fb.className   = 'lbadge fiber-badge';
      sb.textContent = 'STANDBY';
      sb.className   = 'lbadge starlink-badge';
      setText('arrow', '→');
      setStyle('arrow', 'color', 'var(--muted)');
    }

    // Stat grid
    setText('al', isStar ? 'Starlink' : 'Fiber FTTH');
    setStyle('al', 'color', isStar ? 'var(--starlink)' : 'var(--fiber)');
    setText('sw-cnt',   snap.pathwise.switched ? '1' : '0');
    setText('pkt-saved', snap.pathwise.pkts_avoided > 0 ? snap.pathwise.pkts_avoided.toLocaleString() : '0');
    setText('uptime',   '100.0%');
  }

  return { update };
})();


/**
 * components/Banner.js — PathWise AI
 * Phase status banner
 */

const Banner = (() => {

  function update(snap) {
    const { el, fmt } = Helpers;
    const b  = el('banner');
    const bi = el('ban-icon');
    const bt = el('ban-title');
    const bs = el('ban-sub');
    const F  = snap.fiber;
    const S  = snap.starlink;
    const L  = snap.lstm;
    const cd = snap.countdown;

    switch (snap.phase) {
      case 'stable':
        b.className  = 'banner ok';
        bi.textContent = '🟢';
        bt.textContent = `All Links Stable — Auto-degradation in ${Math.ceil(cd)}s`;
        bs.textContent = `LSTM: ${(L.conf * 100).toFixed(1)}% | Fiber: ${F.lat.toFixed(0)}ms | No anomalies`;
        break;
      case 'degrading':
        if (snap.pathwise.alerted) {
          b.className  = 'banner danger';
          bi.textContent = '🚨';
          bt.textContent = `PATHWISE ALERT — Brownout in ~${L.hor}s`;
          bs.textContent = `Conf: ${(L.conf*100).toFixed(1)}% | Loss: ${F.loss.toFixed(1)}% | Lat: ${F.lat.toFixed(0)}ms`;
        } else {
          b.className  = 'banner warn';
          bi.textContent = '⚠️';
          bt.textContent = 'Fiber Degrading — LSTM Building Confidence';
          bs.textContent = `Conf: ${(L.conf*100).toFixed(1)}% | Loss: ${F.loss.toFixed(1)}% | Lat: ${F.lat.toFixed(0)}ms`;
        }
        break;
      case 'switched':
        b.className  = 'banner success';
        bi.textContent = '✅';
        bt.textContent = 'Hitless Switch Complete — Traffic on Starlink';
        bs.textContent = `Fiber dead (loss: ${F.loss.toFixed(0)}%) | Starlink: ${S.health.toFixed(0)}% | 0 pkts dropped`;
        break;
    }
  }

  return { update };
})();


/**
 * components/Timeline.js — PathWise AI
 * Event timeline state machine
 */

const Timeline = (() => {

  let state = {};

  function reset() { state = {}; }

  function update(snap) {
    const { fmt } = Helpers;
    const PW = snap.pathwise;

    if (!state.t1) {
      state.t1 = true;
      _set('tl1', 'tt1', 0, 'done');
    }
    if (snap.phase === 'degrading' && !state.t2) {
      state.t2 = true;
      _set('tl2', 'tt2', snap.elapsed, 'on');
    }
    if (PW.alerted && !state.t3) {
      state.t3 = true;
      _set('tl2', 'tt2', snap.elapsed, 'done');
      _set('tl3', 'tt3', PW.alert_t, 'on');
      const ibn = document.getElementById('ibn-auto');
      if (ibn) {
        ibn.textContent = `⚡ FIRED [${fmt(PW.alert_t)}]: "Fiber critical — switch to Starlink"`;
        ibn.className   = 'ibn-item fired';
      }
    }
    if (PW.switched && !state.t4) {
      state.t4 = true;
      _set('tl3', 'tt3', PW.alert_t, 'done');
      _set('tl4', 'tt4', PW.switch_t, 'on');
      const ibn = document.getElementById('ibn-auto');
      if (ibn) {
        ibn.textContent = `✅ EXEC [${fmt(PW.switch_t)}]: "Starlink active — fiber isolated"`;
        ibn.className   = 'ibn-item exec';
      }
      setTimeout(() => {
        _set('tl4', 'tt4', PW.switch_t, 'done');
        _set('tl5', 'tt5', PW.switch_t + 1.5, 'done');
      }, 1800);
    }
  }

  function _set(rowId, timeId, t, cls) {
    const row = document.getElementById(rowId);
    const tim = document.getElementById(timeId);
    if (row) row.className = 'tl-row ' + cls;
    if (tim && t >= 0) tim.textContent = Helpers.fmt(t);
  }

  return { reset, update };
})();


/**
 * components/LSTM.js — PathWise AI
 * LSTM confidence bar + prediction table
 */

const LSTMPanel = (() => {

  function update(snap) {
    const L  = snap.lstm;
    const PW = snap.pathwise;
    const { el, setText } = Helpers;

    const cp = Math.min(100, L.conf * 100);
    setText('conf', cp.toFixed(1));
    const cfill = el('cfill');
    if (cfill) cfill.style.width = cp + '%';
    setText('phorizon', L.hor > 0 ? `${L.hor}s ahead` : 'nominal');

    if (L.alert || PW.alerted) {
      const row = el('alert-row');
      if (row) row.style.display = 'table-row';
    }
  }

  return { update };
})();
