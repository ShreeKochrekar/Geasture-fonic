# GestureFonic Enhancement TODO — All Features Complete ✅

## Phase 1: Guitar Enhancements ✅
- [x] Add 10 new chords (Am, F, E, A, Dm, Bdim, C7, G7, Em7, Am7)
- [x] Add tone effects (nylon, steel, 12-string, electric with chorus/flanger)
- [x] Add chord progression patterns (I-IV-V, ii-V-I, 12-bar blues)
- [x] Add fret position detection via left-hand Y position
- [x] Add fingerpick arpeggio patterns
- [x] Update GuitarPlayScreen with chord library, progression selector, arpeggiator

## Phase 2: Piano Enhancements ✅
- [x] Expand to full multi-scale support (6 modes: Major, Minor, Harmonic Minor, Pentatonic, Blues, Chromatic)
- [x] Add chord detection (triads, 7ths, sus2, sus4)
- [x] Add arpeggiator with speed control
- [x] Add sustain pedal via left-hand gesture
- [x] Velocity-based note intensity

## Phase 3: Theremin Enhancements ✅
- [x] Add triangle waveform
- [x] Add 5 scale options (Major, Minor, Pentatonic, Chromatic, Whole Tone, Blues)
- [x] Add vibrato LFO (depth/speed controlled by left hand)
- [x] Add sub-oscillator for richer tone
- [x] Add adjustable glide time

## Phase 4: Drums Enhancements ✅
- [x] Expand to 8 pads (kick, snare, hihat, crash, ride, tom_high, tom_mid, clap)
- [x] Add open/closed hihat distinction via left-hand gesture
- [x] Add reverb send on crash

## Phase 5: Tabla Enhancements ✅
- [x] Add 6 classical strokes (Na, Ta, Tin, Tun, Dha, Dhin)
- [x] Add taal cycle visualizer (Teental 16, Ektaal 12, Jhaptaal 10)
- [x] Add resonance/tuning controls (±12 semitones)

## Phase 6: Self-View Camera Window ✅
- [x] Create SelfViewCamera component with glassmorphism HUDCard styling
- [x] Mirrored video preview (200x150px, bottom-left, draggable)
- [x] Hand-landmark skeleton overlay toggle
- [x] Draggable window + collapsible to icon
- [x] Same video stream + tracking data (no second MediaPipe instance)

## Phase 7: Gesture-Based Instrument Switching ✅
- [x] Gesture: both hands open-palm, raised above shoulders, held 0.8s
- [x] Progress ring visual indicator while holding
- [x] Instrument selection overlay with glass cards (Landing screen style)
- [x] Zone-hover-and-dwell selection (no pinch/click, dwell 1.5s)
- [x] Auto-dismiss after 3 seconds
- [x] Lightweight parallel check, works across all 5 instruments

## Phase 8: Consistent Hand Roles ✅
- [x] Guitar: Left=select chord, Right=play (as-is, already correct)
- [x] Piano: Left hand selects octave + sustain, Right hand plays notes
- [x] Theremin: Left hand selects scale + vibrato, Right hand pitch/volume
- [x] Drums & Tabla: Two-hand-independent (left as-is)
- [x] Convention documented in /src/instruments/README.md

## Phase 9: Theory-Free Mood System Overhaul ✅
- [x] Removed ALL music theory from screens (no note names, chord names, scale names, note labels)
- [x] Piano: No scale selector, no chord labels, no note names on keys — just mood name shown
- [x] Guitar: No chord names shown — mood name + fret dots displayed instead
- [x] Theremin: No scale selector, note labels, or frequency readout — mood name shown
- [x] Drums: No zone-specific labels on mood — mood name + pattern shown
- [x] Tabla: No stroke names — mood, pattern, and zone activity shown
- [x] GestureGuide: Rewritten with no music theory — mood-based gesture descriptions only
- [x] LearningLessons updated: First lesson now explains the mood system

## Phase 10: Mood-Based Gesture System ✅
- [x] `moodGestures.ts`: Central mood/pattern detection from hand state (finger count 1-4)
- [x] Moods: Happy (1), Sad (2), Tense (3), Dreamy (4) — universal across all instruments
- [x] Patterns: Sparse (left tilt), Normal (neutral), Busy (right tilt) — via hand tilt
- [x]
- [x] Mood configs per instrument define scale type, base octave, BPM range, description
- [x] All instrument UIs now show mood name (color-coded) and pattern name
- [x] Left hand finger count drives mood, right hand tilt drives pattern

## Phase 11: GestureGuide Rewrite ✅
- [x] All guides rewritten with mood-centric, zero-theory descriptions
- [x] Gestures reference "mood" and "pattern" instead of chords/scales/notes
