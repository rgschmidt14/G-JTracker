import { gameData, updateTiers, saveData } from './data.js';
import { renderCurrentView } from './ui.js';

export function handleCSVImport(e) {
    const file = e.target.files[0];
    Papa.parse(file, {
        header: true,
        complete: (results) => {
            results.data.forEach(row => {
                if (!row.name || !row.type) return; // Skip empty/invalid rows
                // Parse row to item object, check duplicates by id/name, merge/add
                const existing = gameData.items.find(i => i.id === row.id || i.name === row.name);
                if (existing) {
                    // Merge: e.g., update desc, add checklists if new
                    existing.enhanced = row.enhanced === 'true' || row.enhanced === true;
                } else {
                    gameData.items.push({
                        id: row.id || `${row.type}_${row.name.toLowerCase().replace(/\s/g, '_')}`,
                        name: row.name,
                        type: row.type,
                        description: row.description || '',
                        parents: row.parents ? JSON.parse(row.parents) : [],  // Assume JSON string in CSV
                        tier: 0,
                        level: parseInt(row.level) || 0,
                        checklists: row.checklists ? JSON.parse(row.checklists) : {1:[],2:[],3:[],4:[],5:[],6:[],7:[]},
                        notes: row.notes || '',
                        history: row.history ? JSON.parse(row.history) : [],
                        isPrime: row.type === 'factor',
                        enhanced: row.enhanced === 'true' || row.enhanced === true
                    });
                }
            });
            updateTiers();
            saveData();
            renderCurrentView();
        }
    });
}

export function exportCSV() {
    const csvData = gameData.items.map(item => ({
        id: item.id,
        name: item.name,
        type: item.type,
        description: item.description,
        parents: JSON.stringify(item.parents),
        tier: item.tier,
        level: item.level,
        checklists: JSON.stringify(item.checklists),
        notes: item.notes,
        history: JSON.stringify(item.history),
        enhanced: item.enhanced
    }));
    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'gj_tracker.csv';
    a.click();
    URL.revokeObjectURL(url);
}

export function exportPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const char = gameData.characters[0]; // Assuming first character is "Me"

    doc.text(`Notebook for ${char.name}`, 10, 10);

    char.items.forEach((charItem, index) => {
        const item = gameData.items.find(i => i.id === charItem.id);
        doc.addPage();
        doc.text(`Checklist for ${item.name}`, 10, 10);
        Object.entries(item.checklists).forEach(([lvl, tasks]) => {
            doc.text(`Level ${lvl}`, 15, 20);
            tasks.forEach((task, i) => {
                doc.text(`- ${task}`, 20, 30 + (i * 10));
            });
        });
    });

    doc.addPage();
    doc.text('Journal', 10, 10);
    char.journal.forEach((entry, i) => {
        doc.text(`${entry.date}: ${entry.text}`, 15, 20 + (i * 10));
    });

    doc.save('notebook.pdf');
}

export function exportJSON() {
    const blob = new Blob([JSON.stringify(gameData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'gj_tracker.json';
    a.click();
    URL.revokeObjectURL(url);
}
