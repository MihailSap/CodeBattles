export type Styles = {
  action: string;
  actions: string;
  body: string;
  comment: string;
  isActive: string;
  isApprove: string;
  isEmpty: string;
  isError: string;
  isReject: string;
  item: string;
  label: string;
  list: string;
  loader: string;
  meta: string;
  pagination: string;
  paginationButton: string;
  paginationEllipsis: string;
  paginationLabel: string;
  root: string;
  spinner: string;
  subtitle: string;
  title: string;
  top: string;
};

export type ClassNames = keyof Styles;

declare const styles: Styles;

export default styles;
