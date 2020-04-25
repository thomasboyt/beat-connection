import levelData from '../assets/build/level.json';
import idleAnimation from '../assets/build/player/idle.json';
import runAnimation from '../assets/build/player/run.json';
const images = {
  tiles: require('../assets/build/tiles.png').default,
  idle: require('../assets/build/player/idle.png').default,
  run: require('../assets/build/player/run.png').default,
};
import { TiledLevel } from './tiled';

export type Images = { [K in keyof typeof images]: HTMLImageElement };

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = (): void => resolve(img);
    img.onerror = (err): void => reject(err);
    img.src = src;
  });
}

async function loadImagesGeneric<T extends { [key: string]: string }>(
  images: T
): Promise<{ [K in keyof T]: HTMLImageElement }> {
  const loadPromises: Promise<void>[] = [];
  const results: { [key: string]: HTMLImageElement } = {};
  for (const [key, src] of Object.entries(images)) {
    loadPromises.push(
      loadImage(src).then((image) => {
        results[key] = image;
      })
    );
  }
  await Promise.all(Object.values(loadPromises));
  return results as { [K in keyof T]: HTMLImageElement };
}

export function loadImages(): Promise<Images> {
  return loadImagesGeneric(images);
}

interface AsepriteAnimation {
  frames: {
    frame: { x: number; y: number; w: number; h: number };
    duration: number;
  }[];
}
export interface Animation {
  image: HTMLImageElement;
  frames: Frame[];
}
interface Frame {
  duration: number;
  x: number;
  y: number;
  w: number;
  h: number;
}
export function getFrames(anim: AsepriteAnimation): Frame[] {
  return anim.frames.map((frame) => ({
    duration: frame.duration,
    x: frame.frame.x,
    y: frame.frame.y,
    w: frame.frame.w,
    h: frame.frame.h,
  }));
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export async function loadAssets() {
  const images = await loadImages();
  return {
    level: levelData as TiledLevel,
    levelTilesets: [
      {
        name: 'Tiles',
        sheet: {
          spriteWidth: 16,
          spriteHeight: 16,
          image: images.tiles,
        },
      },
    ],
    animations: {
      idle: {
        image: images.idle,
        frames: getFrames(idleAnimation),
      },
      run: {
        image: images.run,
        frames: getFrames(runAnimation),
      },
    },
  };
}

type PromiseResolvedType<T> = T extends Promise<infer R> ? R : never;
export type Assets = PromiseResolvedType<ReturnType<typeof loadAssets>>;
