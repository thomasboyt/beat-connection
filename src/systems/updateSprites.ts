import { SinglePlayerState, MultiplayerState } from '../Game';
import { Sprite } from '../components/Sprite';
import { getAnimation } from './drawSprites';

export function updateSprites(
  state: SinglePlayerState | MultiplayerState,
  dt: number
): void {
  // TODO
  const { data, world } = state.get();
  const entities = world.find(Sprite);

  for (const entity of entities) {
    world.patch(entity, Sprite, (sprite) => {
      const anim = getAnimation(data.assets.animations, sprite.animationName);
      if (!anim) {
        return;
      }
      const frame = anim.frames[sprite.frame];
      sprite.frameTime += dt;
      if (sprite.frameTime >= frame.duration) {
        sprite.frame = (sprite.frame + 1) % anim.frames.length;
        sprite.frameTime = sprite.frameTime - frame.duration;
      }
    });
  }
}
