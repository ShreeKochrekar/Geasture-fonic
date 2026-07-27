import * as Tone from 'tone';
import type { Mood, PatternIntensity } from '../tracking/moodGestures';

export type GuitarToneType = 'acoustic' | 'electric' | 'nylon' | 'steel' | 'twelve_string';

let limiter: Tone.Limiter | null = null;
let masterVolume: Tone.Volume | null = null;
let reverbSend: Tone.Reverb | null = null;
let delaySend: Tone.FeedbackDelay | null = null;

// ======= THEREMIN NODES =======
let thereminSynth: Tone.MonoSynth | null = null;
let thereminSubOsc: Tone.Synth | null = null;
let thereminVibrato: Tone.LFO | null = null;
let thereminVibratoGain: Tone.Gain | null = null;
let thereminFilter: Tone.Filter | null = null;
let thereminChorus: Tone.Chorus | null = null;
let thereminReverb: Tone.Reverb | null = null;

// ======= PIANO NODES =======
let pianoSynth: Tone.PolySynth | null = null;
let pianoFilter: Tone.Filter | null = null;
let pianoChorus: Tone.Chorus | null = null;
let pianoReverb: Tone.Reverb | null = null;

// ======= GUITAR NODES =======
let guitarStrings: Tone.Synth[] = [];
let guitarFilter: Tone.Filter | null = null;
let guitarChorus: Tone.Chorus | null = null;
let guitarReverb: Tone.Reverb | null = null;
let guitarDistortion: Tone.Distortion | null = null;

// ======= DRUMS NODES =======
let kickSynth: Tone.MembraneSynth | null = null;
let snareFilter: Tone.Filter | null = null;
let snareNoise: Tone.NoiseSynth | null = null;
let hatFilter: Tone.Filter | null = null;
let hatNoise: Tone.NoiseSynth | null = null;
let openHatFilter: Tone.Filter | null = null;
let openHatNoise: Tone.NoiseSynth | null = null;
let metalSynth: Tone.MetalSynth | null = null;
let rideSynth: Tone.MetalSynth | null = null;
let tomHighSynth: Tone.MembraneSynth | null = null;
let tomMidSynth: Tone.MembraneSynth | null = null;
let clapFilter: Tone.Filter | null = null;
let clapNoise: Tone.NoiseSynth | null = null;
let drumPlayers: Tone.Players | null = null;

// ======= TABLA NODES =======
let bayanSynth: Tone.MembraneSynth | null = null;
let dayanSynth: Tone.Synth | null = null;
let dayanFilter: Tone.Filter | null = null;

let isInitialized = false;

