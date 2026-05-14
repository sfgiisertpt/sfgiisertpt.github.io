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
    let pos = 0;

    while (pos < bibText.length) {
        // Find next @
        const atIndex = bibText.indexOf('@', pos);
        if (atIndex === -1) break;

        // Extract entry type
        const typeMatch = bibText.slice(atIndex).match(/^@([a-zA-Z]+)\s*\{/);
        if (!typeMatch) {
            pos = atIndex + 1;
            continue;
        }

        const type = typeMatch[1].toLowerCase();
        let bracePos = atIndex + typeMatch[0].length - 1;

        // Find matching closing brace
        let braceCount = 1;
        let fieldStart = bracePos + 1;
        bracePos++;

        while (bracePos < bibText.length && braceCount > 0) {
            const char = bibText[bracePos];
            if (char === '{' && bibText[bracePos - 1] !== '\\') braceCount++;
            else if (char === '}' && bibText[bracePos - 1] !== '\\') braceCount--;
            bracePos++;
        }

        const entryContent = bibText.slice(fieldStart, bracePos - 1);

        // Extract ID (first item before comma)
        const idMatch = entryContent.match(/^([^,]+),/);
        if (!idMatch) {
            pos = bracePos;
            continue;
        }

        const id = idMatch[1].trim();
        const fieldsString = entryContent.slice(idMatch[0].length);

        const entry = { type, id };

        // Parse fields - more robust handling of braces and quotes
        const fields = parseFields(fieldsString);
        Object.assign(entry, fields);

        entries.push(entry);
        pos = bracePos;
    }

    return entries.sort((a, b) => (b.year || 0) - (a.year || 0));
}

function parseFields(fieldsString) {
    const fields = {};
    let pos = 0;

    while (pos < fieldsString.length) {
        // Skip whitespace and commas
        while (pos < fieldsString.length && /[\s,]/.test(fieldsString[pos])) {
            pos++;
        }
        if (pos >= fieldsString.length) break;

        // Find field name
        const nameMatch = fieldsString.slice(pos).match(/^([a-zA-Z0-9_]+)\s*=/);
        if (!nameMatch) break;

        const key = nameMatch[1].toLowerCase();
        pos += nameMatch[0].length;

        // Skip whitespace
        while (pos < fieldsString.length && /\s/.test(fieldsString[pos])) {
            pos++;
        }

        // Extract value
        let value = '';
        if (fieldsString[pos] === '{') {
            // Brace-delimited value
            let braceCount = 1;
            pos++;
            const valueStart = pos;
            while (pos < fieldsString.length && braceCount > 0) {
                if (fieldsString[pos] === '{' && fieldsString[pos - 1] !== '\\') braceCount++;
                else if (fieldsString[pos] === '}' && fieldsString[pos - 1] !== '\\') braceCount--;
                if (braceCount > 0) pos++;
            }
            value = fieldsString.slice(valueStart, pos).trim();
            pos++; // Skip closing brace
        } else if (fieldsString[pos] === '"') {
            // Quote-delimited value
            pos++;
            const valueStart = pos;
            while (pos < fieldsString.length && fieldsString[pos] !== '"') {
                if (fieldsString[pos] === '\\') pos++;
                pos++;
            }
            value = fieldsString.slice(valueStart, pos).trim();
            pos++; // Skip closing quote
        } else {
            // Unquoted value (up to comma)
            const valueStart = pos;
            while (pos < fieldsString.length && fieldsString[pos] !== ',') {
                pos++;
            }
            value = fieldsString.slice(valueStart, pos).trim();
        }

        // Clean value
        if (value) {
            value = value.replace(/\n/g, ' ').replace(/\s+/g, ' ');
            fields[key] = value;
        }
    }

    return fields;
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
