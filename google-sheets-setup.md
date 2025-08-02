# 📊 Настройка Google Sheets для системы записи

## 🎯 Общая схема работы

```
Клиент → Выбирает слот → Записывается → Google Sheets → Telegram уведомление
```

## 📋 Шаг 1: Создание Google Sheets

### 1.1 Создайте новую таблицу
1. Перейдите на [sheets.google.com](https://sheets.google.com)
2. Создайте новую таблицу
3. Назовите её "Запись к психологу Татьяне"

### 1.2 Создайте листы

**Лист 1: "Слоты"** (управление доступным временем)
```
A        B        C          D         E
Дата     Время    Длительность Статус    Клиент
05.08.2024  09:00    50        available  
05.08.2024  10:00    50        available  
05.08.2024  11:00    50        booked    А. Иванов
05.08.2024  14:00    50        available  
05.08.2024  15:00    50        available  
```

**Лист 2: "Записи"** (все созданные записи)
```
A        B        C        D         E         F         G         H
Дата     Время    Услуга   Длительность Цена    Имя      Телефон   Email
05.08.2024 11:00  individual 50        3000    А. Иванов +79001234567 ivan@mail.com
```

**Лист 3: "Настройки"** (конфигурация работы)
```
A              B
working_days   1,2,3,4,5
excluded_dates 05.08.2024,31.12.2024
time_slots     09:00,10:00,11:00,14:00,15:00,16:00,17:00,18:00
```

## 🔧 Шаг 2: Настройка Google Apps Script

### 2.1 Создайте Apps Script проект
1. В Google Sheets: Расширения → Apps Script
2. Замените код на следующий:

```javascript
// Главная функция обработки запросов
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    switch(data.action) {
      case 'getSlots':
        return getAvailableSlots();
      case 'createBooking':
        return createBooking(data.data);
      case 'updateSlot':
        return updateSlotStatus(data.data);
      default:
        return ContentService.createTextOutput(JSON.stringify({
          success: false,
          error: 'Unknown action'
        })).setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Получение доступных слотов
function getAvailableSlots() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Слоты');
  const data = sheet.getDataRange().getValues();
  
  const slots = {};
  
  // Пропускаем заголовок
  for (let i = 1; i < data.length; i++) {
    const [date, time, duration, status, clientName] = data[i];
    
    if (!date || !time) continue;
    
    const dateString = formatDate(date);
    
    if (!slots[dateString]) {
      slots[dateString] = [];
    }
    
    slots[dateString].push({
      time: time,
      duration: parseInt(duration) || 50,
      status: status || 'available',
      clientName: clientName || null
    });
  }
  
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    slots: slots
  })).setMimeType(ContentService.MimeType.JSON);
}

// Создание новой записи
function createBooking(bookingData) {
  const bookingsSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Записи');
  const slotsSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Слоты');
  
  // Добавляем запись в лист "Записи"
  bookingsSheet.appendRow([
    bookingData.date,
    bookingData.time,
    bookingData.service.type,
    bookingData.duration,
    bookingData.price,
    bookingData.client.name,
    bookingData.client.phone,
    bookingData.client.email || '',
    bookingData.client.message || '',
    new Date().toISOString()
  ]);
  
  // Обновляем статус слота
  updateSlotInSheet(slotsSheet, bookingData.date, bookingData.time, 'booked', bookingData.client.name);
  
  // Отправляем уведомление в Telegram (опционально)
  sendTelegramNotification(bookingData);
  
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    message: 'Запись создана успешно'
  })).setMimeType(ContentService.MimeType.JSON);
}

// Обновление статуса слота
function updateSlotStatus(data) {
  const slotsSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Слоты');
  updateSlotInSheet(slotsSheet, data.date, data.time, data.status, data.clientName);
  
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    message: 'Слот обновлен'
  })).setMimeType(ContentService.MimeType.JSON);
}

// Вспомогательная функция обновления слота
function updateSlotInSheet(sheet, date, time, status, clientName) {
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    const [slotDate, slotTime] = data[i];
    
    if (formatDate(slotDate) === date && slotTime === time) {
      sheet.getRange(i + 1, 4).setValue(status); // Колонка D - статус
      sheet.getRange(i + 1, 5).setValue(clientName || ''); // Колонка E - клиент
      break;
    }
  }
}

// Отправка уведомления в Telegram
function sendTelegramNotification(bookingData) {
  const BOT_TOKEN = 'ВАШ_TELEGRAM_BOT_TOKEN';
  const CHAT_ID = 'ВАШ_CHAT_ID';
  
  const message = `🔔 НОВАЯ ЗАПИСЬ К ПСИХОЛОГУ!

👤 Клиент: ${bookingData.client.name}
📞 Телефон: ${bookingData.client.phone}
📧 Email: ${bookingData.client.email || 'не указан'}
🎯 Услуга: ${getServiceName(bookingData.service.type)}
📅 Дата: ${bookingData.date}
⏰ Время: ${bookingData.time}
💰 Стоимость: ${bookingData.price} ₽
📝 Сообщение: ${bookingData.client.message || 'не указано'}

Время записи: ${new Date().toLocaleString('ru-RU')}`;

  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  
  try {
    UrlFetchApp.fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      payload: JSON.stringify({
        chat_id: CHAT_ID,
        text: message,
        parse_mode: 'HTML'
      })
    });
  } catch (error) {
    console.error('Ошибка отправки в Telegram:', error);
  }
}

// Получение читаемого названия услуги
function getServiceName(serviceType) {
  const services = {
    'individual': 'Индивидуальная терапия',
    'family': 'Семейная терапия',
    'online': 'Онлайн консультация'
  };
  return services[serviceType] || serviceType;
}

// Форматирование даты - ОБНОВЛЕНО для русского формата
function formatDate(date) {
  if (typeof date === 'string') return date;
  return Utilities.formatDate(date, Session.getScriptTimeZone(), 'dd.MM.yyyy');
}

// Функция для автоматического создания слотов (запускать вручную)
function generateWeeklySlots() {
  const slotsSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Слоты');
  const today = new Date();
  
  // Временные слоты
  const timeSlots = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00', '18:00'];
  const workingDays = [1, 2, 3, 4, 5]; // Пн-Пт
  
  // Генерируем слоты на следующие 2 недели
  for (let i = 0; i < 14; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    
    // Пропускаем выходные
    if (!workingDays.includes(date.getDay())) {
      continue;
    }
    
    const dateString = formatDate(date);
    
    // Проверяем, есть ли уже слоты на эту дату
    const existingData = slotsSheet.getDataRange().getValues();
    const dateExists = existingData.some(row => formatDate(row[0]) === dateString);
    
    if (!dateExists) {
      // Добавляем слоты для этой даты
      timeSlots.forEach(time => {
        slotsSheet.appendRow([dateString, time, 50, 'available', '']);
      });
    }
  }
}
```

### 2.2 Настройте разрешения
1. Сохраните проект: Ctrl+S
2. Нажмите "Развернуть" → "Новое развертывание"
3. Тип: "Веб-приложение"
4. Выполнять как: "Я"
5. Доступ: "Все"
6. Нажмите "Развернуть"
7. **Скопируйте URL веб-приложения**
https://script.google.com/macros/s/AKfycbzbWlTYGom6BtZr9Xf6sIvjnA4OL2ewEhq9SHZU07gV7xXEO3uTytyKbhIVJYa4GnoS/exec
## 🔑 Шаг 3: Получение API ключей

### 3.1 Google Sheets API ключ
1. Перейдите в [Google Cloud Console](https://console.cloud.google.com)
2. Создайте новый проект или выберите существующий
3. Включите Google Sheets API
4. Создайте учетные данные → API ключ
5. **Скопируйте API ключ**
AIzaSyAGU9bcqviA_Ra45yiWcWTchP2Vu7BrH7s

### 3.2 ID таблицы Google Sheets
Из URL таблицы: `https://docs.google.com/spreadsheets/d/ТАБЛИЦА_ID/edit`
**Скопируйте ТАБЛИЦА_ID**
1eEkukKgs95HXT1H5_HnDYg9Tx9k07B6GNpthpXpkeY4
## ⚙️ Шаг 4: Настройка сайта

### 4.1 Обновите booking.js
Замените в файле `booking.js`:
```javascript
const BOOKING_CONFIG = {
    GOOGLE_SHEETS_ID: 'ВАШ_ТАБЛИЦА_ID',
    GOOGLE_API_KEY: 'ВАШ_API_КЛЮЧ',
    SCRIPT_URL: 'https://script.google.com/macros/s/ВАШ_SCRIPT_ID/exec',
    // ... остальные настройки
};
```

### 4.2 Обновите index.html
Измените ссылки "Записаться":
```html
<!-- Старо -->
<a href="#appointment" class="btn btn-primary">Записаться на консультацию</a>

<!-- Новое -->
<a href="booking-system.html" class="btn btn-primary">Записаться на консультацию</a>
```

## 🧪 Шаг 5: Тестирование

### 5.1 Заполните тестовые слоты
1. Откройте лист "Слоты"
2. Добавьте несколько строк:
```
06.08.2024  09:00  50  available
06.08.2024  10:00  50  available
06.08.2024  11:00  50  booked  А. Тестов
```

### 5.2 Проверьте работу
1. Откройте `booking-system.html`
2. Выберите услугу
3. Выберите дату (должны показаться слоты)
4. Выберите время
5. Заполните форму
6. Проверьте, что запись появилась в Google Sheets

## 🎛 Шаг 6: Управление слотами

### 6.1 Добавление новых слотов
Просто добавьте строки в лист "Слоты":
```
10.08.2024  09:00  50  available
10.08.2024  15:00  60  available  (для семейной терапии)
```

### 6.2 Блокировка времени
Измените статус на `blocked`:
```
07.08.2024  14:00  50  blocked  Отпуск
```

### 6.3 Автоматическое создание слотов
1. В Apps Script запустите функцию `generateWeeklySlots()`
2. Она создаст слоты на 2 недели вперед

## 📊 Шаг 7: Отчеты и аналитика

### 7.1 Простые отчеты
Добавьте лист "Отчеты" с формулами:
```
Записей за неделю: =COUNTIFS(Записи!A:A,">="&TODAY()-7,Записи!A:A,"<="&TODAY())
Доход за месяц: =SUMIFS(Записи!E:E,Записи!A:A,">="&EOMONTH(TODAY(),-1)+1)
```

### 7.2 Популярные услуги
```
=COUNTIF(Записи!C:C,"individual")  // Индивидуальные
=COUNTIF(Записи!C:C,"family")      // Семейные
=COUNTIF(Записи!C:C,"online")      // Онлайн
```

## 🔐 Безопасность

### 7.1 Ограничения доступа
- Сделайте таблицу доступной только вам
- Регулярно меняйте API ключи
- Используйте HTTPS для всех запросов

### 7.2 Резервное копирование
- Настройте автоматическое резервное копирование Google Sheets
- Экспортируйте данные еженедельно

## 📞 Поддержка

При проблемах:
1. Проверьте логи в Apps Script (Выполнения)
2. Убедитесь, что API ключи правильные
3. Проверьте разрешения веб-приложения

**Готово! Теперь у вас есть полноценная система записи со слотами в русском формате дат! 🎉** 