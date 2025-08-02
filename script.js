// Навигация - мобильное меню
document.addEventListener('DOMContentLoaded', function() {
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');
    
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', function() {
            navToggle.classList.toggle('active');
            navMenu.classList.toggle('active');
        });

        // Закрытие меню при клике на ссылку
        const navLinks = navMenu.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                navToggle.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });

        // Закрытие меню при клике вне его
        document.addEventListener('click', function(event) {
            if (!navToggle.contains(event.target) && !navMenu.contains(event.target)) {
                navToggle.classList.remove('active');
                navMenu.classList.remove('active');
            }
        });
    }
});

// Плавная прокрутка для якорных ссылок
document.addEventListener('DOMContentLoaded', function() {
    const anchorsLinks = document.querySelectorAll('a[href^="#"]');
    
    anchorsLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                const offsetTop = targetElement.offsetTop - 80; // Учитываем высоту фиксированной навигации
                
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });
});

// Фильтрация материалов на странице materials.html
document.addEventListener('DOMContentLoaded', function() {
    const categoryButtons = document.querySelectorAll('.category-btn');
    const materialCards = document.querySelectorAll('.material-card');
    
    if (categoryButtons.length > 0 && materialCards.length > 0) {
        categoryButtons.forEach(button => {
            button.addEventListener('click', function() {
                const category = this.getAttribute('data-category');
                
                // Убираем активный класс со всех кнопок
                categoryButtons.forEach(btn => btn.classList.remove('active'));
                
                // Добавляем активный класс к нажатой кнопке
                this.classList.add('active');
                
                // Фильтруем карточки
                materialCards.forEach(card => {
                    const cardCategories = card.getAttribute('data-category');
                    
                    if (category === 'all' || cardCategories.includes(category)) {
                        card.style.display = 'block';
                        card.style.animation = 'fadeInUp 0.5s ease-out';
                    } else {
                        card.style.display = 'none';
                    }
                });
                
                // Аналитика: отслеживание фильтрации материалов
                trackEvent('filter_materials', 'materials', category);
            });
        });
    }
});

// Обработка скачивания материалов
document.addEventListener('DOMContentLoaded', function() {
    const downloadButtons = document.querySelectorAll('.download-btn');
    
    downloadButtons.forEach(button => {
        button.addEventListener('click', function() {
            const fileName = this.getAttribute('data-file');
            
            // Показываем уведомление
            showNotification(`Скачивание файла "${fileName}" начнется автоматически`, 'info');
            
            // Аналитика: отслеживание скачивания
            trackEvent('file_download', 'engagement', fileName);
            
            // В реальном проекте здесь будет:
            // window.open(`/materials/${fileName}`, '_blank');
        });
    });
});

// Отслеживание аналитических событий
function trackEvent(eventName, category, label) {
    // Google Analytics 4
    if (typeof gtag !== 'undefined') {
        gtag('event', eventName, {
            'event_category': category,
            'event_label': label,
            'custom_parameter': window.location.pathname
        });
    }
    
    // Yandex.Metrica (замените XXXXXX на ваш номер счетчика)
    if (typeof ym !== 'undefined') {
        ym(XXXXXX, 'reachGoal', eventName, {
            category: category,
            label: label
        });
    }
    
    // Отладка в консоли (удалить в продакшене)
    console.log(`Analytics Event: ${eventName}, Category: ${category}, Label: ${label}`);
}

