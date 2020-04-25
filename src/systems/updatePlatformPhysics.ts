import { PlayingState } from '../Game';
import { GRAVITY } from '../constants';
import { Position } from '../components/Position';
import { Velocity } from '../components/Velocity';
import { PlatformPhysics } from '../components/PlatformPhysics';
import { getTileMapCollisions } from '../colliders/tileMapCollision';
import { getCollider } from '../colliders/getCollider';

export function updatePlatformPhysics(state: PlayingState, dt: number): void {
  const { world, data } = state.get();
  const entities = world.find(PlatformPhysics);

  for (const entity of entities) {
    const vel = world.patch(entity, Velocity, (vel) => {
      vel.y += GRAVITY;
    });

    // handle collisions with world
    // we do this in two phases, to prevent Strangeness
    const collisionY = getTileMapCollisions(
      data.level,
      data.level.collisionMap,
      getCollider(world, entity, { x: 0, y: vel.y * dt })
    );
    world.patch(entity, Position, (pos) => {
      pos.y = collisionY.resolved.y;
    });

    const collisionX = getTileMapCollisions(
      data.level,
      data.level.collisionMap,
      getCollider(world, entity, { x: vel.x * dt, y: 0 })
    );
    world.patch(entity, Position, (pos) => {
      pos.x = collisionX.resolved.x;
    });

    world.patch(entity, Velocity, (vel) => {
      if (collisionY.hit) {
        vel.x = 0; // prevents render interp from looking silly
      }
      if (collisionY.hit) {
        if (collisionY.hit.overlapVector.y !== 0) {
          vel.y = 0;
          if (collisionY.hit.overlapVector.y > 0) {
            world.patch(entity, PlatformPhysics, (phys) => {
              phys.grounded = true;
            });
          }
        }
      }

      if (vel.y !== 0) {
        world.patch(entity, PlatformPhysics, (phys) => {
          phys.grounded = false;
        });
      }
    });
  }
}
