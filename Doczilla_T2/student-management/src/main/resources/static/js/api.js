// api.js
const API = {
    BASE_URL: 'http://localhost:8080/api/students',

    async getAllStudents() {
        try {
            const response = await $.ajax({
                url: this.BASE_URL,
                method: 'GET'
            });
            return response;
        } catch (error) {
            this.handleError(error);
            throw error;
        }
    },

    async getStudentById(id) {
        try {
            const response = await $.ajax({
                url: `${this.BASE_URL}/${id}`,
                method: 'GET'
            });
            return response;
        } catch (error) {
            this.handleError(error);
            throw error;
        }
    },

    async createStudent(studentData) {
        try {
            const response = await $.ajax({
                url: this.BASE_URL,
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify(studentData)
            });
            return response;
        } catch (error) {
            this.handleError(error);
            throw error;
        }
    },

    async updateStudent(id, studentData) {
        try {
            const response = await $.ajax({
                url: `${this.BASE_URL}/${id}`,
                method: 'PUT',
                contentType: 'application/json',
                data: JSON.stringify(studentData)
            });
            return response;
        } catch (error) {
            this.handleError(error);
            throw error;
        }
    },

    async deleteStudent(id) {
        try {
            await $.ajax({
                url: `${this.BASE_URL}/${id}`,
                method: 'DELETE'
            });
        } catch (error) {
            this.handleError(error);
            throw error;
        }
    },

    handleError(error) {
        const message = error.responseJSON?.message || 'An error occurred';
        UI.showError(message);
    }
};