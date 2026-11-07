# Публикация NOMAD на Vercel

Пошагово, от пустого аккаунта Vercel до работающего приложения с входом через
Google. Проект — Next.js 15 (App Router) + Supabase + Mapbox + Gemini, поэтому
на Vercel он разворачивается без Docker, серверов и правок конфигурации сборки:
Vercel сам определяет Next.js.

Порядок важен: **сначала переменные окружения, потом деплой, потом настройка
URL в Supabase**, иначе первый вход через Google упадёт с `redirect_uri_mismatch`,
а письма подтверждения будут вести на `localhost`.

---

## 0. Что должно быть готово заранее

| Что | Где | Обязательно |
| --- | --- | --- |
| Аккаунт Vercel | vercel.com | да |
| Репозиторий на GitHub | `github.com/ansarserik67/Nomad` | да |
| Проект Supabase + применённые миграции | supabase.com | да |
| Публичный токен Mapbox | account.mapbox.com → Tokens | да (карта и поиск мест) |
| Ключ Google Gemini | aistudio.google.com/apikey | нет (без него AI-ассистент покажет «не настроено») |
| Google OAuth client в Supabase | Supabase → Authentication → Providers → Google | нет (без него работает вход по email) |

Значения ключей держите в менеджере паролей: в Vercel они вводятся один раз и
больше нигде не печатаются.

---

## 1. Переменные окружения

Соберите значения заранее — Vercel попросит их при импорте, но надёжнее
добавить вручную: **Project → Settings → Environment Variables**.

Проставьте каждую переменную для окружений **Production** и **Preview**
(галочки в форме). Значения для Preview можно оставить те же — это тот же
проект Supabase.

| Переменная | Обязательна | Где взять | Публичная |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | да | Supabase → Project Settings → API → Project URL | да, попадает в браузер |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | да | там же → anon / publishable key | да, защищён RLS |
| `NEXT_PUBLIC_APP_URL` | да | адрес приложения, например `https://nomad.vercel.app` — **без слэша на конце** | да |
| `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` | да | Mapbox → Tokens → public token (`pk.…`) | да |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | запасной | то же значение; читается, только если нет `…_ACCESS_TOKEN` | да |
| `GEMINI_API_KEY` | нет | Google AI Studio | **нет, только сервер** |
| `GEMINI_MODEL` | нет | `gemini-3.5-flash` | нет |

Правила, которые легко нарушить:

- `GEMINI_API_KEY` **никогда** не получает префикс `NEXT_PUBLIC_` — такой ключ
  уедет в JavaScript в браузере.
- `GOOGLE_OAUTH_CLIENT_ID` / `GOOGLE_OAUTH_CLIENT_SECRET` на Vercel **не нужны**:
  приложение их не читает, Google-клиент хранится в Supabase. В репозитории они
  остаются пустыми напоминаниями.
- `SERVICE_ROLE_KEY` нигде не нужен. Приложение работает от роли
  `authenticated`, доступ ограничивает RLS.
- `.env.local` в репозиторий не попадает (он в `.gitignore`) — на Vercel его
  заменяют эти переменные.

### Про `NEXT_PUBLIC_APP_URL`

Этот адрес подставляется в ссылки подтверждения email и сброса пароля и
**впекается в сборку** (префикс `NEXT_PUBLIC_`). Поэтому:

1. первый деплой можно сделать с предполагаемым адресом `https://<проект>.vercel.app`;
2. после деплоя сверьте фактический домен из Vercel;
3. если он отличается — исправьте переменную и нажмите **Redeploy**
   (без пересборки новое значение в клиентский код не попадёт).

Локально сервер подставляет `localhost` сам, так что разработка не ломается.

---

## 2. Импорт проекта в Vercel

1. vercel.com → **Add New… → Project**.
2. **Import Git Repository** → выберите `ansarserik67/Nomad`. Если репозитория
   нет в списке — **Adjust GitHub App Permissions** и дайте доступ.
3. На экране настройки проверьте:
   - **Framework Preset**: `Next.js` (определится сам);
   - **Root Directory**: пусто (проект в корне);
   - **Build Command**: `next build` (по умолчанию);
   - **Install Command**: `npm ci` (по умолчанию; `package-lock.json` в
     репозитории есть, версии зависимостей зафиксированы);
   - **Output Directory**: пусто (Next.js сам решает);
   - **Node.js Version**: `22.x`. В `package.json` уже стоит
     `"engines": { "node": "22.x" }`, это перекрывает настройку проекта и
     защищает от неожиданного переезда на новую мажорную версию Node.
