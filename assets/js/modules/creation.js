(function() {
    const app = window.TorCharacterApp = window.TorCharacterApp || {};

    const CREATION_POINTS_TOTAL = 10;

    const ALL_CREATION_CONTAINERS = skillRankContainers.concat([
        'prof_axes',
        'prof_bows',
        'prof_spears',
        'prof_swords'
    ]);

    const SKILL_STEP_COSTS = [1, 2, 3, 5, 5];
    const PROF_STEP_COSTS = [2, 4, 6, 6, 6];

    function isProficiencyId(containerId) {
        return containerId.startsWith('prof_');
    }

    function costForStep(containerId, stepIndex) {
        const table = isProficiencyId(containerId) ? PROF_STEP_COSTS : SKILL_STEP_COSTS;
        const idx = Math.min(Math.max(0, stepIndex), table.length - 1);
        return table[idx];
    }

    function computeCostFromTo(containerId, fromRank, toRank) {
        const from = Math.max(0, Math.min(fromRank, 5));
        const to = Math.max(0, Math.min(toRank, 5));
        if (to <= from) return 0;
        let total = 0;
        for (let step = from; step < to; step++) {
            total += costForStep(containerId, step);
        }
        return total;
    }

    function getRankFromContainer(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return 0;
        return container.querySelectorAll('input:checked').length;
    }

    function computeSpentPoints(baseRanks, currentRanks) {
        let spent = 0;
        for (const id of ALL_CREATION_CONTAINERS) {
            const base = baseRanks[id] ?? 0;
            const current = currentRanks[id] ?? 0;
            if (current > base) {
                spent += computeCostFromTo(id, base, current);
            }
        }
        return spent;
    }

    function getCurrentRanksMap() {
        const current = {};
        for (const id of ALL_CREATION_CONTAINERS) {
            current[id] = getRankFromContainer(id);
        }
        return current;
    }

    function snapshotBaseRanks() {
        const snap = {};
        for (const id of ALL_CREATION_CONTAINERS) {
            snap[id] = getRankFromContainer(id);
        }
        app.state.creationBaseRanks = snap;
        console.log('[TOR] creation base ranks snapshot', snap);
    }

    function snapshotBaseRanksFromCulture(culture) {
        const ranks = cultureSkillRanks[culture];
        const snap = {};
        for (const id of ALL_CREATION_CONTAINERS) {
            if (isProficiencyId(id)) {
                snap[id] = 0;
            } else {
                snap[id] = ranks && Object.prototype.hasOwnProperty.call(ranks, id) ? ranks[id] : 0;
            }
        }
        app.state.creationBaseRanks = snap;
        console.log('[TOR] creation base ranks from culture', culture, snap);
    }

    function isCreationTrackingActive() {
        const el = document.getElementById('skill_points');
        if (!el) return false;
        const v = parseInt(el.value, 10);
        return el.value === '' || Number.isNaN(v) || v === 0;
    }

    function updateCreationPointsUI() {
        const row = document.getElementById('creation_points_row');
        const remainingEl = document.getElementById('creation_points_remaining');
        const spentEl = document.getElementById('creation_points_spent');
        if (!row || !remainingEl) return;

        if (!isCreationTrackingActive()) {
            row.classList.add('creation-points-inactive');
            return;
        }
        row.classList.remove('creation-points-inactive');

        const base = app.state.creationBaseRanks || {};
        const current = getCurrentRanksMap();
        const spent = computeSpentPoints(base, current);
        const remaining = CREATION_POINTS_TOTAL - spent;

        remainingEl.textContent = String(remaining);
        if (spentEl) spentEl.textContent = String(spent);

        row.classList.toggle('creation-points-overspent', remaining < 0);
    }

    function init() {
        if (!app.state.creationBaseRanks) {
            app.state.creationBaseRanks = {};
        }
        const sp = document.getElementById('skill_points');
        if (sp) {
            sp.addEventListener('input', updateCreationPointsUI);
            sp.addEventListener('change', updateCreationPointsUI);
        }
        updateCreationPointsUI();
    }

    function reset() {
        updateCreationPointsUI();
    }

    app.creation = {
        CREATION_POINTS_TOTAL,
        computeSpentPoints,
        computeCostFromTo,
        snapshotBaseRanks,
        snapshotBaseRanksFromCulture,
        updateCreationPointsUI,
        init,
        reset
    };
})();
