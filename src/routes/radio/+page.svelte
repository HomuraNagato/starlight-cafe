<script lang="ts">
  import { onMount, tick } from 'svelte';
  import Headphones from '@lucide/svelte/icons/headphones';
  import Music2 from '@lucide/svelte/icons/music-2';
  import Pause from '@lucide/svelte/icons/pause';
  import Play from '@lucide/svelte/icons/play';
  import Radio from '@lucide/svelte/icons/radio';
  import RefreshCw from '@lucide/svelte/icons/refresh-cw';
  import Volume2 from '@lucide/svelte/icons/volume-2';
  import Wifi from '@lucide/svelte/icons/wifi';
  import WifiOff from '@lucide/svelte/icons/wifi-off';
  import { messages } from '$lib/i18n/messages';
  import type { Messages } from '$lib/i18n/translations';
  import { radioStations, type RadioStation } from '$lib/radio/stations';

  type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'offline';

  type ListenArtist = {
    name?: string;
    nameRomaji?: string;
  };

  type ListenAlbum = {
    name?: string;
    nameRomaji?: string;
  };

  type ListenSong = {
    title?: string;
    titleRomaji?: string;
    artists?: ListenArtist[];
    albums?: ListenAlbum[];
  };

  type ListenTrackPayload = {
    song?: ListenSong;
  };

  type ListenGatewayMessage = {
    op?: number;
    t?: string;
    d?: ListenTrackPayload & { heartbeat?: number };
  };

  const fallbackStation = radioStations[0];

  let stationId = fallbackStation.id;
  let audioElement: HTMLAudioElement | null = null;
  let socket: WebSocket | null = null;
  let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let isPlaying = false;
  let volume = 0.72;
  let connectionStatus: ConnectionStatus = 'idle';
  let currentTrack: ListenTrackPayload | null = null;
  let lastUpdated = '';
  let playerMessageKey:
    | 'ready'
    | 'paused'
    | 'streamUnavailable'
    | 'browserGesture'
    | 'switchedTo'
    | 'tuning'
    | 'playing' = 'ready';
  let playerMessageStation = '';

  $: station = radioStations.find((item) => item.id === stationId) ?? fallbackStation;
  $: song = currentTrack?.song;
  $: trackTitle = song?.titleRomaji || song?.title || $messages.radio.waitingForTrack;
  $: artistNames = formatNames(song?.artists, $messages.radio.unknownArtist);
  $: albumNames = formatNames(song?.albums, $messages.radio.liveStream);
  $: connectionLabel = formatConnectionStatus(connectionStatus, $messages.radio.connection);
  $: playerMessage = formatPlayerMessage(playerMessageKey, playerMessageStation);

  $: if (audioElement) {
    audioElement.volume = volume;
  }

  onMount(() => {
    connectMetadata();

    return () => {
      disconnectMetadata();
    };
  });

  function formatNames(items: Array<ListenArtist | ListenAlbum> | undefined, fallback: string) {
    if (!items?.length) {
      return fallback;
    }

    return items
      .map((item) => item.nameRomaji || item.name)
      .filter(Boolean)
      .join(', ');
  }

  function formatConnectionStatus(
    status: ConnectionStatus,
    labels: Messages['radio']['connection'],
  ) {
    if (status === 'connected') {
      return labels.connected;
    }

    if (status === 'connecting') {
      return labels.connecting;
    }

    if (status === 'reconnecting') {
      return labels.reconnecting;
    }

    if (status === 'offline') {
      return labels.offline;
    }

    return labels.idle;
  }

  function formatPlayerMessage(key: typeof playerMessageKey, stationLabel: string) {
    const label = $messages.radio[key];

    if (!stationLabel) {
      return label;
    }

    return `${label} ${stationLabel}`;
  }

  async function setStation(nextStationId: string) {
    if (stationId === nextStationId) {
      return;
    }

    const nextStation = findStation(nextStationId);
    const shouldResume = isPlaying;
    stationId = nextStation.id;
    currentTrack = null;
    lastUpdated = '';
    playerMessageKey = 'switchedTo';
    playerMessageStation = nextStation.label;
    connectMetadata(nextStation);

    if (!audioElement) {
      return;
    }

    await tick();
    audioElement.pause();
    audioElement.load();

    if (shouldResume) {
      void playStream();
    }
  }

  function selectStation(event: Event) {
    const target = event.currentTarget;

    if (!(target instanceof HTMLSelectElement)) {
      return;
    }

    void setStation(target.value);
  }

  function findStation(id: string): RadioStation {
    return radioStations.find((item) => item.id === id) ?? fallbackStation;
  }

  async function togglePlayback() {
    if (isPlaying) {
      audioElement?.pause();
      isPlaying = false;
      playerMessageKey = 'paused';
      playerMessageStation = '';
      return;
    }

    await playStream();
  }

  async function playStream() {
    if (!audioElement) {
      return;
    }

    try {
      playerMessageKey = 'tuning';
      playerMessageStation = station.label;
      await audioElement.play();
      isPlaying = true;
      playerMessageKey = 'playing';
      playerMessageStation = station.label;
    } catch {
      isPlaying = false;
      playerMessageKey = 'browserGesture';
      playerMessageStation = '';
    }
  }

  function updateVolume(event: Event) {
    const target = event.currentTarget;

    if (!(target instanceof HTMLInputElement)) {
      return;
    }

    volume = Number(target.value);
  }

  function connectMetadata(targetStation = station) {
    disconnectMetadata();

    if (targetStation.metadata.type === 'none') {
      connectionStatus = 'offline';
      return;
    }

    connectionStatus = 'connecting';

    try {
      socket = new WebSocket(targetStation.metadata.url);
    } catch {
      scheduleReconnect();
      return;
    }

    socket.onopen = () => {
      connectionStatus = 'connected';
    };

    socket.onmessage = (message) => {
      if (typeof message.data !== 'string' || !message.data.length) {
        return;
      }

      let response: ListenGatewayMessage;

      try {
        response = JSON.parse(message.data);
      } catch {
        return;
      }

      if (response.op === 0) {
        sendHeartbeat();
        startHeartbeat(response.d?.heartbeat);
        return;
      }

      if (response.op !== 1 || response.t !== 'TRACK_UPDATE') {
        return;
      }

      currentTrack = response.d ?? null;
      lastUpdated = new Intl.DateTimeFormat(undefined, {
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date());
    };

    socket.onclose = () => {
      scheduleReconnect();
    };

    socket.onerror = () => {
      socket?.close();
    };
  }

  function disconnectMetadata() {
    clearHeartbeat();

    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }

    if (socket) {
      socket.onclose = null;
      socket.close();
      socket = null;
    }
  }

  function sendHeartbeat() {
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ op: 9 }));
    }
  }

  function startHeartbeat(interval: number | undefined) {
    clearHeartbeat();

    if (!interval) {
      return;
    }

    heartbeatTimer = setInterval(sendHeartbeat, interval);
  }

  function clearHeartbeat() {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
  }

  function scheduleReconnect() {
    clearHeartbeat();
    connectionStatus = 'reconnecting';

    if (reconnectTimer) {
      return;
    }

    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      connectMetadata();
    }, 5000);
  }
