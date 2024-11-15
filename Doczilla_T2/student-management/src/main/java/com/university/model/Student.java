package com.university.model;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class Student {
    private Long id;
    private String firstName;
    private String lastName;
    private String middleName;
    private LocalDate birthDate;
    private String groupNumber;

    public void setBirthDateFromString(String date) {
        this.birthDate = LocalDate.parse(date);
    }

    public String getBirthDateAsString() {
        return birthDate.toString();
    }
}
