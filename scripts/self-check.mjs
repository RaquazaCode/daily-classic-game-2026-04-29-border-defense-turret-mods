import {
  advanceByMs,
  applyMod,
  buildTower,
  createGame,
  getStepMs,
  launchWave,
  renderGameToText,
  selectBuildType,
  selectModKey,
  startGame,
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

const state = createGame(20260429);
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
if (!advanceUntil(state, () => state.mode === "intermission")) {
  throw new Error("self-check failed during wave 1");
}

selectBuildType(state, "sentry");
buildTower(state, "L4C3");
selectModKey(state, "frost");
applyMod(state, "L4C3");

launchWave(state);
if (!advanceUntil(state, () => state.mode === "intermission")) {
  throw new Error("self-check failed during wave 2");
}

selectBuildType(state, "cannon");
buildTower(state, "L3C4");

launchWave(state);
if (!advanceUntil(state, () => state.mode === "intermission")) {
  throw new Error("self-check failed during wave 3");
}

launchWave(state);
if (!advanceUntil(state, () => state.mode === "victory")) {
  throw new Error("self-check failed during wave 4");
}

const payload = JSON.parse(renderGameToText(state));
if (payload.border <= 0 || payload.clearedWaves !== 4 || payload.score < 2600) {
  throw new Error("self-check failed: scripted defense did not preserve the border strongly enough");
}

console.log("self-check complete");
