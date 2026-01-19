const protectiveGearPresets = [
    { name: '皮革衣', value: '1d', load: '3', type: '皮甲' },
    { name: '皮革甲', value: '2d', load: '6', type: '皮甲' },
    { name: '链甲衫', value: '3d', load: '9', type: '链甲' },
    { name: '链甲衣', value: '4d', load: '12', type: '链甲' },
    { name: '头盔', value: '1d', load: '4', type: '头部装备' },
    { name: '小圆盾', value: '+1招架', load: '2', type: '盾牌', parryBonus: 1 },
    { name: '盾牌（普通生活水平）', value: '+2招架', load: '4', type: '盾牌', parryBonus: 2 },
    { name: '大盾（富有生活水平）', value: '+3招架', load: '6', type: '盾牌', parryBonus: 3 }
];

const combatGearPresets = [
    { name: '徒手攻击', damage: '1', injury: '—', load: '0', proficiency: '格斗', notes: '包括投掷石块。无法造成致命一击。' },
    { name: '匕首', damage: '2', injury: '14', load: '0', proficiency: '格斗', notes: '可以如同剑鞘般发射 (详见于第99页)' },
    { name: '短棍', damage: '3', injury: '12', load: '0', proficiency: '格斗', notes: '—' },
    { name: '棍棒', damage: '4', injury: '14', load: '1', proficiency: '格斗', notes: '—' },
    { name: '短剑', damage: '3', injury: '16', load: '1', proficiency: '剑类', notes: '—' },
    { name: '剑', damage: '4', injury: '16', load: '2', proficiency: '剑类', notes: '—' },
    { name: '长剑', damage: '5', injury: '16 (单手) / 18 (双手)', load: '3', proficiency: '剑类', notes: '可单手或双手持握' },
    { name: '短矛', damage: '3', injury: '14', load: '2', proficiency: '矛类', notes: '可投掷' },
    { name: '矛', damage: '4', injury: '14 (单手) / 16 (双手)', load: '3', proficiency: '矛类', notes: '可单手或双手持握' },
    { name: '巨矛', damage: '5', injury: '16', load: '4', proficiency: '矛类', notes: '双手持握' },
    { name: '斧', damage: '5', injury: '18', load: '2', proficiency: '斧类', notes: '—' },
    { name: '长柄斧', damage: '6', injury: '18 (单手) / 20 (双手)', load: '3', proficiency: '斧类', notes: '可单手或双手持握' },
    { name: '巨斧', damage: '7', injury: '20', load: '4', proficiency: '斧类', notes: '双手持握' },
    { name: '鹤嘴锄', damage: '7', injury: '18', load: '3', proficiency: '斧类', notes: '双手持握' },
    { name: '弓', damage: '3', injury: '14', load: '2', proficiency: '弓类', notes: '远程武器，双手持握' },
    { name: '大弓', damage: '4', injury: '16', load: '4', proficiency: '弓类', notes: '远程武器，双手持握' }
];
