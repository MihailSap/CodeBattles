export type Styles = {
  isGuest: string;
  isMember: string;
  isOwner: string;
  privacy: string;
  role: string;
  root: string;
  tasks: string;
  title: string;
  titleRow: string;
};

export type ClassNames = keyof Styles;

declare const styles: Styles;

export default styles;
