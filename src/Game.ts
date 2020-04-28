import {
  Telegraph,
  PlayerType,
  TelegraphEvent,
  SaveResult,
  SyncInputResultValue,
  AddLocalInputResult,
} from '@tboyt/telegraph';
import Peer from 'peerjs';
import { produce, Draft } from 'immer';

import { World, Snapshot } from './ecs';
import { GAME_WIDTH, GAME_HEIGHT } from './constants';
import { Inputter } from './util/Inputter';
import { updateStatus, renderCrashError } from './util/renderDebugInfo';
import { hash } from './util/hash';
import { loadAssets, Assets } from './assets';
import { TileMap, loadTiledLevel } from './tiled';

import { playerFactory } from './prefabs/player';
import { update } from './systems/update';
import { draw } from './systems/draw';

const FIXED_STEP = 1000 / 60;

interface GameData {
  level: TileMap;
  assets: Assets;
}

interface MultiplayerGameData extends GameData {
  frameCount: number;
  localPlayerHandle?: number;
  remotePlayerHandle?: number;
}

export abstract class GameState<T> {
  abstract readonly type: string;
  world: World;
  data: T;

  constructor(initialData: T) {
    this.data = initialData;
    this.world = new World();
  }

  get(): { world: World; data: Readonly<T> } {
    return { world: this.world, data: this.data };
  }

  updateData(cb: (data: Draft<T>) => void): Readonly<T> {
    this.data = produce(this.data, (draft) => cb(draft));
    return this.data;
  }

  abstract onUpdateFixed(dt: number): void;
}

export class SinglePlayerState extends GameState<GameData> {
  readonly type: 'singlePlayer' = 'singlePlayer';
  inputter: Inputter;

  constructor(inputter: Inputter, initialData: GameData) {
    super(initialData);
    this.inputter = inputter;

    // create local player
    playerFactory(this.world, this.data.assets.level, 1);
    // create ai player
    playerFactory(this.world, this.data.assets.level, 2);
  }

  onUpdateFixed(dt: number): void {
    const inputs = this.inputter.getInputState();
    update(this, dt, [inputs, []]);
    this.world.destroyQueued();
  }
}

interface SaveState {
  snapshot: Snapshot;
  data: MultiplayerGameData;
}

export class MultiplayerState extends GameState<MultiplayerGameData> {
  readonly type: 'multiPlayer' = 'multiPlayer';
  inputter: Inputter;
  private telegraph: Telegraph<string>;

  constructor(
    inputter: Inputter,
    peer: Peer,
    remotePeerId: string,
    localPlayerNumber: number,
    initialData: MultiplayerGameData
  ) {
    super(initialData);

    this.inputter = inputter;
    this.telegraph = new Telegraph({
      peer,
      disconnectNotifyStart: 1000,
      disconnectTimeout: 3000,
      numPlayers: 2,

      callbacks: {
        onAdvanceFrame: (): void => this.runRollbackUpdate(),
        onLoadState: (state): void => {
          this.world.loadSnapshot(state.snapshot);
          this.data = state.data;
        },
        onSaveState: (): SaveResult<SaveState> => {
          return {
            state: {
              snapshot: this.world.snapshot(),
              data: this.data,
            },
            checksum: null,
          };
        },
        onEvent: (evt: TelegraphEvent): void => {
          console.log('[Telegraph]', evt.type);
          if (evt.type === 'running' || evt.type === 'connectionResumed') {
            updateStatus({ state: 'running' });
          } else if (evt.type === 'connected') {
            this.updateData((data) => {
              data.remotePlayerHandle = evt.connected.playerHandle;
            });
          } else if (evt.type === 'connectionInterrupted') {
            updateStatus({ state: 'interrupted' });
          } else if (evt.type === 'disconnected') {
            updateStatus({ state: 'disconnected' });
          }
        },
      },
    });

    this.updateData((data) => {
      data.localPlayerHandle = this.telegraph.addPlayer({
        playerNumber: localPlayerNumber,
        type: PlayerType.local,
      }).value!;
    });

    this.telegraph.setFrameDelay(this.data.localPlayerHandle!, 2);

    this.telegraph.addPlayer({
      playerNumber: localPlayerNumber === 1 ? 2 : 1,
      type: PlayerType.remote,
      remote: {
        peerId: remotePeerId,
      },
    });

    playerFactory(this.world, this.data.assets.level, 1);
    playerFactory(this.world, this.data.assets.level, 2);
  }

  private advanceFrame({ inputs }: SyncInputResultValue, dt: number): void {
    update(this, dt, inputs);
    this.world.destroyQueued();
    this.telegraph.advanceFrame();
  }

  private runRollbackUpdate(): void {
    const inputResult = this.telegraph.syncInput();
    if (!inputResult.value) {
      throw new Error(
        `rollback failure: missing input, code ${inputResult.code}`
      );
    }
    console.log('rollback input', inputResult.value.inputs);
    this.advanceFrame(inputResult.value, FIXED_STEP);
  }

