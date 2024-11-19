/**
 * Класс, отвечающий за работу с календарем и выбором дат
 */
class Calendar {
    /**
     * @param {Object} options - Опции инициализации
     * @param {jQuery} options.element - DOM элемент календаря
     * @param {Function} options.onDateSelect - Callback выбора даты
     * @param {Function} options.onRangeSelect - Callback выбора диапазона дат
     */
    constructor(options) {
        this.element = options.element;
        this.onDateSelect = options.onDateSelect;
        this.onRangeSelect = options.onRangeSelect;

        this.state = {
            selectedStartDate: null,
            selectedEndDate: null,
            isShiftPressed: false,
            rangeSelection: false
        };

        this.init();
        this.setupEventListeners();
    }

    /**
     * Инициализация календаря
     * @private
     */
    init() {
        this.element.datepicker({
            dateFormat: 'dd.mm.yy',
            firstDay: 1,
            showOtherMonths: true,
            selectOtherMonths: true,
            onSelect: (dateText, inst) => this.handleDateSelect(dateText, inst),
            numberOfMonths: 1,
            regional: 'ru'
        });

        // Создаем элемент для подсказки
        this.$tooltip = $('<div class="calendar-tooltip"></div>').insertAfter(this.element);
    }

    /**
     * Установка обработчиков событий
     * @private
     */
    setupEventListeners() {
        // Обработка клавиши Shift
        $(document).on('keydown.calendar', (e) => {
            if (e.key === 'Shift' && !this.state.isShiftPressed) {
                this.handleShiftPress();
            }
        });

        $(document).on('keyup.calendar', (e) => {
            if (e.key === 'Shift' && this.state.isShiftPressed) {
                this.handleShiftRelease();
            }
        });

        // Сброс состояния при потере фокуса окном
        $(window).on('blur.calendar', () => {
            this.resetShiftState();
        });
    }

    /**
     * Обработка нажатия Shift
     * @private
     */
    handleShiftPress() {
        this.state.isShiftPressed = true;
        this.element.addClass('shift-pressed');
        this.showTooltip('Выберите начальную дату диапазона');
    }

    /**
     * Обработка отпускания Shift
     * @private
     */
    handleShiftRelease() {
        this.state.isShiftPressed = false;
        this.element.removeClass('shift-pressed');
        this.hideTooltip();

        if (this.state.rangeSelection) {
            this.onRangeSelect?.(this.state.selectedStartDate, this.state.selectedEndDate);
            // Сбрасываем состояние выбора диапазона после завершения выбора
            this.state.rangeSelection = false;
        }
    }

    /**
     * Сброс состояния Shift
     * @private
     */
    resetShiftState() {
        this.state.isShiftPressed = false;
        this.state.rangeSelection = false;
        this.element.removeClass('shift-pressed');
        this.hideTooltip();
    }

    /**
     * Обработка выбора даты в календаре
     * @private
     * @param {string} dateText - Выбранная дата в текстовом формате
     * @param {Object} inst - Экземпляр датапикера
     */
    handleDateSelect(dateText, inst) {
        const selectedDate = this.parseDate(dateText);
        if (!selectedDate) {
            console.error('Failed to parse date:', dateText);
            return;
        }

        if (this.state.isShiftPressed) {
            this.handleRangeSelection(selectedDate);
        } else {
            // Очищаем предыдущие выделения
            this.clearHighlights();
            this.handleSingleSelection(selectedDate);
        }
    }

    /**
     * Обработка выбора диапазона дат
     * @private
     * @param {Date} selectedDate - Выбранная дата
     */
    handleRangeSelection(selectedDate) {
        if (!this.state.selectedStartDate || !this.state.rangeSelection) {
            // Начало выбора диапазона
            this.clearHighlights(); // Очищаем предыдущие выделения
            this.state.selectedStartDate = new Date(selectedDate);
            this.state.selectedStartDate.setHours(0, 0, 0, 0);
            this.state.selectedEndDate = new Date(selectedDate);
            this.state.selectedEndDate.setHours(23, 59, 59, 999);
            this.state.rangeSelection = true;
            this.showTooltip('Выберите конечную дату диапазона');
        } else {
            // Завершение выбора диапазона
            const startDate = new Date(Math.min(this.state.selectedStartDate, selectedDate));
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(Math.max(this.state.selectedStartDate, selectedDate));
            endDate.setHours(23, 59, 59, 999);

            this.state.selectedStartDate = startDate;
            this.state.selectedEndDate = endDate;
            this.state.rangeSelection = false;
            this.hideTooltip();
            this.onRangeSelect?.(startDate, endDate);
        }

        this.highlightSelectedRange();
    }

    /**
     * Обработка выбора одной даты
     * @private
     * @param {Date} selectedDate - Выбранная дата
     */
    handleSingleSelection(selectedDate) {
        this.state.rangeSelection = false;
        this.state.selectedStartDate = new Date(selectedDate);
        this.state.selectedStartDate.setHours(0, 0, 0, 0);
        this.state.selectedEndDate = new Date(selectedDate);
        this.state.selectedEndDate.setHours(23, 59, 59, 999);

        this.highlightDate(selectedDate);
        this.onDateSelect?.(this.state.selectedStartDate, this.state.selectedEndDate);
    }

