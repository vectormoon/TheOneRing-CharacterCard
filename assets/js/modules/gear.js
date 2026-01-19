(function() {
    const app = window.TorCharacterApp = window.TorCharacterApp || {};

    function updateTotalLoad() {
        let totalLoad = 0;
        const isDwarf = app.elements.heroicCultureSelect.value === '都林一族的矮人';

        document.querySelectorAll('#combat_gear_body input[data-key="load"]').forEach(input => {
            const load = parseInt(input.value, 10);
            if (!isNaN(load)) {
                totalLoad += load;
            }
        });

        const armorLoadVal = parseInt(document.querySelector('#armor_slot input[data-key="load"]').value, 10);
        if (!isNaN(armorLoadVal)) {
            totalLoad += isDwarf ? Math.ceil(armorLoadVal / 2) : armorLoadVal;
        }

        const helmetLoadVal = parseInt(document.querySelector('#helmet_slot input[data-key="load"]').value, 10);
        if (!isNaN(helmetLoadVal)) {
            totalLoad += isDwarf ? Math.ceil(helmetLoadVal / 2) : helmetLoadVal;
        }

        const shieldLoadVal = parseInt(document.querySelector('#shield_slot input[data-key="load"]').value, 10);
        if (!isNaN(shieldLoadVal)) {
            totalLoad += shieldLoadVal;
        }

        document.getElementById('load_val').value = totalLoad;
    }

    function parseParryBonusFromValue(value) {
        const text = (value || '').toString();
        if (!text.includes('招架')) return 0;
        const match = text.match(/-?\d+/);
        if (!match) return 0;
        const parsed = parseInt(match[0], 10);
        return Number.isNaN(parsed) ? 0 : parsed;
    }

    function getShieldParryBonus() {
        const shieldRow = document.getElementById('shield_slot');
        if (!shieldRow) return 0;
        const datasetBonus = parseInt(shieldRow.dataset.parryBonus, 10);
        if (!Number.isNaN(datasetBonus)) return datasetBonus;
        const valueInput = shieldRow.querySelector('input[data-key="value"]');
        return parseParryBonusFromValue(valueInput ? valueInput.value : '');
    }

    function syncCombatGearTooltips(row) {
        const targets = [
            row.querySelector('input[data-key="injury"]'),
            row.querySelector('input[data-key="notes"]')
        ];
        targets.forEach(input => {
            if (!input) return;
            const value = input.value.trim();
            if (value) {
                input.title = value;
            } else {
                input.removeAttribute('title');
            }
        });
    }

    function setCombatGearRowValues(row, data) {
        if (!row) return;
        row.querySelector('input[data-key="name"]').value = data.name || '';
        row.querySelector('input[data-key="damage"]').value = data.damage || '';
        row.querySelector('input[data-key="injury"]').value = data.injury || '';
        row.querySelector('input[data-key="load"]').value = data.load || '';
        row.querySelector('input[data-key="notes"]').value = data.notes || '';
        syncCombatGearTooltips(row);
    }

    function getCombatGearRowValues(row) {
        if (!row) return {};
        return {
            name: row.querySelector('input[data-key="name"]').value,
            damage: row.querySelector('input[data-key="damage"]').value,
            injury: row.querySelector('input[data-key="injury"]').value,
            load: row.querySelector('input[data-key="load"]').value,
            notes: row.querySelector('input[data-key="notes"]').value
        };
    }

    function setCombatGearFormValues(form, data) {
        document.getElementById('modal_combat_name').value = data.name || '';
        document.getElementById('modal_combat_damage').value = data.damage || '';
        document.getElementById('modal_combat_injury').value = data.injury || '';
        document.getElementById('modal_combat_load').value = data.load || '';
        document.getElementById('modal_combat_notes').value = data.notes || '';
        if (form) form.querySelector('#modal_combat_preset').value = '';
    }

    function getProtectiveGearRowValues(row) {
        if (!row) return {};
        return {
            name: row.querySelector('input[data-key="name"]').value,
            value: row.querySelector('input[data-key="value"]').value,
            load: row.querySelector('input[data-key="load"]').value,
            notes: row.dataset.notes || ''
        };
    }

    function setProtectiveGearFormValues(form, data) {
        document.getElementById('modal_protective_name').value = data.name || '';
        document.getElementById('modal_protective_value').value = data.value || '';
        document.getElementById('modal_protective_load').value = data.load || '';
        document.getElementById('modal_protective_notes').value = data.notes || '';
        if (form) form.querySelector('#modal_protective_preset').value = '';
    }

    function addCombatGearRow(data = {}) {
        const tableBody = document.getElementById('combat_gear_body');
        const newRow = tableBody.insertRow();
        newRow.innerHTML = `
            <td>
                <input type="text" data-key="name" value="${data.name || ''}" class="readonly" readonly>
            </td>
            <td><input type="text" data-key="damage" value="${data.damage || ''}" class="readonly short-input" readonly></td>
            <td><input type="text" data-key="injury" value="${data.injury || ''}" class="readonly short-input" readonly></td>
            <td><input type="number" data-key="load" value="${data.load || ''}" class="readonly short-input" readonly></td>
            <td><input type="text" data-key="notes" value="${data.notes || ''}" class="readonly" readonly></td>
        `;
        syncCombatGearTooltips(newRow);
    }

    function populateCombatGearPresets() {
        app.elements.combatPresetSelect.innerHTML = '<option value="">--自定义或选择一项--</option>';
        combatGearPresets.forEach(gear => {
            const option = document.createElement('option');
            option.value = gear.name;
            option.textContent = gear.name;
            app.elements.combatPresetSelect.appendChild(option);
        });
    }

    function init() {
        const {
            combatGearModal,
            combatGearForm,
            clearCombatGearBtn,
            cancelCombatGearBtn,
            combatPresetSelect,
            protectiveGearModal,
            protectiveGearForm,
            clearProtectiveGearBtn,
            cancelProtectiveGearBtn,
            protectivePresetSelect
        } = app.elements;

        const combatGearBody = document.getElementById('combat_gear_body');
        combatGearBody.addEventListener('click', e => {
            const row = e.target.closest('tr');
            if (!row) return;
            app.state.currentCombatGearRow = row;
            combatGearForm.reset();
            setCombatGearFormValues(combatGearForm, getCombatGearRowValues(row));
            combatGearModal.classList.remove('hidden');
        });

        populateCombatGearPresets();

        document.getElementById('add_combat_gear_btn').addEventListener('click', () => {
            app.state.currentCombatGearRow = null;
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
            if (app.state.currentCombatGearRow) {
                setCombatGearRowValues(app.state.currentCombatGearRow, gearData);
            } else {
                addCombatGearRow(gearData);
            }
            combatGearModal.classList.add('hidden');
            app.state.currentCombatGearRow = null;
            updateTotalLoad();
        });
        clearCombatGearBtn.addEventListener('click', () => {
            if (app.state.currentCombatGearRow) {
                app.state.currentCombatGearRow.remove();
                app.state.currentCombatGearRow = null;
                combatGearModal.classList.add('hidden');
                updateTotalLoad();
                return;
            }
            combatGearForm.reset();
            combatPresetSelect.value = '';
            combatPresetSelect.dispatchEvent(new Event('change'));
        });
        cancelCombatGearBtn.addEventListener('click', () => {
            app.state.currentCombatGearRow = null;
            combatGearModal.classList.add('hidden');
        });
        combatGearModal.addEventListener('click', (e) => {
            if (e.target !== combatGearModal) return;
            app.state.currentCombatGearRow = null;
            combatGearModal.classList.add('hidden');
        });
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

        document.getElementById('protective_gear_body').addEventListener('click', (e) => {
            const row = e.target.closest('tr');
            if (!row) return;
            const slot = row.id ? row.id.replace('_slot', '') : '';
            if (!slot) return;

            app.state.currentProtectiveSlot = slot;
            protectiveGearForm.reset();
            const existingGear = getProtectiveGearRowValues(row);

            protectivePresetSelect.innerHTML = '<option value="">--自定义或选择一项--</option>';
            const filteredPresets = protectiveGearPresets.filter(gear => {
                const type = gear.type.toLowerCase();
                if (app.state.currentProtectiveSlot === 'armor' && (type.includes('甲') || type.includes('衣'))) return true;
                if (app.state.currentProtectiveSlot === 'helmet' && type.includes('头')) return true;
                if (app.state.currentProtectiveSlot === 'shield' && type.includes('盾')) return true;
                return false;
            });
            filteredPresets.forEach(gear => {
                const option = document.createElement('option');
                option.value = gear.name;
                option.textContent = gear.name;
                protectivePresetSelect.appendChild(option);
            });

            setProtectiveGearFormValues(protectiveGearForm, existingGear);
            if (app.state.currentProtectiveSlot === 'shield') {
                const rowBonus = parseInt(row.dataset.parryBonus, 10);
                if (!Number.isNaN(rowBonus)) {
                    protectiveGearForm.dataset.parryBonus = rowBonus;
                } else {
                    const valueInput = row.querySelector('input[data-key="value"]');
                    const parsed = parseParryBonusFromValue(valueInput ? valueInput.value : '');
                    if (parsed) {
                        protectiveGearForm.dataset.parryBonus = parsed;
                    } else {
                        delete protectiveGearForm.dataset.parryBonus;
                    }
                }
            } else {
                delete protectiveGearForm.dataset.parryBonus;
            }
            protectiveGearModal.classList.remove('hidden');
        });

        protectiveGearForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (!app.state.currentProtectiveSlot) return;
            const gearData = {
                name: document.getElementById('modal_protective_name').value,
                value: document.getElementById('modal_protective_value').value,
                load: document.getElementById('modal_protective_load').value,
                notes: document.getElementById('modal_protective_notes').value
            };
            const targetRow = document.getElementById(`${app.state.currentProtectiveSlot}_slot`);
            if (targetRow) {
                const notesInput = targetRow.querySelector('input[data-key="notes"]');
                targetRow.querySelector('input[data-key="name"]').value = gearData.name;
                targetRow.querySelector('input[data-key="value"]').value = gearData.value;
                targetRow.querySelector('input[data-key="load"]').value = gearData.load;
                if (notesInput) notesInput.value = gearData.notes;
                targetRow.dataset.notes = gearData.notes || '';
                if (app.state.currentProtectiveSlot === 'shield') {
                    const parsedBonus = parseParryBonusFromValue(gearData.value);
                    const presetBonus = parseInt(protectiveGearForm.dataset.parryBonus, 10);
                    const finalBonus = parsedBonus || (!Number.isNaN(presetBonus) ? presetBonus : 0);
                    if (finalBonus) {
                        targetRow.dataset.parryBonus = finalBonus;
                    } else {
                        delete targetRow.dataset.parryBonus;
                    }
                }
            }
            protectiveGearModal.classList.add('hidden');
            app.state.currentProtectiveSlot = null;
            updateTotalLoad();
            if (app.core && app.core.updateAttributes) app.core.updateAttributes();
        });
        clearProtectiveGearBtn.addEventListener('click', () => {
            if (!app.state.currentProtectiveSlot) return;
            const targetRow = document.getElementById(`${app.state.currentProtectiveSlot}_slot`);
            if (targetRow) {
                const notesInput = targetRow.querySelector('input[data-key="notes"]');
                targetRow.querySelector('input[data-key="name"]').value = '';
                targetRow.querySelector('input[data-key="value"]').value = '';
                targetRow.querySelector('input[data-key="load"]').value = '';
                if (notesInput) notesInput.value = '';
                targetRow.dataset.notes = '';
                if (app.state.currentProtectiveSlot === 'shield') {
                    delete targetRow.dataset.parryBonus;
                }
            }
            protectiveGearModal.classList.add('hidden');
            app.state.currentProtectiveSlot = null;
            updateTotalLoad();
            if (app.core && app.core.updateAttributes) app.core.updateAttributes();
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
                if (selectedGear.parryBonus != null) {
                    protectiveGearForm.dataset.parryBonus = selectedGear.parryBonus;
                } else {
                    delete protectiveGearForm.dataset.parryBonus;
                }
            } else {
                protectiveGearForm.reset();
                delete protectiveGearForm.dataset.parryBonus;
            }
        });
    }

    app.gear = {
        updateTotalLoad,
        getShieldParryBonus,
        addCombatGearRow,
        populateCombatGearPresets,
        init
    };
})();
