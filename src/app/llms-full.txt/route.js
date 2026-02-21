const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || 'https://demirti.com').replace(/\/$/, '');

export async function GET() {
  const content = `# CVERSE by Demirti - Full Documentation

> Transform your career through world-class education in Data Science and Technical Product Management.

CVERSE is Demirti's premier digital training initiative. The platform provides a full learning management system (LMS) for structured, cohort-based education with live instruction, assignments, and collaborative learning.

## Organization

- **Name**: CVERSE by Demirti
- **Website**: ${baseUrl}
- **Type**: EdTech / Digital Skills Training
- **Focus**: Data Science, Technical Product Management

## Courses

### Data Science
- **URL**: ${baseUrl}/datascience
- **Duration**: Multi-week bootcamp
- **Topics**: Python programming, statistics, machine learning, data visualization, SQL, pandas, NumPy, scikit-learn, real-world projects
- **Format**: Live instructor-led classes, weekly assignments, peer collaboration, capstone project
- **Outcome**: Portfolio-ready projects, industry-recognized certificate

### Technical Product Management
- **URL**: ${baseUrl}/projectmanagement
- **Duration**: Multi-week bootcamp
- **Topics**: Product strategy, roadmaps, user research, agile/scrum methodologies, stakeholder management, data-driven decision making
- **Format**: Live instructor-led classes, weekly assignments, peer collaboration, capstone project
- **Outcome**: Portfolio-ready case studies, industry-recognized certificate

## Sponsored Scholarships
- **URL**: ${baseUrl}/datascience/sponsored
- **Description**: Scholarship program for eligible candidates to access the Data Science bootcamp at reduced or no cost.

## Platform Features

### Learning Management System
- Cohort-based learning with structured weekly curriculum
- Live classes with attendance tracking and facilitator-led sessions
- Weekly checklists to track progress through course material
- Assignment submission with file upload, link, or text support
- Facilitator grading with feedback
- Real-time chat rooms for cohort-wide and direct messaging
- Announcement system with email and push notification delivery
- AI-powered learning assistant for student support

### Student Portfolio
- Built-in portfolio builder at ${baseUrl}/portfolio/[slug]
- Custom domain support with DNS verification
- Project showcase with images, descriptions, and links
- Social links integration
- Public/private visibility toggle

### Certificates
- Automatically issued upon course completion
- Unique verification codes
- Public verification at ${baseUrl}/verify/[code]
- PDF download

### Job Board
- **URL**: ${baseUrl}/jobs
- Curated job opportunities relevant to course tracks
- Application tracking for registered students

### Additional Resources
- **Sample Projects**: ${baseUrl}/sample-projects - Example portfolio projects
- **Industry Professionals**: ${baseUrl}/professionals - Mentors and experts network

## Public Pages

| Page | URL |
|------|-----|
| Homepage | ${baseUrl} |
| Data Science Course | ${baseUrl}/datascience |
| Data Science FAQ | ${baseUrl}/datasciencesifaq |
| Sponsored Scholarships | ${baseUrl}/datascience/sponsored |
| Product Management Course | ${baseUrl}/projectmanagement |
| Job Board | ${baseUrl}/jobs |
| Sample Projects | ${baseUrl}/sample-projects |
| Industry Professionals | ${baseUrl}/professionals |
| Certificate Verification | ${baseUrl}/verify/[code] |
| Student Portfolios | ${baseUrl}/portfolio/[slug] |
| Login | ${baseUrl}/login |
| Register | ${baseUrl}/register |

## Technical Stack

- **Framework**: Next.js (App Router)
- **Database**: PostgreSQL
- **Hosting**: Vercel
- **Authentication**: Session-based with httpOnly cookies
- **Email**: Resend
- **Payments**: Paystack
- **File Storage**: Vercel Blob

## Contact

For more information, visit ${baseUrl} or reach out through the platform's contact channels.
`;

  return new Response(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
}
