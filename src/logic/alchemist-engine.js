// ═══════════════════════════════════════════════════════════════════════════════
// BULA BASE — THE ALCHEMIST RECOMMENDATION ENGINE
// 108-Path Matrix: 3 (Frequency) × 4 (Intention) × 3 (Chronotype) × 3 (Palate)
//
// Three-tier execution hierarchy:
//   1. Manual Override  — exact path match from Google Sheets ops table
//   2. Inventory Mask   — fallback if ideal botanical is inactive
//   3. Alchemist Math   — weighted scoring with safety interlocks
// ═══════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// VALID INPUT ENUMS
// ─────────────────────────────────────────────────────────────────────────────

const FREQUENCY  = { WIRED:"STATE_WIRED", BALANCED:"STATE_BALANCED", GROUNDED:"STATE_GROUNDED" };
const INTENTION  = { ENERGY:"INTENT_ENERGY", SOCIAL:"INTENT_SOCIAL", RESET:"INTENT_RESET", PAIN:"INTENT_PAIN" };
const CHRONOTYPE = { SUNRISE:"TIME_SUNRISE", MOONLIGHT:"TIME_MOONLIGHT", ALLDAY:"TIME_ALLDAY" };
const PALATE     = { EARTHY:"FLAVOR_EARTHY", FRUITY:"FLAVOR_FRUITY", TROPICAL:"FLAVOR_TROPICAL" };

// ─────────────────────────────────────────────────────────────────────────────
// BOTANICAL REGISTRY
// Each botanical has:
//   pillar          — the Intention it primarily serves (for fallback routing)
//   stimulant       — true if high-stimulant (blocked by Energy Cap interlock)
//   shutdown        — true if "Full Shutdown" profile (blocked by Grounding Ceiling)
//   palettesSupported — which Q4 flavors are available as a serving style
//   baseScore       — starting weight before Q1/Q2 modifiers are applied
// ─────────────────────────────────────────────────────────────────────────────

// ── CANONICAL BOT ID SCHEMA (v2 — matches Google Sheets Botanical Library) ───
// BOT_001  Noble Kava        INTENT_SOCIAL  / INTENT_RESET
// BOT_002  Blue Lotus        INTENT_RESET   (lucid relaxation)
// BOT_003  White Kratom      INTENT_ENERGY  (stimulant-class)
// BOT_004  Green Kratom      INTENT_ENERGY  / INTENT_SOCIAL
// BOT_005  Red Kratom        INTENT_PAIN    / INTENT_RESET
// BOT_006  Kanna             INTENT_SOCIAL
// BOT_007  Reishi            INTENT_RESET   (adaptogen)
// BOT_008  Lion's Mane       INTENT_ENERGY  (non-stimulant cognitive)
// BOT_009  Cordyceps         INTENT_ENERGY  (non-stimulant cellular)

