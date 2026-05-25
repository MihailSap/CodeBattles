export type Styles = {
  action: string;
  actions: string;
  editButton: string;
  isCancel: string;
  isSave: string;
  section: string;
  sectionBody: string;
  sectionHead: string;
  sectionTitle: string;
  sectionTitleWrap: string;
};

export type ClassNames = keyof Styles;

declare const styles: Styles;

export default styles;
