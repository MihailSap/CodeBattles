export type Styles = {
  actions: string;
  arrow: string;
  arrowSlot: string;
  content: string;
  emptyOrg: string;
  grid: string;
  isActive: string;
  isCreate: string;
  isDisabled: string;
  isDouble: string;
  isEmpty: string;
  isHidden: string;
  isJoin: string;
  isLeft: string;
  isOrg: string;
  isSingle: string;
  isSingleItem: string;
  isWithOrg: string;
  loader: string;
  loadMore: string;
  organizationsSlide: string;
  organizationsTrack: string;
  organizationsViewport: string;
  organizationsWrap: string;
  root: string;
  search: string;
  searchWrap: string;
  section: string;
  sectionWrap: string;
  sideAction: string;
  switch: string;
  switchOption: string;
  switchThumb: string;
  title: string;
  toolbar: string;
  toolbarLeft: string;
  toolbarWrap: string;
};

export type ClassNames = keyof Styles;

declare const styles: Styles;

export default styles;
