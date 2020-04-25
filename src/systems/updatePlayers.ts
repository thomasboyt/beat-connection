import { InputValues } from '@tboyt/telegraph';
import { PlayingState } from '../Game';
import { Player } from '../components/Player';
import { Velocity } from '../components/Velocity';
import { keyCodes } from '../util/keyCodes';
import { Sprite } from '../components/Sprite';
import { PLAYER_SPEED, PLAYER_JUMP_SPEED, GAME_HEIGHT } from '../constants';
import { PlatformPhysics } from '../components/PlatformPhysics';
import { Position } from '../components/Position';

export function updatePlayers(
  state: PlayingState,
  dt: number,
  inputs: InputValues[]
): void {
  const { world } = state.get();
  const players = world.find(Player);

  for (const entity of players) {
    const player = world.get(entity, Player);
    const playerInputs = inputs[player.number - 1];

    // did we fall off the dang world again
    const pos = world.get(entity, Position);
    if (pos.y > GAME_HEIGHT) {
      world.patch(entity, Position, (pos) => {
        pos.x = player.startX;
        pos.y = player.startY;
      });
    }

    const newVel = world.patch(entity, Velocity, (vel) => {
      if (playerInputs.includes(keyCodes.rightArrow)) {
        vel.x = PLAYER_SPEED;
      } else if (playerInputs.includes(keyCodes.leftArrow)) {
        vel.x = -PLAYER_SPEED;
      } else {
        vel.x = 0;
      }

      if (playerInputs.includes(keyCodes.z)) {
        if (world.get(entity, PlatformPhysics).grounded) {
          vel.y = -PLAYER_JUMP_SPEED;
        }
      }
    });

    world.patch(entity, Sprite, (sprite) => {
      if (newVel.x === 0 && sprite.animationName !== 'idle') {
        sprite.animationName = 'idle';
        sprite.frame = 0;
        sprite.frameTime = 0;
      } else if (newVel.x !== 0 && sprite.animationName !== 'run') {
        sprite.animationName = 'run';
        sprite.frame = 0;
        sprite.frameTime = 0;
      }

      if (newVel.x < 0) {
        sprite.scale = { x: -1, y: 1 };
      } else if (newVel.x > 0) {
        sprite.scale = { x: 1, y: 1 };
      }
    });
  }
}
