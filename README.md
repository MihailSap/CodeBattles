# CodeMasters

Проект команды `"Деловые люди"` по предмету `"Проектный практикум"`, 6 семестр ИРИТ-РТФ УрФУ.

**Заказчик:** `"66 Бит"`

> Репозиторий и инфраструктура проекта используют старое название `CodeBattles`.

## О проекте

CodeMasters — платформа для peer-to-peer code review с AI-помощью. Разработчики ревьюят решения друг друга, получают автоматические рекомендации от ИИ, развивают навык анализа кода и растут внутри сообщества.

Платформа помогает находить ошибки, нарушения принципов SOLID, проблемы производительности и спорные архитектурные решения. Пользователь получает обратную связь от нескольких ревьюеров и AI-анализа, обсуждает замечания в тредах, закрывает найденные проблемы и получает итоговую оценку качества кода.

## Основной функционал

- Регистрация и авторизация через email или GitHub.
- Подтверждение email, восстановление и сброс пароля.
- Создание организаций и проектов.
- Присоединение к организациям и проектам по invite-ссылкам.
- Настройка проекта: приватность, стек технологий, участники и роли.
- Создание задач внутри проектов.
- Загрузка решений вручную, отдельными файлами, ZIP-архивом или через public GitHub pull request.
- Рабочее пространство решения с деревом файлов и просмотром кода.
- Peer-to-peer review: inline-комментарии, обсуждения и итоговые оценки.
- AI-review как дополнительный автоматический анализ кода.
- Realtime-уведомления о заявках, назначениях, ревью, ответах в тредах, завершении задач и достижениях с учетом пользовательских настроек.
- Профиль пользователя, стек навыков и привязка/отвязка GitHub-аккаунта.
- Геймификация: баллы, достижения, рейтинг и лидерборд.
- Административный раздел для управления пользователями и данными.

## Пользовательский сценарий

1. Пользователь регистрируется через email или GitHub.
2. Создает проект или присоединяется к существующему по ссылке.
3. Загружает решение из общей формы: вручную, файлами, архивом или через GitHub.
4. Получает ревью от 1-3 участников и AI-анализ.
5. Обсуждает замечания, оставляет комментарии и закрывает треды.
6. Завершает ревью, получает Quality Score, баллы и рейтинг.

## Стек

### Frontend

- React 19
- Vite 8
- TypeScript
- Redux Toolkit и React Redux
- RTK Query для server state
- React Router 7
- React Hook Form + Zod для форм и runtime-валидации
- Axios
- Monaco Editor
- SCSS Modules, Sass и CSS variables
- typed-scss-modules для `.module.scss.d.ts`
- FSD-подход к архитектуре
- ESLint Flat Config + Prettier

### Backend

- Java 21
- Spring Boot 3.5
- Spring Web
- Spring WebSocket
- Spring Security
- OAuth2 Client для GitHub-авторизации
- Spring Data JPA
- PostgreSQL
- Liquibase
- JWT
- Spring Mail
- springdoc OpenAPI / Swagger UI
- Maven

### Инфраструктура

- Docker и Docker Compose
- Nginx как reverse proxy
- PostgreSQL 15
- Переменные окружения для подключения БД, JWT, email и OAuth2

## Архитектура проекта

```text
.
├── backend/              # Java Spring Boot API
├── frontend/             # React + Vite frontend
├── nginx/                # reverse proxy configuration
├── docker-compose.yaml   # production-like local composition
└── README.md
```

### Frontend

Frontend организован по FSD:

```text
frontend/src/
├── app/        # провайдеры, роутинг, layout, глобальные стили
├── pages/      # роутовые страницы
├── widgets/    # крупные самостоятельные UI-блоки
├── features/   # пользовательские действия
├── entities/   # бизнес-сущности
└── shared/     # общая инфраструктура, UI-kit, API-клиенты, helpers
```

Компонентные стили лежат рядом с UI-кодом в `.module.scss`; глобальными остаются только app-level стили `frontend/src/app/styles/global.scss` и `frontend/src/app/styles/variables.scss`. Обычные локальные `.css` файлы в `frontend/src` не используются, кроме CSS внешних пакетов из `node_modules`.

Ключевые зоны frontend-приложения:

- публичный лендинг;
- auth flow;
- dashboard;
- проекты и организации;
- задачи и загрузка решений;
- review workspace;
- профиль;
- leaderboard;
- admin-раздел.

Формы frontend-приложения валидируются через React Hook Form и Zod. Доменные схемы лежат в `entities/*/lib/validation.ts`, схемы фичевых форм — в `features/*/model`.

Качество frontend-кода поддерживается через TypeScript, ESLint Flat Config и Prettier. Конфигурации находятся в `frontend/tsconfig.json`, `frontend/tsconfig.app.json`, `frontend/tsconfig.node.json`, `frontend/eslint.config.js`, `frontend/.prettierrc` и `frontend/.prettierignore`.

