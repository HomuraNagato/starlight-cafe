<script lang="ts">
  import { createEventDispatcher, onDestroy, onMount } from 'svelte';
  import {
    CandlestickSeries,
    ColorType,
    HistogramSeries,
    createChart,
    type IChartApi,
    type ISeriesApi,
    type UTCTimestamp,
  } from 'lightweight-charts';
  import type { Bar } from '$lib/digi-quark/api';

  type ChartRange = '1d' | '5d' | '1m' | '3m' | 'ytd' | '1y';

  export let bars: Bar[] = [];
  export let heightClass = 'h-56';
  export let showVolume = true;
  export let selectedRange: ChartRange = '1m';

  const dispatch = createEventDispatcher<{
    rangeChange: { range: ChartRange };
  }>();

  let container: HTMLDivElement;
  let chart: IChartApi | null = null;
  let candles: ISeriesApi<'Candlestick'> | null = null;
  let volume: ISeriesApi<'Histogram'> | null = null;
  let observer: ResizeObserver | null = null;
  let chartTimes: UTCTimestamp[] = [];
  const ranges: ChartRange[] = ['1d', '5d', '1m', '3m', 'ytd', '1y'];

  $: setChartData(bars);

  onMount(() => {
    chart = createChart(container, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#475569',
      },
      grid: {
        vertLines: { color: 'rgba(148, 163, 184, 0.18)' },
        horzLines: { color: 'rgba(148, 163, 184, 0.18)' },
      },
      crosshair: {
        mode: 0,
      },
      rightPriceScale: {
        borderColor: 'rgba(148, 163, 184, 0.35)',
      },
      timeScale: {
        borderColor: 'rgba(148, 163, 184, 0.35)',
        timeVisible: true,
        secondsVisible: false,
      },
    });

    candles = chart.addSeries(CandlestickSeries, {
      upColor: '#16a34a',
      downColor: '#dc2626',
      borderUpColor: '#16a34a',
      borderDownColor: '#dc2626',
      wickUpColor: '#15803d',
      wickDownColor: '#b91c1c',
    });

    volume = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: '',
      color: 'rgba(100, 116, 139, 0.35)',
    });
    volume.priceScale().applyOptions({
      scaleMargins: {
        top: 0.82,
        bottom: 0,
      },
    });

    observer = new ResizeObserver(() => applyVisibleRange());
    observer.observe(container);

    setChartData(bars);
  });

  onDestroy(() => {
    observer?.disconnect();
    chart?.remove();
    chart = null;
    candles = null;
    volume = null;
  });

  function setChartData(input: Bar[]) {
    if (!candles || !volume) return;

    const sorted = [...input].sort(
      (a, b) => new Date(a.bar_time).getTime() - new Date(b.bar_time).getTime(),
    );

    candles.setData(
      sorted.map((bar) => ({
        time: toChartTime(bar.bar_time),
        open: bar.open,
        high: bar.high,
        low: bar.low,
        close: bar.close,
      })),
    );

    volume.setData(
      showVolume
        ? sorted.map((bar) => ({
            time: toChartTime(bar.bar_time),
            value: bar.volume,
            color: bar.close >= bar.open ? 'rgba(22, 163, 74, 0.28)' : 'rgba(220, 38, 38, 0.28)',
          }))
        : [],
    );

    chartTimes = sorted.map((bar) => toChartTime(bar.bar_time));
    applyVisibleRange();
  }

  function toChartTime(value: string) {
    return Math.floor(new Date(value).getTime() / 1000) as UTCTimestamp;
  }

  function selectRange(range: ChartRange) {
    selectedRange = range;
    applyVisibleRange();
    dispatch('rangeChange', { range });
  }

  function applyVisibleRange() {
    if (!chart || chartTimes.length === 0) return;

    const latest = chartTimes[chartTimes.length - 1];
    const earliest = chartTimes[0];
    const from = Math.max(earliest, rangeStart(latest, selectedRange)) as UTCTimestamp;
    chart.timeScale().setVisibleRange({ from, to: latest });
  }

  function rangeStart(latest: UTCTimestamp, range: ChartRange) {
    const latestDate = new Date(Number(latest) * 1000);
    switch (range) {
      case '1d':
        return shiftDays(latestDate, -1);
      case '5d':
        return shiftDays(latestDate, -5);
      case '1m':
        return shiftMonths(latestDate, -1);
      case '3m':
        return shiftMonths(latestDate, -3);
      case 'ytd':
        return Math.floor(Date.UTC(latestDate.getUTCFullYear(), 0, 1) / 1000);
      case '1y':
        return shiftMonths(latestDate, -12);
    }
  }

  function shiftDays(value: Date, days: number) {
    const date = new Date(value);
    date.setUTCDate(date.getUTCDate() + days);
    return Math.floor(date.getTime() / 1000);
  }

  function shiftMonths(value: Date, months: number) {
    const date = new Date(value);
    date.setUTCMonth(date.getUTCMonth() + months);
    return Math.floor(date.getTime() / 1000);
  }
</script>

<div class="flex flex-col gap-2">
  <div class={`${heightClass} min-h-56 w-full`} bind:this={container}></div>
  <div class="flex items-center justify-end gap-1 border-t border-base-300 pt-2">
    {#each ranges as range}
      <button
        class={`btn btn-xs ${selectedRange === range ? 'btn-primary' : 'btn-ghost'}`}
        type="button"
        on:click={() => selectRange(range)}
      >
        {range.toUpperCase()}
      </button>
    {/each}
  </div>
</div>
