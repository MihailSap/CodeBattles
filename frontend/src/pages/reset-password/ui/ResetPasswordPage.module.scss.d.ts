export type Styles = {
  authInputError: string;
  inputs: string;
  isError: string;
  isSuccess: string;
  result: string;
  root: string;
  title: string;
  top: string;
};

export type ClassNames = keyof Styles;

declare const styles: Styles;

export default styles;
