export type PhotoAlbum = {
  id: string;
  title: string;
  imageCount: number;
  modifiedAt: number;
  coverFilename: string | null;
  coverUrl: string | null;
  coverThumbUrl: string | null;
};

export type PhotoMetadata = {
  sizeBytes: number;
  width: number | null;
  height: number | null;
  takenAt: number | null;
  cameraModel: string | null;
};

export type PhotoImage = {
  id: string;
  filename: string;
  albumId: string;
  modifiedAt: number;
  metadata: PhotoMetadata;
  thumbUrl: string;
  imageUrl: string;
  downloadUrl: string;
};
