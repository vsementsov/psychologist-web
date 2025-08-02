// Конфигурация системы записи
const BOOKING_CONFIG = {
    // ID Google Sheets (замените на ваш)
    GOOGLE_SHEETS_ID: '1eEkukKgs95HXT1H5_HnDYg9Tx9k07B6GNpthpXpkeY4',
    // API ключ Google Sheets (замените на ваш)
    GOOGLE_API_KEY: 'AIzaSyAGU9bcqviA_Ra45yiWcWTchP2Vu7BrH7s',
    // URL Apps Script веб-приложения (замените на ваш)
    SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbzbWlTYGom6BtZr9Xf6sIvjnA4OL2ewEhq9SHZU07gV7xXEO3uTytyKbhIVJYa4GnoS/exec',
    // Webhook URL для уведомлений (замените на ваш)
    WEBHOOK_URL: 'https://hooks.zapier.com/hooks/catch/ВАША_ССЫЛКА',
    
    // Рабочие дни (0 = Воскресенье, 1 = Понедельник, etc.)
    WORKING_DAYS: [1, 2, 3, 4, 5, 6], // Пн-Сб (добавили субботу)
    
    // Исключенные даты (праздники, отпуск) - теперь в русском формате
    EXCLUDED_DATES: [
        '05.08.2024', // Пример: исключаем 5 августа
        '12.08.2024'  // Пример: исключаем 12 августа
    ]
};

// Глобальные переменные
let currentBooking = {
    service: null,
    date: null,
    time: null,
    duration: null,
    price: null
};

let currentMonth = new Date();
let availableSlots = {};

// Инициализация системы записи
document.addEventListener('DOMContentLoaded', function() {
    initializeBookingSystem();
});

function initializeBookingSystem() {
    setupServiceSelection();
    setupCalendar();
    setupNavigation();
    setupForm();
    
    // Загружаем слоты при инициализации
    loadAvailableSlots();
}

// Настройка выбора услуг
function setupServiceSelection() {
    const serviceOptions = document.querySelectorAll('.service-option');
    const continueBtn = document.getElementById('continue-to-calendar');
    
    serviceOptions.forEach(option => {
        option.addEventListener('click', function() {
            // Убираем выделение с других опций
            serviceOptions.forEach(opt => opt.classList.remove('selected'));
            
            // Выделяем выбранную опцию
            this.classList.add('selected');
            
            // Сохраняем данные о выбранной услуге
            currentBooking.service = {
                type: this.dataset.service,
                name: this.querySelector('h3').textContent,
                duration: parseInt(this.dataset.duration),
                price: parseInt(this.dataset.price)
            };
            
            // Активируем кнопку продолжения
            continueBtn.disabled = false;
            
            // Отслеживаем выбор услуги
            if (typeof trackEvent !== 'undefined') {
                trackEvent('service_selected', 'booking', currentBooking.service.type);
            }
        });
    });
}

// Настройка календаря
function setupCalendar() {
    const prevBtn = document.getElementById('prev-month');
    const nextBtn = document.getElementById('next-month');
    
    prevBtn.addEventListener('click', () => {
        currentMonth.setMonth(currentMonth.getMonth() - 1);
        renderCalendar();
    });
    
    nextBtn.addEventListener('click', () => {
        currentMonth.setMonth(currentMonth.getMonth() + 1);
        renderCalendar();
    });
    
    renderCalendar();
}

