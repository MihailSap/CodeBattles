export const SKILL_GROUPS = [
  {
    key: 'languages',
    title: 'Языки программирования:',
    options: ['C#', 'Java', 'Python', 'JavaScript', 'TypeScript', 'Go', 'Rust', 'C++', 'C', 'PHP', 'Ruby', 'Swift', 'Kotlin', 'Scala', 'Dart', 'SQL']
  },
  {
    key: 'frameworks',
    title: 'Фреймворки и библиотеки:',
    options: [
      '.NET (Core / Framework)',
      'ASP.NET Core',
      'Entity Framework Core',
      'React',
      'Angular',
      'Vue.js',
      'Spring (Boot)',
      'Django',
      'Flask',
      'Express.js',
      'Node.js',
      'Ruby on Rails',
      'Laravel',
      'Flutter',
      'SwiftUI'
    ]
  },
  {
    key: 'databases',
    title: 'Базы данных:',
    options: ['PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'SQLite', 'Microsoft SQL Server', 'Oracle', 'Cassandra']
  },
  {
    key: 'tools',
    title: 'Инструменты и технологии:',
    options: ['Docker', 'Kubernetes', 'Git', 'GitHub Actions', 'GitLab CI', 'Jenkins', 'Terraform', 'Ansible', 'Prometheus', 'Grafana', 'Elastic Stack (ELK)']
  },
  {
    key: 'platforms',
    title: 'Платформы и облака:',
    options: ['AWS', 'Azure', 'Google Cloud Platform', 'Heroku', 'Vercel', 'Netlify']
  }
];

export const MOCK_USER_SKILLS = {
  languages: ['TypeScript', 'JavaScript', 'Java'],
  frameworks: ['React', 'Spring (Boot)', 'Node.js'],
  databases: ['PostgreSQL', 'Redis'],
  tools: ['Git', 'Docker', 'GitHub Actions'],
  platforms: ['Vercel', 'AWS']
};
