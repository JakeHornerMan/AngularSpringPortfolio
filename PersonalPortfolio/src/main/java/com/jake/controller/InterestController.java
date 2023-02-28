package com.jake.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.jake.entitys.Interest;
import com.jake.service.InterestService;

@Controller
@RestController
@RequestMapping("/interests")
public class InterestController {
	
	@Autowired
	private InterestService interestService;
	
	@GetMapping
	public ResponseEntity<List<Interest>> getAllIntrests() {
		List<Interest> interests = interestService.getAllInterests();
		return new ResponseEntity<>(interests, HttpStatus.OK);
	}
	
	@GetMapping("/{id}")
	public ResponseEntity<Interest> getIntrest(@PathVariable("id") int id) {
		Interest interests = interestService.findInterest(id);
		return new ResponseEntity<>(interests, HttpStatus.OK);
	}
	
	@PostMapping("/save")
	public ResponseEntity<Interest> addInterest(@RequestBody Interest interest) {
		Interest newInterest = interestService.addInterest(interest);
		return new ResponseEntity<>(newInterest, HttpStatus.CREATED);
	}
	
	@PutMapping("/delete/{id}")
	public ResponseEntity<?> deleteInterest(@PathVariable("id") int id) {
		interestService.deleteInterest(id);
		return new ResponseEntity<>(HttpStatus.OK);
	}
}
