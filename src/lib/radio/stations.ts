export type RadioMetadata =
  | {
      type: 'listen-moe';
      url: string;
    }
  | {
      type: 'none';
    };

export type RadioStation = {
  id: string;
  label: string;
  source: string;
  description: string;
  streamUrl: string;
  homepageUrl?: string;
  metadata: RadioMetadata;
};

export const radioStations: RadioStation[] = [
  {
    id: 'listen-moe-jpop',
    label: 'JPOP',
    source: 'LISTEN.moe',
    description: 'Anime, game, idol, and J-pop selections',
    streamUrl: 'https://listen.moe/fallback',
    homepageUrl: 'https://listen.moe',
    metadata: {
      type: 'listen-moe',
      url: 'wss://listen.moe/gateway_v2',
    },
  },
  {
    id: 'listen-moe-kpop',
    label: 'KPOP',
    source: 'LISTEN.moe',
    description: 'K-pop selections from LISTEN.moe',
    streamUrl: 'https://listen.moe/kpop/fallback',
    homepageUrl: 'https://listen.moe',
    metadata: {
      type: 'listen-moe',
      url: 'wss://listen.moe/kpop/gateway_v2',
    },
  },
];
