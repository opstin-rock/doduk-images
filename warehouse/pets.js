// 도둑냥 창고 손님 캐릭터: 강아지 32종 + 고양이 26종 (토종개·믹스견·길고양이 포함)
// 11.11부터 그림은 아래 CHIBI 특징표 + drawChibi (정면 2등신). BREEDS 의 옛 칸(ear·snout 등)은 이제 그림에 안 쓰고 이름·종류·순서만 씀
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
  // ---------- 11.10 추가: 토종개·믹스견·길고양이 (대표님). 번호가 바뀌지 않게 맨 뒤에 붙이고, 고르는 화면에서는 맨 앞에 보여 줌 ----------
  { name: '백구 믹스', kind: 'dog', base: '#FFFDF6', ear: 'semi', tail: 'curl', snout: 8, blush: true },
  { name: '누렁이 믹스', kind: 'dog', base: '#E0A85C', belly: '#F7DFB5', pattern: 'cheek', ear: 'semi', tail: 'curl', snout: 8 },
  { name: '바둑이 믹스', kind: 'dog', size: 0.9, base: '#FFFFFF', spot: '#2E2A28', pattern: 'patch', ear: 'flop', earColor: '#2E2A28', tail: 'whip', snout: 7 },
  { name: '깜장 믹스', kind: 'dog', base: '#2E2B2B', belly: '#F4EEE4', pattern: 'blaze', ear: 'semi', tail: 'plume', snout: 8, brows: '#C98A47' },
  { name: '시고르자브종', kind: 'dog', size: 0.9, base: '#C7925A', belly: '#F3E2C6', pattern: 'blaze', ear: 'semi', tail: 'curl', snout: 7, tongue: true },
  { name: '풍산개', kind: 'dog', size: 1.3, base: '#FBF8F1', ear: 'point', tail: 'curl', snout: 9, fluffy: true, mane: true },
  { name: '삽살개', kind: 'dog', size: 1.1, base: '#D8C3A0', ear: 'flop', tail: 'plume', snout: 3, headR: 19, fluffy: true, curly: true, bangs: true },
  { name: '동경이', kind: 'dog', base: '#D9A35E', belly: '#F6E5C8', pattern: 'cheek', ear: 'point', tail: 'stub', snout: 8 },
  { name: '귀컷 길냥이', kind: 'cat', base: '#9C9184', spot: '#4E463E', belly: '#E8E2D8', pattern: 'stripe', ear: 'point', earTip: true, tail: 'cat', blush: true },
  { name: '깜장 길냥이', kind: 'cat', base: '#2B2A2E', ear: 'point', tail: 'cat', eye: '#E8C547' },
  { name: '회색 길냥이', kind: 'cat', base: '#A3A6AD', belly: '#F4F4F6', pattern: 'tux', ear: 'point', tail: 'cat', eye: '#7CC27F' },
  { name: '꼬리짧은 길냥이', kind: 'cat', base: '#FFFFFF', spot: '#E8963A', spot2: '#3A3A3A', pattern: 'calico', ear: 'point', earTip: true, tail: 'kink' },
];
// 고르는 화면에서 맨 앞에 보여 줄 아이들 (보호소에 많은 믹스·토종개·길고양이)
const PICK_FIRST = ['백구 믹스', '누렁이 믹스', '바둑이 믹스', '깜장 믹스', '시고르자브종', '진돗개', '풍산개', '삽살개', '동경이',
  '귀컷 길냥이', '깜장 길냥이', '회색 길냥이', '꼬리짧은 길냥이', '치즈 코숏', '고등어 코숏', '턱시도', '삼색이', '젖소냥', '아기 코숏'];

