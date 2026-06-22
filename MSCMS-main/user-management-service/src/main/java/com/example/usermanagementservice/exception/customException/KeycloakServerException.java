package com.example.usermanagementservice.exception.customException;

public class KeycloakServerException extends KeycloakException {
    public KeycloakServerException(String message) {
        super(message);
    }
}