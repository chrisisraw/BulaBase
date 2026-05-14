// ═══════════════════════════════════════════════════════════════════════════════
// BULA BASE — BOTANICAL DOSSIER (101 LAYER)
// Result-Hydration utility + BotanicalDossierCard component
//
// Integration points:
//   getBotanicalDossier()    → called after calculateRecommendation() resolves
//   getRandomBotanicalFact() → called during the Sommelier loading state
//   BotanicalDossierCard     → mounted on ScreenResult below the pour card
//   LoadingBotanicalFact     → mounted on ScreenSommelier while typewriter runs
//
// Field mapping (BOTANICAL_LIBRARY slugs → dossier output fields):
//   essence  → dossier_text    (lineage, origin, traditional use)
//   function → alchemist_fact  (mechanism — punchy one-liner for the hook)
//   feeling  → serving_wisdom  (subjective experience + how to drink it)
//   protocol → safety_note     (dosing guidance, contraindications)
//
// Pure functions — educationalData is always passed in, never fetched here.
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN TOKENS — matches BulaBaseKiosk.jsx exactly
// ─────────────────────────────────────────────────────────────────────────────

const C = {
  jade:      "#091A11",
  jadeMid:   "#0D2118",
  jadeEdge:  "#142B1E",
  neon:      "#DEFF9A",
  indigo:    "#A78BFA",
  gold:      "#F5D06A",
  goldMuted: "#B4943A",
  goldDim:   "rgba(212,175,55,0.40)",
  cream:     "rgba(255,248,230,0.88)",
  muted:     "rgba(255,248,230,0.34)",
  red:       "#FF4444",
  amber:     "#E07A00",
  aether:    "#7FFFD4",
};

