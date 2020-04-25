import { Component } from '../ecs';
import { Vector2 } from '../util/vectorMaths';

export class Position extends Component implements Vector2 {
  $tag!: 'position';
  x = 0;
  y = 0;
}

export function createPosition({ x, y }: Vector2): Position {
  const p = new Position();
  p.x = x;
  p.y = y;
  return p;
}
