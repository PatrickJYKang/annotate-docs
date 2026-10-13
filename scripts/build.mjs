// Builds the static user-guide site from content/<locale>.ts. Writes index.html (English) and the
// fr/, es/, zh-CN/ index pages. Videos come from scripts/encode-videos.mjs; chapter start times for
// the complete workflow are in data/chapters.json.
// Usage: node scripts/build.mjs
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const contentDir = path.join(root, 'content');
const LOCALES = ['en', 'fr', 'es', 'zh-CN'];
const content = {};
for (const locale of LOCALES) content[locale] = Object.values(await import(path.join(contentDir, `${locale}.ts`)))[0];
const chapters = JSON.parse(readFileSync(path.join(root, 'data/chapters.json'), 'utf8'));
const wordmarkPath = readFileSync(path.join(root, 'assets/wordmark.svg'), 'utf8').match(/<path[^>]* d="([^"]+)"/)[1];

const SITE_URL = 'https://patrickjykang.github.io/annotate-docs/';
const REPO = 'https://github.com/PatrickJYKang/annotate';
const TUTORIAL_ORDER = [
  'first-project', 'capture-tagging', 'clip-editing', 'clip-trimming', 'basic-tracking', 'tracking-correction',
  'tracking-refinements', 'pin-annotation', 'pin-animations', 'homography', 'presentation-authoring', 'export-recovery',
];

// Page chrome and the complete-workflow section, per language. The guide itself is in content/.
const SITE = {
  en: {
    name: 'English',
    workflowTitle: 'The complete workflow',
    workflowIntro: 'Every feature in one silent, captioned walkthrough of about 13 minutes, from a new project to a finished presentation. Choose a chapter to jump to it.',
    workflowLink: { label: 'Complete workflow', summary: 'Every feature in one 13-minute walkthrough.', keywords: 'walkthrough full complete whole video' },
    chapters: 'Chapters',
    download: 'Download',
    source: 'Source code',
    language: 'Language',
    skip: 'Skip to content',
  },
  fr: {
    name: 'Français',
    workflowTitle: 'Le parcours complet',
    workflowIntro: 'Toutes les fonctions en une seule démonstration muette et sous-titrée d’environ 13 minutes, d’un nouveau projet à une présentation terminée. Choisissez un chapitre pour y accéder.',
    workflowLink: { label: 'Parcours complet', summary: 'Toutes les fonctions en une démonstration de 13 minutes.', keywords: 'démonstration complète vidéo parcours' },
    chapters: 'Chapitres',
    download: 'Télécharger',
    source: 'Code source',
    language: 'Langue',
    skip: 'Aller au contenu',
  },
  es: {
    name: 'Español',
    workflowTitle: 'El flujo de trabajo completo',
    workflowIntro: 'Todas las funciones en una sola demostración sin sonido y con subtítulos, de unos 13 minutos, desde un proyecto nuevo hasta una presentación terminada. Elige un capítulo para ir a él.',
    workflowLink: { label: 'Flujo completo', summary: 'Todas las funciones en una demostración de 13 minutos.', keywords: 'demostración completa vídeo flujo' },
    chapters: 'Capítulos',
    download: 'Descargar',
    source: 'Código fuente',
    language: 'Idioma',
    skip: 'Ir al contenido',
  },
  'zh-CN': {
    name: '简体中文',
    workflowTitle: '完整工作流程',
    workflowIntro: '一段约 13 分钟的无声带字幕演示，涵盖全部功能，从新建项目到完成演示文稿。点击章节即可跳转。',
    workflowLink: { label: '完整工作流程', summary: '13 分钟演示全部功能。', keywords: '完整 演示 视频 流程' },
    chapters: '章节',
    download: '下载',
    source: '源代码',
    language: '语言',
    skip: '跳到正文',
  },
};

