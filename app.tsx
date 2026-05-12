import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Sparkles, Moon, Sun, Wind, Coffee, Flame } from 'lucide-react';

/**
 * BULA_BASE KERNEL v4.2.5 - "THE WIZARD'S CONSULTATION"
 * UPDATES: WizardVision UI, 4-Step Logic, Swirling Aether Animation
 */

const BULA_CONFIG = {
  branding: { primary: "#DEFF9A", background: "#091A11", ritual: "#F5D06A", aether: "#6EE7B7" },
  fonts: { serif: "'Crimson Text', serif", mono: "'JetBrains Mono', monospace" }
};

const C = BULA_CONFIG.branding;
const TF = BULA_CONFIG.fonts;

const KIOSK_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Crimson+Text:wght@400;700&family=JetBrains+Mono:wght@400;700&display=swap');
  body { background: ${C.background}; color: white; font-family: ${TF.serif}; overflow: hidden; margin: 0; }
  .wizard-avatar { position: relative; width: 200px; height: 200px; margin-bottom: 20px; }
  .kava-shell { 
    width: 60px; height: 40px; background: #5D4037; border-radius: 50% 50% 10% 10%; 
    position: absolute; bottom: 20px; left: 70px; z-index: 2;
  }
  .pulse-glow {
    position: absolute; width: 100%; height: 100%; background: ${C.aether};
    filter: blur(20px); border-radius: 50%; animation: softPulse 3s infinite; opacity: 0.4;
  }
  @keyframes softPulse { 0%, 100% { transform: scale(0.8); opacity: 0.3; } 50% { transform: scale(1.2); opacity: 0.6; } }
  .aether-smoke {
    position: absolute; bottom: 50px; left: 85px; width: 30px; height: 100px;
    background: linear-gradient(to top, ${C.aether}, transparent);
    filter: blur(8px); animation: rise 2s infinite linear; opacity: 0.8;
  }
  @keyframes rise { 0% { transform: translateY(0) scaleX(1); opacity: 0; } 50% { opacity: 0.6; } 100% { transform: translateY(-100px) scaleX(2); opacity: 0; } }
  .terminal-cursor { width: 10px; height: 20px; background: ${C.ritual}; display: inline-block; animation: blink 1s infinite; }
  @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
`;

export function BulaBaseApp() {
  const [step, setStep] = useState(0); // 0: State, 1: Magic, 2: Chronos, 3: Essence, 4: Lead, 5: WizardVision
  const [actionId, setActionId] = useState(null);
  const [answers, setAnswers] = useState({});
  const [lead, setLead] = useState({ name: '', phone: '', email: '' });

  const questions = [
    { q: "How fares the spirit today?", key: "state", opts: ["RADIANT", "STEADY", "SEEKING", "HEAVY"] },
    { q: "What magic shall we brew?", key: "magic", opts: ["FOCUS", "SOCIAL", "RESET"] },
    { q: "When does your spirit shine brightest?", key: "chronos", opts: ["SUNRISE SEEKER", "MOONLIGHT DWELLER", "ALL-DAY ALCHEMIST"] },
    { q: "Which flavor profile calls to you?", key: "essence", opts: ["EARTHY", "SWEET", "BOLD"] }
  ];

  const handleNext = (val) => {
    setAnswers({ ...answers, [questions[step].key]: val });
    if (step < 3) setStep(step + 1); else setStep(4);
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <style>{KIOSK_CSS}</style>
      
      {/* WizardVision Component */}
      <div className="wizard-avatar">
        <div className={`pulse-glow ${step === 5 ? 'success-glow' : ''}`} style={step === 5 ? {background: C.ritual} : {}}></div>
        {step === 5 && <div className="aether-smoke"></div>}
        <div className="kava-shell"></div>
        <img src="https://img.icons8.com/color/200/wizard.png" alt="Wizard" style={{ position: 'relative', zIndex: 1 }} />
      </div>

      {step < 4 && (
        <div style={{ textAlign: 'center', maxWidth: '600px' }}>
          <h2 style={{ color: C.ritual, fontSize: '2rem' }}>{questions[step].q}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '30px' }}>
            {questions[step].opts.map(opt => (
              <button key={opt} onClick={() => handleNext(opt)} style={{ padding: '20px', background: 'rgba(255,255,255,0.05)', color: 'white', border: `1px solid ${C.primary}`, borderRadius: '15px', cursor: 'pointer' }}>{opt}</button>
            ))}
          </div>
        </div>
      )}

      {step === 4 && (
        <div style={{ textAlign: 'center', maxWidth: '400px' }}>
          <h2 style={{ color: C.ritual }}>SECURE YOUR PATH</h2>
          <input style={{ width: '100%', padding: '15px', margin: '10px 0', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid #333' }} placeholder="Name" onChange={e => setLead({...lead, name: e.target.value})} />
          <input style={{ width: '100%', padding: '15px', margin: '10px 0', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid #333' }} placeholder="Phone (10-digit)" onChange={e => setLead({...lead, phone: e.target.value})} />
          <input style={{ width: '100%', padding: '15px', margin: '10px 0', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid #333' }} placeholder="Email" onChange={e => setLead({...lead, email: e.target.value})} />
          <button onClick={() => { setActionId(Math.random().toString(36).substr(2, 9)); setStep(5); }} style={{ width: '100%', padding: '20px', marginTop: '20px', background: C.primary, color: C.background, fontWeight: 'bold', border: 'none', borderRadius: '10px' }}>CONSULT THE WIZARD</button>
        </div>
      )}

      {step === 5 && (
        <div style={{ textAlign: 'center', fontFamily: TF.mono }}>
          <h2 style={{ color: C.ritual }}>RITUAL_COMPLETE</h2>
          <p style={{ color: C.aether }}>VESSEL_CHARGED: {actionId.toUpperCase()}</p>
          <div className="terminal-cursor"></div>
          <p style={{ marginTop: '40px', opacity: 0.6 }}>The Wizard has spoken. Check your device for the Tribe Calendar.</p>
          <button onClick={() => setStep(0)} style={{ color: C.primary, background: 'none', border: `1px solid ${C.primary}`, padding: '10px 30px', borderRadius: '50px', marginTop: '20px' }}>RESTART RITUAL</button>
        </div>
      )}
    </div>
  );
}

const root = createRoot(document.getElementById('root'));
root.render(<BulaBaseApp />);
