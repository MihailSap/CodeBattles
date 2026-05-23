export type Styles = {
  backdrop: string;
  close: string;
  content: string;
  field: string;
  footer: string;
  head: string;
  radioGroup: string;
  radioInput: string;
  radioLabel: string;
  radioText: string;
  root: string;
  row: string;
  submitBtn: string;
  textarea: string;
  title: string;
};

export type ClassNames = keyof Styles;

declare const styles: Styles;

export default styles;
