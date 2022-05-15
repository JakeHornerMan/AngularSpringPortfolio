package com.jake.models;

import java.util.List;

import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;

@Entity
public class Technology {

	@Id
	@GeneratedValue(strategy=GenerationType.IDENTITY)
	private int techId;
	private String techName;
	
	public Technology() {}

	public Technology(int techId, String techName) {
		super();
		this.techId = techId;
		this.techName = techName;
	}

	public int getTechId() {
		return techId;
	}

	public void setTechId(int techId) {
		this.techId = techId;
	}

	public String getTechName() {
		return techName;
	}

	public void setTechName(String techName) {
		this.techName = techName;
	}
	
	
}
