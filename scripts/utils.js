import { gameData, saveData } from './data.js';

export function getLevelGrade(lvl) {
    const grades = ['F', 'D', 'C', 'B', 'A-', 'A', 'S', 'Z'];
    return grades[lvl] || 'F';
}

export function applyTheme() {
    document.body.dataset.theme = gameData.settings.theme;
}

export function toggleTheme() {
    gameData.settings.theme = gameData.settings.theme === 'light' ? 'dark' : 'light';
    saveData();
    applyTheme();
}

export function confirmDivineUnlock(level) {
    if (level === 7) {
        return confirm("Is this a Divine Unlock? This is reserved for truly exceptional, faith-based insights.");
    }
    return true;
}
