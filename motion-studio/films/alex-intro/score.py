# python films/alex-intro/score.py out/alex_score.wav  – original music + sound effects, synthesized.
# 120 BPM, 20 s: hand drums, shaker and a marimba-like melody. Cues match films/alex-intro/index.html.
import sys
import numpy as np
import soundfile as sf

SR, DUR, BPM = 48000, 20.0, 120
BEAT = 60 / BPM
N = int(SR * DUR)
L = np.zeros(N)
R = np.zeros(N)
rng = np.random.default_rng(11)  # seeded: the render is identical every time


def note(name):
    names = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11}
    n, octave = name[:-1], int(name[-1])
    semis = names[n[0]] + (1 if '#' in n else 0) - (1 if n.endswith('b') else 0)
    return 440.0 * 2 ** ((semis + 12 * (octave + 1) - 69) / 12)


def add(t0, sig, gain=1.0, pan=0.0):
    i = int(t0 * SR)
    if i >= N:
        return
    sig = sig[: N - i] * gain
    L[i:i + len(sig)] += sig * np.cos((pan + 1) * np.pi / 4)
    R[i:i + len(sig)] += sig * np.sin((pan + 1) * np.pi / 4)


def env(n, a=0.005, d=0.3):
    t = np.arange(n) / SR
    return np.minimum(1, t / a) * np.exp(-t / d)


def lowpass(x, cutoff):
    k = 1 - np.exp(-2 * np.pi * cutoff / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i, v in enumerate(x):
        acc += k * (v - acc)
        y[i] = acc
    return y


# ── instruments ────────────────────────────────────────────────────────
def drum_low(gain=0.8):  # deep hand drum: pitched body + a little skin noise
    n = int(0.5 * SR); t = np.arange(n) / SR
    f = 62 + 50 * np.exp(-t / 0.03)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.002, 0.22)
    skin = lowpass(rng.standard_normal(n), 900) * env(n, 0.001, 0.02) * 0.6
    return (body + skin) * gain


def drum_mid(gain=0.55):  # higher drum, a slap
    n = int(0.3 * SR); t = np.arange(n) / SR
    f = 170 + 80 * np.exp(-t / 0.015)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.001, 0.09)
    slap = lowpass(rng.standard_normal(n), 3000) * env(n, 0.001, 0.012)
    return (body + 0.7 * slap) * gain


def shaker(accent=False):
    n = int(0.07 * SR)
    noise = rng.standard_normal(n)
    hp = noise - lowpass(noise, 5000)
    return hp * env(n, 0.012, 0.02) * (0.22 if accent else 0.12)


def marimba(freq, d=0.45, gain=0.3):
    n = int(d * 3 * SR); t = np.arange(n) / SR
    tone = np.sin(2 * np.pi * freq * t) + 0.35 * np.sin(2 * np.pi * freq * 3.93 * t) * np.exp(-t / 0.05)
    return tone * env(n, 0.002, d) * gain


def pad(freqs, length, gain=0.014):
    n = int(length * SR); t = np.arange(n) / SR
    tone = np.zeros(n)
    for f in freqs:
        for det in (-0.1, 0.0, 0.1):
            ff = f * 2 ** (det / 12)
            tone += sum(np.sin(2 * np.pi * ff * h * t) / h for h in range(1, 5))
    tone = lowpass(tone, 1200)
    shape = np.minimum(1, t / 0.3) * np.minimum(1, (length - t) / 0.4)
    return tone * shape * gain


def bass(freq, length, gain=0.28):
    n = int(length * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * freq * t) + 0.25 * np.sin(4 * np.pi * freq * t)) * env(n, 0.01, length * 0.5) * gain


def whoosh(length=0.45, gain=0.3):
    n = int(length * SR); t = np.arange(n) / SR
    noise = rng.standard_normal(n)
    out = np.zeros(n); acc = 0.0
    for i in range(n):  # one-pole lowpass with a rising cutoff
        k = 1 - np.exp(-2 * np.pi * (300 + 4500 * t[i] / length) / SR)
        acc += k * (noise[i] - acc); out[i] = acc
    return out * np.sin(np.pi * t / length) ** 2 * gain


def plane_pass(length=1.9, gain=0.12):  # soft airy pass, panned left to right by the caller
    n = int(length * SR); t = np.arange(n) / SR
    noise = lowpass(rng.standard_normal(n), 1400)
    return noise * np.sin(np.pi * t / length) ** 2 * gain


def pop(freq=900, gain=0.3):
    n = int(0.12 * SR); t = np.arange(n) / SR
    f = freq * (1 + 0.8 * np.exp(-t / 0.01))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.001, 0.03) * gain


