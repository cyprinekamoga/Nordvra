# python audio/score.py out/score.wav  – original music + sound effects for "Alla fyra", synthesized.
# 120 BPM, 20 s. Cues match index.html; every sound is a pure function of its cue time.
import sys
import numpy as np
import soundfile as sf

SR, DUR, BPM = 48000, 20.0, 120
BEAT = 60 / BPM
N = int(SR * DUR)
L = np.zeros(N)
R = np.zeros(N)
rng = np.random.default_rng(7)  # seeded: the render is identical every time


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
def kick(gain=0.9):
    n = int(0.45 * SR); t = np.arange(n) / SR
    f = 48 + 90 * np.exp(-t / 0.04)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.002, 0.16) * gain


def clap():
    n = int(0.25 * SR)
    noise = rng.standard_normal(n)
    return lowpass(noise, 3500) * env(n, 0.003, 0.07) * 0.5


def hat(open_=False):
    n = int((0.18 if open_ else 0.05) * SR)
    noise = rng.standard_normal(n)
    hp = noise - lowpass(noise, 7000)
    return hp * env(n, 0.001, 0.06 if open_ else 0.015) * 0.25


def pluck(freq, d=0.35, bright=1.0):
    n = int(d * 3 * SR); t = np.arange(n) / SR
    tone = sum(np.sin(2 * np.pi * freq * h * t) * (0.6 ** (h - 1)) * bright ** (h - 1) for h in range(1, 6))
    return tone * env(n, 0.003, d) * 0.22


def pad(freqs, length):
    n = int(length * SR); t = np.arange(n) / SR
    tone = np.zeros(n)
    for f in freqs:
        for det in (-0.12, 0.0, 0.12):  # slightly detuned saw-ish stack
            ff = f * 2 ** (det / 12)
            tone += sum(np.sin(2 * np.pi * ff * h * t) / h for h in range(1, 7))
    tone = lowpass(tone, 1400)
    shape = np.minimum(1, t / 0.25) * np.minimum(1, (length - t) / 0.4)
    return tone * shape * 0.018


def bass(freq, length):
    n = int(length * SR); t = np.arange(n) / SR
    tone = np.sin(2 * np.pi * freq * t) + 0.3 * np.sin(2 * np.pi * 2 * freq * t)
    return tone * env(n, 0.01, length * 0.6) * 0.32


def whoosh(length=0.5, up=True, gain=0.35):
    n = int(length * SR); t = np.arange(n) / SR
    noise = rng.standard_normal(n)
    sweep = (t / length) if up else (1 - t / length)
    out = np.zeros(n); acc = 0.0
    for i in range(n):  # one-pole lowpass with a moving cutoff
        k = 1 - np.exp(-2 * np.pi * (300 + 5000 * sweep[i]) / SR)
        acc += k * (noise[i] - acc); out[i] = acc
    return out * np.sin(np.pi * t / length) ** 2 * gain


def pop(freq=900, gain=0.35):
    n = int(0.12 * SR); t = np.arange(n) / SR
    f = freq * (1 + 0.8 * np.exp(-t / 0.01))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.001, 0.03) * gain


def tick(freq=1800, gain=0.3):
    n = int(0.08 * SR); t = np.arange(n) / SR
    return np.sin(2 * np.pi * freq * t) * env(n, 0.0005, 0.012) * gain


def bell(freq, gain=0.25):
    n = int(2.0 * SR); t = np.arange(n) / SR
    tone = np.sin(2 * np.pi * freq * t) + 0.5 * np.sin(2 * np.pi * freq * 2.76 * t) * np.exp(-t / 0.3)
    return tone * env(n, 0.002, 0.7) * gain


# ── music: C – Am – F – G, one chord per bar (2 s) ─────────────────────
CHORDS = [('C3', ['C4', 'E4', 'G4']), ('A2', ['A3', 'C4', 'E4']), ('F2', ['F3', 'A3', 'C4']), ('G2', ['G3', 'B3', 'D4'])]
for bar in range(10):
    t0 = bar * 2 * BEAT * 2
    root, triad = CHORDS[bar % 4]
    add(t0, pad([note(n) for n in triad], 2.0), 1.0 if bar < 8 else 0.8)
    if bar >= 2:
        for b in range(4):
            add(t0 + b * BEAT, bass(note(root), BEAT * 0.9), 0.9 if b % 2 == 0 else 0.6)

for i in range(int(DUR / BEAT * 2)):
    t = i * BEAT / 2
    beat = i / 2
    if t < 4.0:  # sparse intro: kick on each downbeat, quiet hats
        if i % 4 == 0: add(t, kick(0.6))
        if i % 2 == 1: add(t, hat(), 0.6, 0.3)
    elif t < 12.0 or t >= 16.0:  # groove
        if i % 2 == 0: add(t, kick())
        if i % 4 == 2: add(t, clap(), 0.8, -0.1)
        add(t, hat(i % 4 == 3), 0.8, 0.3)
    else:  # 12–16: half-time while the price is read
        if i % 4 == 0: add(t, kick(0.7))
        if i % 2 == 1: add(t, hat(), 0.5, 0.3)

# ── sound effects on the visual cues ───────────────────────────────────
for k, t in enumerate([0.0, 0.5, 1.0, 1.5]):            # quiz tiles pop in
    add(t, pop(700 + 120 * k), 0.8, [-0.4, 0.4, -0.4, 0.4][k])
add(2.0, whoosh(0.35, True, 0.2))                       # "Gissa!" row
for t in (2.5, 3.0, 3.5):                               # 3 · 2 · 1
    add(t, tick(1600), 0.9)
add(4.0, kick(1.0)); add(4.0, whoosh(0.6, False, 0.3))  # reveal thump
for k, n in enumerate(['C5', 'E5', 'G5', 'C6']):        # four checks, rising
    add(4.0 + 0.25 * k, pluck(note(n), 0.3), 1.0, [-0.4, 0.4, -0.4, 0.4][k])
add(5.45, whoosh(0.4, True, 0.25))                       # tiles merge
for k, n in enumerate(['E5', 'G5', 'A5', 'C6', 'D6', 'E6']):  # each new job rolls in
    t = 5.6 if k == 0 else 6.0 + k
    add(t, pop(1000, 0.3)); add(t, pluck(note(n), 0.25, 0.8), 0.8)
add(12.0, bell(note('E5')), 0.8)                        # cut to the winter photo
add(12.75, whoosh(0.5, True, 0.3))                      # price card rises
add(13.6, whoosh(0.3, True, 0.15))                      # underline sweep
add(15.8, whoosh(0.45, True, 0.3))                      # card shrinks into the button
add(16.0, bell(note('C5'), 0.3), 1.0); add(16.0, pluck(note('G5'), 0.6), 0.8)
for k, t in enumerate([16.35, 16.75, 17.0]):            # button text and chips
    add(t, pop(1200 + 150 * k, 0.25))
add(18.0, pad([note(n) for n in ['C4', 'E4', 'G4', 'C5']], 2.0), 1.2)  # resolve on C

# ── master: soft clip, short fade-out ─────────────────────────────────
mix = np.stack([L, R], axis=1)
mix = np.tanh(mix * 1.2) / np.tanh(1.2)
fade = np.ones(N); fade[-int(0.6 * SR):] = np.linspace(1, 0, int(0.6 * SR))
mix *= fade[:, None]
mix /= max(1e-9, np.abs(mix).max()) / 0.9
sf.write(sys.argv[1], mix.astype(np.float32), SR)
print('wrote', sys.argv[1], f'{DUR}s')