function noteToFreq(note: string): number {
  const notes: { [key: string]: number } = {
    'C': 16.35, 'C#': 17.32, 'Db': 17.32, 'D': 18.35, 'D#': 19.45,
    'Eb': 19.45, 'E': 20.60, 'F': 21.83, 'F#': 23.12, 'Gb': 23.12,
    'G': 24.50, 'G#': 25.96, 'Ab': 25.96, 'A': 27.50, 'A#': 29.14,
    'Bb': 29.14, 'B': 30.87
  };
  
  const match = note.match(/^([A-G]#?b?)(\d+)$/);
  if (!match) return 440;
  const noteName = match[1];
  const octave = parseInt(match[2]);
  const baseFreq = notes[noteName] || 440;
  return baseFreq * Math.pow(2, octave);
}

export async function initAudioEngine() {
  if (isInitialized) return;

  try {
    await Tone.start();
    console.log('Tone.js Audio Context started successfully.');

    // Master limiting and volume
    limiter = new Tone.Limiter(-1).toDestination();
    masterVolume = new Tone.Volume(-6).connect(limiter);
    
    // Global send FX
    reverbSend = new Tone.Reverb({ decay: 2.5, wet: 0.3 }).connect(masterVolume);
    delaySend = new Tone.FeedbackDelay({ delayTime: '8n', feedback: 0.2, wet: 0.15 }).connect(masterVolume);

    // ======= WARM THEREMIN PIPELINE =======
    thereminFilter = new Tone.Filter(3000, 'lowpass').connect(masterVolume);
    thereminChorus = new Tone.Chorus({ frequency: 1.5, delayTime: 2.5, depth: 0.3, wet: 0.25 }).connect(thereminFilter);
    thereminReverb = new Tone.Reverb({ decay: 2.0, wet: 0.25 }).connect(thereminChorus);
    
    thereminSynth = new Tone.MonoSynth({
      oscillator: { type: 'fatsine', count: 3, spread: 20 },
      filter: { Q: 1.0, type: 'lowpass', frequency: 1800 },
      envelope: { attack: 0.15, decay: 0.2, sustain: 1.0, release: 0.5 },
      portamento: 0.08,
    }).connect(thereminReverb);

    thereminSubOsc = new Tone.Synth({
      oscillator: { type: 'sine' },
      envelope: { attack: 0.15, decay: 0.2, sustain: 1.0, release: 0.5 },
    }).connect(thereminReverb);
    thereminSubOsc.volume.value = -Infinity;

    thereminVibratoGain = new Tone.Gain(0);
    thereminVibrato = new Tone.LFO({ type: 'sine', frequency: 5, min: 0, max: 0.03 });
    thereminVibrato.connect(thereminVibratoGain);
    thereminVibratoGain.connect(thereminSynth.frequency);
    thereminVibrato.start();

    // ======= WARM PIANO PIPELINE =======
    pianoFilter = new Tone.Filter(2500, 'lowpass').connect(masterVolume);
    pianoChorus = new Tone.Chorus({ frequency: 1.5, delayTime: 3.0, depth: 0.3, wet: 0.2 }).connect(pianoFilter);
    pianoReverb = new Tone.Reverb({ decay: 2.2, wet: 0.2 }).connect(pianoChorus);
    
    pianoSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'fattriangle', count: 3, spread: 18 },
      envelope: { attack: 0.08, decay: 0.15, sustain: 0.8, release: 0.7 }
    }).connect(pianoReverb);

    // ======= WARM GUITAR PIPELINE =======
    guitarDistortion = new Tone.Distortion(0.0).connect(masterVolume);
    guitarFilter = new Tone.Filter(3000, 'lowpass').connect(guitarDistortion);
    guitarChorus = new Tone.Chorus({ frequency: 1.2, delayTime: 2.0, depth: 0.35, wet: 0.15 }).connect(guitarFilter);
    guitarReverb = new Tone.Reverb({ decay: 1.8, wet: 0.15 }).connect(guitarChorus);

    guitarStrings = [];
    for (let i = 0; i < 6; i++) {
      const stringSynth = new Tone.Synth({
        oscillator: { type: 'fatsawtooth', count: 3, spread: 15 },
        envelope: { attack: 0.015, decay: 1.2, sustain: 0.1, release: 0.8 }
      });
      stringSynth.connect(guitarReverb);
      stringSynth.connect(delaySend!);
      guitarStrings.push(stringSynth);
    }

    // ======= PERCUSSIVE DRUMS ENGINE (UNTOUCHED SAMPLES) =======
    kickSynth = new Tone.MembraneSynth({
      envelope: { attack: 0.002, decay: 0.25, sustain: 0 }
    }).connect(masterVolume);

    snareFilter = new Tone.Filter(1500, 'bandpass').connect(masterVolume);
    snareNoise = new Tone.NoiseSynth({
      noise: { type: 'pink' },
      envelope: { attack: 0.001, decay: 0.1, sustain: 0 }
    }).connect(snareFilter);

    hatFilter = new Tone.Filter(8000, 'highpass').connect(masterVolume);
    hatNoise = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: { attack: 0.001, decay: 0.05, sustain: 0 }
    }).connect(hatFilter);

    openHatFilter = new Tone.Filter(6000, 'highpass').connect(masterVolume);
    openHatNoise = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: { attack: 0.001, decay: 0.3, sustain: 0 }
    }).connect(openHatFilter);

    metalSynth = new Tone.MetalSynth({
      envelope: { attack: 0.001, decay: 0.8, release: 0.2 },
      harmonicity: 5.1, resonance: 8000, modulationIndex: 32
    }).connect(masterVolume);
    metalSynth.frequency.value = 250;

    rideSynth = new Tone.MetalSynth({
      envelope: { attack: 0.001, decay: 0.4, release: 0.1 },
      harmonicity: 3.2, resonance: 6000, modulationIndex: 16
    }).connect(masterVolume);
    rideSynth.frequency.value = 500;

    tomHighSynth = new Tone.MembraneSynth({
      envelope: { attack: 0.003, decay: 0.2, sustain: 0 }
    }).connect(masterVolume);

    tomMidSynth = new Tone.MembraneSynth({
      envelope: { attack: 0.003, decay: 0.3, sustain: 0 }
    }).connect(masterVolume);

    clapFilter = new Tone.Filter(2000, 'bandpass').connect(masterVolume);
    clapNoise = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: { attack: 0.001, decay: 0.15, sustain: 0 }
    }).connect(clapFilter);

    drumPlayers = new Tone.Players({
      kick: 'https://tonejs.github.io/audio/drum-samples/808/kick.mp3',
      snare: 'https://tonejs.github.io/audio/drum-samples/808/snare.mp3',
      hihat: 'https://tonejs.github.io/audio/drum-samples/808/hihat.mp3',
      crash: 'https://tonejs.github.io/audio/drum-samples/808/cowbell.mp3'
    }, () => {
      console.log('Drum samples loaded successfully.');
    }).connect(masterVolume);

    // ======= PERCUSSIVE TABLA ENGINE (UNTOUCHED SAMPLES) =======
    bayanSynth = new Tone.MembraneSynth({
      oscillator: { type: 'sine' },
      envelope: { attack: 0.005, decay: 0.4, sustain: 0.0, release: 0.4 }
    }).connect(masterVolume);

    dayanFilter = new Tone.Filter(600, 'highpass').connect(masterVolume);
    dayanSynth = new Tone.Synth({
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.002, decay: 0.2, sustain: 0.0, release: 0.2 }
    }).connect(dayanFilter);

    // Pre-generate reverbs to avoid runtime glitches
    await thereminReverb.ready;
    await pianoReverb.ready;
    await guitarReverb.ready;
    await reverbSend.ready;

    isInitialized = true;
  } catch (error) {
    console.error('Failed to initialize Tone.js Audio Engine:', error);
    throw error;
  }
}

