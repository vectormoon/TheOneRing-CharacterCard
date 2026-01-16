const cultureData = {
    "巴德一族的人类": {
        blessing: {
            name: "勇敢刚毅",
            description: "你的英勇检定都将具备优势。",
        },
        livingStandard: "富有",
        modifiers: {
            endurance: 20,
            hope: 8,
            parry: 12,
        },
        traits: ['大胆', '热忱', '迷人', '凶狠', '慷慨', '自傲', '高大', '固执'],
    },
    "都林一族的矮人": {
        blessing: {
            name: "锐不可当",
            description: "你所穿戴的护甲负重值减半计算（往上取整），包括头盔（但不包括盾牌）。",
        },
        livingStandard: "富有",
        modifiers: {
            endurance: 22,
            hope: 8,
            parry: 10,
        },
        traits: ['狡黠', '凶狠', '威严', '自傲', '内敛', '严肃', '警惕', '固执'],
    },
    "林顿的精灵": {
        blessing: {
            name: "精灵之艺",
            description: "如果你不处于痛苦状态，当你使用至少拥有1个等级的技能时，你可以通过消耗1点希望值从而在该技能检定中取得魔法成功。",
        },
        livingStandard: "节俭",
        modifiers: {
            endurance: 20,
            hope: 8,
            parry: 12,
        },
        traits: ['迷人', '目光敏锐', '威严', '乐天', '耐心', '机智', '矫捷', '警惕'],
    },
    "夏尔的霍比特人": {
        blessing: {
            name: "见怪不怪",
            description: "你的智慧检定视为优势，并且你在有关抵御贪婪影响的魔影检定中获得（1d）。",
        },
        livingStandard: "普通",
        modifiers: {
            endurance: 18,
            hope: 10,
            parry: 12,
        },
        traits: ['热忱', '言语得体', '忠贞', '正直', '好奇', '目光敏锐', '乐天', '朴实'],
    },
    "布理的人类": {
        blessing: {
            name: "布理血脉",
            description: "玩家团队中每有一名布理人，同盟点就会提升1点。",
        },
        livingStandard: "普通",
        modifiers: {
            endurance: 20,
            hope: 10,
            parry: 10,
        },
        traits: ['狡黠', '言语得体', '忠贞', '慷慨', '好奇', '耐心', '朴实', '真诚'],
    },
    "北方的游民": {
        blessing: {
            name: "人中王者",
            description: "任选一项属性提升1点。",
        },
        livingStandard: "节俭",
        modifiers: {
            endurance: 20,
            hope: 6,
            parry: 14,
        },
        traits: ['大胆', '正直', '内敛', '严肃', '机智', '矫捷', '高大', '真诚'],
    },
    "": {
        blessing: {
            name: "",
            description: "由您的英雄所属文化决定。",
        },
        livingStandard: "",
        modifiers: {
            endurance: 0,
            hope: 0,
            parry: 0,
        },
        traits: [],
    },
};
