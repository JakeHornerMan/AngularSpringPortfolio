package com.jake.repo;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import com.jake.entitys.WorkExperience;

@Repository
public interface WorkExperienceRepo extends CrudRepository<WorkExperience, Integer>, JpaRepository<WorkExperience, Integer> {

	Optional<WorkExperience> findWorkExperienceById(int workExperienceId);
}