// ======= THEREMIN AUDIO IMPLEMENTATION =======
let thereminActive = false;
let currentThereminNote = '';

export const thereminAudio = {
  start: (note: string, volumeNorm: number, _filterNorm: number) => {
    if (!thereminSynth || !isInitialized) return;
    const vol = -35 + volumeNorm * 29;
    thereminSynth.volume.value = vol;
    if (!thereminActive) {
      thereminSynth.triggerAttack(note);
      if (thereminSubOsc) {
        const subNote = noteToFreq(note) / 2;
        thereminSubOsc.triggerAttack(Tone.Frequency(subNote, 'midi').toNote());
      }
      thereminActive = true;
      currentThereminNote = note;
    } else if (note !== currentThereminNote) {
      thereminSynth.setNote(note);
      if (thereminSubOsc) {
        const subNote = noteToFreq(note) / 2;
        thereminSubOsc.setNote(Tone.Frequency(subNote, 'midi').toNote());
      }
      currentThereminNote = note;
    }
  },

  update: (note: string, volumeNorm: number, _filterNorm: number, isMuted: boolean) => {
    if (!thereminSynth || !isInitialized || !thereminActive) return;
    if (isMuted) {
      thereminSynth.volume.value = -Infinity;
      if (thereminSubOsc) thereminSubOsc.volume.value = -Infinity;
      return;
    }
    const vol = -35 + volumeNorm * 29;
    thereminSynth.volume.setValueAtTime(vol, Tone.now());
    if (note !== currentThereminNote) {
      thereminSynth.setNote(note);
      if (thereminSubOsc) {
        const subNote = noteToFreq(note) / 2;
        thereminSubOsc.setNote(Tone.Frequency(subNote, 'midi').toNote());
      }
      currentThereminNote = note;
    }
  },

  stop: () => {
    if (!thereminSynth || !isInitialized || !thereminActive) return;
    thereminSynth.triggerRelease();
    if (thereminSubOsc) thereminSubOsc.triggerRelease();
    thereminActive = false;
    currentThereminNote = '';
  },

  setWaveform: (type: OscillatorType) => {
    if (thereminSynth && isInitialized) {
      // fatsine, fatsawtooth etc
      const mappedType = type === 'sawtooth' ? 'fatsawtooth' : type === 'sine' ? 'fatsine' : type === 'square' ? 'fatsquare' : 'fattriangle';
      thereminSynth.oscillator.type = mappedType as any;
    }
  },

  setVibrato: (depth: number, speed: number) => {
    if (thereminVibrato && thereminVibratoGain) {
      thereminVibrato.frequency.value = speed;
      thereminVibratoGain.gain.value = depth * 0.05;
    }
  },

  setGlide: (time: number) => {
    if (thereminSynth && isInitialized) {
      thereminSynth.portamento = time;
    }
  },

  setSubOscLevel: (level: number) => {
    if (thereminSubOsc && isInitialized) {
      const db = level <= 0 ? -Infinity : -30 + level * 30;
      thereminSubOsc.volume.value = db;
    }
  },

  setReverb: (wetness: number) => {
    if (thereminReverb && isInitialized) {
      thereminReverb.wet.value = wetness;
    }
  },

  setTimbre: (mood: Mood, pattern: PatternIntensity) => {
    if (!thereminFilter || !thereminReverb || !thereminChorus) return;

    // Mood base filter cutoffs and resonance Q
    let baseCutoff = 2500;
    let Q = 1.0;
    let reverbWet = 0.25;
    let decay = 2.0;
    let chorusWet = 0.25;

    switch (mood) {
      case 'happy':
        baseCutoff = 3500;
        Q = 1.0;
        reverbWet = 0.18;
        decay = 1.6;
        chorusWet = 0.2;
        break;
      case 'sad':
        baseCutoff = 1500;
        Q = 1.0;
        reverbWet = 0.35;
        decay = 2.6;
        chorusWet = 0.3;
        break;
      case 'tense':
        baseCutoff = 2400;
        Q = 3.5; // Resonant filter focus
        reverbWet = 0.12;
        decay = 1.3;
        chorusWet = 0.15;
        break;
      case 'dreamy':
        baseCutoff = 1200;
        Q = 1.0;
        reverbWet = 0.55;
        decay = 3.8;
        chorusWet = 0.45;
        break;
    }

    // Pattern tilt filter cutoffs
    let patternMod = 0;
    if (pattern === 'busy') patternMod = 800;
    else if (pattern === 'sparse') patternMod = -400;

    const finalCutoff = Math.max(150, Math.min(8000, baseCutoff + patternMod));
    thereminFilter.frequency.setValueAtTime(finalCutoff, Tone.now());
    thereminFilter.Q.setValueAtTime(Q, Tone.now());

    thereminReverb.decay = decay;
    thereminReverb.wet.setValueAtTime(reverbWet, Tone.now());
    thereminChorus.wet.setValueAtTime(chorusWet, Tone.now());
  }
};

