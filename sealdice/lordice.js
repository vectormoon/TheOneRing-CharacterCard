// ==UserScript==
// @name         LOR Dice
// @author       waddleming
// @version      1.0.0
// @description  Simple .lor dice command: d12 or d12 + Nd6.
// @timestamp    1767427200
// @license      MIT
// ==/UserScript==

const EXT_NAME = 'lor-dice';
const EXT_AUTHOR = 'waddleming';
const EXT_VERSION = '1.0.0';

let lorExt = seal.ext.find(EXT_NAME);
if (!lorExt) {
    lorExt = seal.ext.new(EXT_NAME, EXT_AUTHOR, EXT_VERSION);
    seal.ext.register(lorExt);
}

const MAX_D6_COUNT = 20;

function rollDie(sides) {
    return Math.floor(Math.random() * sides) + 1;
}

function normalizeD12Lor(value) {
    return value === 11 ? 0 : value;
}

function normalizeD12Lorm(value) {
    if (value === 12) {
        return 0;
    }
    return value;
}

function formatDiceList(label, rolls) {
    if (rolls.length === 0) {
        return '';
    }
    const sum = rolls.reduce((total, value) => total + value, 0);
    return `${label}=${rolls.join('+')} (${sum})`;
}

function getD12Mark(rawValue) {
    if (rawValue === 12) {
        return '（甘道夫徽记）';
    }
    if (rawValue === 11) {
        return '（索隆之眼）';
    }
    return '';
}

function selectD12Result(d12Rolls, mode, normalizer) {
    if (!Array.isArray(d12Rolls)) {
        return { raw: d12Rolls, value: normalizer(d12Rolls) };
    }

    const normalized = d12Rolls.map((value) => normalizer(value));
    const targetValue = mode === 'dis' ? Math.min(...normalized) : Math.max(...normalized);
    const index = normalized.indexOf(targetValue);
    return { raw: d12Rolls[index], value: normalized[index] };
}

function parseLorCommand(cmdArgs, prefix) {
    const commandName = (cmdArgs.command || '').toLowerCase();
    const advDisMatch = commandName.match(new RegExp(`^${prefix}(\\d+)?(adv|dis)$`, 'i'));
    if (advDisMatch) {
        return {
            count: advDisMatch[1] ? parseInt(advDisMatch[1], 10) : 0,
            mode: advDisMatch[2]
        };
    }

    const suffixMatch = commandName.match(new RegExp(`^${prefix}(\\d+)$`, 'i'));
    if (suffixMatch) {
        return { count: parseInt(suffixMatch[1], 10), mode: 'normal' };
    }

    const rawArgs = (cmdArgs.rawArgs || '').trim();
    if (!rawArgs) {
        return { count: 0, mode: 'normal' };
    }

    if (/^\d+$/.test(rawArgs)) {
        return { count: parseInt(rawArgs, 10), mode: 'normal' };
    }

    return null;
}

function buildLorResponse(d12Rolls, d6Rolls, mode, normalizer, label) {
    const d6Sum = d6Rolls.reduce((total, value) => total + value, 0);
    const skillDieCount = d6Rolls.filter((value) => value === 6).length;
    const d12Result = selectD12Result(d12Rolls, mode, normalizer);
    const d12Value = d12Result.value;
    const total = d12Value + d6Sum;
    const d6Text = formatDiceList('d6', d6Rolls);
    const parts = [];
    const totalMark = getD12Mark(d12Result.raw);

    if (Array.isArray(d12Rolls)) {
        parts.push(`d12=${d12Rolls.join(',')} -> ${d12Value}`);
    } else {
        parts.push(`d12=${d12Rolls}`);
    }

    if (d6Text) {
        parts.push(d6Text);
    } else {
        parts.push('d6=0 (0)');
    }
    parts.push('-------------------');
    parts.push(`成功数：${skillDieCount}`);
    parts.push(`总点数：${total}${totalMark}`);
    parts.push('-------------------');
    return `${label}\n${parts.join('\n')}`;
}

const cmdLor = seal.ext.newCmdItemInfo();
cmdLor.name = 'lor';
cmdLor.help = `.lor [N] // roll 1d12, optionally add Nd6 (supports .lor3 shorthand)
.lor[N]adv // advantage: roll 2d12 take highest, add Nd6 (N defaults to 0)
.lor[N]dis // disadvantage: roll 2d12 take lowest, add Nd6 (N defaults to 0)
Note: d12 roll of 11 counts as 0.
Examples:
  .lor
  .lor 3
  .lor3
  .lor3adv
  .lor2dis`;