function renderCalendar() {
    const monthElement = document.getElementById('current-month');
    const gridElement = document.getElementById('calendar-grid');
    
    // Названия месяцев
    const months = [
        'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
        'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
    ];
    
    monthElement.textContent = `${months[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`;
    
    // Очищаем календарь
    gridElement.innerHTML = '';
    
    // Добавляем заголовки дней недели
    const dayHeaders = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
    dayHeaders.forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'calendar-day-header';
        dayHeader.textContent = day;
        dayHeader.style.fontWeight = 'bold';
        dayHeader.style.color = '#666';
        dayHeader.style.textAlign = 'center';
        dayHeader.style.padding = '8px 0';
        gridElement.appendChild(dayHeader);
    });
    
    // Получаем первый день месяца и количество дней
    const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    const today = new Date();
    
    // Добавляем пустые ячейки для дней предыдущего месяца
    for (let i = 0; i < firstDay.getDay(); i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day other-month';
        gridElement.appendChild(emptyDay);
    }
    
    // Добавляем дни текущего месяца
    for (let day = 1; day <= lastDay.getDate(); day++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        dayElement.textContent = day;
        
        const currentDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        const dateString = formatDate(currentDate);
        
        // Проверяем, можно ли выбрать этот день
        const isToday = isSameDate(currentDate, today);
        const isPast = currentDate < today && !isToday;
        const isWorkingDay = BOOKING_CONFIG.WORKING_DAYS.includes(currentDate.getDay());
        const isExcluded = BOOKING_CONFIG.EXCLUDED_DATES.includes(dateString);
        
        if (isToday) {
            dayElement.classList.add('today');
        }
        
        if (isPast || !isWorkingDay || isExcluded) {
            dayElement.classList.add('disabled');
        } else {
            dayElement.addEventListener('click', () => selectDate(currentDate, dayElement));
        }
        
        gridElement.appendChild(dayElement);
    }
}

function selectDate(date, element) {
    // Убираем выделение с других дат
    document.querySelectorAll('.calendar-day.selected').forEach(day => {
        day.classList.remove('selected');
    });
    
    // Выделяем выбранную дату
    element.classList.add('selected');
    
    // Сохраняем выбранную дату
    currentBooking.date = date;
    
    // Загружаем временные слоты для выбранной даты
    loadTimeSlotsForDate(date);
    
    // Отслеживаем выбор даты
    if (typeof trackEvent !== 'undefined') {
        trackEvent('date_selected', 'booking', formatDate(date));
    }
}

// Загрузка временных слотов
async function loadAvailableSlots() {
    try {
        // В реальном проекте здесь будет запрос к Google Sheets API
        // Пока используем тестовые данные
        availableSlots = await fetchSlotsFromGoogleSheets();
    } catch (error) {
        console.error('Ошибка загрузки слотов:', error);
        // Используем тестовые данные при ошибке
        availableSlots = generateTestSlots();
    }
}

