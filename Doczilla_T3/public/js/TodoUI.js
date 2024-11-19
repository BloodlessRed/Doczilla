import TaskFilters from './TaskFilters.js'
class TodoUI {
    constructor(api) {
        console.log('TodoUI constructor started');
        if (!api) {
            throw new Error('API instance is required');
        }
        this.api = api;
        this.taskFilters = new TaskFilters();
        
        this.initializeElements();
        this.initializeState();
        console.log('TodoUI constructor completed');
    }

    initializeElements() {
        this.elements = {
            calendar: $('#calendar'),
            searchInput: $('.search-input'),
            taskList: $('.task-list'),
            todayBtn: $('.action-buttons button:contains("Сегодня")'),
            weekBtn: $('.action-buttons button:contains("На неделю")'),
            sortBtn: $('.sort-btn'),
            incompleteCheckbox: $('#incomplete-only'),
            currentDate: $('.current-date'),
            loader: $('.loader'),
            searchInput: $('.search-input'),
            searchContainer: $('.search-container'),
            searchDropdown: $('<div class="search-dropdown"></div>'),
            modalOverlay: $('.modal-overlay'),
            modalTitle: $('.modal-title'),
            modalDate: $('.modal-date'),
            modalContent: $('.modal-content'),
            modalCheckbox: $('.modal-header .task-checkbox input'),
            modalCloseBtn: $('.modal-footer button')
        };

        this.elements.searchContainer.append(this.elements.searchDropdown);
    }

    initializeState() {
        this.state = {
            sortDirection: 'desc',
            selectedStartDate: null,
            selectedEndDate: null,
            currentTasks: [],
            searchTimeout: null,
            isShiftPressed: false,
            rangeSelection: false
        };
    }

    setupEventListeners() {
        $(document).on('keydown.todoui', (e) => {
            if (e.key === 'Shift') {
                console.log('Shift pressed');
                this.state.isShiftPressed = true;
            }
        });

        $(document).on('keyup.todoui', (e) => {
            if (e.key === 'Shift') {
                console.log('Shift released');
                this.state.isShiftPressed = false;
                if (this.state.rangeSelection) {
                    this.state.rangeSelection = false;
                    this.loadAndDisplayTasks();
                }
            }
        });

        $(window).on('blur.todoui', () => {
            this.state.isShiftPressed = false;
            this.state.rangeSelection = false;
            console.log('Window blur, reset shift state');
        });
    }

    bindEvents() {
        console.log('Binding events started');
        
        $(document).on('keydown.todoui', (e) => {
            if (e.key === 'Shift') {
                console.log('Shift key pressed');
                this.state.isShiftPressed = true;
                $('body').addClass('shift-pressed');
            }
        });

        $(document).on('keyup.todoui', (e) => {
            if (e.key === 'Shift') {
                console.log('Shift key released');
                this.state.isShiftPressed = false;
                $('body').removeClass('shift-pressed');
                if (this.state.rangeSelection) {
                    this.state.rangeSelection = false;
                    this.loadAndDisplayTasks();
                }
            }
        });

        $(window).on('blur.todoui', () => {
            console.log('Window lost focus, resetting Shift state');
            this.state.isShiftPressed = false;
            this.state.rangeSelection = false;
            $('body').removeClass('shift-pressed');
        });

        // Кнопки фильтрации и сортировки
        console.log('Setting up filter and sort handlers');
        this.elements.todayBtn.on('click', () => this.handleTodayClick());
        this.elements.weekBtn.on('click', () => this.handleWeekClick());
        this.elements.incompleteCheckbox.on('change', (e) => this.handleIncompleteFilterChange(e));
        this.elements.sortBtn.on('click', () => this.handleSortClick());
        
        // Поиск
        console.log('Setting up search handler');
        this.elements.searchInput.on('input', (e) => this.handleSearch(e));
        
        // Обработка задач и модальное окно
        console.log('Setting up task and modal handlers');
        this.elements.taskList.on('click', '.task-item', (e) => this.handleTaskClick(e));
        this.elements.taskList.on('change', '.task-checkbox input', (e) => this.handleCheckboxChange(e));
        this.elements.modalCloseBtn.on('click', () => this.handleModalClose());
        this.elements.modalOverlay.on('click', (e) => {
            if ($(e.target).is('.modal-overlay')) {
                this.handleModalClose();
            }
        });
        this.elements.modalCheckbox.on('change', (e) => this.handleModalCheckboxChange(e));

        this.elements.searchInput
        .on('input', (e) => this.handleSearch(e))
        .on('focus', () => this.showSearchDropdown())
        .on('blur', () => {
            setTimeout(() => this.hideSearchDropdown(), 200);
        });

        $(document).on('click', (e) => {
            if (!$(e.target).closest('.search-container').length) {
                this.hideSearchDropdown();
            }
        });

        this.elements.searchInput.on('keydown', (e) => {
            switch(e.key) {
                case 'ArrowDown':
                case 'ArrowUp':
                    e.preventDefault();
                    this.handleSearchNavigation(e.key);
                    break;
                case 'Enter':
                    e.preventDefault();
                    this.handleSearchSelection();
                    break;
                case 'Escape':
                    e.preventDefault();
                    this.hideSearchDropdown();
                    break;
            }
        });
        
        console.log('All events bound successfully');
    }

