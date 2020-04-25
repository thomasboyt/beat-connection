import { Component } from '../ecs';
import { Vector2 } from '../util/vectorMaths';

export class Velocity extends Component implements Vector2 {
  $tag!: 'velocity';
  x = 0;
  y = 0;
}

export function createVelocity({ x, y }: Vector2): Velocity {
  const v = new Velocity();
  v.x = x;
  v.y = y;
  return v;
}
