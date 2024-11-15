package com.university.validation;

import com.university.exception.BusinessException;
import com.university.model.Student;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
public class StudentValidator {

    public void validateStudent(Student student) {
        if (student == null) {
            throw new BusinessException("Student cannot be null");
        }

        validateName(student.getFirstName(), "First name");
        validateName(student.getLastName(), "Last name");

        if (student.getMiddleName() != null && !student.getMiddleName().trim().isEmpty()) {
            validateName(student.getMiddleName(), "Middle name");
        }

        validateBirthDate(student.getBirthDate());
        validateGroupNumber(student.getGroupNumber());
    }

    private void validateName(String name, String fieldName) {
        if (name == null || name.trim().isEmpty()) {
            throw new BusinessException(fieldName + " cannot be empty");
        }
        if (name.length() > 50) {
            throw new BusinessException(fieldName + " cannot be longer than 50 characters");
        }
        if (!name.matches("^[A-Za-zА-Яа-я-\\s]+$")) {
            throw new BusinessException(fieldName + " contains invalid characters");
        }
    }

    private void validateBirthDate(LocalDate birthDate) {
        if (birthDate == null) {
            throw new BusinessException("Birth date cannot be null");
        }
        if (birthDate.isAfter(LocalDate.now())) {
            throw new BusinessException("Birth date cannot be in the future");
        }
    }

    private void validateGroupNumber(String groupNumber) {
        if (groupNumber == null || groupNumber.trim().isEmpty()) {
            throw new BusinessException("Group number cannot be empty");
        }
        if (groupNumber.length() > 20) {
            throw new BusinessException("Group number cannot be longer than 20 characters");
        }
        if (!groupNumber.matches("^[A-Za-zА-Яа-я0-9-]+$")) {
            throw new BusinessException("Group number contains invalid characters");
        }
    }

    public void validateAge(LocalDate birthDate) {
        LocalDate now = LocalDate.now();
        int age = now.getYear() - birthDate.getYear();

        // Adjust age if birthday hasn't occurred this year
        if (birthDate.getDayOfYear() > now.getDayOfYear()) {
            age--;
        }

        if (age < 16) {
            throw new BusinessException("Student must be at least 16 years old");
        }

        if (age > 100) {
            throw new BusinessException("Invalid age for student");
        }
    }
}
