export type Styles = {
  calendar: string;
  input: string;
  isError: string;
  popper: string;
};

export type ClassNames = keyof Styles;

declare const styles: Styles;

export default styles;
