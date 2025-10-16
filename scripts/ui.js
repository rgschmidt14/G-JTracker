import { gameData, getItem, findLooseEnds, getChildren, evolveItem } from './data.js';
import { getLevelGrade } from './utils.js';
import { getChecklistProgress, updateChecklist } from './data.js';
import { openModal } from './modal.js';

let currentView = 'db';

import { getEmojiBadge } from './utils.js';

export function createItemCard(item, charId = null) {
    const card = document.createElement('div');
    card.className = 'skill-card';
    card.innerHTML = `
        <h3>${item.name} ${getEmojiBadge(item.name)} (${item.type}, T${item.tier}, Lvl ${item.level} (${getLevelGrade(item.level)}))</h3>
        <div>${marked.parse(item.description)}</div>
        <div>Parents: ${item.parents.map(p => `${getItem(p.id)?.name || 'Unknown'} (Req Lvl ${p.requiredLevel})`).join(', ')}</div>
        <div class="checklists">
            ${Object.entries(item.checklists).map(([lvl, tasks]) => `
                <strong>Lvl ${lvl} (${getLevelGrade(parseInt(lvl))}):</strong>
                <ul>${tasks.map((task, idx) => `<li><input type="checkbox" ${charId ? '' : 'disabled'} data-lvl="${lvl}" data-idx="${idx}">${marked.parseInline(task.slice(2))}</li>`).join('')}</ul>
            `).join('')}
        </div>
        <div>Notes: ${marked.parse(item.notes || '')}</div>
        <div>History: ${item.history.map(h => `${h.date}: ${h.change}`).join('<br>')}</div>
        <button class="edit-btn" data-id="${item.id}">Edit</button>
        <button class="evolve-btn" data-id="${item.id}">Evolve</button>
    `;
    if (charId) {
        card.querySelectorAll('input[type="checkbox"]').forEach(cb => {
            cb.checked = getChecklistProgress(charId, item.id, cb.dataset.lvl)[cb.dataset.idx] || false;
            cb.addEventListener('change', () => updateChecklist(charId, item.id, cb.dataset.lvl, cb.dataset.idx, cb.checked));
        });
    }
    card.querySelector('.edit-btn').addEventListener('click', () => openModal('edit', item.id));
    card.querySelector('.evolve-btn').addEventListener('click', () => {
        evolveItem(item.id);
        renderCurrentView();
    });
    return card;
}

export function renderDBView() {
    currentView = 'db';
    const container = document.getElementById('right-pane');
    container.innerHTML = '<h2>DB View</h2><button id="create-item-btn">Create New Item</button><div id="db-graph"></div>';
    container.querySelector('#create-item-btn').addEventListener('click', () => openModal('create'));

    const nodes = new vis.DataSet(gameData.items.map(item => ({id: item.id, label: item.name, group: item.type})));
    const edges = new vis.DataSet(gameData.items.flatMap(item => item.parents.map(p => ({from: p.id, to: item.id}))));

    const graphContainer = document.getElementById('db-graph');
    const data = { nodes, edges };
    const options = {
        layout: {
            hierarchical: {
                direction: 'UD',
                sortMethod: 'directed'
            }
        },
        groups: {
            skill: { color: 'lightblue' },
            faculty: { color: 'lightgreen' },
            factor: { color: 'gold' }
        }
    };
    new vis.Network(graphContainer, data, options);
}

import { exportPDF } from './importExport.js';
export function renderNotebookView() {
    currentView = 'notebook';
    const container = document.getElementById('right-pane');
    container.innerHTML = '<h2>Notebook</h2><button id="export-pdf-btn">Export PDF</button>';
    container.querySelector('#export-pdf-btn').addEventListener('click', exportPDF);

    if (gameData.characters.length === 0) {
        gameData.characters.push({ id: 'me', name: 'Me', items: [], goals: [], journal: [] });
    }

    gameData.characters.forEach(char => {
        const charDiv = document.createElement('div');
        charDiv.innerHTML = `<h3>${char.name}</h3>`;

        char.items.forEach(charItem => {
            const item = getItem(charItem.id);
            const card = createItemCard(item, char.id);
            const progressBar = document.createElement('div');
            progressBar.innerHTML = `<div style="width: ${ (charItem.level / 7) * 100 }%; background: var(--primary); height: 5px; border-radius: 2px;"></div>`;
            card.appendChild(progressBar);
            charDiv.appendChild(card);
        });

        const goalsDiv = document.createElement('div');
        goalsDiv.innerHTML = '<h4>Goals</h4>';
        char.goals.forEach(goal => {
            const goalDiv = document.createElement('div');
            goalDiv.innerHTML = `<p>${getItem(goal.itemId).name} to Level ${goal.targetLevel} by ${goal.due}</p>`;
            if (new Date(goal.due) < new Date()) {
                alert(`Reminder: Your goal to reach Level ${goal.targetLevel} in ${getItem(goal.itemId).name} is overdue!`);
            }
            goalsDiv.appendChild(goalDiv);
        });
        charDiv.appendChild(goalsDiv);

        const journalDiv = document.createElement('div');
        journalDiv.innerHTML = '<h4>Journal</h4>';
        char.journal.forEach(entry => {
            const entryDiv = document.createElement('div');
            entryDiv.innerHTML = `<p><b>${entry.date}:</b> ${marked.parse(entry.text)}</p>`;
            journalDiv.appendChild(entryDiv);
        });
        charDiv.appendChild(journalDiv);

        container.appendChild(charDiv);
    });
}

