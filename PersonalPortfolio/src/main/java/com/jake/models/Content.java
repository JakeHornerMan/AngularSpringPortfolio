package com.jake.models;

import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;

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
	private int contentId;
	private int projectId;
	private String contentTitle;
	private String contentType;
	private String contentUrl;
	
}
