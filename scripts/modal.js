import { getItem, updateTiers, saveData } from './data.js';
import { renderCurrentView, filterAndCacheResults } from './ui.js';
import { confirmDivineUnlock } from './utils.js';

export function openModal(mode, id = null) {
    const modal = document.getElementById('modal');
    const form = document.getElementById('item-form');

    if (mode === 'help') {
        form.innerHTML = `
            <h2>In-App Docs</h2>
            <p><strong>Levels:</strong></p>
            <ul>
                <li><strong>F (0):</strong> Novice</li>
                <li><strong>D (1):</strong> Basic understanding</li>
                <li><strong>C (2):</strong> Competent</li>
                <li><strong>B (3):</strong> Proficient</li>
                <li><strong>A (4):</strong> Pushing limits of human potential</li>
                <li><strong>S (6):</strong> Supernatural or divine insight</li>
                <li><strong>Z (7):</strong> Unfathomable - requires Divine Unlock</li>
            </ul>
            <p><strong>Evolutions:</strong> "Evolving" an item shifts its checklists down, making room for new growth at the top.</p>
            <p><strong>Loose Ends:</strong> Items with issues, like wrong parent counts or being childless, are flagged for review.</p>
            <p>True excellence is something to be proud of! 🧀🌞</p>
            <button type="button" id="close-help-modal">Close</button>
        `;
        document.getElementById('close-help-modal').addEventListener('click', closeModal);
        modal.style.display = 'flex';
        return;
    }

    const item = mode === 'edit' ? getItem(id) : {
        id: `item-${Date.now()}`,
        name: '',
        type: 'skill',
        description: '',
        parents: [],
        checklists: {},
        notes: '',
        history: [],
        level: 0,
        enhanced: false
    };

    form.innerHTML = `
        <label>Name: <input type="text" name="name" value="${item.name}" required></label>
        <label>Type:
            <select name="type">
                <option value="skill" ${item.type === 'skill' ? 'selected' : ''}>Skill</option>
                <option value="faculty" ${item.type === 'faculty' ? 'selected' : ''}>Faculty</option>
                <option value="factor" ${item.type === 'factor' ? 'selected' : ''}>Factor</option>
            </select>
        </label>
        <label>Level: <input type="number" name="level" value="${item.level}" min="0" max="7"></label>
        <label>Description: <textarea name="description">${item.description}</textarea></label>
        <fieldset>
            <legend>Parents</legend>
            <div id="parents-container"></div>
            <button type="button" id="add-parent">Add Parent</button>
        </fieldset>

        <div class="tabs">
            ${[1, 2, 3, 4, 5, 6, 7].map(lvl => `<button type="button" class="tab-link" data-lvl="${lvl}">Lvl ${lvl}</button>`).join('')}
        </div>
        <div id="checklists-container">
            ${[1, 2, 3, 4, 5, 6, 7].map(lvl => `
                <div id="checklist-${lvl}" class="tab-content" style="display:none;">
                    <textarea placeholder="One task per line, start with '- '">${(item.checklists[lvl] || []).join('\n')}</textarea>
                </div>
            `).join('')}
        </div>

        <label>Notes: <textarea name="notes">${item.notes}</textarea></label>
        <button type="submit">Save</button>
    `;

    // Parent Selection
    const parentsContainer = form.querySelector('#parents-container');
    const addParentBtn = form.querySelector('#add-parent');

    const renderParents = () => {
        parentsContainer.innerHTML = '';
        item.parents.forEach((p, idx) => {
            const parentInput = document.createElement('div');
            parentInput.innerHTML = `
                <input type="text" value="${getItem(p.id)?.name || ''}" placeholder="Parent Name" class="parent-name">
                <input type="number" value="${p.requiredLevel}" min="0" max="7" class="parent-req">
                <button type="button" class="remove-parent" data-idx="${idx}">X</button>
            `;
            parentsContainer.appendChild(parentInput);
        });
    };

    addParentBtn.addEventListener('click', () => {
        item.parents.push({ id: '', requiredLevel: 1 });
        renderParents();
    });

    parentsContainer.addEventListener('click', e => {
        if (e.target.classList.contains('remove-parent')) {
            item.parents.splice(e.target.dataset.idx, 1);
            renderParents();
        }
    });

    // Tabbed Checklists
    const tabLinks = form.querySelectorAll('.tab-link');
    const tabContents = form.querySelectorAll('.tab-content');
    tabLinks.forEach(link => {
        link.addEventListener('click', () => {
            tabContents.forEach(content => content.style.display = 'none');
            form.querySelector(`#checklist-${link.dataset.lvl}`).style.display = 'block';
        });
    });
    form.querySelector('.tab-link').click(); // Show first tab

    // Form Submission is handled by a single, persistent event listener
    modal.style.display = 'flex';
}

function handleFormSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    const itemId = form.dataset.itemId;
    const item = getItem(itemId) || {}; // Get existing or create new

    const updatedItem = {
        ...item,
        id: itemId,
        name: formData.get('name'),
        type: formData.get('type'),
        level: parseInt(formData.get('level')),
        description: formData.get('description'),
        notes: formData.get('notes'),
        checklists: {}
    };

    if (!confirmDivineUnlock(updatedItem.level)) {
        updatedItem.level = 6;
    }

    // Parse checklists
    form.querySelectorAll('.tab-content textarea').forEach((area, i) => {
        const lvl = i + 1;
        updatedItem.checklists[lvl] = area.value.split('\n').filter(line => line.startsWith('- '));
    });

    // Parse parents
    const parentNames = form.querySelectorAll('.parent-name');
    const parentReqs = form.querySelectorAll('.parent-req');
    updatedItem.parents = Array.from(parentNames).map((input, i) => {
        const found = gameData.items.find(it => it.name.toLowerCase() === input.value.toLowerCase());
        return { id: found?.id || '', requiredLevel: parseInt(parentReqs[i].value) };
    }).filter(p => p.id);


    try {
        const newTier = updatedItem.parents.length ? Math.max(...updatedItem.parents.map(p => (getItem(p.id)?.tier || 0))) + 1 : 0;
        if (newTier > 0 && updatedItem.parents.length !== 2) {
            alert('Items in Tier 1 or higher must have exactly two parents.');
            return;
        }

        const existingIndex = gameData.items.findIndex(i => i.id === itemId);
        if (existingIndex > -1) {
            gameData.items[existingIndex] = updatedItem;
        } else {
            gameData.items.push(updatedItem);
        }

        updateTiers();
        saveData();
        renderCurrentView();
        filterAndCacheResults();
    } finally {
        closeModal();
    }
}

document.getElementById('item-form').addEventListener('submit', handleFormSubmit);

export function closeModal() {
    document.getElementById('modal').style.display = 'none';
}
