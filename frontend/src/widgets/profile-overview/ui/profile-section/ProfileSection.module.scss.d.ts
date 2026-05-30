export type Styles = {
  avatar: string;
  avatarAction: string;
  avatarActions: string;
  avatarWrap: string;
  body: string;
  isAccent: string;
  isDanger: string;
  isEditable: string;
  isProfile: string;
  label: string;
  nameInput: string;
  section: string;
  userInfo: string;
  userRow: string;
  value: string;
};

export type ClassNames = keyof Styles;

declare const styles: Styles;

export default styles;
