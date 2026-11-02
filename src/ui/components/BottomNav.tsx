import React from 'react';

interface BottomNavProps {
  lang: 'EN' | 'HI';
}

export const BottomNav: React.FC<BottomNavProps> = ({ lang }) => {
  return (
    <div style={{ marginTop: 'auto' }}>
      {/* Legal Prototype Disclaimer */}
      <footer
        data-testid="app-disclaimer"
        style={{
          padding: '12px 16px',
          textAlign: 'center',
          fontSize: '10.5px',
          color: 'var(--text-subtle)',
          backgroundColor: 'var(--bg-app)',
          borderTop: '1px solid var(--border-subtle)',
          lineHeight: 1.4,
        }}
      >
        {lang === 'EN'
          ? 'Unofficial prototype. Not affiliated with Dream11, BCCI, IPL or any franchise. Match events and scores are simulated.'
          : 'Gair-adhikarik prototype. Dream11, BCCI ya IPL se sambandhit nahi hai. Sabhi match events simulated hain.'}
      </footer>

      {/* Decorative Bottom Navigation */}
      <nav
        data-testid="bottom-nav"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          padding: '8px 0',
          position: 'sticky',
          bottom: 0,
          zIndex: 40,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', color: 'var(--text-subtle)', fontSize: '10px' }}>
          <span style={{ fontSize: '16px' }}>🏠</span>
          <span>{lang === 'EN' ? 'Home' : 'Ghar'}</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', color: 'var(--brand-red)', fontSize: '10px', fontWeight: 700 }}>
          <span style={{ fontSize: '16px' }}>🏏</span>
          <span>{lang === 'EN' ? 'My Match' : 'Mera Match'}</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', color: 'var(--text-subtle)', fontSize: '10px' }}>
          <span style={{ fontSize: '16px' }}>🏆</span>
          <span>{lang === 'EN' ? 'Winners' : 'Vijeta'}</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', color: 'var(--text-subtle)', fontSize: '10px' }}>
          <span style={{ fontSize: '16px' }}>👥</span>
          <span>{lang === 'EN' ? 'Contests' : 'Contests'}</span>
        </div>
      </nav>
    </div>
  );
};
