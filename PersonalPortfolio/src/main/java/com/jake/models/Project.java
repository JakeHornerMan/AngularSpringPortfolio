package com.jake.models;

import java.sql.Date;

import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;

@Entity
public class Project {
	
	@Id
	@GeneratedValue(strategy=GenerationType.IDENTITY)
	private int projectId;
	private String projectName;
	private String projectDescription;
	private String contentUrl1;
	private String contentUrl2;
	private String contentUrl3;
	private Date startDate;
	private Date endDate;
	
	private int interestId;
	
	
	public Project() {}
	
	
	
}
