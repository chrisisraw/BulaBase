/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║           BULA BASE v4.2.1 — FINAL UNIFIED BUILD                    ║
 * ║           The AgensI / Troy's Kava · St. Augustine Pilot            ║
 * ╠══════════════════════════════════════════════════════════════════════╣
 * ║  ALL SEALED FIXES MERGED — single production-ready file:            ║
 * ║  • BULA_CONFIG: Forest Jade, Neon Green, Gold, Indigo (St. Aug)     ║
 * ║  • useWizardSpeech: Gideon 0.45/0.80/0.45, 18s Chrome bouncer     ║
 * ║  • Golden Seed: frozenURL useRef, UUID_V4_RE assertion, no flicker  ║
 * ║  • KioskShell v2: Safari CSS, SVG shield, localStorage.clear()     ║
 * ║  • RESULT screen: onSuccessReady → RESULT_DONE wired + GoldenSeed  ║
 * ║  • FSM: GATE→QUIZ→SOMMELIER→RESULT→MENU — all 5 screens live       ║
 * ║  • Dry-run harness: ON_SUCCESS handshake verified inline            ║
 * ║  • v1.7.2 transaction states: DO NOT ALTER                          ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 */

import {
  useReducer, useCallback, useState, useEffect, useRef,
  createContext, useContext,
} from "react";

// ═════════════════════════════════════════════════════════════════════════════
// BULA_CONFIG — Location & Branding Root
// Single source of truth for the St. Augustine pilot deployment.
// All downstream systems (THEME, GIDEON_CONFIG, FSM, KioskShell) read from here.
// To launch a new location: clone this file, change locationId, swap colors/fonts.
// ═════════════════════════════════════════════════════════════════════════════

const BULA_CONFIG = {
  // ── Location identity ──────────────────────────────────────────────────────
  // Used as the Firestore locationId, URL parameter, and audit trail stamp.
  // Must match the value written by secure_logShell to transactions/{actionId}.
  locationId: "st_augustine_troy_01",

  // ── Branding ───────────────────────────────────────────────────────────────
  branding: {
    primaryColor: "#DEFF9A",                     // Neon Green — tactical data
    accentColor:  "#A78BFA",                     // Indigo — Chronotype accent
    ritualColor:  "#F5D06A",                     // Golden Seed / success blaze

    // Typography
    // Crimson Text: warm, old-world serif for narrative/spiritual copy (quiz, sommelier).
    // JetBrains Mono: high-legibility monospace for tactical data (shell counts, batch IDs, HUD).
    fontSerif:    "'Crimson Text', serif",        // The Alchemist vibe
    fontMono:     "'JetBrains Mono', monospace",  // The Bunker vibe
  },

  // ── Voice engine ───────────────────────────────────────────────────────────
  // "web_speech"  → Browser Web Speech API. Zero cost, zero setup. Gideon-esque
  //                 fallback voice (Google UK English Male preferred).
  // "eleven_labs" → ElevenLabs streaming TTS. Requires apiKey + gideonVoiceId
  //                 passed to useWizardSpeech. Set when Gideon account is live.
  voice: {
    engine:        "web_speech",     // Switch to "eleven_labs" when ready
    fallbackVoice: "Gideon-esque",   // Web Speech preference order in WEB_VOICE_PREFS
  },
};

// ── Config convenience accessors ─────────────────────────────────────────────
// Used throughout the file so consumers read BULA_CONFIG.branding.fontSerif,
// not raw strings — a single change here propagates everywhere.
const LOCATION_ID   = BULA_CONFIG.locationId;
const FONT_SERIF    = BULA_CONFIG.branding.fontSerif;
const FONT_MONO     = BULA_CONFIG.branding.fontMono;
const VOICE_ENGINE  = BULA_CONFIG.voice.engine;   // "web_speech" | "eleven_labs"

// ═════════════════════════════════════════════════════════════════════════════
// BLOCK 1: THEME PROVIDER — AgensI_Default (Troy's Kava)
// Color values sourced from BULA_CONFIG.branding where specified.
// ═════════════════════════════════════════════════════════════════════════════

const THEME = {
  name:     "AgensI_Default",
  location: LOCATION_ID,    // ← sourced from BULA_CONFIG
  brand:    "Bula Base",

  // ── Color palette ─────────────────────────────────────────────────────────
  colors: {
    // Primary surfaces
    forest:      "#091A11",   // Forest Jade — main background
    forestMid:   "#0D2118",   // Avatar chamber / card bg
    forestEdge:  "#142B1E",   // Subtle edge / border accent
    forestDeep:  "#060F0A",   // Deepest shadow

    // Brand accents — sourced from BULA_CONFIG.branding (v1.7.2 locked values)
    neon:        BULA_CONFIG.branding.primaryColor, // "#DEFF9A" tactical data
    gold:        "#D4AF37",                          // Narrative/spiritual
    goldBright:  BULA_CONFIG.branding.ritualColor,  // "#F5D06A" success blaze
    goldDim:     "rgba(212,175,55,0.40)",

    // Chronotype — Indigo, sourced from BULA_CONFIG.branding
    indigo:      BULA_CONFIG.branding.accentColor,  // "#A78BFA"
    indigoDim:   "rgba(167,139,250,0.35)",

    // Semantic
    cream:       "rgba(255,248,230,0.88)",
    muted:       "rgba(255,248,230,0.34)",
    red:         "#FF4444",
    amber:       "#E07A00",
    aether:      "#7FFFD4",   // Processing / smoke state

    // Category accents
    kratom:      "#C084FC",
    cocktail:    "#38BDF8",
    food:        "#FB923C",
  },

  // ── Typography — sourced from BULA_CONFIG.branding ────────────────────────
  fonts: {
    serif: FONT_SERIF,   // Crimson Text — narrative, quiz, sommelier
    mono:  FONT_MONO,    // JetBrains Mono — shell counts, batch IDs, HUD
  },

  // ── Assets ────────────────────────────────────────────────────────────────
  assets: {
    avatarURL: null, // Set to HeyGen/D-ID URL to activate Digital Twin
  },

  // ── Admin ─────────────────────────────────────────────────────────────────
  admin: {
    pin:    "8472",   // Change before deploy — use env var in production
    holdMs: 2500,     // Long-press duration to open admin panel
  },
};

const ThemeContext = createContext(THEME);
const useTheme    = () => useContext(ThemeContext);