// English page only: on a first visit with no remembered choice, follow the browser language.
const LANGUAGE_REDIRECT = `(function () {
  let chosen = null;
  try { chosen = localStorage.getItem('annotate-docs-lang'); } catch {}
  if (chosen || location.hash) return;
  for (const raw of navigator.languages || [navigator.language]) {
    const l = String(raw).toLowerCase();
    if (l.startsWith('en')) return;
    if (l.startsWith('fr') || l.startsWith('es')) { location.replace(l.slice(0, 2) + '/'); return; }
    if (l.startsWith('zh')) { if (!/(tw|hk|mo|hant)/.test(l)) location.replace('zh-CN/'); return; }
  }
})();`;

const esc = (s) => String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
// The guide's inline markup: **bold** UI labels, `code`, and [text](url) links.
function rich(text) {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g).map((part) => {
    if (part.startsWith('**') && part.endsWith('**')) return `<strong>${esc(part.slice(2, -2))}</strong>`;
    if (part.startsWith('`') && part.endsWith('`')) return `<code>${esc(part.slice(1, -1))}</code>`;
    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) return `<a href="${esc(link[2])}">${esc(link[1])}</a>`;
    return esc(part);
  }).join('');
}
const prose = (paragraphs) => `<div class="prose">${paragraphs.map((p) => `<p>${rich(p)}</p>`).join('')}</div>`;
const section = (id, title, body, first = false) =>
  `<section id="${id}" class="section${first ? ' first' : ''}"><h2>${esc(title)}</h2>${body}</section>`;