// ======= DRUMS AUDIO IMPLEMENTATION =======
export type DrumPad = 'kick' | 'snare' | 'hihat' | 'open_hihat' | 'crash' | 'ride' | 'tom_high' | 'tom_mid' | 'clap';

export const drumAudio = {
  trigger: (pad: DrumPad, velocity: number) => {
    if (!isInitialized) return;
    const vel = Math.max(0.15, Math.min(1.0, velocity));

    if (drumPlayers && drumPlayers.loaded) {
      const samplerMap: { [key: string]: string } = {
        kick: 'kick', snare: 'snare', hihat: 'hihat', crash: 'crash'
      };
      if (samplerMap[pad] && drumPlayers.has(samplerMap[pad])) {
        try {
          const player = drumPlayers.player(samplerMap[pad]);
          const vol = -24 + vel * 24;
          player.volume.value = vol;
          player.start();
          return;
        } catch (err) { /* fall through to synth */ }
      }
    }

    switch (pad) {
      case 'kick':
        kickSynth?.triggerAttackRelease('C1', '8n', Tone.now(), vel);
        break;
      case 'snare':
        snareFilter?.frequency.setValueAtTime(1000 + vel * 1000, Tone.now());
        snareNoise?.triggerAttack(Tone.now(), vel);
        break;
      case 'hihat':
        hatNoise?.triggerAttack(Tone.now(), vel * 0.7);
        break;
      case 'open_hihat':
        openHatNoise?.triggerAttack(Tone.now(), vel * 0.8);
        break;
      case 'crash':
        metalSynth?.triggerAttackRelease('8n', Tone.now(), vel);
        break;
      case 'ride':
        rideSynth?.triggerAttackRelease('16n', Tone.now(), vel * 0.6);
        break;
      case 'tom_high':
        tomHighSynth?.triggerAttackRelease('E3', '8n', Tone.now(), vel * 0.9);
        break;
      case 'tom_mid':
        tomMidSynth?.triggerAttackRelease('A2', '8n', Tone.now(), vel * 0.9);
        break;
      case 'clap':
        clapFilter?.frequency.setValueAtTime(1000 + vel * 1500, Tone.now());
        clapNoise?.triggerAttack(Tone.now(), vel * 0.8);
        break;
    }
  },

  setKitEffects: (reverbWet: number, filterCutoff: number) => {
    if (reverbSend && isInitialized) {
      reverbSend.wet.value = reverbWet;
    }
    [snareFilter, hatFilter, openHatFilter, clapFilter].forEach(filter => {
      if (filter) {
        filter.frequency.setValueAtTime(filterCutoff, Tone.now());
      }
    });
  }
};

