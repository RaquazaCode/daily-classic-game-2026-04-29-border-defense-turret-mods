export const STEP_MS = 100;
export const TRACK_LENGTH = 8.8;
export const TOTAL_WAVES = 4;
export const STARTING_BORDER = 18;
export const STARTING_CREDITS = 28;

export const TOWER_TYPES = {
  sentry: {
    key: "sentry",
    label: "Sentinel",
    cost: 7,
    damage: 1.4,
    fireRateMs: 520,
    range: 2.65,
    projectileSpeed: 0.44,
    laneReach: 0,
    splashRadius: 0,
    accent: "#78d9c9",
  },
  cannon: {
    key: "cannon",
    label: "Breaker",
    cost: 11,
    damage: 3.4,
    fireRateMs: 1120,
    range: 2.45,
    projectileSpeed: 0.36,
    laneReach: 0,
    splashRadius: 0.7,
    accent: "#f2a24c",
  },
};

export const MOD_TYPES = {
  burst: {
    key: "burst",
    label: "Burst Core",
    cost: 4,
    accent: "#f18f5c",
    damageMultiplier: 1.22,
    fireRateMultiplier: 0.96,
    extraProjectileEvery: 3,
    rangeBonus: 0,
    laneReachBonus: 0,
    slowFactor: null,
    slowDurationMs: 0,
  },
  frost: {
    key: "frost",
    label: "Frost Core",
    cost: 3,
    accent: "#8dc6ff",
    damageMultiplier: 0.92,
    fireRateMultiplier: 1,
    extraProjectileEvery: 0,
    rangeBonus: 0.45,
    laneReachBonus: 0,
    slowFactor: 0.56,
    slowDurationMs: 1800,
  },
  relay: {
    key: "relay",
    label: "Relay Core",
    cost: 4,
    accent: "#b2f576",
    damageMultiplier: 1,
    fireRateMultiplier: 0.9,
    extraProjectileEvery: 0,
    rangeBonus: 1.2,
    laneReachBonus: 2,
    slowFactor: null,
    slowDurationMs: 0,
  },
};

export const SLOT_LAYOUT = Array.from({ length: 5 }, (_, lane) =>
  Array.from({ length: 4 }, (_, column) => ({
    id: `L${lane + 1}C${column + 1}`,
    lane,
    column,
    x: 1.2 + column * 1.7,
    y: lane,
  }))
).flat();

const SLOT_INDEX = new Map(SLOT_LAYOUT.map((slot) => [slot.id, slot]));

const ENEMY_TYPES = {
  runner: {
    key: "runner",
    label: "Runner",
    hp: 4,
    speed: 0.082,
    rewardScore: 60,
    rewardCredits: 4,
    damage: 1,
    armor: 0.05,
    accent: "#f0d28d",
  },
  shield: {
    key: "shield",
    label: "Shield Cart",
    hp: 10,
    speed: 0.057,
    rewardScore: 120,
    rewardCredits: 6,
    damage: 2,
    armor: 0.38,
    accent: "#f8c27a",
  },
  tank: {
    key: "tank",
    label: "Siege Tank",
    hp: 24,
    speed: 0.043,
    rewardScore: 240,
    rewardCredits: 10,
    damage: 3,
    armor: 0.72,
    accent: "#ff8f5f",
  },
};

const WAVE_BLUEPRINTS = [
  [
    { kind: "runner", lane: 2, delayMs: 0 },
    { kind: "runner", lane: 1, delayMs: 650 },
    { kind: "runner", lane: 3, delayMs: 1220 },
    { kind: "runner", lane: 0, delayMs: 1880 },
    { kind: "runner", lane: 4, delayMs: 2520 },
    { kind: "runner", lane: 2, delayMs: 3150 },
  ],
  [
    { kind: "shield", lane: 1, delayMs: 0 },
    { kind: "runner", lane: 2, delayMs: 520 },
    { kind: "runner", lane: 3, delayMs: 900 },
    { kind: "runner", lane: 0, delayMs: 1480 },
    { kind: "shield", lane: 4, delayMs: 2060 },
    { kind: "runner", lane: 2, delayMs: 2680 },
    { kind: "runner", lane: 1, delayMs: 3280 },
  ],
  [
    { kind: "tank", lane: 2, delayMs: 0 },
    { kind: "runner", lane: 0, delayMs: 560 },
    { kind: "shield", lane: 1, delayMs: 980 },
    { kind: "shield", lane: 3, delayMs: 1560 },
    { kind: "runner", lane: 4, delayMs: 2140 },
    { kind: "runner", lane: 2, delayMs: 2720 },
    { kind: "runner", lane: 3, delayMs: 3240 },
  ],
  [
    { kind: "shield", lane: 0, delayMs: 0 },
    { kind: "tank", lane: 1, delayMs: 620 },
    { kind: "runner", lane: 2, delayMs: 1260 },
    { kind: "tank", lane: 3, delayMs: 1860 },
    { kind: "shield", lane: 4, delayMs: 2420 },
    { kind: "runner", lane: 1, delayMs: 3020 },
    { kind: "runner", lane: 3, delayMs: 3480 },
    { kind: "runner", lane: 2, delayMs: 3920 },
  ],
];

