export type Styles = {
  backdrop: string;
  close: string;
  content: string;
  error: string;
  field: string;
  footer: string;
  formFields: string;
  head: string;
  input: string;
  isError: string;
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
