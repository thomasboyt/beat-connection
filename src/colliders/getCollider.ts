import { World, Entity } from '../ecs';
import * as SAT from 'sat';
import { Position } from '../components/Position';
import { RectangleShape } from '../components/RectangleShape';
import { Vector2 } from '../util/vectorMaths';

/** TODO: figure out how to cache this */
export function getCollider(
  world: World,
  entity: Entity,
  delta: Vector2 = { x: 0, y: 0 }
): SAT.Box {
  const pos = world.get(entity, Position);
  const rect = world.get(entity, RectangleShape);
  return new SAT.Box(
    new SAT.Vector(pos.x - rect.w / 2 + delta.x, pos.y - rect.h / 2 + delta.y),
    rect.w,
    rect.h
  );
}
