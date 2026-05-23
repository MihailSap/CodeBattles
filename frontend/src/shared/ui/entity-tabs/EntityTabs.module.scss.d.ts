export type Styles = {
  isActive: string;
  root: string;
  slider: string;
  tab: string;
  wrap: string;
};

export type ClassNames = keyof Styles;

declare const styles: Styles;

export default styles;
