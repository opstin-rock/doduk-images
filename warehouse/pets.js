// 도둑냥 창고 손님 캐릭터: 강아지 24종 + 고양이 22종
// 그림 파일 없이 코드로 그림. 품종마다 크기, 다리 길이, 몸통, 주둥이, 귀, 꼬리, 무늬, 표정 특징을 다르게 줌
//   size 전체 크기 · legH/legW 다리 길이/굵기 · bodyW/bodyH 몸통 · headR 머리 · snout 주둥이 길이(0이면 납작한 얼굴)
//   ear 귀 모양 · tail 꼬리 모양 · pattern 무늬 · 그 밖에 tongue(혀 내밀기), blush, topknot(머리 리본), brows(눈썹 점),
//   beard(수염), wrinkle(주름), mane(목 갈기), oddEyes(오드아이), eyeSize, derp(짝눈)

const BREEDS = [
  // ---------- 강아지 ----------
  { name: '말티즈', kind: 'dog', size: 0.75, base: '#FFFFFF', ear: 'flop', tail: 'plume', snout: 4, fluffy: true, topknot: '#FF7FA8', tongue: true, blush: true },
  { name: '토이푸들', kind: 'dog', size: 0.8, base: '#D9A26B', ear: 'flop', tail: 'pompom', snout: 7, fluffy: true, curly: true, blush: true },
  { name: '포메라니안', kind: 'dog', size: 0.7, base: '#EE9A45', belly: '#FBE3C4', ear: 'small', tail: 'plume', snout: 3, legH: 5, bodyH: 17, fluffy: true, mane: true, tongue: true },
  { name: '치와와', kind: 'dog', size: 0.62, base: '#E2B77D', belly: '#F6E2C2', ear: 'huge', tail: 'whip', snout: 4, legW: 4.5, eyeSize: 1.6, derp: true },
  { name: '시바', kind: 'dog', base: '#D98B3E', belly: '#FFF6EA', pattern: 'cheek', ear: 'point', tail: 'curl', snout: 8, brows: '#FFF6EA' },
  { name: '웰시코기', kind: 'dog', base: '#E39B4B', belly: '#FFFFFF', pattern: 'blaze', ear: 'big', tail: 'stub', snout: 8, legH: 4, bodyW: 30, bodyH: 15, tongue: true },
  { name: '진돗개', kind: 'dog', size: 1.05, base: '#F3E9D6', ear: 'point', tail: 'curl', snout: 9 },
  { name: '비숑', kind: 'dog', size: 0.8, base: '#FFFDF8', ear: 'hidden', tail: 'plume', snout: 3, headR: 23, fluffy: true, curly: true, blush: true },
  { name: '골든리트리버', kind: 'dog', size: 1.35, base: '#E3B35F', belly: '#F0CD88', ear: 'flop', tail: 'plume', snout: 12, tongue: true },
  { name: '닥스훈트', kind: 'dog', base: '#8B4A2B', belly: '#B36A3E', ear: 'longflop', tail: 'whip', snout: 12, legH: 4, bodyW: 38, bodyH: 11 },
  { name: '프렌치불독', kind: 'dog', size: 0.9, base: '#D2C5B3', belly: '#F7F2EA', pattern: 'blaze', ear: 'bat', tail: 'stub', snout: 0, legW: 8.5, bodyH: 15, wrinkle: true, tongue: true },
  { name: '이탈리안그레이하운드', kind: 'dog', size: 1.05, base: '#9AA0A8', belly: '#F2F2F2', ear: 'rose', tail: 'whip', snout: 15, headR: 11.5, legH: 24, legW: 3.2, bodyW: 21, bodyH: 7.5, eyeSize: 0.9 },
  { name: '퍼그', kind: 'dog', size: 0.85, base: '#E6CFA5', spot: '#2A2420', pattern: 'mask', ear: 'flop', tail: 'curl', snout: 0, bodyH: 15, wrinkle: true, tongue: true, eyeSize: 1.35, derp: true },
  { name: '시베리안허스키', kind: 'dog', size: 1.25, base: '#7E858F', belly: '#FFFFFF', pattern: 'husky', ear: 'point', tail: 'plume', snout: 11, eye: '#5AB0F0' },
  { name: '사모예드', kind: 'dog', size: 1.25, base: '#FFFFFF', ear: 'small', tail: 'plume', snout: 8, fluffy: true, mane: true, tongue: true, blush: true },
  { name: '비글', kind: 'dog', base: '#FFFFFF', spot: '#2E2A28', head: '#C98A47', pattern: 'saddle', ear: 'longflop', earColor: '#C98A47', tail: 'whip', snout: 10 },
  { name: '보더콜리', kind: 'dog', size: 1.1, base: '#26252A', belly: '#FFFFFF', pattern: 'blaze', ear: 'semi', tail: 'plume', snout: 11, mane: true },
  { name: '요크셔테리어', kind: 'dog', size: 0.65, base: '#4E5A6E', head: '#C99A5B', ear: 'small', tail: 'stub', snout: 5, fluffy: true, topknot: '#E8402F' },
  { name: '시츄', kind: 'dog', size: 0.75, base: '#FFFFFF', spot: '#C9A06B', pattern: 'patch', ear: 'flop', earColor: '#C9A06B', tail: 'plume', snout: 1, fluffy: true, topknot: '#5AA7E6', tongue: true },
  { name: '잉글리시불독', kind: 'dog', base: '#EFE3D1', spot: '#C8A27A', pattern: 'patch', ear: 'rose', tail: 'stub', snout: 0, legH: 6, legW: 10, bodyW: 27, bodyH: 18, headR: 19, wrinkle: true, derp: true },
  { name: '그레이트데인', kind: 'dog', size: 1.7, base: '#C9A06A', spot: '#2A2420', pattern: 'mask', ear: 'flop', tail: 'whip', snout: 14, legH: 19, bodyH: 12 },
  { name: '베들링턴테리어', kind: 'dog', base: '#ECE4D8', ear: 'flop', tail: 'whip', snout: 13, headR: 15, curly: true, topknot: 'pom' },
  { name: '달마시안', kind: 'dog', size: 1.2, base: '#FFFFFF', spot: '#1F1F22', pattern: 'spots', ear: 'flop', earColor: '#1F1F22', tail: 'whip', snout: 11 },
  { name: '미니어처슈나우저', kind: 'dog', size: 0.85, base: '#8E8E8E', belly: '#D9D9D9', ear: 'semi', tail: 'stub', snout: 9, beard: '#E6E6E6', brows: '#EDEDED' },
  // ---------- 고양이 ----------
  { name: '치즈 코숏', kind: 'cat', base: '#F2B35B', spot: '#D9862B', belly: '#FFF3DD', pattern: 'stripe', ear: 'point', tail: 'cat', blush: true },
  { name: '고등어 코숏', kind: 'cat', base: '#9C9184', spot: '#4E463E', belly: '#E8E2D8', pattern: 'stripe', ear: 'point', tail: 'cat' },
  { name: '턱시도', kind: 'cat', base: '#2E2E30', belly: '#FFFFFF', pattern: 'tux', ear: 'point', tail: 'cat', eye: '#E8C547' },
  { name: '삼색이', kind: 'cat', base: '#FFFFFF', spot: '#E8963A', spot2: '#3A3A3A', pattern: 'calico', ear: 'point', tail: 'cat' },
  { name: '젖소냥', kind: 'cat', base: '#FFFFFF', spot: '#1F1F22', pattern: 'cow', ear: 'point', tail: 'cat', derp: true },
  { name: '러시안블루', kind: 'cat', base: '#8D9AA9', ear: 'point', tail: 'cat', eye: '#5DBB63' },
  { name: '샴', kind: 'cat', base: '#F1E4CF', spot: '#5A4033', pattern: 'point', ear: 'big', tail: 'cat', eye: '#4AA3DF', bodyH: 11 },
  { name: '페르시안', kind: 'cat', size: 1.05, base: '#F5EFE7', ear: 'small', tail: 'plume', snout: 0, fluffy: true, mane: true, headR: 20, grumpy: true, eye: '#E39B2E' },
  { name: '스코티시폴드', kind: 'cat', base: '#CBBDA8', spot: '#9C8B74', pattern: 'stripe', ear: 'fold', tail: 'cat', headR: 19, eyeSize: 1.3, blush: true },
  { name: '노르웨이숲', kind: 'cat', size: 1.25, base: '#8C6C4B', spot: '#5A4330', belly: '#E9DCCB', pattern: 'stripe', ear: 'tuft', tail: 'plume', fluffy: true, mane: true },
  { name: '메인쿤', kind: 'cat', size: 1.5, base: '#7A6650', spot: '#3F342A', belly: '#E6DCCB', pattern: 'stripe', ear: 'tuft', tail: 'plume', fluffy: true, mane: true, legH: 12 },
  { name: '먼치킨', kind: 'cat', base: '#E7D0A9', ear: 'point', tail: 'cat', legH: 3.5, blush: true },
  { name: '스핑크스', kind: 'cat', size: 0.95, base: '#E8C4B8', ear: 'huge', tail: 'thin', wrinkle: true, hairless: true, eye: '#8FCB5A', bodyH: 12 },
  { name: '뱅갈', kind: 'cat', size: 1.1, base: '#D9A15A', spot: '#6B4426', belly: '#F2D9B0', pattern: 'spots', ear: 'point', tail: 'cat', eye: '#8FCB5A' },
  { name: '아비시니안', kind: 'cat', base: '#C27B4A', belly: '#E8B98E', ear: 'big', tail: 'thin', legH: 13, bodyH: 11, eye: '#D9B23A' },
  { name: '랙돌', kind: 'cat', size: 1.3, base: '#F4EDE2', spot: '#8A7563', pattern: 'point', ear: 'point', tail: 'plume', fluffy: true, mane: true, eye: '#4AA3DF', mitts: true },
  { name: '브리티시숏헤어', kind: 'cat', size: 1.15, base: '#8E98A6', ear: 'small', tail: 'cat', headR: 21, bodyH: 17, legW: 8, eye: '#E39B2E', blush: true },
  { name: '엑조틱숏헤어', kind: 'cat', base: '#F0D7B0', ear: 'small', tail: 'cat', snout: 0, headR: 20, eyeSize: 1.35, grumpy: true },
  { name: '터키시앙고라', kind: 'cat', base: '#FFFFFF', ear: 'big', tail: 'plume', fluffy: true, oddEyes: ['#4AA3DF', '#E8C547'], legH: 12 },
  { name: '데본렉스', kind: 'cat', size: 0.9, base: '#B5A9A2', ear: 'huge', tail: 'thin', curly: true, eyeSize: 1.5, headR: 15 },
  { name: '아메리칸숏헤어', kind: 'cat', base: '#C3C7CB', spot: '#3F4248', belly: '#E9EBED', pattern: 'stripe', ear: 'point', tail: 'cat', eye: '#5DBB63' },
  { name: '아기 코숏', kind: 'cat', size: 0.6, base: '#F2B35B', spot: '#D9862B', pattern: 'stripe', ear: 'big', tail: 'cat', headR: 20, eyeSize: 1.6, blush: true },
];

