import React from 'react';
import type { InstrumentType } from '../store/appStore';

interface GestureGuideProps {
  instrument?: InstrumentType;
}

const GESTURE_GUIDES: Record<string, { gesture: string; description: string; icon: string }[]> = {
  theremin: [
    { gesture: 'Left hand finger count (1-4)', description: '🫲 Selects mood: 1=Happy, 2=Sad, 3=Tense, 4=Dreamy', icon: '1️⃣2️⃣3️⃣4️⃣' },
    { gesture: 'Right hand open = play', description: '🫱 Fully open hand = sound active. Closed hand = silent', icon: '🖐️' },
    { gesture: 'Right hand Y position', description: '⬆️⬇️ Hand height glides pitch within the selected mood\'s range', icon: '⬆️⬇️' },
    { gesture: 'Right hand tilt', description: 'Left tilt = slow vibrato, Neutral = stable, Right = fast flutter', icon: '↗️' },
  ],
  drums: [
    { gesture: 'Left hand finger count (1-4)', description: '🫲 Selects kit mood: 1=Pop, 2=Lo-Fi, 3=Trap, 4=Ambient', icon: '1️⃣2️⃣3️⃣4️⃣' },
    { gesture: 'Right hand open = active', description: '🫱 Open hand arms the drums. Closed hand = silent', icon: '🖐️' },
    { gesture: 'Strike motion (single hand)', description: '👇 Downward swipe triggers a hit in the active quadrant: TL=Snare, TR=Hihat, BL=Kick, BR=Crash', icon: '👇' },
    { gesture: 'Right hand tilt', description: 'Left tilt = manual hits only, Neutral/Right = adds auto layers', icon: '↗️' },
  ],
  piano: [
    { gesture: 'Left hand finger count (1-4)', description: '🫲 Selects mood voicing: 1=Happy, 2=Sad, 3=Tense, 4=Dreamy (lock when open)', icon: '1️⃣2️⃣3️⃣4️⃣' },
    { gesture: 'Left hand open = trigger', description: '🫲 Fully open hand (5 fingers) triggers and sustains the chord pad', icon: '🖐️' },
    { gesture: 'Left hand Y height', description: '⬆️⬇️ Hand height controls volume & brightness of the pad', icon: '⬆️⬇️' },
    { gesture: 'Left hand tilt', description: 'Tilt left = slow arpeggio, Neutral = full block chord, Tilt right = fast arpeggio-tremolo', icon: '↗️' },
    { gesture: 'Close left hand = stop', description: '✊ Relax or close hand to stop and release the pad sound', icon: '✊' },
  ],
  guitar: [
    { gesture: 'Left hand finger count (1-4)', description: '🫲 Selects mood progression: 1=Happy, 2=Sad, 3=Tense, 4=Dreamy (lock when open)', icon: '1️⃣2️⃣3️⃣4️⃣' },
    { gesture: 'Left hand open = strum', description: '🫲 Opening hand strums and advances to the next chord in the progression', icon: '🖐️' },
    { gesture: 'Left hand tilt', description: 'Tilt left = slow repeating strum, Neutral = standard strum, Tilt right = fast strum', icon: '↗️' },
    { gesture: 'Close left hand = stop', description: '✊ Relax or close hand to stop strumming and let notes decay', icon: '✊' },
  ],
  tabla: [
    { gesture: 'Left hand finger count (1-4)', description: '🫲 Selects tuning mood: 1=Bright, 2=Deep, 3=Sharp, 4=Reverb', icon: '1️⃣2️⃣3️⃣4️⃣' },
    { gesture: 'Right hand open = active', description: '🫱 Open hand arms the tabla. Closed hand = silent', icon: '🖐️' },
    { gesture: 'Strike motion (single hand)', description: '👇 Downward strike on left side triggers Bayan (bass), right side triggers Dayan (treble)', icon: '👇' },
    { gesture: 'Right hand tilt', description: 'Left tilt = manual strokes only, Neutral/Right = adds auto loop layers', icon: '↗️' },
  ],
};

export const GestureGuide: React.FC<GestureGuideProps> = ({ instrument = 'theremin' }) => {
  const guides = GESTURE_GUIDES[instrument] || GESTURE_GUIDES.theremin;

  return (
    <div className="glass-panel p-4 rounded-sm border border-outline-variant/20 w-full">
      <div className="flex items-center gap-2 mb-3 border-b border-outline-variant/10 pb-2">
        <span className="material-symbols-outlined text-primary text-sm">gesture</span>
        <h3 className="font-label-bold text-[10px] text-primary uppercase tracking-widest">Gesture Guide</h3>
      </div>
      <div className="space-y-2.5">
        {guides.map((item, idx) => (
          <div key={idx} className="flex items-start gap-2.5 text-[11px]">
            <span className="shrink-0 text-base leading-none mt-0.5">{item.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="font-label-bold text-[10px] text-on-surface uppercase tracking-wider">{item.gesture}</p>
              <p className="font-label-mono text-[9px] text-on-surface-variant leading-relaxed mt-0.5">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const LearningLessons: React.FC = () => {
  const lessons = [
    {
      title: 'Mood System — No Theory Needed',
      body: '4 moods (Happy/Sad/Tense/Dreamy) mapped to finger counts. One gesture vocabulary works across all 5 instruments. No note names or scales to memorize.',
      icon: '🎯',
    },
    {
      title: 'Calibration is Key',
      body: 'Always complete the calibration step before playing. It maps your physical arm range to the instrument\'s full range, ensuring accurate note/volume control.',
      icon: '🎯',
    },
    {
      title: 'Natural Lighting Matters',
      body: 'MediaPipe Hand Tracking works best in well-lit environments with even lighting. Avoid strong backlight or dark rooms for best accuracy.',
      icon: '💡',
    },
    {
      title: 'Smooth & Deliberate Gestures',
      body: 'The One Euro Filter smooths hand jitter, but deliberate, controlled movements produce the cleanest audio. Quick jerky motions may trigger unintended notes.',
      icon: '🧘',
    },
    {
      title: 'Latency is Minimized',
      body: 'Everything runs client-side using requestAnimationFrame (not setInterval). Gesture-to-sound latency stays under ~50ms for a responsive feel.',
      icon: '⚡',
    },
    {
      title: 'Browser Compatibility',
      body: 'This app requires a Chromium-based browser (Chrome, Edge) for WebGPU delegate support. Firefox/Safari may fall back to CPU mode with reduced performance.',
      icon: '🌐',
    },
  ];

  return (
    <div className="glass-panel p-4 rounded-sm border border-outline-variant/20 w-full">
      <div className="flex items-center gap-2 mb-3 border-b border-outline-variant/10 pb-2">
        <span className="material-symbols-outlined text-amber-400 text-sm">school</span>
        <h3 className="font-label-bold text-[10px] text-amber-400 uppercase tracking-widest">Learning Lessons</h3>
      </div>
      <div className="space-y-3">
        {lessons.map((lesson, idx) => (
          <div key={idx} className="flex items-start gap-2.5 text-[11px]">
            <span className="shrink-0 text-base leading-none mt-0.5">{lesson.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="font-label-bold text-[10px] text-on-surface uppercase tracking-wider">{lesson.title}</p>
              <p className="font-label-mono text-[9px] text-on-surface-variant leading-relaxed mt-0.5">{lesson.body}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
