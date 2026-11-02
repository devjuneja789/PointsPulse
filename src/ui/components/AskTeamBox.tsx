import React, { useState } from 'react';

interface AskTeamBoxProps {
  scriptId: string;
  eventIndex: number;
  lang: 'EN' | 'HI';
}

export const AskTeamBox: React.FC<AskTeamBoxProps> = ({ scriptId, eventIndex, lang }) => {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [source, setSource] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const suggestedQuestions = lang === 'EN'
    ? ['Who is at risk?', 'How did Bumrah score?', 'Who is yet to bat?', 'Catch me up on the match']
    : ['Kaun risk par hai?', 'Bumrah ke points kaise mile?', 'Kiski batting bachi hai?', 'Mujhe match recap do'];

  const handleSubmit = async (qText?: string) => {
    const q = (qText || question).trim();
    if (!q || loading) return;

    setLoading(true);
    setAnswer(null);

    try {
      const resp = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scriptId,
          eventIndex,
          lang,
          question: q,
        }),
      });

      if (resp.ok) {
        const data = await resp.json();
        setAnswer(data.answer);
        setSource(data.source);
      } else {
        setAnswer(
          lang === 'EN'
            ? 'Unable to connect to assistant. Please try again.'
            : 'Assistant se connect nahi ho paya. Kripya dubara koshish karein.'
        );
        setSource('fallback');
      }
    } catch {
      setAnswer(
        lang === 'EN'
          ? 'Unable to connect to assistant. Please try again.'
          : 'Assistant se connect nahi ho paya. Kripya dubara koshish karein.'
      );
      setSource('fallback');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      data-testid="ask-team-section"
      style={{
        padding: '0 16px 16px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-muted)' }}>
          {lang === 'EN' ? 'Ask About My Team' : 'Team Ke Baare Me Poochein'}
        </h2>
        <span style={{ fontSize: '10px', color: 'var(--text-subtle)', backgroundColor: 'var(--bg-card)', padding: '2px 6px', borderRadius: '4px' }}>
          Grounded AI
        </span>
      </div>

      <div
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '12px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        {/* Suggested Quick Question Chips */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {suggestedQuestions.map((sug, i) => (
            <button
              key={i}
              data-testid={`suggested-q-${i}`}
              onClick={() => {
                setQuestion(sug);
                handleSubmit(sug);
              }}
              style={{
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--text-muted)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-full)',
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: 600,
              }}
            >
              {sug}
            </button>
          ))}
        </div>

        {/* Input & Submit */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          style={{ display: 'flex', gap: '8px' }}
        >
          <input
            data-testid="ask-input"
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={lang === 'EN' ? 'Ask anything about your 11...' : 'Apni team ke bare me kuch bhi poochein...'}
            maxLength={140}
            style={{
              flex: 1,
              backgroundColor: 'var(--bg-surface)',
              color: 'var(--text-main)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '8px 12px',
              fontSize: '12px',
            }}
          />
          <button
            data-testid="btn-ask-submit"
            type="submit"
            disabled={loading || !question.trim()}
            style={{
              backgroundColor: 'var(--brand-red)',
              color: '#fff',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              padding: '0 14px',
              fontSize: '12px',
              fontWeight: 700,
              opacity: loading || !question.trim() ? 0.6 : 1,
            }}
          >
            {loading ? '...' : lang === 'EN' ? 'Ask' : 'Bhejo'}
          </button>
        </form>

        {/* Answer Box if present */}
        {answer && (
          <div
            data-testid="ask-answer-box"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 12px',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--gold)', letterSpacing: '0.4px' }}>
                ANSWER
              </span>
              <span style={{ fontSize: '9px', color: 'var(--text-subtle)' }}>
                {source === 'live' ? '⚡ AI-generated' : '🤖 Grounded snapshot'}
              </span>
            </div>
            <p style={{ fontSize: '12.5px', color: 'var(--text-main)', lineHeight: 1.4 }}>
              {answer}
            </p>
          </div>
        )}

        {/* Privacy Hint */}
        <div style={{ fontSize: '10px', color: 'var(--text-subtle)', textAlign: 'center' }}>
          {lang === 'EN'
            ? 'Demo Q&A grounded on match data. Do not enter personal information.'
            : 'Demo Q&A match data par aadharit hai. Kripya niji jankari na dalein.'}
        </div>
      </div>
    </section>
  );
};
