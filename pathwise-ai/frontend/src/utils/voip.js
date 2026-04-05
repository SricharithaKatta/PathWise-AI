/**
 * utils/voip.js — PathWise AI
 * VoIP waveform animation — shows live/dropping state
 */

const VoIP = (() => {

  let bars   = [];
  let timer  = null;
  let active = false;

  function init() {
    const container = document.getElementById('voip');
    if (!container) return;
    container.innerHTML = '';
    bars = [];
    for (let i = 0; i < 22; i++) {
      const b       = document.createElement('div');
      b.className   = 'vbar live';
      b.style.height = '3px';
      container.appendChild(b);
      bars.push(b);
    }
    active = true;
  }

  function start(getState) {
    stop();
    timer = setInterval(() => {
      if (!active) return;
      const state = getState();
      const dropping = state.dropping;
      const color    = state.activeLink === 'starlink' ? 'var(--starlink)' : 'var(--fiber)';
      bars.forEach(b => {
        if (dropping) {
          b.className    = 'vbar drop';
          b.style.height = '2px';
        } else {
          b.className    = 'vbar live';
          b.style.height = (3 + Math.random() * 22) + 'px';
          b.style.background = color;
        }
      });
    }, 75);
  }

  function stop() {
    if (timer) { clearInterval(timer); timer = null; }
  }

  function destroy() {
    stop();
    active = false;
    bars   = [];
  }

  return { init, start, stop, destroy };

})();
