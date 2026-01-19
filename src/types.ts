import type { Compilation, Compiler, NormalModule, sources } from 'webpack'

// CSS Parser types (from 'css' package)
export interface CssPosition {
  line: number
  column: number
}

export interface CssNode {
  type: string
  position?: {
    start: CssPosition
    end: CssPosition
    source?: string
  }
}

export interface CssDeclaration extends CssNode {
  type: 'declaration'
  property: string
  value: string
  parent?: CssRule
}

export interface CssComment extends CssNode {
  type: 'comment'
  comment: string
  parent?: CssRule
}

export interface CssRule extends CssNode {
  type: 'rule'
  selectors: string[]
  declarations: (CssDeclaration | CssComment)[]
}

export interface CssStylesheet {
  type: 'stylesheet'
  stylesheet: {
    rules: CssRule[]
    parsingErrors?: unknown[]
  }
}

// Spritesmith types
export interface SpritesmithCoordinates {
  x: number
  y: number
  width: number
  height: number
}

export interface SpritesmithResult {
  image: Buffer
  coordinates: Record<string, SpritesmithCoordinates>
  properties: {
    width: number
    height: number
  }
}

// Note: Vinyl types are provided by @types/vinyl

// Plugin options
export interface ImageSpritePluginOptions {
  extensions?: string[]
  padding?: number
  suffix?: string
  outputPath?: string
  outputFilename?: string
  compress?: boolean
  indent?: string
  commentOrigin?: boolean
  log?: boolean
}

// Internal types
export interface CssBlockInfo {
  cssBlock: string
  start: number
  end: number
}

export interface ImagePathInfo {
  url: string
  local: string
}

export interface ParsedCssBlock {
  ast: CssStylesheet
  propertyMap: Record<
    string,
    {
      declaration: CssDeclaration
      index: number
    }
  >
}

export interface TransformTarget {
  name: string
  asset: sources.Source
}

// Webpack Source types
export interface ConcatSourceLike extends sources.Source {
  children?: sources.Source[]
}

export interface SourceMapSourceLike extends sources.Source {
  _sourceMap?: unknown
}

// Re-export webpack types for convenience
export type { Compilation, Compiler, NormalModule }
