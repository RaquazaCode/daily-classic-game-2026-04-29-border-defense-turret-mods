import {
  MOD_TYPES,
  SLOT_LAYOUT,
  TOTAL_WAVES,
  TRACK_LENGTH,
  TOWER_TYPES,
  activateCursor,
  activateSlot,
  advanceTime,
  createGame,
  getCursorSlotId,
  launchWave,
  moveCursor,
  renderGameToText,
  selectBuildType,
  selectModKey,
  softResetRun,
  startGame,
  togglePause,
} from "./game-core.js";

const app = document.querySelector("#app");
const params = new URLSearchParams(window.location.search);
const automationMode = params.has("automation");
const state = createGame(20260429);

const laneLabels = [
  { name: "North Gate", copy: "Fast breach lane" },
  { name: "North Watch", copy: "Shield pressure" },
  { name: "Central Wall", copy: "Primary kill zone" },
  { name: "South Watch", copy: "Crossfire pocket" },
  { name: "South Gate", copy: "Late-wave sweep" },
];

let lastFrame = performance.now();
let dirty = true;

function getMapBox() {
  if (window.innerWidth <= 720) {
    return {
      left: 66,
      top: 116,
      width: 236,
      height: 344,
    };
  }

  if (window.innerWidth <= 1120) {
    return {
      left: 102,
      top: 116,
      width: 460,
      height: 344,
    };
  }

  return {
    left: 116,
    top: 116,
    width: 622,
    height: 344,
  };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function trackToPx(progress) {
  const mapBox = getMapBox();
  return mapBox.left + clamp(progress, -0.42, TRACK_LENGTH) * (mapBox.width / TRACK_LENGTH);
}

function laneToPx(lane) {
  const mapBox = getMapBox();
  const laneStep = mapBox.height / 4;
  return mapBox.top + lane * laneStep;
}

function getPrimaryLabel() {
  if (state.mode === "title") {
    return "Start Deployment";
  }
  if (state.mode === "briefing" || state.mode === "intermission") {
    return `Launch Wave ${state.wave + 1}`;
  }
  if (state.mode === "paused") {
    return "Resume Wave";
  }
  if (state.mode === "victory" || state.mode === "defeat") {
    return "Redeploy";
  }
  return "Line Active";
}

function getPrimaryDisabled() {
  return state.mode === "playing";
}

function getModeLabel() {
  return {
    title: "Standby",
    briefing: "Deployment",
    intermission: "Intermission",
    playing: "Live Wave",
    paused: "Paused",
    victory: "Secured",
    defeat: "Collapsed",
  }[state.mode];
}

function getSignalTone(label) {
  if (label === "Integrity") {
    return state.border <= 6 ? "danger" : state.border <= 10 ? "warning" : "success";
  }
  if (label === "Mode") {
    return state.mode === "defeat" ? "danger" : state.mode === "victory" ? "success" : "warning";
  }
  return "default";
}

function getProjectileTone(projectile) {
  if (projectile.accent === MOD_TYPES.frost.accent) {
    return "blue";
  }
  if (projectile.accent === MOD_TYPES.burst.accent) {
    return "red";
  }
  if (projectile.accent === MOD_TYPES.relay.accent) {
    return "lime";
  }
  if (projectile.accent === TOWER_TYPES.cannon.accent) {
    return "orange";
  }
  return "teal";
}

function handlePrimary() {
  if (state.mode === "title" || state.mode === "victory" || state.mode === "defeat") {
    startGame(state);
  } else if (state.mode === "briefing" || state.mode === "intermission") {
    launchWave(state);
  } else if (state.mode === "paused") {
    togglePause(state);
  }
  dirty = true;
}

function handleReset() {
  softResetRun(state);
  dirty = true;
}

function renderSignals() {
  const items = [
    { label: "Mode", value: getModeLabel() },
    { label: "Wave", value: `${state.wave}/${TOTAL_WAVES}` },
    { label: "Credits", value: state.credits },
    { label: "Integrity", value: state.border },
  ];

  return items
    .map(
      (item) => `
        <article class="signal" data-tone="${getSignalTone(item.label)}">
          <span class="signal-label">${item.label}</span>
          <span class="signal-value">${item.value}</span>
        </article>
      `
    )
    .join("");
}

function renderBuildButtons() {
  return Object.values(TOWER_TYPES)
    .map(
      (tower) => `
        <button
          class="tool-button"
          type="button"
          data-build="${tower.key}"
          data-selected="${state.activeTool === "build" && state.selectedBuildType === tower.key}"
          data-tone="${tower.key}"
        >
          <span class="tool-title">${tower.label}</span>
          <span class="tool-meta">
            <span>${tower.cost} credits</span>
            <span>${tower.damage.toFixed(1)} dmg</span>
          </span>
        </button>
      `
    )
    .join("");
}

function renderModButtons() {
  return Object.values(MOD_TYPES)
    .map(
      (mod) => `
        <button
          class="chip-button"
          type="button"
          data-mod="${mod.key}"
          data-selected="${state.activeTool === "mod" && state.selectedModKey === mod.key}"
          data-tone="${mod.key}"
        >
          <span class="tool-title">${mod.label}</span>
          <span class="tool-meta">
            <span>${mod.cost} credits</span>
            <span>${mod.key === "relay" ? "all-lane reach" : mod.key === "frost" ? "slow fire" : "burst volleys"}</span>
          </span>
        </button>
      `
    )
    .join("");
}

function renderSlots() {
  const cursorId = getCursorSlotId(state);

  return SLOT_LAYOUT.map((slot) => {
    const tower = state.towers.find((entry) => entry.slotId === slot.id);
    const left = trackToPx(slot.x) - 29;
    const top = laneToPx(slot.lane) - 29;
    const ready = !tower && state.activeTool === "build" && state.credits >= TOWER_TYPES[state.selectedBuildType].cost;
    const modBadge = tower?.mod
      ? `<span class="mod-badge" style="color:${MOD_TYPES[tower.mod].accent}">${tower.mod.slice(0, 1)}</span>`
      : "";

    return `
      <button
        type="button"
        class="slot-button"
        data-slot-id="${slot.id}"
        data-lane="${slot.lane}"
        data-column="${slot.column}"
        data-cursor="${cursorId === slot.id}"
        data-occupied="${Boolean(tower)}"
        data-ready="${ready}"
        style="left:${left}px; top:${top}px;"
        aria-label="Build pad ${slot.id}"
      >
        ${
          tower
            ? `
              <span class="tower-stack" data-type="${tower.type}">
                <span class="tower-ring"></span>
                <span class="tower-body"></span>
                <span class="tower-barrel"></span>
                ${modBadge}
              </span>
            `
            : ""
        }
      </button>
    `;
  }).join("");
}

function renderEnemies() {
  return state.enemies
    .map((enemy) => {
      const width = enemy.kind === "tank" ? 50 : 42;
      const height = 34;
      const left = trackToPx(enemy.progress) - width / 2;
      const top = laneToPx(enemy.lane) - height / 2;
      const hpRatio = `${Math.max(0, Math.min(100, (enemy.hp / enemy.maxHp) * 100))}%`;
      return `
        <div
          class="enemy"
          data-kind="${enemy.kind}"
          style="left:${left}px; top:${top}px;"
        >
          <div class="enemy-health"><span style="width:${hpRatio}"></span></div>
        </div>
      `;
    })
    .join("");
}

function renderProjectiles() {
  return state.projectiles
    .map((projectile) => `
      <div
        class="projectile"
        data-tone="${getProjectileTone(projectile)}"
        style="left:${trackToPx(projectile.x) - 6}px; top:${laneToPx(projectile.y) - 6}px;"
      ></div>
    `)
    .join("");
}

function renderLaneMarkup() {
  const ribbonLeft = window.innerWidth <= 720 ? 48 : 76;
  const ribbonRight = window.innerWidth <= 720 ? 30 : 78;

  return laneLabels
    .map(
      (lane, index) => `
        <div class="lane-ribbon" style="top:${laneToPx(index)}px; left:${ribbonLeft}px; right:${ribbonRight}px;"></div>
        <div class="lane-label" style="top:${laneToPx(index)}px">
          <strong>${lane.name}</strong>
          <span>${lane.copy}</span>
        </div>
      `
    )
    .join("");
}

function renderOverlay() {
  if (state.mode !== "title" && state.mode !== "paused" && state.mode !== "victory" && state.mode !== "defeat") {
    return "";
  }

  const copy = {
    title: {
      heading: "Hold The Border",
      body: "Mod each turret to suit the lane, route fire across the central wall, and keep every raider wave away from the frontier line.",
    },
    paused: {
      heading: "Simulation Paused",
      body: "The frontline clock is frozen. Resume when you want the wave pressure back.",
    },
    victory: {
      heading: "Border Secured",
      body: `You held all ${TOTAL_WAVES} waves with ${state.border} integrity still standing. Press Enter or redeploy to run it back.`,
    },
    defeat: {
      heading: "Line Broken",
      body: "Too many raiders breached the frontier. Reset to briefing and refit the turret layout.",
    },
  }[state.mode];

  return `
    <div class="overlay">
      <div class="overlay-card">
        <h2>${copy.heading}</h2>
        <p>${copy.body}</p>
        <div class="overlay-actions">
          <button class="action-button" type="button" data-action="primary">${getPrimaryLabel()}</button>
          ${state.mode === "paused" ? '<button class="ghost-button" type="button" data-action="reset">Reset Run</button>' : ""}
        </div>
      </div>
    </div>
  `;
}

function renderIntelReadout() {
  if (state.towers.length === 0) {
    return `
      <article>
        <h4>No turrets emplaced</h4>
        <p>Use the left rail or ` + "`1` / `2`" + ` to stake the first line.</p>
      </article>
    `;
  }

  return state.towers
    .map((tower) => {
      const type = TOWER_TYPES[tower.type];
      const mod = tower.mod ? MOD_TYPES[tower.mod] : null;
      return `
        <article>
          <h4>${tower.slotId} · ${type.label}</h4>
          <p>${mod ? `${mod.label} fitted` : "Base chassis only"} · ${tower.shotsFired} volleys fired</p>
        </article>
      `;
    })
    .join("");
}

function renderKeyHints() {
  const hints = [
    ["Enter", "Start or redeploy"],
    ["Space", "Launch next wave"],
    ["1 / 2", "Select chassis"],
    ["Q / W / E", "Select mod core"],
    ["Arrows", "Move keyboard cursor"],
    ["P / R", "Pause or reset run"],
  ];

  return hints
    .map(
      ([key, copy]) => `
        <li class="key-item">
          <strong>${key}</strong>
          <span>${copy}</span>
        </li>
      `
    )
    .join("");
}

function render() {
  if (!dirty) {
    return;
  }

  app.innerHTML = `
    <div class="shell">
      <section id="board">
        <div class="board-grid">
          <header class="masthead">
            <div class="brand-lockup">
              <span class="eyebrow">Deterministic Defense Run</span>
              <h1 class="title">Border Defense</h1>
              <p class="subtitle">
                Frontline strategy remake with modular turrets, fixed wave timing, and browser hooks
                built for unattended capture and replayable score runs.
              </p>
            </div>
            <div class="signal-grid">${renderSignals()}</div>
          </header>

          <aside class="control-rail">
            <section class="panel control-panel">
              <h2>Command</h2>
              <p class="panel-copy">Deploy, pause, or reset the run. The primary action changes with the current state.</p>
              <div class="button-stack">
                <button class="action-button" type="button" data-action="primary" ${getPrimaryDisabled() ? "disabled" : ""}>${getPrimaryLabel()}</button>
                <button class="ghost-button" type="button" data-action="pause" ${state.mode !== "playing" && state.mode !== "paused" ? "disabled" : ""}>${state.mode === "paused" ? "Resume" : "Pause"}</button>
                <button class="ghost-button" type="button" data-action="reset" ${state.mode === "title" ? "disabled" : ""}>Reset Run</button>
              </div>
            </section>

            <section class="panel control-panel">
              <h3>Turret Chassis</h3>
              <p class="panel-copy">Pick the active build tool, then click or confirm a pad.</p>
              <div class="chip-stack">${renderBuildButtons()}</div>
            </section>

            <section class="panel control-panel">
              <h3>Mod Cores</h3>
              <p class="panel-copy">Select a core, then click an unmodded turret to fit it.</p>
              <div class="chip-stack">${renderModButtons()}</div>
            </section>
          </aside>

          <main class="battlefield-shell">
            <section class="battlefield">
              <div class="map-caption">
                <strong>Frontline Map</strong>
                <span>${state.lastEvent}</span>
              </div>
              ${renderLaneMarkup()}
              <div class="frontier-line" style="left:${trackToPx(TRACK_LENGTH) + (window.innerWidth <= 720 ? 8 : 18)}px"></div>
              ${renderSlots()}
              ${renderEnemies()}
              ${renderProjectiles()}
              ${renderOverlay()}
            </section>
            <div class="footer-strip">
              <span class="footer-chip">Active tool: ${state.activeTool === "build" ? TOWER_TYPES[state.selectedBuildType].label : MOD_TYPES[state.selectedModKey].label}</span>
              <span class="footer-chip">Kills: ${state.kills}</span>
              <span class="footer-chip">Leaks: ${state.leaks}</span>
              <span class="footer-chip">High score: ${state.highScore}</span>
            </div>
          </main>

          <aside class="intel-rail">
            <section class="panel intel-card">
              <h3>Frontline Intel</h3>
              <ul class="intel-list">
                <li class="intel-item"><strong>Score</strong><span>${state.score}</span></li>
                <li class="intel-item"><strong>Turrets</strong><span>${state.towers.length}</span></li>
                <li class="intel-item"><strong>Hostiles Live</strong><span>${state.enemies.length}</span></li>
                <li class="intel-item"><strong>Projectiles</strong><span>${state.projectiles.length}</span></li>
              </ul>
            </section>

            <section class="panel intel-card">
              <h3>Turret Readout</h3>
              <div class="tower-readout">${renderIntelReadout()}</div>
            </section>

            <section class="panel intel-card">
              <h3>Recent Events</h3>
              <ul class="event-list">
                ${state.events
                  .slice()
                  .reverse()
                  .map(
                    (event, index) => `
                      <li class="event-item">
                        <strong>${String(index + 1).padStart(2, "0")}</strong>
                        <span>${event}</span>
                      </li>
                    `
                  )
                  .join("")}
              </ul>
            </section>

            <section class="panel intel-card">
              <h3>Controls</h3>
              <ul class="key-list">${renderKeyHints()}</ul>
            </section>
          </aside>
        </div>
      </section>
    </div>
  `;

  dirty = false;
}

function markDirtyIfChanged(previousTick, previousMode, previousScore, previousBorder, previousCredits, previousEnemies, previousProjectiles) {
  if (
    previousTick !== state.tick ||
    previousMode !== state.mode ||
    previousScore !== state.score ||
    previousBorder !== state.border ||
    previousCredits !== state.credits ||
    previousEnemies !== state.enemies.length ||
    previousProjectiles !== state.projectiles.length
  ) {
    dirty = true;
  }
}

function handleBoardClick(event) {
  const actionTarget = event.target.closest("[data-action]");
  if (actionTarget) {
    const action = actionTarget.dataset.action;
    if (action === "primary") {
      handlePrimary();
    } else if (action === "pause") {
      togglePause(state);
      dirty = true;
    } else if (action === "reset") {
      handleReset();
    }
    render();
    return;
  }

  const buildTarget = event.target.closest("[data-build]");
  if (buildTarget) {
    selectBuildType(state, buildTarget.dataset.build);
    dirty = true;
    render();
    return;
  }

  const modTarget = event.target.closest("[data-mod]");
  if (modTarget) {
    selectModKey(state, modTarget.dataset.mod);
    dirty = true;
    render();
    return;
  }

  const slotTarget = event.target.closest("[data-slot-id]");
  if (slotTarget) {
    state.cursor = {
      lane: Number(slotTarget.dataset.lane),
      column: Number(slotTarget.dataset.column),
    };
    activateSlot(state, slotTarget.dataset.slotId);
    dirty = true;
    render();
  }
}

function handleKeydown(event) {
  if (event.metaKey || event.ctrlKey || event.altKey) {
    return;
  }

  let consumed = true;
  switch (event.key) {
    case "Enter":
      if (state.mode === "title" || state.mode === "victory" || state.mode === "defeat") {
        startGame(state);
      } else {
        consumed = false;
      }
      break;
    case " ":
    case "Spacebar":
      launchWave(state);
      break;
    case "1":
      selectBuildType(state, "sentry");
      break;
    case "2":
      selectBuildType(state, "cannon");
      break;
    case "q":
    case "Q":
      selectModKey(state, "burst");
      break;
    case "w":
    case "W":
      selectModKey(state, "frost");
      break;
    case "e":
    case "E":
      selectModKey(state, "relay");
      break;
    case "ArrowLeft":
      moveCursor(state, -1, 0);
      break;
    case "ArrowRight":
      moveCursor(state, 1, 0);
      break;
    case "ArrowUp":
      moveCursor(state, 0, -1);
      break;
    case "ArrowDown":
      moveCursor(state, 0, 1);
      break;
    case "x":
    case "X":
      activateCursor(state);
      break;
    case "p":
    case "P":
      togglePause(state);
      break;
    case "r":
    case "R":
      softResetRun(state);
      break;
    default:
      consumed = false;
  }

  if (consumed) {
    event.preventDefault();
    dirty = true;
    render();
  }
}

function frame(now) {
  const delta = Math.min(160, now - lastFrame);
  lastFrame = now;

  const previousTick = state.tick;
  const previousMode = state.mode;
  const previousScore = state.score;
  const previousBorder = state.border;
  const previousCredits = state.credits;
  const previousEnemies = state.enemies.length;
  const previousProjectiles = state.projectiles.length;

  if (!automationMode) {
    advanceTime(state, delta);
    markDirtyIfChanged(
      previousTick,
      previousMode,
      previousScore,
      previousBorder,
      previousCredits,
      previousEnemies,
      previousProjectiles
    );
    render();
    window.requestAnimationFrame(frame);
  }
}

app.addEventListener("click", handleBoardClick);
window.addEventListener("keydown", handleKeydown);
window.addEventListener("resize", () => {
  dirty = true;
  render();
});

window.advanceTime = (ms) => {
  const previousTick = state.tick;
  const previousMode = state.mode;
  const previousScore = state.score;
  const previousBorder = state.border;
  const previousCredits = state.credits;
  const previousEnemies = state.enemies.length;
  const previousProjectiles = state.projectiles.length;
  advanceTime(state, ms);
  markDirtyIfChanged(
    previousTick,
    previousMode,
    previousScore,
    previousBorder,
    previousCredits,
    previousEnemies,
    previousProjectiles
  );
  render();
  return renderGameToText(state);
};

window.render_game_to_text = () => renderGameToText(state);
window.__borderDefense = {
  state,
  handlePrimary,
};

render();
if (!automationMode) {
  window.requestAnimationFrame(frame);
}
