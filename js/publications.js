export async function loadSelectedPublications() {
    try {
        const response = await fetch('./data/publications/selected_publications.bib');
        if (!response.ok) throw new Error('Failed to fetch publications');
        const bibText = await response.text();
        
        if (!bibText.trim()) {
            console.log("No publications found in selected_publications.bib");
            return; // Leave as is or render empty state
        }

        const publications = parseBibTeX(bibText);
        renderPublications(publications);
    } catch (error) {
        console.error('Error loading publications:', error);
    }
}

function parseBibTeX(bibText) {
    const entries = [];
    const entryRegex = /@([a-zA-Z]+)\s*\{\s*([^,]+),([^@]*)\}/g;
    let match;
    
    while ((match = entryRegex.exec(bibText)) !== null) {
        const type = match[1].toLowerCase();
        const id = match[2].trim();
        let fieldsString = match[3];
        
        const entry = { type, id };
        
        // Remove trailing comma and whitespace
        fieldsString = fieldsString.replace(/,\s*$/, '');
        
        const fieldRegex = /([a-zA-Z0-9_]+)\s*=\s*(?:\{([^}]*)\}|"([^"]*)"|([^,]*))/g;
        let fieldMatch;
        
        while ((fieldMatch = fieldRegex.exec(fieldsString)) !== null) {
            const key = fieldMatch[1].toLowerCase();
            let value = fieldMatch[2] || fieldMatch[3] || fieldMatch[4];
            if (value) {
                value = value.trim().replace(/^\{|\}$/g, '').replace(/\n/g, ' ').replace(/\s+/g, ' ');
                entry[key] = value;
            }
        }
        
        entries.push(entry);
    }
    
    return entries.sort((a, b) => (b.year || 0) - (a.year || 0));
}

function formatAuthors(authorString) {
    // Replace " and " with ", "
    const authors = authorString.split(/\s+and\s+/i);
    return authors.map(author => {
        author = author.trim();
        if (author.includes(',')) {
            const parts = author.split(',');
            const last = parts[0].trim();
            const first = parts[1] ? parts[1].trim() : '';
            return `${last} ${first ? first.charAt(0) + '.' : ''}`.trim();
        } else {
            const parts = author.split(' ');
            const last = parts.pop();
            const firstInitials = parts.map(p => p.charAt(0) + '.').join(' ');
            return `${last} ${firstInitials}`.trim();
        }
    }).join(', ');
}

function renderPublications(publications) {
    const container = document.querySelector('#publications .publications-list');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (publications.length === 0) {
        container.innerHTML = '<p>No selected publications to display yet.</p>';
        return;
    }
    
    publications.forEach((pub, index) => {
        const year = pub.year || '';
        const title = pub.title || 'Untitled';
        const journal = pub.journal || pub.booktitle || '';
        const author = pub.author ? formatAuthors(pub.author) : '';
        
        const delay = index * 100;
        
        const pubHTML = `
            <div class="publication-item" data-delay="${delay}">
                <span class="pub-year">${year}</span>
                <div class="pub-content">
                    <h4>${title}</h4>
                    <p>${journal ? `<span class="pub-journal">${journal}</span>` : ''}${journal && author ? ' · ' : ''}${author}</p>
                </div>
            </div>
        `;
        
        container.insertAdjacentHTML('beforeend', pubHTML);
    });
}
