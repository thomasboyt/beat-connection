import memoize from 'micro-memoize';
import { TiledLevel } from '../tiled';
import { SpriteSheet, drawSprite } from '../util/drawSprite';

export interface Tileset {
  name: string;
  sheet: SpriteSheet;
}

const drawTiles = memoize(
  (level: TiledLevel, tilesets: Tileset[]): HTMLCanvasElement => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = level.tilewidth * level.width;
    canvas.height = level.tileheight * level.height;

    for (const layer of level.layers) {
      if (layer.type === 'tilelayer') {
        for (let idx = 0; idx < layer.data.length; idx += 1) {
          const tileVal = layer.data[idx];
          if (tileVal === 0) {
            continue;
          }
          const tx = idx % level.width;
          const ty = Math.floor(idx / level.width);
          const x = tx * level.tilewidth;
          const y = ty * level.tileheight;
          const tiledTileset = level.tilesets[0]; // TODO: support multiple tilesets here
          const tileset = tilesets.find(
            (tileset) => tileset.name === tiledTileset.name
          );
          if (!tileset) {
            throw new Error(
              `could not find loaded tileset named ${tiledTileset.name}`
            );
          }
          const spriteIdx = tileVal - tiledTileset.firstgid;
          const tile = drawSprite(tileset.sheet, spriteIdx);
          ctx.drawImage(tile, x, y);
        }
      }
    }
    return canvas;
  }
);

export function drawLevel(
  ctx: CanvasRenderingContext2D,
  level: TiledLevel,
  tilesets: Tileset[]
): void {
  const canvas = drawTiles(level, tilesets);
  ctx.drawImage(canvas, 0, 0);
}
