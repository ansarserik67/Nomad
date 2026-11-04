# NOMAD — гайд по настройке

Пошаговая инструкция: от пустого `.env.local` до работающего входа через Google, базы
Supabase с корректным RLS и проверенного создания поездки.

Проект: **NOMAD** — Next.js 15 (App Router) + Supabase + Mapbox + Google Gemini.
Все значения ниже — для текущего Supabase-проекта с ref `rocfustemanllfkjjgvm`.

---

## 1. Что нужно

| Что | Зачем | Обязательно |
| --- | --- | --- |
| Node.js 20+ и npm | запуск проекта | да |
| Проект Supabase (free tier хватает) | БД, Auth, Storage, RLS | да |
| Google Cloud аккаунт | OAuth-клиент для входа через Google | да |
| Mapbox token | карта и поиск мест | нет (карта покажет setup-state) |
| Google Gemini API key | ИИ-ассистент | нет (ассистент покажет setup-state) |

---

## 2. Запуск

```bash
npm install
cp .env.example .env.local   # затем заполнить значения (раздел 3)
npm run dev                  # http://localhost:3000
```

Проверка окружения — страница **`/setup`**: она показывает `connected` / `not connected`
для Supabase, Mapbox, AI и Frankfurter. Ничего не мокается: если ключа нет, интерфейс
честно показывает состояние настройки.

Скрипты: `npm run dev`, `npm run build`, `npm run lint`.

---

## 3. Переменные окружения (`.env.local`)

| Переменная | Где взять | Публичная |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API → Project URL | да |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API → anon/publishable | да |
| `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` | mapbox.com → Account → Tokens (`pk.…`) | да |
| `GEMINI_API_KEY` | https://aistudio.google.com/apikey | **нет, только сервер** |
| `GEMINI_MODEL` | необязательно, по умолчанию `gemini-3.5-flash` | нет |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` (без слэша на конце) | да |

Правила:

- `.env.local` в `.gitignore` — в репозиторий он не попадает, `.env.example` попадает.
- Секреты (`GEMINI_API_KEY`, service-role ключ) **никогда** не получают префикс `NEXT_PUBLIC_`.
- Service-role ключ в проекте не используется вообще: доступ к данным ограничивается RLS.

Google Client ID/Secret в `.env` не нужны — они живут только в Supabase Dashboard (раздел 5).
Переменные `GOOGLE_OAUTH_CLIENT_ID` / `GOOGLE_OAUTH_CLIENT_SECRET` в `.env.example` — просто
напоминание, что вставлять в Dashboard.

---

## 4. База данных Supabase

### 4.1 Применить миграции по порядку

Supabase → **SQL Editor** → New query → вставить содержимое файла → Run.

1. `supabase/migrations/20261102000100_init.sql`
   Создаёт таблицы (`profiles`, `trips`, `trip_members`, `itinerary_items`, `expenses`,
   `documents`, `notifications`, AI-лимиты), функции (`is_trip_member`, `can_edit_trip`,
   `trip_role`, …), триггер `handle_new_user` на `auth.users`, RLS и все политики,
   а также приватный bucket `travel-documents` со storage-политиками.
2. `supabase/migrations/20261103000100_security_hardening.sql`
   Триггер `trips_protect_owner` и защита владельца поездки от смены.
3. `supabase/migrations/20261104000100_fix_trips_insert_policy.sql`
   Пересоздаёт INSERT-политику `trips_insert_owner`. **Без неё создание поездки падает
   с ошибкой 42501** (раздел 7.1).

`20261104000200_bookings.sql` кодом пока не используется — применять не обязательно.

### 4.2 Проверка после миграций

```sql
-- Политики trips: должны быть SELECT / INSERT / UPDATE / DELETE
select policyname, cmd, roles, with_check
from pg_policies
where schemaname = 'public' and tablename = 'trips'
order by cmd, policyname;

-- RLS включён?
select relrowsecurity as rls_enabled
from pg_class
where oid = 'public.trips'::regclass;

-- Профиль создаётся триггером при регистрации?
select id, email, full_name from public.profiles limit 5;

-- Bucket для документов (private, 10 MB)
select id, name, public from storage.buckets where id = 'travel-documents';
```

Ожидаемо: 4 политики на `trips`, `rls_enabled = true`, строка профиля для вашего
пользователя, bucket `travel-documents` с `public = false`.

---

## 5. Вход через Google (OAuth)

Логика в приложении: кнопка «Continue with Google» → server action
`signInWithGoogleAction` → Supabase `signInWithOAuth({ provider: "google" })` →
`accounts.google.com` → `https://<ref>.supabase.co/auth/v1/callback` →
приложение `http://localhost:3000/auth/callback` → обмен `code` на сессию
(`exchangeCodeForSession`) → редирект на `/dashboard`.

### Шаг 1. Google Cloud Console

1. https://console.cloud.google.com → создать проект (или выбрать существующий).
2. **APIs & Services → OAuth consent screen**:
   - User type: **External**;
   - App name (например `NOMAD`), support email, developer email;
   - Scopes: достаточно `email`, `profile`, `openid`;
   - **Test users**: добавить свой Gmail. Пока приложение в статусе *Testing*,
     войти смогут только эти адреса.