const OUT = '#2a2420';

function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16);
  const f = (c) => Math.max(0, Math.min(255, Math.round(c * k)));
  return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
}

function petRR(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }

// 품종 무늬용 고정 점 위치 (매번 같은 자리)
function fixedDots(seed, n) {
  const out = [];
  let s = seed * 9301 + 49297;
  for (let i = 0; i < n; i++) { s = (s * 9301 + 49297) % 233280; const a = s / 233280; s = (s * 9301 + 49297) % 233280; out.push([a, s / 233280]); }
  return out;
}

// 한 마리 그리기. p: { breed, x, y, tx, ty } (x, y는 발 위치)
function drawPet(ctx, p, t, mine) {
  const b = BREEDS[p.breed];
  const s = 1.3 * (b.size ?? 1);
  const moving = Math.hypot(p.tx - p.x, p.ty - p.y) > 2;
  if (p.tx < p.x - 1) p.face = -1; else if (p.tx > p.x + 1) p.face = 1;
  const face = p.face ?? 1;
  const ph = t * (b.legH && b.legH < 6 ? 18 : 12) + (p.breed * 0.7);

  const legH = b.legH ?? 10, legW = b.legW ?? 6.5;
  const bodyW = b.bodyW ?? 20, bodyH = b.bodyH ?? 13, headR = b.headR ?? 16;
  const snout = b.snout ?? (b.kind === 'dog' ? 7 : 0);
  const bob = moving ? Math.abs(Math.sin(ph)) * 3 : Math.sin(t * 2 + p.breed) * 0.6;
  const by = -legH - bodyH * 0.7 - bob;
  const hx = bodyW * 0.72, hy = by - bodyH * 0.55 - headR * 0.62;
  const headCol = b.head ?? b.base;

  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.fillStyle = 'rgba(0,0,0,.18)';
  ctx.beginPath(); ctx.ellipse(0, 0, (bodyW + 6) * s, 6 * s, 0, 0, Math.PI * 2); ctx.fill();
  ctx.scale(s * face, s);
  ctx.lineWidth = 2.4; ctx.strokeStyle = OUT; ctx.lineJoin = 'round'; ctx.lineCap = 'round';

  // 다리 4개: 안쪽 다리는 어둡게 먼저, 바깥 다리는 몸 위에
  const legX = [-bodyW * 0.62, -bodyW * 0.36, bodyW * 0.36, bodyW * 0.62];
  const leg = (i, col) => {
    const lift = moving ? Math.max(0, Math.sin(ph + (i % 2 ? Math.PI : 0) + (i > 1 ? Math.PI / 2 : 0))) * 3 : 0;
    const top = by + bodyH * 0.2;
    petRR(ctx, legX[i] - legW / 2, top, legW, -top - lift, legW / 2);
    ctx.fillStyle = col; ctx.fill(); ctx.stroke();
    if (b.mitts) { petRR(ctx, legX[i] - legW / 2, -lift - 4, legW, 4, 2); ctx.fillStyle = '#FFFFFF'; ctx.fill(); }
  };
  leg(1, shade(b.base, 0.82)); leg(3, shade(b.base, 0.82));

  drawTail(ctx, b, bodyW, bodyH, by, t, moving);

  // 몸통
  ctx.beginPath(); ctx.ellipse(0, by, bodyW, bodyH, 0, 0, Math.PI * 2);
  ctx.fillStyle = b.base; ctx.fill(); ctx.stroke();
  ctx.save(); ctx.beginPath(); ctx.ellipse(0, by, bodyW - 1.2, bodyH - 1.2, 0, 0, Math.PI * 2); ctx.clip();
  if (b.belly) { ctx.fillStyle = b.belly; ctx.beginPath(); ctx.ellipse(bodyW * 0.35, by + bodyH * 0.55, bodyW * 0.55, bodyH * 0.6, 0, 0, Math.PI * 2); ctx.fill(); }
  bodyPattern(ctx, b, bodyW, bodyH, by, p.breed);
  if (b.hairless) { ctx.strokeStyle = shade(b.base, 0.8); ctx.lineWidth = 1.4; for (const dx of [-6, 0, 6]) { ctx.beginPath(); ctx.arc(dx, by - bodyH * 0.2, 5, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); } }
  ctx.restore();
  ctx.lineWidth = 2.4; ctx.strokeStyle = OUT;

  leg(0, b.base); leg(2, b.base);

  // 목 갈기 (메인쿤, 사모예드 등)
  if (b.mane) {
    ctx.beginPath();
    for (let i = 0; i <= 12; i++) {
      const a = Math.PI * 0.35 + (i / 12) * Math.PI * 1.1;
      const r = headR * (i % 2 ? 0.95 : 1.15);
      ctx.lineTo(hx - headR * 0.15 + Math.cos(a) * r, hy + headR * 0.55 + Math.sin(a) * r * 0.6);
    }
    ctx.closePath(); ctx.fillStyle = b.belly ?? b.base; ctx.fill(); ctx.stroke();
  }

  drawHead(ctx, b, hx, hy, headR, headCol, snout, t, p.breed);
  drawAccessory(ctx, p.acc, hx, hy, headR);
  ctx.restore();

  // 이름표 (뒤집지 않고)
  const top = p.y - s * (legH + bodyH * 1.3 + headR * 2.1 + (b.ear === 'huge' || b.ear === 'big' || b.ear === 'tuft' ? 14 : 6) + bob + (p.acc === 'party' ? headR * 0.9 : p.acc === 'crown' || p.acc === 'beanie' ? headR * 0.4 : 0));
  if (p.noTag) return top;
  ctx.font = `${mine ? 17 : 15}px Jua`; ctx.textAlign = 'center';
  const label = mine ? `나 · ${b.name}` : b.name;
  const tw = ctx.measureText(label).width + 16;
  petRR(ctx, p.x - tw / 2, top - 26, tw, 24, 12); ctx.fillStyle = mine ? '#E8402F' : 'rgba(31,31,34,.75)'; ctx.fill();
  ctx.fillStyle = '#fff'; ctx.fillText(label, p.x, top - 8);
  return top - 26;   // 이름표 윗변 (말풍선 위치용)
}

