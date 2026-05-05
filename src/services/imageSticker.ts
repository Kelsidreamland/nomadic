export type StickerBackground = 'white' | 'cream' | 'transparent';

export interface StickerAdjustment {
  zoom: number;
  offsetX: number;
  offsetY: number;
  background: StickerBackground;
}

export const DEFAULT_STICKER_ADJUSTMENT: StickerAdjustment = {
  zoom: 1,
  offsetX: 0,
  offsetY: 0,
  background: 'white',
};

const clamp = (value: number, min: number, max: number) => {
  return Math.min(max, Math.max(min, value));
};

export const clampStickerAdjustment = (adjustment: Partial<StickerAdjustment>): StickerAdjustment => ({
  zoom: clamp(Number(adjustment.zoom ?? DEFAULT_STICKER_ADJUSTMENT.zoom), 0.65, 2),
  offsetX: clamp(Number(adjustment.offsetX ?? DEFAULT_STICKER_ADJUSTMENT.offsetX), -48, 48),
  offsetY: clamp(Number(adjustment.offsetY ?? DEFAULT_STICKER_ADJUSTMENT.offsetY), -48, 48),
  background: adjustment.background || DEFAULT_STICKER_ADJUSTMENT.background,
});

export const getStickerBackgroundColor = (background: StickerBackground) => {
  if (background === 'cream') return '#F7F1E8';
  if (background === 'white') return '#FFFFFF';
  return 'transparent';
};
