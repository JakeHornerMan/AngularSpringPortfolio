package com.jake.repo;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import com.jake.entitys.Interest;
import com.jake.entitys.Project;

@Repository
public interface ProjectRepo extends CrudRepository<Project, Integer>, JpaRepository<Project, Integer>{

	Optional<Project> findProjectById(int projectId);
	List<Project> findProjectsByLinkedInterests(String interestId);
	List<Project> findProjectsByActive(boolean value);

}