function createBaseState(seed = 20260429, highScore = 0) {
  return {
    seed,
    mode: "title",
    tick: 0,
    clockMs: 0,
    remainderMs: 0,
    waveElapsedMs: 0,
    wave: 0,
    clearedWaves: 0,
    totalWaves: TOTAL_WAVES,
    score: 0,
    highScore,
    credits: STARTING_CREDITS,
    border: STARTING_BORDER,
    kills: 0,
    leaks: 0,
    selectedBuildType: "sentry",
    selectedModKey: "relay",
    activeTool: "build",
    cursor: { lane: 2, column: 1 },
    towers: [],
    enemies: [],
    projectiles: [],
    pendingSpawns: [],
    nextEnemyId: 1,
    nextProjectileId: 1,
    lastEvent: "Press Enter to brief the line",
    events: ["Press Enter to brief the line"],
  };
}

function cloneEnemy(enemy) {
  return { ...enemy };
}

function round(value) {
  return Number(value.toFixed(2));
}

function recordEvent(state, message) {
  state.lastEvent = message;
  state.events = [...state.events.slice(-4), message];
}

function getWaveBlueprint(wave) {
  return WAVE_BLUEPRINTS[wave - 1] ?? [];
}

function getSlot(slotId) {
  return SLOT_INDEX.get(slotId) ?? null;
}

function getTowerAtSlot(state, slotId) {
  return state.towers.find((tower) => tower.slotId === slotId) ?? null;
}

function cloneMod(modKey) {
  return MOD_TYPES[modKey] ?? null;
}

function getTowerStats(tower) {
  const base = TOWER_TYPES[tower.type];
  const mod = tower.mod ? cloneMod(tower.mod) : null;

  if (!base) {
    throw new Error(`unknown tower type: ${tower.type}`);
  }

  if (!mod) {
    return {
      ...base,
      laneReach: base.laneReach,
      slowFactor: null,
      slowDurationMs: 0,
      extraProjectileEvery: 0,
    };
  }

  return {
    ...base,
    damage: base.damage * mod.damageMultiplier,
    fireRateMs: base.fireRateMs * mod.fireRateMultiplier,
    range: base.range + mod.rangeBonus,
    laneReach: base.laneReach + mod.laneReachBonus,
    slowFactor: mod.slowFactor,
    slowDurationMs: mod.slowDurationMs,
    extraProjectileEvery: mod.extraProjectileEvery,
    accent: mod.accent,
  };
}

function queueWave(state, wave) {
  const blueprint = getWaveBlueprint(wave);
  state.pendingSpawns = blueprint.map((entry, index) => ({
    ...entry,
    serial: index,
  }));
  state.waveElapsedMs = 0;
}

function spawnEnemy(state, entry) {
  const definition = ENEMY_TYPES[entry.kind];
  state.enemies.push({
    id: state.nextEnemyId,
    kind: definition.key,
    label: definition.label,
    lane: entry.lane,
    hp: definition.hp,
    maxHp: definition.hp,
    speed: definition.speed,
    rewardScore: definition.rewardScore,
    rewardCredits: definition.rewardCredits,
    damage: definition.damage,
    armor: definition.armor,
    accent: definition.accent,
    progress: -0.55 - entry.serial * 0.04,
    slowFactor: 1,
    slowMs: 0,
  });
  state.nextEnemyId += 1;
}

function processWaveSpawns(state) {
  while (state.pendingSpawns.length > 0 && state.pendingSpawns[0].delayMs <= state.waveElapsedMs) {
    spawnEnemy(state, state.pendingSpawns.shift());
  }
}

function acquireTarget(state, tower) {
  const slot = getSlot(tower.slotId);
  const stats = getTowerStats(tower);
  let best = null;

  for (const enemy of state.enemies) {
    const laneDistance = Math.abs(enemy.lane - slot.lane);
    if (laneDistance > stats.laneReach) {
      continue;
    }

    const dx = enemy.progress - slot.x;
    if (dx < -0.55) {
      continue;
    }

    const distance = Math.hypot(dx, laneDistance);
    if (distance > stats.range) {
      continue;
    }

    if (!best || enemy.progress > best.progress) {
      best = enemy;
    }
  }

  return best;
}

