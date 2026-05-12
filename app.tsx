import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  Sparkles, Leaf, Wind, Moon, Sun, 
  ChevronRight, Volume2, VolumeX, RefreshCcw 
} from 'lucide-react';

/**
 * BULA_BASE KERNEL v4.2.2 - ST. AUGUSTINE MASTER
 * STATUS: AUTO-TRANSITION UPDATED
 */

// --- 1. CONFIG & THEME ---
const BULA_CONFIG = {
  locationId: "ST_AUGUSTINE_TROY_01",
  branding: {
    primary: "#DEFF9A", 
    background: "#091A11", 
    accent: "#A78BFA",
    ritual: "#F5D06A" 
  },
  fonts: {
    serif: "'Crimson Text', serif",
    mono: "'JetBrains Mono', monospace"
  }
};

const C = BULA_CONFIG.branding;
const TF = BULA_CONFIG.fonts;

// --- 2. THE KIOSK CSS ---
const KIOSK_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Crimson+Text:wght@400;700&family=JetBrains+Mono:wght@400;700&display=swap');
  * { -webkit-user-select: none; user-select: none; touch-action: manipulation; }
  body { background: ${C.background}; color: white; font-family: ${TF.serif}; margin: 0; overflow: hidden; }
  .glow-ring { border: 2px solid ${C.ritual}; border-radius: 50%; position: absolute; animation: pulse 2s infinite; }
  @keyframes pulse { 0% { transform: scale(1); opacity: 0.8; } 100% { transform: scale(1.5); opacity: 0; } }
`;

// --- 3. COMPONENTS ---
const GoldenSeedOverlay = ({ actionId, glowActive, onSeedClose }) => {
  const frozenURL = useRef(null);
  useEffect(() => {
    if (glowActive && !frozenURL.current && actionId) {
      frozenURL.current = `https://agensi.app/troy-kava?sid=${actionId}&loc=${BULA_CONFIG.locationId}`;
    }
  }, [glowActive, actionId]);

  if (!glowActive) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(9, 26, 17, 0.95)', zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ padding: '30px', background: C.ritual, borderRadius: '20px', boxShadow: `0 0 50px ${C.ritual}` }}>
        <div style={{ width: '250px', height: '250px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '10px' }}>
           <p style={{ color: 'black', fontFamily: TF.mono, fontSize: '10px', wordBreak: 'break-all' }}>{frozenURL.current}</p>
        </div>
      </div>
      <button onClick={onSeedClose} style={{ marginTop: '40px', padding: '15px 40px', background: C.primary, color: C.background, border: 'none', borderRadius: '50px', fontWeight: 'bold' }}>
        CONTINUE TO MENU
      </button>
    </div>
  );
};

