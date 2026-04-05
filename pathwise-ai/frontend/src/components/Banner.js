/**
 * components/Banner.js — PathWise AI
 * Phase status banner updater
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
        b.className    = 'banner ok';
        bi.textContent = '🟢';
        bt.textContent = `All Links Stable — Auto-degradation in ${Math.ceil(cd)}s`;
        bs.textContent = `LSTM: ${(L.conf * 100).toFixed(1)}% | Fiber: ${F.lat.toFixed(0)}ms | No anomalies`;
        break;
      case 'degrading':
        if (snap.pathwise.alerted) {
          b.className    = 'banner danger';
          bi.textContent = '🚨';
          bt.textContent = `PATHWISE ALERT — Brownout in ~${L.hor}s`;
          bs.textContent = `Conf: ${(L.conf*100).toFixed(1)}% | Loss: ${F.loss.toFixed(1)}% | Lat: ${F.lat.toFixed(0)}ms`;
        } else {
          b.className    = 'banner warn';
          bi.textContent = '⚠️';
          bt.textContent = 'Fiber Degrading — LSTM Building Confidence';
          bs.textContent = `Conf: ${(L.conf*100).toFixed(1)}% | Loss: ${F.loss.toFixed(1)}% | Lat: ${F.lat.toFixed(0)}ms`;
        }
        break;
      case 'switched':
        b.className    = 'banner success';
        bi.textContent = '✅';
        bt.textContent = 'Hitless Switch Complete — Traffic on Starlink';
        bs.textContent = `Fiber dead (loss: ${F.loss.toFixed(0)}%) | Starlink: ${S.health.toFixed(0)}% | 0 pkts dropped`;
        break;
    }
  }

  return { update };
})();