function createProjectile(state, tower, target, angleOffset = 0) {
  const slot = getSlot(tower.slotId);
  const stats = getTowerStats(tower);

  state.projectiles.push({
    id: state.nextProjectileId,
    sourceId: tower.id,
    targetId: target.id,
    x: slot.x,
    y: slot.y + angleOffset,
    damage: stats.damage,
    speed: stats.projectileSpeed,
    splashRadius: stats.splashRadius,
    slowFactor: stats.slowFactor,
    slowDurationMs: stats.slowDurationMs,
    accent: stats.accent,
  });
  state.nextProjectileId += 1;
}

function fireTowers(state) {
  for (const tower of state.towers) {
    tower.cooldownMs = Math.max(0, tower.cooldownMs - STEP_MS);
    if (tower.cooldownMs > 0) {
      continue;
    }

    const target = acquireTarget(state, tower);
    if (!target) {
      continue;
    }

    const stats = getTowerStats(tower);
    tower.shotsFired += 1;
    createProjectile(state, tower, target, 0);
    if (stats.extraProjectileEvery > 0 && tower.shotsFired % stats.extraProjectileEvery === 0) {
      createProjectile(state, tower, target, tower.shotsFired % 2 === 0 ? -0.08 : 0.08);
    }
    tower.cooldownMs = stats.fireRateMs;
  }
}

function applyDamage(enemy, damage) {
  enemy.hp -= Math.max(0.45, damage - enemy.armor);
}

function applyProjectileImpact(state, projectile, target) {
  applyDamage(target, projectile.damage);
  if (projectile.slowDurationMs > 0 && projectile.slowFactor) {
    target.slowMs = Math.max(target.slowMs, projectile.slowDurationMs);
    target.slowFactor = Math.min(target.slowFactor, projectile.slowFactor);
  }

  if (projectile.splashRadius <= 0) {
    return;
  }

  for (const enemy of state.enemies) {
    if (enemy.id === target.id) {
      continue;
    }
    const distance = Math.hypot(enemy.progress - target.progress, enemy.lane - target.lane);
    if (distance <= projectile.splashRadius) {
      applyDamage(enemy, projectile.damage * 0.45);
    }
  }
}

function advanceProjectiles(state) {
  const nextProjectiles = [];

  for (const projectile of state.projectiles) {
    const target = state.enemies.find((enemy) => enemy.id === projectile.targetId);
    if (!target) {
      continue;
    }

    const dx = target.progress - projectile.x;
    const dy = target.lane - projectile.y;
    const distance = Math.hypot(dx, dy);

    if (distance <= projectile.speed || distance < 0.14) {
      applyProjectileImpact(state, projectile, target);
      continue;
    }

    nextProjectiles.push({
      ...projectile,
      x: projectile.x + (dx / distance) * projectile.speed,
      y: projectile.y + (dy / distance) * projectile.speed,
    });
  }

  state.projectiles = nextProjectiles;
}

function resolveDefeats(state) {
  const survivors = [];
  let scoreGain = 0;
  let creditsGain = 0;
  let defeated = 0;

  for (const enemy of state.enemies) {
    if (enemy.hp <= 0) {
      defeated += 1;
      scoreGain += enemy.rewardScore;
      creditsGain += enemy.rewardCredits;
      continue;
    }
    survivors.push(enemy);
  }

  state.enemies = survivors;
  state.kills += defeated;
  state.score += scoreGain;
  state.credits += creditsGain;

  if (defeated > 0) {
    recordEvent(state, `${defeated} hostile${defeated > 1 ? "s" : ""} neutralized`);
  }
}

function advanceEnemies(state) {
  const survivors = [];

  for (const enemy of state.enemies) {
    const next = cloneEnemy(enemy);
    if (next.slowMs > 0) {
      next.slowMs = Math.max(0, next.slowMs - STEP_MS);
      if (next.slowMs === 0) {
        next.slowFactor = 1;
      }
    }

    next.progress += next.speed * next.slowFactor;
    if (next.progress >= TRACK_LENGTH) {
      state.border = Math.max(0, state.border - next.damage);
      state.leaks += 1;
      recordEvent(state, `${next.label} breached the line`);
      continue;
    }
    survivors.push(next);
  }

  state.enemies = survivors;
}

