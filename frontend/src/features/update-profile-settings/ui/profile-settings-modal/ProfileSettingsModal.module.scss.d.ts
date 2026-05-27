export type Styles = {
  account: string;
  accountLogin: string;
  accountRow: string;
  accounts: string;
  accountTitle: string;
  actionButton: string;
  checkboxRow: string;
  close: string;
  grid: string;
  header: string;
  input: string;
  inputError: string;
  inputGroup: string;
  inputs: string;
  isAccounts: string;
  isError: string;
  isGithub: string;
  isLink: string;
  isNotifications: string;
  isReset: string;
  isSecurity: string;
  loadError: string;
  notifications: string;
  overlay: string;
  root: string;
  section: string;
  sectionTitle: string;
  securityForm: string;
  title: string;
  unlinkButton: string;
};

export type ClassNames = keyof Styles;

declare const styles: Styles;

export default styles;
