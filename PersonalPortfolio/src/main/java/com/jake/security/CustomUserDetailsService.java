package com.jake.security;

import java.util.ArrayList;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.jake.entitys.User;
import com.jake.repo.UserRepo;

@Service
public class CustomUserDetailsService implements UserDetailsService {

	@Autowired
	private UserRepo userRepository;
	
	@Override
	public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
		
		User user = userRepository.findByEmail(email)
				.orElseThrow(() -> new UsernameNotFoundException("User not found!"));
		
		return new org.springframework.security.core.userdetails.
				User(user.getEmail(), user.getPassword(), new ArrayList<>());
	}

}
