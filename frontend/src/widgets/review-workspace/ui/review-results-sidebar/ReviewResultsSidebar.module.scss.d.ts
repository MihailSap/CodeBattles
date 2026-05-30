export type Styles = {
  block: string;
  content: string;
  dropdownWrap: string;
  field: string;
  high: string;
  isApproved: string;
  isCenter: string;
  isCompact: string;
  isRework: string;
  label: string;
  labelSmall: string;
  low: string;
  medium: string;
  menu: string;
  none: string;
  root: string;
  severity: string;
  star: string;
  starRating: string;
  subField: string;
  text: string;
  textBold: string;
  title: string;
  trigger: string;
  verdict: string;
};

export type ClassNames = keyof Styles;

declare const styles: Styles;

export default styles;
