export type Styles = {
  children: string;
  commentDot: string;
  fileIcon: string;
  folderIcon: string;
  icon: string;
  isSelected: string;
  name: string;
  node: string;
  root: string;
  wrapper: string;
};

export type ClassNames = keyof Styles;

declare const styles: Styles;

export default styles;
