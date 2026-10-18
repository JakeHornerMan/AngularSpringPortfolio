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
	// Short summary shown on the closed window; opening it shows the full description and content.
	@Column(length = 500)
	private String tldr;
	private String workIconUrl;
	private String technologys;
	
	// Courses and apprenticeships rather than jobs; never picked as the current job.
	@Column(columnDefinition = "boolean default false")
	private boolean education;

	// Starred entries pulse with a glow on the site.
	@Column(columnDefinition = "boolean default false")
	private boolean starred;

	@Column(columnDefinition = "boolean default true")
	private boolean active;
	
}
