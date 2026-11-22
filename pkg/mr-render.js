/* 明朝本纪重写 · 通用渲染器
   数据：pkg/mr-data-*.js 写入 window.MR.emps[帝号id]；pkg/mr-people.js 写入 window.MR.people[人物id]
   规范：docs/02-细节增强规范.md（前因/经过/后果 + 为什么问答 + 因果边 + 4–6 节点主线） */
window.MR = window.MR || { emps: {}, people: {}, meta: {} };

(function () {
  var MR = window.MR;
  // 英宗试点章（window.ZT）直接并入新数据结构
  if (window.ZT && window.ZT.emp && !MR.emps[window.ZT.emp]) MR.emps[window.ZT.emp] = window.ZT;
  if (!MR.meta.version) MR.meta.version = '明朝重写 · 分批交付';

  // 跨朝代 id 会重名（如各朝都有 taizu），新数据以「朝代:id」命名空间存储，优先取命名空间键
  function curDynName() {
    try { if (typeof curDyn !== 'undefined' && curDyn) return curDyn; } catch (e) {}
    return window.curDyn;
  }
  function nsKey(map, id) {
    var d = curDynName();
    if (d && map[d + ':' + id]) return d + ':' + id;
    return id;
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function srcLabel(s) {
    if (!s) return '';
    if (s.book === '明史') return '《明史》卷' + s.vol + ' · ' + s.chapter;
    if (s.book === '那些事儿' || s.book === '明朝那些事儿') return '《明朝那些事儿》' + (s.vol ? s.vol + ' · ' : '') + (s.chapter || '') + (s.idx ? ' · 第' + s.idx + '段' : '') + '（白话著作，非正史原文）';
    if (/明史|宋史|元史|清史稿|旧唐书|新唐书/.test(s.book)) return '《' + s.book + '》' + (s.vol || '') + (s.chapter ? ' · ' + s.chapter : '');
    return '《' + s.book + '》' + (s.vol ? s.vol + ' · ' : '') + (s.chapter || '') + '（白话著作，非正史原文）';
  }
  function basisLabel(b) {
    if (!b) return '';
    return (b.type === 'book' ? '书内' : b.type === 'hist' ? '史传' : '史无明文') + '：' + b.text;
  }
  function evById(emp, id) {
    var a = emp.events || [];
    for (var i = 0; i < a.length; i++) if (a[i].id === id) return a[i];
    return null;
  }

  var CSS = ''
    + '.zt-wrap{max-width:1080px;margin:0 auto;padding:4px 20px 46px}'
    + '.zt-head{display:flex;align-items:baseline;gap:12px;flex-wrap:wrap;padding:8px 0 4px;border-bottom:1px solid rgba(120,100,70,.2)}'
    + '.zt-head h2{margin:0;font-family:var(--serif);font-size:17px;letter-spacing:.14em;color:var(--red)}'
    + '.zt-head .zt-ver{font-size:10.5px;color:var(--ink3);letter-spacing:.06em}'
    + '.zt-thesis{margin:12px 0 6px;padding:14px 18px;border-radius:10px;background:linear-gradient(160deg,rgba(255,252,243,.95),rgba(246,236,214,.8));border:1px solid rgba(176,139,62,.32);font-family:var(--serif);font-size:14.5px;line-height:1.95;color:#33291f}'
    + '.zt-thesis b{color:var(--red);font-weight:600;letter-spacing:.08em}'
    + '.zt-spine{display:grid;gap:8px;margin:14px 0 22px}'
    + '.zt-sp{position:relative;display:grid;grid-template-columns:104px 1fr;gap:12px;padding:10px 14px;border-radius:10px;border:1px solid rgba(120,100,70,.26);background:rgba(255,252,244,.62);cursor:pointer;transition:.22s}'
    + '.zt-sp:hover{border-color:rgba(138,28,20,.42);background:rgba(255,249,233,.95);transform:translateX(3px)}'
    + '.zt-sp .yr{font-family:var(--serif);font-size:12px;color:var(--red);letter-spacing:.04em;font-variant-numeric:tabular-nums;line-height:1.5}'
    + '.zt-sp .lb{font-family:var(--serif);font-size:14px;letter-spacing:.06em;color:var(--ink);font-weight:600}'
    + '.zt-sp .cn{font-size:11.5px;color:var(--ink3);line-height:1.7;margin-top:3px}'
    + '.zt-sp .cn em{font-style:normal;color:#7b2b21}'
    + '.zt-flow{display:flex;flex-direction:column;gap:16px;margin-top:8px}'
    + '.zt-node{position:relative;display:grid;grid-template-columns:118px 1fr;gap:16px;padding:0 0 4px}'
    + '.zt-node .rail{position:relative;padding-top:6px}'
    + '.zt-node .rail .yy{font-family:var(--serif);font-size:19px;color:var(--red);font-weight:600;letter-spacing:.04em;font-variant-numeric:tabular-nums;display:block}'
    + '.zt-node .rail .ee{display:block;font-size:11px;color:var(--ink3);margin-top:4px;line-height:1.6}'
    + '.zt-node .rail .tag{display:inline-block;margin-top:8px;font-size:10px;padding:2px 7px;border-radius:999px;border:1px solid rgba(176,139,62,.45);color:#7a4a12;background:rgba(176,139,62,.1)}'
    + '.zt-node .rail:after{content:"";position:absolute;left:6px;top:76px;bottom:-22px;width:2px;background:linear-gradient(180deg,rgba(138,28,20,.5),rgba(138,28,20,.06))}'
    + '.zt-node:last-child .rail:after{display:none}'
    + '.zt-card{position:relative;padding:16px 20px 18px;border-radius:12px;border:var(--card-line);background:var(--card-bg);box-shadow:var(--card-shadow);transition:.25s}'
    + '.zt-card:hover{border-color:rgba(138,28,20,.34);box-shadow:0 12px 28px rgba(122,26,20,.13)}'
    + '.zt-card.hero{background:var(--card-key-bg);border:var(--card-key-line);box-shadow:var(--card-key-shadow)}'
    + '.zt-card h3{margin:0 0 4px;font-family:var(--serif);font-size:18.5px;letter-spacing:.07em;font-weight:600;line-height:1.4}'
    + '.zt-card .qline{margin:0 0 12px;font-size:12px;color:#7b2b21;letter-spacing:.02em}'
    + '.zt-sec{margin:0 0 11px;padding-left:11px;border-left:2px solid rgba(138,28,20,.24)}'
    + '.zt-sec .st{display:inline-block;font-family:var(--serif);font-size:11px;letter-spacing:.16em;color:#fff8e8;background:#8a1c14;padding:2px 8px;border-radius:2px;margin-bottom:7px}'
    + '.zt-sec.b2 .st{background:#7a4a12}'
    + '.zt-sec.b3 .st{background:#3f4a3f}'
    + '.zt-sec p{margin:0 0 6px;font-size:13px;line-height:1.85;color:var(--ink2)}'
    + '.zt-sec ul{margin:2px 0 0;padding-left:0;list-style:none}'
    + '.zt-sec li{position:relative;padding-left:14px;margin:0 0 6px;font-size:12.5px;line-height:1.8;color:#4a3f33}'
    + '.zt-sec li:before{content:"";position:absolute;left:2px;top:9px;width:5px;height:5px;border-radius:50%;background:rgba(138,28,20,.4)}'
    + '.zt-sec li b{color:#7b2b21;font-weight:600}'
    + '.zt-q{margin:12px 0 0;padding:11px 14px;border-radius:9px;background:rgba(138,28,20,.045);border:1px solid rgba(138,28,20,.16)}'
    + '.zt-q .qz{font-family:var(--serif);font-size:13.5px;color:#7b2b21;font-weight:600;letter-spacing:.03em;line-height:1.6}'
    + '.zt-q .qa{margin:6px 0 0;font-size:12.5px;line-height:1.85;color:#3f342a}'
    + '.zt-q .qb{margin:7px 0 0;font-size:10.5px;color:#94856c;letter-spacing:.02em}'
    + '.zt-q .qb.none{color:#8a5a2a}'
    + '.zt-card blockquote{margin:12px 0 0;padding:10px 14px;border-left:3px solid rgba(176,139,62,.6);background:rgba(255,253,246,.66);border-radius:0 7px 7px 0;font-family:var(--serif);font-size:13.5px;line-height:1.95;color:#3a2f24}'
    + '.zt-card blockquote .pr{display:block;margin-top:7px;font-family:var(--sans);font-size:10.5px;color:#94856c}'
    + '.zt-card blockquote .pr i{font-style:normal;color:#7b2b21}'
    + '.zt-edge{margin:12px 0 0;display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-size:11.5px;color:var(--ink3)}'
    + '.zt-edge .ar{color:rgba(138,28,20,.55);font-size:14px}'
    + '.zt-edge .go{padding:4px 12px;border-radius:999px;border:1px solid rgba(138,28,20,.38);background:rgba(255,250,240,.72);color:var(--red);cursor:pointer;transition:.2s}'
    + '.zt-edge .go:hover{background:rgba(138,28,20,.1);transform:translateY(-1px)}'
    + '.zt-gap{margin:10px 0 0;padding:8px 12px;border-radius:7px;font-size:11.5px;line-height:1.8;color:#7c5a2a;background:rgba(176,139,62,.12);border-left:3px solid rgba(176,139,62,.55)}'
    + '.zt-gap b{color:#7a4a12}'
    + '.zt-card.flash{animation:ztflash 1.6s ease-out;border-color:rgba(138,28,20,.72)!important;box-shadow:0 0 0 3px rgba(138,28,20,.14),0 14px 32px rgba(122,26,20,.2)!important}'
    + '@keyframes ztflash{0%{background-color:rgba(255,238,190,.95)}100%{background-color:transparent}}'
    + '.reign-bar[data-zt]{display:flex;flex-wrap:wrap;gap:6px}'
    + '.reign-bar[data-zt] .rn{flex:0 0 auto;height:auto;min-height:0;min-width:0;max-width:none;white-space:normal;padding:6px 10px;border-radius:8px}'
    + '.reign-bar[data-zt] .rn-era{display:block;font-size:11.5px;line-height:1.5;letter-spacing:.01em}'
    + '.reign-bar[data-zt] .rn-role{display:block;font-size:9.5px;line-height:1.4;color:var(--ink3);margin-top:1px}'
    + '.mr-turn{margin:16px 20px 6px;padding:16px 18px;border-radius:12px;border:1px solid rgba(138,28,20,.28);background:linear-gradient(160deg,rgba(255,250,240,.96),rgba(246,232,208,.72))}'
    + '.mr-turn h3{margin:0 0 6px;font-family:var(--serif);font-size:17px;letter-spacing:.1em;color:var(--red)}'
    + '.mr-turn .lead{margin:0 0 9px;font-size:13px;line-height:1.85;color:#4a3f33}'
    + '.mr-turn ul{margin:0;padding-left:0;list-style:none}'
    + '.mr-turn li{position:relative;padding-left:14px;margin:0 0 6px;font-size:12.5px;line-height:1.8;color:#4a3f33}'
    + '.mr-turn li:before{content:"";position:absolute;left:2px;top:9px;width:5px;height:5px;border-radius:50%;background:rgba(138,28,20,.4)}'
    + '.mr-turn li b{color:#7b2b21}'
    + '.mr-turn .q{margin:10px 0 0;padding:10px 13px;border-radius:9px;background:rgba(138,28,20,.05);border:1px solid rgba(138,28,20,.16);font-size:12.5px;line-height:1.85;color:#3f342a}'
    + '.mr-turn .q b{display:block;color:#7b2b21;font-family:var(--serif);margin-bottom:4px}'
    + '@media (max-width:820px){.zt-wrap{padding:4px 4px 34px}.zt-sp{grid-template-columns:1fr;gap:4px}'
    + '.zt-node{grid-template-columns:1fr;gap:6px}.zt-node .rail{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;padding-top:0}'
    + '.zt-node .rail .yy{font-size:16px}.zt-node .rail .ee{margin-top:0}.zt-node .rail .tag{margin-top:0}'
    + '.zt-node .rail:after{display:none}.zt-card{padding:13px 14px 15px}.zt-card h3{font-size:16.5px}'
    + '.zt-sec p,.zt-q .qa{font-size:12.5px}.zt-card blockquote{font-size:12.5px}.mr-turn{margin:12px 8px 4px;padding:13px 14px}}';

  function addStyle() {
    if (document.getElementById('mr-style')) return;
    var s = document.createElement('style');
    s.id = 'mr-style';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function layerHTML(items) {
    return (items || []).map(function (x) {
      if (typeof x === 'string') {
        var i = x.indexOf('：');
        if (i > 0 && i < 8) return '<li><b>' + esc(x.slice(0, i)) + '</b>：' + esc(x.slice(i + 1)) + '</li>';
        return '<li>' + esc(x) + '</li>';
      }
      return '<li><b>' + esc(x.k) + '</b>：' + esc(x.t) + '</li>';
    }).join('');
  }

  function renderEvent(emp, ev) {
    var sec = function (cls, label, lead, items, isLayer) {
      var list = '';
      if (items && items.length) {
        list = '<ul>' + (isLayer ? layerHTML(items)
          : items.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('')) + '</ul>';
      }
      return '<div class="zt-sec ' + cls + '"><span class="st">' + label + '</span>'
        + (lead ? '<p>' + esc(lead) + '</p>' : '') + list + '</div>';
    };
    var qs = (ev.why || []).map(function (w) {
      var bl = w.basis ? '<div class="qb' + (w.basis.type === 'none' ? ' none' : '') + '">依据 · ' + esc(basisLabel(w.basis)) + '</div>' : '';
      return '<div class="zt-q"><div class="qz">问：' + esc(w.q) + '</div><div class="qa">' + esc(w.a) + '</div>' + bl + '</div>';
    }).join('');
    var quotes = (ev.quotes || []).map(function (q) {
      return '<blockquote>' + esc(q.text) + '<span class="pr">证明「<i>' + esc(q.proves) + '</i>」 · ' + esc(srcLabel(q.source)) + '</span></blockquote>';
    }).join('');
    var edge = (ev.edges || []).map(function (e) {
      var t = evById(emp, e.to);
      return '<div class="zt-edge"><span class="ar">▼ 因此</span><span>' + esc(e.label) + '</span>'
        + '<span class="go" data-mrgo="' + esc(e.to) + '">读到：' + (t ? esc(String(t.title).split('：')[0]) : esc(e.to)) + '</span></div>';
    }).join('');
    var gap = (ev.gap || []).map(function (g) {
      return '<div class="zt-gap"><b>史无明文</b>　' + esc(g) + '</div>';
    }).join('');
    return '<div class="zt-node" id="' + esc(ev.id) + '">'
      + '<div class="rail"><span class="yy">' + esc(ev.year) + '</span><span class="ee">' + esc(ev.era) + '</span>'
      + (ev.tag ? '<span class="tag">' + esc(ev.tag) + '</span>' : '') + '</div>'
      + '<div class="zt-card' + (ev.hero ? ' hero' : '') + '"><h3>' + esc(ev.title) + '</h3>'
      + (ev.before && ev.before.lead ? '<p class="qline">' + esc(ev.before.lead) + '</p>' : '')
      + sec('b1', '前　因', null, ev.before.layers, true)
      + sec('b2', '经　过', null, ev.course.beats, false)
      + sec('b3', '后　果', null, ev.after.chains, false)
      + qs + quotes + gap + edge
      + '</div></div>';
  }

  function mountEmp(id) {
    var emp = MR.emps[nsKey(MR.emps, id)];
    if (!emp) return;
    addStyle();
    var st = document.getElementById('stage-emperor');
    if (!st) return;

    var bar = st.querySelector('.reign-bar');
    if (bar) {
      bar.setAttribute('data-zt', '1');
      bar.innerHTML = emp.spine.map(function (n, i) {
        return '<div class="rn on" data-mrjump="' + n.id + '"><span class="rn-era">' + esc(n.year) + ' · ' + esc(n.label) + '</span>'
          + '<span class="rn-role">' + (i + 1) + ' / ' + emp.spine.length + '</span></div>';
      }).join('');
      bar.querySelectorAll('[data-mrjump]').forEach(function (b) {
        b.addEventListener('click', function () { jump(b.getAttribute('data-mrjump')); });
      });
    }
    var hint = st.querySelector('.bar-hint');
    if (hint) hint.innerHTML = '<b>主线 ' + emp.spine.length + ' 节点</b>：每个节点只写「因—事—果」。点节点跳到对应长卡，长卡底部「因此」可顺链往下读。';

    var et = st.querySelector('.ev-title');
    if (et) et.innerHTML = '本纪 · 因果长卷<span>共 ' + emp.events.length + ' 张长卡 · 每卡含前因 / 经过 / 后果 / 为什么 · ' + (MR.meta.version || '') + '</span>';

    var bands = st.querySelector('.bands');
    if (!bands) return;
    bands.className = 'bands zt-wrap';
    bands.innerHTML =
      '<div class="zt-head"><h2>这一章的主线</h2><span class="zt-ver">遮住正文，只看这条链，应该能复述「为什么会走到下一步」</span></div>'
      + (emp.thesis ? '<div class="zt-thesis"><b>一句话</b>　' + esc(emp.thesis) + '</div>' : '')
      + '<div class="zt-spine">' + emp.spine.map(function (n, i) {
        return '<div class="zt-sp" data-mrjump="' + n.id + '"><div class="yr">' + esc(n.year) + '</div>'
          + '<div><div class="lb">' + (i + 1) + '. ' + esc(n.label) + '</div>'
          + '<div class="cn"><em>因</em>：' + esc(n.because) + '　　<em>果</em>：' + esc(n.so) + '</div></div></div>';
      }).join('') + '</div>'
      + '<div class="zt-flow">' + emp.events.map(function (ev) { return renderEvent(emp, ev); }).join('') + '</div>';

    bands.querySelectorAll('[data-mrjump]').forEach(function (b) {
      b.addEventListener('click', function () { jump(b.getAttribute('data-mrjump')); });
    });
    bands.querySelectorAll('[data-mrgo]').forEach(function (b) {
      b.addEventListener('click', function (e) { e.stopPropagation(); jump(b.getAttribute('data-mrgo')); });
    });
  }

  function jump(id) {
    var t = document.getElementById(id);
    if (!t) return;
    var y = t.getBoundingClientRect().top + window.pageYOffset - 120;
    window.scrollTo({ top: y, behavior: 'smooth' });
    var card = t.querySelector('.zt-card') || t;
    card.classList.remove('flash'); void card.offsetWidth; card.classList.add('flash');
    setTimeout(function () { card.classList.remove('flash'); }, 1700);
  }

  function mountPerson(pid) {
    var p = MR.people[nsKey(MR.people, pid)];
    if (!p) return;
    addStyle();
    var st = document.getElementById('stage-minister');
    if (!st) return;
    var old = st.querySelector('.mr-turn');
    if (old) old.parentNode.removeChild(old);
    var box = document.createElement('div');
    box.className = 'mr-turn';
    box.innerHTML = '<h3>转折点 · ' + esc(p.headline || '为什么走到这一步') + '</h3>'
      + '<p class="lead">' + esc(p.lead) + '</p>'
      + '<ul>' + (p.points || []).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>'
      + (p.why || []).map(function (w) {
        return '<div class="q"><b>问：' + esc(w.q) + '</b>' + esc(w.a)
          + (w.basis ? '<div style="margin-top:6px;font-size:10.5px;color:#94856c">依据 · ' + esc(basisLabel(w.basis)) + '</div>' : '') + '</div>';
      }).join('')
      + (p.quotes || []).map(function (q) {
        return '<blockquote style="margin:10px 0 0;padding:9px 13px;border-left:3px solid rgba(176,139,62,.6);background:rgba(255,253,246,.66);border-radius:0 7px 7px 0;font-family:var(--serif);font-size:13px;line-height:1.9;color:#3a2f24">'
          + esc(q.text) + '<span class="pr" style="display:block;margin-top:6px;font-family:var(--sans);font-size:10.5px;color:#94856c">证明「<i style="font-style:normal;color:#7b2b21">' + esc(q.proves) + '</i>」 · ' + esc(srcLabel(q.source)) + '</span></blockquote>';
      }).join('')
      + (p.gap || []).map(function (g) { return '<div class="zt-gap"><b>史无明文</b>　' + esc(g) + '</div>'; }).join('');
    var anchor = st.querySelector('.ev-title');
    if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(box, anchor);
    else st.appendChild(box);

    // 人物页事件长卡：存在新数据时替换旧的「一句话标签」短卡
    var cards = (MR.peopleCards || {})[nsKey(MR.peopleCards || {}, pid)];
    if (cards && cards.length) {
      var bands = st.querySelector('.bands');
      if (bands) {
        bands.className = 'bands zt-wrap';
        bands.innerHTML = '<div class="zt-head"><h2>人物 · 因果长卡</h2>'
          + '<span class="zt-ver">每卡只写「前因—经过—后果」，卡片底部「因此」可顺链读</span></div>'
          + '<div class="zt-flow">' + cards.map(function (ev) { return renderEvent({ events: cards }, ev); }).join('') + '</div>';
        bands.querySelectorAll('[data-mrgo]').forEach(function (b) {
          b.addEventListener('click', function (e) { e.stopPropagation(); jump(b.getAttribute('data-mrgo')); });
        });
        var et2 = st.querySelector('.ev-title');
        if (et2) et2.innerHTML = '人物 · 因果长卡<span>共 ' + cards.length + ' 张长卡 · 每卡含前因 / 经过 / 后果 / 为什么 · ' + (MR.meta.version || '') + '</span>';
      }
    }
  }

  var origEmp = window.openEmperor;
  if (typeof origEmp === 'function') {
    window.openEmperor = function (id) {
      origEmp(id);
      if (MR.emps[nsKey(MR.emps, id)]) setTimeout(function () { mountEmp(id); }, 0);
    };
  }
  var origPer = window.openPerson;
  if (typeof origPer === 'function') {
    window.openPerson = function (pid, from) {
      origPer(pid, from);
      if (MR.people[nsKey(MR.people, pid)]) setTimeout(function () { mountPerson(pid); }, 0);
    };
  }

  // 直接带 #mr-<帝号> 打开时进入对应本纪
  var h = location.hash.slice(1);
  if (h && (MR.emps[nsKey(MR.emps, h.replace(/^mr-/, ''))] || h.indexOf('mr-') === 0)) {
    var id = h.indexOf('mr-') === 0 ? h.slice(3) : h;
    setTimeout(function () {
      try { window.openEmperor(id); } catch (e) {}
    }, 200);
  }
})();
