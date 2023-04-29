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

import com.jake.entitys.Project;
import com.jake.service.ProjectService;

@Controller
@RestController
@RequestMapping("/projects")
public class ProjectController {
	
	@Autowired
	private ProjectService projectService;

	@GetMapping
	public ResponseEntity<List<Project>> getAllProjects() {
		List<Project> projects = projectService.getAllProjects();
		return new ResponseEntity<>(projects, HttpStatus.OK);
	}
	
	@GetMapping("/{id}")
	public ResponseEntity<Project> getProject(@PathVariable("id") int id) {
		Project projects = projectService.findProject(id);
		return new ResponseEntity<>(projects, HttpStatus.OK);
	}
	
	@CrossOrigin
	@PostMapping("/save")
	public ResponseEntity<Project> addProject(@RequestBody Project project) {
		Project newProject = projectService.addProject(project);
		return new ResponseEntity<>(newProject, HttpStatus.CREATED);
	}
	
	@PutMapping("/delete/{id}")
	public ResponseEntity<?> deleteProject(@PathVariable("id") int id) {
		projectService.deleteProject(id);
		return new ResponseEntity<>(HttpStatus.OK);
	}
}
