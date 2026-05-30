export type Styles = {
  btn: string;
  btnReadonly: string;
  charCount: string;
  checkbox: string;
  checkboxLabel: string;
  field: string;
  fields: string;
  fieldVertical: string;
  isApproved: string;
  isReadonly: string;
  isRework: string;
  label: string;
  radioInput: string;
  radioLabel: string;
  radios: string;
  root: string;
  starSelector: string;
  submitBtn: string;
  textarea: string;
  verdictText: string;
  wrapper: string;
};

export type ClassNames = keyof Styles;

declare const styles: Styles;

export default styles;
