export type Styles = {
  actions: string;
  adminHeader: string;
  adminTabs: string;
  button: string;
  content: string;
  isActive: string;
  link: string;
  linksContainer: string;
  logout: string;
  root: string;
  themeToggle: string;
  title: string;
  titleBlock: string;
};

export type ClassNames = keyof Styles;

declare const styles: Styles;

export default styles;
