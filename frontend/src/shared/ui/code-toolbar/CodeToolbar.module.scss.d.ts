export type Styles = {
  isActive: string;
  isDark: string;
  isSystem: string;
  option: string;
  path: string;
  root: string;
  switch: string;
  thumb: string;
};

export type ClassNames = keyof Styles;

declare const styles: Styles;

export default styles;
