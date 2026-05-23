export type Styles = {
  arrow: string;
  body: string;
  content: string;
  header: string;
  isCollapsed: string;
  isNested: string;
  isOpen: string;
  root: string;
  tag: string;
  title: string;
};

export type ClassNames = keyof Styles;

declare const styles: Styles;

export default styles;