cmdLor.solve = (ctx, msg, cmdArgs) => {
    const parsed = parseLorCommand(cmdArgs, 'lor');
    if (!parsed) {
        const result = seal.ext.newCmdExecuteResult(false);
        result.showHelp = true;
        return result;
    }

    if (parsed.count < 0 || parsed.count > MAX_D6_COUNT) {
        seal.replyToSender(ctx, msg, `Invalid d6 count (0-${MAX_D6_COUNT}).`);
        return seal.ext.newCmdExecuteResult(false);
    }

    let d12Roll = rollDie(12);
    if (parsed.mode === 'adv' || parsed.mode === 'dis') {
        d12Roll = [rollDie(12), rollDie(12)];
    }

    const d6Rolls = [];
    for (let i = 0; i < parsed.count; i++) {
        d6Rolls.push(rollDie(6));
    }

    const userName = seal.format(ctx, '{$t玩家}');
    let response;
    response = buildLorResponse(d12Roll, d6Rolls, parsed.mode, normalizeD12Lor, '冒险者进行检定');
    seal.replyToSender(ctx, msg, `${userName} ${response}`);
    return seal.ext.newCmdExecuteResult(true);
};

lorExt.cmdMap['lor'] = cmdLor;

for (let i = 1; i <= MAX_D6_COUNT; i++) {
    const alias = `lor${i}`;
    lorExt.cmdMap[alias] = cmdLor;
}

lorExt.cmdMap['loradv'] = cmdLor;
lorExt.cmdMap['lordis'] = cmdLor;

for (let i = 1; i <= MAX_D6_COUNT; i++) {
    lorExt.cmdMap[`lor${i}adv`] = cmdLor;
    lorExt.cmdMap[`lor${i}dis`] = cmdLor;
}

const cmdLorm = seal.ext.newCmdItemInfo();
cmdLorm.name = 'lorm';
cmdLorm.help = `.lorm [N] // roll 1d12, optionally add Nd6 (supports .lorm3 shorthand)
.lorm[N]adv // advantage: roll 2d12 take highest, add Nd6 (N defaults to 0)
.lorm[N]dis // disadvantage: roll 2d12 take lowest, add Nd6 (N defaults to 0)
Note: d12 roll of 11 counts as 12, roll of 12 counts as 0.
Examples:
  .lorm
  .lorm 3
  .lorm3
  .lorm3adv
  .lorm2dis`;
cmdLorm.solve = (ctx, msg, cmdArgs) => {
    const parsed = parseLorCommand(cmdArgs, 'lorm');
    if (!parsed) {
        const result = seal.ext.newCmdExecuteResult(false);
        result.showHelp = true;
        return result;
    }

    if (parsed.count < 0 || parsed.count > MAX_D6_COUNT) {
        seal.replyToSender(ctx, msg, `Invalid d6 count (0-${MAX_D6_COUNT}).`);
        return seal.ext.newCmdExecuteResult(false);
    }

    let d12Roll = rollDie(12);
    if (parsed.mode === 'adv' || parsed.mode === 'dis') {
        d12Roll = [rollDie(12), rollDie(12)];
    }

    const d6Rolls = [];
    for (let i = 0; i < parsed.count; i++) {
        d6Rolls.push(rollDie(6));
    }

    const userName = seal.format(ctx, '{$t玩家}');
    let response;
    response = buildLorResponse(d12Roll, d6Rolls, parsed.mode, normalizeD12Lorm, '博闻者进行检定');
    seal.replyToSender(ctx, msg, `${userName} ${response}`);
    return seal.ext.newCmdExecuteResult(true);
};

lorExt.cmdMap['lorm'] = cmdLorm;

for (let i = 1; i <= MAX_D6_COUNT; i++) {
    const alias = `lorm${i}`;
    lorExt.cmdMap[alias] = cmdLorm;
}

lorExt.cmdMap['lormadv'] = cmdLorm;
lorExt.cmdMap['lormdis'] = cmdLorm;

for (let i = 1; i <= MAX_D6_COUNT; i++) {
    lorExt.cmdMap[`lorm${i}adv`] = cmdLorm;
    lorExt.cmdMap[`lorm${i}dis`] = cmdLorm;
}
