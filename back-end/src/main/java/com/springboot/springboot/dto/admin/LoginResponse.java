package com.springboot.springboot.dto.admin;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginResponse {
	private String token;
    private String type = "Bearer";
    private AdminDTO admin;
    public LoginResponse(String token2, String string, AdminDTO adminDTO) {
		this.setToken(token2);
		this.setType(string);
		this.setAdmin(adminDTO);
	}
    
	public String getToken() {
		return token;
	}
	
	public void setToken(String token) {
		this.token = token;
	}
	
	public String getType() {
		return type;
	}
	
	public void setType(String type) {
		this.type = type;
	}
	
	public AdminDTO getAdmin() {
		return admin;
	}
	
	public void setAdmin(AdminDTO admin) {
		this.admin = admin;
	}
	
}
