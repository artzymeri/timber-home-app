import type { Request } from 'express';
import { Op, Order, WhereOptions } from 'sequelize';

export interface ParseListQueryOptions {
  sortable: string[];
  filterable: string[];
  defaultSort?: string;
  defaultOrder?: 'ASC' | 'DESC';
  defaultLimit?: number;
  maxLimit?: number;
}

export interface ParsedListQuery<TWhere extends WhereOptions = WhereOptions> {
  page: number;
  limit: number;
  offset: number;
  order: Order;
  where: TWhere;
  q: string;
  /** True when the request used `?page=` or `?limit=` — return the envelope. */
  paginated: boolean;
}

const toInt = (raw: unknown, fallback: number): number => {
  if (typeof raw !== 'string' && typeof raw !== 'number') return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
};

export function parseListQuery(req: Request, opts: ParseListQueryOptions): ParsedListQuery {
  const {
    sortable,
    filterable,
    defaultSort,
    defaultOrder = 'DESC',
    defaultLimit = 25,
    maxLimit = 100,
  } = opts;

  const hasPage = req.query.page !== undefined;
  const hasLimit = req.query.limit !== undefined;
  const paginated = hasPage || hasLimit;

  const page = toInt(req.query.page, 1);
  const limit = Math.min(maxLimit, toInt(req.query.limit, defaultLimit));
  const offset = (page - 1) * limit;

  let order: Order = [];
  const sortRaw = typeof req.query.sort === 'string' ? req.query.sort : undefined;
  const orderRaw = typeof req.query.order === 'string' ? req.query.order.toUpperCase() : undefined;
  const dir = orderRaw === 'ASC' || orderRaw === 'DESC' ? orderRaw : defaultOrder;

  if (sortRaw && sortable.includes(sortRaw)) {
    order = [[sortRaw, dir]];
  } else if (defaultSort && sortable.includes(defaultSort)) {
    order = [[defaultSort, dir]];
  }

  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';

  const where: WhereOptions = {};
  const filterParam = req.query.filter;
  if (filterParam && typeof filterParam === 'object' && !Array.isArray(filterParam)) {
    for (const key of Object.keys(filterParam)) {
      if (!filterable.includes(key)) continue;
      const raw = (filterParam as Record<string, unknown>)[key];
      if (typeof raw !== 'string') continue;
      const trimmed = raw.trim();
      if (!trimmed) continue;
      // Comma-separated → IN clause; single value → equality.
      if (trimmed.includes(',')) {
        const parts = trimmed.split(',').map((p) => p.trim()).filter(Boolean);
        (where as Record<string, unknown>)[key] = { [Op.in]: parts };
      } else if (trimmed === 'true' || trimmed === 'false') {
        (where as Record<string, unknown>)[key] = trimmed === 'true';
      } else {
        (where as Record<string, unknown>)[key] = trimmed;
      }
    }
  }

  return { page, limit, offset, order, where, q, paginated };
}

export function envelope<T>(rows: T[], total: number, page: number, limit: number) {
  return { rows, total, page, limit };
}
