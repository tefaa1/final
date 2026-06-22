package com.example.usermanagementservice.exception.customException;

public class KeycloakInvalidResponseException extends KeycloakException {
    public KeycloakInvalidResponseException(String message) {
        super(message);
    }
}
