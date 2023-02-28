package com.jake.repo;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import com.jake.entitys.Interest;
import com.jake.entitys.Project;

@Repository
public interface InterestRepo extends CrudRepository<Interest, Integer>, JpaRepository<Interest, Integer>{

	void deleteInterestById(int interestId);

	Optional<Interest> findInterestById(int interestId);

}
