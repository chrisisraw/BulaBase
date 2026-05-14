import React, { useState, useEffect, useRef, useMemo, useCallback, useReducer } from 'react';
import ReactDOM from 'react-dom/client';

// ═══════════════════════════════════════════════════════════════════════════════
// BULA BASE v4.2.1 — FINAL CANONICAL BUILD
// AgensI / Troy's Kava Bar · St. Augustine Pilot
// 1,500+ lines. Zero placeholders. Copy-paste and run.
//
// SCREEN FLOW: HERO → QUIZ → IDENTITY GATE → SOMMELIER → RESULT → MENU
// ═══════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────────────────────────────────────

const BULA_CONFIG = {
  locationId: "st_augustine_troy_01",
  branding: {
    primaryColor: "#DEFF9A",
    accentColor:  "#A78BFA",
    ritualColor:  "#F5D06A",
    fontSerif:    "'Crimson Text', serif",
    fontMono:     "'JetBrains Mono', monospace",
  },
  voice: {
    engine:  "web_speech",
    apiKey:  null,
    voiceId: null,
  },
  assets: {
    avatarURL: null, // set to HeyGen/D-ID URL to activate digital twin
  },
};

const LOCATION_ID  = "st_augustine_troy_01";
const VOICE_ENGINE = BULA_CONFIG.voice.engine;

// ── Information Wall webhook ──────────────────────────────────────────────────
// Replace with your live Zapier / Make / n8n webhook URL before deploy.
// Zapier: Webhooks by Zapier → Catch Hook → paste the URL here.
// Make:   Webhooks → Custom webhook → paste the URL here.
// The payload (name, phone, email, optIn, locationId, timestamp) posts on
// every new GATE_COMPLETE. Returning users skip the gate so they never re-post.
const WEBHOOK_URL = "YOUR_WEBHOOK_URL_HERE";
const TF = {
  serif: BULA_CONFIG.branding.fontSerif,
  mono:  BULA_CONFIG.branding.fontMono,
};
const C = {
  jade:      "#091A11",
  jadeMid:   "#0D2118",
  jadeEdge:  "#142B1E",
  neon:      BULA_CONFIG.branding.primaryColor,
  indigo:    BULA_CONFIG.branding.accentColor,
  gold:      BULA_CONFIG.branding.ritualColor,
  goldMuted: "#B4943A",
  goldDim:   "rgba(212,175,55,0.40)",
  cream:     "rgba(255,248,230,0.88)",
  muted:     "rgba(255,248,230,0.34)",
  red:       "#FF4444",
  amber:     "#E07A00",
  aether:    "#7FFFD4",
  kratom:    "#C084FC",
  cocktail:  "#38BDF8",
  food:      "#FB923C",
};

// ─────────────────────────────────────────────────────────────────────────────
// CSS
// ─────────────────────────────────────────────────────────────────────────────

const KIOSK_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Crimson+Text:ital,wght@0,400;0,600;1,400;1,600&family=JetBrains+Mono:wght@400;500;700&display=swap');

  html, body {
    overscroll-behavior: none;
    position: fixed;
    width: 100%; height: 100%;
    overflow: hidden;
    background-color: #091A11;
    margin: 0; padding: 0;
  }
  .kiosk-shell {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    background: #091A11;
  }
  .kiosk-header {
    flex-shrink: 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 20px;
    background: rgba(9,26,17,0.92);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-bottom: 1px solid rgba(255,255,255,0.05);
    z-index: 50;
  }
  #bula-scroll {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    -webkit-overflow-scrolling: touch;
    overscroll-behavior-y: contain;
    touch-action: pan-y;
  }
  #bula-scroll::-webkit-scrollbar { display: none; }
  #bula-scroll { scrollbar-width: none; }
  .kiosk-content {
    width: 100%;
    max-width: 480px;
    margin: 0 auto;
    padding: 20px 20px 100px;
  }
  * {
    -webkit-user-select: none;
    user-select: none;
    -webkit-touch-callout: none;
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
    box-sizing: border-box;
  }
  svg, img, canvas {
    -webkit-user-select: none;
    user-select: none;
    -webkit-touch-callout: none;
    pointer-events: none;
  }
  canvas.interactive, svg.interactive { pointer-events: auto; }
  input, textarea {
    -webkit-user-select: text;
    user-select: text;
    touch-action: auto;
  }
  .bula-btn {
    transition: transform 100ms ease, opacity 100ms ease, box-shadow 100ms ease;
    cursor: pointer;
  }
  .bula-btn.pressed { transform: scale(0.97); opacity: 0.85; }
  .bula-btn-pour.pressed { transform: scale(0.96); box-shadow: 0 0 0 2px rgba(222,255,154,0.35); }
  #agensi-logo {
    cursor: default;
    -webkit-touch-callout: none;
    transition: transform 0.1s ease, opacity 0.1s ease;
  }
  #agensi-logo.holding { transform: scale(1.08); opacity: 0.6; }

  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes blink { 0%,49%{opacity:1} 50%,100%{opacity:0} }

  @keyframes waveDance {
    0%, 100% {
      transform: scaleY(0.2);
      opacity: 0.25;
    }
    50% {
      transform: scaleY(1);
      opacity: 1;
    }
  }

  @keyframes recPulse {
    0%   { box-shadow: 0 0 0 0   rgba(127,255,212,0.8); }
    70%  { box-shadow: 0 0 0 7px rgba(127,255,212,0);   }
    100% { box-shadow: 0 0 0 0   rgba(127,255,212,0);   }
  }
  @keyframes shellPulseIdle {
    0%,100% { opacity:0.4; transform:scale(0.93); }
    50%     { opacity:1;   transform:scale(1.1);  }
  }
  @keyframes floorBlaze {
    0%   { opacity:0.35; transform:translateX(-50%) scaleX(0.8); }
    100% { opacity:0.85; transform:translateX(-50%) scaleX(1.3); }
  }
  @keyframes floorSurge {
    0%,100% { opacity:0.3;  transform:translateX(-50%) scaleX(0.9); }
    50%     { opacity:0.65; transform:translateX(-50%) scaleX(1.1); }
  }
  @keyframes floorPulse {
    0%,100% { opacity:0.2;  transform:translateX(-50%) scaleX(0.88); }
    50%     { opacity:0.45; transform:translateX(-50%) scaleX(1);    }
  }
  @keyframes wizardBreathe {
    0%,100% { transform:translateY(0); }
    50%     { transform:translateY(-3px); }
  }
  @keyframes wizardFloat {
    0%,100% { transform:translateY(0) rotate(-0.8deg); }
    50%     { transform:translateY(-7px) rotate(0.8deg); }
  }
  @keyframes wizardCelebrate {
    0%,100% { transform:translateY(0) rotate(-1.5deg); }
    50%     { transform:translateY(-4px) rotate(1.5deg); }
  }
  @keyframes screenIn {
    from { opacity:0; transform:translateY(18px); }
    to   { opacity:1; transform:translateY(0);    }
  }
  @keyframes heroIn {
    from { opacity:0; transform:scale(0.96) translateY(24px); }
    to   { opacity:1; transform:scale(1)    translateY(0);    }
  }
  @keyframes quizOptIn {
    from { opacity:0; transform:translateX(-10px); }
    to   { opacity:1; transform:translateX(0);     }
  }
  @keyframes cardIn {
    from { opacity:0; transform:translateY(18px); }
    to   { opacity:1; transform:translateY(0);    }
  }
  @keyframes adminReveal {
    from { opacity:0; transform:translateY(12px) scale(0.97); }
    to   { opacity:1; transform:translateY(0)    scale(1);    }
  }
  @keyframes qrAura {
    0%,100% { opacity:0.5; transform:scale(0.96); }
    50%     { opacity:1;   transform:scale(1.04); }
  }
  @keyframes qrRingPulse {
    0%,100% { opacity:0.4; transform:scale(0.97); }
    50%     { opacity:0.8; transform:scale(1.03); }
  }
  @keyframes goldPulse {
    0%,100% { opacity:0.6; transform:scale(0.98); }
    50%     { opacity:1;   transform:scale(1.02); }
  }
  @keyframes aetherSpin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  @keyframes heroOrb {
    0%,100% { transform: translateY(0) scale(1); opacity: 0.7; }
    50%     { transform: translateY(-12px) scale(1.08); opacity: 1; }
  }
`;

// ─────────────────────────────────────────────────────────────────────────────
// SPEECH LIBRARY
// ─────────────────────────────────────────────────────────────────────────────

const SPEECH = {
  // ── Screen transitions ───────────────────────────────────────────────────
  ON_HERO:      "Welcome, Seeker. Let's find the correct pour for your path.",
  ON_QUIZ:      "Let's dial in the essence. Tell the Alchemist... what magic are we brewing today?",
  ON_GATE:      "Nearly complete. A few more details unlocks your personal dossier.",
  ON_SOMMELIER: "Calibrating the Dossier... cross-referencing alkaloid densities with your current intention.",
  ON_RESULT:    "The roots have spoken. We've calibrated your result to anchor your current frequency.",
  ON_MENU:      "Full system access granted. Your path is clear — choose your vessel and let the roots guide the pour.",

  // ── Quiz step transitions ────────────────────────────────────────────────
  ON_FREQUENCY: "Detecting current state. Are we running high, neutral, or deep?",
  ON_INTENTION: "Define your vector. Are we seeking sharp focus, social flow, or a total system reset?",
  ON_CHRONOTYPE:"Aligning with the sun and moon. Are we syncing for the dawn, the midday heat, or the late-night stillness?",
  ON_PALATE:    "Defining the finish... which elemental profile speaks to your palate — earthy, fruity, or tropical?",

  // ── Quiz answer responses ────────────────────────────────────────────────
  SELECT_FREQUENCY_HIGH:    "High frequency confirmed. We'll look for something grounded to stabilize the current.",
  SELECT_FREQUENCY_NEUTRAL: "Neutral frequency. The spirit is open — let's find a shell that complements this stillness.",
  SELECT_FREQUENCY_DEEP:    "Deep-state frequency detected. Syncing with a smooth, sustained-release profile.",
  SELECT_INTENTION_FOCUS:   "Sharp focus selected. I've secured a clean, uplifting batch to sharpen the mind's edge.",
  SELECT_INTENTION_SOCIAL:  "The intention is connection. I've found a pour designed to open the heart and the voice.",
  SELECT_INTENTION_RESET:   "A full reset. We're going deep — I'll find the heaviest, most grounding leaves in the collection.",
  SELECT_SUNRISE:   "Temporal sync: Dawn. Prioritizing light-spectrum alkaloids to match rising energy.",
  SELECT_MOONLIGHT: "Night owl. The heavier, sedating varieties will suit the late-night vibe.",
  SELECT_ALCHEMIST: "Adaptive baseline identified. Syncing a hybrid Noble profile to integrate with your shifting rhythm.",
  SELECT_PALATE_EARTHY:   "You seek the essence of the soil. This shell brings the deep, peppery notes of the earth directly to the cup.",
  SELECT_PALATE_FRUITY:   "A preference for the bright side. I've secured a variety that sings with botanical sweetness and a refreshingly clean intake.",
  SELECT_PALATE_TROPICAL: "Smooth and accessible. I've isolated a clean variety that provides the full effect without the traditional sharp edge.",

  // ── Transaction states ───────────────────────────────────────────────────
  ON_PROCESSING: "Confirming the selection. The Alchemist is locking in this pour.",
  ON_SUCCESS:    "The work is done. Show this to the bar and let the roots guide the rest. Bula!",
  ON_ERROR:      "Signal interference detected. The connection dropped — let's re-sync and try again.",

  // ── Returning user ───────────────────────────────────────────────────────
  ON_RETURNING: "Welcome back, Traveler. The dossier knows your frequency.",

  // ── Idle rotation (cycles every 4.8s when Wizard is not speaking) ────────
  IDLE_0: "One pour. One intention. One chance to realign.",
  IDLE_1: "Looking for clarity? Or just a quiet corner of the bar?",
  IDLE_2: "Tell the Alchemist your goal — we'll handle the technical details.",
  IDLE_3: "Sustainable. Ethical. Botanical. Bula!",
  IDLE_4: "Define your session. The Intention Engine is standing by.",
};

// ─────────────────────────────────────────────────────────────────────────────
// BOTANICAL LIBRARY
// ─────────────────────────────────────────────────────────────────────────────
// Educational content for the Botanical 101 screen (Phase 2 UI).
// Bar owners can toggle which botanicals are visible per location.
// This data is independent of the inventory — a botanical can be shown
// for education even if the bar doesn't currently carry it.
// Each entry: id, tag, name, visible (admin-toggleable), and four slugs:
//   essence  — what it is and where it comes from
//   function — what it does in the body
//   feeling  — subjective experience description
//   protocol — dosing and safety guidance

const BOTANICAL_LIBRARY = [
  {
    id: "BOT_001", tag: "KAVA_CORE", name: "Kava", visible: true,
    essence:  "Derived from the roots of a South Pacific pepper plant, cold-strained for those who value the ancient ways. It's thousands of years of ceremonial peace brewed into a single, earthy cup.",
    function: "This is the system's mute button for the noise of the day. It targets social friction and physical knots, giving you a total chill state without touching your mental clarity.",
    feeling:  "The tongue-numb is the signal — it means the chemistry is live. You'll feel the weight drop off your shoulders as the Alchemist grounds your frequency into a happy, steady baseline.",
    protocol: "Empty stomach for maximum intake. Take one shell, give the system 15 minutes to sync, then check your levels before going back for more. System Lock: Don't mix this with alcohol.",
  },
  {
    id: "BOT_002", tag: "KRATOM_CORE", name: "Kratom", visible: true,
    essence:  "A Southeast Asian leaf from the coffee family, harvested for centuries by those who need to stay sharp and driven. We serve it as a tea or seltzer in three specific vein colors to match your internal frequency.",
    function: "A total multitasker. Whites are for energy and getting stuff done, Greens are the middle ground for a balanced mood, and Reds are the nightcaps for deep relaxation and physical comfort.",
    feeling:  "You'll feel an uplifted mood and a sense of flow that lasts for hours, whether you're looking for a clean energy lift or a warm hug for your body.",
    protocol: "Less is more is the golden rule here. Start small to see how your body reacts to the different colors and keep the hydration levels high.",
  },
  {
    id: "BOT_003", tag: "KANNA_CORE", name: "Kanna", visible: true,
    essence:  "A South African succulent used for generations to balance emotions and clear the mind. It's typically fermented and dried, acting as a natural mood booster for the seeker.",
    function: "This one keeps your feel-good chemicals circulating longer, effectively washing away the stress and opening your heart to the room.",
    feeling:  "Expect a bright, tingly rush of social energy. You'll feel a sudden desire to connect, talk, and engage with whatever frequency the room is putting out.",
    protocol: "Kanna can be intense for a first-timer, so the Alchemist recommends starting with a small dose. It's the ultimate choice for a social night.",
  },
  {
    id: "BOT_004", tag: "LIONS_MANE", name: "Lion's Mane", visible: true,
    essence:  "Not a grocery store mushroom — it's a shaggy functional fungus used in traditional medicine for ages to support the brain's structural health.",
    function: "Brain food that helps your mental nerves repair themselves and stay sharp. Less about a quick buzz and more about long-term maintenance.",
    feeling:  "You won't feel a sudden buzz, but you'll notice it's suddenly much easier to stay locked in. It's a subtle, clean clarity.",
    protocol: "Perfect for your daily routine, especially if you're managing multiple ventures. It pairs exceptionally well with Kava for a focused-calm state.",
  },
  {
    id: "BOT_005", tag: "CBD_VAR", name: "CBD", visible: true,
    essence:  "A compound found in the hemp plant that works quietly without a psychoactive high. It's a foundational piece for system maintenance and recovery.",
    function: "Think of CBD as a volume knob for your body's background noise. It turns down the dial on physical discomfort, inflammation, and nagging anxiety.",
    feeling:  "You won't feel a buzz. Instead, you'll just realize you feel a bit lighter, your joints aren't as stiff, and the mental chatter has gone quiet.",
    protocol: "Since it's non-intoxicating, you can use it any time of day. It's a great addition to a shell of Kava to deepen the relaxation.",
  },
  {
    id: "BOT_006", tag: "BLUE_LOTUS", name: "Blue Lotus", visible: true,
    essence:  "The spirit flower of Ancient Egypt, historically used in rituals to reach a more relaxed, meditative state. A gentle botanical for shifting your perspective.",
    function: "A light sedative that softens the sharp edges of the day. Designed to help you drop out of your head and into a dreamy, reflective headspace.",
    feeling:  "Floaty and calm. It quiets the mental chatter and can make your dreams much more vivid and memorable if consumed before the Moonlight cycle.",
    protocol: "Strictly an evening flower. Best for a quiet night or deep meditation when you really want to unplug from the system.",
  },
  {
    id: "BOT_007", tag: "CORDYCEPS", name: "Cordyceps", visible: true,
    essence:  "The athlete's mushroom. A unique fungus prized for giving people the stamina to handle long treks and high-altitude energy demands.",
    function: "Helps your body use oxygen more efficiently and boosts cellular energy. A natural battery pack for your muscles without the jitters.",
    feeling:  "A steady, clean burn of energy. It doesn't make your heart race — it just makes you feel like you have an extra gear for busy days.",
    protocol: "Your go-to for the Sunrise hours or a pre-workout boost. Ideal for anyone with a high-activity lifestyle.",
  },
  {
    id: "BOT_008", tag: "REISHI_REST", name: "Reishi", visible: true,
    essence:  "Often called the King of Mushrooms, this woody fungus has been a staple of traditional wellness for over 2,000 years to help the body adapt to stress.",
    function: "A powerful adaptogen that calms your nervous system and supports immune health, helping you stay resilient against a hectic schedule.",
    feeling:  "Deep, grounding relaxation. It doesn't necessarily make you sleepy right away, but it settles your internal static so you can drift into quality rest.",
    protocol: "Best used in the evening as part of a wind-down ritual. Excellent for switching off your brain after managing a large project inventory.",
  },
  {
    id: "BOT_009", tag: "ASHWAGANDHA", name: "Ashwagandha", visible: true,
    essence:  "One of the most important herbs in ancient Indian wellness, used to provide strength and stamina while keeping the mind steady under pressure.",
    function: "Targets the body's stress hormones directly, helping you stay resilient so you don't feel fried by the demands of a full day.",
    feeling:  "A sense of calm strength. You feel capable and steady, even when things are moving fast around you — it's like an emotional shield.",
    protocol: "Can be taken daily. Pairs perfectly with Kava or Kratom to help keep your mood frequency stable throughout the day.",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// LEGAL CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────
// All customer-facing legal strings live here.
// Never hardcode legal text inside components — always reference these constants.
// To update copy for a new location, update CURRENT_BAR_CONFIG below.

const AGE_GATE_TEXT =
  "Welcome to Bula Base. By entering, you certify that you are at least 18 years of age. " +
  "Please note that while our space is open to all, you must be 18+ to be served Kava and " +
  "18+ to be served Kratom or related botanical blends. Valid government-issued ID is required " +
  "for all botanical purchases.";

const BOTANICAL_DISCLAIMER =
  "These statements have not been evaluated by the Food and Drug Administration. Our products " +
  "are not intended to diagnose, treat, cure, or prevent any disease. " +
  "KAVA WARNING: Consult your healthcare provider before use if you have liver problems, " +
  "frequently consume alcohol, or take any medication. " +
  "KRATOM WARNING: You must be 18+ to purchase. Do not use if you are pregnant or nursing. " +
  "Excessive consumption may cause dependency. Use responsibly and do not operate heavy " +
  "machinery after consumption.";

const PRIVACY_POLICY_SUMMARY =
  "Privacy Policy — Shanti Kava (Bula Base). We collect your name, phone, and email solely " +
  "to provide the Alchemist Identity personalized experience and to notify you of fresh batch " +
  "arrivals. Your data is used for internal recommendation logic and marketing opt-ins only. " +
  "We do not sell or rent your personal information to third parties. Leads are processed via " +
  "encrypted data pipelines and stored securely. We use trusted third-party processors who are " +
  "contractually prohibited from using your data for their own purposes. " +
  "For data inquiries, visit us at 525 FL-16 #130, St. Augustine, FL 32084.";

const SMS_CONSENT_TEXT =
  "By providing your phone number and clicking 'Describe your vibe!', you consent to receive " +
  "recurring automated marketing text messages (e.g., Batch Whisperer alerts) from Shanti Kava " +
  "at the number provided. Consent is not a condition of purchase. Msg & data rates may apply. " +
  "Msg frequency varies. Reply STOP to unsubscribe or HELP for help. View our Privacy Policy " +
  "and Terms at shantikava.com.";

// ─────────────────────────────────────────────────────────────────────────────
// BAR CONFIG — Shanti Kava · St. Augustine
// ─────────────────────────────────────────────────────────────────────────────
// Single source of truth for this deployment.
// Phase 2: developer lifts this into a Firestore document fetched at runtime
// so each bar configures itself without a code deploy.

const CURRENT_BAR_CONFIG = {
  id:            "shanti-kava-st-aug",
  name:          "Shanti Kava",
  address:       "525 FL-16 #130, St. Augustine, FL 32084",
  website:       "shantikava.com",

  // Age thresholds — Florida Kratom Consumer Protection Act sets both at 18
  minAgeGeneral: 18,
  minAgeKava:    18,
  minAgeKratom:  18,

  // Legal strings — sourced from constants above, never inline
  ageGateText:   AGE_GATE_TEXT,
  disclaimer:    BOTANICAL_DISCLAIMER,
  privacyPolicy: PRIVACY_POLICY_SUMMARY,
  smsConsent:    SMS_CONSENT_TEXT,
};
const GIDEON_CFG = {
  model:           "eleven_multilingual_v2",
  stability:       0.45,
  similarityBoost: 0.80,
  style:           0.45,
  useSpeakerBoost: true,
};

const SUCCESS_GLOW_HOLD_MS   = 1500;
const INTER_LINE_GAP_MS      = 280;
const WEB_SPEECH_DEADLINE_MS = 18000;

// ── Show & Go Redemption ──────────────────────────────────────────────────────
// Duration of the reward window after a successful pour.
const SHOW_AND_GO_DURATION_MS = 5 * 60 * 1000; // 5 minutes

const SCREEN_SPEECH_MAP = {
  HERO:"ON_HERO", QUIZ:"ON_QUIZ", GATE:"ON_GATE",
  SOMMELIER:"ON_SOMMELIER", RESULT:"ON_RESULT", MENU:"ON_MENU",
};
const STEP_SPEECH_MAP = {
  frequency:"ON_FREQUENCY", intention:"ON_INTENTION",
  chronotype:"ON_CHRONOTYPE", palate:"ON_PALATE",
};
const STATUS_SPEECH_MAP = {
  PROCESSING:"ON_PROCESSING", SUCCESS:"ON_SUCCESS", ERROR:"ON_ERROR",
};
const CHRONO_SPEECH_MAP = {
  early_bird:"SELECT_SUNRISE", night_owl:"SELECT_MOONLIGHT", alchemist:"SELECT_ALCHEMIST",
};

// ── Gideon voice selection — five-tier priority ──────────────────────────────
// Tier 1: Premium / Enhanced / Neural / Multilingual keyword match.
//         Covers Apple Enhanced/Premium, iOS Siri voices, Chrome Neural,
//         Microsoft Online Natural, and Google WaveNet voices.
//         Male preferred at this tier for the Gideon persona.
// Tier 2: Specific named voices known to be warm and resonant on tablets.
//         Evan (Apple US) and Siri (Apple) included per Gideon spec.
// Tier 3: en-US male by gender attribute (not all browsers expose gender,
//         but Chrome on Android does — worth the check).
// Tier 4: Any English male voice (name-based /male/ regex).
// Tier 5: Any English voice.
// Absolute fallback: voices[0].
//
// getVoices() is async on Chrome and synchronous on iOS Safari.
// webVoice.current is populated in useWizardSpeech's voiceschanged useEffect
// so it's ready before ON_HERO fires on the first screen transition.
// The warmupSpeech() function pre-initialises synthesis on first user tap
// to clear any browser-side audio blocks before Gideon's first line queues.

const VOICE_PREMIUM_KEYWORDS = [
  "premium", "enhanced", "neural", "natural", "multilingual", "google",
];

const VOICE_TIER2_NAMES = [
  // macOS / iOS — Apple voices, warm and resonant
  "Evan",                                                          // Apple US male — closest to Gideon
  "Daniel",                                                        // macOS UK male — warm, measured
  "Aaron",                                                         // macOS US male — deep, grounded
  "Fred",                                                          // macOS US male — resonant
  "Tom",                                                           // macOS US male
  // iOS Siri voice (available on iPadOS when downloaded)
  "Siri",
  // Chrome on Android / ChromeOS
  "Google US English",
  "Google UK English Male",
  // Windows / Edge neural voices
  "Microsoft Guy Online (Natural) - English (United States)",
  "Microsoft Davis Online (Natural) - English (United States)",
  "Microsoft Ryan Online (Natural) - English (United Kingdom)",
  "Microsoft George - English (United Kingdom)",
];

function pickWebVoice() {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;

  // ── Tier 1a: Premium / Neural / Enhanced English male ──────────────────────
  const premiumMale = voices.find(v =>
    v.lang?.startsWith("en") &&
    /male/i.test(v.name) &&
    VOICE_PREMIUM_KEYWORDS.some(k => v.name.toLowerCase().includes(k))
  );
  if (premiumMale) return premiumMale;

  // ── Tier 1b: Any premium English voice (quality over gender) ───────────────
  const premiumAny = voices.find(v =>
    v.lang?.startsWith("en") &&
    VOICE_PREMIUM_KEYWORDS.some(k => v.name.toLowerCase().includes(k))
  );
  if (premiumAny) return premiumAny;

  // ── Tier 2: Named voices known to sound warm on tablets ────────────────────
  for (const name of VOICE_TIER2_NAMES) {
    const v = voices.find(x => x.name === name || x.name.startsWith(name));
    if (v) return v;
  }

  // ── Tier 3: en-US male by gender attribute (Chrome Android exposes this) ───
  const enUSMaleByGender = voices.find(v =>
    v.lang === "en-US" && v.gender === "male"
  );
  if (enUSMaleByGender) return enUSMaleByGender;

  // ── Tier 4: Any English male voice by name ─────────────────────────────────
  const anyMale = voices.find(v => v.lang?.startsWith("en") && /male/i.test(v.name));
  if (anyMale) return anyMale;

  // ── Tier 5: Any English voice ──────────────────────────────────────────────
  const anyEnglish = voices.find(v => v.lang?.startsWith("en"));
  if (anyEnglish) return anyEnglish;

  return voices[0] || null;
}

// warmupSpeech — pre-initialises synthesis on the first user gesture.
// Called from the Hero screen "FIND YOUR PERFECT POUR" button tap
// in addition to the iOS AudioContext unlock. Speaks a zero-length
// silent utterance to satisfy Chrome's autoplay policy and force
// the browser to route audio to the correct output before Gideon's
// first real line queues. Safe to call multiple times — no-ops after first fire.
let _warmupFired = false;
function warmupSpeech() {
  if (_warmupFired) return;
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  try {
    _warmupFired = true;
    const utt   = new SpeechSynthesisUtterance(" ");
    utt.volume  = 0;       // silent — user hears nothing
    utt.rate    = 10;      // maximum rate — completes in ~10ms
    utt.voice   = pickWebVoice();
    window.speechSynthesis.speak(utt);
  } catch {}
}

async function speakElevenLabs(text, cfg) {
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${cfg.voiceId}/stream`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "xi-api-key": cfg.apiKey },
      body: JSON.stringify({
        text, model_id: cfg.model,
        voice_settings: {
          stability: cfg.stability, similarity_boost: cfg.similarityBoost,
          style: cfg.style, use_speaker_boost: cfg.useSpeakerBoost,
        },
      }),
    }
  );
  if (!res.ok) throw new Error(`ElevenLabs HTTP ${res.status}`);
  const buf = await res.arrayBuffer();
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  try {
    const decoded = await ctx.decodeAudioData(buf);
    const src = ctx.createBufferSource();
    src.buffer = decoded;
    src.connect(ctx.destination);
    return new Promise((resolve, reject) => {
      src.onended = () => { ctx.close(); resolve(); };
      src.onerror = e => { ctx.close(); reject(e); };
      src.start(0);
    });
  } catch (e) {
    await ctx.close().catch(() => {});
    throw e;
  }
}