async function fetchSlotsFromGoogleSheets() {
    // Пример запроса к Google Sheets API
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${BOOKING_CONFIG.GOOGLE_SHEETS_ID}/values/Слоты!A:E?key=${BOOKING_CONFIG.GOOGLE_API_KEY}`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        const slots = {};
        if (data.values && data.values.length > 1) {
            // Пропускаем заголовок (первую строку)
            for (let i = 1; i < data.values.length; i++) {
                const row = data.values[i];
                const [date, time, duration, status, clientName] = row;
                
                if (!slots[date]) {
                    slots[date] = [];
                }
                
                slots[date].push({
                    time: time,
                    duration: parseInt(duration),
                    status: status || 'available', // available, booked, blocked
                    clientName: clientName || null
                });
            }
        }
        
        return slots;
    } catch (error) {
        console.error('Ошибка загрузки из Google Sheets:', error);
        return generateTestSlots();
    }
}

function generateTestSlots() {
    // Генерируем тестовые слоты для демонстрации
    const slots = {};
    const today = new Date();
    
    // Генерируем слоты на следующие 14 дней
    for (let i = 0; i < 14; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        
        // Пропускаем выходные
        if (!BOOKING_CONFIG.WORKING_DAYS.includes(date.getDay())) {
            continue;
        }
        
        const dateString = formatDate(date);
        slots[dateString] = [
            { time: '09:00', duration: 50, status: 'available' },
            { time: '10:00', duration: 50, status: 'available' },
            { time: '11:00', duration: 50, status: 'available' },
            { time: '12:00', duration: 60, status: 'booked', clientName: 'А. Иванов' },
            { time: '14:00', duration: 50, status: 'available' },
            { time: '15:00', duration: 50, status: 'available' },
            { time: '16:00', duration: 50, status: 'available' },
            { time: '17:00', duration: 50, status: 'available' },
            { time: '18:00', duration: 50, status: 'available' }
        ];
    }
    
    return slots;
}

function loadTimeSlotsForDate(date) {
    const slotsContainer = document.getElementById('time-slots');
    const dateString = formatDate(date);
    
    // Проверяем, что availableSlots инициализирован
    if (!availableSlots || Object.keys(availableSlots).length === 0) {
        slotsContainer.innerHTML = '<p class="no-slots">Загружаем доступные слоты...</p>';
        // Перезагружаем слоты и повторяем попытку
        loadAvailableSlots().then(() => {
            loadTimeSlotsForDate(date);
        });
        return;
    }
    
    const daySlots = availableSlots[dateString] || [];
    
    // Очищаем контейнер
    slotsContainer.innerHTML = '';
    
    if (daySlots.length === 0) {
        slotsContainer.innerHTML = '<p class="no-slots">На эту дату нет доступных слотов</p>';
        return;
    }
    
    // Фильтруем слоты по длительности выбранной услуги
    const serviceDuration = currentBooking.service.duration;
    const availableSlotsFiltered = daySlots.filter(slot => 
        slot.status === 'available' && slot.duration >= serviceDuration
    );
    
    if (availableSlotsFiltered.length === 0) {
        slotsContainer.innerHTML = '<p class="no-slots">На эту дату нет подходящих слотов</p>';
        return;
    }
    
    // Создаем элементы слотов
    availableSlotsFiltered.forEach(slot => {
        const slotElement = document.createElement('div');
        slotElement.className = 'time-slot';
        slotElement.textContent = slot.time;
        slotElement.dataset.time = slot.time;
        slotElement.dataset.duration = slot.duration;
        
        slotElement.addEventListener('click', () => selectTimeSlot(slot, slotElement));
        
        slotsContainer.appendChild(slotElement);
    });
    
    // Показываем занятые слоты для информации
    daySlots.filter(slot => slot.status === 'booked').forEach(slot => {
        const slotElement = document.createElement('div');
        slotElement.className = 'time-slot booked';
        slotElement.textContent = slot.time;
        slotElement.title = 'Время занято';
        
        slotsContainer.appendChild(slotElement);
    });
}

function selectTimeSlot(slot, element) {
    // Убираем выделение с других слотов
    document.querySelectorAll('.time-slot.selected').forEach(slot => {
        slot.classList.remove('selected');
    });
    
    // Выделяем выбранный слот
    element.classList.add('selected');
    
    // Сохраняем выбранное время
    currentBooking.time = slot.time;
    currentBooking.duration = slot.duration;
    
    // Активируем кнопку продолжения
    document.getElementById('continue-to-form').disabled = false;
    
    // Отслеживаем выбор времени
    if (typeof trackEvent !== 'undefined') {
        trackEvent('time_selected', 'booking', slot.time);
    }
}

// Навигация между шагами
function setupNavigation() {
    // Кнопки продолжения
    document.getElementById('continue-to-calendar').addEventListener('click', () => {
        goToStep('step-calendar');
    });
    
    document.getElementById('continue-to-form').addEventListener('click', () => {
        updateBookingSummary();
        goToStep('step-form');
    });
    
    // Кнопки назад
    document.getElementById('back-to-service').addEventListener('click', () => {
        goToStep('step-service');
    });
    
    document.getElementById('back-to-calendar').addEventListener('click', () => {
        goToStep('step-calendar');
    });
}

function goToStep(stepId) {
    // Скрываем все шаги
    document.querySelectorAll('.booking-step').forEach(step => {
        step.classList.remove('active');
    });
    
    // Показываем нужный шаг
    document.getElementById(stepId).classList.add('active');
    
    // Прокручиваем к началу
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateBookingSummary() {
    const serviceNames = {
        'individual': 'Индивидуальная терапия',
        'family': 'Семейная терапия',
        'online': 'Онлайн консультация'
    };
    
    document.getElementById('summary-service').textContent = serviceNames[currentBooking.service.type];
    document.getElementById('summary-datetime').textContent = 
        `${formatDateForDisplay(currentBooking.date)} в ${currentBooking.time}`;
    document.getElementById('summary-price').textContent = `${currentBooking.service.price} ₽`;
}

// Настройка формы
function setupForm() {
    const form = document.getElementById('booking-form');
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (!validateBookingForm()) {
            return;
        }
        
        await submitBooking();
    });
    
    // Добавляем обработчик для кнопки добавления в календарь
    document.getElementById('add-to-calendar').addEventListener('click', generateCalendarEvent);
}

function validateBookingForm() {
    const name = document.getElementById('client-name').value.trim();
    const phone = document.getElementById('client-phone').value.trim();
    const consent = document.getElementById('privacy-consent').checked;
    
    if (!name) {
        showNotification('Пожалуйста, укажите ваше имя', 'error');
        return false;
    }
    
    if (!phone) {
        showNotification('Пожалуйста, укажите ваш телефон', 'error');
        return false;
    }
    
    if (!consent) {
        showNotification('Необходимо согласие на обработку персональных данных', 'error');
        return false;
    }
    
    return true;
}

async function submitBooking() {
    showLoader(true);
    
    try {
        // Собираем данные записи
        const bookingData = {
            service: currentBooking.service,
            date: formatDate(currentBooking.date),
            time: currentBooking.time,
            duration: currentBooking.duration,
            price: currentBooking.service.price,
            client: {
                name: document.getElementById('client-name').value.trim(),
                phone: document.getElementById('client-phone').value.trim(),
                email: document.getElementById('client-email').value.trim(),
                message: document.getElementById('client-message').value.trim()
            },
            timestamp: new Date().toISOString()
        };
        
        // Сохраняем запись в Google Sheets
        await saveBookingToGoogleSheets(bookingData);
        
        // Отправляем уведомление
        await sendBookingNotification(bookingData);
        
        // Обновляем слоты (помечаем как занятый)
        await updateSlotStatus(bookingData.date, bookingData.time, 'booked', bookingData.client.name);
        
        // Показываем подтверждение
        showBookingConfirmation(bookingData);
        goToStep('step-confirmation');
        
        // Отслеживаем успешную запись
        if (typeof trackEvent !== 'undefined') {
            trackEvent('booking_completed', 'conversion', bookingData.service.type);
        }
        
    } catch (error) {
        console.error('Ошибка при создании записи:', error);
        showNotification('Произошла ошибка. Пожалуйста, попробуйте еще раз или свяжитесь с нами по телефону.', 'error');
    } finally {
        showLoader(false);
    }
}

async function saveBookingToGoogleSheets(bookingData) {
    // ДЕМО РЕЖИМ: для демонстрации функциональности
    // В реальном проекте здесь будет запрос к Google Sheets API или веб-приложению Google Apps Script
    
    console.log('📋 Сохраняем запись (демо режим):', bookingData);
    
    // Показываем уведомление о демо режиме
    showNotification('💡 ДЕМО РЕЖИМ: Запись создана локально. В реальной версии данные сохранятся в Google Sheets.', 'info');
    
    // Симулируем задержку сохранения
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Возвращаем успешный результат
    return { success: true, message: 'Запись создана (демо режим)' };
    
    /* ЗАКОММЕНТИРОВАНО - для реальной версии раскомментируйте
    const scriptUrl = BOOKING_CONFIG.SCRIPT_URL;
    
    const response = await fetch(scriptUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            action: 'createBooking',
            data: bookingData
        })
    });
    
    if (!response.ok) {
        throw new Error('Ошибка сохранения записи');
    }
    
    return await response.json();
    */
}

async function sendBookingNotification(bookingData) {
    // ВРЕМЕННО: для демонстрации отключаем уведомления
    console.log('📧 Отправляем уведомление (демо режим):', bookingData);
    
    // Симулируем отправку
    await new Promise(resolve => setTimeout(resolve, 500));
    
    /* ЗАКОММЕНТИРОВАНО - раскомментируйте после настройки webhook
    // Отправляем уведомление через webhook (Zapier, Make.com или собственный сервер)
    try {
        await fetch(BOOKING_CONFIG.WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                type: 'new_booking',
                booking: bookingData
            })
        });
    } catch (error) {
        console.error('Ошибка отправки уведомления:', error);
        // Не прерываем процесс записи при ошибке уведомления
    }
    */
}

async function updateSlotStatus(date, time, status, clientName = null) {
    // ВРЕМЕННО: для демонстрации обновляем только локально
    console.log('🔄 Обновляем статус слота (демо режим):', { date, time, status, clientName });
    
    // Обновляем локальные данные
    if (availableSlots[date]) {
        const slot = availableSlots[date].find(s => s.time === time);
        if (slot) {
            slot.status = status;
            slot.clientName = clientName;
        }
    }
    
    /* ЗАКОММЕНТИРОВАНО - раскомментируйте после настройки Apps Script
    // Отправляем обновление в Google Sheets
    try {
        const scriptUrl = BOOKING_CONFIG.SCRIPT_URL;
        
        await fetch(scriptUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'updateSlot',
                data: { date, time, status, clientName }
            })
        });
    } catch (error) {
        console.error('Ошибка обновления слота:', error);
    }
    */
}

function showBookingConfirmation(bookingData) {
    const detailsContainer = document.getElementById('final-booking-details');
    
    detailsContainer.innerHTML = `
        <div class="summary-item">
            <span class="label">Услуга:</span>
            <span>${bookingData.service.name}</span>
        </div>
        <div class="summary-item">
            <span class="label">Дата и время:</span>
            <span>${formatDateForDisplay(new Date(parseDate(bookingData.date)))} в ${bookingData.time}</span>
        </div>
        <div class="summary-item">
            <span class="label">Длительность:</span>
            <span>${bookingData.duration} минут</span>
        </div>
        <div class="summary-item">
            <span class="label">Стоимость:</span>
            <span>${bookingData.price} ₽</span>
        </div>
        <div class="summary-item">
            <span class="label">Клиент:</span>
            <span>${bookingData.client.name}</span>
        </div>
        <div class="summary-item">
            <span class="label">Телефон:</span>
            <span>${bookingData.client.phone}</span>
        </div>
    `;
}

function generateCalendarEvent() {
    const startDate = new Date(currentBooking.date);
    const [hours, minutes] = currentBooking.time.split(':');
    startDate.setHours(parseInt(hours), parseInt(minutes));
    
    const endDate = new Date(startDate);
    endDate.setMinutes(endDate.getMinutes() + currentBooking.duration);
    
    const title = `Консультация с психологом - ${currentBooking.service.name}`;
    const details = `Психологическая консультация с Татьяной Семенцовой\n\nТип: ${currentBooking.service.name}\nДлительность: ${currentBooking.duration} минут\nСтоимость: ${currentBooking.service.price} ₽`;
    
    // Формат даты для Google Calendar
    const formatForCalendar = (date) => {
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };
    
    const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${formatForCalendar(startDate)}/${formatForCalendar(endDate)}&details=${encodeURIComponent(details)}`;
    
    window.open(calendarUrl, '_blank');
}

