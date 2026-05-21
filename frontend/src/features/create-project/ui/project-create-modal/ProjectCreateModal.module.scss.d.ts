export type Styles = {
  backdrop: string;
  close: string;
  content: string;
  error: string;
  field: string;
  fields: string;
  head: string;
  input: string;
  isError: string;
  radio: string;
  radioItem: string;
  radioRow: string;
  root: string;
  section: string;
  sectionTitle: string;
  submit: string;
  textarea: string;
  title: string;
};

export type ClassNames = keyof Styles;

declare const styles: Styles;

export default styles;
