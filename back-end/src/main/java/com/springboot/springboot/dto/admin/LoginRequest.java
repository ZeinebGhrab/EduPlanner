package com.springboot.springboot.dto.admin;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoginRequest {
    private String email;
    private String password;
    
	public String getEmail() {
		return email;
	}

	public String getPassword() {
		return password;
	}

}
