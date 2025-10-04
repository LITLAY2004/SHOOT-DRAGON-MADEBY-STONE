(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.AuditLogDataSource = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    class AuditLogDataSource {
        constructor(entries = [], options = {}) {
            this.entries = Array.isArray(entries) ? entries.slice() : [];
            this.filters = {
                tenantId: null,
                actorId: null,
                status: null,
                dateStart: null,
                dateEnd: null
            };
            this.pageSize = options.pageSize || 10;
            this.currentPage = 1;
        }

        setEntries(entries = []) {
            this.entries = Array.isArray(entries) ? entries.slice() : [];
        }

        setFilters(filters = {}) {
            this.filters = {
                ...this.filters,
                ...filters
            };
            this.currentPage = 1;
        }

        setPageSize(size) {
            const parsed = Number(size);
            if (!Number.isInteger(parsed) || parsed <= 0) {
                return;
            }
            this.pageSize = parsed;
            this.currentPage = 1;
        }

        getFilteredEntries() {
            return this.entries.filter((entry) => this.matchesFilters(entry));
        }

        matchesFilters(entry) {
            const { tenantId, actorId, status, dateStart, dateEnd } = this.filters;

            if (tenantId && entry.tenantId !== tenantId) {
                return false;
            }
            if (actorId && entry.actorId !== actorId) {
                return false;
            }
            if (status && entry.status !== status) {
                return false;
            }

            if (dateStart) {
                const entryDate = this.extractDate(entry);
                if (entryDate < new Date(dateStart)) {
                    return false;
                }
            }
            if (dateEnd) {
                const entryDate = this.extractDate(entry);
                if (entryDate > new Date(dateEnd)) {
                    return false;
                }
            }
            return true;
        }

        extractDate(entry) {
            const raw = entry.createdAt || entry.completedAt || entry.updatedAt;
            return raw ? new Date(raw) : new Date(0);
        }

        getPage(page = 1) {
            const filtered = this.getFilteredEntries();
            const total = filtered.length;
            const totalPages = Math.max(1, Math.ceil(total / this.pageSize));
            const currentPage = Math.min(Math.max(1, Number(page) || 1), totalPages);
            this.currentPage = currentPage;

            const start = (currentPage - 1) * this.pageSize;
            const end = start + this.pageSize;
            return {
                items: filtered.slice(start, end),
                total,
                page: currentPage,
                pageSize: this.pageSize,
                totalPages
            };
        }
    }

    return { AuditLogDataSource };
}));
