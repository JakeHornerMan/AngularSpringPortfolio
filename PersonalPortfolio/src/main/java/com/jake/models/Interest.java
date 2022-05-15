package com.jake.models;

import java.io.Serializable;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;

@Entity
public class Interest implements Serializable {

	@Id
	@GeneratedValue(strategy=GenerationType.IDENTITY)
	@Column(nullable = false, updatable = false)
	private int interestId;
	@Column(nullable = false)
	private String title;
	private String description;
	private String imageUrl;
	
	public Interest() {}

	public Interest(int interestId, String title, String description, String imageUrl) {
		super();
		this.interestId = interestId;
		this.title = title;
		this.description = description;
		this.imageUrl = imageUrl;
	}

	public int getInterestId() {
		return interestId;
	}

	public void setInterestId(int interestId) {
		this.interestId = interestId;
	}

	public String getTitle() {
		return title;
	}

	public void setTitle(String title) {
		this.title = title;
	}

	public String getDescription() {
		return description;
	}

	public void setDescription(String description) {
		this.description = description;
	}

	public String getImageUrl() {
		return imageUrl;
	}

	public void setImageUrl(String imageUrl) {
		this.imageUrl = imageUrl;
	}

	@Override
	public String toString() {
		return "Interest [interestId=" + interestId + ", title=" + title + ", description=" + description
				+ ", imageUrl=" + imageUrl + "]";
	}
	
	
}
