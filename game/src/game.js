import { PADS, CORE, buildPath } from "./assets/environment.js";
import { TOWERS } from "./assets/towers.js";
import { Particles } from "./assets/particles.js";
import { PowerGrid } from "./systems/power-grid.js";
import { WaveRunner, WAVES } from "./systems/waves.js";
import { Economy } from "./systems/economy.js";
import { Combat, Tower, Enemy } from "./systems/combat.js";
import { Sfx } from "./systems/audio.js";
import { Camera } from "./rendering/camera.js";
import { Renderer } from "./rendering/renderer.js";
import { PixelCanvas, VIEW_W, VIEW_H } from "./rendering/pixel-canvas.js";
import { Hud } from "./ui/hud.js";
import { TowerShop, TowerPanel } from "./ui/tower-shop.js";
import { Menus } from "./ui/menus.js";
import { P } from "./assets/palette.js";

export class Game {
  constructor(canvas, nodes) {
    this.pixel = new PixelCanvas(canvas);
    this.canvas = canvas;
    this.camera = new Camera();
    this.renderer = new Renderer(this.pixel.ctx, this.camera);
    this.path = buildPath();
    this.sfx = new Sfx();
    this.time = 0;
    this.hoverPad = -1;
    this.state = "menu";
    this.reset();
    this.hud = new Hud(nodes, this);
    this.shop = new TowerShop(nodes.shop, this);
    this.panel = new TowerPanel(nodes.panel, this);
    this.menus = new Menus(nodes.overlay, this);
    this.bindInput();
  }

  reset() {
    this.economy = new Economy();
    this.core = 10;
    this.coreMax = 10;
    this.towers = [];
    this.enemies = [];
    this.grid = new PowerGrid();
    this.runner = new WaveRunner();
    this.combat = new Combat();
    this.particles = new Particles();
    this.floats = [];
    this.banners = [];
    this.waveIndex = 0;
    this.selectedBuild = null;
    this.selectedTower = null;
    this.paused = false;
    this.speed = 1;
    this.waveFlash = 0;
    this.elapsed = 0;
    this.finalScore = null;
  }

  get credits() {
    return this.economy.credits;
  }
  get waveLabel() {
    return WAVES[Math.min(this.waveIndex, WAVES.length - 1)];
  }
  get canStartWave() {
    return this.state === "play" && !this.paused && !this.runner.running && this.waveIndex < WAVES.length;
  }
  drawPower() {
    return this.grid.draw(this.towers);
  }
  loadPct() {
    return this.grid.load(this.towers);
  }
  activeTowers() {
    return this.towers.filter((t) => t.active).length;
  }
  remainingEnemies() {
    return this.enemies.length + this.runner.remaining;
  }

  startRun() {
    this.reset();
    this.state = "brief";
    this.sfx.init();
  }
  deploy() {
    this.state = "play";
    this.banner("SURGE 1 READY · BUILD, THEN PRESS SPACE", P.cyan, 3.2);
  }
  retry() {
    this.reset();
    this.state = "brief";
  }
  toMenu() {
    this.reset();
    this.state = "menu";
  }
  togglePause() {
    if (this.state === "play") {
      this.state = "pause";
      this.paused = true;
    } else if (this.state === "pause") {
      this.state = "play";
      this.paused = false;
    }
  }
  toggleMute() {
    this.sfx.init();
    return this.sfx.toggle();
  }
  toggleSpeed() {
    this.speed = this.speed === 2 ? 1 : 2;
    this.sfx.play("click");
  }

  startWave() {
    if (!this.canStartWave) return;
    this.runner.start(this.waveIndex);
    this.waveFlash = 0.5;
    const w = WAVES[this.waveIndex];
    this.banner(`SURGE ${this.waveIndex + 1} · ${w.label}`, w.boss ? P.red : P.amber, 2.2);
    this.sfx.play("wave");
    if (w.boss) this.camera.shake = Math.max(this.camera.shake, 5);
  }

  spawnEnemy(type, progress = 0) {
    const e = new Enemy(type, 1 + this.waveIndex * 0.08);
    e.progress = progress;
    const p = this.path.at(progress);
    e.x = p.x;
    e.y = p.y;
    this.enemies.push(e);
  }

