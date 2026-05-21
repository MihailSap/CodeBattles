export type Styles = {
  close: string;
  error: string;
  field: string;
  form: string;
  head: string;
  iconBtn: string;
  input: string;
  isDelete: string;
  isError: string;
  isUpload: string;
  left: string;
  logo: string;
  logoActions: string;
  logoBox: string;
  logoPlaceholder: string;
  main: string;
  overlay: string;
  right: string;
  root: string;
  submit: string;
  textarea: string;
  title: string;
};

export type ClassNames = keyof Styles;

declare const styles: Styles;

export default styles;
