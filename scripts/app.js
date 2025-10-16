import { loadData, saveData, setRenderCurrentView } from './data.js';
import { renderDBView, renderSearchResults, renderNotebookView, renderRPGView, renderReferenceView, renderCurrentView } from './ui.js';
import { closeModal, openModal, openGenericModal } from './modal.js';
import { handleCSVImport, exportCSV, exportJSON } from './importExport.js';
import { toggleTheme } from './utils.js';

// Event listeners
document.addEventListener('keydown', e => {
    if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        openModal('create');
    }
});
document.getElementById('close-modal').addEventListener('click', closeModal);
document.getElementById('db-tab').addEventListener('click', renderDBView);
document.getElementById('notebook-tab').addEventListener('click', renderNotebookView);
document.getElementById('rpg-tab').addEventListener('click', renderRPGView);
document.getElementById('reference-tab').addEventListener('click', renderReferenceView);
document.getElementById('search-bar').addEventListener('input', renderSearchResults);
document.querySelectorAll('.filter, #filter-loose, #filter-min-tier, #filter-max-tier, #filter-min-level, #filter-max-level').forEach(f => f.addEventListener('change', renderSearchResults));
document.getElementById('import-csv-btn').addEventListener('click', () => document.getElementById('csv-file').click());
document.getElementById('csv-file').addEventListener('change', handleCSVImport);
document.getElementById('export-csv-btn').addEventListener('click', exportCSV);
document.getElementById('export-json-btn').addEventListener('click', exportJSON);
document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
document.getElementById('help-btn').addEventListener('click', () => {
    openGenericModal(`
        <h2>Level Explanations</h2>
        <p><b>F (0):</b> Foundational knowledge.</p>
        <p><b>D (1):</b> Basic competence.</p>
        <p><b>C (2):</b> Intermediate proficiency.</p>
        <p><b>B (3):</b> Advanced skill.</p>
        <p><b>A- (4):</b> Near-mastery.</p>
        <p><b>A (5):</b> Pushing the limits of known expertise.</p>
        <p><b>S (6):</b> True excellence, potentially magical or divine.</p>
        <p><b>Z (7):</b> Unfathomable, beyond human comprehension.</p>
    `);
});

// Init
setRenderCurrentView(renderCurrentView);
loadData();
renderDBView(); // Default view
renderSearchResults();