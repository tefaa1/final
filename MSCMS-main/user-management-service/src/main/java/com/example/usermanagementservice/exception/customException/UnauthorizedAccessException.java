package com.example.usermanagementservice.exception.customException;

public class UnauthorizedAccessException extends UserManagementException {
    public UnauthorizedAccessException(String message) {
        super(message);
    }
}