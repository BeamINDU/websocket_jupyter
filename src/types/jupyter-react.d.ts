// src/types/jupyter-react.d.ts

declare module '@datalayer/jupyter-react' {
  // กำหนด type สำหรับ color mode ที่สามารถใช้ได้
  export type Colormode = 'light' | 'dark' | 'system';

  // กำหนดโครงสร้างของ Theme
  export interface Theme {
    colorMode: Colormode;
    // สามารถเพิ่ม properties อื่นๆ ที่จำเป็นต่อการใช้งาน
    primaryColor?: string;
    backgroundColor?: string;
    // ... properties อื่นๆ ตามที่ต้องการ
  }

  // export constants และ functions ที่เราใช้จาก package
  export const jupyterTheme: Theme;
}
