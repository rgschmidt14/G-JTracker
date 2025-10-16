import { gameData, getItem, saveData, canAcquire, getCharItemLevel, createCharacter, createParty, addXp, spendXp, toggleEnhancement } from './data.js';
import { createItemCard } from './ui.js';

export function renderRPGView() {
    const container = document.getElementById('rpg-container');
    container.innerHTML = `
        <div id="rpg-header">
            <h2>RPG Mode</h2>
            <button id="create-char-btn">Create Character</button>
            <button id="create-party-btn">Create Party</button>
        </div>
        <div id="rpg-characters"></div>
        <div id="rpg-parties"></div>
    `;

    renderCharacters();
    renderParties();

    document.getElementById('create-char-btn').addEventListener('click', () => {
        const name = prompt('Enter character name:');
        if (name) {
            createCharacter(name);
            renderRPGView();
        }
    });

    document.getElementById('create-party-btn').addEventListener('click', () => {
        const name = prompt('Enter party name:');
        const charIds = prompt('Enter character IDs, separated by commas:');
        if (name && charIds) {
            createParty(name, charIds.split(','));
            renderRPGView();
        }
    });
}

function acquireItem(charId, itemId) {
    const char = gameData.characters.find(c => c.id === charId);
    const item = getItem(itemId);
    if (!char || !item) return;

    if (char.items.some(i => i.id === itemId)) {
        alert(`${char.name} already has ${item.name}.`);
        return;
    }

    if (canAcquire(itemId, charId)) {
        char.items.push({ id: itemId, level: 0 });
        saveData();
        renderRPGView();
    } else {
        alert(`${char.name} does not meet the prerequisites for ${item.name}.`);
    }
}

function renderCharacters() {
    const container = document.getElementById('rpg-characters');
    container.innerHTML = '<h3>Characters</h3>';
    if (gameData.characters.filter(c => c.name !== 'Me').length === 0) {
        container.innerHTML += '<p>No characters created yet.</p>';
        return;
    }

    gameData.characters.forEach(char => {
        if (char.name === 'Me') return;

        const charSheet = document.createElement('div');
        charSheet.className = 'character-sheet';
        charSheet.innerHTML = `<h4>${char.name} (XP: ${char.xp || 0})</h4>`;

        const itemsContainer = document.createElement('div');
        itemsContainer.className = 'character-items';

        const allItems = document.createElement('div');
        allItems.innerHTML = '<h5>All Items</h5>'
        gameData.items.forEach(item => {
            const card = createItemCard(item, char.id);
            const actions = card.querySelector('.card-actions');

            if (!char.items.some(i => i.id === item.id)) {
                const acquireBtn = document.createElement('button');
                acquireBtn.textContent = 'Acquire';
                acquireBtn.onclick = () => acquireItem(char.id, item.id);
                actions.appendChild(acquireBtn);
            } else {
                const spendXpBtn = document.createElement('button');
                spendXpBtn.textContent = 'Spend XP';
                spendXpBtn.onclick = () => spendXp(char.id, item.id);
                actions.appendChild(spendXpBtn);
            }

            const enhanceBtn = document.createElement('button');
            enhanceBtn.textContent = 'Enhance';
            enhanceBtn.onclick = () => {
                toggleEnhancement(item.id)
                renderRPGView();
            };
            actions.appendChild(enhanceBtn);

            itemsContainer.appendChild(card);
        })

        charSheet.appendChild(itemsContainer);
        container.appendChild(charSheet);
    });
}

function addTemporaryBoost(partyId, itemId, duration) {
    const party = gameData.parties.find(p => p.id === partyId);
    if (!party) return;

    const boost = { itemId, expires: Date.now() + duration };
    party.tempBoosts.push(boost);
    saveData();
    renderRPGView();

    setTimeout(() => {
        party.tempBoosts = party.tempBoosts.filter(b => b.expires > Date.now());
        saveData();
        renderRPGView();
    }, duration);
}


function renderParties() {
    const container = document.getElementById('rpg-parties');
    container.innerHTML = '<h3>Parties</h3>';
    if (gameData.parties.length === 0) {
        container.innerHTML += '<p>No parties created yet.</p>';
        return;
    }

    gameData.parties.forEach(party => {
        const partyEl = document.createElement('div');
        partyEl.className = 'party-sheet';
        const memberNames = party.charIds.map(id => gameData.characters.find(c => c.id === id)?.name || 'Unknown').join(', ');
        partyEl.innerHTML = `<h4>${party.name}</h4><p>Members: ${memberNames}</p>`;

        const sharedItems = document.createElement('div');
        sharedItems.innerHTML = '<h5>Shared Items</h5>';
        const partyItems = gameData.items.filter(item => party.charIds.some(charId => gameData.characters.find(c => c.id === charId).items.some(i => i.id === item.id)));
        partyItems.forEach(item => {
            const card = createItemCard(item);
            sharedItems.appendChild(card);
        })
        partyEl.appendChild(sharedItems);

        const tempBoosts = document.createElement('div');
        tempBoosts.innerHTML = '<h5>Temporary Boosts</h5>';
        party.tempBoosts.forEach(boost => {
            const item = getItem(boost.itemId);
            const boostEl = document.createElement('p');
            boostEl.textContent = `${item.name} (expires ${new Date(boost.expires).toLocaleTimeString()})`;
            tempBoosts.appendChild(boostEl);
        })
        partyEl.appendChild(tempBoosts);

        const addBoostBtn = document.createElement('button');
        addBoostBtn.textContent = 'Add Temp Boost';
        addBoostBtn.onclick = () => {
            const itemId = prompt('Enter item ID for boost:');
            const duration = parseInt(prompt('Enter duration in milliseconds:'));
            if (itemId && duration) {
                addTemporaryBoost(party.id, itemId, duration);
            }
        };
        partyEl.appendChild(addBoostBtn);

        container.appendChild(partyEl);
    });
}