function drawTail(ctx, b, bodyW, bodyH, by, t, moving) {
  const x0 = -bodyW * 0.85, y0 = by - bodyH * 0.2;
  const wag = Math.sin(t * (b.kind === 'dog' ? 14 : 3)) * (b.kind === 'dog' ? 4 : 3);
  const stroke = (w, col) => { ctx.lineWidth = w + 4.8; ctx.strokeStyle = OUT; ctx.stroke(); ctx.lineWidth = w; ctx.strokeStyle = col; ctx.stroke(); ctx.lineWidth = 2.4; ctx.strokeStyle = OUT; };
  const col = b.tailColor ?? b.base;
  ctx.beginPath();
  switch (b.tail) {
    case 'cat': ctx.moveTo(x0, y0); ctx.bezierCurveTo(x0 - 16, y0 - 4, x0 - 8 + wag, y0 - 26, x0 - 14 + wag, y0 - 34); stroke(5, col); break;
    case 'thin': ctx.moveTo(x0, y0); ctx.bezierCurveTo(x0 - 18, y0, x0 - 10 + wag, y0 - 24, x0 - 18 + wag, y0 - 30); stroke(2.6, col); break;
    case 'whip': ctx.moveTo(x0, y0); ctx.quadraticCurveTo(x0 - 16, y0 + 2 + wag, x0 - 24, y0 + 12 + wag); stroke(b.legW && b.legW < 4 ? 2 : 3.2, col);
      if (b.name === '비글') { ctx.beginPath(); ctx.arc(x0 - 24, y0 + 12 + wag, 2.6, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill(); } break;
    case 'curl': ctx.moveTo(x0 + 2, y0); ctx.arc(x0 + 4, y0 - bodyH * 0.6, 7, Math.PI * 0.6, Math.PI * 2.3); stroke(5, col); break;
    case 'plume': ctx.moveTo(x0, y0); ctx.quadraticCurveTo(x0 - 18, y0 - 18 + wag, x0 - 4, y0 - bodyH - 10 + wag); stroke(b.fluffy ? 11 : 8, col); break;
    case 'pompom': ctx.moveTo(x0, y0); ctx.lineTo(x0 - 8, y0 - 10 + wag); stroke(3, col);
      ctx.beginPath(); ctx.arc(x0 - 9, y0 - 13 + wag, 5.5, 0, Math.PI * 2); ctx.fillStyle = col; ctx.fill(); ctx.stroke(); break;
    case 'stub': default: ctx.arc(x0 + 1, y0 + wag * 0.3, 4.5, 0, Math.PI * 2); ctx.fillStyle = col; ctx.fill(); ctx.stroke();
  }
}

function bodyPattern(ctx, b, bodyW, bodyH, by, seed) {
  if (b.pattern === 'stripe') { ctx.strokeStyle = b.spot; ctx.lineWidth = 3; for (const dx of [-0.55, -0.2, 0.15]) { ctx.beginPath(); ctx.moveTo(bodyW * dx, by - bodyH); ctx.lineTo(bodyW * dx + 2, by - bodyH * 0.25); ctx.stroke(); } }
  if (b.pattern === 'saddle') { ctx.fillStyle = b.spot; ctx.beginPath(); ctx.ellipse(-bodyW * 0.15, by - bodyH * 0.6, bodyW * 0.75, bodyH * 0.65, 0, 0, Math.PI * 2); ctx.fill(); }
  if (b.pattern === 'spots' || b.pattern === 'cow' || b.pattern === 'calico' || b.pattern === 'patch') {
    const dots = fixedDots(seed, b.pattern === 'spots' ? 7 : 3);
    dots.forEach(([a, c], i) => {
      ctx.fillStyle = b.pattern === 'calico' && i % 2 ? b.spot2 : b.spot;
      const r = b.pattern === 'spots' ? 2.4 : bodyH * (0.45 + c * 0.25);
      ctx.beginPath(); ctx.ellipse(-bodyW + a * bodyW * 1.8, by - bodyH + c * bodyH * 1.3, r * 1.2, r, 0, 0, Math.PI * 2); ctx.fill();
    });
  }
  if (b.pattern === 'husky' || b.pattern === 'mask') { ctx.fillStyle = shade(b.base, 0.8); ctx.beginPath(); ctx.ellipse(-bodyW * 0.1, by - bodyH * 0.55, bodyW * 0.8, bodyH * 0.5, 0, 0, Math.PI * 2); ctx.fill(); }
  if (b.pattern === 'tux' || b.pattern === 'blaze') { ctx.fillStyle = b.belly ?? '#fff'; ctx.beginPath(); ctx.ellipse(bodyW * 0.6, by + bodyH * 0.1, bodyW * 0.35, bodyH * 0.8, 0, 0, Math.PI * 2); ctx.fill(); }
  if (b.pattern === 'point') { ctx.fillStyle = shade(b.base, 0.92); ctx.beginPath(); ctx.ellipse(-bodyW * 0.3, by - bodyH * 0.5, bodyW * 0.6, bodyH * 0.5, 0, 0, Math.PI * 2); ctx.fill(); }
  if (b.curly || b.fluffy) {
    ctx.strokeStyle = shade(b.base, 0.88); ctx.lineWidth = 1.3;
    for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(-bodyW * 0.7 + i * bodyW * 0.32, by - bodyH * 0.35 + (i % 2) * 5, 3, 0, Math.PI * (b.curly ? 2 : 1)); ctx.stroke(); }
  }
}

