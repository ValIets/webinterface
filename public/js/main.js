nunjucks.configure({ autoescape: true });
nunjucks.renderString('Hello {{ username }}', { username: 'James' });
