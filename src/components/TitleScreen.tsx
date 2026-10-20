import React from 'react';
import { Play, Volume2, VolumeX, SkipForward } from 'lucide-react';
import { sounds } from '../utils/audio.ts';

interface TitleScreenProps {
  onStartGame: () => void;
  hasExistingSave: boolean;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onResetGame: () => void;
}

const scenes = [
  { art: '🌱', glow: 'rgba(74,222,128,.22)', background: 'radial-gradient(ellipse at 50% 65%, #14532d 0%, #07140d 44%, #020503 100%)', scale: 0.82 },
  { art: '🪴', glow: 'rgba(132,204,22,.24)', background: 'radial-gradient(ellipse at 50% 65%, #166534 0%, #052e16 38%, #020503 100%)', scale: 0.98 },
  { art: '🌿', glow: 'rgba(52,211,153,.28)', background: 'radial-gradient(ellipse at 50% 65%, #047857 0%, #064e3b 35%, #020503 100%)', scale: 1.12 },
  { art: '🏭', glow: 'rgba(16,185,129,.2)', background: 'radial-gradient(ellipse at 50% 60%, #134e4a 0%, #111827 48%, #020503 100%)', scale: 1.16 },
  { art: '⚙️', glow: 'rgba(163,230,53,.22)', background: 'radial-gradient(ellipse at 50% 60%, #365314 0%, #052e16 42%, #020503 100%)', scale: 1.08 },
  { art: '📦', glow: 'rgba(251,191,36,.2)', background: 'radial-gradient(ellipse at 50% 60%, #78350f 0%, #064e3b 42%, #020503 100%)', scale: 1.08 },
  { art: '🏪', glow: 'rgba(74,222,128,.25)', background: 'radial-gradient(ellipse at 50% 60%, #166534 0%, #052e16 42%, #020503 100%)', scale: 1.16 },
  { art: '👑', glow: 'rgba(190,242,100,.32)', background: 'radial-gradient(ellipse at 50% 55%, #166534 0%, #052e16 35%, #020503 100%)', scale: 1.22 },
];

const leaves = Array.from({ length: 28 }, (_, i) => ({
  left: (i * 37 + 5) % 100,
  delay: -((i * 0.73) % 9),
  duration: 6 + ((i * 13) % 7),
  size: 14 + ((i * 7) % 18),
  sway: i % 2 === 0 ? 'leaf-sway-a' : 'leaf-sway-b',
  rotate: (i * 47) % 360,
  opacity: 0.3 + ((i * 11) % 6) / 10,
}));

