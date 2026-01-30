'use client';

import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import CookiePreferencesLink from '../components/CookiePreferencesLink';
import Link from 'next/link';
import Image from 'next/image';
import ApplicationForm from '../components/ApplicationForm';

export default function DataSciencePage() {
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
        const response = await fetch('/api/scholarship-status?track=Data Science');
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
    <main>
      <Navbar />
      
      {/* Hero Section */}
      <section className="track-hero" style={{ 
        padding: '10rem 0 6rem', 
        background: 'linear-gradient(135deg, #0066cc 0%, #004d99 100%)',
        color: 'white',
        textAlign: 'center',
        marginTop: '140px',
        position: 'relative'
      }}>
        <div className="container">
          <h1 style={{ fontSize: '3.5rem', fontWeight: '800', marginBottom: '1rem' }}>
            Data Science Track
          </h1>
          <p style={{ fontSize: '1.25rem', maxWidth: '800px', margin: '0 auto 2rem', opacity: 0.95 }}>
            Master the skills to turn raw data into real-world insights. Learn programming, statistics, machine learning, and data visualization to solve complex problems and drive smarter business decisions.
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
              color: '#0066cc',
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
              src="/CVerse_Datascience.jpg"
              alt="Data Science Track"
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
                borderLeft: '4px solid #0066cc'
              }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.75rem', color: '#0066cc' }}>
                  Target Audience
                </h3>
                <p style={{ color: '#666666', lineHeight: '1.7' }}>
                  Beginners, Professionals, Students, and anyone looking to transition into data science.
                </p>
              </div>

              <div style={{
                backgroundColor: '#f8f9fa',
                padding: '2rem',
                borderRadius: '12px',
                borderLeft: '4px solid #0066cc'
              }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.75rem', color: '#0066cc' }}>
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

            <div style={{ marginTop: '3rem', backgroundColor: 'white', padding: '2.5rem', borderRadius: '12px', border: '2px solid #0066cc', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#1a1a1a', margin: 0 }}>
                  Course Fee
                </h3>
                <span style={{ fontSize: '2rem', fontWeight: '700', color: '#0066cc' }}>
                  {isLoading ? 'Loading...' : `₦${coursePrice.toLocaleString()}`}
                </span>
              </div>
              <p style={{ color: '#666666', lineHeight: '1.7', marginBottom: '1rem', fontSize: '1rem' }}>
                Includes certificate and class recordings
              </p>
              {scholarshipAvailable && !isLoading && (
                <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f0f7ff', borderRadius: '8px', borderLeft: '4px solid #0066cc' }}>
                  <p style={{ color: '#0066cc', fontWeight: '600', margin: 0, fontSize: '1rem' }}>
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
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0, color: '#0066cc' }}>
                    WEEK 1 — Data Science Foundations
                  </h3>
                  <span style={{
                    fontSize: '1.2rem',
                    color: '#0066cc',
                    transition: 'transform 0.3s ease',
                    transform: expandedWeeks.has(1) ? 'rotate(180deg)' : 'rotate(0deg)'
                  }}>
                    ▼
                  </span>
                </div>
                {expandedWeeks.has(1) && (
                  <ul style={{ listStyle: 'none', paddingLeft: '0', paddingBottom: '1rem', animation: 'fadeIn 0.3s ease' }}>
                    <li style={{ padding: '0.5rem 0', paddingLeft: '1.5rem', position: 'relative', color: '#666666' }}>
                      <span style={{ position: 'absolute', left: '0', color: '#00c896', fontWeight: 'bold' }}>•</span>
                      What is Data Science? Overview of roles (Data Analyst, Data Scientist, ML Engineer)
                    </li>
                    <li style={{ padding: '0.5rem 0', paddingLeft: '1.5rem', position: 'relative', color: '#666666' }}>
                      <span style={{ position: 'absolute', left: '0', color: '#00c896', fontWeight: 'bold' }}>•</span>
                      Data Science project lifecycle (CRISP-DM)
                    </li>
                    <li style={{ padding: '0.5rem 0', paddingLeft: '1.5rem', position: 'relative', color: '#666666' }}>
                      <span style={{ position: 'absolute', left: '0', color: '#00c896', fontWeight: 'bold' }}>•</span>
                      Understanding structured vs unstructured data
                    </li>
                    <li style={{ padding: '0.5rem 0', paddingLeft: '1.5rem', position: 'relative', color: '#666666' }}>
                      <span style={{ position: 'absolute', left: '0', color: '#00c896', fontWeight: 'bold' }}>•</span>
                      Introduction to Python for Data Science
                    </li>
                    <li style={{ padding: '0.5rem 0', paddingLeft: '1.5rem', position: 'relative', color: '#666666' }}>
                      <span style={{ position: 'absolute', left: '0', color: '#00c896', fontWeight: 'bold' }}>•</span>
                      Setup: Anaconda, Jupyter Notebook, Git/GitHub
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
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0, color: '#0066cc' }}>
                    WEEK 2 — Python for Data Analysis
                  </h3>
                  <span style={{
                    fontSize: '1.2rem',
                    color: '#0066cc',
                    transition: 'transform 0.3s ease',
                    transform: expandedWeeks.has(2) ? 'rotate(180deg)' : 'rotate(0deg)'
                  }}>
                    ▼
                  </span>
                </div>
                {expandedWeeks.has(2) && (
                  <ul style={{ listStyle: 'none', paddingLeft: '0', paddingBottom: '1rem', animation: 'fadeIn 0.3s ease' }}>
                    <li style={{ padding: '0.5rem 0', paddingLeft: '1.5rem', position: 'relative', color: '#666666' }}>
                      <span style={{ position: 'absolute', left: '0', color: '#00c896', fontWeight: 'bold' }}>•</span>
                      Python essentials: variables, loops, functions, modules
                    </li>
                    <li style={{ padding: '0.5rem 0', paddingLeft: '1.5rem', position: 'relative', color: '#666666' }}>
                      <span style={{ position: 'absolute', left: '0', color: '#00c896', fontWeight: 'bold' }}>•</span>
                      Working with NumPy arrays
                    </li>
                    <li style={{ padding: '0.5rem 0', paddingLeft: '1.5rem', position: 'relative', color: '#666666' }}>
                      <span style={{ position: 'absolute', left: '0', color: '#00c896', fontWeight: 'bold' }}>•</span>
                      Data manipulation with Pandas
                    </li>
                    <li style={{ padding: '0.5rem 0', paddingLeft: '1.5rem', position: 'relative', color: '#666666' }}>
                      <span style={{ position: 'absolute', left: '0', color: '#00c896', fontWeight: 'bold' }}>•</span>
                      Exploratory Data Analysis (EDA) basics
                    </li>
                    <li style={{ padding: '0.5rem 0', paddingLeft: '1.5rem', position: 'relative', color: '#666666' }}>
                      <span style={{ position: 'absolute', left: '0', color: '#00c896', fontWeight: 'bold' }}>•</span>
                      Live Project Setup: Define project topic, scope, goals
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
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0, color: '#0066cc' }}>
                    WEEK 3 — Data Wrangling & Cleaning
                  </h3>
                  <span style={{
                    fontSize: '1.2rem',
                    color: '#0066cc',
                    transition: 'transform 0.3s ease',
                    transform: expandedWeeks.has(3) ? 'rotate(180deg)' : 'rotate(0deg)'
                  }}>
                    ▼
                  </span>
                </div>
                {expandedWeeks.has(3) && (
                  <ul style={{ listStyle: 'none', paddingLeft: '0', paddingBottom: '1rem', animation: 'fadeIn 0.3s ease' }}>
                    <li style={{ padding: '0.5rem 0', paddingLeft: '1.5rem', position: 'relative', color: '#666666' }}>
                      <span style={{ position: 'absolute', left: '0', color: '#00c896', fontWeight: 'bold' }}>•</span>
                      Handling missing data, duplicates, and formatting issues
                    </li>
                    <li style={{ padding: '0.5rem 0', paddingLeft: '1.5rem', position: 'relative', color: '#666666' }}>
                      <span style={{ position: 'absolute', left: '0', color: '#00c896', fontWeight: 'bold' }}>•</span>
                      Data normalization & standardization
                    </li>
                    <li style={{ padding: '0.5rem 0', paddingLeft: '1.5rem', position: 'relative', color: '#666666' }}>
                      <span style={{ position: 'absolute', left: '0', color: '#00c896', fontWeight: 'bold' }}>•</span>
                      Feature extraction & feature engineering fundamentals
                    </li>
                    <li style={{ padding: '0.5rem 0', paddingLeft: '1.5rem', position: 'relative', color: '#666666' }}>
                      <span style={{ position: 'absolute', left: '0', color: '#00c896', fontWeight: 'bold' }}>•</span>
                      Dealing with categorical variables
                    </li>
                    <li style={{ padding: '0.5rem 0', paddingLeft: '1.5rem', position: 'relative', color: '#666666' }}>
                      <span style={{ position: 'absolute', left: '0', color: '#00c896', fontWeight: 'bold' }}>•</span>
                      Practical hands-on with real messy datasets
                    </li>
                    <li style={{ padding: '0.5rem 0', paddingLeft: '1.5rem', position: 'relative', color: '#666666' }}>
                      <span style={{ position: 'absolute', left: '0', color: '#00c896', fontWeight: 'bold' }}>•</span>
                      Live Project: Raw data collection & cleaning plan
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
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0, color: '#0066cc' }}>
                    WEEK 4 — Data Visualization & Storytelling
                  </h3>
                  <span style={{
                    fontSize: '1.2rem',
                    color: '#0066cc',
                    transition: 'transform 0.3s ease',
                    transform: expandedWeeks.has(4) ? 'rotate(180deg)' : 'rotate(0deg)'
                  }}>
                    ▼
                  </span>
                </div>
                {expandedWeeks.has(4) && (
                  <ul style={{ listStyle: 'none', paddingLeft: '0', paddingBottom: '1rem', animation: 'fadeIn 0.3s ease' }}>
                    <li style={{ padding: '0.5rem 0', paddingLeft: '1.5rem', position: 'relative', color: '#666666' }}>
                      <span style={{ position: 'absolute', left: '0', color: '#00c896', fontWeight: 'bold' }}>•</span>
                      Visualization best practices
                    </li>
                    <li style={{ padding: '0.5rem 0', paddingLeft: '1.5rem', position: 'relative', color: '#666666' }}>
                      <span style={{ position: 'absolute', left: '0', color: '#00c896', fontWeight: 'bold' }}>•</span>
                      Matplotlib, Seaborn, Plotly fundamentals
                    </li>
                    <li style={{ padding: '0.5rem 0', paddingLeft: '1.5rem', position: 'relative', color: '#666666' }}>
                      <span style={{ position: 'absolute', left: '0', color: '#00c896', fontWeight: 'bold' }}>•</span>
                      Dashboard introduction (Tableau or Power BI)
                    </li>
                    <li style={{ padding: '0.5rem 0', paddingLeft: '1.5rem', position: 'relative', color: '#666666' }}>
                      <span style={{ position: 'absolute', left: '0', color: '#00c896', fontWeight: 'bold' }}>•</span>
                      Communicating insights with narrative clarity
                    </li>
                    <li style={{ padding: '0.5rem 0', paddingLeft: '1.5rem', position: 'relative', color: '#666666' }}>
                      <span style={{ position: 'absolute', left: '0', color: '#00c896', fontWeight: 'bold' }}>•</span>
                      Live Project: EDA + Visual summaries
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
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0, color: '#0066cc' }}>
                    WEEK 5 — Statistics for Data Science
                  </h3>
                  <span style={{
                    fontSize: '1.2rem',
                    color: '#0066cc',
                    transition: 'transform 0.3s ease',
                    transform: expandedWeeks.has(5) ? 'rotate(180deg)' : 'rotate(0deg)'
                  }}>
                    ▼
                  </span>
                </div>
                {expandedWeeks.has(5) && (
                  <ul style={{ listStyle: 'none', paddingLeft: '0', paddingBottom: '1rem', animation: 'fadeIn 0.3s ease' }}>
                    <li style={{ padding: '0.5rem 0', paddingLeft: '1.5rem', position: 'relative', color: '#666666' }}>
                      <span style={{ position: 'absolute', left: '0', color: '#00c896', fontWeight: 'bold' }}>•</span>
                      Descriptive & inferential statistics
                    </li>
                    <li style={{ padding: '0.5rem 0', paddingLeft: '1.5rem', position: 'relative', color: '#666666' }}>
                      <span style={{ position: 'absolute', left: '0', color: '#00c896', fontWeight: 'bold' }}>•</span>
                      Probability distributions
                    </li>
                    <li style={{ padding: '0.5rem 0', paddingLeft: '1.5rem', position: 'relative', color: '#666666' }}>
                      <span style={{ position: 'absolute', left: '0', color: '#00c896', fontWeight: 'bold' }}>•</span>
                      Hypothesis testing (t-test, chi-square, ANOVA)
                    </li>
                    <li style={{ padding: '0.5rem 0', paddingLeft: '1.5rem', position: 'relative', color: '#666666' }}>
                      <span style={{ position: 'absolute', left: '0', color: '#00c896', fontWeight: 'bold' }}>•</span>
                      Correlation vs causation
                    </li>
                    <li style={{ padding: '0.5rem 0', paddingLeft: '1.5rem', position: 'relative', color: '#666666' }}>
                      <span style={{ position: 'absolute', left: '0', color: '#00c896', fontWeight: 'bold' }}>•</span>
                      Statistical significance for business decisions
                    </li>
                    <li style={{ padding: '0.5rem 0', paddingLeft: '1.5rem', position: 'relative', color: '#666666' }}>
                      <span style={{ position: 'absolute', left: '0', color: '#00c896', fontWeight: 'bold' }}>•</span>
                      Live Project: Statistical analysis of a dataset
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
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0, color: '#0066cc' }}>
                    WEEK 6 — Machine Learning Foundations
                  </h3>
                  <span style={{
                    fontSize: '1.2rem',
                    color: '#0066cc',
                    transition: 'transform 0.3s ease',
                    transform: expandedWeeks.has(6) ? 'rotate(180deg)' : 'rotate(0deg)'
                  }}>
                    ▼
                  </span>
                </div>
                {expandedWeeks.has(6) && (
                  <ul style={{ listStyle: 'none', paddingLeft: '0', paddingBottom: '1rem', animation: 'fadeIn 0.3s ease' }}>
                    <li style={{ padding: '0.5rem 0', paddingLeft: '1.5rem', position: 'relative', color: '#666666' }}>
                      <span style={{ position: 'absolute', left: '0', color: '#00c896', fontWeight: 'bold' }}>•</span>
                      What is Machine Learning?
                    </li>
                    <li style={{ padding: '0.5rem 0', paddingLeft: '1.5rem', position: 'relative', color: '#666666' }}>
                      <span style={{ position: 'absolute', left: '0', color: '#00c896', fontWeight: 'bold' }}>•</span>
                      Supervised vs unsupervised learning
                    </li>
                    <li style={{ padding: '0.5rem 0', paddingLeft: '1.5rem', position: 'relative', color: '#666666' }}>
                      <span style={{ position: 'absolute', left: '0', color: '#00c896', fontWeight: 'bold' }}>•</span>
                      Train/validation/test splits
                    </li>
                    <li style={{ padding: '0.5rem 0', paddingLeft: '1.5rem', position: 'relative', color: '#666666' }}>
                      <span style={{ position: 'absolute', left: '0', color: '#00c896', fontWeight: 'bold' }}>•</span>
                      Feature selection techniques
                    </li>
                    <li style={{ padding: '0.5rem 0', paddingLeft: '1.5rem', position: 'relative', color: '#666666' }}>
                      <span style={{ position: 'absolute', left: '0', color: '#00c896', fontWeight: 'bold' }}>•</span>
                      Bias-variance tradeoff, overfitting, underfitting
                    </li>
                    <li style={{ padding: '0.5rem 0', paddingLeft: '1.5rem', position: 'relative', color: '#666666' }}>
                      <span style={{ position: 'absolute', left: '0', color: '#00c896', fontWeight: 'bold' }}>•</span>
                      Live Project: Identify ML approach for your problem
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
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0, color: '#0066cc' }}>
                    WEEK 7 — Supervised Learning Algorithms
                  </h3>
                  <span style={{
                    fontSize: '1.2rem',
                    color: '#0066cc',
                    transition: 'transform 0.3s ease',
                    transform: expandedWeeks.has(7) ? 'rotate(180deg)' : 'rotate(0deg)'
                  }}>
                    ▼
                  </span>
                </div>
                {expandedWeeks.has(7) && (
                  <ul style={{ listStyle: 'none', paddingLeft: '0', paddingBottom: '1rem', animation: 'fadeIn 0.3s ease' }}>
                  <li style={{ padding: '0.5rem 0', paddingLeft: '1.5rem', position: 'relative', color: '#666666' }}>
                    <span style={{ position: 'absolute', left: '0', color: '#00c896', fontWeight: 'bold' }}>•</span>
                    Linear and Logistic Regression
                  </li>
                  <li style={{ padding: '0.5rem 0', paddingLeft: '1.5rem', position: 'relative', color: '#666666' }}>
                    <span style={{ position: 'absolute', left: '0', color: '#00c896', fontWeight: 'bold' }}>•</span>
                    k-Nearest Neighbors
                  </li>
                  <li style={{ padding: '0.5rem 0', paddingLeft: '1.5rem', position: 'relative', color: '#666666' }}>
                    <span style={{ position: 'absolute', left: '0', color: '#00c896', fontWeight: 'bold' }}>•</span>
                    Decision Trees & Random Forests
                  </li>
                  <li style={{ padding: '0.5rem 0', paddingLeft: '1.5rem', position: 'relative', color: '#666666' }}>
                    <span style={{ position: 'absolute', left: '0', color: '#00c896', fontWeight: 'bold' }}>•</span>
                    Gradient Boosting (XGBoost/LightGBM)
                  </li>
                  <li style={{ padding: '0.5rem 0', paddingLeft: '1.5rem', position: 'relative', color: '#666666' }}>
                    <span style={{ position: 'absolute', left: '0', color: '#00c896', fontWeight: 'bold' }}>•</span>
                    Model evaluation metrics (AUC, F1, RMSE, MAPE, etc.)
                  </li>
                  <li style={{ padding: '0.5rem 0', paddingLeft: '1.5rem', position: 'relative', color: '#666666' }}>
                    <span style={{ position: 'absolute', left: '0', color: '#00c896', fontWeight: 'bold' }}>•</span>
                    Live Project: Train baseline models
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
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0, color: '#0066cc' }}>
                    WEEK 8 — Unsupervised Learning Algorithms
                  </h3>
                  <span style={{
                    fontSize: '1.2rem',
                    color: '#0066cc',
                    transition: 'transform 0.3s ease',
                    transform: expandedWeeks.has(8) ? 'rotate(180deg)' : 'rotate(0deg)'
                  }}>
                    ▼
                  </span>
                </div>
                {expandedWeeks.has(8) && (
                  <ul style={{ listStyle: 'none', paddingLeft: '0', paddingBottom: '1rem', animation: 'fadeIn 0.3s ease' }}>
                  <li style={{ padding: '0.5rem 0', paddingLeft: '1.5rem', position: 'relative', color: '#666666' }}>
                    <span style={{ position: 'absolute', left: '0', color: '#00c896', fontWeight: 'bold' }}>•</span>
                    Clustering: K-Means, DBSCAN, Hierarchical
                  </li>
                  <li style={{ padding: '0.5rem 0', paddingLeft: '1.5rem', position: 'relative', color: '#666666' }}>
                    <span style={{ position: 'absolute', left: '0', color: '#00c896', fontWeight: 'bold' }}>•</span>
                    Dimensionality reduction with PCA
                  </li>
                  <li style={{ padding: '0.5rem 0', paddingLeft: '1.5rem', position: 'relative', color: '#666666' }}>
                    <span style={{ position: 'absolute', left: '0', color: '#00c896', fontWeight: 'bold' }}>•</span>
                    Association rule mining
                  </li>
                  <li style={{ padding: '0.5rem 0', paddingLeft: '1.5rem', position: 'relative', color: '#666666' }}>
                    <span style={{ position: 'absolute', left: '0', color: '#00c896', fontWeight: 'bold' }}>•</span>
                    Anomaly detection basics
                  </li>
                  <li style={{ padding: '0.5rem 0', paddingLeft: '1.5rem', position: 'relative', color: '#666666' }}>
                    <span style={{ position: 'absolute', left: '0', color: '#00c896', fontWeight: 'bold' }}>•</span>
                    Live Project: Consider unsupervised techniques where applicable
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
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0, color: '#0066cc' }}>
                    WEEK 9 — Deep Learning & Neural Networks (Intro)
                  </h3>
                  <span style={{
                    fontSize: '1.2rem',
                    color: '#0066cc',
                    transition: 'transform 0.3s ease',
                    transform: expandedWeeks.has(9) ? 'rotate(180deg)' : 'rotate(0deg)'
                  }}>
                    ▼
                  </span>
                </div>
                {expandedWeeks.has(9) && (
                  <ul style={{ listStyle: 'none', paddingLeft: '0', paddingBottom: '1rem', animation: 'fadeIn 0.3s ease' }}>
                  <li style={{ padding: '0.5rem 0', paddingLeft: '1.5rem', position: 'relative', color: '#666666' }}>
                    <span style={{ position: 'absolute', left: '0', color: '#00c896', fontWeight: 'bold' }}>•</span>
                    Introduction to neural networks
                  </li>
                  <li style={{ padding: '0.5rem 0', paddingLeft: '1.5rem', position: 'relative', color: '#666666' }}>
                    <span style={{ position: 'absolute', left: '0', color: '#00c896', fontWeight: 'bold' }}>•</span>
                    Fundamentals of TensorFlow/Keras or PyTorch
                  </li>
                  <li style={{ padding: '0.5rem 0', paddingLeft: '1.5rem', position: 'relative', color: '#666666' }}>
                    <span style={{ position: 'absolute', left: '0', color: '#00c896', fontWeight: 'bold' }}>•</span>
                    Building your first neural model
                  </li>
                  <li style={{ padding: '0.5rem 0', paddingLeft: '1.5rem', position: 'relative', color: '#666666' }}>
                    <span style={{ position: 'absolute', left: '0', color: '#00c896', fontWeight: 'bold' }}>•</span>
                    Deep learning for classification & regression
                  </li>
                  <li style={{ padding: '0.5rem 0', paddingLeft: '1.5rem', position: 'relative', color: '#666666' }}>
                    <span style={{ position: 'absolute', left: '0', color: '#00c896', fontWeight: 'bold' }}>•</span>
                    Live Project: Optional deep learning model iteration
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
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0, color: '#0066cc' }}>
                    WEEK 10 — Model Tuning, Optimization & Deployment
                  </h3>
                  <span style={{
                    fontSize: '1.2rem',
                    color: '#0066cc',
                    transition: 'transform 0.3s ease',
                    transform: expandedWeeks.has(10) ? 'rotate(180deg)' : 'rotate(0deg)'
                  }}>
                    ▼
                  </span>
                </div>
                {expandedWeeks.has(10) && (
                  <ul style={{ listStyle: 'none', paddingLeft: '0', paddingBottom: '1rem', animation: 'fadeIn 0.3s ease' }}>
                  <li style={{ padding: '0.5rem 0', paddingLeft: '1.5rem', position: 'relative', color: '#666666' }}>
                    <span style={{ position: 'absolute', left: '0', color: '#00c896', fontWeight: 'bold' }}>•</span>
                    Hyperparameter tuning (GridSearch, RandomSearch, Optuna)
                  </li>
                  <li style={{ padding: '0.5rem 0', paddingLeft: '1.5rem', position: 'relative', color: '#666666' }}>
                    <span style={{ position: 'absolute', left: '0', color: '#00c896', fontWeight: 'bold' }}>•</span>
                    Model interpretability (SHAP, LIME)
                  </li>
                  <li style={{ padding: '0.5rem 0', paddingLeft: '1.5rem', position: 'relative', color: '#666666' }}>
                    <span style={{ position: 'absolute', left: '0', color: '#00c896', fontWeight: 'bold' }}>•</span>
                    Deploying models using Flask/FastAPI
                  </li>
                  <li style={{ padding: '0.5rem 0', paddingLeft: '1.5rem', position: 'relative', color: '#666666' }}>
                    <span style={{ position: 'absolute', left: '0', color: '#00c896', fontWeight: 'bold' }}>•</span>
                    Streamlit for ML apps
                  </li>
                  <li style={{ padding: '0.5rem 0', paddingLeft: '1.5rem', position: 'relative', color: '#666666' }}>
                    <span style={{ position: 'absolute', left: '0', color: '#00c896', fontWeight: 'bold' }}>•</span>
                    Live Project: Build a deployable model prototype
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
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0, color: '#0066cc' }}>
                    WEEK 11 — Real-World Data Science Practices
                  </h3>
                  <span style={{
                    fontSize: '1.2rem',
                    color: '#0066cc',
                    transition: 'transform 0.3s ease',
                    transform: expandedWeeks.has(11) ? 'rotate(180deg)' : 'rotate(0deg)'
                  }}>
                    ▼
                  </span>
                </div>
                {expandedWeeks.has(11) && (
                  <ul style={{ listStyle: 'none', paddingLeft: '0', paddingBottom: '1rem', animation: 'fadeIn 0.3s ease' }}>
                  <li style={{ padding: '0.5rem 0', paddingLeft: '1.5rem', position: 'relative', color: '#666666' }}>
                    <span style={{ position: 'absolute', left: '0', color: '#00c896', fontWeight: 'bold' }}>•</span>
                    Data pipelines & workflow automation
                  </li>
                  <li style={{ padding: '0.5rem 0', paddingLeft: '1.5rem', position: 'relative', color: '#666666' }}>
                    <span style={{ position: 'absolute', left: '0', color: '#00c896', fontWeight: 'bold' }}>•</span>
                    Working with cloud tools (AWS/GCP/Azure intro)
                  </li>
                  <li style={{ padding: '0.5rem 0', paddingLeft: '1.5rem', position: 'relative', color: '#666666' }}>
                    <span style={{ position: 'absolute', left: '0', color: '#00c896', fontWeight: 'bold' }}>•</span>
                    SQL for data science (queries, joins, aggregations)
                  </li>
                  <li style={{ padding: '0.5rem 0', paddingLeft: '1.5rem', position: 'relative', color: '#666666' }}>
                    <span style={{ position: 'absolute', left: '0', color: '#00c896', fontWeight: 'bold' }}>•</span>
                    Version control & reproducibility
                  </li>
                  <li style={{ padding: '0.5rem 0', paddingLeft: '1.5rem', position: 'relative', color: '#666666' }}>
                    <span style={{ position: 'absolute', left: '0', color: '#00c896', fontWeight: 'bold' }}>•</span>
                    Live Project: Finalize model + deployment + documentation
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
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0, color: '#0066cc' }}>
                    WEEK 12 — Capstone Project Presentation + Career Support
                  </h3>
                  <span style={{
                    fontSize: '1.2rem',
                    color: '#0066cc',
                    transition: 'transform 0.3s ease',
                    transform: expandedWeeks.has(12) ? 'rotate(180deg)' : 'rotate(0deg)'
                  }}>
                    ▼
                  </span>
                </div>
                {expandedWeeks.has(12) && (
                  <ul style={{ listStyle: 'none', paddingLeft: '0', paddingBottom: '1rem', animation: 'fadeIn 0.3s ease' }}>
                  <li style={{ padding: '0.5rem 0', paddingLeft: '1.5rem', position: 'relative', color: '#666666' }}>
                    <span style={{ position: 'absolute', left: '0', color: '#00c896', fontWeight: 'bold' }}>•</span>
                    Final project presentation to mentors/peers
                  </li>
                  <li style={{ padding: '0.5rem 0', paddingLeft: '1.5rem', position: 'relative', color: '#666666' }}>
                    <span style={{ position: 'absolute', left: '0', color: '#00c896', fontWeight: 'bold' }}>•</span>
                    Demo of EDA, models, and deployment
                  </li>
                  <li style={{ padding: '0.5rem 0', paddingLeft: '1.5rem', position: 'relative', color: '#666666' }}>
                    <span style={{ position: 'absolute', left: '0', color: '#00c896', fontWeight: 'bold' }}>•</span>
                    Portfolio development: GitHub, Kaggle, personal website
                  </li>
                  <li style={{ padding: '0.5rem 0', paddingLeft: '1.5rem', position: 'relative', color: '#666666' }}>
                    <span style={{ position: 'absolute', left: '0', color: '#00c896', fontWeight: 'bold' }}>•</span>
                    Resume optimization (data-science specific)
                  </li>
                  <li style={{ padding: '0.5rem 0', paddingLeft: '1.5rem', position: 'relative', color: '#666666' }}>
                    <span style={{ position: 'absolute', left: '0', color: '#00c896', fontWeight: 'bold' }}>•</span>
                    Mock interviews — technical + behavioural
                  </li>
                  <li style={{ padding: '0.5rem 0', paddingLeft: '1.5rem', position: 'relative', color: '#666666' }}>
                    <span style={{ position: 'absolute', left: '0', color: '#00c896', fontWeight: 'bold' }}>•</span>
                    Career roadmap: Data Analyst → Data Scientist → ML Engineer
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
              <p style={{ fontSize: '1.1rem', lineHeight: '1.8', color: '#666666', marginBottom: '1.5rem' }}>
                Graduates will be able to clean and analyze complex datasets, build predictive models, and communicate data-driven insights effectively to stakeholders.
              </p>
              <p style={{ fontSize: '1.1rem', lineHeight: '1.8', color: '#666666' }}>
                By the end of the 12-week Data Science bootcamp, learners will be able to confidently work with real-world datasets, clean and prepare data, perform statistical analysis, and create compelling visual insights. They will understand the full data science lifecycle and be capable of building, evaluating, and improving machine learning models using industry-standard tools. Graduates will also gain hands-on experience deploying models and presenting data-driven solutions, enabling them to step into data-focused roles with a strong portfolio project that showcases their technical and analytical abilities.
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
                {['Mayowa', 'Sipo', 'Posi', 'Chioma', 'Alex'].map((name, index) => (
                  <div key={index} style={{
                    padding: '1.5rem',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px',
                    textAlign: 'center',
                    borderLeft: '3px solid #0066cc'
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
                Join our 12-week Data Science bootcamp and transform your career with hands-on skills.
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
                  backgroundColor: '#0066cc',
                  color: 'white',
                  padding: '1.25rem 3rem',
                  borderRadius: '50px',
                  fontWeight: '600',
                  fontSize: '1.1rem',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: '0 4px 15px rgba(0, 102, 204, 0.3)',
                  border: 'none',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 20px rgba(0, 102, 204, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 15px rgba(0, 102, 204, 0.3)';
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
                trackName="Data Science"
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

