// 도둑냥 창고: 들어온 사람마다 랜덤 강아지·고양이가 되어 창고를 돌아다니며 특가를 구경
// 홀(오늘의 타임딜)에서 시작하고, 양옆 문으로 강아지·고양이 사료/간식/영양제/용품 방에 들어감
// 방 진열대는 1시간마다 10개씩 랜덤으로 바뀜 (같은 시간엔 모두가 같은 10개)
// 다른 손님도 실시간으로 보임 (config.js에 Supabase 설정이 있으면 인터넷 전체, 없으면 같은 브라우저 탭끼리만)

const W = 720, H = 1240;           // 방 크기 (월드 좌표)
const SPEED = 190;                 // 걷는 속도 (월드 단위/초)
const PER_ROOM = 10;

// 캐릭터(BREEDS, drawPet)는 pets.js

// ---------- 배치 ----------
const ROWS = [300, 480, 660, 840, 1020];
const HALL_SHELVES = ROWS.flatMap((y) => [{ x: 268, y }, { x: 452, y }]);
const ROOM_SHELVES = ROWS.flatMap((y) => [{ x: 190, y }, { x: 530, y }]);
const DOOR_YS = [330, 520, 710, 900];      // 홀 양옆 문 높이 (왼쪽 강아지, 오른쪽 고양이)
const COUNTER = { x: 150, y: 1180 };
const ENTRY = { x: 420, y: 1185 };
const EXIT = { x: 360, y: 1205 };          // 방에서 홀로 나가는 문

// ---------- 화면 ----------
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
let dpr = 1, scale = 1, viewH = H, camY = 0;
function resize() {
  // PC에서는 화면 가운데 폰 크기(최대 520px)로만 그림
  dpr = window.devicePixelRatio || 1;
  canvas.width = canvas.clientWidth * dpr;
  canvas.height = innerHeight * dpr;
  scale = (canvas.clientWidth / W) * dpr;
  viewH = canvas.height / scale;
}
addEventListener('resize', resize);
resize();

// ---------- 나 ----------
const myId = Math.random().toString(36).slice(2, 10);
const me = { id: myId, breed: Math.floor(Math.random() * BREEDS.length), scene: 'hall', x: ENTRY.x, y: ENTRY.y, tx: ENTRY.x, ty: ENTRY.y };   // 들어오면 입구에 서 있음
document.getElementById('me').textContent = `나: ${BREEDS[me.breed].name}`;

// ---------- 데이터: 홀 타임딜 + 방 8개 ----------
let data = null;
const imgs = {};
const doduk = new Image(); doduk.src = 'img/doduk.png';
function img(url) {
  if (!url) return null;
  if (!imgs[url]) { imgs[url] = new Image(); imgs[url].src = url; }
  return imgs[url];
}
fetch('data/rooms.json').then((r) => r.json()).then((d) => { data = d; });

// 1시간 단위 시드로 섞어서 10개 고르기 → 같은 시간대엔 모두 같은 진열
function seeded(seed) {
  return () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function hourPick(room) {
  const hour = Math.floor(Date.now() / 3600000);
  let h = hour; for (const ch of room.id) h = (h * 31 + ch.charCodeAt(0)) | 0;
  const rnd = seeded(h), arr = room.items.slice();
  for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; }
  return arr.slice(0, PER_ROOM);
}
function sceneInfo() {
  if (!data) return { title: '도둑냥 창고', items: [], shelves: HALL_SHELVES };
  if (me.scene === 'hall') return { title: '도둑냥 창고', items: data.hall.items.slice(0, PER_ROOM), shelves: HALL_SHELVES };
  const room = data.rooms.find((r) => r.id === me.scene);
  return { title: room.title, items: hourPick(room), shelves: ROOM_SHELVES, room };
}
function doors() {
  if (!data) return [];
  return data.rooms.map((r, i) => ({ id: r.id, title: r.title, left: r.kind === 'dog', y: DOOR_YS[i % 4] }));
}

