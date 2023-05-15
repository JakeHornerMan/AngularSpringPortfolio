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
import javax.persistence.PrimaryKeyJoinColumn;
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
	
//	@PrimaryKeyJoinColumn
	@OneToMany(targetEntity = Content.class, cascade = CascadeType.ALL)
	@JoinColumn(name="project_fk", referencedColumnName="id")
	private List<Content> contentList;
	private Date startDate;
	private Date endDate;
	private String mainPoints;
	
	private String linkedInterests;
	
	private String cateorys;
	
	private String linkedTechnologys;
	
}
