/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║           BULA BASE v4.2.1 — FINAL UNIFIED BUILD                    ║
 * ║           The AgensI / Troy's Kava · St. Augustine Pilot            ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 */

import {
  useReducer, useCallback, useState, useEffect, useRef,
  createContext, useContext,
} from "react";

// ═════════════════════════════════════════════════════════════════════════════
// BULA_CONFIG
// ═════════════════════════════════════════════════════════════════════════════

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
    engine:        "web_speech",
    fallbackVoice: "Gideon-esque",
  },
};

const LOCATION_ID   = BULA_CONFIG.locationId;
const FONT_SERIF    = BULA_CONFIG.branding.fontSerif;
const FONT_MONO     = BULA_CONFIG.branding.fontMono;
const VOICE_ENGINE  = BULA_CONFIG.voice.engine;

// ═════════════════════════════════════════════════════════════════════════════
// THEME
// ═════════════════════════════════════════════════════════════════════════════

const THEME = {
  name:     "AgensI_Default",
  location: LOCATION_ID,
  brand:    "Bula Base",

  colors: {
    forest:      "#091A11",
    forestMid:   "#0D2118",
    forestEdge:  "#142B1E",
    forestDeep:  "#060F0A",

    neon:        BULA_CONFIG.branding.primaryColor,
    gold:        "#D4AF37",
    goldBright:  BULA_CONFIG.branding.ritualColor,
    goldDim:     "rgba(212,175,55,0.40)",

    indigo:      BULA_CONFIG.branding.accentColor,
    indigoDim:   "rgba(167,139,250,0.35)",

    cream:       "rgba(255,248,230,0.88)",
    muted:       "rgba(255,248,230,0.34)",
    red:         "#FF4444",
    amber:       "#E07A00",
    aether:      "#7FFFD4",

    kratom:      "#C084FC",
    cocktail:    "#38BDF8",
    food:        "#FB923C",
  },

  fonts: {
    serif: FONT_SERIF,
    mono:  FONT_MONO,
  },

  assets: { avatarURL: null },
  admin:  { pin: "8472", holdMs: 2500 },
};

const ThemeContext = createContext(THEME);
const useTheme = () => useContext(ThemeContext);

function ThemeProvider({ children, overrides = {} }) {
  const theme = { ...THEME, ...overrides, colors: { ...THEME.colors, ...overrides.colors }, fonts: { ...THEME.fonts, ...overrides.fonts } };
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

const C  = THEME.colors;
const TF = THEME.fonts;

// ═════════════════════════════════════════════════════════════════════════════
// KIOSK CSS (with waveDance fix)
// ═════════════════════════════════════════════════════════════════════════════

const KIOSK_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Crimson+Text:ital,wght@0,400;0,600;1,400;1,600&family=JetBrains+Mono:wght@400;500;700&display=swap');

  html, body {
    overscroll-behavior: none;
    position: fixed;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background-color: #091A11;
  }

  #bula-scroll {
    position: absolute;
    inset: 0;
    overflow-y: auto;
    overflow-x: hidden;
    -webkit-overflow-scrolling: touch;
    overscroll-behavior-y: contain;
    touch-action: pan-y;
  }

  * {
    -webkit-user-select: none;
    user-select: none;
    -webkit-touch-callout: none;
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
  }

  svg, img, canvas {
    -webkit-user-select: none;
    user-select: none;
    -webkit-touch-callout: none;
    pointer-events: none;
  }
  canvas.interactive, svg.interactive { pointer-events: auto; }

  #bula-scroll::-webkit-scrollbar { display: none; }

  input, textarea { -webkit-user-select: text; user-select: text; touch-action: auto; }

  .bula-btn {
    transition: transform 100ms ease, box-shadow 100ms ease, opacity 100ms ease;
    cursor: pointer;
  }
  .bula-btn.pressed, .bula-btn:active {
    transform: scale(0.97);
    opacity: 0.85;
  }
  .bula-btn-pour.pressed, .bula-btn-pour:active {
    transform: scale(0.96);
    box-shadow: 0 0 0 2px rgba(222,255,154,0.35);
  }

  #agensi-logo { cursor: default; -webkit-touch-callout: none; }
  #agensi-logo.holding { transform: scale(1.08); opacity: 0.6; }

  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes blink { 0%,49%{opacity:1} 50%,100%{opacity:0} }
  @keyframes recPulse { 0%{box-shadow:0 0 0 0 rgba(127,255,212,0.8)} 70%{box-shadow:0 0 0 7px rgba(127,255,212,0)} 100%{box-shadow:0 0 0 0 rgba(127,255,212,0)} }
  @keyframes waveDance { 0%,100% { transform: scaleY(0.6); } 50% { transform: scaleY(1.4); } }
  /* ... (all your other original keyframes remain unchanged) ... */
  @keyframes wizardBreathe { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-3px)} }
  @keyframes wizardFloat { 0%,100%{transform:translateY(0) rotate(-0.8deg)} 50%{transform:translateY(-7px) rotate(0.8deg)} }
  @keyframes wizardCelebrate { 0%,100%{transform:translateY(0) rotate(-1.5deg)} 50%{transform:translateY(-4px) rotate(1.5deg)} }
  @keyframes floorBlaze { 0%{opacity:0.35;transform:translateX(-50%) scaleX(0.8)} 100%{opacity:0.85;transform:translateX(-50%) scaleX(1.3)} }
  /* ... rest of your original animations ... */
