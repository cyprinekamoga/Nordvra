# python films/nordvra/score.py <film> out.wav  – original music + sound effects for the Nordvra ads.
# One music bed per style (groove, winter, festive, calm) and a cue list per film that matches the
# film's timeline in films/nordvra/<film>/index.html. Synthesized in code; seeded, so every render is identical.
import sys
import numpy as np
import soundfile as sf

SR, BPM = 48000, 120
BEAT = 60 / BPM
rng = np.random.default_rng(5)


def note(name):
    names = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11}
    n, octave = name[:-1], int(name[-1])
    semis = names[n[0]] + (1 if '#' in n else 0) - (1 if n.endswith('b') else 0)
    return 440.0 * 2 ** ((semis + 12 * (octave + 1) - 69) / 12)


def env(n, a=0.005, d=0.3):
    t = np.arange(n) / SR
    return np.minimum(1, t / a) * np.exp(-t / d)


def lowpass(x, cutoff):
    k = 1 - np.exp(-2 * np.pi * cutoff / SR)
    y = np.empty_like(x); acc = 0.0
    for i, v in enumerate(x):
        acc += k * (v - acc); y[i] = acc
    return y


# ── instruments ────────────────────────────────────────────────────────
def kick(gain=0.9):
    n = int(0.45 * SR); t = np.arange(n) / SR
    return np.sin(2 * np.pi * np.cumsum(48 + 90 * np.exp(-t / 0.04)) / SR) * env(n, 0.002, 0.16) * gain


def clap():
    n = int(0.25 * SR)
    return lowpass(rng.standard_normal(n), 3500) * env(n, 0.003, 0.07) * 0.45


def hat(open_=False):
    n = int((0.18 if open_ else 0.05) * SR); x = rng.standard_normal(n)
    return (x - lowpass(x, 7000)) * env(n, 0.001, 0.06 if open_ else 0.015) * 0.22


def shaker(gain=0.14):
    n = int(0.07 * SR); x = rng.standard_normal(n)
    return (x - lowpass(x, 5000)) * env(n, 0.012, 0.02) * gain


def pluck(freq, d=0.35, gain=0.22):
    n = int(d * 3 * SR); t = np.arange(n) / SR
    tone = sum(np.sin(2 * np.pi * freq * h * t) * (0.55 ** (h - 1)) for h in range(1, 6))
    return tone * env(n, 0.003, d) * gain


def marimba(freq, d=0.45, gain=0.28):
    n = int(d * 3 * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * freq * t) + 0.35 * np.sin(2 * np.pi * freq * 3.93 * t) * np.exp(-t / 0.05)) * env(n, 0.002, d) * gain


def bell(freq, gain=0.22, d=0.8):
    n = int(2.4 * SR); t = np.arange(n) / SR
    tone = np.sin(2 * np.pi * freq * t) + 0.5 * np.sin(2 * np.pi * freq * 2.76 * t) * np.exp(-t / 0.3) + 0.25 * np.sin(2 * np.pi * freq * 5.4 * t) * np.exp(-t / 0.12)
    return tone * env(n, 0.002, d) * gain


def pad(freqs, length, gain=0.016, cutoff=1300):
    n = int(length * SR); t = np.arange(n) / SR; tone = np.zeros(n)
    for f in freqs:
        for det in (-0.1, 0.0, 0.1):
            ff = f * 2 ** (det / 12)
            tone += sum(np.sin(2 * np.pi * ff * h * t) / h for h in range(1, 6))
    tone = lowpass(tone, cutoff)
    return tone * np.minimum(1, t / 0.3) * np.minimum(1, (length - t) / 0.4) * gain


def bass(freq, length, gain=0.3):
    n = int(length * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * freq * t) + 0.3 * np.sin(4 * np.pi * freq * t)) * env(n, 0.01, length * 0.6) * gain


def whoosh(length=0.45, gain=0.28):
    n = int(length * SR); t = np.arange(n) / SR; x = rng.standard_normal(n)
    out = np.zeros(n); acc = 0.0
    for i in range(n):
        k = 1 - np.exp(-2 * np.pi * (300 + 4500 * t[i] / length) / SR)
        acc += k * (x[i] - acc); out[i] = acc
    return out * np.sin(np.pi * t / length) ** 2 * gain


def pop(freq=900, gain=0.3):
    n = int(0.12 * SR); t = np.arange(n) / SR
    return np.sin(2 * np.pi * np.cumsum(freq * (1 + 0.8 * np.exp(-t / 0.01))) / SR) * env(n, 0.001, 0.03) * gain


def tick(freq=1800, gain=0.22):
    n = int(0.06 * SR); t = np.arange(n) / SR
    return np.sin(2 * np.pi * freq * t) * env(n, 0.0005, 0.01) * gain


