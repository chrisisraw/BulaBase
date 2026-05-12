import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { Sparkles, Mail, Phone, User, ChevronRight } from 'lucide-react';

/**
 * BULA_BASE KERNEL v4.2.3 - ST. AUGUSTINE MASTER
 * UPDATES: 4-Pillar Vibe, Email Field, Strict Validation, UI Hover Fix
 */

const BULA_CONFIG = {
  locationId: "ST_AUGUSTINE_TROY_01",
  branding: {
    primary: "#DEFF9A", 
    background: "#091A11", 
    ritual: "#F5D06A" 
  },
  fonts: {
    serif: "'Crimson Text', serif",
    mono: "'JetBrains Mono', monospace"
  }
};

const C = BULA_CONFIG.branding;
const TF = BULA_CONFIG.fonts;

const KIOSK_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Crimson+Text:wght@400;700&family=JetBrains+Mono:wght@400;700&display=swap');
  * { -webkit-user-select: none; user-select: none; touch-action: manipulation; box-sizing: border-box; }
  body { background: ${C.background}; color: white; font-family: ${TF.serif}; margin: 0; overflow: hidden; }
  .bula-btn { 
    transition: all 0.2s ease; 
    cursor: pointer; 
    border: 1px solid rgba(222,255,154,0.3);
  }
  .bula-btn:hover { 
    background: rgba(222,255,154,0.15) !important; 
    border-color: ${C.primary} !important;
    transform: translateY(-2px);
  }
  .bula-btn:active { transform: scale(0.98); }
  .glow-ring { border: 2px solid ${C.ritual}; border-radius: 50%; position: absolute; animation: pulse 2s infinite; }
  @keyframes pulse { 0% { transform: scale(1); opacity: 0.8; } 100% { transform: scale(1.5); opacity: 0; } }
  input:focus { outline: none; border-color: ${C.primary} !important; background: rgba(255,255,255,0.1) !important; }
