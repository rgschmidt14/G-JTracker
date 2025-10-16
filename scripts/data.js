import { applyTheme } from './utils.js';

export const gameData = {
    items: [],
    characters: [],
    parties: [],
    settings: { theme: 'light', discoveryMode: false }
};
const STORAGE_KEY = 'GJTracker';

export function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(gameData));
}

export function loadData() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) Object.assign(gameData, JSON.parse(saved));
    applyTheme();
}

export function getItem(id) {
    return gameData.items.find(i => i.id === id);
}

export function updateTiers() {
    let changed = true;
    while (changed) {
        changed = false;
        gameData.items.forEach(item => {
            const newTier = item.parents.length ? Math.max(...item.parents.map(p => (getItem(p.id)?.tier || 0))) + 1 : 0;
            if (item.tier !== newTier) { item.tier = newTier; changed = true; }
        });
    }
}

export function findLooseEnds() {
    return gameData.items.filter(item => (item.tier > 0 && item.parents.length !== 2) || (getChildren(item.id).length === 0 && item.type !== 'factor'));
}

export function getChildren(id) {
    return gameData.items.filter(i => i.parents.some(p => p.id === id));
}

export function canAcquire(itemId, charId = null) {
    const item = getItem(itemId);
    if (!item || item.tier === 0) return true;
    return item.parents.every(p => {
        const parent = getItem(p.id);
        const charLevel = charId ? getCharItemLevel(charId, p.id) : parent.level;
        return charLevel >= p.requiredLevel;
    });
}

export function getCharItemLevel(charId, itemId) {
    const char = gameData.characters.find(c => c.id === charId);
    const charItem = char?.items.find(i => i.id === itemId);
    return charItem?.level || 0;
}

export function evolveItem(id) {
    const item = getItem(id);
    for (let l = 7; l > 1; l--) item.checklists[l] = item.checklists[l-1] || [];
    item.checklists[1] = [];
    item.history.push({ date: new Date().toISOString().split('T')[0], change: 'Evolved by innovation' });
    saveData();
}
