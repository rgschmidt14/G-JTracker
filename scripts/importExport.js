import { gameData, updateTiers, saveData } from './data.js';
import { renderCurrentView } from './ui.js';

export function handleCSVImport(e) {
    const file = e.target.files[0];
    window.Papa.parse(file, {
        header: true,
        complete: (results) => {
            results.data.forEach(row => {
                const rowParsed = {
                    ...row,
                    parents: row.parents ? JSON.parse(row.parents) : undefined,
                    checklists: row.checklists ? JSON.parse(row.checklists) : undefined,
                    history: row.history ? JSON.parse(row.history) : undefined,
                    level: row.level ? parseInt(row.level) : undefined,
                    isPrime: row.type ? row.type === 'factor' : undefined
                };

                // Remove undefined keys so Object.assign doesn't overwrite with undefined
                Object.keys(rowParsed).forEach(key => rowParsed[key] === undefined && delete rowParsed[key]);

                const existing = gameData.items.find(i => i.id === row.id || i.name.toLowerCase() === row.name.toLowerCase());
                if (existing) {
                    Object.assign(existing, rowParsed);
                } else {
                    gameData.items.push({
                        id: row.id || `${row.type}_${row.name.toLowerCase().replace(/\s/g, '_')}`,
                        name: row.name,
                        type: row.type,
                        description: row.description || '',
                        parents: [],
                        tier: 0,
                        level: 0,
                        checklists: {1:[],2:[],3:[],4:[],5:[],6:[],7:[]},
                        notes: '',
                        history: [],
                        isPrime: row.type === 'factor',
                        ...rowParsed
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
        history: JSON.stringify(item.history)
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

export function exportJSON() {
    const blob = new Blob([JSON.stringify(gameData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'gj_tracker.json';
    a.click();
    URL.revokeObjectURL(url);
}