// ---------- 다른 손님 (실시간, 같은 방에 있는 손님만) ----------
const peers = new Map();   // id → { breed, x, y, tx, ty, seen }
function onPeer(p) {
  if (p.id === myId) return;
  if (p.scene !== me.scene) { peers.delete(p.id); return; }
  const cur = peers.get(p.id);
  // 예전 정보가 늦게 도착해도 되돌아가지 않게, 더 새 정보(ts)만 반영
  if (cur && p.ts && cur.ts && p.ts <= cur.ts) { cur.goneAt = 0; cur.seen = Date.now(); return; }
  if (cur) Object.assign(cur, { breed: p.breed, tx: p.tx, ty: p.ty, ts: p.ts, seen: Date.now(), goneAt: 0 });
  // 처음 보는 손님은 가려던 자리(tx, ty)에 바로 세움 (출발점으로 순간이동했다가 다시 걷는 일 없게)
  else peers.set(p.id, { breed: p.breed, x: p.tx, y: p.ty, tx: p.tx, ty: p.ty, ts: p.ts, seen: Date.now() });
}

// ---------- 말풍선: 정해진 문구만 (자유 입력 없음). 번호만 주고받아서 다른 글이 끼어들 수 없음 ----------
// 0번은 울음소리: 고양이는 "냥", 강아지는 "멍멍"
const PHRASES = ['(울음)', '이거 싸다', '득템했다', '어디 있어?', '같이 구경하자', '장바구니 담았다', '안녕', '배고파', '한 바퀴 더 돌자', '다음 방 가자', '고마워', '잘 가'];
const speech = new Map();   // id → { text, until }
function phraseText(i, breed) {
  if (i === 0) return BREEDS[breed].kind === 'cat' ? '냥' : '멍멍';
  return PHRASES[i] ?? null;
}
function onSay(id, i) {
  const who = id === myId ? me : peers.get(id);
  const text = who && Number.isInteger(i) ? phraseText(i, who.breed) : null;
  if (text) speech.set(id, { text, until: Date.now() + 4000 });
}

const net = (() => {
  const cfg = window.DODUK || {};
  let seq = 0;   // 보낼 때마다 1씩 늘어나는 번호 (어느 정보가 최신인지 구분)
  const payload = () => ({ id: me.id, breed: me.breed, scene: me.scene, x: Math.round(me.x), y: Math.round(me.y), tx: Math.round(me.tx), ty: Math.round(me.ty), ts: Date.now() * 100 + (seq++ % 100) });
  if (cfg.supabaseUrl && cfg.supabaseKey && window.supabase) {
    // Supabase Realtime presence: 방마다 채널을 따로 열어 그 방 접속자끼리 위치 공유
    // worker: 화면이 뒤로 가도 연결 유지 신호(heartbeat)가 밀리지 않게 별도 작업자에서 보냄
    const client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey, { realtime: { worker: true } });
    let ch = null, last = 0, pending = null, status = 'CONNECTING';
    const join = (scene) => {
      const moving = ch && ch.topic !== `realtime:doduk-${scene}`;
      if (ch) { ch.untrack(); client.removeChannel(ch); }
      if (moving || !ch) peers.clear();   // 방을 옮길 때만 비움 (같은 방 재접속 때 깜빡이지 않게)
      ch = client.channel(`doduk-${scene}`, { config: { presence: { key: myId } } });
      ch.on('broadcast', { event: 'say' }, ({ payload }) => onSay(payload.id, payload.i));
      ch.on('presence', { event: 'sync' }, () => {
        const state = ch.presenceState();
        const ids = new Set(Object.keys(state));
        // 같은 손님이 재접속 중이면 정보가 2개 겹칠 수 있음 → 가장 최신 것만 사용
        for (const metas of Object.values(state)) onPeer(metas.reduce((a, b) => ((b.ts ?? 0) > (a.ts ?? 0) ? b : a)));
        // 목록에서 빠진 손님은 바로 지우지 않고 8초 기다림 (잠깐 끊겼다 붙는 경우 깜빡임 방지)
        for (const [id, p] of peers) if (!ids.has(id) && !p.goneAt) p.goneAt = Date.now();
      });
      const mine = ch;
      ch.subscribe((s) => {
        if (mine !== ch) return;   // 방을 옮기며 닫은 예전 채널의 신호는 무시
        status = s;
        if (s === 'SUBSCRIBED') ch.track(payload());   // 끊겼다 다시 붙으면 Supabase가 알아서 재접속하고 여기로 다시 옴
      });
    };
    join(me.scene);
    // 폰에서 다른 앱 갔다 오면 연결이 끊겼을 수 있어서, 돌아오면 다시 접속해 위치를 알림
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState !== 'visible') return;
      if (status === 'SUBSCRIBED') ch.track(payload());
    });
    return {
      mode: 'online',
      get status() { return status; },
      join,
      say(i) { ch && ch.send({ type: 'broadcast', event: 'say', payload: { id: myId, i } }); },
      send() {
        clearTimeout(pending);
        pending = setTimeout(() => { last = Date.now(); ch && ch.track(payload()); }, Math.max(0, 250 - (Date.now() - last)));
      },
    };
  }
  // 테스트 모드: 같은 브라우저의 다른 탭끼리만 보임
  const bc = new BroadcastChannel('doduk-warehouse');
  bc.onmessage = (e) => (e.data.bye ? peers.delete(e.data.id) : e.data.say !== undefined ? (e.data.scene === me.scene && onSay(e.data.id, e.data.say)) : onPeer(e.data));
  setInterval(() => {
    bc.postMessage(payload());
    for (const [id, p] of peers) if (Date.now() - p.seen > 6000) peers.delete(id);
  }, 2000);
  addEventListener('pagehide', () => bc.postMessage({ id: myId, bye: true }));
  return {
    mode: 'local',
    join() { peers.clear(); bc.postMessage(payload()); },
    send() { bc.postMessage(payload()); },
    say(i) { bc.postMessage({ id: myId, scene: me.scene, say: i }); },
  };
})();
net.send();

