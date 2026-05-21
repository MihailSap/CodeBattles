export type Styles = {
  content: string;
  isError: string;
  isSuccess: string;
  logo: string;
  status: string;
  title: string;
};

export type ClassNames = keyof Styles;

declare const styles: Styles;

export default styles;
