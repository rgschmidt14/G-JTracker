import { gameData, loadData, getItem } from './data.js';
import {
    renderDBView,
    renderNotebookView,
    renderReferenceView,
    filterAndCacheResults
} from './ui.js';
import { renderRPGView } from './rpg.js';
import { openModal, closeModal } from './modal.js';
import { handleCSVImport, exportCSV, exportJSON, exportPDF } from './importExport.js';
import { toggleTheme } from './utils.js';

// Event listeners
document.getElementById('add-item-btn').addEventListener('click', () => openModal('add'));
document.getElementById('close-modal').addEventListener('click', closeModal);
document.getElementById('db-tab').addEventListener('click', renderDBView);
document.getElementById('notebook-tab').addEventListener('click', renderNotebookView);
document.getElementById('rpg-tab').addEventListener('click', renderRPGView);
document.getElementById('reference-tab').addEventListener('click', renderReferenceView);
document.getElementById('search-bar').addEventListener('input', filterAndCacheResults);
document.querySelectorAll('.filter').forEach(f => f.addEventListener('change', filterAndCacheResults));
document.getElementById('filter-loose').addEventListener('change', filterAndCacheResults);
document.getElementById('filter-tier-min').addEventListener('input', filterAndCacheResults);
document.getElementById('filter-tier-max').addEventListener('input', filterAndCacheResults);
document.getElementById('filter-level-min').addEventListener('input', filterAndCacheResults);
document.getElementById('filter-level-max').addEventListener('input', filterAndCacheResults);
document.getElementById('import-csv-btn').addEventListener('click', () => document.getElementById('csv-file').click());
document.getElementById('csv-file').addEventListener('change', handleCSVImport);
document.getElementById('export-csv-btn').addEventListener('click', exportCSV);
document.getElementById('export-json-btn').addEventListener('click', exportJSON);
document.getElementById('export-pdf-btn').addEventListener('click', exportPDF);
document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
document.getElementById('help-btn').addEventListener('click', () => openModal('help'));
document.addEventListener('keydown', e => {
    if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        openModal('add');
    }
});

// Init
loadData();
renderDBView(); // Default view
filterAndCacheResults();

// Check for reminders on load
function checkReminders() {
    const me = gameData.characters.find(c => c.name === 'Me');
    if (!me) return;

    let today = new Date();
    today.setHours(0, 0, 0, 0);

    me.goals.forEach(goal => {
        const goalDate = new Date(goal.due);
        if (goalDate < today) {
            const item = getItem(goal.itemId);
            alert(`Reminder: Time to practice ${item?.name || 'a skill'}! 🛩️`);
        }
    });
}
checkReminders();
