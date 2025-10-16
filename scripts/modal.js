import { getItem, updateTiers, saveData } from './data.js';
import { renderCurrentView } from './ui.js';

export function openModal(mode, id = null) {
    const modal = document.getElementById('modal');
    modal.style.display = 'flex';
    const form = document.getElementById('item-form');
    form.innerHTML = ''; // Populate fields dynamically
    // Add inputs for name, type, desc, parents, checklists tabs, notes
    // Example for checklists: loop 1-7, add textarea
    if (mode === 'edit') {
        const item = getItem(id);
        // Pre-fill fields
    }
    form.onsubmit = (e) => {
        e.preventDefault();
        // Parse form, validate (2 parents for tier1+, etc.), save item, updateTiers, close modal, saveData
        closeModal();
        updateTiers();
        saveData();
        renderCurrentView();
    };
}

export function closeModal() {
    document.getElementById('modal').style.display = 'none';
}
