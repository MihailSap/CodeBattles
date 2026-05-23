export type Styles = {
  authContent: string;
  authForm: string;
  authHeader: string;
  authInput: string;
  authModeSwitch: string;
  authSocial: string;
  bg: string;
  button: string;
  card: string;
  error: string;
  group: string;
  inputs: string;
  isActive: string;
  isError: string;
  isGithub: string;
  isGitlab: string;
  isLogin: string;
  left: string;
  link: string;
  logo: string;
  logoLink: string;
  option: string;
  registerSuccess: string;
  right: string;
  root: string;
  serverError: string;
  spacer: string;
  submit: string;
  text: string;
  thumb: string;
  toggle: string;
  wrap: string;
};

export type ClassNames = keyof Styles;

declare const styles: Styles;

export default styles;
