import React, { useState, useEffect } from 'react';
import { Cpu, Terminal, BarChart3, AlertCircle, CheckCircle } from 'lucide-react';
import ChatTest from './ChatTest';
import MetricsView from './MetricsView';
import HistoryView from './HistoryView';

const BACKEND_URL ="http://localhost:8000";

export default function App() {
  const [activeTab, setActiveTab] = useState('chat');
  const [backendOnline, setBackendOnline] = useState(false);
  const [checkingBackend, setCheckingBackend] = useState(true);
  const [refreshHistoryTrigger, setRefreshHistoryTrigger] = useState(0);

  // Check backend server status
  const checkBackendStatus = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/`);
      if (response.ok) {
        setBackendOnline(true);
      } else {
        setBackendOnline(false);
      }
    } catch (err) {
      setBackendOnline(false);
    } finally {
      setCheckingBackend(false);
    }
  };

  useEffect(() => {
    checkBackendStatus();
    // Periodically ping backend
    const interval = setInterval(checkBackendStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleNewSession = () => {
    // Notify components to update session counts or histories
    setRefreshHistoryTrigger(prev => prev + 1);
  };

  return (
    <div className="dashboard-container">
      
      {/* Sidebar Navigation */}
      <aside 
        style={{ 
          width: '260px', 
          background: 'rgba(6, 10, 19, 0.9)', 
          backdropFilter: 'blur(20px)',
          borderRight: '1px solid var(--border-color)', 
          padding: '24px', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '32px',
          height: '100vh',
          position: 'sticky',
          top: 0
        }}
      >
        {/* Brand Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-glow)' }}>
            <Cpu size={22} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: 800, fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', background: 'linear-gradient(to right, #ffffff, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>AutoMAS</h1>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Agent Console</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          <button 
            onClick={() => setActiveTab('chat')}
            style={{ 
              background: activeTab === 'chat' ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
              border: 'none',
              borderColor: activeTab === 'chat' ? 'var(--color-primary)' : 'transparent',
              borderLeft: activeTab === 'chat' ? '3px solid var(--color-primary)' : '3px solid transparent',
              borderRadius: activeTab === 'chat' ? '0 8px 8px 0' : '8px',
              padding: '12px 16px',
              color: activeTab === 'chat' ? 'white' : 'var(--text-muted)',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              textAlign: 'left',
              transition: 'all var(--transition-fast)'
            }}
            className="hover-glow"
          >
            <Cpu size={18} color={activeTab === 'chat' ? 'var(--color-primary)' : 'var(--text-muted)'} />
            <span>Console de Test</span>
          </button>

          <button 
            onClick={() => setActiveTab('metrics')}
            style={{ 
              background: activeTab === 'metrics' ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
              border: 'none',
              borderLeft: activeTab === 'metrics' ? '3px solid var(--color-primary)' : '3px solid transparent',
              borderRadius: activeTab === 'metrics' ? '0 8px 8px 0' : '8px',
              padding: '12px 16px',
              color: activeTab === 'metrics' ? 'white' : 'var(--text-muted)',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              textAlign: 'left',
              transition: 'all var(--transition-fast)'
            }}
            className="hover-glow"
          >
            <BarChart3 size={18} color={activeTab === 'metrics' ? 'var(--color-primary)' : 'var(--text-muted)'} />
            <span>Performances</span>
          </button>

          <button 
            onClick={() => setActiveTab('history')}
            style={{ 
              background: activeTab === 'history' ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
              border: 'none',
              borderLeft: activeTab === 'history' ? '3px solid var(--color-primary)' : '3px solid transparent',
              borderRadius: activeTab === 'history' ? '0 8px 8px 0' : '8px',
              padding: '12px 16px',
              color: activeTab === 'history' ? 'white' : 'var(--text-muted)',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              textAlign: 'left',
              transition: 'all var(--transition-fast)'
            }}
            className="hover-glow"
          >
            <Terminal size={18} color={activeTab === 'history' ? 'var(--color-primary)' : 'var(--text-muted)'} />
            <span>Historique</span>
          </button>
        </nav>

        {/* Footer Backend Status Indicator */}
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          {checkingBackend ? (
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fbbf24' }} />
          ) : backendOnline ? (
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-telemetry)', boxShadow: '0 0 8px var(--color-telemetry)' }} />
          ) : (
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 8px #ef4444' }} />
          )}
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: '11px', display: 'block', fontWeight: 700 }}>API Serveur</span>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
              {checkingBackend ? 'Connexion...' : backendOnline ? 'En ligne (Port 8000)' : 'Hors ligne'}
            </span>
          </div>
        </div>
      </aside>

      {/* Main Panel Content */}
      <main style={{ flex: 1, padding: '40px', display: 'flex', flexDirection: 'column', gap: '24px', overflowY: 'auto' }}>
        
        {/* Connection Offline Warning Banner */}
        {!checkingBackend && !backendOnline && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '12px', padding: '16px 20px', color: '#fca5a5' }} className="animate-slide-in">
            <AlertCircle size={20} />
            <div style={{ fontSize: '13px', lineHeight: '1.4' }}>
              <strong>API Backend Hors Ligne :</strong> Impossible d'interagir avec l'application. Pour démarrer le backend, exécutez la commande <code>uvicorn api:app --reload</code> depuis le répertoire racine du projet.
            </div>
          </div>
        )}

        {/* View Routing */}
        {activeTab === 'chat' && (
          <ChatTest backendUrl={BACKEND_URL} onNewSession={handleNewSession} />
        )}
        {activeTab === 'metrics' && (
          <MetricsView backendUrl={BACKEND_URL} />
        )}
        {activeTab === 'history' && (
          <HistoryView backendUrl={BACKEND_URL} key={refreshHistoryTrigger} />
        )}
      </main>
    </div>
  );
}
