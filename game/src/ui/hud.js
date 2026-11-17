import { CAPACITY } from "../systems/power-grid.js";
import { WAVES } from "../systems/waves.js";
import { ENEMIES, enemySprites } from "../assets/enemies.js";

const ICONS = {};
function icon(type) {
  if (!ICONS[type]) ICONS[type] = enemySprites()[type][0].toDataURL();
  return ICONS[type];
}

function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}

function set(node, text) {
  if (node.textContent !== text) node.textContent = text;
}

export class Hud {
  constructor(nodes, game) {
    this.game = game;
    this.root = nodes.topbar;
    this.power = nodes.power;
    this.actions = nodes.actions;
    this.compIndex = -1;
    this.build();
  }

  build() {
    const b = el("div", "brand");
    b.append(el("b", null, "GRIDFALL"), el("span", null, "LAST CURRENT"));
    this.root.append(b);

    this.credits = this.stat("CREDITS", "0", "credit");
    this.core = el("div", "stat");
    this.core.append(el("div", "k", "CORE"));
    this.coreBlocks = el("div", "core-blocks");
    for (let i = 0; i < 10; i++) this.coreBlocks.append(el("i"));
    this.core.append(this.coreBlocks);

    this.wave = this.stat("WAVE", "1 / 6");
    this.kills = this.stat("KILLS", "0");
    this.draw = this.stat("DRAW", "0 W", "ok");
    this.state = this.stat("GRID", "STABLE", "ok");

    this.root.append(this.credits.wrap, this.core, this.wave.wrap, this.kills.wrap, this.draw.wrap, el("div", "spacer"), this.state.wrap);

    const p = this.power;
    const row = el("div", "power-row");
    this.pLabel = el("div", "k", "GRID LOAD");
    this.pValue = el("div", "v", `0 / ${CAPACITY} W`);
    row.append(this.pLabel, this.pValue);
    p.append(row);

    this.segs = el("div", "power-segs");
    for (let i = 0; i < 20; i++) this.segs.append(el("i"));
    p.append(this.segs);

    this.bar = el("div", "power-bar");
    this.barFill = el("i");
    this.bar.append(this.barFill);
    p.append(this.bar);

    const foot = el("div", "power-foot");
    this.pState = el("div", "state", "STABLE");
    this.pFoot = el("div", null, "0 TOWERS ONLINE");
    foot.append(this.pState, this.pFoot);
    p.append(foot);

    const a = this.actions;
    this.waveBtn = el("button");
    this.waveBtn.id = "wave-btn";
    this.waveBtn.innerHTML = '<div class="big"></div><div class="comp"></div><div class="sub label"></div><div class="sub key"></div>';
    this.waveBtn.addEventListener("click", () => this.game.startWave());
    this.waveBig = this.waveBtn.querySelector(".big");
    this.waveComp = this.waveBtn.querySelector(".comp");
    this.waveLabel = this.waveBtn.querySelector(".label");
    this.waveKey = this.waveBtn.querySelector(".key");
    a.append(this.waveBtn);

    const minis = el("div", "mini-row");
    this.muteBtn = el("button", "mini", "SOUND");
    this.muteBtn.addEventListener("click", () => this.game.toggleMute());
    this.pauseBtn = el("button", "mini", "PAUSE");
    this.pauseBtn.addEventListener("click", () => this.game.togglePause());
    this.speedBtn = el("button", "mini", "2×");
    this.speedBtn.title = "Fast forward (F)";
    this.speedBtn.addEventListener("click", () => this.game.toggleSpeed());
    minis.append(this.muteBtn, this.pauseBtn, this.speedBtn);
    a.append(minis);
  }

  stat(k, v, cls) {
    const wrap = el("div", "stat");
    wrap.append(el("div", "k", k));
    const val = el("div", "v" + (cls ? " " + cls : ""), v);
    wrap.append(val);
    return { wrap, val };
  }

  buildComp(index) {
    if (this.compIndex === index) return;
    this.compIndex = index;
    this.waveComp.textContent = "";
    const wave = WAVES[index];
    if (!wave) return;
    const counts = new Map();
    for (const g of wave.groups) counts.set(g.type, (counts.get(g.type) || 0) + g.count);
    for (const [type, n] of counts) {
      const chip = el("span", "chip");
      const img = el("img");
      img.src = icon(type);
      img.alt = ENEMIES[type].name;
      chip.append(img, el("b", null, String(n)), el("em", null, ENEMIES[type].name));
      this.waveComp.append(chip);
    }
  }

