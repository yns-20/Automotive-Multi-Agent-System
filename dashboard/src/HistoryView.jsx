import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, MessageSquare, Terminal, Eye, SlidersHorizontal, RefreshCw, Cpu, Activity, ShieldAlert, Car, HelpCircle } from 'lucide-react';

export default function HistoryView({ backendUrl }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [selectedSessionDetail, setSelectedSessionDetail] = useState(null);
  const [filterText, setFilterText] = useState('');
  const [filterAgent, setFilterAgent] = useState('All');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const fetchSessions = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${backendUrl}/sessions`);
        if (res.ok) {
          const data = await res.json();
          setSessions(data);
        }
      } catch (err) {
        console.error("Failed to fetch sessions", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSessions();
  }, [backendUrl, refreshTrigger]);

  useEffect(() => {
    if (!selectedSessionId) {
      setSelectedSessionDetail(null);
      return;
    }

    const fetchDetail = async () => {
      try {
        const res = await fetch(`${backendUrl}/sessions/${selectedSessionId}`);
        if (res.ok) {
          const data = await res.json();
          setSelectedSessionDetail(data);
        }
      } catch (err) {
        console.error("Failed to fetch session detail", err);
      }
    };
    fetchDetail();
  }, [selectedSessionId, backendUrl]);

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const getAgentColor = (name) => {
    switch (name.toLowerCase()) {
      case 'diagnostic': return 'var(--color-diagnostic)';
      case 'maintenance': return 'var(--color-maintenance)';
      case 'parts': return 'var(--color-parts)';
      case 'telemetry': return 'var(--color-telemetry)';
      case 'supervisor': return 'var(--color-supervisor)';
      case 'system': return 'var(--color-system)';
      default: return '#94a3b8';
    }
  };

  // Filter sessions
  const filteredSessions = sessions.filter(s => {
    const matchesText = s.query.toLowerCase().includes(filterText.toLowerCase()) || 
                        s.response.toLowerCase().includes(filterText.toLowerCase()) ||
                        s.correlation_id.toLowerCase().includes(filterText.toLowerCase());
    const matchesAgent = filterAgent === 'All' || s.agents_invoked.includes(filterAgent.toLowerCase());
    return matchesText && matchesAgent;
  });

  const formatDate = (isoStr) => {
    try {
      const date = new Date(isoStr);
      return date.toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch (e) {
      return isoStr;
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: selectedSessionId ? '1fr 480px' : '1fr', gap: '24px', height: 'calc(100vh - 120px)' }}>
      {/* Sessions list */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
        
        {/* Header and filters */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Terminal size={22} color="var(--color-primary)" /> Historique des Sessions
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Consultez et inspectez l'ensemble des requêtes traitées par l'architecture multi-agents.
            </p>
          </div>
          <button 
            onClick={handleRefresh}
            style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-color)', borderRadius: '8px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white', transition: 'all var(--transition-fast)' }}
            className="hover-glow"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            <style dangerouslySetInnerHTML={{__html: `
              @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
              .animate-spin { animation: spin 1.5s linear infinite; }
            `}} />
          </button>
        </div>

        {/* Filters control */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: '16px', padding: '16px', background: 'rgba(0, 0, 0, 0.15)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <SlidersHorizontal size={16} color="var(--text-muted)" />
            <input 
              type="text" 
              placeholder="Rechercher par mot clé, ID..." 
              value={filterText}
              onChange={e => setFilterText(e.target.value)}
              style={{ flex: 1, background: 'none', border: 'none', color: 'white', outline: 'none', fontSize: '14px' }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Agent:</label>
            <select 
              value={filterAgent}
              onChange={e => setFilterAgent(e.target.value)}
              style={{ background: 'rgba(0, 0, 0, 0.3)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '6px 10px', color: 'white', outline: 'none', fontSize: '13px', flex: 1 }}
            >
              <option value="All">Tous</option>
              <option value="Diagnostic">Diagnostic</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Parts">Pièces</option>
              <option value="Telemetry">Télémétrie</option>
            </select>
          </div>
        </div>

        {/* Sessions list */}
        {loading && sessions.length === 0 ? (
          <div style={{ margin: 'auto', color: 'var(--text-muted)', fontSize: '14px' }}>Chargement de l'historique...</div>
        ) : filteredSessions.length === 0 ? (
          <div style={{ margin: 'auto', color: 'var(--text-muted)', fontSize: '14px' }}>Aucune session correspondante.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredSessions.map(s => {
              const isActive = selectedSessionId === s.correlation_id;
              return (
                <div 
                  key={s.correlation_id}
                  onClick={() => setSelectedSessionId(isActive ? null : s.correlation_id)}
                  style={{ 
                    padding: '16px 20px', 
                    background: isActive ? 'rgba(99, 102, 241, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                    border: isActive ? '1px solid var(--color-primary)' : '1px solid var(--border-color)',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}
                  className="hover-glow"
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: 'var(--color-secondary)', fontFamily: 'monospace', fontWeight: 600 }}>
                      ID: {s.correlation_id}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={12} /> {formatDate(s.timestamp)}
                    </span>
                  </div>

                  <div style={{ fontSize: '14px', fontWeight: 600, display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                    <MessageSquare size={16} color="var(--color-primary)" style={{ marginTop: '2px', flexShrink: 0 }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.query}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '10px', fontSize: '12px' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {s.agents_invoked.length > 0 ? (
                        s.agents_invoked.map(agent => (
                          <span 
                            key={agent}
                            style={{ 
                              padding: '2px 8px', 
                              background: `${getAgentColor(agent)}15`,
                              border: `1px solid ${getAgentColor(agent)}30`,
                              color: getAgentColor(agent),
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: 600,
                              textTransform: 'uppercase'
                            }}
                          >
                            {agent}
                          </span>
                        ))
                      ) : (
                        <span style={{ padding: '2px 8px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>
                          FINISH
                        </span>
                      )}
                    </div>
                    <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} /> {s.duration_ms} ms
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail drawer (opens if selectedSessionId is present) */}
      {selectedSessionId && (
        <div className="glass-panel animate-slide-in" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto', borderLeft: '1px solid var(--color-primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Eye size={18} color="var(--color-primary)" /> Détails de l'Exécution
            </h3>
            <button 
              onClick={() => setSelectedSessionId(null)}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '16px', fontWeight: 700 }}
            >
              ✕
            </button>
          </div>

          {selectedSessionDetail ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Timing Metric Summary */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ padding: '12px', background: 'rgba(0, 0, 0, 0.25)', borderRadius: '10px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', fontWeight: 700, marginBottom: '4px' }}>DURÉE TOTALE</span>
                  <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-telemetry)' }}>
                    {(() => {
                      try {
                        const start = new Date(selectedSessionDetail.session_start);
                        const end = new Date(selectedSessionDetail.session_end);
                        return `${((end - start) / 1000).toFixed(2)}s`;
                      } catch (e) {
                        return 'N/A';
                      }
                    })()}
                  </span>
                </div>
                <div style={{ padding: '12px', background: 'rgba(0, 0, 0, 0.25)', borderRadius: '10px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', fontWeight: 700, marginBottom: '4px' }}>ÉVÉNEMENTS LOGS</span>
                  <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-primary)' }}>
                    {selectedSessionDetail.total_events}
                  </span>
                </div>
              </div>

              {/* Message Details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Requête Utilisateur</span>
                <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '13px', lineHeight: '1.5' }}>
                  {selectedSessionDetail.query || "Aucune requête enregistrée"}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Réponse Finale</span>
                <div style={{ padding: '12px 16px', background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.15)', borderRadius: '8px', fontSize: '13px', lineHeight: '1.5', color: 'var(--text-main)' }}>
                  {selectedSessionDetail.response || "Aucune réponse enregistrée"}
                </div>
              </div>

              {/* Event Timeline Traces */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Chronologie des Événements</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingLeft: '10px', borderLeft: '2px solid rgba(255,255,255,0.06)' }}>
                  {selectedSessionDetail.events.map((evt, idx) => {
                    const agentColor = getAgentColor(evt.agent);
                    return (
                      <div key={idx} style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {/* Timeline point */}
                        <div style={{ position: 'absolute', left: '-15px', top: '6px', width: '8px', height: '8px', borderRadius: '50%', background: agentColor }} />
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: agentColor, textTransform: 'capitalize' }}>
                            {evt.agent}
                          </span>
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                            {new Date(evt.timestamp).toLocaleTimeString('fr-FR')}
                          </span>
                        </div>
                        <span style={{ fontSize: '12px', color: 'var(--text-main)', wordBreak: 'break-all' }}>
                          {evt.event}
                        </span>
                        {evt.extra && (
                          <pre style={{ margin: '4px 0 0 0', background: 'rgba(0,0,0,0.4)', padding: '6px 10px', borderRadius: '6px', fontSize: '10px', fontFamily: 'monospace', color: 'var(--text-muted)', overflowX: 'auto' }}>
                            {JSON.stringify(evt.extra, null, 2)}
                          </pre>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          ) : (
            <div style={{ margin: 'auto', color: 'var(--text-muted)', fontSize: '14px' }}>Chargement des détails...</div>
          )}
        </div>
      )}
    </div>
  );
}
