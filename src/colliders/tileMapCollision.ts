import * as SAT from 'sat';
import * as V from '../util/vectorMaths';
import { CollisionMap, TileCollisionType, TileMap } from '../tiled';

function getTile(
  collisionMap: CollisionMap,
  x: number,
  y: number
): TileCollisionType | null {
  if (!collisionMap[y] || !collisionMap[y][x]) {
    return null;
  }

  return collisionMap[y][x];
}

export interface TileMapCollision {
  hit: {
    overlap: number;
    overlapVector: V.Vector2;
  } | null;
  resolved: V.Vector2;
}

export function getTileMapCollisions(
  tileMap: TileMap,
  collisionMap: CollisionMap,
  objAabb: SAT.Box
): TileMapCollision {
  const { tileWidth, tileHeight } = tileMap;

  // only check relevant tiles
  const xBounds = [
    Math.floor(objAabb.pos.x / tileWidth),
    Math.ceil(objAabb.pos.x + objAabb.w / tileWidth),
  ];
  const yBounds = [
    Math.floor(objAabb.pos.y / tileHeight),
    Math.ceil((objAabb.pos.y + objAabb.h) / tileHeight),
  ];

  for (let y = yBounds[0]; y <= yBounds[1]; y += 1) {
    for (let x = xBounds[0]; x <= xBounds[1]; x += 1) {
      const tile = getTile(collisionMap, x, y);
      if (!tile) {
        continue;
      }
      // TODO: cache this
      const tileAabb = new SAT.Box(
        new SAT.Vector(x * tileWidth, y * tileHeight),
        tileWidth,
        tileHeight
      );

      // TODO: should this return >1 tile?
      const satResp = new SAT.Response();
      const didCollide = SAT.testPolygonPolygon(
        objAabb.toPolygon(),
        tileAabb.toPolygon(),
        satResp
      );
      if (didCollide && satResp.overlap > 0) {
        // see "internal edges"
        // https://wildbunny.co.uk/blog/2011/12/14/how-to-make-a-2d-platform-game-part-2-collision-detection/
        const normal = V.unit(satResp.overlapV);
        const adjacentTile = getTile(collisionMap, x + normal.x, y + normal.y);

        if (adjacentTile) {
          // TODO: maybe turn this back on? right now causes falling thru world
          // not sure why
          // continue;
        }

        return {
          hit: {
            overlap: satResp.overlap,
            overlapVector: {
              x: satResp.overlapV.x,
              y: satResp.overlapV.y,
            },
          },
          resolved: {
            x: objAabb.pos.x + objAabb.w / 2 + -satResp.overlapV.x,
            y: objAabb.pos.y + objAabb.h / 2 + -satResp.overlapV.y,
          },
        };
      }
    }
  }

  return {
    hit: null,
    resolved: {
      x: objAabb.pos.x + objAabb.w / 2,
      y: objAabb.pos.y + objAabb.h / 2,
    },
  };
}