function finishWave(state) {
  state.clearedWaves = state.wave;
  state.score += state.wave * 160;
  state.credits += 4 + state.wave;

  if (state.wave >= TOTAL_WAVES) {
    state.score += state.border * 45;
    state.highScore = Math.max(state.highScore, state.score);
    state.mode = "victory";
    recordEvent(state, "Border held through dawn. Press Enter to redeploy.");
    return;
  }

  state.mode = "intermission";
  recordEvent(state, `Wave ${state.wave} cleared. Prep for wave ${state.wave + 1}.`);
}

function checkEndConditions(state) {
  if (state.border <= 0) {
    state.mode = "defeat";
    state.highScore = Math.max(state.highScore, state.score);
    recordEvent(state, "The frontier collapsed. Press Enter to try again.");
    return;
  }

  if (state.mode === "playing" && state.pendingSpawns.length === 0 && state.enemies.length === 0 && state.projectiles.length === 0) {
    finishWave(state);
  }
}

function stepPlayingState(state) {
  state.tick += 1;
  state.clockMs += STEP_MS;
  state.waveElapsedMs += STEP_MS;
  processWaveSpawns(state);
  fireTowers(state);
  advanceProjectiles(state);
  resolveDefeats(state);
  advanceEnemies(state);
  checkEndConditions(state);
}

export function createGame(seed = 20260429) {
  return createBaseState(seed);
}

export function startGame(state) {
  if (state.mode !== "title" && state.mode !== "victory" && state.mode !== "defeat") {
    return false;
  }

  const next = createBaseState(state.seed, Math.max(state.highScore, state.score));
  Object.assign(state, next);
  state.mode = "briefing";
  recordEvent(state, "Deployment phase open. Build the first line.");
  return true;
}

export function launchWave(state) {
  if (state.mode !== "briefing" && state.mode !== "intermission") {
    return false;
  }

  if (state.wave >= TOTAL_WAVES) {
    return false;
  }

  state.wave += 1;
  state.mode = "playing";
  queueWave(state, state.wave);
  recordEvent(state, `Wave ${state.wave} crossing the border.`);
  return true;
}

export function selectBuildType(state, buildType) {
  if (!TOWER_TYPES[buildType]) {
    return false;
  }
  state.selectedBuildType = buildType;
  state.activeTool = "build";
  return true;
}

export function selectModKey(state, modKey) {
  if (!MOD_TYPES[modKey]) {
    return false;
  }
  state.selectedModKey = modKey;
  state.activeTool = "mod";
  return true;
}

export function moveCursor(state, dx, dy) {
  const nextLane = Math.max(0, Math.min(4, state.cursor.lane + dy));
  const nextColumn = Math.max(0, Math.min(3, state.cursor.column + dx));
  state.cursor = { lane: nextLane, column: nextColumn };
  return getCursorSlotId(state);
}

export function getCursorSlotId(state) {
  return `L${state.cursor.lane + 1}C${state.cursor.column + 1}`;
}

export function buildTower(state, slotId, towerType = state.selectedBuildType) {
  if (!SLOT_INDEX.has(slotId)) {
    return { ok: false, reason: "invalid_slot" };
  }
  if (state.mode === "title" || state.mode === "victory" || state.mode === "defeat") {
    return { ok: false, reason: "inactive_mode" };
  }
  if (getTowerAtSlot(state, slotId)) {
    recordEvent(state, "Build pad already occupied");
    return { ok: false, reason: "occupied" };
  }

  const definition = TOWER_TYPES[towerType];
  if (!definition) {
    return { ok: false, reason: "invalid_tower" };
  }
  if (state.credits < definition.cost) {
    recordEvent(state, "Insufficient credits for that turret");
    return { ok: false, reason: "insufficient_credits" };
  }

  const slot = getSlot(slotId);
  state.credits -= definition.cost;
  state.towers.push({
    id: `${towerType}-${slotId}`,
    slotId,
    lane: slot.lane,
    column: slot.column,
    type: towerType,
    mod: null,
    cooldownMs: definition.fireRateMs * 0.5,
    shotsFired: 0,
  });
  recordEvent(state, `${definition.label} emplaced`);
  return { ok: true };
}

