// 게임 효과음 (두 게임 공용)
// 소리 파일 없이 브라우저에서 바로 만들어 냄 (Web Audio). 저작권 걱정 없음, 용량 0
// - 연속으로 맞출수록 음이 한 칸씩 올라감 (도레미솔라 …)
// - 켜기/끄기는 그 폰에 저장 (doduk-sound)
// - 아이폰은 무음 스위치가 켜져 있으면 안 들림 (웹 소리는 무음 모드를 따름)
window.Sfx = (() => {
  let on = true;
  try { on = localStorage.getItem('doduk-sound') !== '0'; } catch {}
  let ac = null, master = null;
  function audio() {
    if (!ac) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ac = new AC(); master = ac.createGain(); master.gain.value = 0.7; master.connect(ac.destination);
    }
    if (ac.state === 'suspended') ac.resume();
    return ac;
  }
  // 아이폰·카톡 등은 손가락을 뗄 때(touchend/click) 소리를 처음 열어 줘야 함
  const unlock = () => { const a = audio(); if (a) { const o = a.createOscillator(), g = a.createGain(); g.gain.value = 0; o.connect(g); g.connect(master); o.start(); o.stop(a.currentTime + 0.01); } };
  ['touchend', 'click', 'keydown'].forEach((ev) => document.addEventListener(ev, unlock, { once: true, passive: true }));

  // 음 하나: freq(Hz), type, dur(초), vol, slide(끝 음까지 Hz 변화), delay(초)
  function tone({ freq, type = 'triangle', dur = 0.1, vol = 0.12, slide = 0, delay = 0 }) {
    if (!on) return;
    const a = audio(); if (!a) return;
    const t = a.currentTime + delay;
    const o = a.createOscillator(), g = a.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.02);
  }
  // 짧은 바람 소리 (카드 넘기기, 섞기)
  function whoosh({ dur = 0.12, vol = 0.08, delay = 0, high = 2400 } = {}) {
    if (!on) return;
    const a = audio(); if (!a) return;
    const t = a.currentTime + delay, n = Math.floor(a.sampleRate * dur);
    const buf = a.createBuffer(1, n, a.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const src = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
    src.buffer = buf; f.type = 'bandpass'; f.frequency.setValueAtTime(high, t); f.frequency.exponentialRampToValueAtTime(high / 3, t + dur);
    g.gain.value = vol; src.connect(f); f.connect(g); g.connect(master); src.start(t);
  }
  // 도레미솔라 (5음계) 두 옥타브: 연속 수에 따라 한 칸씩 올라감
  const SCALE = [523, 587, 659, 784, 880, 1047, 1175, 1319, 1568, 1760, 2093];
  const note = (i) => SCALE[Math.max(0, Math.min(SCALE.length - 1, i))];

  return {
    get on() { return on; },
    toggle() { on = !on; try { localStorage.setItem('doduk-sound', on ? '1' : '0'); } catch {} if (on) tone({ freq: 784, dur: 0.12 }); return on; },
    unlock,
    tap: () => tone({ freq: 700, dur: 0.05, vol: 0.06 }),                                   // 버튼
    select: () => tone({ freq: 900, dur: 0.06, vol: 0.08, type: 'sine' }),                   // 타일 고르기
    match(cb = 0) {                                                                          // 짝 맞춤 / 카드 가져오기 (연속일수록 높게)
      const f = note(cb);
      tone({ freq: f, dur: 0.1, vol: 0.13 });
      tone({ freq: f * 1.5, dur: 0.14, vol: 0.08, type: 'sine', delay: 0.05 });
      if (cb >= 4) tone({ freq: f * 2, dur: 0.18, vol: 0.06, type: 'sine', delay: 0.1 });    // 반짝
      if (cb >= 7) { tone({ freq: f * 2.5, dur: 0.2, vol: 0.05, type: 'sine', delay: 0.15 }); whoosh({ dur: 0.18, vol: 0.04, high: 5000, delay: 0.05 }); }
    },
    nope: () => tone({ freq: 220, dur: 0.12, vol: 0.06, type: 'square', slide: -60 }),       // 안 됨
    flip: () => { whoosh({ dur: 0.09, vol: 0.07 }); tone({ freq: 500, dur: 0.05, vol: 0.04, delay: 0.04 }); },   // 카드 뒤집기
    shuffle: () => { for (let i = 0; i < 4; i++) whoosh({ dur: 0.07, vol: 0.06, delay: i * 0.06, high: 1800 + i * 300 }); },
    bonus: () => { tone({ freq: 1047, dur: 0.1, vol: 0.09 }); tone({ freq: 1568, dur: 0.18, vol: 0.08, delay: 0.08 }); },   // 봉우리 등 보너스
    clear: () => [523, 659, 784, 1047, 1319].forEach((f, i) => tone({ freq: f, dur: 0.16, vol: 0.12, delay: i * 0.09 })),    // 단계·판 성공
    over: () => [523, 440, 349, 262].forEach((f, i) => tone({ freq: f, dur: 0.22, vol: 0.1, delay: i * 0.13, type: 'sine' })), // 끝
    kibble: () => { tone({ freq: 1319, dur: 0.08, vol: 0.08, type: 'sine', delay: 0.3 }); tone({ freq: 1760, dur: 0.14, vol: 0.07, type: 'sine', delay: 0.38 }); },  // 간식 한 알
  };
})();
