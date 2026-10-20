import React from 'react';
import { Play, ChevronRight, ChevronLeft, Volume2, VolumeX, RotateCcw, SkipForward } from 'lucide-react';
import { sounds } from '../utils/audio.ts';

interface TitleScreenProps {
  onStartGame: () => void;
  hasExistingSave: boolean;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onResetGame: () => void;
}

const chapters = [
  { kicker: 'CHAPTER 01 · THE DREAM', title: 'ONE SMALL ROOM. ONE BIG DREAM.', text: 'It begins with a little space, a few plants, and a big idea. You have almost nothing — but you see what this place could become.', art: '🌆', scene: 'from-indigo-950 via-slate-900 to-emerald-950', symbol: '🌱' },
  { kicker: 'CHAPTER 02 · THE FIRST GROW', title: 'EVERY EMPIRE STARTS SOMEWHERE.', text: 'Plant your first seeds, learn the rhythm of production, and turn patience into your first harvest.', art: '🌿', scene: 'from-emerald-950 via-green-900 to-black', symbol: '🪴' },
  { kicker: 'CHAPTER 03 · THE FACTORY', title: 'A NEW DOOR OPENS.', text: 'An old factory is full of potential. The machines are waiting, the lights are coming on, and the future is yours to build.', art: '🏭', scene: 'from-slate-900 via-zinc-800 to-emerald-950', symbol: '⚙️' },
  { kicker: 'CHAPTER 04 · GROW & HARVEST', title: 'BUILD YOUR PRODUCTION.', text: 'Expand your grow stations, keep your crops healthy, and harvest more as your operation gets bigger.', art: '🌿', scene: 'from-green-950 via-emerald-900 to-black', symbol: '✦' },
  { kicker: 'CHAPTER 05 · PROCESS & PACKAGE', title: 'TURN HARVEST INTO VALUE.', text: 'Put your equipment to work. Process your harvest, package your products, and get them ready for the market.', art: '🏗️', scene: 'from-zinc-900 via-slate-800 to-emerald-950', symbol: '📦' },
  { kicker: 'CHAPTER 06 · SELL & EXPAND', title: 'MAKE YOUR NAME KNOWN.', text: 'Sell your products, earn profits, unlock new opportunities, and reinvest every dollar into a stronger business.', art: '🏪', scene: 'from-amber-950 via-emerald-950 to-black', symbol: '💵' },
  { kicker: 'CHAPTER 07 · THE CHALLENGE', title: 'SMART MOVES WIN BIG.', text: 'Growth takes decisions. Choose upgrades, improve efficiency, and make every investment count.', art: '📈', scene: 'from-purple-950 via-slate-900 to-black', symbol: '⚡' },
  { kicker: 'CHAPTER 08 · YOUR LEGACY', title: 'FROM SMALL START TO BIG EMPIRE.', text: 'Keep growing, keep upgrading, and push beyond what you thought was possible. Your next chapter is in your hands.', art: '🌇', scene: 'from-orange-950 via-purple-950 to-emerald-950', symbol: '👑' },
  { kicker: 'YOUR STORY STARTS NOW', title: 'BUILD THE GREEN EMPIRE.', text: 'Grow smart. Stay focused. Build your legacy. The factory is yours — let’s get to work.', art: '🌿', scene: 'from-black via-emerald-950 to-black', symbol: '👑' },
];

