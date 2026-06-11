<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import {
    addWatchedSymbol,
    getBars,
    getCoverage,
    getHealth,
    getJobs,
    getWatchedSymbols,
    removeWatchedSymbol,
    refreshWatchedSymbols,
    type Bar,
    type CoverageSeries,
    type HealthResponse,
    type JobsSnapshot,
    type WatchedSymbol,
  } from '$lib/digi-quark/api';
  import ActionTableRow from '$lib/digi-quark/components/ActionTableRow.svelte';
  import PriceChart from '$lib/digi-quark/components/PriceChart.svelte';

  type StockRow = {
    symbol: string;
    watched?: WatchedSymbol;
    series?: CoverageSeries;
  };
  type ChartRange = '1d' | '5d' | '1m' | '3m' | 'ytd' | '1y';

  let coverage: CoverageSeries[] = [];
  let watchedSymbols: WatchedSymbol[] = [];
  let selected: CoverageSeries | null = null;
  let chartRange: ChartRange = '1m';
  let bars: Bar[] = [];
  let jobs: JobsSnapshot | null = null;
  let health: HealthResponse | null = null;
  let loading = true;
  let error = '';
  let notice = '';
  let toast: {
    kind: 'error' | 'warning' | 'success';
    message: string;
  } | null = null;
  let refreshingSymbols = false;
  let addingSymbol = false;
  let removingSymbol = '';
  let newSymbol = '';
  let revealedSymbol = '';
  let contextMenu: {
    symbol: string;
    x: number;
    y: number;
  } | null = null;
  let ws: WebSocket | null = null;
  let reconnectWebSocket = true;
  let refreshTimer: ReturnType<typeof setTimeout> | null = null;

  $: selectedLatestBar = bars.at(-1) ?? null;
  $: previousBar = bars.length > 1 ? bars[bars.length - 2] : null;
  $: selectedChange =
    selectedLatestBar && previousBar ? selectedLatestBar.close - previousBar.close : null;
  $: stockRows = makeStockRows(watchedSymbols, coverage, chartRange);
  onMount(() => {
    loadWatchlist();
    connectWebSocket();
  });

  onDestroy(() => {
    if (refreshTimer) {
      clearTimeout(refreshTimer);
    }
    reconnectWebSocket = false;
    ws?.close();
  });

  async function loadWatchlist() {
    loading = true;
    error = '';
    notice = '';
    toast = null;
    try {
      const [coverageResponse, watchedResponse, jobsResponse, healthResponse] = await Promise.all([
        getCoverage(),
        getWatchedSymbols(),
        getJobs(),
        getHealth(),
      ]);
      coverage = coverageResponse.series;
      watchedSymbols = watchedResponse.symbols;
      jobs = jobsResponse;
      health = healthResponse;
      selected =
        makeStockRows(watchedResponse.symbols, coverageResponse.series, chartRange).find(
          (row) => row.series,
        )?.series ?? null;
      if (selected) {
        bars = (await getBars(selected)).bars;
      } else {
        bars = [];
      }
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
    } finally {
      loading = false;
    }
  }

  async function refreshDashboardFromServer() {
    try {
      const [coverageResponse, watchedResponse, jobsResponse, healthResponse] = await Promise.all([
        getCoverage(),
        getWatchedSymbols(),
        getJobs(),
        getHealth(),
      ]);
      const selectedSymbol = selected?.symbol;
      coverage = coverageResponse.series;
      watchedSymbols = watchedResponse.symbols;
      jobs = jobsResponse;
      health = healthResponse;

      const next =
        (selectedSymbol
          ? bestCoverageSeries(selectedSymbol, coverageResponse.series, chartRange)
          : undefined) ??
        makeStockRows(watchedResponse.symbols, coverageResponse.series, chartRange).find(
          (row) => row.series,
        )?.series ??
        null;
      selected = next;
      bars = next ? (await getBars(next)).bars : [];
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
      showToast('error', error);
    }
  }

  function connectWebSocket() {
    if (typeof window === 'undefined') return;

    ws = new WebSocket(apiWebSocketURL());
    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as {
          type?: string;
          jobs?: JobsSnapshot;
        };
        if (message.jobs) {
          jobs = message.jobs;
        }
        if (message.type?.startsWith('ingest.job_')) {
          scheduleServerRefresh();
        }
      } catch (err) {
        console.warn('websocket message parse failed', err);
      }
    };
    ws.onclose = () => {
      ws = null;
      if (reconnectWebSocket) {
        setTimeout(connectWebSocket, 3000);
      }
    };
  }

  function scheduleServerRefresh() {
    if (refreshTimer) {
      clearTimeout(refreshTimer);
    }
    refreshTimer = setTimeout(() => {
      refreshTimer = null;
      refreshDashboardFromServer();
    }, 500);
  }

  function apiWebSocketURL() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.hostname}:4012/ws`;
  }

  async function selectSeries(series: CoverageSeries) {
    selected = series;
    error = '';
    try {
      bars = (await getBars(series)).bars;
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
    }
  }

  async function selectSymbol(symbol: string) {
    const series = bestCoverageSeries(symbol, coverage, chartRange);
    if (series) {
      await selectSeries(series);
    }
  }

  async function handleChartRangeChange(range: ChartRange) {
    chartRange = range;
    if (!selected) return;

    const next = bestCoverageSeries(selected.symbol, coverage, range);
    if (!next || sameSeries(selected, next)) return;
    await selectSeries(next);
  }

  async function refreshSymbols() {
    refreshingSymbols = true;
    error = '';
    try {
      const response = await refreshWatchedSymbols();
      jobs = response.jobs;
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
      showToast('error', error);
    } finally {
      refreshingSymbols = false;
    }
  }

  async function submitWatchedSymbol() {
    const symbol = normalizeSymbolInput(newSymbol);
    if (!symbol) {
      error = 'symbol is required';
      showToast('error', error);
      return;
    }
    if (!/^[A-Z][A-Z0-9.-]{0,9}$/.test(symbol)) {
      error = 'symbol must be 1-10 letters, numbers, dots, or dashes';
      showToast('error', error);
      return;
    }

    addingSymbol = true;
    error = '';
    notice = '';
    try {
      const response = await addWatchedSymbol(symbol);
      jobs = response.jobs;
      newSymbol = '';
      const [watchedResponse, coverageResponse] = await Promise.all([
        getWatchedSymbols(),
        getCoverage(),
      ]);
      watchedSymbols = watchedResponse.symbols;
      coverage = coverageResponse.series;
      if (!coverageResponse.series.some((item) => item.symbol.toUpperCase() === symbol)) {
        notice = `Ticker added, but no historical bars were stored for ${symbol}.`;
        showToast('warning', notice);
      } else {
        showToast('success', `${symbol} added.`);
      }
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
      showToast('error', error);
    } finally {
      addingSymbol = false;
    }
  }

  async function archiveSymbol(symbol: string) {
    removingSymbol = symbol;
    error = '';
    notice = '';
    contextMenu = null;
    try {
      await removeWatchedSymbol(symbol);
      watchedSymbols = watchedSymbols.filter(
        (item) => item.symbol.toUpperCase() !== symbol.toUpperCase(),
      );
      revealedSymbol = '';
      showToast('success', `${symbol} removed from watchlist.`);
      if (selected?.symbol.toUpperCase() === symbol.toUpperCase()) {
        const next =
          makeStockRows(watchedSymbols, coverage, chartRange).find((row) => row.series)?.series ??
          null;
        selected = next;
        bars = next ? (await getBars(next)).bars : [];
      }
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
      showToast('error', error);
    } finally {
      removingSymbol = '';
    }
  }

  function openSymbolMenu(detail: { key: string; x: number; y: number }) {
    contextMenu = {
      symbol: detail.key,
      x: detail.x,
      y: detail.y,
    };
  }

  function archiveContextSymbol() {
    if (!contextMenu) return;
    void archiveSymbol(contextMenu.symbol);
  }

  function formatDate(value?: string) {
    if (!value) return '—';
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  }

  function formatNumber(value: number) {
    return new Intl.NumberFormat(undefined, {
      maximumFractionDigits: 2,
    }).format(value);
  }

  function formatCurrency(value: number, currency = 'USD') {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  }

  function normalizeSymbolInput(value: string) {
    return value.trim().toUpperCase();
  }

  function showToast(kind: 'error' | 'warning' | 'success', message: string) {
    toast = { kind, message };
  }

  function makeStockRows(watched: WatchedSymbol[], series: CoverageSeries[], range: ChartRange) {
    const rows: StockRow[] = [];
    for (const item of watched) {
      if (item.archived_at || !item.watch_enabled) continue;
      const symbol = item.symbol.toUpperCase();
      rows.push({
        symbol,
        watched: item,
        series: bestCoverageSeries(symbol, series, range),
      });
    }
    return rows.sort((a, b) => a.symbol.localeCompare(b.symbol));
  }

  function bestCoverageSeries(symbol: string, series: CoverageSeries[], range: ChartRange) {
    const candidates = series.filter((item) => item.symbol.toUpperCase() === symbol.toUpperCase());
    if (candidates.length === 0) return undefined;

    for (const barSize of preferredBarSizes(range)) {
      const match = candidates.find(
        (item) => item.bar_size === barSize && item.what_to_show.toUpperCase() === 'TRADES',
      );
      if (match) return match;
    }

    return candidates[0];
  }

  function preferredBarSizes(range: ChartRange) {
    switch (range) {
      case '1d':
      case '5d':
        return ['5 mins', '1 hour', '1 day'];
      case '1m':
      case '3m':
        return ['1 hour', '5 mins', '1 day'];
      case 'ytd':
      case '1y':
        return ['1 day', '1 hour', '5 mins'];
    }
  }

  function sameSeries(a: CoverageSeries, b: CoverageSeries) {
    return a.symbol === b.symbol && a.bar_size === b.bar_size && a.what_to_show === b.what_to_show;
  }
</script>

<svelte:window
  on:click={() => (contextMenu = null)}
  on:keydown={(event) => event.key === 'Escape' && (contextMenu = null)}
/>

<main class="flex min-w-0 flex-col gap-6">
  <header class="navbar min-h-0 rounded bg-base-100 px-4 shadow-sm">
    <div class="flex-1">
      <div>
        <h1 class="text-xl font-semibold leading-tight">Watchlist</h1>
        <p class="text-sm text-base-content/60">Tracked symbols and historical price charts</p>
      </div>
    </div>
    <div class="flex gap-2">
      <button class="btn btn-sm btn-ghost" on:click={loadWatchlist} disabled={loading}
        >Refresh</button
      >
    </div>
  </header>

  <section class="grid gap-4 md:grid-cols-4">
    <div class="stat rounded bg-base-100 shadow-sm">
      <div class="stat-title">API / DB</div>
      <div class="stat-value text-lg capitalize">
        {health?.status ?? 'unknown'}
      </div>
      <div class="stat-desc">
        {health?.db === 'ok' ? 'Postgres reachable' : (health?.db ?? 'not checked')}
      </div>
    </div>
    <div class="stat rounded bg-base-100 shadow-sm">
      <div class="stat-title">Ingest Queue</div>
      <div class="stat-value text-2xl">{jobs?.queue_depth ?? 0}</div>
      <div class="stat-desc">{jobs?.current ? 'running' : 'idle'}</div>
    </div>
    <div class="stat rounded bg-base-100 shadow-sm">
      <div class="stat-title">Selected Close</div>
      <div class="stat-value text-2xl">
        {selectedLatestBar ? formatNumber(selectedLatestBar.close) : '—'}
      </div>
      <div class="stat-desc">
        {selectedChange === null
          ? 'no comparison'
          : `${selectedChange >= 0 ? '+' : ''}${formatNumber(selectedChange)} vs prior bar`}
      </div>
    </div>
    <div class="stat rounded bg-base-100 shadow-sm">
      <div class="stat-title">Data Series</div>
      <div class="stat-value text-2xl">{coverage.length}</div>
      <div class="stat-desc">{stockRows.length} watched symbols</div>
    </div>
  </section>

  <section class="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
    <div class="rounded bg-base-100 shadow-sm">
      <div class="flex items-center justify-between border-b border-base-300 px-4 py-3">
        <h2 class="font-semibold">Watchlist</h2>
        <form class="flex items-center gap-2" on:submit|preventDefault={submitWatchedSymbol}>
          <input
            class="input input-bordered input-xs w-24 uppercase"
            placeholder="Symbol"
            autocomplete="off"
            bind:value={newSymbol}
            on:input={() => (newSymbol = normalizeSymbolInput(newSymbol))}
          />
          <button class="btn btn-outline btn-xs" type="submit" disabled={addingSymbol}>
            {addingSymbol ? 'Adding' : 'Add'}
          </button>
          <span class="badge badge-neutral">{stockRows.length} symbols</span>
          <button
            class="btn btn-primary btn-xs"
            type="button"
            on:click={refreshSymbols}
            disabled={refreshingSymbols}
          >
            {refreshingSymbols ? 'Refreshing' : 'Refresh'}
          </button>
        </form>
      </div>
      <div class="overflow-x-auto">
        <table class="table table-sm">
          <thead>
            <tr>
              <th>Symbol</th>
              <th>Bar Size</th>
              <th>Type</th>
              <th class="text-right">Rows</th>
              <th>Range</th>
              <th class="w-24 text-right"></th>
            </tr>
          </thead>
          <tbody>
            {#each stockRows as item}
              <ActionTableRow
                rowKey={item.symbol}
                selectable={!!item.series}
                selected={selected === item.series}
                revealed={revealedSymbol === item.symbol}
                busy={removingSymbol === item.symbol}
                on:select={() => selectSymbol(item.symbol)}
                on:reveal={(event) => (revealedSymbol = event.detail.key)}
                on:hide={() => (revealedSymbol = '')}
                on:action={() => archiveSymbol(item.symbol)}
                on:menu={(event) => openSymbolMenu(event.detail)}
              >
                <td class="font-medium">{item.symbol}</td>
                <td>{item.series?.bar_size ?? '—'}</td>
                <td>{item.series?.what_to_show ?? '—'}</td>
                <td class="text-right">{formatNumber(item.series?.rows ?? 0)}</td>
                <td>
                  {#if item.series}
                    {formatDate(item.series.earliest_bar_time)} - {formatDate(
                      item.series.latest_bar_time,
                    )}
                  {:else}
                    <span class="badge badge-warning badge-outline">No history</span>
                  {/if}
                </td>
              </ActionTableRow>
            {/each}
            {#if !loading && stockRows.length === 0}
              <tr>
                <td colspan="6" class="py-8 text-center text-base-content/60"
                  >No watched symbols found.</td
                >
              </tr>
            {/if}
          </tbody>
        </table>
      </div>
    </div>

    {#if contextMenu}
      <div
        class="menu fixed z-50 w-44 rounded bg-base-100 p-1 shadow-lg ring-1 ring-base-300"
        role="menu"
        style={`left: ${contextMenu.x}px; top: ${contextMenu.y}px;`}
        tabindex="-1"
        on:click|stopPropagation
        on:keydown|stopPropagation
      >
        <button
          class="btn btn-ghost btn-sm justify-start text-error"
          role="menuitem"
          type="button"
          disabled={removingSymbol === contextMenu.symbol}
          on:click={archiveContextSymbol}
        >
          {removingSymbol === contextMenu.symbol ? 'Removing' : 'Remove'}
        </button>
      </div>
    {/if}

    <div class="rounded bg-base-100 p-4 shadow-sm">
      <div class="mb-3 flex items-center justify-between">
        <div>
          <h2 class="font-semibold">Price Chart</h2>
          <p class="text-sm text-base-content/60">
            {selected
              ? `${selected.symbol} ${selected.bar_size} ${selected.what_to_show}`
              : 'Select a series'}
          </p>
        </div>
        <span class="badge">{bars.length} bars</span>
      </div>

      <div class="rounded border border-base-300 bg-base-200 p-2">
        {#if bars.length > 0}
          <PriceChart
            {bars}
            bind:selectedRange={chartRange}
            on:rangeChange={(event) => handleChartRangeChange(event.detail.range)}
          />
        {:else}
          <div class="flex h-56 items-center justify-center text-sm text-base-content/60">
            No bars selected.
          </div>
        {/if}
      </div>
    </div>
  </section>
</main>

{#if toast}
  <div class="toast toast-end toast-top z-50">
    <div
      class={`alert shadow-lg ${
        toast.kind === 'error'
          ? 'alert-error'
          : toast.kind === 'warning'
            ? 'alert-warning'
            : 'alert-success'
      }`}
    >
      <span>{toast.message}</span>
      <button class="btn btn-ghost btn-xs" type="button" on:click={() => (toast = null)}
        >Close</button
      >
    </div>
  </div>
{/if}
