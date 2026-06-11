<script lang="ts">
  import { onMount } from 'svelte';
  import {
    createPortfolioEntry,
    deletePortfolioEntry,
    getPortfolioEntries,
    getPortfolioReport,
    type AccountValuation,
    type PortfolioEntry,
    type PortfolioReportResponse,
    type PositionValuation,
  } from '$lib/digi-quark/api';
  import ActionTableRow from '$lib/digi-quark/components/ActionTableRow.svelte';
  import Modal from '$lib/digi-quark/components/Modal.svelte';

  type PortfolioPoint = {
    date: string;
    value: number;
  };

  type PositionRow = {
    symbol: string;
    type: string;
    portfolioPct: number | null;
    value: number | null;
    unrealizedPl: number | null;
    currency: string;
  };

  let report: PortfolioReportResponse | null = null;
  let entries: PortfolioEntry[] = [];
  let loading = true;
  let error = '';
  let saving = false;
  let entryModalOpen = false;
  let deletingEntryId: number | null = null;
  let revealedEntry = '';
  let entryDeleteTarget: PortfolioEntry | null = null;
  let toast: {
    kind: 'error' | 'success';
    message: string;
  } | null = null;

  let form = {
    kind: 'deposit',
    quantity: 0,
    entry_date: new Date().toISOString().slice(0, 10),
    currency: 'USD',
    description: '',
  };

  $: latestAccount = report?.account_valuations[0] ?? null;
  $: totalPortfolio = latestAccount?.net_liquidation ?? null;
  $: totalContributions =
    report?.contributions.reduce((sum, item) => sum + item.net_contributions, 0) ?? 0;
  $: maintenanceMargin = latestAccount?.maintenance_margin ?? null;
  $: totalProfit = totalPortfolio === null ? null : totalPortfolio - totalContributions;
  $: totalReturn =
    totalProfit === null || totalContributions === 0
      ? null
      : (totalProfit / Math.abs(totalContributions)) * 100;
  $: returnOnCapitalAllocated =
    totalProfit === null || allocatedCapital === 0 ? null : (totalProfit / allocatedCapital) * 100;
  $: portfolioPoints = makePortfolioPoints(report?.account_valuations ?? []);
  $: positionRows = makePositionRows(report, latestAccount);
  $: allocatedCapital = positionRows
    .filter((row) => row.type.toLowerCase() !== 'cash')
    .reduce((sum, row) => sum + Math.abs(row.value ?? 0), 0);

  onMount(() => {
    loadPortfolio();
  });

  async function loadPortfolio() {
    loading = true;
    error = '';

    try {
      const [reportResponse, entriesResponse] = await Promise.all([
        getPortfolioReport(),
        getPortfolioEntries(),
      ]);
      report = reportResponse;
      entries = entriesResponse.entries;
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
    } finally {
      loading = false;
    }
  }

  async function submitEntry() {
    saving = true;
    error = '';

    try {
      await createPortfolioEntry({
        entry_date: form.entry_date,
        kind: form.kind,
        quantity: Number(form.quantity),
        price: 1,
        currency: form.currency,
        description: form.description,
      });
      form.quantity = 0;
      form.description = '';
      entryModalOpen = false;
      await loadPortfolio();
      showToast('success', 'Portfolio entry saved.');
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
      showToast('error', error);
    } finally {
      saving = false;
    }
  }

  async function deleteEntry(entry: PortfolioEntry) {
    if (!entry.id) return;

    deletingEntryId = entry.id;
    error = '';

    try {
      await deletePortfolioEntry(entry.id);
      entryDeleteTarget = null;
      revealedEntry = '';
      await loadPortfolio();
      showToast('success', 'Portfolio entry deleted.');
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
      showToast('error', error);
    } finally {
      deletingEntryId = null;
    }
  }

  function makePortfolioPoints(values: AccountValuation[]) {
    return values
      .filter((item) => typeof item.net_liquidation === 'number')
      .map((item) => ({
        date: item.observed_at,
        value: item.net_liquidation ?? 0,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-30);
  }

  function makePositionRows(
    currentReport: PortfolioReportResponse | null,
    account: AccountValuation | null,
  ) {
    const rows: PositionRow[] =
      currentReport?.positions.map((position) => {
        const value = positionValue(position);
        return {
          symbol: position.symbol,
          type: assetTypeLabel(position.asset_type),
          portfolioPct: portfolioPct(value),
          value,
          unrealizedPl: position.unrealized_pl ?? null,
          currency: position.currency,
        };
      }) ?? [];

    const cash = account?.total_cash ?? account?.settled_cash ?? null;
    if (cash !== null) {
      rows.unshift({
        symbol: primaryCurrency(currentReport, account),
        type: 'Cash',
        portfolioPct: portfolioPct(cash),
        value: cash,
        unrealizedPl: 0,
        currency: primaryCurrency(currentReport, account),
      });
    }

    if (rows.length > 0 || totalPortfolio !== null) {
      const totalRowValue = rows.reduce((sum, row) => sum + (row.value ?? 0), 0);
      rows.push({
        symbol: 'Total',
        type: '',
        portfolioPct: totalRowValue === 0 ? null : 100,
        value: totalPortfolio ?? totalRowValue,
        unrealizedPl: rows.reduce((sum, row) => sum + (row.unrealizedPl ?? 0), 0),
        currency: account?.currency ?? 'USD',
      });
    }

    return rows;
  }

  function primaryCurrency(
    currentReport: PortfolioReportResponse | null,
    account: AccountValuation | null,
  ) {
    return account?.currency ?? currentReport?.contributions[0]?.currency ?? 'USD';
  }

  function positionValue(position: PositionValuation) {
    return (
      position.market_value ?? position.cost_basis ?? position.quantity * (position.avg_cost ?? 0)
    );
  }

  function portfolioPct(value: number | null) {
    if (value === null || !totalPortfolio) return null;
    return (value / totalPortfolio) * 100;
  }

  function assetTypeLabel(value: string) {
    switch (value.toUpperCase()) {
      case 'STK':
        return 'Stock';
      case 'CASH':
        return 'Cash';
      case 'OPT':
        return 'Option';
      default:
        return value || '--';
    }
  }

  function formatCurrency(value: number | null, currency = 'USD') {
    if (value === null) return '--';
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  }

  function formatNumber(value: number) {
    return new Intl.NumberFormat(undefined, {
      maximumFractionDigits: 2,
    }).format(value);
  }

  function formatPercent(value: number | null, showSign = false) {
    if (value === null) return '--';
    return `${showSign && value >= 0 ? '+' : ''}${new Intl.NumberFormat(undefined, {
      maximumFractionDigits: 2,
    }).format(value)}%`;
  }

  function chartPath(points: PortfolioPoint[]) {
    if (points.length === 0) return '';
    if (points.length === 1) return 'M 8 82 L 392 82';

    const values = points.map((point) => point.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const spread = max - min || 1;

    return points
      .map((point, index) => {
        const x = 8 + (index / (points.length - 1)) * 384;
        const y = 154 - ((point.value - min) / spread) * 128;
        return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
      })
      .join(' ');
  }

  function chartAreaPath(points: PortfolioPoint[]) {
    const path = chartPath(points);
    if (!path) return '';
    return `${path} L 392 170 L 8 170 Z`;
  }

  function formatShortDate(value?: string) {
    if (!value) return '--';
    return new Intl.DateTimeFormat(undefined, { month: 'numeric', day: 'numeric' }).format(
      new Date(value),
    );
  }

  function showToast(kind: 'error' | 'success', message: string) {
    toast = { kind, message };
  }
</script>

<main class="flex min-w-0 flex-col gap-6">
  <header class="navbar min-h-0 rounded bg-base-100 px-4 shadow-sm">
    <div class="flex-1">
      <div>
        <h1 class="text-xl font-semibold leading-tight">Portfolio</h1>
        <p class="text-sm text-base-content/60">Financial report and current allocation</p>
      </div>
    </div>
    <button class="btn btn-sm btn-ghost" type="button" on:click={loadPortfolio} disabled={loading}>
      Refresh
    </button>
  </header>

  {#if error}
    <div class="alert alert-error shadow-sm">
      <span>{error}</span>
    </div>
  {/if}

  <section class="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(22rem,0.72fr)]">
    <div class="rounded bg-base-100 p-4 shadow-sm">
      <div class="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 class="text-sm font-semibold uppercase tracking-wide text-base-content/65">
            Portfolio Value (Last 30 Days)
          </h2>
          <p class="mt-1 text-2xl font-semibold">{formatCurrency(totalPortfolio)}</p>
        </div>
        <span class="badge badge-outline">{portfolioPoints.length} points</span>
      </div>

      <div class="h-72 rounded border border-base-300 bg-base-200 p-3">
        {#if portfolioPoints.length > 0}
          <svg class="h-full w-full overflow-visible" viewBox="0 0 400 190" role="img">
            <title>Portfolio value over the last 30 days</title>
            <path d={chartAreaPath(portfolioPoints)} fill="oklch(var(--p) / 0.12)" />
            <path
              d={chartPath(portfolioPoints)}
              fill="none"
              stroke="oklch(var(--p))"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="3"
            />
            <line x1="8" y1="170" x2="392" y2="170" stroke="oklch(var(--bc) / 0.18)" />
            <text x="8" y="188" class="fill-current text-[11px] text-base-content/55">
              {formatShortDate(portfolioPoints[0]?.date)}
            </text>
            <text
              x="392"
              y="188"
              text-anchor="end"
              class="fill-current text-[11px] text-base-content/55"
            >
              {formatShortDate(portfolioPoints.at(-1)?.date)}
            </text>
          </svg>
        {:else}
          <div class="flex h-full items-center justify-center text-sm text-base-content/60">
            No portfolio value history yet.
          </div>
        {/if}
      </div>
    </div>

    <div class="rounded bg-base-100 shadow-sm">
      <div class="border-b border-base-300 px-4 py-3">
        <h2 class="text-sm font-semibold uppercase tracking-wide text-base-content/65">
          Portfolio Details
        </h2>
      </div>
      <div class="overflow-x-auto">
        <table class="table table-sm">
          <tbody>
            <tr>
              <td>Total Portfolio</td>
              <td class="text-right font-semibold">{formatCurrency(totalPortfolio)}</td>
            </tr>
            <tr>
              <td>Total Contributions</td>
              <td class="text-right font-semibold">{formatCurrency(totalContributions)}</td>
            </tr>
            <tr>
              <td>Maintenance Margin</td>
              <td class="text-right font-semibold">{formatCurrency(maintenanceMargin)}</td>
            </tr>
            <tr>
              <td>Total Profit</td>
              <td
                class={`text-right font-semibold ${totalProfit !== null && totalProfit >= 0 ? 'text-success' : 'text-error'}`}
              >
                {formatCurrency(totalProfit)}
              </td>
            </tr>
            <tr>
              <td>Total Return</td>
              <td
                class={`text-right font-semibold ${totalReturn !== null && totalReturn >= 0 ? 'text-success' : 'text-error'}`}
              >
                {formatPercent(totalReturn)}
              </td>
            </tr>
            <tr>
              <td>Return on Capital Allocated</td>
              <td
                class={`text-right font-semibold ${returnOnCapitalAllocated !== null && returnOnCapitalAllocated >= 0 ? 'text-success' : 'text-error'}`}
              >
                {formatPercent(returnOnCapitalAllocated)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>

  <section class="rounded bg-base-100 shadow-sm">
    <div class="border-b border-base-300 px-4 py-3">
      <h2 class="text-sm font-semibold uppercase tracking-wide text-base-content/65">
        Current Positions
      </h2>
    </div>
    <div class="overflow-x-auto">
      <table class="table table-sm">
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Type</th>
            <th class="text-right">Portfolio %</th>
            <th class="text-right">Value</th>
            <th class="text-right">Unrealized P/L</th>
          </tr>
        </thead>
        <tbody>
          {#each positionRows as row}
            <tr class={row.symbol === 'Total' ? 'font-semibold' : ''}>
              <td>{row.symbol}</td>
              <td>
                {#if row.type}
                  <span class="badge badge-outline">{row.type}</span>
                {/if}
              </td>
              <td class="text-right">{formatPercent(row.portfolioPct)}</td>
              <td class="text-right">{formatCurrency(row.value, row.currency)}</td>
              <td
                class={`text-right ${row.unrealizedPl !== null && row.unrealizedPl < 0 ? 'text-error' : 'text-success'}`}
              >
                {formatCurrency(row.unrealizedPl, row.currency)}
              </td>
            </tr>
          {/each}
          {#if !loading && positionRows.length <= 1}
            <tr>
              <td colspan="5" class="py-8 text-center text-base-content/60">
                No current positions yet.
              </td>
            </tr>
          {/if}
        </tbody>
      </table>
    </div>
  </section>

  <section>
    <div class="rounded bg-base-100 shadow-sm">
      <div class="flex items-center justify-between border-b border-base-300 px-4 py-3">
        <h2 class="font-semibold">Cash Flows</h2>
        <div class="flex items-center gap-2">
          <span class="badge badge-neutral">{entries.length}</span>
          <button
            class="btn btn-primary btn-xs"
            type="button"
            on:click={() => (entryModalOpen = true)}
          >
            Add
          </button>
        </div>
      </div>
      <div class="overflow-x-auto">
        <table class="table table-sm">
          <thead>
            <tr>
              <th>Date</th>
              <th>Kind</th>
              <th class="text-right">Amount</th>
              <th>Currency</th>
              <th>Description</th>
              <th class="w-24 text-right"></th>
            </tr>
          </thead>
          <tbody>
            {#each entries as entry}
              <ActionTableRow
                rowKey={String(entry.id ?? `${entry.entry_date}-${entry.kind}-${entry.quantity}`)}
                revealed={revealedEntry === String(entry.id)}
                busy={deletingEntryId === entry.id}
                busyLabel="Deleting"
                confirmAction
                on:reveal={(event) => (revealedEntry = event.detail.key)}
                on:hide={() => (revealedEntry = '')}
                on:confirm={() => (entryDeleteTarget = entry)}
              >
                <td>{entry.entry_date}</td>
                <td><span class="badge badge-outline">{entry.kind}</span></td>
                <td class="text-right">{formatNumber(entry.quantity)}</td>
                <td>{entry.currency}</td>
                <td>{entry.description ?? '--'}</td>
              </ActionTableRow>
            {/each}
            {#if !loading && entries.length === 0}
              <tr>
                <td colspan="6" class="py-8 text-center text-base-content/60">
                  No cash flows yet.
                </td>
              </tr>
            {/if}
          </tbody>
        </table>
      </div>
    </div>
  </section>
</main>

<Modal open={entryModalOpen} title="Add Cash Flow" on:close={() => (entryModalOpen = false)}>
  <form id="portfolio-entry-form" on:submit|preventDefault={submitEntry}>
    <div class="grid gap-3 sm:grid-cols-2">
      <label class="form-control">
        <span class="label-text">Kind</span>
        <select class="select select-bordered select-sm" bind:value={form.kind}>
          <option value="deposit">Deposit</option>
          <option value="withdrawal">Withdrawal</option>
        </select>
      </label>
      <label class="form-control">
        <span class="label-text">Date</span>
        <input class="input input-bordered input-sm" type="date" bind:value={form.entry_date} />
      </label>
      <label class="form-control">
        <span class="label-text">Amount</span>
        <input
          class="input input-bordered input-sm"
          type="number"
          step="0.01"
          bind:value={form.quantity}
        />
      </label>
      <label class="form-control">
        <span class="label-text">Currency</span>
        <input class="input input-bordered input-sm" bind:value={form.currency} />
      </label>
      <label class="form-control sm:col-span-2">
        <span class="label-text">Description</span>
        <input class="input input-bordered input-sm" bind:value={form.description} />
      </label>
    </div>
  </form>

  <svelte:fragment slot="actions">
    <button class="btn btn-ghost btn-sm" type="button" on:click={() => (entryModalOpen = false)}>
      Cancel
    </button>
    <button
      class="btn btn-primary btn-sm"
      type="submit"
      form="portfolio-entry-form"
      disabled={saving || form.quantity === 0}
    >
      {saving ? 'Saving' : 'Save Entry'}
    </button>
  </svelte:fragment>
</Modal>

<Modal
  open={!!entryDeleteTarget}
  title="Delete Cash Flow"
  size="max-w-md"
  on:close={() => (entryDeleteTarget = null)}
>
  {#if entryDeleteTarget}
    <div class="space-y-3 text-sm">
      <p>This will permanently delete this cash flow.</p>
      <div class="rounded border border-base-300 bg-base-200 p-3">
        <div class="flex justify-between gap-4">
          <span class="text-base-content/60">Date</span>
          <span>{entryDeleteTarget.entry_date}</span>
        </div>
        <div class="flex justify-between gap-4">
          <span class="text-base-content/60">Kind</span>
          <span class="capitalize">{entryDeleteTarget.kind}</span>
        </div>
        <div class="flex justify-between gap-4">
          <span class="text-base-content/60">Amount</span>
          <span>
            {formatNumber(entryDeleteTarget.quantity)}
            {entryDeleteTarget.currency}
          </span>
        </div>
        {#if entryDeleteTarget.description}
          <div class="mt-2 text-base-content/70">
            {entryDeleteTarget.description}
          </div>
        {/if}
      </div>
    </div>
  {/if}

  <svelte:fragment slot="actions">
    <button class="btn btn-ghost btn-sm" type="button" on:click={() => (entryDeleteTarget = null)}>
      Cancel
    </button>
    <button
      class="btn btn-error btn-sm"
      type="button"
      disabled={!entryDeleteTarget || deletingEntryId === entryDeleteTarget.id}
      on:click={() => entryDeleteTarget && deleteEntry(entryDeleteTarget)}
    >
      {entryDeleteTarget && deletingEntryId === entryDeleteTarget.id ? 'Deleting' : 'Delete'}
    </button>
  </svelte:fragment>
</Modal>

{#if toast}
  <div class="toast toast-end toast-top z-50">
    <div class={`alert shadow-lg ${toast.kind === 'error' ? 'alert-error' : 'alert-success'}`}>
      <span>{toast.message}</span>
      <button class="btn btn-ghost btn-xs" type="button" on:click={() => (toast = null)}>
        Close
      </button>
    </div>
  </div>
{/if}
