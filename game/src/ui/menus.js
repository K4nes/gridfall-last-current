import { WAVES } from "../systems/waves.js";
import { CAPACITY } from "../systems/power-grid.js";
import { START_CREDITS } from "../systems/economy.js";
import { buildBackground } from "../assets/environment.js";

const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
};

export class Menus {
  constructor(root, game) {
    this.root = root;
    this.game = game;
    this.screens = {};
    this.build();
  }

  build() {
    this.root.innerHTML = "";

    const menu = el("div", "screen");
    menu.append(
      el("div", "eyebrow", "SUBSTATION 09 · NIGHT SHIFT"),
      el("h1", null, "GRIDFALL"),
      el("div", "eyebrow", "LAST CURRENT"),
      el("div", "rule"),
      el("p", null, "Rogue maintenance drones are cutting the feeders. Every tower you place draws from one shared grid, and the grid is all the core has left."),
      el("p", null, "DEFEND THE CORE · SURVIVE SIX SURGES · DO NOT TRIP THE BREAKER"),
    );
    const mb = el("div", "btns");
    const start = el("button", "primary", "START SHIFT");
    start.addEventListener("click", () => this.game.startRun());
    this.sound = el("button", null, "SOUND ON");
    this.sound.addEventListener("click", () => this.game.toggleMute());
    mb.append(start, this.sound);
    menu.append(mb, el("div", "hint", "SPACE TO START · M SOUND"));
    this.screens.menu = menu;

    const brief = el("div", "screen wide");
    brief.append(el("div", "eyebrow", "MISSION 01"), el("h2", null, "THE OUTAGE"));
    brief.append(el("p", null, "Automated maintenance drones have gone rogue. They are approaching the central power core."));
    const grid = el("div", "brief-grid");
    const list = el("div", "brief-list");
    const rows = [
      ["THREAT", "LOW"],
      ["CREDITS", String(START_CREDITS)],
      ["GRID CAPACITY", `${CAPACITY} W`],
      ["HIGH LOAD", "FROM 70 W"],
      ["BREAKER TRIP", "OVER 100 W"],
      ["TO CUT LOAD", "SELL A TOWER"],
      ["CORE INTEGRITY", "10 HP"],
      ["OBJECTIVE", "SURVIVE 6 WAVES"],
    ];
    for (const [k, v] of rows) {
      const row = el("div");
      row.append(el("span", null, k), el("span", null, v));
      list.append(row);
    }
    const preview = el("div", "map-preview");
    const img = el("img");
    img.src = buildBackground().toDataURL();
    img.style.width = "100%";
    img.style.imageRendering = "pixelated";
    preview.append(img);
    grid.append(list, preview);
    brief.append(grid);
    const bb = el("div", "btns");
    const deploy = el("button", "primary", "DEPLOY");
    deploy.addEventListener("click", () => this.game.deploy());
    bb.append(deploy);
    brief.append(bb, el("div", "hint", "SPACE TO DEPLOY"));
    this.screens.brief = brief;

    const pause = el("div", "screen");
    pause.append(el("h2", null, "PAUSED"), el("p", null, "The grid holds while you think."));
    const pb = el("div", "btns");
    const resume = el("button", "primary", "RESUME");
    resume.addEventListener("click", () => this.game.togglePause());
    pb.append(resume);
    pause.append(pb, el("div", "hint", "ESC TO RESUME"));
    this.screens.pause = pause;

    const end = el("div", "screen result-good");
    this.endScreen = end;
    this.endEyebrow = el("div", "eyebrow", "MISSION COMPLETE");
    this.endTitle = el("h1", null, "GRID RESTORED");
    this.endSub = el("p", null, "");
    this.stars = el("div", "stars");
    for (let i = 0; i < 3; i++) this.stars.append(el("i"));
    this.starRules = el("div", "star-rules");
    this.starRows = [];
    for (const [tier, text] of [
      ["★★★", "SURVIVE · CORE 8+ · 0 OVERLOADS"],
      ["★★", "SURVIVE · CORE 5+"],
      ["★", "SURVIVE"],
    ]) {
      const row = el("div", "rule-row");
      row.append(el("span", "tier", tier), el("span", "need", text));
      this.starRules.append(row);
      this.starRows.push(row);
    }
    this.starNote = el("div", "star-note", "");
    this.stats = el("div", "stats-grid");
    this.statNodes = {};
    for (const [key, label] of [
      ["score", "FINAL SCORE"], ["waves", "WAVES SURVIVED"],
      ["kills", "DRONES DESTROYED"], ["towers", "TOWERS BUILT"],
      ["overloads", "OVERLOADS"], ["time", "TIME"],
    ]) {
      const cell = el("div");
      cell.append(el("div", "k", label), el("div", "v", "0"));
      this.stats.append(cell);
      this.statNodes[key] = cell.querySelector(".v");
    }
    const eb = el("div", "btns");
    const retry = el("button", "primary", "RETRY (R)");
    retry.addEventListener("click", () => this.game.retry());
    const menuBtn = el("button", null, "MAIN MENU");
    menuBtn.addEventListener("click", () => this.game.toMenu());
    eb.append(retry, menuBtn);
    end.append(this.endEyebrow, this.endTitle, this.endSub, this.stars, this.starRules, this.starNote, this.stats, eb);
    this.screens.end = end;

    for (const s of Object.values(this.screens)) this.root.append(s);
  }

