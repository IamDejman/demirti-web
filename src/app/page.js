export default function Home() {
  return (
    <main>
      {/* Header */}
      <header>
        <div className="container header-container">
          <img src="/logo.png" alt="CVERSE Logo" className="logo" />
          <nav>
            <ul className="nav-links">
              <li><a href="#home" className="active">Home</a></li>
              <li><a href="#about">About</a></li>
              <li><a href="#tracks">Tracks</a></li>
              <li><a href="#admissions">Apply</a></li>
              <li><a href="#contact">Contact</a></li>
            </ul>
            <button className="mobile-menu-btn">☰</button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero" id="home">
        <div className="container">
          <div className="hero-content">
            <h1>Transform Your Career Through Digital Skills</h1>
            <p>CVERSE is Demirti's premier digital training initiative, designed to equip you with the skills needed to excel in today's technology-driven world.</p>
            <a href="#tracks" className="cta-button">Explore Our Courses</a>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="about" id="about">
        <div className="container">
          <div className="about-content">
            <h2 className="section-title">About CVERSE</h2>
            <div className="about-text">
              <h3>Our Mission</h3>
              <p>At CVERSE, we're committed to bridging the digital skills gap by providing world-class education in Data Science and Technical Product Management. Our mission is to empower individuals with the knowledge and practical skills needed to thrive in the digital economy.</p>
              
              <h3>Our Approach</h3>
              <p>We believe in learning by doing. Our curriculum combines theoretical foundations with hands-on projects that simulate real-world challenges. Small class sizes ensure personalized attention, while our industry-experienced instructors bring practical insights to every lesson.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Tracks Overview */}
      <section className="tracks-overview" id="tracks">
        <div className="container">
          <h2 className="section-title">Our Specialized Tracks</h2>
          <div className="tracks-container">
            <div className="track-card data-science-card">
              <h3>Data Science</h3>
              <p>Master the skills to transform data into actionable insights. Learn programming, statistics, machine learning, and data visualization to solve complex business problems.</p>
              <a href="#data-science" className="track-button data-science-button">Learn More</a>
            </div>
            <div className="track-card tpm-card">
              <h3>Technical Product Management</h3>
              <p>Bridge the gap between business and technology. Develop the skills to lead product development, understand user needs, and drive technical innovation.</p>
              <a href="#tpm" className="track-button tpm-button">Learn More</a>
            </div>
          </div>
        </div>
      </section>

      {/* Data Science Track Details */}
      <section className="track-details data-science-details" id="data-science">
        <div className="container">
          <div className="track-details-container">
            <div className="track-details-content">
              <h2>Data Science Track</h2>
              <p>Our Data Science program equips you with the skills to extract insights from complex data and drive data-informed decisions in any industry.</p>
              
              <div className="track-grid">
                <div className="track-grid-item curriculum">
                  <h3>Curriculum Overview</h3>
                  <ul>
                    <li>Python programming and data manipulation</li>
                    <li>Statistical analysis and probability</li>
                    <li>Machine learning algorithms</li>
                    <li>Data visualization and storytelling</li>
                    <li>Big data technologies</li>
                    <li>Deep learning fundamentals</li>
                    <li>Natural language processing</li>
                    <li>Time series analysis</li>
                  </ul>
                </div>
                
                <div className="track-grid-item details">
                  <div className="track-info-card">
                    <h3>Learning Outcomes</h3>
                    <p>Graduates will be able to clean and analyze complex datasets, build predictive models, and communicate data-driven insights effectively to stakeholders.</p>
                  </div>
                  
                  <div className="track-info-card">
                    <h3>Prerequisites</h3>
                    <p>Basic understanding of mathematics and programming concepts. No prior data science experience required.</p>
                  </div>
                  
                  <div className="track-info-card">
                    <h3>Course Format</h3>
                    <p>12-week intensive program with hands-on projects and real-world case studies. Includes weekly mentorship sessions and a capstone project.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TPM Track Details */}
      <section className="track-details tpm-details" id="tpm">
        <div className="container">
          <div className="track-details-container">
            <div className="track-details-content">
              <h2>Technical Product Management Track</h2>
              <p>Our TPM program prepares you to lead product development in technology companies, bridging business strategy with technical execution.</p>
              
              <div className="track-grid">
                <div className="track-grid-item curriculum tpm">
                  <h3>Curriculum Overview</h3>
                  <ul>
                    <li>Product strategy and roadmapping</li>
                    <li>User research and requirements gathering</li>
                    <li>Agile methodologies and project management</li>
                    <li>Technical architecture fundamentals</li>
                    <li>Data-driven decision making</li>
                    <li>Product analytics and metrics</li>
                    <li>Stakeholder management</li>
                    <li>Product launch and go-to-market strategies</li>
                  </ul>
                </div>
                
                <div className="track-grid-item details tpm">
                  <div className="track-info-card">
                    <h3>Learning Outcomes</h3>
                    <p>Graduates will be able to lead cross-functional teams, translate business requirements into technical specifications, and drive product development from conception to launch.</p>
                  </div>
                  
                  <div className="track-info-card">
                    <h3>Prerequisites</h3>
                    <p>Basic understanding of software development concepts. Professional experience in either business or technical roles is beneficial but not required.</p>
                  </div>
                  
                  <div className="track-info-card">
                    <h3>Course Format</h3>
                    <p>12-week program with flexible learning options. Includes hands-on workshops, case studies, and a capstone project where you'll develop a product from idea to implementation plan.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Apply Now Section */}
      <section className="apply-now" id="apply">
        <div className="container">
          <div className="apply-now-container">
            <div className="apply-now-content">
              <h2>Apply Now</h2>
              <p>Ready to take the next step in your career? Apply to our program today and join a community of ambitious professionals.</p>
              <a href="#" className="cta-button">Apply Now</a>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="contact" id="contact">
        <div className="container">
          <div className="contact-container">
            <h2 className="section-title">Contact Us</h2>
            <div className="contact-grid">
              <div className="contact-info">
                <h3>Get in Touch</h3>
                <p>Have questions about our programs or the application process? We're here to help!</p>
                
                <div className="contact-details">
                  <p><strong>Email:</strong> admin@demirti.com</p>
                  <p><strong>Phone:</strong> +234 810 107 5670</p>
                  <p><strong>Alternative Phone:</strong> +234 808 993 2753</p>
                </div>
              </div>
              
              <div className="contact-form">
                <form id="contactForm">
                  <div className="form-group">
                    <label htmlFor="name">Name</label>
                    <input type="text" id="name" name="name" required />
                  </div>
                  <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input type="email" id="email" name="email" required />
                  </div>
                  <div className="form-group">
                    <label htmlFor="message">Message</label>
                    <textarea id="message" name="message" rows="5" required></textarea>
                  </div>
                  <button type="submit" className="cta-button">Send Message</button>
                </form>
              </div>
            </div>
          </div>
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
              <h3>Quick Links</h3>
              <ul>
                <li><a href="#home">Home</a></li>
                <li><a href="#about">About</a></li>
                <li><a href="#tracks">Tracks</a></li>
                <li><a href="#admissions">Apply</a></li>
              </ul>
            </div>
            <div className="footer-section">
              <h3>Contact Us</h3>
              <p>Email: admin@demirti.com</p>
              <p>Phone 1: +234 810 107 5670</p>
              <p>Phone 2: +234 808 993 2753</p>
            </div>
            <div className="footer-section">
              <h3>Follow Us</h3>
              <div className="social-links">
                <a href="#" className="social-link" aria-label="LinkedIn">
                  <i className="fab fa-linkedin"></i>
                </a>
                <a href="#" className="social-link" aria-label="Twitter">
                  <i className="fab fa-x-twitter"></i>
                </a>
                <a href="#" className="social-link" aria-label="Instagram">
                  <i className="fab fa-instagram"></i>
                </a>
                <a href="#" className="social-link" aria-label="YouTube">
                  <i className="fab fa-youtube"></i>
                </a>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2025 Demirti Technologies Limited. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  );
} 