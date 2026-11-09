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
  flush();
  return { send, flush, total, byGame, mine, fmt };
})();
