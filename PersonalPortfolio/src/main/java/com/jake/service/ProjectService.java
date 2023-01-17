package com.jake.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.jake.exception.ProjectNotFoundException;
import com.jake.models.Project;
import com.jake.repo.ProjectRepo;

@Service
public class ProjectService {

	@Autowired
	private ProjectRepo projectRepository;
	
	public List<Project> getAllProjects(){
		return projectRepository.findAll(); 
	}
	
	public Project addProject(Project project) {
		return projectRepository.save(project);
	}
	
	public Project updateProject(Project project) {
		return projectRepository.save(project);
	}
	
	public void deleteProject(int projectId) {
		projectRepository.deleteById(projectId);
	}
	
	public Project findProject(int projectId) {
		return projectRepository.findProjectById(projectId)
			.orElseThrow(() -> new ProjectNotFoundException ("This Interest ID "+projectId+" was not found"));
	}
}
