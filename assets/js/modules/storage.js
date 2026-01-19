(function() {
    const app = window.TorCharacterApp = window.TorCharacterApp || {};

    function collectTableData(tableBodyId) {
        const rows = document.querySelectorAll(`#${tableBodyId} tr`);
        return Array.from(rows).map(row => {
            const rowData = {};
            row.querySelectorAll('input, select').forEach(input => {
                if (input.dataset.key) {
                    rowData[input.dataset.key] = input.value;
                }
            });
            return rowData;
        });
    }

    function buildCharacterData() {
        const charData = {};
        document.querySelectorAll('input, textarea, select').forEach(element => {
            const key = element.id || element.name;
            if (key && !element.closest('.gear-table') && !element.closest('.modal-content') && !element.closest('#rewards_container')) {
                if (element.type === 'radio') {
                    if (element.checked) charData[key] = element.value;
                } else if (element.type === 'checkbox') {
                    charData[key] = element.checked;
                } else {
                    charData[key] = element.value;
                }
            }
        });

        const gameModeChecked = document.querySelector('input[name="game_mode"]:checked');
        if (gameModeChecked) charData.gameMode = gameModeChecked.value;
        charData.rewards = Array.from(app.elements.rewardsContainer.querySelectorAll('.reward-select')).map(s => s.value);
        if (app.rewards) {
            if (app.rewards.getCustomRewards) {
                charData.customRewards = app.rewards.getCustomRewards();
            }
            if (app.rewards.getCustomRewardLibraryData) {
                charData.customRewardsLibrary = app.rewards.getCustomRewardLibraryData();
            }
            if (app.rewards.getCustomRewardSelections) {
                charData.customRewardSelections = app.rewards.getCustomRewardSelections();
            }
        }
        charData.virtues = Array.from(document.querySelectorAll('.virtue-select')).map(s => s.value);

        document.querySelectorAll('.skill-ranks').forEach(container => {
            const rankCount = container.querySelectorAll('input:checked').length;
            charData[container.id] = rankCount;
        });

        charData.combatGear = collectTableData('combat_gear_body');
        charData.protectiveGear = {};
        document.querySelectorAll('#protective_gear_body tr').forEach(row => {
            const slot = row.id.replace('_slot', '');
            if (slot) {
                const notesInput = row.querySelector('input[data-key="notes"]');
                charData.protectiveGear[slot] = {
                    name: row.querySelector('input[data-key="name"]').value,
                    value: row.querySelector('input[data-key="value"]').value,
                    load: row.querySelector('input[data-key="load"]').value,
                    notes: notesInput ? notesInput.value : '',
                };
            }
        });

        charData.portraitSrc = app.elements.portraitPreview.src;
        charData.kingOfMenBonus = app.state.kingOfMenBonusAppliedTo;
        return charData;
    }

    function applyCharacterData(charData, isSilent = false) {
        if (!charData || typeof charData !== 'object') {
            if (!isSilent) alert('角色数据格式不正确。');
            return;
        }
        app.state.isRestoring = true;

        if (charData.gameMode) {
            const modeRadio = document.querySelector(`input[name="game_mode"][value="${charData.gameMode}"]`);
            if (modeRadio) modeRadio.checked = true;
        }
        app.core.handleModeChange();

        if (app.state.kingOfMenBonusAppliedTo) {
            const oldStatInput = document.getElementById(app.state.kingOfMenBonusAppliedTo + '_val');
            if (oldStatInput) oldStatInput.value = Math.max(0, parseInt(oldStatInput.value, 10) - 1);
        }
        app.state.kingOfMenBonusAppliedTo = charData.kingOfMenBonus || null;

        const zeroDefaults = new Set([
            'adventure_points',
            'skill_points',
            'fellowship_points',
            'shadow_val'
        ]);

        document.querySelectorAll('input, textarea, select').forEach(element => {
            if (!element.closest('.gear-table') && !element.closest('.modal-content') && !element.closest('#rewards_container')) {
                const key = element.id || element.name;
                if (Object.prototype.hasOwnProperty.call(charData, key)) {
                    if (element.type === 'radio') return;
                    if (element.id === 'trait1_select' || element.id === 'trait2_select') return;
                    if (element.type === 'checkbox') { element.checked = charData[key]; }
                    else {
                        const rawValue = charData[key];
                        element.value = (zeroDefaults.has(element.id) && (rawValue === '' || rawValue == null)) ? '0' : rawValue;
                    }
                }
            }
        });

        if (charData.heroic_culture) {
            app.elements.heroicCultureSelect.value = charData.heroic_culture;
        }
        app.core.applyCultureSelection(app.elements.heroicCultureSelect.value, { clearTraits: false, clearCurrent: false });

        if (charData.trait1_select) {
            app.elements.trait1Select.value = charData.trait1_select;
        }
        if (charData.trait2_select) {
            app.elements.trait2Select.value = charData.trait2_select;
        }
        app.core.updateTraitDescriptionsAndDuplicates();

        const valor = parseInt(charData.valour, 10) || 0;
        app.rewards.generateRewardSelectors(valor);
        if (app.rewards.applyCustomRewardLibraryData) {
            app.rewards.applyCustomRewardLibraryData(charData.customRewardsLibrary);
        }
        if (app.rewards.applyCustomRewardSelections) {
            app.rewards.applyCustomRewardSelections(charData.customRewardSelections);
        }
        if (app.rewards.applyCustomRewards) {
            app.rewards.applyCustomRewards(charData.customRewards);
        }
        const savedRewards = charData.rewards || [];
        const rewardSelects = app.elements.rewardsContainer.querySelectorAll('.reward-select');
        rewardSelects.forEach((select, index) => {
            if (savedRewards[index]) {
                select.value = savedRewards[index];
                select.dispatchEvent(new Event('change', { bubbles: true }));
            }
        });
        app.rewards.updateRewardOptions();

        const savedVirtues = charData.virtues || [];
        const virtueSelects = document.querySelectorAll('.virtue-select');
        virtueSelects.forEach((select, index) => {
            if (savedVirtues[index]) {
                select.value = savedVirtues[index];
                select.dispatchEvent(new Event('change', { bubbles: true }));
            }
        });
        app.rewards.updateVirtueOptions();

        document.querySelectorAll('.skill-ranks').forEach(container => {
            const rawRank = charData[container.id];
            let rankValue = 0;
            if (Array.isArray(rawRank)) {
                const numericRanks = rawRank.map(value => parseInt(value, 10)).filter(value => !Number.isNaN(value));
                rankValue = numericRanks.length ? Math.max(...numericRanks) : 0;
            } else if (rawRank != null && rawRank !== '') {
                const parsedRank = parseInt(rawRank, 10);
                rankValue = Number.isNaN(parsedRank) ? 0 : parsedRank;
            }
            app.core.setSkillRanks(container.id, rankValue);
        });

        document.getElementById('combat_gear_body').innerHTML = '';
        (charData.combatGear || []).forEach(rowData => app.gear.addCombatGearRow(rowData));

        if (charData.protectiveGear) {
            for (const slot in charData.protectiveGear) {
                const gearData = charData.protectiveGear[slot];
                const targetRow = document.getElementById(`${slot}_slot`);
                if (targetRow && gearData) {
                    const notesInput = targetRow.querySelector('input[data-key="notes"]');
                    targetRow.querySelector('input[data-key="name"]').value = gearData.name || '';
                    targetRow.querySelector('input[data-key="value"]').value = gearData.value || '';
                    targetRow.querySelector('input[data-key="load"]').value = gearData.load || '';
                    if (notesInput) notesInput.value = gearData.notes || '';
                }
            }
        }

        if (charData.portraitSrc) { app.elements.portraitPreview.src = charData.portraitSrc; }

        if (app.elements.heroicCultureSelect.value === '北方的游民' && app.state.kingOfMenBonusAppliedTo) {
            const statInput = document.getElementById(app.state.kingOfMenBonusAppliedTo + '_val');
            if (statInput) statInput.value = (parseInt(statInput.value, 10) || 0) + 1;
        }

        app.elements.callingSelect.dispatchEvent(new Event('change'));
        app.core.updateAttributes();
        app.king.updateKingOfMenUI();
        app.gear.updateTotalLoad();

        app.state.isRestoring = false;
        if (!isSilent) alert('角色信息已读取。');
    }

    function getSafeExportBaseName(charName, heroicCulture, calling, valour, wisdom) {
        const rawName = (charName || '角色').toString().trim();
        const rawCulture = (heroicCulture || '未知文化').toString().trim();
        const rawCalling = (calling || '未知呼召').toString().trim();
        const rawValour = (valour ?? '').toString().trim() || '0';
        const rawWisdom = (wisdom ?? '').toString().trim() || '0';
        const combined = `${rawName}-${rawCulture}-${rawCalling}-英勇${rawValour}-智慧${rawWisdom}`;
        return combined.replace(/[\\/:*?"<>|]/g, '').replace(/\s+/g, ' ').trim()
            || '角色-未知文化-未知呼召-英勇0-智慧0';
    }

    function exportCharacter() {
        const charData = buildCharacterData();
        const json = JSON.stringify(charData, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const safeName = getSafeExportBaseName(
            charData.char_name,
            charData.heroic_culture,
            charData.calling,
            charData.valour,
            charData.wisdom
        );
        link.href = url;
        link.download = `${safeName}.json`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    }

    function saveToLocalStorage() {
        if (app.state.isRestoring) return;
        try {
            const charData = buildCharacterData();
            localStorage.setItem(app.state.autoSaveKey, JSON.stringify(charData));
        } catch (err) {
            // Ignore storage failures (private mode or quota).
        }
    }

    function loadFromLocalStorage() {
        try {
            const saved = localStorage.getItem(app.state.autoSaveKey);
            if (!saved) return;
            const charData = JSON.parse(saved);
            applyCharacterData(charData, true);
        } catch (err) {
            // Ignore invalid autosave data.
        }
    }

    function importCharacter() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,application/json';
        input.style.display = 'none';
        document.body.appendChild(input);
        input.addEventListener('change', () => {
            const file = input.files && input.files[0];
            if (!file) {
                input.remove();
                return;
            }
            const reader = new FileReader();
            reader.onload = () => {
                try {
                    const charData = JSON.parse(reader.result);
                    applyCharacterData(charData, false);
                } catch (err) {
                    alert('读取失败：文件不是有效的JSON。');
                } finally {
                    input.remove();
                }
            };
            reader.readAsText(file);
        }, { once: true });
        input.click();
    }

    app.storage = {
        buildCharacterData,
        applyCharacterData,
        getSafeExportBaseName,
        exportCharacter,
        saveToLocalStorage,
        loadFromLocalStorage,
        importCharacter
    };
})();
