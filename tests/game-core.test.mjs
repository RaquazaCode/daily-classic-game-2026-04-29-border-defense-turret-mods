import test from "node:test";
import assert from "node:assert/strict";

import {
  activateSlot,
  advanceByMs,
  applyMod,
  buildTower,
  createGame,
  getStepMs,
  hardResetToTitle,
  launchWave,
  moveCursor,
  renderGameToText,
  selectBuildType,
  selectModKey,
  snapshot,
  softResetRun,
  startGame,
  togglePause,
} from "../src/game-core.js";

function advanceUntil(state, predicate, maxSteps = 800) {
  for (let step = 0; step < maxSteps; step += 1) {
    if (predicate()) {
      return true;
    }
    advanceByMs(state, getStepMs());
  }
  return predicate();
}

function scriptedRoute(state) {
  startGame(state);
  selectBuildType(state, "sentry");
  buildTower(state, "L3C2");
  selectModKey(state, "relay");
  applyMod(state, "L3C2");

  selectBuildType(state, "cannon");
  buildTower(state, "L2C3");
  selectModKey(state, "burst");
  applyMod(state, "L2C3");

  launchWave(state);
  assert.equal(advanceUntil(state, () => state.mode === "intermission"), true, "wave 1 should clear");

  selectBuildType(state, "sentry");
  buildTower(state, "L4C3");
  selectModKey(state, "frost");
  applyMod(state, "L4C3");

  launchWave(state);
  assert.equal(advanceUntil(state, () => state.mode === "intermission"), true, "wave 2 should clear");

  selectBuildType(state, "cannon");
  buildTower(state, "L3C4");

  launchWave(state);
  assert.equal(advanceUntil(state, () => state.mode === "intermission"), true, "wave 3 should clear");

  launchWave(state);
  assert.equal(advanceUntil(state, () => state.mode === "victory"), true, "wave 4 should clear");
}

test("simulation stays deterministic for a scripted defense route", () => {
  const first = createGame(20260429);
  const second = createGame(20260429);

  scriptedRoute(first);
  scriptedRoute(second);

  assert.deepEqual(snapshot(first), snapshot(second));
});

test("occupied pads and credit checks reject invalid actions", () => {
  const state = createGame();
  startGame(state);

  assert.equal(buildTower(state, "L1C1", "sentry").ok, true);
  assert.equal(buildTower(state, "L1C1", "cannon").ok, false);

  state.credits = 0;
  assert.equal(buildTower(state, "L1C2", "cannon").ok, false);
  assert.equal(applyMod(state, "L1C1", "burst").ok, false);
});

test("keyboard cursor activation places builds and mods", () => {
  const state = createGame();
  startGame(state);
  moveCursor(state, -1, 0);
  moveCursor(state, 0, -2);

  selectBuildType(state, "sentry");
  assert.equal(activateSlot(state, "L1C1").ok, true);

  selectModKey(state, "relay");
  assert.equal(activateSlot(state, "L1C1").ok, true);
  assert.equal(snapshot(state).towers[0].mod, "relay");
});

test("pause, soft reset, and hard reset keep the run controllable", () => {
  const state = createGame();
  startGame(state);
  buildTower(state, "L3C2", "sentry");
  launchWave(state);
  advanceByMs(state, getStepMs() * 8);
  const tickBeforePause = state.tick;

  togglePause(state);
  advanceByMs(state, getStepMs() * 10);
  assert.equal(state.mode, "paused");
  assert.equal(state.tick, tickBeforePause);

  togglePause(state);
  softResetRun(state);
  assert.equal(state.mode, "briefing");
  assert.equal(state.wave, 0);
  assert.equal(state.towers.length, 0);

  hardResetToTitle(state);
  assert.equal(state.mode, "title");
});

test("scripted route renders a stable victory snapshot", () => {
  const state = createGame();
  scriptedRoute(state);

  const payload = JSON.parse(renderGameToText(state));

  assert.equal(payload.mode, "victory");
  assert.equal(payload.clearedWaves, 4);
  assert.equal(payload.border > 0, true);
  assert.equal(payload.score >= 2600, true);
  assert.equal(payload.lanes[2].towers.some((tower) => tower.mod === "relay"), true);
});
