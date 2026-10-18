package com.jake.service;

import java.util.Comparator;
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

	// Newest first: anything still going (no end date) on top, then by end date, then by start date.
	private static final Comparator<Project> NEWEST_FIRST = Comparator
			.comparing(Project::getEndDate, Comparator.nullsFirst(Comparator.<java.util.Date>reverseOrder()))
			.thenComparing(Project::getStartDate, Comparator.nullsLast(Comparator.<java.util.Date>reverseOrder()));


	@Autowired
	private ProjectRepo projectRepository;
	
	@Autowired
	private ContentRepo contentRepository;
	
	public List<Project> getAllProjects(){
//		return projectRepository.findAll(); 
		List<Project> projects = projectRepository.findProjectsByActive(true);
		projects.sort(NEWEST_FIRST);
		return projects;
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
		List<Project> projects = projectRepository.findProjectsByLinkedInterests(id);
		projects.sort(NEWEST_FIRST);
		return projects;
//				.orElseThrow(() -> new ProjectNotFoundException ("This Interest ID "+id+" was not found"));
	}

	public void setProjectInactive(int id) {
		Project project = findProject(id);
		project.setActive(false);
		updateProject(project); 
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
