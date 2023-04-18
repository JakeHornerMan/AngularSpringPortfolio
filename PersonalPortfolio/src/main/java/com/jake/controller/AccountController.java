package com.jake.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.jake.entitys.Interest;
import com.jake.entitys.User;
import com.jake.models.UserModel;
import com.jake.service.AccountService;
import com.jake.service.InterestService;

@Controller
@RestController
@CrossOrigin
public class AccountController {
	
	@Autowired
	private AccountService accountService;
	
	@Autowired
	private InterestService interestService;
	
	@CrossOrigin(origins = "http://localhost:4200")
	@GetMapping("/secure")
	public ResponseEntity<String> securedResponce() {
		System.out.println("It did run!");
		String str = "Secured Request Access";
		return new ResponseEntity<>(str, HttpStatus.OK);
	}
	
//	@CrossOrigin(origins = "http://localhost:4200")
//	@PostMapping("/secure/interests/save")
//	public ResponseEntity<Interest> addInterest(@RequestBody Interest interest) {
//		Interest newInterest = interestService.addInterest(interest);
//		return new ResponseEntity<>(newInterest, HttpStatus.CREATED);
//	}
	
	@GetMapping("/no")
	public String nonSecuredResponce() {
		return "Non Secured Request Access";
	}
	
	@PostMapping("/register")
	public ResponseEntity<User> register(@RequestBody UserModel user) {
		return new ResponseEntity<>(accountService.registerUser(user), HttpStatus.OK);
	}
	
	@PostMapping("/login")
	public ResponseEntity<Object> login(@RequestBody UserModel user) throws Exception {
		return new ResponseEntity<>(accountService.loginUser(user), HttpStatus.OK);
	}
}
