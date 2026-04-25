# AuraPhoto — фронтенд

Mobile-first веб-приложение на React (JS, без TypeScript) для сервиса генерации
изображений AuraPhoto. Основной сценарий — Telegram Mini App (fullscreen);
вне Telegram работает через dev-авторизацию.

## Стек

- **React 18** (JSX)
- **Vite 5** — сборщик
- **React Router 6** — навигация
- **TanStack React Query 5** — серверное состояние, поллинг, кеш
- **Zustand** — локальное состояние (auth, BottomBar)
- **Axios** — HTTP-клиент с авто-рефрешем JWT
- **Telegram WebApp SDK** — подключается через `<script>` в `index.html`
- **Шрифт Nunito** — Google Fonts

## Структура

```
src/
├── api/                # HTTP, эндпоинты, Telegram SDK
│   ├── client.js       # axios + интерцептор refresh-токена
│   ├── tokenStorage.js # JWT хранилище (sessionStorage + localStorage)
│   ├── telegram.js     # WebApp + safe-area + fullscreen
│   ├── auth.js         # /auth/telegram, /auth/telegram/test, /auth/refresh
│   ├── users.js        # /users/me
│   ├── models.js       # /models
│   └── generations.js  # /generations + /photos/{key}
├── assets/
│   ├── icons/          # SVG из дизайна (home, profile, shop, star, и т.д.)
│   └── images/         # PNG-эмодзи (rocket, sparkle, gallery, generated_image, download)
├── components/
│   ├── AppLayout.jsx   # обёртка авторизованных страниц + BottomBar
│   ├── AuthGuard.jsx   # охранник маршрутов
│   ├── AuthedImage.jsx # картинка с Authorization header
│   ├── BottomBar.jsx   # переключатель TabBar <-> Submit-кнопки со swap-анимацией
│   ├── TabBar.jsx      # 5-кнопочная навигация (центр — круг по-настоящему центрирован)
│   ├── TokenBadge.jsx  # бейдж баланса в шапке
│   ├── Icons.jsx       # обёртки над SVG/PNG ассетами
│   └── ImageModal.jsx  # просмотр картинки + скачивание
├── hooks/
│   ├── useAuthedImage.js     # blob-fetch с авторизацией
│   ├── useDelayedFlag.js     # "showLoader только после 1.5с"
│   └── useGenerationPolling.js
├── pages/
│   ├── SplashPage.jsx        # авторизация → /profile
│   ├── HomePage.jsx          # промо (заглушка)
│   ├── ShopPage.jsx          # магазин (заглушка)
│   ├── GeneratePage.jsx      # форма + кнопка submit пробрасывается в BottomBar
│   ├── ProgressPage.jsx      # поллинг + результат
│   ├── GalleryPage.jsx       # сетка с отложенным лоадером
│   └── ProfilePage.jsx       # реферальная программа (стартовая после авторизации)
├── store/
│   ├── authStore.js          # пользователь, статус авторизации, токены
│   └── bottomActionStore.js  # бридж между GeneratePage и BottomBar
├── styles/
│   └── global.css            # тема, токены, safe-area, утилитарные классы
├── App.jsx                   # роуты
└── main.jsx                  # точка входа
```

## Быстрый старт

```bash
npm install
cp .env.example .env.local      # поправь VITE_API_BASE_URL
npm run dev                      # http://localhost:5173
npm run build && npm run preview # production-сборка
```

### Переменные окружения

| Переменная | Назначение |
|---|---|
| `VITE_API_BASE_URL` | Базовый URL бекенда без `/api/v1`, например `http://localhost:8000` |
| `VITE_BOT_USERNAME` | Имя Telegram-бота (для реферальной ссылки) |
| `VITE_DEV_AUTO_LOGIN` | `true` — автологин вне Telegram через `/auth/telegram/test` |
| `VITE_DEV_USER_ID` | ID пользователя для dev-авторизации |

## Как работает авторизация

Splash (`/`) выполняет:
1. Если есть валидный access-токен — `GET /users/me`, при успехе → `/profile`.
2. Если внутри Telegram — `POST /auth/telegram` с `initData` → токены → `/profile`.
3. Если вне Telegram + `VITE_DEV_AUTO_LOGIN=true` — `POST /auth/telegram/test` → `/profile`.
4. Иначе — кнопка «Открыть в Telegram».

Авто-рефреш JWT — в `src/api/client.js`. На 401 пытается refresh; если не помогло —
сбрасывает токены и редиректит на splash.

## Что нового в v2

### 1. Telegram fullscreen + safe area

В `src/api/telegram.js`:
- Вызываем `WebApp.requestFullscreen()` при старте (v8+, тихий fallback).
- Читаем `safeAreaInset` и `contentSafeAreaInset` из SDK и пробрасываем в CSS-переменные
  `--tg-safe-top/bottom/left/right`. Подписываемся на `safeAreaChanged` и
  `contentSafeAreaChanged`.
