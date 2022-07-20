package com.jake.repo;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.jake.models.Interest;

@Repository
public interface InterestRepo extends JpaRepository<Interest, Integer>{

	void deleteInterestById(int interestId);

	Optional<Interest> findInterestById(int interestId);

}
