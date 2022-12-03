package com.jake.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import com.jake.models.Content;
import com.jake.models.Project;

@Repository
public interface ContentRepo extends CrudRepository<Content, Integer>, JpaRepository<Content, Integer>{

}
