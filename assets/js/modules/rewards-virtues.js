(function() {
    const app = window.TorCharacterApp = window.TorCharacterApp || {};

    function updateRewardOptions() {
        const rewardSelects = app.elements.rewardsContainer.querySelectorAll('.reward-select');
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

            const rewardNames = { "": "--请选择勋绩--", "贴身": "贴身 (护甲或头盔)", "精工": "精工 (护甲, 头盔或盾牌)", "致命": "致命 (武器)", "深化": "深化 (武器)", "利刃": "利刃 (武器)", "加固": "加固 (盾牌)" };
            for (const key in rewardNames) {
                const option = document.createElement('option');
                option.value = key;
                option.textContent = rewardNames[key];
                select.appendChild(option);
            }

            const descBox = document.createElement('div');
            descBox.id = `reward_desc_${i}`;
            descBox.className = 'description-box';

            infoItem.appendChild(select);
            infoItem.appendChild(descBox);
            rewardsContainer.appendChild(infoItem);
        }
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

            infoItem.appendChild(select);
            infoItem.appendChild(descBox);
            virtuesContainer.appendChild(infoItem);
        }
    }

    function init() {
        const { valourInput, rewardsContainer, heroicCultureSelect, wisdomInput } = app.elements;

        valourInput.addEventListener('input', () => {
            const count = parseInt(valourInput.value, 10) || 0;
            const currentRewardValues = [];
            rewardsContainer.querySelectorAll('.reward-select').forEach(select => {
                currentRewardValues.push(select.value);
            });

            generateRewardSelectors(count);

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

        document.addEventListener('change', (e) => {
            if (e.target.matches('.virtue-select')) {
                const descId = e.target.dataset.descId;
                const descBox = document.getElementById(descId);
                if (descBox) {
                    const selectedVirtue = e.target.value;
                    let virtueDescription = generalVirtuesData[selectedVirtue] || '';
                    const currentCulture = heroicCultureSelect.value;
                    if (currentCulture && cultureSpecificVirtuesData[currentCulture] && cultureSpecificVirtuesData[currentCulture][selectedVirtue]) {
                        virtueDescription = cultureSpecificVirtuesData[currentCulture][selectedVirtue];
                    }
                    descBox.innerText = virtueDescription;
                }
                updateVirtueOptions();
            }
        });
    }

    app.rewards = {
        updateRewardOptions,
        updateVirtueOptions,
        generateRewardSelectors,
        generateVirtueSelectors,
        init
    };
})();
