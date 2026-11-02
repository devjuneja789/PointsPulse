import { useEffect, useState } from 'react';

interface HealthResponse {
  status: string;
  uptime: number;
  timestamp: string;
  llmMode: string;
  version: string;
}

export default function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState<'EN' | 'HI'>('EN');

  useEffect(() => {
    fetch('/api/health')
      .then((res) => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then((data: HealthResponse) => {
        setHealth(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Health check failed:', err);
        setLoading(false);
      });
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Sticky Match Header */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          backgroundColor: '#0f172a',
          padding: '12px 16px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <span
            style={{
              backgroundColor: 'var(--accent-red)',
              color: '#fff',
              fontSize: '11px',
              fontWeight: 700,
              padding: '2px 6px',
              borderRadius: '4px',
              marginRight: '8px',
              letterSpacing: '0.5px',
            }}
          >
            SIMULATED
          </span>
          <span style={{ fontSize: '13px', fontWeight: 600 }}>MUM vs CHE</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: health ? 'var(--accent-green)' : '#ef4444',
              display: 'inline-block',
            }}
          />
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            {loading ? 'Connecting...' : health ? 'Server OK' : 'Offline'}
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Score & Delta Card */}
        <div
          style={{
            backgroundColor: 'var(--bg-card)',
            borderRadius: '12px',
            padding: '16px',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                My Fantasy Team
              </div>
              <div style={{ fontSize: '32px', fontWeight: 800, marginTop: '4px' }}>
                412.5 <span style={{ fontSize: '16px', fontWeight: 500, color: 'var(--text-secondary)' }}>pts</span>
              </div>
            </div>
            <div
              style={{
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                color: 'var(--accent-green)',
                padding: '6px 12px',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '16px',
              }}
            >
              ▲ +38
            </div>
          </div>
        </div>

        {/* Explanation Card */}
        <div
          style={{
            backgroundColor: 'var(--bg-card)',
            borderRadius: '12px',
            padding: '16px',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-gold)', textTransform: 'uppercase' }}>
              Why It Changed
            </span>
            <div style={{ display: 'flex', gap: '4px', backgroundColor: '#0f172a', padding: '2px', borderRadius: '6px' }}>
              <button
                onClick={() => setLang('EN')}
                style={{
                  background: lang === 'EN' ? 'var(--accent-red)' : 'transparent',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '3px 8px',
                  fontSize: '11px',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                EN
              </button>
              <button
                onClick={() => setLang('HI')}
                style={{
                  background: lang === 'HI' ? 'var(--accent-red)' : 'transparent',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '3px 8px',
                  fontSize: '11px',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Hinglish
              </button>
            </div>
          </div>
          <p style={{ fontSize: '14px', lineHeight: 1.5, color: 'var(--text-primary)' }}>
            {lang === 'EN'
              ? 'Jasprit Bumrah bowled Ruturaj Gaikwad (+25 wicket, +8 bowled bonus = 33 pts). Applied 2x Captain multiplier = +66 pts.'
              : 'Jasprit Bumrah ne Ruturaj Gaikwad ko bowled out kiya (+25 wicket, +8 bowled bonus = 33 pts). Captain 2x multiplier lagakar total +66 pts mile.'}
          </p>
        </div>

        {/* Phase 0 System Status */}
        <div
          style={{
            backgroundColor: '#0f172a',
            borderRadius: '12px',
            padding: '16px',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>Phase 0: Foundation Status</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div>API Status: {loading ? 'Checking...' : health?.status || 'Error'}</div>
            <div>LLM Mode: {health?.llmMode || 'Initializing'}</div>
            <div>Server Uptime: {health ? `${Math.floor(health.uptime)}s` : '-'}</div>
            <div>App Version: {health?.version || '0.1.0'}</div>
          </div>
        </div>
      </main>

      {/* Footer Disclaimer */}
      <footer
        style={{
          padding: '16px',
          textAlign: 'center',
          fontSize: '11px',
          color: 'var(--text-secondary)',
          borderTop: '1px solid var(--border-subtle)',
          backgroundColor: '#0f172a',
        }}
      >
        Unofficial prototype. Not affiliated with Dream11, BCCI, IPL or any franchise. Match events are simulated.
      </footer>
    </div>
  );
}