function drawEar(ctx, b, hx, hy, headR, layer) {
  const col = b.earColor ?? (b.pattern === 'point' ? b.spot : b.head ?? b.base);
  ctx.fillStyle = col; ctx.lineWidth = 2.4; ctx.strokeStyle = OUT;
  // 서 있는 귀: 머리 뒤(back)에 그림
  const up = { point: 1, big: 1.45, huge: 2.1, small: 0.6, tuft: 1.35, bat: 1.4, semi: 1.1 }[b.ear];
  if (up) {
    if (layer !== 'back') return;
    const h = headR * 0.75 * up, w = headR * (b.ear === 'huge' || b.ear === 'bat' ? 0.55 : 0.4);
    for (const side of [-1, 1]) {
      const cx = hx + side * headR * 0.45;
      if (b.ear === 'bat' || b.ear === 'huge') {
        ctx.beginPath(); ctx.ellipse(cx + side * 2, hy - headR * 0.55 - h * 0.45, w, h * 0.55, side * 0.25, 0, Math.PI * 2); ctx.fillStyle = col; ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.ellipse(cx + side * 2, hy - headR * 0.55 - h * 0.42, w * 0.55, h * 0.38, side * 0.25, 0, Math.PI * 2); ctx.fillStyle = '#F2A9A9'; ctx.fill();
        continue;
      }
      const tipX = cx + side * w * 0.35, tipY = hy - headR * 0.6 - h;
      ctx.beginPath(); ctx.moveTo(cx - w, hy - headR * 0.45); ctx.lineTo(tipX, tipY);
      if (b.ear === 'semi') ctx.lineTo(tipX + side * 6, tipY + 7);
      ctx.lineTo(cx + w, hy - headR * 0.55); ctx.closePath(); ctx.fillStyle = col; ctx.fill(); ctx.stroke();
      if (b.kind === 'cat') { ctx.beginPath(); ctx.moveTo(cx - w * 0.45, hy - headR * 0.55); ctx.lineTo(tipX, tipY + h * 0.38); ctx.lineTo(cx + w * 0.45, hy - headR * 0.6); ctx.closePath(); ctx.fillStyle = '#F2A9A9'; ctx.fill(); }
      if (b.ear === 'tuft') { ctx.beginPath(); ctx.moveTo(tipX, tipY); ctx.lineTo(tipX + side * 2, tipY - 7); ctx.lineWidth = 2; ctx.stroke(); ctx.lineWidth = 2.4; }
    }
    return;
  }
  // 늘어진 귀: 얼굴 쪽 귀는 머리 뒤에 살짝, 뒤통수 쪽 귀는 머리 앞에 (눈을 가리지 않게)
  ctx.fillStyle = col;
  if (b.ear === 'flop' || b.ear === 'longflop') {
    const len = b.ear === 'longflop' ? 1.25 : b.fluffy ? 0.95 : 0.85;
    const side = layer === 'back' ? 1 : -1;
    ctx.beginPath(); ctx.ellipse(hx + side * headR * (side > 0 ? 0.55 : 0.8), hy + headR * 0.15, headR * 0.32, headR * len, side * 0.15, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    return;
  }
  // 접힌 귀: 머리 앞(front)에 그림
  if (layer !== 'front') return;
  if (b.ear === 'fold') for (const side of [-1, 1]) { ctx.beginPath(); ctx.ellipse(hx + side * headR * 0.5, hy - headR * 0.82, 5.5, 3.5, side * 0.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
  if (b.ear === 'rose') for (const side of [-1, 1]) { ctx.beginPath(); ctx.ellipse(hx + side * headR * 0.7, hy - headR * 0.7, 5, 3.4, side * -0.6, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
}
function drawHead(ctx, b, hx, hy, headR, headCol, snout, t, seed) {
  drawEar(ctx, b, hx, hy, headR, 'back');
  // 머리
  ctx.beginPath(); ctx.ellipse(hx, hy, headR, headR * 0.93, 0, 0, Math.PI * 2);
  ctx.fillStyle = headCol; ctx.fill(); ctx.stroke();
  ctx.save(); ctx.beginPath(); ctx.ellipse(hx, hy, headR - 1.2, headR * 0.93 - 1.2, 0, 0, Math.PI * 2); ctx.clip();
  if (b.pattern === 'stripe') { ctx.strokeStyle = b.spot; ctx.lineWidth = 2.6; for (const dx of [-4, 0, 4]) { ctx.beginPath(); ctx.moveTo(hx + dx, hy - headR); ctx.lineTo(hx + dx, hy - headR + 8); ctx.stroke(); } }
  if (b.pattern === 'tux' || b.pattern === 'blaze') { ctx.fillStyle = b.belly ?? '#fff'; ctx.fillRect(hx + headR * 0.15, hy - headR, 5, headR); ctx.beginPath(); ctx.ellipse(hx + headR * 0.45, hy + headR * 0.55, headR * 0.55, headR * 0.45, 0, 0, Math.PI * 2); ctx.fill(); }
  if (b.pattern === 'calico' || b.pattern === 'cow' || b.pattern === 'patch') { ctx.fillStyle = b.spot; ctx.beginPath(); ctx.arc(hx - headR * 0.45, hy - headR * 0.4, headR * 0.5, 0, Math.PI * 2); ctx.fill(); if (b.spot2) { ctx.fillStyle = b.spot2; ctx.beginPath(); ctx.arc(hx + headR * 0.55, hy - headR * 0.6, headR * 0.35, 0, Math.PI * 2); ctx.fill(); } }
  if (b.pattern === 'point' || b.pattern === 'mask') { ctx.fillStyle = b.spot; ctx.beginPath(); ctx.ellipse(hx + headR * 0.45, hy + headR * 0.25, headR * 0.55, headR * 0.5, 0, 0, Math.PI * 2); ctx.fill(); }
  if (b.pattern === 'husky') { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(hx + headR * 0.4, hy + headR * 0.35, headR * 0.65, headR * 0.5, 0, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.ellipse(hx + headR * 0.32, hy - headR * 0.45, 3, 2.5, 0, 0, Math.PI * 2); ctx.ellipse(hx - headR * 0.05, hy - headR * 0.45, 3, 2.5, 0, 0, Math.PI * 2); ctx.fill(); }
  if (b.pattern === 'cheek') { ctx.fillStyle = b.belly; ctx.beginPath(); ctx.ellipse(hx + headR * 0.45, hy + headR * 0.45, headR * 0.6, headR * 0.45, 0, 0, Math.PI * 2); ctx.fill(); }
  if (b.pattern === 'spots') for (const [a, c] of fixedDots(seed + 3, 4)) { ctx.fillStyle = b.spot; ctx.beginPath(); ctx.arc(hx - headR * 0.7 + a * headR * 1.2, hy - headR * 0.8 + c * headR * 0.8, 1.8, 0, Math.PI * 2); ctx.fill(); }
  if (b.wrinkle) { ctx.strokeStyle = shade(headCol, 0.7); ctx.lineWidth = 1.4; for (const dy of [-0.55, -0.35]) { ctx.beginPath(); ctx.arc(hx + headR * 0.2, hy + headR * dy + 6, headR * 0.35, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke(); } }
  ctx.restore();
  ctx.lineWidth = 2.4; ctx.strokeStyle = OUT;

  // 머리 위 리본·방울
  if (b.topknot === 'pom') { ctx.beginPath(); ctx.arc(hx - 2, hy - headR * 0.95, headR * 0.45, 0, Math.PI * 2); ctx.fillStyle = b.base; ctx.fill(); ctx.stroke(); }
  else if (b.topknot) {
    ctx.beginPath(); ctx.moveTo(hx, hy - headR * 0.9); ctx.quadraticCurveTo(hx - 2, hy - headR * 1.35, hx + 3, hy - headR * 1.45); ctx.lineWidth = 4; ctx.strokeStyle = b.head ?? b.base; ctx.stroke(); ctx.lineWidth = 2.4; ctx.strokeStyle = OUT;
    ctx.fillStyle = b.topknot;
    for (const side of [-1, 1]) { ctx.beginPath(); ctx.moveTo(hx, hy - headR * 1.05); ctx.lineTo(hx + side * 7, hy - headR * 1.05 - 4); ctx.lineTo(hx + side * 7, hy - headR * 1.05 + 4); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  }

  // 주둥이
  const front = hx + headR * 0.55;
  let noseX, noseY;
  if (snout > 0) {
    const mx = front + snout * 0.45, my = hy + headR * 0.22, rx = headR * 0.28 + snout * 0.55, ry = headR * 0.3;
    ctx.beginPath(); ctx.ellipse(mx, my, rx, ry, 0.05, 0, Math.PI * 2);
    ctx.fillStyle = b.pattern === 'mask' || b.pattern === 'point' ? b.spot : b.pattern === 'husky' || b.pattern === 'blaze' || b.pattern === 'cheek' ? (b.belly ?? '#fff') : headCol;
    ctx.fill(); ctx.stroke();
    noseX = mx + rx - 3; noseY = my - ry * 0.35;
    if (b.beard) { ctx.beginPath(); ctx.ellipse(mx + 2, my + ry * 0.9, rx * 0.8, ry * 0.7, 0, 0, Math.PI); ctx.fillStyle = b.beard; ctx.fill(); ctx.stroke(); }
  } else {
    // 납작한 얼굴
    ctx.beginPath(); ctx.ellipse(front - 1, hy + headR * 0.3, headR * 0.34, headR * 0.27, 0, 0, Math.PI * 2);
    ctx.fillStyle = b.pattern === 'mask' ? b.spot : shade(headCol, 0.96); ctx.fill();
    noseX = front + 1; noseY = hy + headR * 0.18;
  }

  // 눈
  const es = 3.1 * (b.eyeSize ?? 1);
  const eyes = [[hx + headR * 0.02, hy - headR * 0.12, b.derp ? 0.78 : 1], [hx + headR * 0.5, hy - headR * 0.1, 1]];
  eyes.forEach(([ex, ey, k], i) => {
    const r = es * k;
    const iris = b.oddEyes ? b.oddEyes[i] : b.eye;
    if (b.grumpy) { ctx.fillStyle = OUT; petRR(ctx, ex - r, ey - 1, r * 2, 2.6, 1.3); ctx.fill(); return; }
    ctx.beginPath(); ctx.arc(ex, ey, r, 0, Math.PI * 2); ctx.fillStyle = iris ?? OUT; ctx.fill();
    if (iris) { ctx.beginPath(); ctx.ellipse(ex, ey, r * (b.kind === 'cat' ? 0.35 : 0.6), r * 0.85, 0, 0, Math.PI * 2); ctx.fillStyle = OUT; ctx.fill(); }
    ctx.beginPath(); ctx.arc(ex + r * 0.35, ey - r * 0.4, Math.max(1, r * 0.35), 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill();
  });
  if (b.brows) { ctx.fillStyle = b.brows; for (const [ex, ey] of eyes) { ctx.beginPath(); ctx.ellipse(ex, ey - es - 3.5, 2.6, 1.6, 0, 0, Math.PI * 2); ctx.fill(); } }
  if (b.blush) { ctx.fillStyle = 'rgba(255,120,140,.45)'; ctx.beginPath(); ctx.ellipse(hx + headR * 0.55, hy + headR * 0.32, 3.6, 2.2, 0, 0, Math.PI * 2); ctx.fill(); }

  // 코, 입, 혀, 수염
  ctx.fillStyle = b.kind === 'cat' ? (b.hairless ? '#C97F7F' : '#E58A8A') : OUT;
  ctx.beginPath(); ctx.ellipse(noseX, noseY, b.kind === 'cat' ? 2.2 : 3, b.kind === 'cat' ? 1.7 : 2.3, 0, 0, Math.PI * 2); ctx.fill();
  ctx.lineWidth = 1.5; ctx.strokeStyle = OUT;
  ctx.beginPath(); ctx.moveTo(noseX - 1, noseY + 2); ctx.quadraticCurveTo(noseX - 3, noseY + 5, noseX - 6, noseY + 4); ctx.stroke();
  if (b.tongue) {
    const tl = 5 + Math.sin(t * 6 + seed) * 1.2;
    petRR(ctx, noseX - 6, noseY + 3, 4.6, tl, 2.3); ctx.fillStyle = '#F07A92'; ctx.fill(); ctx.lineWidth = 1.2; ctx.stroke();
  }
  if (b.kind === 'cat' && !b.hairless) { ctx.strokeStyle = 'rgba(42,36,32,.55)'; ctx.lineWidth = 1; for (const dy of [-1, 2]) { ctx.beginPath(); ctx.moveTo(noseX + 2, noseY + dy); ctx.lineTo(noseX + 10, noseY + dy - 1.5); ctx.stroke(); } }
  ctx.lineWidth = 2.4; ctx.strokeStyle = OUT;

  drawEar(ctx, b, hx, hy, headR, 'front');
}

// ---------- 소품 (포토존에서 고르면 다른 손님에게도 보임) ----------
const ACCESSORIES = [
  { id: '', name: '없음' }, { id: 'ribbon', name: '리본' }, { id: 'crown', name: '왕관' }, { id: 'party', name: '꼬깔모자' },
  { id: 'beanie', name: '비니' }, { id: 'glasses', name: '선글라스' }, { id: 'flower', name: '꽃' }, { id: 'bowtie', name: '나비넥타이' },
  { id: 'scarf', name: '목도리' }, { id: 'mask', name: '도둑 복면' },
];
// 머리 기준(hx, hy, 반지름 R) 좌표. 얼굴이 향하는 쪽이 +x
function drawAccessory(ctx, acc, hx, hy, R) {
  if (!acc) return;
  ctx.save(); ctx.lineWidth = 2; ctx.strokeStyle = OUT; ctx.lineJoin = 'round';
  const dot = (x, y, r, col) => { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = col; ctx.fill(); ctx.stroke(); };
  const bow = (x, y, w, h, col) => {
    ctx.fillStyle = col;
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + s * w, y - h); ctx.lineTo(x + s * w, y + h); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    dot(x, y, h * 0.5, col);
  };
  if (acc === 'ribbon') bow(hx - R * 0.45, hy - R * 0.85, R * 0.55, R * 0.32, '#F06A86');
  if (acc === 'bowtie') bow(hx - R * 0.05, hy + R * 0.92, R * 0.45, R * 0.25, '#E8402F');
  if (acc === 'crown') {
    const w = R * 1.1, h = R * 0.62, x = hx + R * 0.1, y = hy - R * 0.72;
    ctx.beginPath(); ctx.moveTo(x - w / 2, y); ctx.lineTo(x - w / 2, y - h); ctx.lineTo(x - w / 4, y - h * 0.55); ctx.lineTo(x, y - h * 1.05);
    ctx.lineTo(x + w / 4, y - h * 0.55); ctx.lineTo(x + w / 2, y - h); ctx.lineTo(x + w / 2, y); ctx.closePath();
    ctx.fillStyle = '#FFD54A'; ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#E8402F'; ctx.beginPath(); ctx.arc(x, y - h * 0.32, R * 0.1, 0, Math.PI * 2); ctx.fill();
  }
  if (acc === 'party') {
    const h = R * 1.35, w = R * 0.85;
    ctx.translate(hx - R * 0.1, hy - R * 0.78); ctx.rotate(-0.25);
    const cone = () => { ctx.beginPath(); ctx.moveTo(-w / 2, 0); ctx.lineTo(0, -h); ctx.lineTo(w / 2, 0); ctx.closePath(); };
    cone(); ctx.fillStyle = '#5BB5E8'; ctx.fill();
    ctx.save(); cone(); ctx.clip(); ctx.strokeStyle = '#FFD54A'; ctx.lineWidth = R * 0.16;
    for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(-w, -h * i / 4 + R * 0.2); ctx.lineTo(w, -h * i / 4 - R * 0.2); ctx.stroke(); }
    ctx.restore(); cone(); ctx.stroke();
    dot(0, -h, R * 0.18, '#F06A86');
  }
  if (acc === 'beanie') {
    ctx.beginPath(); ctx.ellipse(hx, hy - R * 0.35, R * 1.04, R * 0.78, 0, Math.PI, Math.PI * 2); ctx.closePath(); ctx.fillStyle = '#E8402F'; ctx.fill(); ctx.stroke();
    petRR(ctx, hx - R * 1.08, hy - R * 0.5, R * 2.16, R * 0.32, R * 0.14); ctx.fillStyle = '#F4E9D8'; ctx.fill(); ctx.stroke();
    dot(hx, hy - R * 1.18, R * 0.22, '#F4E9D8');
  }
  if (acc === 'glasses') {
    const y = hy - R * 0.12;
    ctx.fillStyle = '#1f1f22';
    for (const ex of [hx + R * 0.02, hx + R * 0.5]) { petRR(ctx, ex - R * 0.22, y - R * 0.16, R * 0.44, R * 0.32, R * 0.12); ctx.fill(); }
    ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(hx + R * 0.22, y - R * 0.06); ctx.lineTo(hx + R * 0.3, y - R * 0.06);
    ctx.moveTo(hx - R * 0.2, y - R * 0.06); ctx.lineTo(hx - R * 0.78, y - R * 0.14); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.65)'; for (const ex of [hx + R * 0.02, hx + R * 0.5]) ctx.fillRect(ex - R * 0.12, y - R * 0.1, R * 0.07, R * 0.12);
  }
  if (acc === 'mask') {
    ctx.save(); ctx.beginPath(); ctx.ellipse(hx, hy, R, R * 0.93, 0, 0, Math.PI * 2); ctx.clip();
    ctx.fillStyle = '#26232A'; ctx.fillRect(hx - R * 1.1, hy - R * 0.36, R * 2.2, R * 0.44); ctx.restore();
    ctx.fillStyle = '#26232A'; ctx.beginPath(); ctx.moveTo(hx - R * 0.95, hy - R * 0.16); ctx.lineTo(hx - R * 1.5, hy - R * 0.42); ctx.lineTo(hx - R * 1.42, hy + R * 0.06); ctx.closePath(); ctx.fill();
    for (const ex of [hx + R * 0.02, hx + R * 0.5]) {
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(ex, hy - R * 0.13, R * 0.12, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = OUT; ctx.beginPath(); ctx.arc(ex + R * 0.02, hy - R * 0.13, R * 0.065, 0, Math.PI * 2); ctx.fill();
    }
  }
  if (acc === 'flower') {
    const x = hx - R * 0.55, y = hy - R * 0.8;
    for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; dot(x + Math.cos(a) * R * 0.22, y + Math.sin(a) * R * 0.22, R * 0.18, '#F9A8C0'); }
    dot(x, y, R * 0.14, '#FFD54A');
  }
  if (acc === 'scarf') {
    const x = hx - R * 0.25, y = hy + R * 0.8;
    ctx.fillStyle = '#4C8BD9';
    petRR(ctx, x - R * 0.8, y - R * 0.2, R * 1.6, R * 0.42, R * 0.2); ctx.fill(); ctx.stroke();
    petRR(ctx, x - R * 0.65, y, R * 0.34, R * 0.85, R * 0.12); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 1.5;
    for (const dx of [-0.4, 0, 0.4]) { ctx.beginPath(); ctx.moveTo(x + R * dx, y - R * 0.16); ctx.lineTo(x + R * dx, y + R * 0.18); ctx.stroke(); }
  }
  ctx.restore();
}