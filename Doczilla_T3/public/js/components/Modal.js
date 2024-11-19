/**
 * Класс, отвечающий за работу с модальным окном задачи
 */
class Modal {
    /**
     * @param {Object} options - Опции инициализации
     * @param {Object} options.elements - DOM элементы модального окна
     * @param {Function} options.onStatusChange - Callback изменения статуса задачи
     */
    constructor(options) {
        this.elements = {
            overlay: options.elements.modalOverlay,
            title: options.elements.modalTitle,
            date: options.elements.modalDate,
            content: options.elements.modalContent,
            checkbox: options.elements.modalCheckbox,
            closeBtn: options.elements.modalCloseBtn
        };
        
        this.onStatusChange = options.onStatusChange;
        this.currentTaskId = null;

        this.bindEvents();
    }

    /**
     * Привязка обработчиков событий
     * @private
     */
    bindEvents() {
        // Закрытие по кнопке
        this.elements.closeBtn.on('click', () => this.close());

        // Закрытие по клику на оверлей
        this.elements.overlay.on('click', (e) => {
            if ($(e.target).is('.modal-overlay')) {
                this.close();
            }
        });

        // Обработка изменения чекбокса
        this.elements.checkbox.on('change', (e) => this.handleCheckboxChange(e));
    }

    /**
     * Показ модального окна с задачей
     * @param {Object} task - Объект задачи
     * @param {string} task.id - ID задачи
     * @param {string} task.name - Название задачи
     * @param {string} task.date - Дата задачи
     * @param {string} task.fullDesc - Полное описание
     * @param {string} task.shortDesc - Краткое описание
     * @param {boolean} task.status - Статус выполнения
     */
    show(task) {
        this.currentTaskId = task.id;
        
        this.elements.title.text(task.name);
        this.elements.date.text(this.formatDateTime(task.date));
        this.elements.content.text(task.fullDesc || task.shortDesc);
        this.elements.checkbox.prop('checked', task.status);
        
        this.elements.overlay
            .data('current-task-id', task.id)
            .addClass('active');
            
        $('body').css('overflow', 'hidden');
    }

    /**
     * Закрытие модального окна
     */
    close() {
        this.elements.overlay.removeClass('active');
        $('body').css('overflow', '');
        this.currentTaskId = null;
    }

    /**
     * Обработчик изменения статуса задачи
     * @private
     * @param {Event} e - Событие изменения
     */
    handleCheckboxChange(e) {
        const isChecked = $(e.target).prop('checked');
        if (this.currentTaskId && this.onStatusChange) {
            this.onStatusChange(this.currentTaskId, isChecked);
        }
    }

    /**
     * Форматирование даты и времени
     * @private
     * @param {string} dateStr - Строка с датой
     * @returns {string} Отформатированная дата
     */
    formatDateTime(dateStr) {
        return new Date(dateStr).toLocaleString('ru-RU');
    }
}

export default Modal;