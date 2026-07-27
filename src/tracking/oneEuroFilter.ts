export class OneEuroFilter {
  private minCutoff: number;
  private beta: number;
  private dcutoff: number;
  private lastValue: number | null = null;
  private lastTime: number | null = null;
  private lastDeriv = 0;

  constructor(minCutoff = 1.0, beta = 0.05, dcutoff = 1.0) {
    this.minCutoff = minCutoff;
    this.beta = beta;
    this.dcutoff = dcutoff;
  }

  filter(value: number, timestamp: number): number {
    if (this.lastValue === null || this.lastTime === null) {
      this.lastValue = value;
      this.lastTime = timestamp;
      return value;
    }

    const dt = (timestamp - this.lastTime) / 1000.0; // convert ms to seconds
    if (dt <= 0) return this.lastValue;

    // Calculate raw derivative
    const deriv = (value - this.lastValue) / dt;

    // Filter derivative
    const alphaD = this.smoothingFactor(dt, this.dcutoff);
    const filteredDeriv = alphaD * deriv + (1.0 - alphaD) * this.lastDeriv;

    // Update cutoff frequency based on speed (derivative)
    const cutoff = this.minCutoff + this.beta * Math.abs(filteredDeriv);

    // Filter value
    const alpha = this.smoothingFactor(dt, cutoff);
    const filteredValue = alpha * value + (1.0 - alpha) * this.lastValue;

    this.lastValue = filteredValue;
    this.lastTime = timestamp;
    this.lastDeriv = filteredDeriv;

    return filteredValue;
  }

  private smoothingFactor(dt: number, cutoff: number): number {
    const r = 2 * Math.PI * cutoff * dt;
    return r / (r + 1.0);
  }

  reset() {
    this.lastValue = null;
    this.lastTime = null;
    this.lastDeriv = 0;
  }
}

export interface Landmark3D {
  x: number;
  y: number;
  z: number;
}

export class HandSmoother {
  private xFilters: OneEuroFilter[] = [];
  private yFilters: OneEuroFilter[] = [];
  private zFilters: OneEuroFilter[] = [];
  private lastTimestamp = 0;

  constructor(minCutoff = 1.2, beta = 0.04, dcutoff = 1.0) {
    // 21 landmarks per hand
    for (let i = 0; i < 21; i++) {
      this.xFilters.push(new OneEuroFilter(minCutoff, beta, dcutoff));
      this.yFilters.push(new OneEuroFilter(minCutoff, beta, dcutoff));
      this.zFilters.push(new OneEuroFilter(minCutoff, beta, dcutoff));
    }
  }

  smooth(landmarks: Landmark3D[], timestamp: number): Landmark3D[] {
    if (landmarks.length !== 21) {
      return landmarks; // fallback if data is incomplete
    }

    // Ensure timestamp is strictly increasing
    if (timestamp <= this.lastTimestamp) {
      timestamp = this.lastTimestamp + 1;
    }
    this.lastTimestamp = timestamp;

    return landmarks.map((lm, idx) => {
      return {
        x: this.xFilters[idx].filter(lm.x, timestamp),
        y: this.yFilters[idx].filter(lm.y, timestamp),
        z: this.zFilters[idx].filter(lm.z, timestamp),
      };
    });
  }

  reset() {
    this.xFilters.forEach((f) => f.reset());
    this.yFilters.forEach((f) => f.reset());
    this.zFilters.forEach((f) => f.reset());
    this.lastTimestamp = 0;
  }
}
