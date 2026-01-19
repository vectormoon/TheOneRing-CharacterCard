(function() {
    const app = window.TorCharacterApp = window.TorCharacterApp || {};
    const emptyRewardText = '请选择您的勋绩';
    const emptyVirtueText = '请选择您的美德';
    const customRewardKey = '自定义勋绩';
    const customRewardDescriptionPlaceholder = '请填写自定义勋绩效果。';
    const customRewardEditKey = '__edit_custom_reward__';
    const customRewardOptionPrefix = '__custom_reward__::';

    function updateRewardOptions() {
        const rewardSelects = app.elements.rewardsContainer.querySelectorAll('.reward-select');
        const selectedValues = Array.from(rewardSelects).map(s => s.value).filter(v => v);

        rewardSelects.forEach(select => {
            Array.from(select.options).forEach(option => {
                if (option.value === customRewardKey || option.value === customRewardEditKey || option.value.startsWith(customRewardOptionPrefix)) {
                    option.disabled = false;
                } else if (option.value && selectedValues.includes(option.value) && option.value !== select.value) {
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

    function getVirtueModifiers() {
        const modifiers = { endurance: 0, hope: 0, parry: 0 };
        const wisdomValue = parseInt(app.elements.wisdomInput.value, 10) || 0;
        const bonusData = typeof virtueBonusData === 'undefined' ? null : virtueBonusData;
        document.querySelectorAll('.virtue-select').forEach(select => {
            const virtueKey = select.value;
            if (!virtueKey || !bonusData || !bonusData[virtueKey]) return;
            const virtueBonus = bonusData[virtueKey];
            if (virtueBonus.enduranceUsesWisdom) {
                const scaledEndurance = Math.max(virtueBonus.endurance || 0, wisdomValue);
                modifiers.endurance += scaledEndurance;
            } else if (virtueBonus.endurance) {
                modifiers.endurance += virtueBonus.endurance;
            }
            if (virtueBonus.hope) modifiers.hope += virtueBonus.hope;
            if (virtueBonus.parry) modifiers.parry += virtueBonus.parry;
        });
        return modifiers;
    }

    function buildRewardSelectOptions(select) {
        pruneCustomRewardLibrary();
        const rewardNames = {
            "": "--请选择勋绩--",
            "贴身": "贴身 (护甲或头盔)",
            "精工": "精工 (护甲, 头盔或盾牌)",
            "致命": "致命 (武器)",
            "深化": "深化 (武器)",
            "利刃": "利刃 (武器)",
            "加固": "加固 (盾牌)"
        };
        select.innerHTML = '';
        for (const key in rewardNames) {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = rewardNames[key];
            select.appendChild(option);
        }
        const library = getCustomRewardLibrary();
        library.forEach(item => {
            if (!item.name || !item.name.trim()) return;
            const option = document.createElement('option');
            option.value = getCustomRewardOptionValue(item.id);
            option.textContent = item.name;
            select.appendChild(option);
        });
        const editOption = document.createElement('option');
        editOption.value = customRewardEditKey;
        editOption.textContent = '编辑自定义勋绩';
        select.appendChild(editOption);
        const customOption = document.createElement('option');
        customOption.value = customRewardKey;
        customOption.textContent = customRewardKey;
        customOption.hidden = true;
        select.appendChild(customOption);
    }

    function refreshRewardSelectOptions() {
        app.elements.rewardsContainer.querySelectorAll('.reward-select').forEach(select => {
            const infoItem = select.closest('.info-item');
            const currentValue = select.value;
            const slot = getSlotCustomReward(infoItem);
            buildRewardSelectOptions(select);
            const customOptionValue = currentValue && currentValue.startsWith(customRewardOptionPrefix) ? customRewardKey : currentValue;
            if (customOptionValue && Array.from(select.options).some(option => option.value === customOptionValue)) {
                select.value = customOptionValue;
            }
            if (slot && slot.id) {
                select.value = customRewardKey;
            }
            updateCustomRewardDisplay(select);
        });
        updateRewardOptions();
    }

    function generateRewardSelectors(count) {
        const { rewardsContainer } = app.elements;
        rewardsContainer.innerHTML = '';
        for (let i = 1; i <= count; i++) {
            const infoItem = document.createElement('div');
            infoItem.className = 'info-item';

            const select = document.createElement('select');
            select.id = `reward_select_${i}`;
            select.className = 'reward-select';
            select.dataset.descId = `reward_desc_${i}`;
            select.setAttribute('aria-label', `勋绩 ${i}`);

            buildRewardSelectOptions(select);

            const descBox = document.createElement('div');
            descBox.id = `reward_desc_${i}`;
            descBox.className = 'description-box';
            descBox.innerText = emptyRewardText;

            const idInput = document.createElement('input');
            idInput.type = 'hidden';
            idInput.id = `custom_reward_id_${i}`;
            idInput.className = 'custom-reward-id-store';

            const nameInput = document.createElement('input');
            nameInput.type = 'hidden';
            nameInput.id = `custom_reward_name_${i}`;
            nameInput.className = 'custom-reward-name-store';

            const descInput = document.createElement('textarea');
            descInput.id = `custom_reward_desc_${i}`;
            descInput.className = 'custom-reward-desc-store';
            descInput.hidden = true;

            infoItem.appendChild(select);
            infoItem.appendChild(descBox);
            infoItem.appendChild(idInput);
            infoItem.appendChild(nameInput);
            infoItem.appendChild(descInput);
            rewardsContainer.appendChild(infoItem);
        }
    }

    let activeCustomRewardSelect = null;
    let customRewardModal = null;
    let customRewardForm = null;
    let customRewardNameInput = null;
    let customRewardDescInput = null;
    let customRewardList = null;
    let customRewardAddButton = null;
    let customRewardDeleteButton = null;
    let customRewardSaveButton = null;
    let customRewardCancelButton = null;
    let activeCustomRewardId = null;

    function getCustomRewardLibrary() {
        if (!app.state.customRewards) {
            app.state.customRewards = [];
        }
        if (!app.state.customRewardNextId) {
            app.state.customRewardNextId = 1;
        }
        return app.state.customRewards;
    }

    function refreshCustomRewardNextId() {
        const library = getCustomRewardLibrary();
        const maxId = library.reduce((max, item) => Math.max(max, item.id || 0), 0);
        app.state.customRewardNextId = maxId + 1;
    }

    function getCustomRewardById(id) {
        const library = getCustomRewardLibrary();
        return library.find(item => item.id === id) || null;
    }

    function findCustomRewardByContent(name, description) {
        const library = getCustomRewardLibrary();
        return library.find(item => item.name === name && item.description === description) || null;
    }

    function pruneCustomRewardLibrary() {
        const library = getCustomRewardLibrary();
        const removedIds = library
            .filter(item => !item || !item.name || !item.name.trim())
            .map(item => item && item.id)
            .filter(id => id != null);
        if (!removedIds.length) return;
        app.state.customRewards = library.filter(item => item && item.name && item.name.trim());
        if (activeCustomRewardId && removedIds.includes(activeCustomRewardId)) {
            activeCustomRewardId = null;
        }
        document.querySelectorAll('#rewards_container .info-item').forEach(item => {
            const slot = getSlotCustomReward(item);
            if (slot && slot.id && removedIds.includes(slot.id)) {
                setSlotCustomReward(item, null);
                const select = item.querySelector('.reward-select');
                if (select && select.value === customRewardKey) {
                    select.value = '';
                    updateCustomRewardDisplay(select);
                }
            }
        });
        refreshCustomRewardNextId();
    }

    function getCustomRewardOptionValue(id) {
        return `${customRewardOptionPrefix}${id}`;
    }

    function parseCustomRewardOptionValue(value) {
        if (!value || !value.startsWith(customRewardOptionPrefix)) return null;
        const rawId = value.slice(customRewardOptionPrefix.length);
        const parsedId = parseInt(rawId, 10);
        return Number.isNaN(parsedId) ? null : parsedId;
    }

    function setSlotCustomReward(infoItem, rewardItem) {
        if (!infoItem) return;
        const idStore = infoItem.querySelector('.custom-reward-id-store');
        const nameStore = infoItem.querySelector('.custom-reward-name-store');
        const descStore = infoItem.querySelector('.custom-reward-desc-store');
        if (idStore) idStore.value = rewardItem ? rewardItem.id : '';
        if (nameStore) nameStore.value = rewardItem ? (rewardItem.name || '') : '';
        if (descStore) descStore.value = rewardItem ? (rewardItem.description || '') : '';
    }

    function getSlotCustomReward(infoItem) {
        if (!infoItem) return null;
        const idStore = infoItem.querySelector('.custom-reward-id-store');
        const nameStore = infoItem.querySelector('.custom-reward-name-store');
        const descStore = infoItem.querySelector('.custom-reward-desc-store');
        const idValue = idStore && idStore.value ? parseInt(idStore.value, 10) : null;
        return {
            id: Number.isNaN(idValue) ? null : idValue,
            name: nameStore ? nameStore.value : '',
            description: descStore ? descStore.value : ''
        };
    }

    function renderCustomRewardList() {
        if (!customRewardList) return;
        pruneCustomRewardLibrary();
        customRewardList.innerHTML = '';
        const library = getCustomRewardLibrary();
        if (!library.length) {
            const emptyText = document.createElement('div');
            emptyText.className = 'custom-reward-list-empty';
            emptyText.textContent = '暂无自定义勋绩';
            customRewardList.appendChild(emptyText);
            refreshRewardSelectOptions();
            return;
        }
        library.forEach(item => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'custom-reward-list-item';
            button.dataset.id = item.id;
            button.textContent = item.name;
            if (item.id === activeCustomRewardId) button.classList.add('active');
            customRewardList.appendChild(button);
        });
        refreshRewardSelectOptions();
    }

    function selectCustomRewardById(id) {
        activeCustomRewardId = id;
        const rewardItem = id ? getCustomRewardById(id) : null;
        if (customRewardNameInput) customRewardNameInput.value = rewardItem ? (rewardItem.name || '') : '';
        if (customRewardDescInput) customRewardDescInput.value = rewardItem ? (rewardItem.description || '') : '';
        renderCustomRewardList();
    }

    function createCustomReward(name, description) {
        const library = getCustomRewardLibrary();
        const newReward = {
            id: app.state.customRewardNextId++,
            name: name || '',
            description: description || ''
        };
        library.push(newReward);
        return newReward;
    }

    function deleteCustomRewardById(id) {
        const library = getCustomRewardLibrary();
        const index = library.findIndex(item => item.id === id);
        if (index === -1) return;
        library.splice(index, 1);
        document.querySelectorAll('#rewards_container .info-item').forEach(item => {
            const slot = getSlotCustomReward(item);
            if (slot && slot.id === id) {
                setSlotCustomReward(item, null);
                const select = item.querySelector('.reward-select');
                if (select && select.value === customRewardKey) {
                    select.value = '';
                    updateCustomRewardDisplay(select);
                }
            }
        });
        if (activeCustomRewardId === id) {
            activeCustomRewardId = null;
            if (customRewardNameInput) customRewardNameInput.value = '';
            if (customRewardDescInput) customRewardDescInput.value = '';
        }
        renderCustomRewardList();
    }

    function syncCustomRewardsFromSlots() {
        document.querySelectorAll('#rewards_container .info-item').forEach(item => {
            const slot = getSlotCustomReward(item);
            if (!slot || !slot.name || !slot.name.trim()) return;
            let rewardItem = slot.id ? getCustomRewardById(slot.id) : null;
            if (!rewardItem) {
                const existing = findCustomRewardByContent(slot.name, slot.description);
                rewardItem = existing || createCustomReward(slot.name, slot.description);
            }
            setSlotCustomReward(item, rewardItem);
        });
        renderCustomRewardList();
    }

    function openCustomRewardModal(select) {
        if (!customRewardModal) return;
        activeCustomRewardSelect = select;
        const infoItem = select.closest('.info-item');
        syncCustomRewardsFromSlots();
        const slotData = getSlotCustomReward(infoItem);
        let rewardItem = slotData && slotData.id ? getCustomRewardById(slotData.id) : null;
        if (!rewardItem && slotData && slotData.name && slotData.name.trim()) {
            const existing = findCustomRewardByContent(slotData.name, slotData.description);
            rewardItem = existing || createCustomReward(slotData.name, slotData.description);
            setSlotCustomReward(infoItem, rewardItem);
        }
        activeCustomRewardId = rewardItem ? rewardItem.id : null;
        if (customRewardNameInput) customRewardNameInput.value = rewardItem ? (rewardItem.name || '') : '';
        if (customRewardDescInput) customRewardDescInput.value = rewardItem ? (rewardItem.description || '') : '';
        renderCustomRewardList();
        customRewardModal.classList.remove('hidden');
        if (customRewardNameInput) customRewardNameInput.focus();
    }

    function closeCustomRewardModal() {
        if (!customRewardModal) return;
        customRewardModal.classList.add('hidden');
        activeCustomRewardSelect = null;
        activeCustomRewardId = null;
    }

    function saveCustomRewardModal() {
        if (!activeCustomRewardSelect) return;
        const infoItem = activeCustomRewardSelect.closest('.info-item');
        if (!infoItem) return;
        const nameValue = customRewardNameInput ? customRewardNameInput.value.trim() : '';
        const descValue = customRewardDescInput ? customRewardDescInput.value.trim() : '';
        if (!nameValue) return;
        let rewardItem = activeCustomRewardId ? getCustomRewardById(activeCustomRewardId) : null;
        if (!rewardItem) {
            rewardItem = createCustomReward(nameValue, descValue);
        } else {
            rewardItem.name = nameValue;
            rewardItem.description = descValue;
        }
        setSlotCustomReward(infoItem, rewardItem);
        updateCustomRewardDisplay(activeCustomRewardSelect);
        renderCustomRewardList();
    }

    function syncActiveCustomRewardDraft() {
        if (!activeCustomRewardId) return;
        const rewardItem = getCustomRewardById(activeCustomRewardId);
        if (!rewardItem) return;
        if (customRewardNameInput) rewardItem.name = customRewardNameInput.value.trim();
        if (customRewardDescInput) rewardItem.description = customRewardDescInput.value.trim();
        renderCustomRewardList();
    }

    function updateCustomRewardDisplay(select) {
        const infoItem = select.closest('.info-item');
        if (!infoItem) return;
        const descBox = infoItem.querySelector('.description-box');
        const customOption = Array.from(select.options).find(option => option.value === customRewardKey);
        const isCustom = select.value === customRewardKey;

        if (!descBox) return;

        if (!isCustom) {
            if (customOption) customOption.textContent = customRewardKey;
            descBox.innerText = select.value ? (rewardsData[select.value] || '') : emptyRewardText;
            return;
        }

        const slotData = getSlotCustomReward(infoItem);
        const rewardItem = slotData && slotData.id ? getCustomRewardById(slotData.id) : null;
        const customName = rewardItem ? (rewardItem.name || '') : (slotData ? (slotData.name || '') : '');
        const customDesc = rewardItem ? (rewardItem.description || '') : (slotData ? (slotData.description || '') : '');
        if (rewardItem) setSlotCustomReward(infoItem, rewardItem);

        if (customOption) customOption.textContent = customName || customRewardKey;
        descBox.innerText = customDesc || customRewardDescriptionPlaceholder;
    }

    function getCustomRewards() {
        const rewards = [];
        app.elements.rewardsContainer.querySelectorAll('.info-item').forEach((item, index) => {
            const nameInput = item.querySelector('.custom-reward-name-store');
            const descInput = item.querySelector('.custom-reward-desc-store');
            if (!nameInput && !descInput) {
                rewards[index] = null;
                return;
            }
            const name = nameInput ? nameInput.value : '';
            const description = descInput ? descInput.value : '';
            rewards[index] = (name || description) ? { name, description } : null;
        });
        return rewards;
    }

    function getCustomRewardSelections() {
        const selections = [];
        app.elements.rewardsContainer.querySelectorAll('.info-item').forEach((item, index) => {
            const idInput = item.querySelector('.custom-reward-id-store');
            const idValue = idInput && idInput.value ? parseInt(idInput.value, 10) : null;
            selections[index] = Number.isNaN(idValue) ? null : idValue;
        });
        return selections;
    }

    function applyCustomRewards(customRewards) {
        if (!Array.isArray(customRewards)) return;
        app.elements.rewardsContainer.querySelectorAll('.info-item').forEach((item, index) => {
            const rewardData = customRewards[index];
            if (!rewardData) return;
            const nameInput = item.querySelector('.custom-reward-name-store');
            const descInput = item.querySelector('.custom-reward-desc-store');
            if (nameInput) nameInput.value = rewardData.name || '';
            if (descInput) descInput.value = rewardData.description || '';
        });
    }

    function applyCustomRewardSelections(selections) {
        if (!Array.isArray(selections)) return;
        app.elements.rewardsContainer.querySelectorAll('.info-item').forEach((item, index) => {
            const idInput = item.querySelector('.custom-reward-id-store');
            if (!idInput) return;
            const rawValue = selections[index];
            const parsedValue = rawValue != null ? parseInt(rawValue, 10) : null;
            idInput.value = Number.isNaN(parsedValue) ? '' : parsedValue;
        });
    }

    function getCustomRewardLibraryData() {
        return getCustomRewardLibrary()
            .filter(item => item.name && item.name.trim())
            .map(item => ({
                id: item.id,
                name: item.name.trim(),
                description: item.description || ''
            }));
    }

    function applyCustomRewardLibraryData(libraryData) {
        if (!Array.isArray(libraryData)) return;
        app.state.customRewards = libraryData
            .map(item => {
                if (!item) return null;
                const parsedId = typeof item.id === 'number' ? item.id : parseInt(item.id, 10);
                return Number.isNaN(parsedId) ? null : {
                    id: parsedId,
                    name: item.name || '',
                    description: item.description || ''
                };
            })
            .filter(item => item && item.name && item.name.trim())
            .map(item => ({
                id: item.id,
                name: item.name.trim(),
                description: item.description || ''
            }));
        refreshCustomRewardNextId();
    }

    function generateVirtueSelectors(count, culture) {
        const virtuesContainer = document.getElementById('virtues_container');
        virtuesContainer.innerHTML = '';

        const allVirtues = { ...generalVirtuesData };
        if (culture && cultureSpecificVirtuesData[culture]) {
            Object.assign(allVirtues, cultureSpecificVirtuesData[culture]);
        }

        for (let i = 1; i <= count; i++) {
            const infoItem = document.createElement('div');
            infoItem.className = 'info-item';

            const select = document.createElement('select');
            select.id = `virtue_select_${i}`;
            select.className = 'virtue-select';
            select.dataset.descId = `virtue_desc_${i}`;
            select.setAttribute('aria-label', `美德 ${i}`);

            const option = document.createElement('option');
            option.value = "";
            option.textContent = "--请选择美德--";
            select.appendChild(option);

            for (const key in allVirtues) {
                const virtueOption = document.createElement('option');
                virtueOption.value = key;
                virtueOption.textContent = key;
                select.appendChild(virtueOption);
            }

            const descBox = document.createElement('div');
            descBox.id = `virtue_desc_${i}`;
            descBox.className = 'description-box';
            descBox.innerText = emptyVirtueText;

            infoItem.appendChild(select);
            infoItem.appendChild(descBox);
            virtuesContainer.appendChild(infoItem);
        }
    }

    function init() {
        const { valourInput, rewardsContainer, heroicCultureSelect, wisdomInput } = app.elements;
        customRewardModal = document.getElementById('customRewardModal');
        customRewardForm = document.getElementById('customRewardForm');
        customRewardNameInput = document.getElementById('custom_reward_modal_name');
        customRewardDescInput = document.getElementById('custom_reward_modal_desc');
        customRewardList = document.getElementById('custom_reward_list');
        customRewardAddButton = document.getElementById('custom_reward_add');
        customRewardDeleteButton = document.getElementById('custom_reward_delete');
        customRewardSaveButton = document.getElementById('custom_reward_modal_save');
        customRewardCancelButton = document.getElementById('custom_reward_modal_cancel');

        if (customRewardList) {
            customRewardList.addEventListener('click', (event) => {
                const button = event.target.closest('.custom-reward-list-item');
                if (!button) return;
                const idValue = parseInt(button.dataset.id, 10);
                if (!Number.isNaN(idValue)) {
                    selectCustomRewardById(idValue);
                }
            });
        }
        if (customRewardNameInput) {
            customRewardNameInput.addEventListener('input', () => {
                syncActiveCustomRewardDraft();
            });
        }
        if (customRewardDescInput) {
            customRewardDescInput.addEventListener('input', () => {
                syncActiveCustomRewardDraft();
            });
        }
        if (customRewardAddButton) {
            customRewardAddButton.addEventListener('click', () => {
                const newReward = createCustomReward('', '');
                selectCustomRewardById(newReward.id);
                if (customRewardNameInput) customRewardNameInput.focus();
            });
        }
        if (customRewardDeleteButton) {
            customRewardDeleteButton.addEventListener('click', () => {
                if (activeCustomRewardId != null) {
                    deleteCustomRewardById(activeCustomRewardId);
                }
            });
        }
        if (customRewardForm) {
            customRewardForm.addEventListener('submit', (event) => {
                event.preventDefault();
                saveCustomRewardModal();
            });
        }
        if (customRewardSaveButton) {
            customRewardSaveButton.addEventListener('click', (event) => {
                event.preventDefault();
                saveCustomRewardModal();
            });
        }
        if (customRewardCancelButton) {
            customRewardCancelButton.addEventListener('click', (event) => {
                event.preventDefault();
                closeCustomRewardModal();
            });
        }
        if (customRewardModal) {
            customRewardModal.addEventListener('click', (event) => {
                if (event.target === customRewardModal) {
                    closeCustomRewardModal();
                }
            });
        }

        valourInput.addEventListener('input', () => {
            const count = parseInt(valourInput.value, 10) || 0;
            const currentRewardValues = [];
            const currentCustomRewards = getCustomRewards();
            const currentCustomRewardSelections = getCustomRewardSelections();
            rewardsContainer.querySelectorAll('.reward-select').forEach(select => {
                currentRewardValues.push(select.value);
            });

            generateRewardSelectors(count);
            applyCustomRewards(currentCustomRewards);
            applyCustomRewardSelections(currentCustomRewardSelections);

            const newRewardSelects = rewardsContainer.querySelectorAll('.reward-select');
            newRewardSelects.forEach((select, index) => {
                if (currentRewardValues[index]) {
                    select.value = currentRewardValues[index];
                    select.dispatchEvent(new Event('change', { bubbles: true }));
                }
            });

            updateRewardOptions();
        });

        wisdomInput.addEventListener('input', () => {
            const count = parseInt(wisdomInput.value, 10) || 0;
            const currentCulture = heroicCultureSelect.value;
            const currentVirtueValues = [];
            document.querySelectorAll('.virtue-select').forEach(select => {
                currentVirtueValues.push(select.value);
            });

            generateVirtueSelectors(count, currentCulture);

            const newVirtueSelects = document.querySelectorAll('.virtue-select');
            newVirtueSelects.forEach((select, index) => {
                if (currentVirtueValues[index]) {
                    select.value = currentVirtueValues[index];
                    select.dispatchEvent(new Event('change', { bubbles: true }));
                }
            });

            updateVirtueOptions();
            if (app.core && app.core.updateAttributes) {
                app.core.updateAttributes();
            }
        });

        rewardsContainer.addEventListener('focusin', (e) => {
            if (e.target.matches('.reward-select')) {
                e.target.dataset.prevValue = e.target.value;
            }
        });

        rewardsContainer.addEventListener('change', (e) => {
            if (!e.target.matches('.reward-select')) return;
            if (e.target.value === customRewardEditKey && e.isTrusted) {
                const previousValue = e.target.dataset.prevValue || '';
                e.target.value = previousValue;
                updateCustomRewardDisplay(e.target);
                updateRewardOptions();
                openCustomRewardModal(e.target);
                return;
            }
            const selectedCustomId = parseCustomRewardOptionValue(e.target.value);
            if (selectedCustomId && e.isTrusted) {
                const infoItem = e.target.closest('.info-item');
                const rewardItem = getCustomRewardById(selectedCustomId);
                if (infoItem && rewardItem) {
                    setSlotCustomReward(infoItem, rewardItem);
                    e.target.value = customRewardKey;
                    updateCustomRewardDisplay(e.target);
                    updateRewardOptions();
                    e.target.dataset.prevValue = e.target.value;
                    return;
                }
            }
            updateCustomRewardDisplay(e.target);
            updateRewardOptions();
            if (e.target.value === customRewardKey && e.isTrusted) {
                openCustomRewardModal(e.target);
            }
            e.target.dataset.prevValue = e.target.value;
        });

        document.addEventListener('change', (e) => {
            if (e.target.matches('.virtue-select')) {
                const descId = e.target.dataset.descId;
                const descBox = document.getElementById(descId);
                if (descBox) {
                    const selectedVirtue = e.target.value;
                    if (!selectedVirtue) {
                        descBox.innerText = emptyVirtueText;
                    } else {
                        let virtueDescription = generalVirtuesData[selectedVirtue] || '';
                        const currentCulture = heroicCultureSelect.value;
                        if (currentCulture && cultureSpecificVirtuesData[currentCulture] && cultureSpecificVirtuesData[currentCulture][selectedVirtue]) {
                            virtueDescription = cultureSpecificVirtuesData[currentCulture][selectedVirtue];
                        }
                        descBox.innerText = virtueDescription;
                    }
                }
                updateVirtueOptions();
                if (app.core && app.core.updateAttributes) {
                    app.core.updateAttributes();
                }
            }
        });
    }

    app.rewards = {
        updateRewardOptions,
        updateVirtueOptions,
        getVirtueModifiers,
        generateRewardSelectors,
        generateVirtueSelectors,
        getCustomRewards,
        applyCustomRewards,
        getCustomRewardSelections,
        applyCustomRewardSelections,
        getCustomRewardLibraryData,
        applyCustomRewardLibraryData,
        init
    };
})();
