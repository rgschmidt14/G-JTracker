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

    // Ensure a default "Me" character exists for Notebook mode
    if (!gameData.characters.some(c => c.name === 'Me')) {
        gameData.characters.push({
            id: 'char_me',
            name: 'Me',
            items: [],
            goals: [],
            journals: {}
        });
    }

    // Ensure all characters have the new fields
    gameData.characters.forEach(char => {
        if (!char.goals) char.goals = [];
        if (!char.journals) char.journals = {};
    });

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
            const oldTier = item.tier;
            const newTier = item.parents.length ? Math.max(...item.parents.map(p => (getItem(p.id)?.tier || 0))) + 1 : 0;
            if (oldTier !== newTier) {
                item.tier = newTier;
                changed = true;
            }
            item.isPrime = getChildren(item.id).length === 0;
        });
    }
}

export function findLooseEnds() {
    return gameData.items.filter(item => (item.tier > 0 && item.parents.length !== 2) || (item.isPrime && item.type !== 'factor'));
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
    if (!item) return;

    // Shift checklists down
    for (let l = 7; l > 1; l--) {
        item.checklists[l] = item.checklists[l - 1] || [];
    }
    item.checklists[1] = []; // Clear lowest level

    // Add to history
    if (!item.history) item.history = [];
    item.history.push({
        date: new Date().toISOString().split('T')[0],
        change: `Evolved (level ${item.level} checklists shifted down).`
    });

    saveData();
}

export function incrementLevel(id, charId = null) {
    const item = getItem(id);
    if (!item) return;

    const currentLevel = charId ? getCharItemLevel(charId, id) : item.level;
    if (currentLevel >= 7) return;

    // Check if current level's checklist is complete
    const checklist = item.checklists[currentLevel + 1] || [];
    if (charId) {
        const char = gameData.characters.find(c => c.id === charId);
        const charItem = char?.items.find(i => i.id === id);
        const progress = charItem?.checklistProgress[currentLevel + 1] || [];
        if (checklist.length > 0 && !checklist.every((_, i) => progress[i])) {
            return; // Not complete
        }
    }

    // Check prerequisites for the next level
    if (!canAcquire(id, charId)) return;

    // Level up
    let newLevel = currentLevel + 1;
    if (newLevel > 5 && !item.enhanced) {
        if (!confirm("This requires enhancement. Proceed?")) return;
        item.enhanced = true;
    }
    if (newLevel === 7) {
        if (!confirm("Is this truly fathomable? Or is it divine insight?")) {
            newLevel = 6; // Bump down to S-tier
            item.level = newLevel;
            // Maybe add a special note or flag here
        }
    }

    if (charId) {
        const char = gameData.characters.find(c => c.id === charId);
        const charItem = char.items.find(i => i.id === id);
        if (charItem) charItem.level = newLevel;
    } else {
        item.level = newLevel;
    }

    saveData();
}
