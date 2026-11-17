export const START_CREDITS = 150;
export const WAVE_BONUS = 60;

export class Economy {
  constructor() {
    this.credits = START_CREDITS;
    this.kills = 0;
    this.built = 0;
    this.score = 0;
    this.earned = 0;
    this.spent = 0;
  }
  canAfford(n) {
    return this.credits >= n;
  }
  spend(n) {
    if (!this.canAfford(n)) return false;
    this.credits -= n;
    this.spent += n;
    return true;
  }
  earn(n) {
    this.credits += n;
    this.earned += n;
  }
  refund(n) {
    this.credits += n;
    this.earned += n;
  }
  onKill(enemy) {
    this.kills += 1;
    this.earn(enemy.def.bounty);
    this.score += 10 + enemy.def.bounty;
  }
  onWaveCleared() {
    this.earn(WAVE_BONUS);
    this.score += 100;
  }
  finalScore(win, core) {
    return this.score + (win ? core * 200 : 0);
  }
}
