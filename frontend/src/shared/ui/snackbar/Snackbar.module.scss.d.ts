export type Styles = {
  close: string;
  isError: string;
  isHidden: string;
  isSuccess: string;
  isVisible: string;
  message: string;
  progress: string;
  root: string;
  snackbarProgressShrink: string;
  snackbarSlideIn: string;
  snackbarSlideOut: string;
};

export type ClassNames = keyof Styles;

declare const styles: Styles;

export default styles;
