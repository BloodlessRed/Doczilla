/**
 * Главный модуль приложения
 * Инициализирует основные компоненты и запускает приложение
 */

import TodoAPI from './api/TodoAPI.js';
import TodoUI from './ui/TodoUI.js';

// Добавим логирование для отладки
console.log('Main module loaded');

// Инициализация приложения при загрузке документа
$(document).ready(() => {
    console.log('Document ready, initializing application...');
    
    try {
        const api = new TodoAPI();
        const ui = new TodoUI(api);
        
        // Инициализируем UI и обрабатываем возможные ошибки
        ui.init().catch(error => {
            console.error('Failed to initialize application:', error);
            // Здесь можно добавить отображение глобальной ошибки пользователю
        });

        // Добавляем обработчик для очистки ресурсов при выгрузке страницы
        $(window).on('unload', () => {
            if (ui) {
                ui.destroy();
            }
        });
    } catch (error) {
        console.error('Critical error during application initialization:', error);
        // Здесь можно добавить отображение критической ошибки пользователю
    }
});