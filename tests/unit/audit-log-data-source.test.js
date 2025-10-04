const { AuditLogDataSource } = require('../../src/admin/AuditLogDataSource.js');

describe('AuditLogDataSource', () => {
    const entries = [
        { jobId: 'exp_1', tenantId: 'tenant-123', actorId: 'admin-1', status: 'delivered', createdAt: '2024-03-01T00:00:00Z' },
        { jobId: 'exp_2', tenantId: 'tenant-456', actorId: 'admin-2', status: 'queued', createdAt: '2024-03-02T00:00:00Z' },
        { jobId: 'exp_3', tenantId: 'tenant-123', actorId: 'admin-3', status: 'delivery_failed', createdAt: '2024-03-03T00:00:00Z' }
    ];

    it('filters by tenant and status', () => {
        const source = new AuditLogDataSource(entries);
        source.setFilters({ tenantId: 'tenant-123', status: 'delivered' });
        const page = source.getPage(1);
        expect(page.total).toBe(1);
        expect(page.items[0].jobId).toBe('exp_1');
    });

    it('honors date range filters', () => {
        const source = new AuditLogDataSource(entries);
        source.setFilters({ dateStart: '2024-03-02T00:00:00Z', dateEnd: '2024-03-03T00:00:00Z' });
        const page = source.getPage(1);
        expect(page.total).toBe(2);
        expect(page.items.map((e) => e.jobId)).toEqual(['exp_2', 'exp_3']);
    });

    it('paginates results according to page size', () => {
        const source = new AuditLogDataSource(entries, { pageSize: 2 });
        let page = source.getPage(1);
        expect(page.items).toHaveLength(2);
        page = source.getPage(2);
        expect(page.items).toHaveLength(1);
        expect(page.totalPages).toBe(2);
    });
});
