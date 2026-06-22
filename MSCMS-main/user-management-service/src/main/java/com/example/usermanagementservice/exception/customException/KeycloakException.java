package com.example.usermanagementservice.exception.customException;

public class KeycloakException extends UserManagementException {
    public KeycloakException(String message) {
        super(message);
    }

    public KeycloakException(String message, Throwable cause) {
        super(message, cause);
    }
}