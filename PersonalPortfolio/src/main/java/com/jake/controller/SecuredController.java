package com.jake.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.jake.models.Interest;

@Controller
@RestController
@RequestMapping("/secure")
public class SecuredController {

	@GetMapping
	public String securedResponce() {
		return "Secured Request Access";
	}
	
	@GetMapping("/no")
	public String nonSecuredResponce() {
		return "Non Secured Request Access";
	}
}