const BOTANICAL_REGISTRY = {
  BOT_001: {
    name:              "Noble Kava",
    pillar:            "INTENT_SOCIAL",
    stimulant:         false,
    shutdown:          false,
    palettesSupported: ["FLAVOR_EARTHY", "FLAVOR_TROPICAL"],
    baseScore:         60,
    verdictTemplate:   "A clean Noble kava to open the frequency and ease the room.",
  },
  BOT_002: {
    name:              "Blue Lotus",
    pillar:            "INTENT_RESET",
    stimulant:         false,
    shutdown:          false,   // lucid relaxation — not full shutdown
    palettesSupported: ["FLAVOR_FRUITY", "FLAVOR_TROPICAL"],
    baseScore:         52,
    verdictTemplate:   "A gentle evening flower to soften the edges and quiet the mind.",
  },
  BOT_003: {
    name:              "White Kratom",
    pillar:            "INTENT_ENERGY",
    stimulant:         true,    // Energy Cap interlock applies
    shutdown:          false,
    palettesSupported: ["FLAVOR_FRUITY"],
    baseScore:         62,
    verdictTemplate:   "A clean white vein for maximum cognitive lift without the crash.",
  },
  BOT_004: {
    name:              "Green Kratom",
    pillar:            "INTENT_ENERGY",
    stimulant:         true,    // Energy Cap interlock applies
    shutdown:          false,
    palettesSupported: ["FLAVOR_FRUITY", "FLAVOR_TROPICAL"],
    baseScore:         58,
    verdictTemplate:   "A balanced green vein to sharpen focus and lift the floor.",
  },
  BOT_005: {
    name:              "Red Kratom",
    pillar:            "INTENT_PAIN",
    stimulant:         false,
    shutdown:          false,
    palettesSupported: ["FLAVOR_EARTHY", "FLAVOR_TROPICAL"],
    baseScore:         60,
    verdictTemplate:   "A sedating red vein to melt physical tension and restore comfort.",
  },
  BOT_006: {
    name:              "Kanna",
    pillar:            "INTENT_SOCIAL",
    stimulant:         false,
    shutdown:          false,
    palettesSupported: ["FLAVOR_FRUITY", "FLAVOR_TROPICAL"],
    baseScore:         55,
    verdictTemplate:   "A bright mood-lifter to open the heart and activate the room.",
  },
  BOT_007: {
    name:              "Reishi",
    pillar:            "INTENT_RESET",
    stimulant:         false,
    shutdown:          false,   // adaptogen — not full shutdown
    palettesSupported: ["FLAVOR_EARTHY"],
    baseScore:         50,
    verdictTemplate:   "A grounding adaptogen to calm the nervous system and support recovery.",
  },
  BOT_008: {
    name:              "Lion's Mane",
    pillar:            "INTENT_ENERGY",
    stimulant:         false,   // cognitive, not stimulant-class
    shutdown:          false,
    palettesSupported: ["FLAVOR_FRUITY", "FLAVOR_TROPICAL"],
    baseScore:         54,
    verdictTemplate:   "Neural clarity without the spike — the Alchemist's tool for locked-in focus.",
  },
  BOT_009: {
    name:              "Cordyceps",
    pillar:            "INTENT_ENERGY",
    stimulant:         false,   // cellular energy, not stimulant-class
    shutdown:          false,
    palettesSupported: ["FLAVOR_FRUITY", "FLAVOR_TROPICAL"],
    baseScore:         54,
    verdictTemplate:   "A clean cellular energy boost — extra gear without the spike.",
  },
};

// Pillar fallback chains — updated to canonical IDs
const PILLAR_FALLBACK_CHAIN = {
  INTENT_ENERGY: ["BOT_003", "BOT_004", "BOT_008", "BOT_009", "BOT_006"],
  INTENT_SOCIAL: ["BOT_001", "BOT_006", "BOT_004", "BOT_002"],
  INTENT_RESET:  ["BOT_002", "BOT_007", "BOT_001"],
  INTENT_PAIN:   ["BOT_005", "BOT_007", "BOT_002"],
};

// ─────────────────────────────────────────────────────────────────────────────
// SCORING WEIGHTS
// Q1 (Frequency) and Q2 (Intention) are primary drivers.
// Q3 (Chronotype) is a safety filter, not a score booster.
// Q4 (Palate) is a serving style modifier, not a botanical selector.
// ─────────────────────────────────────────────────────────────────────────────

const FREQUENCY_MODIFIERS = {
  // Wired state: reduce shutdown botanicals, boost grounding
  STATE_WIRED: {
    INTENT_RESET:  +15,
    INTENT_SOCIAL: +8,
    INTENT_ENERGY: -10,  // already wired — don't add more stimulant
    INTENT_PAIN:   +5,
  },
  // Balanced state: even weighting, let intention drive
  STATE_BALANCED: {
    INTENT_RESET:  +5,
    INTENT_SOCIAL: +10,
    INTENT_ENERGY: +10,
    INTENT_PAIN:   +5,
  },
  // Grounded state: boost energy and social, reduce heavy reset
  STATE_GROUNDED: {
    INTENT_RESET:  -5,
    INTENT_SOCIAL: +12,
    INTENT_ENERGY: +15,
    INTENT_PAIN:   +8,
  },
};

// Pillar-to-botanical score contributions (canonical IDs)
const PILLAR_SCORES = {
  INTENT_ENERGY: { BOT_003: 20, BOT_004: 16, BOT_008: 12, BOT_009: 10 },
  INTENT_SOCIAL: { BOT_001: 20, BOT_006: 16 },
  INTENT_RESET:  { BOT_002: 18, BOT_007: 14 },
  INTENT_PAIN:   { BOT_005: 22, BOT_007: 12 },
};