// Отслеживание кликов по важным элементам
document.addEventListener('DOMContentLoaded', function() {
    // Кнопки записи на консультацию
    document.querySelectorAll('[href="#appointment"], .btn-primary').forEach(button => {
        button.addEventListener('click', function() {
            const buttonText = this.textContent.trim();
            trackEvent('click_appointment', 'conversion', buttonText);
        });
    });
    
    // Клики по телефону
    document.querySelectorAll('[href^="tel:"]').forEach(link => {
        link.addEventListener('click', function() {
            const phoneNumber = this.getAttribute('href').replace('tel:', '');
            trackEvent('phone_call', 'contact', phoneNumber);
        });
    });
    
    // Клики по email
    document.querySelectorAll('[href^="mailto:"]').forEach(link => {
        link.addEventListener('click', function() {
            const email = this.getAttribute('href').replace('mailto:', '');
            trackEvent('email_click', 'contact', email);
        });
    });
    
    // Клики по социальным сетям
    document.querySelectorAll('[href*="t.me"], [href*="vk.com"], [href*="instagram"], [href*="telegram"]').forEach(link => {
        link.addEventListener('click', function() {
            const social = this.getAttribute('href');
            let platform = 'unknown';
            if (social.includes('t.me') || social.includes('telegram')) platform = 'telegram';
            else if (social.includes('vk.com')) platform = 'vkontakte';
            else if (social.includes('instagram')) platform = 'instagram';
            
            trackEvent('social_click', 'social', platform);
        });
    });
    
    // Переходы между страницами
    document.querySelectorAll('a[href="materials.html"]').forEach(link => {
        link.addEventListener('click', function() {
            trackEvent('page_visit', 'navigation', 'materials');
        });
    });
    
    document.querySelectorAll('a[href="index.html"], a[href="/"]').forEach(link => {
        link.addEventListener('click', function() {
            trackEvent('page_visit', 'navigation', 'home');
        });
    });
});

// Отслеживание времени на странице
let pageStartTime = Date.now();
let timeTracked = false;

// Отправляем событие после 30 секунд на странице
setTimeout(() => {
    if (!timeTracked) {
        trackEvent('engaged_user', 'engagement', '30_seconds');
        timeTracked = true;
    }
}, 30000);

// Отслеживание глубины скролла
let maxScroll = 0;
let scrollTracked = {
    '25': false,
    '50': false,
    '75': false,
    '100': false
};

window.addEventListener('scroll', function() {
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrolled = window.scrollY;
    const scrollPercent = Math.round((scrolled / scrollHeight) * 100);
    
    maxScroll = Math.max(maxScroll, scrollPercent);
    
    // Отслеживаем ключевые точки скролла
    Object.keys(scrollTracked).forEach(threshold => {
        if (maxScroll >= parseInt(threshold) && !scrollTracked[threshold]) {
            trackEvent('scroll_depth', 'engagement', `${threshold}_percent`);
            scrollTracked[threshold] = true;
        }
    });
});

// Отслеживание ухода со страницы
window.addEventListener('beforeunload', function() {
    const timeOnPage = Math.round((Date.now() - pageStartTime) / 1000);
    
    if (timeOnPage > 10) { // Только если пользователь был на странице больше 10 секунд
        // Используем sendBeacon для надежной отправки
        if (navigator.sendBeacon && typeof gtag !== 'undefined') {
            gtag('event', 'page_timing', {
                'event_category': 'engagement',
                'event_label': 'time_on_page',
                'value': timeOnPage,
                'custom_parameter_1': maxScroll
            });
        }
    }
});

// Система уведомлений
function showNotification(message, type = 'info') {
    // Создаем контейнер для уведомлений, если его нет
    let notificationContainer = document.querySelector('.notification-container');
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.className = 'notification-container';
        document.body.appendChild(notificationContainer);
    }
    
    // Создаем уведомление
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Добавляем уведомление в контейнер
    notificationContainer.appendChild(notification);
    
    // Показываем уведомление
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Убираем уведомление через 3 секунды
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Анимация появления элементов при скролле
document.addEventListener('DOMContentLoaded', function() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                
                // Отслеживаем просмотр секций
                const sectionName = entry.target.id || entry.target.className.split(' ')[0];
                if (sectionName && !entry.target.dataset.tracked) {
                    trackEvent('section_view', 'engagement', sectionName);
                    entry.target.dataset.tracked = 'true';
                }
            }
        });
    }, observerOptions);
    
    // Наблюдаем за элементами
    const animatedElements = document.querySelectorAll('.service-card, .review, .contact-item, .material-card, .info-item, section');
    animatedElements.forEach(el => {
        observer.observe(el);
    });
});

