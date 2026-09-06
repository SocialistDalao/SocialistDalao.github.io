/* ============================================================
   LOANCOLD — i18n.js
   内联双语字典（zh/en），零 fetch 依赖（file:// 下亦可用）。

   用法：
     <el data-i18n="nav.home">主页</el>   ← applyI18n() 按当前语言
                                            以 innerHTML 替换
     t('nav.home')                        ← JS 内取词
   语言状态：html[lang] + localStorage('loancold.lang')
   事件：lang:change（detail = lang）
   ============================================================ */

const DICT = {
  /* ---------- 导航 / 全局 ---------- */
  'nav.home':   { zh: '主页', en: 'Home' },
  'nav.about':  { zh: '关于', en: 'About' },
  'nav.works':  { zh: '作品', en: 'Works' },
  'nav.blog':   { zh: '博客', en: 'Blog' },

  'mode.toArt': { zh: '✦ 艺术模式', en: '✦ Art Mode' },
  'mode.toPro': { zh: '▤ 简洁模式', en: '▤ Simple Mode' },
  'lang.switch': { zh: 'EN', en: '中文' },

  'footer.copyright': { zh: '© 2021–2026 李程浩 · LoanCold', en: '© 2021–2026 Li Chenghao · LoanCold' },

  'site.notice': {
    zh: 'Last Update：2026.09.01 · 信息不全，仅供参考，最新版本正在重构中',
    en: 'Last Update: 2026.09.01 · Information incomplete, for reference only. A full revision is underway.',
  },

  /* ---------- 主页 · 简洁模式（文艺复兴画册） ---------- */
  'pro.kicker':   { zh: '腾讯 · 微信小游戏全栈性能优化工程师', en: 'FULL-STACK PERFORMANCE ENGINEER · WECHAT MINI GAMES @ TENCENT' },
  'pro.name':     { zh: '李程浩', en: 'Li Chenghao' },
  'pro.enname':   { zh: 'LOANCOLD', en: 'LOANCOLD' },
  'pro.tagline':  {
    zh: '写操作系统的人，也写诗。',
    en: 'I build operating systems — and write poetry.',
  },
  'pro.edu':      {
    zh: '哈尔滨工业大学（深圳）计算机本科 · 浙江大学网络空间安全硕士',
    en: 'B.Eng. CS, Harbin Institute of Technology (Shenzhen) · M.S. Cyberspace Security, Zhejiang University',
  },
  'pro.keywords': {
    zh: '关键词：WebAssembly · Web 游戏客户端 · 操作系统 · 计算机体系结构 · Rust',
    en: 'Keywords: WebAssembly · Web Game Client · Operating Systems · Computer Architecture · Rust',
  },
  'pro.ch.about': { zh: '简介', en: 'Profile' },
  'pro.ch.works': { zh: '作品', en: 'Works' },
  'pro.ch.blog':  { zh: '博客', en: 'Blog' },
  'pro.intro':    {
    zh: '从 FPGA 软核到 Rust 多核内核，再到微信小游戏的 Web 性能优化，我着迷于让每一层抽象都「快」起来；此外也写诗与杂记。此页为简洁版——若想看我更野性的一面，请点击右下角的金色徽章。',
    en: 'From FPGA soft cores to Rust multicore kernels, and now Web performance for WeChat Mini Games, I am fascinated by making every layer of abstraction fast. I also write poetry. This is the clean edition — for my wilder side, tap the golden seal at the bottom right.',
  },
  'pro.contact':  { zh: '联系 · loancold@foxmail.com', en: 'Contact · loancold@foxmail.com' },
  'pro.resume':   { zh: '个人简历 PDF', en: 'Résumé PDF' },
  'magic.tip':    { zh: '进入另一面', en: 'ENTER THE OTHER SIDE' },
  'art.back.tip': { zh: '回到简洁版', en: 'BACK TO CLEAN' },

  /* ---------- 主页 · 艺术模式（对话面板） ---------- */
  'art.dialogue.1': { zh: '我是李程浩，也可以叫我 LoanCold。', en: "I'm Li Chenghao — also known as LoanCold." },
  'art.dialogue.2': { zh: '写操作系统，也写诗。', en: 'I write operating systems, and poems.' },
  'art.dialogue.3': { zh: '体系结构 · 操作系统 · 分布式系统 · 数据库。', en: 'Architecture · OS · Distributed systems · Databases.' },
  'art.dialogue.4': { zh: '往下滑，或者从左边进入我的世界。', en: 'Scroll down, or enter my world from the left.' },

  /* ---------- 关于页 ---------- */
  'about.kicker': { zh: 'ABOUT / RESUME', en: 'ABOUT / RESUME' },
  'about.title':  { zh: '个人介绍与简历', en: 'Profile & Resume' },
  'about.portrait.cap': { zh: 'LOANCOLD · 1BIT PORTRAIT', en: 'LOANCOLD · 1BIT PORTRAIT' },
  'about.s1':     { zh: 'I. 简介', en: 'I. Profile' },
  'about.p1':     {
    zh: '我是<b>李程浩</b>，英文名 <b>LoanCold</b>（也作 <b>SocialistDalao</b>）。现为腾讯<b>微信小游戏全栈性能优化工程师</b>；此前就读于浙江大学网络空间安全硕士、哈尔滨工业大学（深圳）计算机本科。',
    en: 'I am <b>Li Chenghao</b>, also known as <b>LoanCold</b> (a.k.a. <b>SocialistDalao</b>). I am now a <b>full-stack performance engineer for WeChat Mini Games at Tencent</b>, after an M.S. in Cyberspace Security at Zhejiang University and a B.Eng. in CS at HIT (Shenzhen).',
  },
  'about.p2':     {
    zh: '折腾过 FPGA 软核、写过多核操作系统内核；也写诗、写一些不成体统的杂记。相信系统与文字共享同一种美：简洁、克制、无处可删。',
    en: 'I have tinkered with FPGA soft cores and written multiprocessor OS kernels; I also write poems and unclassifiable notes. I believe systems and prose share one kind of beauty: concise, restrained, with nothing left to delete.',
  },
  'about.s2':     { zh: 'II. 主要经历', en: 'II. Experience' },
  'about.exp0':   { zh: '腾讯 · 微信小游戏全栈性能优化工程师', en: 'Full-Stack Performance Engineer · WeChat Mini Games @ Tencent' },
  'about.edu1.t': { zh: '浙江大学 · 网络空间安全 · 硕士 · 导师 申文博', en: 'Zhejiang University · Cyberspace Security · M.S. · Advisor: Shen Wenbo' },
  'about.edu2.t': { zh: '哈尔滨工业大学（深圳）· 计算机 · 本科 · 学分绩 94.07 (TOP 2%) · 导师 夏文', en: 'HIT (Shenzhen) · Computer Science · B.Eng. · GPA 94.07 (Top 2%) · Advisor: Xia Wen' },
  'about.s3':     { zh: 'III. 主要作品', en: 'III. Works' },
  'about.exp.1':  { zh: '<b>UltraMIPS</b> · FPGA 双发射计算机系统（队长）— 主频 91MHz、性能 63 倍 / IPC 34.6 倍，「龙芯杯」CPU 团队赛一等奖（总排名 2）', en: '<b>UltraMIPS</b> · FPGA dual-issue computer system (Team Lead) — 91MHz, 63× perf / 34.6× IPC, Loongson Cup First Prize (rank 2)' },
  'about.exp.2':  { zh: '<b>UltraOS</b> · RISC-V64 多核操作系统（队长）— Rust 编写、K210 双核、59 条系统调用，系统能力大赛 OS 内核赛道一等奖第一名', en: '<b>UltraOS</b> · RISC-V64 multiprocessor OS (Team Lead) — Rust, K210 dual-core, 59 syscalls, OS kernel track First Prize (rank 1)' },
  'about.exp.3':  { zh: '<b>Rust 编译器不稳定特性研究</b> — 软件工程顶会 ICSE (CCF-A) 一作，自研生态解析器（248M 依赖、99% 正确率）', en: '<b>Rust unstable-features study</b> — ICSE (CCF-A) first author; custom ecosystem parser (248M deps, 99% precision)' },
  'about.exp.4':  { zh: '<b>Rust 操作系统驱动安全增强</b>（本科毕设）— Rust for Linux 驱动框架评估与 ABI 检测工具', en: '<b>Rust OS driver security</b> (undergrad thesis) — Rust-for-Linux framework evaluation & ABI checker' },
  'about.exp.5':  { zh: '<b>HITSZ 助手</b>（创始人之一）— 智慧校园 App，2500 日活 / 下载 2w，青年 AI 创新创业大会一等奖', en: '<b>HITSZ Assistant</b> (Co-founder) — campus app, 2.5k DAU / 20k downloads, Youth AI Innovation First Prize' },
  'about.exp.6':  { zh: '<b>出租车机场载客决策模型</b>（队长）— 精确率约 80%，数模国赛二等奖', en: '<b>Taxi dispatch decision model</b> (Team Lead) — ~80% accuracy, CUMCM National 2nd Prize' },
  'about.s4':     { zh: 'IV. 所获荣誉', en: 'IV. Honors' },
  'about.h.syn':  { zh: '综合荣誉', en: 'General Honors' },
  'about.h1':     { zh: '国家奖学金（连续两学年）', en: 'National Scholarship (two consecutive years)' },
  'about.h2':     { zh: '哈尔滨工业大学优秀学生干部标兵', en: 'HIT Outstanding Student Leader Model' },
  'about.h3':     { zh: '哈尔滨工业大学优秀团干部', en: 'HIT Outstanding League Cadre' },
  'about.h4':     { zh: '哈工大（深圳）学业奖学金一等奖', en: 'First-Class Academic Scholarship, HIT (Shenzhen)' },
  'about.h.comp': { zh: '竞赛荣誉', en: 'Competition Honors' },
  'about.h5':     { zh: '全国大学生计算机系统能力培养大赛「龙芯杯」CPU 团队赛一等奖（总排名 2）', en: 'Loongson Cup CPU Team First Prize, National Computer System Capability Contest (rank 2)' },
  'about.h10':    { zh: '全国大学生计算机系统能力培养大赛 OS 内核赛道一等奖第一名', en: 'OS Kernel Track First Prize (rank 1), National Computer System Capability Contest' },
  'about.h6':     { zh: '全国大学生数学建模竞赛 全国二等奖（2019、2020）', en: 'National Second Prize, CUMCM (2019 & 2020)' },
  'about.h7':     { zh: '美国大学生数学建模竞赛 Meritorious Winner', en: 'Meritorious Winner, MCM/ICM' },
  'about.h8':     { zh: '第六届全国青年人工智能创新创业大会 创新组一等奖', en: 'First Prize (Innovation), 6th National Youth AI Innovation & Entrepreneurship Conference' },
  'about.h.other':{ zh: '其他荣誉', en: 'Other Honors' },
  'about.h9':     { zh: '哈工大（深圳）大一立项优秀项目奖', en: 'Outstanding Freshman Project Award, HIT (Shenzhen)' },
  'about.h11':    { zh: '浙江大学优秀研究生 / 五好研究生', en: 'Outstanding Graduate Student & Five-Virtues Graduate, Zhejiang University' },
  'about.h12':    { zh: '软件工程顶会 ICSE (CCF-A) 一作一篇', en: 'ICSE (CCF-A) first-author paper' },
  'about.s5':     { zh: 'V. 关键词', en: 'V. Keywords' },
  'about.tag.1':  { zh: 'WebAssembly', en: 'WebAssembly' },
  'about.tag.2':  { zh: 'Web 游戏客户端', en: 'Web Game Client' },
  'about.tag.3':  { zh: '操作系统', en: 'Operating Systems' },
  'about.tag.4':  { zh: '计算机体系结构', en: 'Computer Architecture' },
  'about.tag.5':  { zh: 'Rust', en: 'Rust' },
  'about.s6':     { zh: 'VI. 联系', en: 'VI. Contact' },

  /* ---------- 作品页 ---------- */
  'works.kicker': { zh: 'SELECTED WORKS', en: 'SELECTED WORKS' },
  'works.title':  { zh: '个人作品', en: 'Selected Works' },
  'works.more':   { zh: '详情 →', en: 'Details →' },
  'works.w1.t':   { zh: 'UltraOS — RISC-V64 多核操作系统', en: 'UltraOS — RISC-V64 Multiprocessor OS' },
  'works.w1.m':   { zh: 'RUST · K210 · 多核内核 · 2021', en: 'RUST · K210 · MULTICORE KERNEL · 2021' },
  'works.w1.d':   {
    zh: '以 Rust 编写、运行于 Kendryte-K210 双核 RISC-V 处理器，支持 EXT2 / FAT32 文件系统与双核调度。',
    en: 'Written in Rust for the dual-core RISC-V Kendryte-K210 board, with EXT2 / FAT32 filesystems and dual-core scheduling.',
  },
  'works.w2.t':   { zh: 'UltraMIPS — FPGA 双发射计算机系统', en: 'UltraMIPS — FPGA Dual-Issue Computer System' },
  'works.w2.m':   { zh: 'FPGA · MIPS32 · 六级流水 · 一等奖', en: 'FPGA · MIPS32 · 6-STAGE PIPELINE · 1ST PRIZE' },
  'works.w2.d':   {
    zh: '顺序双发射六级流水 CPU，含全流水 Cache 与动态分支预测（90.6% 命中），系统能力大赛全国一等奖（2/31）。',
    en: 'Dual-issue 6-stage pipelined CPU with fully pipelined Cache and dynamic branch prediction (90.6% accuracy). National First Prize (2/31).',
  },
  'works.w3.t':   { zh: '出租车机场载客线性决策模型', en: 'Taxi Dispatch Decision Model for Airport Pickup' },
  'works.w3.m':   { zh: 'MATLAB · 统计决策 · 国二', en: 'MATLAB · STATISTICAL DECISION · NATIONAL 2ND PRIZE' },
  'works.w3.d':   {
    zh: '面向深圳宝安国际机场，综合航班信息与收益期望建模司机决策，并优化上车点布局与短途优先权方案。',
    en: 'Models taxi drivers\' decisions at Shenzhen Bao\'an International Airport from flight arrivals and profit expectations, optimizing pickup layouts and short-trip priority schemes.',
  },
  'works.w4.t':   { zh: '基于 n-gram 的商品评价模型', en: 'n-gram Based Product Review Model' },
  'works.w4.m':   { zh: 'NLP · TEXT MINING · 美赛 M', en: 'NLP · TEXT MINING · MCM MERITORIOUS' },
  'works.w4.d':   {
    zh: '以 n-gram 与相关性分析提取亚马逊商品评价的关键特性，构建双线性回归方程预测产品口碑走势。',
    en: 'Extracts key product features from Amazon reviews via n-gram and correlation analysis, and predicts product reputation trends with a dual linear regression.',
  },
  'works.w5.t':   { zh: 'HITSZ 助手 — 智能校园信息平台', en: 'HITSZ Assistant — Smart Campus Platform' },
  'works.w5.m':   { zh: 'ANDROID · 问答系统 · 4200 用户', en: 'ANDROID · QA SYSTEM · 4,200 USERS' },
  'works.w5.d':   {
    zh: '端云结合的校园信息平台：课表、社区、智能问答与敏感内容检测，覆盖大部分哈深本科生，日活 2500。',
    en: 'An edge-cloud campus platform: timetable, community, intelligent Q&A and sensitive-content detection. 4,200 registered users, 2,500 DAU.',
  },
  'works.w6.t':   { zh: '「沙漠掘金」多情景最优决策模型', en: 'Gold-of-the-Desert Multi-Scenario Optimal Decision Model' },
  'works.w6.m':   { zh: '动态规划 · 博弈论 · 国二', en: 'DYNAMIC PROGRAMMING · GAME THEORY · NATIONAL 2ND PRIZE' },
  'works.w6.d':   {
    zh: '针对单人与多人在确定 / 概率天气下的路径决策，给出动态规划与混合 Nash 博弈模型，获国赛二等奖。',
    en: 'Dynamic programming and mixed-Nash game models for route decisions under certain / probabilistic weather, for single and multiple players. National Second Prize.',
  },
  'works.w7.t':   { zh: 'Rust 编译器不稳定特性研究', en: 'Demystifying Rust Unstable Feature Usage' },
  'works.w7.m':   { zh: 'ICSE (CCF-A) · 一作 · Rust', en: 'ICSE (CCF-A) · FIRST AUTHOR · RUST' },
  'works.w7.d':   {
    zh: '软件工程顶会 ICSE (CCF-A) 一作；自研生态解析器解析 248M 依赖（99% 正确率），发现至多 44% 生态受影响、12% 无法编译。',
    en: 'ICSE (CCF-A) first-author paper; custom parser analyzes 248M transitive deps (99% precision), revealing up to 44% ecosystem impact.',
  },
  'works.w8.t':   { zh: '基于 Rust 的系统搭建、防护与攻击', en: 'Building, Defending & Attacking Systems with Rust' },
  'works.w8.m':   { zh: 'RUST FOR LINUX · 跨语言安全 · 2021-2023', en: 'RUST FOR LINUX · CROSS-LANGUAGE SECURITY · 2021-2023' },
  'works.w8.d':   {
    zh: 'Rust for Linux 驱动框架、混合安全语言系统预研、C/C++ 与 Rust 交互的 ABI 安全检测工具。',
    en: 'Rust-for-Linux driver framework, hybrid memory-safe system prototyping, and ABI checker for C/C++ ↔ Rust interop security.',
  },
  'works.w9.t':   { zh: 'All-in-Cloud：云计算挑战与展望', en: 'All-in-Cloud: Challenges & Future of AiC' },
  'works.w9.m':   { zh: '综述论文 · 学术英语 · 2019', en: 'SURVEY PAPER · ACADEMIC ENGLISH · 2019' },
  'works.w9.d':   {
    zh: '云计算领域综述（约 8k 字），比较云计算与边缘计算，展望云上时代的挑战与机遇。',
    en: 'A ~8k-word cloud computing survey comparing cloud vs. edge computing and outlooking the cloud-native era.',
  },
  'works.w10.t':  { zh: 'HITSZ 通知新闻搜索引擎：Naive SE', en: 'Naive SE — Campus News Search Engine' },
  'works.w10.m':  { zh: 'LUCENE · IKANALYZER · TOMCAT', en: 'LUCENE · IKANALYZER · TOMCAT' },
  'works.w10.d':  {
    zh: '基于 Lucene / IKAnalyzer / Tomcat 的中文校园搜索引擎，信息检索课程项目。',
    en: 'A Chinese campus search engine built with Lucene / IKAnalyzer / Tomcat (Information Retrieval course project).',
  },
  'works.w11.t':  { zh: 'MIT xv6 6.S081 实验（2019）', en: 'MIT xv6 6.S081 Labs (2019)' },
  'works.w11.m':  { zh: '操作系统 · 独立完成 1-9', en: 'OPERATING SYSTEMS · LABS 1-9' },
  'works.w11.d':  {
    zh: '独立完成 MIT 操作系统实验 1-9（Utilities / Shell / Lazy / CoW / Lock / Mmap 等）。',
    en: 'Independently completed MIT OS labs 1–9 (Utilities, Shell, Lazy, CoW, Lock, Mmap, …).',
  },
  'works.w12.t':  { zh: '计算机网络全协议栈实验', en: 'Full Network Protocol-Stack Labs' },
  'works.w12.m':  { zh: 'VLAN · RIP · NAT · SOCKET', en: 'VLAN · RIP · NAT · SOCKET' },
  'works.w12.d':  {
    zh: 'VLAN / RIP / NAT 配置、以太帧抓包解析与 Socket 编程，覆盖 ETH / ARP / IP / ICMP / UDP 全栈。',
    en: 'VLAN/RIP/NAT configuration, Ethernet frame analysis and socket programming across ETH/ARP/IP/ICMP/UDP.',
  },

  /* ---------- 博客页 ---------- */
  'blog.kicker':  { zh: 'BLOG / NOTES', en: 'BLOG / NOTES' },
  'blog.title':   { zh: '博客集合', en: 'Blog & Notes' },
  'blog.notion.title': { zh: '最新写作 · 已迁移至 Notion', en: 'Latest Writing · Now on Notion' },
  'blog.notion.desc':  { zh: '我的最新博客已迁移到 Notion，点击前往阅读。下方为 2018–2021 年的历史存档。', en: 'My latest writing has moved to Notion — tap to visit. Below is the 2018–2021 archive.' },
  'blog.notion.cta':   { zh: '前往 Notion →', en: 'Visit Notion →' },
  'blog.archive':      { zh: '文章存档', en: 'Archive' },
  'blog.all':     { zh: '全部', en: 'All' },
  'blog.cat.all': { zh: '全部', en: 'All' },
  'blog.cat.travel': { zh: '路书', en: 'Travel Guides' },
  'blog.cat.poem':   { zh: '诗与文章', en: 'Poetry & Essays' },
  'blog.cat.thought':{ zh: '感想', en: 'Reflections' },
  'blog.cat.misc':   { zh: '杂记', en: 'Miscellany' },
  'blog.unknown.date': { zh: '日期不详', en: 'Date unknown' },
  'blog.empty':   { zh: 'EMPTY — 该分类暂无文章。', en: 'EMPTY — Nothing in this category yet.' },
  'blog.loadfail':{ zh: 'POSTS_LOAD_FAILED — 请稍后重试。', en: 'POSTS_LOAD_FAILED — please retry later.' },
};

const LANG_KEY = 'loancold.lang';

export function getLang() {
  const saved = (() => { try { return localStorage.getItem(LANG_KEY); } catch (_) { return null; } })();
  if (saved === 'zh' || saved === 'en') return saved;
  return (navigator.language || 'zh').toLowerCase().startsWith('zh') ? 'zh' : 'en';
}

export function t(key, lang = getLang()) {
  const entry = DICT[key];
  if (!entry) return key;
  return entry[lang] || entry.zh;
}

export function setLang(lang) {
  if (!DICT && lang !== 'zh' && lang !== 'en') return;
  document.documentElement.setAttribute('lang', lang === 'en' ? 'en' : 'zh-CN');
  try { localStorage.setItem(LANG_KEY, lang); } catch (_) { /* ignore */ }
  applyI18n();
  window.dispatchEvent(new CustomEvent('lang:change', { detail: lang }));
}

/* 批量应用：所有 [data-i18n] 元素按当前语言以 innerHTML 替换 */
export function applyI18n(root = document) {
  const lang = getLang();
  root.querySelectorAll('[data-i18n]').forEach((el) => {
    const val = t(el.dataset.i18n, lang);
    if (val !== undefined) el.innerHTML = val;
  });
}