  onUpdateFixed(dt: number): void {
    let didAdvance = false;

    const addLocalInputResult = this.readInput();

    if (!addLocalInputResult || addLocalInputResult.code === 'ok') {
      const inputResult = this.telegraph.syncInput();
      if (inputResult.code === 'ok') {
        this.advanceFrame(inputResult.value!, dt);
        didAdvance = true;
      } else {
        console.log('[Game] non-ok result for syncInput:', inputResult.code);
      }
    }

    this.telegraph.afterTick();

    if (didAdvance) {
      this.updateData((data) => {
        data.frameCount += 1;
      });
      if (this.data.frameCount % 60 === 0) {
        this.updateStats();
      }
    }
  }

  readInput(): AddLocalInputResult | null {
    if (this.data.localPlayerHandle === undefined) {
      return null;
    }

    const localInputs = this.inputter.getInputState();
    return this.telegraph.addLocalInput(
      this.data.localPlayerHandle,
      localInputs
    );
  }

  updateStats(): void {
    const checksum = hash(JSON.stringify(this.world.snapshot()));
    console.log('frame', this.data.frameCount, checksum);

    const remotePlayerHandle = this.data.remotePlayerHandle;
    if (remotePlayerHandle !== undefined) {
      const stats = this.telegraph.getNetworkStats(remotePlayerHandle).value!;
      updateStatus({
        frame: this.data.frameCount,
        checksum: checksum,
        ping: Math.floor(stats.ping),
        sendQueueLength: stats.sendQueueLength,
      });
    }
  }
}

export type PlayingState = SinglePlayerState | MultiplayerState;

export class Game {
  private ctx!: CanvasRenderingContext2D;
  protected frameCount = 0;
  protected stopped = false;
  protected inputter = new Inputter();
  private assets: Assets;
  protected state?: SinglePlayerState | MultiplayerState;

  constructor(assets: Assets) {
    this.createCanvas();
    this.inputter.bind(this.ctx.canvas);
    this.assets = assets;
  }

  startSinglePlayer(): void {
    this.state = new SinglePlayerState(this.inputter, {
      assets: this.assets,
      level: loadTiledLevel(this.assets.level),
    });
  }

  startMultiPlayer(
    peer: Peer,
    remoteId: string,
    localPlayerNumber: number
  ): void {
    this.state = new MultiplayerState(
      this.inputter,
      peer,
      remoteId,
      localPlayerNumber,
      {
        assets: this.assets,
        level: loadTiledLevel(this.assets.level),
        frameCount: 1,
      }
    );
  }

  private createCanvas(): void {
    // Initialize canvas
    const canvas = document.querySelector('canvas');

    if (!canvas) {
      throw new Error('failed to find canvas on page');
    }

    canvas.width = GAME_WIDTH;
    canvas.height = GAME_HEIGHT;
    this.ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

    if (!this.ctx) {
      throw new Error('failed to create 2d context');
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (canvas as any).imageSmoothingEnabled = false;
    canvas.style.imageRendering = 'pixelated';
  }

  // game loop. see:
  // - https://gist.github.com/godwhoa/e6225ae99853aac1f633
  // - http://gameprogrammingpatterns.com/game-loop.html
  run(): void {
    if (this.stopped) {
      // stop run loop
      return;
    }

    let lastTime = performance.now();
    let lag = 0;

    /**
     * The "real" (RAF-bound) run loop.
     */
    const loop = (): void => {
      // Compute delta and elapsed time
      const time = performance.now();
      const delta = time - lastTime;

      if (delta > 1000) {
        // TODO: if this happens... might have other options? idk
        throw new Error('unrecoverable time delta');
      }
      lag += delta;

      while (lag >= FIXED_STEP) {
        this.state!.onUpdateFixed(FIXED_STEP);
        lag -= FIXED_STEP;
      }

      const lagOffset = lag / FIXED_STEP;
      draw(this.ctx, this.state!, lagOffset);

      lastTime = time;
      requestAnimationFrame(loop);
    };

    loop();
  }

  stop(): void {
    this.stopped = true;
  }
}

export async function createMultiplayerGame(
  peer: Peer,
  remotePeerId: string,
  localPlayerNumber: number
): Promise<void> {
  const assets = await loadAssets();
  const game = new Game(assets);
  game.startMultiPlayer(peer, remotePeerId, localPlayerNumber);
  game.run();

  window.onerror = (err): void => {
    console.error('Stopping game!');
    game.stop();
    peer.destroy();

    if (err instanceof Event) {
      renderCrashError((err as ErrorEvent).error || '(unknown)');
    } else {
      renderCrashError(err);
    }
  };
}

export async function createSinglePlayerGame(): Promise<void> {
  const assets = await loadAssets();
  const game = new Game(assets);
  game.startSinglePlayer();
  game.run();
}
