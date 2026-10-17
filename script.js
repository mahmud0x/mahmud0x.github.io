const toggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('#site-nav');
toggle?.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  toggle.setAttribute('aria-expanded', open);
});
nav?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => nav.classList.remove('open')));
document.querySelector('#year').textContent = new Date().getFullYear();

// Render every entry from the editable BibTeX source without a build step.
const publicationList = document.querySelector('#publication-list');
const clean = value => value.replace(/[{}]/g, '').replace(/\\&/g, '&').trim();
const escapeHtml = value => value.replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
const parseBibtex = source => [...source.matchAll(/@(\w+)\s*\{([^,]+),([\s\S]*?)\n\}/g)].map(match => {
  const fields = {};
  for (const field of match[3].matchAll(/(\w+)\s*=\s*\{([\s\S]*?)\}|(\w+)\s*=\s*"([\s\S]*?)"/g)) {
    fields[(field[1] || field[3]).toLowerCase()] = clean(field[2] || field[4]);
  }
  return { type: match[1].toLowerCase(), key: match[2].trim(), ...fields };
});
const authorText = authors => clean(authors || '').split(/\s+and\s+/i).map(author => author.trim()).join(' · ');
const linkFor = paper => paper.url || ((paper.journal || '').match(/arXiv:\S+/i) && `https://arxiv.org/abs/${(paper.journal.match(/arXiv:(\S+)/i) || [])[1]}`);
const renderPublications = papers => {
  publicationList.innerHTML = papers.sort((a, b) => (b.year || '').localeCompare(a.year || '')).map(paper => {
    const venue = paper.booktitle || paper.journal || paper.publisher || '';
    const link = linkFor(paper);
    return `<article class="paper"><span class="paper-year">${escapeHtml(paper.year || 'Publication')}${venue ? ` · ${escapeHtml(venue)}` : ''}</span><h3>${escapeHtml(clean(paper.title || paper.key))}</h3><p>${escapeHtml(authorText(paper.author))}</p>${link ? `<a href="${encodeURI(link)}" target="_blank" rel="noopener">Read paper ↗</a>` : '<span class="paper-status">Details coming soon</span>'}</article>`;
  }).join('');
};
if (publicationList) fetch('publications.bib').then(response => {
  if (!response.ok) throw new Error('Could not load publications.bib');
  return response.text();
}).then(source => renderPublications(parseBibtex(source))).catch(() => {
  publicationList.innerHTML = '<p class="loading">Publications could not be loaded. Please check publications.bib.</p>';
});
