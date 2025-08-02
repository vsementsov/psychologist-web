# 📊 Настройка аналитики и метрик

## 🎯 Google Analytics 4

### Шаг 1: Создание аккаунта
1. Перейдите на [analytics.google.com](https://analytics.google.com)
2. Войдите под Google аккаунтом
3. Создайте новый аккаунт
4. Добавьте ресурс (Property) 
5. Выберите "Веб" как платформу
6. **Скопируйте ID измерения** (будет вида: G-XXXXXXXXXX)

### Шаг 2: Установка на сайт
В файле `index.html` замените `GA_MEASUREMENT_ID` на ваш ID:
```html
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-XXXXXXXXXX');
</script>
```

### Шаг 3: Настройка целей
Создайте события для отслеживания:
- **Клик на "Записаться"**
- **Скачивание материалов**
- **Заполнение формы**
- **Звонки по телефону**

## 📈 Yandex.Metrica

### Шаг 1: Создание счетчика
1. Перейдите на [metrika.yandex.ru](https://metrika.yandex.ru)
2. Войдите под Яндекс аккаунтом
3. Создайте новый счетчик
4. Укажите URL сайта
5. **Скопируйте номер счетчика** (8-значное число)

### Шаг 2: Установка кода
В файле `index.html` замените `XXXXXX` на номер вашего счетчика:
```javascript
ym(12345678, "init", {
    clickmap:true,
    trackLinks:true,
    accurateTrackBounce:true,
    webvisor:true
});
```

### Шаг 3: Настройка целей в Метрике
1. Перейдите в "Настройки" → "Цели"
2. Создайте цели:
   - **Клик по кнопке записи**: CSS-селектор `[href="#appointment"]`
   - **Скачивание файлов**: CSS-селектор `.download-btn`
   - **Клик по телефону**: CSS-селектор `[href^="tel:"]`
   - **Время на сайте**: Более 2 минут

## 🔍 Google Search Console

### Настройка для индексации:

1. Перейдите на [search.google.com/search-console](https://search.google.com/search-console)
2. Добавьте ваш домен
3. Подтвердите права (через DNS, HTML-файл или Google Analytics)
4. Загрузите sitemap.xml:
   - Откройте "Карты сайта"
   - Добавьте `https://ваш-домен.com/sitemap.xml`

### Полезные отчеты:
- **Эффективность** - какие запросы приводят посетителей
- **Покрытие** - какие страницы проиндексированы
- **Скорость** - производительность сайта

## 🎯 Настройка отслеживания событий

Добавьте в `script.js` отслеживание важных действий:

```javascript
// Отслеживание кликов по кнопке записи
document.querySelectorAll('[href="#appointment"]').forEach(button => {
    button.addEventListener('click', function() {
        // Google Analytics
        if (typeof gtag !== 'undefined') {
            gtag('event', 'click_appointment', {
                'event_category': 'engagement',
                'event_label': 'appointment_button'
            });
        }
        
        // Yandex.Metrica
        if (typeof ym !== 'undefined') {
            ym(XXXXXX, 'reachGoal', 'click_appointment');
        }
    });
});

// Отслеживание скачивания материалов
document.querySelectorAll('.download-btn').forEach(button => {
    button.addEventListener('click', function() {
        const fileName = this.getAttribute('data-file');
        
        // Google Analytics
        if (typeof gtag !== 'undefined') {
            gtag('event', 'file_download', {
                'event_category': 'engagement',
                'event_label': fileName
            });
        }
        
        // Yandex.Metrica
        if (typeof ym !== 'undefined') {
            ym(XXXXXX, 'reachGoal', 'download_material');
        }
    });
});

// Отслеживание кликов по телефону
document.querySelectorAll('[href^="tel:"]').forEach(link => {
    link.addEventListener('click', function() {
        // Google Analytics
        if (typeof gtag !== 'undefined') {
            gtag('event', 'phone_call', {
                'event_category': 'contact',
                'event_label': 'phone_click'
            });
        }
        
        // Yandex.Metrica
        if (typeof ym !== 'undefined') {
            ym(XXXXXX, 'reachGoal', 'phone_call');
        }
    });
});
```

## 📱 Отслеживание конверсий

### Важные метрики для отслеживания:
- **Конверсия в запись** (главная цель)
- **Время на сайте** (качество трафика)
- **Скачивания материалов** (интерес к услугам)
- **Источники трафика** (эффективность каналов)
- **Геолокация** (география клиентов)

### Настройка воронки продаж:
1. **Посещение сайта** → 
2. **Просмотр услуг** → 
3. **Клик "Записаться"** → 
4. **Заполнение формы** → 
5. **Отправка заявки**

## 🚨 GDPR и согласие на cookies

Добавьте уведомление о cookies (обязательно для европейских пользователей):

```html
<!-- Cookie consent banner -->
<div id="cookie-banner" style="display: none;">
    <p>Мы используем cookies для улучшения работы сайта. 
    <a href="#" id="accept-cookies">Принять</a></p>
</div>
```

## 📊 Еженедельные отчеты

Настройте автоматические отчеты:
- **Google Analytics**: Настройки → Отчеты → Запланированные отчеты
- **Yandex.Metrica**: Настройки → Уведомления → Email-отчеты

### Рекомендуемые отчеты:
- Количество посетителей за неделю
- Топ-5 страниц по посещаемости  
- Конверсии в записи
- Источники трафика

## 🔧 Дополнительные инструменты

### Hotjar (карты кликов):
- Покажет, как пользователи взаимодействуют со страницей
- Записи сессий пользователей
- Heatmaps кликов и скроллинга

### Microsoft Clarity (бесплатно):
- Аналог Hotjar от Microsoft
- Детальная аналитика поведения пользователей

## ✅ Чек-лист настройки

- [ ] Google Analytics 4 подключен
- [ ] Yandex.Metrica настроена
- [ ] Google Search Console настроен
- [ ] Sitemap.xml загружен
- [ ] Цели настроены в аналитике
- [ ] События отслеживания добавлены
- [ ] Еженедельные отчеты настроены
- [ ] Согласие на cookies добавлено 