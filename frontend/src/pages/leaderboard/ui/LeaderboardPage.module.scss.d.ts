export type Styles = {
  block: string;
  content: string;
  controls: string;
  loader: string;
  message: string;
  root: string;
  section: string;
  table: string;
  tabsTab: string;
  tabsWrap: string;
  title: string;
};

export type ClassNames = keyof Styles;

declare const styles: Styles;

export default styles;
