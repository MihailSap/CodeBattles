export type Styles = {
  block: string;
  blockTitle: string;
  clickableRow: string;
  content: string;
  deadline: string;
  dropdownMenu: string;
  dropdownTrigger: string;
  emptyText: string;
  filters: string;
  header: string;
  isError: string;
  isOverdueRow: string;
  isSuccess: string;
  isWarning: string;
  pageTitle: string;
  primaryLink: string;
  root: string;
  sectionCard: string;
  table: string;
  tableWrap: string;
  tabsTab: string;
  tabsWrap: string;
};

export type ClassNames = keyof Styles;

declare const styles: Styles;

export default styles;
