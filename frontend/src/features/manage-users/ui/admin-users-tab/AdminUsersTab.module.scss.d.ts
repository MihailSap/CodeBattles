export type Styles = {
  actionButton: string;
  actions: string;
  checkbox: string;
  emptyCell: string;
  isAdmin: string;
  isApprove: string;
  isDelete: string;
  isError: string;
  isMe: string;
  loadingCell: string;
  pagination: string;
  paginationButton: string;
  paginationLabel: string;
  root: string;
  row: string;
  searchInput: string;
  searchWrap: string;
  spinner: string;
  table: string;
  tableLoader: string;
  tableWrap: string;
  title: string;
  top: string;
};

export type ClassNames = keyof Styles;

declare const styles: Styles;

export default styles;