// ======= PIANO AUDIO IMPLEMENTATION =======
export const pianoAudio = {
  noteOn: (note: string, velocity = 0.5) => {
    if (!pianoSynth || !isInitialized) return;
    try {
      pianoSynth.triggerAttack(note, Tone.now(), velocity);
    } catch (err) {
      console.warn('Piano triggerAttack failed:', err);
    }
  },
  noteOff: (note: string) => {
    if (!pianoSynth || !isInitialized) return;
    try {
      pianoSynth.triggerRelease(note, Tone.now());
    } catch (err) {
      console.warn('Piano triggerRelease failed:', err);
    }
  },
  releaseAll: () => {
    if (pianoSynth && isInitialized) {
      pianoSynth.releaseAll();
    }
  },
  setVolume: (volumeNorm: number) => {
    if (pianoSynth && isInitialized) {
      const db = volumeNorm <= 0.02 ? -Infinity : -35 + volumeNorm * 32;
      pianoSynth.volume.setValueAtTime(db, Tone.now());
    }
  },
  setTimbre: (mood: Mood, pattern: PatternIntensity) => {
    if (!pianoFilter || !pianoReverb || !pianoChorus) return;

    let baseCutoff = 2200;
    let Q = 1.0;
    let reverbWet = 0.2;
    let decay = 2.2;
    let chorusWet = 0.2;

    switch (mood) {
      case 'happy':
        baseCutoff = 2800;
        Q = 1.0;
        reverbWet = 0.15;
        decay = 1.8;
        chorusWet = 0.15;
        break;
      case 'sad':
        baseCutoff = 1400;
        Q = 1.0;
        reverbWet = 0.3;
        decay = 2.6;
        chorusWet = 0.25;
        break;
      case 'tense':
        baseCutoff = 1900;
        Q = 3.0;
        reverbWet = 0.12;
        decay = 1.4;
        chorusWet = 0.15;
        break;
      case 'dreamy':
        baseCutoff = 1100;
        Q = 1.0;
        reverbWet = 0.5;
        decay = 3.6;
        chorusWet = 0.45;
        break;
    }

    let patternMod = 0;
    if (pattern === 'busy') patternMod = 800;
    else if (pattern === 'sparse') patternMod = -400;

    const finalCutoff = Math.max(150, Math.min(6000, baseCutoff + patternMod));
    pianoFilter.frequency.setValueAtTime(finalCutoff, Tone.now());
    pianoFilter.Q.setValueAtTime(Q, Tone.now());

    pianoReverb.decay = decay;
    pianoReverb.wet.setValueAtTime(reverbWet, Tone.now());
    pianoChorus.wet.setValueAtTime(chorusWet, Tone.now());
  }
};

