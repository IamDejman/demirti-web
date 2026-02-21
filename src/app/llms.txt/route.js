const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || 'https://demirti.com').replace(/\/$/, '');

export async function GET() {
  const content = `# CVERSE by Demirti

> Transform your career through world-class education in Data Science and Technical Product Management.

CVERSE is Demirti's premier digital training initiative, offering instructor-led bootcamp-style courses in Data Science and Technical Product Management. Students learn through live classes, hands-on assignments, peer collaboration, and portfolio projects.

## Courses

- [Data Science](${baseUrl}/datascience): Comprehensive data science bootcamp covering Python, statistics, machine learning, data visualization, and real-world projects.
- [Technical Product Management](${baseUrl}/projectmanagement): Product management course covering strategy, roadmaps, user research, agile methodologies, and stakeholder management.

## Resources

- [Job Board](${baseUrl}/jobs): Curated job opportunities for graduates and current students.
- [Sample Projects](${baseUrl}/sample-projects): Example student portfolio projects and capstone work.
- [Industry Professionals](${baseUrl}/professionals): Network of mentors and industry experts.
- [Certificate Verification](${baseUrl}/verify): Verify the authenticity of CVERSE certificates.

## Platform Features

- Live instructor-led classes with attendance tracking
- Weekly structured curriculum with checklists
- Assignment submission and facilitator grading
- Real-time chat rooms for cohort collaboration
- Student portfolio builder with custom domains
- AI-powered learning assistant
- Push notifications and email updates
- Progress tracking and certificates

## Links

- [Full Documentation](${baseUrl}/llms-full.txt)
- [Homepage](${baseUrl})
- [Login](${baseUrl}/login)
- [Register](${baseUrl}/register)
`;

  return new Response(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
}
