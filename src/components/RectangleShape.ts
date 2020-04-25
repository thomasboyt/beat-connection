import { Component } from '../ecs';

export class RectangleShape extends Component {
  $tag!: 'rectangleShape';
  w = 0;
  h = 0;
}

export function createRectangleShape(w: number, h: number): RectangleShape {
  const r = new RectangleShape();
  r.w = w;
  r.h = h;
  return r;
}
