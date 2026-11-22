/* ===== 固定侧边导轨：进度条 + 板块目录 + 翻页 + 返回 =====
 * 纯运行时：扫描当前 active .stage 内的板块标题，不改任何既有渲染函数。
 * 依赖：页面已定义 showStage / backToTree / openEmperor / openPerson（仅返回键用到）。
 */
(function(){
'use strict';
if (window.__railReady) return;
window.__railReady = true;

function q(s,r){return (r||document).querySelector(s);}
function qa(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s));}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}

/* 各视图的板块锚点选择器：按出现顺序即阅读顺序 */
var SECTOR_SEL = [
  '.page-head',        // 人物 / 本纪 抬头
  '.framing-box',      // 类别定位
  '.impression',       // 书里写他
  '.topic-note',
  '.mr-turn',          // 转折点（mr-render）
  '.chip-groups',      // 关系人物
  '.reign-bar',        // 在位大事条
  '.ev-title',         // 分行卡片标题
  '.band',             // 每个朝代分段
  '.zt-node',          // MR 因果长卡（每张可跳）
  '.relative-box',
  '.factbox',          // 事实表
  '.bar-hint',
  '.thin-note',
  '.tl-head',          // 时间轴顶部
  '.tl-dyn-hd',        // 朝代大事记
  '.tl-ev-list',
  '.tl-subbar',
  '.tl-detail-empty',
  '.gen-toolbar',      // 世代图工具条
  '.gen-view',         // 世代图
  '.gen-fold',         // 折叠对照
  '.gen-table',        // 对照表
  '.miss'              // 未收录提示
];
var VIEW_NAME = {
  'stage-tree':'世代顺位图','stage-emperor':'皇帝本纪','stage-minister':'人物',
  'stage-missing':'未收录','stage-timeline':'朝代时间轴'
};
var rR, rL, listBox, nowBox, viewBox, pctBox, fillR, fillL, knobL, prevB, nextB, backB, toggleB;
var sectors=[], curStageId='', curIdx=-1, hidden=false, raf=null, lastSig='';

/* 板块标签：优先取标题类子元素文本，再退到元素自身首行 */
function labelOf(el){
  var cls=el.className||'';
  var t='';
  // 按板块类型取最贴切的标题源
  if (cls.indexOf('page-head')>=0) t=(q('.ph-main h2',el)||{}).textContent||'';
  else if (cls.indexOf('zt-node')>=0) t=(q('.zt-thesis,h3,h4,.tt',el)||{}).textContent||'';
  else if (cls.indexOf('band')>=0) t=(q('.band-side .g1',el)||{}).textContent||'';
  else if (cls.indexOf('mr-turn')>=0) t=(q('h3',el)||{}).textContent||'';
  else if (cls.indexOf('impression')>=0) t='书里写他';
  else if (cls.indexOf('reign-bar')>=0) t='在位大事条';
  else if (cls.indexOf('chip-groups')>=0) t='关系人物';
  else if (cls.indexOf('factbox')>=0) t='事实表';
  else if (cls.indexOf('gen-view')>=0) t='世代顺位图';
  else if (cls.indexOf('gen-fold')>=0) t='折叠世代';
  else if (cls.indexOf('gen-table')>=0) t='世代对照表';
  else if (cls.indexOf('gen-toolbar')>=0) t='图例与缩放';
  else if (cls.indexOf('tl-dyn-hd')>=0) t=(q('.nm',el)||{}).textContent||'朝代大事记';
  else if (cls.indexOf('relative-box')>=0) t=(q('h4',el)||{}).textContent||'附';
  else if (cls.indexOf('tl-head')>=0) t='时间轴总览';
  else if (cls.indexOf('ev-title')>=0) t=(el.childNodes[0]||{}).textContent||'分行卡片';
  if (!t) t=(q('h2,h3,h4,summary',el)||{}).textContent||'';
  if (!t) t=(el.textContent||'').replace(/\s+/g,' ').trim();
  t=t.replace(/\s+/g,' ').trim();
  t=t.replace(/共\s*\d+\s*[段条张章][^，。；;]*$/,'').trim();
  if (t.length>24) t=t.slice(0,24)+'…';
  return t || '板块';
}

