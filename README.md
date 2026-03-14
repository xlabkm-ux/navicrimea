# NaviCrimea

Локальное приложение для просмотра объектов размещения в Крыму.

Проект состоит из:
- React + Vite фронтенда
- Express backend-сервера
- SQLite базы данных, которая создается автоматически при первом запуске

## Требования

- Node.js 22 LTS или новее
- npm

## Локальный запуск

1. Откройте терминал в папке проекта:
   `C:\CODEX\navicrimea`
2. Установите зависимости:
   `npm install`
3. Создайте `.env.local` на основе `.env.example` и задайте `VITE_YANDEX_MAPS_API_KEY`
4. Запустите приложение в режиме разработки:
   `npm run dev`
5. Откройте в браузере:
   `http://localhost:3000`

Сервер поднимается на порту `3000` и в dev-режиме отдает Vite-приложение через middleware.

## Полезные команды

- `npm run dev` - запуск приложения в режиме разработки
- `npm run start` - запуск сервера через `tsx`
- `npm run build` - сборка фронтенда через Vite
- `npm run preview` - предпросмотр production-сборки фронтенда
- `npm run lint` - проверка TypeScript без генерации файлов
- `npm run clean` - удаление папки `dist` в PowerShell

## База данных

При первом запуске создается файл `platform.db`.

В базу автоматически добавляются тестовые данные:
- один владелец
- три объекта размещения

## Переменные окружения

- `VITE_YANDEX_MAPS_API_KEY` - обязателен для отображения карты Крыма через Yandex JavaScript API на главном экране

Если ключ не задан, приложение покажет заглушку вместо карты с подсказкой о настройке `.env.local`.

## Публикация на IIS 10

Приложение публикуется как Node.js сервис за IIS reverse proxy.

1. На сервере установите:
   `Node.js 22 LTS`
2. В IIS установите модули:
   `URL Rewrite`
   `Application Request Routing (ARR)`
3. Скопируйте проект на сервер, например в:
   `C:\inetpub\navicrimea`
4. В папке проекта выполните:
   `npm.cmd install`
   `npm.cmd run build`
5. Создайте `.env.local` с `VITE_YANDEX_MAPS_API_KEY`
6. Запустите Node-приложение:
   `set NODE_ENV=production`
   `set PORT=3000`
   `npm.cmd run start`
7. В IIS создайте сайт или приложение, укажите корень:
   `C:\inetpub\navicrimea`
8. В корень сайта положите [web.config](/C:/CODEX/navicrimea/web.config)
9. В ARR включите proxy:
   `IIS Manager -> Application Request Routing Cache -> Server Proxy Settings -> Enable Proxy`

В production-режиме Express отдает собранный `dist` и API с одного порта, а IIS просто проксирует трафик на локальный Node-процесс.