    async handleSearch(e) {
        const query = e.target.value.trim();
        clearTimeout(this.state.searchTimeout);

        if (query.length === 0) {
            this.hideSearchDropdown();
            return;
        }

        this.showSearchLoading();

        this.state.searchTimeout = setTimeout(async () => {
            try {
                const tasks = await this.api.searchTodos(query);
                if (query === this.elements.searchInput.val().trim()) {
                    this.displaySearchResults(tasks);
                }
            } catch (error) {
                console.error('Search error:', error);
                this.showSearchError('Ошибка поиска');
            }
        }, 300);
    }

    displaySearchResults(tasks) {
        if (!tasks || tasks.length === 0) {
            this.elements.searchDropdown.html(
                '<div class="search-no-results">Задачи не найдены</div>'
            );
            this.showSearchDropdown();
            return;
        }

        const resultsHtml = tasks.map(task => `
            <div class="search-result-item" data-task-id="${task.id}">
                <div class="search-result-title">${this.highlightSearchTerm(task.name)}</div>
                <div class="search-result-description">${this.highlightSearchTerm(task.shortDesc)}</div>
                <div class="search-result-date">${this.formatDateTime(task.date)}</div>
            </div>
        `).join('');

        this.elements.searchDropdown
            .html(resultsHtml)
            .find('.search-result-item')
            .on('click', (e) => {
                const taskId = $(e.currentTarget).data('task-id');
                const task = tasks.find(t => t.id === taskId);
                if (task) {
                    this.showTaskModal(task);
                    this.hideSearchDropdown();
                    this.elements.searchInput.val('');
                }
            });

        this.showSearchDropdown();
    }

