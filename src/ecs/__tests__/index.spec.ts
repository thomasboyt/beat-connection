import { Component, World } from '../index';

class Position extends Component {
  $tag!: 'position';
  value = {
    x: 0,
    y: 0,
  };
}

function createPosition(x: number, y: number): Position {
  const p = new Position();
  p.value.x = x;
  p.value.y = y;
  return p;
}

describe('BabyEcs', () => {
  describe('snapshots', () => {
    it('components are not updated when their source component is updated', () => {
      const world = new World();
      const entity = world.create();
      world.add(entity, createPosition(10, 10));

      const snapshot = world.snapshot();
      expect(snapshot.entities).toHaveLength(1);
      expect(snapshot.entities[0].entity).toBe(entity);
      expect(snapshot.entities[0].components[0]).toBeDefined();

      world.patch(entity, Position, (pos) => {
        pos.value.x = 20;
        pos.value.y = 20;
      });

      const posSnapshot = snapshot.entities[0].components[0] as Position;
      expect(posSnapshot).toBeInstanceOf(Position);
      expect(posSnapshot.value.x).toBe(10);
      expect(posSnapshot.value.y).toBe(10);
    });
  });
});
