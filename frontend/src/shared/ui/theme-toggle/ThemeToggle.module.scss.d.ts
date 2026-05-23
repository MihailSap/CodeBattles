export type Styles = {
  icon: string;
  isDark: string;
  isLight: string;
  isMoon: string;
  isSun: string;
  root: string;
  thumb: string;
};

export type ClassNames = keyof Styles;

declare const styles: Styles;

export default styles;
