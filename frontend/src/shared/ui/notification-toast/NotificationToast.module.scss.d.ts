export type Styles = {
  close: string;
  content: string;
  icon: string;
  isVisible: string;
  meta: string;
  notificationToastProgress: string;
  progress: string;
  root: string;
  text: string;
  time: string;
  title: string;
};

export type ClassNames = keyof Styles;

declare const styles: Styles;

export default styles;