// =====================================================================
// 그리기 (11.11 새 그림: 정면을 보는 2등신. 품종마다 귀·털·무늬·꼬리·주둥이·몸 크기를 다르게)
// 품종 특징표는 아래 CHIBI. 품종 번호(BREEDS 순서)는 그대로라서 예전에 고른 캐릭터가 바뀌지 않음
// =====================================================================
const OUT = '#3b2b25';
function shade(hex, k) {
  if (!hex || hex[0] !== '#') return hex;
  const n = parseInt(hex.slice(1), 16);
  const f = (c) => Math.max(0, Math.min(255, Math.round(c * k)));
  return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
}
function petRR(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
function shadedFill(g, base, cx, cy, r) {
  if (!base || base[0] !== '#') return base;
  const gr = g.createRadialGradient(cx - r * 0.35, cy - r * 0.45, r * 0.1, cx, cy, r * 1.15);
  gr.addColorStop(0, shade(base, 1.1)); gr.addColorStop(0.65, base); gr.addColorStop(1, shade(base, 0.84));
  return gr;
}
// 테두리가 복슬복슬한 타원 (털 많은 품종)
function fluffEllipse(g, cx, cy, rx, ry, bumps, amp) {
  g.beginPath();
  for (let i = 0; i <= bumps * 8; i++) {
    const a = (i / (bumps * 8)) * Math.PI * 2, w = 1 + amp * Math.abs(Math.sin((a * bumps) / 2));
    g.lineTo(cx + Math.cos(a) * rx * w, cy + Math.sin(a) * ry * w);
  }
  g.closePath();
}

// ---------- 품종 특징표 ----------
// size 몸 크기(치와와 0.62 ~ 그레이트데인 1.75) · hr 머리 · hw 머리 폭 · bw/bh 몸 · leg 보이는 다리 길이
// ears: cat prick huge tuft semi bat fold button flop long hair rose · tail: curl plume stub whip kink ring pompom (없으면 고양이 꼬리)
// fluffy 복슬 테두리 · long 바닥까지 긴 털 · curly 곱슬 구름 · hairless 털 없음 · mane 목 갈기 색 · bangs 앞머리
// face: snout(mid long flat cat) muzzle mask/maskIn blaze tuxV cheeks points tabby patches dots brows beard wrinkle tongue nose
const W_ = '#FFFFFF';
const CHIBI = {
  // 강아지
  '말티즈': { kind: 'dog', size: 0.74, base: W_, ears: 'hair', long: true, bow: '#FF7FA8', face: { muzzle: W_, tongue: true }, tail: 'plume' },
  '토이푸들': { kind: 'dog', size: 0.8, base: '#C98A55', curly: true, ears: 'hair', face: { muzzle: '#D9A26B' }, tail: 'pompom' },
  '포메라니안': { kind: 'dog', size: 0.72, base: '#EE9A45', fluffy: true, mane: '#F6C58C', ears: 'prick', face: { snout: 'flat', muzzle: '#F9D9AE', tongue: true }, tail: 'plume', bw: 1.05 },
  '치와와': { kind: 'dog', size: 0.62, base: '#E8BC82', ears: 'huge', hr: 1.08, bw: 0.8, face: { snout: 'flat', muzzle: '#F6E2C2' }, eyeK: 1.25, tail: 'whip' },
  '시바': { kind: 'dog', size: 0.95, base: '#D98B3E', ears: 'prick', face: { cheeks: '#FFF6EA', brows: '#FFF6EA', muzzle: '#FFF6EA' }, belly: '#FFF6EA', tail: 'curl', leg: 4 },
  '웰시코기': { kind: 'dog', size: 0.92, base: '#E39B4B', ears: 'huge', bw: 1.35, bh: 0.85, face: { blaze: W_, muzzle: W_, tongue: true }, belly: W_, paw: W_, tail: 'stub' },
  '진돗개': { kind: 'dog', size: 1.05, base: '#F3E9D6', ears: 'prick', face: { muzzle: '#FFFDF6' }, tail: 'curl', leg: 6, hr: 0.95 },
  '비숑': { kind: 'dog', size: 0.8, base: '#FFFDF8', curly: true, hr: 1.15, ears: 'hair', face: { snout: 'flat', muzzle: W_ }, tail: 'plume' },
  '골든리트리버': { kind: 'dog', size: 1.35, base: '#E3B35F', ears: 'flop', fluffy: true, face: { muzzle: '#F0CD88', tongue: true }, tail: 'plume', leg: 8 },
  '닥스훈트': { kind: 'dog', size: 0.9, base: '#8B4A2B', ears: 'long', bw: 1.55, bh: 0.75, face: { snout: 'long', muzzle: '#B36A3E' }, tail: 'whip' },
  '프렌치불독': { kind: 'dog', size: 0.88, base: '#D9C7AE', ears: 'bat', hw: 1.12, bw: 1.15, face: { snout: 'flat', muzzle: '#F3EBDD', blaze: '#F3EBDD', nose: '#2a2420', wrinkle: true }, tail: 'stub' },
  '이탈리안그레이하운드': { kind: 'dog', size: 1.05, base: '#9AA0A8', ears: 'rose', hr: 0.88, bw: 0.75, face: { snout: 'long', muzzle: '#F2F2F2' }, belly: '#F2F2F2', tail: 'whip', leg: 12 },
  '퍼그': { kind: 'dog', size: 0.85, base: '#E6CFA5', ears: 'button', earCol: '#2A2420', face: { snout: 'flat', muzzle: '#2A2420', nose: '#111', wrinkle: true, tongue: true }, eyeK: 1.25, tail: 'curl', bw: 1.15 },
  '시베리안허스키': { kind: 'dog', size: 1.25, base: '#7E858F', belly: W_, ears: 'prick', eye: '#5AB0F0', face: { mask: '#7E858F', maskIn: W_, muzzle: W_ }, tail: 'plume', leg: 8, paw: W_ },
  '사모예드': { kind: 'dog', size: 1.25, base: W_, fluffy: true, mane: W_, ears: 'prick', face: { muzzle: W_, tongue: true }, tail: 'plume', leg: 6 },
  '비글': { kind: 'dog', size: 0.92, head: '#C98A47', body: W_, earCol: '#8A5A2B', ears: 'long', face: { blaze: W_, muzzle: W_ }, saddle: '#2E2A28', tail: 'whip', tailCol: W_, tailTip: W_, leg: 3 },
  '보더콜리': { kind: 'dog', size: 1.1, base: '#26252A', ears: 'semi', face: { blaze: W_, muzzle: W_ }, belly: W_, paw: W_, mane: W_, tail: 'plume', leg: 6 },
  '요크셔테리어': { kind: 'dog', size: 0.68, head: '#D9A867', body: '#5B6B82', earCol: '#D9A867', ears: 'prick', long: true, bow: '#E8402F', face: { muzzle: '#E9C590' }, tail: 'stub', tailCol: '#5B6B82' },
  '시츄': { kind: 'dog', size: 0.76, base: W_, ears: 'hair', earCol: '#C9A06B', long: true, bow: '#5AA7E6', face: { snout: 'flat', patches: [[-0.55, -0.5, 0.5, '#C9A06B'], [0.55, -0.5, 0.5, '#C9A06B']], muzzle: W_, tongue: true }, tail: 'plume' },
  '잉글리시불독': { kind: 'dog', size: 1.0, base: '#EFE3D1', ears: 'button', earCol: '#C8A27A', hw: 1.22, bw: 1.35, bh: 1.05, face: { snout: 'flat', muzzle: W_, wrinkle: true, patches: [[-0.6, -0.4, 0.45, '#C8A27A']], nose: '#2a2420' }, tail: 'stub' },
  '그레이트데인': { kind: 'dog', size: 1.75, base: '#C9A06A', ears: 'flop', earCol: '#8A6A44', hr: 0.92, face: { snout: 'long', muzzle: '#7A5C40' }, tail: 'whip', leg: 16, bw: 0.9 },
  '베들링턴테리어': { kind: 'dog', size: 1.0, base: '#ECE4D8', curly: true, topPom: true, ears: 'hair', hr: 0.98, hw: 0.9, face: { snout: 'long', muzzle: '#F4EEE5' }, tail: 'whip', leg: 8 },
  '달마시안': { kind: 'dog', size: 1.2, base: W_, ears: 'flop', earCol: '#2A2A2A', dotCol: '#1F1F22', face: { dots: [[-0.5, -0.5], [0.45, -0.6], [-0.15, -0.75], [0.6, 0.1], [-0.65, 0.05]], muzzle: W_ }, dots: [[-0.6, -0.4], [0.3, -0.6], [0.7, 0.1], [-0.3, 0.3], [0.1, -0.1]], tail: 'whip', leg: 10 },
  '미니어처슈나우저': { kind: 'dog', size: 0.85, base: '#8E8E8E', ears: 'semi', face: { beard: '#E6E6E6', brows: '#EDEDED', muzzle: '#BDBDBD' }, tail: 'stub', leg: 4 },
  // 고양이
  '치즈 코숏': { kind: 'cat', base: '#F2B35B', stripes: '#D9862B', bodyStripes: true, belly: '#FFF3DD', face: { tabby: '#D9862B', muzzle: '#FFF3DD' }, tail: 'ring' },
  '고등어 코숏': { kind: 'cat', base: '#9C9184', stripes: '#4E463E', bodyStripes: true, belly: '#E8E2D8', face: { tabby: '#4E463E', muzzle: '#E8E2D8' }, tail: 'ring' },
  '턱시도': { kind: 'cat', base: '#34343A', belly: W_, paw: W_, face: { tuxV: true, muzzle: W_ }, eye: '#E8C547' },
  '삼색이': { kind: 'cat', base: W_, earCol: '#E8963A', face: { patches: [[-0.55, -0.55, 0.55, '#E8963A'], [0.6, -0.65, 0.42, '#3A3A3A']], muzzle: W_ }, bodyPatches: [[-0.6, -0.3, 0.55, '#E8963A'], [0.55, 0.1, 0.45, '#3A3A3A']], tailCol: '#E8963A' },
  '젖소냥': { kind: 'cat', base: W_, earCol: '#1F1F22', face: { patches: [[0.5, -0.6, 0.55, '#1F1F22']], muzzle: W_ }, bodyPatches: [[-0.55, -0.2, 0.5, '#1F1F22'], [0.5, 0.35, 0.35, '#1F1F22']], tailCol: '#1F1F22' },
  '러시안블루': { kind: 'cat', base: '#8D9AA9', eye: '#5DBB63', face: { muzzle: '#A3AEBB' }, hw: 0.95 },
  '샴': { kind: 'cat', base: '#F1E4CF', earCol: '#5A4033', tailCol: '#5A4033', paw: '#5A4033', eye: '#4AA3DF', face: { points: '#5A4033', nose: '#3a2a20' } },
  '페르시안': { kind: 'cat', size: 1.05, base: '#F5EFE7', fluffy: true, mane: '#FBF7F1', hr: 1.08, face: { snout: 'flat', muzzle: W_ }, eye: '#E39B2E', tail: 'plume' },
  '스코티시폴드': { kind: 'cat', base: '#CBBDA8', ears: 'fold', hr: 1.06, hw: 1.06, eyeK: 1.2, face: { tabby: '#9C8B74', muzzle: '#E3D8C6' } },
  '노르웨이숲': { kind: 'cat', size: 1.25, base: '#8C6C4B', stripes: '#5A4330', ears: 'tuft', fluffy: true, mane: '#E9DCCB', face: { tabby: '#5A4330', muzzle: '#E9DCCB' }, tail: 'plume', leg: 3 },
  '메인쿤': { kind: 'cat', size: 1.45, base: '#7A6650', stripes: '#3F342A', ears: 'tuft', mane: '#E6DCCB', fluffy: true, face: { tabby: '#3F342A', muzzle: '#E6DCCB' }, tail: 'plume', leg: 5 },
  '먼치킨': { kind: 'cat', size: 0.85, base: '#E7D0A9', hr: 1.05, bw: 1.1, bh: 0.85, face: { muzzle: '#F5E6CC' } },
  '스핑크스': { kind: 'cat', size: 0.95, base: '#E8C4B8', ears: 'huge', hairless: true, eye: '#8FCB5A', face: { muzzle: '#EFD3C9' }, tail: 'whip', hw: 0.92 },
  '뱅갈': { kind: 'cat', size: 1.1, base: '#D9A15A', dotCol: '#6B4426', eye: '#8FCB5A', face: { dots: [[-0.55, -0.55], [0.5, -0.55], [-0.2, -0.75], [0.25, -0.78], [-0.75, 0.1], [0.75, 0.1]], muzzle: '#F2D9B0' }, dots: [[-0.6, -0.4], [0.3, -0.6], [0.7, 0.1], [-0.3, 0.3], [0.1, -0.1], [-0.75, 0.15]], belly: '#F2D9B0', tail: 'ring', stripes: '#6B4426' },
  '아비시니안': { kind: 'cat', base: '#C27B4A', ears: 'huge', eye: '#D9B23A', face: { muzzle: '#E8B98E' }, bw: 0.85, leg: 5, tail: 'whip' },
  '랙돌': { kind: 'cat', size: 1.3, base: '#F4EDE2', earCol: '#8A7563', tailCol: '#8A7563', fluffy: true, mane: W_, eye: '#4AA3DF', paw: W_, face: { points: '#8A7563', muzzle: W_ }, tail: 'plume' },
  '브리티시숏헤어': { kind: 'cat', size: 1.15, base: '#8E98A6', hw: 1.15, bw: 1.2, bh: 1.1, eye: '#E39B2E', face: { muzzle: '#A5AEBA' } },
  '엑조틱숏헤어': { kind: 'cat', base: '#F0D7B0', hr: 1.08, hw: 1.08, face: { snout: 'flat', muzzle: '#FAE8CC' }, eye: '#E39B2E' },
  '터키시앙고라': { kind: 'cat', base: W_, fluffy: true, eye: ['#4AA3DF', '#E8C547'], face: { muzzle: W_ }, tail: 'plume', leg: 4 },
  '데본렉스': { kind: 'cat', size: 0.9, base: '#B5A9A2', ears: 'huge', eyeK: 1.3, hw: 0.95, face: { muzzle: '#CFC5BF' }, tail: 'whip' },
  '아메리칸숏헤어': { kind: 'cat', base: '#C3C7CB', stripes: '#3F4248', bodyStripes: true, eye: '#5DBB63', face: { tabby: '#3F4248', muzzle: '#E9EBED' }, belly: '#E9EBED', tail: 'ring' },
  '아기 코숏': { kind: 'cat', size: 0.6, base: '#F2B35B', stripes: '#D9862B', hr: 1.15, eyeK: 1.25, face: { tabby: '#D9862B', muzzle: '#FFF3DD' }, tail: 'ring' },
  // 11.10 추가
  '백구 믹스': { kind: 'dog', size: 1.02, base: '#FFFDF6', ears: 'semi', face: { muzzle: W_ }, tail: 'curl', leg: 4 },
  '누렁이 믹스': { kind: 'dog', size: 1.0, base: '#E0A85C', ears: 'semi', face: { cheeks: '#F7DFB5', muzzle: '#F7DFB5' }, belly: '#F7DFB5', tail: 'curl', leg: 4 },
  '바둑이 믹스': { kind: 'dog', size: 0.9, base: W_, ears: 'flop', earCol: '#2E2A28', face: { patches: [[0.5, -0.55, 0.5, '#2E2A28']], muzzle: W_ }, bodyPatches: [[-0.5, -0.3, 0.55, '#2E2A28'], [0.6, 0.2, 0.35, '#2E2A28']], tail: 'whip', leg: 3 },
  '깜장 믹스': { kind: 'dog', size: 1.0, base: '#2E2B2B', ears: 'semi', face: { brows: '#C98A47', muzzle: '#C98A47' }, belly: '#F4EEE4', paw: '#C98A47', tail: 'plume', leg: 4 },
  '시고르자브종': { kind: 'dog', size: 0.9, base: '#C7925A', ears: 'semi', face: { blaze: '#F3E2C6', muzzle: '#F3E2C6', tongue: true }, belly: '#F3E2C6', tail: 'curl', leg: 3 },
  '풍산개': { kind: 'dog', size: 1.3, base: '#FBF8F1', fluffy: true, mane: W_, ears: 'prick', face: { muzzle: W_ }, tail: 'curl', leg: 8 },
  '삽살개': { kind: 'dog', size: 1.1, base: '#D8C3A0', fluffy: true, bangs: true, ears: 'hair', hr: 1.08, face: { snout: 'flat', muzzle: '#E6D6BA' }, tail: 'plume' },
  '동경이': { kind: 'dog', size: 0.98, base: '#D9A35E', ears: 'prick', face: { cheeks: '#F6E5C8', muzzle: '#F6E5C8' }, belly: '#F6E5C8', tail: 'stub', leg: 5 },
  '귀컷 길냥이': { kind: 'cat', base: '#9C9184', stripes: '#4E463E', bodyStripes: true, belly: '#E8E2D8', face: { tabby: '#4E463E', muzzle: '#E8E2D8' }, tail: 'kink', earTip: true },
  '깜장 길냥이': { kind: 'cat', base: '#2B2A2E', eye: '#E8C547', face: { muzzle: '#3A393E' } },
  '회색 길냥이': { kind: 'cat', base: '#A3A6AD', belly: W_, paw: W_, eye: '#7CC27F', face: { tuxV: true, muzzle: W_ } },
  '꼬리짧은 길냥이': { kind: 'cat', base: W_, earCol: '#E8963A', earTip: true, face: { patches: [[-0.55, -0.55, 0.5, '#E8963A'], [0.6, -0.6, 0.4, '#3A3A3A']], muzzle: W_ }, bodyPatches: [[-0.6, -0.2, 0.5, '#E8963A'], [0.5, 0.2, 0.4, '#3A3A3A']], tail: 'kink', tailCol: '#E8963A' },
};
const specOf = (b) => CHIBI[b && b.name] || { kind: (b && b.kind) || 'dog', base: (b && b.base) || '#E0C090' };
// 몸 크기(품종). 예전 size 대신 이 값을 씀
BREEDS.forEach((b) => { const s = CHIBI[b.name]; if (s) b.size = s.size || 1; });

function chibiGeo(s) {
  const BW = 17 * (s.bw || 1), BH = 15 * (s.bh || 1), LEG = s.leg || 0;
  const bodyY = -BH - LEG + 1;
  const HR = 24 * (s.hr || 1), W = HR * (s.kind === 'cat' ? 1.16 : 1.1) * (s.hw || 1);
  const HY = bodyY - BH * 0.55 - HR * 0.72;
  return { BW, BH, LEG, bodyY, HR, W, HY };
}

// ---------- 귀 ----------
const UP_EARS = ['cat', 'prick', 'huge', 'tuft', 'semi', 'bat'];
function earTopY(s, HY, HR) {
  const type = s.ears || (s.kind === 'cat' ? 'cat' : 'prick');
  if (!UP_EARS.includes(type)) return HY - HR * (s.topPom ? 1.3 : 1.05);
  const big = type === 'huge' || type === 'bat' ? 1.45 : type === 'cat' || type === 'tuft' ? 1.05 : type === 'semi' ? 0.85 : 1;
  return HY - HR * (0.95 + 0.55 * big) - (type === 'tuft' ? 8 : 0);
}
function drawEar(g, s, side, cx, HY, W, HR, layer) {
  const type = s.ears || (s.kind === 'cat' ? 'cat' : 'prick');
  const col = s.earCol || s.head || s.base;
  g.lineWidth = 2.6; g.strokeStyle = OUT;
  if (UP_EARS.includes(type)) {
    if (layer !== 'back') return;
    const big = type === 'huge' || type === 'bat' ? 1.45 : type === 'cat' || type === 'tuft' ? 1.05 : type === 'semi' ? 0.85 : 1;
    const b0 = [cx + side * W * 0.28, HY - HR * 0.92], b1 = [cx + side * W * 0.98, HY - HR * 0.35];
    const tip = [cx + side * W * (type === 'huge' ? 1.18 : type === 'bat' ? 0.95 : 0.82), HY - HR * (0.95 + 0.55 * big)];
    g.beginPath(); g.moveTo(...b0);
    if (s.earTip && side === 1) {   // 귀 끝이 잘린 귀 (중성화한 길고양이 표시)
      const L = (p, k2) => [p[0] + (tip[0] - p[0]) * k2, p[1] + (tip[1] - p[1]) * k2];
      g.lineTo(...L(b0, 0.72)); g.lineTo(...L(b1, 0.72)); g.lineTo(...b1);
    } else { g.quadraticCurveTo(tip[0] - side * 4, tip[1] + 2, tip[0], tip[1]); g.quadraticCurveTo(tip[0] + side * 4, tip[1] + 6, ...b1); }
    g.closePath(); g.fillStyle = col; g.fill(); g.stroke();
    const ib0 = [b0[0] + side * 4, b0[1] + 2], ib1 = [b1[0] - side * 4, b1[1] - 3], itip = [tip[0] - side * 1, tip[1] + (s.earTip && side === 1 ? 14 : 8)];
    g.beginPath(); g.moveTo(...ib0); g.quadraticCurveTo(itip[0] - side * 2, itip[1], ...itip); g.quadraticCurveTo(itip[0] + side * 2, itip[1] + 4, ...ib1); g.closePath();
    g.fillStyle = s.earIn || (s.kind === 'cat' || s.hairless || type === 'huge' || type === 'bat' ? '#F4B1AE' : shade(col, 0.82)); g.fill();
    if (type === 'tuft') { g.beginPath(); g.moveTo(...tip); g.lineTo(tip[0] + side * 1, tip[1] - 8); g.lineWidth = 2; g.stroke(); }
    if (type === 'semi') {   // 끝이 앞으로 접힘
      g.beginPath(); g.moveTo(tip[0] - side * 5, tip[1] + 3); g.lineTo(tip[0] + side * 6, tip[1] + 2); g.lineTo(tip[0] + side * 1, tip[1] + 12); g.closePath();
      g.fillStyle = shade(col, 0.85); g.fill(); g.stroke();
    }
    return;
  }
  if (type === 'fold') {   // 스코티시폴드: 머리 위에 납작하게 접힌 작은 귀
    if (layer !== 'front') return;
    g.save(); g.translate(cx + side * W * 0.55, HY - HR * 0.82); g.rotate(side * 0.5);
    g.beginPath(); g.moveTo(-8, -2); g.quadraticCurveTo(0, -9, 8, -2); g.quadraticCurveTo(0, 4, -8, -2); g.fillStyle = col; g.fill(); g.stroke(); g.restore();
    return;
  }
  if (type === 'button' || type === 'rose') {   // 퍼그·불독(앞으로 접힘), 그레이하운드(뒤로 젖힌 작은 귀)
    if (layer !== 'front') return;
    g.beginPath();
    if (type === 'button') { g.moveTo(cx + side * W * 0.45, HY - HR * 0.88); g.lineTo(cx + side * W * 1.02, HY - HR * 0.62); g.lineTo(cx + side * W * 0.72, HY - HR * 0.3); }
    else { g.moveTo(cx + side * W * 0.5, HY - HR * 0.85); g.quadraticCurveTo(cx + side * W * 1.05, HY - HR * 1.05, cx + side * W * 1.1, HY - HR * 0.55); g.lineTo(cx + side * W * 0.8, HY - HR * 0.55); }
    g.closePath(); g.fillStyle = col; g.fill(); g.stroke(); return;
  }
  // 늘어진 귀: flop 보통, long 길게, hair 털 귀
  // 11.11 대표님: 얼굴 앞에서 눈을 가려서 이상함 → 머리 뒤에, 얼굴 바깥쪽으로 비스듬히 늘어지게
  if (layer === 'front') return;
  const len = type === 'long' ? 1.5 : type === 'hair' ? 1.35 : 1;
  g.save(); g.translate(cx + side * W * 1.0, HY - HR * 0.62); g.rotate(-side * 0.05);
  if (type === 'hair') fluffEllipse(g, 0, HR * 0.45 * len, 7.5, HR * 0.55 * len, 6, 0.12);
  else { g.beginPath(); g.ellipse(0, HR * 0.42 * len, type === 'long' ? 9 : 7.5, HR * 0.5 * len, 0, 0, Math.PI * 2); }
  g.fillStyle = shadedFill(g, col, 0, HR * 0.3, HR * 0.6); g.fill(); g.stroke(); g.restore();
}

// ---------- 꼬리 (dir: 꼬리가 나오는 쪽 +1/-1) ----------
function drawTail(g, s, bodyY, BW, t, dir) {
  const col = s.tailCol || s.body || s.base, wag = Math.sin(t * (s.kind === 'dog' ? 9 : 2)) * 3;
  g.save(); g.scale(dir, 1);
  const x0 = BW * 0.7, y0 = bodyY + 2;
  const stroke = (w, c2) => { g.lineWidth = w + 4.6; g.strokeStyle = OUT; g.stroke(); g.lineWidth = w; g.strokeStyle = c2 || col; g.stroke(); };
  g.beginPath();
  switch (s.tail) {
    case 'curl': g.moveTo(x0, y0); g.bezierCurveTo(x0 + 16, y0 - 4, x0 + 16, y0 - 22, x0 + 4 + wag * 0.3, y0 - 20); stroke(6.5); break;
    case 'plume': g.moveTo(x0, y0); g.quadraticCurveTo(x0 + 22, y0 - 6 + wag, x0 + 14, y0 - 30 + wag); stroke(s.fluffy ? 12 : 9); break;
    case 'stub': g.arc(x0 + 2, y0 + 2, 4.5, 0, Math.PI * 2); g.fillStyle = col; g.fill(); g.lineWidth = 2.4; g.strokeStyle = OUT; g.stroke(); break;
    case 'whip': g.moveTo(x0, y0); g.quadraticCurveTo(x0 + 18, y0 + wag, x0 + 22, y0 - 16 + wag); stroke(3.6);
      if (s.tailTip) { g.beginPath(); g.arc(x0 + 22, y0 - 16 + wag, 3, 0, Math.PI * 2); g.fillStyle = s.tailTip; g.fill(); } break;
    case 'kink': g.moveTo(x0, y0); g.lineTo(x0 + 10, y0 - 6); g.lineTo(x0 + 6 + wag * 0.2, y0 - 16); stroke(5.5); break;
    case 'pompom': g.moveTo(x0, y0); g.lineTo(x0 + 9, y0 - 12 + wag * 0.5); stroke(3);
      fluffEllipse(g, x0 + 10, y0 - 16 + wag * 0.5, 6.5, 6.5, 6, 0.15); g.fillStyle = col; g.fill(); g.lineWidth = 2.4; g.strokeStyle = OUT; g.stroke(); break;
    case 'ring': g.moveTo(x0, y0); g.bezierCurveTo(x0 + 18, y0, x0 + 18, y0 - 22, x0 + 10 + wag, y0 - 32); stroke(6.5);
      g.save(); g.setLineDash([4, 5]); g.lineWidth = 6.5; g.strokeStyle = s.stripes || shade(col, 0.75); g.stroke(); g.restore(); break;
    default: g.moveTo(x0, y0); g.bezierCurveTo(x0 + 18, y0, x0 + 18, y0 - 22, x0 + 10 + wag, y0 - 32); stroke(5.5);
  }
  g.restore();
}

// 몸 모양 경로 (옷을 몸에 맞춰 자를 때도 씀)
function bodyPath(g, s, G) {
  const { BW, BH, bodyY } = G;
  if (s.long) {
    g.beginPath(); g.moveTo(-BW * 0.8, bodyY - BH * 0.6);
    g.quadraticCurveTo(-BW * 1.35, -6, -BW * 1.2, 0);
    for (let i = 0; i <= 6; i++) g.quadraticCurveTo(-BW * 1.2 + (i + 0.5) * (BW * 2.4 / 7), 4, -BW * 1.2 + (i + 1) * (BW * 2.4 / 7), 0);
    g.quadraticCurveTo(BW * 1.35, -6, BW * 0.8, bodyY - BH * 0.6); g.closePath();
  } else if (s.fluffy || s.curly) fluffEllipse(g, 0, bodyY, BW, BH, 9, s.curly ? 0.12 : 0.08);
  else { g.beginPath(); g.ellipse(0, bodyY, BW, BH, 0, 0, Math.PI * 2); }
}

// ---------- 머리 (귀·얼굴·소품까지). 돌려주는 값: 가장 위쪽 y ----------
function drawChibiHead(g, s, cx, HY, W, HR, o) {
  const head0 = s.head || s.base, F = s.face || {};
  const look = o.look || 0, t = o.t || 0;
  drawEar(g, s, -1, cx, HY, W, HR, 'back'); drawEar(g, s, 1, cx, HY, W, HR, 'back');
  const headShape = () => { if (s.fluffy || s.curly) fluffEllipse(g, cx, HY, W, HR, s.curly ? 9 : 11, s.curly ? 0.1 : 0.07); else { g.beginPath(); g.ellipse(cx, HY, W, HR, 0, 0, Math.PI * 2); } };
  if (s.topPom) { fluffEllipse(g, cx, HY - HR * 0.95, W * 0.55, HR * 0.42, 7, 0.14); g.fillStyle = head0; g.fill(); g.lineWidth = 2.4; g.strokeStyle = OUT; g.stroke(); }
  if (s.curly && s.kind === 'dog' && !s.topPom) { fluffEllipse(g, cx, HY - HR * 0.8, W * 0.7, HR * 0.45, 8, 0.14); g.fillStyle = shade(head0, 1.03); g.fill(); g.lineWidth = 2.4; g.strokeStyle = OUT; g.stroke(); }
  headShape(); g.fillStyle = shadedFill(g, head0, cx, HY, HR); g.fill();
  g.save(); headShape(); g.clip();
  if (F.mask) {   // 허스키: 위쪽 진하고 눈·주둥이 둘레 하양
    g.fillStyle = F.mask; g.fillRect(cx - W, HY - HR, W * 2, HR * 2);
    g.fillStyle = F.maskIn || '#fff';
    g.beginPath(); g.moveTo(cx, HY - HR * 0.45); g.quadraticCurveTo(cx - W * 0.35, HY - HR * 0.3, cx - W * 0.7, HY - HR * 0.1); g.quadraticCurveTo(cx - W * 1.1, HY + HR * 0.9, cx, HY + HR);
    g.quadraticCurveTo(cx + W * 1.1, HY + HR * 0.9, cx + W * 0.7, HY - HR * 0.1); g.quadraticCurveTo(cx + W * 0.35, HY - HR * 0.3, cx, HY - HR * 0.45); g.fill();
  }
  if (F.blaze) { g.fillStyle = F.blaze; g.beginPath(); g.moveTo(cx - 3, HY - HR); g.lineTo(cx + 3, HY - HR); g.quadraticCurveTo(cx + 5, HY - 6, cx + 13, HY + HR); g.lineTo(cx - 13, HY + HR); g.quadraticCurveTo(cx - 5, HY - 6, cx - 3, HY - HR); g.fill(); }
  if (F.tuxV) { g.fillStyle = '#fff'; g.beginPath(); g.moveTo(cx, HY - HR * 0.35); g.quadraticCurveTo(cx - 6, HY, cx - W * 0.7, HY + HR); g.lineTo(cx + W * 0.7, HY + HR); g.quadraticCurveTo(cx + 6, HY, cx, HY - HR * 0.35); g.fill(); }
  if (F.cheeks) { g.fillStyle = F.cheeks; for (const sx of [-1, 1]) { g.beginPath(); g.ellipse(cx + sx * W * 0.45, HY + HR * 0.55, W * 0.5, HR * 0.42, 0, 0, Math.PI * 2); g.fill(); } }
  if (F.points) { g.fillStyle = F.points; g.beginPath(); g.ellipse(cx, HY + HR * 0.35, W * 0.5, HR * 0.55, 0, 0, Math.PI * 2); g.fill(); }
  if (F.tabby) {
    g.strokeStyle = F.tabby; g.lineWidth = 3.2; for (const dx of [-7, 0, 7]) { g.beginPath(); g.moveTo(cx + dx, HY - HR); g.lineTo(cx + dx * 0.75, HY - HR + 10); g.stroke(); }
    g.lineWidth = 2.6; for (const sx of [-1, 1]) for (const dy of [0, 5]) { g.beginPath(); g.moveTo(cx + sx * W, HY + dy); g.lineTo(cx + sx * W * 0.75, HY + dy + 1); g.stroke(); }
  }
  for (const p of F.patches || []) { g.fillStyle = p[3]; g.beginPath(); g.ellipse(cx + p[0] * W, HY + p[1] * HR, p[2] * W, p[2] * HR, 0, 0, Math.PI * 2); g.fill(); }
  for (const d of F.dots || []) { g.fillStyle = s.dotCol; g.beginPath(); g.arc(cx + d[0] * W, HY + d[1] * HR, 2.1, 0, Math.PI * 2); g.fill(); }
  if (s.hairless) { g.strokeStyle = shade(head0, 0.8); g.lineWidth = 1.3; for (const dy of [-0.62, -0.45]) { g.beginPath(); g.arc(cx, HY + HR * dy + 10, W * 0.32, Math.PI * 1.2, Math.PI * 1.8); g.stroke(); } }
  g.restore();
  headShape(); g.lineWidth = 2.8; g.strokeStyle = OUT; g.stroke();
  if (s.long && s.kind === 'dog') { g.strokeStyle = shade(head0, 0.8); g.lineWidth = 1.3; g.beginPath(); g.moveTo(cx, HY - HR); g.lineTo(cx, HY - HR * 0.6); g.stroke(); }
  // 주둥이
  const SN = F.snout || (s.kind === 'dog' ? 'mid' : 'cat');
  const mz = F.muzzle || (s.kind === 'dog' ? shade(head0, 1.15) : null);
  const mzW = SN === 'long' ? 10 : SN === 'flat' ? 9 : SN === 'cat' ? 8.5 : 11.5, mzH = SN === 'long' ? 11 : SN === 'flat' ? 6.5 : SN === 'cat' ? 6.5 : 8.5;
  const mx = cx + look * 0.8, mzY = HY + (SN === 'long' ? 11 : SN === 'flat' ? 6 : 9);
  if (mz) { g.beginPath(); g.ellipse(mx, mzY, mzW, mzH, 0, 0, Math.PI * 2); g.fillStyle = mz; g.fill(); if (SN === 'long' || SN === 'mid') { g.lineWidth = 1.6; g.strokeStyle = 'rgba(59,43,37,.35)'; g.stroke(); } }
  if (F.beard) { fluffEllipse(g, mx, mzY + mzH * 0.9, mzW * 1.05, mzH * 0.75, 6, 0.12); g.fillStyle = F.beard; g.fill(); g.lineWidth = 1.6; g.strokeStyle = OUT; g.stroke(); }
  if (F.wrinkle) { g.strokeStyle = shade(head0, 0.72); g.lineWidth = 1.4; g.beginPath(); g.arc(cx, HY - 2, 7, Math.PI * 1.15, Math.PI * 1.85); g.stroke(); }
  drawEar(g, s, -1, cx, HY, W, HR, 'front'); drawEar(g, s, 1, cx, HY, W, HR, 'front');
  // 눈
  const eyeY = HY + (SN === 'flat' ? -1 : 0), ex = W * (s.kind === 'cat' ? 0.4 : 0.42), es = s.eyeK || 1;
  const hc = parseInt((head0[0] === '#' ? head0 : '#888888').slice(1), 16);
  const dark = (0.3 * (hc >> 16) + 0.59 * ((hc >> 8) & 255) + 0.11 * (hc & 255)) < 90 && !F.mask;
  for (const sx of [-1, 1]) {
    const ecx = cx + sx * ex + look, iris = Array.isArray(s.eye) ? s.eye[sx < 0 ? 0 : 1] : s.eye;
    if (o.sleep) { g.strokeStyle = dark ? '#F3D27A' : OUT; g.lineWidth = 2; g.beginPath(); g.arc(ecx, eyeY - 1, 3.8, Math.PI * 0.15, Math.PI * 0.85); g.stroke(); }
    else {
      if (F.brows) { g.fillStyle = F.brows; g.beginPath(); g.ellipse(ecx, eyeY - 7.5 * es, 3, 2, 0, 0, Math.PI * 2); g.fill(); }
      if (iris || dark) {
        g.beginPath(); g.ellipse(ecx, eyeY, 4 * es, 4.8 * es, 0, 0, Math.PI * 2); g.fillStyle = iris || '#F3D27A'; g.fill();
        g.beginPath(); g.ellipse(ecx, eyeY + 0.6, 2.2 * es, 3.3 * es, 0, 0, Math.PI * 2); g.fillStyle = '#1d1a18'; g.fill();
      } else { g.beginPath(); g.ellipse(ecx, eyeY, 3.6 * es, 4.6 * es, 0, 0, Math.PI * 2); g.fillStyle = '#2a2420'; g.fill(); }
      g.fillStyle = '#fff'; g.beginPath(); g.arc(ecx + 1.2 * es, eyeY - 1.8 * es, 1.5 * es, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.arc(ecx - 1.1 * es, eyeY + 2.2 * es, 0.7, 0, Math.PI * 2); g.fill();
    }
    g.fillStyle = 'rgba(255,128,150,.42)'; g.beginPath(); g.ellipse(cx + sx * W * 0.66, HY + 9, 4.4, 2.5, 0, 0, Math.PI * 2); g.fill();
  }
  // 앞머리 (삽살개): 눈 바로 위까지
  if (s.bangs) {
    g.save(); headShape(); g.clip();
    fluffEllipse(g, cx, HY - HR * 0.55, W * 1.05, HR * 0.5, 9, 0.1); g.fillStyle = shade(head0, 1.03); g.fill();
    g.restore(); g.strokeStyle = shade(head0, 0.75); g.lineWidth = 1.4; g.beginPath();
    for (let i = -3; i <= 3; i++) { g.moveTo(cx + i * W * 0.24, HY - HR * 0.3); g.quadraticCurveTo(cx + i * W * 0.24 + 2, HY - HR * 0.18, cx + i * W * 0.24, HY - HR * 0.1); }
    g.stroke();
  }
  // 코·입
  const noseY = SN === 'long' ? mzY - 4 : SN === 'flat' ? HY + 4.5 : mzY - 3;
  g.fillStyle = F.nose || (s.kind === 'cat' ? '#E88A8A' : '#2a2420');
  const nw = s.kind === 'dog' ? 3.6 : 2.6;
  g.beginPath(); g.moveTo(mx - nw, noseY); g.quadraticCurveTo(mx, noseY - 2, mx + nw, noseY); g.quadraticCurveTo(mx, noseY + 4.5, mx - nw, noseY); g.fill();
  g.strokeStyle = OUT; g.lineWidth = 1.5;
  const my = noseY + 3.2;
  g.beginPath(); g.moveTo(mx, noseY + 2.2); g.lineTo(mx, my); g.arc(mx - 2.3, my, 2.3, 0, Math.PI); g.moveTo(mx + 4.6, my); g.arc(mx + 2.3, my, 2.3, 0, Math.PI); g.stroke();
  if (F.tongue || o.bark) { g.beginPath(); g.ellipse(mx, my + 4, 2.6, 3.4, 0, 0, Math.PI * 2); g.fillStyle = '#F07A92'; g.fill(); g.stroke(); }
  if (s.kind === 'cat' && !s.hairless) { g.strokeStyle = 'rgba(59,43,37,.5)'; g.lineWidth = 1; for (const sx of [-1, 1]) for (const dy of [-1, 2]) { g.beginPath(); g.moveTo(mx + sx * 11, noseY + 3 + dy); g.lineTo(mx + sx * 22, noseY + 1 + dy * 1.6); g.stroke(); } }
  // 머리 위 리본 (요크셔·말티즈·시츄)
  if (s.bow && !o.acc) {
    const by = HY - HR - 2;
    g.fillStyle = head0; g.strokeStyle = OUT; g.lineWidth = 2;
    g.beginPath(); g.moveTo(cx - 4, by + 5); g.quadraticCurveTo(cx - 2, by - 8, cx + 3, by - 9); g.quadraticCurveTo(cx + 2, by - 2, cx + 5, by + 5); g.fill(); g.stroke();
    g.fillStyle = s.bow; for (const side of [-1, 1]) { g.beginPath(); g.moveTo(cx, by - 2); g.lineTo(cx + side * 8, by - 7); g.lineTo(cx + side * 8, by + 3); g.closePath(); g.fill(); g.stroke(); }
    g.beginPath(); g.arc(cx, by - 2, 2.4, 0, Math.PI * 2); g.fill(); g.stroke();
  }
  const accTop = drawAccessory(g, o.acc, cx, HY, W, HR, s, t);
  return Math.min(earTopY(s, HY, HR), s.bow && !o.acc ? HY - HR - 12 : 0, accTop ?? 0);
}

// ---------- 한 마리 (발바닥 가운데가 0,0). 돌려주는 값: 가장 위쪽 y ----------
function drawChibi(g, s, o) {
  const G = chibiGeo(s);
  if (o.wear) G.HY -= G.BH * 0.5;   // 옷을 입으면 머리를 조금 올려서 옷이 보이게
  const { BW, BH, LEG, bodyY, HR, W, HY } = G;
  const t = o.t || 0, face = o.face || 1, moving = !!o.moving, ph = o.ph || 0;
  const bob = moving ? -Math.abs(Math.sin(ph)) * 2.2 : Math.sin(t * 2 + (o.seed || 0)) * 0.6;
  const body0 = s.body || s.base;
  g.lineJoin = 'round'; g.lineCap = 'round';
  g.fillStyle = 'rgba(0,0,0,.16)'; g.beginPath(); g.ellipse(0, 1, BW * 1.25, 5, 0, 0, Math.PI * 2); g.fill();
  g.save(); g.translate(0, bob);
  drawWear(g, o.wear, s, G, 'back', t);
  drawTail(g, s, bodyY, BW, t, -face);
  if (LEG > 0) for (const sx of [-1, 1]) { g.beginPath(); g.roundRect(sx * BW * 0.62 - 4.5, bodyY, 9, -bodyY - bob, 4.5); g.fillStyle = shade(s.leg2 || body0, 0.85); g.fill(); g.lineWidth = 2.4; g.strokeStyle = OUT; g.stroke(); }
  bodyPath(g, s, G); g.fillStyle = shadedFill(g, body0, 0, bodyY, Math.max(BW, BH) * (s.long ? 1.3 : 1)); g.fill(); g.lineWidth = 2.6; g.strokeStyle = OUT; g.stroke();
  if (s.long) { g.strokeStyle = shade(body0, 0.82); g.lineWidth = 1.2; for (const sx of [-0.6, -0.2, 0.2, 0.6]) { g.beginPath(); g.moveTo(sx * BW, bodyY); g.quadraticCurveTo(sx * BW * 1.2, bodyY + BH, sx * BW * 1.25, -4); g.stroke(); } }
  else {
    g.save(); bodyPath(g, s, G); g.clip();
    if (s.saddle) { g.fillStyle = s.saddle; g.beginPath(); g.ellipse(0, bodyY - BH * 0.9, BW * 1.1, BH * 0.7, 0, 0, Math.PI * 2); g.fill(); }
    if (s.belly) { g.fillStyle = s.belly; g.beginPath(); g.ellipse(0, bodyY + BH * 0.35, BW * 0.55, BH * 0.85, 0, 0, Math.PI * 2); g.fill(); }
    if (s.bodyStripes) { g.strokeStyle = s.stripes; g.lineWidth = 3; for (const sx of [-0.75, 0.75]) { g.beginPath(); g.moveTo(sx * BW, bodyY - BH * 0.5); g.lineTo(sx * BW * 0.7, bodyY + BH * 0.1); g.stroke(); } }
    for (const p of s.bodyPatches || []) { g.fillStyle = p[3]; g.beginPath(); g.ellipse(p[0] * BW, bodyY + p[1] * BH, p[2] * BW, p[2] * BH * 0.85, 0, 0, Math.PI * 2); g.fill(); }
    for (const d of s.dots || []) { g.fillStyle = s.dotCol; g.beginPath(); g.arc(d[0] * BW, bodyY + d[1] * BH, 2.2, 0, Math.PI * 2); g.fill(); }
    if (s.hairless) { g.strokeStyle = shade(body0, 0.8); g.lineWidth = 1.2; for (const dy of [-0.4, -0.1]) { g.beginPath(); g.arc(0, bodyY + dy * BH + 6, BW * 0.6, Math.PI * 1.2, Math.PI * 1.8); g.stroke(); } }
    g.restore();
  }
  drawWear(g, o.wear, s, G, 'front', t);
  g.restore();
  // 앞다리·발 (걸을 때 번갈아 들림)
  const pawC = s.paw || body0;
  for (const sx of [-1, 1]) {
    const lift = moving ? Math.max(0, Math.sin(ph + (sx > 0 ? Math.PI : 0))) * 3.2 : 0;
    if (LEG > 0) { g.beginPath(); g.roundRect(sx * BW * 0.38 - 5, bodyY + bob + BH * 0.3, 10, -bodyY - bob - BH * 0.3 - lift, 5); g.fillStyle = s.leg2 || body0; g.fill(); g.lineWidth = 2.4; g.strokeStyle = OUT; g.stroke(); }
    g.beginPath(); g.ellipse(sx * Math.max(7.5, BW * 0.4), -3 - lift, 6.2, 4.6, 0, 0, Math.PI * 2); g.fillStyle = pawC; g.fill(); g.lineWidth = 2.4; g.strokeStyle = OUT; g.stroke();
  }
  g.save(); g.translate(0, bob);
  if (s.mane) { fluffEllipse(g, 0, HY + HR * 0.85, W * 0.95, HR * 0.55, 9, 0.12); g.fillStyle = s.mane; g.fill(); g.lineWidth = 2.4; g.strokeStyle = OUT; g.stroke(); }
  drawWear(g, o.wear, s, G, 'neck', t);
  const top = o.noCache ? drawChibiHead(g, s, face * 1.6, HY, W, HR, { t, acc: o.acc, sleep: o.sleep, bark: o.bark, look: face * 1.4 })
    : cachedHead(g, s, face, HY, W, HR, o);
  g.restore();
  return top + bob;
}

// ---------- 머리 그림 재사용 (11.11 테스터: 옛 폰에서 무거움) ----------
// 머리는 움직임이 없어서, 품종·소품·방향·표정·화면 배율이 같으면 한 번 그린 그림을 다시 씀 (최근 120개까지)
const headCache = new Map(), specIds = new Map();
function cachedHead(g, s, face, HY, W, HR, o) {
  let res = 2;
  try { const m = g.getTransform(); res = Math.hypot(m.a, m.b) || 2; } catch {}
  res = Math.max(0.5, Math.round(res * 4) / 4);
  if (!specIds.has(s)) specIds.set(s, specIds.size + 1);   // 품종 특징표마다 번호 하나
  const name = `${specIds.get(s)}|${o.acc || ''}|${face}|${o.sleep ? 1 : 0}${o.bark ? 1 : 0}|${res}`;
  let c = headCache.get(name);
  const L = W * 1.6 + 12, TOP = HR * 2.35 + 8, BOT = HR * 1.7;
  if (!c) {
    const cv = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(1, 1) : document.createElement('canvas');
    cv.width = Math.ceil(L * 2 * res); cv.height = Math.ceil((TOP + BOT) * res);
    const q = cv.getContext('2d'); q.scale(res, res); q.translate(L, TOP); q.lineJoin = 'round'; q.lineCap = 'round';
    const top = drawChibiHead(q, s, face * 1.6, 0, W, HR, { t: 0.3, acc: o.acc, sleep: o.sleep, bark: o.bark, look: face * 1.4 });
    c = { cv, top };
    headCache.set(name, c);
    if (headCache.size > 120) headCache.delete(headCache.keys().next().value);
  } else { headCache.delete(name); headCache.set(name, c); }   // 최근에 쓴 것을 뒤로
  g.drawImage(c.cv, -L, HY - TOP, L * 2, TOP + BOT);
  return HY + c.top;
}

// ---------- 바깥에서 쓰는 함수 ----------
// 한 마리 그리기. p: { breed, x, y, tx, ty, face, acc, wear, name, act } (x, y는 발 위치). 돌려주는 값: 이름표 윗변 y
function drawPet(ctx, p, t, mine) {
  const b = BREEDS[p.breed] || BREEDS[0], s = specOf(b);
  const moving = Math.hypot(p.tx - p.x, p.ty - p.y) > 2;
  if (p.tx < p.x - 1) p.face = -1; else if (p.tx > p.x + 1) p.face = 1;
  const Z = 1.18 * (s.size || 1);
  ctx.save(); ctx.translate(p.x, p.y); ctx.scale(Z, Z);
  const topL = drawChibi(ctx, s, { t, moving, ph: t * 12 + (p.breed || 0) * 0.7, face: p.face ?? 1, acc: p.acc, wear: p.wear, sleep: p.act && p.act.a === 'sleep', bark: p.act && p.act.a === 'bark', seed: p.breed });
  ctx.restore();
  const top = p.y + topL * Z - 2;
  if (p.noTag) return top;
  ctx.font = `${mine ? 17 : 15}px Jua`; ctx.textAlign = 'center';
  const label = mine ? `나 · ${p.name || b.name}` : p.npc ? `주민 · ${b.name}` : p.name || b.name;
  const tw = ctx.measureText(label).width + 16;
  petRR(ctx, p.x - tw / 2, top - 26, tw, 24, 12); ctx.fillStyle = mine ? '#E8402F' : 'rgba(31,31,34,.75)'; ctx.fill();
  ctx.fillStyle = '#fff'; ctx.fillText(label, p.x, top - 8);
  return top - 26;
}
// 얼굴만 (고르기·옷장 칸, 게임 타일): cx, cy = 머리 가운데, R = 머리 반지름
function drawFace(ctx, breed, acc, cx, cy, R) {
  const b = BREEDS[breed] || BREEDS[0], s = specOf(b), G = chibiGeo(s), k = R / G.HR;
  ctx.save(); ctx.translate(cx, cy); ctx.scale(k, k);
  drawChibiHead(ctx, s, 0, 0, G.W, G.HR, { t: 0.3, acc });
  ctx.restore();
}
// 예전 함수 이름 그대로 (게임 타일·카드가 부름): 머리를 (hx 보정, hy)에 그림
function drawHead(ctx, b, hx, hy, headR, headCol, snout, t, seed) {
  const idx = BREEDS.indexOf(b);
  drawFace(ctx, idx < 0 ? seed || 0 : idx, '', hx + ((snout || 0) - headR * 0.17) / 2, hy + 2, headR * 0.9);
}

// =====================================================================
// 소품(머리·목) — need: 옷장에서 풀리는 데 필요한 "끝낸 게임 판 수"
// =====================================================================
const ACCESSORIES = [
  { id: '', name: '없음', need: 0 },
  { id: 'ribbon', name: '리본', need: 0 }, { id: 'flower', name: '꽃', need: 0 }, { id: 'bowtie', name: '나비넥타이', need: 0 }, { id: 'sprout', name: '새싹 핀', need: 0 },
  { id: 'glasses', name: '선글라스', need: 1 }, { id: 'strawberry', name: '딸기 핀', need: 2 }, { id: 'beanie', name: '비니', need: 2 },
  { id: 'bell', name: '방울 목걸이', need: 3 }, { id: 'scarf', name: '목도리', need: 3 }, { id: 'cap', name: '야구모자', need: 4 },
  { id: 'heartglasses', name: '하트 안경', need: 5 }, { id: 'headphones', name: '헤드폰', need: 5 }, { id: 'beret', name: '베레모', need: 6 },
  { id: 'bandana', name: '반다나', need: 7 }, { id: 'bunny', name: '토끼 머리띠', need: 8 }, { id: 'bucket', name: '벙거지', need: 9 },
  { id: 'party', name: '꼬깔모자', need: 10 }, { id: 'flowercrown', name: '꽃 화관', need: 11 }, { id: 'santa', name: '산타모자', need: 12 },
  { id: 'chef', name: '요리사 모자', need: 14 }, { id: 'tiara', name: '티아라', need: 15 }, { id: 'witch', name: '마법사 모자', need: 18 },
  { id: 'crown', name: '왕관', need: 20 }, { id: 'grad', name: '학사모', need: 22 }, { id: 'pirate', name: '해적모자', need: 25 },
  { id: 'mask', name: '도둑 복면', need: 30 }, { id: 'halo', name: '천사 링', need: 40 },
];
// 머리 가운데(cx, HY), 머리 반폭 W, 반지름 HR. 돌려주는 값: 소품의 가장 위쪽 y (없으면 undefined)
function drawAccessory(g, acc, cx, HY, W, HR, s) {
  if (!acc) return undefined;
  if (HR === undefined) { HR = W; W = HR * 1.12; }   // 예전 호출 (ctx, acc, hx, hy, R)
  const R = HR;
  g.save(); g.lineWidth = 2.2; g.strokeStyle = OUT; g.lineJoin = 'round';
  const dot = (x, y, r, col) => { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fillStyle = col; g.fill(); g.stroke(); };
  const bow = (x, y, w, h, col) => { g.fillStyle = col; for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(x, y); g.lineTo(x + sd * w, y - h); g.lineTo(x + sd * w, y + h); g.closePath(); g.fill(); g.stroke(); } dot(x, y, h * 0.5, col); };
  const dome = (y, rx, ry, col) => { g.beginPath(); g.ellipse(cx, y, rx, ry, 0, Math.PI, Math.PI * 2); g.closePath(); g.fillStyle = col; g.fill(); g.stroke(); };
  const neckY = HY + R * 0.98;
  let top;
  switch (acc) {
    case 'ribbon': bow(cx - W * 0.5, HY - R * 0.82, R * 0.42, R * 0.26, '#F06A86'); top = HY - R * 1.1; break;
    case 'flower': { const x = cx - W * 0.55, y = HY - R * 0.78; for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; dot(x + Math.cos(a) * R * 0.2, y + Math.sin(a) * R * 0.2, R * 0.16, '#F9A8C0'); } dot(x, y, R * 0.12, '#FFD54A'); top = y - R * 0.4; break; }
    case 'sprout': { const y = HY - R; g.beginPath(); g.moveTo(cx, y + 2); g.lineTo(cx, y - R * 0.35); g.lineWidth = 2.6; g.strokeStyle = '#4E9A4A'; g.stroke(); g.lineWidth = 2; g.strokeStyle = OUT;
      for (const sd of [-1, 1]) { g.beginPath(); g.ellipse(cx + sd * R * 0.2, y - R * 0.4, R * 0.2, R * 0.11, sd * -0.5, 0, Math.PI * 2); g.fillStyle = '#7BC67E'; g.fill(); g.stroke(); } top = y - R * 0.55; break; }
    case 'strawberry': { const x = cx + W * 0.55, y = HY - R * 0.72; g.beginPath(); g.moveTo(x - R * 0.2, y - R * 0.08); g.quadraticCurveTo(x, y + R * 0.35, x + R * 0.2, y - R * 0.08); g.quadraticCurveTo(x, y - R * 0.18, x - R * 0.2, y - R * 0.08); g.fillStyle = '#E8402F'; g.fill(); g.stroke();
      g.fillStyle = '#7BC67E'; g.beginPath(); g.ellipse(x, y - R * 0.12, R * 0.16, R * 0.07, 0, 0, Math.PI * 2); g.fill(); g.fillStyle = '#FFE58A'; for (const [dx, dy] of [[-0.07, 0.03], [0.07, 0.03], [0, 0.13]]) { g.beginPath(); g.arc(x + dx * R, y + dy * R, 1, 0, Math.PI * 2); g.fill(); } top = y - R * 0.25; break; }
    case 'bowtie': bow(cx, neckY, R * 0.38, R * 0.2, '#E8402F'); break;
    case 'bell': { g.beginPath(); g.ellipse(cx, neckY - 2, W * 0.62, R * 0.14, 0, 0, Math.PI); g.lineWidth = R * 0.16; g.strokeStyle = '#E8402F'; g.stroke(); g.lineWidth = 2; g.strokeStyle = OUT; dot(cx, neckY + R * 0.18, R * 0.16, '#FFD54A'); g.beginPath(); g.moveTo(cx - R * 0.1, neckY + R * 0.18); g.lineTo(cx + R * 0.1, neckY + R * 0.18); g.stroke(); break; }
    case 'scarf': { g.fillStyle = '#4C8BD9'; petRR(g, cx - W * 0.75, neckY - R * 0.2, W * 1.5, R * 0.36, R * 0.18); g.fill(); g.stroke(); petRR(g, cx + W * 0.25, neckY, R * 0.3, R * 0.7, R * 0.1); g.fill(); g.stroke();
      g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = 1.5; for (const dx of [-0.4, 0, 0.4]) { g.beginPath(); g.moveTo(cx + W * dx, neckY - R * 0.16); g.lineTo(cx + W * dx, neckY + R * 0.12); g.stroke(); } break; }
    case 'bandana': { g.beginPath(); g.moveTo(cx - W * 0.7, neckY - R * 0.12); g.lineTo(cx + W * 0.7, neckY - R * 0.12); g.lineTo(cx, neckY + R * 0.55); g.closePath(); g.fillStyle = '#E8402F'; g.fill(); g.stroke();
      g.fillStyle = '#fff'; for (const [dx, dy] of [[-0.3, 0.05], [0.3, 0.05], [0, 0.3], [0, 0.05]]) { g.beginPath(); g.arc(cx + dx * W, neckY + dy * R, 1.5, 0, Math.PI * 2); g.fill(); } break; }
    case 'glasses': case 'heartglasses': {
      const ex = W * 0.41, y = HY;
      for (const sd of [-1, 1]) {
        g.beginPath();
        if (acc === 'glasses') g.roundRect(cx + sd * ex - R * 0.27, y - R * 0.2, R * 0.54, R * 0.38, R * 0.12);
        else { const x = cx + sd * ex, hs = R * 0.24; g.moveTo(x, y + hs); g.bezierCurveTo(x - hs * 1.9, y - hs * 0.2, x - hs * 0.9, y - hs * 1.6, x, y - hs * 0.55); g.bezierCurveTo(x + hs * 0.9, y - hs * 1.6, x + hs * 1.9, y - hs * 0.2, x, y + hs); }
        g.fillStyle = acc === 'glasses' ? '#1f1f22' : 'rgba(255,93,162,.85)'; g.fill(); g.stroke();
      }
      g.beginPath(); g.moveTo(cx - ex + R * 0.26, y - R * 0.05); g.lineTo(cx + ex - R * 0.26, y - R * 0.05); g.stroke();
      if (acc === 'glasses') { g.fillStyle = 'rgba(255,255,255,.6)'; for (const sd of [-1, 1]) g.fillRect(cx + sd * ex - R * 0.15, y - R * 0.12, R * 0.08, R * 0.12); }
      break; }
    case 'mask': {
      g.save(); g.beginPath(); g.ellipse(cx, HY, W, R, 0, 0, Math.PI * 2); g.clip();
      g.fillStyle = '#26232A'; g.fillRect(cx - W, HY - R * 0.3, W * 2, R * 0.48); g.restore();
      g.fillStyle = '#26232A'; g.beginPath(); g.moveTo(cx + W * 0.95, HY - R * 0.1); g.lineTo(cx + W * 1.45, HY - R * 0.35); g.lineTo(cx + W * 1.35, HY + R * 0.1); g.closePath(); g.fill();
      for (const sd of [-1, 1]) { g.fillStyle = '#fff'; g.beginPath(); g.arc(cx + sd * W * 0.41, HY - R * 0.05, R * 0.13, 0, Math.PI * 2); g.fill(); g.fillStyle = OUT; g.beginPath(); g.arc(cx + sd * W * 0.41, HY - R * 0.03, R * 0.07, 0, Math.PI * 2); g.fill(); }
      break; }
    case 'beanie': dome(HY - R * 0.35, W * 0.98, R * 0.78, '#E8402F'); petRR(g, cx - W * 1.02, HY - R * 0.5, W * 2.04, R * 0.3, R * 0.14); g.fillStyle = '#F4E9D8'; g.fill(); g.stroke(); dot(cx, HY - R * 1.18, R * 0.2, '#F4E9D8'); top = HY - R * 1.4; break;
    case 'cap': dome(HY - R * 0.42, W * 0.92, R * 0.68, '#3D5FB0'); g.beginPath(); g.ellipse(cx, HY - R * 0.42, W * 0.95, R * 0.2, 0, 0, Math.PI); g.fillStyle = '#2E4A8C'; g.fill(); g.stroke(); dot(cx, HY - R * 0.85, R * 0.14, '#FFD54A'); top = HY - R * 1.15; break;
    case 'beret': g.beginPath(); g.ellipse(cx - W * 0.15, HY - R * 0.82, W * 0.85, R * 0.32, -0.15, 0, Math.PI * 2); g.fillStyle = '#9B2D43'; g.fill(); g.stroke(); g.beginPath(); g.moveTo(cx - W * 0.15, HY - R * 1.12); g.lineTo(cx - W * 0.12, HY - R * 1.25); g.stroke(); top = HY - R * 1.3; break;
    case 'bucket': g.beginPath(); g.ellipse(cx, HY - R * 0.48, W * 1.12, R * 0.22, 0, 0, Math.PI * 2); g.fillStyle = '#F2C14E'; g.fill(); g.stroke(); dome(HY - R * 0.5, W * 0.8, R * 0.6, '#F7D46A'); top = HY - R * 1.15; break;
    case 'headphones': g.lineWidth = R * 0.2; g.strokeStyle = '#3A3550'; g.beginPath(); g.ellipse(cx, HY - R * 0.1, W * 0.98, R * 1.0, 0, Math.PI * 1.05, Math.PI * 1.95); g.stroke(); g.lineWidth = 2; g.strokeStyle = OUT;
      for (const sd of [-1, 1]) { petRR(g, cx + sd * W * 0.98 - R * 0.2, HY - R * 0.3, R * 0.4, R * 0.62, R * 0.18); g.fillStyle = '#FF5DA2'; g.fill(); g.stroke(); } top = HY - R * 1.2; break;
    case 'bunny': g.lineWidth = R * 0.12; g.strokeStyle = '#F4B1AE'; g.beginPath(); g.ellipse(cx, HY - R * 0.2, W * 0.92, R * 0.85, 0, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); g.lineWidth = 2; g.strokeStyle = OUT;
      for (const sd of [-1, 1]) { g.save(); g.translate(cx + sd * W * 0.32, HY - R * 0.95); g.rotate(sd * 0.18); g.beginPath(); g.ellipse(0, -R * 0.55, R * 0.2, R * 0.6, 0, 0, Math.PI * 2); g.fillStyle = '#fff'; g.fill(); g.stroke(); g.beginPath(); g.ellipse(0, -R * 0.52, R * 0.09, R * 0.42, 0, 0, Math.PI * 2); g.fillStyle = '#F4B1AE'; g.fill(); g.restore(); }
      top = HY - R * 2.15; break;
    case 'party': { const h = R * 1.3, w = R * 0.8; g.translate(cx - W * 0.1, HY - R * 0.8); g.rotate(-0.2);
      const cone = () => { g.beginPath(); g.moveTo(-w / 2, 0); g.lineTo(0, -h); g.lineTo(w / 2, 0); g.closePath(); };
      cone(); g.fillStyle = '#5BB5E8'; g.fill(); g.save(); cone(); g.clip(); g.strokeStyle = '#FFD54A'; g.lineWidth = R * 0.15; for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(-w, -h * i / 4 + R * 0.2); g.lineTo(w, -h * i / 4 - R * 0.2); g.stroke(); } g.restore(); cone(); g.stroke(); dot(0, -h, R * 0.16, '#F06A86');
      top = HY - R * 2.25; break; }
    case 'flowercrown': for (let i = 0; i < 7; i++) { const a = Math.PI * (1.08 + i * 0.14), x = cx + Math.cos(a) * W * 0.95, y = HY - R * 0.15 + Math.sin(a) * R * 0.85; dot(x, y, R * 0.13, ['#F9A8C0', '#FFE58A', '#B8D8F0', '#F9A8C0', '#C8E6A0', '#FFE58A', '#F9A8C0'][i]); } top = HY - R * 1.15; break;
    case 'santa': { g.beginPath(); g.moveTo(cx - W * 0.95, HY - R * 0.5); g.quadraticCurveTo(cx - W * 0.2, HY - R * 1.9, cx + W * 0.95, HY - R * 1.25); g.quadraticCurveTo(cx + W * 0.4, HY - R * 0.9, cx + W * 0.95, HY - R * 0.5); g.closePath(); g.fillStyle = '#E8402F'; g.fill(); g.stroke();
      petRR(g, cx - W * 1.02, HY - R * 0.62, W * 2.04, R * 0.3, R * 0.15); g.fillStyle = '#fff'; g.fill(); g.stroke(); dot(cx + W * 0.98, HY - R * 1.25, R * 0.2, '#fff'); top = HY - R * 1.65; break; }
    case 'chef': petRR(g, cx - W * 0.6, HY - R * 1.0, W * 1.2, R * 0.38, R * 0.08); g.fillStyle = '#fff'; g.fill(); g.stroke();
      for (const [dx, r2] of [[-0.35, 0.36], [0.35, 0.36], [0, 0.45]]) { g.beginPath(); g.arc(cx + dx * W, HY - R * 1.25, R * r2, 0, Math.PI * 2); g.fillStyle = '#fff'; g.fill(); g.stroke(); }
      petRR(g, cx - W * 0.6, HY - R * 1.0, W * 1.2, R * 0.3, R * 0.08); g.fill(); top = HY - R * 1.75; break;
    case 'tiara': { const y = HY - R * 0.82; g.beginPath(); g.moveTo(cx - W * 0.5, y); for (let i = 0; i <= 4; i++) { const x = cx - W * 0.5 + i * W * 0.25; g.lineTo(x, y - (i === 2 ? R * 0.42 : i % 2 ? R * 0.18 : R * 0.28)); } g.lineTo(cx + W * 0.5, y); g.closePath();
      g.fillStyle = '#E3E8F0'; g.fill(); g.stroke(); dot(cx, y - R * 0.2, R * 0.08, '#F06A86'); top = y - R * 0.5; break; }
    case 'crown': { const w = W * 1.05, h = R * 0.6, y = HY - R * 0.72; g.beginPath(); g.moveTo(cx - w / 2, y); g.lineTo(cx - w / 2, y - h); g.lineTo(cx - w / 4, y - h * 0.55); g.lineTo(cx, y - h * 1.05); g.lineTo(cx + w / 4, y - h * 0.55); g.lineTo(cx + w / 2, y - h); g.lineTo(cx + w / 2, y); g.closePath();
      g.fillStyle = '#FFD54A'; g.fill(); g.stroke(); dot(cx, y - h * 0.32, R * 0.09, '#E8402F'); top = y - h * 1.1; break; }
    case 'witch': g.beginPath(); g.ellipse(cx, HY - R * 0.62, W * 1.2, R * 0.22, 0, 0, Math.PI * 2); g.fillStyle = '#5B3E8C'; g.fill(); g.stroke();
      g.beginPath(); g.moveTo(cx - W * 0.6, HY - R * 0.68); g.quadraticCurveTo(cx - W * 0.1, HY - R * 1.6, cx + W * 0.5, HY - R * 2.0); g.quadraticCurveTo(cx + W * 0.25, HY - R * 1.3, cx + W * 0.6, HY - R * 0.68); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = '#FFD54A'; g.beginPath(); for (let i = 0; i < 10; i++) { const r2 = i % 2 ? R * 0.07 : R * 0.16, a = (i / 10) * Math.PI * 2 - Math.PI / 2; g.lineTo(cx + Math.cos(a) * r2, HY - R * 1.05 + Math.sin(a) * r2); } g.closePath(); g.fill(); top = HY - R * 2.05; break;
    case 'grad': petRR(g, cx - W * 0.62, HY - R * 1.0, W * 1.24, R * 0.32, R * 0.06); g.fillStyle = '#26232A'; g.fill(); g.stroke();
      g.beginPath(); g.moveTo(cx - W * 1.0, HY - R * 1.05); g.lineTo(cx, HY - R * 1.35); g.lineTo(cx + W * 1.0, HY - R * 1.05); g.lineTo(cx, HY - R * 0.8); g.closePath(); g.fill(); g.stroke();
      g.beginPath(); g.moveTo(cx, HY - R * 1.08); g.lineTo(cx + W * 0.7, HY - R * 0.9); g.lineTo(cx + W * 0.72, HY - R * 0.5); g.lineWidth = 2; g.strokeStyle = '#FFD54A'; g.stroke(); top = HY - R * 1.4; break;
    case 'pirate': g.beginPath(); g.moveTo(cx - W * 1.1, HY - R * 0.62); g.quadraticCurveTo(cx - W * 0.6, HY - R * 1.55, cx, HY - R * 1.2); g.quadraticCurveTo(cx + W * 0.6, HY - R * 1.55, cx + W * 1.1, HY - R * 0.62); g.quadraticCurveTo(cx, HY - R * 0.9, cx - W * 1.1, HY - R * 0.62); g.fillStyle = '#26232A'; g.fill(); g.stroke();
      g.strokeStyle = '#FFD54A'; g.lineWidth = 2; g.beginPath(); g.moveTo(cx - W * 0.9, HY - R * 0.72); g.quadraticCurveTo(cx, HY - R * 0.98, cx + W * 0.9, HY - R * 0.72); g.stroke(); top = HY - R * 1.45; break;
    case 'halo': g.lineWidth = R * 0.14; g.strokeStyle = '#FFD54A'; g.beginPath(); g.ellipse(cx, HY - R * 1.45, W * 0.6, R * 0.16, 0, 0, Math.PI * 2); g.stroke(); g.lineWidth = 1.5; g.strokeStyle = 'rgba(255,213,74,.5)'; g.beginPath(); g.ellipse(cx, HY - R * 1.45, W * 0.7, R * 0.23, 0, 0, Math.PI * 2); g.stroke(); top = HY - R * 1.7; break;
  }
  g.restore();
  return top;
}

