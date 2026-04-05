/**
 * utils/chart.js — PathWise AI
 * Canvas-based real-time latency + packet loss chart
 */

const Chart = (() => {

  let canvas, ctx;
  const N = 44; // max data points shown

  function init() {
    canvas = document.getElementById('chart');
    ctx    = canvas.getContext('2d');
    resize();
  }

  function resize() {
    if (!canvas) return;
    const dpr     = window.devicePixelRatio || 1;
    canvas.width  = canvas.offsetWidth * dpr;
    canvas.height = 108 * dpr;
    ctx.scale(dpr, dpr);
  }

  function draw(fiberLat, starlinkLat, fiberLoss) {
    if (!ctx) return;
    const W = canvas.offsetWidth, H = 108;
    ctx.clearRect(0, 0, W, H);

    const fl = fiberLat.slice(-N);
    const sl = starlinkLat.slice(-N);
    const ll = fiberLoss.slice(-N);
    const all = [...fl, ...sl].filter(v => v > 0);
    if (all.length < 2) return;

    const maxV = Math.max(180, ...all) * 1.12;
    const toY  = v => H - 5 - (v / maxV) * (H - 15);
    const toX  = (i, len) => 4 + (i / Math.max(1, len - 1)) * (W - 8);

    // Grid lines
    ctx.strokeStyle = 'rgba(26,43,66,0.9)';
    ctx.lineWidth   = 1;
    [40, 80, 120, 160].forEach(v => {
      if (v > maxV) return;
      const y = toY(v);
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      ctx.fillStyle = 'rgba(78,104,128,0.4)';
      ctx.font = '7px Space Mono, monospace';
      ctx.fillText(v, 3, y - 2);
    });

    // Packet loss bars (fiber)
    ll.forEach((v, i) => {
      if (v < 0.8) return;
      const x  = toX(i, ll.length);
      const bh = Math.min((v / 32) * H, H - 8);
      ctx.fillStyle = `rgba(239,68,68,${Math.min(0.5, v / 20)})`;
      ctx.fillRect(x - 2, H - bh, 4, bh);
    });

    // Line helper
    function line(data, color, width) {
      if (data.length < 2) return;
      ctx.beginPath();
      ctx.strokeStyle  = color;
      ctx.lineWidth    = width;
      ctx.lineJoin     = 'round';
      ctx.globalAlpha  = 0.95;
      data.forEach((v, i) => {
        const x = toX(i, data.length), y = toY(v);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.stroke();
      // Fill gradient under line
      ctx.beginPath();
      data.forEach((v, i) => {
        const x = toX(i, data.length), y = toY(v);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.lineTo(toX(data.length - 1, data.length), H);
      ctx.lineTo(toX(0, data.length), H);
      ctx.closePath();
      const g = ctx.createLinearGradient(0, 0, 0, H);
      const c = color === '#00e5ff' ? 'rgba(0,229,255,' : 'rgba(168,85,247,';
      g.addColorStop(0, c + '0.10)');
      g.addColorStop(1, c + '0)');
      ctx.fillStyle   = g;
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    line(sl, '#a855f7', 1.8);
    line(fl, '#00e5ff', 2.4);

    // End-point dots
    [[fl, '#00e5ff'], [sl, '#a855f7']].forEach(([d, c]) => {
      if (!d.length) return;
      const x = toX(d.length - 1, d.length);
      const y = toY(d[d.length - 1]);
      ctx.beginPath();
      ctx.arc(x, y, 3.5, 0, Math.PI * 2);
      ctx.fillStyle   = c;
      ctx.fill();
      ctx.strokeStyle = 'rgba(5,8,16,0.8)';
      ctx.lineWidth   = 1.5;
      ctx.stroke();
    });
  }

  window.addEventListener('resize', () => { resize(); });

  return { init, resize, draw };

})();
