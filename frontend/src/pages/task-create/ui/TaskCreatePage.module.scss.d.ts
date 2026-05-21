export type Styles = {
  back: string;
  block: string;
  blockTitle: string;
  content: string;
  error: string;
  field: string;
  fields: string;
  fieldTitle: string;
  form: string;
  input: string;
  isError: string;
  loader: string;
  radio: string;
  radioItem: string;
  radioList: string;
  root: string;
  submit: string;
  textarea: string;
  title: string;
};

export type ClassNames = keyof Styles;

declare const styles: Styles;

export default styles;
