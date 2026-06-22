package com.example.usermanagementservice.exception.customException;

public class ResourceNotFoundException extends UserManagementException {
    public ResourceNotFoundException(String resource, String field, Object value) {
        super(String.format("%s not found with %s: '%s'", resource, field, value));
    }

    public ResourceNotFoundException(String message) {
        super(message);
    }
}