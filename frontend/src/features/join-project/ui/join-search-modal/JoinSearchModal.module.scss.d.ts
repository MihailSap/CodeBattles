export type Styles = {
  action: string;
  close: string;
  content: string;
  head: string;
  isEmpty: string;
  isLast: string;
  isLoading: string;
  item: string;
  itemRow: string;
  list: string;
  logo: string;
  main: string;
  name: string;
  organization: string;
  overlay: string;
  root: string;
  search: string;
  status: string;
  title: string;
  value: string;
};

export type ClassNames = keyof Styles;

declare const styles: Styles;

export default styles;
