import { Component } from '../ecs';

export class Bomb extends Component {
  $tag!: 'beat-connection/bomb';
  creator = -1;
  timeRemaining = 0;
}

export function createBomb(creator: number): Bomb {
  const b = new Bomb();
  b.creator = creator;
  return b;
}
