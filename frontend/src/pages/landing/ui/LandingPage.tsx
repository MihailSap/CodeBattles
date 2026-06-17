import { Link } from 'react-router-dom';
import Header from '@/widgets/app-header';
import { useAuth } from '@/entities/session';
import { ROUTES } from '@/shared/config/routes';
import { AIIcon, ArrowIcon, CheckIcon, CommentIcon, FileIcon, RefreshCycleIcon, StarIcon } from '@/shared/ui/icons';
import CodeReviewIllustration from './CodeReviewIllustration';
import LandingHeader from './LandingHeader';
import landingPageStyles from './LandingPage.module.scss';

const FEATURES = [
  {
    title: 'Взаимное ревью',
    text: 'Анонимно до завершения цикла, с честным распределением задач между участниками.',
    icon: RefreshCycleIcon,
  },
  {
    title: 'AI-ревью',
    text: 'Автоматический анализ кода, рекомендации по улучшению и подсветка рисков.',
    icon: AIIcon,
  },
  {
    title: 'Геймификация',
    text: 'Баллы, достижения и лидерборды помогают держать темп и видеть прогресс.',
    icon: StarIcon,
  },
  {
    title: 'Удобный интерфейс',
    text: 'Inline-комментарии, обсуждения, итоговые оценки и прозрачный статус ревью.',
    icon: CommentIcon,
  },
];

const STEPS = [
  'Регистрация через email или GitHub.',
  'Создайте проект или присоединитесь по ссылке.',
  'Загрузите решение вручную или через GitHub.',
  'Получите ревью: 1-3 ревьюера + AI проанализируют код.',
  'Обсудите замечания, оставляйте комментарии и закрывайте треды.',
  'Завершите ревью, получите баллы и рейтинг.',
];

const BENEFITS = [
  'Обучение без ментора через ревью коллег.',
  'Объективная оценка вашего кода через Quality Score.',
  'Возможность помогать другим и расти в сообществе.',
  'Интеграция с GitHub и поддержка популярных языков.',
];

const LandingPage = () => {
  const { isAuthenticated } = useAuth();

  const handleLearnMore = () => {
    document.getElementById('landing-about')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  return (
    <div className={landingPageStyles.shell}>
      {isAuthenticated ? <Header /> : <LandingHeader />}

      <main className={landingPageStyles.landingPage}>
        <section className={landingPageStyles.landingHero} aria-labelledby="landing-title">
          <div className={landingPageStyles.content2}>
            <p className={landingPageStyles.eyebrow}>
              <FileIcon />
              CodeMasters review network
            </p>
            <h1 className={landingPageStyles.title} id="landing-title">
              Peer-to-peer code review с AI-помощью
            </h1>
            <p className={landingPageStyles.lead}>
              Повышайте качество кода, развивайте навыки анализа и получайте автоматические рекомендации от ИИ.
              Присоединяйтесь к сообществу разработчиков.
            </p>

            <div className={landingPageStyles.actions}>
              {!isAuthenticated && (
                <Link
                  className={[landingPageStyles.landingButton, landingPageStyles.landingButtonPrimary].join(' ')}
                  to={ROUTES.register}
                >
                  Начать бесплатно
                  <ArrowIcon />
                </Link>
              )}
              <button
                className={[landingPageStyles.landingButton, landingPageStyles.isGhost].join(' ')}
                type="button"
                onClick={handleLearnMore}
              >
                Узнать больше
              </button>
            </div>
          </div>

          <CodeReviewIllustration />
        </section>

        <section
          className={[landingPageStyles.landingSection, landingPageStyles.isAbout].join(' ')}
          id="landing-about"
          aria-labelledby="landing-about-title"
        >
          <div className={landingPageStyles.mark}>
            <AIIcon />
          </div>
          <div className={landingPageStyles.body}>
            <p className={landingPageStyles.kicker}>Что это такое?</p>
            <h2 className={landingPageStyles.title2} id="landing-about-title">
              Платформа для честного ревью и практики анализа кода
            </h2>
            <p className={landingPageStyles.text}>
              Разработчики ревьюят код друг друга, а ИИ помогает находить ошибки, нарушения SOLID и проблемы
              производительности. Вы получаете объективную обратную связь и учитесь на чужих решениях.
            </p>
          </div>
        </section>

        <section
          className={[landingPageStyles.landingSection, landingPageStyles.isStacked].join(' ')}
          aria-labelledby="landing-features-title"
        >
          <div className={landingPageStyles.sectionHeading}>
            <p className={landingPageStyles.kicker}>Ключевые возможности</p>
            <h2 className={landingPageStyles.title2} id="landing-features-title">
              Все, что нужно для сильного review-cycle
            </h2>
          </div>

          <div className={landingPageStyles.grid}>
            {FEATURES.map((feature) => {
              const Icon = feature.icon;

              return (
                <article className={landingPageStyles.landingFeatureCard} key={feature.title}>
                  <span className={landingPageStyles.icon}>
                    <Icon />
                  </span>
                  <h3 className={landingPageStyles.title3}>{feature.title}</h3>
                  <p className={landingPageStyles.text2}>{feature.text}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section
          className={[landingPageStyles.landingSection, landingPageStyles.isWorkflow].join(' ')}
          aria-labelledby="landing-workflow-title"
        >
          <div className={landingPageStyles.sectionHeading}>
            <p className={landingPageStyles.kicker}>Как это работает?</p>
            <h2 className={landingPageStyles.title2} id="landing-workflow-title">
              От загрузки решения до финального рейтинга
            </h2>
          </div>

          <ol className={landingPageStyles.landingSteps}>
            {STEPS.map((step, index) => (
              <li className={landingPageStyles.item} key={step}>
                <span className={landingPageStyles.number}>{String(index + 1).padStart(2, '0')}</span>
                <span className={landingPageStyles.text3}>{step}</span>
              </li>
            ))}
          </ol>
        </section>

        <section
          className={[landingPageStyles.landingSection, landingPageStyles.isBenefits].join(' ')}
          aria-labelledby="landing-benefits-title"
        >
          <div className={[landingPageStyles.mark, landingPageStyles.isSuccess].join(' ')}>
            <CheckIcon />
          </div>
          <div className={landingPageStyles.body}>
            <p className={landingPageStyles.kicker}>Преимущества для разработчиков</p>
            <h2 className={landingPageStyles.title2} id="landing-benefits-title">
              Растите быстрее, чем в одиночку
            </h2>
            <ul className={landingPageStyles.landingBenefits}>
              {BENEFITS.map((benefit) => (
                <li className={landingPageStyles.item2} key={benefit}>
                  <CheckIcon />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {!isAuthenticated && (
          <section className={landingPageStyles.landingCta} aria-labelledby="landing-cta-title">
            <div>
              <p className={landingPageStyles.kicker}>Готовы попробовать?</p>
              <h2 className={landingPageStyles.title4} id="landing-cta-title">
                Присоединяйтесь к сотням разработчиков.
              </h2>
            </div>
            <Link
              className={[
                landingPageStyles.landingButton,
                landingPageStyles.landingButtonPrimary,
                landingPageStyles.button,
              ].join(' ')}
              to={ROUTES.register}
            >
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
