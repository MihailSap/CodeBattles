export type Styles = {
  authInputError: string;
  back: string;
  description: string;
  inputs: string;
  isSuccess: string;
  title: string;
  top: string;
};

export type ClassNames = keyof Styles;

declare const styles: Styles;

export default styles;
