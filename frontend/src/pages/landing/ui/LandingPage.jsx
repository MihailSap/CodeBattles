import { Link } from 'react-router-dom';
import Header from '@/widgets/app-header';
import { useAuth } from '@/entities/session';
import { ROUTES } from '@/shared/config/routes';
import {
  AIIcon,
  ArrowIcon,
  CheckIcon,
  CommentIcon,
  FileIcon,
  RefreshCycleIcon,
  StarIcon
} from '@/shared/ui/icons';
import CodeReviewIllustration from './CodeReviewIllustration';
import LandingHeader from './LandingHeader';
import './LandingPage.css';

const FEATURES = [
  {
    title: 'Взаимное ревью',
    text: 'Анонимно до завершения цикла, с честным распределением задач между участниками.',
    icon: RefreshCycleIcon
  },
  {
    title: 'AI-ревью',
    text: 'Автоматический анализ кода, рекомендации по улучшению и подсветка рисков.',
    icon: AIIcon
  },
  {
    title: 'Геймификация',
    text: 'Баллы, достижения и лидерборды помогают держать темп и видеть прогресс.',
    icon: StarIcon
  },
  {
    title: 'Удобный интерфейс',
    text: 'Inline-комментарии, обсуждения, итоговые оценки и прозрачный статус ревью.',
    icon: CommentIcon
  }
];

const STEPS = [
  'Регистрация через email или GitHub/GitLab.',
  'Создайте проект или присоединитесь по ссылке.',
  'Загрузите решение из Git или вручную.',
  'Получите ревью: 2-3 ревьюера + AI проанализируют код.',
  'Обсудите замечания, оставляйте комментарии и закрывайте треды.',
  'Завершите ревью, получите баллы и рейтинг.'
];

const BENEFITS = [
  'Обучение без ментора через ревью коллег.',
  'Объективная оценка вашего кода через Quality Score.',
  'Возможность помогать другим и расти в сообществе.',
  'Интеграция с Git и поддержка популярных языков.'
];

const LandingPage = () => {
  const { isAuthenticated } = useAuth();

  const handleLearnMore = () => {
    document.getElementById('landing-about')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="landing-shell">
      {isAuthenticated ? <Header /> : <LandingHeader />}

      <main className="landing-page">
        <section className="landing-hero" aria-labelledby="landing-title">
          <div className="landing-hero__content">
            <p className="landing-hero__eyebrow">
              <FileIcon />
              CodeMasters review network
            </p>
            <h1 className="landing-hero__title" id="landing-title">
              Peer-to-peer code review с AI-помощью
            </h1>
            <p className="landing-hero__lead">
              Повышайте качество кода, развивайте навыки анализа и получайте автоматические рекомендации от ИИ.
              Присоединяйтесь к сообществу разработчиков.
            </p>

            <div className="landing-hero__actions">
              {!isAuthenticated && (
                <Link className="landing-button landing-button--primary" to={ROUTES.register}>
                  Начать бесплатно
                  <ArrowIcon />
                </Link>
              )}
              <button className="landing-button landing-button--ghost" type="button" onClick={handleLearnMore}>
                Узнать больше
              </button>
            </div>
          </div>

          <CodeReviewIllustration />
        </section>

        <section className="landing-section landing-section--about" id="landing-about" aria-labelledby="landing-about-title">
          <div className="landing-section__mark">
            <AIIcon />
          </div>
          <div className="landing-section__body">
            <p className="landing-section__kicker">Что это такое?</p>
            <h2 className="landing-section__title" id="landing-about-title">
              Платформа для честного ревью и практики анализа кода
            </h2>
            <p className="landing-section__text">
              Разработчики ревьюют код друг друга, а ИИ помогает находить ошибки, нарушения SOLID и проблемы
              производительности. Вы получаете объективную обратную связь и учитесь на чужих решениях.
            </p>
          </div>
        </section>

        <section className="landing-section landing-section--stacked" aria-labelledby="landing-features-title">
          <div className="landing-section__heading">
            <p className="landing-section__kicker">Ключевые возможности</p>
            <h2 className="landing-section__title" id="landing-features-title">
              Все, что нужно для сильного review-cycle
            </h2>
          </div>

          <div className="landing-feature-grid">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;

              return (
                <article className="landing-feature-card" key={feature.title}>
                  <span className="landing-feature-card__icon">
                    <Icon />
                  </span>
                  <h3 className="landing-feature-card__title">{feature.title}</h3>
                  <p className="landing-feature-card__text">{feature.text}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="landing-section landing-section--workflow" aria-labelledby="landing-workflow-title">
          <div className="landing-section__heading">
            <p className="landing-section__kicker">Как это работает?</p>
            <h2 className="landing-section__title" id="landing-workflow-title">
              От загрузки решения до финального рейтинга
            </h2>
          </div>

          <ol className="landing-steps">
            {STEPS.map((step, index) => (
              <li className="landing-steps__item" key={step}>
                <span className="landing-steps__number">{String(index + 1).padStart(2, '0')}</span>
                <span className="landing-steps__text">{step}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="landing-section landing-section--benefits" aria-labelledby="landing-benefits-title">
          <div className="landing-section__mark landing-section__mark--success">
            <CheckIcon />
          </div>
          <div className="landing-section__body">
            <p className="landing-section__kicker">Преимущества для разработчиков</p>
            <h2 className="landing-section__title" id="landing-benefits-title">
              Растите быстрее, чем в одиночку
            </h2>
            <ul className="landing-benefits">
              {BENEFITS.map((benefit) => (
                <li className="landing-benefits__item" key={benefit}>
                  <CheckIcon />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {!isAuthenticated && (
          <section className="landing-cta" aria-labelledby="landing-cta-title">
            <div>
              <p className="landing-section__kicker">Готовы попробовать?</p>
              <h2 className="landing-cta__title" id="landing-cta-title">
                Присоединяйтесь к сотням разработчиков.
              </h2>
            </div>
            <Link className="landing-button landing-button--primary landing-cta__button" to={ROUTES.register}>
              Зарегистрироваться
              <ArrowIcon />
            </Link>
          </section>
        )}
      </main>
    </div>
  );
};

export default LandingPage;
