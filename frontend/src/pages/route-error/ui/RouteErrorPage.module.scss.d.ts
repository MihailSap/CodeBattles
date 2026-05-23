export type Styles = {
  bg: string;
  card: string;
  link: string;
  root: string;
  text: string;
  title: string;
};

export type ClassNames = keyof Styles;

declare const styles: Styles;

export default styles;
