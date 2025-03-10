// src/types/jupyter.ts
// First, let's create a shared types file to maintain consistency

export type Colormode = 'light' | 'dark' | 'system';

export interface JupyterTheme {
  colorMode: Colormode;
  colors: {
    primary: string;
    background: string;
    text: string;
    // Add other color properties that Jupyter React might need
    sidebar?: string;
    toolbar?: string;
    cell?: {
      background: string;
      border: string;
    };
  };
  spacing?: {
    small: number;
    medium: number;
    large: number;
  };
}
