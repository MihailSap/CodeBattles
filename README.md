# CodeMasters

Проект команды `"Деловые люди"` по предмету `"Проектный практикум"`, 6 семестр ИРИТ-РТФ УрФУ.

**Заказчик:** `"66 Бит"`

> Репозиторий и инфраструктура проекта используют старое название `CodeBattles`.

## О проекте

CodeMasters — платформа для peer-to-peer code review с AI-помощью. Разработчики ревьюят решения друг друга, получают автоматические рекомендации от ИИ, развивают навык анализа кода и растут внутри сообщества.

Платформа помогает находить ошибки, нарушения принципов SOLID, проблемы производительности и спорные архитектурные решения. Пользователь получает обратную связь от нескольких ревьюеров и AI-анализа, обсуждает замечания в тредах, закрывает найденные проблемы и получает итоговую оценку качества кода.

## Основной функционал

- Регистрация и авторизация через email, GitHub или GitLab.
- Подтверждение email, восстановление и сброс пароля.
- Создание организаций и проектов.
- Присоединение к организациям и проектам по invite-ссылкам.
- Настройка проекта: приватность, стек технологий, участники и роли.
- Создание задач внутри проектов.
- Загрузка решений из Git-репозитория или вручную.
- Рабочее пространство решения с деревом файлов и просмотром кода.
- Peer-to-peer review: inline-комментарии, обсуждения и итоговые оценки.
- AI-review как дополнительный автоматический анализ кода.
- Профиль пользователя, настройки уведомлений и стек навыков.
- Геймификация: баллы, достижения, рейтинг и лидерборд.
- Административный раздел для управления пользователями и данными.

## Пользовательский сценарий

1. Пользователь регистрируется через email, GitHub или GitLab.
2. Создает проект или присоединяется к существующему по ссылке.
3. Загружает решение из Git или вручную.
4. Получает ревью от 2-3 участников и AI-анализ.
5. Обсуждает замечания, оставляет комментарии и закрывает треды.
6. Завершает ревью, получает Quality Score, баллы и рейтинг.

## Стек

### Frontend

- React 19
- Vite 8
- Redux Toolkit и React Redux
- RTK Query для server state
- React Router 7
- Axios
- Monaco Editor
- CSS с BEM-подобным неймингом и CSS variables
- FSD-подход к архитектуре

### Backend

- Java 21
- Spring Boot 3.5
- Spring Web
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

Полезные команды:

```bash
npm run lint
npm run build
npm run preview
```

### Запуск backend отдельно

```bash
cd backend
./mvnw spring-boot:run
```

Backend читает настройки из `backend/src/main/resources/application.yaml` и ожидает переменные окружения для подключения к PostgreSQL, JWT, email и GitHub OAuth2.

## API и данные

Backend предоставляет REST API для авторизации, пользователей, профиля, организаций, проектов, invite-ссылок, задач, файлов, стеков и review-сценариев. Для документирования API подключен springdoc OpenAPI / Swagger UI.

Frontend обращается к API через общий HTTP-клиент `frontend/src/shared/api/http-client.js`; server state кэшируется и обновляется через RTK Query.

## Качество и разработка

Перед завершением значимых frontend-изменений рекомендуется запускать:

```bash
cd frontend
npm run lint
npm run build
```

Для backend-изменений:

```bash
cd backend
./mvnw test
```

## Документация

- `backend/src/main/resources/db/changelog` — история миграций базы данных.
- `docker-compose.yaml` — состав сервисов для контейнерного запуска.
