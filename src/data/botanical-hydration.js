// ═══════════════════════════════════════════════════════════════════════════════
// BULA BASE — HYDRATION & UI COMPANION
// Three net-new pieces that complete the full-stack knowledge layer:
//
//   1. syncAlchemistOverrides()  — Google Sheets row reducer → lookup object
//   2. BOTANICAL_101_LIBRARY     — canonical dataset (BOT_001–BOT_009)
//   3. AlchemistResultScreen     — Result UI with interlock pivot phrase
//   4. FoundersClubCapture       — post-dossier email trigger component
//
// Depends on:
//   alchemist-engine.js    → calculateRecommendation(), buildPathString()
//   botanical-dossier.jsx  → getBotanicalDossier(), BotanicalDossierCard,
//                            LoadingBotanicalFact, getRandomBotanicalFact()
//   BulaBaseKiosk.jsx      → BOTANICAL_LIBRARY, CURRENT_BAR_CONFIG,
//                            SMS_CONSENT_TEXT, FSM dispatch
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useCallback } from 'react';

// Design tokens — matches BulaBaseKiosk.jsx
const C = {
  jade:      "#091A11", jadeMid:"#0D2118", jadeEdge:"#142B1E",
  neon:      "#DEFF9A", indigo:"#A78BFA",  gold:"#F5D06A",
  goldMuted: "#B4943A", goldDim:"rgba(212,175,55,0.40)",
  cream:     "rgba(255,248,230,0.88)", muted:"rgba(255,248,230,0.34)",
  red:       "#FF4444", amber:"#E07A00",   aether:"#7FFFD4",
};
const TF = {
  serif: "'Crimson Text', serif",
  mono:  "'JetBrains Mono', monospace",
};

// ─────────────────────────────────────────────────────────────────────────────
// 1. syncAlchemistOverrides
// ─────────────────────────────────────────────────────────────────────────────
// Reduces raw Google Sheets rows into a path-string keyed lookup object.
// Your developer calls this once after fetching the Override tab, then passes
// the result directly into calculateRecommendation() as manualOverrides.
//
// Expected sheet columns (case-insensitive, flexible whitespace):
//   PathString | Status | TargetBotanicalID | CustomVerdict | CustomServing | Notes
//
// @param  {object[]} sheetRows — raw JSON rows from the Sheets API
// @returns {object[]}          — array of normalised override objects
//                                ready for calculateRecommendation()
//
// Why an array and not a plain object?
// calculateRecommendation() iterates with .find() so it can apply
// per-row logic (status check, future date-range filtering).
// A plain object would collapse duplicate paths.

function syncAlchemistOverrides(sheetRows) {
  if (!Array.isArray(sheetRows) || sheetRows.length === 0) {
    console.warn("[syncAlchemistOverrides] No rows provided — returning empty array.");
    return [];
  }

  // Normalise column key names — Sheets API returns raw header strings
  // which may have different casing or extra spaces depending on the sheet.
  function normalise(obj) {
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      out[k.trim().toLowerCase().replace(/\s+/g, "_")] = v;
    }
    return out;
  }

  const overrides = [];

  for (const raw of sheetRows) {
    const row = normalise(raw);

    // Required fields — skip rows that are incomplete
    const pathString = (row.pathstring || row.path_string || "").trim().toUpperCase();
    const status     = (row.status || "").trim().toUpperCase();
    const targetId   = (row.targetbotanicalid || row.target_id || "").trim().toUpperCase();

    if (!pathString || !targetId) {
      console.warn("[syncAlchemistOverrides] Skipping row with missing PathString or TargetBotanicalID:", raw);
      continue;
    }

    // Validate path string format: WORD_WORD_WORD_WORD (4 segments)
    const segments = pathString.split("_");
    if (segments.length !== 4) {
      console.warn(`[syncAlchemistOverrides] Skipping malformed path "${pathString}" — expected 4 segments.`);
      continue;
    }

    overrides.push({
      path_string:    pathString,
      status,                             // "ACTIVE" | "INACTIVE" — engine checks this
      target_id:      targetId,           // e.g. "BOT_003"
      custom_verdict: (row.customverdict  || row.custom_verdict  || "").trim() || null,
      custom_serving: (row.customserving  || row.custom_serving  || "").trim() || null,
      source_label:   (row.sourcelabel    || row.source_label    || "ops-sheet").trim(),
      notes:          (row.notes || "").trim() || null,
    });
  }

  const activeCount   = overrides.filter(r => r.status === "ACTIVE").length;
  const inactiveCount = overrides.length - activeCount;
  console.info(`[syncAlchemistOverrides] Loaded ${overrides.length} rows (${activeCount} ACTIVE, ${inactiveCount} INACTIVE).`);

  return overrides;
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. BOTANICAL_101_LIBRARY — canonical dataset
// ─────────────────────────────────────────────────────────────────────────────
// This is the authoritative educational content for all 9 botanicals.
// It uses the same field names as BOTANICAL_LIBRARY in BulaBaseKiosk.jsx
// so getBotanicalDossier() works with both arrays interchangeably.
//
// Field mapping:
//   essence  → dossier_text    (origin, lineage, mechanism)
//   function → alchemist_fact  (loading screen one-liner)
//   feeling  → serving_wisdom  (serving guide, what to expect)
//   protocol → safety_note     (dosing, contraindications)
//
// Your developer merges or replaces BOTANICAL_LIBRARY in BulaBaseKiosk.jsx
// with this array in Phase 2 when the Google Sheet becomes the source of truth.

