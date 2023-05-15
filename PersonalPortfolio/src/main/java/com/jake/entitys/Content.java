package com.jake.entitys;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.Lob;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Content {

	@Id
	@GeneratedValue(strategy=GenerationType.IDENTITY)
	private int id;
	
//	@JsonIgnore
//	@ManyToOne(fetch = FetchType.LAZY, cascade=CascadeType.PERSIST)
//	@JoinColumn(name="project_id")
//	private Project project;
//	private String contentTitle;
	@Lob
	@Column
	private String contentParagraph;
	private String contentType;
	@Lob
	@Column
	private String contentUrl;
	private int position;
	
}
