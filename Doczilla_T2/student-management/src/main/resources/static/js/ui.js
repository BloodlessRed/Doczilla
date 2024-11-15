// ui.js
const UI = {
    form: $('#studentForm'),
    studentTable: $('#studentTable tbody'),
    searchInput: $('#searchInput'),
    submitBtn: $('#submitBtn'),
    cancelBtn: $('#cancelBtn'),
    formTitle: $('#formTitle'),

    init() {
        this.form.on('submit', this.handleSubmit.bind(this));
        this.searchInput.on('input', this.handleSearch.bind(this));
        this.cancelBtn.on('click', this.resetForm.bind(this));
        this.loadStudents();
    },

    async loadStudents() {
        try {
            const students = await API.getAllStudents();
            this.renderStudents(students);
        } catch (error) {
            console.error('Error loading students:', error);
        }
    },

    renderStudents(students) {
        this.studentTable.empty();
        students.forEach(student => {
            const row = this.createStudentRow(student);
            this.studentTable.append(row);
        });
    },

    createStudentRow(student) {
        return $(`
            <tr data-id="${student.id}">
                <td>${student.id}</td>
                <td>${student.lastName} ${student.firstName} ${student.middleName || ''}</td>
                <td>${this.formatDate(student.birthDate)}</td>
                <td>${student.groupNumber}</td>
                <td>
                    <button class="action-btn edit-btn" onclick="UI.editStudent(${student.id})">Edit</button>
                    <button class="action-btn delete-btn" onclick="UI.deleteStudent(${student.id})">Delete</button>
                </td>
            </tr>
        `);
    },

    async handleSubmit(event) {
        event.preventDefault();
        const studentData = this.getFormData();
        const studentId = $('#studentId').val();

        try {
            if (studentId) {
                await API.updateStudent(studentId, studentData);
            } else {
                await API.createStudent(studentData);
            }
            this.resetForm();
            this.loadStudents();
        } catch (error) {
            console.error('Error saving student:', error);
        }
    },

    getFormData() {
        return {
            firstName: $('#firstName').val(),
            lastName: $('#lastName').val(),
            middleName: $('#middleName').val(),
            birthDate: $('#birthDate').val(),
            groupNumber: $('#groupNumber').val()
        };
    },

    async editStudent(id) {
        try {
            const student = await API.getStudentById(id);
            this.populateForm(student);
        } catch (error) {
            console.error('Error loading student for edit:', error);
        }
    },

    async deleteStudent(id) {
        if (confirm('Are you sure you want to delete this student?')) {
            try {
                await API.deleteStudent(id);
                this.loadStudents();
            } catch (error) {
                console.error('Error deleting student:', error);
            }
        }
    },

    populateForm(student) {
        $('#studentId').val(student.id);
        $('#firstName').val(student.firstName);
        $('#lastName').val(student.lastName);
        $('#middleName').val(student.middleName);
        $('#birthDate').val(student.birthDate);
        $('#groupNumber').val(student.groupNumber);

        this.formTitle.text('Edit Student');
        this.submitBtn.text('Update Student');
        this.cancelBtn.show();
    },

    resetForm() {
        $('#studentId').val('');
        this.form[0].reset();
        this.formTitle.text('Add New Student');
        this.submitBtn.text('Add Student');
        this.cancelBtn.hide();
    },

    handleSearch(event) {
        const searchText = event.target.value.toLowerCase();
        const rows = this.studentTable.find('tr');

        rows.each(function() {
            const text = $(this).text().toLowerCase();
            $(this).toggle(text.includes(searchText));
        });
    },

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString();
    },

    showError(message) {
        const errorDiv = $('<div>')
            .addClass('error-message')
            .text(message);

        this.form.prepend(errorDiv);
        setTimeout(() => errorDiv.remove(), 5000);
    }
};