// Compliance flags by botanical (canonical IDs)
const COMPLIANCE_FLAGS = {
  BOT_001: ["FDA_DISCLAIMER", "KAVA_LIVER_WARNING"],
  BOT_002: ["FDA_DISCLAIMER"],
  BOT_003: ["FDA_DISCLAIMER", "AGE_GATE_18", "KRATOM_WARNING"],
  BOT_004: ["FDA_DISCLAIMER", "AGE_GATE_18", "KRATOM_WARNING"],
  BOT_005: ["FDA_DISCLAIMER", "AGE_GATE_18", "KRATOM_WARNING"],
  BOT_006: ["FDA_DISCLAIMER"],
  BOT_007: ["FDA_DISCLAIMER"],
  BOT_008: ["FDA_DISCLAIMER"],
  BOT_009: ["FDA_DISCLAIMER"],
};

// ─────────────────────────────────────────────────────────────────────────────
// SERVING SUGGESTION BUILDER
// Translates Q4 palate choice into a preparation style.
// If the botanical doesn't support the chosen palate, generates a pivot phrase.
// ─────────────────────────────────────────────────────────────────────────────

function buildServingSuggestion(botId, palate, botanical) {
  const supported = botanical.palettesSupported.includes(palate);

  const styles = {
    FLAVOR_EARTHY: {
      base:  "Served traditional — cold-strained with no additives. Raw and direct.",
      pivot: "Starting with an earthy base but finishing with a {altFlavor} accent to meet your frequency.",
    },
    FLAVOR_FRUITY: {
      base:  "Mixed with a light citrus seltzer to brighten the intake and clean the finish.",
      pivot: "This variety skews earthy — blending with a splash of citrus to bridge the gap.",
    },
    FLAVOR_TROPICAL: {
      base:  "Served in a coconut water base with a mango citrus finish. Smooth entry, full effect.",
      pivot: "Adding a tropical splash to soften the earthy edge and hit the profile you're after.",
    },
  };

  if (supported) {
    return styles[palate].base;
  }

  // Palate pivot — find what this botanical does support and reference it
  const available    = botanical.palettesSupported[0];
  const altLabel     = available === "FLAVOR_EARTHY"
    ? "earthy"
    : available === "FLAVOR_FRUITY"
    ? "fruity"
    : "tropical";
  const pivotPhrase  = styles[palate].pivot.replace("{altFlavor}", altLabel);
  return pivotPhrase;
}

// ─────────────────────────────────────────────────────────────────────────────
// PATH STRING BUILDER
// Converts the four response IDs into a compact path key for override lookups.
// Example: ["STATE_WIRED","INTENT_SOCIAL","TIME_SUNRISE","FLAVOR_FRUITY"]
//        → "WIRED_SOCIAL_SUNRISE_FRUITY"
// ─────────────────────────────────────────────────────────────────────────────

function buildPathString(frequency, intention, chronotype, palate) {
  const stripPrefix = str => str.replace(/^(STATE_|INTENT_|TIME_|FLAVOR_)/, "");
  return [frequency, intention, chronotype, palate].map(stripPrefix).join("_");
}

// ─────────────────────────────────────────────────────────────────────────────
// TIER 1: MANUAL OVERRIDE CHECK
// manualOverrides is an array of rows parsed from Google Sheets.
// Each row has: path_string, status ("ACTIVE"|"INACTIVE"), target_id, custom_verdict.
// ─────────────────────────────────────────────────────────────────────────────

function checkManualOverride(pathString, manualOverrides) {
  if (!Array.isArray(manualOverrides)) return null;
  const match = manualOverrides.find(
    row => row.path_string === pathString && row.status === "ACTIVE"
  );
  return match || null;
}

// ─────────────────────────────────────────────────────────────────────────────
// TIER 2: INVENTORY MASK + FALLBACK
// If the target botanical is inactive in currentInventory, walk the pillar
// fallback chain to find the next available option in the same intention pillar.
// ─────────────────────────────────────────────────────────────────────────────

