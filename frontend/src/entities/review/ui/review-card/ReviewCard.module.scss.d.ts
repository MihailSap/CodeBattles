export type Styles = {
  bottom: string;
  checkedIcon: string;
  comments: string;
  commentsCount: string;
  commentsIcon: string;
  deadlineValue: string;
  isCompleted: string;
  isError: string;
  isInProgress: string;
  isNew: string;
  isSuccess: string;
  isWarning: string;
  label: string;
  metaLine: string;
  metaRight: string;
  root: string;
  status: string;
  title: string;
  titleWrap: string;
  top: string;
  value: string;
};

export type ClassNames = keyof Styles;

declare const styles: Styles;

export default styles;
