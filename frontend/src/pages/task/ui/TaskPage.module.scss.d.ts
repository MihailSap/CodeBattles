export type Styles = {
  assigneeAvatar: string;
  assigneeItem: string;
  assigneeLogin: string;
  assigneeMeta: string;
  assigneeName: string;
  assigneesList: string;
  assigneesWrap: string;
  offsetSection: string;
  reviewItem: string;
  reviewList: string;
  reviewTitle: string;
  solution: string;
  statusTag: string;
  taskPageContent: string;
};

export type ClassNames = keyof Styles;

declare const styles: Styles;

export default styles;