/* 扫描当前 stage 的板块；返回 [{el,label,top}] */
function scan(){
  var stage=q('.stage.active') || q('#stage-tree');
  if (!stage) return [];
  var found=[], seen=(typeof WeakSet==='function')?new WeakSet():{};
  var hasSeen=function(e){return seen instanceof WeakSet ? seen.has(e) : !!seen[e];};
  var addSeen=function(e){if (seen instanceof WeakSet) seen.add(e); else seen[e]=1;};
  SECTOR_SEL.forEach(function(sel){
    qa(sel,stage).forEach(function(el){
      if (!el || hasSeen(el)) return;
      // 跳过隐藏、太矮、或被更外层已选板块完全覆盖的重复项
      var r=el.getBoundingClientRect();
      if (r.height<12) return;
      var cs=getComputedStyle(el);
      if (cs.display==='none'||cs.visibility==='hidden') return;
      addSeen(el);
      found.push({el:el, label:labelOf(el), top:0});
    });
  });
  // 按文档位置排序，并把嵌套的重复标签收敛（同元素只留一次，已由 seen 保证）
  found.sort(function(a,b){
    if (a.el===b.el) return 0;
    return (a.el.compareDocumentPosition(b.el) & 4) ? -1 : 1;
  });
  // 折叠面板里的后代在打开前高度为 0，已被过滤；列表展示时再动态刷新
  return found;
}

function signature(){
  var stage=q('.stage.active');
  return (stage?stage.id:'') + '|' + (stage?stage.innerHTML.length:0);
}

function rebuild(){
  var sig=signature();
  sectors=scan();
  curIdx=-1;
  var vn=VIEW_NAME[(q('.stage.active')||{}).id||''] || '浏览中';
  viewBox.textContent=vn;
  listBox.innerHTML = sectors.length
    ? sectors.map(function(s,i){return '<button class="rail-item" data-i="'+i+'" title="'+esc(s.label)+'"><i class="ri-dot"></i><span class="ri-tx">'+esc(s.label)+'</span></button>';}).join('')
    : '<div style="font-size:11px;color:#8a7c66;padding:8px 4px;line-height:1.6">本页板块较少，可直接滚动阅读。</div>';
  qa('.rail-item',listBox).forEach(function(b){
    b.addEventListener('click',function(){goTo(+b.dataset.i);});
  });
  lastSig=sig;
  update();
}

function scrollMax(){return Math.max(1, document.documentElement.scrollHeight-window.innerHeight);}
function pct(){return Math.min(100,Math.max(0, Math.round(window.scrollY/scrollMax()*100)));}

function update(){
  if (!sectors.length){nowBox.textContent='本页暂无分节';pctBox.textContent='0%';fillR.style.width='0%';fillL.style.height='0%';return;}
  var lines=window.scrollY + window.innerHeight*0.32;
  var idx=0;
  for (var i=0;i<sectors.length;i++){
    var top=sectors[i].el.getBoundingClientRect().top + window.scrollY;
    if (top<=lines) idx=i; else break;
  }
  if (idx!==curIdx){
    curIdx=idx;
    qa('.rail-item',listBox).forEach(function(b,i){b.classList.toggle('on',i===idx);});
    var on=q('.rail-item.on',listBox);
    if (on){
      // 只滚动目录容器内部，不要用 scrollIntoView（会把整个页面一起拽走）
      var t=on.offsetTop, h=on.offsetHeight, box=listBox.clientHeight;
      if (t < listBox.scrollTop) listBox.scrollTop=t-6;
      else if (t+h > listBox.scrollTop+box) listBox.scrollTop=t+h-box+6;
    }
    nowBox.textContent=sectors[idx].label;
    prevB.disabled=(idx<=0);
    nextB.disabled=(idx>=sectors.length-1);
  }
  var p=pct();
  pctBox.textContent=p+'%';
  fillR.style.width=p+'%';
  fillL.style.height=p+'%';
  knobL.style.top=p+'%';
}

function goTo(i){
  if (i<0||i>=sectors.length) return;
  var el=sectors[i].el;
  var y=el.getBoundingClientRect().top + window.scrollY - 18;
  window.scrollTo({top:Math.max(0,y),behavior:'smooth'});
}

