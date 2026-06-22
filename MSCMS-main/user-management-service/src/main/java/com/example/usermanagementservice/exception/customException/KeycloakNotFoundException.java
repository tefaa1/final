package com.example.usermanagementservice.exception.customException;

public class KeycloakNotFoundException extends KeycloakException {
    public KeycloakNotFoundException(String message) {
        super(message);
    }
}