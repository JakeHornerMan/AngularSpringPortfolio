export interface Interest {
    id: number;
    title: string;
    description: string;
    imageUrl: string;
}

export interface Project {
    projectId: number;
    projectName: string;
    contentList: Content[];
    startDate: Date;
    endDate: Date;
    interest: Interest;
}

export interface Content {
    contentId: number;
	projectId: number;
	contentTitle: String;
	contentType: String;
	contentUrl: String;
}