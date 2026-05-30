export type Styles = {
  backBtn: string;
  card: string;
  cardTitle: string;
  colCenter: string;
  colLeft: string;
  colRight: string;
  content2: string;
  dates: string;
  deadline: string;
  deadlineError: string;
  infoLabel: string;
  infoLine: string;
  isError: string;
  isOverdue: string;
  isPending: string;
  isSuccess: string;
  isWarning: string;
  loader: string;
  metaValue: string;
  metrics: string;
  metricValue: string;
  projectInfo: string;
  root: string;
  sectionCard: string;
  submittedCard: string;
  submittedText: string;
  success: string;
  workspace: string;
};

export type ClassNames = keyof Styles;

declare const styles: Styles;

export default styles;
