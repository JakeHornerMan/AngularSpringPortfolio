package com.jake.service;

import java.util.List;

import javax.persistence.EntityNotFoundException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.jake.exception.InterestNotFoundException;
import com.jake.models.Interest;
import com.jake.repo.InterestRepo;

@Service
public class InterestService {
	
	@Autowired
	private InterestRepo intererstRepo;
	
	public List<Interest> getAllInterests(){
		return intererstRepo.findAll(); 
	}
	
	public Interest addInterest(Interest interest) {
		return intererstRepo.save(interest);
	}
	
	public Interest updateInterest(Interest interest) {
		return intererstRepo.save(interest);
	}
	
	public void deleteInterest(int interestId) {
		intererstRepo.deleteInterestById(interestId);
	}
	
	public Interest findInterest(int interestId) {
		return intererstRepo.findInterestById(interestId)
			.orElseThrow(() -> new InterestNotFoundException ("This Interest ID "+interestId+" was not found"));
	}
}
