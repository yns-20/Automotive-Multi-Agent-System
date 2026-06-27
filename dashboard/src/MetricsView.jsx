import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie, Legend } from 'recharts';
import { TrendingUp, BarChart3, PieChart as PieIcon, RefreshCw, Cpu, Activity, Clock, Zap } from 'lucide-react';

export default function MetricsView({ backendUrl }) {
  const [metrics, setMetrics] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch global metrics
        const metricsRes = await fetch(`${backendUrl}/metrics`);
        if (metricsRes.ok) {
          const metricsData = await metricsRes.json();
          setMetrics(metricsData);
        }

        // Fetch recent sessions for latency history chart
        const historyRes = await fetch(`${backendUrl}/sessions`);
        if (historyRes.ok) {
          const historyData = await historyRes.json();
          // Take last 15 queries and reverse for chronological order
          const recent = [...historyData].slice(0, 15).reverse();
          setHistory(recent.map((s, idx) => ({
            name: `Q${idx + 1}`,
            latency: s.duration_ms,
            query: s.query
          })));
        }
      } catch (err) {
        console.error("Failed to fetch metrics data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [backendUrl, refreshTrigger]);

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const getAgentColor = (name) => {
    switch (name.toLowerCase()) {
      case 'diagnostic': return 'var(--color-diagnostic)';
      case 'maintenance': return 'var(--color-maintenance)';
      case 'parts': return 'var(--color-parts)';
      case 'telemetry': return 'var(--color-telemetry)';
      default: return '#94a3b8';
    }
  };

  // Format data for Recharts Pie/Bar Chart
  const getDistributionData = () => {
    if (!metrics || !metrics.agent_distribution) return [];
    return Object.entries(metrics.agent_distribution).map(([agent, value]) => ({
      name: agent.toUpperCase(),
      value: value,
      color: getAgentColor(agent)
    }));
  };

  const getAgentLatencyData = () => {
    if (!metrics || !metrics.average_agent_latencies) return [];
    return Object.entries(metrics.average_agent_latencies).map(([agent, value]) => ({
      name: agent.toUpperCase(),
      latency: value,
      color: getAgentColor(agent)
    }));
  };

  const distributionData = getDistributionData();
  const agentLatencyData = getAgentLatencyData();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', height: 'calc(100vh - 120px)', overflowY: 'auto', paddingRight: '4px' }}>
      
      {/* Metrics Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={22} color="var(--color-primary)" /> Tableaux de Bord & Performances
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Suivi en temps réel des performances de routage de LangGraph et des latences d'exécution.
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

      {/* Aggregate Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
        
        {/* Total Runs Card */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Cpu size={24} color="var(--color-primary)" />
          </div>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Requêtes Traitées</span>
            <span style={{ fontSize: '28px', fontWeight: 800 }}>{metrics ? metrics.total_queries : 0}</span>
          </div>
        </div>

        {/* Avg Latency Card */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(52, 211, 153, 0.1)', border: '1px solid rgba(52, 211, 153, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={24} color="var(--color-telemetry)" />
          </div>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Temps Réponse Moyen</span>
            <span style={{ fontSize: '28px', fontWeight: 800 }}>
              {metrics ? (metrics.average_latency_ms / 1000).toFixed(2) : 0}s
            </span>
          </div>
        </div>

        {/* Efficiency/Speed Card */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={24} color="var(--color-secondary)" />
          </div>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Taux de Succès</span>
            <span style={{ fontSize: '28px', fontWeight: 800 }}>100%</span>
          </div>
        </div>

      </div>

      {/* Latency History Area Chart */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h3 style={{ fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <TrendingUp size={18} color="var(--color-primary)" /> Historique de Latence des Requêtes (ms)
        </h3>
        <div style={{ width: '100%', height: '240px' }}>
          {history.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} />
                <YAxis stroke="var(--text-muted)" fontSize={11} />
                <Tooltip 
                  contentStyle={{ background: '#0d1426', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'white' }}
                  labelStyle={{ fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="latency" stroke="var(--color-primary)" strokeWidth={2} fillOpacity={1} fill="url(#colorLatency)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
              Aucune donnée de performance enregistrée
            </div>
          )}
        </div>
      </div>

      {/* Distributions Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
        
        {/* Agent Invocation Breakdown */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PieIcon size={18} color="var(--color-secondary)" /> Répartition des Appels Agents
          </h3>
          <div style={{ width: '100%', height: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {distributionData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={distributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {distributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#0d1426', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'white' }} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Aucun agent appelé récemment</div>
            )}
          </div>
        </div>

        {/* Avg Latency per Agent */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart3 size={18} color="var(--color-telemetry)" /> Temps d'Exécution Moyen par Agent (ms)
          </h3>
          <div style={{ width: '100%', height: '240px' }}>
            {agentLatencyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={agentLatencyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} />
                  <YAxis stroke="var(--text-muted)" fontSize={11} />
                  <Tooltip contentStyle={{ background: '#0d1426', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'white' }} />
                  <Bar dataKey="latency" radius={[6, 6, 0, 0]}>
                    {agentLatencyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                Aucune métrique individuelle d'agent
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