`;

export function BulaBaseApp() {
  const [screen, setScreen] = useState('GATE');
  const [actionId, setActionId] = useState(null);
  const [glowActive, setGlowActive] = useState(false);
  const [lead, setLead] = useState({ name: '', phone: '', email: '' });
  const [errors, setErrors] = useState({});

  // Auto-transition for Gideon Wizard
  useEffect(() => {
    if (screen === 'SOMMELIER') {
      const timer = setTimeout(() => setScreen('RESULT'), 4000);
      return () => clearTimeout(timer);
    }
  }, [screen]);

  const validate = () => {
    let e = {};
    if (lead.name.length < 2) e.name = true;
    if (!/^\d{10}$/.test(lead.phone.replace(/\D/g,''))) e.phone = true;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) e.email = true;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleReset = () => {
    setScreen('GATE');
    setGlowActive(false);
    setLead({ name: '', phone: '', email: '' });
  };

  return (
    <div id="bula-kiosk-root">
      <style>{KIOSK_CSS}</style>

      {screen === 'GATE' && (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <h1 style={{ color: C.ritual, fontSize: '5rem', fontWeight: 'bold' }}>BULA BASE</h1>
          <button className="bula-btn" onClick={() => { setActionId(crypto.randomUUID().slice(0,8)); setScreen('QUIZ'); }}
            style={{ padding: '20px 60px', background: 'none', color: C.primary, borderRadius: '50px', fontWeight: 'bold' }}>
            BEGIN RITUAL
          </button>
        </div>
      )}

      {screen === 'QUIZ' && (
        <div style={{ padding: '60px', maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{ color: C.primary, fontSize: '3rem', marginBottom: '40px' }}>HOW IS YOUR SPIRIT?</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {['RADIANT', 'STEADY', 'SEEKING', 'HEAVY'].map(vibe => (
              <button key={vibe} className="bula-btn" onClick={() => setScreen('LEAD')} 
                style={{ padding: '60px 20px', background: 'rgba(255,255,255,0.05)', color: 'white', borderRadius: '20px', fontSize: '1.5rem', fontWeight: 'bold' }}>
                {vibe}
              </button>
            ))}
          </div>
        </div>
      )}

      {screen === 'LEAD' && (
        <div style={{ padding: '60px', maxWidth: '500px', margin: '0 auto', display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100vh' }}>
          <h2 style={{ color: C.ritual, fontSize: '2.5rem', marginBottom: '20px' }}>IDENTIFY</h2>
          <div style={{ display: 'grid', gap: '15px' }}>
            <div style={{ position: 'relative' }}>
              <input style={{ width: '100%', padding: '20px', background: 'rgba(255,255,255,0.05)', border: `1px solid ${errors.name ? '#ff4444' : 'rgba(255,255,255,0.1)'}`, borderRadius: '15px', color: 'white' }} 
                placeholder="Full Name" value={lead.name} onChange={e => setLead({...lead, name: e.target.value})} />
            </div>
            <input style={{ width: '100%', padding: '20px', background: 'rgba(255,255,255,0.05)', border: `1px solid ${errors.phone ? '#ff4444' : 'rgba(255,255,255,0.1)'}`, borderRadius: '15px', color: 'white' }} 
              placeholder="Phone (10 digits)" type="tel" value={lead.phone} onChange={e => setLead({...lead, phone: e.target.value})} />
            <input style={{ width: '100%', padding: '20px', background: 'rgba(255,255,255,0.05)', border: `1px solid ${errors.email ? '#ff4444' : 'rgba(255,255,255,0.1)'}`, borderRadius: '15px', color: 'white' }} 
              placeholder="Email Address" type="email" value={lead.email} onChange={e => setLead({...lead, email: e.target.value})} />
            
            <button className="bula-btn" onClick={() => validate() && setScreen('SOMMELIER')} 
              style={{ padding: '20px', background: C.primary, color: C.background, borderRadius: '15px', border: 'none', fontWeight: 'bold' }}>
              CONSULT GIDEON
            </button>
          </div>
        </div>
      )}

      {screen === 'SOMMELIER' && (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glow-ring" style={{ width: '250px', height: '250px' }}></div>
          <Sparkles size={80} color={C.ritual} style={{ marginBottom: '30px' }} />
          <h2 style={{ color: C.ritual, fontFamily: TF.mono, letterSpacing: '0.3em', textAlign: 'center' }}>GIDEON IS WEAVING YOUR RITUAL...</h2>
        </div>
      )}

      {screen === 'RESULT' && (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <h2 style={{ color: C.ritual, fontSize: '3.5rem', marginBottom: '20px' }}>RITUAL READY</h2>
          <p style={{ opacity: 0.7, marginBottom: '40px' }}>Scan the seed to carry the ritual with you.</p>
          
          <div onClick={() => setScreen('MENU')} className="bula-btn" style={{ padding: '40px', background: 'white', borderRadius: '20px', cursor: 'pointer', marginBottom: '40px' }}>
            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://agensi.app/troy-kava?sid=${actionId}`} alt="Golden Seed" />
            <p style={{ color: 'black', marginTop: '15px', fontWeight: 'bold', fontSize: '0.8rem' }}>TAP QR TO VIEW MENU</p>
          </div>

          <button className="bula-btn" onClick={() => setScreen('MENU')} style={{ color: C.primary, background: 'none', border: 'none', fontSize: '1.2rem', textDecoration: 'underline' }}>
            Continue to Menu
          </button>
        </div>
      )}

      {screen === 'MENU' && (
        <div style={{ height: '100vh', padding: '60px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <h1 style={{ color: C.primary, fontSize: '3rem' }}>THE RECOMMENDATION</h1>
          <p style={{ opacity: 0.6, marginBottom: '40px' }}>CURATED FOR {lead.name.toUpperCase()}</p>
          <div style={{ padding: '60px', background: 'rgba(255,255,255,0.05)', borderRadius: '30px', border: `1px solid ${C.ritual}`, width: '100%', maxWidth: '600px' }}>
            <h2 style={{ color: C.ritual, fontSize: '4rem' }}>AMBER CLOUD</h2>
            <p style={{ fontSize: '1.5rem' }}>EARTHY · SMOOTH · MILD</p>
          </div>
          <button className="bula-btn" onClick={handleReset} style={{ marginTop: '60px', color: C.primary, background: 'none', padding: '15px 40px', borderRadius: '50px' }}>
            RESTART RITUAL
          </button>
        </div>
      )}
    </div>
  );
}

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<BulaBaseApp />);
}
