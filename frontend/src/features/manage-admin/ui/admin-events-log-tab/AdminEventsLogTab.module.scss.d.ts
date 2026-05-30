export type Styles = {
  dateField: string;
  field: string;
  fields: string;
  filters: string;
  isCommentComplaintApproved: string;
  isCommentComplaintCreated: string;
  isCommentComplaintRejected: string;
  isLeaderboardRatingReset: string;
  isSystemAiPromptChanged: string;
  isSystemReviewDeadlineChanged: string;
  isWide: string;
  item: string;
  itemHead: string;
  list: string;
  reset: string;
  type: string;
  typeFilter: string;
  typeLabel: string;
  typeMenu: string;
  typeTrigger: string;
};

export type ClassNames = keyof Styles;

declare const styles: Styles;

export default styles;