// speakWebSpeech — Gideon profile
// rate  0.92 : deliberate and calm — not rushed, not slow.
//              0.85 was too heavy for longer Alchemist lines; 0.92 is the
//              sweet spot between measured and listenable in a bar environment.
// pitch 0.85 : adds depth and gravitas — lower than 0.90 for more resonance.
//              Do not go below 0.80 — unnatural artefacts appear below that.
// volume 1.0 : full volume — bar environment is loud.
// Chrome stall protection: nudge (speaking=true / onend-never-fires) +
// deadline (silent stall: speaking=false, no onend, no onerror).
function speakWebSpeech(text, voice) {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.speechSynthesis)
      return reject(new Error("speechSynthesis unavailable"));
    window.speechSynthesis.cancel();
    const utt    = new SpeechSynthesisUtterance(text);
    utt.voice    = voice || pickWebVoice();
    utt.rate     = 0.92;   // Gideon: deliberate and calm — not rushed
    utt.pitch    = 0.85;   // Gideon: depth and gravitas — resonant register
    utt.volume   = 1.0;    // Full volume for bar environment
    let resolved = false, nudge, deadline;
    const done = reason => {
      if (resolved) return;
      resolved = true;
      clearInterval(nudge); clearTimeout(deadline);
      if (reason !== "error") resolve();
    };
    utt.onend   = () => done("end");
    utt.onerror = e => {
      clearInterval(nudge); clearTimeout(deadline);
      (e.error === "interrupted" || e.error === "canceled") ? resolve() : reject(e);
    };
    window.speechSynthesis.speak(utt);
    nudge = setInterval(() => {
      if (!window.speechSynthesis.speaking) { clearInterval(nudge); return; }
      window.speechSynthesis.pause();
      window.speechSynthesis.resume();
    }, 10000);
   deadline = setTimeout(() => {
      if (!resolved) {
        resolved = true; 
        clearInterval(nudge);
        console.warn(`[WizardSpeech] 18s bouncer fired — "${text.slice(0,40)}..."`);
        window.speechSynthesis.cancel();
        resolve();
      }
    }, WEB_SPEECH_DEADLINE_MS);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// useWizardSpeech
// ─────────────────────────────────────────────────────────────────────────────

function useWizardSpeech({
  screen         = null,
  quizStep       = null,
  vibes          = {},
  status         = "IDLE",
  startMuted     = false,
  onSuccessReady = null,
} = {}) {
  const [speaking,   setSpeaking]   = useState(false);
  const [glowActive, setGlowActive] = useState(false);
  const [isMuted,    setIsMuted]    = useState(startMuted);
  const [lastLine,   setLastLine]   = useState(null);

  const IDLE_LINES = useMemo(
    () => ["IDLE_0","IDLE_1","IDLE_2","IDLE_3","IDLE_4"].map(k => SPEECH[k]),
    []
  );
  const [idleIdx, setIdleIdx] = useState(0);
  const idleLine = IDLE_LINES[idleIdx];

  useEffect(() => {
    if (speaking || glowActive) return;
    const id = setInterval(() => setIdleIdx(i => (i + 1) % IDLE_LINES.length), 4800);
    return () => clearInterval(id);
  }, [speaking, glowActive, IDLE_LINES.length]);

  const useGideon = VOICE_ENGINE === "eleven_labs"
    && !!(BULA_CONFIG.voice.apiKey && BULA_CONFIG.voice.voiceId);
  const elCfg = useMemo(() => ({
    ...GIDEON_CFG, apiKey: BULA_CONFIG.voice.apiKey, voiceId: BULA_CONFIG.voice.voiceId,
  }), []);

  // hasSpoken: composite key tracks which transition has already fired.
  // Format: "SCREEN|STEP|STATUS|VIBE_FREQ|VIBE_INT|VIBE_CHRON|VIBE_PAL"
  const hasSpokenKey   = useRef("");
  const prevVibeKeys   = useRef({});
  const webVoice       = useRef(null);
  const queue          = useRef([]);
  const draining       = useRef(false);
  const glowTimer      = useRef(null);
  const audioUnlocked  = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const load = () => { webVoice.current = pickWebVoice(); };
    window.speechSynthesis.getVoices().length > 0
      ? load()
      : window.speechSynthesis.addEventListener("voiceschanged", load, { once: true });
  }, []);

  const startGlowHold = useCallback(() => {
    clearTimeout(glowTimer.current);
    setGlowActive(true);
    glowTimer.current = setTimeout(() => {
      setGlowActive(false);
      onSuccessReady?.();
    }, SUCCESS_GLOW_HOLD_MS);
  }, [onSuccessReady]);

  // drainQueue: serialised loop — never overlaps.
  // `draining` ref is the mutex. ON_SUCCESS triggers glow hold.
  const drainQueue = useCallback(async () => {
    if (draining.current) return;
    draining.current = true;
    setSpeaking(true);
    while (queue.current.length > 0) {
      const line      = queue.current.shift();
      const isSuccess = line === SPEECH.ON_SUCCESS;
      setLastLine(line);
      try {
        useGideon
          ? await speakElevenLabs(line, elCfg)
          : await speakWebSpeech(line, webVoice.current);
      } catch (err) {
        console.warn("[WizardSpeech]", err?.message ?? err);
      }
      if (isSuccess) startGlowHold();
      if (queue.current.length > 0)
        await new Promise(r => setTimeout(r, INTER_LINE_GAP_MS));
    }
    draining.current = false;
    setSpeaking(false);
  }, [useGideon, elCfg, startGlowHold]);

