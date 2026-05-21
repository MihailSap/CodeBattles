export type Styles = {
  block: string;
  content: string;
  controls: string;
  loader: string;
  message: string;
  root: string;
  section: string;
  tab: string;
  table: string;
  tabs: string;
  title: string;
  wrap: string;
};

export type ClassNames = keyof Styles;

declare const styles: Styles;

export default styles;
