package com.jake.service;

import java.util.Comparator;
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

	// Newest first: anything still going (no end date) on top, then by end date, then by start date.
	private static final Comparator<WorkExperience> NEWEST_FIRST = Comparator
			.comparing(WorkExperience::getEndDate, Comparator.nullsFirst(Comparator.<java.util.Date>reverseOrder()))
			.thenComparing(WorkExperience::getStartDate, Comparator.nullsLast(Comparator.<java.util.Date>reverseOrder()));


	@Autowired
	private WorkExperienceRepo workExperienceRepository;
	
	@Autowired
	private ContentRepo contentRepository;
	
	public List<WorkExperience> getAllWorkExperience(){
//		return workExperienceRepository.findAll(); 
		List<WorkExperience> workExperiences = workExperienceRepository.findWorkExperiencesByActive(true);
		workExperiences.sort(NEWEST_FIRST);
		return workExperiences;
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

	public void setWorkExperienceInactive(int id) {
		WorkExperience workExperience = findWorkExperience(id);
		workExperience.setActive(false);
		updateWorkExperience(workExperience); 
		
	}
}
