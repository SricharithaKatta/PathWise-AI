/**
 * components/LSTM.js — PathWise AI
 * LSTM confidence bar + prediction table updater
 */

const LSTMPanel = (() => {

  function update(snap) {
    const L  = snap.lstm;
    const PW = snap.pathwise;

    const cp    = Math.min(100, L.conf * 100);
    const conf  = document.getElementById('conf');
    const cfill = document.getElementById('cfill');
    const horiz = document.getElementById('phorizon');
    const arow  = document.getElementById('alert-row');

    if (conf)  conf.textContent  = cp.toFixed(1);
    if (cfill) cfill.style.width = cp + '%';
    if (horiz) horiz.textContent = L.hor > 0 ? `${L.hor}s ahead` : 'nominal';
    if (arow && (L.alert || PW.alerted)) arow.style.display = 'table-row';
  }

  function reset() {
    const conf  = document.getElementById('conf');
    const cfill = document.getElementById('cfill');
    const horiz = document.getElementById('phorizon');
    const arow  = document.getElementById('alert-row');
    if (conf)  conf.textContent   = '0.0';
    if (cfill) cfill.style.width  = '0%';
    if (horiz) horiz.textContent  = '—';
    if (arow)  arow.style.display = 'none';
  }

  return { update, reset };
})();
