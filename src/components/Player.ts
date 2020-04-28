import { Component } from '../ecs';
import { Vector2 } from '../util/vectorMaths';

export class Player extends Component {
  $tag!: 'beat-connection/player';
  number = -1;

  startX = 0;
  startY = 0;
  facingX = 1;
  lastInputs: number[] = [];
}

export function createPlayer(number: number, startPos: Vector2): Player {
  const p = new Player();
  p.number = number;
  p.startX = startPos.x;
  p.startY = startPos.y;
  return p;
}
