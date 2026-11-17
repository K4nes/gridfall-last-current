import { P } from "./palette.js";
import { sprite, rect } from "../rendering/pixel-canvas.js";

export const ENEMIES = {
  scout: { hp: 40, speed: 52.5, bounty: 8, damage: 1, radius: 10, size: 20, name: "SCOUT", color: "#9ad0ff" },
  heavy: { hp: 125, speed: 42.5, bounty: 16, damage: 2, radius: 12, size: 24, name: "HEAVY", color: "#ff9d7a", armor: 0.1 },
  emp: { hp: 80, speed: 50, bounty: 14, damage: 1, radius: 10, size: 20, name: "EMP", color: P.purple, empRadius: 48, empTime: 2.5 },
  swarm: { hp: 18, speed: 65, bounty: 4, damage: 1, radius: 7, size: 15, name: "SWARM", color: "#ffd166" },
  shield: { hp: 150, speed: 40, bounty: 20, damage: 2, radius: 12, size: 24, name: "SHIELD", color: P.green, aura: 48, shield: 70 },
  overlord: { hp: 1150, speed: 27.5, bounty: 140, damage: 4, radius: 24, size: 48, name: "OVERLORD", color: "#ff6b6b", armor: 0.25 },
};

function scout(ctx, frame) {
  const b = frame ? 1 : 0;
  rect(ctx, 4, 8 + b, 12, 6, "#6d8399");
  rect(ctx, 4, 8 + b, 12, 1, "#9fb4c2");
  rect(ctx, 4, 13 + b, 12, 1, "#2a3b46");
  rect(ctx, 2, 7 + b, 2, 2, "#7d8f9c");
  rect(ctx, 16, 7 + b, 2, 2, "#7d8f9c");
  rect(ctx, 2, 13 + b, 2, 2, "#7d8f9c");
  rect(ctx, 16, 13 + b, 2, 2, "#7d8f9c");
  rect(ctx, 9, 4 + b, 2, 4, "#4a5a66");
  rect(ctx, 13, 10 + b, 4, 4, "#ff5a3c");
  rect(ctx, 14, 11 + b, 2, 2, "#ffd0c4");
}

function heavy(ctx, frame) {
  const b = frame ? 1 : 0;
  rect(ctx, 4, 5 + b, 16, 13, "#8a5f45");
  rect(ctx, 4, 5 + b, 16, 2, "#c08a5f");
  rect(ctx, 4, 16 + b, 16, 2, "#3a261c");
  rect(ctx, 7, 8 + b, 10, 7, "#4a3226");
  rect(ctx, 8, 9 + b, 8, 2, "#d8a072");
  rect(ctx, 14, 12 + b, 4, 3, "#ffb15c");
  rect(ctx, 2, 6 + b, 2, 11, "#3a4a56");
  rect(ctx, 20, 6 + b, 2, 11, "#3a4a56");
}

function emp(ctx, frame) {
  const b = frame ? 1 : 0;
  ctx.fillStyle = "#3a2a4a";
  ctx.beginPath();
  ctx.arc(10, 10 + b, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = P.purple;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(10, 10 + b, 7, 0, Math.PI * 2);
  ctx.stroke();
  rect(ctx, 9, 6 + b, 2, 2, "#e3c2ff");
  rect(ctx, 9, 12 + b, 2, 2, "#e3c2ff");
  rect(ctx, 5, 9 + b, 2, 2, P.purple);
  rect(ctx, 13, 9 + b, 2, 2, P.purple);
}

function swarm(ctx, frame) {
  const b = frame ? 1 : 0;
  rect(ctx, 2, 7 + b, 11, 1, "#6b5316");
  rect(ctx, 7, 2 + b, 1, 11, "#6b5316");
  rect(ctx, 4, 4 + b, 7, 7, "#c79a2a");
  rect(ctx, 5, 5 + b, 5, 5, "#8a6a1c");
  rect(ctx, 6, 6 + b, 3, 3, "#ffe9a8");
  rect(ctx, 1, 1 + b, 2, 2, "#7d8f9c");
  rect(ctx, 12, 12 + b, 2, 2, "#7d8f9c");
  rect(ctx, 1, 12 + b, 2, 2, "#7d8f9c");
  rect(ctx, 12, 1 + b, 2, 2, "#7d8f9c");
}

function shield(ctx, frame) {
  const b = frame ? 1 : 0;
  ctx.fillStyle = "#2c4a33";
  ctx.beginPath();
  ctx.moveTo(12, 3 + b);
  ctx.lineTo(20, 7 + b);
  ctx.lineTo(20, 15 + b);
  ctx.lineTo(12, 19 + b);
  ctx.lineTo(4, 15 + b);
  ctx.lineTo(4, 7 + b);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#8df29a";
  ctx.lineWidth = 1;
  ctx.stroke();
  rect(ctx, 10, 9 + b, 4, 5, "#3f6b4a");
  rect(ctx, 11, 10 + b, 2, 2, "#b9ffbf");
}

function overlord(ctx, frame) {
  const b = frame ? 1 : 0;
  rect(ctx, 8, 12 + b, 32, 20, "#5a3a3a");
  rect(ctx, 8, 12 + b, 32, 3, "#8a5a5a");
  rect(ctx, 8, 29 + b, 32, 3, "#1a1010");
  rect(ctx, 12, 17 + b, 24, 9, "#1a1212");
  rect(ctx, 18, 19 + b, 12, 5, "#5a201a");
  rect(ctx, 22, 20 + b, 4, 3, "#ff6b6b");
  rect(ctx, 4, 16 + b, 4, 12, "#4a5560");
  rect(ctx, 40, 16 + b, 4, 12, "#4a5560");
  rect(ctx, 2, 18 + b, 2, 8, "#6d8399");
  rect(ctx, 44, 18 + b, 2, 8, "#6d8399");
  rect(ctx, 14, 8 + b, 20, 4, "#4a3a3a");
  rect(ctx, 20, 6 + b, 8, 3, "#7a5a5a");
}

const DRAW = { scout, heavy, emp, swarm, shield, overlord };
const FRAMES = { scout: 2, heavy: 2, emp: 2, swarm: 2, shield: 2, overlord: 2 };

let CACHE = null;
export function enemySprites() {
  if (CACHE) return CACHE;
  CACHE = {};
  for (const key of Object.keys(ENEMIES)) {
    const def = ENEMIES[key];
    CACHE[key] = [];
    for (let f = 0; f < FRAMES[key]; f++) {
      CACHE[key].push(sprite(def.size, def.size, (ctx) => DRAW[key](ctx, f)));
    }
  }
  return CACHE;
}
