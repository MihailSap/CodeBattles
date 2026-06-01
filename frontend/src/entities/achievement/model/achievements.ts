import bespodobnyImage from '@/shared/assets/achievement-bespodobny-icon.svg';
import daTySeniorImage from '@/shared/assets/achievement-da-ty-senior-icon.svg';
import deloHrabryhImage from '@/shared/assets/achievement-delo-hrabryh-icon.svg';
import krikTishinyImage from '@/shared/assets/achievement-krik-tishiny-icon.svg';
import legendaRevyuImage from '@/shared/assets/achievement-legenda-revyu-icon.svg';
import nachaloNachalImage from '@/shared/assets/achievement-nachalo-nachal-icon.svg';
import nelovkoVyshloImage from '@/shared/assets/achievement-nelovko-vyshlo-icon.svg';
import nelzyaSdatImage from '@/shared/assets/achievement-nelzya-sdat-icon.svg';
import opytnyyYuzerImage from '@/shared/assets/achievement-opytnyy-yuzer-icon.svg';
import pervayaKrovImage from '@/shared/assets/achievement-pervaya-krov-icon.svg';
import pochtiYandexImage from '@/shared/assets/achievement-pochti-yandex-icon.svg';
import poraByVOtpuskImage from '@/shared/assets/achievement-pora-by-v-otpusk-icon.svg';
import skolkoSkolkoImage from '@/shared/assets/achievement-skolko-skolko-icon.svg';
import sonDlyaSlabykhImage from '@/shared/assets/achievement-son-dlya-slabykh-icon.svg';
import vlyublyonVIIImage from '@/shared/assets/achievement-vlyublyon-v-II-icon.svg';
import vosstanieMashinnImage from '@/shared/assets/achievement-vosstanie-mashinn-icon.svg';
import zhestokiyMirImage from '@/shared/assets/achievement-zhestokiy-mir-icon.svg';
import zvukSvobodyImage from '@/shared/assets/achievement-zvuk-svobody-icon.svg';

export interface Achievement {
  id: number;
  image: string;
  name: string;
  description: string;
  visible: boolean;
}

const ACHIEVEMENT_IMAGE_BY_FILE_NAME: Record<string, string> = {
  'achievement-bespodobny-icon.svg': bespodobnyImage,
  'achievement-da-ty-senior-icon.svg': daTySeniorImage,
  'achievement-delo-hrabryh-icon.svg': deloHrabryhImage,
  'achievement-krik-tishiny-icon.svg': krikTishinyImage,
  'achievement-legenda-revyu-icon.svg': legendaRevyuImage,
  'achievement-nachalo-nachal-icon.svg': nachaloNachalImage,
  'achievement-nelovko-vyshlo-icon.svg': nelovkoVyshloImage,
  'achievement-nelzya-sdat-icon.svg': nelzyaSdatImage,
  'achievement-opytnyy-yuzer-icon.svg': opytnyyYuzerImage,
  'achievement-pervaya-krov-icon.svg': pervayaKrovImage,
  'achievement-pochti-yandex-icon.svg': pochtiYandexImage,
  'achievement-pora-by-v-otpusk-icon.svg': poraByVOtpuskImage,
  'achievement-skolko-skolko-icon.svg': skolkoSkolkoImage,
  'achievement-son-dlya-slabykh-icon.svg': sonDlyaSlabykhImage,
  'achievement-vlyublyon-v-II-icon.svg': vlyublyonVIIImage,
  'achievement-vosstanie-mashinn-icon.svg': vosstanieMashinnImage,
  'achievement-zhestokiy-mir-icon.svg': zhestokiyMirImage,
  'achievement-zvuk-svobody-icon.svg': zvukSvobodyImage,
};

export const resolveAchievementImage = (image: string): string => {
  return ACHIEVEMENT_IMAGE_BY_FILE_NAME[image] ?? image;
};
