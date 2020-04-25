import { World } from '../ecs';
import { PLAYER_WIDTH, PLAYER_HEIGHT } from '../constants';
import { TiledLevel, getTiledProperty } from '../tiled';

import { createPosition } from '../components/Position';
import { createSprite } from '../components/Sprite';
import { createPlayer } from '../components/Player';
import { createVelocity } from '../components/Velocity';
import { createPlatformPhysics } from '../components/PlatformPhysics';
import { createRectangleShape } from '../components/RectangleShape';

export function playerFactory(
  world: World,
  level: TiledLevel,
  playerNumber: number
): void {
  const layer = level.layers.find((layer) => layer.name === 'things');
  if (!layer) {
    throw new Error('missing things layer in level');
  }
  if (layer.type !== 'objectgroup') {
    throw new Error('things layer is not an object group');
  }
  const tiledPlayer = layer.objects.find(
    (obj) =>
      obj.type === 'player' && getTiledProperty(obj, 'player') === playerNumber
  );
  if (!tiledPlayer) {
    throw new Error(`tiled level missing player ${playerNumber}`);
  }

  const startPos = {
    x: tiledPlayer.x + tiledPlayer.width / 2,
    y: tiledPlayer.y + tiledPlayer.height / 2,
  };

  const playerEntity = world.create();
  world.add(playerEntity, createPosition(startPos));
  world.add(playerEntity, createRectangleShape(PLAYER_WIDTH, PLAYER_HEIGHT));
  world.add(playerEntity, createVelocity({ x: 0, y: 0 }));
  world.add(playerEntity, createSprite('idle'));
  world.add(playerEntity, createPlayer(playerNumber, startPos));
  world.add(playerEntity, createPlatformPhysics());
}
