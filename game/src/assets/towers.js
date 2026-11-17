import { P } from "./palette.js";
import { sprite, rect, pxline } from "../rendering/pixel-canvas.js";

export const TOWERS = {
  pulse: {
    name: "PULSE TURRET", short: "PULSE", cost: 50, draw: 10, range: 60,
    damage: 18, rate: 2.4, upgradeCost: [40, 60], color: P.cyan, role: "fast single target",
  },
  arc: {
    name: "ARC CANNON", short: "ARC", cost: 100, draw: 20, range: 80,
    damage: 30, rate: 0.7, upgradeCost: [80, 120], color: P.amber, role: "chains 3 targets",
    chain: 48, chainCount: 3,
  },
  cryo: {
    name: "CRYO TOWER", short: "CRYO", cost: 80, draw: 15, range: 65,
    damage: 6, rate: 0.9, upgradeCost: [64, 96], color: "#8fd3ff", role: "slows 40%",
    slow: 2.5,
  },
  tesla: {
    name: "TESLA RELAY", short: "TESLA", cost: 120, draw: 25, range: 55,
    damage: 0, rate: 0, upgradeCost: [96, 144], color: P.purple, role: "+25% rate nearby",
    buff: 0.25,
  },
};

export const TOWER_ORDER = ["pulse", "arc", "cryo", "tesla"];

function platform(ctx, color) {
  rect(ctx, 3, 5, 26, 24, "#28343c");
  rect(ctx, 3, 5, 26, 2, color);
  rect(ctx, 3, 27, 26, 2, "#141c22");
  rect(ctx, 4, 6, 2, 2, "#7d8f9c");
  rect(ctx, 26, 6, 2, 2, "#7d8f9c");
  rect(ctx, 4, 24, 2, 2, "#7d8f9c");
  rect(ctx, 26, 24, 2, 2, "#7d8f9c");
  rect(ctx, 13, 28, 6, 2, "#0a0e11");
  rect(ctx, 12, 12, 8, 1, "#1c262d");
  rect(ctx, 4, 8, 2, 1, color);
  rect(ctx, 26, 8, 2, 1, color);
}

function pulseBody(ctx) {
  rect(ctx, 10, 13, 12, 10, "#4a5a66");
  rect(ctx, 10, 13, 12, 2, "#7d8f9c");
  rect(ctx, 10, 21, 12, 2, "#2a343c");
  rect(ctx, 13, 10, 6, 4, "#2a7d7d");
  rect(ctx, 14, 11, 4, 2, "#5fe3e0");
}

function arcBody(ctx) {
  rect(ctx, 16, 9, 2, 4, "#5a6a76");
  ctx.strokeStyle = "#ffb15c";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(16, 17, 8, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = "#a8742f";
  ctx.beginPath();
  ctx.arc(16, 17, 5, 0, Math.PI * 2);
  ctx.stroke();
  rect(ctx, 15, 16, 2, 2, "#ffe0ae");
  rect(ctx, 8, 16, 3, 2, "#7d8f9c");
  rect(ctx, 21, 16, 3, 2, "#7d8f9c");
}

function cryoBody(ctx) {
  rect(ctx, 11, 10, 10, 14, "#4a5a66");
  rect(ctx, 11, 10, 10, 2, "#7d8f9c");
  rect(ctx, 13, 13, 6, 8, "#1d4a5c");
  rect(ctx, 14, 14, 4, 6, "#8fd3ff");
  rect(ctx, 15, 15, 2, 4, "#ffffff");
  rect(ctx, 9, 12, 2, 8, "#2a343c");
  rect(ctx, 21, 12, 2, 8, "#2a343c");
}

function teslaBody(ctx) {
  rect(ctx, 14, 20, 4, 6, "#4a5a66");
  rect(ctx, 13, 17, 6, 4, "#7d8f9c");
  rect(ctx, 12, 8, 8, 9, "#4a3060");
  rect(ctx, 13, 9, 6, 7, "#7a55a0");
  rect(ctx, 15, 10, 2, 5, "#e3c2ff");
  rect(ctx, 10, 11, 2, 3, "#c792ea");
  rect(ctx, 20, 11, 2, 3, "#c792ea");
}

const BODIES = { pulse: pulseBody, arc: arcBody, cryo: cryoBody, tesla: teslaBody };

let CACHE = null;
export function towerSprites() {
  if (CACHE) return CACHE;
  CACHE = {};
  for (const key of TOWER_ORDER) {
    const base = sprite(32, 32, (ctx) => {
      platform(ctx, TOWERS[key].color);
      BODIES[key](ctx);
    });
    const barrels = [];
    if (key === "pulse" || key === "arc") {
      for (let d = 0; d < 8; d++) {
        const a = (d / 8) * Math.PI * 2;
        barrels.push(sprite(32, 32, (ctx) => {
          const cx = 16;
          const cy = key === "pulse" ? 14 : 17;
          const ex = cx + Math.cos(a) * 11;
          const ey = cy + Math.sin(a) * 11;
          pxline(ctx, cx, cy, ex, ey, P.steelHi, 3);
          pxline(ctx, cx, cy, ex, ey, P.steel, 1);
          rect(ctx, Math.round(ex) - 1, Math.round(ey) - 1, 3, 3, key === "pulse" ? P.cyan : P.amber);
        }));
      }
    }
    CACHE[key] = { base, barrels };
  }
  return CACHE;
}
