package com.jake.repo;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import com.jake.entitys.User;

@Repository
public interface UserRepo extends CrudRepository<User, Integer>, JpaRepository<User, Integer>{
	
	Optional<User> findByEmail(String email);

}
