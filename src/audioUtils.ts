/**
 * Generates white noise samples
 */
export function generateWhiteNoise(
  numSamples: number,
  amplitude: number = 100 // Adjust for desired noise level (0-32767)
): Int16Array {
  const noise = new Int16Array(numSamples);

  for (let i = 0; i < numSamples; i++) {
    // Generate white noise and scale to desired amplitude
    noise[i] = Math.round((Math.random() * 2 - 1) * amplitude);
  }

  return noise;
}

// Mix the noise with silence or very quiet audio
export function generateQuietAudioWithNoise(
  numSamples: number,
  noiseAmplitude: number = 50,
  baseAmplitude: number = 10
): Int16Array {
  const samples = new Int16Array(numSamples);

  for (let i = 0; i < numSamples; i++) {
    // Generate base quiet tone (can be adjusted or removed)
    const baseAudio = Math.sin(i * 0.01) * baseAmplitude;

    // Add noise
    const noise = (Math.random() * 2 - 1) * noiseAmplitude;

    // Combine and clamp to 16-bit range
    samples[i] = Math.max(
      -32768,
      Math.min(32767, Math.round(baseAudio + noise))
    );
  }

  return samples;
}

export function mixAudioWithNoise(
  audioSignal: Int16Array | null, // Your main audio (or null if just noise)
  numSamples: number,
  signalGain: number = 1.0, // Main audio level (0.0 to 1.0)
  noiseGain: number = 0.02 // Noise level (0.0 to 1.0)
): Int16Array {
  const mixed = new Int16Array(numSamples);

  for (let i = 0; i < numSamples; i++) {
    // Generate white noise sample
    const noise = (Math.random() * 2 - 1) * 32767 * noiseGain;

    // Mix with audio if present, otherwise just use noise
    const signalComponent = audioSignal ? audioSignal[i] * signalGain : 0;

    // Combine and clamp to 16-bit range
    mixed[i] = Math.max(
      -32768,
      Math.min(32767, Math.round(signalComponent + noise))
    );
  }

  return mixed;
}

/**
 * Encodes an Int16Array of PCM → a Buffer of 8-bit µ-law bytes.
 */
export function encodeMuLawBuffer(pcmSamples: Int16Array): Buffer {
  const out = Buffer.alloc(pcmSamples.length);
  for (let i = 0; i < pcmSamples.length; i++) {
    out[i] = muLawEncode(pcmSamples[i]);
  }
  return out;
}

/**
 * Encodes one 16-bit PCM sample → 8-bit µ-law sample.
 * Clamps sample to [-32768..32767].
 */
function muLawEncode(sample: number): number {
  // Clamp
  if (sample > 32767) sample = 32767;
  if (sample < -32768) sample = -32768;

  // Get sign bit
  const sign = sample < 0 ? 0x80 : 0x00;
  if (sign) sample = -sample;

  // µ-law uses a logarithmic segment approach.
  // We'll find the "exponent" by finding how many times we can shift right
  // before the value falls under 128.
  let exponent = 0;
  let magnitude = sample >> 2; // The bias in µ-law is effectively 4, so shift by 2
  while (magnitude > 0x3f) {
    magnitude >>= 1;
    exponent++;
  }

  // The mantissa is the lower 6 bits
  const mantissa = magnitude & 0x3f;

  const ulawByte = ~(sign | (exponent << 4) | (mantissa & 0x0f)) & 0xff;
  return ulawByte;
}
