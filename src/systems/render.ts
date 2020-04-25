import { SinglePlayerState, MultiplayerState } from '../Game';
import { drawLevel } from './drawLevel';
import { drawSprites } from './drawSprites';

export function render(
  ctx: CanvasRenderingContext2D,
  state: SinglePlayerState | MultiplayerState,
  lerp: number
): void {
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.fillStyle = 'white';
  const { assets } = state.get().data;
  drawLevel(ctx, assets.level, assets.levelTilesets);
  drawSprites(ctx, state, lerp);
}
