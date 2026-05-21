export type Styles = {
  actions: string;
  bg: string;
  card: string;
  code: string;
  link: string;
  root: string;
  text: string;
  title: string;
};

export type ClassNames = keyof Styles;

declare const styles: Styles;

export default styles;
