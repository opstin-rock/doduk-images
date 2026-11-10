// 앱 안 브라우저(스레드·인스타·페이스북·카카오톡 등)로 들어오면 바깥 브라우저(크롬·사파리)로 열게 함 (11.10 대표님)
// 이유: 앱 안 브라우저는 저장 공간이 따로라 별명·옷장·판 수가 쉽게 사라지고, 화면도 잘림
// - 카카오톡: 바로 바깥 브라우저로 넘김 (카카오가 주는 주소)
// - 안드로이드: 크롬으로 넘기기 한 번 시도 + 안내 카드의 "크롬으로 열기" 버튼
// - 아이폰(스레드·인스타 등): 넘기는 방법이 없어서 "··· → 브라우저에서 열기" 안내 + 링크 복사
// - "그냥 여기서 할게"를 누르면 이번 방문 동안은 다시 안 띄움. 주소에 ?stay 가 있어도 안 띄움
(() => {
  const ua = navigator.userAgent || '';
  const android = /Android/i.test(ua), ios = /iPhone|iPad|iPod/i.test(ua);
  const app = /KAKAOTALK/i.test(ua) ? '카카오톡'
    : /Barcelona/i.test(ua) ? '스레드'
    : /Instagram/i.test(ua) ? '인스타그램'
    : /FBAN|FBAV|FB_IAB|FBIOS/i.test(ua) ? '페이스북'
    : /\bLine\//i.test(ua) ? '라인'
    : /NAVER\(inapp|DaumApps|everytimeApp|BAND\//i.test(ua) ? '앱' : '';
  const ss = (k, v) => { try { if (v === undefined) return sessionStorage.getItem(k); sessionStorage.setItem(k, v); } catch { return null; } };
  if (!app || /[?&]stay/.test(location.search) || ss('doduk-inapp-stay')) return;
  const url = location.href;
  const chromeIntent = () => `intent://${location.host}${location.pathname}${location.search}#Intent;scheme=https;package=com.android.chrome;end`;

  if (app === '카카오톡') {
    if (!ss('doduk-inapp-tried')) { ss('doduk-inapp-tried', '1'); location.href = `kakaotalk://web/openExternal?url=${encodeURIComponent(url)}`; }
    return;   // 카카오톡은 넘어가면 끝. 못 넘어가도 그대로 쓸 수 있게 둠
  }
  if (android && !ss('doduk-inapp-tried')) { ss('doduk-inapp-tried', '1'); setTimeout(() => { location.href = chromeIntent(); }, 300); }

  const show = () => {
    const st = document.createElement('style');
    st.textContent = `.inapp{position:fixed;inset:0;z-index:100;background:rgba(20,16,30,.92);display:flex;align-items:center;justify-content:center;padding:18px;font-family:"Noto Sans KR",sans-serif}
.inapp .b{background:#fff;border-radius:20px;padding:22px 18px 16px;width:min(100%,340px);text-align:center;color:#1f1f22;word-break:keep-all}
.inapp h3{margin:0 0 8px;font-family:"Jua",sans-serif;font-weight:400;font-size:23px}
.inapp p{margin:0 0 12px;font-size:14px;line-height:1.6}
.inapp .how{background:#FFF3C4;border-radius:12px;padding:10px;font-size:15px;font-weight:700;line-height:1.6;margin-bottom:12px}
.inapp button{display:block;width:100%;border:0;border-radius:14px;padding:13px;margin-top:8px;font-family:"Jua",sans-serif;font-size:18px;cursor:pointer}
.inapp .go{background:#1f1f22;color:#fff}.inapp .cp{background:#FFD54A;color:#1f1f22}.inapp .stay{background:none;color:#8a8a8a;font-size:14px;padding:8px}
.inapp .arrow{position:fixed;top:8px;right:14px;color:#FFD54A;font-family:"Jua",sans-serif;font-size:16px;text-align:right;line-height:1.3}`;
    document.head.appendChild(st);
    const el = document.createElement('div');
    el.className = 'inapp';
    const how = android ? '아래 버튼을 누르면 크롬으로 열려'
      : `오른쪽 위 <b>···</b> 을 누르고<br><b>"브라우저에서 열기"</b> (Safari) 를 눌러 줘`;
    el.innerHTML = `${ios ? '<div class="arrow">여기 ··· 눌러 줘 ↑</div>' : ''}<div class="b">
  <h3>브라우저로 열어 줘</h3>
  <p>${app} 안에서는 별명·옷장·끝낸 판 수가<br>나중에 사라질 수 있어.<br>${android ? '크롬' : '사파리'}로 열면 계속 남아.</p>
  <div class="how">${how}</div>
  ${android ? '<button class="go" type="button">크롬으로 열기</button>' : ''}
  <button class="cp" type="button">링크 복사하기</button>
  <button class="stay" type="button">그냥 여기서 할게</button>
</div>`;
    document.body.appendChild(el);
    const go = el.querySelector('.go');
    if (go) go.onclick = () => { location.href = chromeIntent(); };
    const cp = el.querySelector('.cp');
    cp.onclick = async () => {
      let ok = false;
      try { await navigator.clipboard.writeText(url); ok = true; } catch {}
      if (!ok) { try { const t = document.createElement('textarea'); t.value = url; t.style.position = 'fixed'; t.style.opacity = '0'; document.body.appendChild(t); t.select(); ok = document.execCommand('copy'); t.remove(); } catch {} }
      cp.textContent = ok ? `복사했어. ${android ? '크롬' : '사파리'} 주소창에 붙여 넣어 줘` : url;
    };
    el.querySelector('.stay').onclick = () => { ss('doduk-inapp-stay', '1'); el.remove(); };
  };
  if (document.body) show(); else document.addEventListener('DOMContentLoaded', show);
})();
