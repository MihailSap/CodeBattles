export type Styles = {
  icon: string;
  isActive: string;
  isOpen: string;
  isPlaceholder: string;
  label: string;
  menu: string;
  option: string;
  optionCheck: string;
  root: string;
  trigger: string;
  value: string;
};

export type ClassNames = keyof Styles;

declare const styles: Styles;

export default styles;
