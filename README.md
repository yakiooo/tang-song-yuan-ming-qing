唐宋元明清 · 历史站（离线发布版 · 五朝齐）
================================================

一、怎么打开
------------
1. 解压整个目录（index.html 与 pkg 目录必须同级，不能只取一个文件）。
2. 双击 index.html，用 Chrome / Edge / Firefox 打开即可。
3. 数据包按需懒加载（第一次点某朝才读该朝两个 js），file:// 与本地 http
   两种方式都可用，不需要联网。
4. 可按朝代直达：index.html?d=tang / song / yuan / ming / qing
   不带参数时：先读上次浏览的朝代（浏览器 localStorage），首次默认唐。
5. 顺位图在 ≥760px 宽时用画布（有卡片、有连线、有世次对照表）；
   窄屏自动改为可折叠的世代列表，不横向溢出。

二、收录范围（五朝齐）
----------------------
唐 618–907   21 帝  本纪 + 人物页 + 专题 5 题
宋 960–1279  18 帝  本纪 + 人物页 + 专题 15 题
元 1206–1368 15 帝（大汗 4 + 皇帝 11）本纪 + 人物页 + 专题 13 题
明 1368–1644 16 帝  本纪 + 人物页 + 专题 10 题（38 顺位卡 / 12 世 / 11 张「补」卡）
清 1636–1912 12 帝  本纪 + 人物页 + 专题 17 题

本版新增：唐 5 题（安史之乱、武周革命、藩镇割据、牛李党争、黄巢起义→唐亡）、
明 10 题（靖难、迁都、土木→夺门、大礼议、严嵩夏言、张居正、万历三大征、
东林、辽东、明末流寇）；宋 15 / 元 13 / 清 17 题为本版之前已有，本次仅回归未改。

目录内容
--------
index.html               外壳（单入口：切朝代、懒加载、检索、本纪 / 人物 / 专题 / 对照表）
pkg\tang-benji.js        唐 · 本纪
pkg\tang-people.js       唐 · 人物页
pkg\song-benji.js        宋 · 本纪
pkg\song-people.js       宋 · 人物页
pkg\yuan-benji.js        元 · 本纪
pkg\yuan-people.js       元 · 人物页
pkg\ming-benji.js        明 · 本纪
pkg\ming-people.js       明 · 人物页
pkg\qing-benji.js        清 · 本纪
pkg\qing-people.js       清 · 人物页

三、底本与校勘
--------------
唐  《大唐兴亡三百年》 王觉仁
宋  《如果这是宋史》 高天流云；校勘《细说宋朝》 黎东方
元  《成吉思汗与今日世界之形成》 杰克·威泽弗德；《细说元朝》 黎东方
    大汗四位用公元＋干支纪年，1294 年为断点，元末 1351–1368 条目注「网络补充」
明  《明朝那些事儿》 当年明月
清  《细说清朝》 黎东方为主干；阎崇年《正说清朝十二帝》为评价补充，
    两书口径不同处标「另说」

各页引文逐字摘自对应书籍，并注明册 / 章位置；正文概述为编者据原书改写。
「另说」「网络补充」「补」卡均单独标注，不当作定论。

四、怎么再加一朝（新增包）
--------------------------
1. 两个文件：<拼音>-benji.js、<拼音>-people.js，内容为
   window.HIST.register("<拼音>","benji",{...}) 与 window.HIST.register("<拼音>","people",{...})。
2. 数据键与现有五包同构：
   本纪 meta / volumes / chapters / emperors / gens / genEdges / genNote /
        genTable / reigns / minorEmp / empAlias /（topics 可选）
   人物 people / minor / linkAlias / searchPeople / searchTerms / rank
   专题每题：id / cat / title / sub / years / lead / points（时间轴）/
        quotes（可多条，含 text + source）/ links（act 为 emp: / pid: / minor:）
3. 把两个文件放进 pkg\。
4. 打开 index.html，在 DYN 数组里新增一项：
   {k:'xx',n:'某',title:'N帝',sub:'皇位传承 · 书页之间',years:'起–止',
    pack:['pkg/xx-benji.js','pkg/xx-people.js']}
   同时在顶栏 <div class="dynbar"> 里加一个
   <button class="dyn" data-dyn="xx"><b>某</b><i>起–止</i></button>。
5. 保存刷新即可。包缺失、路径写错或 404 时，页面显示「暂未收录」提示页，
   并写明缺包位置，控制台只警告一次；不会白屏或渲染空画布。

五、引文版权提示
----------------
1. 本页是个人学习用的离线摘录站，不是史料点校本，也不替代原书。
2. 原文摘录仅用于个人学习与自用。如公开发布、转载或商用，请自行控制
   引用篇幅、注明书名与作者、并取得权利人授权；因超出合理使用范围
   产生的版权责任由发布者自负。
3. 顺位图世次按父系层级计算，专题节点不占世次；「补」卡与「网络补充」
   均单独标注。

六、体积参考（实测，未压缩）
----------------------------
index.html        89,758 B（约 88 KB）
tang-benji.js     204,650 B（200 KB）
tang-people.js    399,906 B（391 KB）
song-benji.js     342,424 B（334 KB）
song-people.js    276,248 B（270 KB）
yuan-benji.js     111,482 B（109 KB）
yuan-people.js     54,810 B（ 54 KB）
ming-benji.js     226,084 B（221 KB）
ming-people.js    258,283 B（252 KB）
qing-benji.js     130,068 B（127 KB）
qing-people.js     97,048 B（ 95 KB）
pkg 合计 2,101,003 B（约 2.05 MB）