// =====================================================================
// 옷 (몸) — 11.11 새로. need: 끝낸 게임 판 수
// =====================================================================
const WEARS = [
  { id: '', name: '없음', need: 0 },
  { id: 'tshirt', name: '노랑 티셔츠', need: 0 }, { id: 'stripe', name: '줄무늬 티', need: 1 }, { id: 'hoodie', name: '분홍 후드', need: 3 },
  { id: 'raincoat', name: '노랑 우비', need: 5 }, { id: 'overall', name: '청 멜빵', need: 7 }, { id: 'jersey', name: '빨강 유니폼', need: 9 },
  { id: 'sweater', name: '초록 스웨터', need: 11 }, { id: 'puffer', name: '하늘 패딩', need: 13 }, { id: 'cape', name: '영웅 망토', need: 16 },
  { id: 'santasuit', name: '산타 옷', need: 19 }, { id: 'suit', name: '턱시도 정장', need: 24 }, { id: 'dino', name: '공룡 옷', need: 28 },
  { id: 'wings', name: '천사 날개', need: 35 },
];
// layer: back(몸 뒤: 망토·날개·공룡 가시) front(몸 위) neck(목: 후드·깃)
function drawWear(g, wear, s, G, layer, t) {
  if (!wear) return;
  const { BW, BH, bodyY, HY, HR, W } = G;
  g.save(); g.lineWidth = 2.2; g.strokeStyle = OUT; g.lineJoin = 'round';
  const fillBody = (col, from = -1.2) => { g.save(); bodyPath(g, s, G); g.clip(); g.fillStyle = col; g.fillRect(-BW * 1.6, bodyY + BH * from, BW * 3.2, BH * 3); g.restore(); };
  const sleeves = (col) => { for (const sd of [-1, 1]) { g.beginPath(); g.ellipse(sd * BW * 0.9, bodyY + BH * 0.05, BW * 0.26, BH * 0.34, sd * 0.35, 0, Math.PI * 2); g.fillStyle = col; g.fill(); g.stroke(); } };
  const outline = () => { bodyPath(g, s, G); g.lineWidth = 2.6; g.strokeStyle = OUT; g.stroke(); g.lineWidth = 2.2; };
  const hood = (col) => { g.beginPath(); g.ellipse(0, HY + HR * 0.08, W * 1.13, HR * 1.07, 0, 0, Math.PI * 2); g.fillStyle = col; g.fill(); g.stroke(); };   // 머리 뒤로 얼굴을 감싸는 모자
  if (layer === 'back') {
    if (wear === 'cape') { g.beginPath(); g.moveTo(-BW * 0.9, bodyY - BH * 0.7); g.quadraticCurveTo(-BW * 1.6, -2 + Math.sin(t * 3) * 2, -BW * 1.3, 2); g.lineTo(BW * 1.3, 2); g.quadraticCurveTo(BW * 1.6, -2 + Math.sin(t * 3 + 1) * 2, BW * 0.9, bodyY - BH * 0.7); g.closePath(); g.fillStyle = '#D93A3A'; g.fill(); g.stroke(); }
    if (wear === 'wings') for (const sd of [-1, 1]) { g.save(); g.translate(sd * BW * 0.7, bodyY - BH * 0.4); g.rotate(sd * (0.25 + Math.sin(t * 5) * 0.12)); g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(sd * BW * 1.4, -BH * 1.4, sd * BW * 1.6, -BH * 0.2); g.quadraticCurveTo(sd * BW * 1.1, -BH * 0.1, sd * BW * 1.2, BH * 0.3); g.quadraticCurveTo(sd * BW * 0.6, BH * 0.2, 0, 0); g.fillStyle = '#fff'; g.fill(); g.stroke(); g.restore(); }
    if (wear === 'dino') { g.fillStyle = '#F2C14E'; for (let i = -2; i <= 2; i++) { const x = i * BW * 0.35, y = bodyY - BH * (1 - Math.abs(i) * 0.12); g.beginPath(); g.moveTo(x - 5, y + 3); g.lineTo(x, y - 9); g.lineTo(x + 5, y + 3); g.closePath(); g.fill(); g.stroke(); } }
  } else if (layer === 'front') {
    switch (wear) {
      case 'tshirt': fillBody('#FFD54A', -1.2); sleeves('#FFD54A'); break;
      case 'stripe': fillBody('#FFFFFF'); g.save(); bodyPath(g, s, G); g.clip(); g.fillStyle = '#3D5FB0'; for (let i = -3; i < 4; i++) g.fillRect(-BW * 1.6, bodyY + i * BH * 0.36, BW * 3.2, BH * 0.16); g.restore(); sleeves('#FFFFFF'); break;
      case 'hoodie': fillBody('#F59BB8'); sleeves('#F59BB8'); petRR(g, -BW * 0.45, bodyY + BH * 0.05, BW * 0.9, BH * 0.45, 4); g.fillStyle = '#E8829F'; g.fill(); g.stroke(); break;
      case 'raincoat': fillBody('#FFD23F'); sleeves('#FFD23F'); g.beginPath(); g.moveTo(0, bodyY - BH); g.lineTo(0, bodyY + BH); g.stroke(); for (const dy of [-0.4, 0, 0.4]) { g.beginPath(); g.arc(3, bodyY + dy * BH, 1.8, 0, Math.PI * 2); g.fillStyle = '#3D5FB0'; g.fill(); } break;
      case 'overall': fillBody('#FFFFFF', -1.2); g.save(); bodyPath(g, s, G); g.clip(); g.fillStyle = '#4A6FA5'; g.fillRect(-BW * 1.6, bodyY - BH * 0.05, BW * 3.2, BH * 2); petRR(g, -BW * 0.45, bodyY - BH * 0.55, BW * 0.9, BH * 0.6, 3); g.fill(); g.restore();
        g.strokeStyle = '#4A6FA5'; g.lineWidth = 3; for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(sd * BW * 0.4, bodyY - BH * 0.5); g.lineTo(sd * BW * 0.55, bodyY - BH * 1.1); g.stroke(); } g.fillStyle = '#FFD54A'; for (const sd of [-1, 1]) { g.beginPath(); g.arc(sd * BW * 0.38, bodyY - BH * 0.45, 1.8, 0, Math.PI * 2); g.fill(); } break;
      case 'jersey': fillBody('#D93A3A'); sleeves('#D93A3A'); g.fillStyle = '#fff'; g.font = `bold ${Math.round(BH * 0.9)}px Jua`; g.textAlign = 'center'; g.fillText('7', 0, bodyY + BH * 0.45); break;
      case 'sweater': fillBody('#5FA86B'); sleeves('#5FA86B'); g.save(); bodyPath(g, s, G); g.clip(); g.strokeStyle = '#4C8F58'; g.lineWidth = 2; for (const x of [-0.5, 0, 0.5]) { g.beginPath(); for (let y = -1; y <= 1; y += 0.25) g.lineTo(x * BW + (Math.round(y * 4) % 2 ? 2.5 : -2.5), bodyY + y * BH); g.stroke(); } g.restore(); break;
      case 'puffer': fillBody('#9CCBEA'); g.save(); bodyPath(g, s, G); g.clip(); g.strokeStyle = '#7FB0D4'; g.lineWidth = 1.6; for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(-BW * 1.5, bodyY + i * BH * 0.38); g.lineTo(BW * 1.5, bodyY + i * BH * 0.38); g.stroke(); } g.restore(); sleeves('#9CCBEA'); break;
      case 'santasuit': fillBody('#D93A3A'); sleeves('#D93A3A'); g.save(); bodyPath(g, s, G); g.clip(); g.fillStyle = '#fff'; g.fillRect(-2.5, bodyY - BH * 1.2, 5, BH * 2.4); g.fillStyle = '#26232A'; g.fillRect(-BW * 1.6, bodyY + BH * 0.25, BW * 3.2, BH * 0.2); g.restore(); g.fillStyle = '#FFD54A'; petRR(g, -4, bodyY + BH * 0.22, 8, BH * 0.26, 2); g.fill(); g.stroke(); break;
      case 'suit': fillBody('#26232A'); sleeves('#26232A'); g.beginPath(); g.moveTo(-BW * 0.35, bodyY - BH); g.lineTo(0, bodyY + BH * 0.2); g.lineTo(BW * 0.35, bodyY - BH); g.closePath(); g.fillStyle = '#fff'; g.fill(); g.fillStyle = '#E8402F'; for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(0, bodyY - BH * 0.55); g.lineTo(sd * 5, bodyY - BH * 0.7); g.lineTo(sd * 5, bodyY - BH * 0.4); g.closePath(); g.fill(); } break;
      case 'dino': fillBody('#6CBF5A'); g.save(); bodyPath(g, s, G); g.clip(); g.fillStyle = '#B9E3A0'; g.beginPath(); g.ellipse(0, bodyY + BH * 0.35, BW * 0.55, BH * 0.85, 0, 0, Math.PI * 2); g.fill(); g.restore(); sleeves('#6CBF5A'); break;
      case 'cape': g.fillStyle = '#FFD54A'; g.beginPath(); g.arc(0, bodyY - BH * 0.75, 3, 0, Math.PI * 2); g.fill(); g.stroke(); break;
      case 'wings': break;
    }
    if (!['cape', 'wings'].includes(wear)) outline();
  } else if (layer === 'neck') {
    if (wear === 'hoodie') { hood('#F59BB8'); g.strokeStyle = '#fff'; g.lineWidth = 1.5; for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(sd * 4, HY + HR * 0.95); g.lineTo(sd * 5, HY + HR * 1.35); g.stroke(); } }
    if (wear === 'raincoat') hood('#FFD23F');
    if (wear === 'dino') hood('#6CBF5A');
    if (wear === 'puffer') { g.beginPath(); g.ellipse(0, HY + HR * 0.92, W * 0.75, HR * 0.22, 0, 0, Math.PI * 2); g.fillStyle = '#9CCBEA'; g.fill(); g.stroke(); }
    if (wear === 'santasuit') { g.beginPath(); g.ellipse(0, HY + HR * 0.95, W * 0.7, HR * 0.18, 0, 0, Math.PI * 2); g.fillStyle = '#fff'; g.fill(); g.stroke(); }
    if (wear === 'cape') { g.beginPath(); g.ellipse(0, HY + HR * 0.95, W * 0.6, HR * 0.15, 0, 0, Math.PI * 2); g.fillStyle = '#D93A3A'; g.fill(); g.stroke(); }
    if (wear === 'wings') { g.beginPath(); g.ellipse(0, HY + HR * 0.95, W * 0.55, HR * 0.13, 0, 0, Math.PI * 2); g.fillStyle = '#FFE58A'; g.fill(); g.stroke(); }
  }
  g.restore();
}
