package com.jake.entitys;

import java.sql.Date;
import java.util.List;

import javax.persistence.CascadeType;
import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.OneToMany;
import javax.persistence.Transient;

import org.springframework.beans.factory.annotation.Autowired;

import com.jake.service.InterestService;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Project {
	
	@Id
	@GeneratedValue(strategy=GenerationType.IDENTITY)
	private int id;
	private String projectName;
	
	@OneToMany(fetch = FetchType.EAGER, cascade = CascadeType.ALL, mappedBy="project")
	private List<Content> contentList;
	private Date startDate;
	private Date endDate;
	
	private String linkedInterests;
	
	private String cateorys;
	
	private String linkedTechnologys;
	
}
