import { gameData, saveData } from './data.js';

export function getLevelGrade(lvl) {
    const grades = ['F', 'D', 'C', 'B', 'A-', 'A', 'S', 'Z'];
    return grades[lvl] || 'F';
}

export function applyTheme() {
    document.body.dataset.theme = gameData.settings.theme;
}

export function toggleTheme() {
    const themes = ['light', 'dark', 'orange'];
    const currentThemeIndex = themes.indexOf(gameData.settings.theme);
    gameData.settings.theme = themes[(currentThemeIndex + 1) % themes.length];
    saveData();
    applyTheme();
}

export function getEmojiBadge(itemName) {
    if (!gameData.settings.emojis) return '';
    if (itemName.toLowerCase().includes('fox')) return '🦊';
    if (itemName.toLowerCase().includes('fly')) return '🪶';
    return '';
}
