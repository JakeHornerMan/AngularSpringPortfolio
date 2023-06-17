package com.jake.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.jake.entitys.Project;
import com.jake.entitys.WorkExperience;
import com.jake.exception.ProjectNotFoundException;
import com.jake.repo.ContentRepo;
import com.jake.repo.WorkExperienceRepo;

@Service
public class WorkExperienceService {

	@Autowired
	private WorkExperienceRepo workExperienceRepository;
	
	@Autowired
	private ContentRepo contentRepository;
	
	public List<WorkExperience> getAllWorkExperience(){
		return workExperienceRepository.findAll(); 
	}
	
	public WorkExperience addWorkExperience(WorkExperience workExperience) {
		return workExperienceRepository.save(workExperience);
	}
	
	public WorkExperience updateWorkExperience(WorkExperience workExperience) {
		return workExperienceRepository.save(workExperience);
	}
	
	public void deleteWorkExperience(int workExperienceId) {
		workExperienceRepository.deleteById(workExperienceId);
	}
	
	public WorkExperience findWorkExperience(int workExperienceId) {
		return workExperienceRepository.findWorkExperienceById(workExperienceId)
			.orElseThrow(() -> new ProjectNotFoundException ("This Interest ID "+workExperienceId+" was not found"));
	}
}