3. **APIs & Services → Credentials → Create credentials → OAuth client ID**:
   - Application type: **Web application**;
   - **Authorized JavaScript origins**: `http://localhost:3000`
     (и `https://ваш-домен` для продакшена);
   - **Authorized redirect URIs** — ровно эта строка, без слэша на конце:

     ```
     https://rocfustemanllfkjjgvm.supabase.co/auth/v1/callback
     ```

     Ключевой момент: у Google регистрируется **callback Supabase**, а не адрес
     приложения. Именно сюда Google возвращает `code`.
4. Скопировать **Client ID** и **Client secret**.

### Шаг 2. Supabase Dashboard

1. **Authentication → Providers → Google** → включить, вставить Client ID и Client secret,
   Save. (Эти значения хранятся на серверах Supabase, в браузер и в репозиторий не попадают.)
2. **Authentication → URL Configuration**:
   - **Site URL**: `http://localhost:3000`
   - **Redirect URLs**: `http://localhost:3000/**`
     (для продакшена добавить `https://ваш-домен/**`)
3. **Authentication → Providers → Email** — оставить включённым, если нужен вход по паролю.

### Шаг 3. Проверка

1. Открыть `http://localhost:3000/login` → **Continue with Google**.
2. Выбрать Google-аккаунт → согласие на scopes.
3. Должен произойти возврат на `http://localhost:3000/dashboard` с вашим именем.

Быстрая проверка, что провайдер включён (без входа):

```bash
curl -s "https://rocfustemanllfkjjgvm.supabase.co/auth/v1/settings" \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" | grep -o '"google":[a-z]*'
# ожидаемо: "google":true
```

---

## 6. Чек-лист после первого входа

- [ ] `/dashboard` открывается, имя пользователя подставляется.
- [ ] Создание поездки: `/planner` → заполнить → сохранить → открывается `/trips/<id>`.
- [ ] В `/trips` появилась карточка поездки; на дашборде обновились статистика и бюджет.
- [ ] `/wallet` — добавление расхода, конвертация валют (Frankfurter, без ключа).
- [ ] `/vault` — загрузка документа (bucket `travel-documents`), скачивание по signed URL.
- [ ] `/group` — приглашение участника по email.
- [ ] `/assistant` — один запрос при наличии `GEMINI_API_KEY` (лимит 5 операций/сутки по UTC).
- [ ] Переключатели темы (Light/Dark/System) и языка (EN/RU/KK) сохраняются после reload.

---

## 7. Типичные ошибки и что делать

### 7.1 `42501` — создание поездки не работает

```
code: '42501'
message: 'new row violates row-level security policy for table "trips"'
```

Причина: в базе включён RLS, но INSERT-политика для роли `authenticated` отсутствует или
отличается от репозитория. Приложение отправляет `owner_id = auth.uid()`, так что дело не в коде.

Лечение (идемпотентно, данные и RLS не трогаются):

```sql
drop policy if exists "trips_insert_owner" on public.trips;
create policy "trips_insert_owner" on public.trips
for insert to authenticated
with check (owner_id = (select auth.uid()));
```

Если поездки не видны и после этого — проверьте, что существует SELECT-политика
`trips_select_member` (она использует функцию `public.is_trip_member(id)` из `init.sql`).

### 7.2 `?error=link` после Google

`exchangeCodeForSession` не смог обменять код. Почти всегда: `http://localhost:3000/**`
не добавлен в Supabase → Authentication → URL Configuration → Redirect URLs.

### 7.3 `?error=oauth`

Supabase не вернул URL авторизации: провайдер Google не сохранён/выключен в
Authentication → Providers, либо Client ID/Secret пустые.

### 7.4 `?error=config`

Не заданы `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` в `.env.local`
(после правки `.env.local` dev-сервер нужно перезапустить).

### 7.5 Google: `Error 400: redirect_uri_mismatch`

В Authorized redirect URIs нет точной строки
`https://rocfustemanllfkjjgvm.supabase.co/auth/v1/callback` — либо в ней лишний слэш,
либо указан адрес приложения вместо адреса Supabase.

### 7.6 Google: `Error 403: access_denied` / «Access blocked»

OAuth consent screen в статусе *Testing*, а ваш email не добавлен в **Test users**.

### 7.7 `ENOENT ... .next/cache/...pack.gz` в логе dev-сервера

Каталог `.next` удалили/пересобрали при работающем `next dev`. Остановить сервер,
`rm -rf .next`, запустить `npm run dev` заново.

### 7.8 Пустые «дни»/карта без точек

Нет `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` либо у токена не разрешён `http://localhost:3000`
в URL restrictions — карта покажет состояние настройки вместо данных.

---

## 8. Публикация в GitHub

```bash
git init
git add .
git commit -m "NOMAD travel workspace"
git branch -M main
git remote add origin https://github.com/<user>/<repo>.git
git push -u origin main
```

Перед пушем убедитесь, что `.env.local` и `.dev-server.log` не попали в индекс
(`git status --porcelain`), — они перечислены в `.gitignore`.
