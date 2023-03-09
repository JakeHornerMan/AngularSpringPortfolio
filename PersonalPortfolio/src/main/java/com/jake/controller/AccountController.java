package com.jake.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.jake.entitys.Interest;
import com.jake.entitys.User;
import com.jake.models.UserModel;
import com.jake.service.AccountService;

@Controller
@RestController
public class AccountController {
	
	@Autowired
	private AccountService accountService;
	
	@GetMapping("/secure")
	public String securedResponce() {
		return "Secured Request Access";
	}
	
	@GetMapping("/no")
	public String nonSecuredResponce() {
		return "Non Secured Request Access";
	}
	
	@PostMapping("/register")
	public ResponseEntity<User> register(@RequestBody UserModel user) {
		return new ResponseEntity<>(accountService.registerUser(user), HttpStatus.OK);
	}
	
	@PostMapping("/login")
	public ResponseEntity<HttpStatus> login(@RequestBody UserModel user) throws Exception {
		return new ResponseEntity<>(accountService.loginUser(user), HttpStatus.OK);
	}
}
