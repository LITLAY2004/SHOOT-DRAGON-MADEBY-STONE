const {
    renderCsv,
    renderJson,
    renderRecords,
    EXPORT_FIELDS,
    ValidationError
} = require('../../src/services/export');

describe('Export Renderers', () => {
    const records = [
        {
            sessionId: 'sess-1',
            playerId: 'player-1',
            mode: 'ENDLESS',
            waveReached: 12,
            durationSeconds: 735,
            totalScore: 15420,
            resourcesCollected: 3800,
            dominantElementUsed: 'fire',
            skillsUsage: [
                { skillId: 'meteor', casts: 4 },
                { skillId: 'dash', casts: 2 }
            ],
            defeatCause: 'player_death',
            startedAt: '2024-03-01T10:00:00Z',
            endedAt: '2024-03-01T10:12:15Z'
        },
        {
            sessionId: 'sess-2',
            playerId: 'player-2',
            mode: 'SURVIVAL',
            waveReached: 6,
            durationSeconds: 420,
            totalScore: 6400,
            resourcesCollected: 1200,
            dominantElementUsed: 'ice',
            skillsUsage: [],
            defeatCause: '',
            startedAt: '2024-03-01T11:00:00Z',
            endedAt: '2024-03-01T11:07:00Z'
        }
    ];

    it('renders CSV with header and serialized skills', () => {
        const csv = renderCsv(records);
        const lines = csv.split('\n');
        expect(lines[0]).toBe(EXPORT_FIELDS.join(','));
        expect(lines[1]).toContain('meteor:4|dash:2');
        expect(lines[2]).not.toContain('|');
    });

    it('renders JSON with normalized properties', () => {
        const json = renderJson(records);
        const parsed = JSON.parse(json);
        expect(parsed).toHaveLength(2);
        expect(parsed[0]).toMatchObject({
            sessionId: 'sess-1',
            skillsUsage: 'meteor:4|dash:2'
        });
    });

    it('dispatches renderRecords based on format', () => {
        const csv = renderRecords('csv', records);
        const json = renderRecords('json', records);
        expect(csv.startsWith(EXPORT_FIELDS[0])).toBe(true);
        expect(JSON.parse(json)).toHaveLength(2);
    });

    it('throws validation error for unsupported format', () => {
        expect(() => renderRecords('xml', records)).toThrow(ValidationError);
    });
});
