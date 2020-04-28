import { produce, Draft, immerable } from 'immer';

// TODO: brand this?
export type Entity = number;

interface ComponentClass<T extends Component> {
  new (): T;
}

/**
 * Component must be a DATA CLASS. We make use of classes for nominal typing.
 */
export abstract class Component {
  // TODO: can we enforce that this has to be a string literal?
  abstract $tag: string;
  [immerable] = true;
}

function getComponentClass<T extends Component>(c: T): ComponentClass<T> {
  return c.constructor as ComponentClass<T>;
}

export interface Snapshot {
  entities: EntitySnapshot[];
}
export interface EntitySnapshot {
  entity: Entity;
  components: Component[];
}

type ComponentStorage = Map<ComponentClass<Component>, Map<Entity, Component>>;

export class World {
  private nextEntity = 1;
  private entities = new Set<Entity>();
  private components: ComponentStorage = new Map();
  private destroyQueue = new Set<Entity>();

  private getComponentMap<T extends Component>(
    c: ComponentClass<T>
  ): Map<Entity, T> {
    if (!this.components.has(c)) {
      this.components.set(c, new Map());
    }
    // TODO: debug assert that everything is correct here?
    return this.components.get(c) as Map<Entity, T>;
  }

  /** Find all entities with the given component(s). */
  find(...componentClasses: ComponentClass<Component>[]): Entity[] {
    // this is a slow and gc-heavy way to do this i'm sure, but eh
    const [first, ...rest] = componentClasses;
    let entities: Entity[] = [...this.getComponentMap(first).keys()];

    for (const componentClass of rest) {
      entities = entities.filter(
        (entity) => !!this.getComponentMap(componentClass).get(entity)
      );
    }

    return entities;
  }

  /** Create a new entity. */
  create(): Entity {
    const entity = this.nextEntity;
    this.entities.add(entity);
    this.nextEntity += 1;
    return entity;
  }

  /**
   * Remove one or more entities & their components. Will go into effect after
   * update ends.
   */
  destroy(...entities: Entity[]): void {
    for (const entity of entities) {
      this.destroyQueue.add(entity);
    }
  }

  destroyQueued(): void {
    for (const entity of this.destroyQueue) {
      for (const componentMap of this.components.values()) {
        componentMap.delete(entity);
      }
      this.destroyQueue.delete(entity);
    }
  }

  /** Add a component to an entity. */
  add<T extends Component>(entity: Entity, component: T): T {
    const componentClass = getComponentClass(component);
    this.getComponentMap(componentClass).set(entity, component);
    return component;
  }

  /** Remove a component from an entity. */
  remove(entity: Entity, component: Component): void {
    const componentClass = getComponentClass(component);
    this.getComponentMap(componentClass).delete(entity);
  }

  private hasComponent(
    entity: Entity,
    componentClass: ComponentClass<Component>
  ): boolean {
    return this.getComponentMap(componentClass).has(entity);
  }

  /** Returns true if entity has all component(s) */
  hasAll(entity: Entity, ...components: ComponentClass<Component>[]): boolean {
    return components.every((component) =>
      this.hasComponent(entity, component)
    );
  }

  /** Returns true if entity has at least one component(s) */
  hasAny(entity: Entity, ...components: ComponentClass<Component>[]): boolean {
    return components.some((component) => this.hasComponent(entity, component));
  }

  /** Return a component for an entity. */
  get<C extends Component>(
    entity: Entity,
    componentClass: ComponentClass<C>
  ): Readonly<C> {
    return this.getInternal(entity, componentClass);
  }

  private getInternal<C extends Component>(
    entity: Entity,
    componentClass: ComponentClass<C>
  ): C {
    const component = this.getComponentMap(componentClass).get(entity);

    // this is just here for the type checker tbh
    if (!(component instanceof componentClass)) {
      throw new Error(
        `Tried to get component of type ${componentClass} but got ${component}`
      );
    }
    return component;
  }

  /**
   * Replace an instance of a component with a new one.
   */
  replace<C extends Component>(
    entity: Entity,
    componentClass: ComponentClass<C>,
    component: C
  ): void {
    this.getComponentMap(componentClass).set(entity, component);
  }

  /**
   * Update a component using a callback.
   */
  patch<C extends Component>(
    entity: Entity,
    componentClass: ComponentClass<C>,
    cb: (component: Draft<C>) => void
  ): Readonly<C> {
    const component = this.getInternal(entity, componentClass);
    const componentNext = produce(component, (draftState) => cb(draftState));
    this.replace(entity, componentClass, componentNext);
    return componentNext;
  }

  snapshot(): Snapshot {
    const snapshot: Snapshot = {
      entities: [],
    };

    for (const entity of this.entities.values()) {
      const components: Component[] = [];
      for (const componentClass of this.components.keys()) {
        const component = this.components.get(componentClass)!.get(entity);

        if (component) {
          components.push(component);
        }
      }

      snapshot.entities.push({
        entity,
        components,
      });
    }

    return snapshot;
  }

  loadSnapshot(snapshot: Snapshot): void {
    const entities = new Set<Entity>();
    const components: ComponentStorage = new Map();

    for (const item of snapshot.entities) {
      entities.add(item.entity);
      for (const component of item.components) {
        const componentClass = getComponentClass(component);
        if (!components.has(componentClass)) {
          components.set(componentClass, new Map());
        }
        components.get(componentClass)!.set(item.entity, component);
      }
    }

    this.entities = entities;
    this.components = components;
  }
}
