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
    if (!charItem.checklistProgress[lvl]) charItem.checklistProgress[lvl] = [];
    charItem.checklistProgress[lvl][idx] = checked;
    if (charItem.checklistProgress[lvl].every(p => p)) {
        charItem.level = Math.max(charItem.level, parseInt(lvl) + 1);
    }
    saveData();
    renderCurrentView();
}

function getChecklistProgress(charId, itemId, lvl) {
    const char = gameData.characters.find(c => c.id === charId);
    const charItem = char.items.find(i => i.id === itemId);
    return charItem?.checklistProgress[lvl] || [];
}

export function createItemCard(item, charId = null) {
    const card = document.createElement('div');
    card.className = 'skill-card';
    card.innerHTML = `
        <h3>${item.name} (${item.type}, T${item.tier}, Lvl ${item.level} (${getLevelGrade(item.level)})</h3>
        <div>${window.marked.parse(item.description)}</div>
        <div>Parents: ${item.parents.map(p => `${getItem(p.id)?.name || 'Unknown'} (Req Lvl ${p.requiredLevel})`).join(', ')}</div>
        <div class="checklists">
            ${Object.entries(item.checklists).map(([lvl, tasks]) => `
                <strong>Lvl ${lvl} (${getLevelGrade(parseInt(lvl))}):</strong>
                <ul>${tasks.map((task, idx) => `<li><input type="checkbox" ${charId ? '' : 'disabled'} data-lvl="${lvl}" data-idx="${idx}">${window.marked.parseInline(task.slice(2))}</li>`).join('')}</ul>
            `).join('')}
        </div>
        <div>Notes: ${window.marked.parse(item.notes || '')}</div>
        <div>History: ${item.history.map(h => `${h.date}: ${h.change}`).join('<br>')}</div>
    `;
    if (charId) {
        card.querySelectorAll('input[type="checkbox"]').forEach(cb => {
            cb.checked = getChecklistProgress(charId, item.id, cb.dataset.lvl)[cb.dataset.idx] || false;
            cb.addEventListener('change', () => updateChecklist(charId, item.id, cb.dataset.lvl, cb.dataset.idx, cb.checked));
        });
    }
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