  update(game) {
    set(this.credits.val, String(game.credits));
    for (let i = 0; i < 10; i++) {
      this.coreBlocks.children[i].className = i < game.core ? "on" : "";
    }
    set(this.wave.val, `${Math.min(game.waveIndex + 1, 6)} / 6`);
    set(this.kills.val, String(game.economy.kills));

    const draw = game.drawPower();
    set(this.draw.val, `${draw} W`);
    this.draw.val.className = "v " + (draw > CAPACITY ? "warn" : "ok");

    const st = game.grid.state;
    const label = st === "shutdown" ? "OFFLINE" : st === "overloaded" ? "OVERLOAD" : st === "critical" ? "HIGH LOAD" : "STABLE";
    set(this.state.val, label);
    this.state.val.className = "v " + (st === "stable" ? "ok" : "warn");

    const pct = game.loadPct();
    set(this.pValue, `${draw} / ${CAPACITY} W`);
    this.pValue.className = "v " + (st === "shutdown" ? "bad" : st === "overloaded" ? "bad" : st === "critical" ? "warn" : "");

    const lit = Math.round(Math.min(1.2, pct) * 20);
    for (let i = 0; i < 20; i++) {
      const frac = i / 20;
      this.segs.children[i].className = i < lit ? (frac >= 0.95 ? "red" : frac >= 0.7 ? "hazard" : "cyan") : "";
    }

    const tripped = st === "overloaded" || st === "shutdown";
    this.power.dataset.state = st;
    this.bar.style.opacity = tripped ? "1" : "0";
    this.barFill.style.width = `${Math.round(game.grid.timerRatio() * 100)}%`;

    set(
      this.pState,
      st === "shutdown"
        ? "BREAKER OPEN"
        : st === "overloaded"
          ? game.grid.grace > 0
            ? `SELL · ${Math.ceil(game.grid.grace)}s`
            : `${Math.max(0, 3 - game.grid.overloadTimer).toFixed(1)}s TO TRIP`
          : st === "critical"
            ? "HIGH LOAD"
            : "STABLE",
    );
    this.pState.className = "state" + (st === "stable" ? "" : st === "critical" ? " warn" : " bad");
    set(this.pFoot, st === "shutdown" ? `${game.grid.shutdownTimer.toFixed(1)}s OFFLINE` : `${game.activeTowers()} ONLINE · ${Math.max(0, CAPACITY - draw)} W SPARE`);

    if (game.runner.running) {
      set(this.waveBig, "WAVE ACTIVE");
      this.waveBig.style.color = "var(--red)";
      this.waveComp.style.display = "none";
      set(this.waveLabel, `${game.remainingEnemies()} HOSTILES`);
      set(this.waveKey, `${game.runner.spawned}/${game.runner.total} SPAWNED`);
      this.waveBtn.disabled = true;
      this.waveBtn.classList.remove("ready");
    } else {
      const ready = game.canStartWave;
      const index = Math.min(game.waveIndex, WAVES.length - 1);
      const wave = WAVES[index];
      set(this.waveBig, `DEPLOY WAVE ${Math.min(game.waveIndex + 1, 6)}`);
      this.waveBig.style.color = ready ? "var(--hazard)" : "var(--dim)";
      this.waveComp.style.display = "";
      this.buildComp(index);
      set(this.waveLabel, wave ? `${wave.label} · ${wave.threat}` : "");
      set(this.waveKey, ready ? "SPACE · RMB CANCEL" : "HOLD");
      this.waveBtn.disabled = !ready;
      this.waveBtn.classList.toggle("ready", ready);
    }

    set(this.muteBtn, game.sfx.muted ? "MUTED" : "SOUND");
    set(this.pauseBtn, game.paused ? "RESUME" : "PAUSE");
    set(this.speedBtn, game.speed === 2 ? "2× ON" : "2×");
    this.speedBtn.classList.toggle("on", game.speed === 2);
  }
}
