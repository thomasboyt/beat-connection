export interface TiledTileset {
  tilewidth: number;
  tileheight: number;
  firstgid: number;
  columns: number;
  name: string;
}

export interface TiledBaseLayer {
  type: string;
  name: string;
}

export interface TiledTileLayer extends TiledBaseLayer {
  type: 'tilelayer';
  data: number[];
}

export interface TiledObjectLayer extends TiledBaseLayer {
  type: 'objectgroup';
  objects: TiledObject[];
}

export type TiledLayer = TiledTileLayer | TiledObjectLayer;

export interface TiledObject {
  x: number;
  y: number;
  width: number;
  height: number;
  properties: TiledProperty[];
  type: string;
}

// TODO: implement more types of properties i guess
export interface TiledProperty {
  name: string;
  type: 'int';
  value: number;
}

export interface TiledLevel {
  tilewidth: number;
  tileheight: number;
  height: number;
  width: number;
  tilesets: TiledTileset[];
  layers: TiledLayer[];
}

// --- this part is game-specific ---

export enum TileCollisionType {
  Empty,
  Wall,
}
export type CollisionMap = TileCollisionType[][];

export interface TileMap {
  tileWidth: number;
  tileHeight: number;
  collisionMap: CollisionMap;
  // TODO: actual tile storage lol
}

export function loadTiledLevel(level: TiledLevel): TileMap {
  const tilesLayer = level.layers.find((layer) => layer.name === 'tiles');
  if (!tilesLayer || tilesLayer.type !== 'tilelayer') {
    throw new Error('missing tiles layer');
  }
  const tiles = tilesLayer.data;

  const collisionMap = new Array(level.height)
    .fill(null)
    .map((_val, y) =>
      new Array(level.width)
        .fill(null)
        .map((_val, x) =>
          tiles[y * level.width + x] > 0
            ? TileCollisionType.Wall
            : TileCollisionType.Empty
        )
    );
  return {
    tileWidth: level.tilewidth,
    tileHeight: level.tileheight,
    collisionMap,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getTiledProperty = (obj: TiledObject, key: string): any => {
  const prop = obj.properties.find((prop) => prop.name === key);
  if (!prop) {
    return null;
  }
  return prop.value;
};
