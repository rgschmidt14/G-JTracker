import { gameData, getItem, findLooseEnds, evolveItem, saveData } from './data.js';
import { getLevelGrade } from './utils.js';

let currentView = 'db'; // or a function reference

export function renderCurrentView() {
    switch (currentView) {
        case 'db':
            renderDBView();
            break;
        case 'notebook':
            renderNotebookView();
            break;
        case 'rpg':
            renderRPGView();
            break;
        case 'reference':
            renderReferenceView();
            break;
        default:
            renderDBView();
    }
}

function updateChecklist(charId, itemId, lvl, idx, checked) {
    const char = gameData.characters.find(c => c.id === charId);
    const charItem = char.items.find(i => i.id === itemId);
    if (!charItem.checklistProgress) charItem.checklistProgress = {};
    if (!charItem.checklistProgress[lvl]) charItem.checklistProgress[lvl] = [];
    charItem.checklistProgress[lvl][idx] = checked;

    // Check for level up
    const item = getItem(itemId);
    const checklist = item.checklists[charItem.level + 1] || [];
    const progress = charItem.checklistProgress[charItem.level + 1] || [];
    if (checklist.length > 0 && checklist.every((_, i) => progress[i])) {
        incrementLevel(itemId, charId);
    }

    saveData();
    renderCurrentView();
}

function getChecklistProgress(charId, itemId, lvl) {
    const char = gameData.characters.find(c => c.id === charId);
    const charItem = char?.items.find(i => i.id === itemId);
    return charItem?.checklistProgress?.[lvl] || [];
}

export function createItemCard(item, charId = null) {
    const card = document.createElement('div');
    card.className = 'skill-card';
    const level = charId ? getCharItemLevel(charId, item.id) : item.level;

    card.innerHTML = `
        <h3>
            ${item.name}
            <span class="item-meta">
                (${item.type}, T${item.tier}, Lvl ${level} ${getLevelGrade(level)})
                ${item.isPrime ? '℗' : ''}
                ${item.enhanced ? '✨' : ''}
            </span>
        </h3>
        <div>${window.marked.parse(item.description || '')}</div>
        <div><strong>Parents:</strong> ${item.parents.map(p => `${getItem(p.id)?.name || 'Unknown'} (Req Lvl ${p.requiredLevel})`).join(', ') || 'None'}</div>

        <div class="checklists">
            ${Object.entries(item.checklists).sort(([a], [b]) => a - b).map(([lvl, tasks]) => tasks.length > 0 ? `
                <strong>Lvl ${lvl} (${getLevelGrade(parseInt(lvl))}):</strong>
                <ul>${tasks.map((task, idx) => `
                    <li>
                        <label>
                            <input
                                type="checkbox"
                                ${charId ? '' : 'disabled'}
                                data-lvl="${lvl}"
                                data-idx="${idx}"
                                ${getChecklistProgress(charId, item.id, lvl)[idx] ? 'checked' : ''}
                            >
                            ${window.marked.parseInline(task.replace(/^- /, ''))}
                        </label>
                    </li>`).join('')}
                </ul>
            ` : '').join('')}
        </div>

        <div><strong>Notes:</strong> ${window.marked.parse(item.notes || '')}</div>
        <div><strong>History:</strong> ${(item.history || []).map(h => `${h.date}: ${h.change}`).join('<br>')}</div>
        <div class="card-actions">
            <button class="evolve-btn">Evolve</button>
        </div>
    `;

    // Add event listeners
    if (charId) {
        card.querySelectorAll('input[type="checkbox"]').forEach(cb => {
            cb.addEventListener('change', () => {
                updateChecklist(charId, item.id, cb.dataset.lvl, cb.dataset.idx, cb.checked);
            });
        });
    }

    card.querySelector('.evolve-btn').addEventListener('click', () => {
        if (confirm(`Are you sure you want to evolve "${item.name}"? This will shift checklists down.`)) {
            evolveItem(item.id);
            renderCurrentView();
        }
    });

    return card;
}

export function renderDBView() {
    currentView = 'db';
    const container = document.getElementById('right-pane');
    container.innerHTML = '<h2>DB View</h2>';
    gameData.items.forEach(item => container.appendChild(createItemCard(item)));
}

export function renderNotebookView() {
    currentView = 'notebook';
    const container = document.getElementById('right-pane');
    container.innerHTML = '<h2>Notebook</h2>';
    gameData.characters.forEach(char => {
        const charDiv = document.createElement('div');
        charDiv.innerHTML = `<h3>${char.name}</h3>`;
        char.items.forEach(charItem => charDiv.appendChild(createItemCard(getItem(charItem.id), char.id)));
        container.appendChild(charDiv);
    });
}

export function renderRPGView() {
    currentView = 'rpg';
    const container = document.getElementById('right-pane');
    container.innerHTML = '<h2>RPG</h2>';
    gameData.parties.forEach(party => {
        const partyDiv = document.createElement('div');
        partyDiv.innerHTML = `<h3>${party.name}</h3>`;
        party.charIds.forEach(charId => {
            const char = gameData.characters.find(c => c.id === charId);
            partyDiv.appendChild(createItemCard(getItem('placeholder'), char.id)); // Expand as needed
        });
        container.appendChild(partyDiv);
    });
}

export function renderReferenceView() {
    currentView = 'reference';
    const container = document.getElementById('right-pane');
    container.innerHTML = '<h2>Reference</h2>';
    const loose = findLooseEnds();
    loose.forEach(item => container.appendChild(createItemCard(item)));
}

export function renderSearchResults() {
    const results = document.getElementById('search-results');
    results.innerHTML = '';
    const query = document.getElementById('search-bar').value.toLowerCase();
    const filters = Array.from(document.querySelectorAll('.filter:checked')).map(f => f.value);
    const looseFilter = document.getElementById('filter-loose').checked;
    let filtered = gameData.items.filter(item => {
        if (query && !item.name.toLowerCase().includes(query)) return false;
        if (filters.length && !filters.includes(item.type)) return false;
        if (looseFilter && !findLooseEnds().some(l => l.id === item.id)) return false;
        return true;
    });
    filtered.forEach(item => {
        const btn = document.createElement('button');
        btn.textContent = item.name;
        btn.onclick = () => renderFocalItem(item.id);
        results.appendChild(btn);
    });
}

export function renderFocalItem(id) {
    const container = document.getElementById('right-pane');
    container.innerHTML = '';
    const item = getItem(id);
    container.appendChild(createItemCard(item));
    const evolveBtn = document.createElement('button');
    evolveBtn.textContent = 'Innovate/Evolve';
    evolveBtn.onclick = () => {
        evolveItem(id);
        renderCurrentView();
    };
    container.appendChild(evolveBtn);
}
