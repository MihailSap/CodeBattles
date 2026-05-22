export type Styles = {
  backdrop: string;
  close: string;
  content: string;
  field: string;
  fieldLabel: string;
  fieldMenu: string;
  fieldMenuUp: string;
  fieldTrigger: string;
  footer: string;
  formFields: string;
  head: string;
  root: string;
  submitBtn: string;
  submitIcon: string;
  tabContent: string;
  tabsWrap: string;
  title: string;
};

export type ClassNames = keyof Styles;

declare const styles: Styles;

export default styles;