const sub = (title) => `<h3 class="sub">${esc(title)}</h3>`;
const clock = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
const table = (headings, rows) => `<div class="table-wrap"><table><thead><tr>${headings.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${
  rows.map((row) => `<tr>${row.map((cell) => `<td>${esc(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;

function page(locale) {
  const c = content[locale];
  const s = SITE[locale];
  const up = locale === 'en' ? '' : '../';
  const media = (file) => `${up}videos/${locale}/${file}`;
  const num = (id) => String(TUTORIAL_ORDER.indexOf(id) + 1).padStart(2, '0');

  const video = (id) => {
    const t = c.tutorials[id];
    return `<figure id="video-${id}" class="tutorial">
<figcaption class="tutorial-head"><span>${esc(t.title)}</span><span class="tag">${esc(c.ui.video)} ${num(id)}</span></figcaption>
<video controls playsinline preload="none" width="1440" height="930" poster="${media(`${id}.jpg`)}" src="${media(`${id}.mp4`)}" aria-label="${esc(t.title)}"></video>
<p class="tutorial-desc">${esc(t.description)}</p>
</figure>`;
  };

  // Navigation: the complete workflow first, then the app's groups. Search also matches the English
  // labels and keywords, so English terms work on every page.
  const englishKeywords = new Map(content.en.groups.flatMap((g) => g.links).map((l) => [l.id, `${l.label} ${l.keywords}`]));
  englishKeywords.set('workflow', `${SITE.en.workflowLink.label} ${SITE.en.workflowLink.keywords}`);
  const groups = c.groups.map((g, i) => (i === 0 ? { ...g, links: [{ id: 'workflow', ...s.workflowLink }, ...g.links] } : g));
  const nav = groups.map((g) => `<div class="nav-group"><p class="nav-label">${esc(g.label)}</p>${g.links.map((l) =>
    `<a href="#${l.id}" data-search="${esc(`${l.label} ${l.summary} ${l.keywords} ${englishKeywords.get(l.id) ?? ''}`.toLowerCase())}"><span class="nav-title">${esc(l.label)}</span><span class="nav-summary">${esc(l.summary)}</span></a>`).join('')}</div>`).join('');
  const counts = Array.from({ length: 40 }, (_, n) => c.ui.resultCount(n));

  const languages = LOCALES.map((l) => {
    const href = l === 'en' ? `${up || './'}` : `${up}${l}/`;
    return `<a href="${href}" hreflang="${l}" lang="${l}" data-lang="${l}"${l === locale ? ' aria-current="page"' : ''}>${esc(SITE[l].name)}</a>`;
  }).join('');
  const alternates = LOCALES.map((l) => `<link rel="alternate" hreflang="${l}" href="${SITE_URL}${l === 'en' ? '' : `${l}/`}">`).join('\n');

  const { overview, firstProject, clipEditor, tracking, pins } = c;
  const starts = chapters[locale];
  const body = [
    section('workflow', s.workflowTitle, `<p class="intro">${esc(s.workflowIntro)}</p>
<div class="workflow">
<video id="workflow-video" controls playsinline preload="metadata" width="1440" height="930" poster="${media('full-workflow.jpg')}" src="${media('full-workflow.mp4')}" aria-label="${esc(s.workflowTitle)}"></video>
<div class="chapters"><p class="nav-label">${esc(s.chapters)}</p><ol>${TUTORIAL_ORDER.map((id, i) =>
  `<li><button type="button" data-t="${starts[i]}"><span class="time">${clock(starts[i])}</span><span>${esc(c.tutorials[id].title)}</span></button></li>`).join('')}</ol></div>
</div>`, true),
    section('orientation', overview.title, `${prose(overview.paragraphs)}<div class="cards">${overview.cards.map(([t, b]) => `<div><h3>${esc(t)}</h3><p>${esc(b)}</p></div>`).join('')}</div>`),
    section('videos', c.videos.title, `<p class="intro">${rich(c.videos.intro)}</p><ol class="index">${TUTORIAL_ORDER.map((id) =>
      `<li><a href="#video-${id}"><span class="tag">${num(id)}</span><span><span class="index-title">${esc(c.tutorials[id].title)}</span><span class="index-desc">${esc(c.tutorials[id].description)}</span></span></a></li>`).join('')}</ol>`),
    section('first-project', firstProject.title, `<p class="intro">${esc(firstProject.intro)}</p><ol class="steps">${firstProject.steps.map((step, i) =>
      `<li><span class="tag">${String(i + 1).padStart(2, '0')}</span><div><div class="step-head"><h3>${esc(step.title)}</h3><span class="tag">${esc(step.location)}</span></div><p>${rich(step.action)}</p><p class="result"><strong>${esc(c.ui.result)}</strong> ${esc(step.result)}</p></div></li>`).join('')}</ol>${video('first-project')}`),
    section('installation', c.installation.title, prose(c.installation.paragraphs)),
    section('capture', c.capture.title, prose(c.capture.paragraphs) + video('capture-tagging')),
    section('clip-editor', clipEditor.title, prose(clipEditor.paragraphs) + video('clip-editing') + sub(clipEditor.trimTitle)
      + prose([clipEditor.trim]) + video('clip-trimming') + sub(clipEditor.keyframeTitle)
      + `<ul class="list">${clipEditor.keyframeRules.map((r) => `<li>${rich(r)}</li>`).join('')}</ul>`),
    section('tracking', tracking.title, `<ol class="list">${tracking.steps.map((step) => `<li>${rich(step)}</li>`).join('')}</ol>` + video('basic-tracking')
      + sub(tracking.correctTitle) + prose(tracking.correct) + video('tracking-correction')
      + sub(tracking.namesTitle) + prose(tracking.names) + video('tracking-refinements')),
    section('pins', pins.title, prose(pins.paragraphs) + video('pin-annotation') + sub(pins.animateTitle) + prose(pins.animate) + video('pin-animations')),
    section('homography', c.homography.title, prose(c.homography.paragraphs) + video('homography')),
    section('presentations', c.presentations.title, prose(c.presentations.paragraphs) + video('presentation-authoring')),
    section('export-recovery', c.exportRecovery.title, prose(c.exportRecovery.paragraphs) + video('export-recovery')),
    section('workspace-map', c.workspaceMap.title, table(c.workspaceMap.headings, c.workspaceMap.rows)),
    section('drawing-tools', c.drawingTools.title, table(c.drawingTools.headings, c.drawingTools.rows) + prose([c.drawingTools.note])),
    section('keyboard', c.keyboard.title, table(c.keyboard.headings, c.keyboard.rows) + `<p class="note">${esc(c.keyboard.note)}</p>`),
    section('glossary', c.glossary.title, `<dl class="glossary">${c.glossary.entries.map(([t, d]) => `<div><dt>${esc(t)}</dt><dd>${esc(d)}</dd></div>`).join('')}</dl>`),
    section('project-files', c.projectFiles.title, prose(c.projectFiles.paragraphs)),
    section('troubleshooting', c.troubleshooting.title, `<div class="faq">${c.troubleshooting.entries.map(([q, a]) =>
      `<details><summary>${esc(q)}</summary><p>${rich(a)}</p></details>`).join('')}</div>`),
  ].join('\n');
  const onThisPage = [['workflow', s.workflowLink.label], ...c.onThisPage];

  return `<!doctype html>
<html lang="${locale}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(c.title)}</title>
<meta name="description" content="${esc(c.lede)}">
<meta property="og:title" content="${esc(c.title)}">
<meta property="og:description" content="${esc(c.lede)}">
<meta property="og:type" content="website">
<meta property="og:url" content="${SITE_URL}${locale === 'en' ? '' : `${locale}/`}">
<meta property="og:image" content="${SITE_URL}videos/${locale}/full-workflow.jpg">
<meta name="color-scheme" content="light dark">
${alternates}
<link rel="icon" href="${up}assets/favicon.ico" sizes="any">
<link rel="icon" href="${up}assets/icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="${up}assets/apple-touch-icon-180.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap">
<link rel="stylesheet" href="${up}assets/style.css">
<script>window.GUIDE = ${JSON.stringify({ locale, counts, noResults: c.ui.noResults })};</script>${locale === 'en' ? `
<script>${LANGUAGE_REDIRECT}</script>` : ''}
<script src="${up}assets/guide.js" defer></script>
</head>
<body>
<a class="skip" href="#content">${esc(s.skip)}</a>
<header class="topbar">
<a class="brand" href="${up || './'}" aria-label="Annotate"><svg viewBox="0 0 867.2 175.8" aria-hidden="true"><path fill="currentColor" d="${wordmarkPath}"/></svg></a>
<nav class="languages" aria-label="${esc(s.language)}">${languages}</nav>
<div class="links"><a href="${REPO}">${esc(s.source)}</a><a class="button" href="${REPO}/releases/latest">${esc(s.download)}</a></div>
</header>
<div class="layout">
<aside class="sidebar">
<div class="search"><label for="guide-search">${esc(c.ui.searchLabel)}</label><input id="guide-search" type="search" placeholder="${esc(c.ui.searchPlaceholder)}" autocomplete="off"></div>
<details class="nav-details" open><summary>${esc(c.ui.browseSections)}</summary>
<nav aria-label="${esc(c.ui.navigationLabel)}" class="nav"><p class="nav-count" hidden></p>${nav}</nav>
</details>
</aside>
<main id="content" class="article">
<header class="page-head"><h1>${esc(c.title)}</h1><p>${esc(c.lede)}</p></header>
${body}
</main>
<aside class="toc"><div><p class="nav-label">${esc(c.ui.onThisPage)}</p><nav aria-label="${esc(c.ui.onThisPage)}">${onThisPage.map(([id, label]) => `<a href="#${id}">${esc(label)}</a>`).join('')}</nav></div></aside>
</div>
</body>
</html>
`;
}

for (const locale of LOCALES) {
  const dir = locale === 'en' ? root : path.join(root, locale);
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, 'index.html'), page(locale));
  console.log(`${locale}: ${path.relative(root, path.join(dir, 'index.html'))}`);
}
