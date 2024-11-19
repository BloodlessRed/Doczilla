class TodoAPI {
    constructor() {
        this.baseUrl = '';  // Используем относительные пути для прокси
    }

    async getAllTodos() {
        console.log('Fetching all todos...');
        try {
            const response = await $.ajax({
                url: `${this.baseUrl}/api/todos`,
                method: 'GET',
                dataType: 'json'
            });
            console.log('Received todos:', response);
            return response;
        } catch (error) {
            console.error('Error fetching todos:', error);
            throw error;
        }
    }

    async getTodosByDate(startDate, endDate, showOnlyIncomplete = false) {
        console.log('Fetching todos by date:', { startDate, endDate, showOnlyIncomplete });
        
        // Конвертируем даты в Unix timestamp (миллисекунды)
        const getTimestamp = (date) => {
            const d = new Date(date);
            return d.getTime();
        };

        // Формируем параметры запроса
        const params = {
            from: getTimestamp(startDate),  // Переименовали startDate в from
            to: getTimestamp(endDate),      // Переименовали endDate в to
        };

        // Добавляем параметр status только если showOnlyIncomplete === true
        if (showOnlyIncomplete) {
            params.status = false;
        }

        try {
            const response = await $.ajax({
                url: `${this.baseUrl}/api/todos/date`,
                method: 'GET',
                data: params,
                dataType: 'json'
            });
            console.log('Received todos by date:', response);
            return response;
        } catch (error) {
            console.error('Error fetching todos by date:', error);
            throw error;
        }
    }

    async searchTodos(query) {
        console.log('Searching todos with query:', query);
        try {
            const response = await $.ajax({
                url: `${this.baseUrl}/api/todos/find`,
                method: 'GET',
                data: { q: query },
                dataType: 'json'
            });
            console.log('Search results:', response);
            return response;
        } catch (error) {
            console.error('Error searching todos:', error);
            throw error;
        }
    }
}

export default TodoAPI;