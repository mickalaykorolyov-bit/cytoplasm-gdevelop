# CYTOPLASM v0.9 — CELL ESCAPE

## One continuous ~3 minute micro-world level
Unlike isolated labs, this is a single horizontally scrolling, continuous **7100 px** level with 5 readable sections, many wide hazards, bacteria attacking with projectiles, roaming geometrically weird viruses, a charged membrane gate, checkpoint respawns, and a real exit reached by walking (never by shooting from afar). The 3-minute duration is a *design target*, not a forced countdown. Player skill changes completion time.

### Context reactions
- Basic jelly: a small trampoline, never a selectable special mode. Created by left-clicking and visually launching the gel from the hero to the cursor. Range 355 game pixels; walls block shots.
- Jelly + enemy projectile: a two-hit temporary shield; does not freeze enemies.
- Jelly + airborne organelle: freezes moving organic debris and becomes a bounce surface until dissolved or detonated.
- Jelly + strange virus: virus keeps roaming and inflates into a stronger but risky super-trampoline, bursting after ~5 seconds.
- Jelly + battery: electric surge permanently opens membrane gate and damages nearby bacteria.
- Jelly + hot gland: ignites and spreads fire damage to nearby pathogens.
- Jelly + existing jelly: detonates, with fragments and shockwave affecting enemies; R detonates selected pad.

### Biomass and survival
- Starts with 5 shots/charges; each shot costs 1. The hero's visible cytoplasm shell shrinks as charges decrease, while the nucleus stays centered.
- Jelly returns biomass after expiry/impact/detonation (some loss for blasts and shield hits); slow baseline regeneration is a softlock safety valve.
- Micro-capsules on the route add biomass. Destroyed bacteria sometimes drop extra capsules; viruses reliably do.
- Bio Surge flask: **30-second boost**, max capacity 8, immediately adds up to 4 charges and increases movement speed. Boost expires automatically.
- 3 HP nucleus. Hits from bacteria and viral contact hurt; falling/losing HP respawns at last checkpoint with at least 3 charges.

### Controls
A/D — move, W — jump, left-click — launch gel to the cursor, R — detonate gel nearest the cursor, N — restart entire level. **E has no action.** Keyboard handling uses physical key codes and works with Ukrainian layout.

### Tech
`index.html`: self-contained no-CDN web game, 960×540 internal raster with 1280×720 logical game, capped redraws. `GameCore_v090.js`: framework-independent core. `GameScene_v090.js` + `Cytoplasm_GDevelop_v090.json`: GDevelop JavaScript-event project. No gameplay networking.

### Test guide
1. Try crossing first gap without gel (it is intentionally too wide).
2. Shoot a gel at (roughly) the middle of the gap, jump onto it, bounce with W.
3. On bacteria, place gel between the bacterial bullet and the nucleus: shield absorbs shots.
4. Watch the nucleus shell shrink after shots and regrow on refunds and capsules.
5. At virus, shoot it to inflate; it should keep moving, not freeze. Bounce or detonate it.
6. Pick up the flask: timer starts at 30 s and shots cap rises to 8.
7. At electric gate, shoot battery on **your side** to open membrane.
8. Reach exit physically; shots cannot activate it.

**Balance:** Mechanisms have been programmatically smoke-tested; the exact 3-minute completion target must be tuned through human playtesting.