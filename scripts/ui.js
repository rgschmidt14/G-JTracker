import { gameData, getItem, findLooseEnds, evolveItem, saveData, getChildren, getCharItemLevel } from './data.js';
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
    hideNotebookContainer();
    document.getElementById('right-pane').innerHTML = ''; // Clear the pane
    const graphContainer = document.getElementById('db-graph-container');
    if (graphContainer) graphContainer.style.display = 'block';

    const nodes = new vis.DataSet(gameData.items.map(item => ({
        id: item.id,
        label: item.name,
        title: `Tier ${item.tier}, Level ${item.level}`,
        group: item.type,
    })));

    const edges = new vis.DataSet(
        gameData.items.flatMap(item =>
            item.parents.map(p => ({ from: p.id, to: item.id, arrows: 'to' }))
        )
    );

    const container = document.getElementById('db-graph');
    const data = { nodes, edges };
    const options = {
        layout: {
            hierarchical: {
                enabled: true,
                direction: 'UD', // Up-Down
                sortMethod: 'directed',
            },
        },
        physics: {
            enabled: false,
        },
    };

    const network = new vis.Network(container, data, options);

    document.getElementById('db-graph-toggle-layout').onclick = () => {
        const currentDirection = network.getOptions().layout.hierarchical.direction;
        const newDirection = currentDirection === 'UD' ? 'LR' : 'UD';
        network.setOptions({
            layout: {
                hierarchical: {
                    direction: newDirection,
                },
            },
        });
    };
}

function hideGraphContainer() {
    const graphContainer = document.getElementById('db-graph-container');
    if (graphContainer) graphContainer.style.display = 'none';
}

function hideNotebookContainer() {
    const notebookContainer = document.getElementById('notebook-container');
    if (notebookContainer) notebookContainer.style.display = 'none';
}

function createProgressBar(level) {
    const progress = (level / 7) * 100;
    return `
        <div class="progress-bar-container">
            <div class="progress-bar" style="width: ${progress}%"></div>
            <span>Lvl ${level}</span>
        </div>
    `;
}

export function renderNotebookView() {
    currentView = 'notebook';
    hideGraphContainer();
    document.getElementById('notebook-container').style.display = 'block';

    const me = gameData.characters.find(c => c.name === 'Me');
    if (!me) return;

    const sheetContainer = document.getElementById('notebook-me-char-sheet');
    sheetContainer.innerHTML = `<h3>${me.name}'s Sheet</h3>`;

    me.items.forEach(charItem => {
        const item = getItem(charItem.id);
        if (!item) return;

        const itemContainer = document.createElement('div');
        itemContainer.className = 'notebook-item';

        const card = createItemCard(item, me.id);
        card.querySelector('h3').insertAdjacentHTML('afterend', createProgressBar(charItem.level));

        const journalContainer = document.createElement('div');
        journalContainer.className = 'journal-container';
        journalContainer.innerHTML = '<h4>Journal</h4>';
        const journalTextArea = document.createElement('textarea');
        journalTextArea.value = me.journals[item.id] || '';
        journalTextArea.placeholder = 'Log your progress, thoughts, and discoveries...';
        journalTextArea.addEventListener('input', () => {
            me.journals[item.id] = journalTextArea.value;
            saveData();
        });
        journalContainer.appendChild(journalTextArea);

        itemContainer.appendChild(card);
        itemContainer.appendChild(journalContainer);
        sheetContainer.appendChild(itemContainer);
    });

    const goalsContainer = document.getElementById('notebook-goals');
    goalsContainer.innerHTML = '<h3>Goals</h3>';
    if (me.goals.length === 0) {
        goalsContainer.innerHTML += '<p>No goals set yet. Go add some!</p>';
    } else {
        const goalsList = document.createElement('ul');
        me.goals.forEach(goal => {
            const item = getItem(goal.itemId);
            const li = document.createElement('li');
            li.textContent = `Reach Level ${goal.targetLevel} in ${item?.name || 'an item'} by ${goal.due}`;
            goalsList.appendChild(li);
        });
        goalsContainer.appendChild(goalsList);
    }
}

