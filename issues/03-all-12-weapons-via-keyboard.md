# Phase 3: All 12 weapons via keyboard

**Type:** AFK

## What to build

Load the full effect matrix (6 disruptor + 6 defender weapons) from weapons_config.json. Map each weapon to a keyboard key. Fast weapons (D01, D03, D04, D06, R01, R02, R03) apply their delta immediately and decay over time. Slow weapons (D02, D05, R04, R05, R06) have an onset delay (60-120s) before activating, then build continuously.

Each weapon writes its own `sim_trigger_keys` directly into `marketState.simMultipliers`. The keys are weapon-specific (from the xlsx). This phase activates ALL remaining simMultiplier keys that Phase 1 didn't need, and adds simulation readers for each one.

**New sim_trigger_keys activated in this phase:**
- D02: `speed_mult=0.6`, `cargo_value_mult=0.7`, `sanctions_active=true`
- D03: `remove_vessel_class=tanker`, `economic_output_mult=0.75`
- D04: `port_node=disabled`, `spawn_blocked=true`
- D05: `global_movement_mult=0.3`, `insurance_active=false`, `fear_signal=true`
- D06: `routing_broken=true`, `destination_reach=false`
- R01: `hormuz_lane=open`, `escort_active=true`, `speed_mult=1.0`
- R02: `restore_vessel_class=tanker`, `reflag_active=true`
- R03: `cape_route=active`, `reroute_mult=0.75`, `alt_port=enabled`
- R04: `sanctions_build_frozen=true`, `insurance_build_frozen=true`
- R05: `oil_price_decoupled=true`, `fear_signal=false`, `spr_active=true`
- R06: `disruptor_decay_mult=1.5`, `coalition_active=true`, `defender_amplify=true`

## Acceptance criteria

- [ ] weapons_config.json loaded at runtime (already generated from xlsx by parse script)
- [ ] Keyboard mapping: keys 1-6 for disruptor (D01-D06), keys Q-Y for defender (R01-R06)
- [ ] Fast weapons fire immediately: D01 (+22), D03 (+14), D04 (+18), D06 (+12), R01 (-18), R02 (-10), R03 (-14, 30s onset)
- [ ] Slow weapons onset then build: D02 (+8, 60s, +3/30s), D05 (+6, 90s, +4/30s), R04 (-5, 60s, -3/30s), R05 (-8, 90s, -2/30s), R06 (-6, 120s, -4/30s)
- [ ] Each weapon's sim_trigger_keys written to simMultipliers on fire
- [ ] simulation.js has readers for every new key:
  - `cargo_value_mult`: scales cargo.value display/economics
  - `remove_vessel_class`/`restore_vessel_class`: hides/shows tanker-type vessels
  - `economic_output_mult`: scales economic output calculations
  - `port_node`/`spawn_blocked`: disables port spawning when port struck
  - `global_movement_mult`: additional speed scaling (stacks with speed_mult)
  - `insurance_active`/`fear_signal`: visual indicator + fear_dampener effect
  - `routing_broken`/`destination_reach`: ships move but don't progress toward destination
  - `escort_active`/`reflag_active`: visual indicators on protected vessels
  - `cape_route`/`reroute_mult`/`alt_port`: alternative routing with speed penalty
  - `sanctions_build_frozen`/`insurance_build_frozen`: freezes slow weapon build in marketTick
  - `oil_price_decoupled`/`spr_active`: breaks fear_signal effect
  - `disruptor_decay_mult`/`coalition_active`/`defender_amplify`: 1.5x decay on disruptor weapons
- [ ] Slow weapons show "pending" state during onset, then activate
- [ ] Each weapon visibly changes ship behavior differently (blockade stops ships vs. seizure removes tankers vs. cyber breaks routing)
- [ ] Console or status bar shows which weapon was fired and current prob
- [ ] When weapon decays fully or is countered, its simMultiplier keys reset to defaults
- [ ] Test: each fast weapon applies correct immediate delta
- [ ] Test: each slow weapon activates only after onset_s elapsed
- [ ] Test: slow weapon build rate compounds correctly over multiple ticks
- [ ] Test: R06 force multiplier increases disruptor weapon decay by 1.5x
- [ ] Test: each weapon's sim_trigger_keys are written correctly to simMultipliers
- [ ] Test: conflicting keys (e.g., D01 sets speed_mult=0.05, R01 sets speed_mult=1.0) resolve to last-written value

## Blocked by

- Blocked by Phase 2 (marketTick decay/build loop must exist)
