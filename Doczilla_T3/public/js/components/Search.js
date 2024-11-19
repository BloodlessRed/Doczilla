/**
 * Класс, отвечающий за функционал поиска задач
 */
class Search {
    /**
     * @param {Object} options - Опции инициализации
     * @param {Object} options.elements - DOM элементы поиска
     * @param {Object} options.api - Экземпляр API для выполнения запросов
     * @param {Function} options.onTaskSelect - Callback выбора задачи из результатов
     */
    constructor(options) {
        this.elements = {
            searchInput: options.elements.searchInput,
            searchContainer: options.elements.searchContainer,
            searchDropdown: options.elements.searchDropdown
        };
        
        this.api = options.api;
        this.onTaskSelect = options.onTaskSelect;
        
        this.state = {
            searchTimeout: null,
            currentResults: []
        };

        this.bindEvents();
    }

    /**
     * Привязка обработчиков событий
     * @private
     */
    bindEvents() {
        // Основной обработчик поиска
        this.elements.searchInput
            .on('input', (e) => this.handleSearch(e))
            .on('focus', () => this.showDropdown())
            .on('blur', () => {
                // Даем время для обработки клика по результату
                setTimeout(() => this.hideDropdown(), 200);
            });

        // Закрытие выпадающего списка при клике вне
        $(document).on('click', (e) => {
            if (!$(e.target).closest('.search-container').length) {
                this.hideDropdown();
            }
        });

        // Обработчик клавиатурной навигации
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
                    this.hideDropdown();
                    break;
            }
        });
    }

    /**
     * Обработчик ввода в поле поиска
     * @private
     * @param {Event} e - Событие input
     */
    async handleSearch(e) {
        const query = e.target.value.trim();
        clearTimeout(this.state.searchTimeout);

        if (query.length === 0) {
            this.hideDropdown();
            return;
        }

        this.showSearchLoading();

        // Добавляем задержку для предотвращения частых запросов
        this.state.searchTimeout = setTimeout(async () => {
            try {
                const tasks = await this.api.searchTodos(query);
                if (query === this.elements.searchInput.val().trim()) {
                    this.state.currentResults = tasks;
                    this.displaySearchResults(tasks);
                }
            } catch (error) {
                console.error('Search error:', error);
                this.showSearchError('Ошибка поиска');
            }
        }, 300);
    }

    /**
     * Отображение результатов поиска
     * @private
     * @param {Array} tasks - Массив найденных задач
     */
    displaySearchResults(tasks) {
        if (!tasks || tasks.length === 0) {
            this.elements.searchDropdown.html(
                '<div class="search-no-results">Задачи не найдены</div>'
            );
            this.showDropdown();
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
                    this.onTaskSelect(task);
                    this.hideDropdown();
                    this.elements.searchInput.val('');
                }
            });

        this.showDropdown();
    }

    /**
     * Подсветка искомого текста в результатах
     * @private
     * @param {string} text - Исходный текст
     * @returns {string} Текст с подсветкой
     */
    highlightSearchTerm(text) {
        const searchTerm = this.elements.searchInput.val().trim();
        if (!searchTerm) return text;

        const regex = new RegExp(`(${searchTerm})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }

    /**
     * Навигация по результатам с помощью клавиатуры
     * @private
     * @param {string} key - Нажатая клавиша (ArrowUp/ArrowDown)
     */
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

    /**
     * Обработка выбора результата поиска
     * @private
     */
    handleSearchSelection() {
        const selectedItem = this.elements.searchDropdown.find('.search-result-item.selected');
        if (selectedItem.length) {
            selectedItem.trigger('click');
        }
    }

    /**
     * Прокрутка выпадающего списка к выбранному элементу
     * @private
     * @param {jQuery} item - Выбранный элемент
     */
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

    /**
     * Показ выпадающего списка
     * @private
     */
    showDropdown() {
        this.elements.searchDropdown.show();
    }

    /**
     * Скрытие выпадающего списка
     * @private
     */
    hideDropdown() {
        this.elements.searchDropdown.hide();
    }

    /**
     * Показ индикатора загрузки
     * @private
     */
    showSearchLoading() {
        this.elements.searchDropdown
            .html('<div class="search-loading">Поиск...</div>')
            .show();
    }

    /**
     * Показ ошибки поиска
     * @private
     * @param {string} message - Текст ошибки
     */
    showSearchError(message) {
        this.elements.searchDropdown
            .html(`<div class="search-error">${message}</div>`)
            .show();
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

export default Search;