'use strict';
const TIER1_BALANCE=Object.freeze({
  "schema_version": "1.0.0",
  "project": "Echoes of Aeltharis",
  "artifact_type": "alpha_implementation_spec",
  "scope": {
    "playable_class": "mage",
    "dungeon": "The Sepulcher of the Forsaken",
    "dungeon_levels": [
      1,
      2,
      3,
      4,
      5
    ],
    "equipment_tier": 1,
    "future_classes": [
      "paladin",
      "ranger"
    ]
  },
  "implementation_instructions": {
    "goal": "Implement agreed relic economy, Tier 1 equipment and combat balance in existing project, preserving existing art, animations, narrative, navigation and save architecture.",
    "no_git_push_without_explicit_request": true,
    "implementation_order": [
      "inspect existing game code/data and saves",
      "introduce versioned balance configuration and adapters",
      "migrate existing saves safely",
      "implement equipment stats, damage types and combat actions",
      "implement relics, class-specific cracking and extraction",
      "implement potion inventory/belt and shop/rest",
      "apply enemy and boss balance",
      "run automated tests and manual smoke tests"
    ],
    "rules": [
      "Treat status=agreed as desired behavior; provisional numeric values are tunable alpha defaults.",
      "Do not create or activate Paladin/Ranger content in Alpha.",
      "Preserve existing ability visual effects and attack animation timing; do not replace animations as part of balancing.",
      "Use one centralized config; avoid duplicating numeric values in UI and combat logic.",
      "Where current implementation differs from a provisional value, log discrepancy and apply config default only if no established intentional value is found.",
      "Ensure transactional save updates; do not permit duplicate relic rewards, item duplication or negative inventories.",
      "Do not modify remote repository or deploy unless separately requested."
    ]
  },
  "constants": {
    "base_hp": 70,
    "base_mana": 50,
    "primary_stat_damage_divisor": 100,
    "defense_curve_constant": 100,
    "base_dodge_chance": 0.05,
    "dodge_scale": 0.3,
    "dodge_curve_constant": 100,
    "base_crit_chance": 0.05,
    "crit_multiplier": 1.5,
    "boss_special_damage_multiplier": 1.5,
    "potion_restore_fraction": 0.3,
    "max_dodge_chance": 0.6
  },
  "combat": {
    "status": "agreed_mechanics_provisional_coefficients",
    "stats": {
      "primary_for_mage": "intelligence",
      "health_from": "vitality",
      "mana_from": "intelligence",
      "dodge_from": "agility",
      "physical_reduction_from": "armor",
      "magical_reduction_from": "resistance",
      "luck": "remove_from_new_balance_and_new_items",
      "level_stat_growth": false
    },
    "formulas": {
      "max_hp": "70 + total_equipment_vitality",
      "max_mana": "50 + total_equipment_intelligence",
      "base_hit": "uniform_integer(weapon_min, weapon_max) * (1 + intelligence / 100)",
      "ability_hit": "base_hit * ability_damage_multiplier",
      "physical_damage_reduction": "armor / (armor + 100)",
      "magical_damage_reduction": "resistance / (resistance + 100)",
      "dodge_chance": "min(0.60, 0.05 + 0.30 * agility / (agility + 100) + temporary_dodge_bonus)",
      "crit_chance": "min(1, 0.05 + equipment_crit_bonus)",
      "crit_damage": "pre_mitigation_hit * 1.5",
      "damage_taken": "max(0, round(pre_mitigation_damage * (1 - appropriate_defense_reduction)))",
      "final_damage_order": [
        "roll weapon damage as integer",
        "apply primary stat and ability multiplier",
        "roll critical and multiply if triggered",
        "roll defender dodge: if dodged damage=0",
        "apply matching armor or resistance reduction",
        "round once to integer"
      ]
    },
    "actions_per_player_round": {
      "attack": 1,
      "support": 1,
      "order": "support_before_attack_if_used",
      "support_optional": true,
      "end_turn_available": true,
      "prevent_multiple_supports": true,
      "enemy_turn": "after attack or explicit End turn; never interrupt the optional support action"
    },
    "encounter": {
      "enemy_count": 1,
      "enemy_attacks_per_round": 1,
      "end_when_enemy_defeated": true,
      "on_killing_attack": "enemy does not retaliate",
      "boss_special_every_nth_enemy_attack": 3,
      "boss_special_replaces_normal_attack": true,
      "special_attack_multiplier": 1.5,
      "enemy_attack_counter_resets_each_encounter": true
    },
    "resources": {
      "mana_regeneration_in_dungeon": 0,
      "mana_restored_by": "rest_in_Greyhaven_or_mana_potion",
      "mana_persists_between_encounters": true,
      "hp_persists_between_encounters": true,
      "support_abilities_combat_only": true,
      "support_buffs_end_after_encounter": true
    },
    "damage_type_rules": {
      "magic_missiles": "magical_vs_resistance",
      "earth_spike": "physical_vs_armor",
      "basic_attack": "magical_vs_resistance_provisional_verify_current_code",
      "enemy_attack_type": "profile_specific"
    }
  },
  "abilities": {
    "status": "spell_multipliers_costs_and_mirror_bonus_provisional",
    "available_during_levels_1_to_5": [
      "basic_attack",
      "magic_missiles",
      "earth_spike",
      "mirror_image"
    ],
    "definitions": {
      "basic_attack": {
        "action": "attack",
        "damage_type": "magical",
        "damage_multiplier": 1.0,
        "mana_cost": 0,
        "status": "damage_type_provisional"
      },
      "magic_missiles": {
        "action": "attack",
        "damage_type": "magical",
        "damage_multiplier": 2.25,
        "mana_cost": 6,
        "status": "provisional_values",
        "damage_per_dart": 0.75
      },
      "earth_spike": {
        "action": "attack",
        "damage_type": "physical",
        "damage_multiplier": 2,
        "mana_cost": 6,
        "status": "provisional_values"
      },
      "mirror_image": {
        "action": "support",
        "damage_type": null,
        "mana_cost": 10,
        "dodge_bonus_flat": 0.2,
        "duration": "until_encounter_end",
        "stackable": false,
        "recast_while_active": false,
        "status": "provisional_cost_and_bonus_agreed_duration"
      }
    }
  },
  "equipment": {
    "status": "rarity_totals_agreed_as_balance_baseline_slot_allocation_provisional",
    "slots": [
      "weapon",
      "off_hand",
      "armor",
      "boots",
      "neck",
      "ring"
    ],
    "rarities": [
      "Common",
      "Uncommon",
      "Rare",
      "Epic"
    ],
    "all_stats_from_equipment": true,
    "rarity_full_set_totals": {
      "Common": {
        "weapon": [
          10,
          14
        ],
        "intelligence": 10,
        "vitality": 10,
        "armor": 10,
        "resistance": 20,
        "agility": 5,
        "crit_bonus": 0
      },
      "Uncommon": {
        "weapon": [
          12,
          18
        ],
        "intelligence": 20,
        "vitality": 20,
        "armor": 15,
        "resistance": 30,
        "agility": 8,
        "crit_bonus": 0
      },
      "Rare": {
        "weapon": [
          14,
          22
        ],
        "intelligence": 30,
        "vitality": 30,
        "armor": 20,
        "resistance": 40,
        "agility": 12,
        "crit_bonus": 0.02
      },
      "Epic": {
        "weapon": [
          17,
          25
        ],
        "intelligence": 40,
        "vitality": 40,
        "armor": 25,
        "resistance": 50,
        "agility": 16,
        "crit_bonus": 0.04
      }
    },
    "slot_stat_allocation_example": {
      "Common": {
        "weapon": {
          "intelligence": 4
        },
        "off_hand": {
          "intelligence": 2,
          "resistance": 6
        },
        "armor": {
          "vitality": 7,
          "armor": 10,
          "resistance": 10
        },
        "boots": {
          "agility": 5
        },
        "neck": {
          "intelligence": 3,
          "vitality": 3,
          "resistance": 4
        },
        "ring": {
          "intelligence": 1
        }
      },
      "Uncommon": {
        "weapon": {
          "intelligence": 8
        },
        "off_hand": {
          "intelligence": 4,
          "resistance": 10
        },
        "armor": {
          "vitality": 14,
          "armor": 15,
          "resistance": 14
        },
        "boots": {
          "agility": 8
        },
        "neck": {
          "intelligence": 6,
          "vitality": 6,
          "resistance": 6
        },
        "ring": {
          "intelligence": 2
        }
      },
      "Rare": {
        "weapon": {
          "intelligence": 12
        },
        "off_hand": {
          "intelligence": 6,
          "resistance": 14
        },
        "armor": {
          "vitality": 21,
          "armor": 20,
          "resistance": 18
        },
        "boots": {
          "agility": 12
        },
        "neck": {
          "intelligence": 9,
          "vitality": 9,
          "resistance": 8
        },
        "ring": {
          "intelligence": 3,
          "crit_bonus": 0.02
        }
      },
      "Epic": {
        "weapon": {
          "intelligence": 16
        },
        "off_hand": {
          "intelligence": 8,
          "resistance": 18
        },
        "armor": {
          "vitality": 28,
          "armor": 25,
          "resistance": 22
        },
        "boots": {
          "agility": 16
        },
        "neck": {
          "intelligence": 12,
          "vitality": 12,
          "resistance": 10
        },
        "ring": {
          "intelligence": 4,
          "crit_bonus": 0.04
        }
      }
    },
    "weapon_range_only_on_weapon": true,
    "slot_allocation_note": "These per-slot distributions sum exactly to full-set rarity totals; can later be replaced by varied item affixes without changing targets.",
    "tier_mapping": {
      "1": [
        1,
        5
      ],
      "2": [
        6,
        10
      ],
      "3": [
        11,
        15
      ],
      "4": [
        16,
        20
      ],
      "5": [
        21,
        25
      ],
      "6": [
        26,
        30
      ]
    },
    "relic_equipment_tier_rule": "relic tier, not exact dungeon level, determines gear tier",
    "basic_slot_prices": {
      "weapon": 20,
      "offhand": 10,
      "armor": 20,
      "boots": 10,
      "necklace": 10,
      "ring1": 5
    },
    "common_purchased_in_Greyhaven": true,
    "non_common_acquired_from_relics": true,
    "epic_unique_effects": "defer; not included in initial balance"
  },
  "dungeon": {
    "levels": [
      {
        "level": 1,
        "name": "Initiate",
        "recommended_gear": "Common",
        "regular_hp_range": [
          25,
          35
        ],
        "regular_attack_range": [
          6,
          9
        ],
        "boss_hp": 85,
        "boss_attack_range": [
          10,
          14
        ],
        "boss_special_attack_range": [
          15,
          21
        ],
        "description": "Recovery-friendly entry; starting Common gear viable"
      },
      {
        "level": 2,
        "name": "Novice",
        "recommended_gear": "Common/Uncommon",
        "regular_hp_range": [
          35,
          45
        ],
        "regular_attack_range": [
          8,
          11
        ],
        "boss_hp": 110,
        "boss_attack_range": [
          13,
          17
        ],
        "boss_special_attack_range": [
          20,
          26
        ],
        "description": "Early relic upgrades matter; manageable Mana pressure"
      },
      {
        "level": 3,
        "name": "Adept",
        "recommended_gear": "Uncommon",
        "regular_hp_range": [
          45,
          55
        ],
        "regular_attack_range": [
          10,
          13
        ],
        "boss_hp": 140,
        "boss_attack_range": [
          16,
          21
        ],
        "boss_special_attack_range": [
          24,
          32
        ],
        "description": "Primary balance benchmark; potions and spell typing matter"
      },
      {
        "level": 4,
        "name": "Veteran",
        "recommended_gear": "Uncommon/Rare",
        "regular_hp_range": [
          55,
          70
        ],
        "regular_attack_range": [
          12,
          16
        ],
        "boss_hp": 175,
        "boss_attack_range": [
          20,
          26
        ],
        "boss_special_attack_range": [
          30,
          39
        ],
        "description": "Higher physical and magical pressure; careful expedition planning"
      },
      {
        "level": 5,
        "name": "Master",
        "recommended_gear": "Rare/Epic",
        "regular_hp_range": [
          70,
          85
        ],
        "regular_attack_range": [
          15,
          19
        ],
        "boss_hp": 215,
        "boss_attack_range": [
          25,
          32
        ],
        "boss_special_attack_range": [
          38,
          48
        ],
        "description": "Tier 1 capstone; boss specials and extraction risk"
      }
    ],
    "layout": {
      "explorable_tiles_range": [
        10,
        12
      ],
      "regular_encounters": 6,
      "boss_encounters": 1,
      "noncombat_events_range": [
        2,
        3
      ],
      "treasure_chests_range": [
        1,
        2
      ]
    },
    "hp_assignment_rule": "Use level regular HP range: Skeleton low, Ghost low-middle, Wraith middle-high. Death Knight profile is retained for legacy/future use but is not an active regular enemy.",
    "enemy_profiles": {
      "skeleton": {
        "role": "basic melee",
        "armor": 10,
        "resistance": 5,
        "attack_type": "physical",
        "hp_position": "low",
        "mechanic": "standard single attack"
      },
      "ghost": {
        "role": "magical ranged",
        "armor": 0,
        "resistance": 25,
        "attack_type": "magical",
        "hp_position": "low_middle",
        "mechanic": "ranged magical attack"
      },
      "wraith": {
        "role": "lifesteal ranged",
        "armor": 5,
        "resistance": 20,
        "attack_type": "magical",
        "hp_position": "middle_high",
        "mechanic": "heal exactly actual damage dealt to player after mitigation, zero if dodged"
      },
      "death_knight": {
        "role": "armored melee",
        "armor": 30,
        "resistance": 10,
        "attack_type": "physical",
        "hp_position": "high",
        "mechanic": "single physical attack"
      },
      "ebon_sentinel": {
        "role": "boss armored melee",
        "armor": 35,
        "resistance": 15,
        "attack_type": "physical",
        "hp_position": "boss",
        "mechanic": "sword-ground special every third attack"
      },
      "mourning_lady": {
        "role": "boss magical",
        "armor": 5,
        "resistance": 35,
        "attack_type": "magical",
        "hp_position": "boss",
        "mechanic": "magical special every third attack"
      },
      "nameless_wraith": {
        "role": "boss lifesteal",
        "armor": 10,
        "resistance": 30,
        "attack_type": "magical",
        "hp_position": "boss",
        "mechanic": "lifesteal-themed special every third attack; heal actual damage if lifesteal applies"
      }
    },
    "enemy_defenses_scale_with_level": false,
    "boss_special_notes": "Preserve existing boss-specific special visuals and effects; multiplier is provisional and should not overwrite distinct established special effects.",
    "target_rounds": {
      "regular": {
        "1": [
          2,
          3
        ],
        "2": [
          2,
          3
        ],
        "3": [
          3,
          4
        ],
        "4": [
          3,
          4
        ],
        "5": [
          3,
          5
        ]
      },
      "boss": {
        "1": [
          5,
          6
        ],
        "2": [
          6,
          7
        ],
        "3": [
          7,
          8
        ],
        "4": [
          8,
          9
        ],
        "5": [
          9,
          10
        ]
      }
    },
    "target_rounds_status": "aspirational_not_simulated"
  },
  "potions": {
    "types": {
      "health": {
        "restore_percent_of_max_hp": 0.3,
        "gold_price": 12
      },
      "mana": {
        "restore_percent_of_max_mana": 0.3,
        "gold_price": 12
      }
    },
    "prices_and_percent_status": "provisional",
    "buy_location": "Greyhaven",
    "town_inventory_unlimited_by_belt": true,
    "loadout_assignment": "select any mix of owned health and mana potions immediately before dungeon entry, limited by unlocked belt slots",
    "consume_in_combat": "one support action",
    "consume_between_encounters": true,
    "between_encounter_use_status": "approved_one_shared_use_between_completed_encounters",
    "consumption": "remove from carried inventory exactly once; clamp restoration to current max",
    "potions_lost_on_death": true,
    "unused_potions_return_on_flee_or_completion": true,
    "potion_belt": {
      "permanent_upgrade": true,
      "not_equipment_slot": true,
      "starting_level": 1,
      "levels": [
        {
          "level": 1,
          "slots": 2,
          "upgrade_gold_cost_from_previous": 0
        },
        {
          "level": 2,
          "slots": 3,
          "upgrade_gold_cost_from_previous": 75
        },
        {
          "level": 3,
          "slots": 4,
          "upgrade_gold_cost_from_previous": 200
        },
        {
          "level": 4,
          "slots": 5,
          "upgrade_gold_cost_from_previous": 450
        },
        {
          "level": 5,
          "slots": 6,
          "upgrade_gold_cost_from_previous": 900
        }
      ],
      "costs_and_max_slots_status": "provisional",
      "upgrade_currency": "gold",
      "upgrade_location": "Greyhaven",
      "retained_on_death": true
    }
  },
  "relics": {
    "status": "core_mechanics_agreed_drop_odds_and_prices_provisional",
    "name": "Relic",
    "replaces_enemy_gold_drops": true,
    "replaces_treasure_chest_direct_gold_and_equipment": true,
    "stack_by_tier": true,
    "tier_for_dungeon_levels_1_to_5": 1,
    "boss_guaranteed_relics": 1,
    "relics_per_chest": 1,
    "regular_enemy_relic_drop_probability": 0.2,
    "expected_relics_per_run": {
      "one_chest": 3.2,
      "two_chests": 4.2
    },
    "rewards_only_extracted_on_completion": true,
    "open_location": "Greyhaven",
    "opening_cost_gold": 0,
    "sell_unopened_tier1_gold": 40,
    "open_or_sell_choice": "mutually exclusive; one relic consumed for exactly one outcome",
    "equipment_roll": {
      "slot_probabilities": {
        "weapon": 0.16666666666666666,
        "off_hand": 0.16666666666666666,
        "armor": 0.16666666666666666,
        "boots": 0.16666666666666666,
        "neck": 0.16666666666666666,
        "ring": 0.16666666666666666
      },
      "slot_probability_status": "provisional_uniform",
      "rarity_probabilities": {
        "Uncommon": 0.75,
        "Rare": 0.2,
        "Epic": 0.05
      },
      "guaranteed_usable_by_current_character_class": true,
      "determine_class_at_open_time": true,
      "result_item_tier_equals_relic_tier": true,
      "duplicate_protection": false,
      "no_common_from_relics": true
    },
    "equipment_resale_gold": {
      "Common": 0,
      "Uncommon": 12,
      "Rare": 25,
      "Epic": 50
    },
    "expected_resale_after_open": 16.5,
    "economic_intent": "selling unopened guarantees more gold than average cracked item resale; cracking is for gear upgrades",
    "reward_delivery": "on boss/chest/enemy drop, record as pending dungeon loot until completed; never add directly to permanent inventory"
  },
  "economy": {
    "currency": "gold_only",
    "basic_full_tier1_replacement_set_gold": 75,
    "basic_gear_purchase_location": "Greyhaven_blacksmith",
    "ability_training_gold_cost": 60,
    "relic_sale_and_potion_costs_provisional": true,
    "no_extra_currencies": true,
    "loss_rules": {
      "complete": "transfer pending relics and loot to persistent inventory; retain unused potions and starting gear",
      "flee": "retain XP and surviving starting gear and unused potions; discard pending relics and other dungeon loot",
      "death": "lose carried equipment, carried potions, pending dungeon loot; retain belt upgrades, unlocked character levels, abilities, and town-stored inventory"
    },
    "xp": "permanent; unlocks abilities and higher dungeon difficulty only; does not grant combat stats"
  },
  "save_data_contract": {
    "suggested_fields": [
      "player.equipmentSlots",
      "player.townInventory.items",
      "player.townInventory.relicsByTier",
      "player.townInventory.potions",
      "player.potionBelt.level",
      "player.potionBelt.loadout",
      "run.pendingLoot.relicsByTier",
      "run.carriedPotions",
      "run.currentHp",
      "run.currentMana",
      "run.bossAttackCounter"
    ],
    "migration": "initialize missing fields for existing saves, preserve current equipment and gold, do not grant duplicate starter items or relics",
    "security": "server-side validation recommended for purchases, relic cracking, inventory consumption, and extraction if accounts are server-backed"
  },
  "acceptance_tests": [
    "Full Common Mage set totals: HP 70, Mana 50, weapon 10-14, INT 10, VIT 10, Armor 10, Resistance 20, AGI 5.",
    "Full Uncommon Mage set totals: HP 80, Mana 60, weapon 12-18, INT 20, VIT 20, Armor 15, Resistance 30, AGI 8.",
    "Full Rare Mage set totals: HP 90, Mana 70, weapon 14-22, INT 30, VIT 30, Armor 20, Resistance 40, AGI 12.",
    "Full Epic Mage set totals: HP 100, Mana 80, weapon 17-25, INT 40, VIT 40, Armor 25, Resistance 50, AGI 16.",
    "Weapon roll is inclusive integer; ability multiplier applies to same roll; no independent weapon roll per damage component.",
    "Earth Spike mitigated by Armor, Magic Missiles by Resistance; active Ghost profile has lower Armor than Resistance. Death Knight is not an active regular enemy.",
    "One optional support action may be taken before the attack; attacking immediately ends the player round, and End turn skips the remaining attack.",
    "Mirror Image cannot be used outside combat, does not stack, and expires at encounter end.",
    "Every third boss attack is special and replaces (not adds to) the normal attack.",
    "Wraith heals exactly actual damage dealt, never premitigation damage or dodged damage.",
    "Mana and HP persist between fights; Mana does not passively regenerate during dungeon.",
    "Potions restore 30% of max and never overfill; using one in combat consumes support action.",
    "Belt loadout cannot exceed capacity or owned potion stock; belt upgrades persist through death.",
    "Boss grants one relic, each chest one relic, six regular enemies roll independently at 20%; no enemy gold and no direct chest equipment.",
    "An Aether Relic opens into exactly one Mage-usable Tier 1 Uncommon/Rare/Epic item; Common never rolled.",
    "Relic sale gives guaranteed 40 gold, opening costs zero; both consume exactly one relic and cannot double-award.",
    "Flee discards all pending loot but retains starting equipment, XP and unused carried potions.",
    "Death removes carried equipment, carried potions and pending loot but preserves permanent belt and town storage.",
    "No new Paladin or Ranger playable content; no changes to existing animations or Git remotes."
  ],
  "open_questions_for_work_chat": [],
  "implementation_decisions": {
    "between_encounter_potions": {
      "maximum_uses": 1,
      "shared_between_health_and_mana": true,
      "reset": "after each completed encounter"
    },
    "provisional_values": "apply_all",
    "boss_special_multiplier": 1.5,
    "preserve_animation_timing": true,
    "belt_costs_approved": true
  }
});