  onKill(enemy) {
    this.economy.onKill(enemy);
    this.combat.impact(enemy.x, enemy.y, enemy.def.color);
    this.particles.burst(enemy.x, enemy.y, enemy.def.color, 10, 45);
    this.float(enemy.x, enemy.y - enemy.def.size / 2, `+${enemy.def.bounty}`, P.hazard);
    this.sfx.play("kill");
  }

  coreHit(enemy) {
    this.core -= enemy.def.damage;
    this.camera.shake = Math.max(this.camera.shake, 8);
    this.banner(`CORE HIT · -${enemy.def.damage}`, P.red, 1.2);
    this.particles.burst(CORE.x, CORE.y, P.red, 14, 55);
    this.sfx.play("leak");
    if (this.core <= 0) {
      this.core = 0;
      this.finish(false);
    }
  }

  onWaveCleared() {
    if (this.state !== "play") return;
    this.economy.onWaveCleared();
    this.waveFlash = 0.6;
    this.waveIndex += 1;
    if (this.waveIndex >= WAVES.length) {
      this.finish(true);
      return;
    }
    this.banner(`SURGE CLEARED · +60 CR`, P.green, 2.2);
    this.sfx.play("wave");
  }

  finish(win) {
    if (this.state === "win" || this.state === "lose") return;
    this.state = win ? "win" : "lose";
    this.banners = [];
    this.floats = [];
    this.finalScore = this.economy.finalScore(win, this.core);
    this.sfx.play(win ? "win" : "lose");
  }

  stars() {
    if (this.state !== "win") return 0;
    if (this.core >= 8 && this.grid.trips === 0) return 3;
    if (this.core >= 5) return 2;
    return 1;
  }
  timeString() {
    const s = Math.floor(this.elapsed);
    return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  }

  float(x, y, text, color) {
    if (this.floats.length >= 60) this.floats.shift();
    this.floats.push({ x, y, text, color, t: 0, life: 1.1 });
  }
  banner(text, color, life = 2) {
    if (this.banners.length >= 4) this.banners.shift();
    this.banners.push({ text, color, t: 0, life });
  }

  padAt(x, y) {
    for (let i = 0; i < PADS.length; i++) {
      if (Math.hypot(PADS[i].x - x, PADS[i].y - y) <= 14) return i;
    }
    return -1;
  }
  towerAt(x, y) {
    for (const t of this.towers) {
      if (Math.hypot(t.x - x, t.y - y) <= 14) return t;
    }
    return null;
  }

  selectBuild(key) {
    if (this.state !== "play") return;
    this.selectedBuild = key;
    this.selectedTower = null;
    this.sfx.play("click");
  }
  clearSelection() {
    this.selectedBuild = null;
    this.selectedTower = null;
  }

  placeAt(index) {
    if (this.state !== "play" || !this.selectedBuild) return false;
    const pad = PADS[index];
    if (!pad) return false;
    if (this.towers.some((t) => t.pad === pad)) return false;
    const def = TOWERS[this.selectedBuild];
    if (!this.economy.spend(def.cost)) {
      this.float(pad.x, pad.y - 16, "NOT ENOUGH CR", P.red);
      this.sfx.play("warn");
      return false;
    }
    const t = new Tower(this.selectedBuild, pad);
    this.towers.push(t);
    this.economy.built += 1;
    this.selectedTower = t;
    this.particles.burst(pad.x, pad.y, def.color, 8, 30);
    this.combat.impact(pad.x, pad.y, def.color);
    this.sfx.play("place");
    return true;
  }

  upgradeSelected() {
    const t = this.selectedTower;
    if (!t || this.state !== "play") return;
    const cost = t.upgradeCost();
    if (cost === null) return;
    if (!this.economy.spend(cost)) {
      this.float(t.x, t.y - 18, "NOT ENOUGH CR", P.red);
      this.sfx.play("warn");
      return;
    }
    t.level += 1;
    this.particles.burst(t.x, t.y, P.hazard, 10, 35);
    this.combat.impact(t.x, t.y, P.hazard);
    this.float(t.x, t.y - 18, `LEVEL ${t.level}`, P.hazard);
    this.sfx.play("place");
  }

