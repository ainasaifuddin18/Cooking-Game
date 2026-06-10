// Retro Web Audio API Synthesizer and Sound Manager
// 100% Client-side, zero-dependency, and extremely responsive

class SoundSynth {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private volume: number = 0.4;
  private isMuted: boolean = false;

  // Background Music (BGM) loop timer and state
  private bgmInterval: any = null;
  private isBgmPlaying: boolean = false;
  private bgmBeat: number = 0;

  constructor() {
    // Initialized lazily to comply with browser autoplay security policies
  }

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
    }
  }

  public setMute(mute: boolean) {
    this.isMuted = mute;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(mute ? 0 : this.volume, this.ctx.currentTime);
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public getMute(): boolean {
    return this.isMuted;
  }

  // SOUND 1: Button Click
  public playClick() {
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(650, now);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.06);
  }

  // SOUND 2: Ingredient Selection (Pop/sweep sound)
  public playIngredient() {
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(350, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.1);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.11);
  }

  // SOUND 3: Success Arpeggio (Cooking finished correctly!)
  public playSuccess() {
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    // Sweet C major arpeggio: C5 -> E5 -> G5 -> C6
    const freqs = [523.25, 659.25, 783.99, 1046.50];
    freqs.forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0.18, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.08 + 0.22);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.24);
    });
  }

  // SOUND 4: Error buzzer (wrong ingredient or timer ran out)
  public playError() {
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.linearRampToValueAtTime(100, now + 0.28);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.28);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.3);
  }

  // SOUND 5: Level-up Fanfare (Milestones & shop items!)
  public playLevelUp() {
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    // Victory high-pitched rapid arpeggio: G5 -> C6 -> E6 -> G6 (hold G6)
    const freqs = [392.00, 523.25, 659.25, 783.99, 1046.50];
    const delays = [0, 0.08, 0.16, 0.24, 0.35];

    freqs.forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + delays[idx]);

      gain.gain.setValueAtTime(0.2, now + delays[idx]);
      gain.gain.exponentialRampToValueAtTime(0.01, now + delays[idx] + (idx === freqs.length - 1 ? 0.5 : 0.25));

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now + delays[idx]);
      osc.stop(now + delays[idx] + (idx === freqs.length - 1 ? 0.55 : 0.3));
    });
  }

  // SOUND 6: Coin collection (Ting!)
  public playCoin() {
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    // Traditional arcade 2-pulse coin ping
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(987.77, now); // B5

    gain1.gain.setValueAtTime(0.15, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

    osc1.connect(gain1);
    gain1.connect(this.masterGain);
    osc1.start(now);
    osc1.stop(now + 0.09);

    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1318.51, now + 0.07); // E6

    gain2.gain.setValueAtTime(0.15, now + 0.07);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.22);

    osc2.connect(gain2);
    gain2.connect(this.masterGain);
    osc2.start(now + 0.07);
    osc2.stop(now + 0.3);
  }

  // SOUND 7: Game Over Sad Descending Tone
  public playGameOver() {
    this.stopBgm();
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    const notes = [330, 277, 220, 165]; // Descending E major relative
    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.16);

      gain.gain.setValueAtTime(0.25, now + idx * 0.16);
      gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.16 + 0.4);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now + idx * 0.16);
      osc.stop(now + idx * 0.16 + 0.45);
    });
  }

  // MUSIC 8: Dynamic loop player for background gameplay melody
  public startBgm() {
    this.initCtx();
    if (!this.ctx || !this.masterGain || this.isBgmPlaying) return;
    this.isBgmPlaying = true;
    this.bgmBeat = 0;

    // Bright 8-bit pentatonic melody loop (A major scale)
    const melody = [
      440.00, 493.88, 554.37, 0, 587.33, 659.25, 0, 659.25,
      587.33, 554.37, 493.88, 440.00, 493.88, 0, 493.88, 0,
      440.00, 493.88, 554.37, 0, 587.33, 659.25, 0, 783.99,
      659.25, 587.33, 493.88, 440.00, 440.00, 0, 0, 0
    ];

    const bass = [
      220.00, 0, 220.00, 0, 277.18, 0, 329.63, 0,
      293.66, 0, 246.94, 0, 220.00, 0, 220.00, 0,
      220.00, 0, 220.00, 0, 277.18, 0, 329.63, 0,
      392.00, 0, 293.66, 0, 220.00, 0, 220.00, 0
    ];

    const beatDuration = 0.22; // Seconds per beat (equivalent to ~136 BPM)

    const tickBgm = () => {
      if (!this.isBgmPlaying || !this.ctx || !this.masterGain) return;
      const now = this.ctx.currentTime;

      const currentBeat = this.bgmBeat;
      const mFreq = melody[currentBeat % melody.length];
      const bFreq = bass[currentBeat % bass.length];

      // Play treble melody
      if (mFreq > 0) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(mFreq, now);

        // Low volume for comfortable, non-intrusive backing sound
        gain.gain.setValueAtTime(0.045, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + beatDuration - 0.02);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + beatDuration - 0.01);
      }

      // Play bass support
      if (bFreq > 0) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(bFreq, now);

        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + beatDuration * 1.5 - 0.02);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + beatDuration * 1.5 - 0.01);
      }

      this.bgmBeat = (this.bgmBeat + 1) % melody.length;
      this.bgmInterval = setTimeout(tickBgm, beatDuration * 1000);
    };

    tickBgm();
  }

  public stopBgm() {
    this.isBgmPlaying = false;
    if (this.bgmInterval) {
      clearTimeout(this.bgmInterval);
      this.bgmInterval = null;
    }
  }
}

export const sysAudio = new SoundSynth();
