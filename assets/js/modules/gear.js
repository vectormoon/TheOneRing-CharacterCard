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
            cancelCombatGearBtn,
            combatPresetSelect,
            protectiveGearModal,
            protectiveGearForm,
            cancelProtectiveGearBtn,
            protectivePresetSelect
        } = app.elements;

        document.getElementById('combat_gear_body').addEventListener('click', e => {
            if (e.target.classList.contains('remove-row-btn')) {
                e.target.closest('tr').remove();
                updateTotalLoad();
            }
        });

        populateCombatGearPresets();

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
            updateTotalLoad();
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

        document.getElementById('protective_gear_body').addEventListener('click', (e) => {
            const row = e.target.closest('tr');
            if (!row) return;
            const slot = row.id ? row.id.replace('_slot', '') : '';
            if (!slot) return;

            app.state.currentProtectiveSlot = slot;
            protectiveGearForm.reset();

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
            }
            protectiveGearModal.classList.add('hidden');
            app.state.currentProtectiveSlot = null;
            updateTotalLoad();
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
    }

    app.gear = {
        updateTotalLoad,
        addCombatGearRow,
        populateCombatGearPresets,
        init
    };
})();
