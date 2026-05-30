export type Styles = {
  backdrop: string;
  close: string;
  content: string;
  head: string;
  isError: string;
  radio: string;
  radioItem: string;
  radios: string;
  result: string;
  root: string;
  section: string;
  sectionTitle: string;
  submit: string;
  title: string;
};

export type ClassNames = keyof Styles;

declare const styles: Styles;

export default styles;