function resolveInventory(targetBotId, intention, currentInventory) {
  // Check if target is available
  const targetItem = currentInventory.find(i => i.bot_id === targetBotId);
  if (targetItem && targetItem.active) return targetBotId;

  // Walk the fallback chain for this intention pillar
  const chain = PILLAR_FALLBACK_CHAIN[intention] || [];
  for (const fallbackId of chain) {
    if (fallbackId === targetBotId) continue; // skip the already-failed target
    const fallbackItem = currentInventory.find(i => i.bot_id === fallbackId);
    if (fallbackItem && fallbackItem.active) return fallbackId;
  }

  // Last resort: return the first active botanical in inventory
  const anyActive = currentInventory.find(i => i.active);
  return anyActive ? anyActive.bot_id : null;
}

// ─────────────────────────────────────────────────────────────────────────────
// TIER 3: ALCHEMIST MATH
// Weighted scoring across all botanicals in the registry.
// Safety interlocks applied before scoring finalises.
// ─────────────────────────────────────────────────────────────────────────────

function runAlchemistMath(frequency, intention, chronotype) {
  const scores = {};

  // Initialise from base scores
  for (const [id, bot] of Object.entries(BOTANICAL_REGISTRY)) {
    scores[id] = bot.baseScore;
  }

  // Apply Q1 frequency modifier to each pillar's botanicals
  const freqMods = FREQUENCY_MODIFIERS[frequency] || {};
  for (const [pillar, mod] of Object.entries(freqMods)) {
    const pillarBots = PILLAR_FALLBACK_CHAIN[pillar] || [];
    pillarBots.forEach(id => {
      if (scores[id] !== undefined) scores[id] += mod;
    });
  }

  // Apply Q2 pillar scores (primary intention driver)
  const pillarBoosts = PILLAR_SCORES[intention] || {};
  for (const [id, boost] of Object.entries(pillarBoosts)) {
    if (scores[id] !== undefined) scores[id] += boost;
  }

  // ── SAFETY INTERLOCKS ────────────────────────────────────────────────────

  // Energy Cap: TIME_MOONLIGHT suppresses high-stimulant botanicals
  // unless the user explicitly chose INTENT_ENERGY.
  if (chronotype === CHRONOTYPE.MOONLIGHT && intention !== INTENTION.ENERGY) {
    for (const [id, bot] of Object.entries(BOTANICAL_REGISTRY)) {
      if (bot.stimulant) scores[id] -= 40; // effectively eliminates from contention
    }
  }

  // Grounding Ceiling: STATE_GROUNDED + INTENT_RESET pivots away from
  // "Full Shutdown" botanicals toward lucid relaxation options.
  if (frequency === FREQUENCY.GROUNDED && intention === INTENTION.RESET) {
    for (const [id, bot] of Object.entries(BOTANICAL_REGISTRY)) {
      if (bot.shutdown) {
        scores[id] -= 30;
      }
    }
    // Boost lucid relaxation alternatives: Blue Lotus (BOT_002) and Reishi (BOT_007)
    scores["BOT_002"] = (scores["BOT_002"] || 0) + 20;
    scores["BOT_007"] = (scores["BOT_007"] || 0) + 15;
  }

  // ── SELECT WINNER ────────────────────────────────────────────────────────
  let topId    = null;
  let topScore = -Infinity;
  for (const [id, score] of Object.entries(scores)) {
    if (score > topScore) { topScore = score; topId = id; }
  }

  return topId;
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN: calculateRecommendation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @param {string[]} userResponses      - [frequency, intention, chronotype, palate]
 * @param {object[]} currentInventory   - [{ bot_id, active }]
 * @param {object[]} manualOverrides    - parsed rows from Google Sheets ops table
 * @returns {object}                    - { bot_id, verdict, serving_suggestion, compliance_flags }
 */
function calculateRecommendation(userResponses, currentInventory, manualOverrides) {
  // ── INPUT VALIDATION ─────────────────────────────────────────────────────
  if (!Array.isArray(userResponses) || userResponses.length !== 4) {
    throw new Error("[Alchemist] userResponses must be an array of exactly 4 response IDs.");
  }

  const [frequency, intention, chronotype, palate] = userResponses;

  const validFrequency  = Object.values(FREQUENCY);
  const validIntention  = Object.values(INTENTION);
  const validChronotype = Object.values(CHRONOTYPE);
  const validPalate     = Object.values(PALATE);

  if (!validFrequency.includes(frequency))
    throw new Error(`[Alchemist] Invalid frequency: "${frequency}". Valid: ${validFrequency.join(", ")}`);
  if (!validIntention.includes(intention))
    throw new Error(`[Alchemist] Invalid intention: "${intention}". Valid: ${validIntention.join(", ")}`);
  if (!validChronotype.includes(chronotype))
    throw new Error(`[Alchemist] Invalid chronotype: "${chronotype}". Valid: ${validChronotype.join(", ")}`);
  if (!validPalate.includes(palate))
    throw new Error(`[Alchemist] Invalid palate: "${palate}". Valid: ${validPalate.join(", ")}`);

  // ── BUILD PATH STRING ────────────────────────────────────────────────────
  const pathString = buildPathString(frequency, intention, chronotype, palate);

  // ── TIER 1: MANUAL OVERRIDE ──────────────────────────────────────────────
  const override = checkManualOverride(pathString, manualOverrides);
  if (override) {
    const bot      = BOTANICAL_REGISTRY[override.target_id];
    const serving  = buildServingSuggestion(override.target_id, palate, bot);
    return {
      bot_id:             override.target_id,
      verdict:            override.custom_verdict,
      serving_suggestion: serving,
      compliance_flags:   COMPLIANCE_FLAGS[override.target_id] || ["FDA_DISCLAIMER"],
      _meta: {
        path:   pathString,
        tier:   "MANUAL_OVERRIDE",
        source: override.source_label || "ops-table",
      },
    };
  }

  // ── TIER 3: ALCHEMIST MATH (score the ideal result first) ───────────────
  const idealBotId = runAlchemistMath(frequency, intention, chronotype);

  // ── TIER 2: INVENTORY MASK ───────────────────────────────────────────────
  const resolvedBotId = resolveInventory(idealBotId, intention, currentInventory);

  if (!resolvedBotId) {
    throw new Error("[Alchemist] No active botanicals available in currentInventory.");
  }

  const botanical = BOTANICAL_REGISTRY[resolvedBotId];
  const wasBlocked = resolvedBotId !== idealBotId;

  // ── BUILD VERDICT ────────────────────────────────────────────────────────
  let verdict = botanical.verdictTemplate;
  if (wasBlocked) {
    const blockedBot = BOTANICAL_REGISTRY[idealBotId];
    verdict = `${blockedBot.name} was the primary match, but we're out of stock. ` +
              `Routing to ${botanical.name}: ${botanical.verdictTemplate.toLowerCase()}`;
  }

  // ── BUILD SERVING SUGGESTION ─────────────────────────────────────────────
  const serving = buildServingSuggestion(resolvedBotId, palate, botanical);

  // ── RETURN RESULT ────────────────────────────────────────────────────────
  return {
    bot_id:             resolvedBotId,
    verdict,
    serving_suggestion: serving,
    compliance_flags:   COMPLIANCE_FLAGS[resolvedBotId] || ["FDA_DISCLAIMER"],
    _meta: {
      path:        pathString,
      tier:        wasBlocked ? "INVENTORY_FALLBACK" : "ALCHEMIST_MATH",
      ideal_bot:   idealBotId,
      resolved_bot:resolvedBotId,
      inventory_blocked: wasBlocked,
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// SAMPLE manualOverrides STRUCTURE
// ─────────────────────────────────────────────────────────────────────────────
// This is what your developer parses from the Google Sheet.
// Each row in the sheet becomes one object in this array.
// Columns: path_string | status | target_id | custom_verdict | source_label | notes

const SAMPLE_MANUAL_OVERRIDES = [
  {
    // Troy wants every wired+social+sunrise customer pushed to Kanna
    // during the Saturday morning market event.
    path_string:    "WIRED_SOCIAL_SUNRISE_FRUITY",
    status:         "ACTIVE",
    target_id:      "BOT_006",
    custom_verdict: "Market morning energy — Kanna opens the social channel and syncs with the sunrise vibe.",
    source_label:   "troy-ops-sheet",
    notes:          "Active Sat-Sun 8am-12pm only. Disable after event.",
  },
  {
    // Inactive override — logged but not applied
    path_string:    "GROUNDED_RESET_MOONLIGHT_EARTHY",
    status:         "INACTIVE",
    target_id:      "BOT_002",
    custom_verdict: "Heavy kava for the late-night wind-down crowd.",
    source_label:   "troy-ops-sheet",
    notes:          "Paused — BOT_002 batch running low.",
  },
  {
    // Pain path gets a specific red vein push during a promo week
    path_string:    "WIRED_PAIN_ALLDAY_TROPICAL",
    status:         "ACTIVE",
    target_id:      "BOT_005",
    custom_verdict: "Red vein in a tropical base — maximum physical relief, smooth intake.",
    source_label:   "troy-ops-sheet",
    notes:          "Promo: Red Vein week. Expires end of month.",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// SAMPLE currentInventory STRUCTURE
// ─────────────────────────────────────────────────────────────────────────────
// Your developer fetches this from Firestore (Phase 2) or derives it from
// BASE_INV in BulaBaseKiosk.jsx by mapping estimatedShells > 0 → active: true.

const SAMPLE_INVENTORY = [
  { bot_id:"BOT_001", active:true  },
  { bot_id:"BOT_002", active:false },  // sold out — fallback will trigger
  { bot_id:"BOT_003", active:true  },
  { bot_id:"BOT_004", active:true  },
  { bot_id:"BOT_005", active:true  },
  { bot_id:"BOT_006", active:true  },
  { bot_id:"BOT_007", active:false },  // not currently stocked
  { bot_id:"BOT_008", active:true  },
  { bot_id:"BOT_009", active:true  },
];

// ─────────────────────────────────────────────────────────────────────────────
// USAGE EXAMPLES
// ─────────────────────────────────────────────────────────────────────────────

/*

// Example 1: Standard path — Alchemist Math tier
const result1 = calculateRecommendation(
  ["STATE_WIRED", "INTENT_RESET", "TIME_SUNRISE", "FLAVOR_EARTHY"],
  SAMPLE_INVENTORY,
  SAMPLE_MANUAL_OVERRIDES
);
// → BOT_007 (Blue Lotus) if active, else BOT_009 (Reishi)
// → tier: "ALCHEMIST_MATH"

// Example 2: Override fires — Tier 1 takes precedence
const result2 = calculateRecommendation(
  ["STATE_WIRED", "INTENT_SOCIAL", "TIME_SUNRISE", "FLAVOR_FRUITY"],
  SAMPLE_INVENTORY,
  SAMPLE_MANUAL_OVERRIDES
);
// → BOT_006 (Kanna), verdict from override row
// → tier: "MANUAL_OVERRIDE"

// Example 3: Energy Cap interlock — no White Kratom at moonlight
const result3 = calculateRecommendation(
  ["STATE_BALANCED", "INTENT_SOCIAL", "TIME_MOONLIGHT", "FLAVOR_TROPICAL"],
  SAMPLE_INVENTORY,
  []
);
// → BOT_001 or BOT_006 (stimulant score suppressed by -40)
// → tier: "ALCHEMIST_MATH"

// Example 4: Grounding Ceiling interlock
const result4 = calculateRecommendation(
  ["STATE_GROUNDED", "INTENT_RESET", "TIME_ALLDAY", "FLAVOR_EARTHY"],
  SAMPLE_INVENTORY,
  []
);
// → BOT_007 (Blue Lotus, lucid relaxation) over BOT_002 (Full Shutdown kava)
// → tier: "ALCHEMIST_MATH"

// Example 5: Inventory fallback — BOT_002 is out of stock
const result5 = calculateRecommendation(
  ["STATE_WIRED", "INTENT_PAIN", "TIME_ALLDAY", "FLAVOR_EARTHY"],
  SAMPLE_INVENTORY,
  []
);
// Ideal = BOT_005 (Red Vein — if active). If BOT_005 were also out,
// fallback chain: BOT_002 (blocked) → BOT_009 (Reishi, next in INTENT_PAIN chain)
// → tier: "INVENTORY_FALLBACK" if fallback triggered

*/

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS — for Node.js / bundler environments
// Remove if embedding directly in BulaBaseKiosk.jsx
// ─────────────────────────────────────────────────────────────────────────────

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    calculateRecommendation,
    buildPathString,
    BOTANICAL_REGISTRY,
    PILLAR_FALLBACK_CHAIN,
    FREQUENCY,
    INTENTION,
    CHRONOTYPE,
    PALATE,
    SAMPLE_MANUAL_OVERRIDES,
    SAMPLE_INVENTORY,
  };
}
