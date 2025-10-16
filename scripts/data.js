import { applyTheme } from './utils.js';
export const gameData = {
    items: [],
    characters: [],
    parties: [],
    settings: { theme: 'light', discoveryMode: false, emojis: true }
};
const STORAGE_key = 'GJTracker';

let renderCurrentView = () => {};
export function setRenderCurrentView(fn) {
    renderCurrentView = fn;
}

export function saveData() {
    localStorage.setItem(STORAGE_key, JSON.stringify(gameData));
}

export function loadData() {
    const saved = localStorage.getItem(STORAGE_key);
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
        const charLevel = charId ? getCharItemLevel(charId, p.id) : (parent.level || 0);
        return charLevel >= (p.requiredLevel || 5);
    });
}

export function applyTemporaryBoost(charId, itemId, duration) {
    const char = gameData.characters.find(c => c.id === charId);
    const charItem = char.items.find(i => i.id === itemId);
    if (charItem) {
        charItem.level++;
        setTimeout(() => {
            charItem.level--;
            renderCurrentView();
        }, duration);
    }
}

export function getCharItemLevel(charId, itemId) {
    const char = gameData.characters.find(c => c.id === charId);
    const charItem = char?.items.find(i => i.id === itemId);
    return charItem?.level || 0;
}

export function updateChecklist(charId, itemId, lvl, idx, checked) {
    const char = gameData.characters.find(c => c.id === charId);
    const charItem = char.items.find(i => i.id === itemId);
    if (!charItem.checklistProgress) charItem.checklistProgress = {};
    if (!charItem.checklistProgress[lvl]) charItem.checklistProgress[lvl] = [];
    charItem.checklistProgress[lvl][idx] = checked;

    // Check for level up
    const item = getItem(itemId);
    const requiredTasks = item.checklists[charItem.level + 1] || [];
    const progress = charItem.checklistProgress[charItem.level + 1] || [];
    if (requiredTasks.every((_, i) => progress[i])) {
        incrementLevel(itemId, charId);
    }

    saveData();
    renderCurrentView();
}

export function getChecklistProgress(charId, itemId, lvl) {
    const char = gameData.characters.find(c => c.id === charId);
    const charItem = char.items.find(i => i.id === itemId);
    return charItem?.checklistProgress?.[lvl] || [];
}

export function evolveItem(id) {
    const item = getItem(id);
    for (let l = 7; l > 1; l--) {
        item.checklists[l] = item.checklists[l - 1] || [];
    }
    item.checklists[1] = [];
    item.history.push({ date: new Date().toISOString().split('T')[0], change: 'Evolved by innovation' });
    saveData();
    renderCurrentView();
}

export function incrementLevel(itemId, charId = null) {
    if (charId) {
        const char = gameData.characters.find(c => c.id === charId);
        const charItem = char.items.find(i => i.id === itemId);
        if (charItem) {
            const item = getItem(itemId);
            if (charItem.level < 7 && (charItem.level < 5 || item.enhanced)) {
                if (canAcquire(itemId, charId)) {
                    charItem.level++;
                }
            }
        }
    } else {
        const item = getItem(itemId);
        if (item && item.level < 7) {
            item.level++;
        }
    }
    saveData();
    renderCurrentView();
}