// Утилиты - ОБНОВЛЕНО для русского формата
function formatDate(date) {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
}

// Функция парсинга даты из русского формата
function parseDate(dateString) {
    const [day, month, year] = dateString.split('.');
    return new Date(year, month - 1, day);
}

function formatDateForDisplay(date) {
    const months = [
        'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
        'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
    ];
    
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

function isSameDate(date1, date2) {
    return date1.toDateString() === date2.toDateString();
}

function showLoader(show) {
    const loader = document.getElementById('booking-loader');
    loader.style.display = show ? 'flex' : 'none';
}

// Функция для показа уведомлений пользователю
function showNotification(message, type = 'info') {
    // Создаем элемент уведомления если его нет
    let notification = document.getElementById('booking-notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'booking-notification';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 10000;
            transition: all 0.3s ease;
            transform: translateX(400px);
        `;
        document.body.appendChild(notification);
    }
    
    // Устанавливаем цвет в зависимости от типа
    const colors = {
        'error': '#e74c3c',
        'success': '#27ae60',
        'info': '#3498db',
        'warning': '#f39c12'
    };
    
    notification.style.backgroundColor = colors[type] || colors['info'];
    notification.textContent = message;
    
    // Показываем уведомление
    notification.style.transform = 'translateX(0)';
    
    // Скрываем через 4 секунды
    setTimeout(() => {
        notification.style.transform = 'translateX(400px)';
    }, 4000);
}

// Экспортируем для использования в других скриптах
window.BookingSystem = {
    currentBooking,
    loadAvailableSlots,
    goToStep
}; 