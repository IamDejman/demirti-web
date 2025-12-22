'use client';

import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Link from 'next/link';
import ApplicationForm from '../components/ApplicationForm';

export default function ProjectManagementPage() {
  const [showForm, setShowForm] = useState(false);
  const [scholarshipAvailable, setScholarshipAvailable] = useState(false);

  // Check scholarship availability on component mount
  useEffect(() => {
    const checkScholarshipStatus = async () => {
      try {
        const response = await fetch('/api/scholarship-status');
        const data = await response.json();
        if (data.available) {
          setScholarshipAvailable(true);
        }
      } catch (error) {
        console.error('Error checking scholarship status:', error);
      }
    };
    
    checkScholarshipStatus();
  }, []);
  return (
    <main>
      <Navbar />
      
      {/* Hero Section */}
      <section className="track-hero" style={{ 
        padding: '10rem 0 6rem', 
        background: 'linear-gradient(135deg, #00c896 0%, #00a578 100%)',
        color: 'white',
        textAlign: 'center',
        marginTop: '140px',
        position: 'relative'
      }}>
        <div className="container">
          <h1 style={{ fontSize: '3.5rem', fontWeight: '800', marginBottom: '1rem' }}>
            Project Management Track
          </h1>
          <p style={{ fontSize: '1.25rem', maxWidth: '800px', margin: '0 auto 2rem', opacity: 0.95 }}>
            Bridge the gap between business and technology. Learn how to lead cross-functional teams, translate user needs into product strategy, and drive technical innovation from idea to launch.
          </p>
          <a 
            href="#apply-section" 
            className="cta-button" 
            onClick={(e) => {
              e.preventDefault();
              const element = document.getElementById('apply-section');
              if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }}
            style={{
              display: 'inline-block',
              backgroundColor: 'white',
              color: '#00c896',
              padding: '1rem 2.5rem',
              borderRadius: '50px',
              fontWeight: '600',
              fontSize: '1.05rem',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
              cursor: 'pointer'
            }}
          >
            Apply Now
          </a>
        </div>
      </section>

      {/* Course Overview */}
      <section style={{ padding: '5rem 0', backgroundColor: '#ffffff' }}>
        <div className="container">
          <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <h2 className="section-title">Course Overview</h2>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
              gap: '2rem',
              marginTop: '3rem'
            }}>
              <div style={{
                backgroundColor: '#f8f9fa',
                padding: '2rem',
                borderRadius: '12px',
                borderLeft: '4px solid #00c896'
              }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.75rem', color: '#00c896' }}>
                  Target Audience
                </h3>
                <p style={{ color: '#666666', lineHeight: '1.7' }}>
                  Beginners, Professionals, Students, and anyone looking to excel in project management.
                </p>
              </div>

              <div style={{
                backgroundColor: '#f8f9fa',
                padding: '2rem',
                borderRadius: '12px',
                borderLeft: '4px solid #00c896'
              }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.75rem', color: '#00c896' }}>
                  Duration
                </h3>
                <p style={{ color: '#666666', lineHeight: '1.7', fontSize: '1.1rem', fontWeight: '600' }}>
                  12 Weeks
                </p>
              </div>

              <div style={{
                backgroundColor: '#f8f9fa',
                padding: '2rem',
                borderRadius: '12px',
                borderLeft: '4px solid #00c896'
              }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.75rem', color: '#00c896' }}>
                  Schedule
                </h3>
                <p style={{ color: '#666666', lineHeight: '1.7' }}>
                  Saturday: 9am - 11am & 12pm - 2pm
                </p>
              </div>

              <div style={{
                backgroundColor: '#f8f9fa',
                padding: '2rem',
                borderRadius: '12px',
                borderLeft: '4px solid #00c896'
              }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.75rem', color: '#00c896' }}>
                  Dates
                </h3>
                <p style={{ color: '#666666', lineHeight: '1.7' }}>
                  February 2026 - April 2026
                </p>
              </div>
            </div>

            <div style={{ marginTop: '3rem', backgroundColor: '#fff3cd', padding: '2rem', borderRadius: '12px', border: '1px solid #ffc107' }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem', color: '#1a1a1a' }}>
                Cost: ₦150,000
              </h3>
              <p style={{ color: '#666666', lineHeight: '1.7', marginBottom: '0.5rem' }}>
                Includes certificate and class recordings
              </p>
              {scholarshipAvailable && (
                <p style={{ color: '#00c896', fontWeight: '600' }}>
                  🎉 First 10 paid learners get 50% discount!
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Curriculum */}
      <section style={{ padding: '5rem 0', backgroundColor: '#f8f9fa' }}>
        <div className="container">
          <h2 className="section-title">Course Curriculum</h2>
          
          <div style={{ maxWidth: '1000px', margin: '3rem auto 0' }}>
            <div style={{
              backgroundColor: 'white',
              padding: '2.5rem',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{ marginBottom: '2.5rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#00c896' }}>
                  Week 1 – Project Management Fundamentals
                </h3>
                <ul style={{ listStyle: 'none', paddingLeft: '0' }}>
                  <li style={{ padding: '0.5rem 0', paddingLeft: '1.5rem', position: 'relative', color: '#666666' }}>
                    <span style={{ position: 'absolute', left: '0', color: '#0066cc', fontWeight: 'bold' }}>•</span>
                    Introduction to project management concepts & terminology
                  </li>
                  <li style={{ padding: '0.5rem 0', paddingLeft: '1.5rem', position: 'relative', color: '#666666' }}>
                    <span style={{ position: 'absolute', left: '0', color: '#0066cc', fontWeight: 'bold' }}>•</span>
                    Understanding the Project Life Cycle (initiation → planning → execution → monitoring → closure)
                  </li>
                  <li style={{ padding: '0.5rem 0', paddingLeft: '1.5rem', position: 'relative', color: '#666666' }}>
                    <span style={{ position: 'absolute', left: '0', color: '#0066cc', fontWeight: 'bold' }}>•</span>
                    Roles and responsibilities of a project manager
                  </li>
                  <li style={{ padding: '0.5rem 0', paddingLeft: '1.5rem', position: 'relative', color: '#666666' }}>
                    <span style={{ position: 'absolute', left: '0', color: '#0066cc', fontWeight: 'bold' }}>•</span>
                    Overview of frameworks: Waterfall vs Agile
                  </li>
                </ul>
              </div>

              <div style={{ marginBottom: '2.5rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#00c896' }}>
                  Week 2 – Project Initiation
                </h3>
                <ul style={{ listStyle: 'none', paddingLeft: '0' }}>
                  <li style={{ padding: '0.5rem 0', paddingLeft: '1.5rem', position: 'relative', color: '#666666' }}>
                    <span style={{ position: 'absolute', left: '0', color: '#0066cc', fontWeight: 'bold' }}>•</span>
                    Project selection and prioritization
                  </li>
                  <li style={{ padding: '0.5rem 0', paddingLeft: '1.5rem', position: 'relative', color: '#666666' }}>
                    <span style={{ position: 'absolute', left: '0', color: '#0066cc', fontWeight: 'bold' }}>•</span>
                    Developing a Project Charter
                  </li>
                  <li style={{ padding: '0.5rem 0', paddingLeft: '1.5rem', position: 'relative', color: '#666666' }}>
                    <span style={{ position: 'absolute', left: '0', color: '#0066cc', fontWeight: 'bold' }}>•</span>
                    Stakeholder identification and analysis
                  </li>
                  <li style={{ padding: '0.5rem 0', paddingLeft: '1.5rem', position: 'relative', color: '#666666' }}>
                    <span style={{ position: 'absolute', left: '0', color: '#0066cc', fontWeight: 'bold' }}>•</span>
                    Organizational governance and compliance basics
                  </li>
                </ul>
              </div>

              <div style={{ marginBottom: '2.5rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#00c896' }}>
                  Week 3 – Project Planning: Scope & Work Breakdown
                </h3>
                <ul style={{ listStyle: 'none', paddingLeft: '0' }}>
                  <li style={{ padding: '0.5rem 0', paddingLeft: '1.5rem', position: 'relative', color: '#666666' }}>
                    <span style={{ position: 'absolute', left: '0', color: '#0066cc', fontWeight: 'bold' }}>•</span>
                    Defining and managing project scope
                  </li>
                  <li style={{ padding: '0.5rem 0', paddingLeft: '1.5rem', position: 'relative', color: '#666666' }}>
                    <span style={{ position: 'absolute', left: '0', color: '#0066cc', fontWeight: 'bold' }}>•</span>
                    Creating a Work Breakdown Structure (WBS)
                  </li>
                  <li style={{ padding: '0.5rem 0', paddingLeft: '1.5rem', position: 'relative', color: '#666666' }}>
                    <span style={{ position: 'absolute', left: '0', color: '#0066cc', fontWeight: 'bold' }}>•</span>
                    Defining deliverables, assumptions, and constraints
                  </li>
                </ul>
              </div>

              <div style={{ marginBottom: '2.5rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#00c896' }}>
                  Week 4 – Project Schedule & Cost Planning
                </h3>
                <ul style={{ listStyle: 'none', paddingLeft: '0' }}>
                  <li style={{ padding: '0.5rem 0', paddingLeft: '1.5rem', position: 'relative', color: '#666666' }}>
                    <span style={{ position: 'absolute', left: '0', color: '#0066cc', fontWeight: 'bold' }}>•</span>
                    Scheduling techniques (Gantt charts, critical path)
                  </li>
                  <li style={{ padding: '0.5rem 0', paddingLeft: '1.5rem', position: 'relative', color: '#666666' }}>
                    <span style={{ position: 'absolute', left: '0', color: '#0066cc', fontWeight: 'bold' }}>•</span>
                    Estimating durations and dependencies
                  </li>
                  <li style={{ padding: '0.5rem 0', paddingLeft: '1.5rem', position: 'relative', color: '#666666' }}>
                    <span style={{ position: 'absolute', left: '0', color: '#0066cc', fontWeight: 'bold' }}>•</span>
                    Introduction to cost budgeting and cost estimation principles
                  </li>
                </ul>
              </div>

              <div style={{ marginBottom: '2.5rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#00c896' }}>
                  Week 5 – Risk & Quality Planning
                </h3>
                <ul style={{ listStyle: 'none', paddingLeft: '0' }}>
                  <li style={{ padding: '0.5rem 0', paddingLeft: '1.5rem', position: 'relative', color: '#666666' }}>
                    <span style={{ position: 'absolute', left: '0', color: '#0066cc', fontWeight: 'bold' }}>•</span>
                    Identifying project risks and risk analysis
                  </li>
                  <li style={{ padding: '0.5rem 0', paddingLeft: '1.5rem', position: 'relative', color: '#666666' }}>
                    <span style={{ position: 'absolute', left: '0', color: '#0066cc', fontWeight: 'bold' }}>•</span>
                    Developing risk response strategies
                  </li>
                  <li style={{ padding: '0.5rem 0', paddingLeft: '1.5rem', position: 'relative', color: '#666666' }}>
                    <span style={{ position: 'absolute', left: '0', color: '#0066cc', fontWeight: 'bold' }}>•</span>
                    Quality planning and standards
                  </li>
                  <li style={{ padding: '0.5rem 0', paddingLeft: '1.5rem', position: 'relative', color: '#666666' }}>
                    <span style={{ position: 'absolute', left: '0', color: '#0066cc', fontWeight: 'bold' }}>•</span>
                    Creating communication plans
                  </li>
                </ul>
              </div>

              <div style={{ marginBottom: '2.5rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#00c896' }}>
                  Week 6 – Project Execution Essentials
                </h3>
                <ul style={{ listStyle: 'none', paddingLeft: '0' }}>
                  <li style={{ padding: '0.5rem 0', paddingLeft: '1.5rem', position: 'relative', color: '#666666' }}>
                    <span style={{ position: 'absolute', left: '0', color: '#0066cc', fontWeight: 'bold' }}>•</span>
                    Project team leadership and building team dynamics
                  </li>
                  <li style={{ padding: '0.5rem 0', paddingLeft: '1.5rem', position: 'relative', color: '#666666' }}>
                    <span style={{ position: 'absolute', left: '0', color: '#0066cc', fontWeight: 'bold' }}>•</span>
                    Communication best practices for project teams
                  </li>
                  <li style={{ padding: '0.5rem 0', paddingLeft: '1.5rem', position: 'relative', color: '#666666' }}>
                    <span style={{ position: 'absolute', left: '0', color: '#0066cc', fontWeight: 'bold' }}>•</span>
                    Managing stakeholder expectations
                  </li>
                  <li style={{ padding: '0.5rem 0', paddingLeft: '1.5rem', position: 'relative', color: '#666666' }}>
                    <span style={{ position: 'absolute', left: '0', color: '#0066cc', fontWeight: 'bold' }}>•</span>
                    Mid-bootcamp project milestone check-in
                  </li>
                </ul>
              </div>

              <div style={{ marginBottom: '2.5rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#00c896' }}>
                  Week 7 – Agile and Hybrid Approaches
                </h3>
                <ul style={{ listStyle: 'none', paddingLeft: '0' }}>
                  <li style={{ padding: '0.5rem 0', paddingLeft: '1.5rem', position: 'relative', color: '#666666' }}>
                    <span style={{ position: 'absolute', left: '0', color: '#0066cc', fontWeight: 'bold' }}>•</span>
                    Introduction to Agile principles and frameworks (Scrum, Kanban)
                  </li>
                  <li style={{ padding: '0.5rem 0', paddingLeft: '1.5rem', position: 'relative', color: '#666666' }}>
                    <span style={{ position: 'absolute', left: '0', color: '#0066cc', fontWeight: 'bold' }}>•</span>
                    Adaptive planning and iterative delivery
                  </li>
                  <li style={{ padding: '0.5rem 0', paddingLeft: '1.5rem', position: 'relative', color: '#666666' }}>
                    <span style={{ position: 'absolute', left: '0', color: '#0066cc', fontWeight: 'bold' }}>•</span>
                    How and when to blend Agile with traditional methods
                  </li>
                  <li style={{ padding: '0.5rem 0', paddingLeft: '1.5rem', position: 'relative', color: '#666666' }}>
                    <span style={{ position: 'absolute', left: '0', color: '#0066cc', fontWeight: 'bold' }}>•</span>
                    Tools: product backlog, sprint planning, burndown charts
                  </li>
                </ul>
              </div>

              <div style={{ marginBottom: '2.5rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#00c896' }}>
                  Week 8 – Project Monitoring & Control
                </h3>
                <ul style={{ listStyle: 'none', paddingLeft: '0' }}>
                  <li style={{ padding: '0.5rem 0', paddingLeft: '1.5rem', position: 'relative', color: '#666666' }}>
                    <span style={{ position: 'absolute', left: '0', color: '#0066cc', fontWeight: 'bold' }}>•</span>
                    Tracking project progress with KPIs
                  </li>
                  <li style={{ padding: '0.5rem 0', paddingLeft: '1.5rem', position: 'relative', color: '#666666' }}>
                    <span style={{ position: 'absolute', left: '0', color: '#0066cc', fontWeight: 'bold' }}>•</span>
                    Earned Value & performance measurement
                  </li>
                  <li style={{ padding: '0.5rem 0', paddingLeft: '1.5rem', position: 'relative', color: '#666666' }}>
                    <span style={{ position: 'absolute', left: '0', color: '#0066cc', fontWeight: 'bold' }}>•</span>
                    Handling scope changes and change control processes
                  </li>
                </ul>
              </div>

              <div style={{ marginBottom: '2.5rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#00c896' }}>
                  Week 9 – Tools, Software & Collaboration
                </h3>
                <ul style={{ listStyle: 'none', paddingLeft: '0' }}>
                  <li style={{ padding: '0.5rem 0', paddingLeft: '1.5rem', position: 'relative', color: '#666666' }}>
                    <span style={{ position: 'absolute', left: '0', color: '#0066cc', fontWeight: 'bold' }}>•</span>
                    Hands-on with industry tools (e.g., Jira, MS Project, Trello)
                  </li>
                  <li style={{ padding: '0.5rem 0', paddingLeft: '1.5rem', position: 'relative', color: '#666666' }}>
                    <span style={{ position: 'absolute', left: '0', color: '#0066cc', fontWeight: 'bold' }}>•</span>
                    Managing task tracking, reporting, and dashboards
                  </li>
                  <li style={{ padding: '0.5rem 0', paddingLeft: '1.5rem', position: 'relative', color: '#666666' }}>
                    <span style={{ position: 'absolute', left: '0', color: '#0066cc', fontWeight: 'bold' }}>•</span>
                    Collaboration with stakeholders via tools like Confluence
                  </li>
                  <li style={{ padding: '0.5rem 0', paddingLeft: '1.5rem', position: 'relative', color: '#666666' }}>
                    <span style={{ position: 'absolute', left: '0', color: '#0066cc', fontWeight: 'bold' }}>•</span>
                    Integrated reporting practice
                  </li>
                </ul>
              </div>

              <div style={{ marginBottom: '2.5rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#00c896' }}>
                  Week 10 – Closure & Lessons Learned
                </h3>
                <ul style={{ listStyle: 'none', paddingLeft: '0' }}>
                  <li style={{ padding: '0.5rem 0', paddingLeft: '1.5rem', position: 'relative', color: '#666666' }}>
                    <span style={{ position: 'absolute', left: '0', color: '#0066cc', fontWeight: 'bold' }}>•</span>
                    Project close-out processes
                  </li>
                  <li style={{ padding: '0.5rem 0', paddingLeft: '1.5rem', position: 'relative', color: '#666666' }}>
                    <span style={{ position: 'absolute', left: '0', color: '#0066cc', fontWeight: 'bold' }}>•</span>
                    Finalizing deliverables, contracts, and financials
                  </li>
                  <li style={{ padding: '0.5rem 0', paddingLeft: '1.5rem', position: 'relative', color: '#666666' }}>
                    <span style={{ position: 'absolute', left: '0', color: '#0066cc', fontWeight: 'bold' }}>•</span>
                    Capturing lessons learned and documentation
                  </li>
                </ul>
              </div>

              <div style={{ marginBottom: '2.5rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#00c896' }}>
                  Week 11 – Live Project Progress & Refinement
                </h3>
                <ul style={{ listStyle: 'none', paddingLeft: '0' }}>
                  <li style={{ padding: '0.5rem 0', paddingLeft: '1.5rem', position: 'relative', color: '#666666' }}>
                    <span style={{ position: 'absolute', left: '0', color: '#0066cc', fontWeight: 'bold' }}>•</span>
                    Working on your real-life project
                  </li>
                  <li style={{ padding: '0.5rem 0', paddingLeft: '1.5rem', position: 'relative', color: '#666666' }}>
                    <span style={{ position: 'absolute', left: '0', color: '#0066cc', fontWeight: 'bold' }}>•</span>
                    Weekly project stand-ups and mentor check-ins
                  </li>
                  <li style={{ padding: '0.5rem 0', paddingLeft: '1.5rem', position: 'relative', color: '#666666' }}>
                    <span style={{ position: 'absolute', left: '0', color: '#0066cc', fontWeight: 'bold' }}>•</span>
                    Applying all PM principles to your project environment
                  </li>
                </ul>
              </div>

              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#00c896' }}>
                  Week 12 – Capstone Presentation & Career Readiness
                </h3>
                <ul style={{ listStyle: 'none', paddingLeft: '0' }}>
                  <li style={{ padding: '0.5rem 0', paddingLeft: '1.5rem', position: 'relative', color: '#666666' }}>
                    <span style={{ position: 'absolute', left: '0', color: '#0066cc', fontWeight: 'bold' }}>•</span>
                    Present your project outcome to peers/mentors
                  </li>
                  <li style={{ padding: '0.5rem 0', paddingLeft: '1.5rem', position: 'relative', color: '#666666' }}>
                    <span style={{ position: 'absolute', left: '0', color: '#0066cc', fontWeight: 'bold' }}>•</span>
                    Reflect on project successes, improvements, and metrics
                  </li>
                  <li style={{ padding: '0.5rem 0', paddingLeft: '1.5rem', position: 'relative', color: '#666666' }}>
                    <span style={{ position: 'absolute', left: '0', color: '#0066cc', fontWeight: 'bold' }}>•</span>
                    Career support: resume & LinkedIn polish + interview preparation
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Learning Outcomes */}
      <section style={{ padding: '5rem 0', backgroundColor: '#ffffff' }}>
        <div className="container">
          <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <h2 className="section-title">Learning Outcomes</h2>
            <div style={{
              backgroundColor: '#f8f9fa',
              padding: '2.5rem',
              borderRadius: '12px',
              marginTop: '2rem'
            }}>
              <p style={{ fontSize: '1.1rem', lineHeight: '1.8', color: '#666666' }}>
                Upon completing the 12-week Project Management bootcamp, learners will be equipped to lead projects through all phases of the project lifecycle, from initiation to closure. They will develop the skills to create project charters, work breakdown structures, schedules, risk plans, and stakeholder communication strategies. Participants will gain practical experience using project management tools, managing project teams, adapting to Agile and hybrid environments, and monitoring project performance. Graduates will be prepared to manage real projects confidently and contribute effectively to project teams in a professional setting.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Facilitators */}
      <section style={{ padding: '5rem 0', backgroundColor: '#f8f9fa' }}>
        <div className="container">
          <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <h2 className="section-title">Facilitators</h2>
            <div style={{
              backgroundColor: 'white',
              padding: '2.5rem',
              borderRadius: '12px',
              marginTop: '2rem',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                gap: '1.5rem' 
              }}>
                {['Bolaji', 'Ogey'].map((name, index) => (
                  <div key={index} style={{
                    padding: '1.5rem',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px',
                    textAlign: 'center',
                    borderLeft: '3px solid #00c896'
                  }}>
                    <p style={{ fontSize: '1.1rem', fontWeight: '600', color: '#1a1a1a' }}>
                      {name}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Apply Section */}
      <section id="apply-section" style={{ 
        padding: '5rem 0', 
        backgroundColor: '#f8f9fa'
      }}>
        <div className="container">
          {!showForm ? (
            <div style={{ 
              textAlign: 'center',
              maxWidth: '700px',
              margin: '0 auto'
            }}>
              <h2 className="section-title">Ready to Get Started?</h2>
              <p style={{ 
                fontSize: '1.25rem', 
                marginBottom: '2.5rem', 
                color: '#666666',
                lineHeight: '1.7'
              }}>
                Join our 12-week Project Management bootcamp and transform your career with hands-on skills.
              </p>
              <button
                onClick={() => {
                  setShowForm(true);
                  setTimeout(() => {
                    document.getElementById('apply-section')?.scrollIntoView({ 
                      behavior: 'smooth', 
                      block: 'start' 
                    });
                  }, 100);
                }}
                className="cta-button"
                style={{
                  display: 'inline-block',
                  backgroundColor: '#00c896',
                  color: 'white',
                  padding: '1.25rem 3rem',
                  borderRadius: '50px',
                  fontWeight: '600',
                  fontSize: '1.1rem',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: '0 4px 15px rgba(0, 200, 150, 0.3)',
                  border: 'none',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 20px rgba(0, 200, 150, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 15px rgba(0, 200, 150, 0.3)';
                }}
              >
                Apply Now
              </button>
            </div>
          ) : (
            <div style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '3rem',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)',
              maxWidth: '800px',
              margin: '0 auto',
              position: 'relative',
              animation: 'fadeIn 0.3s ease-in'
            }}>
              <button
                onClick={() => setShowForm(false)}
                style={{
                  position: 'absolute',
                  top: '1.5rem',
                  right: '1.5rem',
                  backgroundColor: 'transparent',
                  color: '#999999',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  transition: 'all 0.2s ease',
                  lineHeight: '1'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#f8f9fa';
                  e.target.style.color = '#666666';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.color = '#999999';
                }}
                aria-label="Close form"
              >
                ×
              </button>
              <h2 className="section-title" style={{ marginBottom: '1rem', fontSize: '2rem' }}>
                Application Form
              </h2>
              <p style={{ 
                fontSize: '1rem', 
                marginBottom: '2rem', 
                color: '#666666',
                textAlign: 'center'
              }}>
                Please fill out the form below to complete your application.
              </p>
              <ApplicationForm trackName="Project Management" coursePrice={150000} />
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <img src="/logo.svg" alt="CVERSE Logo" className="footer-logo" />
              <p>Empowering the next generation of digital professionals through world-class education and practical training.</p>
            </div>
            <div className="footer-section">
              <h3>Follow Us</h3>
              <div className="social-links">
                <a href="https://www.linkedin.com/company/cverse-academy/" className="social-link" aria-label="LinkedIn" target="_blank" rel="noopener noreferrer">
                  <i className="fab fa-linkedin"></i>
                </a>
                <a href="https://x.com/CVerse_Academy" className="social-link" aria-label="Twitter" target="_blank" rel="noopener noreferrer">
                  <i className="fab fa-x-twitter"></i>
                </a>
                <a href="https://www.instagram.com/cverse_academy?igsh=aHl4cTNhM3l1ZnVi" className="social-link" aria-label="Instagram" target="_blank" rel="noopener noreferrer">
                  <i className="fab fa-instagram"></i>
                </a>
                <a href="https://www.tiktok.com/@cverse_academy" className="social-link" aria-label="TikTok" target="_blank" rel="noopener noreferrer">
                  <i className="fab fa-tiktok"></i>
                </a>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2025 Demirti Limited. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}

