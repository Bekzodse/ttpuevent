package uz.university.uems.entity;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "User account role: USER (regular student/organizer) or ADMIN (university administrator)")
public enum Role {
    USER,
    ADMIN
}
