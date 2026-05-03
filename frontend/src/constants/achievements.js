import nachaloNachalImage from '../assets/achievement-nachalo-nachal-icon.svg';
import pervayaKrovImage from '../assets/achievement-pervaya-krov-icon.svg';
import daTySeniorImage from '../assets/achievement-da-ty-senior-icon.svg';
import legendaRevyuImage from '../assets/achievement-legenda-revyu-icon.svg';
import vlyublyonVIIImage from '../assets/achievement-vlyublyon-v-II-icon.svg';
import pochtiYandexImage from '../assets/achievement-pochti-yandex-icon.svg';
import sonDlyaSlabykhImage from '../assets/achievement-son-dlya-slabykh-icon.svg';
import bespodobnyImage from '../assets/achievement-bespodobny-icon.svg';
import vosstanieMashinnImage from '../assets/achievement-vosstanie-mashinn-icon.svg';
import zhestokiyMirImage from '../assets/achievement-zhestokiy-mir-icon.svg';
import nelzyaSdatImage from '../assets/achievement-nelzya-sdat-icon.svg';
import krikTishinyImage from '../assets/achievement-krik-tishiny-icon.svg';
import deloHrabryhImage from '../assets/achievement-delo-hrabryh-icon.svg';
import opytnyyYuzerImage from '../assets/achievement-opytnyy-yuzer-icon.svg';
import poraByVOtpuskImage from '../assets/achievement-pora-by-v-otpusk-icon.svg';
import skolkoSkolkoImage from '../assets/achievement-skolko-skolko-icon.svg';
import nelovkoVyshloImage from '../assets/achievement-nelovko-vyshlo-icon.svg';
import zvukSvobodyImage from '../assets/achievement-zvuk-svobody-icon.svg';

export const ACHIEVEMENTS = [
  { id: 1, image: nachaloNachalImage, name: 'Начало начал', description: 'Сдать первую задачу', visible: true },
  { id: 2, image: pervayaKrovImage, name: 'Первая кровь', description: 'Отправить первое ревью', visible: true },
  { id: 3, image: daTySeniorImage, name: 'Да ты Сеньор', description: 'Отправить на ревью 50 задач', visible: true },
  { id: 4, image: legendaRevyuImage, name: 'Легенда ревью', description: 'Завершить 100 ревью', visible: true },
  { id: 5, image: vlyublyonVIIImage, name: 'Влюблён в ИИ', description: 'Завершить 10 задач только с AI-проверкой', visible: true },
  { id: 6, image: pochtiYandexImage, name: 'Почти Яндекс', description: 'Создать 10 проектов в одной организации', visible: true },
  { id: 7, image: sonDlyaSlabykhImage, name: 'Сон для слабых', description: 'Закрыть задачу в промежутке 00:00-06:00', visible: true },
  { id: 8, image: bespodobnyImage, name: 'Бесподобный', description: 'Получить суммарную оценку 5 от всех ревьюверов', visible: true },
  { id: 9, image: vosstanieMashinnImage, name: 'Восстание машин', description: 'Получить от AI-ревьювера оценку 1 балл по любому критерию', visible: true },
  { id: 10, image: zhestokiyMirImage, name: 'Жестокий мир', description: 'Получить среднюю оценку ревью ниже 3', visible: false },
  { id: 11, image: nelzyaSdatImage, name: 'Нельзя сдать пятьсот миллионов задач, не получив ни одного плохого отзыва', description: 'Получить оценку 1 или 2 за любой критерий', visible: false },
  { id: 12, image: krikTishinyImage, name: 'Крик тишины', description: 'Отправить ревью без inline-комментария', visible: false },
  { id: 13, image: deloHrabryhImage, name: 'Дело храбрых', description: 'Отправить жалобу на ревью', visible: false },
  { id: 14, image: opytnyyYuzerImage, name: 'Опытный юзер', description: 'Набрать 500 баллов', visible: true },
  { id: 15, image: poraByVOtpuskImage, name: 'Пора бы в отпуск…', description: 'Набрать 5000 баллов', visible: true },
  { id: 16, image: skolkoSkolkoImage, name: 'Сколько? Сколько?', description: 'Набрать 10000 баллов', visible: true },
  { id: 17, image: nelovkoVyshloImage, name: 'Неловко вышло…', description: 'Получить отрицательное количество баллов', visible: false },
  { id: 18, image: zvukSvobodyImage, name: 'Звук свободы', description: 'Не сдать задачу вовремя', visible: false }
];

export const MOCK_RECEIVED_ACHIEVEMENT_IDS = [1, 2, 5, 7, 8];
