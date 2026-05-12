import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { Sparkles, Leaf, Zap, Coffee, ChevronRight, Info } from 'lucide-react';

/**
 * BULA_BASE KERNEL v4.2.4 - ST. AUGUSTINE MASTER
 * UPDATES: Full Categorized Menu, Description Cards, Hover Feedback
 */

const BULA_CONFIG = {
  locationId: "ST_AUGUSTINE_TROY_01",
  branding: { primary: "#DEFF9A", background: "#091A11", ritual: "#F5D06A", kava: "#A78BFA", kratom: "#6EE7B7", mixed: "#F472B6" },
  fonts: { serif: "'Crimson Text', serif", mono: "'JetBrains Mono', monospace" }
};

const MENU_DATA = [
  { id: 1, type: 'KAVA', name: 'Amber Cloud', desc: 'A traditional heavy hitter. Deeply relaxing with a smooth, earthy finish.', strength: 'High' },
  { id: 2, type: 'KAVA', name: 'Vanua Gold', desc: 'Island-sourced noble kava. Uplifting and social vibes.', strength: 'Medium' },
  { id: 3, type: 'KRATOM', name: 'White Lightning', desc: 'Focus and clarity. Perfect for morning rituals or deep work.', strength: 'High' },
  { id: 4, type: 'KRATOM', name: 'Red Dragon', desc: 'Soothing and heavy. Ideal for winding down after the festival.', strength: 'High' },
  { id: 5, type: 'MIXED', name: 'The Bula Breeze', desc: 'Kava base with pineapple and coconut. A St. Augustine favorite.', strength: 'Mild' },
  { id: 6, type: 'MIXED', name: 'Gideon’s Tea', desc: 'Kratom infused with local honey and ginger.', strength: 'Medium' },
];

const C = BULA_CONFIG.branding;
const TF = BULA_CONFIG.fonts;

const KIOSK_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Crimson+Text:wght@400;700&family=JetBrains+Mono:wght@400;700&display=swap');
  * { -webkit-user-select: none; user-select: none; touch-action: manipulation; box-sizing: border-box; }
  body { background: ${C.background}; color: white; font-family: ${TF.serif}; margin: 0; overflow-y: auto; }
  .bula-btn { transition: all 0.2s ease; cursor: pointer; border: 1px solid rgba(222,255,154,0.3); }
  .bula-btn:hover { background: rgba(222,255,154,0.15) !important; border-color: ${C.primary} !important; }
  .menu-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); transition: 0.3s; }
  .menu-card:hover { border-color: ${C.ritual}; background: rgba(255,255,255,0.07); }
  input:focus { outline: none; border-color: ${C.primary} !important; }
