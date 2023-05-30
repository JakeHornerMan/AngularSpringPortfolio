package com.jake.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.jake.entitys.Content;
import com.jake.entitys.Project;
import com.jake.exception.ProjectNotFoundException;
import com.jake.repo.ContentRepo;
import com.jake.repo.ProjectRepo;

@Service
public class ProjectService {

	@Autowired
	private ProjectRepo projectRepository;
	
	@Autowired
	private ContentRepo contentRepository;
	
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

	public List<Project> findProjectByLinkedInterest(String id) {
		return projectRepository.findProjectsByLinkedInterests(id);
//				.orElseThrow(() -> new ProjectNotFoundException ("This Interest ID "+id+" was not found"));
	}

//	public Project addContents(Project project) {
//		int projectId = project.getId();
//		for (Content content : project.getContentList()) {
//			content.setProject(project);
//			contentRepository.save(content);
//		}
//		return projectRepository.findProjectById(projectId)
//				.orElseThrow(() -> new ProjectNotFoundException ("This Interest ID "+projectId+" was not found"));
//	}
}
