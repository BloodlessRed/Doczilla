package com.university.repository;

import com.university.exception.DatabaseException;
import com.university.model.Student;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Repository;

import javax.sql.DataSource;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Repository
public class StudentRepository {
    private static final Logger logger = LoggerFactory.getLogger(StudentRepository.class);

    private static final String INSERT_STUDENT =
            "INSERT INTO students (first_name, last_name, middle_name, birth_date, group_number) " +
                    "VALUES (?, ?, ?, ?, ?)";

    private static final String SELECT_ALL_STUDENTS =
            "SELECT id, first_name, last_name, middle_name, birth_date, group_number FROM students";

    private static final String SELECT_STUDENT_BY_ID =
            "SELECT id, first_name, last_name, middle_name, birth_date, group_number " +
                    "FROM students WHERE id = ?";

    private static final String UPDATE_STUDENT =
            "UPDATE students SET first_name = ?, last_name = ?, middle_name = ?, " +
                    "birth_date = ?, group_number = ? WHERE id = ?";

    private static final String DELETE_STUDENT =
            "DELETE FROM students WHERE id = ?";

    private static final String SELECT_STUDENTS_BY_GROUP =
            "SELECT id, first_name, last_name, middle_name, birth_date, group_number " +
                    "FROM students WHERE group_number = ?";

    private final DataSource dataSource;

    public StudentRepository(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    /**
     * Saves a new student to the database
     * @param student Student object to save
     * @return Saved student with generated ID
     * @throws DatabaseException if database operation fails
     */
    public Student save(Student student) {
        String insertSql = INSERT_STUDENT;
        String getLastIdSql = "SELECT last_insert_rowid()";

        try (Connection conn = dataSource.getConnection()) {
            conn.setAutoCommit(false);

            try (PreparedStatement ps = conn.prepareStatement(insertSql)) {
                setStudentParameters(ps, student);

                int affectedRows = ps.executeUpdate();
                if (affectedRows == 0) {
                    throw new DatabaseException("Creating student failed, no rows affected.");
                }

                try (PreparedStatement psGetId = conn.prepareStatement(getLastIdSql);
                     ResultSet rs = psGetId.executeQuery()) {
                    if (rs.next()) {
                        student.setId(rs.getLong(1));
                        conn.commit();
                        return student;
                    } else {
                        conn.rollback();
                        throw new DatabaseException("Creating student failed, no ID obtained.");
                    }
                }
            } catch (Exception e) {
                conn.rollback();
                throw e;
            } finally {
                conn.setAutoCommit(true);
            }
        } catch (SQLException e) {
            logger.error("Error saving student: {}", student, e);
            throw new DatabaseException("Error saving student", e);
        }
    }

    /**
     * Retrieves all students from the database
     * @return List of all students
     * @throws DatabaseException if database operation fails
     */
    public List<Student> findAll() {
        List<Student> students = new ArrayList<>();

        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(SELECT_ALL_STUDENTS);
             ResultSet rs = ps.executeQuery()) {

            while (rs.next()) {
                students.add(mapResultSetToStudent(rs));
            }

            return students;
        } catch (SQLException e) {
            logger.error("Error retrieving all students", e);
            throw new DatabaseException("Error retrieving all students", e);
        }
    }

    /**
     * Finds a student by their ID
     * @param id Student ID to search for
     * @return Optional containing the student if found
     * @throws DatabaseException if database operation fails
     */
    public Optional<Student> findById(Long id) {
        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(SELECT_STUDENT_BY_ID)) {

            ps.setLong(1, id);

            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return Optional.of(mapResultSetToStudent(rs));
                }
                return Optional.empty();
            }
        } catch (SQLException e) {
            logger.error("Error finding student with id: {}", id, e);
            throw new DatabaseException("Error finding student by ID", e);
        }
    }

    /**
     * Updates an existing student in the database
     * @param student Student object to update
     * @throws DatabaseException if database operation fails
     */
    public void update(Student student) {
        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(UPDATE_STUDENT)) {

            setStudentParameters(ps, student);
            ps.setLong(6, student.getId());

            int affectedRows = ps.executeUpdate();
            if (affectedRows == 0) {
                throw new DatabaseException("Updating student failed, no rows affected.");
            }
        } catch (SQLException e) {
            logger.error("Error updating student: {}", student, e);
            throw new DatabaseException("Error updating student", e);
        }
    }

    /**
     * Deletes a student by their ID
     * @param id ID of the student to delete
     * @return true if student was deleted, false if student was not found
     * @throws DatabaseException if database operation fails
     */
    public boolean deleteById(Long id) {
        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(DELETE_STUDENT)) {

            ps.setLong(1, id);

            int affectedRows = ps.executeUpdate();
            return affectedRows > 0;
        } catch (SQLException e) {
            logger.error("Error deleting student with id: {}", id, e);
            throw new DatabaseException("Error deleting student", e);
        }
    }

    /**
     * Finds all students in a specific group
     * @param groupNumber Group number to search for
     * @return List of students in the specified group
     * @throws DatabaseException if database operation fails
     */
    public List<Student> findByGroup(String groupNumber) {
        List<Student> students = new ArrayList<>();

        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(SELECT_STUDENTS_BY_GROUP)) {

            ps.setString(1, groupNumber);

            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    students.add(mapResultSetToStudent(rs));
                }
            }
            return students;
        } catch (SQLException e) {
            logger.error("Error finding students in group: {}", groupNumber, e);
            throw new DatabaseException("Error finding students by group", e);
        }
    }

    /**
     * Maps a ResultSet row to a Student object
     * @param rs ResultSet containing student data
     * @return Student object
     * @throws SQLException if database operation fails
     */
    private Student mapResultSetToStudent(ResultSet rs) throws SQLException {
        Student student = new Student();
        student.setId(rs.getLong("id"));
        student.setFirstName(rs.getString("first_name"));
        student.setLastName(rs.getString("last_name"));
        student.setMiddleName(rs.getString("middle_name"));
        student.setBirthDateFromString(rs.getString("birth_date"));
        student.setGroupNumber(rs.getString("group_number"));
        return student;
    }

    /**
     * Sets student parameters in a PreparedStatement
     * @param ps PreparedStatement to set parameters in
     * @param student Student object containing the parameters
     * @throws SQLException if database operation fails
     */
    private void setStudentParameters(PreparedStatement ps, Student student) throws SQLException {
        ps.setString(1, student.getFirstName());
        ps.setString(2, student.getLastName());
        ps.setString(3, student.getMiddleName());
        ps.setString(4, student.getBirthDateAsString());
        ps.setString(5, student.getGroupNumber());
    }
}