export const TitleScreen: React.FC<TitleScreenProps> = ({ onStartGame, hasExistingSave, soundEnabled, onToggleSound, onResetGame }) => {
  const [chapter, setChapter] = React.useState(0);
  const current = chapters[chapter];
  const finish = () => { sounds.playHarvest(); onStartGame(); };

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') setChapter((n) => Math.min(n + 1, chapters.length - 1));
      if (e.key === 'ArrowLeft') setChapter((n) => Math.max(n - 1, 0));
      if (e.key === 'Escape') finish();
      if ((e.key === ' ' || e.key === 'Enter') && chapter === chapters.length - 1) { e.preventDefault(); finish(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [chapter]);

  return (
    <div className="relative w-full h-full min-h-0 flex flex-col bg-[#030805] text-white overflow-hidden select-none">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_35%,rgba(16,185,129,0.2),transparent_55%)] pointer-events-none" />
      <header className="relative z-10 flex items-center justify-between px-4 pt-safe py-3">
        <div className="text-[10px] sm:text-xs font-black tracking-[0.2em] text-emerald-400">WEED FACTORY <span className="text-white/50">· GREEN EMPIRE</span></div>
        <div className="flex items-center gap-2">
          <button onClick={onToggleSound} aria-label="Toggle sound" className="p-2 rounded-full border border-white/10 bg-black/30">{soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4" />}</button>
          <button onClick={finish} className="text-[10px] font-bold text-zinc-400 hover:text-white flex items-center gap-1 px-2 py-2">SKIP <SkipForward className="w-3 h-3" /></button>
        </div>
      </header>
      <main className="relative z-10 flex-1 min-h-0 flex flex-col justify-center px-4 pb-3">
        <div className={`relative w-full max-w-xl mx-auto overflow-hidden rounded-3xl border border-emerald-400/25 bg-gradient-to-br ${current.scene} shadow-2xl shadow-emerald-950/50`}>
          <div className="relative min-h-[34vh] sm:min-h-[360px] flex flex-col items-center justify-center text-center p-5 sm:p-8 overflow-hidden">
            <div className="absolute inset-0 opacity-20" style={{backgroundImage:'radial-gradient(circle at 20% 25%, #a3e635 0 1px, transparent 2px), radial-gradient(circle at 75% 65%, #34d399 0 1px, transparent 2px)', backgroundSize:'36px 36px'}} />
            <div className="absolute top-4 left-5 text-4xl opacity-30">{current.symbol}</div>
            <div className="absolute bottom-4 right-5 text-4xl opacity-30">{current.symbol}</div>
            <div className="relative text-7xl sm:text-8xl mb-4 drop-shadow-[0_0_25px_rgba(52,211,153,0.35)]">{current.art}</div>
            <div className="relative text-[10px] sm:text-xs font-black tracking-[0.24em] text-emerald-300 mb-3">{current.kicker}</div>
            <h1 className="relative max-w-md text-2xl sm:text-4xl leading-tight font-black tracking-tight">{current.title}</h1>
            <p className="relative max-w-md text-sm sm:text-base leading-relaxed text-zinc-200 mt-4">{current.text}</p>
          </div>
          <div className="h-1 bg-black/40"><div className="h-full bg-emerald-400 transition-all duration-300" style={{width: `${((chapter + 1) / chapters.length) * 100}%`}} /></div>
        </div>
        <div className="w-full max-w-xl mx-auto mt-4">
          <div className="flex justify-center gap-2 mb-4" aria-label={`Story page ${chapter + 1} of ${chapters.length}`}>
            {chapters.map((item, i) => <button key={item.kicker} onClick={() => setChapter(i)} aria-label={`Go to chapter ${i + 1}`} className={`h-2 rounded-full transition-all ${i === chapter ? 'w-7 bg-emerald-400' : 'w-2 bg-white/25 hover:bg-white/50'}`} />)}
          </div>
          {chapter === chapters.length - 1 ? (
            <button onClick={finish} className="w-full py-4 rounded-2xl bg-gradient-to-r from-lime-400 via-emerald-400 to-green-500 text-black font-black tracking-widest shadow-lg shadow-emerald-500/20 active:scale-[0.98] flex items-center justify-center gap-2"><Play className="w-5 h-5 fill-black" /> {hasExistingSave ? 'CONTINUE EMPIRE' : 'LET’S GO'}</button>
          ) : (
            <div className="flex gap-3">
              <button onClick={() => setChapter((n) => Math.max(0, n - 1))} disabled={chapter === 0} className="px-4 py-3 rounded-xl border border-white/10 text-zinc-300 disabled:opacity-25"><ChevronLeft className="w-5 h-5" /></button>
              <button onClick={() => setChapter((n) => Math.min(chapters.length - 1, n + 1))} className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold flex items-center justify-center gap-2">NEXT CHAPTER <ChevronRight className="w-4 h-4" /></button>
            </div>
          )}
          {hasExistingSave && <button onClick={() => { if (window.confirm('Start a completely new game? Your current progress will be reset.')) { onResetGame(); finish(); } }} className="w-full mt-3 py-2 text-xs text-zinc-500 hover:text-zinc-300 flex items-center justify-center gap-2"><RotateCcw className="w-3 h-3" /> Start a New Game (reset progress)</button>}
          <div className="text-center text-[10px] text-zinc-600 mt-3">A fictional idle tycoon story · {chapter + 1} / {chapters.length}</div>
        </div>
      </main>
    </div>
  );
};
