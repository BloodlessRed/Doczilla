import Calendar from '../components/Calendar.js';
import Modal from '../components/Modal.js';
import Search from '../components/Search.js';
import TaskList from '../components/TaskList.js';
import TaskFilters from '../utils/TaskFilters.js';

/**
 * Основной класс приложения, координирующий работу всех компонентов
 */
class TodoUI {
    /**
     * @param {Object} api - Экземпляр TodoAPI
     */
    constructor(api) {
        console.log('TodoUI constructor started');
        if (!api) {
            throw new Error('API instance is required');
        }
        this.api = api;
        this.taskFilters = new TaskFilters();
        
        this.initializeElements();
        this.initializeComponents();
        console.log('TodoUI constructor completed');
    }

    /**
     * Инициализация DOM элементов
     * @private
     */
    initializeElements() {
        this.elements = {
            // Основные контейнеры
            calendar: $('#calendar'),
            taskList: $('.task-list'),
            currentDate: $('.current-date'),
            loader: $('.loader'),
            
            // Элементы поиска
            searchInput: $('.search-input'),
            searchContainer: $('.search-container'),
            searchDropdown: $('<div class="search-dropdown"></div>'),
            
            // Элементы модального окна
            modalOverlay: $('.modal-overlay'),
            modalTitle: $('.modal-title'),
            modalDate: $('.modal-date'),
            modalContent: $('.modal-content'),
            modalCheckbox: $('.modal-header .task-checkbox input'),
            modalCloseBtn: $('.modal-footer button'),
            
            // Кнопки и элементы управления
            todayBtn: $('.action-buttons button:contains("Сегодня")'),
            weekBtn: $('.action-buttons button:contains("На неделю")'),
            sortBtn: $('.sort-btn'),
            incompleteCheckbox: $('#incomplete-only')
        };

        // Добавляем выпадающий список поиска в контейнер
        this.elements.searchContainer.append(this.elements.searchDropdown);
    }

    /**
     * Инициализация компонентов
     * @private
     */
    initializeComponents() {
        // Инициализация календаря
        this.calendar = new Calendar({
            element: this.elements.calendar,
            onDateSelect: (startDate, endDate) => this.handleDateSelection(startDate, endDate),
            onRangeSelect: (startDate, endDate) => this.handleDateRangeSelection(startDate, endDate)
        });

        // Инициализация модального окна
        this.modal = new Modal({
            elements: {
                modalOverlay: this.elements.modalOverlay,
                modalTitle: this.elements.modalTitle,
                modalDate: this.elements.modalDate,
                modalContent: this.elements.modalContent,
                modalCheckbox: this.elements.modalCheckbox,
                modalCloseBtn: this.elements.modalCloseBtn
            },
            onStatusChange: (taskId, status) => this.handleTaskStatusChange(taskId, status)
        });

        // Инициализация поиска
        this.search = new Search({
            elements: {
                searchInput: this.elements.searchInput,
                searchContainer: this.elements.searchContainer,
                searchDropdown: this.elements.searchDropdown
            },
            api: this.api,
            onTaskSelect: (task) => this.modal.show(task)
        });

        // Инициализация списка задач
        this.taskList = new TaskList({
            elements: {
                taskList: this.elements.taskList,
                currentDate: this.elements.currentDate,
                loader: this.elements.loader,
                sortBtn: this.elements.sortBtn,
                incompleteCheckbox: this.elements.incompleteCheckbox
            },
            taskFilters: this.taskFilters,
            onTaskClick: (task) => this.modal.show(task),
            onStatusChange: (taskId, status) => this.handleTaskStatusChange(taskId, status),
            onFilterChange: () => this.loadAndDisplayTasks()
        });

        this.bindEvents();
    }

    /**
     * Привязка обработчиков событий
     * @private
     */
    bindEvents() {
        this.elements.todayBtn.on('click', () => this.handleTodayClick());
        this.elements.weekBtn.on('click', () => this.handleWeekClick());
    }

    /**
     * Инициализация приложения
     */
    async init() {
        console.log('TodoUI init started');
        try {
            await this.loadAllTasks();
            console.log('TodoUI init completed successfully');
        } catch (error) {
            console.error('Failed to initialize application:', error);
            this.taskList.showError('Не удалось загрузить приложение. Пожалуйста, попробуйте позже.');
        }
    }

    /**
     * Загрузка всех задач
     * @private
     */
    async loadAllTasks() {
        try {
            this.taskList.showLoader();
            const tasks = await this.api.getAllTodos();
            this.taskList.displayTasks(tasks);
        } catch (error) {
            console.error('Error loading all tasks:', error);
            this.taskList.showError('Ошибка загрузки задач');
        } finally {
            this.taskList.hideLoader();
        }
    }

