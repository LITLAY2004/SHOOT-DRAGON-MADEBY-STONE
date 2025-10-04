const fs = require('fs/promises');
const path = require('path');
const {
    ArtifactStorage,
    ValidationError
} = require('../../src/services/export');

describe('ArtifactStorage', () => {
    const baseDir = path.join(process.cwd(), 'tmp', 'test-export-artifacts');
    const clock = () => new Date('2024-03-02T00:00:00Z');
    const storage = new ArtifactStorage({
        baseDir,
        signedUrlBase: 'https://storage.local/test',
        ttlSeconds: 3600,
        clock
    });

    afterAll(async () => {
        await fs.rm(baseDir, { recursive: true, force: true });
    });

    it('stores CSV artifact and returns signed url', async () => {
        const result = await storage.storeArtifact({
            tenantId: 'tenant-123',
            jobId: 'exp_test',
            format: 'csv',
            records: [
                {
                    sessionId: 'sess-1',
                    playerId: 'player-1',
                    mode: 'ENDLESS',
                    waveReached: 8,
                    durationSeconds: 480,
                    totalScore: 9200,
                    resourcesCollected: 2100,
                    dominantElementUsed: 'fire',
                    skillsUsage: [{ skillId: 'meteor', casts: 3 }],
                    defeatCause: 'player_death',
                    startedAt: '2024-03-01T10:00:00Z',
                    endedAt: '2024-03-01T10:08:00Z'
                }
            ],
            filters: { rangeStart: '2024-03-01', rangeEnd: '2024-03-02' },
            actorId: 'admin-9'
        });

        expect(result.downloadUrl).toMatch(/https:\/\/storage\.local\/test\/tenant-123\/exp_test.csv/);
        expect(result.createdAt).toBe('2024-03-02T00:00:00.000Z');
        expect(result.expiresAt).toBe('2024-03-02T01:00:00.000Z');

        const stored = await fs.readFile(path.join(baseDir, 'tenant-123', 'exp_test.csv'), 'utf8');
        expect(stored).toContain('meteor:3');

        const metadata = await fs.readFile(path.join(baseDir, 'tenant-123', 'exp_test.meta.json'), 'utf8');
        const parsedMetadata = JSON.parse(metadata);
        expect(parsedMetadata.format).toBe('csv');
        expect(parsedMetadata.actorId).toBe('admin-9');
    });

    it('rejects storage without tenant id', async () => {
        await expect(storage.storeArtifact({
            tenantId: '',
            jobId: 'exp',
            format: 'csv',
            records: []
        })).rejects.toThrow(ValidationError);
    });
});
