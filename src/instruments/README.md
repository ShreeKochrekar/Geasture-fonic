# GestureFonic Hand Role Convention

## Universal Rule: LEFT = SELECT, RIGHT = PLAY

To provide a consistent and intuitive experience across all instruments, GestureFonic
standardizes hand roles as follows:

### LEFT HAND — Selection / Context
- **What it does**: Chooses which note, chord, scale, or sound is "armed" for playing.
- **Examples**:
  - Guitar: Left-hand gesture selects the chord shape (Em, G, C, D, Am, F, etc.)
  - Piano: Left-hand position or gesture selects the octave/key range
  - Theremin: Left-hand position selects the scale/waveform, openness controls vibrato

### RIGHT HAND — Performance / Trigger
- **What it does**: The action that actually produces audible sound.
- **Examples**:
  - Guitar: Right-hand pinch+swipe strums or fingerpicks the selected chord
  - Piano: Right-hand fingertips poke downward to trigger notes
  - Theremin: Right-hand position controls pitch (X) and volume/filter (Y)

### Exceptions (Two-Hand Independent Instruments)
These instruments are intentionally two-hand-independent, where each hand triggers
its own sound zone:

- **Air Drums**: Each hand strikes its own drum zone independently
- **Tabla**: Left hand plays Bayan (bass), Right hand plays Dayan (treble)

Do NOT force a left=select/right=play split on these instruments.

### Why This Convention?
- Reduces cognitive load — users don't need to re-learn hand roles per instrument
- Mirrors real-world instruments (fretting hand selects, picking hand plays)
- Enables multi-instrument sessions without mental context switching

### Adding a New Instrument
When adding a new instrument module (e.g., `src/instruments/newinst.ts`), follow this pattern:

```
mapNewInstrumentLandmarks(trackingResult) {
  // 1. LEFT HAND: Detect selection/context gesture
  //    (e.g., which preset, scale, or sound is active)
  
  // 2. RIGHT HAND: Map to performance action
  //    (e.g., trigger note, hit drum, strum string)
}
```

If the instrument is inherently two-hand-independent, document the exception
in this README.