// ?lineup 으로 열면 전 품종을 줄 세워서 보여줌 (그림 점검용)
const LINEUP = location.search.includes('lineup');
if (LINEUP) {
  // ?lineup=dog / ?lineup=cat 로 한 종류씩
  const kind = new URLSearchParams(location.search).get('lineup');
  BREEDS.map((b, i) => ({ b, i })).filter(({ b }) => !kind || b.kind === kind).forEach(({ i }, n) => {
    const p = { breed: i, x: 100 + (n % 4) * 170, y: 360 + Math.floor(n / 4) * 150, seen: Infinity };
    p.tx = p.x; p.ty = p.y;
    peers.set(`line${i}`, p);
  });
  me.x = me.tx = 640; me.y = me.ty = 1230;
}
// ?demo 로 열면 전 품종이 다 돌아다니는 시연 화면 (실제 접속자 아님)
if (location.search.includes('demo')) {
  BREEDS.forEach((_, i) => {
    if (i === me.breed) return;
    const p = { breed: i, x: 120 + Math.random() * 480, y: 230 + Math.random() * 900, seen: Infinity };
    p.tx = p.x; p.ty = p.y;
    peers.set(`demo${i}`, p);
  });
  setInterval(() => {
    for (const p of peers.values()) if (Math.random() < 0.3) { p.tx = 110 + Math.random() * 500; p.ty = 220 + Math.random() * 960; }
  }, 1500);
}

// ---------- 말풍선 버튼 ----------
const phrasesEl = document.getElementById('phrases');
let lastSay = 0;
PHRASES.forEach((_, i) => {
  const btn = document.createElement('button');
  btn.textContent = phraseText(i, me.breed);
  btn.onclick = () => {
    if (Date.now() - lastSay < 1500) return;   // 도배 방지
    lastSay = Date.now();
    onSay(myId, i);
    net.say(i);
    phrasesEl.classList.remove('open');
  };
  phrasesEl.appendChild(btn);
});
document.getElementById('talk').onclick = () => phrasesEl.classList.toggle('open');

