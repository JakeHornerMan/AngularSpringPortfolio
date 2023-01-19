package com.jake.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;

@Configuration
public class MySecurityConfig extends WebSecurityConfigurerAdapter {

	@Override
	protected void configure(HttpSecurity http) throws Exception {
		
		http
			.authorizeRequests()
			.antMatchers("/secure").authenticated()
			.antMatchers("/interests/**").permitAll()
			.antMatchers("/projects/**").permitAll()
			.and()
			.formLogin()
			.and()
			.httpBasic();
	}
}