    highlightSearchTerm(text) {
        const searchTerm = this.elements.searchInput.val().trim();
        if (!searchTerm) return text;

        const regex = new RegExp(`(${searchTerm})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }

    showSearchDropdown() {
        this.elements.searchDropdown.show();
    }

    hideSearchDropdown() {
        this.elements.searchDropdown.hide();
    }

    showSearchLoading() {
        this.elements.searchDropdown
            .html('<div class="search-loading">Поиск...</div>')
            .show();
    }

    showSearchError(message) {
        this.elements.searchDropdown
            .html(`<div class="search-no-results">${message}</div>`)
            .show();
    }

    handleSearchNavigation(key) {
        const items = this.elements.searchDropdown.find('.search-result-item');
        const currentItem = items.filter('.selected');
        let nextItem;

        if (!currentItem.length) {
            nextItem = key === 'ArrowDown' ? items.first() : items.last();
        } else {
            nextItem = key === 'ArrowDown' 
                ? currentItem.next('.search-result-item') 
                : currentItem.prev('.search-result-item');

            if (!nextItem.length) {
                nextItem = key === 'ArrowDown' ? items.first() : items.last();
            }
        }

        items.removeClass('selected');
        nextItem.addClass('selected');
        this.scrollDropdownToItem(nextItem);
    }

    handleSearchSelection() {
        const selectedItem = this.elements.searchDropdown.find('.search-result-item.selected');
        if (selectedItem.length) {
            selectedItem.trigger('click');
        }
    }

    scrollDropdownToItem(item) {
        const dropdown = this.elements.searchDropdown;
        const itemPosition = item.position().top;
        const itemHeight = item.outerHeight();
        const dropdownHeight = dropdown.height();
        const currentScroll = dropdown.scrollTop();

        if (itemPosition < 0) {
            dropdown.scrollTop(currentScroll + itemPosition);
        } else if (itemPosition + itemHeight > dropdownHeight) {
            dropdown.scrollTop(currentScroll + itemPosition - dropdownHeight + itemHeight);
        }
    }

    setupCalendar() {
        this.elements.calendar.datepicker({
            dateFormat: 'dd.mm.yy',
            firstDay: 1,
            showOtherMonths: true,
            selectOtherMonths: true,
            onSelect: (dateText, inst) => this.handleCalendarSelect(dateText, inst),
            numberOfMonths: 1,
            regional: 'ru',
            onHover: (dateText, inst) => {
                if (this.state.isShiftPressed && this.state.selectedStartDate) {
                    this.previewDateRange(dateText);
                }
            }
        });

        console.log('Calendar setup complete');
    }

    parseDate(dateText) {
        const parts = dateText.split('.');
        if (parts.length !== 3) {
            console.error('Invalid date format:', dateText);
            return null;
        }

        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // месяцы в JS идут с 0
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

    async handleTodayClick() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        this.state.selectedStartDate = today;
        this.state.selectedEndDate = new Date(today);
        this.state.selectedEndDate.setHours(23, 59, 59, 999);

        this.setCalendarDate(today);
        await this.loadAndDisplayTasks();
    }

    async handleWeekClick() {
        const today = new Date();
        const monday = this.getMonday(today);
        monday.setHours(0, 0, 0, 0);
        
        const sunday = this.getSunday(monday);
        sunday.setHours(23, 59, 59, 999);
        
        this.state.selectedStartDate = monday;
        this.state.selectedEndDate = sunday;
        
        this.setCalendarDate(monday);
        await this.loadAndDisplayTasks();
    }

    async loadAndDisplayTasks(showOnlyIncomplete = false) {
        console.log(`loadAndDisplayTasks: showOnlyIncomplete: ${showOnlyIncomplete}`);
        
        try {
            this.showLoader();
            let tasks;

            if (this.state.selectedStartDate && this.state.selectedEndDate) {
                tasks = await this.api.getTodosByDate(
                    this.state.selectedStartDate,
                    this.state.selectedEndDate,
                    showOnlyIncomplete || this.elements.incompleteCheckbox.prop('checked')
                );
            } else {
                tasks = await this.api.getAllTodos();
            }

            this.state.currentTasks = tasks;
            this.displayTasks(tasks);
            this.updateDateDisplay();
        } catch (error) {
            console.error('Error loading tasks:', error);
            this.showError('Ошибка загрузки задач');
        } finally {
            this.hideLoader();
        }
    }

    async init() {
        console.log('TodoUI init started');
        try {
            this.bindEvents();
            
            this.setupCalendar();
            
            await this.loadAllTasks();
            
            console.log('TodoUI init completed successfully');
        } catch (error) {
            console.error('Failed to initialize application:', error);
            this.showError('Не удалось загрузить приложение. Пожалуйста, попробуйте позже.');
        }
    }

    setupCalendar() {
        this.elements.calendar.datepicker({
            dateFormat: 'dd.mm.yy',
            firstDay: 1,
            showOtherMonths: true,
            selectOtherMonths: true,
            onSelect: (dateText, inst) => this.handleCalendarSelect(dateText, inst),
            rangeSelect: true,
            numberOfMonths: 1
        });
    }

    async handleTodayClick() {
        const today = new Date();
        const startOfDay = new Date(today);
        startOfDay.setHours(0, 0, 0, 0);
        
        const endOfDay = new Date(today);
        endOfDay.setHours(23, 59, 59, 999);
        
        this.taskFilters.clearFilters();
        this.taskFilters.addTodayFilter();
        
        this.state.selectedStartDate = startOfDay;
        this.state.selectedEndDate = endOfDay;
        this.elements.calendar.datepicker('setDate', today);
        
        await this.loadAndDisplayTasks();
    }

    async handleWeekClick() {
        const today = new Date();
        const monday = this.getMonday(today);
        monday.setHours(0, 0, 0, 0);
        
        const sunday = this.getSunday(monday);
        sunday.setHours(23, 59, 59, 999);
        
        this.taskFilters.clearFilters();
        this.taskFilters.addCurrentWeekFilter();
        
        this.state.selectedStartDate = monday;
        this.state.selectedEndDate = sunday;

        this.elements.calendar
            .datepicker('setDate', monday)
            .datepicker('setDate', sunday);
        
        await this.loadAndDisplayTasks();
    }

    async handleIncompleteFilterChange(e) {
        console.log(`${e.target}`)
        const showOnlyIncomplete = $(e.target).is(':checked');
        console.log(showOnlyIncomplete);
        
        await this.loadAndDisplayTasks(showOnlyIncomplete);
    }

    handleSortClick() {
        this.state.sortDirection = this.state.sortDirection === 'asc' ? 'desc' : 'asc';
        this.elements.sortBtn.text(`Сортировать по дате ${this.state.sortDirection === 'asc' ? '↑' : '↓'}`);
        this.displayTasks(this.state.currentTasks);
    }


    handleCalendarSelect(dateText, inst) {
        const selectedDate = this.parseDate(dateText);
        if (!selectedDate) {
            console.error('Failed to parse date:', dateText);
            return;
        }

        console.log('Calendar date selected:', selectedDate, 'Shift pressed:', this.state.isShiftPressed);

        if (this.state.isShiftPressed) {
            if (!this.state.selectedStartDate || !this.state.rangeSelection) {
                this.state.selectedStartDate = new Date(selectedDate);
                this.state.selectedStartDate.setHours(0, 0, 0, 0);
                this.state.selectedEndDate = new Date(selectedDate);
                this.state.selectedEndDate.setHours(23, 59, 59, 999);
                this.state.rangeSelection = true;
                console.log('Range selection started:', this.state.selectedStartDate);
            } 
            else {
                const startDate = new Date(Math.min(this.state.selectedStartDate, selectedDate));
                startDate.setHours(0, 0, 0, 0);
                const endDate = new Date(Math.max(this.state.selectedStartDate, selectedDate));
                endDate.setHours(23, 59, 59, 999);

                this.state.selectedStartDate = startDate;
                this.state.selectedEndDate = endDate;
                console.log('Range selection completed:', { start: startDate, end: endDate });
            }

            this.highlightSelectedRange();
        } else {
            console.log('Single date selection');
            this.state.rangeSelection = false;
            this.state.selectedStartDate = new Date(selectedDate);
            this.state.selectedStartDate.setHours(0, 0, 0, 0);
            this.state.selectedEndDate = new Date(selectedDate);
            this.state.selectedEndDate.setHours(23, 59, 59, 999);
            
            this.clearHighlights();
            this.highlightDate(selectedDate);
            this.loadAndDisplayTasks();
        }

        this.updateDateDisplay();
    }

    highlightSelectedRange() {
        this.clearHighlights();
        if (!this.state.selectedStartDate || !this.state.selectedEndDate) return;

        const start = new Date(Math.min(this.state.selectedStartDate, this.state.selectedEndDate));
        const end = new Date(Math.max(this.state.selectedStartDate, this.state.selectedEndDate));
        const current = new Date(start);

        while (current <= end) {
            this.highlightDate(new Date(current), current.getTime() === start.getTime() || 
                                                 current.getTime() === end.getTime() ? 'selected' : 'range');
            current.setDate(current.getDate() + 1);
        }
    }

    highlightSelectedDates() {
        $('.ui-datepicker-calendar td').removeClass('selected-date range-date');

        if (!this.state.selectedStartDate) {
            return;
        }

        const startDate = this.state.selectedStartDate;
        const endDate = this.state.selectedEndDate || this.state.selectedStartDate;

        const currentDate = new Date(Math.min(startDate, endDate));
        const lastDate = new Date(Math.max(startDate, endDate));

        while (currentDate <= lastDate) {
            const dateStr = $.datepicker.formatDate('dd.mm.yy', currentDate);
            $(`.ui-datepicker-calendar td[data-handler="selectDay"]:contains('${currentDate.getDate()}')`).addClass('range-date');
            currentDate.setDate(currentDate.getDate() + 1);
        }

        if (this.state.selectedStartDate) {
            const startStr = $.datepicker.formatDate('dd.mm.yy', this.state.selectedStartDate);
            $(`.ui-datepicker-calendar td[data-handler="selectDay"]:contains('${this.state.selectedStartDate.getDate()}')`).addClass('selected-date');
        }
        
        if (this.state.selectedEndDate) {
            const endStr = $.datepicker.formatDate('dd.mm.yy', this.state.selectedEndDate);
            $(`.ui-datepicker-calendar td[data-handler="selectDay"]:contains('${this.state.selectedEndDate.getDate()}')`).addClass('selected-date');
        }
    }

    highlightDate(date, type = 'selected') {
        const dayCell = this.elements.calendar
            .find(`td a:contains('${date.getDate()}')`).parent();
        
        if (type === 'selected') {
            dayCell.addClass('selected-date');
        } else {
            dayCell.addClass('range-date');
        }
    }
    
    highlightDateRange(startDate, endDate) {
        this.clearHighlights();
        
        const currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            this.highlightDate(new Date(currentDate));
            currentDate.setDate(currentDate.getDate() + 1);
        }
    }
    
    clearHighlights() {
        this.elements.calendar
            .find('td')
            .removeClass('selected-date range-date');
    }
    
    updateCalendarUI() {
        if (this.state.isShiftPressed) {
            $('#calendar').addClass('shift-pressed');
            if (!this.state.rangeStartDate) {
                this.showTooltip('Выберите начальную дату диапазона');
            } else {
                this.showTooltip('Выберите конечную дату диапазона');
            }
        } else {
            $('#calendar').removeClass('shift-pressed');
            this.hideTooltip();
        }
    }
    
    showTooltip(message) {
        if (!this.$tooltip) {
            this.$tooltip = $('<div class="calendar-tooltip"></div>').insertAfter(this.elements.calendar);
        }
        this.$tooltip.text(message).show();
    }
    
    hideTooltip() {
        if (this.$tooltip) {
            this.$tooltip.hide();
        }
    }

    applyDateFilter(startDate, endDate) {
        this.taskFilters.clearFilters();
        this.taskFilters.addDateRangeFilter(startDate, endDate);
        this.loadAndDisplayTasks();
    }

    setCalendarDate(date) {
            if (!(date instanceof Date) || isNaN(date.getTime())) {
                console.error('Invalid date:', date);
                return;
            }
    
            const dateStr = $.datepicker.formatDate('dd.mm.yy', date);
            this.elements.calendar.datepicker('setDate', dateStr);
    }

    handleTaskClick(e) {
        if ($(e.target).is('input[type="checkbox"]') || 
            $(e.target).hasClass('checkmark') || 
            $(e.target).closest('.task-checkbox').length) {
            return;
        }
        
        const taskId = $(e.currentTarget).data('task-id');
        const task = this.state.currentTasks.find(t => t.id === taskId);
        if (task) {
            this.showTaskModal(task);
        }
    }

    handleCheckboxChange(e) {
        const checkbox = $(e.target);
        const taskItem = checkbox.closest('.task-item');
        const taskId = taskItem.data('task-id');
        const isChecked = checkbox.prop('checked');
        
        const task = this.state.currentTasks.find(t => t.id === taskId);
        if (task) {
            task.status = isChecked;
            
            if (this.elements.modalOverlay.is(':visible') && 
                this.elements.modalOverlay.data('current-task-id') === taskId) {
                this.elements.modalCheckbox.prop('checked', isChecked);
            }
        }
    }

    handleModalCheckboxChange(e) {
        const isChecked = $(e.target).prop('checked');
        const taskId = this.elements.modalOverlay.data('current-task-id');
        
        if (taskId) {
            const taskCheckbox = this.elements.taskList
                .find(`.task-item[data-task-id="${taskId}"] .task-checkbox input`);
            taskCheckbox.prop('checked', isChecked);
            
            const task = this.state.currentTasks.find(t => t.id === taskId);
            if (task) {
                task.status = isChecked;
            }
        }
    }

    handleModalClose() {
        this.elements.modalOverlay.removeClass('active');
        $('body').css('overflow', '');
    }

    async loadAllTasks() {
        try {
            this.showLoader();
            const tasks = await this.api.getAllTodos();
            this.state.currentTasks = tasks;
            this.displayTasks(tasks);
            this.elements.currentDate.text('Все задачи');
        } catch (error) {
            console.error('Error loading all tasks:', error);
            this.showError('Ошибка загрузки задач');
        } finally {
            this.hideLoader();
        }
    }

    displayTasks(tasks) {
        const sortedTasks = this.sortTasks(tasks);
        
        if (sortedTasks.length === 0) {
            this.elements.taskList.html('<div class="empty-state">Задачи не найдены</div>');
            return;
        }

        const tasksHtml = sortedTasks.map(task => this.renderTask(task)).join('');
        this.elements.taskList.html(tasksHtml);
    }

    sortTasks(tasks) {
        return [...tasks].sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return this.state.sortDirection === 'asc' 
                ? dateA - dateB 
                : dateB - dateA;
        });
    }

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

    showTaskModal(task) {
        this.elements.modalTitle.text(task.name);
        this.elements.modalDate.text(this.formatDateTime(task.date));
        this.elements.modalContent.text(task.fullDesc || task.shortDesc);
        this.elements.modalCheckbox.prop('checked', task.status);
        this.elements.modalOverlay
            .data('current-task-id', task.id)
            .addClass('active');
        $('body').css('overflow', 'hidden');
    }

    showLoader() {
        this.elements.loader.show();
        this.elements.taskList.hide();
    }

    hideLoader() {
        this.elements.loader.hide();
        this.elements.taskList.show();
    }

    showError(message) {
        this.elements.taskList.html(`<div class="error-state">${message}</div>`);
    }

    formatDateTime(dateStr) {
        return new Date(dateStr).toLocaleString('ru-RU');
    }

    updateDateDisplay() {
        if (!this.state.selectedStartDate || !this.state.selectedEndDate) {
            this.elements.currentDate.text('Все задачи');
            return;
        }

        const formatDate = date => {
            return date.toLocaleDateString('ru-RU', {
                day: '2-digit',
                month: 'long'
            });
        };

        const startStr = formatDate(this.state.selectedStartDate);
        const endStr = formatDate(this.state.selectedEndDate);
        
        this.elements.currentDate.text(
            this.state.selectedStartDate.getTime() === this.state.selectedEndDate.getTime()
                ? startStr
                : `${startStr} - ${endStr}`
        );
    }

    getMonday(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(d.setDate(diff));
    }

    getSunday(monday) {
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        return sunday;
    }

    updateDateDisplay() {
        if (!this.state.selectedStartDate || !this.state.selectedEndDate) {
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

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const isToday = this.state.selectedStartDate.getTime() === today.getTime();

        const currentMonday = this.getMonday(today);
        const currentSunday = this.getSunday(currentMonday);
        const isCurrentWeek = 
            this.state.selectedStartDate.getTime() === currentMonday.getTime() &&
            this.state.selectedEndDate.getTime() === currentSunday.setHours(23, 59, 59, 999);

        if (isToday) {
            this.elements.currentDate.text('Сегодня');
        } else if (isCurrentWeek) {
            this.elements.currentDate.text('Текущая неделя');
        } else if (this.state.selectedStartDate.getTime() === this.state.selectedEndDate.getTime()) {
            this.elements.currentDate.text(formatDate(this.state.selectedStartDate));
        } else {
            const startStr = formatDate(this.state.selectedStartDate);
            const endStr = formatDate(this.state.selectedEndDate);
            this.elements.currentDate.text(`${startStr} - ${endStr}`);
        }
    }
    
    destroy() {
        console.log('Destroying TodoUI instance');
        $(document).off('keydown.todoui keyup.todoui');
        $(window).off('blur.todoui');
    }
}

export default TodoUI;