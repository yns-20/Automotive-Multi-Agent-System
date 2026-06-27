import React, { useState, useEffect } from 'react';
import { Send, Car, Activity, ShieldAlert, Cpu, CheckCircle2, ChevronRight, HelpCircle } from 'lucide-react';

const SUGGESTIONS = [
  { text: "J'ai un code OBD P0300 et mon moteur vibre au ralenti", category: "diagnostic" },
  { text: "À quel kilométrage dois-je faire la prochaine vidange ?", category: "maintenance" },
  { text: "Quelle référence pour les plaquettes de frein avant ?", category: "parts" },
  { text: "Température moteur de 115°C et liquide de refroidissement bas", category: "telemetry" }
];

const DEFAULT_VEHICLE = {
  marque: "Renault",
  modele: "Clio IV",
  annee: 2019,
  kilometrage: 85000,
  motorisation: "1.5 dCi 90ch"
};

export default function ChatTest({ backendUrl, onNewSession }) {
  const [query, setQuery] = useState('');
  const [vehicle, setVehicle] = useState(DEFAULT_VEHICLE);
  const [loading, setLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [activeTrace, setActiveTrace] = useState(null);
  const [activeCorrelationId, setActiveCorrelationId] = useState(null);
  const [error, setError] = useState(null);

  const handleSuggestClick = (text) => {
    setQuery(text);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setVehicle(prev => ({
      ...prev,
      [name]: name === 'annee' || name === 'kilometrage' ? Number(value) : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim() || loading) return;

    const userMessage = query.trim();
    setQuery('');
    setLoading(true);
    setError(null);
    setActiveTrace(null);
    setActiveCorrelationId(null);

    // Add user message to chat UI
    const newUserMsg = { id: Date.now(), sender: 'user', text: userMessage };
    setChatHistory(prev => [...prev, newUserMsg]);

    try {
      const response = await fetch(`${backendUrl}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: userMessage,
          vehicle_context: vehicle
        })
      });

      if (!response.ok) {
        throw new Error(`Erreur API (${response.status})`);
      }

      const data = await response.json();
      
      // Add agent message to chat
      const agentMsg = {
        id: Date.now() + 1,
        sender: 'agent',
        text: data.response,
        correlationId: data.correlation_id,
        history: data.agent_history
      };

      setChatHistory(prev => [...prev, agentMsg]);
      setActiveCorrelationId(data.correlation_id);
      
      // Notify parent to refresh session list
      if (onNewSession) {
        onNewSession();
      }
    } catch (err) {
      setError(err.message);
      setChatHistory(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'error',
        text: `Désolé, une erreur est survenue lors de la communication avec l'agent : ${err.message}`
      }]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch full trace details whenever a correlation id is set
  useEffect(() => {
    if (!activeCorrelationId) return;

    const fetchTrace = async () => {
      try {
        const res = await fetch(`${backendUrl}/sessions/${activeCorrelationId}`);
        if (res.ok) {
          const detail = await res.json();
          setActiveTrace(detail);
        }
      } catch (err) {
        console.error("Failed to fetch session detail trace", err);
      }
    };

    // Give the backend a brief moment to finish logging
    const timer = setTimeout(fetchTrace, 200);
    return () => clearTimeout(timer);
  }, [activeCorrelationId, backendUrl]);

  // Map agent name to color and label
  const getAgentInfo = (name) => {
    switch (name.toLowerCase()) {
      case 'supervisor':
        return { label: 'Supervisor', color: 'var(--color-supervisor)', icon: Cpu };
      case 'diagnostic':
        return { label: 'Diagnostic Agent', color: 'var(--color-diagnostic)', icon: ShieldAlert };
      case 'maintenance':
        return { label: 'Maintenance Agent', color: 'var(--color-maintenance)', icon: Activity };
      case 'parts':
        return { label: 'Parts Agent', color: 'var(--color-parts)', icon: Car };
      case 'telemetry':
        return { label: 'Telemetry Agent', color: 'var(--color-telemetry)', icon: Activity };
      case 'system':
        return { label: 'System', color: 'var(--color-system)', icon: Cpu };
      default:
        return { label: name, color: '#94a3b8', icon: HelpCircle };
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px', height: 'calc(100vh - 120px)' }}>
      {/* Sidebar: Vehicle Context Configurations */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
        <h3 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
          <Car size={20} color="var(--color-primary)" /> Contexte Véhicule
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>MARQUE</label>
            <input 
              name="marque" 
              value={vehicle.marque} 
              onChange={handleInputChange}
              style={{ background: 'rgba(0, 0, 0, 0.25)', border: '1px solid var(--border-color)', padding: '10px 12px', borderRadius: '8px', color: 'white', fontSize: '14px', outline: 'none' }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>MODÈLE</label>
            <input 
              name="modele" 
              value={vehicle.modele} 
              onChange={handleInputChange}
              style={{ background: 'rgba(0, 0, 0, 0.25)', border: '1px solid var(--border-color)', padding: '10px 12px', borderRadius: '8px', color: 'white', fontSize: '14px', outline: 'none' }}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>ANNÉE</label>
              <input 
                type="number"
                name="annee" 
                value={vehicle.annee} 
                onChange={handleInputChange}
                style={{ background: 'rgba(0, 0, 0, 0.25)', border: '1px solid var(--border-color)', padding: '10px 12px', borderRadius: '8px', color: 'white', fontSize: '14px', outline: 'none' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>KILOMÉTRAGE</label>
              <input 
                type="number"
                name="kilometrage" 
                value={vehicle.kilometrage} 
                onChange={handleInputChange}
                style={{ background: 'rgba(0, 0, 0, 0.25)', border: '1px solid var(--border-color)', padding: '10px 12px', borderRadius: '8px', color: 'white', fontSize: '14px', outline: 'none' }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>MOTORISATION</label>
            <input 
              name="motorisation" 
              value={vehicle.motorisation} 
              onChange={handleInputChange}
              style={{ background: 'rgba(0, 0, 0, 0.25)', border: '1px solid var(--border-color)', padding: '10px 12px', borderRadius: '8px', color: 'white', fontSize: '14px', outline: 'none' }}
            />
          </div>
        </div>

        <div style={{ marginTop: 'auto', background: 'rgba(99, 102, 241, 0.05)', borderRadius: '12px', border: '1px dashed rgba(99, 102, 241, 0.2)', padding: '12px', fontSize: '12px', lineHeight: '1.5', color: 'var(--text-muted)' }}>
          <strong style={{ color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>Info Pro</strong>
          Le contexte défini ci-dessus sera automatiquement injecté aux agents lors du traitement de la requête.
        </div>
      </div>

      {/* Main Panel: Chat Input & Visual Trace Flow */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Chat History Area */}
        <div className="glass-panel" style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', minHeight: '300px' }}>
          {chatHistory.length === 0 ? (
            <div style={{ margin: 'auto', textAlign: 'center', maxWidth: '500px', display: 'flex', flexDirection: 'column', gap: '24px', padding: '20px' }}>
              <div className="pulsing-glow" style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                <Cpu size={32} color="white" />
              </div>
              <div>
                <h2 style={{ fontSize: '24px', marginBottom: '8px' }}>Testez le Système Multi-Agents</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.6' }}>
                  Sélectionnez une requête suggérée ci-dessous ou saisissez votre propre question technique. Le superviseur aiguillera automatiquement la demande vers l'agent adéquat.
                </p>
              </div>

              {/* suggestions */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px', textAlign: 'left' }}>
                {SUGGESTIONS.map((s, idx) => (
                  <button 
                    key={idx}
                    onClick={() => handleSuggestClick(s.text)}
                    style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '12px 16px', color: 'var(--text-main)', fontSize: '13px', cursor: 'pointer', textAlign: 'left', transition: 'all var(--transition-fast)', display: 'flex', alignItems: 'center', gap: '12px' }}
                    className="hover-glow"
                  >
                    <span style={{ fontSize: '8px', width: '8px', height: '8px', borderRadius: '50%', background: s.category === 'diagnostic' ? 'var(--color-diagnostic)' : s.category === 'maintenance' ? 'var(--color-maintenance)' : s.category === 'parts' ? 'var(--color-parts)' : 'var(--color-telemetry)' }} />
                    <span style={{ flex: 1 }}>{s.text}</span>
                    <ChevronRight size={14} color="var(--text-muted)" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {chatHistory.map((msg) => (
                <div 
                  key={msg.id}
                  style={{ 
                    alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '85%',
                    background: msg.sender === 'user' ? 'var(--color-primary)' : msg.sender === 'error' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                    border: msg.sender === 'error' ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid var(--border-color)',
                    padding: '16px 20px',
                    borderRadius: msg.sender === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    color: msg.sender === 'user' ? 'white' : 'var(--text-main)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    position: 'relative'
                  }}
                  className="animate-slide-in"
                >
                  {/* Sender indicator */}
                  <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', color: msg.sender === 'user' ? 'rgba(255, 255, 255, 0.7)' : 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: 700 }}>
                    {msg.sender === 'user' ? 'Utilisateur' : msg.sender === 'error' ? 'Erreur Système' : 'Assistant Automobile'}
                  </span>
                  
                  {/* Message body */}
                  <div style={{ fontSize: '14px', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                    {msg.text}
                  </div>

                  {/* Message footer with correlation metadata */}
                  {msg.correlationId && (
                    <div style={{ display: 'flex', gap: '12px', marginTop: '12px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '8px', fontSize: '11px', color: 'var(--text-muted)' }}>
                      <span>ID: <code style={{ color: 'var(--color-secondary)' }}>{msg.correlationId.substring(0, 8)}...</code></span>
                      {msg.history && (
                        <span>Parcours: <strong style={{ color: 'var(--text-main)' }}>{msg.history.join(' → ')}</strong></span>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div style={{ alignSelf: 'flex-start', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', padding: '16px 20px', borderRadius: '16px 16px 16px 4px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Analyse du superviseur en cours...</span>
                  <style dangerouslySetInnerHTML={{__html: `
                    @keyframes spin { to { transform: rotate(360deg); } }
                  `}} />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Dynamic Trace Flow Visualizer */}
        {activeTrace && (
          <div className="glass-panel animate-slide-in" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h4 style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Activity size={16} color="var(--color-primary)" /> Trace de Routage LangGraph
            </h4>

            {/* SVG/HTML visualizer of the route */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', overflowX: 'auto', padding: '10px 0' }}>
              
              {/* Step 1: User Request Node */}
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '8px', minWidth: '130px' }}>
                <CheckCircle2 size={16} color="var(--color-primary)" />
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', fontWeight: 600 }}>DÉPART</span>
                  <span style={{ fontSize: '12px', fontWeight: 700 }}>Utilisateur</span>
                </div>
              </div>

              <ChevronRight size={16} color="var(--text-muted)" />

              {/* Step 2: Supervisor Routing Node */}
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--color-primary)', borderRadius: '8px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '8px', minWidth: '130px', boxShadow: '0 0 10px rgba(99, 102, 241, 0.15)' }}>
                <Cpu size={16} color="var(--color-primary)" />
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', fontWeight: 600 }}>ROUTAGE</span>
                  <span style={{ fontSize: '12px', fontWeight: 700 }}>Superviseur</span>
                </div>
              </div>

              <ChevronRight size={16} color="var(--text-muted)" />

              {/* Step 3: Targeted Agent Node */}
              {activeTrace.agents_invoked && activeTrace.agents_invoked.length > 0 ? (
                activeTrace.agents_invoked.map((agentName, idx) => {
                  const info = getAgentInfo(agentName);
                  const IconComponent = info.icon;
                  return (
                    <React.Fragment key={idx}>
                      <div style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${info.color}`, borderRadius: '8px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '8px', minWidth: '150px', boxShadow: `0 0 10px ${info.color}25` }}>
                        <IconComponent size={16} color={info.color} />
                        <div>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', fontWeight: 600 }}>AGENT</span>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: info.color }}>{info.label}</span>
                        </div>
                      </div>
                      <ChevronRight size={16} color="var(--text-muted)" />
                    </React.Fragment>
                  );
                })
              ) : (
                <React.Fragment>
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid #ef4444', borderRadius: '8px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '8px', minWidth: '150px' }}>
                    <ShieldAlert size={16} color="#ef4444" />
                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', fontWeight: 600 }}>ROUTE</span>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#ef4444' }}>FINISH (Direct)</span>
                    </div>
                  </div>
                  <ChevronRight size={16} color="var(--text-muted)" />
                </React.Fragment>
              )}

              {/* Step 4: Finish Response Node */}
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--color-telemetry)', borderRadius: '8px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '8px', minWidth: '130px' }}>
                <CheckCircle2 size={16} color="var(--color-telemetry)" />
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', fontWeight: 600 }}>STATUT</span>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-telemetry)' }}>Terminé</span>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Text Area Form Input */}
        <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <input 
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Posez une question sur le véhicule (ex: Plaquettes de frein, voyant allumé...)"
            disabled={loading}
            style={{ 
              flex: 1,
              background: 'rgba(0, 0, 0, 0.2)',
              border: '1px solid var(--border-color)',
              borderRadius: '10px',
              padding: '14px 18px',
              color: 'white',
              fontSize: '14px',
              outline: 'none',
              transition: 'border-color var(--transition-fast)'
            }}
            onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
            onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
          />
          <button 
            type="submit" 
            disabled={loading || !query.trim()}
            style={{ 
              background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
              border: 'none',
              borderRadius: '10px',
              width: '48px',
              height: '48px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              opacity: loading || !query.trim() ? 0.6 : 1,
              transition: 'all var(--transition-fast)',
              boxShadow: loading || !query.trim() ? 'none' : '0 4px 12px rgba(99, 102, 241, 0.3)'
            }}
          >
            <Send size={18} color="white" />
          </button>
        </form>

      </div>
    </div>
  );
}
