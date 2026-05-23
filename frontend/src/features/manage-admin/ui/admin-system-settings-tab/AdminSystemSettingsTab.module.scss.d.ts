export type Styles = {
  bar: string;
  barDislikes: string;
  barLikes: string;
  barRow: string;
  bars: string;
  barTrack: string;
  chart: string;
  charts: string;
  deadlineField: string;
  field: string;
  grid: string;
  isCancel: string;
  isDislikes: string;
  isLikes: string;
  isRatio: string;
  isSave: string;
  numberControl: string;
  promptActions: string;
  promptButton: string;
  promptField: string;
  ratioBar: string;
  ratioLegend: string;
  ratioLegendItem: string;
  ratioLegendItemDislikes: string;
  ratioLegendItemLikes: string;
  ratioSegment: string;
  ratioSegmentDislikes: string;
  ratioSegmentLikes: string;
  root: string;
  stat: string;
  stats: string;
  topic: string;
  topics: string;
};

export type ClassNames = keyof Styles;

declare const styles: Styles;

export default styles;
