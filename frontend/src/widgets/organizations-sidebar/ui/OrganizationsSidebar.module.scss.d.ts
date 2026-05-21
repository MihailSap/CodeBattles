export type Styles = {
  close: string;
  head: string;
  isClosed: string;
  isEmpty: string;
  isLast: string;
  isLoading: string;
  isMember: string;
  isOpen: string;
  isOwner: string;
  item: string;
  itemLink: string;
  list: string;
  logo: string;
  meta: string;
  name: string;
  organizationsSidebarClosed: string;
  organizationsSidebarOpen: string;
  overlay: string;
  projects: string;
  role: string;
  root: string;
  title: string;
};

export type ClassNames = keyof Styles;

declare const styles: Styles;

export default styles;