// Валидация формы (если форма не от Tally.so)
function validateForm(form) {
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            showFieldError(field, 'Это поле обязательно для заполнения');
            isValid = false;
        } else {
            clearFieldError(field);
        }
    });
    
    // Валидация email
    const emailFields = form.querySelectorAll('input[type="email"]');
    emailFields.forEach(field => {
        if (field.value && !isValidEmail(field.value)) {
            showFieldError(field, 'Введите корректный email адрес');
            isValid = false;
        }
    });
    
    // Валидация телефона
    const phoneFields = form.querySelectorAll('input[type="tel"]');
    phoneFields.forEach(field => {
        if (field.value && !isValidPhone(field.value)) {
            showFieldError(field, 'Введите корректный номер телефона');
            isValid = false;
        }
    });
    
    return isValid;
}

function showFieldError(field, message) {
    clearFieldError(field);
    
    const errorElement = document.createElement('div');
    errorElement.className = 'field-error';
    errorElement.textContent = message;
    
    field.parentNode.appendChild(errorElement);
    field.classList.add('error');
}

function clearFieldError(field) {
    const errorElement = field.parentNode.querySelector('.field-error');
    if (errorElement) {
        errorElement.remove();
    }
    field.classList.remove('error');
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function isValidPhone(phone) {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
}

// Lazy loading для изображений
document.addEventListener('DOMContentLoaded', function() {
    const images = document.querySelectorAll('img[data-src]');
    
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver(function(entries, observer) {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                    imageObserver.unobserve(img);
                }
            });
        });
        
        images.forEach(img => imageObserver.observe(img));
    } else {
        // Fallback для старых браузеров
        images.forEach(img => {
            img.src = img.dataset.src;
            img.classList.remove('lazy');
        });
    }
});

// Обработка отправки форм обратной связи
document.addEventListener('DOMContentLoaded', function() {
    const contactForms = document.querySelectorAll('.contact-form');
    
    contactForms.forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            if (validateForm(form)) {
                // Отслеживаем успешную отправку формы
                trackEvent('form_submit', 'conversion', 'contact_form');
                
                // Здесь будет отправка данных на сервер
                showNotification('Сообщение отправлено! Мы свяжемся с вами в ближайшее время.', 'success');
                form.reset();
            } else {
                // Отслеживаем ошибки валидации
                trackEvent('form_error', 'engagement', 'validation_failed');
            }
        });
    });
});

// Счетчик символов для текстовых полей
document.addEventListener('DOMContentLoaded', function() {
    const textareas = document.querySelectorAll('textarea[maxlength]');
    
    textareas.forEach(textarea => {
        const maxLength = textarea.getAttribute('maxlength');
        const counter = document.createElement('div');
        counter.className = 'char-counter';
        counter.textContent = `0/${maxLength}`;
        
        textarea.parentNode.appendChild(counter);
        
        textarea.addEventListener('input', function() {
            const currentLength = this.value.length;
            counter.textContent = `${currentLength}/${maxLength}`;
            
            if (currentLength > maxLength * 0.9) {
                counter.classList.add('warning');
            } else {
                counter.classList.remove('warning');
            }
        });
    });
});

// Защита от спама (простая)
window.addEventListener('load', function() {
    // Добавляем скрытое поле-ловушку для ботов
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        const honeypot = document.createElement('input');
        honeypot.type = 'text';
        honeypot.name = 'website';
        honeypot.style.display = 'none';
        honeypot.tabIndex = -1;
        honeypot.autocomplete = 'off';
        
        form.appendChild(honeypot);
    });
}); 