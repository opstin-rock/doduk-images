// 모두의 점수 (게임 공용)
// - 단계·판이 끝날 때마다 그동안 얻은 점수를 Supabase plays 표에 보냄 (게임 이름 + 점수만, 개인정보 없음)
// - 못 보낸 건 이 폰에 모아 뒀다가 다음에 다시 보냄 (오늘 기록만. 서버가 오늘 날짜만 받음)
// - 모두의 점수 합계는 everyone_score, 게임별 합계는 game_score 에서 읽음
// 표 만들기: supabase/plays.sql
window.Score = (() => {
  const cfg = window.DODUK || {};
  const url = cfg.supabaseUrl, key = cfg.supabaseKey;
  const ready = !!(url && key);
  const headers = { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };
  const PENDING = 'doduk-pending-plays', MINE = 'doduk-my-total';
  const today = () => new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10);
  const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

  async function post(game, score, keepalive) {
    if (!ready) return false;
    try {
      const r = await fetch(`${url}/rest/v1/plays`, { method: 'POST', headers: { ...headers, Prefer: 'return=minimal' }, body: JSON.stringify({ game, score }), keepalive: !!keepalive });
      return r.ok;
    } catch { return false; }
  }
  // 점수 보내기. 30000점이 넘으면 나눠서 보냄
  async function send(game, score, opts = {}) {
    score = Math.floor(score);
    if (!(score >= 1)) return true;
    lsSet(MINE, lsGet(MINE, 0) + score);
    // 광장 안에서 열린 게임이면 광장에 알려 줌 (전광판 숫자 바로 올리기)
    if (window.parent !== window) { try { window.parent.postMessage({ type: 'doduk-score', game, score }, '*'); } catch {} }
    let allOk = true;
    for (let left = score; left > 0; left -= 30000) {
      const part = Math.min(30000, left);
      const ok = await post(game, part, opts.keepalive);
      if (!ok) { allOk = false; lsSet(PENDING, [...lsGet(PENDING, []), { game, score: part, day: today() }]); }
    }
    return allOk;
  }
  // 못 보낸 기록 다시 보내기 (지난 날짜 것은 서버가 안 받으니 버림)
  async function flush() {
    const list = lsGet(PENDING, []).filter((p) => p.day === today());
    const left = [];
    for (const p of list) if (!(await post(p.game, p.score))) left.push(p);
    lsSet(PENDING, left);
  }
  async function get(path) {
    if (!ready) return null;
    try { const r = await fetch(`${url}/rest/v1/${path}`, { headers }); return r.ok ? await r.json() : null; } catch { return null; }
  }
  const total = async () => { const j = await get('everyone_score?select=total,plays,today'); return j && j[0] ? j[0] : null; };
  const byGame = async () => { const j = await get('game_score?select=game,total,plays'); return j ? Object.fromEntries(j.map((x) => [x.game, x])) : null; };
  const mine = () => lsGet(MINE, 0);
  const fmt = (n) => Number(n).toLocaleString('ko-KR');

  // ---------- 사료알: 게임 한 판 끝내면 한 알 (폰 하나당 하루 20알, 서버 add_kibble 함수가 확인) ----------
  // 폰마다 무작위 번호 하나 (누구인지 알 수 없음. 하루 상한 세는 데만 씀)
  let device = lsGet('doduk-device', null);
  if (!device) { device = (crypto.randomUUID ? crypto.randomUUID() : `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`).replace(/-/g, '').slice(0, 32); lsSet('doduk-device', device); }
  // 팀: 광장에서 고른 강아지/고양이 (게임 주소 ?team=dog|cat 으로 넘어옴), 없으면 전에 쓴 팀
  const urlTeam = new URLSearchParams(location.search).get('team');
  let team = urlTeam === 'dog' || urlTeam === 'cat' ? urlTeam : lsGet('doduk-team', null);
  if (team !== 'dog' && team !== 'cat') team = Math.random() < 0.5 ? 'dog' : 'cat';
  lsSet('doduk-team', team);
  const KPEND = 'doduk-pending-kibbles';
  async function rpcKibble(game) {
    if (!ready) return null;
    try {
      const r = await fetch(`${url}/rest/v1/rpc/add_kibble`, { method: 'POST', headers, body: JSON.stringify({ p_game: game, p_team: team, p_device: device }) });
      return r.ok ? await r.json() : null;
    } catch { return null; }
  }
  // 결과: { ok: true, today } / { ok: false, reason: 'cap' } / null(못 보냄 → 이 폰에 모아 뒀다가 다시)
  async function kibble(game) {
    const res = await rpcKibble(game);
    if (!res) lsSet(KPEND, [...lsGet(KPEND, []), { game, day: today() }]);
    if (window.parent !== window && res && res.ok) { try { window.parent.postMessage({ type: 'doduk-kibble', game, team, today: res.today }, '*'); } catch {} }
    return res;
  }
  async function flushKibbles() {
    const list = lsGet(KPEND, []).filter((p) => p.day === today());
    const left = [];
    for (const p of list) { const r = await rpcKibble(p.game); if (!r) left.push(p); }
    lsSet(KPEND, left);
  }
  const progress = async () => { const j = await get('kibble_progress?select=total,sent,goal,current,today,today_dog,today_cat'); return j && j[0] ? j[0] : null; };
  const shipments = async () => (await get('shipments?select=round,item,shelter,photo_url,sent_at&order=round.desc&limit=5')) || [];

  // 끝낸 게임 판 수 (옷장 소품 풀기용). 하루 20알 상한과 상관없이 끝낸 만큼 셈. 이 폰(브라우저)에 저장
  function gameDone() {
    const n = lsGet('doduk-games-done', 0) + 1;
    lsSet('doduk-games-done', n);
    if (window.parent !== window) { try { window.parent.postMessage({ type: 'doduk-game-done', n }, '*'); } catch {} }
    return n;
  }

  // ---------- 별명 + 게임별 순위판 (supabase/ranking.sql) ----------
  // 폰마다 비밀 번호 하나 (서버에는 해시만 저장). 별명·최고 점수가 이 번호에 묶임
  let secret = lsGet('doduk-secret', null);
  if (!secret || !/^[0-9a-z]{24,64}$/.test(secret)) {
    const a = new Uint8Array(16); (crypto.getRandomValues ? crypto.getRandomValues(a) : a.forEach((_, i) => { a[i] = Math.random() * 256; }));
    secret = [...a].map((x) => x.toString(16).padStart(2, '0')).join(''); lsSet('doduk-secret', secret);
  }
  const GAME_NAME = { sacheon: '사천성', peaks: '트라이피크' };
  const BAD = ['관리자', '운영자', '운영진', '도둑냥', '펫바자', '옵스틴', 'admin', '시발', '씨발', '씨팔', '시팔', '병신', '븅신', '좆', '존나', '졸라',
    '개새', '새끼', '미친', '지랄', 'fuck', 'shit', 'sex', '섹스', '보지', '자지', '엠창', '니미', '애미', '애비', '느금', 'sibal', 'bitch'];
  // 서버와 같은 규칙 (2~8자, 한글·영문·숫자, 금지어 없음). 다른 손님 이름표를 그릴 때도 이걸로 거름
  const nameOk = (n) => typeof n === 'string' && /^[가-힣A-Za-z0-9]{2,8}$/.test(n) && !BAD.some((w) => n.toLowerCase().includes(w));
  const myName = () => { const n = lsGet('doduk-name', ''); return nameOk(n) ? n : ''; };
  async function rpc(fn, body, keepalive) {
    if (!ready) return null;
    try {
      const r = await fetch(`${url}/rest/v1/rpc/${fn}`, { method: 'POST', headers, body: JSON.stringify(body), keepalive: !!keepalive });
      return r.ok ? await r.json() : null;
    } catch { return null; }
  }
  // 결과: { ok: true, name } / { ok: false, reason: 'bad' | 'taken' | 'net' }
  async function setName(n) {
    n = String(n || '').trim();
    if (!nameOk(n)) return { ok: false, reason: 'bad' };
    const r = await rpc('set_name', { p_secret: secret, p_name: n });
    if (!r) return { ok: false, reason: 'net' };
    if (r.ok) { lsSet('doduk-name', r.name); if (window.parent !== window) { try { window.parent.postMessage({ type: 'doduk-name', name: r.name }, '*'); } catch {} } }
    return r;
  }
  const BPEND = 'doduk-pending-best';
  // 최고 점수 보내기 (서버가 더 높을 때만 바꿈). 못 보내면 모아 뒀다가 다음에
  async function best(game, score, keepalive) {
    score = Math.floor(score);
    if (!(score >= 1) || !GAME_NAME[game]) return null;
    const r = await rpc('submit_best', { p_secret: secret, p_game: game, p_score: Math.min(200000, score) }, keepalive);
    if (!r) { const p = lsGet(BPEND, {}); p[game] = Math.max(p[game] || 0, score); lsSet(BPEND, p); }
    return r;
  }
  async function flushBest() {
    const p = lsGet(BPEND, {}); lsSet(BPEND, {});
    for (const [game, score] of Object.entries(p)) await best(game, score);
  }
  const board = async (game, limit = 10) => (await get(`game_board?select=name,score,rank&game=eq.${game}&order=rank.asc,name.asc&limit=${limit}`)) || null;
  const myInfo = () => rpc('my_info', { p_secret: secret });
  // 순위판 모양 (게임·광장 공용)
  try {
    const st = document.createElement('style');
    st.textContent = `.rk{background:#fff;border:2px solid #e4dccd;border-radius:12px;padding:8px 12px;margin:6px 0;text-align:left}
.rk-title{font-family:"Jua",sans-serif;font-size:17px;text-align:center;margin-bottom:4px}
.rk-row{display:flex;align-items:center;gap:8px;font-size:14px;line-height:1.85}
.rk-row.me{background:#FFE58A;border-radius:8px;margin:0 -6px;padding:0 6px}
.rk-n{width:22px;text-align:center;font-family:"Jua",sans-serif;color:#E8402F}
.rk-name{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.rk-row b{font-family:"Jua",sans-serif;font-weight:400;font-size:15px}
.rk-empty{font-size:13px;color:#8a8070;text-align:center;padding:4px 0}
.rk-me{font-size:13px;text-align:center;border-top:1px dashed #c9bfae;margin-top:4px;padding-top:5px;word-break:keep-all}
.rk-form{display:flex;gap:6px;margin-top:6px}
.rk-form input{flex:1;min-width:0;font-size:16px;padding:8px 10px;border:2px solid #2B2622;border-radius:10px;font-family:inherit}
.rk-form button{flex:0 0 auto;margin:0;padding:8px 12px;font-size:15px;border-radius:10px;border:0;background:#2B2622;color:#fff;font-family:"Jua",sans-serif}
.rk-msg{font-size:12px;color:#E8402F;text-align:center;min-height:14px;margin-top:3px;word-break:keep-all}`;
    document.head.appendChild(st);
  } catch {}
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
  // 순위판을 el 안에 그림 (게임 결과창·광장 순위창 공용). 별명이 없으면 별명 정하기 칸도 같이
  async function renderBoard(el, game, opts = {}) {
    if (!el) return;
    el.classList.add('rk');
    el.innerHTML = `<div class="rk-title">${GAME_NAME[game]} 순위판</div><div class="rk-empty">불러오는 중</div>`;
    const [list, info] = await Promise.all([board(game, opts.limit || 5), myInfo()]);
    const me = info && info.ok ? info : null;
    if (me && me.name && me.name !== lsGet('doduk-name', '')) lsSet('doduk-name', me.name);
    const mine = me && me.games && me.games[game];
    const name = myName();
    const rows = list === null ? '<div class="rk-empty">아직 못 불러왔어</div>'
      : !list.length ? '<div class="rk-empty">아직 아무도 없어. 1등 자리 비어 있어</div>'
      : list.map((x) => `<div class="rk-row${x.name === name ? ' me' : ''}"><span class="rk-n">${x.rank}</span><span class="rk-name">${esc(x.name)}</span><b>${fmt(x.score)}</b></div>`).join('');
    let foot = '';
    if (name && mine) foot = `<div class="rk-me">내 최고 ${fmt(mine.best)}점 · ${mine.rank}등</div>`;
    else if (name) foot = `<div class="rk-me">${esc(name)} · 아직 기록 없음</div>`;
    else foot = `<div class="rk-me">${mine ? `내 최고 ${fmt(mine.best)}점. ` : ''}별명을 정하면 순위판에 올라가</div>` +
      `<div class="rk-form"><input maxlength="8" placeholder="별명 2~8자" autocomplete="off"><button type="button">정하기</button></div><div class="rk-msg"></div>`;
    el.innerHTML = `<div class="rk-title">${GAME_NAME[game]} 순위판</div><div class="rk-list">${rows}</div>${foot}`;
    const form = el.querySelector('.rk-form');
    if (form) {
      const input = form.querySelector('input'), msg = el.querySelector('.rk-msg');
      form.querySelector('button').onclick = async () => {
        msg.textContent = '확인 중';
        const r = await setName(input.value);
        if (r.ok) return renderBoard(el, game, opts);
        msg.textContent = nameMsg(r.reason);
      };
    }
  }
  const nameMsg = (reason) => reason === 'taken' ? '이미 누가 쓰고 있어. 다른 별명으로 해 줘'
    : reason === 'net' ? '연결이 안 돼. 잠시 뒤에 다시 해 줘' : '2~8자 한글·영문·숫자로 해 줘 (안 되는 말도 있어)';

  flush(); flushKibbles(); flushBest();
  return { send, flush, total, byGame, mine, fmt, kibble, progress, shipments, gameDone, gamesDone: () => lsGet('doduk-games-done', 0), get team() { return team; },
    best, board, myInfo, setName, myName, nameOk, nameMsg, renderBoard, GAME_NAME };
})();
