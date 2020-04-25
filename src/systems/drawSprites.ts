import { drawSprite } from '../util/drawSprite';
import { SinglePlayerState, MultiplayerState } from '../Game';
import { Sprite } from '../components/Sprite';
import { Animation } from '../assets';
import { Position } from '../components/Position';
import { Velocity } from '../components/Velocity';

// TODO: move this somewhere else
export const getAnimation = (
  animations: { [key: string]: Animation },
  name: string
): Animation | undefined => {
  return animations[name];
};

export function drawSprites(
  ctx: CanvasRenderingContext2D,
  state: SinglePlayerState | MultiplayerState,
  lerp: number
): void {
  const { data, world } = state.get();
  const entities = world.find(Sprite, Position);

  for (const entity of entities) {
    const sprite = world.get(entity, Sprite);
    const position = world.get(entity, Position);
    const renderPosition = { x: position.x, y: position.y };
    if (world.hasAll(entity, Velocity)) {
      const velocity = world.get(entity, Velocity);
      renderPosition.x += velocity.x * lerp;
      renderPosition.y += velocity.y * lerp;
    }
    const anim = getAnimation(data.assets.animations, sprite.animationName);
    if (!anim) {
      throw new Error(`no animation with name ${sprite.animationName} found`);
    }

    const frameIdx = sprite.frame;
    const frame = anim.frames[frameIdx];

    ctx.save();
    ctx.translate(Math.round(renderPosition.x), Math.round(renderPosition.y));
    ctx.scale(sprite.scale.x, sprite.scale.y);
    ctx.drawImage(
      drawSprite(
        {
          image: anim.image,
          spriteHeight: frame.h,
          spriteWidth: frame.w,
        },
        frameIdx
      ),
      -frame.w / 2,
      -frame.h / 2
    );
    ctx.restore();
  }
}
