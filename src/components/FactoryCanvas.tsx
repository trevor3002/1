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
    { id: 'c1', x: 380, y: 700, targetX: 260, state: 'entering', waitTimer: 3, speechText: 'Need that gas! 🔥' },
    { id: 'c2', x: 440, y: 700, targetX: 310, state: 'entering', waitTimer: 5, speechText: 'Top shelf only 🌿' },
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
      const bx = 30 + col * 170;
      const by = 100 + row * 112;
      const bw = 160;
      const bh = 105;

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
      ctx.fillRect(20, 60, canvas.width - 40, 390);
      ctx.strokeStyle = '#1b2d22';
      ctx.lineWidth = 2;
      ctx.strokeRect(20, 60, canvas.width - 40, 390);

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

      // Individual illustrated grow cards: larger plants, pots, status and progress
      s.growStations.forEach((station, idx) => {
        const col = idx % 2;
        const row = Math.floor(idx / 2);
        const bx = 30 + col * 170;
        const by = 100 + row * 112;
        const bw = 160;
        const bh = 105;

        ctx.fillStyle = '#101b14';
        ctx.fillRect(bx, by, bw, bh);
        ctx.fillStyle = '#14251a';
        ctx.fillRect(bx + 3, by + 3, bw - 6, bh - 6);
        ctx.strokeStyle = station.unlocked && station.progress >= 1 ? '#65e58a' : '#294532';
        ctx.lineWidth = station.unlocked && station.progress >= 1 ? 2 : 1;
        ctx.strokeRect(bx, by, bw, bh);

        if (!station.unlocked) {
          ctx.fillStyle = '#1d3022';
          ctx.fillRect(bx + 8, by + 28, bw - 16, 59);
          ctx.fillStyle = '#b4c6b8';
          ctx.font = '600 11px Outfit, sans-serif';
          ctx.fillText('🔒 LOCKED GROW BED', bx + 12, by + 49);
          ctx.fillStyle = '#fbbf24';
          ctx.font = '10px Outfit, sans-serif';
          ctx.fillText(`Unlock: ${station.unlockCost.toLocaleString()}`, bx + 12, by + 67);
          ctx.fillStyle = '#526b58';
          ctx.fillRect(bx + 12, by + 82, bw - 24, 3);
          return;
        }

        const strain = STRAINS[station.strainId];
        const prog = Math.max(0, Math.min(1, station.progress));
        const px = bx + bw / 2;
        const stemBase = by + 76;

        ctx.fillStyle = '#f0fdf4';
        ctx.font = '600 10px Outfit, sans-serif';
        ctx.fillText(station.name.slice(0, 22), bx + 7, by + 14);
        ctx.fillStyle = '#8fb89a';
        ctx.font = '8px Outfit, sans-serif';
        ctx.fillText(strain.name.slice(0, 21), bx + 7, by + 25);

        const spotlight = ctx.createRadialGradient(px, by + 54, 2, px, by + 54, 38);
        spotlight.addColorStop(0, station.progress >= 1 ? 'rgba(74,222,128,0.22)' : 'rgba(45,120,68,0.16)');
        spotlight.addColorStop(1, 'rgba(10,20,13,0)');
        ctx.fillStyle = spotlight;
        ctx.fillRect(bx + 35, by + 28, 90, 55);

        if (prog > 0) {
          const plantHeight = 10 + prog * 31;
          const topY = stemBase - plantHeight;
          ctx.strokeStyle = '#4b9b59';
          ctx.lineWidth = 3;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(px, stemBase - 3);
          ctx.quadraticCurveTo(px - 2, stemBase - plantHeight * 0.55, px, topY);
          ctx.stroke();

          ctx.fillStyle = prog >= 0.75 ? '#48bd68' : '#369653';
          ctx.strokeStyle = '#1f6d3b';
          ctx.lineWidth = 1;
          const leaf = (y: number, dir: number, size: number) => {
            ctx.beginPath();
            ctx.moveTo(px, y);
            ctx.quadraticCurveTo(px + dir * size * 0.4, y - size * 0.8, px + dir * size, y - size * 0.25);
            ctx.quadraticCurveTo(px + dir * size * 0.72, y + size * 0.45, px, y);
            ctx.fill();
            ctx.stroke();
          };
          leaf(topY + plantHeight * 0.55, -1, 15 + prog * 7);
          leaf(topY + plantHeight * 0.62, 1, 15 + prog * 7);
          if (prog > 0.25) {
            leaf(topY + plantHeight * 0.25, -1, 11 + prog * 6);
            leaf(topY + plantHeight * 0.33, 1, 11 + prog * 6);
          }
          if (prog > 0.55) {
            leaf(topY + 4, -1, 9);
            leaf(topY + 7, 1, 9);
          }
          if (prog >= 0.75) {
            ctx.fillStyle = strain.color || '#a7e66b';
            ctx.shadowColor = strain.color || '#a7e66b';
            ctx.shadowBlur = station.progress >= 1 ? 8 : 3;
            ctx.beginPath();
            ctx.arc(px, topY - 2, 5, 0, Math.PI * 2);
            ctx.arc(px - 5, topY + 3, 4, 0, Math.PI * 2);
            ctx.arc(px + 5, topY + 3, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#ecfccb';
            ctx.fillRect(px - 1, topY - 3, 2, 2);
            ctx.fillRect(px + 4, topY + 2, 2, 2);
          }
        } else {
          ctx.fillStyle = '#78b85b';
          ctx.beginPath();
          ctx.ellipse(px - 4, stemBase - 4, 6, 3, -0.5, 0, Math.PI * 2);
          ctx.ellipse(px + 4, stemBase - 4, 6, 3, 0.5, 0, Math.PI * 2);
          ctx.fill();
        }

        // Small terracotta pot makes each station read as its own plant
        ctx.fillStyle = '#563b2a';
        ctx.fillRect(px - 14, by + 75, 28, 11);
        ctx.fillStyle = '#b86d42';
        ctx.beginPath();
        ctx.moveTo(px - 16, by + 72);
        ctx.lineTo(px + 16, by + 72);
        ctx.lineTo(px + 12, by + 87);
        ctx.lineTo(px - 12, by + 87);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#e7a16a';
        ctx.fillRect(px - 16, by + 71, 32, 3);
        ctx.fillStyle = '#39291f';
        ctx.fillRect(px - 12, by + 75, 24, 2);

        const barX = bx + 8;
        const barY = by + 96;
        const barW = bw - 16;
        ctx.fillStyle = '#26372b';
        ctx.fillRect(barX, barY, barW, 4);
        ctx.fillStyle = station.progress >= 1 ? '#4ade80' : strain.color || '#38bdf8';
        ctx.fillRect(barX, barY, barW * prog, 4);

        ctx.fillStyle = station.progress >= 1 ? '#86efac' : !station.isGrowing ? '#b9d8c0' : '#d1d5db';
        ctx.font = 'bold 8px Outfit, sans-serif';
        const status = station.progress >= 1 ? 'READY • TAP TO HARVEST' : !station.isGrowing ? 'TAP TO PLANT' : `GROWING • ${Math.round(prog * 100)}%`;
        ctx.fillText(status, bx + 8, by + 91);
      });

      // Zone 2: PROCESSING & PACKAGING LAB (Middle section)
      const labY = 465;
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

      // Conveyor remains clear; no floating product sprites.

      // Packaging progress
      ctx.fillStyle = '#1f2937';
      ctx.fillRect(px + 8, py + ph - 12, pw - 16, 5);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(px + 8, py + ph - 12, (pw - 16) * pack.progress, 5);

      // Zone 3: RETAIL DISPENSARY & SALES COUNTER (Bottom section)
      const salesY = 640;
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

      // Ambient worker and customer sprites are intentionally hidden for a clean factory view.

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
      className="relative w-full h-auto min-h-[820px] flex-none flex items-start justify-center bg-[#070b09] overflow-hidden select-none"
    >
      <canvas
        ref={canvasRef}
        width={390}
        height={820}
        onPointerDown={handlePointerDown}
        className="w-full max-w-[390px] h-auto aspect-[390/820] shadow-2xl cursor-pointer touch-pan-y block"
      />
    </div>
  );
};
