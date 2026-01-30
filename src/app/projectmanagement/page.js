'use client';

import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import CookiePreferencesLink from '../components/CookiePreferencesLink';
import Link from 'next/link';
import Image from 'next/image';
import ApplicationForm from '../components/ApplicationForm';

export default function ProjectManagementPage() {
  const [showForm, setShowForm] = useState(false);
  const [scholarshipAvailable, setScholarshipAvailable] = useState(false);
  const [coursePrice, setCoursePrice] = useState(150000); // Default fallback
  const [discountPercentage, setDiscountPercentage] = useState(50); // Default fallback
  const [scholarshipLimit, setScholarshipLimit] = useState(10); // Default fallback
  const [expandedWeeks, setExpandedWeeks] = useState(new Set());
  const [isLoading, setIsLoading] = useState(true);

  // Load track configuration and scholarship status from database
  useEffect(() => {
    const loadTrackData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/scholarship-status?track=Project Management');
        const data = await response.json();
        if (data.coursePrice) {
          setCoursePrice(data.coursePrice);
        }
        if (data.discountPercentage) {
          setDiscountPercentage(data.discountPercentage);
        }
        if (data.limit) {
          setScholarshipLimit(data.limit);
        }
        if (data.available) {
          setScholarshipAvailable(true);
        }
      } catch (error) {
        console.error('Error loading track data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadTrackData();
  }, []);

  const toggleWeek = (weekNumber) => {
    setExpandedWeeks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(weekNumber)) {
        newSet.delete(weekNumber);
      } else {
        newSet.add(weekNumber);
      }
      return newSet;
    });
  };

  return (
    <main className="with-fixed-header">
      <Navbar />
      
      {/* Hero Section */}
      <section className="track-hero" style={{ 
        padding: '10rem 0 6rem', 
        background: 'linear-gradient(135deg, #00c896 0%, #00a578 100%)',
        color: 'white',
        textAlign: 'center',
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

      {/* Track Image Section */}
      <section style={{ 
        padding: '4rem 0', 
        backgroundColor: '#f8f9fa',
        position: 'relative'
      }}>
        <div className="container">
          <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
            backgroundColor: 'white'
          }}>
            <Image
              src="/CVerse_ProjectMgt.jpg"
              alt="Project Management Track"
              width={1200}
              height={675}
              style={{
                width: '100%',
                height: 'auto',
                display: 'block',
                objectFit: 'cover'
              }}
              priority
            />
          </div>
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
                <p style={{ color: '#666666', lineHeight: '1.7', fontSize: '1rem', marginTop: '0.5rem' }}>
                  February 2026 - April 2026 (Weekends)
                </p>
              </div>
            </div>

            <div style={{ marginTop: '3rem', backgroundColor: 'white', padding: '2.5rem', borderRadius: '12px', border: '2px solid #00c896', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#1a1a1a', margin: 0 }}>
                  Course Fee
                </h3>
                <span style={{ fontSize: '2rem', fontWeight: '700', color: '#00c896' }}>
                  {isLoading ? 'Loading...' : `₦${coursePrice.toLocaleString()}`}
                </span>
              </div>
              <p style={{ color: '#666666', lineHeight: '1.7', marginBottom: '1rem', fontSize: '1rem' }}>
                Includes certificate and class recordings
              </p>
              {scholarshipAvailable && !isLoading && (
                <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f0fdfa', borderRadius: '8px', borderLeft: '4px solid #00c896' }}>
                  <p style={{ color: '#00c896', fontWeight: '600', margin: 0, fontSize: '1rem' }}>
                    Limited Offer: First {scholarshipLimit} paid learners receive a {Math.round(discountPercentage)}% scholarship discount
                  </p>
                </div>
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
              <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid #e1e4e8' }}>
                <div
                  onClick={() => toggleWeek(1)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    padding: '1rem 0',
                    userSelect: 'none'
                  }}
                >
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0, color: '#00c896' }}>
                    Week 1 – Project Management Fundamentals
                  </h3>
                  <span style={{
                    fontSize: '1.2rem',
                    color: '#00c896',
                    transition: 'transform 0.3s ease',
                    transform: expandedWeeks.has(1) ? 'rotate(180deg)' : 'rotate(0deg)'
                  }}>
                    ▼
                  </span>
                </div>
                {expandedWeeks.has(1) && (
                  <ul style={{ listStyle: 'none', paddingLeft: '0', paddingBottom: '1rem', animation: 'fadeIn 0.3s ease' }}>
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
                )}
              </div>

              <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid #e1e4e8' }}>
                <div
                  onClick={() => toggleWeek(2)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    padding: '1rem 0',
                    userSelect: 'none'
                  }}
                >
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0, color: '#00c896' }}>
                    Week 2 – Project Initiation
                  </h3>
                  <span style={{
                    fontSize: '1.2rem',
                    color: '#00c896',
                    transition: 'transform 0.3s ease',
                    transform: expandedWeeks.has(2) ? 'rotate(180deg)' : 'rotate(0deg)'
                  }}>
                    ▼
                  </span>
                </div>
                {expandedWeeks.has(2) && (
                  <ul style={{ listStyle: 'none', paddingLeft: '0', paddingBottom: '1rem', animation: 'fadeIn 0.3s ease' }}>
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
                )}
              </div>

              <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid #e1e4e8' }}>
                <div
                  onClick={() => toggleWeek(3)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    padding: '1rem 0',
                    userSelect: 'none'
                  }}
                >
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0, color: '#00c896' }}>
                    Week 3 – Project Planning: Scope & Work Breakdown
                  </h3>
                  <span style={{
                    fontSize: '1.2rem',
                    color: '#00c896',
                    transition: 'transform 0.3s ease',
                    transform: expandedWeeks.has(3) ? 'rotate(180deg)' : 'rotate(0deg)'
                  }}>
                    ▼
                  </span>
                </div>
                {expandedWeeks.has(3) && (
                  <ul style={{ listStyle: 'none', paddingLeft: '0', paddingBottom: '1rem', animation: 'fadeIn 0.3s ease' }}>
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
                )}
              </div>

              <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid #e1e4e8' }}>
                <div
                  onClick={() => toggleWeek(4)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    padding: '1rem 0',
                    userSelect: 'none'
                  }}
                >
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0, color: '#00c896' }}>
                    Week 4 – Project Schedule & Cost Planning
                  </h3>
                  <span style={{
                    fontSize: '1.2rem',
                    color: '#00c896',
                    transition: 'transform 0.3s ease',
                    transform: expandedWeeks.has(4) ? 'rotate(180deg)' : 'rotate(0deg)'
                  }}>
                    ▼
                  </span>
                </div>
                {expandedWeeks.has(4) && (
                  <ul style={{ listStyle: 'none', paddingLeft: '0', paddingBottom: '1rem', animation: 'fadeIn 0.3s ease' }}>
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
                )}
              </div>

              <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid #e1e4e8' }}>
                <div
                  onClick={() => toggleWeek(5)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    padding: '1rem 0',
                    userSelect: 'none'
                  }}
                >
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0, color: '#00c896' }}>
                    Week 5 – Risk & Quality Planning
                  </h3>
                  <span style={{
                    fontSize: '1.2rem',
                    color: '#00c896',
                    transition: 'transform 0.3s ease',
                    transform: expandedWeeks.has(5) ? 'rotate(180deg)' : 'rotate(0deg)'
                  }}>
                    ▼
                  </span>
                </div>
                {expandedWeeks.has(5) && (
                  <ul style={{ listStyle: 'none', paddingLeft: '0', paddingBottom: '1rem', animation: 'fadeIn 0.3s ease' }}>
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
                )}
              </div>

              <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid #e1e4e8' }}>
                <div
                  onClick={() => toggleWeek(6)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    padding: '1rem 0',
                    userSelect: 'none'
                  }}
                >
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0, color: '#00c896' }}>
                    Week 6 – Project Execution Essentials
                  </h3>
                  <span style={{
                    fontSize: '1.2rem',
                    color: '#00c896',
                    transition: 'transform 0.3s ease',
                    transform: expandedWeeks.has(6) ? 'rotate(180deg)' : 'rotate(0deg)'
                  }}>
                    ▼
                  </span>
                </div>
                {expandedWeeks.has(6) && (
                  <ul style={{ listStyle: 'none', paddingLeft: '0', paddingBottom: '1rem', animation: 'fadeIn 0.3s ease' }}>
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
                )}
              </div>

              <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid #e1e4e8' }}>
                <div
                  onClick={() => toggleWeek(7)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    padding: '1rem 0',
                    userSelect: 'none'
                  }}
                >
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0, color: '#00c896' }}>
                    Week 7 – Agile and Hybrid Approaches
                  </h3>
                  <span style={{
                    fontSize: '1.2rem',
                    color: '#00c896',
                    transition: 'transform 0.3s ease',
                    transform: expandedWeeks.has(7) ? 'rotate(180deg)' : 'rotate(0deg)'
                  }}>
                    ▼
                  </span>
                </div>
                {expandedWeeks.has(7) && (
                  <ul style={{ listStyle: 'none', paddingLeft: '0', paddingBottom: '1rem', animation: 'fadeIn 0.3s ease' }}>
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
                )}
              </div>

              <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid #e1e4e8' }}>
                <div
                  onClick={() => toggleWeek(8)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    padding: '1rem 0',
                    userSelect: 'none'
                  }}
                >
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0, color: '#00c896' }}>
                    Week 8 – Project Monitoring & Control
                  </h3>
                  <span style={{
                    fontSize: '1.2rem',
                    color: '#00c896',
                    transition: 'transform 0.3s ease',
                    transform: expandedWeeks.has(8) ? 'rotate(180deg)' : 'rotate(0deg)'
                  }}>
                    ▼
                  </span>
                </div>
                {expandedWeeks.has(8) && (
                  <ul style={{ listStyle: 'none', paddingLeft: '0', paddingBottom: '1rem', animation: 'fadeIn 0.3s ease' }}>
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
                )}
              </div>

              <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid #e1e4e8' }}>
                <div
                  onClick={() => toggleWeek(9)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    padding: '1rem 0',
                    userSelect: 'none'
                  }}
                >
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0, color: '#00c896' }}>
                    Week 9 – Tools, Software & Collaboration
                  </h3>
                  <span style={{
                    fontSize: '1.2rem',
                    color: '#00c896',
                    transition: 'transform 0.3s ease',
                    transform: expandedWeeks.has(9) ? 'rotate(180deg)' : 'rotate(0deg)'
                  }}>
                    ▼
                  </span>
                </div>
                {expandedWeeks.has(9) && (
                  <ul style={{ listStyle: 'none', paddingLeft: '0', paddingBottom: '1rem', animation: 'fadeIn 0.3s ease' }}>
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
                )}
              </div>

              <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid #e1e4e8' }}>
                <div
                  onClick={() => toggleWeek(10)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    padding: '1rem 0',
                    userSelect: 'none'
                  }}
                >
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0, color: '#00c896' }}>
                    Week 10 – Closure & Lessons Learned
                  </h3>
                  <span style={{
                    fontSize: '1.2rem',
                    color: '#00c896',
                    transition: 'transform 0.3s ease',
                    transform: expandedWeeks.has(10) ? 'rotate(180deg)' : 'rotate(0deg)'
                  }}>
                    ▼
                  </span>
                </div>
                {expandedWeeks.has(10) && (
                  <ul style={{ listStyle: 'none', paddingLeft: '0', paddingBottom: '1rem', animation: 'fadeIn 0.3s ease' }}>
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
                )}
              </div>

              <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid #e1e4e8' }}>
                <div
                  onClick={() => toggleWeek(11)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    padding: '1rem 0',
                    userSelect: 'none'
                  }}
                >
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0, color: '#00c896' }}>
                    Week 11 – Live Project Progress & Refinement
                  </h3>
                  <span style={{
                    fontSize: '1.2rem',
                    color: '#00c896',
                    transition: 'transform 0.3s ease',
                    transform: expandedWeeks.has(11) ? 'rotate(180deg)' : 'rotate(0deg)'
                  }}>
                    ▼
                  </span>
                </div>
                {expandedWeeks.has(11) && (
                  <ul style={{ listStyle: 'none', paddingLeft: '0', paddingBottom: '1rem', animation: 'fadeIn 0.3s ease' }}>
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
                )}
              </div>

              <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid #e1e4e8' }}>
                <div
                  onClick={() => toggleWeek(12)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    padding: '1rem 0',
                    userSelect: 'none'
                  }}
                >
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0, color: '#00c896' }}>
                    Week 12 – Capstone Presentation & Career Readiness
                  </h3>
                  <span style={{
                    fontSize: '1.2rem',
                    color: '#00c896',
                    transition: 'transform 0.3s ease',
                    transform: expandedWeeks.has(12) ? 'rotate(180deg)' : 'rotate(0deg)'
                  }}>
                    ▼
                  </span>
                </div>
                {expandedWeeks.has(12) && (
                  <ul style={{ listStyle: 'none', paddingLeft: '0', paddingBottom: '1rem', animation: 'fadeIn 0.3s ease' }}>
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
                )}
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
      {/* <section style={{ padding: '5rem 0', backgroundColor: '#f8f9fa' }}>
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
      </section> */}

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
            <div className="application-form-card" style={{
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
                className="close-button"
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
              <ApplicationForm 
                trackName="Project Management"
                coursePrice={coursePrice}
                discountPercentage={discountPercentage}
                scholarshipLimit={scholarshipLimit}
                scholarshipAvailable={scholarshipAvailable}
              />
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <Image src="/logo.svg" alt="CVERSE Logo" className="footer-logo" width={150} height={50} />
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
                <a href="https://www.instagram.com/cversedemirti/" className="social-link" aria-label="Instagram" target="_blank" rel="noopener noreferrer">
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
            <CookiePreferencesLink />
          </div>
        </div>
      </footer>
    </main>
  );
}