// ---------- 방 이동 ----------
function goScene(scene, spawn) {
  me.scene = scene;
  me.x = me.tx = spawn.x; me.y = me.ty = spawn.y;
  closeCard(true);
  net.join(scene);
  net.send();
}
function checkDoors() {
  if (me.scene === 'hall') {
    for (const d of doors()) {
      const dx = d.left ? 40 : W - 40;
      if (Math.abs(me.x - dx) < 34 && Math.abs(me.y - d.y) < 46) return goScene(d.id, { x: EXIT.x, y: EXIT.y - 30 });
    }
  } else if (Math.abs(me.x - EXIT.x) < 70 && me.y > EXIT.y - 18) {
    const d = doors().find((x) => x.id === me.scene);
    goScene('hall', { x: d.left ? 110 : W - 110, y: d.y + 10 });
  }
}

// ---------- 조작: 바닥을 누르면 그쪽으로 걸어감 ----------
const hint = document.getElementById('hint');
canvas.addEventListener('pointerdown', (e) => {
  const wx = (e.offsetX * dpr) / scale;
  const wy = (e.offsetY * dpr) / scale + camY;
  me.tx = Math.max(24, Math.min(W - 24, wx));
  me.ty = Math.max(200, Math.min(H - 14, wy));
  net.send();
  hint.style.opacity = 0;
});

// ---------- 상품 카드 ----------
const sheet = document.getElementById('sheet');
let openShelf = -1, dismissed = -1;
function openCard(i, d) {
  openShelf = i;
  document.getElementById('sImg').src = d.img;
  document.getElementById('sName').textContent = d.name;
  document.getElementById('sSpec').textContent = sceneInfo().title;
  document.getElementById('sPrice').innerHTML = `${d.list ? `<s>${d.list}</s>` : ''}${d.off ? `<em>${d.off}</em>` : ''}${d.price}`;
  document.getElementById('sPer').textContent = d.expiry ? `유통기한 ${d.expiry}` : '';
  document.getElementById('sPer').style.display = d.expiry ? '' : 'none';
  document.getElementById('sMeta').textContent = d.ship;
  document.getElementById('sSay').textContent = d.say;
  document.getElementById('go').href = d.url;
  sheet.classList.add('open');
}
function closeCard(reset) { sheet.classList.remove('open'); dismissed = reset ? -1 : openShelf; openShelf = -1; }
document.getElementById('close').onclick = () => closeCard(false);
function nearShelf(shelves) {
  for (let i = 0; i < shelves.length; i++) {
    const s = shelves[i];
    if (Math.abs(me.x - s.x) < 80 && me.y > s.y + 8 && me.y < s.y + 100) return i;
  }
  return -1;
}

// ---------- 그리기 ----------
function rr(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }

function drawRoom(info) {
  const hall = me.scene === 'hall';
  ctx.fillStyle = '#9C6E46'; ctx.fillRect(0, -2000, W, 2000);
  ctx.fillStyle = hall ? '#E9DCC4' : info.room?.kind === 'dog' ? '#E6E1CC' : '#EADCD6';
  ctx.fillRect(0, 0, W, H + 2000);
  ctx.strokeStyle = 'rgba(120,90,60,.12)'; ctx.lineWidth = 2;
  for (let y = 190; y < H; y += 60) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  for (let x = 0; x < W; x += 60) { ctx.beginPath(); ctx.moveTo(x, 190); ctx.lineTo(x, H); ctx.stroke(); }
  // 뒷벽 + 간판
  ctx.fillStyle = '#B9875A'; ctx.fillRect(0, 0, W, 190);
  ctx.fillStyle = '#9C6E46'; for (let x = 0; x < W; x += 48) ctx.fillRect(x, 0, 4, 190);
  ctx.font = '40px Jua'; ctx.textAlign = 'center';
  const tw = ctx.measureText(info.title).width + 60;
  rr(W / 2 - tw / 2, 66, tw, 70, 14); ctx.fillStyle = '#2B2622'; ctx.fill();
  ctx.fillStyle = '#FFD54A'; ctx.fillText(info.title, W / 2, 116);
  if (!hall) { ctx.font = '18px "Noto Sans KR"'; ctx.fillStyle = '#fff'; ctx.fillText('1시간마다 진열이 바뀌어', W / 2, 168); }

  if (hall) {
    // 양옆 문: 왼쪽 강아지, 오른쪽 고양이
    for (const d of doors()) {
      const x = d.left ? 0 : W - 30;
      rr(x, d.y - 52, 30, 104, 6); ctx.fillStyle = d.left ? '#7B9E6B' : '#C57B88'; ctx.fill();
      ctx.font = '19px Jua';
      const label = d.title.replace(' ', '\n').split('\n');
      const bw = 88, bx = d.left ? 36 : W - 36 - bw;
      rr(bx, d.y - 30, bw, 58, 10); ctx.fillStyle = 'rgba(255,255,255,.92)'; ctx.fill();
      ctx.fillStyle = '#1f1f22'; ctx.textAlign = 'center';
      ctx.fillText(label[0], bx + bw / 2, d.y - 6); ctx.fillText(label[1], bx + bw / 2, d.y + 18);
      ctx.fillStyle = d.left ? '#7B9E6B' : '#C57B88';
      ctx.font = '22px Jua'; ctx.fillText(d.left ? '◀' : '▶', d.left ? bx - 2 : bx + bw + 2, d.y + 8);
    }
    rr(ENTRY.x - 70, H - 44, 140, 32, 10); ctx.fillStyle = '#C0563E'; ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = '18px Jua'; ctx.textAlign = 'center'; ctx.fillText('입구', ENTRY.x, H - 21);
  } else {
    rr(EXIT.x - 80, H - 46, 160, 36, 10); ctx.fillStyle = '#2B2622'; ctx.fill();
    ctx.fillStyle = '#FFD54A'; ctx.font = '19px Jua'; ctx.textAlign = 'center'; ctx.fillText('홀로 나가기', EXIT.x, H - 21);
  }
}

