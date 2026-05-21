export type Styles = {
  addSkillButton: string;
  body: string;
  clearButton: string;
  isEditable: string;
  isEmpty: string;
  isFixed: string;
  isPortal: string;
  isRight: string;
  isSkills: string;
  isTop: string;
  list: string;
  option: string;
  popup: string;
  popupWrap: string;
  skillGroup: string;
  skillGroupHead: string;
  skillTag: string;
  skillTitle: string;
};

export type ClassNames = keyof Styles;

declare const styles: Styles;

export default styles;
