
document.addEventListener('DOMContentLoaded', function() {
    // --- STATE ---
    let kingOfMenBonusAppliedTo = null;
    let currentProtectiveSlot = null;
    let baseTN = 20; // MODIFIED: Added baseTN for game mode

    // --- ELEMENTS ---
    const bodyVal = document.getElementById('body_val'),
          bodyTN = document.getElementById('body_tn'),
          heartVal = document.getElementById('heart_val'),
          heartTN = document.getElementById('heart_tn'),
          witsVal = document.getElementById('wits_val'),
          witsTN = document.getElementById('wits_tn'),
          enduranceVal = document.getElementById('endurance_val'),
          hopeVal = document.getElementById('hope_val'),
          parryVal = document.getElementById('parry_val'),
          heroicCultureSelect = document.getElementById('heroic_culture'),
          culturalBlessingInput = document.getElementById('cultural_blessing'),
          culturalBlessingDesc = document.getElementById('cultural_blessing_desc'),
          callingSelect = document.getElementById('calling'),
          trait1Select = document.getElementById('trait1_select'),
          trait1Desc = document.getElementById('trait1_desc'),
          trait2Select = document.getElementById('trait2_select'),
          trait2Desc = document.getElementById('trait2_desc'),
          trait3Feature = document.getElementById('trait3_calling_feature'),
          trait3Desc = document.getElementById('trait3_desc'),
          valourInput = document.getElementById('valour'),
          rewardsContainer = document.getElementById('rewards_container');

    // Combat Gear Modal Elements
    const combatGearModal = document.getElementById('combatGearModal'),
          combatGearForm = document.getElementById('combatGearForm'),
          cancelCombatGearBtn = document.getElementById('cancel_combat_gear_btn'),
          combatPresetSelect = document.getElementById('modal_combat_preset');

    // Protective Gear Modal Elements
    const protectiveGearModal = document.getElementById('protectiveGearModal'),
          protectiveGearForm = document.getElementById('protectiveGearForm'),
          cancelProtectiveGearBtn = document.getElementById('cancel_protective_gear_btn'),
          protectivePresetSelect = document.getElementById('modal_protective_preset');

    // --- DATA MAPPINGS ---

    // --- HELPER FUNCTIONS ---
    function handleRankClick(event) {
        const checkbox = event.target;
        if (checkbox.type !== 'checkbox') return;
        if (event.shiftKey) return;
        const checkboxes = Array.from(checkbox.parentNode.children);
        const currentIndex = checkboxes.indexOf(checkbox);
        const isChecking = checkbox.checked;
        for (let i = 0; i < checkboxes.length; i++) {
            if (isChecking) { if (i <= currentIndex) checkboxes[i].checked = true; }
            else { if (i >= currentIndex) checkboxes[i].checked = false; }
        }
    }
    function createRankCheckboxes(containerId, count = 5) {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = '';
        for (let i = 1; i <= count; i++) {
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.name = `${containerId}_rank`;
            checkbox.value = i;
            container.appendChild(checkbox);
        }
        container.addEventListener('click', handleRankClick);
    }
    // MODIFIED: Function to handle game mode change
    function handleModeChange() {
        const selectedMode = document.querySelector('input[name="game_mode"]:checked');
        baseTN = selectedMode ? parseInt(selectedMode.value) : 20;
        updateAttributes();
    }
    // MODIFIED: updated to use baseTN
    function updateAttributes() {
        const bVal = parseInt(bodyVal.value) || 0;
        if (document.activeElement !== bodyTN) bodyTN.value = baseTN - bVal;
        const hVal = parseInt(heartVal.value) || 0;
        if (document.activeElement !== heartTN) heartTN.value = baseTN - hVal;
        const wVal = parseInt(witsVal.value) || 0;
        if (document.activeElement !== witsTN) witsTN.value = baseTN - wVal;
        const selectedCulture = heroicCultureSelect.value;
        const modifiers = cultureData[selectedCulture]?.modifiers || cultureData[""].modifiers;
        const enduranceMax = bVal + modifiers.endurance;
        const hopeMax = hVal + modifiers.hope;
        enduranceVal.textContent = enduranceMax;
        hopeVal.textContent = hopeMax;
        parryVal.textContent = wVal + modifiers.parry;

        const currentEnduranceInput = document.getElementById('current_endurance');
        if(currentEnduranceInput.value === '' || currentEnduranceInput.value === '0') currentEnduranceInput.value = enduranceMax;
        const currentHopeInput = document.getElementById('current_hope');
        if(currentHopeInput.value === '' || currentHopeInput.value === '0') currentHopeInput.value = hopeMax;
    }
    // MODIFIED: updated to use baseTN
    function updateFromTN(sourceTN, targetVal) {
        const tnVal = parseInt(sourceTN.value) || 0;
        targetVal.value = baseTN - tnVal;
        updateAttributes();
    }
    function populateTraitSelectors(traitList) {
        [trait1Select, trait2Select].forEach(select => {
            const currentValue = select.value;
            select.innerHTML = '<option value="">--请选择特质--</option>';
            traitList.forEach(trait => {
                const option = document.createElement('option');
                option.value = trait;
                option.textContent = trait;
                select.appendChild(option);
            });
            select.value = traitList.includes(currentValue) ? currentValue : '';
            select.disabled = traitList.length === 0;
        });
        updateTraitDescriptionsAndDuplicates();
    }
    function updateTraitDescriptionsAndDuplicates() {
        trait1Desc.textContent = traitsData[trait1Select.value] || '';
        trait2Desc.textContent = traitsData[trait2Select.value] || '';
        const val1 = trait1Select.value;
        const val2 = trait2Select.value;
        for (const option of trait2Select.options) { option.disabled = (option.value !== '' && option.value === val1); }
        for (const option of trait1Select.options) { option.disabled = (option.value !== '' && option.value === val2); }
    }
    
    // --- NEW: TOTAL LOAD CALCULATION ---
    function updateTotalLoad() {
        let totalLoad = 0;
        const isDwarf = heroicCultureSelect.value === '都林一族的矮人';

        // 1. 计算所有战斗装备的负重
        document.querySelectorAll('#combat_gear_body input[data-key="load"]').forEach(input => {
            const load = parseInt(input.value, 10);
            if (!isNaN(load)) {
                totalLoad += load;
            }
        });

        // 2. 单独处理防护装备
        // 获取护甲的负重值
        const armorLoadVal = parseInt(document.querySelector('#armor_slot input[data-key="load"]').value, 10);
        if (!isNaN(armorLoadVal)) {
            // 如果是矮人，负重减半并向上取整；否则使用原值
            totalLoad += isDwarf ? Math.ceil(armorLoadVal / 2) : armorLoadVal;
        }
        
        // 获取头盔的负重值
        const helmetLoadVal = parseInt(document.querySelector('#helmet_slot input[data-key="load"]').value, 10);
        if (!isNaN(helmetLoadVal)) {
            // 如果是矮人，负重减半并向上取整；否则使用原值
            totalLoad += isDwarf ? Math.ceil(helmetLoadVal / 2) : helmetLoadVal;
        }

        // 获取盾牌的负重值 (矮人特性不影响盾牌)
        const shieldLoadVal = parseInt(document.querySelector('#shield_slot input[data-key="load"]').value, 10);
        if (!isNaN(shieldLoadVal)) {
            totalLoad += shieldLoadVal; 
        }
        
        // 3. 更新页面上显示的负重值
        document.getElementById('load_val').value = totalLoad;
    }


    function applyCultureSelection(selectedCulture, options = {}) {
        const { clearTraits = true, clearCurrent = true } = options;
        const data = cultureData[selectedCulture] || cultureData[""];
        culturalBlessingInput.value = data.blessing.name;
        culturalBlessingDesc.textContent = data.blessing.description;
        document.getElementById('char_living_standard').value = data.livingStandard;

        if (clearCurrent) {
            document.getElementById('current_endurance').value = '';
            document.getElementById('current_hope').value = '';
        }

        if (clearTraits) {
            trait1Select.value = '';
            trait2Select.value = '';
        }
        populateTraitSelectors(data.traits);
        updateAttributes();
        updateKingOfMenUI();
        updateTotalLoad();

        const wisdomInput = document.getElementById('wisdom');
        const wisdomCount = parseInt(wisdomInput.value) || 0;
        generateVirtueSelectors(wisdomCount, selectedCulture);
        updateVirtueOptions();
    }

    // --- KING OF MEN BONUS ---
    function applyKingOfMenBonus(stat) {
        if (kingOfMenBonusAppliedTo) return;
        const statInput = document.getElementById(stat + '_val');
        if (statInput) {
            statInput.value = (parseInt(statInput.value) || 0) + 1;
            kingOfMenBonusAppliedTo = stat;
            updateAttributes();
            updateKingOfMenUI();
        }
    }

    function removeKingOfMenBonus(silent = false) {
        if (!kingOfMenBonusAppliedTo) return;
        const statInput = document.getElementById(kingOfMenBonusAppliedTo + '_val');
        if(statInput) statInput.value = Math.max(0, parseInt(statInput.value) - 1);
        kingOfMenBonusAppliedTo = null;
        updateAttributes();
        if (!silent) updateKingOfMenUI();
    }

    function updateKingOfMenUI() {
        const bonusContainer = document.getElementById('king_of_men_bonus');
        if (!bonusContainer) return;
        const isRanger = heroicCultureSelect.value === '北方的游民';
        bonusContainer.classList.toggle('hidden', !isRanger);

        bonusContainer.querySelectorAll('button[data-stat]').forEach(btn => {
            btn.disabled = !!kingOfMenBonusAppliedTo;
        });
        document.getElementById('reset_king_bonus').disabled = !kingOfMenBonusAppliedTo;
    }

    // --- DYNAMIC REWARDS ---
    function updateRewardOptions() {
        const rewardSelects = rewardsContainer.querySelectorAll('.reward-select');
        const selectedValues = Array.from(rewardSelects).map(s => s.value).filter(v => v);

        rewardSelects.forEach(select => {
            Array.from(select.options).forEach(option => {
                if (option.value && selectedValues.includes(option.value) && option.value !== select.value) {
                    option.disabled = true;
                } else {
                    option.disabled = false;
                }
            });
        });
    }

    function updateVirtueOptions() {
        const virtueSelects = document.querySelectorAll('.virtue-select');
        const selectedValues = Array.from(virtueSelects).map(s => s.value).filter(v => v);

        virtueSelects.forEach(select => {
            Array.from(select.options).forEach(option => {
                if (option.value && selectedValues.includes(option.value) && option.value !== select.value) {
                    option.disabled = true;
                } else {
                    option.disabled = false;
                }
            });
        });
    }

    function generateRewardSelectors(count) {
        rewardsContainer.innerHTML = '';
        for (let i = 1; i <= count; i++) {
            const infoItem = document.createElement('div');
            infoItem.className = 'info-item';

            const label = document.createElement('label');
            label.setAttribute('for', `reward_select_${i}`);
            label.textContent = `勋绩 ${i}`;

            const select = document.createElement('select');
            select.id = `reward_select_${i}`;
            select.className = 'reward-select';
            select.dataset.descId = `reward_desc_${i}`;

            // Populate options
            const rewardNames = { "": "--请选择勋绩--", "贴身": "贴身 (护甲或头盔)", "精工": "精工 (护甲, 头盔或盾牌)", "致命": "致命 (武器)", "深化": "深化 (武器)", "利刃": "利刃 (武器)", "加固": "加固 (盾牌)" };
            for(const key in rewardNames) {
                const option = document.createElement('option');
                option.value = key;
                option.textContent = rewardNames[key];
                select.appendChild(option);
            }

            const descBox = document.createElement('div');
            descBox.id = `reward_desc_${i}`;
            descBox.className = 'description-box';

            infoItem.appendChild(label);
            infoItem.appendChild(select);
            infoItem.appendChild(descBox);
            rewardsContainer.appendChild(infoItem);
        }
    }

    function generateVirtueSelectors(count, culture) {
        const virtuesContainer = document.getElementById('virtues_container');
        virtuesContainer.innerHTML = '';
        
        // 获取通用美德
        const allVirtues = {...generalVirtuesData};
        
        // 如果有特定文化的美德，也添加进去
        if (culture && cultureSpecificVirtuesData[culture]) {
            Object.assign(allVirtues, cultureSpecificVirtuesData[culture]);
        }
        
        for (let i = 1; i <= count; i++) {
            const infoItem = document.createElement('div');
            infoItem.className = 'info-item';

            const label = document.createElement('label');
            label.setAttribute('for', `virtue_select_${i}`);
            label.textContent = `美德 ${i}`;

            const select = document.createElement('select');
            select.id = `virtue_select_${i}`;
            select.className = 'virtue-select';
            select.dataset.descId = `virtue_desc_${i}`;

            // Populate options
            const option = document.createElement('option');
            option.value = "";
            option.textContent = "--请选择美德--";
            select.appendChild(option);
            
            for(const key in allVirtues) {
                const option = document.createElement('option');
                option.value = key;
                option.textContent = key;
                select.appendChild(option);
            }

            const descBox = document.createElement('div');
            descBox.id = `virtue_desc_${i}`;
            descBox.className = 'description-box';

            infoItem.appendChild(label);
            infoItem.appendChild(select);
            infoItem.appendChild(descBox);
            virtuesContainer.appendChild(infoItem);
        }
    }

    // --- DYNAMIC TABLE FUNCTIONS ---
    function addCombatGearRow(data = {}) {
        const tableBody = document.getElementById('combat_gear_body');
        const newRow = tableBody.insertRow();
        newRow.innerHTML = `
            <td><input type="text" data-key="name" value="${data.name || ''}" class="readonly" readonly></td>
            <td><input type="text" data-key="damage" value="${data.damage || ''}" class="readonly short-input" readonly></td>
            <td><input type="text" data-key="injury" value="${data.injury || ''}" class="readonly short-input" readonly></td>
            <td><input type="number" data-key="load" value="${data.load || ''}" class="readonly short-input" readonly></td>
            <td><input type="text" data-key="notes" value="${data.notes || ''}" class="readonly" readonly></td>
            <td><button type="button" class="remove-row-btn">移除</button></td>
        `;
    }

    // --- SAVE / LOAD ---
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

        charData.gameMode = document.querySelector('input[name="game_mode"]:checked').value;
        charData.rewards = Array.from(rewardsContainer.querySelectorAll('.reward-select')).map(s => s.value);
        charData.virtues = Array.from(document.querySelectorAll('.virtue-select')).map(s => s.value);

        document.querySelectorAll('.skill-ranks').forEach(container => {
            const ranks = [];
            container.querySelectorAll('input:checked').forEach(cb => ranks.push(cb.value));
            charData[container.id] = ranks;
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

        charData.portraitSrc = document.getElementById('portrait_preview').src;
        charData.kingOfMenBonus = kingOfMenBonusAppliedTo;
        return charData;
    }

    function applyCharacterData(charData, isSilent = false) {
        if (!charData || typeof charData !== 'object') {
            if (!isSilent) alert('角色数据格式不正确。');
            return;
        }

        if (charData.gameMode) {
            const modeRadio = document.querySelector(`input[name="game_mode"][value="${charData.gameMode}"]`);
            if (modeRadio) modeRadio.checked = true;
        }
        handleModeChange();

        if (kingOfMenBonusAppliedTo) {
            const oldStatInput = document.getElementById(kingOfMenBonusAppliedTo + '_val');
            if (oldStatInput) oldStatInput.value = Math.max(0, parseInt(oldStatInput.value) - 1);
        }
        kingOfMenBonusAppliedTo = charData.kingOfMenBonus || null;

        document.querySelectorAll('input, textarea, select').forEach(element => {
            if (!element.closest('.gear-table') && !element.closest('.modal-content') && !element.closest('#rewards_container')) {
                const key = element.id || element.name;
                if (Object.prototype.hasOwnProperty.call(charData, key)) {
                    if (element.type === 'radio') return;
                    if (element.id === 'trait1_select' || element.id === 'trait2_select') return;
                    if (element.type === 'checkbox') { element.checked = charData[key]; }
                    else { element.value = charData[key]; }
                }
            }
        });

        if (charData.heroic_culture) {
            heroicCultureSelect.value = charData.heroic_culture;
        }
        applyCultureSelection(heroicCultureSelect.value, { clearTraits: false, clearCurrent: false });

        if (charData.trait1_select) {
            trait1Select.value = charData.trait1_select;
        }
        if (charData.trait2_select) {
            trait2Select.value = charData.trait2_select;
        }
        updateTraitDescriptionsAndDuplicates();

        const valor = parseInt(charData.valour, 10) || 0;
        generateRewardSelectors(valor);
        const savedRewards = charData.rewards || [];
        const rewardSelects = rewardsContainer.querySelectorAll('.reward-select');
        rewardSelects.forEach((select, index) => {
            if (savedRewards[index]) {
                select.value = savedRewards[index];
                select.dispatchEvent(new Event('change', { bubbles: true }));
            }
        });
        updateRewardOptions();

        const savedVirtues = charData.virtues || [];
        const virtueSelects = document.querySelectorAll('.virtue-select');
        virtueSelects.forEach((select, index) => {
            if (savedVirtues[index]) {
                select.value = savedVirtues[index];
                select.dispatchEvent(new Event('change', { bubbles: true }));
            }
        });
        updateVirtueOptions();

        document.querySelectorAll('.skill-ranks').forEach(container => {
            const ranks = charData[container.id] || [];
            container.querySelectorAll('input[type="checkbox"]').forEach(cb => { cb.checked = ranks.includes(cb.value); });
        });

        document.getElementById('combat_gear_body').innerHTML = '';
        (charData.combatGear || []).forEach(rowData => addCombatGearRow(rowData));

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

        if (charData.portraitSrc) { document.getElementById('portrait_preview').src = charData.portraitSrc; }

        if (heroicCultureSelect.value === '北方的游民' && kingOfMenBonusAppliedTo) {
            const statInput = document.getElementById(kingOfMenBonusAppliedTo + '_val');
            if (statInput) statInput.value = (parseInt(statInput.value) || 0) + 1;
        }

        callingSelect.dispatchEvent(new Event('change'));
        updateAttributes();
        updateKingOfMenUI();
        updateTotalLoad();

        if (!isSilent) alert('角色信息已读取。');
    }

    function getSafeExportBaseName(charName, heroicCulture) {
        const rawName = (charName || '角色').toString().trim();
        const rawCulture = (heroicCulture || '未知文化').toString().trim();
        const combined = `${rawName}-${rawCulture}`;
        return combined.replace(/[\\/:*?"<>|]/g, '').replace(/\s+/g, ' ').trim() || '角色-未知文化';
    }

    function exportCharacter() {
        const charData = buildCharacterData();
        const json = JSON.stringify(charData, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const safeName = getSafeExportBaseName(charData.char_name, charData.heroic_culture);
        link.href = url;
        link.download = `${safeName}.json`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
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

    // --- POPULATE PRESETS ---
    function populateCombatGearPresets() {
        combatGearPresets.forEach(gear => {
            const option = document.createElement('option');
            option.value = gear.name;
            option.textContent = gear.name;
            combatPresetSelect.appendChild(option);
        });
    }

    // --- INITIALIZATION ---
    const skillContainers = ['skill_awe', 'skill_athletics', 'skill_awareness', 'skill_hunting', 'skill_song', 'skill_craft', 'skill_enhearten', 'skill_travel', 'skill_insight', 'skill_healing', 'skill_courtesy', 'skill_battle', 'skill_persuade', 'skill_stealth', 'skill_search', 'skill_explore', 'skill_riddle', 'skill_lore', 'prof_axes', 'prof_bows', 'prof_spears', 'prof_swords'];
    skillContainers.forEach(id => createRankCheckboxes(id));

    document.getElementById('combat_gear_body').addEventListener('click', e => {
        if (e.target.classList.contains('remove-row-btn')) {
            e.target.closest('tr').remove();
            updateTotalLoad(); // UPDATE TOTAL LOAD ON REMOVAL
        }
    });

    populateCombatGearPresets();

    // --- EVENT LISTENERS ---
    bodyVal.addEventListener('input', updateAttributes);
    bodyTN.addEventListener('input', () => updateFromTN(bodyTN, bodyVal));
    heartVal.addEventListener('input', updateAttributes);
    heartTN.addEventListener('input', () => updateFromTN(heartTN, heartVal));
    witsVal.addEventListener('input', updateAttributes);
    witsTN.addEventListener('input', () => updateFromTN(witsTN, witsVal));
    
    // MODIFIED: Added listener for game mode change
    document.querySelectorAll('input[name="game_mode"]').forEach(radio => {
        radio.addEventListener('change', handleModeChange);
    });

    heroicCultureSelect.addEventListener('change', (event) => {
        removeKingOfMenBonus(true);
        const selectedCulture = event.target.value;
        applyCultureSelection(selectedCulture, { clearTraits: true, clearCurrent: true });
    });

    callingSelect.addEventListener('change', (event) => {
        const selectedCalling = event.target.value;
        const featureData = callingFeatures[selectedCalling] || callingFeatures[''];
        trait3Feature.value = featureData.name;
        trait3Desc.textContent = featureData.description;
    });

    valourInput.addEventListener('input', () => {
        const count = parseInt(valourInput.value) || 0;
        
        // 保存当前已选择的勋绩
        const currentRewardValues = [];
        rewardsContainer.querySelectorAll('.reward-select').forEach(select => {
            currentRewardValues.push(select.value);
        });
        
        // 重新生成勋绩选择器
        generateRewardSelectors(count);
        
        // 恢复之前已选择的勋绩
        const newRewardSelects = rewardsContainer.querySelectorAll('.reward-select');
        newRewardSelects.forEach((select, index) => {
            if (currentRewardValues[index]) {
                select.value = currentRewardValues[index];
                select.dispatchEvent(new Event('change', { bubbles: true }));
            }
        });
        
        updateRewardOptions();
    });

    // 添加智慧输入框的事件监听器
    const wisdomInput = document.getElementById('wisdom');
    wisdomInput.addEventListener('input', () => {
        const count = parseInt(wisdomInput.value) || 0;
        const currentCulture = heroicCultureSelect.value;
        
        // 保存当前已选择的美德
        const currentVirtueValues = [];
        document.querySelectorAll('.virtue-select').forEach(select => {
            currentVirtueValues.push(select.value);
        });
        
        // 重新生成美德选择器
        generateVirtueSelectors(count, currentCulture);
        
        // 恢复之前已选择的美德
        const newVirtueSelects = document.querySelectorAll('.virtue-select');
        newVirtueSelects.forEach((select, index) => {
            if (currentVirtueValues[index]) {
                select.value = currentVirtueValues[index];
                select.dispatchEvent(new Event('change', { bubbles: true }));
            }
        });
        
        updateVirtueOptions();
    });

    rewardsContainer.addEventListener('change', (e) => {
        if (e.target.matches('.reward-select')) {
            const descId = e.target.dataset.descId;
            const descBox = document.getElementById(descId);
            if (descBox) {
                descBox.innerText = rewardsData[e.target.value] || '';
            }
            updateRewardOptions();
        }
    });

    // 添加美德描述显示逻辑
    document.addEventListener('change', (e) => {
        if (e.target.matches('.virtue-select')) {
            const descId = e.target.dataset.descId;
            const descBox = document.getElementById(descId);
            if (descBox) {
                // 获取当前选择的美德名称
                const selectedVirtue = e.target.value;
                
                // 查找美德描述（先查通用美德，再查种族特定美德）
                let virtueDescription = generalVirtuesData[selectedVirtue] || '';
                
                // 如果没找到，查找当前文化特定的美德
                const currentCulture = heroicCultureSelect.value;
                if (currentCulture && cultureSpecificVirtuesData[currentCulture] && cultureSpecificVirtuesData[currentCulture][selectedVirtue]) {
                    virtueDescription = cultureSpecificVirtuesData[currentCulture][selectedVirtue];
                }
                
                descBox.innerText = virtueDescription;
            }
            updateVirtueOptions();
        }
    });

    trait1Select.addEventListener('change', updateTraitDescriptionsAndDuplicates);
    trait2Select.addEventListener('change', updateTraitDescriptionsAndDuplicates);

    document.getElementById('portrait_upload').addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = e => document.getElementById('portrait_preview').src = e.target.result;
            reader.readAsDataURL(file);
        }
    });

    const kingOfMenBonus = document.getElementById('king_of_men_bonus');
    if (kingOfMenBonus) {
        kingOfMenBonus.addEventListener('click', e => {
            if (e.target.matches('button[data-stat]')) {
                applyKingOfMenBonus(e.target.dataset.stat);
            } else if (e.target.matches('#reset_king_bonus')) {
                removeKingOfMenBonus();
            }
        });
    }

    // --- MODAL LISTENERS ---
    // Combat Gear
    document.getElementById('add_combat_gear_btn').addEventListener('click', () => {
        combatGearForm.reset();
        combatPresetSelect.dispatchEvent(new Event('change'));
        combatGearModal.classList.remove('hidden');
    });
    combatGearForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const gearData = {
            name: document.getElementById('modal_combat_name').value,
            damage: document.getElementById('modal_combat_damage').value,
            injury: document.getElementById('modal_combat_injury').value,
            load: document.getElementById('modal_combat_load').value,
            notes: document.getElementById('modal_combat_notes').value
        };
        addCombatGearRow(gearData);
        combatGearModal.classList.add('hidden');
        updateTotalLoad(); // UPDATE TOTAL LOAD ON ADDITION
    });
    cancelCombatGearBtn.addEventListener('click', () => combatGearModal.classList.add('hidden'));
    combatGearModal.addEventListener('click', (e) => { if (e.target === combatGearModal) combatGearModal.classList.add('hidden'); });
    combatPresetSelect.addEventListener('change', function() {
        const selectedName = this.value;
        const selectedGear = combatGearPresets.find(gear => gear.name === selectedName);
        if (selectedGear) {
            document.getElementById('modal_combat_name').value = selectedGear.name;
            document.getElementById('modal_combat_damage').value = selectedGear.damage;
            document.getElementById('modal_combat_injury').value = selectedGear.injury;
            document.getElementById('modal_combat_load').value = selectedGear.load;
            document.getElementById('modal_combat_notes').value = selectedGear.notes;
        } else {
            combatGearForm.reset();
        }
    });

    // Protective Gear
    document.getElementById('protective_gear_body').addEventListener('click', (e) => {
        const row = e.target.closest('tr');
        if (!row) return;
        const slot = row.id ? row.id.replace('_slot', '') : '';
        if (!slot) return;

        currentProtectiveSlot = slot;
        protectiveGearForm.reset();

        protectivePresetSelect.innerHTML = '<option value="">--自定义或选择一项--</option>';
        const filteredPresets = protectiveGearPresets.filter(gear => {
            const type = gear.type.toLowerCase();
            if (currentProtectiveSlot === 'armor' && (type.includes('甲') || type.includes('衣'))) return true;
            if (currentProtectiveSlot === 'helmet' && type.includes('头')) return true;
            if (currentProtectiveSlot === 'shield' && type.includes('盾')) return true;
            return false;
        });
        filteredPresets.forEach(gear => {
            const option = document.createElement('option');
            option.value = gear.name;
            option.textContent = gear.name;
            protectivePresetSelect.appendChild(option);
        });

        protectiveGearModal.classList.remove('hidden');
    });

    protectiveGearForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!currentProtectiveSlot) return;
        const gearData = {
            name: document.getElementById('modal_protective_name').value,
            value: document.getElementById('modal_protective_value').value,
            load: document.getElementById('modal_protective_load').value,
            notes: document.getElementById('modal_protective_notes').value
        };
        const targetRow = document.getElementById(`${currentProtectiveSlot}_slot`);
        if (targetRow) {
            const notesInput = targetRow.querySelector('input[data-key="notes"]');
            targetRow.querySelector('input[data-key="name"]').value = gearData.name;
            targetRow.querySelector('input[data-key="value"]').value = gearData.value;
            targetRow.querySelector('input[data-key="load"]').value = gearData.load;
            if (notesInput) notesInput.value = gearData.notes;
        }
        protectiveGearModal.classList.add('hidden');
        currentProtectiveSlot = null;
        updateTotalLoad(); // UPDATE TOTAL LOAD ON SELECTION/CHANGE
    });
    cancelProtectiveGearBtn.addEventListener('click', () => protectiveGearModal.classList.add('hidden'));
    protectiveGearModal.addEventListener('click', (e) => { if (e.target === protectiveGearModal) protectiveGearModal.classList.add('hidden'); });
    protectivePresetSelect.addEventListener('change', function() {
        const selectedName = this.value;
        const selectedGear = protectiveGearPresets.find(gear => gear.name === selectedName);
        if (selectedGear) {
            document.getElementById('modal_protective_name').value = selectedGear.name;
            document.getElementById('modal_protective_value').value = selectedGear.value;
            document.getElementById('modal_protective_load').value = selectedGear.load;
            document.getElementById('modal_protective_notes').value = selectedGear.type;
        } else {
            protectiveGearForm.reset();
        }
    });

    // --- BUTTONS ---
    document.getElementById('save-btn').addEventListener('click', exportCharacter);
    document.getElementById('load-btn').addEventListener('click', importCharacter);
    document.getElementById('export-btn').addEventListener('click', () => {
        alert('为保证打印正确，请在打印界面“更多设置”中，将纸张尺寸设置为“A3”，并勾选背景图形。');
        const originalTitle = document.title;
        const safeName = getSafeExportBaseName(
            document.getElementById('char_name').value,
            heroicCultureSelect.value
        );
        document.title = safeName;
        const restoreTitle = () => {
            document.title = originalTitle;
            window.removeEventListener('afterprint', restoreTitle);
        };
        window.addEventListener('afterprint', restoreTitle);
        window.print();
        setTimeout(() => {
            document.title = originalTitle;
        }, 1000);
    });
    document.getElementById('reset-btn').addEventListener('click', () => {
        if (confirm('确定要重置所有数据吗？此操作不可撤销。')) {
            // MODIFIED: Set game mode to normal
            document.getElementById('mode_normal').checked = true;
            baseTN = 20;

            const defaultZeroIds = ['body_val', 'heart_val', 'wits_val', 'fatigue_val', 'shadow_scar_val', 'valour', 'wisdom'];

            document.querySelectorAll('.character-sheet input, .character-sheet textarea, .character-sheet select').forEach(el => {
                if (el.closest('.modal-content') || el.closest('#rewards_container')) return;

                if (el.type === 'checkbox' || el.type === 'radio') {
                    // Handled separately above for game mode
                    if (el.name !== 'game_mode') el.checked = false;
                } else if (el.tagName === 'SELECT') {
                    el.selectedIndex = 0;
                } else if (!['button', 'submit', 'reset', 'file'].includes(el.type)) {
                    if (defaultZeroIds.includes(el.id)) {
                        el.value = '0';
                    } else {
                        el.value = '';
                    }
                }
            });

            rewardsContainer.innerHTML = '';

            document.getElementById('portrait_preview').src = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNTAiIGhlaWdodD0iMjAwIiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzg4OCIgc3Ryb2tlLXdpZHRoPSIxIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Ik0yMCAyMWE4IDggMCAwIDAtMTYgME0xMiAxM2E0IDQgMCAxIDAgMC04IDQgNCAwIDAgMCAwIDhaIi8+PC9zdmc+";
            document.getElementById('portrait_upload').value = '';

            document.getElementById('combat_gear_body').innerHTML = '';
            document.querySelectorAll('#protective_gear_body input[data-key]').forEach(input => { input.value = ''; });

            removeKingOfMenBonus(true);

            heroicCultureSelect.dispatchEvent(new Event('change'));
            callingSelect.dispatchEvent(new Event('change'));

            updateAttributes();
            updateKingOfMenUI();
            updateTotalLoad(); // UPDATE TOTAL LOAD ON RESET
            alert('人物卡已重置。');
        }
    });

    // Call updateAttributes on initial load to set derived values based on defaults
    updateAttributes();

});