function drawShelf(s, d, wide) {
  const half = wide ? 120 : 82, box = wide ? 108 : 92;
  ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.beginPath(); ctx.ellipse(s.x, s.y + 62, half + 6, 15, 0, 0, Math.PI * 2); ctx.fill();
  rr(s.x - half, s.y - 10, half * 2, 70, 8); ctx.fillStyle = '#A8754A'; ctx.fill();
  rr(s.x - half, s.y - 10, half * 2, 16, 8); ctx.fillStyle = '#C48F5E'; ctx.fill();
  ctx.fillStyle = '#8A5C37'; ctx.fillRect(s.x - half + 5, s.y + 26, half * 2 - 10, 4);
  rr(s.x - box / 2, s.y - box - 8, box, box, 12); ctx.fillStyle = '#fff'; ctx.fill();
  const im = d && img(d.img);
  if (im && im.complete && im.naturalWidth) {
    const k = Math.min((box - 8) / im.naturalWidth, (box - 8) / im.naturalHeight);
    ctx.drawImage(im, s.x - (im.naturalWidth * k) / 2, s.y - 8 - box / 2 - (im.naturalHeight * k) / 2, im.naturalWidth * k, im.naturalHeight * k);
  }
  if (d) {
    ctx.font = '21px Jua';
    const w = ctx.measureText(d.price).width + 20;
    rr(s.x - w / 2, s.y + 30, w, 29, 8); ctx.fillStyle = '#FFD54A'; ctx.fill();
    ctx.fillStyle = '#1f1f22'; ctx.textAlign = 'center'; ctx.fillText(d.price, s.x, s.y + 52);
    if (d.off) {
      ctx.font = '17px Jua'; const ow = ctx.measureText(d.off).width + 14;
      rr(s.x + box / 2 - ow + 6, s.y - box - 18, ow, 24, 12); ctx.fillStyle = '#E8402F'; ctx.fill();
      ctx.fillStyle = '#fff'; ctx.fillText(d.off, s.x + box / 2 - ow / 2 + 6, s.y - box);
    }
  }
}

