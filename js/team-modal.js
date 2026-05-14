let interactionHandlersAttached = false;

function getBaseDir() {
    return window.location.pathname.includes('/pages/') ? '../' : './';
}

function normalizeText(value) {
    return typeof value === 'string' ? value : '';
}

function getInitials(member) {
    const provided = normalizeText(member.initials).trim();
    if (provided) {
        return provided;
    }

    const words = normalizeText(member.name).trim().split(/\s+/).filter(Boolean);
    if (!words.length) {
        return '';
    }

    return words.slice(0, 2).map((word) => word[0].toUpperCase()).join('');
}

function createAvatarElement(member, className) {
    const baseDir = getBaseDir();
    const photo = normalizeText(member.photo).trim();
    const initials = getInitials(member);
    const photoPath = photo ? `${baseDir}${photo}` : null;

    let html = '';
    if (photoPath) {
        html = `<img src="${photoPath}" alt="${normalizeText(member.name)}" class="${className}--image">`;
    } else {
        html = `${initials}`;
    }

    return html;
}

function getSocialIcon(label) {
    const fontSize = label.length > 1 ? 8.5 : 12;
    return `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><text x="12" y="15.5" text-anchor="middle" dominant-baseline="middle" font-size="${fontSize}" font-weight="700">${label}</text></svg>`;
}

function createSocialLinks(links = {}, className) {
    const socialItems = [
        { key: 'website', label: 'LO', title: 'Lorem ipsum' },
        { key: 'scholar', label: 'IP', title: 'Dolor sit amet' },
        { key: 'ads', label: 'DO', title: 'Consectetur adipiscing' },
        { key: 'orcid', label: 'SI', title: 'Sed do eiusmod' }
    ];

    return socialItems.map((item) => {
        const href = normalizeText(links[item.key]).trim();
        if (!href) {
            return '';
        }

        return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="${className}" title="${item.title}">${getSocialIcon(item.label)}</a>`;
    }).join('');
}

function createMemberCard(member, modalId) {
    const card = document.createElement('div');
    card.className = 'team-member-card';
    card.dataset.modal = modalId;

    const memberName = normalizeText(member.name);
    const role = normalizeText(member.role);
    const batch = normalizeText(member.batch);
    const avatar = createAvatarElement(member, 'team-member-avatar-closed');
    const socials = createSocialLinks(member.links, 'team-social-link');

    card.innerHTML = `
        <div class="team-member-closed">
            <div class="team-member-avatar-closed">${avatar}</div>
            <h3>${memberName}</h3>
            <p>${role}</p>
            <p class="team-member-batch">${batch}</p>
            <div class="team-member-socials">${socials}</div>
        </div>
    `;

    return card;
}

function createMemberModal(member, modalId) {
    const wrapper = document.createElement('div');
    wrapper.id = modalId;
    wrapper.className = 'team-modal-overlay';

    const modalName = normalizeText(member.modalName || member.name);
    const role = normalizeText(member.role);
    const batch = normalizeText(member.batch);
    const about = normalizeText(member.about);
    const researchInterests = normalizeText(member.researchInterests);
    const avatar = createAvatarElement(member, 'team-modal-avatar');
    const socials = createSocialLinks(member.links, 'team-modal-social-link');

    wrapper.innerHTML = `
        <div class="team-modal">
            <button class="team-modal-close" type="button">&times;</button>
            <div class="team-modal-left">
                <div class="team-modal-avatar">${avatar}</div>
                <h2 class="team-modal-name">${modalName}</h2>
                <p class="team-modal-batch">${role}${role && batch ? ' (' : ''}${batch}${role && batch ? ')' : ''}</p>
                <div class="team-modal-socials">${socials}</div>
            </div>
            <div class="team-modal-right">
                <div>
                    <h4>About</h4>
                    <p>${about}</p>
                </div>
                <div>
                    <h4>Research Interests</h4>
                    <p>${researchInterests}</p>
                </div>
            </div>
        </div>
    `;

    return wrapper;
}

function renderPIProfile(piData) {
    const piContainer = document.getElementById('pi-profile');
    if (!piContainer) {
        return;
    }

    const name = normalizeText(piData.name);
    const role = normalizeText(piData.role);
    const summary = normalizeText(piData.summary);
    const researchInterests = normalizeText(piData.researchInterests);
    const avatar = createAvatarElement(piData, 'pi-avatar');
    const socials = createSocialLinks(piData.links, 'pi-social-link');

    piContainer.innerHTML = `
        <div class="pi-photo">
            <div class="pi-avatar">${avatar}</div>
            <h3 class="pi-name">${name}</h3>
            <p class="pi-role">${role}</p>
            <div class="pi-socials">${socials}</div>
        </div>
        <div class="pi-summary">
            <p>${summary}</p>
            <p style="margin-top: 1rem;"><strong>Lorem Ipsum:</strong> ${researchInterests}</p>
        </div>
    `;
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) {
        return;
    }

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal(modal) {
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
}

function attachModalHandlers() {
    if (interactionHandlersAttached) {
        return;
    }

    document.addEventListener('click', (event) => {
        const socialLink = event.target.closest('.team-social-link, .team-modal-social-link, .pi-social-link');
        if (socialLink) {
            event.stopPropagation();
            return;
        }

        const card = event.target.closest('.team-member-card');
        if (card && card.dataset.modal) {
            openModal(card.dataset.modal);
            return;
        }

        const closeBtn = event.target.closest('.team-modal-close');
        if (closeBtn) {
            const modal = closeBtn.closest('.team-modal-overlay');
            if (modal) {
                closeModal(modal);
            }
            return;
        }

        if (event.target.classList.contains('team-modal-overlay')) {
            closeModal(event.target);
        }
    });

    interactionHandlersAttached = true;
}

async function fetchJson(path) {
    // Append a timestamp to prevent the browser from caching the JSON response
    const cacheBuster = new Date().getTime();
    const response = await fetch(`${path}?v=${cacheBuster}`, { cache: 'no-cache' });
    if (!response.ok) {
        throw new Error(`Failed to load ${path}`);
    }

    return response.json();
}

export async function initializeTeamModals() {
    const teamGrids = document.querySelectorAll('.team-member-grid[data-team-file]');
    const modalRoot = document.getElementById('team-modals');
    const piContainer = document.getElementById('pi-profile');

    if (!teamGrids.length && !piContainer) {
        return;
    }

    const baseDir = getBaseDir();

    if (piContainer) {
        try {
            const piData = await fetchJson(`${baseDir}data/team/pi.json`);
            renderPIProfile(piData);
        } catch (error) {
            console.error('Unable to load PI profile data:', error);
        }
    }

    if (modalRoot) {
        modalRoot.innerHTML = '';
    }

    for (const grid of teamGrids) {
        const fileName = grid.dataset.teamFile;
        if (!fileName) {
            continue;
        }

        try {
            const sectionData = await fetchJson(`${baseDir}data/team/${fileName}`);
            const members = Array.isArray(sectionData.members) ? sectionData.members : [];

            grid.innerHTML = '';

            members.forEach((member, index) => {
                const memberId = normalizeText(member.id) || `member-${index}`;
                const modalId = `modal-${memberId}`;
                const card = createMemberCard(member, modalId);
                grid.appendChild(card);

                if (modalRoot) {
                    modalRoot.appendChild(createMemberModal(member, modalId));
                }
            });
        } catch (error) {
            grid.innerHTML = '';
            console.error(`Unable to load team data for ${fileName}:`, error);
        }
    }

    attachModalHandlers();
}
