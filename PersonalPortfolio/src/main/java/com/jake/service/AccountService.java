package com.jake.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.jake.entitys.Project;
import com.jake.entitys.User;
import com.jake.models.UserModel;
import com.jake.repo.ProjectRepo;
import com.jake.repo.UserRepo;

@Service
public class AccountService {

	@Autowired
	private PasswordEncoder passwordEncoder;
	
	@Autowired
	private AuthenticationManager authenticationManager;
	
	@Autowired
	private UserRepo userRepository;
	
	public User registerUser(UserModel user) {
		User newUser = new User();
		newUser.setEmail(user.getEmail());
		newUser.setPassword(passwordEncoder.encode(user.getPassword()));
		return userRepository.save(newUser);
	}
	
	public UserModel loginUser(UserModel user) throws Exception {
		Authentication auth;
		
		try {
			auth = authenticationManager.authenticate(
					new UsernamePasswordAuthenticationToken(user.getEmail(), user.getPassword()));
			SecurityContextHolder.getContext().setAuthentication(auth);
			
		}
		catch(BadCredentialsException e) {
			throw new Exception("Invalid credentials");
		}
		return user;
	}
}
