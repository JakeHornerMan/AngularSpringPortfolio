export interface Interest {
    id: number;
    title: string;
    description: string;
    imageUrl: string;
}

export interface Project {
    id: number;
    projectName: string;
    contentList: Content[];
    startDate: Date;
    endDate: Date;
    linkedInterests: string;
    interestList: Interest[];
    linkedTechnologys: string;
    technologyList: Technology[];
}

export interface Content {
    id: number;
	projectId: number;
	contentTitle: string;
    contentParagraph: string;
	contentType: string;
	contentUrl: string;
    position: number;
}

export interface Technology {
    id: number;
    techName: string;
    techDescription: string;
}