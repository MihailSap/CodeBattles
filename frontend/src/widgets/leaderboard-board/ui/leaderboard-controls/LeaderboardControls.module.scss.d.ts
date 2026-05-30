export type Styles = {
  actions: string;
  dropdownMenu: string;
  dropdowns: string;
  dropdownTrigger: string;
  myRating: string;
  root: string;
  search: string;
};

export type ClassNames = keyof Styles;

declare const styles: Styles;

export default styles;
