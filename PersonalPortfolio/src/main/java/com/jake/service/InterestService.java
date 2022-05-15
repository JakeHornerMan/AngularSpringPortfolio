package com.jake.service;

import java.util.List;

import javax.persistence.EntityNotFoundException;

import org.springframework.beans.factory.annotation.Autowired;

import com.jake.models.Interest;
import com.jake.repo.InterestRepo;

public class InterestService {
	
	@Autowired
	private InterestRepo interestRepo;
	
	public List<Interest> getAllInterests(){
		return interestRepo.findAll(); 
	}
	
	public Interest addInterest(Interest interest) {
		return interestRepo.save(interest);
	}
	
	public Interest updateInterest(Interest interest) {
		return interestRepo.save(interest);
	}
	
	public void deleteInterest(int interestId) {
		interestRepo.deleteInterestById(interestId);
	}
	
//	public Interest findInterest(int interestId) {
//		return interestRepo.findInterestById(interestId)
//			.orElseThrow(() -> new EntityNotFoundException ("This Interest ID "+interestId+" was not found"));
//	}
}
