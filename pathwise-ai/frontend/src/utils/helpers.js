/**
 * utils/helpers.js — PathWise AI
 * Shared utility functions used across components
 */

const Helpers = (() => {

  /** Format elapsed seconds as T+MM:SS */
  function fmt(s) {
    const m   = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `T+${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  }

  /** Color based on health score */
  function healthColor(h) {
    return h >= 80 ? 'var(--ok)' : h >= 45 ? 'var(--warn)' : 'var(--danger)';
  }

  /** Color based on latency (different thresholds for fiber vs starlink) */
  function latColor(v, isStar) {
    const good = isStar ? 60  : 20;
    const bad  = isStar ? 160 : 80;
    if (v <= good) return isStar ? 'var(--starlink)' : 'var(--fiber)';
    if (v <= bad)  return 'var(--warn)';
    return 'var(--danger)';
  }

  /** Get DOM element by id */
  function el(id) {
    return document.getElementById(id);
  }

  /** Set element text content safely */
  function setText(id, val) {
    const e = el(id);
    if (e) e.textContent = val;
  }

  /** Set element style property */
  function setStyle(id, prop, val) {
    const e = el(id);
    if (e) e.style[prop] = val;
  }

  /** Set element class */
  function setClass(id, cls) {
    const e = el(id);
    if (e) e.className = cls;
  }

  return { fmt, healthColor, latColor, el, setText, setStyle, setClass };

})();
