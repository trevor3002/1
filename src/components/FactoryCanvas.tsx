import React, { useRef, useEffect, useCallback } from 'react';
import type { GameState, StrainId } from '../types/game.ts';
import { STRAINS } from '../game/constants.ts';
import { sounds } from '../utils/audio.ts';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
}

interface WorkerAgent {
  id: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  role: 'grower' | 'trimmer' | 'chemist' | 'budtender';
  state: 'walking' | 'working';
  timer: number;
  color: string;
  avatar: string;
}

interface CustomerAgent {
  id: string;
  x: number;
  y: number;
  targetX: number;
  state: 'entering' | 'waiting' | 'leaving';
  waitTimer: number;
  speechText?: string;
}

interface FactoryCanvasProps {
  state: GameState;
  onHarvestStation: (stationId: string) => void;
  onPlantStation: (stationId: string) => void;
  onTapFrenzy: (x: number, y: number) => void;
}

export const FactoryCanvas: React.FC<FactoryCanvasProps> = ({
  state,
  onHarvestStation,
  onPlantStation,
  onTapFrenzy,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // References to keep state available in requestAnimationFrame without tearing down canvas
  const stateRef = useRef<GameState>(state);
  stateRef.current = state;

  const particlesRef = useRef<Particle[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const nextTextId = useRef(1);

  // Workers and customers
  const workersRef = useRef<WorkerAgent[]>([
    { id: 'w1', x: 120, y: 160, targetX: 200, targetY: 160, role: 'grower', state: 'working', timer: 2, color: '#22c55e', avatar: '👨‍🌾' },
    { id: 'w2', x: 260, y: 280, targetX: 300, targetY: 280, role: 'trimmer', state: 'working', timer: 3, color: '#10b981', avatar: '✂️' },
    { id: 'w3', x: 200, y: 440, targetX: 280, targetY: 440, role: 'chemist', state: 'working', timer: 2.5, color: '#a855f7', avatar: '🧪' },
    { id: 'w4', x: 140, y: 600, targetX: 220, targetY: 600, role: 'budtender', state: 'working', timer: 2, color: '#eab308', avatar: '🏪' },
  ]);

  const customersRef = useRef<CustomerAgent[]>([
    { id: 'c1', x: 380, y: 620, targetX: 260, state: 'entering', waitTimer: 3, speechText: 'Need that gas! 🔥' },
    { id: 'c2', x: 440, y: 620, targetX: 310, state: 'entering', waitTimer: 5, speechText: 'Top shelf only 🌿' },
  ]);

  const conveyorOffsetRef = useRef(0);
  const pulseAnimRef = useRef(0);

  const spawnParticles = useCallback((x: number, y: number, color: string, count = 8) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 3.5;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        life: 1.0,
        maxLife: 1.0,
        color,
        size: 2 + Math.random() * 3,
      });
    }
  }, []);

  const spawnFloatingText = useCallback((x: number, y: number, text: string, color = '#22c55e') => {
    floatingTextsRef.current.push({
      id: nextTextId.current++,
      x,
      y,
      text,
      color,
      life: 1.2,
      maxLife: 1.2,
    });
  }, []);

  // Handle interaction / taps on canvas
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = (e.clientX - rect.left) * scaleX;
    const clientY = (e.clientY - rect.top) * scaleY;

    // Check if clicked any grow station bed
    const s = stateRef.current;
    let clickedStation = false;

    // Station coordinates in canvas space
    s.growStations.forEach((station, idx) => {
      if (!station.unlocked) return;
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const bx = 45 + col * 175;
      const by = 96 + row * 95;
      const bw = 150;
      const bh = 75;

      if (clientX >= bx && clientX <= bx + bw && clientY >= by && clientY <= by + bh) {
        clickedStation = true;
        if (station.progress >= 1.0) {
          onHarvestStation(station.id);
          spawnParticles(bx + bw / 2, by + bh / 2, '#22c55e', 14);
          spawnFloatingText(bx + bw / 2, by + 20, `+${STRAINS[station.strainId].name}!`, '#22c55e');
          sounds.playHarvest();
        } else if (!station.isGrowing && station.progress === 0) {
          onPlantStation(station.id);
          spawnParticles(bx + bw / 2, by + bh / 2, '#38bdf8', 10);
          spawnFloatingText(bx + bw / 2, by + 20, 'Planted! 🌱', '#38bdf8');
          sounds.playTap();
        } else {
          // Speed up current growth via tapping!
          station.progress = Math.min(1.0, station.progress + 0.08);
          spawnParticles(clientX, clientY, '#a855f7', 6);
          sounds.playTap();
        }
      }
    });

    if (!clickedStation) {
      // General factory tap - awards small tap cash and triggers tap frenzy boost!
      onTapFrenzy(clientX, clientY);
      spawnParticles(clientX, clientY, '#22c55e', 10);
      const tapBonus = Math.max(5, Math.round(s.factoryLevel * 5 * (1 + s.greenTokens * 0.1)));
      spawnFloatingText(clientX, clientY, `+$${tapBonus}`, '#4ade80');
      sounds.playCoin();
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let lastTime = performance.now();

    const render = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;
      const s = stateRef.current;

      conveyorOffsetRef.current = (conveyorOffsetRef.current + dt * 45) % 30;
      pulseAnimRef.current += dt * 3;

      // Clear Canvas
      ctx.fillStyle = '#0a0f0d';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Industrial Grid Floor
      ctx.strokeStyle = '#121e17';
      ctx.lineWidth = 1;
      const gridSize = 32;
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Zone 1: GROW ROOM (Top section)
      // Room framing & neon overhead pipe
      ctx.fillStyle = '#0f1712';
      ctx.fillRect(20, 60, canvas.width - 40, 320);
      ctx.strokeStyle = '#1b2d22';
      ctx.lineWidth = 2;
      ctx.strokeRect(20, 60, canvas.width - 40, 320);

      // Neon LED Grow Light bar running across top
      const glowAlpha = 0.5 + Math.sin(pulseAnimRef.current) * 0.2;
      ctx.shadowColor = '#22c55e';
      ctx.shadowBlur = 12;
      ctx.fillStyle = `rgba(34, 197, 94, ${glowAlpha})`;
      ctx.fillRect(35, 68, canvas.width - 70, 4);
      ctx.shadowBlur = 0;

      // Section Header Tag
      ctx.fillStyle = '#86efac';
      ctx.font = '600 11px Outfit, sans-serif';
      ctx.fillText('ZONE 01: HYDROPONIC GROW CHAMBER', 35, 84);

      // Draw Grow Station Beds
      s.growStations.forEach((station, idx) => {
        const col = idx % 2;
        const row = Math.floor(idx / 2);
        const bx = 40 + col * 175;
        const by = 96 + row * 95;
        const bw = 155;
        const bh = 80;

        if (!station.unlocked) {
          // Locked Station Bed
          ctx.fillStyle = '#090e0b';
          ctx.fillRect(bx, by, bw, bh);
          ctx.strokeStyle = '#1a2920';
          ctx.strokeRect(bx, by, bw, bh);
          ctx.fillStyle = '#4b5563';
          ctx.font = '500 11px Outfit, sans-serif';
          ctx.fillText(`🔒 Locked Bed`, bx + 14, by + 36);
          ctx.font = '10px Plus Jakarta Sans, sans-serif';
          ctx.fillText(`Cost: $${station.unlockCost.toLocaleString()}`, bx + 14, by + 52);
          return;
        }

        // Active Station Bed container
        const strain = STRAINS[station.strainId];
        ctx.fillStyle = '#141e17';
        ctx.fillRect(bx, by, bw, bh);
        ctx.strokeStyle = station.progress >= 1.0 ? '#22c55e' : '#27382c';
        ctx.lineWidth = station.progress >= 1.0 ? 2 : 1;
        ctx.strokeRect(bx, by, bw, bh);

        // Bed header
        ctx.fillStyle = '#d1d5db';
        ctx.font = '600 10px Outfit, sans-serif';
        ctx.fillText(station.name, bx + 8, by + 16);

        // Hydroponic Water tank glow at bottom
        ctx.fillStyle = '#064e3b';
        ctx.fillRect(bx + 8, by + bh - 16, bw - 16, 8);

        // Plant Visual Graphic based on progress
        const px = bx + bw / 2;
        const py = by + 48;
        const prog = station.progress;

        if (prog < 0.25) {
          // Sprout stage
          ctx.fillStyle = strain.color;
          ctx.beginPath();
          ctx.arc(px, py + 8, 4, 0, Math.PI * 2);
          ctx.fill();
          // Small stem
          ctx.strokeStyle = '#15803d';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(px, py + 14);
          ctx.lineTo(px, py + 6);
          ctx.stroke();
        } else if (prog < 0.75) {
          // Vegetative leafy bush
          ctx.fillStyle = '#15803d';
          ctx.beginPath();
          ctx.arc(px - 8, py + 2, 7, 0, Math.PI * 2);
          ctx.arc(px + 8, py + 2, 7, 0, Math.PI * 2);
          ctx.arc(px, py - 4, 9, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Full Flowering Colas with glowing trichomes!
          ctx.fillStyle = strain.color;
          ctx.shadowColor = strain.color;
          ctx.shadowBlur = station.progress >= 1.0 ? 10 : 4;

          ctx.beginPath();
          ctx.arc(px - 10, py, 9, 0, Math.PI * 2);
          ctx.arc(px + 10, py, 9, 0, Math.PI * 2);
          ctx.arc(px, py - 8, 12, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;

          // Sparkling trichome dots
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(px - 4, py - 6, 2, 2);
          ctx.fillRect(px + 3, py - 3, 2, 2);
          ctx.fillRect(px, py, 2, 2);
        }

        // Progress Bar
        const barW = bw - 16;
        const barH = 5;
        const barX = bx + 8;
        const barY = by + bh - 12;
        ctx.fillStyle = '#1f2937';
        ctx.fillRect(barX, barY, barW, barH);

        ctx.fillStyle = station.progress >= 1.0 ? '#22c55e' : strain.color;
        ctx.fillRect(barX, barY, barW * station.progress, barH);

        // Status badge
        if (station.progress >= 1.0) {
          ctx.fillStyle = '#4ade80';
          ctx.font = 'bold 9px Outfit, sans-serif';
          ctx.fillText('TAP TO HARVEST! ✂️', bx + 10, by + 30);
        } else if (!station.isGrowing) {
          ctx.fillStyle = '#9ca3af';
          ctx.font = '9px Outfit, sans-serif';
          ctx.fillText('TAP TO PLANT 🌱', bx + 10, by + 30);
        }
      });

      // Zone 2: PROCESSING & PACKAGING LAB (Middle section)
      const labY = 390;
      ctx.fillStyle = '#0c1310';
      ctx.fillRect(20, labY, canvas.width - 40, 155);
      ctx.strokeStyle = '#1b2d22';
      ctx.lineWidth = 2;
      ctx.strokeRect(20, labY, canvas.width - 40, 155);

      // Purple Accent line for Lab
      ctx.shadowColor = '#c084fc';
      ctx.shadowBlur = 8;
      ctx.fillStyle = 'rgba(192, 132, 252, 0.6)';
      ctx.fillRect(35, labY + 6, canvas.width - 70, 3);
      ctx.shadowBlur = 0;

      ctx.fillStyle = '#d8b4fe';
      ctx.font = '600 11px Outfit, sans-serif';
      ctx.fillText('ZONE 02: EXTRACTION & PACKAGING LAB', 35, labY + 22);

      // Processing Machine (Extractor)
      const proc = s.processingMachines[0];
      const mx = 38;
      const my = labY + 34;
      const mw = 150;
      const mh = 100;

      ctx.fillStyle = '#131b17';
      ctx.fillRect(mx, my, mw, mh);
      ctx.strokeStyle = proc.isProcessing ? '#a855f7' : '#27382c';
      ctx.strokeRect(mx, my, mw, mh);

      ctx.fillStyle = '#e5e7eb';
      ctx.font = '600 10px Outfit, sans-serif';
      ctx.fillText('Centrifugal Curer', mx + 8, my + 16);

      // Draw Glass Distillation Tube
      ctx.fillStyle = '#1f2937';
      ctx.fillRect(mx + 15, my + 28, 28, 55);
      // Amber bubbling fluid inside
      const bubbleHeight = 15 + Math.sin(pulseAnimRef.current * 2) * 8;
      ctx.fillStyle = 'rgba(234, 179, 8, 0.8)';
      ctx.fillRect(mx + 17, my + 60 - bubbleHeight, 24, bubbleHeight + 20);

      // Animated mechanical gear/spindle
      ctx.strokeStyle = '#9ca3af';
      ctx.lineWidth = 2;
      ctx.save();
      ctx.translate(mx + 105, my + 50);
      if (proc.isProcessing) {
        ctx.rotate(pulseAnimRef.current * 2);
      }
      ctx.strokeRect(-12, -12, 24, 24);
      ctx.restore();

      // Progress bar
      ctx.fillStyle = '#1f2937';
      ctx.fillRect(mx + 8, my + mh - 12, mw - 16, 5);
      ctx.fillStyle = '#a855f7';
      ctx.fillRect(mx + 8, my + mh - 12, (mw - 16) * proc.progress, 5);

      // Packaging Machine & Moving Conveyor
      const pack = s.packagingLines[0];
      const px = 205;
      const py = labY + 34;
      const pw = 155;
      const ph = 100;

      ctx.fillStyle = '#131b17';
      ctx.fillRect(px, py, pw, ph);
      ctx.strokeStyle = pack.isPackaging ? '#38bdf8' : '#27382c';
      ctx.strokeRect(px, py, pw, ph);

      ctx.fillStyle = '#e5e7eb';
      ctx.font = '600 10px Outfit, sans-serif';
      ctx.fillText('Automated Bottler', px + 8, py + 16);

      // Conveyor Belt drawing
      ctx.fillStyle = '#0f1712';
      ctx.fillRect(px + 8, py + 45, pw - 16, 20);
      ctx.strokeStyle = '#374151';
      ctx.lineWidth = 1;

      // Conveyor stripes moving
      const offset = conveyorOffsetRef.current;
      for (let cx = px + 8 - (offset % 12); cx < px + pw - 8; cx += 12) {
        if (cx >= px + 8 && cx <= px + pw - 12) {
          ctx.beginPath();
          ctx.moveTo(cx, py + 45);
          ctx.lineTo(cx + 4, py + 65);
          ctx.stroke();
        }
      }

      // Moving jar box on conveyor
      const boxX = px + 12 + ((offset * 3.5) % (pw - 40));
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(boxX, py + 42, 14, 14);
      ctx.strokeStyle = '#ffffff';
      ctx.strokeRect(boxX, py + 42, 14, 14);

      // Packaging progress
      ctx.fillStyle = '#1f2937';
      ctx.fillRect(px + 8, py + ph - 12, pw - 16, 5);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(px + 8, py + ph - 12, (pw - 16) * pack.progress, 5);

      // Zone 3: RETAIL DISPENSARY & SALES COUNTER (Bottom section)
      const salesY = 560;
      ctx.fillStyle = '#0b120e';
      ctx.fillRect(20, salesY, canvas.width - 40, 160);
      ctx.strokeStyle = '#1b2d22';
      ctx.lineWidth = 2;
      ctx.strokeRect(20, salesY, canvas.width - 40, 160);

      // Warm Amber Neon Header for Dispensary
      ctx.shadowColor = '#eab308';
      ctx.shadowBlur = 8;
      ctx.fillStyle = 'rgba(234, 179, 8, 0.7)';
      ctx.fillRect(35, salesY + 6, canvas.width - 70, 3);
      ctx.shadowBlur = 0;

      ctx.fillStyle = '#fde047';
      ctx.font = '600 11px Outfit, sans-serif';
      ctx.fillText('ZONE 03: RETAIL DISPENSARY & CASH REGISTER', 35, salesY + 22);

      // Glass Display Showcase Counter
      ctx.fillStyle = '#16221b';
      ctx.fillRect(38, salesY + 36, 170, 60);
      ctx.strokeStyle = '#059669';
      ctx.strokeRect(38, salesY + 36, 170, 60);

      ctx.fillStyle = '#d1fae5';
      ctx.font = '500 10px Outfit, sans-serif';
      ctx.fillText('Glass Bud Boutique', 48, salesY + 52);

      // Jars inside boutique counter
      const jarsCount = Math.min(6, Object.values(s.inventory.packaged).reduce((a, b) => a + b, 0));
      for (let j = 0; j < 5; j++) {
        const jx = 50 + j * 28;
        const jy = salesY + 64;
        ctx.fillStyle = j < jarsCount ? '#22c55e' : '#374151';
        ctx.fillRect(jx, jy, 16, 22);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(jx + 2, jy, 12, 4); // lid
      }

      // Cash Register Counter
      const regX = 220;
      const regY = salesY + 36;
      ctx.fillStyle = '#1f2937';
      ctx.fillRect(regX, regY, 135, 60);
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(regX, regY, 135, 60);

      // Register display screen
      ctx.fillStyle = '#111827';
      ctx.fillRect(regX + 12, regY + 10, 50, 22);
      ctx.fillStyle = '#22c55e';
      ctx.font = 'bold 9px Courier, monospace';
      ctx.fillText('$ READY', regX + 15, regY + 25);

      // Cash drawer button
      ctx.fillStyle = '#059669';
      ctx.fillRect(regX + 70, regY + 12, 52, 18);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px Outfit, sans-serif';
      ctx.fillText('SALES', regX + 80, regY + 25);

      // Animate Workers
      workersRef.current.forEach((w) => {
        // Simple ambient worker pacing
        w.timer -= dt;
        if (w.timer <= 0) {
          w.timer = 2 + Math.random() * 3;
          w.targetX = w.x > 200 ? 120 + Math.random() * 50 : 250 + Math.random() * 50;
        }
        w.x += (w.targetX - w.x) * dt * 0.8;

        // Draw worker icon
        ctx.font = '16px sans-serif';
        ctx.fillText(w.avatar, w.x, w.y);
      });

      // Animate Customers approaching counter
      customersRef.current.forEach((c) => {
        if (c.state === 'entering') {
          c.x += (c.targetX - c.x) * dt * 1.5;
          if (Math.abs(c.x - c.targetX) < 5) {
            c.state = 'waiting';
            c.waitTimer = 3;
          }
        } else if (c.state === 'waiting') {
          c.waitTimer -= dt;
          if (c.waitTimer <= 0) {
            c.state = 'leaving';
            c.targetX = 420;
          }
        } else if (c.state === 'leaving') {
          c.x += (c.targetX - c.x) * dt * 2.0;
          if (c.x > 400) {
            c.x = 420;
            c.targetX = 260 + Math.random() * 40;
            c.state = 'entering';
            const quotes = ['Fire strain! 🔥', 'Take my cash! 💵', 'Best dispensary! 🌿', '5 stars! ⭐️'];
            c.speechText = quotes[Math.floor(Math.random() * quotes.length)];
          }
        }

        // Draw customer figure
        ctx.font = '16px sans-serif';
        ctx.fillText('🚶', c.x, c.y);

        // Speech bubble
        if (c.state === 'waiting' && c.speechText) {
          ctx.fillStyle = 'rgba(17, 24, 39, 0.9)';
          ctx.fillRect(c.x - 25, c.y - 28, 70, 16);
          ctx.strokeStyle = '#4ade80';
          ctx.strokeRect(c.x - 25, c.y - 28, 70, 16);
          ctx.fillStyle = '#86efac';
          ctx.font = '9px Outfit, sans-serif';
          ctx.fillText(c.speechText, c.x - 22, c.y - 17);
        }
      });

      // Update & Draw Particles
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.12; // gravity
        p.life -= dt * 1.5;

        if (p.life <= 0) {
          particlesRef.current.splice(i, 1);
          continue;
        }

        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life / p.maxLife;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }

      // Update & Draw Floating Texts
      for (let i = floatingTextsRef.current.length - 1; i >= 0; i--) {
        const ft = floatingTextsRef.current[i];
        ft.y -= dt * 35; // rise up
        ft.life -= dt;

        if (ft.life <= 0) {
          floatingTextsRef.current.splice(i, 1);
          continue;
        }

        ctx.fillStyle = ft.color;
        ctx.globalAlpha = Math.max(0, ft.life / ft.maxLife);
        ctx.font = 'bold 13px Outfit, sans-serif';
        ctx.fillText(ft.text, ft.x - 20, ft.y);
        ctx.globalAlpha = 1.0;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [onHarvestStation, onPlantStation, onTapFrenzy]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-auto min-h-[760px] flex-none flex items-start justify-center bg-[#070b09] overflow-hidden select-none"
    >
      <canvas
        ref={canvasRef}
        width={390}
        height={760}
        onPointerDown={handlePointerDown}
        className="w-full max-w-[390px] h-auto aspect-[390/760] shadow-2xl cursor-pointer touch-none block"
      />
    </div>
  );
};
