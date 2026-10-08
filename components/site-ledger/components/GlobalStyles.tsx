export function GlobalStyles() {
	return (
		<style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=IBM+Plex+Mono:wght@400;500;600;700&display=swap');
        .sl-root {
          --bg: #0d324d;
        //   --bg: #1c1b19;
          --bg-raised: #0d324d;
          --bg-card: #0d324d;
        //   --bg-raised: #26241f;
        //   --bg-card: #2c2a24;
          --line: #fff;
        //   --line: #3d3a33;
          --yellow: #f4c430;
          --yellow-dim: #d1a927;
          --orange: #ff6b35;
          --green: #9fd13a;
          --text: #f3efe6;
          --text-dim: #fff;
          color: var(--text);
          background: var(--bg);
        }
        .sl-display { font-family: 'Bebas Neue', sans-serif; letter-spacing: 0.03em; }
        .sl-noise {
          background-image: radial-gradient(circle at 1px 1px, #ffffff8 1px, transparent 0);
          background-size: 3px 3px;
        }
        .sl-keypad-btn { transition: transform 0.06s ease, background 0.12s ease; }
        .sl-keypad-btn:active { transform: scale(0.94); background: var(--line); }
        .sl-chip { transition: all 0.12s ease; }
        .sl-sheet-enter { animation: slUp 0.28s cubic-bezier(.2,.8,.2,1); }
        @keyframes slUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .sl-fade-enter { animation: slFade 0.2s ease; }
        @keyframes slFade { from { opacity: 0; } to { opacity: 1; } }
        .sl-row-enter { animation: slRow 0.25s ease; }
        @keyframes slRow { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .sl-spin { animation: slSpin 0.8s linear infinite; }
        @keyframes slSpin { to { transform: rotate(360deg); } }
        .sl-scrollbar-none::-webkit-scrollbar { display: none; }
        .sl-pulse { animation: slPulse 1.4s ease-out infinite; }
        @keyframes slPulse { 0% { box-shadow: 0 0 0 0 rgba(244,196,48,0.55); } 100% { box-shadow: 0 0 0 22px rgba(244,196,48,0); } }
      `}</style>
	);
}
