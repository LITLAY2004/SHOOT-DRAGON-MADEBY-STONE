const { ValidationError } = require('./errors');

const EXPORT_FIELDS = [
    'sessionId',
    'playerId',
    'mode',
    'waveReached',
    'durationSeconds',
    'totalScore',
    'resourcesCollected',
    'dominantElementUsed',
    'skillsUsage',
    'defeatCause',
    'startedAt',
    'endedAt'
];

function csvEscape(value) {
    if (value === null || value === undefined) {
        return '';
    }
    const str = String(value);
    if (/[",\n]/.test(str)) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}

function serializeSkills(skills) {
    if (!Array.isArray(skills) || skills.length === 0) {
        return '';
    }
    return skills
        .map((skill) => {
            if (!skill || !skill.skillId) {
                return '';
            }
            const casts = typeof skill.casts === 'number' ? skill.casts : 0;
            return `${skill.skillId}:${casts}`;
        })
        .filter(Boolean)
        .join('|');
}

function normalizeRecord(record = {}) {
    return {
        sessionId: record.sessionId || '',
        playerId: record.playerId || '',
        mode: record.mode || record.gameMode || '',
        waveReached: typeof record.waveReached === 'number' ? record.waveReached : '',
        durationSeconds: typeof record.durationSeconds === 'number' ? record.durationSeconds : '',
        totalScore: typeof record.totalScore === 'number' ? record.totalScore : '',
        resourcesCollected: typeof record.resourcesCollected === 'number' ? record.resourcesCollected : '',
        dominantElementUsed: record.dominantElementUsed || record.dominantElement || '',
        skillsUsage: serializeSkills(record.skillsUsage || record.skills || []),
        defeatCause: record.defeatCause || '',
        startedAt: record.startedAt || '',
        endedAt: record.endedAt || ''
    };
}

function renderCsv(records = []) {
    const rows = [EXPORT_FIELDS.join(',')];
    (Array.isArray(records) ? records : []).forEach((record) => {
        const normalized = normalizeRecord(record);
        const row = EXPORT_FIELDS.map((field) => csvEscape(normalized[field])).join(',');
        rows.push(row);
    });
    return rows.join('\n');
}

function renderJson(records = []) {
    const normalizedRecords = (Array.isArray(records) ? records : []).map((record) => normalizeRecord(record));
    return JSON.stringify(normalizedRecords, null, 2);
}

function renderRecords(format, records = []) {
    if (format === 'csv') {
        return renderCsv(records);
    }
    if (format === 'json') {
        return renderJson(records);
    }
    throw new ValidationError(`Unsupported export format: ${format}`);
}

module.exports = {
    EXPORT_FIELDS,
    renderCsv,
    renderJson,
    renderRecords,
    normalizeRecord
};