export const TitleScreen: React.FC<TitleScreenProps> = ({ onStartGame, hasExistingSave, soundEnabled, onToggleSound, onResetGame }) => {
  const [sceneIndex, setSceneIndex] = React.useState(0);
  const [storyFinished, setStoryFinished] = React.useState(false);
  const [started, setStarted] = React.useState(false);
  const scene = scenes[sceneIndex];

  const finish = React.useCallback(() => {
    if (started) return;
    setStarted(true);
    sounds.playHarvest();
    onStartGame();
  }, [onStartGame, started]);

  React.useEffect(() => {
    if (storyFinished) return;
    const timer = window.setInterval(() => {
      setSceneIndex((current) => {
        if (current >= scenes.length - 1) {
          window.clearInterval(timer);
          setStoryFinished(true);
          return current;
        }
        return current + 1;
      });
    }, 1750);
    return () => window.clearInterval(timer);
  }, [storyFinished]);

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setStoryFinished(true);
      } else if (event.key === ' ' || event.key === 'Enter') {
        if (storyFinished) {
          event.preventDefault();
          finish();
        } else {
          setStoryFinished(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [finish, storyFinished]);

  return (
    <div className="relative w-full h-full min-h-0 overflow-hidden select-none text-white" style={{ background: scene.background }}>
      <style>{`
        @keyframes leaf-fall { 0% { transform: translate3d(0,-12vh,0) rotate(0deg); } 100% { transform: translate3d(9vw,112vh,0) rotate(620deg); } }
        @keyframes leaf-sway-a { 0%,100% { margin-left:-18px; } 50% { margin-left:18px; } }
        @keyframes leaf-sway-b { 0%,100% { margin-left:18px; } 50% { margin-left:-18px; } }
        @keyframes scene-in { 0% { opacity:0; transform:scale(.72) translateY(22px); filter:blur(8px); } 35% { opacity:1; filter:blur(0); } 100% { opacity:1; transform:scale(1) translateY(0); filter:blur(0); } }
        @keyframes glow-pulse { 0%,100% { opacity:.45; transform:scale(.9); } 50% { opacity:1; transform:scale(1.13); } }
        @keyframes ground-mist { 0%,100% { transform:translateX(-4%); opacity:.2; } 50% { transform:translateX(4%); opacity:.55; } }
        .leaf-fall { position:absolute; top:0; animation-name:leaf-fall; animation-timing-function:linear; animation-iteration-count:infinite; will-change:transform; }
        .leaf-sway-a { animation-name:leaf-fall,leaf-sway-a; animation-timing-function:linear,ease-in-out; animation-iteration-count:infinite,infinite; }
        .leaf-sway-b { animation-name:leaf-fall,leaf-sway-b; animation-timing-function:linear,ease-in-out; animation-iteration-count:infinite,infinite; }
        .scene-art { animation:scene-in 1.7s cubic-bezier(.16,1,.3,1) both; }
        @media (prefers-reduced-motion: reduce) { .leaf-fall,.leaf-sway-a,.leaf-sway-b,.scene-art { animation-duration:18s; } }
      `}</style>

      <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse at 50% 55%, ${scene.glow}, transparent 54%)`, transition: 'background 1.4s ease' }} />
      <div className="absolute inset-x-0 bottom-0 h-[28%] pointer-events-none" style={{ background: 'linear-gradient(0deg, rgba(0,0,0,.92), transparent)', animation: 'ground-mist 5s ease-in-out infinite' }} />

      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        {leaves.map((leaf, i) => (
          <span key={i} className={`leaf-fall ${leaf.sway}`} style={{
            left: `${leaf.left}%`,
            animationDuration: `${leaf.duration}s, ${2.3 + (i % 4) * .45}s`,
            animationDelay: `${leaf.delay}s, -${i % 3}s`,
            fontSize: `${leaf.size}px`,
            opacity: leaf.opacity,
            filter: 'drop-shadow(0 0 7px rgba(74,222,128,.35))',
          }}>{i % 4 === 0 ? '🍃' : i % 3 === 0 ? '🌿' : '🍂'}</span>
        ))}
      </div>

      <header className="absolute top-0 left-0 right-0 z-20 flex items-center justify-end gap-2 p-3 sm:p-5">
        <button onClick={onToggleSound} aria-label="Toggle sound" className="rounded-full border border-white/15 bg-black/35 p-3 backdrop-blur-md">
          {soundEnabled ? <Volume2 className="h-4 w-4 text-emerald-300" /> : <VolumeX className="h-4 w-4 text-white/70" />}
        </button>
        {!storyFinished && <button onClick={() => setStoryFinished(true)} aria-label="Skip intro" className="rounded-full border border-white/15 bg-black/35 p-3 text-white/80 backdrop-blur-md"><SkipForward className="h-4 w-4" /></button>}
      </header>

      <main className="relative z-10 flex h-full flex-col items-center justify-center overflow-hidden px-5 pb-16 pt-14">
        <div className="absolute inset-x-0 bottom-[18%] mx-auto h-36 w-[75%] rounded-[50%] blur-3xl" style={{ background: scene.glow, animation: 'glow-pulse 3.8s ease-in-out infinite' }} />
        <div key={sceneIndex} className="scene-art relative flex flex-col items-center justify-center" style={{ minHeight: '48vh' }}>
          <div className="absolute rounded-full blur-3xl" style={{ width: 'min(72vw, 360px)', height: 'min(72vw, 360px)', background: scene.glow, animation: 'glow-pulse 3s ease-in-out infinite' }} />
          <div className="relative drop-shadow-[0_20px_35px_rgba(0,0,0,.65)]" style={{ fontSize: 'clamp(100px, 29vw, 220px)', lineHeight: 1.1, transform: `scale(${scene.scale})`, transition: 'transform 1.4s ease' }}>{scene.art}</div>
          <div className="mt-7 flex items-center justify-center gap-2">
            {scenes.map((_, i) => <span key={i} className="rounded-full transition-all duration-700" style={{ width: i === sceneIndex ? 24 : 5, height: 5, background: i === sceneIndex ? '#a3e635' : 'rgba(255,255,255,.26)' }} />)}
          </div>
        </div>
        {storyFinished && (
          <div className="absolute bottom-[max(24px,env(safe-area-inset-bottom))] left-5 right-5 z-30 mx-auto flex max-w-sm flex-col gap-3" style={{ animation: 'scene-in .8s ease both' }}>
            <button onClick={finish} className="flex w-full items-center justify-center gap-3 rounded-2xl border border-lime-200/50 bg-gradient-to-r from-lime-300 via-emerald-400 to-green-500 px-6 py-4 text-base font-black tracking-[.18em] text-black shadow-[0_0_36px_rgba(74,222,128,.35)] active:scale-[.98]">
              <Play className="h-5 w-5 fill-black" /> {hasExistingSave ? 'PLAY' : 'PLAY'}
            </button>
            {hasExistingSave && <button onClick={() => { if (window.confirm('Start a new game and reset your current progress?')) { onResetGame(); finish(); } }} className="py-2 text-xs text-white/60">RESET GAME</button>}
          </div>
        )}
      </main>
    </div>
  );
};
