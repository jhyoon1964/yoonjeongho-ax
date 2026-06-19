# -*- coding: utf-8 -*-
# Original CCM/worship-style instrumental (royalty-free, composed here).
# Gentle piano + string pad, hymn-like I-V-vi-IV in D major. Builds then fades.
import numpy as np, sys, wave

SR = 44100
DUR = float(sys.argv[1]) if len(sys.argv) > 1 else 219.0
BPM = 68.0
BEAT = 60.0 / BPM
BAR = 4 * BEAT
N = int(SR * DUR)
t_all = np.arange(N) / SR

def midi(n):  # midi note -> freq
    return 440.0 * 2 ** ((n - 69) / 12.0)

# note name -> midi
NAMES = {'C':0,'C#':1,'D':2,'D#':3,'E':4,'F':5,'F#':6,'G':7,'G#':8,'A':9,'A#':10,'B':11}
def m(name, octave):
    return 12 * (octave + 1) + NAMES[name]

def env(length, a, d, s_lvl, r):
    n = int(length * SR)
    e = np.ones(n) * s_lvl
    na, nd, nr = int(a*SR), int(d*SR), int(r*SR)
    na = min(na, n);
    if na: e[:na] = np.linspace(0, 1, na)
    if nd and na+nd <= n: e[na:na+nd] = np.linspace(1, s_lvl, nd)
    if nr:
        nr = min(nr, n); e[-nr:] *= np.linspace(1, 0, nr)
    return e

def piano(freq, length, amp=0.5):
    n = int(length * SR); t = np.arange(n)/SR
    # inharmonic-ish partials with decay
    parts = [(1,1.0),(2,0.5),(3,0.28),(4,0.16),(5,0.09),(6,0.05)]
    sig = np.zeros(n)
    for k,a in parts:
        sig += a*np.sin(2*np.pi*freq*k*t) * np.exp(-t*(2.2+0.5*k))
    # soft attack
    atk=int(0.006*SR);
    if atk: sig[:atk]*=np.linspace(0,1,atk)
    return amp*sig

def pad(freq, length, amp=0.25):
    n=int(length*SR); t=np.arange(n)/SR
    sig = (np.sin(2*np.pi*freq*t)
           +0.5*np.sin(2*np.pi*freq*2*t)
           +0.25*np.sin(2*np.pi*freq*3*t)
           +0.5*np.sin(2*np.pi*freq*1.003*t))  # slight detune chorus
    e=env(length, a=0.6, d=0.2, s_lvl=0.8, r=0.7)
    return amp*sig*e[:n]

def bass(freq, length, amp=0.4):
    n=int(length*SR); t=np.arange(n)/SR
    sig=np.sin(2*np.pi*freq*t)+0.2*np.sin(2*np.pi*freq*2*t)
    e=env(length,a=0.02,d=0.3,s_lvl=0.7,r=0.25)
    return amp*sig*e[:n]

buf = np.zeros(N+SR*4)
def place(sig, start):
    s=int(start*SR); e=s+len(sig)
    if s<0: return
    if e>len(buf): sig=sig[:len(buf)-s]; e=len(buf)
    buf[s:e]+=sig

# chord progression: D  A  Bm  G   (triads + bass root)
PROG = [
    (m('D',3), [m('D',4),m('F#',4),m('A',4)], m('D',2)),
    (m('A',2), [m('C#',4),m('E',4),m('A',4)], m('A',1)),
    (m('B',2), [m('D',4),m('F#',4),m('B',4)], m('B',1)),
    (m('G',2), [m('G',3),m('B',3),m('D',4)], m('G',1)),
]

# original gentle melody (chorus), scale degrees in D major, per bar (beats)
# each item: (note_midi, beat_offset, length_beats)
MEL = {
 0:[(m('F#',5),0,1.5),(m('A',5),1.5,0.5),(m('G',5),2,1),(m('F#',5),3,1)],
 1:[(m('E',5),0,2),(m('F#',5),2,1),(m('E',5),3,1)],
 2:[(m('F#',5),0,1),(m('A',5),1,1),(m('B',5),2,2)],
 3:[(m('A',5),0,2),(m('G',5),2,1),(m('F#',5),3,1)],
}

nbars = int(DUR / BAR) + 2
for b in range(nbars):
    bar_start = b*BAR
    if bar_start > DUR: break
    root, triad, bsnote = PROG[b % 4]
    # section dynamics
    pos = bar_start / DUR
    if pos < 0.11:   sect, padamp, pianoamp, do_bass, do_mel = 'intro', 0.16, 0.30, False, False
    elif pos < 0.40: sect, padamp, pianoamp, do_bass, do_mel = 'verse', 0.20, 0.42, True, False
    elif pos < 0.72: sect, padamp, pianoamp, do_bass, do_mel = 'chorus',0.26, 0.50, True, True
    elif pos < 0.88: sect, padamp, pianoamp, do_bass, do_mel = 'bridge',0.20, 0.40, True, False
    else:            sect, padamp, pianoamp, do_bass, do_mel = 'outro', 0.18, 0.34, True, (pos<0.94)
    # pad: sustain triad whole bar
    for nt in triad:
        place(pad(midi(nt-12), BAR*1.02, amp=padamp/len(triad)*1.6), bar_start)
    # bass
    if do_bass:
        place(bass(midi(bsnote), BAR*0.98, amp=0.34), bar_start)
        place(bass(midi(bsnote), BEAT*1.9, amp=0.18), bar_start+2*BEAT)
    # piano arpeggio (8th notes through chord tones)
    arp = [triad[0],triad[1],triad[2],triad[1], triad[0],triad[1],triad[2],triad[1]]
    for i,nt in enumerate(arp):
        if sect=='intro' and i%2==1:  # sparse intro
            continue
        place(piano(midi(nt), BEAT*0.9, amp=pianoamp*0.5), bar_start+i*0.5*BEAT)
    # melody
    if do_mel:
        for nt,boff,blen in MEL[b%4]:
            place(piano(midi(nt), BEAT*blen*0.95, amp=0.42), bar_start+boff*BEAT)

audio = buf[:N]

# simple reverb: a few delayed, decaying copies
def reverb(x, sr):
    out = x.copy()
    for delay_ms, g in [(53,0.30),(89,0.22),(127,0.16),(191,0.10)]:
        d=int(delay_ms/1000*sr)
        echo=np.zeros_like(x); echo[d:]=x[:-d]*g
        out+=echo
    return out
audio = reverb(audio, SR)

# gentle master: soft saturation + normalize
audio = np.tanh(audio*0.8)
audio = audio/np.max(np.abs(audio))*0.82

# overall fades: in 3s, out 7s
fi=int(3.0*SR); fo=int(7.0*SR)
audio[:fi]*=np.linspace(0,1,fi)
audio[-fo:]*=np.linspace(1,0,fo)**1.4

# stereo (slight width)
left = audio.copy(); right=audio.copy()
d=int(0.012*SR); right[d:]=audio[:-d]*0.97
stereo=np.stack([left,right],axis=1)
stereo=np.clip(stereo,-1,1)
pcm=(stereo*32767).astype(np.int16)

with wave.open('bgm.wav','w') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print(f"wrote bgm.wav  {DUR:.1f}s")