- В CSS используется `var(--safe-top)` = `max(--tg-safe-top, 12px)` — даже если
  Telegram не дал инсетов, минимальный отступ всегда есть.

Это нужно потому, что в Telegram Webview `env(safe-area-inset-*)` возвращает 0
([известный баг iOS](https://github.com/TelegramMessenger/Telegram-iOS/issues/1377)),
и напрямую полагаться на CSS-only решение нельзя.

### 2. Шрифт Nunito

Подключён через Google Fonts (400/600/700/800), используется по всему приложению
через CSS-переменную `--font-sans`.

### 3. TabBar — центральная кнопка ровно по центру

Раньше центральный элемент `margin-top: -24px` вылезал из полоски, из-за чего
центрирование "плыло". Теперь все 5 слотов имеют `flex: 1 1 0` (равная ширина),
а круглая кнопка вписана в свой слот. Тень — `box-shadow: 0 0 24px var(--accent-glow)`
без `Y`-смещения, поэтому свет идёт строго от центра кнопки во все стороны.

### 4. BottomBar со swap-анимацией

На странице `/generate` таб-бар прячется, на его месте появляется кнопка
«Сгенерировать за N ⭐». Реализовано через `bottomActionStore`:
- `GeneratePage` через `useEffect` пушит свой обработчик в стор.
- `BottomBar` читает стор и рендерит либо `TabBar`, либо submit-кнопку.
- Переключение со swap-анимацией (opacity + scale, 220мс exit + 220мс enter).
- Высота слоя одинаковая для обоих режимов — макет не "прыгает".

### 5. Отложенный лоадер галереи

`useDelayedFlag(isLoading, 1500)` показывает «Загружаем…» только если запрос
идёт дольше 1.5 секунд. Иначе:
- если данные есть → сетка
- если данных нет и `isSuccess` → «Здесь будут Ваши изображения»
- если запрос идёт <1.5с → пустой каркас (без мелькающего лоадера)

### 6. Стартовая страница — `/profile`

Раньше после авторизации редиректило на `/generate`. Теперь — на `/profile`.

### 7. Ассеты из дизайна

Все иконки и эмодзи — из переданных тобой файлов (`/src/assets/icons` + `/src/assets/images`).
Перекрашиваемые иконки (таб-бар, caret) рендерятся через CSS `mask-image` —
цвет берётся из `currentColor` родителя. Цветные (Upload, Refresh, Share, эмодзи) —
обычным `<img>`.

### 8. Бейдж токенов крупнее

`font-size: 20px` (было `16px`), `font-weight: 700`. Шрифт Nunito делает его
ещё разборчивее.

## Ключевые технические решения

### Загрузка защищённых изображений
API отдаёт байты картинки только при валидном `Authorization`. Прямой `<img src>`
не работает. `useAuthedImage` (hooks): fetch блоба → `URL.createObjectURL` →
`URL.revokeObjectURL` при unmount.

### Поллинг генерации
`POST /generations` возвращает `pending`. `ProgressPage` через `useQueries`
поллит `GET /generations/{id}` раз в 2.5с до `done`/`failed`. Таймаут — 3 минуты.

### Множественная генерация
1–4 картинки за раз: `Promise.all` параллельных POST'ов. Прогресс ждёт все id.
Если часть упала — токены за упавшие возвращаются.

### Оптимистичный баланс
Сразу после `POST /generations` локально вычитаем `token_cost × count`. На fail
возвращаем. `ProfilePage` периодически синхронизирует с `/users/me`.

### Двойное хранилище токенов
`sessionStorage` (приоритет) + `localStorage` (fallback). На iOS Telegram localStorage
может очищаться, в браузере sessionStorage сбрасывается на F5 — комбинация решает оба случая.

## Известные заглушки

- **Магазин** — API покупок ещё нет, `ShopPage` показывает «Скоро откроем».
- **Загрузка референса** — `UploadZone` на `/generate` в visual-only режиме (API только text-to-image).

## Telegram-деплой

1. `npm run build` → `dist/`.
2. Залей `dist/` на HTTPS-хостинг (Vercel, Netlify, Caddy).
3. BotFather: `/newapp` → URL Web App = твой хостинг.
4. Открой бота → запусти Mini App.
5. `VITE_API_BASE_URL` в build-времени должен указывать на публичный HTTPS-бекенд.

## Отладка

- **`Failed to fetch` при авторизации** — бекенд недоступен или CORS не разрешает origin фронта.
- **`/auth/telegram/test` 404** — бекенд не в DEBUG.
- **Картинки не появляются в галерее** — проверь `Authorization: Bearer ...` в Network → запросах к `/photos/{key}`.
- **Поллинг бесконечный** — таймаут 3 мин, далее останавливается. Проверь логи воркера.
- **Safe-area не работает в браузере** — это нормально: вне Telegram CSS env() даёт 0
  на десктопе и значения на iPhone. Минимальные 12px из `--safe-top/--safe-bottom` всё равно
  применяются.
