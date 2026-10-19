/**
 * Lightweight procedural Web Audio sound synthesizer for Weed Factory Tycoon.
 * Generates crisp arcade/tycoon effects without relying on external audio assets.
 */

class SoundSystem {
  private ctx: AudioContext | null = null;
  public soundEnabled: boolean = true;
  public musicEnabled: boolean = false;
  private musicGain: GainNode | null = null;
  private musicOscillators: OscillatorNode[] = [];
  private isMusicPlaying: boolean = false;

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public playCoin() {
    if (!this.soundEnabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(987.77, this.ctx.currentTime); // B5
      osc.frequency.exponentialRampToValueAtTime(1318.51, this.ctx.currentTime + 0.08); // E6

      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.15);
    } catch {
      // Audio fallback
    }
  }

  public playHarvest() {
    if (!this.soundEnabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const freqs = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 arpeggio
      freqs.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx!.currentTime + idx * 0.04);

        gain.gain.setValueAtTime(0.08, this.ctx!.currentTime + idx * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + idx * 0.04 + 0.18);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(this.ctx!.currentTime + idx * 0.04);
        osc.stop(this.ctx!.currentTime + idx * 0.04 + 0.18);
      });
    } catch {
      // Audio fallback
    }
  }

  public playCashRegister() {
    if (!this.soundEnabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      // Two quick resonant rings for "cha-ching"
      [1760, 2637].forEach((f, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, this.ctx!.currentTime + i * 0.07);

        gain.gain.setValueAtTime(0.15, this.ctx!.currentTime + i * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + i * 0.07 + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(this.ctx!.currentTime + i * 0.07);
        osc.stop(this.ctx!.currentTime + i * 0.07 + 0.25);
      });
    } catch {
      // Audio fallback
    }
  }

  public playUpgrade() {
    if (!this.soundEnabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const chord = [440, 554.37, 659.25, 880]; // A major triumphant chord
      chord.forEach((freq) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, this.ctx!.currentTime);

        gain.gain.setValueAtTime(0.07, this.ctx!.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start();
        osc.stop(this.ctx!.currentTime + 0.35);
      });
    } catch {
      // Audio fallback
    }
  }

  public playTap() {
    if (!this.soundEnabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.04);
    } catch {
      // Audio fallback
    }
  }

  public toggleMusic(enable?: boolean) {
    this.musicEnabled = enable !== undefined ? enable : !this.musicEnabled;
    if (this.musicEnabled) {
      this.startAmbientMusic();
    } else {
      this.stopAmbientMusic();
    }
  }

  private startAmbientMusic() {
    if (this.isMusicPlaying) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(0.025, this.ctx.currentTime);
      this.musicGain.connect(this.ctx.destination);

      // Warm relaxing ambient lo-fi drone pad
      const chords = [130.81, 196.00, 261.63, 329.63]; // C, G, C, E
      this.musicOscillators = chords.map((freq) => {
        const osc = this.ctx!.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, this.ctx!.currentTime);
        osc.connect(this.musicGain!);
        osc.start();
        return osc;
      });

      this.isMusicPlaying = true;
    } catch {
      // Audio fallback
    }
  }

  private stopAmbientMusic() {
    if (!this.isMusicPlaying) return;
    try {
      this.musicOscillators.forEach((osc) => {
        try {
          osc.stop();
          osc.disconnect();
        } catch {}
      });
      this.musicOscillators = [];
      if (this.musicGain) {
        this.musicGain.disconnect();
        this.musicGain = null;
      }
      this.isMusicPlaying = false;
    } catch {}
  }
}

export const sounds = new SoundSystem();
