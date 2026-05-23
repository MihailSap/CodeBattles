export type Styles = {
  acceptedBlock: string;
  acceptedPercent: string;
  body: string;
  grid: string;
  isError: string;
  isStatistics: string;
  isSuccess: string;
  isWarning: string;
  starsRow: string;
  statCard: string;
  statTitle: string;
};

export type ClassNames = keyof Styles;

declare const styles: Styles;

export default styles;
