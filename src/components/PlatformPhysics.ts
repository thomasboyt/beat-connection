import { Component } from '../ecs';

export class PlatformPhysics extends Component {
  $tag!: 'beat-connection/platform-physics';
  grounded = true;
}

export function createPlatformPhysics(): PlatformPhysics {
  return new PlatformPhysics();
}
