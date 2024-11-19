/**
 * Класс для управления списком задач
 */
class TaskList {
    /**
     * @param {Object} options - Опции инициализации
     * @param {Object} options.elements - DOM элементы списка задач
     * @param {Object} options.taskFilters - Экземпляр TaskFilters
     * @param {Function} options.onTaskClick - Callback клика по задаче
     * @param {Function} options.onStatusChange - Callback изменения статуса
     */
    constructor(options) {
        this.elements = {
            taskList: options.elements.taskList,
            currentDate: options.elements.currentDate,
            loader: options.elements.loader,
            sortBtn: options.elements.sortBtn,
            incompleteCheckbox: options.elements.incompleteCheckbox
        };

        this.taskFilters = options.taskFilters;
        this.onTaskClick = options.onTaskClick;
        this.onStatusChange = options.onStatusChange;
        this.onFilterChange = options.onFilterChange; // Добавляем новый callback

        this.state = {
            currentTasks: [],
            sortDirection: 'desc',
            selectedStartDate: null,
            selectedEndDate: null
        };

        this.bindEvents();
    }

    /**
     * Привязка обработчиков событий
     * @private
     */
    bindEvents() {
        // Обработка клика по задаче
        this.elements.taskList.on('click', '.task-item', (e) => {
            if ($(e.target).is('input[type="checkbox"]') || 
                $(e.target).hasClass('checkmark') || 
                $(e.target).closest('.task-checkbox').length) {
                return;
            }
            
            const taskId = $(e.currentTarget).data('task-id');
            const task = this.state.currentTasks.find(t => t.id === taskId);
            if (task) {
                this.onTaskClick(task);
            }
        });

        // Обработка изменения чекбокса
        this.elements.taskList.on('change', '.task-checkbox input', (e) => {
            const checkbox = $(e.target);
            const taskItem = checkbox.closest('.task-item');
            const taskId = taskItem.data('task-id');
            const isChecked = checkbox.prop('checked');
            
            if (taskId) {
                this.handleTaskStatusChange(taskId, isChecked);
            }
        });

        // Обработка сортировки
        this.elements.sortBtn.on('click', () => {
            this.handleSortClick();
        });

        // Обработка фильтра незавершенных задач
        this.elements.incompleteCheckbox.on('change', (e) => {
            this.handleIncompleteFilterChange(e);
        });
    }

    /**
     * Получает текущий список задач
     * @returns {Array} Массив текущих задач
     */
    getCurrentTasks() {
        return this.state.currentTasks;
    }

    /**
     * Отображение списка задач
     * @param {Array} tasks - Массив задач
     */
    displayTasks(tasks) {
        this.state.currentTasks = tasks;
        const sortedTasks = this.sortTasks(tasks);
        
        if (sortedTasks.length === 0) {
            this.elements.taskList.html('<div class="empty-state">Задачи не найдены</div>');
            return;
        }

        const tasksHtml = sortedTasks.map(task => this.renderTask(task)).join('');
        this.elements.taskList.html(tasksHtml);
    }

    /**
     * Сортировка задач
     * @private
     * @param {Array} tasks - Массив задач для сортировки
     * @returns {Array} Отсортированный массив
     */
    sortTasks(tasks) {
        return [...tasks].sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return this.state.sortDirection === 'asc' 
                ? dateA - dateB 
                : dateB - dateA;
        });
    }

    /**
     * Отрисовка одной задачи
     * @private
     * @param {Object} task - Объект задачи
     * @returns {string} HTML разметка задачи
     */
    renderTask(task) {
        return `
            <div class="task-item" data-task-id="${task.id}">
                <div class="task-content">
                    <div class="task-title">${task.name}</div>
                    <div class="task-description">${task.shortDesc}</div>
                </div>
                <div class="task-meta">
                    <div class="task-checkbox">
                        <input type="checkbox" ${task.status ? 'checked' : ''}>
                        <span class="checkmark"></span>
                    </div>
                    <div class="task-date">${this.formatDateTime(task.date)}</div>
                </div>
            </div>
        `;
    }

    /**
     * Обработка изменения статуса задачи
     * @private
     * @param {string} taskId - ID задачи
     * @param {boolean} status - Новый статус
     */
    handleTaskStatusChange(taskId, status) {
        const task = this.state.currentTasks.find(t => t.id === taskId);
        if (task) {
            task.status = status;
            this.onStatusChange?.(taskId, status);
        }
    }

    /**
     * Обработка клика по кнопке сортировки
     * @private
     */
    handleSortClick() {
        this.state.sortDirection = this.state.sortDirection === 'asc' ? 'desc' : 'asc';
        this.elements.sortBtn.text(
            `Сортировать по дате ${this.state.sortDirection === 'asc' ? '↑' : '↓'}`
        );
        this.displayTasks(this.state.currentTasks);
    }

    /**
     * Обработка изменения фильтра незавершенных задач
     * @private
     * @param {Event} e - Событие изменения
     */
    handleIncompleteFilterChange(e) {
        const showOnlyIncomplete = $(e.target).is(':checked');
        this.taskFilters.clearFilters();
        
        if (showOnlyIncomplete) {
            this.taskFilters.addIncompleteFilter();
        }
        
        // Сообщаем родительскому компоненту о необходимости перезагрузки задач
        this.onFilterChange?.();
    }

    /**
     * Обновление отображения текущей даты/периода
     * @param {Date} startDate - Начальная дата
     * @param {Date} endDate - Конечная дата
     */
    updateDateDisplay(startDate = null, endDate = null) {
        this.state.selectedStartDate = startDate;
        this.state.selectedEndDate = endDate;

        if (!startDate || !endDate) {
            this.elements.currentDate.text('Все задачи');
            return;
        }

        const formatDate = date => {
            return date.toLocaleDateString('ru-RU', {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
            });
        };

        // Проверяем, является ли выбранный диапазон сегодняшним днем
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const isToday = startDate.getTime() === today.getTime();

        // Проверяем, является ли выбранный диапазон текущей неделей
        const currentMonday = this.getMonday(today);
        const currentSunday = new Date(currentMonday);
        currentSunday.setDate(currentMonday.getDate() + 6);
        currentSunday.setHours(23, 59, 59, 999);
        
        const isCurrentWeek = 
            startDate.getTime() === currentMonday.getTime() &&
            endDate.getTime() === currentSunday.getTime();

        if (isToday) {
            this.elements.currentDate.text('Сегодня');
        } else if (isCurrentWeek) {
            this.elements.currentDate.text('Текущая неделя');
        } else if (startDate.getTime() === endDate.getTime()) {
            this.elements.currentDate.text(formatDate(startDate));
        } else {
            const startStr = formatDate(startDate);
            const endStr = formatDate(endDate);
            this.elements.currentDate.text(`${startStr} - ${endStr}`);
        }
    }

    /**
     * Показ индикатора загрузки
     */
    showLoader() {
        this.elements.loader.show();
        this.elements.taskList.hide();
    }

    /**
     * Скрытие индикатора загрузки
     */
    hideLoader() {
        this.elements.loader.hide();
        this.elements.taskList.show();
    }

    /**
     * Отображение ошибки
     * @param {string} message - Текст ошибки
     */
    showError(message) {
        this.elements.taskList.html(`<div class="error-state">${message}</div>`);
    }

    /**
     * Получение понедельника текущей недели
     * @private
     * @param {Date} date - Исходная дата
     * @returns {Date} Дата понедельника
     */
    getMonday(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(d.setDate(diff));
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

export default TaskList;