4. **Environment Variables** → добавьте всё из таблицы шага 1.
5. **Deploy**.

Первая сборка занимает 2–4 минуты. В логе должно быть `Compiled successfully` и
список маршрутов; ошибок типов быть не может — локально `tsc --noEmit` и
`eslint` проходят чисто.

Если сборка упала, читайте первую ошибку, а не последнюю: как правило это
опечатка в имени переменной или забытый `NEXT_PUBLIC_SUPABASE_URL` (без него
сборка формально проходит, но приложение покажет «Supabase не настроен»).

---

## 3. Настройка Supabase под новый домен

Supabase → **Authentication → URL Configuration**:

**Site URL** — адрес продакшена:

```
https://nomad.vercel.app
```

**Redirect URLs** — добавьте по одной строке (кнопка Add URL):

```
https://nomad.vercel.app/**
https://*-<ваш-аккаунт-или-команда>.vercel.app/**
http://localhost:3000/**
```

- `/**` в конце обязателен: Supabase сравнивает **полный** URL, поэтому
  `https://nomad.vercel.app` без `/**` не разрешит
  `https://nomad.vercel.app/auth/callback`.
- Вторая строка — для preview-деплоев каждого PR (их адреса уникальны).
  Подставьте свой slug из адреса дашборда Vercel.
- Третья — чтобы локальная разработка продолжала работать.

**Google Cloud Console** (APIs & Services → Credentials → OAuth client):

- **Authorized redirect URI** остаётся один и не меняется при переезде:
  `https://<project-ref>.supabase.co/auth/v1/callback`
  (`<project-ref>` — из `NEXT_PUBLIC_SUPABASE_URL`).
- **Authorized JavaScript origins**: `https://nomad.vercel.app` (+
  `http://localhost:3000` для разработки). Для Google-входа через Supabase этот
  список не критичен, но снимает часть предупреждений.

Supabase → **Authentication → Providers → Google** должен быть включён с тем же
Client ID/Secret. Именно Supabase, а не Vercel, обменивает код на сессию.

---

## 4. База данных

Vercel разворачивает только код. Схема, политики и bucket живут в Supabase и
переносятся отдельно — один раз на проект:

1. Supabase → **SQL Editor**.
2. Выполните миграции по порядку из `supabase/migrations/`:
   `20261102000100_init.sql` → `20261103000100_security_hardening.sql` →
   `20261104000100_fix_trips_insert_policy.sql`.
3. Если на базе уже были странные ошибки записи (`42501`), выполните
   `supabase/tools/rls-diagnose-and-repair.sql` по шагам.
4. Проверьте bucket `travel-documents` (Storage) — его создаёт `init.sql`.

Продакшен и локальная база — разные базы. Если до этого вы работали только
локально, на Vercel-домене будет пусто, пока не применены миграции.

---

## 5. Проверка после деплоя

Откройте прод-адрес и пройдите по списку — это и есть приёмка:

| Шаг | Что должно быть |
| --- | --- |
| `/` | редирект на `/dashboard` или `/login`, без 500 |
| `/setup` | `supabase connected`, `mapbox connected`, `ai connected` (последнее — только если задан `GEMINI_API_KEY`), `Frankfurter connected` |
| `/signup` | регистрация по email; письмо приходит и ведёт на **прод-домен**, а не на `localhost` |
| `/login` | вход по email и паролю |
| Google-кнопка | окно выбора аккаунта Google, после — `/dashboard` с вашим именем |
| `/planner` | создание поездки сохраняется и видна после перезагрузки |
| `/trips/[id]` | добавление пункта плана и расхода сохраняется |
| `/vault` | загрузка файла проходит, файл открывается по ссылке |
| `/assistant` | ответ AI приходит (нужен `GEMINI_API_KEY`) |
| Переключатели сверху | тема и язык переключаются без перезагрузки, выбор сохраняется после F5 |
| Мобильная ширина | шапка не разъезжается, меню открывается |

Проверять лучше в приватном окне: cookie старой локальной сессии к прод-домену
не относятся, но так вы гарантированно увидите сценарий нового пользователя.

---

## 6. Свой домен (необязательно)

1. Vercel → Project → **Settings → Domains** → **Add**, введите домен.
2. У регистратора добавьте записи, которые покажет Vercel: для корня — `A`,
   для `www` — `CNAME`. Значения копируйте из панели Vercel, они периодически
   меняются — не берите старые из сторонних инструкций.
