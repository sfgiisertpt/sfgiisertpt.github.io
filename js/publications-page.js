/**
 * Publications page – parses all_publications.bib, renders a filterable /
 * searchable timeline, and shows a detail modal on click.
 */

// ---------------------------------------------------------------------------
// BibTeX parser (handles multi-line abstract fields with nested braces)
// ---------------------------------------------------------------------------

function parseBibTeX(bibText) {
    const entries = [];
    // Match each entry: @TYPE{KEY, ... }
    // We need to handle nested braces, so use a manual approach
    let pos = 0;
    while (pos < bibText.length) {
        const atIdx = bibText.indexOf('@', pos);
        if (atIdx === -1) break;

        // Get type
        const braceOpen = bibText.indexOf('{', atIdx);
        if (braceOpen === -1) break;
        const type = bibText.substring(atIdx + 1, braceOpen).trim().toLowerCase();

        // Get key (up to first comma)
        const commaIdx = bibText.indexOf(',', braceOpen);
        if (commaIdx === -1) break;
        const id = bibText.substring(braceOpen + 1, commaIdx).trim();

        // Find matching closing brace (handle nesting)
        let depth = 1;
        let i = braceOpen + 1;
        while (i < bibText.length && depth > 0) {
            if (bibText[i] === '{') depth++;
            else if (bibText[i] === '}') depth--;
            i++;
        }
        const bodyEnd = i - 1; // position of closing brace
        const fieldsString = bibText.substring(commaIdx + 1, bodyEnd);

        const entry = { type, id };

        // Parse fields – handle nested braces in values
        const fieldRegex = /\b([a-zA-Z][a-zA-Z0-9_]*)\s*=\s*/g;
        let fieldMatch;
        const fieldPositions = [];
        while ((fieldMatch = fieldRegex.exec(fieldsString)) !== null) {
            fieldPositions.push({
                key: fieldMatch[1].toLowerCase(),
                valueStart: fieldMatch.index + fieldMatch[0].length
            });
        }

        for (let fi = 0; fi < fieldPositions.length; fi++) {
            const fp = fieldPositions[fi];
            const vs = fp.valueStart;
            let value = '';
            const ch = fieldsString[vs];

            if (ch === '{') {
                // Brace-delimited: find matching }
                let bd = 1;
                let vi = vs + 1;
                while (vi < fieldsString.length && bd > 0) {
                    if (fieldsString[vi] === '{') bd++;
                    else if (fieldsString[vi] === '}') bd--;
                    vi++;
                }
                value = fieldsString.substring(vs + 1, vi - 1);
            } else if (ch === '"') {
                const endQ = fieldsString.indexOf('"', vs + 1);
                value = fieldsString.substring(vs + 1, endQ);
            } else {
                // Bare value (number or macro) – up to next comma or end
                const nextEnd = fi + 1 < fieldPositions.length
                    ? fieldsString.lastIndexOf(',', fieldPositions[fi + 1].valueStart)
                    : fieldsString.length;
                value = fieldsString.substring(vs, nextEnd).replace(/,\s*$/, '');
            }

            // Clean up value
            value = value
                .replace(/^\{|\}$/g, '')
                .replace(/\n/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();

            entry[fp.key] = value;
        }

        entries.push(entry);
        pos = bodyEnd + 1;
    }

    // Sort by year descending, then by month
    const monthOrder = {
        jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
        jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12
    };
    entries.sort((a, b) => {
        const yDiff = (parseInt(b.year) || 0) - (parseInt(a.year) || 0);
        if (yDiff !== 0) return yDiff;
        return (monthOrder[b.month] || 0) - (monthOrder[a.month] || 0);
    });

    return entries;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MONTH_NAMES = {
    jan: 'January', feb: 'February', mar: 'March', apr: 'April',
    may: 'May', jun: 'June', jul: 'July', aug: 'August',
    sep: 'September', oct: 'October', nov: 'November', dec: 'December'
};

function formatAuthors(authorString) {
    if (!authorString) return '';
    const authors = authorString.split(/\s+and\s+/i);
    return authors.map(author => {
        author = author.trim();
        // Remove LaTeX commands but keep the text
        author = cleanLaTeX(author);
        if (author.includes(',')) {
            const parts = author.split(',');
            const last = parts[0].trim();
            const first = parts[1] ? parts[1].trim() : '';
            return `${first} ${last}`.trim();
        }
        return author;
    }).join(', ');
}

function formatAuthorsShort(authorString) {
    if (!authorString) return '';
    const authors = authorString.split(/\s+and\s+/i);
    const formatted = authors.slice(0, 3).map(author => {
        author = author.trim();
        author = cleanLaTeX(author);
        if (author.includes(',')) {
            const parts = author.split(',');
            const last = parts[0].trim();
            const initials = parts[1]
                ? parts[1].trim().split(/\s+/).map(p => p.replace(/[^A-Za-z]/g, '').charAt(0)).filter(Boolean).map(c => c + '.').join(' ')
                : '';
            return `${initials} ${last}`.trim();
        }
        const words = author.split(/\s+/);
        const last = words.pop();
        return `${words.map(w => w.charAt(0) + '.').join(' ')} ${last}`.trim();
    });
    if (authors.length > 3) formatted.push('et al.');
    return formatted.join(', ');
}

function cleanLaTeX(text) {
    if (!text) return '';
    return text
        .replace(/\{\\['`^~"=.uvHtcdb]\{?([a-zA-Z])\}?\}/g, '$1')  // accented characters
        .replace(/\\['`^~"=.uvHtcdb]\{?([a-zA-Z])\}?/g, '$1')
        .replace(/\{\\([a-zA-Z]+)\s*/g, '')        // remove command blocks
        .replace(/\\ensuremath\{[^}]*\}/g, '')
        .replace(/\\texttimes/g, '×')
        .replace(/\\textperiodcentered/g, '·')
        .replace(/\\textasciitilde/g, '~')
        .replace(/\\textrightarrow/g, '→')
        .replace(/\\textendash/g, '–')
        .replace(/\\raisebox\{[^}]*\}/g, '')
        .replace(/\$[^$]*\$/g, '')                  // inline math
        .replace(/\{|\}/g, '')                       // leftover braces
        .replace(/\\\\/g, '')
        .replace(/\\&/g, '&')
        .replace(/\\/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Clean title/abstract for display – preserves $...$ math for KaTeX rendering.
 * Converts BibTeX-specific LaTeX constructs to standard LaTeX that KaTeX can handle.
 */
function cleanForDisplay(text) {
    if (!text) return '';
    let res = text.replace(/^\{|\}$/g, '');
    
    // 1. Remove \ensuremath{} wrapper but keep its contents
    res = res.replace(/\\ensuremath\{([^}]*)\}/g, '$1');
    
    // 2. Process text outside of math mode
    let parts = res.split('$');
    for (let i = 0; i < parts.length; i += 2) {
        let part = parts[i];
        
        // Convert accented characters to plain text
        part = part.replace(/\{\\['`^~"=.uvHtcdb]\{?([a-zA-Z])\}?\}/g, '$1');
        part = part.replace(/\\['`^~"=.uvHtcdb]\{?([a-zA-Z])\}?/g, '$1');
        
        // Wrap bare LaTeX math macros in $...$
        part = part.replace(/(\\(?!text[a-zA-Z]+)[a-zA-Z]+)/g, '$$$1$$');
        
        // Text-mode commands -> unicode
        part = part
            .replace(/\\texttimes/g, '×')
            .replace(/\\textperiodcentered/g, '·')
            .replace(/\\textasciitilde/g, '~')
            .replace(/\\textrightarrow/g, '→')
            .replace(/\\textendash/g, '–')
            .replace(/\\raisebox\{[^}]*\}/g, '');
            
        // Clean braces outside math
        part = part.replace(/\{|\}/g, '');
        
        parts[i] = part;
    }
    res = parts.join('$');
    
    // 3. Merge adjacent math blocks (e.g., $\alpha$$_{Q}$ -> $\alpha_{Q}$)
    // This also cleans up any empty $$ created by wrapping
    res = res.replace(/\$\$/g, '');
    
    // Other cleanups
    res = res
        .replace(/\\&/g, '&')
        .replace(/─/g, '–')
        .replace(/\s+/g, ' ')
        .trim();
        
    return res;
}

function cleanTitle(title) {
    if (!title) return 'Untitled';
    return cleanForDisplay(title);
}

function cleanAbstract(abstract) {
    if (!abstract) return '';
    return cleanForDisplay(abstract);
}

/**
 * Trigger KaTeX auto-render on a container or the whole page.
 * Called after inserting content with LaTeX math.
 */
function renderMath(element) {
    if (typeof renderMathInElement === 'function') {
        renderMathInElement(element || document.body, {
            delimiters: [
                { left: '$$', right: '$$', display: true },
                { left: '$', right: '$', display: false }
            ],
            throwOnError: false,
            trust: true
        });
    }
}

function getJournalName(pub) {
    const raw = pub.journal || pub.booktitle || '';
    // Map common ADS journal macros
    const macros = {
        '\\apj': 'The Astrophysical Journal',
        '\\mnras': 'Monthly Notices of the Royal Astronomical Society',
        '\\aap': 'Astronomy & Astrophysics',
        '\\aj': 'The Astronomical Journal',
        '\\prc': 'Physical Review C',
        '\\pra': 'Physical Review A',
        '\\nat': 'Nature',
        '\\apjl': 'The Astrophysical Journal Letters',
        '\\apjs': 'The Astrophysical Journal Supplement Series',
        '\\pasp': 'Publications of the Astronomical Society of the Pacific',
    };
    const cleaned = raw.trim().replace(/\{|\}/g, '');
    return macros[cleaned] || cleanLaTeX(cleaned) || '';
}

function getTypeLabel(type) {
    const labels = {
        article: 'Journal Article',
        inproceedings: 'Conference Proceeding',
        misc: 'Miscellaneous',
        dataset: 'Dataset',
        phdthesis: 'PhD Thesis',
        mastersthesis: 'Master\'s Thesis',
        book: 'Book',
        incollection: 'Book Chapter'
    };
    return labels[type] || type.charAt(0).toUpperCase() + type.slice(1);
}

function getTypeIcon(type) {
    switch (type) {
        case 'article':
            return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`;
        case 'inproceedings':
            return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>`;
        case 'dataset':
            return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>`;
        default:
            return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
    }
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

let allPublications = [];
let currentFilter = 'all';
let currentSearch = '';

function renderTimeline(pubs) {
    const container = document.getElementById('pub-timeline');
    if (!container) return;
    container.innerHTML = '';

    // Group by year
    const byYear = {};
    pubs.forEach(pub => {
        const y = pub.year || 'Unknown';
        if (!byYear[y]) byYear[y] = [];
        byYear[y].push(pub);
    });

    const years = Object.keys(byYear).sort((a, b) => parseInt(b) - parseInt(a));

    if (years.length === 0) {
        container.innerHTML = `
            <div class="pub-empty">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" stroke-width="1.5">
                    <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
                </svg>
                <p>No publications found matching your criteria.</p>
            </div>`;
        return;
    }

    years.forEach(year => {
        const yearBlock = document.createElement('div');
        yearBlock.className = 'pub-year-block';

        yearBlock.innerHTML = `
            <div class="pub-year-marker">
                <span class="pub-year-label">${year}</span>
                <span class="pub-year-count">${byYear[year].length} publication${byYear[year].length > 1 ? 's' : ''}</span>
            </div>
        `;

        const list = document.createElement('div');
        list.className = 'pub-year-list';

        byYear[year].forEach((pub, index) => {
            const card = createPublicationCard(pub, index);
            list.appendChild(card);
        });

        yearBlock.appendChild(list);
        container.appendChild(yearBlock);
    });

    // Trigger entrance animations
    requestAnimationFrame(() => {
        const cards = container.querySelectorAll('.pub-card');
        cards.forEach((card, i) => {
            setTimeout(() => card.classList.add('visible'), i * 50);
        });
    });

    updateStats(pubs);

    // Render LaTeX math in titles via KaTeX
    renderMath(container);
}

function createPublicationCard(pub, index) {
    const card = document.createElement('div');
    card.className = 'pub-card';
    card.dataset.index = index;

    const title = cleanTitle(pub.title);
    const authors = formatAuthorsShort(pub.author);
    const journal = getJournalName(pub);
    const month = MONTH_NAMES[pub.month] || '';
    const volume = pub.volume || '';
    const typeLabel = getTypeLabel(pub.type);
    const typeIcon = getTypeIcon(pub.type);
    const hasAbstract = !!pub.abstract;

    let metaParts = [];
    if (journal) metaParts.push(`<span class="pub-card-journal">${journal}</span>`);
    if (volume) metaParts.push(`Vol. ${volume}`);
    if (month) metaParts.push(month);

    card.innerHTML = `
        <div class="pub-card-header">
            <div class="pub-card-type" title="${typeLabel}">${typeIcon}<span>${typeLabel}</span></div>
            ${pub.eprint ? '<span class="pub-card-arxiv-badge">arXiv</span>' : ''}
        </div>
        <h3 class="pub-card-title">${title}</h3>
        <p class="pub-card-authors">${authors}</p>
        <div class="pub-card-meta">${metaParts.join(' · ')}</div>
        <div class="pub-card-footer">
            <span class="pub-card-more">${hasAbstract ? 'View details →' : 'View info →'}</span>
        </div>
    `;

    card.addEventListener('click', (e) => {
        // Don't open modal if clicking a link
        if (e.target.closest('a')) return;
        openPublicationModal(pub);
    });

    return card;
}

function openPublicationModal(pub) {
    const overlay = document.getElementById('pub-modal-overlay');
    const body = document.getElementById('pub-modal-body');
    if (!overlay || !body) return;

    const title = cleanTitle(pub.title);
    const authors = formatAuthors(pub.author);
    const journal = getJournalName(pub);
    const abstract = cleanAbstract(pub.abstract);
    const month = MONTH_NAMES[pub.month] || '';
    const year = pub.year || '';
    const volume = pub.volume || '';
    const pages = pub.pages || '';
    const typeLabel = getTypeLabel(pub.type);
    const keywords = pub.keywords ? cleanLaTeX(pub.keywords) : '';

    // Build link buttons
    let links = '';
    if (pub.doi) {
        links += `<a href="https://doi.org/${pub.doi}" target="_blank" rel="noopener noreferrer" class="pub-modal-link pub-modal-link-journal">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            Journal / DOI
        </a>`;
    }
    if (pub.eprint) {
        links += `<a href="https://arxiv.org/abs/${pub.eprint}" target="_blank" rel="noopener noreferrer" class="pub-modal-link pub-modal-link-arxiv">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            arXiv:${pub.eprint}
        </a>`;
    }
    if (pub.adsurl) {
        links += `<a href="${pub.adsurl}" target="_blank" rel="noopener noreferrer" class="pub-modal-link pub-modal-link-ads">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            NASA ADS
        </a>`;
    }

    // Build metadata
    let metaRows = '';
    if (journal) metaRows += `<div class="pub-modal-meta-row"><span class="pub-modal-meta-label">Journal</span><span class="pub-modal-meta-value">${journal}</span></div>`;
    if (year) metaRows += `<div class="pub-modal-meta-row"><span class="pub-modal-meta-label">Published</span><span class="pub-modal-meta-value">${month ? month + ' ' : ''}${year}</span></div>`;
    if (volume) metaRows += `<div class="pub-modal-meta-row"><span class="pub-modal-meta-label">Volume</span><span class="pub-modal-meta-value">${volume}${pages ? ', pp. ' + pages : ''}</span></div>`;
    metaRows += `<div class="pub-modal-meta-row"><span class="pub-modal-meta-label">Type</span><span class="pub-modal-meta-value">${typeLabel}</span></div>`;

    body.innerHTML = `
        <div class="pub-modal-header">
            <h2 class="pub-modal-title">${title}</h2>
            <p class="pub-modal-authors">${authors}</p>
        </div>
        <div class="pub-modal-links">${links}</div>
        <div class="pub-modal-metadata">${metaRows}</div>
        ${abstract ? `
        <div class="pub-modal-abstract">
            <h4>Abstract</h4>
            <p>${abstract}</p>
        </div>` : ''}
        ${keywords ? `
        <div class="pub-modal-keywords">
            <h4>Keywords</h4>
            <div class="pub-modal-keyword-tags">
                ${keywords.split(',').map(k => `<span class="pub-keyword-tag">${k.trim()}</span>`).join('')}
            </div>
        </div>` : ''}
    `;

    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Render LaTeX math in modal content via KaTeX
    renderMath(body);
}

function closePublicationModal() {
    const overlay = document.getElementById('pub-modal-overlay');
    if (overlay) {
        overlay.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

function updateStats(pubs) {
    const statsEl = document.getElementById('pub-stats');
    if (!statsEl) return;
    const total = pubs.length;
    const articles = pubs.filter(p => p.type === 'article').length;
    statsEl.innerHTML = `Showing <strong>${total}</strong> publication${total !== 1 ? 's' : ''}${articles !== total ? ` (${articles} journal article${articles !== 1 ? 's' : ''})` : ''}`;
}

// ---------------------------------------------------------------------------
// Filtering & Search
// ---------------------------------------------------------------------------

function applyFilters() {
    let filtered = [...allPublications];

    // Type filter
    if (currentFilter !== 'all') {
        if (currentFilter === 'misc') {
            filtered = filtered.filter(p => !['article', 'inproceedings'].includes(p.type));
        } else {
            filtered = filtered.filter(p => p.type === currentFilter);
        }
    }

    // Search
    if (currentSearch) {
        const q = currentSearch.toLowerCase();
        filtered = filtered.filter(p => {
            const title = (p.title || '').toLowerCase();
            const author = (p.author || '').toLowerCase();
            const keywords = (p.keywords || '').toLowerCase();
            const journal = (p.journal || '').toLowerCase();
            const abstract = (p.abstract || '').toLowerCase();
            return title.includes(q) || author.includes(q) || keywords.includes(q) || journal.includes(q) || abstract.includes(q);
        });
    }

    renderTimeline(filtered);
}

// ---------------------------------------------------------------------------
// Initialization
// ---------------------------------------------------------------------------

export async function initPublicationsPage() {
    const container = document.getElementById('pub-timeline');
    if (!container) return; // Not on publications page

    try {
        const isInPagesDir = window.location.pathname.includes('/pages/');
        const baseDir = isInPagesDir ? '../' : './';
        const response = await fetch(`${baseDir}data/publications/all_publications.bib`);
        if (!response.ok) throw new Error('Failed to fetch publications');
        const bibText = await response.text();

        allPublications = parseBibTeX(bibText);
        renderTimeline(allPublications);

        // Set up filter buttons
        document.querySelectorAll('.pub-filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.pub-filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentFilter = btn.dataset.filter;
                applyFilters();
            });
        });

        // Set up search
        const searchInput = document.getElementById('pub-search');
        if (searchInput) {
            let debounce;
            searchInput.addEventListener('input', () => {
                clearTimeout(debounce);
                debounce = setTimeout(() => {
                    currentSearch = searchInput.value.trim();
                    applyFilters();
                }, 250);
            });
        }

        // Modal close handlers
        document.getElementById('pub-modal-close')?.addEventListener('click', closePublicationModal);
        document.getElementById('pub-modal-overlay')?.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) closePublicationModal();
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closePublicationModal();
        });

    } catch (error) {
        console.error('Error loading publications:', error);
        if (container) {
            container.innerHTML = '<p style="text-align:center; color: var(--text-secondary);">Unable to load publications at this time.</p>';
        }
    }
}