// --- 4. MAIN APPLICATION ---
export function BulaBaseApp() {
  const [screen, setScreen] = useState('GATE');
  const [actionId, setActionId] = useState(null);
  const [glowActive, setGlowActive] = useState(false);
  const [lead, setLead] = useState({ name: '', phone: '', email: '' });

  // Auto-transition logic for Gideon
  useEffect(() => {
    if (screen === 'SOMMELIER') {
      const timer = setTimeout(() => {
        setScreen('RESULT');
      }, 3500); // 3.5 seconds of "consulting"
      return () => clearTimeout(timer);
    }
  }, [screen]);

  const handleReset = useCallback(() => {
    setScreen('GATE');
    setGlowActive(false);
    setLead({ name: '', phone: '', email: '' });
  }, []);

  return (
    <div id="bula-kiosk-root">
      <style>{KIOSK_CSS}</style>

      {screen === 'GATE' && (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: `radial-gradient(circle at center, #1a2e1f 0%, ${C.background} 100%)` }}>
          <h1 style={{ color: C.ritual, fontSize: '5rem', fontWeight: 'bold', letterSpacing: '-0.05em' }}>BULA BASE</h1>
          <p style={{ color: C.primary, fontFamily: TF.mono, marginBottom: '40px', letterSpacing: '0.5em' }}>ST. AUGUSTINE PILOT</p>
          <button 
            onClick={() => { setActionId(crypto.randomUUID()); setScreen('QUIZ'); }}
            style={{ padding: '20px 60px', background: 'none', border: `2px solid ${C.primary}`, color: C.primary, borderRadius: '50px', cursor: 'pointer', fontSize: '1.2rem', fontWeight: 'bold' }}
          >
            BEGIN RITUAL
          </button>
        </div>
      )}

      {screen === 'QUIZ' && (
        <div style={{ padding: '60px', maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{ color: C.primary, fontSize: '3rem', marginBottom: '40px' }}>HOW IS YOUR SPIRIT TODAY?</h2>
          <div style={{ display: 'grid', gap: '20px' }}>
            {['RADIANT', 'STEADY', 'SEEKING', 'HEAVY'].map(vibe => (
              <button key={vibe} onClick={() => setScreen('LEAD')} style={{ padding: '40px', background: 'rgba(255,255,255,0.05)', border: `1px solid rgba(222,255,154,0.3)`, color: 'white', textAlign: 'left', borderRadius: '20px', fontSize: '1.5rem' }}>
                {vibe}
              </button>
            ))}
          </div>
        </div>
      )}

      {screen === 'LEAD' && (
        <div style={{ padding: '60px', maxWidth: '500px', margin: '0 auto', display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100vh' }}>
          <h2 style={{ color: C.ritual, fontSize: '2.5rem', marginBottom: '20px' }}>IDENTIFY</h2>
          <p style={{ opacity: 0.7, marginBottom: '30px' }}>Gideon needs your coordinates to finalize the brew.</p>
          <div style={{ display: 'grid', gap: '15px' }}>
            <input style={{ padding: '20px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '15px', color: 'white' }} placeholder="Name" onChange={e => setLead({...lead, name: e.target.value})} />
            <input style={{ padding: '20px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '15px', color: 'white' }} placeholder="Phone" onChange={e => setLead({...lead, phone: e.target.value})} />
            <div style={{ padding: '15px', background: 'rgba(222,255,154,0.05)', borderRadius: '10px', fontSize: '10px', color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>
              BY CONTINUING, I CONSENT TO RITUAL UPDATES AND SMS FROM BULA BASE & JC RIDESHARE.
            </div>
            <button onClick={() => setScreen('SOMMELIER')} style={{ padding: '20px', background: C.primary, color: C.background, borderRadius: '15px', border: 'none', fontWeight: 'bold', fontSize: '1.1rem' }}>
              CONSULT GIDEON
            </button>
          </div>
        </div>
      )}

      {screen === 'SOMMELIER' && (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glow-ring" style={{ width: '250px', height: '250px' }}></div>
          <Sparkles size={64} color={C.ritual} style={{ marginBottom: '20px' }} />
          <p style={{ color: C.primary, fontFamily: TF.mono, letterSpacing: '0.2em' }}>GIDEON IS CONSULTING THE ROOTS...</p>
        </div>
      )}

      {screen === 'RESULT' && (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <h2 style={{ color: C.ritual, fontSize: '3rem', marginBottom: '40px' }}>RITUAL COMPLETE</h2>
          <button onClick={() => setGlowActive(true)} style={{ padding: '30px 80px', background: C.ritual, color: C.background, borderRadius: '50px', border: 'none', fontWeight: 'bold', fontSize: '1.5rem' }}>
            REVEAL GOLDEN SEED
          </button>
          <GoldenSeedOverlay glowActive={glowActive} actionId={actionId} onSeedClose={() => setScreen('MENU')} />
        </div>
      )}

      {screen === 'MENU' && (
        <div style={{ height: '100vh', padding: '60px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <h1 style={{ color: C.primary, fontSize: '3rem', marginBottom: '10px' }}>THE SELECTION</h1>
          <p style={{ opacity: 0.6, marginBottom: '40px' }}>FOR {lead.name.toUpperCase() || 'THE TRAVELER'}</p>
          <div style={{ padding: '60px', background: 'rgba(255,255,255,0.05)', borderRadius: '30px', border: `1px solid ${C.ritual}33`, width: '100%', maxWidth: '600px' }}>
            <h2 style={{ color: C.ritual, fontSize: '4rem', marginBottom: '10px' }}>AMBER CLOUD</h2>
            <p style={{ fontSize: '1.5rem', letterSpacing: '0.3em' }}>EARTHY · SMOOTH · MILD</p>
          </div>
          <button onClick={handleReset} style={{ marginTop: '60px', color: C.primary, background: 'none', border: `1px solid ${C.primary}`, padding: '15px 40px', borderRadius: '50px' }}>
            NEW TRAVELER
          </button>
        </div>
      )}

      <div style={{ position: 'fixed', bottom: 0, width: '100%', padding: '15px', background: 'rgba(0,0,0,0.4)', color: 'white', fontSize: '10px', fontFamily: TF.mono, textAlign: 'center', opacity: 0.5 }}>
        LOC: {BULA_CONFIG.locationId} | VER: 4.2.2 | SID: {actionId || 'PENDING'}
      </div>
    </div>
  );
}

// --- 5. THE IGNITION ---
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<BulaBaseApp />);
}
