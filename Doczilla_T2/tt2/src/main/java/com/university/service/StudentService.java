package com.university.service;

import com.university.exception.BusinessException;
import com.university.exception.StudentNotFoundException;
import com.university.model.Student;
import com.university.repository.StudentRepository;
import com.university.validation.StudentValidator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class StudentService {
    private static final Logger logger = LoggerFactory.getLogger(StudentService.class);

    private final StudentRepository studentRepository;
    private final StudentValidator studentValidator;

    @Autowired
    public StudentService(StudentRepository studentRepository, StudentValidator studentValidator) {
        this.studentRepository = studentRepository;
        this.studentValidator = studentValidator;
    }

    /**
     * Creates a new student
     * @param student Student to create
     * @return Created student with generated ID
     * @throws BusinessException if student data is invalid
     */
    public Student createStudent(Student student) {
        logger.info("Creating new student: {}", student);

        studentValidator.validateStudent(student);

        studentValidator.validateAge(student.getBirthDate());

        try {
            Student savedStudent = studentRepository.save(student);
            logger.info("Successfully created student with ID: {}", savedStudent.getId());
            return savedStudent;
        } catch (Exception e) {
            logger.error("Error creating student: {}", student, e);
            throw new BusinessException("Failed to create student", e);
        }
    }

    /**
     * Retrieves a student by ID
     * @param id Student ID
     * @return Student object
     * @throws StudentNotFoundException if student is not found
     */
    public Student getStudentById(Long id) {
        logger.debug("Retrieving student with ID: {}", id);

        return studentRepository.findById(id)
                .orElseThrow(() -> {
                    logger.warn("Student not found with ID: {}", id);
                    return new StudentNotFoundException("Student not found with ID: " + id);
                });
    }

    /**
     * Updates an existing student
     * @param id Student ID
     * @param studentDetails Updated student details
     * @return Updated student
     * @throws StudentNotFoundException if student is not found
     * @throws BusinessException if student data is invalid
     */
    public Student updateStudent(Long id, Student studentDetails) {
        logger.info("Updating student with ID: {}", id);

        studentValidator.validateStudent(studentDetails);

        Student existingStudent = getStudentById(id);

        updateStudentFields(existingStudent, studentDetails);

        try {
            studentRepository.update(existingStudent);
            logger.info("Successfully updated student with ID: {}", id);
            return existingStudent;
        } catch (Exception e) {
            logger.error("Error updating student with ID: {}", id, e);
            throw new BusinessException("Failed to update student", e);
        }
    }

    /**
     * Deletes a student by ID
     * @param id Student ID
     * @throws StudentNotFoundException if student is not found
     */
    public void deleteStudent(Long id) {
        logger.info("Deleting student with ID: {}", id);

        // Check if student exists
        if (!studentRepository.deleteById(id)) {
            logger.warn("Student not found with ID: {}", id);
            throw new StudentNotFoundException("Student not found with ID: " + id);
        }

        logger.info("Successfully deleted student with ID: {}", id);
    }

    /**
     * Retrieves all students
     * @return List of all students
     */
    public List<Student> getAllStudents() {
        logger.debug("Retrieving all students");

        List<Student> students = studentRepository.findAll();
        logger.debug("Found {} students", students.size());
        return students;
    }

    /**
     * Updates the fields of an existing student with new data
     * @param existingStudent Student to update
     * @param newData New student data
     */
    private void updateStudentFields(Student existingStudent, Student newData) {
        existingStudent.setFirstName(newData.getFirstName());
        existingStudent.setLastName(newData.getLastName());
        existingStudent.setMiddleName(newData.getMiddleName());
        existingStudent.setBirthDate(newData.getBirthDate());
        existingStudent.setGroupNumber(newData.getGroupNumber());
    }
}