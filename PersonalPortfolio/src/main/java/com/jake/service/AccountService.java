package com.jake.service;

import org.springframework.beans.factory.annotation.Autowired;
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
	private UserRepo userRepository;
	
	public User registerUser(UserModel user) {
		User newUser = new User();
		newUser.setEmail(user.getEmail());
		newUser.setPassword(passwordEncoder.encode(user.getPassword()));
		return userRepository.save(newUser);
	}
}
