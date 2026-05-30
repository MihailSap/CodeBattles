export type Styles = {
  content: string;
  controls: string;
  controlsRow: string;
  filters: string;
  isEmpty: string;
  list: string;
  loader: string;
  projectsList: string;
  root: string;
  sections: string;
  title: string;
  total: string;
};

export type ClassNames = keyof Styles;

declare const styles: Styles;

export default styles;
