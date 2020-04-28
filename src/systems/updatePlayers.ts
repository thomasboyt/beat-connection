import { InputValues } from '@tboyt/telegraph';
import { PlayingState } from '../Game';
import { Player } from '../components/Player';
import { Velocity, createVelocity } from '../components/Velocity';
import { keyCodes } from '../util/keyCodes';
import { Sprite } from '../components/Sprite';
import { PLAYER_SPEED, PLAYER_JUMP_SPEED, GAME_HEIGHT } from '../constants';
import { PlatformPhysics } from '../components/PlatformPhysics';
import { Position } from '../components/Position';
import { throwBomb } from './throwBomb';

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
    const lastInputs = player.lastInputs;

    const tappedInput = (input: number): boolean =>
      playerInputs.includes(input) && !lastInputs.includes(input);

    // did we fall off the dang world again
    const pos = world.get(entity, Position);
    if (pos.y > GAME_HEIGHT) {
      world.patch(entity, Position, (pos) => {
        pos.x = player.startX;
        pos.y = player.startY;
      });
    }

    const prevVel = world.get(entity, Velocity);
    const newVel = createVelocity({ x: prevVel.x, y: prevVel.y });

    // update velocity
    if (newVel.x <= PLAYER_SPEED && newVel.x >= -PLAYER_SPEED) {
      if (playerInputs.includes(keyCodes.rightArrow)) {
        newVel.x = PLAYER_SPEED;
      } else if (playerInputs.includes(keyCodes.leftArrow)) {
        newVel.x = -PLAYER_SPEED;
      } else {
        newVel.x = 0;
      }
    }

    if (tappedInput(keyCodes.upArrow)) {
      if (world.get(entity, PlatformPhysics).grounded) {
        newVel.y = -PLAYER_JUMP_SPEED;
      }
    }

    world.replace(entity, Velocity, newVel);

    if (tappedInput(keyCodes.z)) {
      throwBomb(world, entity);
    }

    world.patch(entity, Player, (player) => {
      if (playerInputs.includes(keyCodes.leftArrow)) {
        player.facingX = -1;
      } else if (playerInputs.includes(keyCodes.rightArrow)) {
        player.facingX = 1;
      }

      player.lastInputs = [...playerInputs];
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
