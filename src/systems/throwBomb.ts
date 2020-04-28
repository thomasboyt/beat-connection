import { Entity, World } from '../ecs';
import { Position, createPosition } from '../components/Position';
import { createVelocity } from '../components/Velocity';
import { createBomb } from '../components/Bomb';
import { Player } from '../components/Player';
import { createRectangleShape } from '../components/RectangleShape';
import { BOMB_RADIUS } from '../constants';

// TODO: this will be based on how long you hold the button...
const BOMB_SPEED_X = 0.1;
const BOMB_SPEED_Y = 0.15;

export function throwBomb(world: World, player: Entity): void {
  const playerPos = world.get(player, Position);
  const { number: playerNumber, facingX } = world.get(player, Player);
  const bomb = world.create();
  world.add(
    bomb,
    createPosition({ x: playerPos.x + 10 * facingX, y: playerPos.y - 10 })
  );
  world.add(
    bomb,
    createVelocity({ x: BOMB_SPEED_X * facingX, y: -BOMB_SPEED_Y })
  );
  world.add(bomb, createBomb(playerNumber));
  world.add(bomb, createRectangleShape(BOMB_RADIUS * 2, BOMB_RADIUS * 2));
}
