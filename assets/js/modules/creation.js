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

    /**
     * 文化战斗熟练免费部分：「或」类 2 级 +「选一种」1 级，共 3 点。
     * 「或」落在 A 侧时：允许 ra>=2 且 rb<=1（2 斧 + 1 剑 合法：2 点落在「或」上，1 点为自选落在另一侧）。
     * 旧实现要求 rb===0 才算 OR 完成，导致一点剑后基准被清空，整段熟练被误判为自费（约 6+2=8 点）。
     */
    function computeCultureProfBaseline(culture, ranks) {
        const out = { prof_axes: 0, prof_bows: 0, prof_spears: 0, prof_swords: 0 };
        const pair = cultureCombatProficiencyOrPair[culture];
        if (!pair) return out;
        const [a, b] = pair;
        const ra = ranks[a] ?? 0;
        const rb = ranks[b] ?? 0;

        if (ra >= 2 && rb <= 1) {
            if (rb === 1) {
                out[a] = 2;
                out[b] = 1;
            } else {
                out[a] = Math.min(ra, 3);
            }
        } else if (rb >= 2 && ra <= 1) {
            if (ra === 1) {
                out[b] = 2;
                out[a] = 1;
            } else {
                out[b] = Math.min(rb, 3);
            }
        } else {
            return out;
        }

        let budget = 3 - (out.prof_axes + out.prof_bows + out.prof_spears + out.prof_swords);
        for (const id of proficiencyRankContainers) {
            const have = ranks[id] ?? 0;
            const assigned = out[id];
            const surplus = have - assigned;
            if (surplus > 0 && budget > 0) {
                const take = Math.min(budget, surplus);
                out[id] += take;
                budget -= take;
                if (budget <= 0) break;
            }
        }
        return out;
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

    /** 仅记录文化技能表；战斗熟练免费档由 computeCultureProfBaseline 按当前格动态计算。 */
    function snapshotBaseRanksAfterCulture() {
        const cultureEl = document.getElementById('heroic_culture');
        const culture = cultureEl ? cultureEl.value : '';
        const sr = cultureSkillRanks[culture];
        const snap = {};
        skillRankContainers.forEach((id) => {
            snap[id] = sr && Object.prototype.hasOwnProperty.call(sr, id) ? sr[id] : 0;
        });
        proficiencyRankContainers.forEach((id) => {
            snap[id] = 0;
        });
        app.state.creationBaseRanks = snap;
        console.log('[TOR] creation skill baseline (culture)', snap);
    }

    function getEffectiveCreationBaseRanks() {
        const cultureEl = document.getElementById('heroic_culture');
        const culture = cultureEl ? cultureEl.value : '';
        const skillSnap = app.state.creationBaseRanks || {};
        const current = getCurrentRanksMap();
        const profFree = computeCultureProfBaseline(culture, current);
        const merged = { ...skillSnap, ...profFree };
        return merged;
    }

    function snapshotBaseRanksFromCulture(culture) {
        const ranks = cultureSkillRanks[culture];
        const snap = {};
        skillRankContainers.forEach((id) => {
            snap[id] = ranks && Object.prototype.hasOwnProperty.call(ranks, id) ? ranks[id] : 0;
        });
        proficiencyRankContainers.forEach((id) => {
            snap[id] = 0;
        });
        app.state.creationBaseRanks = snap;
        console.log('[TOR] creation base ranks from culture (skills only)', culture, snap);
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

        const base = getEffectiveCreationBaseRanks();
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
        computeCultureProfBaseline,
        snapshotBaseRanks: snapshotBaseRanksAfterCulture,
        snapshotBaseRanksAfterCulture,
        getEffectiveCreationBaseRanks,
        snapshotBaseRanksFromCulture,
        updateCreationPointsUI,
        init,
        reset
    };
})();