export function applyMod(state, slotId, modKey = state.selectedModKey) {
  const tower = getTowerAtSlot(state, slotId);
  if (!tower) {
    recordEvent(state, "Select a turret before fitting a mod core");
    return { ok: false, reason: "missing_tower" };
  }
  if (tower.mod) {
    recordEvent(state, "Turret mod slot is already occupied");
    return { ok: false, reason: "already_modded" };
  }
  const mod = MOD_TYPES[modKey];
  if (!mod) {
    return { ok: false, reason: "invalid_mod" };
  }
  if (state.credits < mod.cost) {
    recordEvent(state, "Not enough credits to fit that core");
    return { ok: false, reason: "insufficient_credits" };
  }

  tower.mod = modKey;
  state.credits -= mod.cost;
  recordEvent(state, `${mod.label} fitted to ${TOWER_TYPES[tower.type].label}`);
  return { ok: true };
}

export function activateSlot(state, slotId) {
  if (state.activeTool === "mod") {
    return applyMod(state, slotId, state.selectedModKey);
  }
  return buildTower(state, slotId, state.selectedBuildType);
}

export function activateCursor(state) {
  return activateSlot(state, getCursorSlotId(state));
}

export function togglePause(state) {
  if (state.mode === "playing") {
    state.mode = "paused";
    recordEvent(state, "Simulation paused");
    return true;
  }
  if (state.mode === "paused") {
    state.mode = "playing";
    recordEvent(state, `Wave ${state.wave} resumed`);
    return true;
  }
  return false;
}

export function softResetRun(state) {
  const next = createBaseState(state.seed, Math.max(state.highScore, state.score));
  Object.assign(state, next);
  state.mode = "briefing";
  recordEvent(state, "Run reset. Deployment phase reopened.");
}

export function hardResetToTitle(state) {
  const next = createBaseState(state.seed, Math.max(state.highScore, state.score));
  Object.assign(state, next);
  recordEvent(state, "Press Enter to brief the line");
}

export function advanceTime(state, ms) {
  if (!Number.isFinite(ms) || ms <= 0) {
    return;
  }

  state.remainderMs += ms;
  while (state.remainderMs >= STEP_MS) {
    if (state.mode === "playing") {
      stepPlayingState(state);
    }
    state.remainderMs -= STEP_MS;
  }
}

export function advanceByMs(state, ms) {
  advanceTime(state, ms);
}

export function stepGame(state) {
  advanceTime(state, STEP_MS);
}

export function getStepMs() {
  return STEP_MS;
}

export function snapshot(state) {
  return {
    mode: state.mode,
    tick: state.tick,
    clockMs: state.clockMs,
    wave: state.wave,
    clearedWaves: state.clearedWaves,
    totalWaves: state.totalWaves,
    score: state.score,
    highScore: state.highScore,
    credits: state.credits,
    border: state.border,
    kills: state.kills,
    leaks: state.leaks,
    selectedBuildType: state.selectedBuildType,
    selectedModKey: state.selectedModKey,
    activeTool: state.activeTool,
    cursor: { ...state.cursor },
    lastEvent: state.lastEvent,
    towers: state.towers
      .map((tower) => ({
        id: tower.id,
        slotId: tower.slotId,
        lane: tower.lane,
        column: tower.column,
        type: tower.type,
        mod: tower.mod,
        cooldownMs: round(tower.cooldownMs),
        shotsFired: tower.shotsFired,
      }))
      .sort((left, right) => left.slotId.localeCompare(right.slotId)),
    enemies: state.enemies
      .map((enemy) => ({
        id: enemy.id,
        kind: enemy.kind,
        lane: enemy.lane,
        hp: round(enemy.hp),
        maxHp: enemy.maxHp,
        progress: round(enemy.progress),
        slowMs: enemy.slowMs,
        slowFactor: round(enemy.slowFactor),
      }))
      .sort((left, right) => left.id - right.id),
    projectiles: state.projectiles
      .map((projectile) => ({
        id: projectile.id,
        sourceId: projectile.sourceId,
        targetId: projectile.targetId,
        x: round(projectile.x),
        y: round(projectile.y),
        damage: round(projectile.damage),
      }))
      .sort((left, right) => left.id - right.id),
    events: [...state.events],
  };
}

export function renderGameToText(state) {
  const byLane = Array.from({ length: 5 }, (_, lane) => ({
    lane,
    towers: state.towers
      .filter((tower) => tower.lane === lane)
      .map((tower) => ({
        slotId: tower.slotId,
        type: tower.type,
        mod: tower.mod ?? "none",
      })),
    enemies: state.enemies
      .filter((enemy) => enemy.lane === lane)
      .map((enemy) => ({
        kind: enemy.kind,
        hp: round(enemy.hp),
        progress: round(enemy.progress),
      }))
      .sort((left, right) => right.progress - left.progress),
  }));

  return JSON.stringify({
    ...snapshot(state),
    lanes: byLane,
  }, null, 2);
}
