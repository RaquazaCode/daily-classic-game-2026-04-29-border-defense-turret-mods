# Implementation Plan

## MVP

- Build a deterministic five-lane border defense simulation with fixed waves and score rules.
- Support turret placement, mod fitting, pause, reset, restart, and browser automation hooks.
- Deliver automated Playwright captures with the required action payload schema and GIF clips.

## Scripted Winning Route

- Start deployment and place a `Sentinel` on `L3C2`.
- Fit `Relay Core` to that central turret for full-lane support.
- Place a `Breaker` on `L2C3` and fit `Burst Core`.
- Clear wave 1, then add a `Sentinel` on `L4C3` and fit `Frost Core`.
- Clear wave 2, place a final `Breaker` on `L3C4`, and ride the deterministic layout through waves 3 and 4.

## Planned Controls

- `Enter`: start or restart a run
- `Space`: launch the next wave
- `1` / `2`: select turret chassis
- `Q` / `W` / `E`: select mod core
- `Arrow` keys: move the keyboard cursor between build pads
- `X`: place a turret or fit the selected core at the current cursor pad
- `P`: pause
- `R`: reset to deployment
