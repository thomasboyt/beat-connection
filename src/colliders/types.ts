import * as SAT from 'sat';
import * as V from '../util/vectorMaths';

export interface Collision {
  hit: {
    overlap: number;
    overlapVector: V.Vector2;
    normal: V.Vector2;
  } | null;
  resolved: V.Vector2;
}

export function satRespToCollision(
  satResp: SAT.Response,
  a: SAT.Box
): Collision {
  return {
    hit: {
      overlap: satResp.overlap,
      overlapVector: {
        x: satResp.overlapV.x,
        y: satResp.overlapV.y,
      },
      normal: {
        x: satResp.overlapN.x,
        y: satResp.overlapN.y,
      },
    },
    resolved: {
      x: a.pos.x + a.w / 2 + -satResp.overlapV.x,
      y: a.pos.y + a.h / 2 + -satResp.overlapV.y,
    },
  };
}
