/**
 * components/Timeline.js — PathWise AI
 * Event timeline state machine
 */

const Timeline = (() => {

  let state = {};

  function reset() {
    state = {};
    ['tl2','tl3','tl4','tl5'].forEach(id => {
      const e = document.getElementById(id);
      if (e) e.className = 'tl-row';
    });
    const t1 = document.getElementById('tl1');
    if (t1) t1.className = 'tl-row on';
    ['tt2','tt3','tt4','tt5'].forEach(id => {
      const e = document.getElementById(id);
      if (e) e.textContent = '—';
    });
    const ibn = document.getElementById('ibn-auto');
    if (ibn) {
      ibn.textContent = '"Auto: switch if LSTM confidence > 92%"';
      ibn.className   = 'ibn-item';
    }
  }

  function update(snap) {
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
        ibn.textContent = `⚡ FIRED [${Helpers.fmt(PW.alert_t)}]: "Fiber critical — switch to Starlink"`;
        ibn.className   = 'ibn-item fired';
      }
    }
    if (PW.switched && !state.t4) {
      state.t4 = true;
      _set('tl3', 'tt3', PW.alert_t, 'done');
      _set('tl4', 'tt4', PW.switch_t, 'on');
      const ibn = document.getElementById('ibn-auto');
      if (ibn) {
        ibn.textContent = `✅ EXEC [${Helpers.fmt(PW.switch_t)}]: "Starlink active — fiber isolated"`;
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
