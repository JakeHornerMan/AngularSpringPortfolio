package com.jake.entitys;

import java.sql.Date;
import java.util.List;

import javax.persistence.CascadeType;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.Lob;
import javax.persistence.OneToMany;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class WorkExperience {

	@Id
	@GeneratedValue(strategy=GenerationType.IDENTITY)
	private int id;
	private String workPlace;
	private String workTitle;
	@OneToMany(targetEntity = Content.class, cascade = CascadeType.ALL)
	@JoinColumn(name="workExperience_fk", referencedColumnName="id")
	private List<Content> contentList;
	private Date startDate;
	private Date endDate;
	@Lob
	@Column
	private String workDescription;
	private String workIconUrl;
	private String technologys;
	
	@Column(columnDefinition = "boolean default true")
	private boolean active;
	
}
