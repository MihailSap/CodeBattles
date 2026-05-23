export type Styles = {
  commentGlyph: string;
  commentLine: string;
  commentWidget: string;
  container: string;
  isAi: string;
};

export type ClassNames = keyof Styles;

declare const styles: Styles;

export default styles;
