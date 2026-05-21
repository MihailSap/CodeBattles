export type Styles = {
  actions: string;
  dropdowns: string;
  menu: string;
  myRating: string;
  root: string;
  search: string;
  trigger: string;
};

export type ClassNames = keyof Styles;

declare const styles: Styles;

export default styles;
