import { towerSprites } from "./towers.js";
import { enemySprites } from "./enemies.js";
import { TOWER_ORDER } from "./towers.js";

const CACHE = {};

export function towerIcon(key) {
  if (CACHE[key]) return CACHE[key];
  const s = towerSprites()[key].base;
  const c = document.createElement("canvas");
  c.width = 32;
  c.height = 32;
  c.getContext("2d").drawImage(s, 0, 0);
  CACHE[key] = c.toDataURL();
  return CACHE[key];
}

export function enemyIcon(key) {
  const id = "e:" + key;
  if (CACHE[id]) return CACHE[id];
  const s = enemySprites()[key][0];
  const c = document.createElement("canvas");
  c.width = s.width;
  c.height = s.height;
  c.getContext("2d").drawImage(s, 0, 0);
  CACHE[id] = c.toDataURL();
  return CACHE[id];
}

export function allTowerIcons() {
  const out = {};
  for (const k of TOWER_ORDER) out[k] = towerIcon(k);
  return out;
}
