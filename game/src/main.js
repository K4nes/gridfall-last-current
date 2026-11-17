import { Game } from "./game.js";

const nodes = {
  topbar: document.getElementById("topbar"),
  power: document.getElementById("power"),
  shop: document.getElementById("shop"),
  actions: document.getElementById("actions"),
  panel: document.getElementById("tower-panel"),
  overlay: document.getElementById("overlay"),
};

const game = new Game(document.getElementById("view"), nodes);
window.__gridfall = game;

const stage = document.getElementById("stage");

function layout() {
  const fit = Math.min(window.innerWidth / 640, window.innerHeight / 360);
  const s = Math.min(3, fit >= 2 ? Math.floor(fit) : Math.max(0.6, fit));
  stage.style.width = `${640 * s}px`;
  stage.style.height = `${360 * s}px`;
  const dpr = window.devicePixelRatio || 1;
  game.resize(640 * s * dpr, 360 * s * dpr);
}
window.addEventListener("resize", layout);
layout();

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  game.update(dt);
  game.render();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