const TF = {
  serif: "'Crimson Text', serif",
  mono:  "'JetBrains Mono', monospace",
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPLIANCE FLAG LABELS
// Maps compliance_flags from the engine output to human-readable notices.
// ─────────────────────────────────────────────────────────────────────────────

const COMPLIANCE_LABELS = {
  FDA_DISCLAIMER:     "These statements have not been evaluated by the FDA. Not intended to diagnose, treat, cure, or prevent any disease.",
  KAVA_LIVER_WARNING: "Kava Warning: consult your healthcare provider before use if you have liver concerns, consume alcohol frequently, or take any medications.",
  AGE_GATE_18:        "You must be 18 or older to purchase this product. Valid government-issued ID required.",
  KRATOM_WARNING:     "Kratom: not for use if pregnant or nursing. Excessive use may cause dependency. Do not operate heavy machinery after consumption.",
};

// ─────────────────────────────────────────────────────────────────────────────
// GENERIC FALLBACK
// Fires when bot_id has no matching educational data.
// The UI never breaks and the Alchemist voice is never lost.
// ─────────────────────────────────────────────────────────────────────────────

const GENERIC_FALLBACK = {
  bot_id:         null,
  tag:            "ALCHEMIST_CORE",
  title:          "The Alchemist's Selection",
  alchemist_fact: "Every botanical carries a frequency. The Alchemist has calibrated yours.",
  dossier_text:   "The roots of the world's botanical traditions share a common thread — the understanding that plants and human chemistry have co-evolved for millennia. What you're about to receive is the result of that relationship, carefully selected and prepared for your current intention.",
  serving_wisdom: "Approach your pour with intention. Sip slowly, give the system 15 minutes to sync, and stay hydrated throughout your session.",
  safety_note:    "Start with a single serving. Give your system time to calibrate before going back for more. Hydration is key.",
  visible:        true,
  compliance_flags: ["FDA_DISCLAIMER"],
};

// ─────────────────────────────────────────────────────────────────────────────
// getBotanicalDossier
// ─────────────────────────────────────────────────────────────────────────────
// Pure function. Maps a bot_id to its structured educational content.
//
// @param {string}   botId           — e.g. "BOT_001" from calculateRecommendation()
// @param {object[]} educationalData — the BOTANICAL_LIBRARY array (pre-parsed)
// @param {string[]} complianceFlags — optional array from the engine output
// @returns {object}                 — structured dossier ready for the UI

function getBotanicalDossier(botId, educationalData, complianceFlags = []) {
  if (!Array.isArray(educationalData) || educationalData.length === 0) {
    console.warn("[Dossier] educationalData is empty or invalid — using fallback.");
    return { ...GENERIC_FALLBACK };
  }

  const entry = educationalData.find(item => item.id === botId);

  if (!entry) {
    console.warn(`[Dossier] No data found for bot_id "${botId}" — using fallback.`);
    return {
      ...GENERIC_FALLBACK,
      compliance_flags: complianceFlags.length > 0
        ? complianceFlags
        : GENERIC_FALLBACK.compliance_flags,
    };
  }

  // Map the four BOTANICAL_LIBRARY slugs to named output fields
  return {
    bot_id:         entry.id,
    tag:            entry.tag            || "",
    title:          entry.name           || "Unknown Botanical",
    alchemist_fact: entry.function       || GENERIC_FALLBACK.alchemist_fact,
    dossier_text:   entry.essence        || GENERIC_FALLBACK.dossier_text,
    serving_wisdom: entry.feeling        || GENERIC_FALLBACK.serving_wisdom,
    safety_note:    entry.protocol       || GENERIC_FALLBACK.safety_note,
    visible:        entry.visible !== false,
    compliance_flags: complianceFlags.length > 0
      ? complianceFlags
      : ["FDA_DISCLAIMER"],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// getRandomBotanicalFact
// ─────────────────────────────────────────────────────────────────────────────
// Returns a random alchemist_fact for the Sommelier loading screen.
// Only pulls from botanicals with visible: true so hidden items stay hidden.
//
// @param {object[]} educationalData — the BOTANICAL_LIBRARY array
// @returns {{ fact: string, botanical_name: string }}

function getRandomBotanicalFact(educationalData) {
  const fallback = {
    fact:           "Every botanical carries a frequency. The Alchemist is calibrating yours.",
    botanical_name: "The Alchemist",
  };

  if (!Array.isArray(educationalData) || educationalData.length === 0) {
    return fallback;
  }

  const visible = educationalData.filter(item => item.visible !== false && item.function);
  if (visible.length === 0) return fallback;

  const pick = visible[Math.floor(Math.random() * visible.length)];
  return {
    fact:           pick.function || fallback.fact,
    botanical_name: pick.name     || "The Alchemist",
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// BotanicalDossierCard
// ─────────────────────────────────────────────────────────────────────────────
// Collapsible three-tab card for ScreenResult.
//
// Collapsed: botanical name + alchemist_fact hook + chevron.
// Expanded:  DOSSIER tab (origin + lineage)
//            EXPERIENCE tab (subjective feeling + serving guidance)
//            PROTOCOL tab (dosing + compliance flags)
//
// Props:
//   dossier     {object}  — output of getBotanicalDossier()
//   defaultOpen {boolean} — auto-expand when admin Dossier Mode is ON

function BotanicalDossierCard({ dossier, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const [tab,  setTab]  = useState("dossier");

  if (!dossier) return null;

  const tabs = [
    { id:"dossier",    label:"DOSSIER"    },
    { id:"experience", label:"EXPERIENCE" },
    { id:"protocol",   label:"PROTOCOL"   },
  ];

  return (
    <div style={{
      borderRadius:    20,
      background:      "rgba(255,255,255,0.025)",
      backdropFilter:  "blur(16px)",
      WebkitBackdropFilter:"blur(16px)",
      borderTop:       "1px solid rgba(255,255,255,0.08)",
      borderLeft:      "1px solid rgba(255,255,255,0.08)",
      borderRight:     "1px solid rgba(255,255,255,0.03)",
      borderBottom:    "1px solid rgba(255,255,255,0.03)",
      overflow:        "hidden",
      marginBottom:    16,
      animation:       "cardIn 0.4s ease both",
      transition:      "box-shadow 0.3s ease",
      boxShadow:       open ? "0 8px 32px rgba(212,175,55,0.06)" : "none",
    }}>

      {/* ── COLLAPSED HEADER — always visible ── */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width:       "100%",
          padding:     "16px 18px",
          background:  "transparent",
          border:      "none",
          cursor:      "pointer",
          display:     "flex",
          alignItems:  "flex-start",
          gap:         14,
          textAlign:   "left",
        }}>

        {/* Glyph orb */}
        <div style={{
          width:        40, height:40, borderRadius:"50%", flexShrink:0,
          background:   `radial-gradient(circle at 40% 35%, ${C.jadeEdge}, ${C.jade})`,
          border:       `1px solid ${C.goldDim}`,
          display:      "flex", alignItems:"center", justifyContent:"center",
          marginTop:    2,
          boxShadow:    open ? `0 0 16px rgba(212,175,55,0.15)` : "none",
          transition:   "box-shadow 0.3s ease",
        }}>
          <span style={{fontSize:18, pointerEvents:"none"}}>🌿</span>
        </div>

        <div style={{flex:1, minWidth:0}}>
          <div style={{
            fontFamily:    TF.mono, fontSize:6,
            color:         C.goldDim, letterSpacing:3,
            textTransform: "uppercase", marginBottom:4,
          }}>
            ✦ BOTANICAL DOSSIER · 101
          </div>
          <div style={{
            fontFamily:  TF.serif, fontStyle:"italic",
            fontSize:    18, color:C.cream,
            marginBottom:6, lineHeight:1.2,
          }}>
            {dossier.title}
          </div>
          <div style={{
            fontFamily:   TF.mono, fontSize:8,
            color:        C.muted, lineHeight:1.75,
            letterSpacing:0.5,
          }}>
            {dossier.alchemist_fact}
          </div>
        </div>

        {/* Chevron */}
        <svg
          width="16" height="16" viewBox="0 0 16 16" fill="none"
          style={{
            flexShrink:  0, marginTop:12,
            transform:   open ? "rotate(180deg)" : "rotate(0deg)",
            transition:  "transform 0.25s ease",
            pointerEvents:"none",
          }}>
          <path
            d="M3 6l5 5 5-5"
            stroke={C.goldMuted}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"/>
        </svg>
      </button>

      {/* ── EXPANDED PANEL ── */}
      {open && (
        <div style={{animation:"screenIn 0.25s ease both"}}>

          {/* Tab bar */}
          <div style={{
            display:  "flex",
            gap:      4,
            padding:  "0 14px 12px",
          }}>
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  flex:         1,
                  padding:      "7px 0",
                  borderRadius: 10,
                  border:       "none",
                  background:   tab === t.id
                    ? "rgba(245,208,106,0.1)"
                    : "rgba(255,255,255,0.03)",
                  color:        tab === t.id
                    ? C.gold
                    : "rgba(255,248,230,0.25)",
                  fontFamily:   TF.mono,
                  fontSize:     7,
                  letterSpacing:2,
                  textTransform:"uppercase",
                  cursor:       "pointer",
                  boxShadow:    tab === t.id
                    ? "inset 0 0 0 1px rgba(245,208,106,0.22)"
                    : "none",
                  transition:   "all 0.2s",
                }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab content area */}
          <div style={{
            padding:    "14px 18px 18px",
            borderTop:  "1px solid rgba(255,255,255,0.05)",
          }}>

            {/* ── DOSSIER TAB — origin, lineage, traditional use ── */}
            {tab === "dossier" && (
              <div style={{animation:"screenIn 0.2s ease both"}}>
                <div style={{
                  fontFamily:    TF.mono, fontSize:6,
                  color:         C.goldDim, letterSpacing:3,
                  textTransform: "uppercase", marginBottom:10,
                }}>
                  ORIGIN & LINEAGE
                </div>
                <p style={{
                  fontFamily:  TF.serif, fontStyle:"italic",
                  fontSize:    13, color:C.muted,
                  lineHeight:  1.85, margin:0,
                }}>
                  {dossier.dossier_text}
                </p>

                {/* Alchemist fact pull-quote */}
                <div style={{
                  marginTop:    16, padding:"12px 14px",
                  borderLeft:   `2px solid ${C.goldDim}`,
                  background:   "rgba(212,175,55,0.04)",
                  borderRadius: "0 10px 10px 0",
                }}>
                  <div style={{
                    fontFamily:    TF.mono, fontSize:6,
                    color:         C.goldDim, letterSpacing:2,
                    textTransform: "uppercase", marginBottom:5,
                  }}>
                    ALCHEMIST'S NOTE
                  </div>
                  <p style={{
                    fontFamily:   TF.mono, fontSize:9,
                    color:        C.gold, lineHeight:1.75,
                    margin:       0, letterSpacing:0.3,
                  }}>
                    {dossier.alchemist_fact}
                  </p>
                </div>
              </div>
            )}

            {/* ── EXPERIENCE TAB — feeling + serving wisdom ── */}
            {tab === "experience" && (
              <div style={{animation:"screenIn 0.2s ease both"}}>
                <div style={{
                  fontFamily:    TF.mono, fontSize:6,
                  color:         C.goldDim, letterSpacing:3,
                  textTransform: "uppercase", marginBottom:10,
                }}>
                  WHAT TO EXPECT
                </div>
                <p style={{
                  fontFamily:  TF.serif, fontStyle:"italic",
                  fontSize:    13, color:C.muted,
                  lineHeight:  1.85, marginBottom:16,
                }}>
                  {dossier.serving_wisdom}
                </p>

                {/* Serving guide badge */}
                <div style={{
                  padding:    "10px 14px",
                  borderRadius:12,
                  background: "rgba(127,255,212,0.04)",
                  border:     "1px solid rgba(127,255,212,0.12)",
                  display:    "flex",
                  alignItems: "flex-start",
                  gap:        10,
                }}>
                  <span style={{fontSize:14, flexShrink:0, marginTop:1, pointerEvents:"none"}}>⚗️</span>
                  <div>
                    <div style={{
                      fontFamily:    TF.mono, fontSize:6,
                      color:         "rgba(127,255,212,0.5)",
                      letterSpacing: 2, textTransform:"uppercase",
                      marginBottom:  4,
                    }}>
                      SERVING PROTOCOL
                    </div>
                    <p style={{
                      fontFamily:   TF.mono, fontSize:8,
                      color:        "rgba(127,255,212,0.75)",
                      lineHeight:   1.75, margin:0,
                      letterSpacing:0.3,
                    }}>
                      {dossier.safety_note}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ── PROTOCOL TAB — dosing, safety, compliance flags ── */}
            {tab === "protocol" && (
              <div style={{animation:"screenIn 0.2s ease both"}}>
                <div style={{
                  fontFamily:    TF.mono, fontSize:6,
                  color:         C.goldDim, letterSpacing:3,
                  textTransform: "uppercase", marginBottom:10,
                }}>
                  DOSING & SAFETY
                </div>
                <p style={{
                  fontFamily:  TF.serif, fontStyle:"italic",
                  fontSize:    13, color:C.muted,
                  lineHeight:  1.85, marginBottom:16,
                }}>
                  {dossier.safety_note}
                </p>

                {/* Compliance flags */}
                {dossier.compliance_flags?.length > 0 && (
                  <div style={{
                    padding:     "12px 14px",
                    borderRadius:12,
                    background:  "rgba(255,68,68,0.04)",
                    border:      "1px solid rgba(255,68,68,0.14)",
                  }}>
                    <div style={{
                      fontFamily:    TF.mono, fontSize:6,
                      color:         "rgba(255,100,100,0.5)",
                      letterSpacing: 2, textTransform:"uppercase",
                      marginBottom:  8,
                    }}>
                      ⚠ COMPLIANCE NOTICES
                    </div>
                    {dossier.compliance_flags.map(flag => (
                      <div key={flag} style={{
                        display:      "flex",
                        alignItems:   "flex-start",
                        gap:          8,
                        marginBottom: 8,
                      }}>
                        <span style={{
                          fontFamily:   TF.mono, fontSize:6,
                          color:        C.amber, letterSpacing:1,
                          textTransform:"uppercase",
                          background:   "rgba(224,122,0,0.1)",
                          border:       "1px solid rgba(224,122,0,0.2)",
                          borderRadius: 4, padding:"1px 6px",
                          flexShrink:   0, marginTop:2,
                        }}>
                          {flag.replace(/_/g," ")}
                        </span>
                        <span style={{
                          fontFamily:  TF.mono, fontSize:7,
                          color:       "rgba(255,248,230,0.25)",
                          lineHeight:  1.7,
                        }}>
                          {COMPLIANCE_LABELS[flag] || flag}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LoadingBotanicalFact
// ─────────────────────────────────────────────────────────────────────────────
// Mounts on ScreenSommelier while the typewriter is running and the engine
// is calculating. Cycles a new alchemist_fact every 3 seconds.
//
// Props:
//   educationalData {object[]} — the BOTANICAL_LIBRARY array

function LoadingBotanicalFact({ educationalData }) {
  const [current, setCurrent] = useState(
    () => getRandomBotanicalFact(educationalData)
  );
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const id = setInterval(() => {
      // Fade out, swap, fade back in
      setVisible(false);
      setTimeout(() => {
        setCurrent(getRandomBotanicalFact(educationalData));
        setVisible(true);
      }, 300);
    }, 3200);
    return () => clearInterval(id);
  }, [educationalData]);

  return (
    <div style={{
      padding:     "12px 16px",
      borderRadius:14,
      background:  "rgba(255,255,255,0.025)",
      border:      "1px solid rgba(255,255,255,0.06)",
      marginBottom:16,
      animation:   "screenIn 0.4s ease both",
    }}>
      <div style={{
        fontFamily:    TF.mono, fontSize:6,
        color:         C.goldDim, letterSpacing:3,
        textTransform: "uppercase", marginBottom:6,
      }}>
        ALCHEMIST ARCHIVE — WHILE YOU WAIT
      </div>
      <p style={{
        fontFamily:   TF.mono, fontSize:9,
        color:        C.gold, lineHeight:1.75,
        margin:       0, letterSpacing:0.3,
        opacity:      visible ? 1 : 0,
        transition:   "opacity 0.3s ease",
      }}>
        "{current.fact}"
      </p>
      <div style={{
        fontFamily:    TF.mono, fontSize:6,
        color:         C.goldDim, letterSpacing:2,
        textTransform: "uppercase", marginTop:6,
        opacity:       visible ? 1 : 0,
        transition:    "opacity 0.3s ease",
      }}>
        — {current.botanical_name} · 101
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// INTEGRATION NOTES FOR YOUR DEVELOPER
// ─────────────────────────────────────────────────────────────────────────────
//
// 1. PHASE 1 (now) — bot_id bridging
//    The current inventory uses "k1", "k2", "kr1" etc.
//    BOTANICAL_LIBRARY uses "BOT_001", "BOT_002" etc.
//    Add this mapping until Firestore unifies the IDs in Phase 2:
//
//    const INVENTORY_TO_BOT = {
//      k1:  "BOT_001",   // Fijian Noble    → Kava Core
//      k2:  "BOT_001",   // Vanuatu Borogu  → Kava Core (same 101, different batch)
//      k3:  "BOT_002",   // Tongan Pride    → Kava Heavy
//      kr1: "BOT_002",   // Red Relax       → Kratom Core (red vein profile)
//      kr2: "BOT_002",   // Green Focus     → Kratom Core (green vein profile)
//      c1:  null,        // cocktails have no botanical 101 — fallback fires
//      c2:  null,
//    };
//
// 2. WIRING INTO ScreenResult (BulaBaseKiosk.jsx)
//
//    function ScreenResult({ state, speaking, glowActive, lastLine, idleLine, dispatch }) {
//      const botId  = INVENTORY_TO_BOT[state.recommendedId] ?? state.recommendedId;
//      const dossier = getBotanicalDossier(botId, BOTANICAL_LIBRARY);
//
//      return (
//        <div>
//          {/* ... WizardVision, pour card ... */}
//
//          <BotanicalDossierCard
//            dossier={dossier}
//            defaultOpen={state.isDossierMode}
//          />
//        </div>
//      );
//    }
//
// 3. WIRING INTO ScreenSommelier (loading state)
//    Inside the Glass card, while done === false:
//
//    {!done && <LoadingBotanicalFact educationalData={BOTANICAL_LIBRARY}/>}
//
// 4. PHASE 2 (Firestore)
//    Replace BOTANICAL_LIBRARY with a fetched array:
//    const educationalData = await fetchFirestoreCollection("botanical_library");
//    Everything else is unchanged — the functions are pure.

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

export {
  getBotanicalDossier,
  getRandomBotanicalFact,
  BotanicalDossierCard,
  LoadingBotanicalFact,
  GENERIC_FALLBACK,
  COMPLIANCE_LABELS,
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    getBotanicalDossier,
    getRandomBotanicalFact,
    GENERIC_FALLBACK,
    COMPLIANCE_LABELS,
  };
}
