package com.example.usermanagementservice.exception.customException;

public class DuplicateResourceException extends UserManagementException {
    public DuplicateResourceException(String resource, String field, Object value) {
        super(String.format("%s already exists with %s: '%s'", resource, field, value));
    }
}