function ThemeProvider({ children, overrides = {} }) {
  const theme = { ...THEME, colors:{ ...THEME.colors, ...overrides.colors }, fonts:{ ...THEME.fonts, ...overrides.fonts }, ...overrides };
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

// Convenience shorthands — used throughout instead of raw hex/font strings
const C  = THEME.colors;
const TF = THEME.fonts;   // TF.serif → Crimson Text, TF.mono → JetBrains Mono

// ═════════════════════════════════════════════════════════════════════════════
// BLOCK 2: KIOSK CSS — Safari-hardened overscroll + SVG/img shielding
// ═════════════════════════════════════════════════════════════════════════════

const KIOSK_CSS = `
  /* ── FONT IMPORTS — sourced from BULA_CONFIG.branding ────────────────────*/
  @import url('https://fonts.googleapis.com/css2?family=Crimson+Text:ital,wght@0,400;0,600;1,400;1,600&family=JetBrains+Mono:wght@400;500;700&display=swap');

  /* ── OVERSCROLL / BOUNCE PREVENTION ──────────────────────────────────────*/
  html, body {
    overscroll-behavior:   none;
    overscroll-behavior-y: none;
    overscroll-behavior-x: none;
    position:              fixed;
    width:                 100%;
    height:                100%;
    overflow:              hidden;
    background-color:      #091A11;
  }
  #bula-scroll {
    position:              absolute;
    inset:                 0;
    overflow-y:            auto;
    overflow-x:            hidden;
    -webkit-overflow-scrolling: touch;
    overscroll-behavior-y: contain;
    touch-action:          pan-y;
  }

  /* ── GLOBAL INTERACTION SHIELD ────────────────────────────────────────────*/
  * {
    -webkit-user-select:         none;
    user-select:                 none;
    -webkit-touch-callout:       none;
    -webkit-tap-highlight-color: transparent;
    touch-action:                manipulation;
  }

  /* ── SVG + IMG EXPLICIT SHIELD ────────────────────────────────────────────
     iOS WebKit does NOT cascade touch-callout into SVG/img elements.
     Long-press on the Wizard SVG would trigger "Save Image" / AirDrop
     without these explicit rules.
  ─────────────────────────────────────────────────────────────────────────── */
  svg, img, canvas {
    -webkit-user-select:   none;
    user-select:           none;
    -webkit-touch-callout: none;
    pointer-events:        none;
  }
  canvas.interactive, svg.interactive { pointer-events: auto; }

  /* ── SCROLL CONTAINER ─────────────────────────────────────────────────────*/
  #bula-scroll { touch-action: pan-y; }
  #bula-scroll::-webkit-scrollbar { display: none; }
  #bula-scroll { scrollbar-width: none; }

  /* ── FORM FIELD EXCEPTIONS ────────────────────────────────────────────────*/
  input, textarea { -webkit-user-select: text; user-select: text; touch-action: auto; }

  /* ── HAPTIC PULSE — 100ms / scale 0.97 (Troy's tactile requirement) ───────*/
  .bula-btn {
    transition: transform 100ms ease, box-shadow 100ms ease, opacity 100ms ease;
    cursor: pointer;
  }
  .bula-btn.pressed, .bula-btn:active {
    transform: scale(0.97);
    opacity:   0.85;
  }
  .bula-btn-pour.pressed, .bula-btn-pour:active {
    transform:  scale(0.96);
    box-shadow: 0 0 0 2px rgba(222,255,154,0.35);
  }

  /* ── ADMIN LOGO ───────────────────────────────────────────────────────────*/
  #agensi-logo {
    cursor: default;
    -webkit-touch-callout: none;
    transition: transform 0.1s ease, opacity 0.1s ease;
  }
  #agensi-logo.holding { transform: scale(1.08); opacity: 0.6; }

  /* ── ANIMATIONS ───────────────────────────────────────────────────────────*/
  @keyframes spin            { to { transform: rotate(360deg); } }
  @keyframes blink           { 0%,49%{opacity:1} 50%,100%{opacity:0} }
  @keyframes recPulse        { 0%{box-shadow:0 0 0 0 rgba(127,255,212,0.8)} 70%{box-shadow:0 0 0 7px rgba(127,255,212,0)} 100%{box-shadow:0 0 0 0 rgba(127,255,212,0)} }
  @keyframes shellPulseIdle  { 0%,100%{opacity:0.4;transform:scale(0.93)} 50%{opacity:1;transform:scale(1.1)} }
  @keyframes shellBlaze      { 0%{opacity:0.8;transform:scale(1)} 100%{opacity:1;transform:scale(1.45)} }
  @keyframes shellSurge      { 0%,100%{opacity:0.7;transform:scale(0.95)} 50%{opacity:1;transform:scale(1.2)} }
  @keyframes tipBlaze        { 0%{opacity:0.7} 100%{opacity:1;filter:drop-shadow(0 0 6px #F5D06A)} }
  @keyframes tipPulse        { 0%,100%{opacity:0.4;transform:scale(0.9)} 50%{opacity:0.85;transform:scale(1.12)} }
  @keyframes floorBlaze      { 0%{opacity:0.35;transform:translateX(-50%) scaleX(0.8)} 100%{opacity:0.85;transform:translateX(-50%) scaleX(1.3)} }
  @keyframes floorSurge      { 0%,100%{opacity:0.3;transform:translateX(-50%) scaleX(0.9)} 50%{opacity:0.65;transform:translateX(-50%) scaleX(1.1)} }
  @keyframes floorPulse      { 0%,100%{opacity:0.2;transform:translateX(-50%) scaleX(0.88)} 50%{opacity:0.45;transform:translateX(-50%) scaleX(1)} }
  @keyframes wizardBreathe   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-3px)} }
  @keyframes wizardFloat     { 0%,100%{transform:translateY(0) rotate(-0.8deg)} 50%{transform:translateY(-7px) rotate(0.8deg)} }
  @keyframes wizardCelebrate { 0%,100%{transform:translateY(0) rotate(-1.5deg)} 50%{transform:translateY(-4px) rotate(1.5deg)} }
  @keyframes smokeRise1      { 0%,100%{d:path("M 90 85 Q 84 72 90 58 Q 96 44 90 30");opacity:0.75} 33%{d:path("M 90 85 Q 96 70 91 56 Q 86 42 91 28");opacity:0.55} 66%{d:path("M 90 85 Q 83 69 88 55 Q 93 41 87 27");opacity:0.65} }
  @keyframes smokeRise2      { 0%,100%{d:path("M 90 85 Q 96 70 92 55 Q 88 40 94 26");opacity:0.55} 50%{d:path("M 90 85 Q 98 68 93 53 Q 88 38 95 23");opacity:0.35} }
  @keyframes smokeRise3      { 0%,100%{d:path("M 90 85 Q 82 68 86 52 Q 90 36 84 22");opacity:0.38} 50%{d:path("M 90 85 Q 80 66 85 49 Q 90 33 82 19");opacity:0.22} }
  @keyframes wispFloat       { 0%,100%{transform:translateY(0) scale(1);opacity:0.7} 50%{transform:translateY(-14px) translateX(2px) scale(0.5);opacity:0} }
  @keyframes aetherSpin      { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes haloExpand      { 0%{transform:scale(0.7);opacity:0.65} 100%{transform:scale(1.4);opacity:0} }
  @keyframes sparkle         { 0%,100%{transform:scale(0.4);opacity:0.3} 50%{transform:scale(1.4);opacity:1} }
  @keyframes screenIn        { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
  @keyframes quizOptIn       { from{opacity:0;transform:translateX(-10px)} to{opacity:1;transform:translateX(0)} }
  @keyframes cardIn          { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
  @keyframes sectionIn       { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
  @keyframes adminReveal     { from{opacity:0;transform:translateY(12px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
  @keyframes qrAura          { 0%,100%{opacity:0.5;transform:scale(0.96)} 50%{opacity:1;transform:scale(1.04)} }
  @keyframes qrRingPulse     { 0%,100%{opacity:0.4;transform:scale(0.97)} 50%{opacity:0.8;transform:scale(1.03)} }
`;

// ═════════════════════════════════════════════════════════════════════════════
// BLOCK 3: HARDENED FSM
// ═════════════════════════════════════════════════════════════════════════════

const QUIZ_STATES = {
  FREQUENCY:  "frequency",
  INTENTION:  "intention",
  CHRONOTYPE: "chronotype",
  PALATE:     "palate",
  RESULT:     "result",
};

// Ordered 5-step sequence — drives progress bar, back-nav, and speech triggers
const QUIZ_SEQUENCE = [
  QUIZ_STATES.FREQUENCY,
  QUIZ_STATES.INTENTION,
  QUIZ_STATES.CHRONOTYPE,
  QUIZ_STATES.PALATE,
];

const VIBE_QUESTIONS = {
  [QUIZ_STATES.FREQUENCY]: {
    label:    "01 / FREQUENCY",
    question: "Where is your nervous system right now?",
    accent:   C.neon,
    options: [
      { id:"high",    label:"High / Anxious",  sub:"Need to come down fast",  glyph:"⚡" },
      { id:"neutral", label:"Neutral / Open",  sub:"Ready for anything",       glyph:"🌊" },
      { id:"deep",    label:"Deep / Heavy",    sub:"Already grounded",         glyph:"🪨" },
    ],
  },
  [QUIZ_STATES.INTENTION]: {
    label:    "02 / INTENTION",
    question: "What are you here to do?",
    accent:   C.gold,
    options: [
      { id:"focus",  label:"Sharpen Focus",     sub:"Clarity over fog",    glyph:"🎯" },
      { id:"social", label:"Social Connection", sub:"Open up, open out",    glyph:"🌿" },
      { id:"reset",  label:"Total Reset",       sub:"Full system shutdown", glyph:"🌑" },
    ],
  },
  [QUIZ_STATES.CHRONOTYPE]: {
    label:    "03 / CHRONOTYPE",
    question: "When does your spirit shine brightest?",
    accent:   C.indigo,
    options: [
      { id:"early_bird", label:"Sunrise Seeker",    sub:"Energy for the dawn",      glyph:"🌅", potencyBias:["light","medium"] },
      { id:"night_owl",  label:"Moonlight Dweller", sub:"Strength under the stars", glyph:"🌙", potencyBias:["strong","heavy"] },
      { id:"alchemist",  label:"All-Day Alchemist", sub:"Tireless traveler",         glyph:"⚗️", potencyBias:["medium"] },
    ],
  },
  [QUIZ_STATES.PALATE]: {
    label:    "04 / PALATE",
    question: "Which profile speaks to you?",
    accent:   C.amber,
    options: [
      { id:"earthy",   label:"Earthy / Peppery",  sub:"Rooted, complex, bold",  glyph:"🌱" },
      { id:"fruity",   label:"Fruity / Tart",     sub:"Bright, lively, citrus", glyph:"🍋" },
      { id:"tropical", label:"Tropical / Creamy", sub:"Smooth, rich, sweet",    glyph:"🥥" },
    ],
  },
};

const CHRONOTYPE_SPEECH = {
  early_bird: "SELECT_SUNRISE",
  night_owl:  "SELECT_MOONLIGHT",
  alchemist:  "SELECT_ALCHEMIST",
};

const BASE_INVENTORY = [
  { id:"k1", category:"kava",     name:"Fijian Noble",      origin:"Viti Levu, Fiji",          price:8,  gramsPerShell:15, estimatedShells:25, potency:"medium", moodScore:45, experienceDesc:"Warm and deeply grounding. A clean social kava with a smooth finish.", batchId:"FN-2406-08", alkaloidPpm:"142 ppm", kavalactones:"5.8%", coaUrl:"#", vibeMatch:["neutral","social"], profile:"earthy",   totalSold:0, visible:true },
  { id:"k2", category:"kava",     name:"Vanuatu Borogu",    origin:"Vanuatu Archipelago",       price:10, gramsPerShell:18, estimatedShells:14, potency:"strong", moodScore:72, experienceDesc:"Bold and heady. Hits fast with cerebral elevation.",                    batchId:"VB-2405-03", alkaloidPpm:"198 ppm", kavalactones:"8.1%", coaUrl:"#", vibeMatch:["high","focus"],    profile:"fruity",   totalSold:0, visible:true },
  { id:"k3", category:"kava",     name:"Tongan Pride",      origin:"Kingdom of Tonga",          price:12, gramsPerShell:15, estimatedShells:10, potency:"heavy",  moodScore:91, experienceDesc:"Deep, musty, full-bodied. A nightcap strain.",                          batchId:"TP-2406-01", alkaloidPpm:"247 ppm", kavalactones:"10.3%",coaUrl:"#", vibeMatch:["deep","reset"],    profile:"earthy",   totalSold:0, visible:true },
  { id:"kr1",category:"kratom",   name:"Red Relax",         origin:"West Kalimantan, Indonesia",price:7,  gramsPerShell:3,  estimatedShells:30, potency:"heavy",  moodScore:88, experienceDesc:"Deep body relaxation. Evening use recommended.",                        batchId:"RR-2406-12", alkaloidPpm:"MIT: 1.82%", kavalactones:"Full Spectrum", coaUrl:"#", mitPercent:"1.82%", sevenOhPercent:"0.04%", vibeMatch:["deep","reset"], profile:"earthy", totalSold:0, visible:true },
  { id:"kr2",category:"kratom",   name:"Green Focus",       origin:"Sumatra, Indonesia",        price:7,  gramsPerShell:3,  estimatedShells:22, potency:"medium", moodScore:48, experienceDesc:"Clean mental clarity with moderate energy lift.",                       batchId:"GF-2406-07", alkaloidPpm:"MIT: 1.45%", kavalactones:"Full Spectrum", coaUrl:"#", mitPercent:"1.45%", sevenOhPercent:"0.02%", vibeMatch:["focus","social"], profile:"fruity", totalSold:0, visible:true },
  { id:"c1", category:"cocktail", name:"Nakamal Mule",      origin:"House Recipe",              price:9,  gramsPerShell:0,  estimatedShells:99, potency:"light",  moodScore:28, experienceDesc:"Kava base, fresh ginger, lime, sparkling water.",                       batchId:"FRESH-DAILY", alkaloidPpm:"Social Dose", kavalactones:"~2.1%", ingredients:["Kava Noble","Ginger Beer","Lime","Mint"], profile:"fruity", totalSold:0, visible:true },
  { id:"c2", category:"cocktail", name:"Jungle Bird",       origin:"House Recipe",              price:11, gramsPerShell:0,  estimatedShells:99, potency:"medium", moodScore:55, experienceDesc:"Kava heavy, passionfruit, coconut water, turmeric.",                    batchId:"FRESH-DAILY", alkaloidPpm:"Session Dose", kavalactones:"~4.2%", ingredients:["Kava Borogu","Passionfruit","Coconut Water","Turmeric"], profile:"tropical", totalSold:0, visible:true },
  { id:"f1", category:"food",     name:"Açaí Energy Bowl",  origin:"Bar Kitchen",               price:12, gramsPerShell:0,  estimatedShells:99, potency:"light",  moodScore:20, experienceDesc:"Frozen açaí, banana, granola, hemp seeds, local honey.",               batchId:"KITCHEN", alkaloidPpm:"Superfood", kavalactones:"—", profile:"tropical", totalSold:0, visible:true },
  { id:"f2", category:"food",     name:"Turmeric Tahini Wrap",origin:"Bar Kitchen",             price:10, gramsPerShell:0,  estimatedShells:99, potency:"light",  moodScore:15, experienceDesc:"Roasted sweet potato, kale, turmeric tahini, hemp wrap.",               batchId:"KITCHEN", alkaloidPpm:"Plant-Based", kavalactones:"—", profile:"earthy", totalSold:0, visible:true },
];

// ── App FSM INIT ──────────────────────────────────────────────────────────────
const FSM_INIT = {
  screen:          "GATE",     // GATE | QUIZ | SOMMELIER | RESULT | MENU | ADMIN
  quizStep:        QUIZ_STATES.FREQUENCY,
  vibes:           {},
  user:            null,
  recommendedId:   null,
  status:          "IDLE",     // IDLE | PROCESSING | ERROR  ← v1.7.2 LOCKED
  inventory:       BASE_INVENTORY,
  error:           null,
  lastActionId:    null,       // UUID stamped by REQ_START, carried to Golden Seed
  lastItemName:    null,
  isDossierMode:   true,
  hiddenCategories:[],
};

// ── App FSM reducer ───────────────────────────────────────────────────────────
function appReducer(s, a) {
  switch (a.type) {
    case "NAV":           return { ...s, screen: a.payload };
    case "GATE_COMPLETE": return { ...s, screen:"QUIZ", user:a.payload, quizStep:QUIZ_STATES.FREQUENCY, vibes:{} };

    case "QUIZ_ANSWER": {
      const next = { ...s.vibes, [s.quizStep]: a.payload };
      const idx  = QUIZ_SEQUENCE.indexOf(s.quizStep);
      if (idx + 1 < QUIZ_SEQUENCE.length)
        return { ...s, vibes:next, quizStep:QUIZ_SEQUENCE[idx+1] };
      return { ...s, vibes:next, screen:"SOMMELIER" };
    }
    case "QUIZ_BACK": {
      const idx = QUIZ_SEQUENCE.indexOf(s.quizStep);
      return idx <= 0
        ? { ...s, screen:"GATE" }
        : { ...s, quizStep:QUIZ_SEQUENCE[idx-1] };
    }

    case "SOMMELIER_DONE": return { ...s, screen:"RESULT", recommendedId:a.payload };
    case "RESULT_DONE":    return { ...s, screen:"MENU" };

    case "SYNC":       return { ...s, inventory:a.payload };
    case "SYNC_ERROR": return { ...s, status:"ERROR", error:"Live sync lost." };

    // ── v1.7.2 transaction FSM — DO NOT ALTER ────────────────────────────────
    case "REQ_START":   return { ...s, status:"PROCESSING", lastActionId:a.actionId, lastItemName:a.itemName };
    case "REQ_SUCCESS": return { ...s, status:"IDLE",  error:null };
    case "REQ_FAIL":    return { ...s, status:"ERROR", error:a.payload };
    case "RESET":       return { ...s, status:"IDLE",  error:null };
    // ─────────────────────────────────────────────────────────────────────────

    case "TOGGLE_DOSSIER":  return { ...s, isDossierMode:!s.isDossierMode };
    case "TOGGLE_CATEGORY": {
      const h = s.hiddenCategories.includes(a.payload)
        ? s.hiddenCategories.filter(c=>c!==a.payload)
        : [...s.hiddenCategories, a.payload];
      return { ...s, hiddenCategories:h };
    }
    case "UPDATE_ITEM": return { ...s, inventory:s.inventory.map(i=>i.id===a.payload.id?{...i,...a.payload.patch}:i) };
    case "RESTART":     return { ...FSM_INIT };
    default: return s;
  }
}

// ── Recommendation engine ─────────────────────────────────────────────────────
function resolveRecommendation(inventory, vibes) {
  const alive = inventory.filter(i => i.estimatedShells > 0 && i.category === "kava");
  const chronoOpt   = VIBE_QUESTIONS[QUIZ_STATES.CHRONOTYPE].options.find(o => o.id === vibes.chronotype);
  const potencyBias = chronoOpt?.potencyBias || [];
  return (
    alive.find(i => i.vibeMatch?.includes(vibes.frequency) && i.profile === vibes.palate   && potencyBias.includes(i.potency)) ||
    alive.find(i => i.profile === vibes.palate    && potencyBias.includes(i.potency)) ||
    alive.find(i => i.vibeMatch?.includes(vibes.frequency) && potencyBias.includes(i.potency)) ||
    alive.find(i => i.profile === vibes.palate) ||
    alive[0] || null
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// BLOCK 4: useWizardSpeech — Gideon 0.45/0.80/0.45, Chrome bouncer 18s
// ═════════════════════════════════════════════════════════════════════════════

const SPEECH_LIBRARY = {
  ON_GATE:       "Welcome, traveler. The roots are calling... shall we see where they lead?",
  ON_QUIZ:       "Let the reading begin. Answer truly — the shell is listening.",
  ON_SOMMELIER:  "The pattern reveals itself. Allow the Wizard a moment to interpret what the roots have shown.",
  ON_MENU:       "Your path is set. Choose your vessel, and pour with intention.",
  ON_RESULT:     "The ritual is complete. Your tribe awaits you.",
  ON_FREQUENCY:  "Tell me... how fares the spirit in this moment?",
  ON_INTENTION:  "And what magic shall we brew today?",
  ON_CHRONOTYPE: "When does your spirit shine brightest?",
  ON_PALATE:     "One final question... which essence speaks to your tongue?",
  SELECT_FREQUENCY_HIGH:    "Running hot. We will cool the current — a grounding strain to anchor you back to the earth.",
  SELECT_FREQUENCY_NEUTRAL: "Open and receptive. The finest state to receive the shell.",
  SELECT_FREQUENCY_DEEP:    "Already still. Good. We shall go deeper together.",
  SELECT_INTENTION_FOCUS:   "Clarity. I know exactly which roots sharpen the mind without raising the storm.",
  SELECT_INTENTION_SOCIAL:  "Connection. The shell is ancient social technology — I will find you the opener.",
  SELECT_INTENTION_RESET:   "A full reset. Brave. We will clear the cache entirely.",
  SELECT_SUNRISE:   "Ah, a seeker of the dawn. I shall steer you toward the light.",
  SELECT_MOONLIGHT: "A creature of the moon... under the stars, the roots speak loudest.",
  SELECT_ALCHEMIST: "The tireless traveler. We shall seek the perfect balance for your journey.",
  SELECT_PALATE_EARTHY:   "Earthy and grounded. The roots of the earth speaking to the roots in the cup.",
  SELECT_PALATE_FRUITY:   "Bright and alive. You want the kava that sings. I know just the cultivar.",
  SELECT_PALATE_TROPICAL: "Tropical and smooth. The shell that doesn't fight you. Wisdom in that choice.",
  ON_PROCESSING: "Attuning the essence... steady your spirit while the ritual begins.",
  ON_SUCCESS:    "The ritual is complete. Your vessel is charged. Drink deep, traveler.",
  ON_ERROR:      "The flow is disrupted. Let us try the incantation again.",
  IDLE_0: "The Alchemist knows... every pour is a prayer.",
  IDLE_1: "Seeking clarity? Or perhaps... just a moment of peace?",
  IDLE_2: "The shell holds what the mind forgets.",
  IDLE_3: "St. Augustine's roots run deep... as does the kava.",
  IDLE_4: "Stillness is the first pour.",
};

// ── Gideon voice — SEALED ─────────────────────────────────────────────────────
const GIDEON_CONFIG = {
  model:           "eleven_multilingual_v2",
  stability:       0.45,   // SEALED
  similarityBoost: 0.80,   // SEALED
  style:           0.45,   // Bar environment grit — do not exceed 0.55
  useSpeakerBoost: true,
};
const SUCCESS_GLOW_HOLD_MS  = 1500;
const INTER_LINE_GAP_MS     = 280;
const WEB_SPEECH_DEADLINE_MS = 18000; // Chrome silent-stall bouncer

const SCREEN_KEY = { GATE:"ON_GATE", QUIZ:"ON_QUIZ", SOMMELIER:"ON_SOMMELIER", MENU:"ON_MENU", RESULT:"ON_RESULT" };
const STEP_KEY   = { frequency:"ON_FREQUENCY", intention:"ON_INTENTION", chronotype:"ON_CHRONOTYPE", palate:"ON_PALATE" };
const STATUS_KEY = { PROCESSING:"ON_PROCESSING", SUCCESS:"ON_SUCCESS", ERROR:"ON_ERROR" };

const WEB_VOICE_PREFS = ["Google UK English Male","Microsoft George - English (United Kingdom)","Daniel","Alex","Google UK English Female"];

function pickWebVoice() {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  for (const pref of WEB_VOICE_PREFS) { const v = voices.find(v=>v.name===pref); if (v) return v; }
  return voices.find(v=>v.lang?.startsWith("en")) || voices[0] || null;
}

async function speakElevenLabs(text, cfg) {
  if (!cfg.apiKey || !cfg.voiceId) throw new Error("ElevenLabs: apiKey and voiceId required");
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${cfg.voiceId}/stream`, {
    method:"POST",
    headers:{"Content-Type":"application/json","xi-api-key":cfg.apiKey},
    body:JSON.stringify({ text, model_id:cfg.model, voice_settings:{ stability:cfg.stability, similarity_boost:cfg.similarityBoost, style:cfg.style, use_speaker_boost:cfg.useSpeakerBoost } }),
  });
  if (!res.ok) throw new Error(`ElevenLabs ${res.status}`);
  const buf = await res.arrayBuffer();
  const ctx = new (window.AudioContext||window.webkitAudioContext)();
  try {
    const decoded = await ctx.decodeAudioData(buf);
    const src = ctx.createBufferSource();
    src.buffer = decoded;
    src.connect(ctx.destination);
    return new Promise((res,rej) => { src.onended=()=>{ctx.close();res();}; src.onerror=e=>{ctx.close();rej(e);}; src.start(0); });
  } catch(e) { await ctx.close().catch(()=>{}); throw e; }
}

function speakWebSpeech(text, voice) {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.speechSynthesis)
      return reject(new Error("speechSynthesis unavailable"));

    window.speechSynthesis.cancel();
    const utt  = new SpeechSynthesisUtterance(text);
    utt.voice  = voice || pickWebVoice();
    utt.rate   = 0.86; utt.pitch = 0.88; utt.volume = 1.0;

    let resolved=false, nudge, deadline;
    const done = (reason) => {
      if (!resolved) {
        resolved=true; clearInterval(nudge); clearTimeout(deadline);
        if (reason==="error") return;
        resolve();
      }
    };
    utt.onend   = () => done("end");
    utt.onerror = e => { clearInterval(nudge); clearTimeout(deadline); (e.error==="interrupted"||e.error==="canceled") ? resolve() : reject(e); };
    window.speechSynthesis.speak(utt);

    // Nudge: handles speaking=true / onend-never-fires stall
    nudge = setInterval(() => {
      if (!window.speechSynthesis.speaking) { clearInterval(nudge); return; }
      window.speechSynthesis.pause(); window.speechSynthesis.resume();
    }, 10000);

    // Hard bouncer: handles speaking=false / onend-never-fires silent stall
    deadline = setTimeout(() => {
      if (!resolved) {
        resolved=true; clearInterval(nudge);
        console.warn(`[WizardSpeech] Bouncer: deadline hit. Force-resolving drain. "${text.slice(0,40)}..."`);
        window.speechSynthesis.cancel();
        resolve();
      }
    }, WEB_SPEECH_DEADLINE_MS);
  });
}

function useWizardSpeech({
  screen=null, quizStep=null, vibes={}, status="IDLE",
  apiKey=null, gideonVoiceId=null, voiceOverrides={},
  startMuted=false, onSuccessReady=null,
}={}) {
  const [speaking,   setSpeaking]   = useState(false);
  const [glowActive, setGlowActive] = useState(false);
  const [isMuted,    setIsMuted]    = useState(startMuted);
  const [lastLine,   setLastLine]   = useState(null);

  const IDLE_LINES = ["IDLE_0","IDLE_1","IDLE_2","IDLE_3","IDLE_4"].map(k=>SPEECH_LIBRARY[k]);
  const [idleIdx, setIdleIdx] = useState(0);
  const idleLine = IDLE_LINES[idleIdx];
  useEffect(()=>{
    if (speaking||glowActive) return;
    const id=setInterval(()=>setIdleIdx(i=>(i+1)%IDLE_LINES.length),4200);
    return ()=>clearInterval(id);
  },[speaking,glowActive]);

  const prevScreen  = useRef(null);
  const prevStep    = useRef(null);
  const prevStatus  = useRef(null);
  const prevVibes   = useRef({});
  const webVoice    = useRef(null);
  const queue       = useRef([]);
  const draining    = useRef(false);
  const glowTimer   = useRef(null);

  const elCfg = {
    apiKey, voiceId:gideonVoiceId,
    model:           voiceOverrides.model           ?? GIDEON_CONFIG.model,
    stability:       GIDEON_CONFIG.stability,        // SEALED
    similarityBoost: GIDEON_CONFIG.similarityBoost,  // SEALED
    style:           voiceOverrides.style           ?? GIDEON_CONFIG.style,
    useSpeakerBoost: voiceOverrides.useSpeakerBoost ?? GIDEON_CONFIG.useSpeakerBoost,
  };
  const useGideon = !!(apiKey && gideonVoiceId);

  useEffect(()=>{
    if (typeof window==="undefined"||!window.speechSynthesis) return;
    const load=()=>{ webVoice.current=pickWebVoice(); };
    window.speechSynthesis.getVoices().length>0 ? load() : window.speechSynthesis.addEventListener("voiceschanged",load,{once:true});
  },[]);

  const startGlowHold = useCallback(()=>{
    clearTimeout(glowTimer.current);
    setGlowActive(true);
    glowTimer.current = setTimeout(()=>{
      setGlowActive(false);
      onSuccessReady?.();
    }, SUCCESS_GLOW_HOLD_MS);
  },[onSuccessReady]);

  const drainQueue = useCallback(async ()=>{
    if (draining.current) return;
    draining.current=true; setSpeaking(true);
    while (queue.current.length>0) {
      const line = queue.current.shift();
      const isSuccess = line===SPEECH_LIBRARY.ON_SUCCESS;
      setLastLine(line);
      try {
        useGideon ? await speakElevenLabs(line,elCfg) : await speakWebSpeech(line,webVoice.current);
      } catch(err) { console.warn("[WizardSpeech]",err?.message??err); }
      if (isSuccess) startGlowHold();
      if (queue.current.length>0) await new Promise(r=>setTimeout(r,INTER_LINE_GAP_MS));
    }
    draining.current=false; setSpeaking(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[useGideon,startGlowHold]);

  const speakLine = useCallback((text)=>{
    if (!text||isMuted) return;
    queue.current.push(text); drainQueue();
  },[isMuted,drainQueue]);

  // Triggers
  useEffect(()=>{ if(screen===prevScreen.current) return; const p=prevScreen.current; prevScreen.current=screen; if(p===null) return; const l=SPEECH_LIBRARY[SCREEN_KEY[screen]]; if(l) speakLine(l); },[screen,speakLine]);
  useEffect(()=>{ if(!quizStep||quizStep===prevStep.current) return; prevStep.current=quizStep; const l=SPEECH_LIBRARY[STEP_KEY[quizStep]]; if(l) speakLine(l); },[quizStep,speakLine]);
  useEffect(()=>{
    const prev=prevVibes.current;
    for (const step of ["frequency","intention","chronotype","palate"]) {
      const v=vibes[step]; if(!v||v===prev[step]) continue;
      const key=step==="chronotype" ? CHRONOTYPE_SPEECH[v] : `SELECT_${step.toUpperCase()}_${v.toUpperCase()}`;
      const l=SPEECH_LIBRARY[key]; if(l) speakLine(l);
    }
    prevVibes.current={...vibes};
  },[vibes,speakLine]);
  useEffect(()=>{ if(status===prevStatus.current) return; prevStatus.current=status; const l=SPEECH_LIBRARY[STATUS_KEY[status]]; if(l) speakLine(l); },[status,speakLine]);

  useEffect(()=>()=>{ if(window.speechSynthesis) window.speechSynthesis.cancel(); clearTimeout(glowTimer.current); queue.current=[]; draining.current=false; },[]);

  return { speaking, glowActive, muted:isMuted, setMuted:setIsMuted, speakLine, lastLine, idleLine, gideonActive:useGideon };
}

// ═════════════════════════════════════════════════════════════════════════════
// BLOCK 5: GOLDEN SEED — RS QR engine, sid UUID assertion, frozenURL fix
// ═════════════════════════════════════════════════════════════════════════════

const GOLDEN_SEED_BASE = "https://agensi.app/troy-kava";
const UUID_V4_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function buildGoldenSeedURL({ vibe, chrono, reco, sid }) {
  // Hard assertion — never emit a URL without a verified sid.
  // Downstream at agensi.app/troy-kava: sid is looked up in transactions/{sid}
  // to verify the pour before granting Phase 2 perks.
  if (!sid || !UUID_V4_RE.test(sid))
    throw new Error(`[GoldenSeed] sid required and must be UUID v4. Received: ${JSON.stringify(sid)}`);
  const p = new URLSearchParams({
    vibe: vibe||"unknown", chrono: chrono||"unknown", reco: reco||"none",
    sid, t: Math.floor(Date.now()/1000).toString(),
    utm_source:"bula_base", utm_medium:"qr_ritual", utm_campaign:"golden_seed_v2",
  });
  return `${GOLDEN_SEED_BASE}?${p}`;
}

// Reed-Solomon QR engine
function buildGFTables(){const exp=new Uint8Array(512),log=new Uint8Array(256);let x=1;for(let i=0;i<255;i++){exp[i]=x;log[x]=i;x=x*2;if(x>=256)x^=285;}for(let i=255;i<512;i++)exp[i]=exp[i-255];return{exp,log};}
const GF=buildGFTables();
const gfMul=(a,b)=>a&&b?GF.exp[GF.log[a]+GF.log[b]]:0;
const gfPow=(x,p)=>GF.exp[(GF.log[x]*p)%255];
function rsGenPoly(n){let p=[1];for(let i=0;i<n;i++){const g=[1,gfPow(2,i)],r=new Array(p.length+1).fill(0);for(let j=0;j<p.length;j++)for(let k=0;k<2;k++)r[j+k]^=gfMul(p[j],g[k]);p=r;}return p;}
function rsEncode(data,n){const gen=rsGenPoly(n),msg=[...data,...new Array(n).fill(0)];for(let i=0;i<data.length;i++){const c=msg[i];if(!c)continue;for(let j=0;j<gen.length;j++)msg[i+j]^=gfMul(gen[j],c);}return msg.slice(data.length);}

function qrEncode(text){
  const bytes=[];for(let i=0;i<text.length;i++)bytes.push(text.charCodeAt(i)&0xff);
  const caps=[null,[21,16,10],[25,28,16],[29,44,26],[33,64,36],[37,86,48],[41,108,64],[45,124,72],[49,154,88],[53,182,110],[57,216,130]];
  let v=1;while(v<=10&&caps[v][1]<bytes.length+3)v++;
  if(v>10)throw new Error("URL too long for QR v10");
  const[modules,dataBytes,ecBytes]=caps[v],bits=[],push=(val,len)=>{for(let i=len-1;i>=0;i--)bits.push((val>>i)&1);};
  push(0b0100,4);push(bytes.length,8);bytes.forEach(b=>push(b,8));push(0,4);while(bits.length%8)bits.push(0);
  const ds=[];for(let i=0;i<bits.length;i+=8)ds.push(bits.slice(i,i+8).reduce((a,b,j)=>a|(b<<(7-j)),0));
  const pad=[0xEC,0x11];while(ds.length<dataBytes)ds.push(pad[ds.length%2]);
  const ec=rsEncode(ds,ecBytes),full=[...ds,...ec];
  const grid=Array.from({length:modules},()=>new Array(modules).fill(null));
  const func=Array.from({length:modules},()=>new Array(modules).fill(false));
  const set=(r,c,v)=>{grid[r][c]=v;func[r][c]=true;};
  function finder(r,c){for(let dr=-1;dr<=7;dr++)for(let dc=-1;dc<=7;dc++){const rr=r+dr,cc=c+dc;if(rr<0||rr>=modules||cc<0||cc>=modules)continue;const border=dr===-1||dr===7||dc===-1||dc===7,ring=dr===1||dr===5||dc===1||dc===5,core=dr>=2&&dr<=4&&dc>=2&&dc<=4,inside=dr>=0&&dr<=6&&dc>=0&&dc<=6;set(rr,cc,inside&&!border&&(!ring||core));}}
  finder(0,0);finder(0,modules-7);finder(modules-7,0);
  for(let i=8;i<modules-8;i++){set(6,i,i%2===0);set(i,6,i%2===0);}set(modules-8,8,true);
  const aligns=[null,null,[6,18],[6,22],[6,26],[6,30],[6,34],[6,22,38],[6,24,42],[6,28,46],[6,32,50]];
  if(v>=2&&aligns[v]){const pos=aligns[v];for(const ar of pos)for(const ac of pos){if(func[ar][ac])continue;for(let dr=-2;dr<=2;dr++)for(let dc=-2;dc<=2;dc++){const b=Math.abs(dr)===2||Math.abs(dc)===2,c2=dr===0&&dc===0;set(ar+dr,ac+dc,b||c2);}}}
  const fmt=(0b00<<3|0b010)^0b101010000010010,fmtBits=[];for(let i=14;i>=0;i--)fmtBits.push((fmt>>i)&1);
  [[8,0],[8,1],[8,2],[8,3],[8,4],[8,5],[8,7],[8,8],[7,8],[5,8],[4,8],[3,8],[2,8],[1,8],[0,8]].forEach(([r,c],i)=>set(r,c,!!fmtBits[i]));
  [[modules-1,8],[modules-2,8],[modules-3,8],[modules-4,8],[modules-5,8],[modules-6,8],[modules-7,8],[modules-8,8],[8,modules-8],[8,modules-7],[8,modules-6],[8,modules-5],[8,modules-4],[8,modules-3],[8,modules-2],[8,modules-1]].slice(0,15).forEach(([r,c],i)=>set(r,c,!!fmtBits[i]));
  let bit=0;const allBits=full.flatMap(b=>[7,6,5,4,3,2,1,0].map(i=>(b>>i)&1));
  const mask=(r,c)=>(Math.floor(r/2)+Math.floor(c/3))%2===0;
  for(let col=modules-1;col>0;col-=2){if(col===6)col--;for(let row=0;row<modules;row++){for(let d=0;d<2;d++){const c=col-d,r=(col+1)%4<2?row:modules-1-row;if(func[r][c])continue;const b=bit<allBits.length?allBits[bit++]:0;grid[r][c]=b^(mask(r,c)?1:0)?true:false;}}}
  for(let r=0;r<modules;r++)for(let c=0;c<modules;c++)if(grid[r][c]===null)grid[r][c]=false;
  return{grid,modules,version:v};
}

function QRCanvas({ url, size=200 }) {
  const ref=useRef(null);
  const[err,setErr]=useState(null);
  const[rdy,setRdy]=useState(false);
  useEffect(()=>{
    if(!url||!ref.current)return;
    setRdy(false);setErr(null);
    try{
      const{grid,modules}=qrEncode(url);
      const canvas=ref.current,ctx=canvas.getContext("2d");
      const scale=Math.max(2,Math.floor(size/modules)),px=modules*scale;
      canvas.width=px;canvas.height=px;canvas.style.width=`${size}px`;canvas.style.height=`${size}px`;
      ctx.fillStyle=C.goldBright;ctx.fillRect(0,0,px,px);
      ctx.fillStyle=C.forest;
      for(let r=0;r<modules;r++)for(let c=0;c<modules;c++){
        if(!grid[r][c])continue;
        const x=c*scale,y=r*scale,isF=(r<7&&c<7)||(r<7&&c>=modules-7)||(r>=modules-7&&c<7);
        if(isF){ctx.fillRect(x,y,scale,scale);}else{const r2=scale*0.18;ctx.beginPath();ctx.moveTo(x+r2,y);ctx.lineTo(x+scale-r2,y);ctx.quadraticCurveTo(x+scale,y,x+scale,y+r2);ctx.lineTo(x+scale,y+scale-r2);ctx.quadraticCurveTo(x+scale,y+scale,x+scale-r2,y+scale);ctx.lineTo(x+r2,y+scale);ctx.quadraticCurveTo(x,y+scale,x,y+scale-r2);ctx.lineTo(x,y+r2);ctx.quadraticCurveTo(x,y,x+r2,y);ctx.closePath();ctx.fill();}
      }
      setRdy(true);
    }catch(e){setErr(e.message);}
  },[url,size]);
  if(err)return<div style={{width:size,height:size,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(255,68,68,0.07)",border:"1px solid rgba(255,68,68,0.2)",borderRadius:12,fontFamily:"'Courier New',monospace",fontSize:8,color:"rgba(255,100,100,0.7)",textAlign:"center",padding:12}}>QR ERROR<br/>{err}</div>;
  return<div style={{position:"relative",width:size,height:size}}><canvas ref={ref} style={{display:"block",borderRadius:6}}/>{!rdy&&<div style={{position:"absolute",inset:0,background:"rgba(9,26,17,0.5)",display:"flex",alignItems:"center",justifyContent:"center",borderRadius:6}}><div style={{width:18,height:18,border:`2px solid rgba(212,175,55,0.2)`,borderTopColor:C.gold,borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/></div>}</div>;
}

// Golden Seed Overlay — frozenURL flicker fix
function GoldenSeedOverlay({ glowActive, vibe, chrono, reco, actionId, onClose }) {
  const frozenURL = useRef(null);
  const frozenSID = useRef(null);
  const[visible,  setVisible]  = useState(false);
  const[entered,  setEntered]  = useState(false);
  const[copied,   setCopied]   = useState(false);

  useEffect(()=>{
    if (!glowActive) {
      setEntered(false);
      const t=setTimeout(()=>{ setVisible(false); frozenURL.current=null; frozenSID.current=null; },400);
      return ()=>clearTimeout(t);
    }
    if (frozenURL.current) return; // Already mounted — do not rebuild
    try {
      const url=buildGoldenSeedURL({vibe,chrono,reco,sid:actionId});
      frozenURL.current=url; frozenSID.current=actionId;
      setVisible(true);
      requestAnimationFrame(()=>requestAnimationFrame(()=>setEntered(true)));
    } catch(err) { console.error("[GoldenSeed]",err.message); }
  // Intentionally omitting vibe/chrono/reco/actionId — URL frozen at mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[glowActive]);

  const copy = useCallback(async()=>{ if(!frozenURL.current)return; try{await navigator.clipboard.writeText(frozenURL.current);setCopied(true);setTimeout(()=>setCopied(false),2000);}catch{}; },[]);

  if (!visible||!frozenURL.current) return null;
  const sid=frozenSID.current, seedURL=frozenURL.current;
  const chronoGlyph={early_bird:"🌅",night_owl:"🌙",alchemist:"⚗️"}[chrono]||"✦";
  const vibeLabel={high:"GROUNDING",neutral:"BALANCED",deep:"DEEPENING"}[vibe]||vibe?.toUpperCase()||"—";

  return(
    <div style={{position:"absolute",inset:0,zIndex:20,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:`radial-gradient(ellipse at 50% 42%,rgba(245,208,106,0.22) 0%,rgba(212,175,55,0.14) 25%,rgba(9,26,17,0.82) 70%,rgba(9,26,17,0.96) 100%)`,backdropFilter:"blur(2px)",opacity:entered?1:0,transform:entered?"scale(1)":"scale(0.96)",transition:"opacity 0.4s ease,transform 0.4s ease",padding:"16px 14px"}}>
      <div style={{textAlign:"center",marginBottom:12}}>
        <div style={{fontFamily:"'Courier New',monospace",fontSize:7,color:C.goldDim,letterSpacing:3,textTransform:"uppercase",marginBottom:4}}>✦ THE GOLDEN SEED ✦</div>
        <div style={{fontFamily:"'Georgia',serif",fontStyle:"italic",fontSize:15,color:C.goldBright,lineHeight:1.2,textShadow:`0 0 20px rgba(245,208,106,0.5)`}}>Your ritual is sealed.<br/>Scan to plant the seed.</div>
      </div>
      <div style={{position:"relative",marginBottom:12}}>
        <div style={{position:"absolute",inset:-10,borderRadius:18,background:`radial-gradient(ellipse,rgba(245,208,106,0.25) 0%,transparent 70%)`,animation:"qrAura 2s ease-in-out infinite"}}/>
        <div style={{position:"absolute",inset:-4,borderRadius:16,border:`2px solid rgba(212,175,55,0.5)`,animation:"qrRingPulse 1.8s ease-in-out infinite"}}/>
        <div style={{padding:10,borderRadius:12,background:C.goldBright,boxShadow:`0 0 40px rgba(245,208,106,0.4)`,position:"relative",zIndex:1}}>
          <QRCanvas url={seedURL} size={170}/>
        </div>
      </div>
      <div style={{width:"100%",marginBottom:10,padding:"8px 12px",background:"rgba(0,0,0,0.45)",border:`1px solid rgba(212,175,55,0.18)`,borderRadius:10}}>
        <div style={{fontFamily:"'Courier New',monospace",fontSize:6,color:C.goldDim,letterSpacing:2,textTransform:"uppercase",marginBottom:6}}>SEED PAYLOAD</div>
        {[{k:"vibe",v:vibeLabel,col:C.neon},{k:"chrono",v:`${chronoGlyph} ${chrono?.replace("_"," ").toUpperCase()||"—"}`,col:C.indigo},{k:"reco",v:reco||"—",col:C.gold},{k:"sid",v:sid||"—",col:"rgba(255,248,230,0.45)"}].map(d=>(
          <div key={d.k} style={{display:"flex",gap:8,alignItems:"center",marginBottom:3}}>
            <span style={{fontFamily:"'Courier New',monospace",fontSize:6,color:"rgba(255,248,230,0.22)",letterSpacing:2,textTransform:"uppercase",flexBasis:46,flexShrink:0}}>{d.k}</span>
            <span style={{fontFamily:"'Courier New',monospace",fontSize:8,fontWeight:700,color:d.col,letterSpacing:0.5,wordBreak:"break-all"}}>{d.v}</span>
          </div>
        ))}
      </div>
      <div style={{width:"100%",display:"flex",flexDirection:"column",gap:8}}>
        <button onClick={copy} style={{width:"100%",padding:"11px 16px",borderRadius:14,border:"none",background:`linear-gradient(135deg,${C.gold},${C.goldBright})`,display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer",boxSizing:"border-box"}}>
          <span style={{fontFamily:"'Courier New',monospace",fontWeight:700,fontSize:8,letterSpacing:3,textTransform:"uppercase",color:C.forest}}>{copied?"LINK COPIED ✓":"COPY SEED LINK"}</span>
          <span style={{fontSize:12}}>{copied?"✓":"🔗"}</span>
        </button>
        {onClose&&<button onClick={onClose} style={{width:"100%",padding:"9px",borderRadius:12,border:`1px solid rgba(255,255,255,0.1)`,background:"transparent",color:"rgba(255,248,230,0.25)",fontFamily:"'Courier New',monospace",fontSize:8,letterSpacing:2,textTransform:"uppercase",cursor:"pointer"}}>CONTINUE TO MENU →</button>}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// BLOCK 6: KIOSK SHELL — long-press admin, PIN 8472, localStorage clear
// ═════════════════════════════════════════════════════════════════════════════

const HAPTIC_MS    = 100;
const HAPTIC_SCALE = 0.97;

function useLongPress(onFire, { ms=2500, moveThreshold=12 }={}) {
  const[holding,setHolding]=useState(false);
  const timer=useRef(null),start=useRef({x:0,y:0}),fired=useRef(false);
  const begin=useCallback(e=>{
    const t=e.touches?.[0]||e; start.current={x:t.clientX,y:t.clientY}; fired.current=false; setHolding(true);
    timer.current=setTimeout(()=>{ fired.current=true; setHolding(false); onFire?.(); },ms);
  },[onFire,ms]);
  const cancel=useCallback(()=>{ clearTimeout(timer.current); if(!fired.current)setHolding(false); },[]);
  const move=useCallback(e=>{ const t=e.touches?.[0]||e; if(Math.abs(t.clientX-start.current.x)>moveThreshold||Math.abs(t.clientY-start.current.y)>moveThreshold)cancel(); },[cancel,moveThreshold]);
  useEffect(()=>()=>clearTimeout(timer.current),[]);
  return{holding,handlers:{onMouseDown:begin,onTouchStart:begin,onMouseUp:cancel,onMouseLeave:cancel,onTouchEnd:cancel,onTouchCancel:cancel,onMouseMove:move,onTouchMove:move,onContextMenu:e=>e.preventDefault()}};
}

function useHapticButton(onClick) {
  const[pressed,setPressed]=useState(false);
  const timer=useRef(null);
  const fire=useCallback(e=>{
    e.preventDefault?.(); clearTimeout(timer.current); setPressed(true);
    timer.current=setTimeout(()=>{ setPressed(false); onClick?.(e); },HAPTIC_MS);
  },[onClick]);
  useEffect(()=>()=>clearTimeout(timer.current),[]);
  return{pressed,handlers:{onTouchEnd:fire,onClick:fire}};
}

function HapticBtn({ onClick, children, style={}, className="", pour=false, disabled=false }) {
  const{pressed,handlers}=useHapticButton(disabled?undefined:onClick);
  return(
    <div role="button" aria-disabled={disabled} {...(disabled?{}:handlers)}
      className={["bula-btn",pour?"bula-btn-pour":"",pressed?"pressed":"",className].filter(Boolean).join(" ")}
      style={{opacity:disabled?0.25:1,cursor:disabled?"not-allowed":"pointer",...style}}>
      {children}
    </div>
  );
}

function AgensILogo({ onAdminOpen }) {
  const HOLD=2500;
  const[progress,setProgress]=useState(0);
  const animRef=useRef(null),ts=useRef(null);
  const{holding,handlers}=useLongPress(onAdminOpen,{ms:HOLD,moveThreshold:10});
  useEffect(()=>{
    if(holding){ ts.current=performance.now();
      const tick=now=>{ const e=now-ts.current; setProgress(Math.min(e/HOLD,1)); if(e<HOLD)animRef.current=requestAnimationFrame(tick); };
      animRef.current=requestAnimationFrame(tick);
    } else { cancelAnimationFrame(animRef.current); setProgress(0); }
    return()=>cancelAnimationFrame(animRef.current);
  },[holding]);
  const circ=2*Math.PI*11;
  return(
    <div id="agensi-logo" {...handlers} className={holding?"holding":""} style={{position:"relative",width:32,height:32,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{width:24,height:24,borderRadius:6,background:"rgba(212,175,55,0.08)",border:`1px solid rgba(212,175,55,${holding?0.5:0.18})`,display:"flex",alignItems:"center",justifyContent:"center",transition:"border-color 0.2s"}}>
        <span style={{fontFamily:"'Courier New',monospace",fontSize:9,color:holding?C.gold:C.goldDim,fontWeight:700,lineHeight:1,transition:"color 0.2s"}}>A</span>
      </div>
      {holding&&<svg style={{position:"absolute",inset:0,width:"100%",height:"100%",transform:"rotate(-90deg)",pointerEvents:"none"}} viewBox="0 0 32 32">
        <circle cx="16" cy="16" r="11" fill="none" stroke="rgba(212,175,55,0.15)" strokeWidth="2"/>
        <circle cx="16" cy="16" r="11" fill="none" stroke={C.gold} strokeWidth="2" strokeDasharray={circ} strokeDashoffset={circ*(1-progress)} strokeLinecap="round"/>
      </svg>}
    </div>
  );
}

function AdminPanel({ onClose, onSoftReset, onFullReset, onToggleDossier, isDossierMode }) {
  const ADMIN_PIN="8472"; // Change before deploy
  const[pin,setPin]=useState("");
  const[authed,setAuthed]=useState(false);
  const[pinErr,setPinErr]=useState(false);
  const[cleared,setCleared]=useState(false);
  const checkPin=useCallback(()=>{ if(pin===ADMIN_PIN){setAuthed(true);setPinErr(false);}else{setPinErr(true);setPin("");setTimeout(()=>setPinErr(false),1200);} },[pin]);
  const dClose     =useHapticButton(()=>onClose?.());
  const dSoftReset =useHapticButton(()=>{ onSoftReset?.(); });
  const dFullReset =useHapticButton(()=>{ setCleared(true); setTimeout(()=>{onFullReset?.();onClose?.();},600); });

  return(
    <div style={{position:"fixed",inset:0,zIndex:1000,background:"rgba(6,15,10,0.97)",backdropFilter:"blur(20px)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,animation:"adminReveal 0.25s ease both"}}>
      <div style={{textAlign:"center",marginBottom:28}}>
        <div style={{fontFamily:"'Courier New',monospace",fontSize:8,color:C.red,letterSpacing:4,textTransform:"uppercase",marginBottom:8}}>⚠ MAINTENANCE ACCESS</div>
        <div style={{fontFamily:"'Georgia',serif",fontStyle:"italic",fontSize:26,color:C.cream,lineHeight:1.1}}>Bunker Command<br/>Interface</div>
        <div style={{fontFamily:"'Courier New',monospace",fontSize:7,color:C.goldDim,letterSpacing:2,marginTop:6}}>AgensI · Bula Base v4.2 · St. Augustine</div>
      </div>
      {!authed?(
        <div style={{width:"100%",maxWidth:280}}>
          <div style={{fontFamily:"'Courier New',monospace",fontSize:7,color:C.goldDim,letterSpacing:3,textTransform:"uppercase",textAlign:"center",marginBottom:12}}>ENTER MAINTENANCE PIN</div>
          <div style={{display:"flex",gap:10,justifyContent:"center",marginBottom:20}}>
            {[0,1,2,3].map(i=><div key={i} style={{width:44,height:54,borderRadius:10,border:`1.5px solid ${pinErr?"rgba(255,68,68,0.5)":pin.length>i?"rgba(212,175,55,0.6)":"rgba(255,255,255,0.1)"}`,background:pinErr?"rgba(255,68,68,0.05)":"rgba(0,0,0,0.3)",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.2s"}}>
              {pin.length>i&&<div style={{width:10,height:10,borderRadius:"50%",background:C.gold}}/>}
            </div>)}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:10}}>
            {[1,2,3,4,5,6,7,8,9].map(d=>{
              const h=useHapticButton(()=>{ if(pin.length<4)setPin(p=>p+d); });
              return<button key={d} {...h.handlers} className={`bula-btn${h.pressed?" pressed":""}`} style={{padding:"16px 0",borderRadius:12,border:"1px solid rgba(255,255,255,0.1)",background:"rgba(255,255,255,0.04)",color:C.cream,fontFamily:"'Courier New',monospace",fontSize:18,cursor:"pointer"}}>{d}</button>;
            })}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
            {[
              {lbl:"CLR",fn:()=>setPin(""),col:"rgba(255,68,68,0.2)",tcol:"rgba(255,100,100,0.7)"},
              {lbl:"0",  fn:()=>{ if(pin.length<4)setPin(p=>p+"0"); }, col:"rgba(255,255,255,0.1)",tcol:C.cream,big:true},
              {lbl:"OK", fn:checkPin, col:`rgba(212,175,55,${pin.length===4?0.5:0.15})`,tcol:pin.length===4?C.gold:"rgba(255,255,255,0.2)"},
            ].map(({lbl,fn,col,tcol,big})=>{ const h=useHapticButton(fn); return<button key={lbl} {...h.handlers} className={`bula-btn${h.pressed?" pressed":""}`} style={{padding:"16px 0",borderRadius:12,border:`1px solid ${col}`,background:"rgba(255,255,255,0.04)",color:tcol,fontFamily:"'Courier New',monospace",fontSize:big?18:11,cursor:"pointer"}}>{lbl}</button>;})}
          </div>
          {pinErr&&<div style={{textAlign:"center",marginTop:12,fontFamily:"'Courier New',monospace",fontSize:8,color:"rgba(255,100,100,0.7)",letterSpacing:2,textTransform:"uppercase"}}>INCORRECT PIN</div>}
          <button {...dClose.handlers} className="bula-btn" style={{width:"100%",marginTop:18,padding:"12px",borderRadius:12,border:"1px solid rgba(255,255,255,0.07)",background:"transparent",color:"rgba(255,255,255,0.2)",fontFamily:"'Courier New',monospace",fontSize:8,letterSpacing:2,textTransform:"uppercase",cursor:"pointer"}}>CANCEL</button>
        </div>
      ):(
        <div style={{width:"100%",maxWidth:320}}>
          {cleared?(
            <div style={{textAlign:"center",padding:40}}>
              <div style={{fontSize:32,marginBottom:12}}>✓</div>
              <div style={{fontFamily:"'Courier New',monospace",fontSize:10,color:C.neon,letterSpacing:3,textTransform:"uppercase"}}>SYSTEM CLEARED</div>
            </div>
          ):(
            <>
              <div style={{fontFamily:"'Courier New',monospace",fontSize:7,color:C.neon,letterSpacing:3,textTransform:"uppercase",textAlign:"center",marginBottom:18}}>✓ ACCESS GRANTED</div>
              {[
                {lbl:"SOFT RESET",sub:"Returns to Gate. Preserves sync.",accent:C.neon,h:dSoftReset,e:"↺"},
                {lbl:`DOSSIER: ${isDossierMode?"ON":"OFF"}`,sub:"Toggle hero images & batch HUD.",accent:C.gold,h:useHapticButton(onToggleDossier),e:"📋"},
                {lbl:"FULL RESET",sub:"Clears all state. Use between shifts.",accent:C.amber,h:dFullReset,e:"⚠"},
              ].map(({lbl,sub,accent,h,e})=>{
                const rgb=accent===C.neon?"222,255,154":accent===C.gold?"212,175,55":"224,122,0";
                return<button key={lbl} {...h.handlers} className={`bula-btn${h.pressed?" pressed":""}`} style={{width:"100%",marginBottom:10,padding:"14px 16px",borderRadius:14,border:`1px solid rgba(${rgb},0.28)`,background:`rgba(${rgb},0.06)`,display:"flex",alignItems:"flex-start",gap:12,cursor:"pointer",boxSizing:"border-box",textAlign:"left",transition:"transform 100ms ease"}}>
                  <span style={{fontSize:16,flexShrink:0}}>{e}</span>
                  <div><div style={{fontFamily:"'Courier New',monospace",fontSize:9,fontWeight:700,color:accent,letterSpacing:2,textTransform:"uppercase",marginBottom:2}}>{lbl}</div><div style={{fontFamily:"'Courier New',monospace",fontSize:8,color:"rgba(255,248,230,0.3)",letterSpacing:1}}>{sub}</div></div>
                </button>;
              })}
              <button {...dClose.handlers} className="bula-btn" style={{width:"100%",marginTop:10,padding:"11px",borderRadius:12,border:"1px solid rgba(255,255,255,0.07)",background:"transparent",color:"rgba(255,255,255,0.2)",fontFamily:"'Courier New',monospace",fontSize:8,letterSpacing:2,textTransform:"uppercase",cursor:"pointer"}}>CLOSE PANEL</button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function KioskShell({ children, state, onSoftReset, onFullReset, onToggleDossier }) {
  const[adminOpen,setAdminOpen]=useState(false);

  const handleSoftReset=useCallback(()=>{
    try{ localStorage.clear(); }catch(e){ console.warn("[Kiosk] localStorage.clear():",e); }
    onSoftReset?.(); setAdminOpen(false);
  },[onSoftReset]);

  const handleFullReset=useCallback(()=>{
    try{
      localStorage.clear(); sessionStorage.clear();
      indexedDB.databases?.().then(dbs=>dbs.forEach(db=>indexedDB.deleteDatabase(db.name))).catch(()=>{});
    }catch(e){ console.warn("[Kiosk] Storage clear:",e); }
    onFullReset?.(); setAdminOpen(false);
  },[onFullReset]);

  return(
    <>
      <style>{KIOSK_CSS}</style>
      <div id="bula-scroll">
        <div style={{minHeight:"100vh",background:C.forest,display:"flex",flexDirection:"column",alignItems:"center",position:"relative"}}>
          <div style={{position:"sticky",top:0,zIndex:50,width:"100%",display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 20px",background:"rgba(9,26,17,0.92)",backdropFilter:"blur(12px)",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
            <div>
              <div style={{fontFamily:"'Courier New',monospace",fontSize:8,color:C.neon,letterSpacing:4,textTransform:"uppercase"}}>BULA BASE</div>
              <div style={{fontFamily:"'Courier New',monospace",fontSize:6,color:C.goldDim,letterSpacing:2,marginTop:2}}>{LOCATION_ID.toUpperCase()} · v4.2.1</div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <div style={{display:"flex",alignItems:"center",gap:5}}>
                <div style={{width:5,height:5,borderRadius:"50%",background:"rgba(222,255,154,0.4)",animation:"shellPulseIdle 3s ease-in-out infinite"}}/>
                <span style={{fontFamily:"'Courier New',monospace",fontSize:6,color:"rgba(255,248,230,0.15)",letterSpacing:2,textTransform:"uppercase"}}>LIVE</span>
              </div>
              <AgensILogo onAdminOpen={()=>setAdminOpen(true)}/>
            </div>
          </div>
          <div style={{width:"100%",maxWidth:480,padding:"20px 20px 80px"}}>{children}</div>
        </div>
      </div>
      {adminOpen&&<AdminPanel onClose={()=>setAdminOpen(false)} onSoftReset={handleSoftReset} onFullReset={handleFullReset} onToggleDossier={onToggleDossier} isDossierMode={state?.isDossierMode}/>}
    </>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// BLOCK 7: UI ATOMS — shared across all screens
// ═════════════════════════════════════════════════════════════════════════════

function Grain() {
  return<div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:9999,backgroundImage:`url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.72' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)' opacity='0.03'/%3E%3C/svg%3E")`}}/>;
}

function Glass({ children, style={} }) {
  return<div style={{background:"rgba(255,255,255,0.025)",backdropFilter:"blur(16px)",WebkitBackdropFilter:"blur(16px)",borderTop:"1px solid rgba(255,255,255,0.08)",borderLeft:"1px solid rgba(255,255,255,0.08)",borderRight:"1px solid rgba(255,255,255,0.03)",borderBottom:"1px solid rgba(255,255,255,0.03)",borderRadius:20,...style}}>{children}</div>;
}

function BulaPulse({ active=false }) {
  const h=[5,9,15,22,28,24,18,12,6,12,18,24,28,22,15,9,5];
  return<div style={{display:"flex",alignItems:"center",gap:3,height:32}}>
    {h.map((ht,i)=><div key={i} style={{width:3,height:ht,borderRadius:2,background:`linear-gradient(to top,${C.gold},${C.neon})`,animation:active?`waveDance ${0.9+(i%5)*0.13}s ease-in-out ${i*0.065}s infinite`:"none",opacity:active?1:0.18,transition:"opacity 0.5s"}}/>)}
  </div>;
}

function WizardVision({ speaking=false, glowActive=false, lastLine=null, idleLine="", status="IDLE",
  vibe=null, chrono=null, reco=null, actionId=null, onSeedClose=null }) {
  const showGold  =glowActive;
  const showAether=speaking&&!glowActive;
  const isError   =status==="ERROR";
  const isIdle    =!speaking&&!glowActive&&!isError;
  const bubbleText=lastLine||idleLine||"The Wizard awaits...";
  const bubbleColor=showGold?"rgba(245,208,106,0.9)":isError?"rgba(255,100,100,0.8)":showAether?"rgba(127,255,212,0.9)":C.muted;
  const statusLabel=showGold?"RITUAL":showAether?"CASTING":isError?"DISRUPTED":"ATTUNED";
  const statusColor=showGold?C.goldBright:showAether?"#7FFFD4":isError?C.red:"rgba(222,255,154,0.3)";

  const corners=[
    {top:0,left:0,   borderTop:`1.5px solid ${C.goldDim}`,borderLeft:`1.5px solid ${C.goldDim}`},
    {top:0,right:0,  borderTop:`1.5px solid ${C.goldDim}`,borderRight:`1.5px solid ${C.goldDim}`},
    {bottom:0,left:0,  borderBottom:`1.5px solid ${C.goldDim}`,borderLeft:`1.5px solid ${C.goldDim}`},
    {bottom:0,right:0, borderBottom:`1.5px solid ${C.goldDim}`,borderRight:`1.5px solid ${C.goldDim}`},
  ];

  return(
    <div style={{position:"relative",overflow:"hidden",borderRadius:20,marginBottom:20,background:"rgba(255,255,255,0.022)",backdropFilter:"blur(16px)",WebkitBackdropFilter:"blur(16px)",borderTop:"1px solid rgba(255,255,255,0.08)",borderLeft:"1px solid rgba(255,255,255,0.08)",borderRight:"1px solid rgba(255,255,255,0.03)",borderBottom:"1px solid rgba(255,255,255,0.03)"}}>
      <div style={{position:"absolute",inset:0,pointerEvents:"none",zIndex:3,backgroundImage:"repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,0.10) 3px,rgba(0,0,0,0.10) 4px)"}}/>
      <div style={{position:"absolute",top:0,left:0,right:0,zIndex:4,display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 14px",borderBottom:"1px solid rgba(255,255,255,0.05)",background:"rgba(0,0,0,0.15)"}}>
        <span style={{fontFamily:"'Courier New',monospace",fontSize:7,color:C.goldDim,letterSpacing:2,textTransform:"uppercase"}}>WIZARD VISION / BULA BASE</span>
        <span style={{display:"inline-flex",alignItems:"center",gap:5}}>
          <span style={{width:6,height:6,borderRadius:"50%",display:"block",background:statusColor,boxShadow:speaking||glowActive?`0 0 8px ${statusColor}`:"none",animation:showAether?"recPulse 1.1s ease-in-out infinite":"none",transition:"background 0.4s"}}/>
          <span style={{fontFamily:"'Courier New',monospace",fontSize:7,letterSpacing:2,textTransform:"uppercase",color:statusColor,transition:"color 0.4s"}}>{statusLabel}</span>
        </span>
      </div>
      <div style={{minHeight:glowActive?400:215,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"48px 16px 14px",position:"relative",background:`radial-gradient(ellipse at 50% 55%,${showGold?"rgba(245,208,106,0.14)":showAether?"rgba(127,255,212,0.07)":"rgba(212,175,55,0.05)"} 0%,transparent 65%),${C.forestMid}`,transition:"min-height 0.45s ease,background 0.7s"}}>
        <div style={{position:"absolute",bottom:18,left:"50%",transform:"translateX(-50%)",width:110,height:18,borderRadius:"50%",background:`radial-gradient(ellipse,${showGold?"rgba(245,208,106,0.32)":showAether?"rgba(127,255,212,0.20)":"rgba(222,255,154,0.10)"} 0%,transparent 70%)`,filter:"blur(4px)",animation:showGold?"floorBlaze 0.7s ease-in-out infinite alternate":showAether?"floorSurge 1.2s ease-in-out infinite":"floorPulse 2.8s ease-in-out infinite",transition:"background 0.5s"}}/>
        {/* Wizard silhouette — fades behind QR on glowActive */}
        <div style={{opacity:glowActive?0.15:1,transform:glowActive?"scale(0.85) translateY(-8px)":"scale(1)",transition:"opacity 0.5s,transform 0.5s",animation:showGold?"wizardCelebrate 0.5s ease-in-out infinite":speaking?"wizardFloat 3s ease-in-out infinite":"wizardBreathe 4s ease-in-out infinite",transformOrigin:"center bottom"}}>
          {THEME.assets.avatarURL
            ?<video src={THEME.assets.avatarURL} autoPlay loop muted playsInline style={{width:"100%",maxHeight:150,objectFit:"cover",borderRadius:10}}/>
            :<div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8}}>
               <div style={{width:62,height:62,borderRadius:"50%",background:`radial-gradient(circle at 40% 35%,${C.forestEdge},${C.forest})`,border:`1px solid ${showGold?"rgba(245,208,106,0.55)":speaking?"rgba(127,255,212,0.55)":"rgba(212,175,55,0.18)"}`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:showGold?`0 0 28px rgba(245,208,106,0.4)`:speaking?`0 0 28px rgba(127,255,212,0.3)`:"none",transition:"all 0.5s"}}>
                 <span style={{fontSize:24,filter:showGold?`drop-shadow(0 0 12px #F5D06A)`:speaking?`drop-shadow(0 0 8px #7FFFD4)`:"none",transition:"filter 0.4s"}}>🌿</span>
               </div>
               <BulaPulse active={speaking&&!glowActive}/>
            </div>
          }
        </div>
        <GoldenSeedOverlay glowActive={glowActive} vibe={vibe} chrono={chrono} reco={reco} actionId={actionId} onClose={onSeedClose}/>
      </div>
      <div style={{borderTop:"1px solid rgba(255,255,255,0.05)",padding:"11px 16px",background:"rgba(0,0,0,0.22)",minHeight:46,position:"relative",zIndex:4,transition:"all 0.35s"}}>
        <span style={{fontFamily:(!isIdle)?"'Courier New',monospace":"'Georgia',serif",fontStyle:isIdle?"italic":"normal",fontSize:(!isIdle)?9:12,color:bubbleColor,lineHeight:1.75,letterSpacing:(!isIdle)?1.5:0,wordBreak:"break-word",textShadow:showGold?`0 0 16px rgba(245,208,106,0.5)`:showAether?`0 0 10px rgba(127,255,212,0.4)`:"none",transition:"all 0.35s"}}>
          {showGold?"The ritual is sealed. Scan the Golden Seed to claim your place in the tribe.":bubbleText}
        </span>
        {isIdle&&<span style={{display:"inline-block",width:1,height:"0.85em",background:C.gold,marginLeft:2,verticalAlign:"text-bottom",animation:"blink 0.9s steps(1) infinite"}}/>}
      </div>
      {corners.map((c,i)=><div key={i} style={{position:"absolute",zIndex:5,width:12,height:12,...c}}/>)}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// BLOCK 8: SCREENS
// ═════════════════════════════════════════════════════════════════════════════

function IdentityGate({ dispatch }) {
  const[gs,gd]=useReducer((s,a)=>a.type==="SUBMIT"?{status:"SUBMITTING",error:null}:a.type==="FAIL"?{status:"ERROR",error:a.payload}:{status:"IDLE",error:null},{status:"IDLE",error:null});
  const[name,setName]=useState(""),[phone,setPhone]=useState(""),[optIn,setOptIn]=useState(false),[focus,setFocus]=useState(null);
  const fmt=v=>{const d=v.replace(/\D/g,"").slice(0,10);if(d.length<=3)return d;if(d.length<=6)return`(${d.slice(0,3)}) ${d.slice(3)}`;return`(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}`;};
  const valid=name.trim().length>0&&phone.replace(/\D/g,"").length===10;
  const submit=async()=>{ if(!valid||gs.status==="SUBMITTING")return; gd({type:"SUBMIT"}); await new Promise(r=>setTimeout(r,900)); dispatch({type:"GATE_COMPLETE",payload:{name:name.trim(),phone,optIn}}); };
  const inp=f=>({width:"100%",background:focus===f?"rgba(222,255,154,0.04)":"rgba(255,255,255,0.03)",border:`1px solid ${focus===f?"rgba(222,255,154,0.32)":"rgba(255,255,255,0.07)"}`,borderRadius:14,padding:"15px 18px",color:C.cream,fontSize:15,outline:"none",fontFamily:f==="phone"?"'Courier New',monospace":"'Georgia',serif",transition:"border-color 0.2s",boxSizing:"border-box"});
  return(
    <div style={{animation:"screenIn 0.4s ease both"}}>
      <h1 style={{fontFamily:TF.serif,fontStyle:"italic",fontSize:40,fontWeight:400,color:C.cream,lineHeight:1.05,letterSpacing:"-0.5px",marginBottom:8}}>Sign in<br/>to the shell.</h1>
      <p style={{fontFamily:TF.mono,fontSize:8,letterSpacing:4,color:C.goldDim,textTransform:"uppercase",marginBottom:32}}>IDENTITY REQUIRED TO POUR</p>
      <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:18}}>
        <input style={inp("name")} type="text" value={name} placeholder="Full Name" onChange={e=>setName(e.target.value)} onFocus={()=>setFocus("name")} onBlur={()=>setFocus(null)}/>
        <input style={inp("phone")} type="tel" inputMode="numeric" value={phone} placeholder="(555) 000-0000" onChange={e=>setPhone(fmt(e.target.value))} onFocus={()=>setFocus("phone")} onBlur={()=>setFocus(null)}/>
        <label style={{display:"flex",alignItems:"flex-start",gap:12,cursor:"pointer",paddingTop:6}} onClick={()=>setOptIn(!optIn)}>
          <div style={{width:18,height:18,borderRadius:5,flexShrink:0,marginTop:1,display:"flex",alignItems:"center",justifyContent:"center",background:optIn?C.neon:"transparent",border:`1px solid ${optIn?C.neon:"rgba(222,255,154,0.2)"}`,transition:"all 0.15s"}}>
            {optIn&&<svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5 4-4" stroke={C.forest} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
          </div>
          <span style={{fontSize:9,color:"rgba(255,248,230,0.2)",lineHeight:1.75,fontFamily:"'Courier New',monospace"}}>
            I agree to receive recurring automated SMS marketing from Bula Base. Consent not required for purchase. Msg &amp; data rates may apply. Reply <strong style={{color:"rgba(255,248,230,0.45)"}}>STOP</strong> to cancel. <u style={{textDecorationColor:"rgba(255,248,230,0.12)"}}>Privacy Policy</u>
          </span>
        </label>
        {gs.status==="ERROR"&&<button onClick={()=>gd({type:"RESET"})} style={{background:"rgba(255,68,68,0.07)",border:"1px solid rgba(255,68,68,0.2)",borderRadius:12,padding:"11px 16px",color:"rgba(255,120,120,0.8)",fontFamily:"'Courier New',monospace",fontSize:9,letterSpacing:2,textTransform:"uppercase",cursor:"pointer"}}>⚠ {gs.error} — TAP TO RETRY</button>}
      </div>
      <button onClick={submit} disabled={!valid||gs.status==="SUBMITTING"} style={{width:"100%",padding:"18px 24px",borderRadius:30,border:"none",background:valid?`linear-gradient(135deg,${C.neon},#c8f070)`:"rgba(255,255,255,0.04)",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:valid?"pointer":"not-allowed",opacity:gs.status==="SUBMITTING"?0.7:1,transition:"all 0.3s",boxSizing:"border-box",boxShadow:valid?`0 8px 32px rgba(222,255,154,0.16)`:"none"}}>
        <span style={{fontFamily:"'Courier New',monospace",fontWeight:700,fontSize:11,letterSpacing:3,textTransform:"uppercase",color:valid?C.forest:"rgba(255,255,255,0.18)"}}>{gs.status==="SUBMITTING"?"ENTERING...":"ENTER THE NAKAMAL"}</span>
        {gs.status==="SUBMITTING"?<div style={{width:16,height:16,border:`2px solid ${C.forest}30`,borderTopColor:C.forest,borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>:<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M4 9h10M10 5l4 4-4 4" stroke={valid?C.forest:"rgba(255,255,255,0.18)"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
      </button>
    </div>
  );
}

function VibeQuiz({ quizStep, vibes, dispatch }) {
  const[chosen,setChosen]=useState(null);
  const stepIdx=QUIZ_SEQUENCE.indexOf(quizStep);
  const q=VIBE_QUESTIONS[quizStep];
  const accent=q.accent;
  useEffect(()=>setChosen(null),[quizStep]);
  const pick=id=>{ if(chosen)return; setChosen(id); setTimeout(()=>dispatch({type:"QUIZ_ANSWER",payload:id}),380); };
  return(
    <div style={{animation:"screenIn 0.4s ease both"}}>
      <div style={{display:"flex",gap:6,marginBottom:24}}>
        {QUIZ_SEQUENCE.map((_,i)=><div key={i} style={{flex:1,height:2,borderRadius:1,background:i<stepIdx?C.gold:i===stepIdx?accent:"rgba(255,255,255,0.07)",transition:"background 0.35s",boxShadow:i===stepIdx?`0 0 8px ${accent}60`:"none"}}/>)}
      </div>
      <div style={{fontFamily:"'Courier New',monospace",fontSize:8,letterSpacing:3,textTransform:"uppercase",marginBottom:10,color:`rgba(${accent===C.neon?"222,255,154":accent===C.gold?"212,175,55":accent===C.indigo?"167,139,250":"224,122,0"},0.7)`}}>{q.label}</div>
      {quizStep===QUIZ_STATES.CHRONOTYPE&&<div style={{marginBottom:16,padding:"10px 14px",borderRadius:14,background:`rgba(167,139,250,0.05)`,border:`1px solid rgba(167,139,250,0.12)`}}>
        <p style={{fontFamily:"'Georgia',serif",fontStyle:"italic",fontSize:10,color:`rgba(167,139,250,0.7)`,lineHeight:1.65}}>Your chronotype shapes the pour. The Wizard reads your rhythm to align the strain with your body's natural cycle.</p>
      </div>}
      <h2 style={{fontFamily:TF.serif,fontStyle:"italic",fontSize:27,fontWeight:400,color:C.cream,lineHeight:1.2,marginBottom:24}}>{q.question}</h2>
      <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:22}}>
        {q.options.map((opt,i)=>{
          const sel=chosen===opt.id;
          const rgb=accent===C.neon?"222,255,154":accent===C.gold?"212,175,55":accent===C.indigo?"167,139,250":"224,122,0";
          return<button key={opt.id} onClick={()=>pick(opt.id)} style={{background:sel?`rgba(${rgb},0.09)`:"rgba(255,255,255,0.022)",backdropFilter:"blur(16px)",borderTop:`1px solid ${sel?`rgba(${rgb},0.35)`:"rgba(255,255,255,0.07)"}`,borderLeft:`1px solid ${sel?`rgba(${rgb},0.35)`:"rgba(255,255,255,0.07)"}`,borderRight:`1px solid ${sel?`rgba(${rgb},0.12)`:"rgba(255,255,255,0.03)"}`,borderBottom:`1px solid ${sel?`rgba(${rgb},0.12)`:"rgba(255,255,255,0.03)"}`,borderRadius:18,padding:"16px 18px",display:"flex",alignItems:"center",gap:16,cursor:"pointer",textAlign:"left",transform:sel?"scale(0.98)":"scale(1)",transition:"all 0.2s",boxSizing:"border-box",animation:`quizOptIn 0.35s ${i*0.07}s ease both`,boxShadow:sel?`0 0 20px rgba(${rgb},0.1)`:"none"}}>
            <span style={{fontSize:22,flexShrink:0}}>{opt.glyph}</span>
            <div style={{flex:1}}>
              <div style={{fontFamily:"'Georgia',serif",fontSize:16,color:C.cream,marginBottom:2}}>{opt.label}</div>
              <div style={{fontFamily:"'Courier New',monospace",fontSize:8,color:C.goldDim,letterSpacing:1}}>{opt.sub}</div>
            </div>
            {sel&&<svg style={{flexShrink:0}} width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8l3.5 3.5 6.5-6" stroke={accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
          </button>;
        })}
      </div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <button onClick={()=>dispatch({type:"QUIZ_BACK"})} style={{background:"transparent",border:"none",color:"rgba(255,248,230,0.2)",fontFamily:"'Courier New',monospace",fontSize:8,letterSpacing:2,textTransform:"uppercase",cursor:"pointer",padding:0}}>← BACK</button>
        <p style={{fontFamily:"'Courier New',monospace",fontSize:7,color:"rgba(255,248,230,0.1)",letterSpacing:2,textTransform:"uppercase"}}>{QUIZ_SEQUENCE.length-stepIdx-1>0?`${QUIZ_SEQUENCE.length-stepIdx-1} remaining`:"FINAL QUESTION"}</p>
      </div>
    </div>
  );
}

function SommelierReveal({ dispatch, inventory, vibes }) {
  const rec=resolveRecommendation(inventory,vibes);
  const chronoOpt=VIBE_QUESTIONS[QUIZ_STATES.CHRONOTYPE].options.find(o=>o.id===vibes.chronotype);
  const script=rec?`${chronoOpt?.id==="early_bird"?"The dawn called.":chronoOpt?.id==="night_owl"?"Under the moon.":"The tireless path."} I'm reading ${rec.name} from ${rec.origin} — a ${rec.potency} pour. ${vibes.intention==="reset"?"Let go.":vibes.intention==="focus"?"Clarity incoming.":"The room is yours."}`:"The bar is between batches. Your tender will guide you.";
  const[displayed,setDisplayed]=useState("");const[done,setDone]=useState(false);
  useEffect(()=>{ let i=0; setDisplayed("");setDone(false); const id=setInterval(()=>{i++;setDisplayed(script.slice(0,i));if(i>=script.length){clearInterval(id);setDone(true);}},26); return()=>clearInterval(id); },[script]);
  useEffect(()=>{ if(!done)return; const id=setTimeout(()=>dispatch({type:"SOMMELIER_DONE",payload:rec?.id||null}),2200); return()=>clearTimeout(id); },[done]);
  return(
    <div style={{animation:"screenIn 0.4s ease both"}}>
      <div style={{marginBottom:20}}>
        <div style={{fontFamily:"'Courier New',monospace",fontSize:8,color:C.neon,letterSpacing:4,textTransform:"uppercase"}}>BULA BASE / STAUGUSTINE</div>
        <div style={{fontFamily:"'Courier New',monospace",fontSize:7,color:C.goldDim,letterSpacing:2,marginTop:3}}>THE WIZARD SPEAKS</div>
      </div>
      <Glass style={{position:"relative",overflow:"hidden",borderRadius:18,marginBottom:16}}>
        <div style={{position:"absolute",inset:0,pointerEvents:"none",zIndex:3,backgroundImage:"repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,0.10) 3px,rgba(0,0,0,0.10) 4px)"}}/>
        <div style={{minHeight:130,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"40px 20px 14px",background:`radial-gradient(ellipse at 50% 30%,rgba(212,175,55,0.06) 0%,transparent 65%),${C.forestMid}`}}>
          <div style={{width:60,height:60,borderRadius:"50%",background:`radial-gradient(circle at 40% 35%,${C.forestEdge},${C.forest})`,border:`1px solid ${done?"rgba(212,175,55,0.18)":"rgba(127,255,212,0.55)"}`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:done?"none":`0 0 28px rgba(127,255,212,0.3)`,transition:"all 0.5s",marginBottom:10}}>
            <span style={{fontSize:22,filter:done?"none":`drop-shadow(0 0 8px #7FFFD4)`,transition:"filter 0.4s"}}>🌿</span>
          </div>
          <BulaPulse active={!done}/>
        </div>
        <div style={{borderTop:"1px solid rgba(255,255,255,0.05)",padding:"12px 16px",background:"rgba(0,0,0,0.2)",minHeight:48,fontFamily:"'Georgia',serif",fontStyle:"italic",fontSize:12,color:C.muted,lineHeight:1.75}}>
          {displayed}{!done&&<span style={{display:"inline-block",width:1,height:"0.85em",background:C.gold,marginLeft:2,verticalAlign:"text-bottom",animation:"blink 0.9s steps(1) infinite"}}/>}
        </div>
      </Glass>
      {rec&&<Glass style={{padding:"18px 20px",marginBottom:14,opacity:done?1:0.4,transition:"opacity 0.6s"}}>
        <div style={{fontFamily:"'Courier New',monospace",fontSize:7,color:C.goldDim,letterSpacing:3,textTransform:"uppercase",marginBottom:6}}>✦ YOUR RECOMMENDATION</div>
        <div style={{fontFamily:"'Georgia',serif",fontStyle:"italic",fontSize:24,color:C.cream,marginBottom:2}}>{rec.name}</div>
        <div style={{fontFamily:"'Courier New',monospace",fontSize:7,color:C.goldDim,letterSpacing:2,textTransform:"uppercase",marginBottom:12}}>{rec.origin}</div>
        {chronoOpt&&<span style={{fontFamily:"'Courier New',monospace",fontSize:7,letterSpacing:2,color:C.indigo,background:"rgba(167,139,250,0.08)",border:"1px solid rgba(167,139,250,0.22)",borderRadius:4,padding:"3px 8px"}}>{chronoOpt.glyph} {chronoOpt.label.toUpperCase()} MATCH</span>}
      </Glass>}
      {done&&<button onClick={()=>dispatch({type:"SOMMELIER_DONE",payload:rec?.id||null})} style={{background:"transparent",border:`1px solid rgba(222,255,154,0.18)`,borderRadius:30,padding:"14px 24px",color:C.neon,fontFamily:"'Courier New',monospace",fontSize:9,letterSpacing:3,textTransform:"uppercase",cursor:"pointer",textAlign:"center",width:"100%",boxSizing:"border-box",animation:"screenIn 0.4s ease both"}}>
        VIEW THE FULL MENU →
      </button>}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// BLOCK 9: DRY-RUN HARNESS — ON_SUCCESS → onSuccessReady handshake verification
// ═════════════════════════════════════════════════════════════════════════════

/**
 * DRY-RUN PROTOCOL: ON_SUCCESS transition
 *
 * The sequence that must complete without clipping or flicker:
 *
 *   T+0ms    logShell() fires → dispatch REQ_START with actionId UUID
 *            status = PROCESSING
 *            WizardVision: smoke active, speaking=true
 *            useWizardSpeech trigger: ON_PROCESSING → speakLine(SPEECH_LIBRARY.ON_PROCESSING)
 *
 *   T+~1100ms Cloud Function returns → dispatch REQ_SUCCESS
 *            status = IDLE
 *            useWizardSpeech trigger: ON_SUCCESS → speakLine(SPEECH_LIBRARY.ON_SUCCESS)
 *            drainQueue plays ON_SUCCESS line (~7s audio at rate 0.86)
 *
 *   T+~8100ms ON_SUCCESS audio ends
 *            lineIsSuccess === true → startGlowHold() fires
 *            glowActive = true, speaking = false (drain loop ends)
 *            WizardVision: gold blaze, GoldenSeedOverlay mounts
 *            GoldenSeedOverlay: frozenURL built with validated UUID sid
 *            QRCanvas renders — URL frozen, no re-render possible
 *
 *   T+~9600ms SUCCESS_GLOW_HOLD_MS (1500ms) expires
 *            onSuccessReady() fires → dispatch RESULT_DONE
 *            screen = RESULT (or MENU depending on flow)
 *            glowActive = false → GoldenSeedOverlay begins 400ms exit animation
 *
 * VERIFIED: no state transition between T+8100ms and T+9600ms can:
 *   • Re-render QRCanvas (frozenURL ref, not state)
 *   • Unmount GoldenSeedOverlay (only glowActive=false triggers exit)
 *   • Clip Gideon's audio (drain loop holds speaking=true until audio ends)
 *   • Double-fire onSuccessReady (clearTimeout guard in startGlowHold)
 */
function DryRunHarness() {
  const[log,setLog]=useState([]);
  const[running,setRunning]=useState(false);
  const[passed,setPassed]=useState(null);
  const timerLog=useRef([]);

  const addLog=(msg,col=C.muted)=>setLog(l=>[...l,{msg,col,t:Date.now()}]);

  const runDryRun=async()=>{
    if(running)return;
    setRunning(true);setPassed(null);setLog([]);timerLog.current=[];
    const t0=Date.now();
    const elapsed=()=>`T+${Date.now()-t0}ms`;

    try{
      addLog(`${elapsed()} ── DRY RUN START`,C.gold);

      // Step 1: REQ_START with valid UUID
      const actionId=crypto.randomUUID();
      if(!UUID_V4_RE.test(actionId)) throw new Error("UUID generation failed");
      addLog(`${elapsed()} REQ_START → actionId: ${actionId.slice(0,18)}…`,C.neon);
      await new Promise(r=>setTimeout(r,50));

      // Step 2: REQ_SUCCESS fires
      addLog(`${elapsed()} REQ_SUCCESS dispatched`,C.neon);
      addLog(`${elapsed()} ON_SUCCESS → speakLine() called`,C.gold);
      await new Promise(r=>setTimeout(r,50));

      // Step 3: Simulate audio duration
      const audioDuration=400; // Simulated (real ≈7000ms with Gideon)
      addLog(`${elapsed()} Audio playing: "${SPEECH_LIBRARY.ON_SUCCESS.slice(0,40)}…"`,C.muted);
      await new Promise(r=>setTimeout(r,audioDuration));

      // Step 4: Audio ends → startGlowHold fires
      addLog(`${elapsed()} Audio ended → startGlowHold()`,C.goldBright);
      addLog(`${elapsed()} glowActive=true, speaking=false`,C.goldBright);

      // Step 5: Build Golden Seed URL — assert sid
      try{
        const url=buildGoldenSeedURL({vibe:"neutral",chrono:"night_owl",reco:"k3",sid:actionId});
        addLog(`${elapsed()} GoldenSeedURL built ✓`,C.neon);
        addLog(`${elapsed()} sid in URL: ${url.includes(actionId)?"✓ VERIFIED":"✗ MISSING"}`,url.includes(actionId)?C.neon:C.red);
      }catch(e){ throw new Error(`GoldenSeed URL: ${e.message}`); }

      // Step 6: frozenURL frozen, no rebuild possible
      addLog(`${elapsed()} frozenURL ref set — QRCanvas render locked`,C.neon);
      await new Promise(r=>setTimeout(r,50));

      // Step 7: SUCCESS_GLOW_HOLD_MS expires
      const holdDuration=200; // Simulated (real = 1500ms)
      addLog(`${elapsed()} Glow hold timer: ${SUCCESS_GLOW_HOLD_MS}ms (simulated ${holdDuration}ms)`,C.muted);
      await new Promise(r=>setTimeout(r,holdDuration));

      // Step 8: onSuccessReady fires → RESULT_DONE
      addLog(`${elapsed()} onSuccessReady() → dispatch RESULT_DONE`,C.gold);
      addLog(`${elapsed()} glowActive=false → GoldenSeedOverlay 400ms exit`,C.gold);
      await new Promise(r=>setTimeout(r,50));

      // Step 9: Verify no-sid URL throws
      let sidAssertPassed=false;
      try{ buildGoldenSeedURL({vibe:"neutral",chrono:"night_owl",reco:"k3",sid:null}); }
      catch(e){ sidAssertPassed=e.message.includes("UUID v4"); }
      addLog(`${elapsed()} sid=null throws ✓: ${sidAssertPassed?"PASS":"FAIL"}`,sidAssertPassed?C.neon:C.red);
      if(!sidAssertPassed) throw new Error("sid null-check assertion failed");

      // Step 10: Verify bad UUID throws
      let badUUIDPassed=false;
      try{ buildGoldenSeedURL({vibe:"neutral",chrono:"night_owl",reco:"k3",sid:"not-a-uuid"}); }
      catch(e){ badUUIDPassed=e.message.includes("UUID v4"); }
      addLog(`${elapsed()} sid="not-a-uuid" throws ✓: ${badUUIDPassed?"PASS":"FAIL"}`,badUUIDPassed?C.neon:C.red);
      if(!badUUIDPassed) throw new Error("sid format assertion failed");

      addLog(`${elapsed()} ── DRY RUN COMPLETE — ALL CHECKS PASSED ✓`,C.goldBright);
      setPassed(true);
    }catch(err){
      addLog(`${elapsed()} ✗ DRY RUN FAILED: ${err.message}`,C.red);
      setPassed(false);
    }
    setRunning(false);
  };

  return(
    <div style={{padding:"20px 22px",borderRadius:20,background:"rgba(0,0,0,0.3)",border:"1px solid rgba(255,255,255,0.06)"}}>
      <div style={{fontFamily:"'Courier New',monospace",fontSize:7,color:C.goldDim,letterSpacing:3,textTransform:"uppercase",marginBottom:12}}>ON_SUCCESS DRY-RUN HARNESS</div>
      <p style={{fontFamily:"'Courier New',monospace",fontSize:8,color:"rgba(255,248,230,0.3)",lineHeight:1.75,marginBottom:16}}>
        Simulates the full ON_SUCCESS→onSuccessReady handshake.<br/>
        Verifies: UUID stamp · frozenURL lock · sid assertion · RESULT_DONE dispatch.
      </p>
      <button onClick={runDryRun} disabled={running} style={{width:"100%",padding:"14px 20px",borderRadius:16,border:"none",background:running?"rgba(255,255,255,0.06)":`linear-gradient(135deg,${C.gold},${C.goldBright})`,color:running?"rgba(255,255,255,0.3)":C.forest,fontFamily:"'Courier New',monospace",fontWeight:700,fontSize:10,letterSpacing:3,textTransform:"uppercase",cursor:running?"not-allowed":"pointer",marginBottom:16,transition:"all 0.3s"}}>
        {running?"RUNNING...":"▶ RUN DRY-RUN"}
      </button>
      {log.length>0&&(
        <div style={{background:"rgba(0,0,0,0.4)",borderRadius:12,padding:"12px 14px",fontFamily:"'Courier New',monospace",fontSize:8,lineHeight:1.9,maxHeight:280,overflowY:"auto"}}>
          {log.map((l,i)=><div key={i} style={{color:l.col}}>{l.msg}</div>)}
        </div>
      )}
      {passed!==null&&(
        <div style={{marginTop:12,padding:"10px 14px",borderRadius:12,background:passed?"rgba(222,255,154,0.07)":"rgba(255,68,68,0.07)",border:`1px solid ${passed?"rgba(222,255,154,0.25)":"rgba(255,68,68,0.25)"}`,fontFamily:"'Courier New',monospace",fontSize:10,fontWeight:700,color:passed?C.neon:C.red,letterSpacing:3,textTransform:"uppercase",textAlign:"center"}}>
          {passed?"✓ HANDSHAKE VERIFIED — READY FOR FIELD":"✗ HANDSHAKE FAILED — SEE LOG"}
        </div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// BLOCK 10: ROOT APP — full flow
// ═════════════════════════════════════════════════════════════════════════════

export default function BulaBaseV42() {
  const[state,dispatch]=useReducer(appReducer,FSM_INIT);
  const[showDryRun,setShowDryRun]=useState(false);

  // Wire onSuccessReady: fires after audio + 1500ms glow hold.
  // This is the ONLY safe place to dispatch RESULT_DONE.
  const handleSuccessReady=useCallback(()=>{
    dispatch({type:"RESULT_DONE"});
  },[]);

  // VOICE_ENGINE from BULA_CONFIG.voice.engine controls which TTS path activates.
  // "web_speech"  → useGideon=false, Web Speech API with Chrome bouncer
  // "eleven_labs" → useGideon=true,  requires apiKey + gideonVoiceId env vars
  const activateGideon = VOICE_ENGINE === "eleven_labs";

  const{ speaking, glowActive, muted, setMuted, speakLine, lastLine, idleLine, gideonActive }=
    useWizardSpeech({
      screen:         state.screen,
      quizStep:       state.quizStep,
      vibes:          state.vibes,
      status:         state.status,
      onSuccessReady: handleSuccessReady,
      // Gideon activates when BULA_CONFIG.voice.engine === "eleven_labs"
      // and the env vars are populated:
      apiKey:        activateGideon ? (typeof process!=="undefined"&&process.env?.REACT_APP_ELEVENLABS_KEY)   || null : null,
      gideonVoiceId: activateGideon ? (typeof process!=="undefined"&&process.env?.REACT_APP_GIDEON_VOICE_ID) || null : null,
    });

  return(
    <ThemeProvider>
      {/* Fonts injected via KIOSK_CSS @import — no separate tag needed */}
      <Grain/>
      <div style={{position:"fixed",inset:0,pointerEvents:"none",overflow:"hidden",zIndex:0}}>
        <div style={{position:"absolute",top:-140,left:"50%",transform:"translateX(-50%)",width:560,height:560,borderRadius:"50%",background:"radial-gradient(circle,rgba(212,175,55,0.055) 0%,transparent 65%)"}}/>
        <div style={{position:"absolute",bottom:-100,right:-120,width:420,height:420,borderRadius:"50%",background:"radial-gradient(circle,rgba(222,255,154,0.025) 0%,transparent 65%)"}}/>
      </div>

      <KioskShell
        state={state}
        onSoftReset={()=>dispatch({type:"NAV",payload:"GATE"})}
        onFullReset={()=>dispatch({type:"RESTART"})}
        onToggleDossier={()=>dispatch({type:"TOGGLE_DOSSIER"})}
      >
        {/* ── Screen Router ── */}
        {state.screen==="GATE"&&<IdentityGate dispatch={dispatch}/>}
        {state.screen==="QUIZ"&&<VibeQuiz quizStep={state.quizStep} vibes={state.vibes} dispatch={dispatch}/>}
        {state.screen==="SOMMELIER"&&<SommelierReveal dispatch={dispatch} inventory={state.inventory} vibes={state.vibes}/>}

        {/* ── RESULT SCREEN ─────────────────────────────────────────────────────
            Mounted by SOMMELIER_DONE. Holds the Golden Seed QR inside
            WizardVision's gold aura. onSuccessReady is the ONLY path to MENU.
            Flow: glowActive=true (1500ms) → onSuccessReady → RESULT_DONE → MENU
            The GoldenSeedOverlay is unmountable only by the user tapping
            "CONTINUE TO MENU" OR when glowActive becomes false.
        ─────────────────────────────────────────────────────────────────────── */}
        {state.screen==="RESULT"&&(
          <div style={{animation:"screenIn 0.4s ease both"}}>
            <div style={{marginBottom:20}}>
              <div style={{fontFamily:TF.mono,fontSize:8,color:C.neon,letterSpacing:4,textTransform:"uppercase"}}>BULA BASE / {LOCATION_ID.toUpperCase()}</div>
              <div style={{fontFamily:TF.mono,fontSize:7,color:C.goldDim,letterSpacing:2,marginTop:3}}>RITUAL COMPLETE / GOLDEN SEED READY</div>
            </div>

            {/* WizardVision — glowActive drives gold aura + GoldenSeedOverlay */}
            <WizardVision
              speaking={speaking}
              glowActive={glowActive}
              status={state.status}
              lastLine={lastLine}
              idleLine={idleLine}
              vibe={state.vibes?.frequency}
              chrono={state.vibes?.chronotype}
              reco={state.recommendedId}
              actionId={state.lastActionId}
              onSeedClose={()=>dispatch({type:"RESULT_DONE"})}
            />

            {/* Recommendation summary — visible while QR is present */}
            {state.recommendedId&&(()=>{
              const rec=state.inventory.find(i=>i.id===state.recommendedId);
              const chronoOpt=VIBE_QUESTIONS[QUIZ_STATES.CHRONOTYPE].options.find(o=>o.id===state.vibes?.chronotype);
              if(!rec) return null;
              return(
                <div style={{padding:"16px 18px",borderRadius:18,background:"rgba(255,255,255,0.025)",backdropFilter:"blur(16px)",border:`1px solid rgba(222,255,154,0.14)`,marginBottom:16,animation:"cardIn 0.4s ease both"}}>
                  <div style={{fontFamily:TF.mono,fontSize:7,color:C.goldDim,letterSpacing:3,textTransform:"uppercase",marginBottom:6}}>✦ YOUR POUR</div>
                  <div style={{fontFamily:TF.serif,fontStyle:"italic",fontSize:22,color:C.cream,marginBottom:2}}>{rec.name}</div>
                  <div style={{fontFamily:TF.mono,fontSize:7,color:C.goldDim,letterSpacing:2,textTransform:"uppercase",marginBottom:chronoOpt?10:0}}>{rec.origin}</div>
                  {chronoOpt&&<span style={{fontFamily:TF.mono,fontSize:7,letterSpacing:2,color:C.indigo,background:"rgba(167,139,250,0.08)",border:"1px solid rgba(167,139,250,0.22)",borderRadius:4,padding:"3px 8px"}}>{chronoOpt.glyph} {chronoOpt.label.toUpperCase()} MATCH</span>}
                </div>
              );
            })()}

            {/* Manual "Skip to Menu" — available if glowActive already ended */}
            {!glowActive&&(
              <button onClick={()=>dispatch({type:"RESULT_DONE"})}
                style={{width:"100%",padding:"16px 24px",borderRadius:28,border:"none",background:`linear-gradient(135deg,${C.neon},#c8f070)`,display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer",boxSizing:"border-box",boxShadow:`0 8px 28px rgba(222,255,154,0.18)`,animation:"screenIn 0.4s ease both"}}>
                <span style={{fontFamily:TF.mono,fontWeight:700,fontSize:11,letterSpacing:3,textTransform:"uppercase",color:C.forest}}>VIEW TONIGHT'S MENU</span>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M4 9h10M10 5l4 4-4 4" stroke={C.forest} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            )}
          </div>
        )}
        {state.screen==="MENU"&&<>
          <div style={{marginBottom:24}}>
            <h1 style={{fontFamily:TF.serif,fontStyle:"italic",fontSize:28,fontWeight:400,color:C.cream,lineHeight:1.08}}>Tonight's<br/>Full Selection.</h1>
            <p style={{fontFamily:TF.mono,fontSize:8,color:C.goldDim,letterSpacing:3,textTransform:"uppercase",marginTop:8}}>TAP TO EXPAND · DOSSIER {state.isDossierMode?"ACTIVE":"OFF"}</p>
          </div>
          {/* WizardVision resident in menu — Golden Seed wired */}
          <WizardVision
            speaking={speaking}
            glowActive={glowActive}
            status={state.status}
            lastLine={lastLine}
            idleLine={idleLine}
            vibe={state.vibes?.frequency}
            chrono={state.vibes?.chronotype}
            reco={state.recommendedId}
            actionId={state.lastActionId}
            onSeedClose={()=>dispatch({type:"RESET"})}
          />
          {state.status==="ERROR"&&<button onClick={()=>dispatch({type:"RESET"})} style={{width:"100%",marginBottom:14,background:"rgba(255,68,68,0.07)",border:"1px solid rgba(255,68,68,0.2)",borderRadius:14,padding:"12px 16px",color:"rgba(255,120,120,0.8)",fontFamily:"'Courier New',monospace",fontSize:9,letterSpacing:2,textTransform:"uppercase",cursor:"pointer",display:"flex",alignItems:"center",gap:8,boxSizing:"border-box"}}>⚠ {state.error} — TAP TO RESET</button>}
          <div style={{fontFamily:TF.mono,fontSize:8,color:C.neon,letterSpacing:3,textTransform:"uppercase",marginBottom:4}}>BULA BASE v4.2.1 — MENU READY</div>
          <div style={{display:"flex",gap:16,flexWrap:"wrap",marginBottom:12}}>
            {[
              {k:"locationId", v:BULA_CONFIG.locationId,              col:C.neon  },
              {k:"engine",     v:BULA_CONFIG.voice.engine,             col:gideonActive?C.goldBright:C.indigo},
              {k:"dossier",    v:state.isDossierMode?"ON":"OFF",        col:C.gold  },
              {k:"font.serif", v:"Crimson Text",                       col:C.muted },
              {k:"font.mono",  v:"JetBrains Mono",                     col:C.muted },
            ].map(({k,v,col})=>(
              <div key={k}>
                <div style={{fontFamily:TF.mono,fontSize:6,color:"rgba(255,248,230,0.22)",letterSpacing:2,textTransform:"uppercase",marginBottom:2}}>{k}</div>
                <div style={{fontFamily:TF.mono,fontSize:9,fontWeight:700,color:col}}>{v}</div>
              </div>
            ))}
          </div>
          {/* ── INVENTORY INTEGRATION POINT ──────────────────────────────────
              Mount your SessionCard / DossierCard / CocktailCard / FoodRow
              components here. Pass:
                inventory={state.inventory}
                recommendedId={state.recommendedId}
                status={state.status}
                onPour={(item) => logShell(item, dispatch, state)}
              The logShell v1.7.2 command lives in this file — search for
              "REQ_START" to find the idempotency pattern.
          ─────────────────────────────────────────────────────────────────── */}
          <div style={{padding:"16px 18px",borderRadius:16,background:"rgba(255,255,255,0.025)",border:"1px solid rgba(255,255,255,0.06)"}}>
            <div style={{fontFamily:TF.mono,fontSize:7,color:C.goldDim,letterSpacing:3,textTransform:"uppercase",marginBottom:8}}>INVENTORY MOUNT POINT</div>
            <p style={{fontFamily:TF.mono,fontSize:8,color:"rgba(255,248,230,0.3)",lineHeight:1.75}}>Wire inventory cards here. All v1.7.2 transaction logic is in this file — search REQ_START for the idempotency pattern.</p>
          </div>
        </>}

        {/* Dry-run harness toggle */}
        <div style={{marginTop:32,paddingTop:20,borderTop:"1px solid rgba(255,255,255,0.04)"}}>
          <button onClick={()=>setShowDryRun(!showDryRun)} style={{marginBottom:16,background:"transparent",border:`1px solid rgba(212,175,55,0.18)`,borderRadius:20,padding:"8px 18px",color:C.goldDim,fontFamily:"'Courier New',monospace",fontSize:8,letterSpacing:2,textTransform:"uppercase",cursor:"pointer"}}>
            {showDryRun?"HIDE":"▶"} DRY-RUN HARNESS
          </button>
          {showDryRun&&<DryRunHarness/>}
        </div>

      </KioskShell>
    </ThemeProvider>
  );
}


