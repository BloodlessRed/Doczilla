class TaskFilters {
    constructor() {
        this.filters = new Set();
    }

    /**
     * Добавляет фильтр по дате для сегодняшнего дня
     */
    addTodayFilter() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        this.filters.add(task => {
            const taskDate = new Date(task.date);
            taskDate.setHours(0, 0, 0, 0);
            return taskDate.getTime() === today.getTime();
        });
    }

    /**
     * Добавляет фильтр для текущей недели (Пн-Вс)
     */
    addCurrentWeekFilter() {
        const today = new Date();
        const currentDay = today.getDay();
        const diff = currentDay === 0 ? 6 : currentDay - 1; // Корректировка для понедельника
        
        const monday = new Date(today);
        monday.setDate(today.getDate() - diff);
        monday.setHours(0, 0, 0, 0);
        
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        sunday.setHours(23, 59, 59, 999);

        this.filters.add(task => {
            const taskDate = new Date(task.date);
            return taskDate >= monday && taskDate <= sunday;
        });
    }

    /**
     * Добавляет фильтр по статусу выполнения
     */
    addIncompleteFilter() {
        this.filters.add(task => !task.status);
    }

    /**
     * Добавляет фильтр по диапазону дат
     */
    addDateRangeFilter(startDate, endDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        this.filters.add(task => {
            const taskDate = new Date(task.date);
            return taskDate >= start && taskDate <= end;
        });
    }

    /**
     * Очищает все активные фильтры
     */
    clearFilters() {
        this.filters.clear();
    }

    /**
     * Применяет все активные фильтры к массиву задач
     */
    applyFilters(tasks) {
        if (!this.filters.size) {
            return tasks;
        }

        return tasks.filter(task => 
            Array.from(this.filters).every(filter => filter(task))
        );
    }



    /**
     * Вспомогательный метод для форматирования даты в локальную строку
     */
    static formatDateRange(startDate, endDate) {
        const formatDate = date => {
            return date.toLocaleDateString('ru-RU', {
                day: '2-digit',
                month: 'long'
            });
        };

        if (startDate.getTime() === endDate.getTime()) {
            return formatDate(startDate);
        }

        return `${formatDate(startDate)} - ${formatDate(endDate)}`;
    }
}

export default TaskFilters;