    /**
     * Подсветка выбранного диапазона дат
     * @private
     */
    highlightSelectedRange() {
        this.clearHighlights();
        if (!this.state.selectedStartDate || !this.state.selectedEndDate) return;

        const start = new Date(Math.min(this.state.selectedStartDate, this.state.selectedEndDate));
        const end = new Date(Math.max(this.state.selectedStartDate, this.state.selectedEndDate));
        const current = new Date(start);

        while (current <= end) {
            this.highlightDate(
                new Date(current),
                current.getTime() === start.getTime() ||
                current.getTime() === end.getTime() ? 'selected' : 'range'
            );
            current.setDate(current.getDate() + 1);
        }
    }

    /**
     * Подсветка конкретной даты
     * @private
     * @param {Date} date - Дата для подсветки
     * @param {string} type - Тип подсветки ('selected' или 'range')
     */
    highlightDate(date, type = 'selected') {
        const dayCell = this.element
            .find(`td a:contains('${date.getDate()}')`).parent();
        
        if (type === 'selected') {
            dayCell.addClass('selected-date');
        } else {
            dayCell.addClass('range-date');
        }
    }

    /**
     * Очистка подсветки всех дат
     * @private
     */
    clearHighlights() {
        this.element
            .find('td')
            .removeClass('selected-date range-date');
    }

    /**
     * Получение текущего выбранного диапазона дат
     * @returns {Object} Объект с начальной и конечной датой
     */
    getSelectedDateRange() {
        return {
            startDate: this.state.selectedStartDate,
            endDate: this.state.selectedEndDate
        };
    }

    /**
     * Установка даты в календаре
     * @param {Date} date - Дата для установки
     */
    setDate(date) {
        if (!(date instanceof Date) || isNaN(date.getTime())) {
            console.error('Invalid date:', date);
            return;
        }

        // Очищаем предыдущие выделения перед установкой новой даты
        this.clearHighlights();
        
        const dateStr = $.datepicker.formatDate('dd.mm.yy', date);
        this.element.datepicker('setDate', dateStr);
        
        // Устанавливаем состояние для одной выбранной даты
        this.state.selectedStartDate = new Date(date);
        this.state.selectedStartDate.setHours(0, 0, 0, 0);
        this.state.selectedEndDate = new Date(date);
        this.state.selectedEndDate.setHours(23, 59, 59, 999);
        this.state.rangeSelection = false;
        
        // Подсвечиваем выбранную дату
        this.highlightDate(date);
    }

    /**
     * Установка диапазона дат
     * @param {Date} startDate - Начальная дата
     * @param {Date} endDate - Конечная дата
     */
    setDateRange(startDate, endDate) {
        if (!(startDate instanceof Date) || !(endDate instanceof Date) ||
            isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            console.error('Invalid dates:', { startDate, endDate });
            return;
        }

        // Очищаем предыдущие выделения
        this.clearHighlights();

        // Устанавливаем новые даты в состояние
        this.state.selectedStartDate = new Date(startDate);
        this.state.selectedEndDate = new Date(endDate);
        this.state.rangeSelection = false;

        // Отображаем первую дату в календаре
        const dateStr = $.datepicker.formatDate('dd.mm.yy', startDate);
        this.element.datepicker('setDate', dateStr);

        // Подсвечиваем диапазон
        this.highlightSelectedRange();
    }

    /**
     * Показ подсказки
     * @private
     * @param {string} message - Текст подсказки
     */
    showTooltip(message) {
        this.$tooltip.text(message).show();
    }

    /**
     * Скрытие подсказки
     * @private
     */
    hideTooltip() {
        this.$tooltip.hide();
    }

    /**
     * Получение понедельника текущей недели
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
     * Получение воскресенья текущей недели
     * @param {Date} monday - Дата понедельника
     * @returns {Date} Дата воскресенья
     */
    getSunday(monday) {
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        return sunday;
    }

    /**
     * Парсинг даты из строки
     * @private
     * @param {string} dateText - Дата в формате dd.mm.yy
     * @returns {Date|null} Объект Date или null в случае ошибки
     */
    parseDate(dateText) {
        const parts = dateText.split('.');
        if (parts.length !== 3) {
            console.error('Invalid date format:', dateText);
            return null;
        }

        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        let year = parseInt(parts[2], 10);
        
        if (year < 100) {
            year += year < 50 ? 2000 : 1900;
        }

        const date = new Date(year, month, day);
        if (isNaN(date.getTime())) {
            console.error('Invalid date components:', { day, month, year });
            return null;
        }

        return date;
    }

    /**
     * Уничтожение компонента и очистка обработчиков
     */
    destroy() {
        $(document).off('keydown.calendar keyup.calendar');
        $(window).off('blur.calendar');
        this.$tooltip.remove();
    }
}

export default Calendar;