3. После статуса **Valid Configuration**:
   - `NEXT_PUBLIC_APP_URL` → `https://ваш-домен` и **Redeploy**;
   - Supabase Site URL → `https://ваш-домен`, в Redirect URLs добавьте
     `https://ваш-домен/**`;
   - Mapbox → Tokens → URL restrictions: добавьте `https://ваш-домен/*`.

Пока домен не подтверждён, `NEXT_PUBLIC_APP_URL` не меняйте — иначе ссылки из
писем будут вести на несуществующий адрес.

---

## 7. Типовые ошибки и что делать

**`redirect_uri_mismatch` после нажатия Google.**
В Google Cloud Console redirect URI не совпадает с
`https://<ref>.supabase.co/auth/v1/callback`. Сверьте посимвольно: `https`,
без слэша на конце, без пробелов.

**Google возвращает на `localhost:3000`.**
В Supabase → Authentication → URL Configuration `Site URL` всё ещё
`http://localhost:3000`. Поставьте прод-домен.

**Письмо подтверждения ведёт на `localhost`.**
`NEXT_PUBLIC_APP_URL` не задан или задан неверно, либо не было Redeploy после
изменения. Также проверьте, что в Supabase включён нужный шаблон письма.

**Письма не приходят вовсе.**
У Supabase свой SMTP с жёсткими лимитами (несколько писем в час, часто в спам).
Для реальных пользователей подключите свой SMTP: Supabase → Settings → Auth →
SMTP (например, Resend). Это самая частая «непонятная» проблема на проде.

**`supabase not configured` на всех страницах.**
Переменные добавлены только в Development или с опечаткой в имени. Проверьте
`NEXT_PUBLIC_SUPABASE_URL` и `NEXT_PUBLIC_SUPABASE_ANON_KEY` для Production и
пересоберите: значения `NEXT_PUBLIC_*` попадают в сборку.

**`42501 new row violates row-level security policy`.**
Дело в политиках живой базы, а не в Vercel. Выполните
`supabase/tools/rls-diagnose-and-repair.sql` (шаги 1–4) в SQL Editor.

**Карта пустая, в консоли 401 от Mapbox.**
Публичный токен ограничен по URL, а прод-домен в список не добавлен. Mapbox →
Tokens → ваш токен → URL restrictions → добавьте `https://ваш-домен/*`.

**AI работает локально, но не на Vercel.**
`GEMINI_API_KEY` не задан для Production, либо задан с префиксом
`NEXT_PUBLIC_` и удалён из серверного окружения. Ошибку видно в
Vercel → Deployments → Functions → Logs.

**Вход работает на `*.vercel.app`, но не на своём домене (или наоборот).**
Cookie сессии привязаны к домену. После смены домена выйдите и войдите заново;
в Supabase оба адреса должны быть в Redirect URLs.

**Функция падает по таймауту.**
AI-маршрут объявляет `maxDuration = 60` — с запасом: на Vercel Functions с
Fluid Compute (включён по умолчанию) доступно 300 с и на Hobby, и на Pro. Если
будете поднимать `maxDuration`, помните, что на Hobby 300 с — это потолок,
а на Pro можно до 800 с. Остальные страницы быстрые — они только читают Supabase.

---

## 8. Как обновлять сайт

- `git push origin main` → Vercel собирает прод-деплой автоматически.
- Пуш в другую ветку или PR → отдельный preview-URL (для них и нужна
  wildcard-строка в Supabase).
- Переменные окружения меняются в Settings → Environment Variables и требуют
  **Redeploy** — сами по себе они в уже собранный деплой не попадают.
- Откат: Deployments → нужный деплой → **Promote to Production**.

---

## 9. Чего не делать

- Не добавлять `SERVICE_ROLE_KEY` «чтобы заработало»: это полный доступ к базе
  в обход RLS, и он не нужен ни одной странице проекта.
- Не отключать RLS и не делать политики `using (true)`, чтобы «починить»
  запись: это открывает чужие поездки любому залогиненному пользователю.
- Не коммитить `.env.local` и не вставлять ключи в `next.config.ts`.
- Не менять `NEXT_PUBLIC_*` на обычные имена: клиенту нужны Supabase URL и
  anon-ключ во время выполнения.
- Не переносить миграции «руками по одной таблице» — порядок файлов в
  `supabase/migrations/` идемпотентен и рассчитан на повторный запуск.
