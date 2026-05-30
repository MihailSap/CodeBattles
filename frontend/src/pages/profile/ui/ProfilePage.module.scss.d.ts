export type Styles = {
  action: string;
  actions: string;
  addSkillButton: string;
  avatarAction: string;
  clearButton: string;
  content: string;
  editButton: string;
  grid: string;
  isCancel: string;
  isEditable: string;
  isSave: string;
  loader: string;
  nameInput: string;
  root: string;
  section: string;
  sectionBody: string;
  sectionHead: string;
  sectionTitle: string;
  sectionTitleWrap: string;
  settingsButton: string;
  skillsOption: string;
  skillTag: string;
};

export type ClassNames = keyof Styles;

declare const styles: Styles;

export default styles;