const speakLine = useCallback(text => {
    if (!text || isMuted) return;

    window.speechSynthesis.cancel();

    const msg = new SpeechSynthesisUtterance(text);
    
    const voices = window.speechSynthesis.getVoices();
    
    const preferredVoice = voices.find(v => v.name === 'Google US English') || 
                          voices.find(v => v.name.includes('Samantha')) || 
                          voices.find(v => v.name.includes('English'));

    if (preferredVoice) {
      msg.voice = preferredVoice;
    }

    msg.pitch = 1.0; 
    msg.rate = 0.9; 
    msg.volume = 1;

    window.speechSynthesis.speak(msg);
  }, [isMuted]);
 
  useEffect(() => {
    if (!screen) return;
    const vibeStr = [
      vibes.frequency||"", vibes.intention||"",
      vibes.chronotype||"", vibes.palate||""
    ].join("|");
    const key = `${screen}|${quizStep||""}|${status}|${vibeStr}`;
    if (key === hasSpokenKey.current) return;
    hasSpokenKey.current = key;

    // Screen-level line (spoken once per screen transition)
    const screenLine = SPEECH[SCREEN_SPEECH_MAP[screen]];

    // Step-level line (quiz step, spoken once per step)
    const stepLine = quizStep ? SPEECH[STEP_SPEECH_MAP[quizStep]] : null;

    // Vibe selection lines (spoken once per vibe answer)
    const vibeLines = [];
    const prev = prevVibeKeys.current;
    for (const step of ["frequency","intention","chronotype","palate"]) {
      const v = vibes[step];
      if (v && v !== prev[step]) {
        const k = step === "chronotype"
          ? CHRONO_SPEECH_MAP[v]
          : `SELECT_${step.toUpperCase()}_${v.toUpperCase()}`;
        const l = SPEECH[k];
        if (l) vibeLines.push(l);
      }
    }
    prevVibeKeys.current = { ...vibes };

    // Status line (PROCESSING / SUCCESS / ERROR)
    const statusLine = STATUS_SPEECH_MAP[status] ? SPEECH[STATUS_SPEECH_MAP[status]] : null;

    // Queue priority: screen or vibe lines first, status on top of PROCESSING/ERROR
    if (vibeLines.length > 0) {
      vibeLines.forEach(l => speakLine(l));
    } else if (screen === "QUIZ" && window.BULA_RETURNING_GREETING) {
      // Returning user lands on QUIZ — speak the personal welcome once, then clear the flag
      window.BULA_RETURNING_GREETING = false;
      speakLine(SPEECH.ON_RETURNING);
    } else if (stepLine) {
      speakLine(stepLine);
    } else if (screenLine) {
      speakLine(screenLine);
    }
    if (statusLine && status !== "IDLE") speakLine(statusLine);
  }, [screen, quizStep, status, vibes, speakLine]);

  useEffect(() => () => {
    if (typeof window !== "undefined" && window.speechSynthesis)
      window.speechSynthesis.cancel();
    clearTimeout(glowTimer.current);
    queue.current    = [];
    draining.current = false;
  }, []);

  return {
    speaking, glowActive, muted: isMuted, setMuted: setIsMuted,
    speakLine, lastLine, idleLine, audioUnlocked,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// TRANSACTION LAYER
// ─────────────────────────────────────────────────────────────────────────────

async function logShell({ item, dispatch }) {
  const actionId = crypto.randomUUID();
  dispatch({ type: "REQ_START", actionId, itemName: item.name });
  try {
    // Replace with: await httpsCallable(functions,"secure_logShell")({drinkId:item.id,locationId:LOCATION_ID,actionId})
    await new Promise(r => setTimeout(r, 850));
    dispatch({ type: "REQ_SUCCESS" });
    return { actionId };
  } catch (err) {
    dispatch({ type: "REQ_FAIL", payload: err?.message ?? "Network error" });
    throw err;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GOLDEN SEED — Reed-Solomon QR, UUID_V4_RE, frozenURL flicker fix
// ─────────────────────────────────────────────────────────────────────────────

const GOLDEN_SEED_BASE = "https://agensi.app/troy-kava";
const UUID_V4_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function buildGoldenSeedURL({ vibe, chrono, reco, sid }) {
  if (!sid || !UUID_V4_RE.test(sid))
    throw new Error(`[GoldenSeed] sid must be UUID v4. Got: ${JSON.stringify(sid)}`);
  return `${GOLDEN_SEED_BASE}?${new URLSearchParams({
    vibe: vibe||"unknown", chrono: chrono||"unknown", reco: reco||"none",
    sid, t: Math.floor(Date.now()/1000).toString(),
    utm_source:"bula_base", utm_medium:"qr_ritual", utm_campaign:"golden_seed_v2",
  })}`;
}

function _gf(){const e=new Uint8Array(512),l=new Uint8Array(256);let x=1;for(let i=0;i<255;i++){e[i]=x;l[x]=i;x=x*2;if(x>=256)x^=285;}for(let i=255;i<512;i++)e[i]=e[i-255];return{exp:e,log:l};}
const GF=_gf(),gfMul=(a,b)=>a&&b?GF.exp[GF.log[a]+GF.log[b]]:0,gfPow=(x,p)=>GF.exp[(GF.log[x]*p)%255];
function rsGen(n){let p=[1];for(let i=0;i<n;i++){const g=[1,gfPow(2,i)],r=new Array(p.length+1).fill(0);for(let j=0;j<p.length;j++)for(let k=0;k<2;k++)r[j+k]^=gfMul(p[j],g[k]);p=r;}return p;}
function rsEnc(d,n){const g=rsGen(n),m=[...d,...new Array(n).fill(0)];for(let i=0;i<d.length;i++){const c=m[i];if(!c)continue;for(let j=0;j<g.length;j++)m[i+j]^=gfMul(g[j],c);}return m.slice(d.length);}
function qrEncode(text){
  const by=[];for(let i=0;i<text.length;i++)by.push(text.charCodeAt(i)&0xff);
  const cp=[null,[21,16,10],[25,28,16],[29,44,26],[33,64,36],[37,86,48],[41,108,64],[45,124,72],[49,154,88],[53,182,110],[57,216,130]];
  let v=1;while(v<=10&&cp[v][1]<by.length+3)v++;
  if(v>10)throw new Error("URL too long for QR v10");
  const[M,dB,eB]=cp[v],bits=[],push=(val,len)=>{for(let i=len-1;i>=0;i--)bits.push((val>>i)&1);};
  push(0b0100,4);push(by.length,8);by.forEach(b=>push(b,8));push(0,4);while(bits.length%8)bits.push(0);
  const ds=[];for(let i=0;i<bits.length;i+=8)ds.push(bits.slice(i,i+8).reduce((a,b,j)=>a|(b<<(7-j)),0));
  const pad=[0xEC,0x11];while(ds.length<dB)ds.push(pad[ds.length%2]);
  const full=[...ds,...rsEnc(ds,eB)];
  const gr=Array.from({length:M},()=>new Array(M).fill(null)),fn=Array.from({length:M},()=>new Array(M).fill(false));
  const set=(r,c,val)=>{gr[r][c]=val;fn[r][c]=true;};
  function finder(r,c){for(let dr=-1;dr<=7;dr++)for(let dc=-1;dc<=7;dc++){const rr=r+dr,cc=c+dc;if(rr<0||rr>=M||cc<0||cc>=M)continue;const b=dr===-1||dr===7||dc===-1||dc===7,rg=dr===1||dr===5||dc===1||dc===5,co=dr>=2&&dr<=4&&dc>=2&&dc<=4,ins=dr>=0&&dr<=6&&dc>=0&&dc<=6;set(rr,cc,ins&&!b&&(!rg||co));}}
  finder(0,0);finder(0,M-7);finder(M-7,0);
  for(let i=8;i<M-8;i++){set(6,i,i%2===0);set(i,6,i%2===0);}set(M-8,8,true);
  const al=[null,null,[6,18],[6,22],[6,26],[6,30],[6,34],[6,22,38],[6,24,42],[6,28,46],[6,32,50]];
  if(v>=2&&al[v]){const pos=al[v];for(const ar of pos)for(const ac of pos){if(fn[ar][ac])continue;for(let dr=-2;dr<=2;dr++)for(let dc=-2;dc<=2;dc++){const b=Math.abs(dr)===2||Math.abs(dc)===2,c2=dr===0&&dc===0;set(ar+dr,ac+dc,b||c2);}}}
  const fmt=(0b00<<3|0b010)^0b101010000010010,fb=[];for(let i=14;i>=0;i--)fb.push((fmt>>i)&1);
  [[8,0],[8,1],[8,2],[8,3],[8,4],[8,5],[8,7],[8,8],[7,8],[5,8],[4,8],[3,8],[2,8],[1,8],[0,8]].forEach(([r,c],i)=>set(r,c,!!fb[i]));
  [[M-1,8],[M-2,8],[M-3,8],[M-4,8],[M-5,8],[M-6,8],[M-7,8],[M-8,8],[8,M-8],[8,M-7],[8,M-6],[8,M-5],[8,M-4],[8,M-3],[8,M-2],[8,M-1]].slice(0,15).forEach(([r,c],i)=>set(r,c,!!fb[i]));
  let bit=0;const ab=full.flatMap(b=>[7,6,5,4,3,2,1,0].map(i=>(b>>i)&1)),mask=(r,c)=>(Math.floor(r/2)+Math.floor(c/3))%2===0;
  for(let col=M-1;col>0;col-=2){if(col===6)col--;for(let row=0;row<M;row++){for(let d=0;d<2;d++){const c=col-d,r=(col+1)%4<2?row:M-1-row;if(fn[r][c])continue;const b=bit<ab.length?ab[bit++]:0;gr[r][c]=b^(mask(r,c)?1:0)?true:false;}}}
  for(let r=0;r<M;r++)for(let c=0;c<M;c++)if(gr[r][c]===null)gr[r][c]=false;
  return{grid:gr,modules:M,version:v};
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
      canvas.width=px;canvas.height=px;
      canvas.style.width=`${size}px`;canvas.style.height=`${size}px`;
      ctx.fillStyle=C.gold;ctx.fillRect(0,0,px,px);
      ctx.fillStyle=C.jade;
      for(let r=0;r<modules;r++)for(let c=0;c<modules;c++){
        if(!grid[r][c])continue;
        const x=c*scale,y=r*scale;
        const isF=(r<7&&c<7)||(r<7&&c>=modules-7)||(r>=modules-7&&c<7);
        if(isF){ctx.fillRect(x,y,scale,scale);}else{
          const r2=scale*0.18;
          ctx.beginPath();ctx.moveTo(x+r2,y);ctx.lineTo(x+scale-r2,y);ctx.quadraticCurveTo(x+scale,y,x+scale,y+r2);ctx.lineTo(x+scale,y+scale-r2);ctx.quadraticCurveTo(x+scale,y+scale,x+scale-r2,y+scale);ctx.lineTo(x+r2,y+scale);ctx.quadraticCurveTo(x,y+scale,x,y+scale-r2);ctx.lineTo(x,y+r2);ctx.quadraticCurveTo(x,y,x+r2,y);ctx.closePath();ctx.fill();
        }
      }
      setRdy(true);
    }catch(e){setErr(e.message);}
  },[url,size]);
  if(err)return<div style={{width:size,height:size,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(255,68,68,0.07)",border:"1px solid rgba(255,68,68,0.2)",borderRadius:12,fontFamily:TF.mono,fontSize:8,color:"rgba(255,100,100,0.7)",textAlign:"center",padding:12}}>QR ERROR<br/>{err}</div>;
  return(
    <div style={{position:"relative",width:size,height:size}}>
      <canvas ref={ref} style={{display:"block",borderRadius:6}}/>
      {!rdy&&<div style={{position:"absolute",inset:0,background:"rgba(9,26,17,0.5)",display:"flex",alignItems:"center",justifyContent:"center",borderRadius:6}}><div style={{width:18,height:18,border:`2px solid rgba(212,175,55,0.2)`,borderTopColor:C.gold,borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/></div>}
    </div>
  );
}

// GoldenSeedOverlay — frozenURL/frozenSID refs prevent QR flicker
function GoldenSeedOverlay({ glowActive, vibe, chrono, reco, actionId, onClose }) {
  const frozenURL = useRef(null);
  const frozenSID = useRef(null);
  const [visible, setVisible] = useState(false);
  const [entered, setEntered] = useState(false);
  const [copied,  setCopied]  = useState(false);

  useEffect(() => {
    if (!glowActive) {
      setEntered(false);
      const t = setTimeout(() => {
        setVisible(false); frozenURL.current = null; frozenSID.current = null;
      }, 400);
      return () => clearTimeout(t);
    }
    if (frozenURL.current) return;
    try {
      const url = buildGoldenSeedURL({ vibe, chrono, reco, sid: actionId });
      frozenURL.current = url; frozenSID.current = actionId;
      setVisible(true);
      requestAnimationFrame(() => requestAnimationFrame(() => setEntered(true)));
    } catch (err) { console.error("[GoldenSeed]", err.message); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [glowActive]);

  const copy = useCallback(async () => {
    if (!frozenURL.current) return;
    try { await navigator.clipboard.writeText(frozenURL.current); setCopied(true); setTimeout(()=>setCopied(false),2000); } catch {}
  }, []);

  if (!visible || !frozenURL.current) return null;
  const sid    = frozenSID.current;
  const seedURL= frozenURL.current;
  const cGlyph = {early_bird:"🌅",night_owl:"🌙",alchemist:"⚗️"}[chrono]||"✦";
  const vLabel = {high:"GROUNDING",neutral:"BALANCED",deep:"DEEPENING"}[vibe]||(vibe||"").toUpperCase()||"—";

  return (
    <div style={{position:"absolute",inset:0,zIndex:20,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:`radial-gradient(ellipse at 50% 42%,rgba(245,208,106,0.22) 0%,rgba(212,175,55,0.14) 25%,rgba(9,26,17,0.82) 70%,rgba(9,26,17,0.96) 100%)`,backdropFilter:"blur(2px)",opacity:entered?1:0,transform:entered?"scale(1)":"scale(0.96)",transition:"opacity 0.4s ease,transform 0.4s ease",padding:"16px 14px"}}>
      <div style={{textAlign:"center",marginBottom:10}}>
        <div style={{fontFamily:TF.mono,fontSize:7,color:C.goldDim,letterSpacing:3,textTransform:"uppercase",marginBottom:4}}>✦ THE GOLDEN SEED ✦</div>
        <div style={{fontFamily:TF.serif,fontStyle:"italic",fontSize:15,color:C.gold,lineHeight:1.2,textShadow:`0 0 20px rgba(245,208,106,0.5)`}}>Your ritual is sealed.<br/>Scan to plant the seed.</div>
      </div>
      <div style={{position:"relative",marginBottom:12}}>
        <div style={{position:"absolute",inset:-10,borderRadius:18,background:"radial-gradient(ellipse,rgba(245,208,106,0.25) 0%,transparent 70%)",animation:"qrAura 2s ease-in-out infinite"}}/>
        <div style={{position:"absolute",inset:-4,borderRadius:16,border:`2px solid rgba(212,175,55,0.5)`,animation:"qrRingPulse 1.8s ease-in-out infinite"}}/>
        <div style={{padding:10,borderRadius:12,background:C.gold,boxShadow:`0 0 40px rgba(245,208,106,0.4)`,position:"relative",zIndex:1}}>
          <QRCanvas url={seedURL} size={170}/>
        </div>
      </div>
      <div style={{width:"100%",marginBottom:10,padding:"8px 12px",background:"rgba(0,0,0,0.45)",border:`1px solid rgba(212,175,55,0.18)`,borderRadius:10}}>
        <div style={{fontFamily:TF.mono,fontSize:6,color:C.goldDim,letterSpacing:2,textTransform:"uppercase",marginBottom:6}}>SEED PAYLOAD</div>
        {[
          {k:"vibe",  v:vLabel,                                                             col:C.neon  },
          {k:"chrono",v:`${cGlyph} ${(chrono||"").replace("_"," ").toUpperCase()||"—"}`,   col:C.indigo},
          {k:"reco",  v:reco||"—",                                                          col:C.gold  },
          {k:"sid",   v:sid||"—",                                                           col:"rgba(255,248,230,0.45)"},
        ].map(d=>(
          <div key={d.k} style={{display:"flex",gap:8,alignItems:"flex-start",marginBottom:3}}>
            <span style={{fontFamily:TF.mono,fontSize:6,color:"rgba(255,248,230,0.22)",letterSpacing:2,textTransform:"uppercase",flexBasis:46,flexShrink:0}}>{d.k}</span>
            <span style={{fontFamily:TF.mono,fontSize:8,fontWeight:700,color:d.col,letterSpacing:0.5,wordBreak:"break-all"}}>{d.v}</span>
          </div>
        ))}
      </div>
      <div style={{width:"100%",display:"flex",flexDirection:"column",gap:8}}>
        <button onClick={copy} style={{width:"100%",padding:"11px 16px",borderRadius:14,border:"none",background:`linear-gradient(135deg,${C.goldMuted},${C.gold})`,display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer",boxShadow:`0 4px 20px rgba(212,175,55,0.3)`}}>
          <span style={{fontFamily:TF.mono,fontWeight:700,fontSize:8,letterSpacing:3,textTransform:"uppercase",color:C.jade}}>{copied?"LINK COPIED ✓":"COPY SEED LINK"}</span>
          <span style={{fontSize:12,pointerEvents:"none"}}>{copied?"✓":"🔗"}</span>
        </button>
        {onClose&&<button onClick={onClose} style={{width:"100%",padding:"9px",borderRadius:12,border:`1px solid rgba(255,255,255,0.1)`,background:"transparent",color:"rgba(255,248,230,0.25)",fontFamily:TF.mono,fontSize:8,letterSpacing:2,textTransform:"uppercase",cursor:"pointer"}}>CONTINUE TO MENU →</button>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SHOW & GO REDEMPTION
// ─────────────────────────────────────────────────────────────────────────────
// A successful pour starts a 5-minute countdown overlay. The customer shows
// the screen at the bar to redeem. The overlay is persistent — it survives
// scrolling and screen changes — and can be dismissed by the customer or
// expires automatically when the timer hits zero.
//
// State lives entirely in the hook (no FSM changes needed).
// Trigger: call startShowAndGo(item) immediately after logShell succeeds.
// The interval ticks every second and cleans up on dismiss or expiry.

function useShowAndGo() {
  const [active,      setActive]      = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [redeemedItem,setRedeemedItem]= useState(null);
  const [pourCount,   setPourCount]   = useState(0); // total pours in this window
  const intervalRef = useRef(null);
  const endTimeRef  = useRef(null);

  const clear = useCallback(() => {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
    setActive(false);
    setSecondsLeft(0);
    setRedeemedItem(null);
    setPourCount(0);
  }, []);

  const startShowAndGo = useCallback((item) => {
    // Clear any existing timer before starting a new one.
    // The countdown resets to 5 minutes from NOW on each additional pour —
    // Troy gets a fresh window, not a shrinking one, so he can order a round.
    clearInterval(intervalRef.current);

    endTimeRef.current = Date.now() + SHOW_AND_GO_DURATION_MS;
    setRedeemedItem(item);                          // always shows the most recent item
    setPourCount(prev => prev + 1);                 // accumulates across pours in the window
    setSecondsLeft(Math.round(SHOW_AND_GO_DURATION_MS / 1000));
    setActive(true);

    intervalRef.current = setInterval(() => {
      const remaining = Math.max(0, Math.round((endTimeRef.current - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining <= 0) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        setActive(false);
        setRedeemedItem(null);
        setPourCount(0);
      }
    }, 1000);
  }, [clear]);

  // Clean up on unmount
  useEffect(() => () => clearInterval(intervalRef.current), []);

  return { active, secondsLeft, redeemedItem, pourCount, startShowAndGo, dismissShowAndGo: clear };
}

// ShowAndGoOverlay — persistent fixed overlay, z-index above everything.
// Renders a large countdown, the item name, and a "MARK AS REDEEMED" button.
// The ring around the timer arc shrinks in real-time using SVG strokeDashoffset.
function ShowAndGoOverlay({ active, secondsLeft, item, pourCount, onDismiss }) {
  const [entered, setEntered] = useState(false);
  const prevActive = useRef(false);

  useEffect(() => {
    if (active && !prevActive.current) {
      // Entrance animation — double rAF ensures DOM is painted first
      requestAnimationFrame(() => requestAnimationFrame(() => setEntered(true)));
    }
    if (!active) setEntered(false);
    prevActive.current = active;
  }, [active]);

  if (!active && !entered) return null;

  const totalSeconds = SHOW_AND_GO_DURATION_MS / 1000;
  const progress     = secondsLeft / totalSeconds; // 1 → 0
  const mins         = Math.floor(secondsLeft / 60);
  const secs         = secondsLeft % 60;
  const timeStr      = `${mins}:${String(secs).padStart(2, "0")}`;
  const isUrgent     = secondsLeft <= 60;
  const isMulti      = pourCount > 1; // true when more than one pour in this window

  // SVG arc for the countdown ring
  const RADIUS  = 54;
  const CIRC    = 2 * Math.PI * RADIUS;
  const dashOff = CIRC * (1 - progress);
  const ringColor = isUrgent ? C.red : C.neon;

  return (
    <div style={{
      position:   "fixed",
      inset:      0,
      zIndex:     200,
      display:    "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: `radial-gradient(ellipse at 50% 40%, rgba(9,26,17,0.97) 0%, rgba(6,15,10,0.99) 100%)`,
      backdropFilter: "blur(24px)",
      padding:    "28px 24px",
      opacity:    entered ? 1 : 0,
      transform:  entered ? "scale(1)" : "scale(0.97)",
      transition: "opacity 0.35s ease, transform 0.35s ease",
    }}>

      {/* Header — acknowledges a multi-pour round */}
      <div style={{textAlign:"center",marginBottom:28}}>
        <div style={{fontFamily:TF.mono,fontSize:7,color:C.goldDim,letterSpacing:4,textTransform:"uppercase",marginBottom:8}}>
          ✦ SHOW &amp; GO REDEMPTION
        </div>
        <div style={{fontFamily:TF.serif,fontStyle:"italic",fontSize:26,color:C.cream,lineHeight:1.15}}>
          {isMulti
            ? <>Round updated.<br/>Show this screen at the bar.</>
            : <>Show this screen<br/>at the bar.</>
          }
        </div>
      </div>

      {/* Item name badge — most recent pour, with round indicator for multi-pour */}
      {item && (
        <div style={{marginBottom:28,padding:"12px 22px",borderRadius:20,background:`rgba(222,255,154,0.06)`,border:`1px solid rgba(222,255,154,0.18)`,textAlign:"center",position:"relative"}}>
          {/* Pour count pill — only visible when more than one pour placed */}
          {isMulti && (
            <div style={{
              position:    "absolute",
              top:         -10,
              right:       -10,
              minWidth:    22,
              height:      22,
              borderRadius:11,
              background:  C.indigo,
              display:     "flex",
              alignItems:  "center",
              justifyContent:"center",
              fontFamily:  TF.mono,
              fontSize:    9,
              fontWeight:  700,
              color:       C.jade,
              padding:     "0 6px",
              boxShadow:   `0 0 10px rgba(167,139,250,0.5)`,
            }}>
              {pourCount}
            </div>
          )}
          <div style={{fontFamily:TF.mono,fontSize:7,color:C.goldDim,letterSpacing:3,textTransform:"uppercase",marginBottom:4}}>
            {isMulti ? "MOST RECENT ORDER" : "YOUR ORDER"}
          </div>
          <div style={{fontFamily:TF.serif,fontStyle:"italic",fontSize:22,color:C.neon}}>{item.name}</div>
          <div style={{fontFamily:TF.mono,fontSize:7,color:C.goldDim,letterSpacing:1,textTransform:"uppercase",marginTop:2}}>{item.origin} · ${item.price}</div>
          {isMulti && (
            <div style={{fontFamily:TF.mono,fontSize:7,color:C.indigo,letterSpacing:2,textTransform:"uppercase",marginTop:6}}>
              + {pourCount - 1} more item{pourCount - 1 > 1 ? "s" : ""} in this round
            </div>
          )}
        </div>
      )}

      {/* Countdown ring */}
      <div style={{position:"relative",width:140,height:140,marginBottom:28,display:"flex",alignItems:"center",justifyContent:"center"}}>
        <svg width="140" height="140" viewBox="0 0 140 140" style={{position:"absolute",inset:0,transform:"rotate(-90deg)",pointerEvents:"none"}}>
          {/* Track ring */}
          <circle cx="70" cy="70" r={RADIUS} fill="none"
            stroke="rgba(255,255,255,0.06)" strokeWidth="6"/>
          {/* Progress ring */}
          <circle cx="70" cy="70" r={RADIUS} fill="none"
            stroke={ringColor} strokeWidth="6"
            strokeDasharray={CIRC}
            strokeDashoffset={dashOff}
            strokeLinecap="round"
            style={{transition:"stroke-dashoffset 0.9s linear, stroke 0.5s ease"}}/>
        </svg>
        {/* Time display */}
        <div style={{textAlign:"center",position:"relative",zIndex:1}}>
          <div style={{
            fontFamily:  TF.mono,
            fontSize:    isUrgent ? 32 : 36,
            fontWeight:  700,
            color:       isUrgent ? C.red : C.neon,
            lineHeight:  1,
            letterSpacing: 1,
            transition:  "color 0.5s ease, font-size 0.2s ease",
            animation:   isUrgent ? "blink 1s steps(1) infinite" : "none",
          }}>{timeStr}</div>
          <div style={{fontFamily:TF.mono,fontSize:7,color:C.goldDim,letterSpacing:2,textTransform:"uppercase",marginTop:4}}>
            remaining
          </div>
        </div>
      </div>

      {/* Urgency message */}
      <div style={{
        fontFamily:  TF.serif,
        fontStyle:   "italic",
        fontSize:    13,
        color:       isUrgent ? "rgba(255,68,68,0.75)" : C.muted,
        textAlign:   "center",
        marginBottom:28,
        lineHeight:  1.6,
        transition:  "color 0.5s ease",
        minHeight:   42,
      }}>
        {isUrgent
          ? "Hurry — your window is closing."
          : isMulti
            ? "Your bartender will prepare your full round when you show this screen."
            : "Your bartender will prepare your pour when you show this screen."}
      </div>

      {/* Dismiss / redeem button */}
      <button onClick={onDismiss} style={{
        width:        "100%",
        maxWidth:     320,
        padding:      "16px 24px",
        borderRadius: 28,
        border:       "none",
        background:   `linear-gradient(135deg, ${C.neon}, #b8e85c)`,
        display:      "flex",
        alignItems:   "center",
        justifyContent:"space-between",
        cursor:       "pointer",
        boxShadow:    `0 8px 28px rgba(222,255,154,0.18)`,
        marginBottom: 14,
      }}>
        <span style={{fontFamily:TF.mono,fontWeight:700,fontSize:11,letterSpacing:3,textTransform:"uppercase",color:C.jade}}>
          MARK AS REDEEMED
        </span>
        <span style={{fontSize:16,pointerEvents:"none"}}>✓</span>
      </button>

      {/* Secondary dismiss */}
      <button onClick={onDismiss} style={{
        background:   "transparent",
        border:       "none",
        color:        "rgba(255,248,230,0.2)",
        fontFamily:   TF.mono,
        fontSize:     8,
        letterSpacing:2,
        textTransform:"uppercase",
        cursor:       "pointer",
        padding:      "8px",
      }}>
        DISMISS
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// KIOSK SHELL
// ─────────────────────────────────────────────────────────────────────────────

const HAPTIC_MS = 100;
const ADMIN_PIN = "8472";

function useLongPress(onFire, { ms=2500, moveThreshold=12 }={}) {
  const [holding,setHolding]=useState(false);
  const timer=useRef(null),start=useRef({x:0,y:0}),fired=useRef(false);
  const begin=useCallback(e=>{
    const t=e.touches?.[0]||e; start.current={x:t.clientX,y:t.clientY};
    fired.current=false; setHolding(true);
    timer.current=setTimeout(()=>{ fired.current=true; setHolding(false); onFire?.(); },ms);
  },[onFire,ms]);
  const cancel=useCallback(()=>{ clearTimeout(timer.current); if(!fired.current)setHolding(false); },[]);
  const move=useCallback(e=>{
    const t=e.touches?.[0]||e;
    if(Math.abs(t.clientX-start.current.x)>moveThreshold||Math.abs(t.clientY-start.current.y)>moveThreshold)cancel();
  },[cancel,moveThreshold]);
  useEffect(()=>()=>clearTimeout(timer.current),[]);
  return{holding,handlers:{onMouseDown:begin,onTouchStart:begin,onMouseUp:cancel,onMouseLeave:cancel,onTouchEnd:cancel,onTouchCancel:cancel,onMouseMove:move,onTouchMove:move,onContextMenu:e=>e.preventDefault()}};
}

function useHapticButton(onClick) {
  const [pressed,setPressed]=useState(false);
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
  const [progress,setProgress]=useState(0);
  const animRef=useRef(null),ts=useRef(null);
  const{holding,handlers}=useLongPress(onAdminOpen,{ms:HOLD,moveThreshold:10});
  useEffect(()=>{
    if(holding){
      ts.current=performance.now();
      const tick=now=>{ const e=now-ts.current; setProgress(Math.min(e/HOLD,1)); if(e<HOLD)animRef.current=requestAnimationFrame(tick); };
      animRef.current=requestAnimationFrame(tick);
    } else { cancelAnimationFrame(animRef.current); setProgress(0); }
    return()=>cancelAnimationFrame(animRef.current);
  },[holding]);
  const circ=2*Math.PI*11;
  return(
    <div id="agensi-logo" {...handlers} className={holding?"holding":""} style={{position:"relative",width:32,height:32,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{width:24,height:24,borderRadius:6,background:"rgba(212,175,55,0.08)",border:`1px solid rgba(212,175,55,${holding?0.5:0.18})`,display:"flex",alignItems:"center",justifyContent:"center",transition:"border-color 0.2s"}}>
        <span style={{fontFamily:TF.mono,fontSize:9,color:holding?C.gold:C.goldDim,fontWeight:700,lineHeight:1,transition:"color 0.2s"}}>A</span>
      </div>
      {holding&&(
        <svg style={{position:"absolute",inset:0,width:"100%",height:"100%",transform:"rotate(-90deg)",pointerEvents:"none"}} viewBox="0 0 32 32">
          <circle cx="16" cy="16" r="11" fill="none" stroke="rgba(212,175,55,0.15)" strokeWidth="2"/>
          <circle cx="16" cy="16" r="11" fill="none" stroke={C.gold} strokeWidth="2"
            strokeDasharray={circ} strokeDashoffset={circ*(1-progress)} strokeLinecap="round"/>
        </svg>
      )}
    </div>
  );
}

function AdminPanel({ onClose, onSoftReset, onFullReset, onToggleDossier, isDossierMode, inventory, dispatch, hiddenCategories }) {
  const [pin,setPin]=useState(""); const [authed,setAuthed]=useState(false);
  const [pinErr,setPinErr]=useState(false); const [cleared,setCleared]=useState(false);
  // Tabs: "controls" = existing reset/dossier buttons | "inventory" = per-item overrides
  const [tab, setTab] = useState("controls");

  const checkPin=useCallback(()=>{
    if(pin===ADMIN_PIN){setAuthed(true);setPinErr(false);}
    else{setPinErr(true);setPin("");setTimeout(()=>setPinErr(false),1200);}
  },[pin]);
  const dClose=useHapticButton(()=>onClose?.());
  const dSoft=useHapticButton(()=>{ onSoftReset?.(); });
  const dFull=useHapticButton(()=>{ setCleared(true); setTimeout(()=>{ onFullReset?.(); onClose?.(); },600); });

  // UPDATE_ITEM helpers — call the already-wired reducer case
  const setVisible = useCallback((id, visible) => {
    dispatch({ type:"UPDATE_ITEM", payload:{ id, patch:{ visible } } });
  }, [dispatch]);

  const setSoldOut = useCallback((id) => {
    dispatch({ type:"UPDATE_ITEM", payload:{ id, patch:{ estimatedShells:0 } } });
  }, [dispatch]);

  const setInStock = useCallback((id) => {
    // Restores a nominal count (99 for cocktails/food, 20 for kava/kratom)
    // so the recommendation engine treats it as available again
    const item = inventory?.find(i => i.id === id);
    const restore = (item?.category === "cocktail" || item?.category === "food") ? 99 : 20;
    dispatch({ type:"UPDATE_ITEM", payload:{ id, patch:{ estimatedShells:restore } } });
  }, [dispatch, inventory]);

  const catOrder  = ["kava","kratom","cocktail","food"];
  const catColors = { kava:C.neon, kratom:C.kratom, cocktail:C.cocktail, food:C.food };
  const catLabels = { kava:"KAVA", kratom:"KRATOM", cocktail:"COCKTAILS", food:"FOOD" };

  return(
    <div style={{position:"fixed",inset:0,zIndex:1000,background:"rgba(6,15,10,0.97)",backdropFilter:"blur(20px)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,animation:"adminReveal 0.25s ease both"}}>
      <div style={{textAlign:"center",marginBottom:20}}>
        <div style={{fontFamily:TF.mono,fontSize:8,color:C.red,letterSpacing:4,textTransform:"uppercase",marginBottom:8}}>⚠ MAINTENANCE ACCESS</div>
        <div style={{fontFamily:TF.serif,fontStyle:"italic",fontSize:26,color:C.cream,lineHeight:1.1}}>Bunker Command<br/>Interface</div>
        <div style={{fontFamily:TF.mono,fontSize:7,color:C.goldDim,letterSpacing:2,marginTop:6}}>AgensI · Bula Base v4.2.1 · {LOCATION_ID}</div>
      </div>

      {!authed ? (
        /* ── PIN PAD ── */
        <div style={{width:"100%",maxWidth:280}}>
          <div style={{fontFamily:TF.mono,fontSize:7,color:C.goldDim,letterSpacing:3,textTransform:"uppercase",textAlign:"center",marginBottom:12}}>ENTER MAINTENANCE PIN</div>
          <div style={{display:"flex",gap:10,justifyContent:"center",marginBottom:20}}>
            {[0,1,2,3].map(i=>(
              <div key={i} style={{width:44,height:54,borderRadius:10,border:`1.5px solid ${pinErr?"rgba(255,68,68,0.5)":pin.length>i?"rgba(212,175,55,0.6)":"rgba(255,255,255,0.1)"}`,background:pinErr?"rgba(255,68,68,0.05)":"rgba(0,0,0,0.3)",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.2s"}}>
                {pin.length>i&&<div style={{width:10,height:10,borderRadius:"50%",background:C.gold}}/>}
              </div>
            ))}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:10}}>
            {[1,2,3,4,5,6,7,8,9].map(d=>{
              const h=useHapticButton(()=>{ if(pin.length<4)setPin(p=>p+d); });
              return<button key={d} {...h.handlers} className={`bula-btn${h.pressed?" pressed":""}`} style={{padding:"16px 0",borderRadius:12,border:"1px solid rgba(255,255,255,0.1)",background:"rgba(255,255,255,0.04)",color:C.cream,fontFamily:TF.mono,fontSize:18,cursor:"pointer"}}>{d}</button>;
            })}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
            {[
              {lbl:"CLR",fn:()=>setPin(""),    col:"rgba(255,68,68,0.2)",   tcol:"rgba(255,100,100,0.7)"},
              {lbl:"0",  fn:()=>{ if(pin.length<4)setPin(p=>p+"0"); }, col:"rgba(255,255,255,0.1)",  tcol:C.cream, big:true},
              {lbl:"OK", fn:checkPin, col:`rgba(212,175,55,${pin.length===4?0.5:0.15})`, tcol:pin.length===4?C.gold:"rgba(255,255,255,0.2)"},
            ].map(({lbl,fn,col,tcol,big})=>{
              const h=useHapticButton(fn);
              return<button key={lbl} {...h.handlers} className={`bula-btn${h.pressed?" pressed":""}`} style={{padding:"16px 0",borderRadius:12,border:`1px solid ${col}`,background:"rgba(255,255,255,0.04)",color:tcol,fontFamily:TF.mono,fontSize:big?18:11,cursor:"pointer"}}>{lbl}</button>;
            })}
          </div>
          {pinErr&&<div style={{textAlign:"center",marginTop:12,fontFamily:TF.mono,fontSize:8,color:"rgba(255,100,100,0.7)",letterSpacing:2,textTransform:"uppercase"}}>INCORRECT PIN</div>}
          <button {...dClose.handlers} className="bula-btn" style={{width:"100%",marginTop:18,padding:"12px",borderRadius:12,border:"1px solid rgba(255,255,255,0.07)",background:"transparent",color:"rgba(255,255,255,0.2)",fontFamily:TF.mono,fontSize:8,letterSpacing:2,textTransform:"uppercase",cursor:"pointer"}}>CANCEL</button>
        </div>
      ) : cleared ? (
        /* ── CLEARED CONFIRMATION ── */
        <div style={{textAlign:"center",padding:40}}>
          <div style={{fontSize:32,marginBottom:12}}>✓</div>
          <div style={{fontFamily:TF.mono,fontSize:10,color:C.neon,letterSpacing:3,textTransform:"uppercase"}}>SYSTEM CLEARED</div>
        </div>
      ) : (
        /* ── AUTHENTICATED VIEW ── */
        <div style={{width:"100%",maxWidth:400,display:"flex",flexDirection:"column",minHeight:0}}>
          <div style={{fontFamily:TF.mono,fontSize:7,color:C.neon,letterSpacing:3,textTransform:"uppercase",textAlign:"center",marginBottom:16}}>✓ ACCESS GRANTED</div>

          {/* Tab bar */}
          <div style={{display:"flex",gap:6,marginBottom:18,padding:4,borderRadius:12,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.06)"}}>
            {[
              { id:"controls",  label:"CONTROLS"  },
              { id:"inventory", label:"INVENTORY" },
            ].map(t => (
              <button key={t.id} onClick={()=>setTab(t.id)} style={{
                flex:1, padding:"8px 0", borderRadius:9, border:"none",
                background: tab===t.id ? "rgba(222,255,154,0.1)" : "transparent",
                color:      tab===t.id ? C.neon : "rgba(255,248,230,0.3)",
                fontFamily: TF.mono, fontSize:8, letterSpacing:2,
                textTransform:"uppercase", cursor:"pointer",
                boxShadow:  tab===t.id ? `inset 0 0 0 1px rgba(222,255,154,0.2)` : "none",
                transition: "all 0.2s",
              }}>{t.label}</button>
            ))}
          </div>

          {/* ── TAB: CONTROLS ── */}
          {tab === "controls" && (
            <div>
              {[
                {lbl:"SOFT RESET",            sub:"Returns to Hero. Preserves sync.",       accent:C.neon,     h:dSoft,                              e:"↺"},
                {lbl:`DOSSIER ${isDossierMode?"ON":"OFF"}`, sub:"Toggle technical card data.", accent:C.goldMuted,h:useHapticButton(onToggleDossier), e:"📋"},
                {lbl:"FULL RESET",            sub:"Clears all state. Use between shifts.",   accent:C.amber,    h:dFull,                              e:"⚠"},
              ].map(({lbl,sub,accent,h,e})=>{
                const rgb=accent===C.neon?"222,255,154":accent===C.goldMuted?"212,175,55":"224,122,0";
                return(
                  <button key={lbl} {...h.handlers} className={`bula-btn${h.pressed?" pressed":""}`}
                    style={{width:"100%",marginBottom:10,padding:"14px 16px",borderRadius:14,border:`1px solid rgba(${rgb},0.28)`,background:`rgba(${rgb},0.06)`,display:"flex",alignItems:"flex-start",gap:12,cursor:"pointer",textAlign:"left",transition:"transform 100ms ease"}}>
                    <span style={{fontSize:16,flexShrink:0}}>{e}</span>
                    <div>
                      <div style={{fontFamily:TF.mono,fontSize:9,fontWeight:700,color:accent,letterSpacing:2,textTransform:"uppercase",marginBottom:2}}>{lbl}</div>
                      <div style={{fontFamily:TF.mono,fontSize:8,color:"rgba(255,248,230,0.3)",letterSpacing:1}}>{sub}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* ── TAB: INVENTORY MANAGER ── */}
          {tab === "inventory" && (
            <div style={{overflowY:"auto",maxHeight:"52vh",paddingRight:2}}>
              <div style={{fontFamily:TF.mono,fontSize:7,color:C.goldDim,letterSpacing:2,textTransform:"uppercase",marginBottom:12}}>
                HIDE / SHOW · MARK SOLD OUT
              </div>
              {catOrder.map(cat => {
                const items = (inventory||[]).filter(i => i.category === cat);
                if (!items.length) return null;
                const accent = catColors[cat];
                return (
                  <div key={cat} style={{marginBottom:16}}>
                    {/* Category header row — label left, hide/show whole category right */}
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8,paddingBottom:6,borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        {/* Status dot — dims when category is hidden */}
                        <div style={{width:6,height:6,borderRadius:"50%",background:(hiddenCategories||[]).includes(cat)?C.red:accent,boxShadow:(hiddenCategories||[]).includes(cat)?`0 0 5px ${C.red}`:`0 0 5px ${accent}`,transition:"background 0.2s"}}/>
                        <span style={{fontFamily:TF.mono,fontSize:7,color:(hiddenCategories||[]).includes(cat)?"rgba(255,68,68,0.6)":accent,letterSpacing:3,textTransform:"uppercase",transition:"color 0.2s"}}>
                          {catLabels[cat]}
                        </span>
                      </div>
                      {/* TOGGLE_CATEGORY — hides/shows the entire section on the menu */}
                      <button
                        onClick={() => dispatch({ type:"TOGGLE_CATEGORY", payload:cat })}
                        style={{
                          padding:      "4px 10px",
                          borderRadius: 7,
                          border:       `1px solid ${(hiddenCategories||[]).includes(cat)?"rgba(222,255,154,0.28)":"rgba(255,68,68,0.3)"}`,
                          background:   (hiddenCategories||[]).includes(cat)?"rgba(222,255,154,0.06)":"rgba(255,68,68,0.07)",
                          color:        (hiddenCategories||[]).includes(cat)?C.neon:C.red,
                          fontFamily:   TF.mono, fontSize:6,
                          letterSpacing:1, textTransform:"uppercase",
                          cursor:       "pointer", whiteSpace:"nowrap",
                        }}>
                        {(hiddenCategories||[]).includes(cat) ? "SHOW ALL" : "HIDE ALL"}
                      </button>
                    </div>
                    <div style={{display:"flex",flexDirection:"column",gap:6}}>
                      {items.map(item => {
                        const isSoldOut  = item.estimatedShells === 0;
                        const isHidden   = !item.visible;
                        const statusColor = isHidden ? C.red : isSoldOut ? C.amber : C.neon;
                        const statusLabel = isHidden ? "HIDDEN" : isSoldOut ? "SOLD OUT" : "LIVE";
                        return (
                          <div key={item.id} style={{
                            display:      "flex",
                            alignItems:   "center",
                            gap:          10,
                            padding:      "10px 12px",
                            borderRadius: 12,
                            background:   isHidden ? "rgba(255,68,68,0.05)" : isSoldOut ? "rgba(224,122,0,0.05)" : "rgba(255,255,255,0.03)",
                            border:       `1px solid ${isHidden?"rgba(255,68,68,0.18)":isSoldOut?"rgba(224,122,0,0.18)":"rgba(255,255,255,0.06)"}`,
                          }}>
                            {/* Status dot */}
                            <div style={{width:7,height:7,borderRadius:"50%",background:statusColor,flexShrink:0,boxShadow:`0 0 6px ${statusColor}`}}/>

                            {/* Name + status */}
                            <div style={{flex:1,minWidth:0}}>
                              <div style={{fontFamily:TF.serif,fontSize:13,color:isHidden?"rgba(255,248,230,0.35)":C.cream,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                                {item.name}
                              </div>
                              <div style={{fontFamily:TF.mono,fontSize:6,color:statusColor,letterSpacing:2,textTransform:"uppercase",marginTop:1}}>
                                {statusLabel}{!isHidden&&!isSoldOut&&item.estimatedShells<20?` · ${item.estimatedShells} LEFT`:""}
                              </div>
                            </div>

                            {/* Action buttons */}
                            <div style={{display:"flex",gap:5,flexShrink:0}}>
                              {/* Sold-out / back-in-stock toggle */}
                              {!isHidden && (
                                <button
                                  onClick={() => isSoldOut ? setInStock(item.id) : setSoldOut(item.id)}
                                  style={{
                                    padding:      "5px 8px",
                                    borderRadius: 8,
                                    border:       `1px solid ${isSoldOut?"rgba(222,255,154,0.25)":"rgba(224,122,0,0.3)"}`,
                                    background:   isSoldOut?"rgba(222,255,154,0.06)":"rgba(224,122,0,0.08)",
                                    color:        isSoldOut?C.neon:C.amber,
                                    fontFamily:   TF.mono, fontSize:6,
                                    letterSpacing:1, textTransform:"uppercase",
                                    cursor:       "pointer", whiteSpace:"nowrap",
                                  }}>
                                  {isSoldOut ? "RESTORE" : "SOLD OUT"}
                                </button>
                              )}

                              {/* Visible / hidden toggle */}
                              <button
                                onClick={() => setVisible(item.id, !item.visible)}
                                style={{
                                  padding:      "5px 8px",
                                  borderRadius: 8,
                                  border:       `1px solid ${isHidden?"rgba(222,255,154,0.25)":"rgba(255,68,68,0.3)"}`,
                                  background:   isHidden?"rgba(222,255,154,0.06)":"rgba(255,68,68,0.07)",
                                  color:        isHidden?C.neon:C.red,
                                  fontFamily:   TF.mono, fontSize:6,
                                  letterSpacing:1, textTransform:"uppercase",
                                  cursor:       "pointer", whiteSpace:"nowrap",
                                }}>
                                {isHidden ? "SHOW" : "HIDE"}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <button {...dClose.handlers} className="bula-btn" style={{width:"100%",marginTop:14,padding:"11px",borderRadius:12,border:"1px solid rgba(255,255,255,0.07)",background:"transparent",color:"rgba(255,255,255,0.2)",fontFamily:TF.mono,fontSize:8,letterSpacing:2,textTransform:"uppercase",cursor:"pointer",flexShrink:0}}>CLOSE PANEL</button>
        </div>
      )}
    </div>
  );
}

function KioskShell({ children, state, onSoftReset, onFullReset, onToggleDossier, dispatch }) {
  const [adminOpen,setAdminOpen]=useState(false);
  const handleSoftReset=useCallback(()=>{
    try{ localStorage.clear(); }catch(e){ console.warn("[KioskShell] localStorage:", e); }
    onSoftReset?.(); setAdminOpen(false);
  },[onSoftReset]);
  const handleFullReset=useCallback(()=>{
    try{
      localStorage.clear(); sessionStorage.clear();
      indexedDB.databases?.().then(dbs=>dbs.forEach(db=>indexedDB.deleteDatabase(db.name))).catch(()=>{});
    }catch(e){ console.warn("[KioskShell] storage:", e); }
    onFullReset?.(); setAdminOpen(false);
  },[onFullReset]);
  return(
    <>
      <style>{KIOSK_CSS}</style>
      <div className="kiosk-shell">
        <div className="kiosk-header">
          <div>
            <div style={{fontFamily:TF.mono,fontSize:8,color:C.neon,letterSpacing:4,textTransform:"uppercase"}}>BULA BASE</div>
            <div style={{fontFamily:TF.mono,fontSize:6,color:C.goldDim,letterSpacing:2,marginTop:2}}>{LOCATION_ID} · v4.2.1</div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{display:"flex",alignItems:"center",gap:5}}>
              <div style={{width:5,height:5,borderRadius:"50%",background:"rgba(222,255,154,0.4)",animation:"shellPulseIdle 3s ease-in-out infinite"}}/>
              <span style={{fontFamily:TF.mono,fontSize:6,color:"rgba(255,248,230,0.15)",letterSpacing:2,textTransform:"uppercase"}}>LIVE</span>
            </div>
            <AgensILogo onAdminOpen={()=>setAdminOpen(true)}/>
          </div>
        </div>
        <div id="bula-scroll">
          <div className="kiosk-content">{children}</div>
        </div>
      </div>
      {adminOpen&&<AdminPanel
        onClose={()=>setAdminOpen(false)}
        onSoftReset={handleSoftReset}
        onFullReset={handleFullReset}
        onToggleDossier={onToggleDossier}
        isDossierMode={state?.isDossierMode}
        inventory={state?.inventory}
        hiddenCategories={state?.hiddenCategories}
        dispatch={dispatch}
      />}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FSM
// ─────────────────────────────────────────────────────────────────────────────

const QUIZ_STATES = { FREQUENCY:"frequency", INTENTION:"intention", CHRONOTYPE:"chronotype", PALATE:"palate" };
const QUIZ_SEQUENCE = [QUIZ_STATES.FREQUENCY, QUIZ_STATES.INTENTION, QUIZ_STATES.CHRONOTYPE, QUIZ_STATES.PALATE];

const VIBE_Q = {
  [QUIZ_STATES.FREQUENCY]: {
    label:"01 / FREQUENCY", question:"Where is your nervous system right now?", accent:C.neon,
    options:[
      {id:"high",    label:"High / Anxious",  sub:"Need to come down fast",  glyph:"⚡"},
      {id:"neutral", label:"Neutral / Open",  sub:"Ready for anything",       glyph:"🌊"},
      {id:"deep",    label:"Deep / Heavy",    sub:"Already grounded",         glyph:"🪨"},
    ],
  },
  [QUIZ_STATES.INTENTION]: {
    label:"02 / INTENTION", question:"What are you here to do?", accent:C.goldMuted,
    options:[
      {id:"focus",  label:"Sharpen Focus",     sub:"Clarity over fog",    glyph:"🎯"},
      {id:"social", label:"Social Connection", sub:"Open up, open out",    glyph:"🌿"},
      {id:"reset",  label:"Total Reset",       sub:"Full system shutdown", glyph:"🌑"},
    ],
  },
  [QUIZ_STATES.CHRONOTYPE]: {
    label:"03 / CHRONOTYPE", question:"When does your spirit shine brightest?", accent:C.indigo,
    options:[
      {id:"early_bird", label:"Sunrise Seeker",    sub:"Energy for the dawn",      glyph:"🌅", potencyBias:["light","medium"]},
      {id:"night_owl",  label:"Moonlight Dweller", sub:"Strength under the stars", glyph:"🌙", potencyBias:["strong","heavy"]},
      {id:"alchemist",  label:"All-Day Alchemist", sub:"Tireless traveler",         glyph:"⚗️",potencyBias:["medium"]},
    ],
  },
  [QUIZ_STATES.PALATE]: {
    label:"04 / PALATE", question:"Which profile speaks to you?", accent:C.amber,
    options:[
      {id:"earthy",   label:"Earthy / Peppery",  sub:"Rooted, complex, bold",  glyph:"🌱"},
      {id:"fruity",   label:"Fruity / Tart",     sub:"Bright, lively, citrus", glyph:"🍋"},
      {id:"tropical", label:"Tropical / Creamy", sub:"Smooth, rich, sweet",    glyph:"🥥"},
    ],
  },
};

const BASE_INV = [
  {id:"k1", category:"kava",     name:"Fijian Noble",         origin:"Viti Levu, Fiji",           price:8,  estimatedShells:25, potency:"medium", profile:"earthy",   vibeMatch:["neutral","social"], experienceDesc:"Warm and deeply grounding. A clean social kava with a smooth finish.",batchId:"FN-2406-08",kavalactones:"5.8%",  visible:true},
  {id:"k2", category:"kava",     name:"Vanuatu Borogu",       origin:"Vanuatu Archipelago",        price:10, estimatedShells:14, potency:"strong", profile:"fruity",   vibeMatch:["high","focus"],    experienceDesc:"Bold and heady. Hits fast with cerebral elevation.",               batchId:"VB-2405-03",kavalactones:"8.1%",  visible:true},
  {id:"k3", category:"kava",     name:"Tongan Pride",         origin:"Kingdom of Tonga",           price:12, estimatedShells:10, potency:"heavy",  profile:"earthy",   vibeMatch:["deep","reset"],    experienceDesc:"Deep, musty, full-bodied. A nightcap strain.",                    batchId:"TP-2406-01",kavalactones:"10.3%", visible:true},
  {id:"kr1",category:"kratom",   name:"Red Relax",            origin:"West Kalimantan, Indonesia", price:7,  estimatedShells:30, potency:"heavy",  profile:"earthy",   vibeMatch:["deep","reset"],    experienceDesc:"Deep body relaxation. Evening use recommended.",                  batchId:"RR-2406-12",kavalactones:"Full",  visible:true},
  {id:"kr2",category:"kratom",   name:"Green Focus",          origin:"Sumatra, Indonesia",         price:7,  estimatedShells:22, potency:"medium", profile:"fruity",   vibeMatch:["focus","social"],  experienceDesc:"Clean mental clarity with moderate energy lift.",                 batchId:"GF-2406-07",kavalactones:"Full",  visible:true},
  {id:"c1", category:"cocktail", name:"Nakamal Mule",         origin:"House Recipe",               price:9,  estimatedShells:99, potency:"light",  profile:"fruity",   vibeMatch:[],                  experienceDesc:"Kava base, fresh ginger, lime, sparkling water.",                 batchId:"FRESH",     kavalactones:"~2.1%", visible:true},
  {id:"c2", category:"cocktail", name:"Jungle Bird",          origin:"House Recipe",               price:11, estimatedShells:99, potency:"medium", profile:"tropical", vibeMatch:[],                  experienceDesc:"Kava, passionfruit, coconut water, turmeric.",                    batchId:"FRESH",     kavalactones:"~4.2%", visible:true},
  {id:"f1", category:"food",     name:"Açaí Energy Bowl",    origin:"Bar Kitchen",                price:12, estimatedShells:99, potency:"light",  profile:"tropical", vibeMatch:[],                  experienceDesc:"Frozen açaí, banana, granola, hemp seeds, local honey.",          batchId:"KITCHEN",   kavalactones:"—",     visible:true},
  {id:"f2", category:"food",     name:"Turmeric Tahini Wrap",origin:"Bar Kitchen",                price:10, estimatedShells:99, potency:"light",  profile:"earthy",   vibeMatch:[],                  experienceDesc:"Roasted sweet potato, kale, turmeric tahini, hemp wrap.",         batchId:"KITCHEN",   kavalactones:"—",     visible:true},
];

function resolveRec(inventory, vibes) {
  const alive=inventory.filter(i=>i.estimatedShells>0&&i.category==="kava");
  const co=VIBE_Q[QUIZ_STATES.CHRONOTYPE].options.find(o=>o.id===vibes.chronotype);
  const pb=co?.potencyBias||[];
  return(
    alive.find(i=>i.vibeMatch?.includes(vibes.frequency)&&i.profile===vibes.palate&&pb.includes(i.potency))||
    alive.find(i=>i.profile===vibes.palate&&pb.includes(i.potency))||
    alive.find(i=>i.vibeMatch?.includes(vibes.frequency)&&pb.includes(i.potency))||
    alive.find(i=>i.profile===vibes.palate)||
    alive[0]||null
  );
}

// ── App FSM DEFAULTS — base state shape ──────────────────────────────────────
// FSM_DEFAULTS is the raw base — no user, screen: "HERO", inventory clean.
// Never reference FSM_INIT inside RESTART — it was evaluated once at load
// and may already contain a returning user's data.
const FSM_DEFAULTS = {
  screen: "HERO", 
  quizStep: QUIZ_STATES.FREQUENCY, 
  vibes: {}, 
  user: null,
  is101Open: false,
  recommendedId: null, 
  status: "IDLE", 
  inventory: BASE_INV, 
  error: null,
  lastActionId: null, 
  lastItemName: null, 
  isDossierMode: true, 
  hiddenCategories: [],
};

// ── getInitialState — returning user check ────────────────────────────────────
// Runs once on app load. Checks localStorage for a saved bula_user object.
// If found and valid: skips GATE, restores user, sets greeting globals.
// If corrupted: clears the bad key and falls back to HERO.
const getInitialState = () => {
  try {
    const stored = localStorage.getItem("bula_user");
    if (stored) {
      const bula_user = JSON.parse(stored);
      if (bula_user?.name) {
        window.BULA_RETURNING_USER     = bula_user.name;
        window.BULA_RETURNING_GREETING = true;
        return { ...FSM_DEFAULTS, screen: "HERO", user: bula_user };
      }
    }
  } catch (e) {
    console.warn("[BulaBase] Identity persistence failed or corrupted.", e);
    localStorage.removeItem("bula_user");
  }
  window.BULA_RETURNING_GREETING = false;
  return { ...FSM_DEFAULTS };
};

const FSM_INIT = getInitialState();

// v1.7.2 transaction states — DO NOT ALTER
function appReducer(s, a) {
  switch(a.type) {
    case "NAV":            return{...s,screen:a.payload};
    case "START_QUIZ":     return{...s,screen:"QUIZ",quizStep:QUIZ_STATES.FREQUENCY,vibes:{}};
    case "QUIZ_ANSWER": {
      const next={...s.vibes,[s.quizStep]:a.payload};
      const idx=QUIZ_SEQUENCE.indexOf(s.quizStep);
      // After final quiz answer, go to GATE before Sommelier
      return idx+1<QUIZ_SEQUENCE.length
        ?{...s,vibes:next,quizStep:QUIZ_SEQUENCE[idx+1]}
        :{...s,vibes:next,screen:"GATE"};
    }
    case "QUIZ_BACK": {
      const idx=QUIZ_SEQUENCE.indexOf(s.quizStep);
      return idx<=0?{...s,screen:"HERO"}:{...s,quizStep:QUIZ_SEQUENCE[idx-1]};
    }
    case "GATE_COMPLETE": {
      // Persist identity to localStorage — wrapped in try/catch because
      // Safari Private Mode throws QuotaExceededError on setItem (quota = 0).
      try {
        localStorage.setItem("bula_user", JSON.stringify({
          name:  a.payload.name,
          phone: a.payload.phone,
          email: a.payload.email ?? null,
        }));
        window.BULA_RETURNING_USER     = a.payload.name;
        window.BULA_RETURNING_GREETING = false; // first-time user — no returning greeting
      } catch (e) {
        console.warn("[BulaBase] Could not persist user — Safari Private Mode?", e);
      }
      return{...s,screen:"SOMMELIER",user:a.payload};
    }
    case "SOMMELIER_DONE": return{...s,screen:"RESULT",recommendedId:a.payload};
    case "RESULT_DONE":    return{...s,screen:"MENU"};
    case "SYNC":           return{...s,inventory:a.payload};
    case "SYNC_ERROR":     return{...s,status:"ERROR",error:"Live sync lost."};
    case "REQ_START":      return{...s,status:"PROCESSING",lastActionId:a.actionId,lastItemName:a.itemName};
    case "REQ_SUCCESS":    return{...s,status:"IDLE",error:null};
    case "REQ_FAIL":       return{...s,status:"ERROR",error:a.payload};
    case "RESET":          return{...s,status:"IDLE",error:null};
    case "TOGGLE_DOSSIER": return{...s,isDossierMode:!s.isDossierMode};
    case "TOGGLE_CATEGORY":{const h=s.hiddenCategories.includes(a.payload)?s.hiddenCategories.filter(c=>c!==a.payload):[...s.hiddenCategories,a.payload];return{...s,hiddenCategories:h};}
    case "UPDATE_ITEM":    return{...s,inventory:s.inventory.map(i=>i.id===a.payload.id?{...i,...a.payload.patch}:i)};
    case "RESTART": {
      // Full reset: wipe storage, clear globals, return to raw base state.
      // Uses FSM_DEFAULTS (not FSM_INIT) — FSM_INIT is frozen at load time
      // and may already carry returning-user data.
      try { localStorage.removeItem("bula_user"); } catch {}
      window.BULA_RETURNING_USER     = null;
      window.BULA_RETURNING_GREETING = false;
      return { ...FSM_DEFAULTS };
    }
    default: return s;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARED UI ATOMS
// ─────────────────────────────────────────────────────────────────────────────

function Glass({ children, style={} }) {
  return(
    <div style={{background:"rgba(255,255,255,0.025)",backdropFilter:"blur(16px)",WebkitBackdropFilter:"blur(16px)",borderTop:"1px solid rgba(255,255,255,0.08)",borderLeft:"1px solid rgba(255,255,255,0.08)",borderRight:"1px solid rgba(255,255,255,0.03)",borderBottom:"1px solid rgba(255,255,255,0.03)",borderRadius:20,...style}}>
      {children}
    </div>
  );
}

// BulaPulse — waveform bars animated with waveDance keyframe.
// When `overlay=true`, renders absolutely positioned over the avatar.
function BulaPulse({ active=false, overlay=false }) {
  const heights=[4,7,12,18,26,22,16,10,5,10,16,22,26,18,12,7,4];
  const wrapStyle = overlay
    ? {position:"absolute",bottom:0,left:0,right:0,display:"flex",alignItems:"flex-end",justifyContent:"center",gap:2,height:32,padding:"0 8px",background:"linear-gradient(to top, rgba(9,26,17,0.6), transparent)",borderBottomLeftRadius:50,borderBottomRightRadius:50,zIndex:5}
    : {display:"flex",alignItems:"center",gap:3,height:32};
  return(
    <div style={wrapStyle}>
      {heights.map((ht,i)=>(
        <div key={i} style={{
          width: overlay?2:3,
          height: ht,
          borderRadius: 2,
          background: `linear-gradient(to top, ${C.goldMuted}, ${C.neon})`,
          animation: active
            ? `waveDance ${0.8+(i%5)*0.14}s ease-in-out ${i*0.06}s infinite`
            : "none",
          opacity: active ? 1 : overlay ? 0 : 0.18,
          transition: "opacity 0.4s",
          flexShrink: 0,
        }}/>
      ))}
    </div>
  );
}

// WizardAvatarSVG — high-quality SVG placeholder when avatarURL is null.
// Renders a stylized robed figure with a glowing orb staff.
function WizardAvatarSVG({ glowing=false, speaking=false }) {
  const orbColor = glowing ? C.gold : speaking ? C.aether : "rgba(212,175,55,0.5)";
  const robeColor = glowing ? "rgba(245,208,106,0.18)" : "rgba(222,255,154,0.07)";
  return(
    <svg viewBox="0 0 120 148" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{width:"100%",height:"100%",filter:glowing?`drop-shadow(0 0 18px ${C.gold})`:"none",transition:"filter 0.5s"}}>
      {/* Robe body */}
      <ellipse cx="60" cy="120" rx="36" ry="22" fill={robeColor} stroke="rgba(212,175,55,0.25)" strokeWidth="1"/>
      <path d="M36 100 Q30 120 28 142 L92 142 Q90 120 84 100 Q72 110 60 110 Q48 110 36 100Z" fill="rgba(9,26,17,0.7)" stroke="rgba(212,175,55,0.2)" strokeWidth="1"/>
      {/* Robe highlight fold */}
      <path d="M52 110 Q56 130 55 142" stroke="rgba(212,175,55,0.12)" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M68 110 Q64 130 65 142" stroke="rgba(212,175,55,0.12)" strokeWidth="1.5" strokeLinecap="round"/>
      {/* Arms */}
      <path d="M36 100 Q22 108 18 118" stroke="rgba(9,26,17,0.8)" strokeWidth="14" strokeLinecap="round"/>
      <path d="M84 100 Q98 108 102 118" stroke="rgba(9,26,17,0.8)" strokeWidth="14" strokeLinecap="round"/>
      <path d="M36 100 Q22 108 18 118" stroke="rgba(212,175,55,0.15)" strokeWidth="12" strokeLinecap="round"/>
      <path d="M84 100 Q98 108 102 118" stroke="rgba(212,175,55,0.15)" strokeWidth="12" strokeLinecap="round"/>
      {/* Staff */}
      <line x1="102" y1="118" x2="108" y2="56" stroke="rgba(180,148,58,0.6)" strokeWidth="2.5" strokeLinecap="round"/>
      {/* Orb */}
      <circle cx="108" cy="52" r="9" fill={orbColor} opacity="0.9">
        {speaking&&<animate attributeName="r" values="9;11;9" dur="1.2s" repeatCount="indefinite"/>}
        {speaking&&<animate attributeName="opacity" values="0.9;1;0.9" dur="1.2s" repeatCount="indefinite"/>}
      </circle>
      <circle cx="108" cy="52" r="13" fill="none" stroke={orbColor} strokeWidth="1" opacity="0.4">
        {(speaking||glowing)&&<animate attributeName="r" values="13;17;13" dur="1.6s" repeatCount="indefinite"/>}
        {(speaking||glowing)&&<animate attributeName="opacity" values="0.4;0.1;0.4" dur="1.6s" repeatCount="indefinite"/>}
      </circle>
      {/* Neck */}
      <rect x="53" y="74" width="14" height="12" rx="4" fill="#1a1208"/>
      {/* Head */}
      <ellipse cx="60" cy="66" rx="18" ry="20" fill="#1a1208" stroke="rgba(212,175,55,0.3)" strokeWidth="1"/>
      {/* Face */}
      <ellipse cx="60" cy="65" rx="14" ry="15" fill="#221a0a"/>
      {/* Eyes */}
      <ellipse cx="54" cy="63" rx="3" ry="3.5" fill={speaking?"rgba(127,255,212,0.9)":"rgba(212,175,55,0.6)"}>
        {speaking&&<animate attributeName="fill" values="rgba(127,255,212,0.9);rgba(222,255,154,0.9);rgba(127,255,212,0.9)" dur="2s" repeatCount="indefinite"/>}
      </ellipse>
      <ellipse cx="66" cy="63" rx="3" ry="3.5" fill={speaking?"rgba(127,255,212,0.9)":"rgba(212,175,55,0.6)"}>
        {speaking&&<animate attributeName="fill" values="rgba(127,255,212,0.9);rgba(222,255,154,0.9);rgba(127,255,212,0.9)" dur="2s" repeatCount="indefinite"/>}
      </ellipse>
      {/* Pupils */}
      <circle cx="55" cy="63" r="1.5" fill="rgba(9,26,17,0.9)"/>
      <circle cx="67" cy="63" r="1.5" fill="rgba(9,26,17,0.9)"/>
      {/* Nose */}
      <path d="M59 66 Q60 70 61 66" stroke="rgba(212,175,55,0.3)" strokeWidth="1" strokeLinecap="round"/>
      {/* Mouth */}
      <path d={speaking?"M55 73 Q60 77 65 73":"M56 73 Q60 75 64 73"} stroke="rgba(212,175,55,0.45)" strokeWidth="1.5" strokeLinecap="round" fill="none">
        {speaking&&<animate attributeName="d" values="M55 73 Q60 77 65 73;M56 71 Q60 75 64 71;M55 73 Q60 77 65 73" dur="0.8s" repeatCount="indefinite"/>}
      </path>
      {/* Hood */}
      <path d="M42 66 Q38 50 48 36 Q54 26 60 24 Q66 26 72 36 Q82 50 78 66" fill="rgba(9,26,17,0.85)" stroke="rgba(212,175,55,0.2)" strokeWidth="1"/>
      <path d="M42 66 Q44 58 50 52 Q55 47 60 46 Q65 47 70 52 Q76 58 78 66" fill="#0f0b02" stroke="rgba(212,175,55,0.15)" strokeWidth="1"/>
      {/* Hood accent line */}
      <path d="M48 36 Q54 28 60 26 Q66 28 72 36" stroke="rgba(212,175,55,0.2)" strokeWidth="1" fill="none"/>
      {/* Beard */}
      <path d="M52 75 Q50 85 54 92 Q60 96 66 92 Q70 85 68 75" fill="#110d02" stroke="rgba(212,175,55,0.15)" strokeWidth="1"/>
      <path d="M55 76 Q53 84 57 90" stroke="rgba(212,175,55,0.12)" strokeWidth="1" strokeLinecap="round"/>
      <path d="M65 76 Q67 84 63 90" stroke="rgba(212,175,55,0.12)" strokeWidth="1" strokeLinecap="round"/>
      {/* Star accent on robe */}
      <text x="56" y="132" fontSize="10" fill="rgba(212,175,55,0.25)" textAnchor="middle">✦</text>
    </svg>
  );
}

// WizardVision — Avatar (SVG or video) with BulaPulse overlaid when speaking.
// glowActive drives gold aura and mounts GoldenSeedOverlay.
function WizardVision({ speaking=false, glowActive=false, lastLine=null, idleLine="", status="IDLE", vibe=null, chrono=null, reco=null, actionId=null, onSeedClose=null }) {
  const showGold   = glowActive;
  const showAether = speaking && !glowActive;
  const isError    = status==="ERROR";
  const isIdle     = !speaking && !glowActive && !isError;
  const bubbleText = lastLine||idleLine||"The Wizard awaits...";
  const bubbleColor= showGold?"rgba(245,208,106,0.9)":isError?"rgba(255,100,100,0.8)":showAether?"rgba(127,255,212,0.9)":C.muted;
  const statusLabel= showGold?"RITUAL":showAether?"CASTING":isError?"DISRUPTED":"ATTUNED";
  const statusColor= showGold?C.gold:showAether?"#7FFFD4":isError?C.red:"rgba(222,255,154,0.3)";
  const hasAvatar  = !!BULA_CONFIG.assets.avatarURL;
  const corners=[
    {top:0,left:0,   borderTop:`1.5px solid ${C.goldDim}`,borderLeft:`1.5px solid ${C.goldDim}`},
    {top:0,right:0,  borderTop:`1.5px solid ${C.goldDim}`,borderRight:`1.5px solid ${C.goldDim}`},
    {bottom:0,left:0,  borderBottom:`1.5px solid ${C.goldDim}`,borderLeft:`1.5px solid ${C.goldDim}`},
    {bottom:0,right:0, borderBottom:`1.5px solid ${C.goldDim}`,borderRight:`1.5px solid ${C.goldDim}`},
  ];
  return(
    <div style={{position:"relative",overflow:"hidden",borderRadius:20,marginBottom:20,background:"rgba(255,255,255,0.022)",backdropFilter:"blur(16px)",WebkitBackdropFilter:"blur(16px)",borderTop:"1px solid rgba(255,255,255,0.08)",borderLeft:"1px solid rgba(255,255,255,0.08)",borderRight:"1px solid rgba(255,255,255,0.03)",borderBottom:"1px solid rgba(255,255,255,0.03)"}}>
      {/* Scan-line overlay */}
      <div style={{position:"absolute",inset:0,pointerEvents:"none",zIndex:3,backgroundImage:"repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,0.08) 3px,rgba(0,0,0,0.08) 4px)"}}/>
      {/* Header bar */}
      <div style={{position:"absolute",top:0,left:0,right:0,zIndex:4,display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 14px",borderBottom:"1px solid rgba(255,255,255,0.05)",background:"rgba(0,0,0,0.15)"}}>
        <span style={{fontFamily:TF.mono,fontSize:7,color:C.goldDim,letterSpacing:2,textTransform:"uppercase"}}>WIZARD VISION / BULA BASE</span>
        <span style={{display:"inline-flex",alignItems:"center",gap:5}}>
          <span style={{width:6,height:6,borderRadius:"50%",display:"block",background:statusColor,boxShadow:(speaking||glowActive)?`0 0 8px ${statusColor}`:"none",animation:showAether?"recPulse 1.1s ease-in-out infinite":"none",transition:"background 0.4s"}}/>
          <span style={{fontFamily:TF.mono,fontSize:7,letterSpacing:2,textTransform:"uppercase",color:statusColor,transition:"color 0.4s"}}>{statusLabel}</span>
        </span>
      </div>
      {/* Avatar chamber */}
      <div style={{minHeight:glowActive?420:230,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"48px 16px 14px",position:"relative",background:`radial-gradient(ellipse at 50% 55%,${showGold?"rgba(245,208,106,0.16)":showAether?"rgba(127,255,212,0.08)":"rgba(212,175,55,0.05)"} 0%,transparent 65%),${C.jadeMid}`,transition:"min-height 0.45s ease,background 0.7s"}}>
        {/* Floor glow */}
        <div style={{position:"absolute",bottom:20,left:"50%",transform:"translateX(-50%)",width:120,height:20,borderRadius:"50%",background:`radial-gradient(ellipse,${showGold?"rgba(245,208,106,0.35)":showAether?"rgba(127,255,212,0.22)":"rgba(222,255,154,0.10)"} 0%,transparent 70%)`,filter:"blur(5px)",animation:showGold?"floorBlaze 0.7s ease-in-out infinite alternate":showAether?"floorSurge 1.2s ease-in-out infinite":"floorPulse 2.8s ease-in-out infinite",transition:"background 0.5s"}}/>
        {/* Avatar wrapper — fades behind QR on glowActive */}
        <div style={{
          opacity: glowActive ? 0.12 : 1,
          transform: glowActive ? "scale(0.82) translateY(-10px)" : "scale(1)",
          transition: "opacity 0.5s, transform 0.5s",
          animation: showGold
            ? "wizardCelebrate 0.55s ease-in-out infinite"
            : speaking
              ? "wizardFloat 3s ease-in-out infinite"
              : "wizardBreathe 4s ease-in-out infinite",
          transformOrigin: "center bottom",
          position: "relative",
          width: 120,
          height: 148,
        }}>
          {hasAvatar ? (
            <video src={BULA_CONFIG.assets.avatarURL} autoPlay loop muted playsInline
              style={{width:120,height:148,objectFit:"cover",borderRadius:12,border:`1px solid ${showGold?"rgba(245,208,106,0.4)":speaking?"rgba(127,255,212,0.4)":"rgba(212,175,55,0.15)"}`}}/>
          ) : (
            <WizardAvatarSVG glowing={showGold} speaking={speaking}/>
          )}
          {/* BulaPulse overlaid on avatar bottom */}
          <BulaPulse active={speaking && !glowActive} overlay={true}/>
        </div>
        {/* Golden Seed QR overlay */}
        <GoldenSeedOverlay glowActive={glowActive} vibe={vibe} chrono={chrono} reco={reco} actionId={actionId} onClose={onSeedClose}/>
      </div>
      {/* Speech bubble */}
      <div style={{borderTop:"1px solid rgba(255,255,255,0.05)",padding:"11px 16px",background:"rgba(0,0,0,0.22)",minHeight:48,position:"relative",zIndex:4,transition:"all 0.35s"}}>
        <span style={{fontFamily:!isIdle?TF.mono:TF.serif,fontStyle:isIdle?"italic":"normal",fontSize:!isIdle?9:12,color:bubbleColor,lineHeight:1.75,letterSpacing:!isIdle?1.5:0,wordBreak:"break-word",textShadow:showGold?`0 0 16px rgba(245,208,106,0.5)`:showAether?`0 0 10px rgba(127,255,212,0.4)`:"none",transition:"all 0.35s"}}>
          {showGold?"The ritual is sealed. Scan the Golden Seed to claim your place in the tribe.":bubbleText}
        </span>
        {isIdle&&<span style={{display:"inline-block",width:1,height:"0.85em",background:C.goldMuted,marginLeft:2,verticalAlign:"text-bottom",animation:"blink 0.9s steps(1) infinite"}}/>}
      </div>
      {corners.map((cs,i)=><div key={i} style={{position:"absolute",zIndex:5,width:12,height:12,...cs}}/>)}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SCREENS
// ─────────────────────────────────────────────────────────────────────────────

// ScreenAgeGate — first screen every customer sees.
// Requires explicit confirmation before entering the app.
// Uses AGE_GATE_TEXT from CURRENT_BAR_CONFIG — never hardcoded.
function ScreenAgeGate({ dispatch }) {
  const h = useHapticButton(() => dispatch({ type:"NAV", payload:"HERO" }));
  return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"32px 24px",textAlign:"center",animation:"screenIn 0.4s ease both"}}>
      {/* Logo mark */}
      <div style={{width:72,height:72,borderRadius:"50%",background:`radial-gradient(circle at 40% 35%, ${C.jadeEdge}, ${C.jade})`,border:`1px solid rgba(212,175,55,0.25)`,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:28,boxShadow:`0 0 40px rgba(212,175,55,0.1)`}}>
        <span style={{fontSize:28}}>🌿</span>
      </div>

      {/* Bar name */}
      <div style={{fontFamily:TF.mono,fontSize:7,color:C.goldDim,letterSpacing:4,textTransform:"uppercase",marginBottom:12}}>
        {CURRENT_BAR_CONFIG.name} · Powered by Bula Base
      </div>

      {/* Age gate heading */}
      <h1 style={{fontFamily:TF.serif,fontStyle:"italic",fontSize:32,fontWeight:400,color:C.cream,lineHeight:1.1,marginBottom:20}}>
        You must be 18+<br/>to enter.
      </h1>

      {/* Full legal text */}
      <p style={{fontFamily:TF.mono,fontSize:8,color:"rgba(255,248,230,0.3)",lineHeight:1.85,marginBottom:32,maxWidth:380}}>
        {CURRENT_BAR_CONFIG.ageGateText}
      </p>

      {/* Confirm button */}
      <div role="button" {...h.handlers} className={`bula-btn${h.pressed?" pressed":""}`}
        style={{width:"100%",maxWidth:320,padding:"18px 24px",borderRadius:30,border:"none",background:`linear-gradient(135deg,${C.neon},#b8e85c)`,display:"flex",alignItems:"center",justifyContent:"space-between",boxShadow:`0 8px 32px rgba(222,255,154,0.18)`,cursor:"pointer",marginBottom:16}}>
        <span style={{fontFamily:TF.mono,fontWeight:700,fontSize:11,letterSpacing:3,textTransform:"uppercase",color:C.jade}}>
          I AM 18 OR OLDER — ENTER
        </span>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M4 9h10M10 5l4 4-4 4" stroke={C.jade} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </div>

      {/* Under-age exit */}
      <button onClick={() => window.location.href = "https://shantikava.com"}
        style={{background:"transparent",border:"none",color:"rgba(255,248,230,0.18)",fontFamily:TF.mono,fontSize:8,letterSpacing:2,textTransform:"uppercase",cursor:"pointer",padding:"8px"}}>
        I AM UNDER 18 — EXIT
      </button>

      {/* Botanical disclaimer */}
      <div style={{marginTop:32,padding:"12px 16px",borderRadius:14,background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.05)",maxWidth:380}}>
        <div style={{fontFamily:TF.mono,fontSize:6,color:C.goldDim,letterSpacing:2,textTransform:"uppercase",marginBottom:6}}>HEALTH DISCLAIMER</div>
        <p style={{fontFamily:TF.mono,fontSize:7,color:"rgba(255,248,230,0.2)",lineHeight:1.8}}>
          {CURRENT_BAR_CONFIG.disclaimer}
        </p>
      </div>
    </div>
  );
}


// iOS audio unlock fires on first touchstart anywhere on this screen.
function ScreenHero({ dispatch, audioUnlocked }) {
  const handleUnlockTouch = useCallback(() => {
    if (audioUnlocked?.current) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const buf = ctx.createBuffer(1, 1, 22050);
      const src = ctx.createBufferSource();
      src.buffer = buf; src.connect(ctx.destination); src.start(0); ctx.close();
      if (audioUnlocked) audioUnlocked.current = true;
    } catch {}
    // Also prime Web Speech synthesis — clears Chrome autoplay block and
    // forces the browser to route audio before Gideon's first line queues.
    warmupSpeech();
    if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.getVoices();
  }, [audioUnlocked]);

  const h = useHapticButton(() => dispatch({ type:"START_QUIZ" }));

  return(
    <div onTouchStart={handleUnlockTouch} style={{animation:"heroIn 0.6s ease both",minHeight:"80vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",textAlign:"center",padding:"20px 0"}}>
      {/* Ambient orb */}
      <div style={{position:"relative",marginBottom:32}}>
        <div style={{width:140,height:140,borderRadius:"50%",background:`radial-gradient(circle at 40% 35%, rgba(245,208,106,0.25), rgba(9,26,17,0.8))`,border:`1px solid rgba(212,175,55,0.25)`,display:"flex",alignItems:"center",justifyContent:"center",animation:"heroOrb 4s ease-in-out infinite",boxShadow:`0 0 60px rgba(212,175,55,0.15), 0 0 120px rgba(212,175,55,0.06)`}}>
          <div style={{width:88,height:108,position:"relative"}}>
            <WizardAvatarSVG glowing={false} speaking={false}/>
          </div>
        </div>
        {/* Outer ring */}
        <div style={{position:"absolute",inset:-12,borderRadius:"50%",border:`1px solid rgba(212,175,55,0.12)`,animation:"haloExpand 3s ease-out infinite"}}/>
        <div style={{position:"absolute",inset:-24,borderRadius:"50%",border:`1px solid rgba(212,175,55,0.06)`,animation:"haloExpand 3s ease-out 1s infinite"}}/>
      </div>

      {/* Headline */}
      <div style={{fontFamily:TF.mono,fontSize:7,color:C.goldDim,letterSpacing:4,textTransform:"uppercase",marginBottom:12}}>
        AgensI × BULA BASE · {LOCATION_ID}
      </div>
      <h1 style={{fontFamily:TF.serif,fontStyle:"italic",fontSize:38,fontWeight:400,color:C.cream,lineHeight:1.08,marginBottom:8,letterSpacing:"-0.3px"}}>
        The Wizard<br/>awaits your<br/>reading.
      </h1>
      <p style={{fontFamily:TF.serif,fontStyle:"italic",fontSize:14,color:C.muted,lineHeight:1.7,marginBottom:40,maxWidth:280}}>
        Answer four questions. The roots reveal your pour.
      </p>

      {/* Main CTA */}
      <div role="button" {...h.handlers} className={`bula-btn${h.pressed?" pressed":""}`}
        style={{width:"100%",maxWidth:320,padding:"20px 28px",borderRadius:36,border:"none",background:`linear-gradient(135deg, ${C.neon}, #b8e85c)`,display:"flex",alignItems:"center",justifyContent:"space-between",boxShadow:`0 12px 40px rgba(222,255,154,0.22), 0 4px 16px rgba(222,255,154,0.12)`,cursor:"pointer",marginBottom:16}}>
        <span style={{fontFamily:TF.mono,fontWeight:700,fontSize:12,letterSpacing:3,textTransform:"uppercase",color:C.jade}}>
          FIND YOUR PERFECT POUR
        </span>
        <span style={{fontSize:18,pointerEvents:"none"}}>🌿</span>
      </div>
      <div style={{fontFamily:TF.mono,fontSize:7,color:"rgba(255,248,230,0.18)",letterSpacing:2,textTransform:"uppercase"}}>
        Takes 60 seconds · Free reading
      </div>
    </div>
  );
}

// ScreenQuiz — four vibe questions
function ScreenQuiz({ quizStep, vibes, dispatch }) {
  const [chosen,setChosen]=useState(null);
  const stepIdx=QUIZ_SEQUENCE.indexOf(quizStep);
  const q=VIBE_Q[quizStep], accent=q.accent;
  useEffect(()=>setChosen(null),[quizStep]);
  const pick=id=>{ if(chosen)return; setChosen(id); setTimeout(()=>dispatch({type:"QUIZ_ANSWER",payload:id}),380); };
  const aRGB=accent===C.neon?"222,255,154":accent===C.goldMuted?"212,175,55":accent===C.indigo?"167,139,250":"224,122,0";
  return(
    <div style={{animation:"screenIn 0.4s ease both"}}>
      {/* Progress */}
      <div style={{display:"flex",gap:6,marginBottom:24}}>
        {QUIZ_SEQUENCE.map((_,i)=>(
          <div key={i} style={{flex:1,height:2,borderRadius:1,background:i<stepIdx?C.goldMuted:i===stepIdx?accent:"rgba(255,255,255,0.07)",transition:"background 0.35s",boxShadow:i===stepIdx?`0 0 8px ${accent}60`:"none"}}/>
        ))}
      </div>
      <div style={{fontFamily:TF.mono,fontSize:8,letterSpacing:3,textTransform:"uppercase",marginBottom:10,color:`rgba(${aRGB},0.7)`}}>{q.label}</div>
      {quizStep===QUIZ_STATES.CHRONOTYPE&&(
        <div style={{marginBottom:16,padding:"10px 14px",borderRadius:14,background:"rgba(167,139,250,0.05)",border:"1px solid rgba(167,139,250,0.12)"}}>
          <p style={{fontFamily:TF.serif,fontStyle:"italic",fontSize:10,color:"rgba(167,139,250,0.7)",lineHeight:1.65}}>
            Your chronotype shapes the pour. The Wizard reads your rhythm to align the strain with your body's natural cycle.
          </p>
        </div>
      )}
      <h2 style={{fontFamily:TF.serif,fontStyle:"italic",fontSize:27,fontWeight:400,color:C.cream,lineHeight:1.2,marginBottom:24}}>{q.question}</h2>
      <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:22}}>
        {q.options.map((opt,i)=>{
          const sel=chosen===opt.id;
          return(
            <button key={opt.id} onClick={()=>pick(opt.id)}
              style={{background:sel?`rgba(${aRGB},0.09)`:"rgba(255,255,255,0.022)",backdropFilter:"blur(16px)",borderTop:`1px solid ${sel?`rgba(${aRGB},0.35)`:"rgba(255,255,255,0.07)"}`,borderLeft:`1px solid ${sel?`rgba(${aRGB},0.35)`:"rgba(255,255,255,0.07)"}`,borderRight:`1px solid ${sel?`rgba(${aRGB},0.12)`:"rgba(255,255,255,0.03)"}`,borderBottom:`1px solid ${sel?`rgba(${aRGB},0.12)`:"rgba(255,255,255,0.03)"}`,borderRadius:18,padding:"16px 18px",display:"flex",alignItems:"center",gap:16,cursor:"pointer",textAlign:"left",transform:sel?"scale(0.98)":"scale(1)",transition:"all 0.2s",animation:`quizOptIn 0.35s ${i*0.07}s ease both`,boxShadow:sel?`0 0 20px rgba(${aRGB},0.1)`:"none"}}>
              <span style={{fontSize:22,flexShrink:0}}>{opt.glyph}</span>
              <div style={{flex:1}}>
                <div style={{fontFamily:TF.serif,fontSize:16,color:C.cream,marginBottom:2}}>{opt.label}</div>
                <div style={{fontFamily:TF.mono,fontSize:8,color:C.goldDim,letterSpacing:1}}>{opt.sub}</div>
              </div>
              {sel&&<svg style={{flexShrink:0}} width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8l3.5 3.5 6.5-6" stroke={accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
            </button>
          );
        })}
      </div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <button onClick={()=>dispatch({type:"QUIZ_BACK"})} style={{background:"transparent",border:"none",color:"rgba(255,248,230,0.2)",fontFamily:TF.mono,fontSize:8,letterSpacing:2,textTransform:"uppercase",cursor:"pointer",padding:0}}>← BACK</button>
        <p style={{fontFamily:TF.mono,fontSize:7,color:"rgba(255,248,230,0.1)",letterSpacing:2,textTransform:"uppercase"}}>
          {QUIZ_SEQUENCE.length-stepIdx-1>0?`${QUIZ_SEQUENCE.length-stepIdx-1} remaining`:"FINAL QUESTION"}
        </p>
      </div>
    </div>
  );
}

// ScreenGate — Identity Gate (The Toll)
// Moved after final quiz answer, before SommelierReveal.
// Mandatory: name, valid 10-digit phone, email with '@', opt-in checkbox.
// Header: "Identity required to unlock your recommendation."
// Submit: "DESCRIBE YOUR VIBE!"
function ScreenGate({ dispatch }) {
  const [name,     setName]     = useState("");
  const [phone,    setPhone]    = useState("");
  const [email,    setEmail]    = useState("");
  const [optIn,    setOptIn]    = useState(false);
  const [focus,    setFocus]    = useState(null);
  const [submitting,setSubmitting]=useState(false);
  const [err,      setErr]      = useState(null);

  const fmtPhone = v => {
    const d=v.replace(/\D/g,"").slice(0,10);
    if(d.length<=3)return d;
    if(d.length<=6)return`(${d.slice(0,3)}) ${d.slice(3)}`;
    return`(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}`;
  };

  const phoneDigits = phone.replace(/\D/g,"");
  const emailValid  = email.includes("@") && email.length > 3;
  // Hard validation: all three fields + opt-in required
  const valid = name.trim().length>0 && phoneDigits.length===10 && emailValid && optIn;

  const submit = async () => {
    if (!valid || submitting) return;
    setSubmitting(true); setErr(null);

    // ── Information Wall webhook ────────────────────────────────────────────
    // Posts lead data to Zapier / Make on every new gate submission.
    // Non-blocking failure: if the webhook is down or WEBHOOK_URL is not yet
    // set, the user still advances to the Sommelier — we never block a customer
    // at the gate because of a CRM outage.
    if (WEBHOOK_URL && WEBHOOK_URL !== "YOUR_WEBHOOK_URL_HERE") {
      try {
        await fetch(WEBHOOK_URL, {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name:       name.trim(),
            phone:      phone,
            email:      email,
            optIn:      optIn,
            locationId: LOCATION_ID,
            timestamp:  new Date().toISOString(),
            source:     "bula_base_gate",
          }),
        });
      } catch (webhookErr) {
        // Non-fatal — log but do not block or show error to customer
        console.warn("[BulaBase] Webhook post failed:", webhookErr?.message ?? webhookErr);
      }
    }

    dispatch({ type:"GATE_COMPLETE", payload:{ name:name.trim(), phone, email, optIn } });
  };

  const inpStyle = f => ({
    width:"100%",
    background:focus===f?"rgba(222,255,154,0.04)":"rgba(255,255,255,0.03)",
    border:`1px solid ${focus===f?"rgba(222,255,154,0.32)":"rgba(255,255,255,0.07)"}`,
    borderRadius:14, padding:"15px 18px", color:C.cream, fontSize:15,
    outline:"none", fontFamily:f==="phone"||f==="email"?TF.mono:TF.serif,
    transition:"border-color 0.2s",
  });

  return(
    <div style={{animation:"screenIn 0.4s ease both"}}>
      {/* Gate framing */}
      <div style={{marginBottom:28,padding:"18px 20px",borderRadius:20,background:"rgba(245,208,106,0.04)",border:`1px solid rgba(212,175,55,0.18)`}}>
        <div style={{fontFamily:TF.mono,fontSize:7,color:C.goldDim,letterSpacing:3,textTransform:"uppercase",marginBottom:8}}>✦ ONE LAST STEP</div>
        <h1 style={{fontFamily:TF.serif,fontStyle:"italic",fontSize:24,fontWeight:400,color:C.cream,lineHeight:1.2,margin:0}}>
          Identity required to unlock<br/>your recommendation.
        </h1>
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:18}}>
        <input
          style={inpStyle("name")} type="text" value={name} placeholder="Full Name"
          onChange={e=>setName(e.target.value)}
          onFocus={()=>setFocus("name")} onBlur={()=>setFocus(null)}
        />
        <input
          style={inpStyle("phone")} type="tel" inputMode="numeric" value={phone}
          placeholder="(555) 000-0000"
          onChange={e=>setPhone(fmtPhone(e.target.value))}
          onFocus={()=>setFocus("phone")} onBlur={()=>setFocus(null)}
        />
        <input
          style={inpStyle("email")} type="email" inputMode="email" value={email}
          placeholder="your@email.com"
          onChange={e=>setEmail(e.target.value)}
          onFocus={()=>setFocus("email")} onBlur={()=>setFocus(null)}
        />

        {/* SMS + Email opt-in — TCPA compliant, checkbox required for submission */}
        <label style={{display:"flex",alignItems:"flex-start",gap:12,cursor:"pointer",padding:"12px 14px",borderRadius:14,background:optIn?"rgba(222,255,154,0.03)":"rgba(255,255,255,0.02)",border:`1px solid ${optIn?"rgba(222,255,154,0.18)":"rgba(255,255,255,0.06)"}`,transition:"all 0.2s"}} onClick={()=>setOptIn(!optIn)}>
          <div style={{width:20,height:20,borderRadius:6,flexShrink:0,marginTop:1,display:"flex",alignItems:"center",justifyContent:"center",background:optIn?C.neon:"transparent",border:`1.5px solid ${optIn?C.neon:"rgba(222,255,154,0.25)"}`,transition:"all 0.15s"}}>
            {optIn&&<svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M2 5.5l2.5 2.5 4.5-4.5" stroke={C.jade} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
          </div>
          <span style={{fontSize:9,color:"rgba(255,248,230,0.25)",lineHeight:1.75,fontFamily:TF.mono}}>
            {SMS_CONSENT_TEXT}
          </span>
        </label>

        {!optIn&&(name.trim().length>0||phoneDigits.length>0||email.length>0)&&(
          <div style={{fontFamily:TF.mono,fontSize:8,color:"rgba(212,175,55,0.6)",letterSpacing:1,textAlign:"center"}}>
            ↑ Accept the terms above to unlock your reading
          </div>
        )}

        {err&&(
          <div style={{padding:"10px 14px",borderRadius:12,background:"rgba(255,68,68,0.07)",border:"1px solid rgba(255,68,68,0.2)",fontFamily:TF.mono,fontSize:8,color:"rgba(255,120,120,0.8)",letterSpacing:1}}>{err}</div>
        )}
      </div>

      <button
        onClick={submit} disabled={!valid||submitting}
        style={{width:"100%",padding:"18px 24px",borderRadius:30,border:"none",background:valid?`linear-gradient(135deg, ${C.neon}, #b8e85c)`:"rgba(255,255,255,0.04)",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:valid?"pointer":"not-allowed",opacity:submitting?0.7:1,transition:"all 0.3s",boxShadow:valid?`0 8px 32px rgba(222,255,154,0.18)`:"none"}}>
        <span style={{fontFamily:TF.mono,fontWeight:700,fontSize:11,letterSpacing:3,textTransform:"uppercase",color:valid?C.jade:"rgba(255,255,255,0.2)"}}>
          {submitting ? "SYNCING..." : "DESCRIBE YOUR VIBE!"}
        </span>
        {submitting
          ? <div style={{width:16,height:16,border:`2px solid ${C.jade}40`,borderTopColor:C.jade,borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
          : <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M4 9h10M10 5l4 4-4 4" stroke={valid?C.jade:"rgba(255,255,255,0.2)"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        }
      </button>
    </div>
  );
}

// ScreenSommelier — typewriter reveal + hasTransitioned double-fire guard
function ScreenSommelier({ dispatch, inventory, vibes }) {
  const rec       = resolveRec(inventory, vibes);
  const chronoOpt = VIBE_Q[QUIZ_STATES.CHRONOTYPE].options.find(o=>o.id===vibes.chronotype);
  const script    = rec
    ? `${chronoOpt?.id==="early_bird"?"The dawn called.":chronoOpt?.id==="night_owl"?"Under the moon.":"The tireless path."} I'm reading ${rec.name} from ${rec.origin} — a ${rec.potency} pour. ${vibes.intention==="reset"?"Let go.":vibes.intention==="focus"?"Clarity incoming.":"The room is yours."}`
    : "The bar is between batches. Your tender will guide you.";

  const [displayed,setDisplayed]=useState("");
  const [done,setDone]=useState(false);
  const hasTransitioned=useRef(false);

  useEffect(()=>{
    let i=0; setDisplayed(""); setDone(false); hasTransitioned.current=false;
    const id=setInterval(()=>{ i++; setDisplayed(script.slice(0,i)); if(i>=script.length){clearInterval(id);setDone(true);} },26);
    return()=>clearInterval(id);
  },[script]);

  useEffect(()=>{
    if(!done)return;
    const id=setTimeout(()=>{
      if(hasTransitioned.current)return;
      hasTransitioned.current=true;
      dispatch({type:"SOMMELIER_DONE",payload:rec?.id||null});
    },2200);
    return()=>clearTimeout(id);
  },[done,rec,dispatch]);

  const skip=()=>{
    if(hasTransitioned.current)return;
    hasTransitioned.current=true;
    dispatch({type:"SOMMELIER_DONE",payload:rec?.id||null});
  };

  return(
    <div style={{animation:"screenIn 0.4s ease both"}}>
      <div style={{marginBottom:20}}>
        <div style={{fontFamily:TF.mono,fontSize:8,color:C.neon,letterSpacing:4,textTransform:"uppercase"}}>BULA BASE / {LOCATION_ID}</div>
        <div style={{fontFamily:TF.mono,fontSize:7,color:C.goldDim,letterSpacing:2,marginTop:3}}>THE WIZARD SPEAKS</div>
      </div>
      <Glass style={{position:"relative",overflow:"hidden",borderRadius:18,marginBottom:16}}>
        <div style={{position:"absolute",inset:0,pointerEvents:"none",zIndex:3,backgroundImage:"repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,0.08) 3px,rgba(0,0,0,0.08) 4px)"}}/>
        <div style={{minHeight:160,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"40px 20px 14px",background:`radial-gradient(ellipse at 50% 30%,rgba(212,175,55,0.06) 0%,transparent 65%),${C.jadeMid}`,position:"relative"}}>
          <div style={{width:88,height:108,marginBottom:12,position:"relative"}}>
            <WizardAvatarSVG glowing={done} speaking={!done}/>
            {!done&&<BulaPulse active={true} overlay={true}/>}
          </div>
        </div>
        <div style={{borderTop:"1px solid rgba(255,255,255,0.05)",padding:"12px 16px",background:"rgba(0,0,0,0.2)",minHeight:56,fontFamily:TF.serif,fontStyle:"italic",fontSize:12,color:C.muted,lineHeight:1.75}}>
          {displayed}
          {!done&&<span style={{display:"inline-block",width:1,height:"0.85em",background:C.goldMuted,marginLeft:2,verticalAlign:"text-bottom",animation:"blink 0.9s steps(1) infinite"}}/>}
        </div>
      </Glass>
      {rec&&(
        <Glass style={{padding:"18px 20px",marginBottom:14,opacity:done?1:0.45,transition:"opacity 0.6s"}}>
          <div style={{fontFamily:TF.mono,fontSize:7,color:C.goldDim,letterSpacing:3,textTransform:"uppercase",marginBottom:6}}>✦ YOUR RECOMMENDATION</div>
          <div style={{fontFamily:TF.serif,fontStyle:"italic",fontSize:24,color:C.cream,marginBottom:2}}>{rec.name}</div>
          <div style={{fontFamily:TF.mono,fontSize:7,color:C.goldDim,letterSpacing:2,textTransform:"uppercase",marginBottom:chronoOpt?12:0}}>{rec.origin}</div>
          {chronoOpt&&<span style={{fontFamily:TF.mono,fontSize:7,letterSpacing:2,color:C.indigo,background:"rgba(167,139,250,0.08)",border:"1px solid rgba(167,139,250,0.22)",borderRadius:4,padding:"3px 8px"}}>{chronoOpt.glyph} {chronoOpt.label.toUpperCase()} MATCH</span>}
        </Glass>
      )}
      {done&&(
        <button onClick={skip} style={{background:"transparent",border:`1px solid rgba(222,255,154,0.18)`,borderRadius:30,padding:"14px 24px",color:C.neon,fontFamily:TF.mono,fontSize:9,letterSpacing:3,textTransform:"uppercase",cursor:"pointer",textAlign:"center",width:"100%",animation:"screenIn 0.4s ease both"}}>
          VIEW THE FULL MENU →
        </button>
      )}
    </div>
  );
}

// ScreenResult — hasTransitioned ref prevents RESULT_DONE double-fire
// between: onSuccessReady (glow timer), onSeedClose (user tap), manual skip
function ScreenResult({ state, speaking, glowActive, lastLine, idleLine, dispatch }) {
  const rec       = state.inventory.find(i=>i.id===state.recommendedId);
  const chronoOpt = VIBE_Q[QUIZ_STATES.CHRONOTYPE].options.find(o=>o.id===state.vibes?.chronotype);
  const hasTransitioned = useRef(false);

  const advance = useCallback(() => {
    if (hasTransitioned.current) return;
    hasTransitioned.current = true;
    dispatch({ type:"RESULT_DONE" });
  }, [dispatch]);

  return(
    <div style={{animation:"screenIn 0.5s ease both"}}>
      <div style={{marginBottom:20}}>
        <div style={{fontFamily:TF.mono,fontSize:8,color:C.neon,letterSpacing:4,textTransform:"uppercase"}}>BULA BASE / {LOCATION_ID}</div>
        <div style={{fontFamily:TF.mono,fontSize:7,color:C.goldDim,letterSpacing:2,marginTop:3}}>RITUAL COMPLETE / GOLDEN SEED READY</div>
      </div>
      <WizardVision
        speaking={speaking} glowActive={glowActive} status={state.status}
        lastLine={lastLine} idleLine={idleLine}
        vibe={state.vibes?.frequency} chrono={state.vibes?.chronotype}
        reco={state.recommendedId} actionId={state.lastActionId}
        onSeedClose={advance}
      />
      {rec&&(
        <div style={{padding:"16px 18px",borderRadius:18,background:"rgba(255,255,255,0.025)",backdropFilter:"blur(16px)",border:`1px solid rgba(222,255,154,0.14)`,marginBottom:16,animation:"cardIn 0.4s ease both"}}>
          <div style={{fontFamily:TF.mono,fontSize:7,color:C.goldDim,letterSpacing:3,textTransform:"uppercase",marginBottom:6}}>✦ YOUR POUR</div>
          <div style={{fontFamily:TF.serif,fontStyle:"italic",fontSize:22,color:C.cream,marginBottom:2}}>{rec.name}</div>
          <div style={{fontFamily:TF.mono,fontSize:7,color:C.goldDim,letterSpacing:2,textTransform:"uppercase",marginBottom:chronoOpt?10:0}}>{rec.origin}</div>
          {chronoOpt&&<span style={{fontFamily:TF.mono,fontSize:7,letterSpacing:2,color:C.indigo,background:"rgba(167,139,250,0.08)",border:"1px solid rgba(167,139,250,0.22)",borderRadius:4,padding:"3px 8px"}}>{chronoOpt.glyph} {chronoOpt.label.toUpperCase()} MATCH</span>}
        </div>
      )}
      {!glowActive&&(
        <button onClick={advance}
          style={{width:"100%",padding:"16px 24px",borderRadius:28,border:"none",background:`linear-gradient(135deg,${C.neon},#b8e85c)`,display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer",boxShadow:`0 8px 28px rgba(222,255,154,0.18)`,animation:"screenIn 0.4s ease both"}}>
          <span style={{fontFamily:TF.mono,fontWeight:700,fontSize:11,letterSpacing:3,textTransform:"uppercase",color:C.jade}}>VIEW TONIGHT'S MENU</span>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M4 9h10M10 5l4 4-4 4" stroke={C.jade} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DOSSIER CARD — Digital Dossier expandable inventory card
// ─────────────────────────────────────────────────────────────────────────────
// Collapsed state: name, origin, price, potency badge, batchId, pour button.
// Expanded state: all of the above + full technical panel:
//   alkaloidPpm, kavalactones, mitPercent, sevenOhPercent, moodScore bar,
//   experienceDesc, COA link, ingredient list (cocktails), shells remaining.
// isDossierMode (global toggle): when OFF the expand chevron is hidden and
//   the technical panel never renders — cards stay compact for busy service.
// Each card manages its own open/closed state independently.

function DossierCard({ item, isRec, isPouring, isDossierMode, accent, aRGB, onPour, status }) {
  const [open, setOpen] = useState(false);

  // Auto-open the Wizard's Pick card when dossier mode is on
  useEffect(() => {
    if (isRec && isDossierMode) setOpen(true);
  }, [isRec, isDossierMode]);

  const isKava    = item.category === "kava";
  const isKratom  = item.category === "kratom";
  const isCocktail= item.category === "cocktail";
  const hasDetails= isDossierMode && (item.alkaloidPpm || item.kavalactones || item.moodScore);

  // Mood score bar — 0-100 scale, colour-coded by potency
  const moodPct   = Math.min(100, Math.max(0, item.moodScore ?? 0));
  const moodColor = moodPct >= 75 ? C.indigo : moodPct >= 45 ? C.neon : C.goldMuted;

  return (
    <div style={{
      borderRadius: 18,
      background:   isRec ? `rgba(${aRGB},0.07)` : "rgba(255,255,255,0.022)",
      backdropFilter: "blur(12px)",
      borderTop:    `1px solid ${isRec ? `rgba(${aRGB},0.35)` : "rgba(255,255,255,0.07)"}`,
      borderLeft:   `1px solid ${isRec ? `rgba(${aRGB},0.35)` : "rgba(255,255,255,0.07)"}`,
      borderRight:  `1px solid ${isRec ? `rgba(${aRGB},0.12)` : "rgba(255,255,255,0.03)"}`,
      borderBottom: `1px solid ${isRec ? `rgba(${aRGB},0.12)` : "rgba(255,255,255,0.03)"}`,
      overflow:     "hidden",
      position:     "relative",
      animation:    "cardIn 0.35s ease both",
      transition:   "box-shadow 0.3s ease",
      boxShadow:    open ? `0 8px 32px rgba(${aRGB},0.08)` : "none",
    }}>

      {/* Wizard's Pick badge */}
      {isRec && (
        <div style={{position:"absolute",top:0,right:0,padding:"4px 10px",background:`rgba(${aRGB},0.15)`,borderBottomLeftRadius:12,fontFamily:TF.mono,fontSize:6,color:accent,letterSpacing:2,textTransform:"uppercase",zIndex:1}}>
          ✦ WIZARD'S PICK
        </div>
      )}

      {/* ── COLLAPSED HEADER — always visible ── */}
      <div style={{padding:"16px 18px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
          <div style={{flex:1,paddingRight:8}}>
            <div style={{fontFamily:TF.serif,fontSize:18,color:C.cream,marginBottom:2}}>{item.name}</div>
            <div style={{fontFamily:TF.mono,fontSize:7,color:C.goldDim,letterSpacing:1,textTransform:"uppercase"}}>{item.origin}</div>
          </div>
          <div style={{textAlign:"right",flexShrink:0}}>
            <div style={{fontFamily:TF.mono,fontSize:18,fontWeight:700,color:accent}}>${item.price}</div>
            {item.estimatedShells < 20 && (
              <div style={{fontFamily:TF.mono,fontSize:6,color:C.amber,letterSpacing:1}}>{item.estimatedShells} left</div>
            )}
          </div>
        </div>

        {/* Tag row */}
        <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",marginBottom:12}}>
          <span style={{fontFamily:TF.mono,fontSize:6,letterSpacing:2,color:accent,background:`rgba(${aRGB},0.08)`,border:`1px solid rgba(${aRGB},0.22)`,borderRadius:4,padding:"2px 8px",textTransform:"uppercase"}}>
            {item.potency}
          </span>
          <span style={{fontFamily:TF.mono,fontSize:6,letterSpacing:2,color:C.goldDim,background:"rgba(212,175,55,0.05)",border:"1px solid rgba(212,175,55,0.15)",borderRadius:4,padding:"2px 8px",textTransform:"uppercase"}}>
            {item.batchId}
          </span>
          {item.kavalactones && item.kavalactones !== "—" && (
            <span style={{fontFamily:TF.mono,fontSize:6,color:"rgba(255,248,230,0.3)",padding:"2px 4px"}}>
              {item.kavalactones}
            </span>
          )}
        </div>

        {/* Dossier expand/collapse toggle — only shows when dossierMode is ON */}
        {isDossierMode && hasDetails && (
          <button
            onClick={() => setOpen(o => !o)}
            style={{
              width:        "100%",
              marginBottom: 12,
              padding:      "8px 12px",
              borderRadius: 10,
              border:       `1px solid rgba(${aRGB},0.18)`,
              background:   open ? `rgba(${aRGB},0.06)` : "rgba(255,255,255,0.03)",
              display:      "flex",
              alignItems:   "center",
              justifyContent:"space-between",
              cursor:       "pointer",
              transition:   "background 0.2s",
            }}>
            <span style={{fontFamily:TF.mono,fontSize:7,letterSpacing:2,color:accent,textTransform:"uppercase"}}>
              {open ? "HIDE DOSSIER" : "VIEW FULL DOSSIER"}
            </span>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
              style={{transform:open?"rotate(180deg)":"rotate(0deg)",transition:"transform 0.25s ease",pointerEvents:"none"}}>
              <path d="M3 5l4 4 4-4" stroke={accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}

        {/* ── EXPANDED DOSSIER PANEL ── */}
        {open && isDossierMode && (
          <div style={{
            borderTop:  "1px solid rgba(255,255,255,0.06)",
            paddingTop: 14,
            marginBottom:12,
            animation:  "screenIn 0.25s ease both",
          }}>

            {/* Experience description */}
            {item.experienceDesc && (
              <div style={{fontFamily:TF.serif,fontStyle:"italic",fontSize:12,color:C.muted,lineHeight:1.75,marginBottom:16}}>
                {item.experienceDesc}
              </div>
            )}

            {/* Mood / effect intensity bar */}
            {item.moodScore != null && (
              <div style={{marginBottom:14}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
                  <span style={{fontFamily:TF.mono,fontSize:6,color:"rgba(255,248,230,0.3)",letterSpacing:2,textTransform:"uppercase"}}>EFFECT INTENSITY</span>
                  <span style={{fontFamily:TF.mono,fontSize:7,fontWeight:700,color:moodColor}}>{moodPct}</span>
                </div>
                <div style={{height:4,borderRadius:2,background:"rgba(255,255,255,0.06)",overflow:"hidden"}}>
                  <div style={{
                    height:     "100%",
                    width:      `${moodPct}%`,
                    borderRadius:2,
                    background: `linear-gradient(to right, ${C.goldMuted}, ${moodColor})`,
                    transition: "width 0.6s ease",
                  }}/>
                </div>
              </div>
            )}

            {/* Technical data grid */}
            <div style={{
              display:             "grid",
              gridTemplateColumns: "1fr 1fr",
              gap:                 8,
              marginBottom:        14,
            }}>
              {[
                // Kava fields
                isKava && item.alkaloidPpm  && { label:"ALKALOID PPM",   value:item.alkaloidPpm,      color:C.neon    },
                isKava && item.kavalactones && item.kavalactones !== "—"
                                            && { label:"KAVALACTONES",   value:item.kavalactones,     color:C.neon    },
                // Kratom fields
                isKratom && item.mitPercent      && { label:"MITRAGYNINE",   value:`${item.mitPercent}%`,  color:C.kratom  },
                isKratom && item.sevenOhPercent  && { label:"7-OH",          value:`${item.sevenOhPercent}%`,color:C.kratom},
                // Shared
                item.batchId                && { label:"BATCH ID",       value:item.batchId,          color:C.goldMuted},
                item.estimatedShells != null&& { label:"SHELLS LEFT",    value:item.estimatedShells,  color:item.estimatedShells < 10 ? C.amber : C.goldDim },
              ].filter(Boolean).map(({ label, value, color }) => (
                <div key={label} style={{
                  padding:      "8px 10px",
                  borderRadius: 10,
                  background:   "rgba(0,0,0,0.25)",
                  border:       "1px solid rgba(255,255,255,0.05)",
                }}>
                  <div style={{fontFamily:TF.mono,fontSize:6,color:"rgba(255,248,230,0.25)",letterSpacing:2,textTransform:"uppercase",marginBottom:3}}>
                    {label}
                  </div>
                  <div style={{fontFamily:TF.mono,fontSize:10,fontWeight:700,color,letterSpacing:0.5}}>
                    {value}
                  </div>
                </div>
              ))}
            </div>

            {/* Cocktail ingredients */}
            {isCocktail && item.ingredients?.length > 0 && (
              <div style={{marginBottom:14}}>
                <div style={{fontFamily:TF.mono,fontSize:6,color:"rgba(255,248,230,0.25)",letterSpacing:2,textTransform:"uppercase",marginBottom:8}}>
                  INGREDIENTS
                </div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  {item.ingredients.map(ing => (
                    <span key={ing} style={{fontFamily:TF.mono,fontSize:7,color:C.cocktail,background:"rgba(56,189,248,0.07)",border:"1px solid rgba(56,189,248,0.18)",borderRadius:6,padding:"3px 8px"}}>
                      {ing}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* COA link — kava and kratom only */}
            {(isKava || isKratom) && item.coaUrl && item.coaUrl !== "#" && (
              <a href={item.coaUrl} target="_blank" rel="noopener noreferrer"
                style={{display:"inline-flex",alignItems:"center",gap:6,fontFamily:TF.mono,fontSize:7,color:C.indigo,letterSpacing:2,textTransform:"uppercase",textDecoration:"none",padding:"6px 10px",borderRadius:8,border:"1px solid rgba(167,139,250,0.2)",background:"rgba(167,139,250,0.05)"}}>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{pointerEvents:"none"}}>
                  <path d="M2 8L8 2M8 2H4M8 2V6" stroke={C.indigo} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                VIEW LAB REPORT (COA)
              </a>
            )}
          </div>
        )}

        {/* Pour button */}
        <HapticBtn pour onClick={() => onPour(item)} disabled={isPouring || status === "PROCESSING"}
          style={{width:"100%",padding:"12px 18px",borderRadius:14,background:isPouring?`rgba(${aRGB},0.06)`:`rgba(${aRGB},0.12)`,border:`1px solid rgba(${aRGB},0.3)`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <span style={{fontFamily:TF.mono,fontWeight:700,fontSize:9,letterSpacing:3,textTransform:"uppercase",color:accent}}>
            {isPouring ? "POURING..." : "POUR THIS SHELL"}
          </span>
          {isPouring
            ? <div style={{width:14,height:14,border:`1.5px solid ${accent}30`,borderTopColor:accent,borderRadius:"50%",animation:"spin 0.7s linear infinite"}}/>
            : <span style={{fontSize:14,pointerEvents:"none"}}>🌿</span>
          }
        </HapticBtn>
      </div>
    </div>
  );
}

// ScreenMenu — full inventory with logShell pour buttons
function ScreenMenu({ state, speaking, glowActive, lastLine, idleLine, dispatch, onPourSuccess }) {
  const [pouringId,setPouringId]=useState(null);

  const handlePour=useCallback(async item=>{
    if(pouringId||state.status==="PROCESSING")return;
    setPouringId(item.id);
    try{
      await logShell({item,dispatch});
      // Trigger Show & Go countdown immediately after a confirmed pour
      onPourSuccess?.(item);
    }
    catch{}
    finally{ setPouringId(null); }
  },[pouringId,state.status,dispatch,onPourSuccess]);

  const catOrder=["kava","kratom","cocktail","food"];
  const catLabels={kava:"KAVA SHELLS",kratom:"KRATOM SHELLS",cocktail:"CEREMONIAL COCKTAILS",food:"FOOD"};
  const catColors={kava:C.neon,kratom:C.kratom,cocktail:C.cocktail,food:C.food};

  return(
    <div>
      <div style={{marginBottom:24}}>
        {window.BULA_RETURNING_USER ? (
          <>
            <div style={{fontFamily:TF.mono,fontSize:7,color:C.goldDim,letterSpacing:3,textTransform:"uppercase",marginBottom:6}}>
              WELCOME BACK
            </div>
            <h1 style={{fontFamily:TF.serif,fontStyle:"italic",fontSize:28,fontWeight:400,color:C.cream,lineHeight:1.08,marginBottom:4}}>
              {window.BULA_RETURNING_USER}.<br/>
              <span style={{fontSize:22,color:C.muted}}>Tonight's selection awaits.</span>
            </h1>
          </>
        ) : (
          <h1 style={{fontFamily:TF.serif,fontStyle:"italic",fontSize:28,fontWeight:400,color:C.cream,lineHeight:1.08}}>
            Tonight's<br/>Full Selection.
          </h1>
        )}
        <p style={{fontFamily:TF.mono,fontSize:8,color:C.goldDim,letterSpacing:3,textTransform:"uppercase",marginTop:8}}>
          {LOCATION_ID.toUpperCase()} · DOSSIER {state.isDossierMode?"ACTIVE":"OFF"}
        </p>
      </div>
      <WizardVision
        speaking={speaking} glowActive={glowActive} status={state.status}
        lastLine={lastLine} idleLine={idleLine}
        vibe={state.vibes?.frequency} chrono={state.vibes?.chronotype}
        reco={state.recommendedId} actionId={state.lastActionId}
        onSeedClose={()=>dispatch({type:"RESET"})}
      />
      {state.status==="ERROR"&&(
        <button onClick={()=>dispatch({type:"RESET"})} style={{width:"100%",marginBottom:14,background:"rgba(255,68,68,0.07)",border:"1px solid rgba(255,68,68,0.2)",borderRadius:14,padding:"12px 16px",color:"rgba(255,120,120,0.8)",fontFamily:TF.mono,fontSize:9,letterSpacing:2,textTransform:"uppercase",cursor:"pointer",display:"flex",alignItems:"center",gap:8}}>
          ⚠ {state.error} — TAP TO RESET
        </button>
      )}
      {catOrder.map(cat=>{
        if(state.hiddenCategories.includes(cat))return null;
        const items=state.inventory.filter(i=>i.category===cat&&i.visible);
        if(!items.length)return null;
        const accent=catColors[cat];
        const aRGB=cat==="kava"?"222,255,154":cat==="kratom"?"192,132,252":cat==="cocktail"?"56,189,248":"251,146,60";
        return(
          <div key={cat} style={{marginBottom:24}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <span style={{fontFamily:TF.mono,fontSize:8,color:accent,letterSpacing:4,textTransform:"uppercase"}}>{catLabels[cat]}</span>
              <span style={{fontFamily:TF.mono,fontSize:7,color:C.goldDim,letterSpacing:1}}>{items.length} AVAILABLE</span>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {items.map(item => (
                <DossierCard
                  key={item.id}
                  item={item}
                  isRec={item.id === state.recommendedId}
                  isPouring={pouringId === item.id}
                  isDossierMode={state.isDossierMode}
                  accent={accent}
                  aRGB={aRGB}
                  onPour={handlePour}
                  status={state.status}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT — BulaBaseKiosk
// ─────────────────────────────────────────────────────────────────────────────
// Screen flow: HERO → QUIZ → GATE → SOMMELIER → RESULT → MENU
//
// onSuccessReady: THE ONLY PATH TO RESULT_DONE via the glow timer.
// Called by useWizardSpeech after ON_SUCCESS audio + SUCCESS_GLOW_HOLD_MS (1500ms).
// ScreenResult.hasTransitioned ref prevents double-fire if user also taps "Continue".

  function BulaBaseKiosk() {
  const [state, dispatch] = useReducer(appReducer, FSM_INIT);

  const { active:showGoActive, secondsLeft, redeemedItem, pourCount, startShowAndGo, dismissShowAndGo } =
    useShowAndGo();

  const handleSuccessReady = useCallback(() => {
    dispatch({ type:"RESULT_DONE" });
  }, []);

  const { speaking, glowActive, muted, setMuted, speakLine, lastLine, idleLine, audioUnlocked } =
    useWizardSpeech({
      screen:         state.screen,
      quizStep:       state.quizStep,
      vibes:          state.vibes,
      status:         state.status,
      onSuccessReady: handleSuccessReady,
    });

  return (
    <>
      {/* Film grain */}
      <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:9999,backgroundImage:`url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.72' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)' opacity='0.028'/%3E%3C/svg%3E")`}}/>
      {/* Ambient depth blobs */}
      <div style={{position:"fixed",inset:0,pointerEvents:"none",overflow:"hidden",zIndex:0}}>
        <div style={{position:"absolute",top:-160,left:"50%",transform:"translateX(-50%)",width:600,height:600,borderRadius:"50%",background:"radial-gradient(circle,rgba(212,175,55,0.05) 0%,transparent 65%)"}}/>
        <div style={{position:"absolute",bottom:-120,right:-140,width:480,height:480,borderRadius:"50%",background:"radial-gradient(circle,rgba(222,255,154,0.022) 0%,transparent 65%)"}}/>
      </div>

      <KioskShell
        state={state}
        dispatch={dispatch}
        onSoftReset={()=>dispatch({type:"NAV",payload:"HERO"})}
        onFullReset={()=>dispatch({type:"RESTART"})}
        onToggleDossier={()=>dispatch({type:"TOGGLE_DOSSIER"})}
      >
        {state.screen==="AGE_GATE"   && <ScreenAgeGate dispatch={dispatch}/>}
       {state.screen==="HERO" && (
  <div style={{ position: 'relative', width: '100%', height: '100%' }}>
    <ScreenHero dispatch={dispatch} audioUnlocked={audioUnlocked}/>
    <button 
      onClick={() => dispatch({ type: "OPEN_101" })}
      style={{ position: 'absolute', bottom: '15%', left: '50%', transform: 'translateX(-50%)', padding: '15px 30px', fontSize: '1.2rem', backgroundColor: '#DEFF9A', color: '#000', borderRadius: '50px', fontWeight: 'bold', border: 'none', zIndex: 20, cursor: 'pointer' }}
    >
      KAVA & KRATOM 101
    </button>
  </div>
)}
        {state.screen==="QUIZ"      && <ScreenQuiz quizStep={state.quizStep} vibes={state.vibes} dispatch={dispatch}/>}
        {state.screen==="GATE"      && <ScreenGate dispatch={dispatch}/>}
        {state.screen==="SOMMELIER" && <ScreenSommelier dispatch={dispatch} inventory={state.inventory} vibes={state.vibes}/>}
        {state.screen==="RESULT"    && <ScreenResult state={state} speaking={speaking} glowActive={glowActive} lastLine={lastLine} idleLine={idleLine} dispatch={dispatch}/>}
        {state.screen==="MENU"      && <ScreenMenu state={state} speaking={speaking} glowActive={glowActive} lastLine={lastLine} idleLine={idleLine} dispatch={dispatch} onPourSuccess={startShowAndGo}/>}
     {state.is101Open && (
          <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.98)", zIndex: 10000, display: "flex", flexDirection: "column", padding: "60px", color: "white" }}>
            <button 
              onClick={() => dispatch({ type: "CLOSE_101" })} 
              style={{ alignSelf: "flex-end", fontSize: "1.5rem", background: "#DEFF9A", color: "#000", border: "none", padding: "10px 20px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}
            >
              ✕ CLOSE
            </button>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
               <h1 style={{ fontSize: "3rem", marginBottom: "20px" }}>The 101 Education</h1>
               <p style={{ fontSize: "1.5rem", maxWidth: "800px", textAlign: "center" }}>
                 Welcome to the educational guide for Troy's Kava Bar. 
                 (Insert your educational text or video link here).
               </p>
            </div>
          </div>
        )}
      </KioskShell>

      {/* Show & Go overlay — fixed, above everything, survives screen changes */}
      <ShowAndGoOverlay
        active={showGoActive}
        secondsLeft={secondsLeft}
        item={redeemedItem}
        pourCount={pourCount}
        onDismiss={dismissShowAndGo}
      />
    </>
  );
}

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<BulaBaseKiosk />);
}
