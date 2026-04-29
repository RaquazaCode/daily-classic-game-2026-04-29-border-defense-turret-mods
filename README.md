# daily-classic-game-2026-04-29-border-defense-turret-mods

<div align="center">
  <h3>Border Defense with modular turrets, deterministic wave pressure, and a stylized frontline command board.</h3>
  <p>Prepare the line, fit each turret with the right mod core, and stop every raider wave before the frontier cracks.</p>
</div>

<div align="center">
  <p>Media captures will be added after implementation and verification.</p>
</div>

## Quick Start
- `pnpm install`
- `pnpm dev`
- Open `http://127.0.0.1:4173/src/`

## How To Play
- Press `Enter` to open the deployment phase.
- Use the on-screen loadout or keyboard shortcuts to place turrets and fit mod cores.
- Launch waves, pause with `P`, and reset the run with `R`.

## Rules
- Deterministic lane waves march toward the border until cleared or leaked.
- Turret placement, credits, and mod cores shape every run.
- If the border integrity drops to zero, the run ends.

## Scoring
- Kills, clean waves, and saved integrity award points.
- Better mod choices create stronger score chains.

## Twist
- **Turret Mods**: each emplaced turret can be tuned with a special mod core that changes its battlefield role.

## Verification
- `pnpm test`
- `pnpm build`
- `pnpm capture`
- Browser hooks:
  - `window.advanceTime(ms)`
  - `window.render_game_to_text()`

## Project Layout
- `src/` gameplay code and UI
- `assets/` static visual assets
- `docs/plans/` implementation notes and capture payloads
- `tests/` deterministic simulation checks
- `scripts/` build, self-check, and capture scripts

## GIF Captures
- `Opening Setup` - pending implementation
- `Turret Mod Fit` - pending implementation
- `Border Hold` - pending implementation
