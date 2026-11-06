// 진동 (두 게임 공용)
// - 안드로이드: 웹 진동 기능(navigator.vibrate). 크롬과, 진동 권한이 있는 앱(카카오톡·인스타·스레드·X 등) 안 브라우저에서 울림
// - 아이폰: 웹 진동이 막혀 있음. iOS 18부터 "스위치 체크박스"를 누를 때 나는 짧은 햅틱을 빌려 씀 (사파리에서 확인된 방법, 앱 안 브라우저는 될 수도 안 될 수도)
// - 안 되는 곳에서는 조용히 넘어감. 켜기/끄기는 그 폰에 저장
window.Haptic = (() => {
  let on = true;
  try { on = localStorage.getItem('doduk-vibe') !== '0'; } catch {}
  const isIOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const canVibrate = !isIOS && typeof navigator.vibrate === 'function';
  let sw = null;
  if (isIOS) {
    const label = document.createElement('label');
    const input = document.createElement('input');
    input.type = 'checkbox'; input.setAttribute('switch', ''); input.tabIndex = -1;
    label.appendChild(input);
    label.setAttribute('aria-hidden', 'true');
    label.style.cssText = 'position:fixed;left:-200px;top:0;width:1px;height:1px;opacity:0;pointer-events:none;';
    document.addEventListener('DOMContentLoaded', () => document.body.appendChild(label));
    if (document.body) document.body.appendChild(label);
    sw = label;
  }
  // pattern: 진동 ms 배열 [울림, 쉼, 울림, ...]. 아이폰은 한 번만 톡 (누른 순간에만 가능)
  function buzz(pattern) {
    if (!on) return;
    try {
      if (canVibrate) navigator.vibrate(pattern);
      else if (sw) sw.click();
    } catch {}
  }
  // 연속 수에 따라 세게: 0=짝 하나, 1~2=2·3연속, 3~4, 5~7, 8 이상
  function combo(cb) {
    if (cb >= 7) buzz([25, 25, 25, 25, 25, 25, 45]);
    else if (cb >= 4) buzz([20, 30, 20, 30, 25]);
    else if (cb >= 2) buzz([15, 40, 15]);
    else buzz(cb >= 1 ? 18 : 12);
  }
  const big = () => buzz([60, 50, 120]);       // 단계·판 성공
  const nope = () => buzz(8);                   // 안 되는 곳 눌렀을 때
  function toggle() { on = !on; try { localStorage.setItem('doduk-vibe', on ? '1' : '0'); } catch {} if (on) buzz(30); return on; }
  return { buzz, combo, big, nope, toggle, get on() { return on; }, get supported() { return canVibrate || !!sw; } };
})();
