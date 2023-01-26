declare module 'spritesmith' {
  export type Rectangle = {
    x: number;
    y: number;
    width: number;
    height: number;
  };

  export type Coordinates = Record<string, Rectangle>;

  export type SpriteOptions = {
    padding: number;
    src: Vinyl[];
  };

  export type SpriteResult = {
    image: Buffer;
    coordinates: Coordinates;
    properties: any;
  };

  export function run(
    options: SpriteOptions,
    callback: (err: Error, result: SpriteResult) => void
  ): void;
}
