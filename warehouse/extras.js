// 도둑냥 광장 추가 기능: 오락실(점프 미니게임 + 오늘의 점프왕) / 크리스마스 트리(다 같이 장식 달기)
// app.js의 plazaHooks(광장 그리기), frameHooks(매 프레임), extraHandlers(실시간 메시지)에 끼어듦
// 기록·장식은 Supabase 표(game_scores, tree_ornaments)에 저장. 표가 아직 없으면 이 브라우저에만 저장됨
(() => {
  // ---------- 공용 ----------
  const cfg = window.DODUK || {};
  const film = location.search.includes('film');
  const db = !film && cfg.supabaseUrl && cfg.supabaseKey && window.supabase
    ? window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey, { auth: { persistSession: false, autoRefreshToken: false } })
    : null;
  const kstDate = () => new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10);
  const still = () => Math.hypot(me.tx - me.x, me.ty - me.y) < 2;
  const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
  const R = (g, x, y, w, h, r) => { g.beginPath(); g.roundRect(x, y, w, h, r); };

  // =====================================================================
  // 오락실: 점프 미니게임
  // =====================================================================
  const ARCADE = { x: 250, y: 1190 };
  const nearArcade = () => isPlaza() && Math.abs(me.x - ARCADE.x) < 100 && me.y > ARCADE.y - 10 && me.y < ARCADE.y + 110;
  let board = [];   // [{breed, score}] 오늘 상위
  async function loadBoard() {
    if (db) {
      const { data, error } = await db.from('game_scores').select('breed,score').eq('day', kstDate()).order('score', { ascending: false }).limit(10);
      if (!error && data) { board = data; return; }
    }
    board = lsGet(`doduk-jump-${kstDate()}`, []).slice(0, 10);
  }
  async function submitScore(score) {
    const local = lsGet(`doduk-jump-${kstDate()}`, []);
    local.push({ breed: me.breed, score }); local.sort((a, b) => b.score - a.score);
    lsSet(`doduk-jump-${kstDate()}`, local.slice(0, 20));
    let rank = null;
    if (db) {
      const ins = await db.from('game_scores').insert({ breed: me.breed, score });
      if (!ins.error) {
        const { count } = await db.from('game_scores').select('id', { count: 'exact', head: true }).eq('day', kstDate()).gt('score', score);
        if (Number.isFinite(count)) rank = count + 1;
      }
    }
    if (rank === null) rank = local.findIndex((r) => r.score === score) + 1;
    await loadBoard();
    return rank;
  }
  loadBoard(); setInterval(loadBoard, 60000);

  function drawArcade(t) {
    const { x, y } = ARCADE;
    ctx.fillStyle = 'rgba(0,0,0,.15)'; ctx.beginPath(); ctx.ellipse(x, y + 4, 70, 14, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#2a2420'; ctx.lineWidth = 3;
    R(ctx, x - 50, y - 150, 100, 150, 12); ctx.fillStyle = '#E8402F'; ctx.fill(); ctx.stroke();
    R(ctx, x - 38, y - 136, 76, 58, 6); ctx.fillStyle = '#1E2233'; ctx.fill(); ctx.stroke();
    // 화면 속 작은 점프 그림
    const jy = Math.abs(Math.sin(t * 3)) * 16;
    ctx.fillStyle = '#FFD54A'; ctx.fillRect(x - 24, y - 92 - jy, 12, 10);
    ctx.fillStyle = '#7B9E6B'; ctx.fillRect(x + 6 - ((t * 30) % 40), y - 90, 10, 8);
    ctx.fillStyle = '#2B2622'; R(ctx, x - 40, y - 66, 80, 22, 6); ctx.fill();
    ctx.fillStyle = '#FFD54A'; ctx.beginPath(); ctx.arc(x - 18, y - 55, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#8FC9E8'; ctx.beginPath(); ctx.arc(x + 16, y - 55, 6, 0, Math.PI * 2); ctx.fill();
    // 위 간판 + 오늘의 점프왕
    R(ctx, x - 95, y - 330, 190, 168, 12); ctx.fillStyle = '#2B2622'; ctx.fill(); ctx.stroke();
    ctx.textAlign = 'center'; ctx.fillStyle = '#FFD54A'; ctx.font = '22px Jua'; ctx.fillText('오늘의 점프왕', x, y - 300);
    ctx.font = '17px Jua';
    const top = board.slice(0, 5);
    if (!top.length) { ctx.fillStyle = '#ccc'; ctx.fillText('아직 기록 없음', x, y - 250); ctx.fillText('1등 해 봐', x, y - 226); }
    top.forEach((r, i) => {
      ctx.textAlign = 'left'; ctx.fillStyle = i === 0 ? '#FFD54A' : '#fff';
      ctx.fillText(`${i + 1}. ${(BREEDS[r.breed]?.name ?? '?').slice(0, 7)}`, x - 82, y - 270 + i * 23);
      ctx.textAlign = 'right'; ctx.fillText(String(r.score), x + 82, y - 270 + i * 23);
    });
    ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.font = '18px Jua';
    R(ctx, x - 52, y + 10, 104, 28, 8); ctx.fillStyle = '#2B2622'; ctx.fill();
    ctx.fillStyle = '#FFD54A'; ctx.fillText('도둑냥 오락실', x, y + 30);
  }

  // 게임 화면
  const gameEl = document.getElementById('jumpGame');
  const gcv = document.getElementById('jumpCv');
  const g = gcv.getContext('2d');
  const GW = 720, GH = 480, GROUND = 400, PX = 150;
  let run = null;   // 진행 중 게임 상태
  function jumpPower(b) { return 860 + Math.max(-140, Math.min(180, ((b.legH ?? 10) - 10) * 20)); }
  function newRun() {
    const b = BREEDS[me.breed];
    return { b, y: 0, vy: 0, score: 0, speed: 330, obs: [], treats: [], next: 1.2, nextTreat: 3, over: false, t: 0, last: performance.now(), raf: 0 };
  }
  const OBS = [
    { w: 58, h: 48, draw: (x, y) => { g.fillStyle = '#C9965F'; R(g, x, y, 58, 48, 4); g.fill(); g.stroke(); g.fillStyle = '#E3C48F'; g.fillRect(x + 23, y + 1, 12, 46); } },   // 택배 상자
    { w: 40, h: 62, draw: (x, y) => { g.fillStyle = '#F28C28'; g.beginPath(); g.moveTo(x + 20, y); g.lineTo(x + 40, y + 62); g.lineTo(x, y + 62); g.closePath(); g.fill(); g.stroke(); g.fillStyle = '#fff'; g.fillRect(x + 11, y + 30, 18, 7); } },   // 고깔
    { w: 86, h: 54, draw: (x, y) => {   // 청소기
      g.fillStyle = '#8FC9E8'; R(g, x + 30, y + 14, 56, 40, 12); g.fill(); g.stroke();
      g.fillStyle = '#2a2420'; g.beginPath(); g.arc(x + 44, y + 54, 7, 0, Math.PI * 2); g.arc(x + 74, y + 54, 7, 0, Math.PI * 2); g.fill();
      g.lineWidth = 6; g.strokeStyle = '#555'; g.beginPath(); g.moveTo(x + 32, y + 24); g.quadraticCurveTo(x + 6, y + 10, x + 4, y + 50); g.stroke(); g.lineWidth = 3; g.strokeStyle = '#2a2420';
    } },
    { w: 70, h: 30, draw: (x, y) => { g.fillStyle = '#F0E6D8'; R(g, x, y, 70, 30, 6); g.fill(); g.stroke(); g.fillStyle = '#E8402F'; g.fillRect(x + 4, y + 10, 62, 6); } },   // 목욕 수건
  ];
  function drawGame(r) {
    const t = r.t;
    g.setTransform(1, 0, 0, 1, 0, 0);
    const sky = g.createLinearGradient(0, 0, 0, GH); sky.addColorStop(0, '#CDE8FB'); sky.addColorStop(1, '#F7F1E6');
    g.fillStyle = sky; g.fillRect(0, 0, GW, GH);
    // 구름·뒷배경 (천천히 흐름)
    g.fillStyle = 'rgba(255,255,255,.9)';
    for (let i = 0; i < 4; i++) { const cx = ((i * 240 - t * 30) % (GW + 200) + GW + 200) % (GW + 200) - 100; g.beginPath(); g.ellipse(cx, 70 + (i % 2) * 40, 50, 18, 0, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = '#B9D99A'; g.fillRect(0, GROUND, GW, GH - GROUND);
    g.fillStyle = '#94BE73'; for (let x = -((t * r.speed) % 60); x < GW; x += 60) g.fillRect(x, GROUND + 18, 30, 6);
    g.strokeStyle = '#2a2420'; g.lineWidth = 3;
    for (const o of r.obs) OBS[o.k].draw(o.x, GROUND - OBS[o.k].h);
    for (const tr of r.treats) { if (tr.got) continue; g.save(); g.translate(tr.x, tr.y); g.rotate(Math.sin(t * 4 + tr.x) * 0.2); g.fillStyle = '#F2D9A6'; R(g, -14, -5, 28, 10, 4); g.fill(); g.stroke(); for (const [bx, by] of [[-15, -5], [-15, 5], [15, -5], [15, 5]]) { g.beginPath(); g.arc(bx, by, 6, 0, Math.PI * 2); g.fill(); g.stroke(); } g.fillRect(-12, -4, 24, 8); g.restore(); }
    // 내 캐릭터 (오른쪽 보고 달림)
    g.save(); g.translate(PX, GROUND - r.y); g.scale(1.25, 1.25);
    drawPet(g, { breed: me.breed, acc: me.acc, x: 0, y: 0, tx: r.over ? 0 : 5, ty: 0, face: 1, noTag: true }, r.over ? 0 : t * 1.4, false);
    g.restore();
    g.textAlign = 'right'; g.fillStyle = '#2a2420'; g.font = '34px Jua'; g.fillText(String(Math.floor(r.score)), GW - 24, 50);
    if (r.over) {
      g.fillStyle = 'rgba(20,18,16,.55)'; g.fillRect(0, 0, GW, GH);
      g.textAlign = 'center'; g.fillStyle = '#FFD54A'; g.font = '64px Jua'; g.fillText('꽈당', GW / 2, 200);
      g.fillStyle = '#fff'; g.font = '36px Jua'; g.fillText(`${Math.floor(r.score)}점`, GW / 2, 255);
      if (r.rank) { g.font = '26px Jua'; g.fillText(`오늘 ${r.rank}등`, GW / 2, 300); }
    } else if (r.t < 1.2) {
      g.textAlign = 'center'; g.fillStyle = '#2a2420'; g.font = '30px Jua'; g.fillText('화면을 누르면 점프', GW / 2, 160);
    }
  }
  function hit(r, o) {
    const ob = OBS[o.k], s = 1.25 * (r.b.size ?? 1);
    const pw = 24 * s, ph = 40 * s;
    const px1 = PX - pw, px2 = PX + pw, py1 = GROUND - r.y - ph, py2 = GROUND - r.y;
    return px2 - 8 > o.x + 6 && px1 + 8 < o.x + ob.w - 6 && py2 - 4 > GROUND - ob.h + 4 && py1 < GROUND;
  }
  function tick(now) {
    const r = run; if (!r || r.over) return;
    const dt = Math.min(0.033, (now - r.last) / 1000); r.last = now; r.t += dt;
    r.speed = Math.min(900, 330 + r.t * 14);
    r.score += dt * r.speed / 30;
    // 점프 물리
    if (r.y > 0 || r.vy > 0) { r.vy -= 2500 * dt; r.y = Math.max(0, r.y + r.vy * dt); if (r.y === 0) r.vy = 0; }
    // 장애물·간식
    r.next -= dt; r.nextTreat -= dt;
    if (r.next <= 0) { r.obs.push({ k: Math.floor(Math.random() * OBS.length), x: GW + 20 }); r.next = (0.9 + Math.random() * 1.0) * (520 / r.speed) * 1.6; }
    if (r.nextTreat <= 0) { r.treats.push({ x: GW + 20, y: GROUND - 120 - Math.random() * 110, got: false }); r.nextTreat = 2 + Math.random() * 3; }
    for (const o of r.obs) o.x -= r.speed * dt;
    for (const tr of r.treats) tr.x -= r.speed * dt;
    r.obs = r.obs.filter((o) => o.x > -120); r.treats = r.treats.filter((tr) => tr.x > -40);
    for (const tr of r.treats) if (!tr.got && Math.abs(tr.x - PX) < 34 && Math.abs(tr.y - (GROUND - r.y - 30)) < 46) { tr.got = true; r.score += 25; }
    if (r.obs.some((o) => hit(r, o))) { endRun(r); return drawGame(r); }
    drawGame(r);
    r.raf = requestAnimationFrame(tick);
  }
  async function endRun(r) {
    r.over = true;
    const score = Math.floor(r.score);
    document.getElementById('jumpAgain').style.display = '';
    document.getElementById('jumpSave').style.display = '';
    r.rank = await submitScore(score).catch(() => null);
    drawGame(r);
  }
  function jump() {
    if (!run) return;
    if (run.over) return;
    if (run.y === 0) run.vy = jumpPower(run.b);
  }
  function startRun() {
    if (run) cancelAnimationFrame(run.raf);
    run = newRun();
    document.getElementById('jumpAgain').style.display = 'none';
    document.getElementById('jumpSave').style.display = 'none';
    run.last = performance.now();
    run.raf = requestAnimationFrame(tick);
  }
  gcv.addEventListener('pointerdown', (e) => { e.preventDefault(); jump(); });
  addEventListener('keydown', (e) => { if (gameEl.classList.contains('open') && (e.code === 'Space' || e.code === 'ArrowUp')) { e.preventDefault(); jump(); } });
  document.getElementById('jumpAgain').onclick = startRun;
  document.getElementById('jumpClose').onclick = () => { if (run) cancelAnimationFrame(run.raf); run = null; gameEl.classList.remove('open'); };
  document.getElementById('jumpSave').onclick = () => {
    if (!run) return;
    const score = Math.floor(run.score), rank = run.rank;
    gameEl.classList.remove('open');
    showPhoto(makeJumpCard(score, rank));
  };
  function makeJumpCard(score, rank) {
    const CW = 1080, CH = 1350, c = document.createElement('canvas'); c.width = CW; c.height = CH;
    const q = c.getContext('2d');
    const sky = q.createLinearGradient(0, 0, 0, CH); sky.addColorStop(0, '#CDE8FB'); sky.addColorStop(1, '#F7F1E6');
    q.fillStyle = sky; q.fillRect(0, 0, CW, CH);
    q.fillStyle = '#B9D99A'; q.fillRect(0, 900, CW, 450);
    q.fillStyle = '#2B2622'; q.fillRect(0, 0, CW, 130);
    q.textAlign = 'center'; q.fillStyle = '#FFD54A'; q.font = '60px Jua'; q.fillText('도둑냥 오락실 점프왕', CW / 2, 88);
    q.save(); q.translate(CW / 2, 860); q.scale(4, 4);
    drawPet(q, { breed: me.breed, acc: me.acc, x: 0, y: 0, tx: 0, ty: 0, face: 1, noTag: true }, 0.5, false);
    q.restore();
    q.fillStyle = '#2a2420'; q.font = '120px Jua'; q.fillText(`${score}점`, CW / 2, 1060);
    q.font = '48px Jua'; q.fillText(`${BREEDS[me.breed].name}${rank ? ` · 오늘 ${rank}등` : ''}`, CW / 2, 1130);
    q.fillStyle = '#2B2622'; q.fillRect(0, CH - 130, CW, 130);
    q.fillStyle = '#FFD54A'; q.font = '50px Jua'; q.fillText('@doduk_nyang', CW / 2, CH - 70);
    q.fillStyle = '#fff'; q.font = '26px "Noto Sans KR"'; q.fillText('이 점수 넘겨 봐', CW / 2, CH - 30);
    return c;
  }
  const arcadeBtn = document.getElementById('arcadeBtn');
  arcadeBtn.onclick = () => { gameEl.classList.add('open'); startRun(); };

  // =====================================================================
  // 크리스마스 트리: 들어온 사람마다 장식 하나씩 (하루 3개까지)
  // =====================================================================
  const TREE = { x: 1150, y: 700, w: 260, h: 330 };   // y는 트리 밑동
  const kstNow = () => new Date(Date.now() + 9 * 3600000);
  const treeOn = () => { const d = kstNow(); return d.getUTCFullYear() === 2026 && (d.getUTCMonth() === 10 || d.getUTCMonth() === 11); };   // 11~12월
  const nearTree = () => isPlaza() && treeOn() && Math.abs(me.x - TREE.x) < 150 && me.y > TREE.y - 20 && me.y < TREE.y + 110;
  let orns = [];
  async function loadOrns() {
    if (db) {
      const { data, error } = await db.from('tree_ornaments').select('kind,x,y,breed').order('id', { ascending: false }).limit(400);
      if (!error && data) { orns = data; return; }
    }
    orns = lsGet('doduk-orns', []);
  }
  if (treeOn()) { loadOrns(); setInterval(loadOrns, 120000); }
  extraHandlers.orn = (m) => { if (Number.isFinite(m.x) && Number.isFinite(m.y)) orns.unshift({ kind: m.kind | 0, x: m.x, y: m.y, breed: m.breed | 0 }); };
  const ORN_NAMES = ['빨간 공', '금색 공', '파란 공', '별', '지팡이 사탕', '리본', '방울', '하트'];
  function drawOrn(q, kind, x, y, r) {
    q.save(); q.lineWidth = Math.max(1.5, r * 0.18); q.strokeStyle = '#2a2420';
    const ball = (col) => { q.beginPath(); q.arc(x, y, r, 0, Math.PI * 2); q.fillStyle = col; q.fill(); q.stroke(); q.fillStyle = 'rgba(255,255,255,.6)'; q.beginPath(); q.arc(x - r * 0.35, y - r * 0.35, r * 0.28, 0, Math.PI * 2); q.fill(); };
    if (kind === 0) ball('#E8402F'); else if (kind === 1) ball('#FFD54A'); else if (kind === 2) ball('#5B9BE0');
    else if (kind === 3) { q.fillStyle = '#FFD54A'; q.beginPath(); for (let i = 0; i < 10; i++) { const rr2 = i % 2 ? r * 0.5 : r * 1.2, a = (i / 10) * Math.PI * 2 - Math.PI / 2; q.lineTo(x + Math.cos(a) * rr2, y + Math.sin(a) * rr2); } q.closePath(); q.fill(); q.stroke(); }
    else if (kind === 4) { q.lineWidth = r * 0.55; q.strokeStyle = '#fff'; q.beginPath(); q.moveTo(x, y + r * 1.2); q.lineTo(x, y - r * 0.4); q.arc(x - r * 0.5, y - r * 0.4, r * 0.5, 0, Math.PI, true); q.stroke(); q.lineWidth = r * 0.25; q.strokeStyle = '#E8402F'; q.setLineDash([r * 0.4, r * 0.4]); q.stroke(); q.setLineDash([]); }
    else if (kind === 5) { q.fillStyle = '#E8402F'; for (const s of [-1, 1]) { q.beginPath(); q.moveTo(x, y); q.lineTo(x + s * r * 1.1, y - r * 0.6); q.lineTo(x + s * r * 1.1, y + r * 0.6); q.closePath(); q.fill(); q.stroke(); } q.beginPath(); q.arc(x, y, r * 0.35, 0, Math.PI * 2); q.fill(); q.stroke(); }
    else if (kind === 6) { q.fillStyle = '#FFD54A'; q.beginPath(); q.moveTo(x - r, y + r * 0.6); q.quadraticCurveTo(x - r * 0.9, y - r, x, y - r); q.quadraticCurveTo(x + r * 0.9, y - r, x + r, y + r * 0.6); q.closePath(); q.fill(); q.stroke(); q.fillStyle = '#2a2420'; q.beginPath(); q.arc(x, y + r * 0.75, r * 0.25, 0, Math.PI * 2); q.fill(); }
    else { q.fillStyle = '#F06A86'; q.beginPath(); q.moveTo(x, y + r); q.bezierCurveTo(x - r * 1.8, y - r * 0.2, x - r * 0.8, y - r * 1.5, x, y - r * 0.5); q.bezierCurveTo(x + r * 0.8, y - r * 1.5, x + r * 1.8, y - r * 0.2, x, y + r); q.fill(); q.stroke(); }
    q.restore();
  }
  // 트리 그리기: (cx, 밑동 y), 폭 w, 높이 h. 장식 좌표 u(-1~1 가로), v(0 꼭대기~1 밑동)
  function drawTree(q, cx, by, w, h, t, list, ornR) {
    const top = by - h;
    q.lineWidth = 3; q.strokeStyle = '#2a2420';
    q.fillStyle = '#8A5C37'; q.fillRect(cx - w * 0.07, by - 6, w * 0.14, h * 0.12); q.strokeRect(cx - w * 0.07, by - 6, w * 0.14, h * 0.12);
    const layers = [[0, 0.42, 0.5], [0.22, 0.7, 0.75], [0.48, 1, 1]];   // 위에서부터 [시작 v, 끝 v, 폭 비율]
    for (const [v0, v1, k] of layers) {
      q.beginPath(); q.moveTo(cx, top + h * v0); q.lineTo(cx + (w / 2) * k, top + h * v1); q.lineTo(cx - (w / 2) * k, top + h * v1); q.closePath();
      q.fillStyle = '#3E8E4E'; q.fill(); q.stroke();
    }
    // 반짝이 전구
    for (let i = 0; i < 24; i++) {
      const v = 0.12 + ((i * 37) % 85) / 100, u = (((i * 53) % 100) / 100 * 2 - 1) * v * 0.85;
      const on = Math.sin(t * 3 + i * 1.7) > 0;
      q.fillStyle = on ? ['#FFF3A0', '#FFB3C1', '#B3E1FF'][i % 3] : 'rgba(255,255,255,.25)';
      q.beginPath(); q.arc(cx + u * w / 2, top + v * h, 3.5, 0, Math.PI * 2); q.fill();
    }
    for (let i = list.length - 1; i >= 0; i--) { const o = list[i]; drawOrn(q, o.kind, cx + o.x * w / 2, top + o.y * h, ornR); }
    drawOrn(q, 3, cx, top - 6, ornR * 1.9);
  }
  function drawPlazaTree(t) {
    ctx.fillStyle = 'rgba(0,0,0,.15)'; ctx.beginPath(); ctx.ellipse(TREE.x, TREE.y + 30, 150, 22, 0, 0, Math.PI * 2); ctx.fill();
    drawTree(ctx, TREE.x, TREE.y, TREE.w, TREE.h, t, orns.slice(0, 300), 8);
    R(ctx, TREE.x - 80, TREE.y + 44, 160, 30, 8); ctx.fillStyle = '#2B2622'; ctx.fill();
    ctx.fillStyle = '#FFD54A'; ctx.font = '17px Jua'; ctx.textAlign = 'center'; ctx.fillText(`장식 ${orns.length}개 달림`, TREE.x, TREE.y + 65);
  }
  // 장식 다는 화면
  const treeEl = document.getElementById('treeBox');
  const tcv = document.getElementById('treeCv'), tg = tcv.getContext('2d');
  const TW = 600, TH = 640, TCX = 300, TBY = 560, TWD = 460, THT = 470;
  let pick = 0, pending = null;
  const todayKey = () => `doduk-orn-${kstDate()}`;
  const leftToday = () => 3 - lsGet(todayKey(), 0);
  function renderTreeBox() {
    tg.setTransform(1, 0, 0, 1, 0, 0);
    tg.fillStyle = '#1E2233'; tg.fillRect(0, 0, TW, TH);
    tg.fillStyle = 'rgba(255,255,255,.5)'; for (let i = 0; i < 40; i++) { tg.beginPath(); tg.arc((i * 137) % TW, (i * 59) % 300, 1.5, 0, Math.PI * 2); tg.fill(); }
    tg.fillStyle = '#E8EEF5'; tg.fillRect(0, TBY + 20, TW, TH);
    drawTree(tg, TCX, TBY, TWD, THT, performance.now() / 1000, orns.slice(0, 300), 13);
    if (pending) { drawOrn(tg, pending.kind, TCX + pending.x * TWD / 2, TBY - THT + pending.y * THT, 15); tg.strokeStyle = '#fff'; tg.setLineDash([5, 5]); tg.beginPath(); tg.arc(TCX + pending.x * TWD / 2, TBY - THT + pending.y * THT, 24, 0, Math.PI * 2); tg.stroke(); tg.setLineDash([]); }
    document.getElementById('treeLeft').textContent = leftToday() > 0 ? `오늘 ${leftToday()}개 더 달 수 있어. 장식을 고르고 트리를 눌러 줘` : '오늘은 다 달았어. 내일 또 달아 줘';
    document.getElementById('treeHang').disabled = !pending || leftToday() <= 0;
  }
  const kinds = document.getElementById('treeKinds');
  ORN_NAMES.forEach((n, i) => {
    const b = document.createElement('button'); b.textContent = n; b.dataset.k = i;
    b.onclick = () => { pick = i; if (pending) pending.kind = i; kinds.querySelectorAll('button').forEach((x) => x.classList.toggle('on', +x.dataset.k === i)); renderTreeBox(); };
    kinds.appendChild(b);
  });
  kinds.firstChild.classList.add('on');
  tcv.addEventListener('pointerdown', (e) => {
    const rect = tcv.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * TW, py = ((e.clientY - rect.top) / rect.height) * TH;
    const u = (px - TCX) / (TWD / 2), v = (py - (TBY - THT)) / THT;
    if (v < 0.1 || v > 0.98 || Math.abs(u) > v * 0.92) return;   // 트리 밖
    pending = { kind: pick, x: +u.toFixed(3), y: +v.toFixed(3) };
    renderTreeBox();
  });
  document.getElementById('treeHang').onclick = async () => {
    if (!pending || leftToday() <= 0) return;
    const o = { ...pending, breed: me.breed };
    pending = null;
    lsSet(todayKey(), lsGet(todayKey(), 0) + 1);
    orns.unshift(o);
    if (db) { const { error } = await db.from('tree_ornaments').insert(o); if (error) lsSet('doduk-orns', [o, ...lsGet('doduk-orns', [])].slice(0, 300)); }
    else lsSet('doduk-orns', [o, ...lsGet('doduk-orns', [])].slice(0, 300));
    net.ext('orn', o);
    speech.set(myId, { text: '달았다', until: Date.now() + 1500 });
    renderTreeBox();
  };
  document.getElementById('treeClose').onclick = () => { treeEl.classList.remove('open'); pending = null; };
  const treeBtn = document.getElementById('treeBtn');
  treeBtn.onclick = () => { renderTreeBox(); treeEl.classList.add('open'); };
  setInterval(() => { if (treeEl.classList.contains('open')) renderTreeBox(); }, 500);   // 전구 반짝임

  // ---------- 광장에 그리기 + 버튼 표시 ----------
  plazaHooks.push((items, t) => {
    items.push({ y: ARCADE.y, draw: () => drawArcade(t) });
    if (treeOn()) items.push({ y: TREE.y + 20, draw: () => drawPlazaTree(t) });
  });
  frameHooks.push(() => {
    const a = nearArcade() && still() && !gameEl.classList.contains('open');
    if (a !== arcadeBtn.classList.contains('show')) arcadeBtn.classList.toggle('show', a);
    const tr = nearTree() && still() && !treeEl.classList.contains('open');
    if (tr !== treeBtn.classList.contains('show')) treeBtn.classList.toggle('show', tr);
    if (!isPlaza()) { if (gameEl.classList.contains('open')) document.getElementById('jumpClose').click(); treeEl.classList.remove('open'); }
  });
})();