def page_flick(gain=0.35):  # paper: short band of noise with a quick swell
    n = int(0.16 * SR); t = np.arange(n) / SR
    noise = rng.standard_normal(n)
    band = lowpass(noise, 6000) - lowpass(noise, 1500)
    return band * np.sin(np.pi * np.minimum(1, t / 0.16)) ** 3 * gain


# ── music: one chord per bar (2 s) ─────────────────────────────────────
CHORDS = [('C3', ['C4', 'E4', 'G4']), ('F2', ['F3', 'A3', 'C4']), ('C3', ['C4', 'E4', 'G4']), ('G2', ['G3', 'B3', 'D4']),
          ('C3', ['C4', 'E4', 'G4']), ('F2', ['F3', 'A3', 'C4']), ('A2', ['A3', 'C4', 'E4']), ('G2', ['G3', 'B3', 'D4']),
          ('C3', ['C4', 'E4', 'G4']), ('C3', ['C4', 'E4', 'G4', 'C5'])]
for bar, (root, triad) in enumerate(CHORDS):
    t0 = bar * 2.0
    add(t0, pad([note(n) for n in triad], 2.0), 1.0, 0.0)
    if bar >= 1:
        for b in (0, 1.5, 2.0, 3.0):  # a light, bouncing bass line
            add(t0 + b * BEAT, bass(note(root), BEAT * 0.9), 0.9 if b in (0, 2.0) else 0.55)

for i in range(int(DUR / (BEAT / 4))):  # shaker on 16ths, accents on the off-beats
    t = i * BEAT / 4
    add(t, shaker(i % 4 == 2), 0.8 if t < 2.7 else 1.0, 0.35)

for i in range(int(DUR / (BEAT / 2))):  # hand drums from the first band onwards
    t = i * BEAT / 2
    pos = i % 8
    if t < 2.7:
        continue
    if pos in (0, 3, 6):
        add(t, drum_low(), 1.0, -0.15)
    if pos in (2, 5, 7):
        add(t, drum_mid(), 0.9, 0.2)

# Melody: a short pentatonic call on the intro, then answers under the Luganda phrases.
for k, (t, n) in enumerate([(0.0, 'G4'), (0.5, 'A4'), (1.0, 'C5'), (1.5, 'D5'), (2.0, 'E5'), (2.25, 'D5')]):
    add(t, marimba(note(n)), 0.9, [-0.3, 0.3][k % 2])
add(0.45, plane_pass(), 1.0, -0.6); add(1.4, plane_pass(1.0), 0.8, 0.6)

# ── sound effects on the visual cues ───────────────────────────────────
for t in (2.7, 5.2, 7.7, 10.2, 14.7):                    # each colour band rises
    add(t, whoosh(0.45, 0.28))
for s, motif in ((3.0, ['E5', 'G5', 'A5']), (5.5, ['G5', 'A5', 'C6']), (8.0, ['A5', 'C6', 'E6'])):
    add(s + 0.1, pop(700, 0.25))                          # the illustration lands
    add(s + 0.4, pop(1100, 0.22))                         # the speech bubble opens
    for k, n in enumerate(motif):                         # the Luganda phrase: three bright notes
        add(s + 0.5 + k * 0.125, marimba(note(n), 0.35, 0.32), 1.0, [-0.2, 0.0, 0.2][k])
    add(s + 1.0, marimba(note(motif[0]) / 2, 0.6, 0.25))  # the meaning: one low answer
for k in range(4):                                         # pages dealt onto the stack
    add(10.9 + k, page_flick()); add(10.9 + k, drum_mid(0.4), 1.0, 0.1)
add(15.15, drum_low(1.0)); add(15.15, pad([note(n) for n in ['C4', 'E4', 'G4', 'C5']], 4.8, 0.02))
for k, n in enumerate(['C5', 'E5', 'G5']):                # Learn. Speak. Discover.
    add(15.6 + 0.5 * k, marimba(note(n), 0.5, 0.3), 1.0, [-0.3, 0.0, 0.3][k])
add(17.1, pop(1300, 0.22)); add(17.1, marimba(note('C6'), 0.8, 0.25))

# ── master: soft clip, short fade-out ─────────────────────────────────
mix = np.stack([L, R], axis=1)
mix = np.tanh(mix * 1.2) / np.tanh(1.2)
fade = np.ones(N); fade[-int(0.8 * SR):] = np.linspace(1, 0, int(0.8 * SR))
mix *= fade[:, None]
mix /= max(1e-9, np.abs(mix).max()) / 0.9
sf.write(sys.argv[1], mix.astype(np.float32), SR)
print('wrote', sys.argv[1], f'{DUR}s')
