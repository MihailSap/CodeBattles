export type Styles = {
  achievementCheck: string;
  achievementContent: string;
  achievementDescription: string;
  achievementImage: string;
  achievementItem: string;
  achievementName: string;
  body: string;
  empty: string;
  isAchievements: string;
  isNotReceived: string;
  isReceived: string;
  list: string;
  section: string;
};

export type ClassNames = keyof Styles;

declare const styles: Styles;

export default styles;