  sellSelected() {
    const t = this.selectedTower;
    if (!t) return;
    this.economy.refund(t.refund());
    this.towers = this.towers.filter((x) => x !== t);
    this.float(t.x, t.y - 16, `+${t.refund()}`, P.hazard);
    this.sfx.play("click");
    this.selectedTower = null;
  }

  toggleSelected() {
    const t = this.selectedTower;
    if (!t) return;
    t.active = !t.active;
    this.float(t.x, t.y - 16, t.active ? "ONLINE" : "SHUT DOWN", t.active ? P.cyan : P.dim);
    this.sfx.play("click");
  }

  update(dt) {
    const steps = this.state === "play" && !this.paused ? this.speed : 1;
    for (let i = 0; i < steps; i++) this.tick(dt);
  }

  tick(dt) {
    this.time += dt;
    this.camera.update(dt);
    this.updateEffects(dt);
    if (this.state !== "play" || this.paused) return;
    this.elapsed += dt;
    this.grid.update(dt, this.towers, this);
    for (const t of this.towers) t.update(dt, this);
    for (const e of this.enemies) e.update(dt, this.path, this);
    this.enemies = this.enemies.filter((e) => !e.dead);
    this.combat.update(dt, this);
    this.particles.update(dt);
    this.runner.update(dt, this);
  }

  updateEffects(dt) {
    this.waveFlash = Math.max(0, this.waveFlash - dt);
    for (const f of this.floats) {
      f.t += dt;
      f.y -= dt * 14;
    }
    this.floats = this.floats.filter((f) => f.t < f.life);
    for (const b of this.banners) b.t += dt;
    this.banners = this.banners.filter((b) => b.t < b.life);
  }

  render() {
    this.renderer.draw(this);
    this.pixel.present();
    this.hud.update(this);
    this.shop.update(this);
    this.panel.update(this);
    this.menus.update(this);
  }

  resize(width, height) {
    this.pixel.resize(width, height);
  }

  bindInput() {
    const toWorld = (ev) => {
      const r = this.canvas.getBoundingClientRect();
      return {
        x: ((ev.clientX - r.left) / r.width) * VIEW_W,
        y: ((ev.clientY - r.top) / r.height) * VIEW_H,
      };
    };

    this.canvas.addEventListener("contextmenu", (ev) => {
      ev.preventDefault();
      this.clearSelection();
    });
    this.canvas.addEventListener("mousemove", (ev) => {
      const p = toWorld(ev);
      this.hoverPad = this.state === "play" ? this.padAt(p.x, p.y) : -1;
    });
    this.canvas.addEventListener("mousedown", (ev) => {
      if (ev.button !== 0) return;
      this.sfx.init();
      if (this.state !== "play" || this.paused) return;
      const p = toWorld(ev);
      const tower = this.towerAt(p.x, p.y);
      if (tower) {
        this.selectedTower = tower;
        this.selectedBuild = null;
        this.sfx.play("click");
        return;
      }
      const padIndex = this.padAt(p.x, p.y);
      if (padIndex >= 0 && this.selectedBuild) {
        this.placeAt(padIndex);
        return;
      }
      this.clearSelection();
    });

    window.addEventListener("keydown", (ev) => {
      if (ev.repeat) return;
      this.sfx.init();
      const k = ev.key;
      if (k === "m" || k === "M") return this.toggleMute();
      if (k === "r" || k === "R") {
        if (!["menu", "brief"].includes(this.state)) this.retry();
        return;
      }
      if (this.state === "menu") {
        if (k === " " || k === "Enter") this.startRun();
        return;
      }
      if (this.state === "brief") {
        if (k === " " || k === "Enter") this.deploy();
        return;
      }
      if (this.state === "win" || this.state === "lose") return;
      if (k === "Escape") return this.togglePause();
      if (this.state !== "play") return;
      if (k === " ") {
        ev.preventDefault();
        return this.startWave();
      }
      if (k >= "1" && k <= "4") return this.selectBuild(["pulse", "arc", "cryo", "tesla"][Number(k) - 1]);
      if (k === "u" || k === "U") return this.upgradeSelected();
      if (k === "s" || k === "S") return this.sellSelected();
      if (k === "d" || k === "D") return this.toggleSelected();
      if (k === "f" || k === "F") return this.toggleSpeed();
    });
  }
}