// ======= GUITAR AUDIO IMPLEMENTATION =======
export const GUITAR_CHORDS: { [key: string]: string[] } = {
  Em:   ['E2', 'B2', 'E3', 'G3', 'B3', 'E4'],
  G:    ['G2', 'B2', 'D3', 'G3', 'B3', 'G4'],
  C:    ['C3', 'E3', 'G3', 'C4', 'E4', 'G4'],
  D:    ['D3', 'A3', 'D4', 'F#4', 'A4', 'D5'],
  Am:   ['A2', 'E3', 'A3', 'C4', 'E4', 'A4'],
  F:    ['F2', 'C3', 'F3', 'A3', 'C4', 'F4'],
  E:    ['E2', 'B2', 'E3', 'G#3', 'B3', 'E4'],
  A:    ['A2', 'E3', 'A3', 'C#4', 'E4', 'A4'],
  Dm:   ['D3', 'A3', 'D4', 'F4', 'A4', 'D5'],
  Bdim: ['B2', 'D3', 'F3', 'B3', 'D4', 'F4'],
  C7:   ['C3', 'E3', 'G3', 'Bb3', 'C4', 'E4'],
  G7:   ['G2', 'B2', 'D3', 'F3', 'G3', 'B3'],
  Em7:  ['E2', 'B2', 'D3', 'G3', 'B3', 'E4'],
  Am7:  ['A2', 'E3', 'G3', 'C4', 'E4', 'A4'],
};

export const guitarAudio = {
  triggerString: (stringIdx: number, note: string, velocity = 0.5) => {
    if (guitarStrings.length < 6 || !isInitialized) return;
    try {
      const vel = Math.max(0.15, Math.min(1.0, velocity));
      const synth = guitarStrings[stringIdx];
      // Warm synth trigger using short attack release
      synth.triggerAttackRelease(note, '2n', Tone.now(), vel);
    } catch (err) {
      console.warn('Guitar trigger string failed:', err);
    }
  },
  
  setToneEffect: (toneType: GuitarToneType) => {
    if (!isInitialized || !guitarDistortion) return;
    // electric mode maps to distortion wetness
    if (toneType === 'electric') {
      guitarDistortion.wet.value = 0.65;
    } else {
      guitarDistortion.wet.value = 0.0;
    }
  },

  setTimbre: (mood: Mood, pattern: PatternIntensity) => {
    if (!guitarFilter || !guitarReverb || !guitarChorus) return;

    let baseCutoff = 2600;
    let Q = 1.0;
    let reverbWet = 0.15;
    let decay = 1.8;
    let chorusWet = 0.15;

    switch (mood) {
      case 'happy':
        baseCutoff = 3200;
        Q = 1.0;
        reverbWet = 0.1;
        decay = 1.4;
        chorusWet = 0.12;
        break;
      case 'sad':
        baseCutoff = 1800;
        Q = 1.0;
        reverbWet = 0.22;
        decay = 2.4;
        chorusWet = 0.22;
        break;
      case 'tense':
        baseCutoff = 2300;
        Q = 2.5;
        reverbWet = 0.08;
        decay = 1.1;
        chorusWet = 0.12;
        break;
      case 'dreamy':
        baseCutoff = 1300;
        Q = 1.0;
        reverbWet = 0.35;
        decay = 3.0;
        chorusWet = 0.4;
        break;
    }

    let patternMod = 0;
    if (pattern === 'busy') patternMod = 800;
    else if (pattern === 'sparse') patternMod = -400;

    const finalCutoff = Math.max(150, Math.min(7000, baseCutoff + patternMod));
    guitarFilter.frequency.setValueAtTime(finalCutoff, Tone.now());
    guitarFilter.Q.setValueAtTime(Q, Tone.now());

    guitarReverb.decay = decay;
    guitarReverb.wet.setValueAtTime(reverbWet, Tone.now());
    guitarChorus.wet.setValueAtTime(chorusWet, Tone.now());
  }
};

