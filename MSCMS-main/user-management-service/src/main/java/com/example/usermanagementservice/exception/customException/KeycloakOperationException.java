package com.example.usermanagementservice.exception.customException;

public class KeycloakOperationException extends KeycloakException {
    public KeycloakOperationException(String message) {
        super(message);
    }
}