</script>

<svelte:head>
  <title>{$messages.radio.pageTitle}</title>
</svelte:head>

<main class="min-h-[calc(100vh-3.5rem)] bg-base-200">
  <audio
    bind:this={audioElement}
    src={station.streamUrl}
    preload="none"
    onplay={() => (isPlaying = true)}
    onpause={() => (isPlaying = false)}
    onerror={() => {
      isPlaying = false;
      playerMessageKey = 'streamUnavailable';
      playerMessageStation = '';
    }}
  >
    <track kind="captions" />
  </audio>

  <div class="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
    <header
      class="flex flex-col gap-3 border-b border-base-300 pb-5 md:flex-row md:items-end md:justify-between"
    >
      <div class="min-w-0">
        <p
          class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary"
        >
          <Radio class="h-4 w-4" aria-hidden="true" />
          {$messages.radio.eyebrow}
        </p>
        <h1 class="mt-2 text-2xl font-semibold leading-tight sm:text-3xl">
          {$messages.radio.title}
        </h1>
        <p class="mt-1 max-w-2xl text-sm text-base-content/65">
          {$messages.radio.subtitle}
        </p>
      </div>

      <div class="flex items-center gap-2 text-sm text-base-content/70">
        {#if connectionStatus === 'connected'}
          <Wifi class="h-4 w-4 text-success" aria-hidden="true" />
        {:else}
          <WifiOff class="h-4 w-4 text-warning" aria-hidden="true" />
        {/if}
        <span>{connectionLabel}</span>
      </div>
    </header>

    <section class="grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <div
        class="flex min-h-[30rem] flex-col justify-between rounded border border-base-300 bg-base-100 p-4 shadow-sm sm:p-6"
      >
        <div class="space-y-6">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <label class="form-control w-full sm:max-w-md">
              <span class="label py-1">
                <span
                  class="label-text text-xs font-medium uppercase tracking-wide text-base-content/60"
                >
                  {$messages.radio.station}
                </span>
              </span>
              <select
                class="select select-bordered min-h-12 w-full"
                value={stationId}
                onchange={selectStation}
              >
                {#each radioStations as item}
                  <option value={item.id}>{item.source} - {item.label}</option>
                {/each}
              </select>
            </label>

            {#if station.homepageUrl}
              <a
                class="btn btn-ghost btn-sm"
                href={station.homepageUrl}
                target="_blank"
                rel="noreferrer"
              >
                {station.source}
              </a>
            {/if}
          </div>

          <div class="flex min-h-[18rem] flex-col items-center justify-center gap-5 text-center">
            <div
              class="grid h-28 w-28 place-items-center rounded border border-base-300 bg-base-200"
            >
              <Music2 class="h-12 w-12 text-primary" aria-hidden="true" />
            </div>

            <div class="max-w-3xl">
              <p class="text-sm font-medium text-base-content/60">
                {station.source} / {station.label}
              </p>
              <h2 class="mt-2 text-3xl font-semibold leading-tight sm:text-5xl">{trackTitle}</h2>
              <p class="mt-3 text-base text-base-content/70 sm:text-lg">{artistNames}</p>
              <p class="mt-1 text-sm text-base-content/50">{albumNames}</p>
            </div>
          </div>
        </div>

        <div
          class="flex flex-col gap-4 border-t border-base-300 pt-5 md:flex-row md:items-center md:justify-between"
        >
          <div class="flex items-center gap-3">
            <button
              type="button"
              class="btn btn-primary btn-circle"
              aria-label={isPlaying ? $messages.radio.pause : $messages.radio.play}
              onclick={togglePlayback}
            >
              {#if isPlaying}
                <Pause class="h-5 w-5" aria-hidden="true" />
              {:else}
                <Play class="h-5 w-5" aria-hidden="true" />
              {/if}
            </button>

            <div>
              <p class="text-sm font-medium">{playerMessage}</p>
              <p class="text-xs text-base-content/55">
                {lastUpdated ? `${$messages.radio.updated} ${lastUpdated}` : station.description}
              </p>
            </div>
          </div>

          <label class="flex items-center gap-3 md:w-64">
            <Volume2 class="h-4 w-4 shrink-0 text-base-content/60" aria-hidden="true" />
            <input
              class="range range-primary range-sm"
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              aria-label={$messages.radio.volume}
              oninput={updateVolume}
            />
          </label>
        </div>
      </div>

      <aside class="rounded border border-base-300 bg-base-100 p-4 shadow-sm">
        <div class="flex items-center gap-2">
          <Headphones class="h-5 w-5 text-primary" aria-hidden="true" />
          <h2 class="text-base font-semibold">{$messages.radio.station}</h2>
        </div>

        <dl class="mt-5 space-y-4 text-sm">
          <div>
            <dt class="text-base-content/55">{$messages.radio.selected}</dt>
            <dd class="mt-1 font-medium">{station.source} - {station.label}</dd>
          </div>
          <div>
            <dt class="text-base-content/55">{$messages.radio.metadata}</dt>
            <dd class="mt-1 font-medium">{connectionLabel}</dd>
          </div>
          <div>
            <dt class="text-base-content/55">{$messages.radio.stream}</dt>
            <dd class="mt-1 break-all font-mono text-xs">{station.streamUrl}</dd>
          </div>
        </dl>

        <button
          type="button"
          class="btn btn-outline btn-sm mt-6 w-full"
          onclick={() => connectMetadata()}
        >
          <RefreshCw class="h-4 w-4" aria-hidden="true" />
          {$messages.radio.refreshMetadata}
        </button>
      </aside>
    </section>
  </div>
</main>
