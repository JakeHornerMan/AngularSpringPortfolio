INSERT INTO project(project_name, end_date, start_date, linked_interests, linked_technologys)
VALUES ('Test Project',now(), now(), '1,2,3', '1,2');

INSERT INTO content(content_title, content_type, content_url, project_id)
VALUES ('Test Image', 'image', 'https://static.wikia.nocookie.net/creepypasta-files/images/5/56/JeffTheKiller%282%29.jpg/revision/latest?cb=20211021111348', 1);
INSERT INTO content(content_title, content_type, content_url, project_id)
VALUES ('Test Link', 'link', 'https://www.artstation.com/jakehornerman', 1);