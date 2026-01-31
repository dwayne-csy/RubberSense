import React from 'react';
import UserHeader from '../layouts/UserHeader.jsx';
import UserFooter from '../layouts/UserFooter.jsx';

const AboutRubber = () => {
  return (
    <>
      <UserHeader />
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.mainTitle}>About Rubber</h1>
          <h2 style={styles.subTitle}>THE TREE OF INDUSTRY</h2>
        </div>
        
        <div style={styles.introSection}>
          <p style={styles.introText}>
            The rubber tree (Hevea brasiliensis), often called the "Tree of Industry", 
            is one of the world's most valuable tropical trees due to its versatile latex production. 
            Every part of this remarkable tree contributes to various industries worldwide, 
            providing materials for transportation, healthcare, manufacturing, and daily life.
          </p>
        </div>
        
        <div style={styles.sectionsContainer}>
          {/* Leaves Section */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <h3 style={styles.sectionTitle}>Leaves</h3>
              <div style={styles.icon}>🍃</div>
            </div>
            <p style={styles.sectionText}>
              Rubber tree leaves are not just for photosynthesis. They can be used to make 
              organic fertilizers, traditional medicines, and as feedstock for silkworms. 
              The leaves also serve as natural indicators of the tree's health and nutritional status.
            </p>
          </div>
          
          {/* Latex Section */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <h3 style={styles.sectionTitle}>Latex</h3>
              <div style={styles.icon}>⚪</div>
            </div>
            <p style={styles.sectionText}>
              This milky white sap is the tree's primary commercial product. Latex is processed into 
              natural rubber for tires, gloves, medical devices, footwear, adhesives, mattresses, 
              elastic bands, and countless industrial applications. Each tree can produce latex 
              for 25-30 years through sustainable tapping methods.
            </p>
          </div>
          
          {/* Trunk Section */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <h3 style={styles.sectionTitle}>Trunk</h3>
              <div style={styles.icon}>🪵</div>
            </div>
            <p style={styles.sectionText}>
              After latex production ends, the rubber tree trunk provides valuable timber for 
              furniture, flooring, construction materials, and handicrafts. The wood is moderately 
              hard, attractive, and takes polish well, making it suitable for indoor furniture 
              and decorative items.
            </p>
          </div>
          
          {/* Bark Section */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <h3 style={styles.sectionTitle}>Bark</h3>
              <div style={styles.icon}>🌳</div>
            </div>
            <p style={styles.sectionText}>
              The bark protects the tree and contains the latex vessels. After tapping cycles, 
              bark residues can be processed into organic mulches, soil conditioners, or 
              biomass fuel. Specialized bark removal techniques allow for sustainable latex 
              harvesting without killing the tree.
            </p>
          </div>
          
          {/* Seeds Section */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <h3 style={styles.sectionTitle}>Seeds</h3>
              <div style={styles.icon}>🌰</div>
            </div>
            <p style={styles.sectionText}>
              Rubber seeds contain oil that can be extracted for soap making, lubricants, 
              and as a potential biofuel source. The seed cake remaining after oil extraction 
              can be used as animal feed or organic fertilizer, making every part of the seed valuable.
            </p>
          </div>
          
          {/* Roots Section */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <h3 style={styles.sectionTitle}>Roots</h3>
              <div style={styles.icon}>🌱</div>
            </div>
            <p style={styles.sectionText}>
              The extensive root system prevents soil erosion and improves soil structure. 
              Traditional medicine uses root extracts for various treatments, while modern 
              research explores their potential for pharmaceutical applications and 
              ecological restoration projects.
            </p>
          </div>
          
          {/* Wood Processing Section */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <h3 style={styles.sectionTitle}>Wood Processing</h3>
              <div style={styles.icon}>🪚</div>
            </div>
            <p style={styles.sectionText}>
              Rubberwood is an environmentally friendly timber source since it comes from 
              trees that have completed their latex-producing cycle. It's used for children's 
              toys, kitchen utensils, cutting boards, picture frames, and various wooden 
              crafts due to its light color and fine texture.
            </p>
          </div>
          
          {/* Latex Processing Section */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <h3 style={styles.sectionTitle}>Latex Processing</h3>
              <div style={styles.icon}>🔄</div>
            </div>
            <p style={styles.sectionText}>
              Fresh latex can be processed into different forms: centrifuged latex for dipped 
              products like gloves, crepe rubber for footwear soles, block rubber for tire 
              manufacturing, and skim rubber for adhesives. Each processing method creates 
              materials with unique properties for specific industrial needs.
            </p>
          </div>
          
          {/* Environmental Benefits Section */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <h3 style={styles.sectionTitle}>Environmental Benefits</h3>
              <div style={styles.icon}>🌍</div>
            </div>
            <p style={styles.sectionText}>
              Rubber plantations act as carbon sinks, absorbing CO₂ from the atmosphere. 
              They provide habitat for biodiversity, prevent soil erosion, and offer a 
              sustainable alternative to synthetic rubber derived from petroleum products. 
              Rubber trees also contribute to watershed protection and microclimate regulation.
            </p>
          </div>
        </div>
        
        <div style={styles.conclusion}>
          <p style={styles.conclusionText}>
            From the tires on our vehicles to the gloves in hospitals, from furniture in 
            our homes to elastic in our clothing, the rubber tree touches nearly every aspect 
            of modern life. Its sustainable cultivation and multiple-use potential make it 
            a truly remarkable "Tree of Industry" that continues to drive economic growth 
            while supporting environmental sustainability.
          </p>
        </div>
      </div>
      <UserFooter />
    </>
  );
};

// CSS Styles
const styles = {
  container: {
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    backgroundColor: '#f8f9fa',
    color: '#333',
    minHeight: 'calc(100vh - 128px)', // Adjusted for header and footer
  },
  header: {
    textAlign: 'center',
    marginBottom: '40px',
    padding: '30px 20px',
    backgroundColor: '#2E7D32',
    borderRadius: '10px',
    color: 'white',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
  },
  mainTitle: {
    fontSize: '3.5rem',
    margin: '0 0 10px 0',
    fontWeight: '800',
    letterSpacing: '2px',
    textTransform: 'uppercase',
  },
  subTitle: {
    fontSize: '1.8rem',
    margin: '0',
    fontWeight: '300',
    fontStyle: 'italic',
    opacity: '0.9',
  },
  introSection: {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '10px',
    marginBottom: '40px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    borderLeft: '5px solid #4CAF50',
  },
  introText: {
    fontSize: '1.2rem',
    lineHeight: '1.8',
    margin: '0',
    textAlign: 'center',
    color: '#444',
  },
  sectionsContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
    gap: '30px',
    marginBottom: '40px',
  },
  section: {
    backgroundColor: 'white',
    padding: '25px',
    borderRadius: '10px',
    boxShadow: '0 3px 10px rgba(0,0,0,0.08)',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    borderTop: '4px solid #4CAF50',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '15px',
    borderBottom: '2px solid #f0f0f0',
    paddingBottom: '10px',
  },
  sectionTitle: {
    fontSize: '1.8rem',
    margin: '0',
    color: '#2E7D32',
    flexGrow: 1,
  },
  icon: {
    fontSize: '2rem',
    marginLeft: '15px',
  },
  sectionText: {
    fontSize: '1.1rem',
    lineHeight: '1.7',
    margin: '0',
    color: '#555',
  },
  conclusion: {
    backgroundColor: '#E8F5E9',
    padding: '30px',
    borderRadius: '10px',
    marginTop: '20px',
    border: '2px solid #C8E6C9',
  },
  conclusionText: {
    fontSize: '1.2rem',
    lineHeight: '1.8',
    margin: '0',
    textAlign: 'center',
    fontStyle: 'italic',
    color: '#2E7D32',
  },
};

// Add hover effect for sections
styles.section[':hover'] = {
  transform: 'translateY(-5px)',
  boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
};

export default AboutRubber;