package com.jake.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.jake.entitys.WorkExperience;
import com.jake.service.WorkExperienceService;

@Controller
@RestController
@RequestMapping("/workExperience")
public class WorkExperienceController {
	
	@Autowired
	private WorkExperienceService workExperienceService;

	@GetMapping
	public ResponseEntity<List<WorkExperience>> getAllWorkExperiences() {
		List<WorkExperience> workExperiences = workExperienceService.getAllWorkExperience();
		return new ResponseEntity<>(workExperiences, HttpStatus.OK);
	}
	
	@GetMapping("/{id}")
	public ResponseEntity<WorkExperience> getWorkExperience(@PathVariable("id") int id) {
		WorkExperience workExperience = workExperienceService.findWorkExperience(id);
		return new ResponseEntity<>(workExperience, HttpStatus.OK);
	}
	
	@CrossOrigin
	@PostMapping("/save")
	public ResponseEntity<WorkExperience> addWorkExperience(@RequestBody WorkExperience workExperience) {
		WorkExperience newWorkExperience = workExperienceService.addWorkExperience(workExperience);
		return new ResponseEntity<>(newWorkExperience, HttpStatus.CREATED);
	}
	
	@CrossOrigin
	@PutMapping("/update")
	public ResponseEntity<WorkExperience> updateWorkExperience(@RequestBody WorkExperience workExperience) {
		WorkExperience newWorkExperience = workExperienceService.updateWorkExperience(workExperience);
		return new ResponseEntity<>(newWorkExperience, HttpStatus.ACCEPTED);
	}
	
	@PutMapping("/delete/{id}")
	public ResponseEntity<?> deleteWorkExperience(@PathVariable("id") int id) {
		workExperienceService.deleteWorkExperience(id);
		return new ResponseEntity<>(HttpStatus.OK);
	}
}
