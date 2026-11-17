import { P } from "./palette.js";
import { sprite, rect, makeCanvas, VIEW_W, VIEW_H } from "../rendering/pixel-canvas.js";

export const PATH = [
  [-15, 70], [100, 70], [100, 235], [235, 235], [235, 95],
  [355, 95], [355, 215], [480, 215], [480, 150], [550, 150],
];

export const PADS = [
  { x: 70, y: 135 }, { x: 165, y: 75 }, { x: 165, y: 190 }, { x: 200, y: 270 },
  { x: 300, y: 165 }, { x: 310, y: 55 }, { x: 395, y: 150 }, { x: 515, y: 200 },
  { x: 165, y: 120 }, { x: 430, y: 110 }, { x: 450, y: 270 },
];

export const CORE = { x: 550, y: 150 };

export function buildPath() {
  const segs = [];
  let total = 0;
  for (let i = 0; i < PATH.length - 1; i++) {
    const [ax, ay] = PATH[i];
    const [bx, by] = PATH[i + 1];
    const len = Math.hypot(bx - ax, by - ay);
    segs.push({ ax, ay, bx, by, len, start: total });
    total += len;
  }
  return {
    total,
    at(d) {
      const dist = Math.max(0, Math.min(total, d));
      for (const s of segs) {
        if (dist <= s.start + s.len) {
          const t = s.len === 0 ? 0 : (dist - s.start) / s.len;
          return { x: s.ax + (s.bx - s.ax) * t, y: s.ay + (s.by - s.ay) * t };
        }
      }
      const [x, y] = PATH[PATH.length - 1];
      return { x, y };
    },
  };
}

let BG = null;

export function padSprite() {
  return sprite(20, 20, (ctx) => {
    rect(ctx, 1, 1, 18, 18, P.steelLo);
    rect(ctx, 1, 1, 18, 1, P.steel);
    rect(ctx, 1, 18, 18, 1, P.joint);
    rect(ctx, 2, 2, 2, 2, P.steelHi);
    rect(ctx, 16, 2, 2, 2, P.steelHi);
    rect(ctx, 2, 16, 2, 2, P.steelHi);
    rect(ctx, 16, 16, 2, 2, P.steelHi);
    rect(ctx, 6, 9, 8, 2, P.cyanDark);
    rect(ctx, 9, 6, 2, 8, P.cyanDark);
  });
}

export function buildBackground() {
  if (BG) return BG;
  const c = makeCanvas(VIEW_W, VIEW_H);
  const ctx = c.getContext("2d");

  rect(ctx, 0, 0, VIEW_W, VIEW_H, P.concrete);
  for (let i = 0; i < 520; i++) {
    const x = Math.floor(Math.random() * VIEW_W);
    const y = Math.floor(Math.random() * VIEW_H);
    rect(ctx, x, y, 1, 1, Math.random() > 0.5 ? "#182027" : "#10161b");
  }
  ctx.strokeStyle = "#1b242b";
  ctx.lineWidth = 1;
  for (let x = 0; x <= VIEW_W; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, VIEW_H);
    ctx.stroke();
  }
  for (let y = 0; y <= VIEW_H; y += 32) {
    ctx.beginPath();
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(VIEW_W, y + 0.5);
    ctx.stroke();
  }

  ctx.lineJoin = "miter";
  ctx.lineCap = "butt";
  const trace = () => {
    ctx.beginPath();
    PATH.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  };

  trace();
  ctx.strokeStyle = P.trenchEdge;
  ctx.lineWidth = 26;
  ctx.stroke();
  trace();
  ctx.strokeStyle = P.trench;
  ctx.lineWidth = 20;
  ctx.stroke();
  trace();
  ctx.strokeStyle = "#0d1216";
  ctx.lineWidth = 14;
  ctx.stroke();
  trace();
  ctx.strokeStyle = P.cable;
  ctx.lineWidth = 1;
  ctx.stroke();

  const [sx, sy] = PATH[0];
  for (let i = 0; i < 5; i++) {
    rect(ctx, sx - 10 + i * 4, sy - 16, 2, 12, i % 2 ? P.hazard : P.steelLo);
    rect(ctx, sx - 10 + i * 4, sy + 4, 2, 12, i % 2 ? P.hazard : P.steelLo);
  }

  ctx.beginPath();
  ctx.arc(CORE.x, CORE.y, 26, 0, Math.PI * 2);
  ctx.fillStyle = "#10171c";
  ctx.fill();
  ctx.strokeStyle = P.steel;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(CORE.x, CORE.y, 20, 0, Math.PI * 2);
  ctx.strokeStyle = P.joint;
  ctx.stroke();

  const pad = padSprite();
  for (const p of PADS) ctx.drawImage(pad, Math.round(p.x - 10), Math.round(p.y - 10));

  for (const [x, y, w, h] of [[424, 34, 72, 30], [180, 34, 44, 24], [596, 250, 36, 44], [30, 150, 26, 44]]) {
    rect(ctx, x, y, w, h, "#1a232a");
    rect(ctx, x, y, w, 2, "#2f3d47");
    rect(ctx, x + 2, y + 4, w - 4, h - 8, "#141c22");
    for (let i = x + 5; i < x + w - 4; i += 9) rect(ctx, i, y + 6, 3, 3, "#243039");
    for (let i = x + 5; i < x + w - 4; i += 9) rect(ctx, i, y + 12, 3, 3, "#243039");
    rect(ctx, x + w - 6, y + h - 6, 3, 3, "#5fe3e0");
  }

  rect(ctx, 0, 300, 190, 3, "#1d262d");
  rect(ctx, 430, 300, 210, 3, "#1d262d");
  for (let i = 12; i < 190; i += 22) rect(ctx, i, 298, 2, 7, "#2f3d47");
  for (let i = 442; i < 640; i += 22) rect(ctx, i, 298, 2, 7, "#2f3d47");

  rect(ctx, 250, 286, 28, 16, "#121a20");
  for (let i = 0; i < 5; i++) rect(ctx, 252 + i * 5, 288, 2, 12, "#2a3742");
  rect(ctx, 430, 42, 28, 16, "#121a20");
  for (let i = 0; i < 5; i++) rect(ctx, 432 + i * 5, 44, 2, 12, "#2a3742");

  rect(ctx, 300, 30, 4, 10, "#2f3d47");
  rect(ctx, 604, 56, 4, 10, "#2f3d47");

  ctx.fillStyle = "#4a3a12";
  for (let i = 0; i < 6; i++) rect(ctx, 498 + i * 9, 196, 5, 3, i % 2 ? "#6b5316" : "#4a3a12");
  for (let i = 0; i < 6; i++) rect(ctx, 498 + i * 9, 240, 5, 3, i % 2 ? "#6b5316" : "#4a3a12");

  const grd = ctx.createRadialGradient(VIEW_W / 2, VIEW_H / 2, 150, VIEW_W / 2, VIEW_H / 2, 380);
  grd.addColorStop(0, "rgba(0,0,0,0)");
  grd.addColorStop(1, "rgba(0,0,0,0.55)");
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  BG = c;
  return BG;
}

export const AMBIENT = {
  fans: [{ x: 36, y: 290, r: 9 }, { x: 264, y: 292, r: 7 }],
  lamps: [{ x: 302, y: 34, phase: 0 }, { x: 606, y: 60, phase: 1.7 }],
  sparks: [
    { x: 250, y: 60, phase: 0 },
    { x: 452, y: 46, phase: 0.35 },
    { x: 604, y: 128, phase: 0.55 },
    { x: 60, y: 246, phase: 0.8 },
    { x: 330, y: 268, phase: 1.1 },
  ],
};