def thump(gain=0.9):
    return kick(gain) + lowpass(rng.standard_normal(int(0.45 * SR)), 400) * env(int(0.45 * SR), 0.002, 0.05) * 0.4


# ── cue helpers ────────────────────────────────────────────────────────
def count_ticks(t0, dur, frm, to, step=1):
    """Times where round(count(t)) changes, for count() = ease-out cubic as in lib.js."""
    out, last = [], None
    for i in range(int(dur * 240) + 1):
        tt = t0 + i / 240; u = min(1, (tt - t0) / dur)
        v = round((frm + (to - frm) * (1 - (1 - u) ** 3)) / step)
        if v != last:
            out.append(tt); last = v
    return out[1:]


def end_cues(s):
    return [('bell', s, 'C5'), ('chord', s), ('pop', s + 0.3, 1100), ('pop', s + 0.8, 1300), ('pop', s + 1.0, 1450)]


def wipes(*starts, lead=0.3):
    return [('whoosh', s - lead) for s in starts]


# ── films ──────────────────────────────────────────────────────────────
FILMS = {
    'tak': dict(dur=15, style='groove', cues=[
        *[('tick', t, 1500 + 600 * i / 40) for i, t in enumerate(count_ticks(0.5, 1.5, 0, 75000, 2500))],
        ('pop', 1.9, 800), *[('tick', t, 1200) for t in count_ticks(2.0, 1.6, 1, 31)], ('pluck', 3.4, 'E5'),
        *wipes(4.2, 8.4, 12.0), ('pop', 4.3, 900), ('thump', 5.5), ('pluck', 5.6, 'G5'), ('pluck', 6.2, 'C6'),
        ('pop', 8.7, 900), ('tick', 9.5, 1700), ('pluck', 10.0, 'E5'), ('pluck', 10.5, 'G5'), ('bell', 10.8, 'C6'),
        *end_cues(12.0)]),
    'sno': dict(dur=12, style='winter', cues=[
        ('pop', 0.25, 700), ('bell', 0.6, 'E5'), *wipes(4.0, 9.0), ('pop', 4.3, 900), ('bell', 4.6, 'G5'),
        ('whoosh_s', 6.5), ('bell', 6.7, 'A5'), *end_cues(9.0)]),
    'jul': dict(dur=15, style='festive', cues=[
        *[('tick', 0.3 + i * 0.09, 1200 + i * 40) for i in range(24)], ('bell', 2.8, 'C6'), ('pluck', 2.9, 'G5'),
        *wipes(4.2, 9.0, 12.0), ('pop', 4.55, 900), *[('pop', 5.7 + i * 0.25, 1100 + 150 * i) for i in range(3)],
        ('pluck', 9.1, 'E5'), ('pluck', 10.0, 'G5'), *end_cues(12.0)]),
    'ring': dict(dur=12, style='calm', cues=[
        ('marimba', 1.2, 'E5'), *wipes(3.6, 7.4, lead=0.4), ('marimba', 3.7, 'G5'), ('marimba', 4.6, 'C6'),
        ('ring', 7.9), ('marimba', 8.2, 'E5'), ('marimba', 8.8, 'G5'),
        *[('pop', 9.4 + 0.25 * i, 1000 + 120 * i, 0.15) for i in range(3)], ('chord', 9.4)]),
    'myter': dict(dur=21, style='groove', cues=[
        *[c for i in range(4) for c in (
            ('pop', i * 4.5 + 0.1, 850), ('tick', i * 4.5 + 0.6, 1400), ('tick', i * 4.5 + 0.72, 1600),
            ('thump', i * 4.5 + 1.8), ('bell', i * 4.5 + 1.85, ['E5', 'G5', 'A5', 'C6'][i]), ('pluck', i * 4.5 + 2.2, 'E5'))],
        *wipes(4.5, 9.0, 13.5, 18.0), *end_cues(18.0)]),
    'rekord': dict(dur=12, style='groove', cues=[
        *[('tick', t, 1500 + 70 * i) for i, t in enumerate(count_ticks(0.4, 1.8, 0, 8.87, 0.35))], ('thump', 2.5), ('bell', 2.55, 'G5'),
        *wipes(4.8, 8.6), *[('tick', t, 1500 + 70 * i) for i, t in enumerate(count_ticks(5.1, 1.4, 0, 41.2, 2))],
        ('pluck', 5.6, 'E5'), *end_cues(8.6)]),
    'vantar': dict(dur=10, style='groove', cues=[
        *[('tick', t, 1300 + 120 * i) for i, t in enumerate(count_ticks(0.6, 1.2, 1, 7))], ('pop', 1.6, 900),
        *wipes(3.4, 6.8), ('pluck', 3.5, 'E5'), ('pluck', 4.3, 'G5'), *end_cues(6.8)]),
}


