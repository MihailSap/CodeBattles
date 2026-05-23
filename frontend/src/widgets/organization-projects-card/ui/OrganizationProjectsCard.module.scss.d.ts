export type Styles = {
  create: string;
  hiddenCount: string;
  isEmpty: string;
  isStub: string;
  projects: string;
  root: string;
  title: string;
};

export type ClassNames = keyof Styles;

declare const styles: Styles;

export default styles;
