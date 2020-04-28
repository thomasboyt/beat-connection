import * as SAT from 'sat';
import { Collision, satRespToCollision } from './types';

export function getBoxCollision(a: SAT.Box, b: SAT.Box): Collision | null {
  const resp = new SAT.Response();
  const didCollide = SAT.testPolygonPolygon(a.toPolygon(), b.toPolygon());
  if (didCollide) {
    return satRespToCollision(resp, a);
  }
  return null;
}
