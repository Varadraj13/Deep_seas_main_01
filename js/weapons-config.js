// Auto-generated from effect_matrix_v4.xlsx by scripts/parse_effect_matrix.py
// Do not edit manually. Re-run: python scripts/parse_effect_matrix.py
// ================================================================
const WEAPONS_CONFIG = {
  "weapons": [
    {
      "id": "D01",
      "name": "Strait closure / naval blockade",
      "player": "disruptor",
      "speed": "fast",
      "prob_delta": 22.0,
      "onset_s": 0.0,
      "decay_per_30s": -2.0,
      "build_per_30s": 0.0,
      "sim_consequence": "Ships in Hormuz lane halt. Spawn rate −80%. Oil cargo frozen. Lane goes dark on map.",
      "counter_weapons": "D01→naval_escort (full cancel), D01→coalition_formation (partial)",
      "sim_trigger_keys": {
        "speed_mult": 0.05,
        "spawn_rate_mult": 0.2,
        "hormuz_lane": "closed"
      },
      "ships_at_t0": 0.0
    },
    {
      "id": "D02",
      "name": "Sanctions package",
      "player": "disruptor",
      "speed": "slow",
      "prob_delta": 8.0,
      "onset_s": 60.0,
      "decay_per_30s": 0.0,
      "build_per_30s": 3.0,
      "sim_consequence": "Trade volume on flagged routes drops gradually. Ship speed −40%. Cargo value multiplier decreases. Compounds with other disruptor weapons.",
      "counter_weapons": "D02→diplomatic_backchannel (freezes build), D02→coalition_formation (reverses slowly)",
      "sim_trigger_keys": {
        "speed_mult": 0.6,
        "cargo_value_mult": 0.7,
        "sanctions_active": true
      },
      "ships_at_t0": 12.0
    },
    {
      "id": "D03",
      "name": "Tanker seizure",
      "player": "disruptor",
      "speed": "fast",
      "prob_delta": 14.0,
      "onset_s": 0.0,
      "decay_per_30s": -1.0,
      "build_per_30s": 0.0,
      "sim_consequence": "One vessel class removed from simulation. Economic output drops proportionally. Slow decay — ship stays gone unless released.",
      "counter_weapons": "D03→emergency_reflagging (restores vessel), D03→naval_escort (prevents further)",
      "sim_trigger_keys": {
        "remove_vessel_class": "tanker",
        "economic_output_mult": 0.75
      },
      "ships_at_t0": 15.0
    },
    {
      "id": "D04",
      "name": "Drone / missile strike on port",
      "player": "disruptor",
      "speed": "fast",
      "prob_delta": 18.0,
      "onset_s": 0.0,
      "decay_per_30s": -1.5,
      "build_per_30s": 0.0,
      "sim_consequence": "Port spawn node disabled. Ships queue, cannot load/unload. Irreversible within round unless defender uses alt route.",
      "counter_weapons": "D04→alternative_route (bypasses port)",
      "sim_trigger_keys": {
        "port_node": "disabled",
        "spawn_blocked": true
      },
      "ships_at_t0": 0.0
    },
    {
      "id": "D05",
      "name": "Insurance market suspension",
      "player": "disruptor",
      "speed": "slow",
      "prob_delta": 6.0,
      "onset_s": 90.0,
      "decay_per_30s": 0.0,
      "build_per_30s": 4.0,
      "sim_consequence": "Most powerful slow weapon. Ships stop moving globally. Build accelerates if no counter. Fear makes risk real — models Lloyd's effect.",
      "counter_weapons": "D05→SPR_release (breaks fear signal), D05→diplomatic_backchannel (partial freeze)",
      "sim_trigger_keys": {
        "global_movement_mult": 0.3,
        "insurance_active": false,
        "fear_signal": true
      },
      "ships_at_t0": 2.0
    },
    {
      "id": "D06",
      "name": "Cyber attack on port logistics",
      "player": "disruptor",
      "speed": "fast",
      "prob_delta": 12.0,
      "onset_s": 0.0,
      "decay_per_30s": -2.0,
      "build_per_30s": 0.0,
      "sim_consequence": "Traffic routing broken. Ships move but cannot reach destinations. Visible chaos without physical stop. Medium decay.",
      "counter_weapons": "D06→alternative_route (bypasses affected nodes)",
      "sim_trigger_keys": {
        "routing_broken": true,
        "destination_reach": false
      },
      "ships_at_t0": 8.0
    },
    {
      "id": "R01",
      "name": "Naval escort / freedom of navigation",
      "player": "defender",
      "speed": "fast",
      "prob_delta": -18.0,
      "onset_s": 0.0,
      "decay_per_30s": -1.5,
      "build_per_30s": 0.0,
      "sim_consequence": "Ships resume movement in contested lane. Fully counters strait closure. Escort protection degrades slowly — disruptor can re-engage after ~3 min.",
      "counter_weapons": "Counters: D01 (full), D03 (prevents further seizures)",
      "sim_trigger_keys": {
        "hormuz_lane": "open",
        "escort_active": true,
        "speed_mult": 1.0
      },
      "ships_at_t0": 20.0
    },
    {
      "id": "R02",
      "name": "Emergency re-flagging",
      "player": "defender",
      "speed": "fast",
      "prob_delta": -10.0,
      "onset_s": 0.0,
      "decay_per_30s": -0.5,
      "build_per_30s": 0.0,
      "sim_consequence": "Seized vessel returns to play under new flag. Very slow decay — lasts most of round. China/India flag signals bloc consolidation.",
      "counter_weapons": "Counters: D03 (full). Weak vs D02 (flag doesn't override sanctions).",
      "sim_trigger_keys": {
        "restore_vessel_class": "tanker",
        "reflag_active": true
      },
      "ships_at_t0": 20.0
    },
    {
      "id": "R03",
      "name": "Alternative route activation",
      "player": "defender",
      "speed": "fast",
      "prob_delta": -14.0,
      "onset_s": 30.0,
      "decay_per_30s": -1.0,
      "build_per_30s": 0.0,
      "sim_consequence": "Cape of Good Hope lane activates. Ships reroute — longer path, slower, but moving. Counters D04 and D06. Doesn't counter blockade directly.",
      "counter_weapons": "Counters: D04 (bypasses port), D06 (bypasses routing). Indirect only.",
      "sim_trigger_keys": {
        "cape_route": "active",
        "reroute_mult": 0.75,
        "alt_port": "enabled"
      },
      "ships_at_t0": 19.0
    },
    {
      "id": "R04",
      "name": "Diplomatic back-channel",
      "player": "defender",
      "speed": "slow",
      "prob_delta": -5.0,
      "onset_s": 60.0,
      "decay_per_30s": 0.0,
      "build_per_30s": -3.0,
      "sim_consequence": "Freezes any active slow disruptor weapon's build rate. Doesn't reverse immediately — buys time. Best combined with SPR release for full sanctions counter.",
      "counter_weapons": "Counters: D02 (freezes build), D05 (partial freeze). Useless vs fast weapons.",
      "sim_trigger_keys": {
        "sanctions_build_frozen": true,
        "insurance_build_frozen": true
      },
      "ships_at_t0": 20.0
    },
    {
      "id": "R05",
      "name": "Strategic petroleum reserve release",
      "player": "defender",
      "speed": "slow",
      "prob_delta": -8.0,
      "onset_s": 90.0,
      "decay_per_30s": 0.0,
      "build_per_30s": -2.0,
      "sim_consequence": "Decouples oil price from route closure. Angola/Venezuela signals non-Western alignment. Breaks fear signal driving insurance suspension.",
      "counter_weapons": "Counters: D05 (breaks fear signal). Weak vs physical weapons D01/D03/D04.",
      "sim_trigger_keys": {
        "oil_price_decoupled": true,
        "fear_signal": false,
        "spr_active": true
      },
      "ships_at_t0": 20.0
    },
    {
      "id": "R06",
      "name": "Coalition formation",
      "player": "defender",
      "speed": "slow",
      "prob_delta": -6.0,
      "onset_s": 120.0,
      "decay_per_30s": 0.0,
      "build_per_30s": -4.0,
      "sim_consequence": "Slowest weapon, highest ceiling. China/India: all active disruptor weapon decay 1.5x faster. Amplifies every active defender weapon. Deploy early.",
      "counter_weapons": "Force multiplier — not a direct counter. Amplifies: R01 R02 R03 R04 R05.",
      "sim_trigger_keys": {
        "disruptor_decay_mult": 1.5,
        "coalition_active": true,
        "defender_amplify": true
      },
      "ships_at_t0": 20.0
    }
  ],
  "interactions": [
    {
      "disruptor_id": "D01",
      "defender_id": "R01",
      "net_delta": 4.0,
      "outcome_winner": "disruptor",
      "mechanism": "Escort −18 vs blockade +22. Near-cancel. Disruptor maintains +4 edge. Defender must follow up.",
      "notes": "Most common opening exchange. Defender needs second weapon."
    },
    {
      "disruptor_id": "D05",
      "defender_id": "R05",
      "net_delta": 0.0,
      "outcome_winner": "neutral",
      "mechanism": "SPR breaks fear signal before insurance suspension builds. If R05 deployed before 90s onset, D05 never activates.",
      "notes": "Timing-critical. SPR must be deployed within first 90s of D05 trigger."
    },
    {
      "disruptor_id": "D02",
      "defender_id": "R04",
      "net_delta": 0.0,
      "outcome_winner": "defender",
      "mechanism": "Back-channel freezes sanctions build rate. Net prob stops climbing. Defender then has time for coalition.",
      "notes": "Requires follow-up. Back-channel alone doesn't reverse — just pauses."
    },
    {
      "disruptor_id": "D04",
      "defender_id": "R03",
      "net_delta": 4.0,
      "outcome_winner": "disruptor",
      "mechanism": "Alt route bypasses port but doesn't repair it. Both effects visible simultaneously on map.",
      "notes": "Port remains broken. Ships reroute but at 0.75x speed. Disruptor retains partial advantage."
    },
    {
      "disruptor_id": "D01+D02",
      "defender_id": "R01+R04",
      "net_delta": 12.0,
      "outcome_winner": "disruptor",
      "mechanism": "Fast+slow stack overwhelms paired defender. Escort handles blockade but back-channel too slow to stop sanctions.",
      "notes": "Disruptor wins by ~+12 at round end. Classic disruptor combo."
    },
    {
      "disruptor_id": "any",
      "defender_id": "R06 early",
      "net_delta": 0.0,
      "outcome_winner": "defender",
      "mechanism": "Coalition deployed in first 2 min: 1.5x decay on all active disruptor weapons. Compounds across full round.",
      "notes": "Dominant defender strategy. Earlier deployment = larger cumulative effect."
    },
    {
      "disruptor_id": "D03",
      "defender_id": "R02",
      "net_delta": 0.0,
      "outcome_winner": "neutral",
      "mechanism": "Re-flagging restores seized vessel fully. Very slow R02 decay means protection lasts most of round.",
      "notes": "China/India re-flag amplifies into coalition effect if R06 also active."
    },
    {
      "disruptor_id": "D06",
      "defender_id": "R03",
      "net_delta": 2.0,
      "outcome_winner": "disruptor",
      "mechanism": "Alt route bypasses broken routing nodes. Cyber attack chaos partially neutralised but not fully reversed.",
      "notes": "Disruptor retains small residual. Audience may not notice — map still shows disruption."
    }
  ]
};
