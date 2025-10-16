import { gameData, getItem, updateTiers, saveData } from './data.js';
import { renderDBView } from './ui.js';

export function openGenericModal(content) {
    const modal = document.getElementById('modal');
    modal.style.display = 'flex';
    const modalContent = document.querySelector('.modal-content');
    modalContent.innerHTML = `<span id="close-modal">&times;</span>${content}`;
    document.getElementById('close-modal').addEventListener('click', closeModal);
}

export function openModal(mode, id = null) {
    const modal = document.getElementById('modal');
    modal.style.display = 'flex';
    const form = document.getElementById('item-form');
    const item = mode === 'edit' ? getItem(id) : null;

    const parentOptions = gameData.items.map(i => `<option value="${i.id}" ${item?.parents.some(p => p.id === i.id) ? 'selected' : ''}>${i.name}</option>`).join('');

    form.innerHTML = `
        <input type="hidden" id="item-id" value="${item?.id || ''}">
        <label>Name: <input type="text" id="item-name" value="${item?.name || ''}" required></label>
        <label>Type:
            <select id="item-type">
                <option value="skill" ${item?.type === 'skill' ? 'selected' : ''}>Skill</option>
                <option value="faculty" ${item?.type === 'faculty' ? 'selected' : ''}>Faculty</option>
                <option value="factor" ${item?.type === 'factor' ? 'selected' : ''}>Factor</option>
            </select>
        </label>
        <label>Description: <textarea id="item-description">${item?.description || ''}</textarea></label>
        <label>Parent 1: <select id="item-parent1"><option value="">None</option>${parentOptions}</select></label>
        <label>Parent 2: <select id="item-parent2"><option value="">None</option>${parentOptions}</select></label>
        <label>Enhanced: <input type="checkbox" id="item-enhanced" ${item?.enhanced ? 'checked' : ''}></label>

        <div class="tabs">
            ${[1,2,3,4,5,6,7].map(lvl => `<button type="button" class="tab-link" data-lvl="${lvl}">Lvl ${lvl}</button>`).join('')}
        </div>
        ${[1,2,3,4,5,6,7].map(lvl => `
            <div id="checklist-${lvl}" class="tab-content" style="display:none;">
                <textarea placeholder="One task per line, start with '- '">${item?.checklists[lvl]?.join('\n') || ''}</textarea>
            </div>
        `).join('')}
        <label>Notes: <textarea id="item-notes">${item?.notes || ''}</textarea></label>
        <button type="submit">Save</button>
    `;

    // Tab logic
    const tabs = form.querySelectorAll('.tab-link');
    const contents = form.querySelectorAll('.tab-content');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            contents.forEach(c => c.style.display = 'none');
            form.querySelector(`#checklist-${tab.dataset.lvl}`).style.display = 'block';
        });
    });
    tabs[0].click(); // Show first tab

    form.onsubmit = (e) => {
        e.preventDefault();
        const parent1 = form.querySelector('#item-parent1').value;
        const parent2 = form.querySelector('#item-parent2').value;
        const parents = [];
        if (parent1) parents.push({ id: parent1, requiredLevel: 5 }); // Default required level
        if (parent2) parents.push({ id: parent2, requiredLevel: 5 });

        let level = 0; // This will be calculated based on checklists later
        const enhanced = form.querySelector('#item-enhanced').checked;

        if (level > 5 && !enhanced) {
            if (!confirm('This item has a level greater than 5 but is not marked as enhanced. Are you sure?')) return;
        }
        if (level === 7) {
            if (confirm('Is this item truly fathomable? If not, it will be set to level 6.')) {
                level = 6;
            }
        }

        const checklists = {};
        form.querySelectorAll('.tab-content textarea').forEach((area, i) => {
            checklists[i+1] = area.value.split('\n').filter(line => line.startsWith('- '));
        });

        const newItemData = {
            id: form.querySelector('#item-id').value || `${form.querySelector('#item-type').value}_${form.querySelector('#item-name').value.toLowerCase().replace(/\s/g, '_')}`,
            name: form.querySelector('#item-name').value,
            type: form.querySelector('#item-type').value,
            description: form.querySelector('#item-description').value,
            parents,
            tier: 0,
            level,
            checklists,
            notes: form.querySelector('#item-notes').value,
            history: item?.history || [],
            isPrime: form.querySelector('#item-type').value === 'factor',
            enhanced
        };

        if (mode === 'edit') {
            const index = gameData.items.findIndex(i => i.id === id);
            gameData.items[index] = newItemData;
        } else {
            gameData.items.push(newItemData);
        }

        updateTiers();
        if (newItemData.tier > 0 && newItemData.parents.length !== 2) {
            alert('Warning: Tier 1+ items should have exactly two parents.');
        }

        saveData();
        closeModal();
        renderDBView();
    };
}

export function closeModal() {
    document.getElementById('modal').style.display = 'none';
}