// ======= TABLA AUDIO IMPLEMENTATION =======
export type TablaStroke = 'na' | 'ta' | 'tin' | 'tun' | 'dha' | 'dhin';

export const tablaAudio = {
  triggerBayan: (stroke: 'open' | 'sharp' | 'muted' | 'na' | 'ta' | 'dha', velocity = 0.5, tuningOffset = 0) => {
    if (!bayanSynth || !isInitialized) return;
    const vel = Math.max(0.15, Math.min(1.0, velocity));
    const freqMultiplier = Math.pow(2, tuningOffset / 12);
    
    switch (stroke) {
      case 'open':
      case 'na':
      case 'dha':
        bayanSynth.envelope.decay = 0.45;
        bayanSynth.triggerAttackRelease(Tone.Frequency(55 * freqMultiplier, 'midi').toNote(), '4n', Tone.now(), vel);
        break;
      case 'sharp':
      case 'ta':
        bayanSynth.envelope.decay = 0.15;
        bayanSynth.triggerAttackRelease(Tone.Frequency(74 * freqMultiplier, 'midi').toNote(), '8n', Tone.now(), vel * 0.9);
        break;
      case 'muted':
        bayanSynth.envelope.decay = 0.08;
        bayanSynth.triggerAttackRelease(Tone.Frequency(41 * freqMultiplier, 'midi').toNote(), '16n', Tone.now(), vel * 0.5);
        break;
    }
  },

  triggerDayan: (stroke: 'open' | 'sharp' | 'muted' | 'tin' | 'tun' | 'dhin', velocity = 0.5, tuningOffset = 0) => {
    if (!dayanSynth || !isInitialized) return;
    const vel = Math.max(0.15, Math.min(1.0, velocity));
    const freqMultiplier = Math.pow(2, tuningOffset / 12);
    
    switch (stroke) {
      case 'open':
      case 'tin':
      case 'dhin':
        dayanSynth.envelope.decay = 0.35;
        dayanSynth.triggerAttackRelease(Tone.Frequency(74 * freqMultiplier, 'midi').toNote(), '4n', Tone.now(), vel);
        break;
      case 'sharp':
      case 'tun':
        dayanSynth.envelope.decay = 0.1;
        dayanSynth.triggerAttackRelease(Tone.Frequency(93 * freqMultiplier, 'midi').toNote(), '16n', Tone.now(), vel * 0.95);
        break;
      case 'muted':
        dayanSynth.envelope.decay = 0.22;
        dayanSynth.triggerAttackRelease(Tone.Frequency(85 * freqMultiplier, 'midi').toNote(), '8n', Tone.now(), vel * 0.7);
        break;
    }
  },

  setReverb: (wetness: number) => {
    if (reverbSend && isInitialized) {
      reverbSend.wet.value = wetness;
    }
  }
};

export function setMasterVolume(db: number) {
  if (masterVolume) {
    masterVolume.volume.value = db;
  }
}

export function getScaleNotes(root: string, octave: number, scale: string): string[] {
  const intervals: { [key: string]: number[] } = {
    major: [0, 2, 4, 5, 7, 9, 11],
    natural_minor: [0, 2, 3, 5, 7, 8, 10],
    harmonic_minor: [0, 2, 3, 5, 7, 8, 11],
    pentatonic: [0, 2, 4, 7, 9],
    blues: [0, 3, 5, 6, 7, 10],
    chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  };
  const PIANO_NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const rootIdx = PIANO_NOTE_NAMES.indexOf(root);
  if (rootIdx < 0) return ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4'];
  const semitones = intervals[scale] || intervals.major;
  
  return semitones.map(s => {
    const noteIdx = (rootIdx + s) % 12;
    const noteOctave = octave + Math.floor((rootIdx + s) / 12);
    return `${PIANO_NOTE_NAMES[noteIdx]}${noteOctave}`;
  });
}
