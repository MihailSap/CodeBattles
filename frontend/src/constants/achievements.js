import achievementImage from '../assets/achievement-icon.svg';

export const ACHIEVEMENTS = [
  { id: 1, image: achievementImage, name: 'Начало начал', description: 'Сдать первую задачу' },
  { id: 2, image: achievementImage, name: 'Первая кровь', description: 'Отправить первое ревью' },
  { id: 3, image: achievementImage, name: 'Да ты Сеньор', description: 'Отправить на ревью 50 задач' },
  { id: 4, image: achievementImage, name: 'Легенда ревью', description: 'Завершить 100 ревью' },
  { id: 5, image: achievementImage, name: 'Влюблён в ИИ', description: 'Завершить 10 задач только с AI-проверкой' },
  { id: 6, image: achievementImage, name: 'Почти Яндекс', description: 'Создать 10 проектов в одной организации' },
  { id: 7, image: achievementImage, name: 'Сон для слабых', description: 'Закрыть задачу в промежутке 00:00-06:00' },
  { id: 8, image: achievementImage, name: 'Бесподобный', description: 'Получить суммарную оценку 5 от всех ревьюверов' }
];

export const MOCK_RECEIVED_ACHIEVEMENT_IDS = [1, 2, 5];
