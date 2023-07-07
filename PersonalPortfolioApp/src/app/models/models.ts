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
    mainPoints: string;
    projectDescription: string;
    projectImageUrl: string;
    projectVideoUrl: string;
    linkedInterests: string;
    interestList: Interest[];
    linkedTechnologys: string;
    technologyList: Technology[];
    staredProject: boolean;
    active: true;
}

export interface WorkExperience {
    id: number;
    workPlace: string;
    workTitle: string;
    contentList: Content[];
    startDate: Date;
    endDate: Date;
    workDescription: string;
    workIconUrl: string;
    technologys: string;
    active: true;
}

export interface Content {
    id: number;
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

export interface User{
    email: string;
    password: string;
}