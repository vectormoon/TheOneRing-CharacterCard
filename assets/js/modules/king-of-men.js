(function() {
    const app = window.TorCharacterApp = window.TorCharacterApp || {};

    function applyKingOfMenBonus(stat) {
        if (app.state.kingOfMenBonusAppliedTo) return;
        const statInput = document.getElementById(stat + '_val');
        if (statInput) {
            statInput.value = (parseInt(statInput.value, 10) || 0) + 1;
            app.state.kingOfMenBonusAppliedTo = stat;
            app.core.updateAttributes();
            updateKingOfMenUI();
        }
    }

    function removeKingOfMenBonus(silent = false) {
        if (!app.state.kingOfMenBonusAppliedTo) return;
        const statInput = document.getElementById(app.state.kingOfMenBonusAppliedTo + '_val');
        if (statInput) statInput.value = Math.max(0, parseInt(statInput.value, 10) - 1);
        app.state.kingOfMenBonusAppliedTo = null;
        app.core.updateAttributes();
        if (!silent) updateKingOfMenUI();
    }

    function updateKingOfMenUI() {
        const bonusContainer = document.getElementById('king_of_men_bonus');
        if (!bonusContainer) return;
        const isRanger = app.elements.heroicCultureSelect.value === '北方的游民';
        bonusContainer.classList.toggle('hidden', !isRanger);

        bonusContainer.querySelectorAll('button[data-stat]').forEach(btn => {
            btn.disabled = !!app.state.kingOfMenBonusAppliedTo;
        });
        document.getElementById('reset_king_bonus').disabled = !app.state.kingOfMenBonusAppliedTo;
    }

    function init() {
        const kingOfMenBonus = document.getElementById('king_of_men_bonus');
        if (!kingOfMenBonus) return;
        kingOfMenBonus.addEventListener('click', e => {
            if (e.target.matches('button[data-stat]')) {
                applyKingOfMenBonus(e.target.dataset.stat);
            } else if (e.target.matches('#reset_king_bonus')) {
                removeKingOfMenBonus();
            }
        });
    }

    app.king = {
        applyKingOfMenBonus,
        removeKingOfMenBonus,
        updateKingOfMenUI,
        init
    };
})();