import { canAcquire } from './data.js';

export function renderRPGView() {
    currentView = 'rpg';
    const container = document.getElementById('right-pane');
    container.innerHTML = `
        <h2>RPG</h2>
        <button id="create-char-btn">Create Character</button>
        <button id="create-party-btn">Create Party</button>
        <div id="parties"></div>
    `;

    container.querySelector('#create-char-btn').addEventListener('click', () => {
        const name = prompt('Enter character name:');
        if (name) {
            gameData.characters.push({ id: `char_${name.toLowerCase()}`, name, items: [], xp: 0 });
            renderRPGView();
        }
    });

    container.querySelector('#create-party-btn').addEventListener('click', () => {
        const name = prompt('Enter party name:');
        if (name) {
            gameData.parties.push({ id: `party_${name.toLowerCase()}`, name, charIds: [] });
            renderRPGView();
        }
    });

    const partiesContainer = container.querySelector('#parties');
    gameData.parties.forEach(party => {
        const partyDiv = document.createElement('div');
        partyDiv.innerHTML = `<h3>${party.name}</h3>`;
        party.charIds.forEach(charId => {
            const char = gameData.characters.find(c => c.id === charId);
            const charDiv = document.createElement('div');
            charDiv.innerHTML = `<h4>${char.name} (XP: ${char.xp})</h4>`;
            gameData.items.forEach(item => {
                const acquireBtn = document.createElement('button');
                acquireBtn.textContent = `Acquire ${item.name}`;
                acquireBtn.disabled = !canAcquire(item.id, char.id);
                acquireBtn.onclick = () => {
                    if (item.level > 5 && !item.enhanced) {
                        alert('This is an S/6+ item and requires enhancement.');
                        if (confirm('Do you want to enhance it? (Warning: Drugs ruin lives—use for story only!)')) {
                            item.enhanced = true;
                        } else {
                            return;
                        }
                    }
                    char.items.push({ id: item.id, level: 1, checklistProgress: {} });
                    char.xp -= item.level * 10;
                    renderRPGView();
                };
                charDiv.appendChild(acquireBtn);
            });
            partyDiv.appendChild(charDiv);
        });
        partiesContainer.appendChild(partyDiv);
    });
}

export function renderReferenceView() {
    currentView = 'reference';
    const container = document.getElementById('right-pane');
    container.innerHTML = `
        <h2>Reference</h2>
        <h3>Sorted Index</h3>
        <div id="sorted-index"></div>
        <h3>Loose Ends</h3>
        <div id="loose-ends"></div>
    `;

    const sortedIndex = container.querySelector('#sorted-index');
    const looseEndsContainer = container.querySelector('#loose-ends');

    const sortedItems = [...gameData.items].sort((a, b) => a.name.localeCompare(b.name));
    sortedItems.forEach(item => sortedIndex.appendChild(createItemCard(item)));

    const loose = findLooseEnds();
    loose.forEach(item => {
        const card = createItemCard(item);
        const suggestion = document.createElement('div');
        if (getChildren(item.id).length === 0) {
            suggestion.innerHTML = `<p><b>Suggestion:</b> This item has no children. Consider adding some, for example: "${item.name} Fundamentals" and "${item.name} Applications".</p>`;
        } else {
            suggestion.innerHTML = '<p><b>Suggestion:</b> This Tier 1+ item should have exactly two parents.</p>';
        }
        card.appendChild(suggestion);
        looseEndsContainer.appendChild(card);
    });
}

export function renderSearchResults() {
    const results = document.getElementById('search-results');
    results.innerHTML = '';
    const query = document.getElementById('search-bar').value.toLowerCase();
    const filters = Array.from(document.querySelectorAll('.filter:checked')).map(f => f.value);
    const looseFilter = document.getElementById('filter-loose').checked;
    const minTier = parseInt(document.getElementById('filter-min-tier').value) || 0;
    const maxTier = parseInt(document.getElementById('filter-max-tier').value) || 10;
    const minLevel = parseInt(document.getElementById('filter-min-level').value) || 0;
    const maxLevel = parseInt(document.getElementById('filter-max-level').value) || 7;

    let filtered = gameData.items.filter(item => {
        if (query && !item.name.toLowerCase().includes(query)) return false;
        if (filters.length && !filters.includes(item.type)) return false;
        if (looseFilter && !findLooseEnds().some(l => l.id === item.id)) return false;
        if (item.tier < minTier || item.tier > maxTier) return false;
        if (item.level < minLevel || item.level > maxLevel) return false;
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
}

export function renderCurrentView() {
    if (currentView === 'db') renderDBView();
    else if (currentView === 'notebook') renderNotebookView();
    else if (currentView === 'rpg') renderRPGView();
    else if (currentView === 'reference') renderReferenceView();
}
