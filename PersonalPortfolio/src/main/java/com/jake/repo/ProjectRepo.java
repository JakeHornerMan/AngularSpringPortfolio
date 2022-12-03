package com.jake.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import com.jake.models.Interest;
import com.jake.models.Project;

@Repository
public interface ProjectRepo extends CrudRepository<Project, Integer>, JpaRepository<Project, Integer>{

}
