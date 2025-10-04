const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const { renderRecords } = require('./renderers');
const { ValidationError } = require('./errors');

class ArtifactStorage {
    constructor(options = {}) {
        const {
            baseDir = path.join(process.cwd(), 'tmp', 'export-artifacts'),
            signedUrlBase = 'https://storage.local/exports',
            ttlSeconds = 24 * 60 * 60,
            clock = () => new Date()
        } = options;

        this.baseDir = baseDir;
        this.signedUrlBase = signedUrlBase.replace(/\/$/, '');
        this.ttlSeconds = ttlSeconds;
        this.clock = clock;
    }

    async storeArtifact({ tenantId, jobId, format, records, filters, actorId }) {
        if (!tenantId) {
            throw new ValidationError('tenantId is required for artifact storage');
        }
        if (!jobId) {
            throw new ValidationError('jobId is required for artifact storage');
        }
        if (!format) {
            throw new ValidationError('format is required for artifact storage');
        }

        const payload = renderRecords(format, records);
        const fileName = `${jobId}.${format}`;
        const tenantDir = path.join(this.baseDir, tenantId);
        await fs.mkdir(tenantDir, { recursive: true });

        const filePath = path.join(tenantDir, fileName);
        await fs.writeFile(filePath, payload, 'utf8');

        const now = this.clock();
        const createdAt = now.toISOString();
        const expiresAt = new Date(now.getTime() + this.ttlSeconds * 1000).toISOString();
        const downloadUrl = this.generateSignedUrl({ tenantId, fileName, expiresAt });

        await this.writeMetadata(tenantDir, jobId, {
            tenantId,
            jobId,
            format,
            filters: filters || {},
            actorId,
            createdAt,
            expiresAt,
            artifactPath: filePath
        });

        return {
            downloadUrl,
            artifactPath: filePath,
            createdAt,
            completedAt: createdAt,
            expiresAt
        };
    }

    async writeMetadata(dir, jobId, metadata) {
        const metadataPath = path.join(dir, `${jobId}.meta.json`);
        await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf8');
    }

    generateSignedUrl({ tenantId, fileName, expiresAt }) {
        const signature = crypto
            .createHash('sha256')
            .update(`${tenantId}/${fileName}/${expiresAt}`)
            .digest('hex')
            .slice(0, 32);
        return `${this.signedUrlBase}/${tenantId}/${fileName}?sig=${signature}&expires=${encodeURIComponent(expiresAt)}`;
    }
}

module.exports = {
    ArtifactStorage
};
