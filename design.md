# Design Direction

## Visual Thesis

- Build the game as a frontier command table at dusk: all panels feel like hardened glass hovering over a glowing border map.
- Keep the palette grounded in oxidized teal, pale sand, ember orange, and warning red so the interface reads tactical instead of arcade-neon.
- Use condensed typography, strong uppercase labels, and rounded capsules to make the UI feel decisive without drifting into military parody.

## Layout System

- Three-column shell on desktop: command rail, battlefield, intel rail.
- Single-column stack on mobile with the same panel order so the controls remain understandable without horizontal scrolling.
- The battlefield stays readable at every breakpoint by scaling the slot geometry rather than clipping the map.

## Moment-to-Moment Motion

- Projectiles streak with color-coded glows based on chassis or mod core.
- The battlefield overlay uses blur rather than opacity blocks so pause and victory states still feel spatially connected to the action.
- Build pads keep a soft hover lift and cursor ring to make keyboard and mouse control equally legible.

## Gameplay Readability

- `Sentinel` and `Breaker` silhouettes stay visually distinct even inside compact 58px pads.
- Mod badges use single-letter identifiers plus accent color so `Relay`, `Burst`, and `Frost` can be scanned quickly during captures.
- The right rail repeats live score, turret count, and recent events so the automation text dump and visual state tell the same story.