function drawCounter(t) {
  const c = COUNTER;
  rr(c.x - 80, c.y - 28, 160, 52, 10); ctx.fillStyle = '#6B4A30'; ctx.fill();
  rr(c.x - 80, c.y - 28, 160, 14, 10); ctx.fillStyle = '#8A6343'; ctx.fill();
  if (doduk.complete && doduk.naturalWidth) {
    const h = 110, w = (doduk.naturalWidth / doduk.naturalHeight) * h;
    ctx.drawImage(doduk, c.x - w / 2, c.y - 30 - h + Math.sin(t * 3) * 2, w, h);
  }
  const lines = ['어서 와, 홀엔 오늘 타임딜이 있어', '양옆 문으로 들어가면 방마다 물건이 달라', '방 진열은 1시간마다 바뀌어', '구경은 공짜, 살 때만 로그인'];
  const msg = lines[Math.floor(t / 4) % lines.length];
  ctx.font = '18px Jua'; const w = ctx.measureText(msg).width + 24;
  const bx = Math.min(W - w - 10, c.x + 30), by = c.y - 172;
  rr(bx, by, w, 38, 14); ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = '#1f1f22'; ctx.lineWidth = 3; ctx.stroke();
  ctx.fillStyle = '#1f1f22'; ctx.textAlign = 'left'; ctx.fillText(msg, bx + 12, by + 26);
}

// ---------- 움직임 + 그리기 루프 ----------
function step(p, dt) {
  const dx = p.tx - p.x, dy = p.ty - p.y, d = Math.hypot(dx, dy);
  if (d < 1) { p.x = p.tx; p.y = p.ty; return; }
  const m = Math.min(d, SPEED * dt);
  p.x += (dx / d) * m; p.y += (dy / d) * m;
}

let lastT = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - lastT) / 1000); lastT = now;
  const t = now / 1000;
  step(me, dt);
  for (const [id, p] of peers) {
    if (p.goneAt && Date.now() - p.goneAt > 8000) { peers.delete(id); continue; }
    step(p, dt);
  }
  checkDoors();

  const info = sceneInfo();
  camY = viewH >= H ? -(viewH - H) / 2 : Math.max(0, Math.min(H - viewH, me.y - viewH * 0.55));
  ctx.setTransform(scale, 0, 0, scale, 0, -camY * scale);
  ctx.clearRect(0, camY, W, viewH);
  drawRoom(info);

  const wide = me.scene !== 'hall';
  const items = LINEUP ? [] : info.shelves.map((s, i) => ({ y: s.y + 60, draw: () => drawShelf(s, info.items[i], wide) }));
  if (me.scene === 'hall') items.push({ y: COUNTER.y + 24, draw: () => drawCounter(t) });
  const tops = [];   // 말풍선을 맨 위에 그리려고 캐릭터 머리 위치를 모아 둠
  for (const [id, p] of peers) items.push({ y: p.y, draw: () => tops.push([id, p.x, drawPet(ctx, p, t, false)]) });
  items.push({ y: me.y, draw: () => tops.push([myId, me.x, drawPet(ctx, me, t, true)]) });
  items.sort((a, b) => a.y - b.y).forEach((it) => it.draw());
  for (const [id, x, top] of tops) {
    const s = speech.get(id);
    if (!s) continue;
    if (Date.now() > s.until) { speech.delete(id); continue; }
    ctx.font = '20px Jua'; ctx.textAlign = 'center';
    const w = ctx.measureText(s.text).width + 24, by = top - 40;
    rr(x - w / 2, by, w, 34, 14); ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = '#1f1f22'; ctx.lineWidth = 3; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - 6, by + 33); ctx.lineTo(x, by + 42); ctx.lineTo(x + 6, by + 33); ctx.fillStyle = '#fff'; ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#1f1f22'; ctx.fillText(s.text, x, by + 24);
  }

  const n = nearShelf(info.shelves);
  const still = Math.hypot(me.tx - me.x, me.ty - me.y) < 2;
  if (n >= 0 && n !== openShelf && n !== dismissed && still && info.items[n]) openCard(n, info.items[n]);
  if (openShelf >= 0 && n !== openShelf) { sheet.classList.remove('open'); openShelf = -1; }
  if (n !== dismissed) dismissed = -1;   // 닫았던 선반을 벗어나면 다시 열릴 수 있게

  const conn = net.mode === 'local' ? ' · 테스트' : net.status === 'SUBSCRIBED' ? '' : net.status === 'CONNECTING' ? ' · 연결 중' : ' · 끊김';
  document.getElementById('count').innerHTML = `<b>${peers.size + 1}</b>마리${conn}`;
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