    /**
     * Загрузка и отображение задач по фильтрам
     * @private 
     */
    async loadAndDisplayTasks() {
        console.log('Loading and displaying tasks...');
        
        try {
            this.taskList.showLoader();
            let tasks;

            const dateRange = this.calendar.getSelectedDateRange();
            if (dateRange.startDate && dateRange.endDate) {
                tasks = await this.api.getTodosByDate(
                    dateRange.startDate,
                    dateRange.endDate,
                    this.elements.incompleteCheckbox.prop('checked')
                );
            } else {
                tasks = await this.api.getAllTodos();
            }

            const filteredTasks = this.taskFilters.applyFilters(tasks);
            this.taskList.displayTasks(filteredTasks);
            
            // Обновляем отображение текущего периода
            this.taskList.updateDateDisplay(dateRange.startDate, dateRange.endDate);
            
        } catch (error) {
            console.error('Error loading tasks:', error);
            this.taskList.showError('Ошибка загрузки задач');
        } finally {
            this.taskList.hideLoader();
        }
    }

    /**
     * Обработчик выбора даты
     * @private
     */
    async handleDateSelection(startDate, endDate) {
        this.taskFilters.clearFilters();
        this.taskFilters.addDateRangeFilter(startDate, endDate);
        await this.loadAndDisplayTasks();
    }

    /**
     * Обработчик выбора диапазона дат
     * @private
     */
    async handleDateRangeSelection(startDate, endDate) {
        this.taskFilters.clearFilters();
        this.taskFilters.addDateRangeFilter(startDate, endDate);
        await this.loadAndDisplayTasks();
    }

    /**
     * Обработчик клика по кнопке "Сегодня"
     * @private
     */
    async handleTodayClick() {
        const today = new Date();
        const startDate = new Date(today);
        startDate.setHours(0, 0, 0, 0);
        
        const endDate = new Date(today);
        endDate.setHours(23, 59, 59, 999);
        
        this.taskFilters.clearFilters();
        this.taskFilters.addTodayFilter();
        
        this.calendar.setDateRange(startDate, endDate);
        await this.loadAndDisplayTasks();
    }

    /**
     * Обработчик клика по кнопке "На неделю"
     * @private
     */
    async handleWeekClick() {
        const today = new Date();
        const monday = this.calendar.getMonday(today);
        monday.setHours(0, 0, 0, 0);
        
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        sunday.setHours(23, 59, 59, 999);
        
        this.taskFilters.clearFilters();
        this.taskFilters.addCurrentWeekFilter();
        
        this.calendar.setDateRange(monday, sunday);
        await this.loadAndDisplayTasks();
    }

    /**
     * Синхронизирует изменение статуса задачи между модальным окном и списком задач
     * @private
     * @param {string} taskId - ID задачи
     * @param {boolean} status - Новый статус
     */
    handleTaskStatusChange(taskId, status) {
        // Если изменение пришло из модального окна, обновляем чекбокс в списке задач
        const taskCheckbox = this.elements.taskList
            .find(`.task-item[data-task-id="${taskId}"] .task-checkbox input`);
        if (taskCheckbox.length) {
            taskCheckbox.prop('checked', status);
        }

        // Если модальное окно открыто и показывает эту задачу, обновляем его чекбокс
        if (this.elements.modalOverlay.is(':visible') && 
            this.elements.modalOverlay.data('current-task-id') === taskId) {
            this.elements.modalCheckbox.prop('checked', status);
        }

        // Обновляем статус в текущем списке задач
        const currentTasks = this.taskList.getCurrentTasks();
        const task = currentTasks.find(t => t.id === taskId);
        if (task) {
            task.status = status;
        }

        // Если включен фильтр "Только невыполненные" и задача помечена как выполненная,
        // перезагружаем список
        if (this.elements.incompleteCheckbox.prop('checked') && status) {
            this.loadAndDisplayTasks();
        }
    }

    /**
     * Уничтожение экземпляра класса и очистка ресурсов
     */
    destroy() {
        console.log('Destroying TodoUI instance');
        
        // Уничтожаем компоненты
        this.calendar.destroy();
        this.search.destroy();
        this.modal.destroy();
        this.taskList.destroy();
        
        // Отвязываем обработчики событий
        this.elements.todayBtn.off('click');
        this.elements.weekBtn.off('click');
    }
}

export default TodoUI;