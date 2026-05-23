export type Styles = {
  card: string;
  cardText: string;
  cardTextError: string;
  cardTitle: string;
  checkboxLabel: string;
  colCenter: string;
  colLeft: string;
  colRight: string;
  content: string;
  fileTreeCard: string;
  finishButton: string;
  gitButton: string;
  isError: string;
  isSuccess: string;
  label: string;
  loader: string;
  loading: string;
  manualButton: string;
  metric: string;
  metricIcon: string;
  metricsBar: string;
  reviewerName: string;
  reviewersList: string;
  reviewersNames: string;
  reviewersTitle: string;
  root: string;
  underCode: string;
  uploadActions: string;
  uploadBlock: string;
  uploadText: string;
  value: string;
  waitingText: string;
};

export type ClassNames = keyof Styles;

declare const styles: Styles;

export default styles;
