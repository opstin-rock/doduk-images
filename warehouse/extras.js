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
  // 오락실: 광장 왼쪽에 게임기 2대 + 위에 "모두의 점수" 전광판
  // 게임기 앞에 서면 버튼이 뜨고, 누르면 게임(lab/*.html)을 광장 위에 화면 전체로 띄움 (iframe)
  // 게임에서 점수를 보내면 postMessage로 알려 줘서 전광판 숫자를 바로 올림
  // =====================================================================
  const GAMES = [
    // 광장 전체가 오락실 (2026-11-09). 앞줄: 지금 할 수 있는 게임, 뒷줄: 만드는 중 (불 꺼진 게임기)
    { id: 'sacheon', name: '사천성', x: 560, y: 900, url: 'lab/link.html?embed=1&v=16', body: '#E8402F', screen: 'sacheon' },
    { id: 'peaks', name: '트라이피크', x: 720, y: 900, url: 'lab/peaks.html?embed=1&v=11', body: '#3D7BD9', screen: 'peaks' },
    // 아직 안 연 게임은 이름을 숨김 (대표님 11.10: "???"로)
    { id: 'soon1', name: '???', x: 880, y: 900, soon: true, body: '#8C7FA8' },
    { id: 'soon2', name: '???', x: 400, y: 1230, soon: true, body: '#8C7FA8' },
    { id: 'soon3', name: '???', x: 1040, y: 1230, soon: true, body: '#8C7FA8' },
  ];
  const BOARD = { x: 646, y: 640, w: 560 };   // 사료 보내기 전광판 + 오른쪽 인증 사진 액자, 둘을 합쳐 가운데(720)에 오도록
  const nearGame = () => {
    if (!isPlaza()) return null;
    let best = null, bd = 62;
    for (const gm of GAMES) { const d = Math.abs(me.x - gm.x); if (d < bd && me.y > gm.y - 10 && me.y < gm.y + 110) { bd = d; best = gm; } }
    return best;
  };
  let everyone = null, given = 0;   // 모두의 점수 합계, 이번 방문에 내가 보탠 점수
  let prog = null, ships = [], myKibbles = 0, proofImg = null;   // 사료알 진행, 발송 기록, 이번 방문에 내가 모은 알, 인증 사진
  async function loadTotal() {
    if (!window.Score) return;
    const [t, p, s] = await Promise.all([Score.total(), Score.progress(), Score.shipments()]);
    if (t) everyone = t;
    if (p) prog = p;
    if (s) {
      ships = s;
      const photo = (s.find((x) => x.photo_url) || {}).photo_url;
      if (photo && (!proofImg || proofImg.src !== photo)) { proofImg = new Image(); proofImg.src = photo; }
    }
  }
  if (!film) { loadTotal(); setInterval(loadTotal, 20000); }

  function drawCabinet(gm, t) {
    const { x, y } = gm;
    ctx.fillStyle = 'rgba(0,0,0,.15)'; ctx.beginPath(); ctx.ellipse(x, y + 4, 52, 12, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#2a2420'; ctx.lineWidth = 3;
    R(ctx, x - 44, y - 140, 88, 140, 12); ctx.fillStyle = gm.body; ctx.fill(); ctx.stroke();
    R(ctx, x - 34, y - 128, 68, 54, 6); ctx.fillStyle = '#1E2233'; ctx.fill(); ctx.stroke();
    // 화면 속 작은 그림 (만드는 중이면 꺼진 화면 + 테이프)
    if (gm.soon) {
      ctx.fillStyle = Math.sin(t * 3 + x) > 0 ? '#FFD54A' : '#B79CED'; ctx.font = '26px Jua'; ctx.textAlign = 'center'; ctx.fillText('???', x, y - 88);
      ctx.save(); ctx.translate(x, y - 116); ctx.rotate(-0.2); ctx.fillStyle = 'rgba(255,213,74,.85)'; ctx.fillRect(-46, -7, 92, 14);
      ctx.fillStyle = '#2a2420'; ctx.font = '10px Jua'; ctx.fillText('곧 열려', 0, 4); ctx.restore();
    } else if (gm.screen === 'sacheon') {
      const cols = ['#FFE3C2', '#E6F4FF', '#FDE4EC', '#DDF2E3'];
      for (let i = 0; i < 6; i++) { const cx = x - 27 + (i % 3) * 19, cy = y - 121 + Math.floor(i / 3) * 22; ctx.fillStyle = cols[(i + Math.floor(t * 2)) % 4]; ctx.fillRect(cx, cy, 15, 18); }
      ctx.strokeStyle = '#E8402F'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 20, y - 103); ctx.lineTo(x - 20, y - 78); ctx.lineTo(x + 18, y - 78); ctx.lineTo(x + 18, y - 81); ctx.stroke();
    } else {
      ctx.fillStyle = '#5E9E6E'; ctx.fillRect(x - 33, y - 127, 66, 52);
      for (const [dx, dy, back] of [[-18, -118, 1], [0, -118, 1], [18, -118, 1], [-9, -104, 0], [9, -104, 0]]) { ctx.fillStyle = back ? '#C9965F' : '#FFFDF8'; ctx.fillRect(x + dx - 6, y + dy, 12, 16); }
      const jy = Math.abs(Math.sin(t * 3)) * 4; ctx.fillStyle = '#FFFDF8'; ctx.fillRect(x - 6, y - 88 - jy, 12, 12);
    }
    ctx.strokeStyle = '#2a2420'; ctx.lineWidth = 3;
    ctx.fillStyle = '#2B2622'; R(ctx, x - 36, y - 62, 72, 20, 6); ctx.fill();
    ctx.fillStyle = '#FFD54A'; ctx.beginPath(); ctx.arc(x - 16, y - 52, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#8FC9E8'; ctx.beginPath(); ctx.arc(x + 14, y - 52, 5, 0, Math.PI * 2); ctx.fill();
    // 이름표
    ctx.textAlign = 'center'; ctx.font = '17px Jua';
    const w = ctx.measureText(gm.name).width + 18;
    R(ctx, x - w / 2, y + 10, w, 26, 8); ctx.fillStyle = '#2B2622'; ctx.fill();
    ctx.fillStyle = '#FFD54A'; ctx.fillText(gm.name, x, y + 28);
  }
  // 전광판: 다리 달린 큰 화면. y는 다리 밑동, 화면은 그 위
  //   보호소에 간식 보내기: 한 판 = 사료 한 알, 300알마다 사료나 간식 1개 (보낼 곳은 정하는 중)
  //   왼쪽 액자: 최근 인증 사진 (shipments.photo_url)
  const kib = (n) => Number(n || 0).toLocaleString('ko-KR');
  // 막대 속 작은 간식 (뼈다귀 모양)
  function drawKibble(cx, cy, r, col) {
    ctx.fillStyle = col; ctx.fillRect(cx - r, cy - r * 0.3, r * 2, r * 0.6);
    for (const [dx, dy] of [[-1, -0.35], [-1, 0.35], [1, -0.35], [1, 0.35]]) { ctx.beginPath(); ctx.arc(cx + dx * r, cy + dy * r, r * 0.42, 0, Math.PI * 2); ctx.fill(); }
  }
  function drawBoard(t) {
    const { x, y, w } = BOARD, top = y - 330, hgt = 236;
    ctx.strokeStyle = '#2a2420'; ctx.lineWidth = 3;
    ctx.fillStyle = '#3A3550'; ctx.fillRect(x - w / 2 + 30, top + hgt - 4, 12, y - top - hgt + 4); ctx.fillRect(x + w / 2 - 42, top + hgt - 4, 12, y - top - hgt + 4);   // 다리
    ctx.save(); ctx.shadowColor = NEON_PINK; ctx.shadowBlur = 18;
    R(ctx, x - w / 2, top, w, hgt, 16); ctx.fillStyle = '#16122E'; ctx.fill(); ctx.restore();
    ctx.strokeStyle = '#FF5DA2'; ctx.lineWidth = 4; R(ctx, x - w / 2, top, w, hgt, 16); ctx.stroke();
    const n = Math.floor(w / 16);
    for (let i = 0; i < n; i++) { const on = Math.sin(t * 5 + i) > 0; ctx.fillStyle = on ? '#FFD54A' : 'rgba(255,213,74,.25)'; ctx.beginPath(); ctx.arc(x - w / 2 + 14 + i * ((w - 28) / (n - 1)), top + 12, 3.5, 0, Math.PI * 2); ctx.fill(); }
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff'; ctx.font = '24px Jua'; ctx.fillText('보호소에 간식 보내기', x, top + 46);
    ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.font = '15px Jua'; ctx.fillText('게임 한 판 = 간식 한 알 · 300알 모이면 간식 1개 · 보낼 곳은 정하는 중', x, top + 70);
    // 진행 막대
    const goal = prog ? prog.goal : 300, cur = prog ? Math.min(prog.current, goal) : 0, done = prog && prog.current >= goal;
    const bx = x - w / 2 + 28, bw = w - 56, by = top + 86, bh = 34;
    R(ctx, bx, by, bw, bh, 17); ctx.fillStyle = '#2B2550'; ctx.fill();
    if (cur > 0) { R(ctx, bx, by, Math.max(34, bw * (cur / goal)), bh, 17); ctx.fillStyle = done ? (Math.sin(t * 6) > 0 ? '#FFD54A' : '#FF8A3D') : '#C9965F'; ctx.fill(); }
    for (let i = 0; i < Math.min(14, Math.floor((bw * (cur / goal)) / 26)); i++) drawKibble(bx + 16 + i * 26, by + bh / 2, 7, i % 2 ? '#FFF6E6' : '#FFE0B8');   // 막대 속 사료알
    ctx.strokeStyle = '#FFD54A'; ctx.lineWidth = 2; R(ctx, bx, by, bw, bh, 17); ctx.stroke();
    ctx.save(); ctx.shadowColor = '#FFD54A'; ctx.shadowBlur = 10; ctx.fillStyle = '#FFD54A'; ctx.font = '40px Jua';
    ctx.fillText(prog ? (done ? '목표 달성! 보내는 중' : `${kib(cur)} / ${kib(goal)}알`) : '- / 300알', x, by + bh + 46); ctx.restore();
    ctx.fillStyle = 'rgba(255,255,255,.88)'; ctx.font = '17px Jua';
    const dog = prog ? prog.today_dog : 0, cat = prog ? prog.today_cat : 0;
    ctx.fillText(`오늘 +${kib(prog ? prog.today : 0)}알 · 강아지팀 ${kib(dog)} vs 고양이팀 ${kib(cat)}`, x, by + bh + 76);
    ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.font = '14px Jua';
    ctx.fillText(`지금까지 보낸 것 ${kib(prog ? prog.sent : 0)}번 · 모두의 점수 ${everyone ? kib(everyone.total) : '-'}${myKibbles ? ` · 내가 모은 간식 ${myKibbles}알` : ''}`, x, by + bh + 100);
    // 인증 사진 액자 (전광판 오른쪽)
    const fx = x + w / 2 + 20, fy = top + 40, fw = 128, fh = 150;
    ctx.save(); ctx.translate(fx + fw / 2, fy + fh / 2); ctx.rotate(-0.05);
    R(ctx, -fw / 2, -fh / 2, fw, fh, 8); ctx.fillStyle = '#F7EFE2'; ctx.fill(); ctx.strokeStyle = '#2a2420'; ctx.lineWidth = 3; ctx.stroke();
    if (proofImg && proofImg.complete && proofImg.naturalWidth) {
      const k = Math.max((fw - 16) / proofImg.naturalWidth, (fh - 44) / proofImg.naturalHeight);
      ctx.save(); R(ctx, -fw / 2 + 8, -fh / 2 + 8, fw - 16, fh - 44, 4); ctx.clip();
      ctx.drawImage(proofImg, -proofImg.naturalWidth * k / 2, -fh / 2 + 8 + (fh - 44) / 2 - proofImg.naturalHeight * k / 2, proofImg.naturalWidth * k, proofImg.naturalHeight * k); ctx.restore();
    } else {
      ctx.fillStyle = '#E3D8C6'; R(ctx, -fw / 2 + 8, -fh / 2 + 8, fw - 16, fh - 44, 4); ctx.fill();
      ctx.fillStyle = '#9A8E7C'; ctx.font = '13px Jua'; ctx.fillText('첫 인증 사진이', 0, -12); ctx.fillText('여기 걸려', 0, 8);
    }
    ctx.fillStyle = '#2a2420'; ctx.font = '14px Jua'; ctx.fillText(ships.length ? `${ships[0].round}번째 보낸 사진` : '보낸 사진', 0, fh / 2 - 14);
    ctx.restore();
  }
  const NEON_PINK = '#FF5DA2';

  // ---------- 순위 전광판 (11.10 대표님): 입구 바로 앞, 뒷줄 게임기 사이. 게임마다 1~3등 + 내 등수 ----------
  const RANK = { x: 720, y: 1230, w: 470 };   // y는 다리 밑동
  const rankRect = () => ({ x: RANK.x - RANK.w / 2, y: RANK.y - 268, w: RANK.w, h: 232 });
  let tops = { sacheon: null, peaks: null }, myRanks = null;
  async function loadRanks() {
    if (!window.Score || !Score.board) return;
    const [a, b, m] = await Promise.all([Score.board('sacheon', 3), Score.board('peaks', 3), Score.myInfo()]);
    if (a) tops.sacheon = a;
    if (b) tops.peaks = b;
    if (m && m.ok) myRanks = m;
  }
  if (!film) { loadRanks(); setInterval(loadRanks, 30000); }
  const cut = (s, n) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);
  function drawRankBoard(t) {
    const r = rankRect(), { x } = RANK;
    ctx.fillStyle = '#3A3550'; ctx.fillRect(r.x + 30, r.y + r.h - 4, 12, RANK.y - r.y - r.h + 4); ctx.fillRect(r.x + r.w - 42, r.y + r.h - 4, 12, RANK.y - r.y - r.h + 4);   // 다리
    ctx.save(); ctx.shadowColor = '#4FD1FF'; ctx.shadowBlur = 18;
    R(ctx, r.x, r.y, r.w, r.h, 16); ctx.fillStyle = '#121A2E'; ctx.fill(); ctx.restore();
    ctx.strokeStyle = '#4FD1FF'; ctx.lineWidth = 4; R(ctx, r.x, r.y, r.w, r.h, 16); ctx.stroke();
    ctx.textAlign = 'center';
    ctx.save(); ctx.shadowColor = '#FFD54A'; ctx.shadowBlur = 8; ctx.fillStyle = '#FFD54A'; ctx.font = '26px Jua'; ctx.fillText('순위 전광판', x, r.y + 36); ctx.restore();
    ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.font = '13px Jua'; ctx.fillText('게임마다 각자 최고 점수 · 눌러서 크게 보기', x, r.y + 56);
    const MEDAL = ['#FFD54A', '#D9DEE8', '#E0A36B'];
    [['sacheon', '사천성'], ['peaks', '트라이피크']].forEach(([id, name], col) => {
      const cx = r.x + r.w * (col ? 0.75 : 0.25), left = cx - r.w * 0.23, right = cx + r.w * 0.23;
      ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.font = '18px Jua'; ctx.fillText(name, cx, r.y + 84);
      const list = tops[id];
      for (let i = 0; i < 3; i++) {
        const yy = r.y + 112 + i * 28, row = list && list[i];
        ctx.fillStyle = MEDAL[i]; ctx.beginPath(); ctx.arc(left + 10, yy - 6, 10, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#121A2E'; ctx.font = '14px Jua'; ctx.textAlign = 'center'; ctx.fillText(row ? row.rank : i + 1, left + 10, yy - 1);
        ctx.textAlign = 'left'; ctx.font = '16px Jua';
        ctx.fillStyle = row && me.name && row.name === me.name ? '#FFD54A' : row ? '#fff' : 'rgba(255,255,255,.3)';
        ctx.fillText(row ? cut(row.name, 6) : (i === 0 && list && !list.length ? '1등 비어 있음' : '-'), left + 26, yy);
        if (row) { ctx.textAlign = 'right'; ctx.fillStyle = '#FFD54A'; ctx.fillText(kib(row.score), right, yy); }
      }
    });
    ctx.strokeStyle = 'rgba(79,209,255,.35)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, r.y + 70); ctx.lineTo(x, r.y + 178); ctx.stroke();
    // 내 등수 줄
    const g = (id) => myRanks && myRanks.games && myRanks.games[id];
    let mine;
    if (!me.name) mine = g('sacheon') || g('peaks') ? '별명을 정하면 내 등수도 여기 떠 (왼쪽 위 이름)' : '별명 정하고 한 판 하면 내 등수가 떠';
    else {
      const part = (id, nm) => (g(id) && g(id).rank ? `${nm} ${g(id).rank}등` : `${nm} -`);
      mine = `${cut(me.name, 8)} · ${part('sacheon', '사천성')} · ${part('peaks', '트라이피크')}`;
    }
    R(ctx, r.x + 16, r.y + r.h - 44, r.w - 32, 30, 10); ctx.fillStyle = Math.sin(t * 2) > -0.6 ? 'rgba(255,213,74,.16)' : 'rgba(255,213,74,.08)'; ctx.fill();
    ctx.textAlign = 'center'; ctx.fillStyle = '#FFE58A'; ctx.font = '16px Jua'; ctx.fillText(mine, x, r.y + r.h - 23);
  }
  const nearRank = () => isPlaza() && Math.abs(me.x - RANK.x) < RANK.w / 2 - 20 && me.y > RANK.y - 10 && me.y < RANK.y + 110;
  const openRank = () => document.getElementById('rankBtn').click();
  // 전광판을 직접 눌러도 순위판이 열림
  canvas.addEventListener('pointerdown', (e) => {
    if (!isPlaza() || openGame) return;
    const wx = (e.offsetX * dpr) / scale + camX, wy = (e.offsetY * dpr) / scale + camY, r = rankRect();
    if (wx > r.x && wx < r.x + r.w && wy > r.y && wy < r.y + r.h) setTimeout(openRank, 250);
  });

  // 게임 창 열기/닫기
  const gameBox = document.getElementById('gameBox'), gameFrame = document.getElementById('gameFrame');
  const arcadeBtn = document.getElementById('arcadeBtn');
  let openGame = null;
  function openArcade(gm) {
    openGame = gm;
    document.getElementById('gameTitle').textContent = gm.name;
    document.getElementById('gameGive').textContent = '';
    gameFrame.src = `${gm.url}&team=${BREEDS[me.breed]?.kind === 'cat' ? 'cat' : 'dog'}`;   // 강아지팀/고양이팀
    gameBox.classList.add('open'); window.plazaPaused = true;
    speech.set(myId, { text: `${gm.name} 하러 감`, until: Date.now() + 2500 });
  }
  let pendingUnlock = null;   // 게임 중에 새로 풀린 소품 → 광장에 돌아오면 말풍선으로 알려 줌
  function closeArcade() {
    gameBox.classList.remove('open'); window.plazaPaused = false;
    gameFrame.src = 'about:blank';   // 게임 화면이 닫히면서 남은 점수를 보냄 (pagehide)
    openGame = null; loadTotal(); setTimeout(loadRanks, 1500);   // 방금 낸 점수가 순위에 반영되게
    if (pendingUnlock) { speech.set(myId, { text: `${pendingUnlock.name} 풀렸다, 옷장 가 보자`, until: Date.now() + 3500 }); pendingUnlock = null; }
  }
  arcadeBtn.onclick = () => {
    const gm = nearGame(); if (!gm) { if (nearRank()) openRank(); return; }
    if (gm.soon) { speech.set(myId, { text: '뭐가 들어올지 아직 비밀이래', until: Date.now() + 2500 }); return; }
    openArcade(gm);
  };
  document.getElementById('gameClose').onclick = closeArcade;
  addEventListener('message', (e) => {
    const d = e.data;
    if (d && d.type === 'doduk-name') { if (typeof setMyName === 'function') setMyName(d.name); setTimeout(loadRanks, 500); return; }   // 게임 결과창에서 별명을 정함
    if (d && d.type === 'doduk-game-done') {   // 한 판 끝냄 → 새로 풀린 소품이 있으면 알려 줌
      const got = ACCESSORIES.find((a) => a.need === d.n);
      if (got) { document.getElementById('gameGive').textContent = `새 옷: ${got.name}`; pendingUnlock = got; }
      return;
    }
    if (d && d.type === 'doduk-kibble') {   // 간식 한 알 모음 → 전광판 막대 바로 올리기
      myKibbles++;
      if (prog) { prog = { ...prog, total: prog.total + 1, current: prog.current + 1, today: prog.today + 1, [d.team === 'cat' ? 'today_cat' : 'today_dog']: (prog[d.team === 'cat' ? 'today_cat' : 'today_dog'] || 0) + 1 }; }
      document.getElementById('gameGive').textContent = `간식 +${myKibbles}알`;
      setTimeout(loadTotal, 1500);
      return;
    }
    if (!d || d.type !== 'doduk-score' || !(d.score > 0)) return;
    given += d.score;
    if (everyone) { everyone = { ...everyone, total: Number(everyone.total) + d.score, today: Number(everyone.today) + d.score }; }
    if (!myKibbles) document.getElementById('gameGive').textContent = `+${given.toLocaleString('ko-KR')}점`;
    setTimeout(loadTotal, 1500);
  });

  // =====================================================================
  // 크리스마스 트리: 들어온 사람마다 장식 하나씩 (하루 3개까지)
  // =====================================================================
  const TREE = { x: 1150, y: 700, w: 260, h: 330 };   // y는 트리 밑동
  const kstNow = () => new Date(Date.now() + 9 * 3600000);
  const treeOn = () => false;   // 2026-11-09 광장을 오락실로 바꾸면서 트리도 뺌 (코드는 남겨 둠)
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
    drawTree(ctx, TREE.x, TREE.y, TREE.w, TREE.h, t, orns.slice(0, 300), 10);
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
    drawTree(tg, TCX, TBY, TWD, THT, performance.now() / 1000, orns.slice(0, 300), 17);
    if (pending) { drawOrn(tg, pending.kind, TCX + pending.x * TWD / 2, TBY - THT + pending.y * THT, 20); tg.strokeStyle = '#fff'; tg.lineWidth = 3; tg.setLineDash([6, 6]); tg.beginPath(); tg.arc(TCX + pending.x * TWD / 2, TBY - THT + pending.y * THT, 32, 0, Math.PI * 2); tg.stroke(); tg.setLineDash([]); }
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

  // ---------- 홍보 영상(film.js)용 손잡이: ?film 일 때만 ----------
  if (film) window.filmExtras = {
    tree: {
      reset: () => { orns = []; lsSet(todayKey(), 0); },
      open: () => { renderTreeBox(); treeEl.classList.add('open'); },
      close: () => document.getElementById('treeClose').click(),
      pick: (i) => kinds.querySelectorAll('button')[i].click(),
      place: (u, v) => { pending = { kind: pick, x: u, y: v }; renderTreeBox(); },
      hang: () => document.getElementById('treeHang').click(),
      render: renderTreeBox, cv: tcv,
    },
  };

  // ---------- 광장에 그리기 + 버튼 표시 ----------
  plazaHooks.push((items, t) => {
    items.push({ y: BOARD.y - 150, draw: () => drawBoard(t) });   // 전광판은 게임기 뒤
    items.push({ y: RANK.y, draw: () => drawRankBoard(t) });   // 순위 전광판 (뒤에 선 손님은 가려지고, 앞에 선 손님은 위로)
    for (const gm of GAMES) items.push({ y: gm.y, draw: () => drawCabinet(gm, t) });
    if (treeOn()) items.push({ y: TREE.y + 20, draw: () => drawPlazaTree(t) });
  });
  frameHooks.push(() => {
    const gm = nearGame(), nr = !gm && nearRank(), a = (!!gm || nr) && still() && !openGame;
    if (a) { const label = nr ? '순위판 크게 보기' : gm.soon ? '??? · 곧 열려' : `${gm.name} 하기`; if (arcadeBtn.textContent !== label) arcadeBtn.textContent = label; }
    if (a !== arcadeBtn.classList.contains('show')) arcadeBtn.classList.toggle('show', a);
    const tr = nearTree() && still() && !treeEl.classList.contains('open');
    if (tr !== treeBtn.classList.contains('show')) treeBtn.classList.toggle('show', tr);
    if (!isPlaza()) treeEl.classList.remove('open');
  });
})();
