export type Styles = {
  dropdown: string;
  input: string;
  isEmpty: string;
  option: string;
  root: string;
};

export type ClassNames = keyof Styles;

declare const styles: Styles;

export default styles;
