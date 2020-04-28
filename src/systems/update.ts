import { InputValues } from '@tboyt/telegraph';
import { SinglePlayerState, MultiplayerState } from '../Game';
import { updateSprites } from './updateSprites';
import { updatePlayers } from './updatePlayers';
import { updatePlatformPhysics } from './updatePlatformPhysics';
import { updateBombs } from './updateBombs';
import { updatePlayerBombCollisions } from './updatePlayerBombCollisions';

export function update(
  state: SinglePlayerState | MultiplayerState,
  dt: number,
  inputs: InputValues[]
): void {
  updatePlayers(state, dt, inputs);
  updatePlatformPhysics(state, dt);
  updateSprites(state, dt);
  updateBombs(state, dt);
  updatePlayerBombCollisions(state);
}
