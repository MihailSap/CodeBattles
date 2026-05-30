export type Styles = {
  isAccept: string;
  isReject: string;
  logo: string;
  participantsSwitch: string;
  projectTasks: string;
  requestActions: string;
  requestButton: string;
  settingsLogo: string;
  settingsLogoUpload: string;
  settingsLogoWrap: string;
};

export type ClassNames = keyof Styles;

declare const styles: Styles;

export default styles;
