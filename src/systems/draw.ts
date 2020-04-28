import { SinglePlayerState, MultiplayerState } from '../Game';
import { drawLevel } from './drawLevel';
import { drawSprites } from './drawSprites';
import { Bomb } from '../components/Bomb';
import { Position } from '../components/Position';
import * as V from '../util/vectorMaths';
import { Velocity } from '../components/Velocity';
import { BOMB_RADIUS } from '../constants';

export function draw(
  ctx: CanvasRenderingContext2D,
  state: SinglePlayerState | MultiplayerState,
  lerp: number
): void {
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.fillStyle = 'white';

  const { world, data } = state.get();
  drawLevel(ctx, data.assets.level, data.assets.levelTilesets);
  drawSprites(ctx, state, lerp);

  const bombs = world.find(Bomb);
  for (const bomb of bombs) {
    const { x, y } = V.add(
      world.get(bomb, Position),
      V.multiply(world.get(bomb, Velocity), lerp)
    );
    ctx.beginPath();
    ctx.arc(x, y, BOMB_RADIUS, 0, Math.PI * 2);
    ctx.fill();
  }
}
