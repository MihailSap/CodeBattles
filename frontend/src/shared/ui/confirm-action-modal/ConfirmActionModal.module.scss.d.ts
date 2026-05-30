export type Styles = {
  actions: string;
  backdrop: string;
  button: string;
  description: string;
  isConfirmDelete: string;
  isConfirmSuccess: string;
  root: string;
  title: string;
};

export type ClassNames = keyof Styles;

declare const styles: Styles;

export default styles;
