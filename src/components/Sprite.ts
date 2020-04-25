import { Component } from '../ecs';
import { Vector2 } from '../util/vectorMaths';

export class Sprite extends Component {
  $tag!: 'beat-connection/sprite';
  // points to a preloaded sprite sheet
  animationName = '';
  frame = 0;
  frameTime = 0;
  scale: Vector2 = { x: 1, y: 1 };
}

export function createSprite(animationName: string): Sprite {
  const s = new Sprite();
  s.animationName = animationName;
  return s;
}
