import { PlayingState } from '../Game';
import { Position } from '../components/Position';
import { getTileMapCollisions } from '../colliders/tileMapCollision';
import { getCollider } from '../colliders/getCollider';
import { Bomb } from '../components/Bomb';
import { Velocity } from '../components/Velocity';
import * as V from '../util/vectorMaths';
import { GRAVITY, BOMB_RADIUS, GAME_HEIGHT } from '../constants';

export function updateBombs(state: PlayingState, dt: number): void {
  const { world, data } = state.get();
  const entities = world.find(Bomb);

  for (const entity of entities) {
    const vel = world.patch(entity, Velocity, (vel) => {
      vel.y += GRAVITY;
    });

    // TODO: two-step collision here might be needed
    const collision = getTileMapCollisions(
      data.level,
      data.level.collisionMap,
      getCollider(world, entity, { x: vel.x * dt, y: vel.y * dt })
    );

    const pos = world.patch(entity, Position, (pos) => {
      pos.x = collision.resolved.x;
      pos.y = collision.resolved.y;
    });
    if (pos.y + BOMB_RADIUS > GAME_HEIGHT) {
      world.destroy(entity);
    }

    if (collision.hit) {
      // bounce off the normal
      world.patch(entity, Velocity, (vel) => {
        const vec = V.reflect(vel, collision.hit!.normal);
        vel.x = vec.x;
        vel.y = vec.y;
      });
    }
  }
}