  update(game) {
    let screen = null;
    if (game.state === "menu") screen = "menu";
    else if (game.state === "brief") screen = "brief";
    else if (game.state === "pause") screen = "pause";
    else if (game.state === "win" || game.state === "lose") screen = "end";

    if (!screen) {
      this.root.classList.add("hidden");
      return;
    }
    this.root.classList.remove("hidden");
    const names = { menu: "menu", brief: "brief", pause: "pause", end: "end" };
    for (const [key, node] of Object.entries(this.screens)) {
      node.style.display = key === names[screen] ? "" : "none";
    }

    if (screen === "end") {
      const win = game.state === "win";
      this.endScreen.className = "screen " + (win ? "result-good" : "result-bad");
      this.endEyebrow.textContent = win ? "MISSION COMPLETE · SIX SURGES HELD" : "THE CORE WENT DARK";
      this.endTitle.textContent = win ? "GRID RESTORED" : "SYSTEM FAILURE";
      this.endSub.textContent = win
        ? "The substation holds until daylight."
        : "The last feeder failed. The drones walked through.";
      const stars = game.stars();
      [...this.stars.children].forEach((s, i) => (s.className = i < stars ? "on" : ""));
      this.starRows[0].classList.toggle("met", win && game.core >= 8 && game.grid.trips === 0);
      this.starRows[1].classList.toggle("met", win && game.core >= 5);
      this.starRows[2].classList.toggle("met", win);
      this.starNote.textContent = win
        ? game.grid.trips === 0
          ? "0 OVERLOADS · THE GRID NEVER TRIPPED"
          : `${game.grid.trips} OVERLOAD${game.grid.trips === 1 ? "" : "S"} = ${game.grid.trips} BLACKOUT${game.grid.trips === 1 ? "" : "S"} · 5 S EACH`
        : "THE CORE WAS LOST · NO STARS AWARDED";
      this.statNodes.score.textContent = String(game.finalScore ?? 0);
      this.statNodes.waves.textContent = `${Math.min(game.waveIndex, WAVES.length)} / ${WAVES.length}`;
      this.statNodes.kills.textContent = String(game.economy.kills);
      this.statNodes.towers.textContent = String(game.economy.built);
      this.statNodes.overloads.textContent = String(game.grid.trips);
      this.statNodes.time.textContent = game.timeString();
    }

    if (screen === "menu") this.sound.textContent = game.sfx.muted ? "SOUND OFF" : "SOUND ON";
  }
}
