export type CoverageSeries = {
  symbol: string;
  bar_size: string;
  what_to_show: string;
  rows: number;
  earliest_bar_time: string;
  latest_bar_time: string;
  trading_days: number;
};

export type CoverageResponse = {
  count: number;
  series: CoverageSeries[];
};

export type Bar = {
  symbol: string;
  bar_time: string;
  bar_size: string;
  what_to_show: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  wap: number;
  count: number;
};

export type BarsResponse = {
  count: number;
  bars: Bar[];
};

export type PortfolioEntry = {
  id?: number;
  account?: string;
  entry_date: string;
  kind: string;
  symbol?: string;
  quantity: number;
  price: number;
  currency: string;
  description?: string;
  source?: string;
  external_id?: string;
  created_at?: string;
};

export type PortfolioEntriesResponse = {
  count: number;
  entries: PortfolioEntry[];
};

export type AccountValuation = {
  account: string;
  observed_at: string;
  currency: string;
  net_liquidation?: number;
  total_cash?: number;
  settled_cash?: number;
  buying_power?: number;
  maintenance_margin?: number;
  gross_position_value?: number;
  source: string;
};

export type PositionValuation = {
  account: string;
  observed_at: string;
  symbol: string;
  asset_type: string;
  exchange?: string;
  currency: string;
  quantity: number;
  avg_cost?: number;
  market_price?: number;
  market_value?: number;
  cost_basis?: number;
  unrealized_pl?: number;
  source: string;
  con_id?: number;
};

export type PortfolioContribution = {
  currency: string;
  net_contributions: number;
};

export type PortfolioReportResponse = {
  account: string;
  account_valuations: AccountValuation[];
  positions: PositionValuation[];
  contributions: PortfolioContribution[];
};

export type WatchedSymbol = {
  symbol: string;
  asset_type: string;
  source: string;
  watch_enabled: boolean;
  ingest_enabled: boolean;
  first_seen_at: string;
  last_seen_held_at?: string;
  archived_at?: string;
  created_at: string;
  updated_at: string;
};

export type WatchedSymbolsResponse = {
  count: number;
  symbols: WatchedSymbol[];
};

export type JobsSnapshot = {
  queue_depth: number;
  pending: unknown[];
  current: unknown | null;
  last_done: unknown | null;
};

export type HealthResponse = {
  status: string;
  db: string;
  queue: JobsSnapshot;
};

export type BackfillResponse = {
  queued: unknown[];
  skipped: unknown[];
  jobs: JobsSnapshot;
};

const apiPrefix = '/digi-quark/api';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiPrefix}${path}`, {
    headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
    ...init,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed with ${response.status}`);
  }

  return (await response.json()) as T;
}

export function getCoverage() {
  return request<CoverageResponse>('/coverage');
}

export function getBars(series: CoverageSeries, limit = 5000) {
  const params = new URLSearchParams({
    symbol: series.symbol,
    bar_size: series.bar_size,
    what_to_show: series.what_to_show,
    limit: String(limit),
  });
  return request<BarsResponse>(`/bars?${params}`);
}

export function getPortfolioEntries() {
  return request<PortfolioEntriesResponse>('/portfolio/entries?limit=50');
}

export function getPortfolioReport() {
  return request<PortfolioReportResponse>('/portfolio/report');
}

export function getWatchedSymbols() {
  return request<WatchedSymbolsResponse>('/watched-symbols');
}

export function addWatchedSymbol(symbol: string) {
  return request<{ symbol: string; jobs: JobsSnapshot }>('/watched-symbols', {
    method: 'POST',
    body: JSON.stringify({ symbol, asset_type: 'STK', source: 'manual' }),
  });
}

export function removeWatchedSymbol(symbol: string) {
  const params = new URLSearchParams({ symbol });
  return request<{ symbol: string; archived: boolean; note: string }>(
    `/watched-symbols?${params}`,
    {
      method: 'DELETE',
    },
  );
}

export function createPortfolioEntry(entry: PortfolioEntry) {
  return request<PortfolioEntry>('/portfolio/entries', {
    method: 'POST',
    body: JSON.stringify(entry),
  });
}

export function deletePortfolioEntry(id: number) {
  const params = new URLSearchParams({ id: String(id) });
  return request<{ id: number; deleted: boolean }>(`/portfolio/entries?${params}`, {
    method: 'DELETE',
  });
}

export function getJobs() {
  return request<JobsSnapshot>('/ingest/jobs');
}

export function getHealth() {
  return request<HealthResponse>('/health');
}

export function refreshWatchedSymbols() {
  return request<BackfillResponse>('/ingest/backfill', {
    method: 'POST',
    body: JSON.stringify({}),
  });
}
