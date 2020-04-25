import memoize from 'micro-memoize';

export interface SpriteSheet {
  spriteWidth: number;
  spriteHeight: number;
  image: HTMLImageElement;
}

export const drawSprite = memoize(
  (sheet: SpriteSheet, n: number): HTMLCanvasElement => {
    const canvas = document.createElement('canvas');
    canvas.width = sheet.spriteWidth;
    canvas.height = sheet.spriteHeight;

    // TODO: support multiple rows i guess
    const xOffset = sheet.spriteWidth * n;

    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(
      sheet.image,
      xOffset,
      0,
      sheet.spriteWidth,
      sheet.spriteHeight,
      0,
      0,
      sheet.spriteWidth,
      sheet.spriteHeight
    );

    return canvas;
  }
);
