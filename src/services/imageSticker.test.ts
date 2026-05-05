import { describe, expect, it } from 'vitest';
import {
  clampStickerAdjustment,
  getDefaultStickerCutoutPath,
  normalizeStickerCutoutPath,
} from './imageSticker';

describe('clampStickerAdjustment', () => {
  it('keeps sticker edit controls in the supported range', () => {
    expect(clampStickerAdjustment({ zoom: 3, offsetX: 90, offsetY: -90, background: 'cream' })).toEqual({
      zoom: 2,
      offsetX: 48,
      offsetY: -48,
      background: 'cream',
    });
  });
});

describe('normalizeStickerCutoutPath', () => {
  it('keeps finite cutout points inside the editable image bounds', () => {
    expect(normalizeStickerCutoutPath([
      { x: -0.2, y: 0.5 },
      { x: 0.25, y: Number.NaN },
      { x: 0.5, y: 1.2 },
      { x: 1.5, y: -0.5 },
    ])).toEqual([
      { x: 0, y: 0.5 },
      { x: 0.5, y: 1 },
      { x: 1, y: 0 },
    ]);
  });
});

describe('getDefaultStickerCutoutPath', () => {
  it('returns a usable polygon inside the image bounds', () => {
    const path = getDefaultStickerCutoutPath();

    expect(path.length).toBeGreaterThanOrEqual(6);
    expect(path.every(point => point.x >= 0 && point.x <= 1 && point.y >= 0 && point.y <= 1)).toBe(true);
  });
});