export function renderRPGView() {
    currentView = 'rpg';
    hideGraphContainer();
    hideNotebookContainer();
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
    hideGraphContainer();
    hideNotebookContainer();
    const container = document.getElementById('right-pane');
    container.innerHTML = `
        <h2>Reference</h2>
        <div id="reference-sections">
            <div id="sorted-list-section">
                <h3>All Items (Sorted)</h3>
                <div id="sorted-list-controls">
                    <label>Sort by:
                        <select id="sort-by">
                            <option value="name">Name</option>
                            <option value="tier">Tier</option>
                        </select>
                    </label>
                </div>
                <div id="sorted-list-container"></div>
            </div>
            <div id="loose-ends-section">
                <h3>Loose Ends</h3>
                <div id="loose-ends-container"></div>
            </div>
        </div>
    `;

    const renderSortedList = () => {
        const sortBy = document.getElementById('sort-by').value;
        const sortedItems = [...gameData.items].sort((a, b) => {
            if (a[sortBy] < b[sortBy]) return -1;
            if (a[sortBy] > b[sortBy]) return 1;
            return 0;
        });

        const listContainer = document.getElementById('sorted-list-container');
        listContainer.innerHTML = '';
        sortedItems.forEach(item => {
            const itemEl = document.createElement('div');
            itemEl.className = 'list-item';
            itemEl.textContent = `${item.name} (T${item.tier})`;
            itemEl.onclick = () => renderFocalItem(item.id);
            listContainer.appendChild(itemEl);
        });
    };

    const renderLooseEnds = () => {
        const looseEnds = findLooseEnds();
        const looseEndsContainer = document.getElementById('loose-ends-container');
        looseEndsContainer.innerHTML = '';

        if (looseEnds.length === 0) {
            looseEndsContainer.textContent = 'No loose ends found!';
            return;
        }

        looseEnds.forEach(item => {
            const card = createItemCard(item);
            const suggestion = document.createElement('div');
            suggestion.className = 'suggestion';

            if (item.tier > 0 && item.parents.length !== 2) {
                suggestion.innerHTML = `<p><strong>Suggestion:</strong> This Tier ${item.tier} item should have exactly two parents. It currently has ${item.parents.length}. Consider adding or removing parents to stabilize it.</p>`;
            } else if (item.isPrime && item.type !== 'factor') {
                suggestion.innerHTML = `<p><strong>Suggestion:</strong> This is a prime item (no children) but is not a 'factor'. Consider decomposing it into more fundamental factors or developing new items from it.</p><p>For example, you could break down "${item.name}" into factors like "Manual Dexterity" and "Creative Application".</p>`;
            }

            card.appendChild(suggestion);
            looseEndsContainer.appendChild(card);
        });
    };

    document.getElementById('sort-by').addEventListener('change', renderSortedList);

    renderSortedList();
    renderLooseEnds();
}

export function renderSearchResults() {
    const results = document.getElementById('search-results');
    results.innerHTML = '';

    // Get filter values
    const query = document.getElementById('search-bar').value.toLowerCase();
    const typeFilters = Array.from(document.querySelectorAll('.filter:checked')).map(f => f.value);
    const looseFilter = document.getElementById('filter-loose').checked;
    const tierMin = parseInt(document.getElementById('filter-tier-min').value) || 0;
    const tierMax = parseInt(document.getElementById('filter-tier-max').value) || Infinity;
    const levelMin = parseInt(document.getElementById('filter-level-min').value) || 0;
    const levelMax = parseInt(document.getElementById('filter-level-max').value) || 7;

    const filteredItems = gameData.items.filter(item => {
        // Text search
        if (query && !item.name.toLowerCase().includes(query)) return false;

        // Type filter
        if (typeFilters.length && !typeFilters.includes(item.type)) return false;

        // Loose ends filter
        if (looseFilter && !findLooseEnds().some(l => l.id === item.id)) return false;

        // Tier range
        if (item.tier < tierMin || item.tier > tierMax) return false;

        // Level range
        if (item.level < levelMin || item.level > levelMax) return false;

        return true;
    });

    filteredItems.forEach(item => {
        const btn = document.createElement('button');
        btn.textContent = `${item.name} (T${item.tier}, L${item.level})`;
        btn.onclick = () => renderFocalItem(item.id);
        results.appendChild(btn);
    });
}

export function renderFocalItem(id) {
    hideGraphContainer();
    hideNotebookContainer();
    const container = document.getElementById('right-pane');
    const item = getItem(id);
    if (!item) return;

    container.innerHTML = `
        <div id="focal-item-view">
            <div id="focal-item-card"></div>
            <div class="focal-graphs">
                <div id="focal-parents-graph"><h3>Parents</h3></div>
                <div id="focal-children-graph"><h3>Children</h3></div>
            </div>
        </div>
    `;

    document.getElementById('focal-item-card').appendChild(createItemCard(item));

    // Render Parent Graph
    const parents = item.parents.map(p => getItem(p.id)).filter(Boolean);
    if (parents.length > 0) {
        const parentNodes = new vis.DataSet(parents.map(p => ({ id: p.id, label: p.name })));
        parentNodes.add({ id: item.id, label: item.name, color: '#f0ad4e' });
        const parentEdges = new vis.DataSet(item.parents.map(p => ({ from: p.id, to: item.id, arrows: 'to' })));
        new vis.Network(document.getElementById('focal-parents-graph'), { nodes: parentNodes, edges: parentEdges }, { layout: { hierarchical: { enabled: true, direction: 'LR' } } });
    } else {
        document.getElementById('focal-parents-graph').innerHTML += '<p>None</p>';
    }

    // Render Children Graph
    const children = getChildren(id);
    if (children.length > 0) {
        const childNodes = new vis.DataSet(children.map(c => ({ id: c.id, label: c.name })));
        childNodes.add({ id: item.id, label: item.name, color: '#f0ad4e' });
        const childEdges = new vis.DataSet(children.map(c => ({ from: item.id, to: c.id, arrows: 'to' })));
        new vis.Network(document.getElementById('focal-children-graph'), { nodes: childNodes, edges: childEdges }, { layout: { hierarchical: { enabled: true, direction: 'LR' } } });
    } else {
        document.getElementById('focal-children-graph').innerHTML += '<p>None</p>';
    }
}
