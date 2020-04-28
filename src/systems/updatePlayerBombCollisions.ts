import { PlayingState } from '../Game';
import { getCollider } from '../colliders/getCollider';
import { getBoxCollision } from '../colliders/boxCollision';
import { Bomb } from '../components/Bomb';
import { Player } from '../components/Player';
import { Velocity } from '../components/Velocity';

export function updatePlayerBombCollisions(state: PlayingState): void {
  const { world } = state.get();
  const bombs = world.find(Bomb);
  const players = world.find(Player);

  for (const player of players) {
    for (const bomb of bombs) {
      const bombCollider = getCollider(world, bomb);
      const playerCollider = getCollider(world, player);
      const collision = getBoxCollision(bombCollider, playerCollider);

      if (collision) {
        world.destroy(bomb);
        if (world.get(bomb, Velocity).x > 0) {
          world.patch(player, Velocity, (vel) => {
            vel.x = 0.1;
            vel.y = -0.1;
          });
        } else {
          world.patch(player, Velocity, (vel) => {
            vel.x = -0.1;
            vel.y = -0.1;
          });
        }
      }
    }
  }
}
