export type Styles = {
  avatar: string;
  clear: string;
  head: string;
  isEmpty: string;
  isOpen: string;
  isTop: string;
  login: string;
  meta: string;
  name: string;
  notFound: string;
  popup: string;
  root: string;
  search: string;
  selectedItem: string;
  selectedList: string;
  sentinel: string;
  taskPage: string;
  title: string;
  user: string;
  users: string;
};

export type ClassNames = keyof Styles;

declare const styles: Styles;

export default styles;