`;

export function BulaBaseApp() {
  const [screen, setScreen] = useState('GATE');
  const [actionId, setActionId] = useState(null);
  const [lead, setLead] = useState({ name: '', phone: '', email: '' });
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    if (screen === 'SOMMELIER') {
      const timer = setTimeout(() => setScreen('RESULT'), 3000);
      return () => clearTimeout(timer);
    }
  }, [screen]);

  const validate = () => {
    const p = lead.phone.replace(/\D/g,'');
    const e = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email);
    if (lead.name.length > 1 && p.length === 10 && e) return true;
    alert("Please enter a valid Name, 10-digit Phone, and Email.");
    return false;
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
          <h2 style={{ color: C.primary, fontSize: '3rem', textAlign: 'center' }}>HOW IS YOUR SPIRIT?</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '40px' }}>
            {['RADIANT', 'STEADY', 'SEEKING', 'HEAVY'].map(vibe => (
              <button key={vibe} className="bula-btn" onClick={() => setScreen('LEAD')} 
                style={{ padding: '60px 20px', background: 'rgba(255,255,255,0.05)', color: 'white', borderRadius: '20px', fontSize: '1.5rem', fontWeight: 'bold' }}>{vibe}</button>
            ))}
          </div>
        </div>
      )}

      {screen === 'LEAD' && (
        <div style={{ padding: '60px', maxWidth: '500px', margin: '0 auto', display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100vh' }}>
          <h2 style={{ color: C.ritual, fontSize: '2.5rem', marginBottom: '20px' }}>IDENTIFY</h2>
          <div style={{ display: 'grid', gap: '15px' }}>
            <input style={{ padding: '20px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '15px', color: 'white' }} placeholder="Full Name" onChange={e => setLead({...lead, name: e.target.value})} />
            <input style={{ padding: '20px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '15px', color: 'white' }} placeholder="Phone (10 digits)" type="tel" onChange={e => setLead({...lead, phone: e.target.value})} />
            <input style={{ padding: '20px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '15px', color: 'white' }} placeholder="Email Address" type="email" onChange={e => setLead({...lead, email: e.target.value})} />
            <button className="bula-btn" onClick={() => validate() && setScreen('SOMMELIER')} style={{ padding: '20px', background: C.primary, color: C.background, borderRadius: '15px', border: 'none', fontWeight: 'bold' }}>CONSULT GIDEON</button>
          </div>
        </div>
      )}

      {screen === 'SOMMELIER' && (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <Sparkles size={80} color={C.ritual} style={{ animation: 'spin 4s linear infinite' }} />
          <h2 style={{ color: C.ritual, fontFamily: TF.mono, letterSpacing: '0.3em', marginTop: '30px' }}>CONSULTING THE ROOTS...</h2>
        </div>
      )}

      {screen === 'RESULT' && (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <h2 style={{ color: C.ritual, fontSize: '3.5rem' }}>RITUAL COMPLETE</h2>
          <div className="bula-btn" onClick={() => setScreen('MENU')} style={{ padding: '30px', background: 'white', borderRadius: '20px', margin: '40px 0' }}>
            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=https://agensi.app/troy-kava?sid=${actionId}`} alt="QR" />
            <p style={{ color: 'black', marginTop: '10px', fontWeight: 'bold', fontSize: '0.7rem' }}>TAP TO OPEN MENU</p>
          </div>
          <button className="bula-btn" onClick={() => setScreen('MENU')} style={{ padding: '15px 40px', background: 'none', color: C.primary, borderRadius: '50px' }}>EXPLORE ALL OPTIONS</button>
        </div>
      )}

      {screen === 'MENU' && (
        <div style={{ minHeight: '100vh', padding: '40px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
            <h1 style={{ color: C.primary, fontSize: '2.5rem' }}>THE MENU</h1>
            <button className="bula-btn" onClick={() => setScreen('GATE')} style={{ padding: '10px 20px', background: 'none', color: 'white', borderRadius: '10px' }}>EXIT</button>
          </div>
          
          <div style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
            {['ALL', 'KAVA', 'KRATOM', 'MIXED'].map(t => (
              <button key={t} onClick={() => setFilter(t)} style={{ padding: '10px 25px', borderRadius: '50px', border: 'none', background: filter === t ? C.primary : 'rgba(255,255,255,0.1)', color: filter === t ? C.background : 'white', fontWeight: 'bold', cursor: 'pointer' }}>{t}</button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {MENU_DATA.filter(i => filter === 'ALL' || i.type === filter).map(item => (
              <div key={item.id} className="menu-card" style={{ padding: '30px', borderRadius: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.7rem', color: C[item.type.toLowerCase()], fontFamily: TF.mono }}>{item.type}</span>
                  <span style={{ fontSize: '0.7rem', opacity: 0.5 }}>STRENGTH: {item.strength}</span>
                </div>
                <h3 style={{ fontSize: '2rem', color: C.ritual, margin: '10px 0' }}>{item.name}</h3>
                <p style={{ opacity: 0.8, lineHeight: '1.6' }}>{item.desc}</p>
              </div>
            ))}
          </div>
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
