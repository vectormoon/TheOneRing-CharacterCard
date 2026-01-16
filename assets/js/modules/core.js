(function() {
    const app = window.TorCharacterApp = window.TorCharacterApp || {};

    function handleRankClick(event) {
        const checkbox = event.target;
        if (checkbox.type !== 'checkbox') return;
        if (event.shiftKey) return;
        const checkboxes = Array.from(checkbox.parentNode.children);
        const currentIndex = checkboxes.indexOf(checkbox);
        const isChecking = checkbox.checked;
        const hasHigherChecked = checkboxes.slice(currentIndex + 1).some(cb => cb.checked);
        for (let i = 0; i < checkboxes.length; i++) {
            if (isChecking) {
                if (i <= currentIndex) checkboxes[i].checked = true;
            } else if (hasHigherChecked) {
                checkboxes[i].checked = i <= currentIndex;
            } else {
                if (i >= currentIndex) checkboxes[i].checked = false;
            }
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

    function setSkillRanks(containerId, rank) {
        const container = document.getElementById(containerId);
        if (!container) return;
        const checkboxes = Array.from(container.querySelectorAll('input[type="checkbox"]'));
        const targetRank = Math.max(0, Math.min(rank, checkboxes.length));
        checkboxes.forEach((checkbox, index) => {
            checkbox.checked = index < targetRank;
        });
    }

    function applyCultureSkillRanks(selectedCulture) {
        if (app.state.isRestoring) return;
        const ranks = cultureSkillRanks[selectedCulture];
        if (!ranks) return;
        skillRankContainers.forEach(containerId => {
            const rank = Object.prototype.hasOwnProperty.call(ranks, containerId) ? ranks[containerId] : 0;
            setSkillRanks(containerId, rank);
        });
    }

    function handleModeChange() {
        const selectedMode = document.querySelector('input[name="game_mode"]:checked');
        app.state.baseTN = selectedMode ? parseInt(selectedMode.value, 10) : 20;
        updateAttributes();
    }

    function updateAttributes() {
        const {
            bodyVal,
            bodyTN,
            heartVal,
            heartTN,
            witsVal,
            witsTN,
            enduranceVal,
            hopeVal,
            parryVal,
            heroicCultureSelect
        } = app.elements;
        const previousEnduranceMax = parseInt(enduranceVal.textContent, 10) || 0;
        const previousHopeMax = parseInt(hopeVal.textContent, 10) || 0;
        const bVal = parseInt(bodyVal.value, 10) || 0;
        if (document.activeElement !== bodyTN) bodyTN.value = app.state.baseTN - bVal;
        const hVal = parseInt(heartVal.value, 10) || 0;
        if (document.activeElement !== heartTN) heartTN.value = app.state.baseTN - hVal;
        const wVal = parseInt(witsVal.value, 10) || 0;
        if (document.activeElement !== witsTN) witsTN.value = app.state.baseTN - wVal;
        const selectedCulture = heroicCultureSelect.value;
        const modifiers = cultureData[selectedCulture]?.modifiers || cultureData[""].modifiers;
        const virtueModifiers = app.rewards && app.rewards.getVirtueModifiers
            ? app.rewards.getVirtueModifiers()
            : { endurance: 0, hope: 0, parry: 0 };
        const enduranceMax = bVal + modifiers.endurance + virtueModifiers.endurance;
        const hopeMax = hVal + modifiers.hope + virtueModifiers.hope;
        enduranceVal.textContent = enduranceMax;
        hopeVal.textContent = hopeMax;
        parryVal.textContent = wVal + modifiers.parry + virtueModifiers.parry;

        const currentEnduranceInput = document.getElementById('current_endurance');
        if (currentEnduranceInput) {
            const rawEndurance = currentEnduranceInput.value.trim();
            if (rawEndurance === '' || rawEndurance === '0') {
                currentEnduranceInput.value = enduranceMax;
            } else {
                const currentEndurance = parseInt(rawEndurance, 10);
                if (Number.isNaN(currentEndurance)) {
                    currentEnduranceInput.value = enduranceMax;
                } else if (enduranceMax !== previousEnduranceMax) {
                    const adjustedEndurance = currentEndurance + (enduranceMax - previousEnduranceMax);
                    currentEnduranceInput.value = Math.max(0, Math.min(enduranceMax, adjustedEndurance));
                }
            }
        }
        const currentHopeInput = document.getElementById('current_hope');
        if (currentHopeInput) {
            const rawHope = currentHopeInput.value.trim();
            if (rawHope === '' || rawHope === '0') {
                currentHopeInput.value = hopeMax;
            } else {
                const currentHope = parseInt(rawHope, 10);
                if (Number.isNaN(currentHope)) {
                    currentHopeInput.value = hopeMax;
                } else if (hopeMax !== previousHopeMax) {
                    const adjustedHope = currentHope + (hopeMax - previousHopeMax);
                    currentHopeInput.value = Math.max(0, Math.min(hopeMax, adjustedHope));
                }
            }
        }
    }

    function updateFromTN(sourceTN, targetVal) {
        const tnVal = parseInt(sourceTN.value, 10) || 0;
        targetVal.value = app.state.baseTN - tnVal;
        updateAttributes();
    }

    function populateTraitSelectors(traitList) {
        const { trait1Select, trait2Select } = app.elements;
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
        const { trait1Select, trait1Desc, trait2Select, trait2Desc } = app.elements;
        const emptyTraitText = '请选择您的特质';
        trait1Desc.textContent = trait1Select.value ? (traitsData[trait1Select.value] || '') : emptyTraitText;
        trait2Desc.textContent = trait2Select.value ? (traitsData[trait2Select.value] || '') : emptyTraitText;
        const val1 = trait1Select.value;
        const val2 = trait2Select.value;
        for (const option of trait2Select.options) { option.disabled = (option.value !== '' && option.value === val1); }
        for (const option of trait1Select.options) { option.disabled = (option.value !== '' && option.value === val2); }
    }

    function applyCultureSelection(selectedCulture, options = {}) {
        const { clearTraits = true, clearCurrent = true } = options;
        const data = cultureData[selectedCulture] || cultureData[""];
        const { culturalBlessingInput, culturalBlessingDesc } = app.elements;
        culturalBlessingInput.value = data.blessing.name;
        culturalBlessingDesc.textContent = data.blessing.description;
        document.getElementById('char_living_standard').value = data.livingStandard;

        if (clearCurrent) {
            document.getElementById('current_endurance').value = '';
            document.getElementById('current_hope').value = '';
        }

        if (clearTraits) {
            app.elements.trait1Select.value = '';
            app.elements.trait2Select.value = '';
        }
        populateTraitSelectors(data.traits);
        updateAttributes();
        if (app.king && app.king.updateKingOfMenUI) app.king.updateKingOfMenUI();
        if (app.gear && app.gear.updateTotalLoad) app.gear.updateTotalLoad();
        applyCultureSkillRanks(selectedCulture);

        const wisdomCount = parseInt(app.elements.wisdomInput.value, 10) || 0;
        if (app.rewards && app.rewards.generateVirtueSelectors) {
            app.rewards.generateVirtueSelectors(wisdomCount, selectedCulture);
            app.rewards.updateVirtueOptions();
        }
    }

    function init() {
        const {
            bodyVal,
            bodyTN,
            heartVal,
            heartTN,
            witsVal,
            witsTN,
            heroicCultureSelect,
            callingSelect,
            trait1Select,
            trait2Select,
            trait3Feature,
            trait3Desc
        } = app.elements;

        bodyVal.addEventListener('input', updateAttributes);
        bodyTN.addEventListener('input', () => updateFromTN(bodyTN, bodyVal));
        heartVal.addEventListener('input', updateAttributes);
        heartTN.addEventListener('input', () => updateFromTN(heartTN, heartVal));
        witsVal.addEventListener('input', updateAttributes);
        witsTN.addEventListener('input', () => updateFromTN(witsTN, witsVal));

        document.querySelectorAll('input[name="game_mode"]').forEach(radio => {
            radio.addEventListener('change', handleModeChange);
        });

        heroicCultureSelect.addEventListener('change', (event) => {
            if (app.king && app.king.removeKingOfMenBonus) {
                app.king.removeKingOfMenBonus(true);
            }
            const selectedCulture = event.target.value;
            applyCultureSelection(selectedCulture, { clearTraits: true, clearCurrent: true });
        });

        callingSelect.addEventListener('change', (event) => {
            const selectedCalling = event.target.value;
            const featureData = callingFeatures[selectedCalling] || callingFeatures[''];
            trait3Feature.value = featureData.name;
            trait3Desc.textContent = featureData.description;
        });

        trait1Select.addEventListener('change', updateTraitDescriptionsAndDuplicates);
        trait2Select.addEventListener('change', updateTraitDescriptionsAndDuplicates);
    }

    app.core = {
        handleRankClick,
        createRankCheckboxes,
        setSkillRanks,
        applyCultureSkillRanks,
        handleModeChange,
        updateAttributes,
        updateFromTN,
        populateTraitSelectors,
        updateTraitDescriptionsAndDuplicates,
        applyCultureSelection,
        init
    };
})();
