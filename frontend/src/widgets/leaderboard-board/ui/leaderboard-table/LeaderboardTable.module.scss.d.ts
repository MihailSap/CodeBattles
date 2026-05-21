export type Styles = {
  avatar: string;
  cell: string;
  inner: string;
  isBronze: string;
  isCurrent: string;
  isEmpty: string;
  isGold: string;
  isHead: string;
  isSilver: string;
  isUser: string;
  name: string;
  rank: string;
  rankBronze: string;
  rankGold: string;
  rankSilver: string;
  resetButton: string;
  root: string;
  row: string;
  scroll: string;
  separator: string;
};

export type ClassNames = keyof Styles;

declare const styles: Styles;

export default styles;
