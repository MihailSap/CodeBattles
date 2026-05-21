export type Styles = {
  actions: string;
  backdrop: string;
  close: string;
  content: string;
  head: string;
  radioInput: string;
  radioLabel: string;
  radioText: string;
  reasons: string;
  root: string;
  submitBtn: string;
  textarea: string;
  title: string;
};

export type ClassNames = keyof Styles;

declare const styles: Styles;

export default styles;
