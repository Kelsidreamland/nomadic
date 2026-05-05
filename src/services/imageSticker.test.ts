import { describe, expect, it } from 'vitest';
import { clampStickerAdjustment } from './imageSticker';

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
