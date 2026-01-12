document.addEventListener('DOMContentLoaded', function() {
    const app = window.TorCharacterApp = window.TorCharacterApp || {};

    app.state = {
        kingOfMenBonusAppliedTo: null,
        currentProtectiveSlot: null,
        currentCombatGearRow: null,
        baseTN: 20,
        isRestoring: false,
        autoSaveKey: 'tor_character_autosave',
        autoSaveTimer: null,
        portraitCropState: {
            scale: 1,
            minScale: 1,
            offsetX: 0,
            offsetY: 0,
            dragging: false,
            dragStartX: 0,
            dragStartY: 0,
            startOffsetX: 0,
            startOffsetY: 0
        }
    };

    app.elements = {
        bodyVal: document.getElementById('body_val'),
        bodyTN: document.getElementById('body_tn'),
        heartVal: document.getElementById('heart_val'),
        heartTN: document.getElementById('heart_tn'),
        witsVal: document.getElementById('wits_val'),
        witsTN: document.getElementById('wits_tn'),
        enduranceVal: document.getElementById('endurance_val'),
        hopeVal: document.getElementById('hope_val'),
        parryVal: document.getElementById('parry_val'),
        heroicCultureSelect: document.getElementById('heroic_culture'),
        culturalBlessingInput: document.getElementById('cultural_blessing'),
        culturalBlessingDesc: document.getElementById('cultural_blessing_desc'),
        callingSelect: document.getElementById('calling'),
        trait1Select: document.getElementById('trait1_select'),
        trait1Desc: document.getElementById('trait1_desc'),
        trait2Select: document.getElementById('trait2_select'),
        trait2Desc: document.getElementById('trait2_desc'),
        trait3Feature: document.getElementById('trait3_calling_feature'),
        trait3Desc: document.getElementById('trait3_desc'),
        valourInput: document.getElementById('valour'),
        wisdomInput: document.getElementById('wisdom'),
        rewardsContainer: document.getElementById('rewards_container'),
        combatGearModal: document.getElementById('combatGearModal'),
        combatGearForm: document.getElementById('combatGearForm'),
        clearCombatGearBtn: document.getElementById('clear_combat_gear_btn'),
        cancelCombatGearBtn: document.getElementById('cancel_combat_gear_btn'),
        combatPresetSelect: document.getElementById('modal_combat_preset'),
        protectiveGearModal: document.getElementById('protectiveGearModal'),
        protectiveGearForm: document.getElementById('protectiveGearForm'),
        clearProtectiveGearBtn: document.getElementById('clear_protective_gear_btn'),
        cancelProtectiveGearBtn: document.getElementById('cancel_protective_gear_btn'),
        protectivePresetSelect: document.getElementById('modal_protective_preset'),
        portraitCropModal: document.getElementById('portraitCropModal'),
        portraitCropFrame: document.getElementById('portrait_crop_frame'),
        portraitCropImage: document.getElementById('portrait_crop_image'),
        portraitZoomInput: document.getElementById('portrait_zoom'),
        portraitCropConfirm: document.getElementById('portrait_crop_confirm'),
        portraitCropCancel: document.getElementById('portrait_crop_cancel'),
        portraitUploadInput: document.getElementById('portrait_upload'),
        portraitPreview: document.getElementById('portrait_preview'),
        portraitFrame: document.getElementById('portrait_frame'),
        portraitRemove: document.getElementById('portrait_remove')
    };

    const portraitBox = document.querySelector('.portrait-box');
    const defaultPortraitSrc = app.elements.portraitPreview ? app.elements.portraitPreview.dataset.defaultSrc : '';
    const updatePortraitPlaceholder = () => {
        const currentSrc = app.elements.portraitPreview ? app.elements.portraitPreview.src : '';
        const hasPortrait = Boolean(currentSrc) && currentSrc !== defaultPortraitSrc;
        if (portraitBox) portraitBox.classList.toggle('has-portrait', hasPortrait);
    };
    if (app.elements.portraitPreview) {
        app.elements.portraitPreview.addEventListener('load', updatePortraitPlaceholder);
    }
    updatePortraitPlaceholder();
    if (app.elements.portraitFrame) {
        app.elements.portraitFrame.addEventListener('click', () => {
            if (portraitBox && portraitBox.classList.contains('has-portrait')) return;
            if (app.elements.portraitUploadInput) app.elements.portraitUploadInput.click();
        });
    }
    if (app.elements.portraitRemove) {
        app.elements.portraitRemove.addEventListener('click', (event) => {
            event.stopPropagation();
            if (!defaultPortraitSrc || !app.elements.portraitPreview) return;
            app.elements.portraitPreview.src = defaultPortraitSrc;
            if (app.elements.portraitUploadInput) {
                app.elements.portraitUploadInput.value = '';
            }
            if (app.storage && app.storage.saveToLocalStorage) {
                app.storage.saveToLocalStorage();
            }
            updatePortraitPlaceholder();
        });
    }

    app.core.init();
    app.rewards.init();
    app.gear.init();
    app.portrait.init();
    app.king.init();

    const skillContainers = [
        'skill_awe',
        'skill_athletics',
        'skill_awareness',
        'skill_hunting',
        'skill_song',
        'skill_craft',
        'skill_enhearten',
        'skill_travel',
        'skill_insight',
        'skill_healing',
        'skill_courtesy',
        'skill_battle',
        'skill_persuade',
        'skill_stealth',
        'skill_search',
        'skill_explore',
        'skill_riddle',
        'skill_lore',
        'prof_axes',
        'prof_bows',
        'prof_spears',
        'prof_swords'
    ];
    skillContainers.forEach(id => app.core.createRankCheckboxes(id));

    document.getElementById('save-btn').addEventListener('click', app.storage.exportCharacter);
    document.getElementById('load-btn').addEventListener('click', app.storage.importCharacter);
    document.getElementById('export-btn').addEventListener('click', () => {
        const originalTitle = document.title;
        const safeName = app.storage.getSafeExportBaseName(
            document.getElementById('char_name').value,
            app.elements.heroicCultureSelect.value,
            app.elements.callingSelect.value,
            app.elements.valourInput.value,
            app.elements.wisdomInput.value
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
            const modeNormal = document.getElementById('mode_normal');
            if (modeNormal) modeNormal.checked = true;
            app.state.baseTN = 20;

            const defaultZeroIds = ['body_val', 'heart_val', 'wits_val', 'fatigue_val', 'shadow_scar_val', 'valour', 'wisdom'];

            document.querySelectorAll('.character-sheet input, .character-sheet textarea, .character-sheet select').forEach(el => {
                if (el.closest('.modal-content') || el.closest('#rewards_container')) return;

                if (el.type === 'checkbox' || el.type === 'radio') {
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

            app.elements.rewardsContainer.innerHTML = '';

            if (defaultPortraitSrc) {
                app.elements.portraitPreview.src = defaultPortraitSrc;
            }
            app.elements.portraitUploadInput.value = '';
            updatePortraitPlaceholder();

            document.getElementById('combat_gear_body').innerHTML = '';
            document.querySelectorAll('#protective_gear_body input[data-key]').forEach(input => { input.value = ''; });

            app.king.removeKingOfMenBonus(true);

            app.elements.heroicCultureSelect.dispatchEvent(new Event('change'));
            app.elements.callingSelect.dispatchEvent(new Event('change'));

            app.core.updateAttributes();
            app.king.updateKingOfMenUI();
            app.gear.updateTotalLoad();
            localStorage.removeItem(app.state.autoSaveKey);
            alert('人物卡已重置。');
        }
    });

    app.core.updateAttributes();
    app.storage.loadFromLocalStorage();
    updatePortraitPlaceholder();

    document.querySelector('.character-sheet').addEventListener('input', () => {
        clearTimeout(app.state.autoSaveTimer);
        app.state.autoSaveTimer = setTimeout(app.storage.saveToLocalStorage, 200);
    });
    document.querySelector('.character-sheet').addEventListener('change', () => {
        clearTimeout(app.state.autoSaveTimer);
        app.state.autoSaveTimer = setTimeout(app.storage.saveToLocalStorage, 200);
    });
    window.addEventListener('beforeunload', app.storage.saveToLocalStorage);
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') app.storage.saveToLocalStorage();
    });
});