Redux store типизирован в `frontend/src/app/providers/store`: оттуда экспортируются `RootState`, `AppDispatch`, `AppStore`, `useAppDispatch` и `useAppSelector`. Прямой импорт `useDispatch`/`useSelector` в компонентах не используется.

### Backend

Backend построен как Spring Boot-приложение со стандартным разделением по слоям:

```text
backend/src/main/java/ru/urfu/backend/
├── config/         # конфигурация приложения
├── controller/     # REST-контроллеры
├── dto/            # DTO для API-контрактов
├── filter/         # JWT-фильтр
├── mapper/         # маппинг между DTO и моделями
├── model/          # JPA-сущности и enum'ы
├── repository/     # Spring Data JPA repositories
├── service/        # бизнес-логика
└── specification/  # спецификации для фильтрации/поиска
```

Миграции базы данных лежат в `backend/src/main/resources/db/changelog`, главный changelog — `db.changelog-master.yaml`.

## Быстрый старт

### Требования

- Node.js и npm
- Java 21
- Maven или Maven Wrapper из `backend/`
- Docker и Docker Compose
- PostgreSQL, если backend запускается без Docker

### Переменные окружения

Для запуска через `docker-compose.yaml` используются переменные:

```env
APP_PUBLIC_URL=
SPRING_DATASOURCE_URL=
SPRING_DATASOURCE_USERNAME=
SPRING_DATASOURCE_PASSWORD=
JWT_SECRET_ACCESS=
JWT_SECRET_REFRESH=
EMAIL_ADDRESS=
EMAIL_APP_PASSWORD=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
POSTGRES_DB=
POSTGRES_USER=
POSTGRES_PASSWORD=
```

Локальный файл `.env` находится в корне проекта и подхватывается Docker Compose.

### Запуск через Docker Compose

```bash
docker compose up --build
```

После запуска:

- frontend доступен через Nginx на `http://localhost`;
- backend API доступен на `http://localhost:8080`;
- PostgreSQL запускается отдельным сервисом `db`.

Backend-образ собирает Spring Boot jar внутри Docker, поэтому предварительно выполнять локальный `./mvnw package` не нужно. Загруженные файлы сохраняются в Docker volume `backend_uploads`, подключенном к `/app/uploads` внутри backend-контейнера.

### Запуск frontend отдельно

```bash
cd frontend
npm install
npm run dev
```

По умолчанию Vite поднимает dev server на `http://localhost:5173`.

Полезные команды:

```bash
npm run lint
npm run typecheck
npm run build
npm run format
npm run format:check
npm run scss:types
npm run preview
npm audit
```

### Запуск backend отдельно

```bash
cd backend
./mvnw spring-boot:run
```

Backend читает настройки из `backend/src/main/resources/application.yaml` и ожидает переменные окружения для подключения к PostgreSQL, JWT, email и GitHub OAuth2.

## API и данные

Backend предоставляет REST API для авторизации, пользователей, профиля, организаций, проектов, invite-ссылок, задач, файлов, стеков, уведомлений и review-сценариев. Для realtime-уведомлений используется WebSocket endpoint `/api/v1/notifications/stream`. Для документирования API подключен springdoc OpenAPI / Swagger UI.

Frontend обращается к API через общий HTTP-клиент `frontend/src/shared/api/http-client.ts`; server state кэшируется и обновляется через RTK Query.

### Загрузка решений и GitHub

Форма задачи поддерживает четыре рабочих режима:

- ручной ввод одного исходного файла;
- загрузку списка исходных файлов: до 100 файлов, до 1 МБ каждый и до 5 МБ суммарно;
- загрузку ZIP-архива: до 10 МБ в переданном виде и до 5 МБ после распаковки;
- вставку ссылки на public GitHub pull request вида `https://github.com/owner/repository/pull/123`.

В личном кабинете в модальном окне настроек GitHub связывается с текущим аккаунтом через подтвержденный OAuth flow и там же отвязывается. Если GitHub привязан, вкладка загрузки PR предлагает до десяти открытых public PR этого пользователя для выбора одним кликом. Если аккаунт не привязан, public PR по ссылке всё равно можно отправить вручную.

Backend не сохраняет GitHub OAuth access token. Это намеренное ограничение безопасности: public PR, включая PR из fork, импортируются через read-only GitHub pull ref, а private repositories пока следует загружать файлами или ZIP, пока не будет добавлено шифрованное хранилище внешних токенов и revoke flow.

## Качество и разработка

Перед завершением значимых frontend-изменений рекомендуется запускать:

```bash
cd frontend
npm run scss:types
npm run typecheck
npm run lint
npm run build
npm run format:check
```

Для backend-изменений:

```bash
cd backend
./mvnw test
```

## Документация

- `backend/src/main/resources/db/changelog` — история миграций базы данных.
- `docker-compose.yaml` — состав сервисов для контейнерного запуска.
