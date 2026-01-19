declare module 'css' {
  interface ParseOptions {
    source?: string
    silent?: boolean
  }

  interface StringifyOptions {
    indent?: string
    compress?: boolean
  }

  export function parse(
    css: string,
    options?: ParseOptions,
  ): import('./types').CssStylesheet
  export function stringify(
    stylesheet: import('./types').CssStylesheet,
    options?: StringifyOptions,
  ): string
}

declare module 'spritesmith' {
  import type Vinyl from 'vinyl'
  import type { SpritesmithCoordinates } from './types'

  interface SpritesmithOptions {
    src: Vinyl[]
    padding?: number
    algorithm?: string
    algorithmOpts?: Record<string, unknown>
    engine?: string
    engineOpts?: Record<string, unknown>
  }

  interface SpritesmithResult {
    image: Buffer
    coordinates: Record<string, SpritesmithCoordinates>
    properties: {
      width: number
      height: number
    }
  }

  namespace Spritesmith {
    export function run(
      options: SpritesmithOptions,
      callback: (err: Error | null, result?: SpritesmithResult) => void,
    ): void
  }

  export = Spritesmith
}

declare module 'figures' {
  export const tick: string
  export const cross: string
  export const warning: string
  export const info: string
  export const pointer: string
  export const bullet: string
  export const line: string
  export const arrowUp: string
  export const arrowDown: string
  export const arrowLeft: string
  export const arrowRight: string
}