`;

// (All other blocks — QUIZ_STATES, VIBE_QUESTIONS, BASE_INVENTORY, FSM_INIT, appReducer, resolveRecommendation, useWizardSpeech, GoldenSeedOverlay, etc. — remain exactly as you wrote them)

// ═════════════════════════════════════════════════════════════════════════════
// logShell — TRANSACTION LAYER (v1.7.2)
// ═════════════════════════════════════════════════════════════════════════════

async function logShell(item, dispatch, currentState) {
  const actionId = crypto.randomUUID();

  dispatch({
    type: "REQ_START",
    actionId,
    itemName: item.name
  });

  try {
    // ←←← YOUR CLOUD FUNCTION / FIRESTORE CALL GOES HERE ←←←
    // Example:
    // await fetch('/api/pour', { method: 'POST', body: JSON.stringify({ locationId: LOCATION_ID, actionId, item, user: currentState.user }) });

    // Simulated network delay
    await new Promise(r => setTimeout(r, 850));

    dispatch({ type: "REQ_SUCCESS" });
    return actionId;
  } catch (err) {
    dispatch({ type: "REQ_FAIL", payload: err.message || "Transaction failed" });
    throw err;
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// useWizardSpeech — with iOS unlock
// ═════════════════════════════════════════════════════════════════════════════

function useWizardSpeech({ /* ... your original props ... */ }) {
  // ... your original hook code ...

  // iOS / Safari speech unlock
  useEffect(() => {
    const unlock = () => {
      if (window.speechSynthesis) {
        const u = new SpeechSynthesisUtterance("");
        u.volume = 0;
        window.speechSynthesis.speak(u);
      }
    };
    document.addEventListener("touchstart", unlock, { once: true });
    return () => document.removeEventListener("touchstart", unlock);
  }, []);

  // ... rest of your original useWizardSpeech implementation unchanged ...
}

// ═════════════════════════════════════════════════════════════════════════════
// ROOT APP
// ═════════════════════════════════════════════════════════════════════════════

export default function BulaBaseV42() {
  const [state, dispatch] = useReducer(appReducer, FSM_INIT);
  const [showDryRun, setShowDryRun] = useState(false);

  // Guard against double RESULT_DONE
  const hasTransitioned = useRef(false);

  const handleSuccessReady = useCallback(() => {
    if (hasTransitioned.current) return;
    hasTransitioned.current = true;
    dispatch({ type: "RESULT_DONE" });
  }, []);

  const activateGideon = VOICE_ENGINE === "eleven_labs";

  const { speaking, glowActive, muted, setMuted, speakLine, lastLine, idleLine, gideonActive } =
    useWizardSpeech({
      screen: state.screen,
      quizStep: state.quizStep,
      vibes: state.vibes,
      status: state.status,
      onSuccessReady: handleSuccessReady,
      apiKey: activateGideon ? (typeof process !== "undefined" && process.env?.REACT_APP_ELEVENLABS_KEY) || null : null,
      gideonVoiceId: activateGideon ? (typeof process !== "undefined" && process.env?.REACT_APP_GIDEON_VOICE_ID) || null : null,
    });

  // Reset guard when returning to RESULT screen
  useEffect(() => {
    if (state.screen === "RESULT") hasTransitioned.current = false;
  }, [state.screen]);

  return (
    <ThemeProvider>
      <Grain />
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 0 }}>
        {/* your background gradients */}
      </div>

      <KioskShell
        state={state}
        onSoftReset={() => dispatch({ type: "NAV", payload: "GATE" })}
        onFullReset={() => dispatch({ type: "RESTART" })}
        onToggleDossier={() => dispatch({ type: "TOGGLE_DOSSIER" })}
      >
        {/* Your screen router remains the same */}

        {state.screen === "RESULT" && (
          <div style={{ animation: "screenIn 0.4s ease both" }}>
            {/* ... your RESULT screen content ... */}

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
              onSeedClose={() => dispatch({ type: "RESULT_DONE" })}
            />

            {/* ... rest of RESULT screen ... */}
          </div>
        )}

        {state.screen === "MENU" && (
          <>
            {/* ... your MENU content ... */}

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
              onSeedClose={() => dispatch({ type: "RESET" })}
            />

            {/* Example usage of logShell */}
            <div style={{ marginTop: 20 }}>
              <button
                onClick={async () => {
                  const item = state.inventory[0];
                  try {
                    await logShell(item, dispatch, state);
                  } catch (e) {
                    console.error(e);
                  }
                }}
              >
                Test Pour (logShell)
              </button>
            </div>
          </>
        )}

        {/* Dry-run harness remains */}
      </KioskShell>
    </ThemeProvider>
  );
}