/* 返回键：模拟当前页内可见的返回按钮，统一走既有逻辑 */
function doBack(){
  var stage=q('.stage.active');
  var btn=stage && (q('.tl-back',stage) || q('#emp-back',stage) || q('#min-back',stage) || q('.back',stage));
  if (btn && btn.getBoundingClientRect().height>0){btn.click();return;}
  if (typeof window.backToTree==='function') window.backToTree();
  else if (stage) stage.classList.remove('active'), q('#stage-tree') && q('#stage-tree').classList.add('active');
  window.scrollTo({top:0,behavior:'smooth'});
}

function onScroll(){
  if (raf) return;
  raf=requestAnimationFrame(function(){raf=null;update();});
}

function build(){
  if (q('#rail-r')) return;
  var css=document.createElement('link');
  css.rel='stylesheet'; css.href='pkg/rail.css';
  document.head.appendChild(css);

  rR=document.createElement('aside'); rR.id='rail-r'; rR.className='rail-r';
  rR.innerHTML=
    '<div class="rail-view"></div>'+
    '<div class="rail-toprow">'+
      '<button class="rail-back" title="返回上一级">← 返回</button>'+
      '<div class="rail-now">—</div>'+
    '</div>'+
    '<div class="rail-bar"><span class="rb-track"><i class="rb-fill"></i></span><span class="rb-pct">0%</span></div>'+
    '<div class="rail-list"></div>'+
    '<div class="rail-foot"><button class="rail-prev" title="上一板块">↑ 上一块</button><button class="rail-next" title="下一板块">↓ 下一块</button></div>';
  document.body.appendChild(rR);

  rL=document.createElement('aside'); rL.id='rail-l'; rL.className='rail-l';
  rL.innerHTML=
    '<button class="rl-btn rl-up" title="上一板块">↑</button>'+
    '<div class="rl-track"><i class="rl-fill"></i><i class="rl-knob"></i></div>'+
    '<button class="rl-btn rl-down" title="下一板块">↓</button>'+
    '<span class="rl-cap">阅读进度</span>';
  document.body.appendChild(rL);

  // 折叠开关独立于导轨，收起后仍留在屏幕边缘可再次展开
  toggleB=document.createElement('button');
  toggleB.className='rail-toggle';
  toggleB.title='收起导轨';
  toggleB.textContent='›';
  document.body.appendChild(toggleB);

  viewBox=q('.rail-view',rR); nowBox=q('.rail-now',rR);
  listBox=q('.rail-list',rR); pctBox=q('.rb-pct',rR); fillR=q('.rb-fill',rR);
  fillL=q('.rl-fill',rL); knobL=q('.rl-knob',rL);
  backB=q('.rail-back',rR); prevB=q('.rail-prev',rR); nextB=q('.rail-next',rR);

  backB.addEventListener('click',doBack);
  prevB.addEventListener('click',function(){goTo(curIdx-1);});
  nextB.addEventListener('click',function(){goTo(curIdx+1);});
  q('.rl-up',rL).addEventListener('click',function(){goTo(curIdx-1);});
  q('.rl-down',rL).addEventListener('click',function(){goTo(curIdx+1);});
  q('.rl-track',rL).addEventListener('click',function(e){
    if (!sectors.length) return;
    var r=this.getBoundingClientRect();
    var p=Math.min(1,Math.max(0,(e.clientY-r.top)/r.height));
    goTo(Math.round(p*(sectors.length-1)));
  });
  toggleB.addEventListener('click',function(){
    hidden=!hidden;
    rR.classList.toggle('r-hidden',hidden);
    rL.classList.toggle('r-hidden',hidden);
    toggleB.textContent=hidden?'‹':'›';
    toggleB.title=hidden?'展开导轨':'收起导轨';
    toggleB.classList.toggle('is-out',hidden);
  });

  window.addEventListener('scroll',onScroll,{passive:true});
  window.addEventListener('resize',function(){if (raf) return;raf=requestAnimationFrame(function(){raf=null;rebuild();});});

  // 视图内容变化（切换朝代、打开人物、MR 追加转折点块）后自动重建目录
  var timer=null;
  var mo=new MutationObserver(function(){
    var sig=signature();
    if (sig===lastSig) return;
    clearTimeout(timer);
    timer=setTimeout(function(){
      var s2=signature();
      if (s2!==lastSig) rebuild();
    },120);
  });
  mo.observe(document.body,{childList:true,subtree:true,characterData:true});
  rebuild();
}

if (document.readyState==='loading') document.addEventListener('DOMContentLoaded',build);
else build();
})();