const BOTANICAL_101_LIBRARY = [
  {
    id:       "BOT_001",
    tag:      "KAVA_CORE",
    name:     "Noble Kava",
    visible:  true,
    essence:
      "Sourced from the South Pacific islands, Noble Kava (Piper methysticum) has been at " +
      "the center of ceremonial culture for over 3,000 years. Its active compounds — " +
      "kavalactones — interact with GABA receptors to deliver calm without cloudiness, " +
      "making it one of the few botanicals that reduces anxiety without impairing cognition. " +
      "It is, in the Alchemist's words, a 3,000-year-old social technology.",
    function:
      "Kava is a guest in your body. Treat it with respect.",
    feeling:
      "The classic sign the chemistry is live: a gentle numbing of the tongue within minutes. " +
      "From there, tension dissolves from the shoulders down. Social friction drops. " +
      "Mental clarity holds. The room feels warmer without feeling blurry.",
    protocol:
      "Sip, don't chug. Reverse tolerance is real — first-timers may feel less than regulars " +
      "until the body calibrates. Empty stomach for maximum intake. One shell, 15 minutes, " +
      "then assess. System Lock: do not mix with alcohol.",
  },
  {
    id:       "BOT_002",
    tag:      "BLUE_LOTUS",
    name:     "Blue Lotus",
    visible:  true,
    essence:
      "The flower of the Pharaohs — Nymphaea caerulea was depicted in Ancient Egyptian " +
      "murals as a gateway to meditative and reflective states. It offers a gentle shift " +
      "in consciousness without the heavy sedation of more potent botanicals. Unlike a " +
      "full shutdown, Blue Lotus delivers what the Alchemist calls lucid relaxation: " +
      "the mind quiets, but the lights stay on.",
    function:
      "The flower of the Pharaohs, designed for lucid relaxation.",
    feeling:
      "Floaty and calm. The sharp edges of the day soften. Mental chatter settles. " +
      "Dreams become vivid if taken before sleep. It is the botanical equivalent of " +
      "dimming the lights without turning them off.",
    protocol:
      "Perfect for sunset. Pairs well with quiet focus or deep conversation. " +
      "Strictly an evening botanical — avoid pairing with stimulants. " +
      "This is strictly an evening flower.",
  },
  {
    id:       "BOT_003",
    tag:      "WHITE_KRATOM",
    name:     "White Kratom",
    visible:  true,
    essence:
      "Harvested early in the leaf's growth cycle, White Vein Kratom (Mitragyna speciosa) " +
      "carries a high-mitragynine alkaloid profile that delivers uplifting, stimulating " +
      "properties. It is the Alchemist's tool for overcoming morning inertia — a clean " +
      "energy lift that supports focus without the cortisol spike of caffeine.",
    function:
      "Clean energy for the sunrise seeker.",
    feeling:
      "A gradual lift in mood and mental energy within 20–40 minutes. " +
      "Cognitive tasks feel more accessible. Physical motivation follows. " +
      "At proper serving size, the effect is clean — no jitters, no crash.",
    protocol:
      "Standard serving: 4–6oz chilled liquid. Avoid within 6 hours of sleep — " +
      "the stimulating alkaloids will interfere with rest. Start low; " +
      "the white vein is the most potent by stimulation profile.",
  },
  {
    id:       "BOT_004",
    tag:      "GREEN_KRATOM",
    name:     "Green Kratom",
    visible:  true,
    essence:
      "Harvested mid-cycle, Green Vein Kratom offers a balanced alkaloid profile — " +
      "enough mitragynine for moderate energy and mental uplift, enough 7-OH for " +
      "physical ease and social comfort. It is the most versatile vein and the " +
      "Alchemist's recommendation for daytime social settings where neither pure " +
      "sedation nor pure stimulation is appropriate.",
    function:
      "The balanced path between energy and social ease.",
    feeling:
      "A comfortable lift — alert but not wired, relaxed but not sedated. " +
      "Social inhibition drops slightly. Conversation flows. " +
      "It's the Goldilocks vein: not too much, not too little.",
    protocol:
      "Ideal for daytime social settings or moderate work sessions. " +
      "Pairs well with Noble Kava for a synergistic social-focus state. " +
      "Hydration is key — drink water throughout.",
  },
  {
    id:       "BOT_005",
    tag:      "RED_KRATOM",
    name:     "Red Kratom",
    visible:  true,
    essence:
      "Harvested at peak leaf maturity, Red Vein Kratom has the highest concentration " +
      "of 7-hydroxymitragynine — the alkaloid primarily responsible for physical comfort, " +
      "rest, and deep relaxation. It has been prized by laborers in Southeast Asia for " +
      "centuries as a recovery botanical after physically demanding work.",
    function:
      "The evening anchor for physical recovery.",
    feeling:
      "A wave of physical warmth and release within 30–45 minutes. " +
      "Muscle tension eases. The body feels held. Sleep comes more readily. " +
      "At calibrated doses, the mind stays present while the body fully rests.",
    protocol:
      "Best enjoyed when the day is done. Not for mornings or before physical activity. " +
      "The sedating profile requires a clear schedule — plan for rest after consumption. " +
      "Do not operate heavy machinery.",
  },
  {
    id:       "BOT_006",
    tag:      "KANNA_CORE",
    name:     "Kanna",
    visible:  true,
    essence:
      "Sceletium tortuosum — a South African succulent used by indigenous communities " +
      "for centuries as a mood-lifter and social lubricant. Kanna acts as a natural " +
      "serotonin reuptake inhibitor, keeping feel-good neurochemicals circulating longer " +
      "and washing away social anxiety without the heavy sedation of kava or kratom.",
    function:
      "Nature's heart-opener for social synchronization.",
    feeling:
      "A bright, tingly rush of social energy within 20 minutes. " +
      "The desire to connect, talk, and engage amplifies. " +
      "Emotional barriers lower. Laughter comes more easily. " +
      "It is the ultimate choice for a social night.",
    protocol:
      "Use sparingly — Kanna is potent for reducing social friction and " +
      "can be intense for a first-timer. Start with a small dose and give " +
      "the system 20 minutes before assessing. Pairs well with Noble Kava.",
  },
  {
    id:       "BOT_007",
    tag:      "REISHI_REST",
    name:     "Reishi",
    visible:  true,
    essence:
      "Ganoderma lucidum — the Mushroom of Immortality in Traditional Chinese Medicine. " +
      "Reishi has been used for over 2,000 years as an adaptogen: a botanical that helps " +
      "the body resist and recover from stress rather than masking it. It directly supports " +
      "the adrenal system, helping the body regulate cortisol and stay grounded " +
      "through the demands of an entrepreneur's day.",
    function:
      "The 'Mushroom of Immortality' for grounding.",
    feeling:
      "Not a buzz — a settling. The internal static quiets. " +
      "The nervous system shifts from reactive to responsive. " +
      "Sleep quality improves with consistent use. " +
      "It is the botanical equivalent of a long exhale.",
    protocol:
      "Works best when integrated into a consistent protocol — daily use over " +
      "weeks compounds the adaptogenic effect. Best in the evening as part of " +
      "a wind-down ritual. Excellent for switching off the brain after managing " +
      "a large project inventory.",
  },
  {
    id:       "BOT_008",
    tag:      "LIONS_MANE",
    name:     "Lion's Mane",
    visible:  true,
    essence:
      "Hericium erinaceus — a shaggy functional mushroom used in traditional medicine " +
      "for its ability to support Nerve Growth Factor (NGF) synthesis. Unlike stimulants " +
      "that force cognitive performance, Lion's Mane supports the brain's structural " +
      "health — helping neural pathways repair, sharpen, and stay clear over time.",
    function:
      "The alchemist's tool for neural clarity.",
    feeling:
      "Not a sudden buzz — a gradual sharpening. Tasks feel more manageable. " +
      "Brain fog lifts. It's suddenly much easier to stay locked in on what matters. " +
      "The effect compounds: daily use over weeks produces noticeable clarity gains.",
    protocol:
      "Excellent for long study or work sessions. Perfect for the daily routine, " +
      "especially when managing multiple ventures. Pairs exceptionally well with " +
      "Noble Kava for a focused-calm state that doesn't sacrifice either quality.",
  },
  {
    id:       "BOT_009",
    tag:      "CORDYCEPS",
    name:     "Cordyceps",
    visible:  true,
    essence:
      "Cordyceps sinensis — the bio-hacker's botanical, originally used by Tibetan " +
      "herders who noticed their livestock became unusually vigorous after grazing on it " +
      "at altitude. Modern research shows it supports cellular ATP production and " +
      "oxygen utilization — essentially teaching your cells to burn cleaner fuel " +
      "for physical stamina without the adrenal cost of caffeine.",
    function:
      "The bio-hacker's choice for oxygen and stamina.",
    feeling:
      "A steady, clean burn of energy. Not a spike — an extra gear. " +
      "Endurance improves. Recovery between efforts shortens. " +
      "The body simply performs longer before fatigue signals fire.",
    protocol:
      "Best used pre-workout or before a physically demanding shift. " +
      "Go-to for the Sunrise chronotype. Ideal for high-activity lifestyles. " +
      "Pairs well with Lion's Mane for a full-spectrum cognitive-physical stack.",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// INTERLOCK PIVOT PHRASE BUILDER
// ─────────────────────────────────────────────────────────────────────────────
// Called when _meta.tier === "ALCHEMIST_MATH" and a safety interlock fired.
// Detects which interlock applied based on the path string and returns
// a human-readable explanation in the Alchemist's voice.
//
// The _meta field from calculateRecommendation() doesn't currently flag which
// interlock fired — we re-derive it here from the path components.
// In Phase 2 your developer can add an `interlocks_fired` array to _meta.

function buildInterlockPivotPhrase(pathString, resolvedBotId, registry) {
  if (!pathString) return null;

  const [freq, intent, chrono] = pathString.split("_");
  const bot = registry ? registry[resolvedBotId] : null;

  // Energy Cap: MOONLIGHT + non-ENERGY intent — stimulant was suppressed
  if (chrono === "MOONLIGHT" && intent !== "ENERGY") {
    return {
      interlock:   "ENERGY_CAP",
      headline:    "Temporal Filter Applied",
      explanation: "High-stimulant botanicals were suppressed for the late-night cycle. " +
                   "The Alchemist routed to a profile that matches your intention " +
                   "without disrupting the Moonlight frequency.",
    };
  }

  // Grounding Ceiling: GROUNDED + RESET — full-shutdown was suppressed
  if (freq === "GROUNDED" && intent === "RESET") {
    return {
      interlock:   "GROUNDING_CEILING",
      headline:    "Lucid Relaxation Route",
      explanation: "Your system is already deep — a full shutdown would overshoot the target. " +
                   "The Alchemist pivoted to a lucid relaxation profile: " +
                   "calm without the anchor.",
    };
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. AlchemistResultScreen
// ─────────────────────────────────────────────────────────────────────────────
// Full Result UI for ScreenResult in BulaBaseKiosk.jsx.
// Renders: verdict → interlock pivot card (if applicable) → dossier card.
// Designed to be dropped in as a sub-component of the existing ScreenResult.
//
// Props:
//   result        {object}  — output of calculateRecommendation()
//   dossier       {object}  — output of getBotanicalDossier()
//   isDossierMode {boolean} — from state.isDossierMode (auto-expands dossier card)
//   onFoundersClubDismiss {fn} — called when Founders Club card is dismissed

function AlchemistResultScreen({ result, dossier, isDossierMode, onFoundersClubDismiss }) {
  const [showPivot,       setShowPivot]       = useState(true);
  const [showFoundersClub,setShowFoundersClub]= useState(false);
  const [dossierViewed,   setDossierViewed]   = useState(false);

  // Show Founders Club capture after the dossier has been opened
  const handleDossierOpen = useCallback(() => {
    setDossierViewed(true);
  }, []);

  useEffect(() => {
    if (dossierViewed) {
      // Small delay so the dossier content renders before the capture card appears
      const id = setTimeout(() => setShowFoundersClub(true), 1200);
      return () => clearTimeout(id);
    }
  }, [dossierViewed]);

  if (!result || !dossier) return null;

  const pivotPhrase = buildInterlockPivotPhrase(
    result._meta?.path,
    result.bot_id,
    null  // registry not available here — interlock derived from path
  );

  const isInventoryFallback = result._meta?.tier === "INVENTORY_FALLBACK";

  return (
    <div style={{animation:"screenIn 0.4s ease both"}}>

      {/* ── VERDICT BLOCK ── */}
      <div style={{
        padding:    "18px 20px",
        borderRadius:18,
        background: "rgba(255,255,255,0.025)",
        backdropFilter:"blur(16px)",
        borderTop:  "1px solid rgba(255,255,255,0.08)",
        borderLeft: "1px solid rgba(255,255,255,0.08)",
        borderRight:"1px solid rgba(255,255,255,0.03)",
        borderBottom:"1px solid rgba(255,255,255,0.03)",
        marginBottom:12,
      }}>
        <div style={{
          fontFamily:TF.mono, fontSize:6, color:C.goldDim,
          letterSpacing:3, textTransform:"uppercase", marginBottom:8,
        }}>
          ✦ ALCHEMIST'S VERDICT
        </div>
        <div style={{
          fontFamily:TF.serif, fontStyle:"italic",
          fontSize:20, color:C.cream, lineHeight:1.3, marginBottom:8,
        }}>
          {dossier.title}
        </div>
        <p style={{
          fontFamily:TF.mono, fontSize:9, color:C.muted,
          lineHeight:1.8, margin:0, letterSpacing:0.3,
        }}>
          {result.verdict}
        </p>

        {/* Inventory fallback notice */}
        {isInventoryFallback && (
          <div style={{
            marginTop:10, padding:"8px 12px", borderRadius:10,
            background:"rgba(224,122,0,0.06)",
            border:"1px solid rgba(224,122,0,0.2)",
          }}>
            <span style={{
              fontFamily:TF.mono, fontSize:7, color:C.amber,
              letterSpacing:2, textTransform:"uppercase",
            }}>
              ⚡ INVENTORY ROUTE — {result._meta?.ideal_bot} unavailable · fallback applied
            </span>
          </div>
        )}
      </div>

      {/* ── INTERLOCK PIVOT CARD ── */}
      {pivotPhrase && showPivot && (
        <div style={{
          marginBottom:12, padding:"14px 16px", borderRadius:16,
          background:"rgba(167,139,250,0.06)",
          border:"1px solid rgba(167,139,250,0.2)",
          animation:"screenIn 0.35s ease both",
          position:"relative",
        }}>
          {/* Dismiss */}
          <button
            onClick={() => setShowPivot(false)}
            style={{
              position:"absolute", top:10, right:12,
              background:"transparent", border:"none",
              color:"rgba(255,248,230,0.2)", cursor:"pointer",
              fontFamily:TF.mono, fontSize:10, lineHeight:1,
            }}>
            ×
          </button>

          <div style={{
            fontFamily:TF.mono, fontSize:6, color:C.indigo,
            letterSpacing:3, textTransform:"uppercase", marginBottom:6,
          }}>
            ⚙ {pivotPhrase.headline}
          </div>
          <p style={{
            fontFamily:TF.mono, fontSize:8, color:"rgba(167,139,250,0.75)",
            lineHeight:1.8, margin:0, letterSpacing:0.3,
          }}>
            {pivotPhrase.explanation}
          </p>
        </div>
      )}

      {/* ── SERVING SUGGESTION ── */}
      <div style={{
        marginBottom:12, padding:"12px 16px", borderRadius:14,
        background:`rgba(127,255,212,0.04)`,
        border:"1px solid rgba(127,255,212,0.12)",
        display:"flex", alignItems:"flex-start", gap:10,
      }}>
        <span style={{fontSize:14, flexShrink:0, marginTop:2, pointerEvents:"none"}}>⚗️</span>
        <div>
          <div style={{
            fontFamily:TF.mono, fontSize:6, color:"rgba(127,255,212,0.5)",
            letterSpacing:2, textTransform:"uppercase", marginBottom:4,
          }}>
            SERVING PROTOCOL
          </div>
          <p style={{
            fontFamily:TF.mono, fontSize:8, color:"rgba(127,255,212,0.75)",
            lineHeight:1.75, margin:0, letterSpacing:0.3,
          }}>
            {result.serving_suggestion || dossier.serving_wisdom}
          </p>
        </div>
      </div>

      {/* ── BOTANICAL DOSSIER CARD ── */}
      {/* Import BotanicalDossierCard from botanical-dossier.jsx */}
      {/* Wrap in a click interceptor to detect when the user opens the dossier */}
      <div onClick={!dossierViewed ? handleDossierOpen : undefined}>
        {/*
          <BotanicalDossierCard
            dossier={dossier}
            defaultOpen={isDossierMode}
          />
          Uncomment once botanical-dossier.jsx is imported into this file or bundled.
          The onClick wrapper above fires handleDossierOpen on first interaction,
          which triggers the Founders Club capture after a 1.2s delay.
        */}
        <div style={{
          padding:"14px 18px", borderRadius:18,
          background:"rgba(255,255,255,0.025)",
          border:"1px solid rgba(255,255,255,0.06)",
          marginBottom:12,
          cursor:"pointer",
        }}>
          <div style={{
            fontFamily:TF.mono, fontSize:6, color:C.goldDim,
            letterSpacing:3, textTransform:"uppercase", marginBottom:6,
          }}>
            ✦ BOTANICAL DOSSIER · 101 — TAP TO EXPAND
          </div>
          <div style={{
            fontFamily:TF.serif, fontStyle:"italic",
            fontSize:16, color:C.cream,
          }}>
            {dossier.title}
          </div>
          <div style={{
            fontFamily:TF.mono, fontSize:8, color:C.muted,
            lineHeight:1.7, marginTop:4,
          }}>
            {dossier.alchemist_fact}
          </div>
        </div>
      </div>

      {/* ── FOUNDERS CLUB CAPTURE — appears after dossier is opened ── */}
      {showFoundersClub && (
        <FoundersClubCapture
          botanical={dossier.title}
          onDismiss={() => {
            setShowFoundersClub(false);
            onFoundersClubDismiss?.();
          }}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. FoundersClubCapture
// ─────────────────────────────────────────────────────────────────────────────
// Triggered after the Dossier card is first opened.
// Captures email for the Founders Club (Phase 2 The Vault).
// Does NOT replace the main Identity Gate — this is an optional upgrade prompt.
// Posts to WEBHOOK_URL with source: "founders_club_upgrade" for segmentation.
//
// Props:
//   botanical {string} — name of the recommended botanical for personalisation
//   onDismiss {fn}     — closes the card

function FoundersClubCapture({ botanical, onDismiss }) {
  const [email,      setEmail]      = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done,       setDone]       = useState(false);
  const [err,        setErr]        = useState(null);
  const [focused,    setFocused]    = useState(false);

  const emailValid = email.includes("@") && email.length > 4;

  const submit = async () => {
    if (!emailValid || submitting) return;
    setSubmitting(true); setErr(null);

    // Post to the same webhook as the main gate — segmented by source field.
    // WEBHOOK_URL is defined in BulaBaseKiosk.jsx — import or pass as prop.
    // Replace "YOUR_WEBHOOK_URL_HERE" check with the actual constant import.
    const WEBHOOK_URL = typeof window !== "undefined"
      ? window.__BULA_WEBHOOK_URL__
      : null;

    if (WEBHOOK_URL && WEBHOOK_URL !== "YOUR_WEBHOOK_URL_HERE") {
      try {
        await fetch(WEBHOOK_URL, {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            botanical_recommended: botanical,
            source:     "founders_club_upgrade",
            locationId: "st_augustine_troy_01",
            timestamp:  new Date().toISOString(),
          }),
        });
      } catch (e) {
        console.warn("[FoundersClub] Webhook post failed (non-fatal):", e?.message);
      }
    }

    setSubmitting(false);
    setDone(true);
  };

  return (
    <div style={{
      padding:      "18px 20px",
      borderRadius: 20,
      background:   `linear-gradient(135deg, rgba(245,208,106,0.06), rgba(212,175,55,0.03))`,
      border:       `1px solid rgba(212,175,55,0.22)`,
      marginBottom: 16,
      animation:    "screenIn 0.4s ease both",
      position:     "relative",
    }}>
      {/* Dismiss */}
      <button
        onClick={onDismiss}
        style={{
          position:"absolute", top:12, right:14,
          background:"transparent", border:"none",
          color:"rgba(255,248,230,0.2)", cursor:"pointer",
          fontFamily:TF.mono, fontSize:10, lineHeight:1, padding:4,
        }}>
        ×
      </button>

      {!done ? (
        <>
          <div style={{
            fontFamily:TF.mono, fontSize:7, color:C.goldDim,
            letterSpacing:3, textTransform:"uppercase", marginBottom:8,
          }}>
            ✦ FOUNDERS CLUB
          </div>
          <div style={{
            fontFamily:TF.serif, fontStyle:"italic",
            fontSize:18, color:C.cream, lineHeight:1.2, marginBottom:8,
          }}>
            Get notified when a<br/>fresh {botanical} batch lands.
          </div>
          <p style={{
            fontFamily:TF.mono, fontSize:8, color:C.muted,
            lineHeight:1.75, marginBottom:16,
          }}>
            Founders Club members get first access to new batches, private
            tasting events, and the Alchemist's seasonal recommendations.
          </p>

          <div style={{display:"flex", gap:8, alignItems:"stretch"}}>
            <input
              type="email" inputMode="email"
              value={email} placeholder="your@email.com"
              onChange={e => setEmail(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={()  => setFocused(false)}
              style={{
                flex:        1, padding:"12px 14px",
                borderRadius:12, outline:"none",
                background:  focused ? "rgba(222,255,154,0.04)" : "rgba(255,255,255,0.03)",
                border:      `1px solid ${focused ? "rgba(222,255,154,0.32)" : "rgba(255,255,255,0.08)"}`,
                color:       C.cream, fontSize:13,
                fontFamily:  TF.mono, transition:"border-color 0.2s",
              }}
            />
            <button
              onClick={submit}
              disabled={!emailValid || submitting}
              style={{
                padding:      "12px 16px", borderRadius:12, border:"none",
                background:   emailValid
                  ? `linear-gradient(135deg, ${C.gold}, #e8b830)`
                  : "rgba(255,255,255,0.04)",
                color:        emailValid ? C.jade : "rgba(255,255,255,0.2)",
                fontFamily:   TF.mono, fontWeight:700, fontSize:9,
                letterSpacing:2, textTransform:"uppercase",
                cursor:       emailValid ? "pointer" : "not-allowed",
                flexShrink:   0, transition:"all 0.2s",
              }}>
              {submitting
                ? <div style={{width:14,height:14,border:`1.5px solid ${C.jade}40`,borderTopColor:C.jade,borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
                : "JOIN"
              }
            </button>
          </div>

          {err && (
            <p style={{
              fontFamily:TF.mono, fontSize:7, color:"rgba(255,100,100,0.7)",
              marginTop:8, letterSpacing:1,
            }}>
              {err}
            </p>
          )}

          <p style={{
            fontFamily:TF.mono, fontSize:6,
            color:"rgba(255,248,230,0.15)", lineHeight:1.7,
            marginTop:10, marginBottom:0,
          }}>
            No spam. Unsubscribe at any time. Consent is not a condition of purchase.
          </p>
        </>
      ) : (
        <div style={{textAlign:"center", padding:"12px 0"}}>
          <div style={{fontSize:28, marginBottom:8}}>✦</div>
          <div style={{
            fontFamily:TF.serif, fontStyle:"italic",
            fontSize:18, color:C.gold, marginBottom:6,
          }}>
            You're in the club.
          </div>
          <p style={{
            fontFamily:TF.mono, fontSize:8, color:C.muted,
            lineHeight:1.75, margin:0,
          }}>
            The Alchemist will reach out when a fresh batch of {botanical} arrives.
          </p>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SAMPLE GOOGLE SHEETS JSON SCHEMA
// ─────────────────────────────────────────────────────────────────────────────
// This is the raw row format the Sheets API returns.
// Your developer calls syncAlchemistOverrides(rows) after fetching.
// Column headers must exactly match (case-insensitive, leading/trailing spaces ok).

const SAMPLE_SHEET_ROWS = [
  {
    "PathString":         "WIRED_SOCIAL_SUNRISE_FRUITY",
    "Status":             "ACTIVE",
    "TargetBotanicalID":  "BOT_006",
    "CustomVerdict":      "Market morning energy — Kanna opens the social channel and syncs with the sunrise vibe.",
    "CustomServing":      "Served in a citrus seltzer base. Sip slowly — Kanna is potent.",
    "Notes":              "Active Sat-Sun 8am-12pm market event only.",
  },
  {
    "PathString":         "GROUNDED_RESET_MOONLIGHT_EARTHY",
    "Status":             "INACTIVE",
    "TargetBotanicalID":  "BOT_001",
    "CustomVerdict":      "Noble kava for the late-night grounded crowd.",
    "CustomServing":      "Traditional preparation — cold-strained, no additives.",
    "Notes":              "Paused — Noble kava batch running low.",
  },
  {
    "PathString":         "WIRED_PAIN_ALLDAY_TROPICAL",
    "Status":             "ACTIVE",
    "TargetBotanicalID":  "BOT_005",
    "CustomVerdict":      "Red vein in a tropical base — maximum physical relief, smooth intake.",
    "CustomServing":      "Coconut water base with mango citrus finish.",
    "Notes":              "Promo: Red Vein week. Expires end of month.",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// INTEGRATION NOTES FOR YOUR DEVELOPER
// ─────────────────────────────────────────────────────────────────────────────
//
// 1. GOOGLE SHEETS FETCH (Phase 2)
//    Fetch the Override tab and the 101 Library tab from Sheets API, then:
//
//    const overrideRows   = await fetchSheetTab("Override");
//    const libraryRows    = await fetchSheetTab("101_Library");
//
//    const overrides      = syncAlchemistOverrides(overrideRows);
//    // overrides is now the array you pass to calculateRecommendation()
//
//    // If using the Sheets library instead of BOTANICAL_101_LIBRARY const:
//    const educationalData = libraryRows.map(row => ({
//      id:       row.BOT_ID,
//      tag:      row.TAG || "",
//      name:     row.Title_101,
//      visible:  row.Visible !== "FALSE",
//      essence:  row.Deep_Dive,
//      function: row.Alchemist_Fact,
//      feeling:  row.Serving_Wisdom,
//      protocol: row.Safety_Note || row.Serving_Wisdom,
//    }));
//
// 2. WIRING AlchemistResultScreen INTO ScreenResult (BulaBaseKiosk.jsx)
//
//    function ScreenResult({ state, speaking, glowActive, lastLine, idleLine, dispatch }) {
//      // Map inventory ID to canonical BOT ID
//      const INVENTORY_TO_BOT = {
//        k1:"BOT_001", k2:"BOT_001", k3:"BOT_001",
//        kr1:"BOT_004", kr2:"BOT_003",
//        c1:null, c2:null,
//      };
//      const botId   = INVENTORY_TO_BOT[state.recommendedId] ?? state.recommendedId;
//      const dossier = getBotanicalDossier(botId, BOTANICAL_101_LIBRARY);
//
//      return (
//        <div>
//          <WizardVision {...} />
//          <AlchemistResultScreen
//            result={{ bot_id: botId, verdict: dossier.alchemist_fact,
//                      serving_suggestion: dossier.serving_wisdom,
//                      _meta: { path: "", tier: "ALCHEMIST_MATH" } }}
//            dossier={dossier}
//            isDossierMode={state.isDossierMode}
//            onFoundersClubDismiss={() => dispatch({type:"RESULT_DONE"})}
//          />
//        </div>
//      );
//    }
//
// 3. WEBHOOK CONSTANT
//    Set window.__BULA_WEBHOOK_URL__ = WEBHOOK_URL in BulaBaseKiosk.jsx root,
//    or import WEBHOOK_URL directly when this file is bundled with the main file.
//
// 4. PHASE 1 (now, pre-bundler)
//    Copy syncAlchemistOverrides() and BOTANICAL_101_LIBRARY directly into
//    BulaBaseKiosk.jsx. Copy AlchemistResultScreen and FoundersClubCapture
//    into the SCREENS section. All design tokens and patterns already match.

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

export {
  syncAlchemistOverrides,
  buildInterlockPivotPhrase,
  AlchemistResultScreen,
  FoundersClubCapture,
  BOTANICAL_101_LIBRARY,
  SAMPLE_SHEET_ROWS,
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    syncAlchemistOverrides,
    buildInterlockPivotPhrase,
    BOTANICAL_101_LIBRARY,
    SAMPLE_SHEET_ROWS,
  };
}