def render(name, path):
    f = FILMS[name]; dur = f['dur']; style = f['style']
    N = int(SR * dur); L = np.zeros(N); R = np.zeros(N)

    def add(t0, sig, gain=1.0, pan=0.0):
        i = int(max(0, t0) * SR)
        if i >= N: return
        sig = sig[: N - i] * gain
        L[i:i + len(sig)] += sig * np.cos((pan + 1) * np.pi / 4); R[i:i + len(sig)] += sig * np.sin((pan + 1) * np.pi / 4)

    key = {'groove': [('C3', ['C4', 'E4', 'G4']), ('A2', ['A3', 'C4', 'E4']), ('F2', ['F3', 'A3', 'C4']), ('G2', ['G3', 'B3', 'D4'])],
           'winter': [('A2', ['A3', 'C4', 'E4']), ('F2', ['F3', 'A3', 'C4']), ('C3', ['C4', 'E4', 'G4']), ('G2', ['G3', 'B3', 'D4'])],
           'festive': [('F2', ['F3', 'A3', 'C4']), ('D2', ['D3', 'F3', 'A3']), ('Bb2', ['Bb3', 'D4', 'F4']), ('C3', ['C4', 'E4', 'G4'])],
           'calm': [('C3', ['C4', 'E4', 'G4']), ('F2', ['F3', 'A3', 'C4']), ('A2', ['A3', 'C4', 'E4']), ('G2', ['G3', 'B3', 'D4'])]}[style]
    bars = int(np.ceil(dur / 2))
    for bar in range(bars):
        root, triad = key[bar % 4]; t0 = bar * 2.0
        add(t0, pad([note(n) for n in triad], 2.0, 0.012 if style == 'calm' else 0.016))
        if style in ('groove', 'festive') and bar >= 1:
            for b in range(4): add(t0 + b * BEAT, bass(note(root), BEAT * 0.9), 0.9 if b % 2 == 0 else 0.6)
        if style == 'calm':  # slow arpeggio, one note per beat
            for b, n in enumerate(triad + [triad[1]]): add(t0 + b * BEAT, marimba(note(n) * 2, 0.6, 0.12), 1.0, [-0.3, 0.3][b % 2])
        if style == 'winter':
            for b, n in enumerate(triad + [triad[1]]): add(t0 + b * BEAT, bell(note(n) * 2, 0.07, 0.5), 1.0, [-0.4, 0.4][b % 2])
    for i in range(int(dur / (BEAT / 2))):
        t = i * BEAT / 2
        if style in ('groove', 'festive'):
            if t < 2.0:
                if i % 4 == 0: add(t, kick(0.55))
                if i % 2 == 1: add(t, hat(), 0.6, 0.3)
            else:
                if i % 2 == 0: add(t, kick())
                if i % 4 == 2: add(t, clap(), 0.8, -0.1)
                add(t, hat(i % 4 == 3), 0.8, 0.3)
            if style == 'festive': add(t + BEAT / 4, shaker(0.2), 1.0, -0.3)  # sleigh-like off-beats
        elif style == 'winter':
            if i % 8 == 0 and t >= 2.0: add(t, kick(0.6))
            if i % 2 == 1: add(t, shaker(0.1), 1.0, 0.3)

    for cue in f['cues']:
        kind, t = cue[0], cue[1]
        if kind == 'tick': add(t, tick(cue[2]), 0.9)
        elif kind == 'pop': add(t, pop(cue[2], cue[3] if len(cue) > 3 else 0.28))
        elif kind == 'pluck': add(t, pluck(note(cue[2]), 0.3), 0.9)
        elif kind == 'marimba': add(t, marimba(note(cue[2]), 0.5, 0.26))
        elif kind == 'bell': add(t, bell(note(cue[2])), 0.8)
        elif kind == 'thump': add(t, thump())
        elif kind == 'whoosh': add(t, whoosh(0.45, 0.2 if style == 'calm' else 0.28))
        elif kind == 'whoosh_s': add(t, whoosh(0.3, 0.2))
        elif kind == 'chord': add(t, pad([note(n) for n in ['C4', 'E4', 'G4', 'C5']], dur - t, 0.02))
        elif kind == 'ring':  # a soft two-tone phone ring, twice
            for k in range(2):
                for j in range(6): add(t + k * 0.7 + j * 0.06, tick([1300, 1050][j % 2], 0.12))

    mix = np.stack([L, R], axis=1)
    mix = np.tanh(mix * 1.2) / np.tanh(1.2)
    fade = np.ones(N); fade[-int(0.6 * SR):] = np.linspace(1, 0, int(0.6 * SR))
    mix *= fade[:, None]
    mix /= max(1e-9, np.abs(mix).max()) / 0.9
    sf.write(path, mix.astype(np.float32), SR)
    print('wrote', path, f'{dur}s', style)


if __name__ == '__main__':
    render(sys.argv[1], sys.argv[2])
