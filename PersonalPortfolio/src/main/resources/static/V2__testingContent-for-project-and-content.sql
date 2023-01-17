INSERT INTO content(content_id, content_title, content_type, content_url)
VALUES (1, 'Test Image', 'image', 'https://static.wikia.nocookie.net/creepypasta-files/images/5/56/JeffTheKiller%282%29.jpg/revision/latest?cb=20211021111348');
INSERT INTO content(contentId, contentTitle, contentType, contentUrl)
VALUES (1, 'Test Link', 'link', 'https://www.artstation.com/jakehornerman');

INSERT INTO project(project_name, content_id)
VALUES ('Test Project', 1);