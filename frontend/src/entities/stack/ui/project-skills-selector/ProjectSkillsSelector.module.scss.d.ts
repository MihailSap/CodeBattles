export type Styles = {
  add: string;
  clear: string;
  createModal: string;
  head: string;
  isEmpty: string;
  isPortal: string;
  isRight: string;
  isTop: string;
  list: string;
  option: string;
  popup: string;
  popupWrap: string;
  root: string;
  tag: string;
  title: string;
};

export type ClassNames = keyof Styles;

declare const styles: Styles;

export default styles;
