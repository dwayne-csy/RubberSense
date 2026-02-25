import React, { useState, useEffect, useRef } from 'react';
import UserHeader from '../layouts/UserHeader.jsx';
import UserFooter from '../layouts/UserFooter.jsx';

// Image imports
import barkImg from '../aboutrubber/bark.jpg';
import latexImg from '../aboutrubber/latex.jpg';
import leafsImg from '../aboutrubber/leafs.jpg';
import rootsImg from '../aboutrubber/roots.jpg';
import trunksImg from '../aboutrubber/trunks.jpg';
import seedsImg from '../aboutrubber/seeds.jpg';

const rubberParts = [
  {
    image: leafsImg,
    title: 'Leaves',
    subtitle: 'The Canopy of Life',
    color: '#2E7D32',
    accent: '#81C784',
    description:
      'Rubber tree leaves are large, trifoliate, and dark green in color. They play a critical role in photosynthesis and are sensitive indicators of the tree\'s overall health and nutritional status. Young leaves emerge in a reddish-bronze hue before maturing to deep green. Beyond photosynthesis, the leaves are used in traditional medicine across Southeast Asia and South America to treat skin ailments, inflammation, and fever. Fallen leaves decompose into rich organic matter, naturally replenishing soil nutrients.',
  },
  {
    image: latexImg,
    title: 'Latex',
    subtitle: 'Liquid Gold of Industry',
    color: '#795548',
    accent: '#BCAAA4',
    description:
      'Latex is the milky white sap produced in specialized vessels beneath the bark and is the tree\'s most commercially significant product. A single mature tree can yield latex for 25 to 30 years through sustainable tapping. The collected latex is processed into natural rubber through coagulation, drying, and vulcanization. Applications span tires, surgical gloves, medical tubing, foam mattresses, elastic bands, adhesives, and footwear. Natural rubber remains superior to synthetic alternatives in flexibility and heat resistance.',
  },
  {
    image: trunksImg,
    title: 'Trunk',
    subtitle: 'The Pillar of the Plantation',
    color: '#4E342E',
    accent: '#A1887F',
    description:
      'The trunk is straight, cylindrical, and typically grows 20 to 30 meters tall in its natural rainforest habitat. After the latex-producing cycle ends — usually after 25 to 30 years — the trunk is harvested for rubberwood timber. Rubberwood is a medium-density hardwood with an attractive grain, light cream to pale yellow color, and excellent machinability. It is widely used in furniture manufacturing, cabinetry, flooring, musical instruments, and wooden toys.',
  },
  {
    image: barkImg,
    title: 'Bark',
    subtitle: 'The Tapper\'s Canvas',
    color: '#5D4037',
    accent: '#BCAAA4',
    description:
      'The bark is a complex, multi-layered structure housing the latex-producing laticiferous vessels just beneath its outer surface. Skilled tappers make precise, angled incisions through the bark to release latex without damaging the cambium layer, allowing the tree to regenerate and continue production. The tapping panel is rotated around the trunk in cycles to allow recovery. Bark residues can be processed into organic mulch, soil conditioners, or biomass fuel.',
  },
  {
    image: seedsImg,
    title: 'Seeds',
    subtitle: 'Seeds of a Global Industry',
    color: '#E65100',
    accent: '#FFCC02',
    description:
      'Rubber tree seeds are large, mottled brown, and contain 40 to 50% oil by weight. This rubber seed oil is used in soap production, lubricants, paints, varnishes, and as a feedstock for biodiesel. The remaining seed cake after oil extraction is protein-rich and serves as animal feed or organic fertilizer. Genetic improvement programs use selective breeding of seeds to develop high-yielding, disease-resistant rubber tree clones.',
  },
  {
    image: rootsImg,
    title: 'Roots',
    subtitle: 'The Unseen Foundation',
    color: '#1B5E20',
    accent: '#A5D6A7',
    description:
      'The rubber tree develops an extensive and deep root system that anchors it firmly and plays a vital ecological role. The taproot can penetrate several meters deep, while lateral roots spread widely to absorb water and nutrients efficiently. This root architecture significantly reduces soil erosion on sloped terrain and improves overall soil structure. Root exudates nourish beneficial soil microorganisms that enhance nutrient cycling and plantation health.',
  },
];

const funFacts = [
  { label: 'Native Origin', value: 'Amazon Basin, Brazil', icon: '🌍' },
  { label: 'Scientific Name', value: 'Hevea brasiliensis', icon: '🔬' },
  { label: 'Productive Lifespan', value: '25–30 Years', icon: '⏳' },
  { label: 'Top Producers', value: 'Thailand, Indonesia, Vietnam', icon: '🏆' },
  { label: 'Annual Global Output', value: '14M+ Metric Tons', icon: '📦' },
  { label: 'Tree Height', value: 'Up to 30 Meters', icon: '🌳' },
];

const AboutRubber = () => {
  const [openCards, setOpenCards] = useState(new Set());

  const toggleCard = (index) => {
    setOpenCards(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };
  const [scrollY, setScrollY] = useState(0);
  const [visibleSections, setVisibleSections] = useState(new Set());
  const sectionRefs = useRef([]);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const observers = [];
    sectionRefs.current.forEach((ref, i) => {
      if (!ref) return;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setVisibleSections(prev => new Set([...prev, i]));
          }
        },
        { threshold: 0.15 }
      );
      observer.observe(ref);
      observers.push(observer);
    });
    return () => observers.forEach(o => o.disconnect());
  }, []);

  const addRef = (el, i) => { sectionRefs.current[i] = el; };

  // Attractive Green Line Divider matching Home.jsx style
  const GreenSectionDivider = () => (
    <div style={{
      maxWidth: '1280px',
      margin: '0 auto',
      padding: '0 40px'
    }}>
      {/* Main gradient line */}
      <div style={{
        position: 'relative',
        height: '2px',
        background: 'linear-gradient(90deg, transparent 0%, #4ab54a 20%, #2d6a4f 50%, #4ab54a 80%, transparent 100%)',
        marginBottom: '20px'
      }} />
      
      {/* Decorative leaf icon in the center */}
      <div style={{
        position: 'relative',
        display: 'flex',
        justifyContent: 'center',
        marginTop: '-22px',
        marginBottom: '30px'
      }}>
        <div style={{
          background: '#FFFFFF',
          padding: '0 20px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span style={{ fontSize: '1.5rem', color: '#2d6a4f', animation: 'pulse 2s ease-in-out infinite' }}></span>
          <span style={{ fontSize: '1rem', color: '#4a6455', fontWeight: '300', letterSpacing: '2px' }}></span>
          <span style={{ fontSize: '1.5rem', color: '#2d6a4f', animation: 'pulse 2s ease-in-out infinite' }}></span>
        </div>
      </div>

      {/* Double line effect for extra visual appeal */}
      <div style={{
        height: '1px',
        background: 'linear-gradient(90deg, transparent, rgba(74,181,74,0.3), rgba(45,106,79,0.5), rgba(74,181,74,0.3), transparent)',
        marginTop: '-10px',
        marginBottom: '40px'
      }} />
    </div>
  );

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />

      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', zIndex: 2000 }}>
        <UserHeader />
      </div>

      <div style={{ minHeight: '100vh', background: '#FFFFFF', fontFamily: "'DM Sans', sans-serif" }}>

        {/* ═══════════════════════════════════════
            FULL-BLEED VIDEO HERO
        ═══════════════════════════════════════ */}
        <div style={{ position: 'relative', height: '100vh', width: '100%', overflow: 'hidden' }}>
          <video
            autoPlay muted loop playsInline
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%',
              objectFit: 'cover',
              transform: `scale(1.05) translateY(${scrollY * 0.2}px)`,
              transition: 'transform 0.1s linear'
            }}
          >
            <source src="/src/Components/slidingpics/slide4.mp4" type="video/mp4" />
          </video>

          {/* Deep multi-layer overlay - adjusted for white background */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.3) 40%, rgba(0,0,0,0.85) 100%)' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 30% 60%, rgba(0,0,0,0.2) 0%, transparent 60%)' }} />

          {/* Hero text — bottom-left aligned, magazine editorial style */}
          <div style={{
            position: 'absolute',
            bottom: '80px',
            left: '0',
            padding: '0 80px',
            zIndex: 2,
            maxWidth: '780px',
            animation: 'heroReveal 1.2s cubic-bezier(0.16,1,0.3,1) both'
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px'
            }}>
              <div style={{ width: '60px', height: '1px', background: '#FFFFFF' }}></div>
              <span style={{ color: '#FFFFFF', fontSize: '0.75rem', fontWeight: '600', letterSpacing: '4px', textTransform: 'uppercase' }}>
                The Tree of Industry
              </span>
            </div>

            <h1 style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: 'clamp(3.5rem, 8vw, 7rem)',
              fontWeight: '700',
              color: '#ffffff',
              lineHeight: '0.95',
              margin: '0 0 28px 0',
              letterSpacing: '-1px'
            }}>
              About the<br />
              <span style={{ color: '#FFFFFF', fontStyle: 'italic' }}>Rubber Tree</span>
            </h1>

            <p style={{
              color: 'rgba(255,255,255,0.8)',
              fontSize: '1.15rem',
              lineHeight: '1.75',
              fontWeight: '300',
              maxWidth: '560px',
              margin: 0
            }}>
              From the Amazon Basin to global industry — one tree that changed the world.
              Explore its anatomy, history, and vital role in modern civilization.
            </p>
          </div>

          {/* Scroll indicator */}
          <div style={{
            position: 'absolute', bottom: '32px', right: '80px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
            color: 'rgba(255,255,255,0.5)', zIndex: 2
          }}>
            <span style={{ fontSize: '0.65rem', letterSpacing: '4px', textTransform: 'uppercase', writingMode: 'vertical-rl' }}>Scroll to explore</span>
            <div style={{ width: '1px', height: '60px', background: 'linear-gradient(to bottom, rgba(255,255,255,0.8), transparent)', animation: 'scrollPulse 2s ease-in-out infinite' }}></div>
          </div>
        </div>

        {/* ═══════════════════════════════════════
            INTRODUCTION — FULL BLEED, WHITE
        ═══════════════════════════════════════ */}
        <div
          ref={el => addRef(el, 0)}
          style={{
            background: '#FFFFFF',
            padding: '120px 80px 80px 80px',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '100px',
            alignItems: 'center',
            opacity: visibleSections.has(0) ? 1 : 0,
            transform: visibleSections.has(0) ? 'translateY(0)' : 'translateY(40px)',
            transition: 'all 0.9s cubic-bezier(0.16,1,0.3,1)'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '28px' }}>
              <div style={{ width: '40px', height: '1px', background: '#000000' }}></div>
              <span style={{ color: '#000000', fontSize: '0.72rem', fontWeight: '600', letterSpacing: '3px', textTransform: 'uppercase' }}>Origins & Significance</span>
            </div>
            <h2 style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 'clamp(2.4rem, 4vw, 3.8rem)',
              fontWeight: '600',
              color: '#000000',
              lineHeight: '1.1',
              marginBottom: '32px'
            }}>
              What is a<br /><em style={{ color: '#555555' }}>Rubber Tree?</em>
            </h2>
          </div>

          <div>
            <p style={{
              color: '#333333',
              fontSize: '1.05rem',
              lineHeight: '2',
              fontWeight: '300',
              margin: '0 0 24px 0'
            }}>
              The rubber tree (<em style={{ color: '#555555' }}>Hevea brasiliensis</em>), often called the <strong style={{ color: '#000000', fontWeight: '500' }}>"Tree of Industry"</strong>, is one of the world's most economically significant tropical trees. Originally native to the Amazon Basin in Brazil, it was introduced to Southeast Asia in the late 19th century.
            </p>
            <p style={{
              color: '#333333',
              fontSize: '1.05rem',
              lineHeight: '2',
              fontWeight: '300',
              margin: 0
            }}>
              Today it forms the backbone of a multi-billion-dollar global industry, supporting the livelihoods of over <strong style={{ color: '#000000', fontWeight: '500' }}>30 million smallholder farmers</strong> worldwide. Every part of this remarkable tree contributes to various industries — from transportation and healthcare to construction and daily life.
            </p>
          </div>
        </div>
        <GreenSectionDivider />

        {/* ═══════════════════════════════════════
            QUICK FACTS — FULL BLEED WHITE
        ═══════════════════════════════════════ */}
        <div
          ref={el => addRef(el, 1)}
          style={{
            background: '#FFFFFF',
            padding: '100px 80px 60px 80px',
            opacity: visibleSections.has(1) ? 1 : 0,
            transform: visibleSections.has(1) ? 'translateY(0)' : 'translateY(40px)',
            transition: 'all 0.9s cubic-bezier(0.16,1,0.3,1)'
          }}
        >
          <div style={{ marginBottom: '60px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
              <div style={{ width: '40px', height: '1px', background: '#000000' }}></div>
              <span style={{ color: '#000000', fontSize: '0.72rem', fontWeight: '600', letterSpacing: '3px', textTransform: 'uppercase' }}>At a Glance</span>
            </div>
            <h2 style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 'clamp(2.2rem, 3.5vw, 3.2rem)',
              fontWeight: '600',
              color: '#000000',
              margin: 0,
              lineHeight: '1.15'
            }}>
              Quick Facts
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2px', background: '#EEEEEE' }}>
            {funFacts.map((fact, i) => (
              <div
                key={i}
                style={{
                  background: '#FFFFFF',
                  padding: '40px 36px',
                  borderTop: '1px solid #EEEEEE',
                  borderRight: i % 3 !== 2 ? '1px solid #EEEEEE' : 'none',
                  transition: 'background 0.3s ease',
                  cursor: 'default',
                  animation: `factReveal 0.6s ${i * 0.1}s both`
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#F5F5F5'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#FFFFFF'; }}
              >
                <div style={{ fontSize: '2rem', marginBottom: '16px' }}>{fact.icon}</div>
                <div style={{ color: '#999999', fontSize: '0.7rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '10px' }}>{fact.label}</div>
                <div style={{ color: '#000000', fontSize: '1.2rem', fontWeight: '500', lineHeight: '1.3' }}>{fact.value}</div>
              </div>
            ))}
          </div>
        </div>
        <GreenSectionDivider />

        {/* ═══════════════════════════════════════
            PARTS OF THE RUBBER TREE
        ═══════════════════════════════════════ */}
        <div
          ref={el => addRef(el, 2)}
          style={{
            background: '#FFFFFF',
            padding: '120px 80px 80px 80px',
            opacity: visibleSections.has(2) ? 1 : 0,
            transform: visibleSections.has(2) ? 'translateY(0)' : 'translateY(40px)',
            transition: 'all 0.9s cubic-bezier(0.16,1,0.3,1)'
          }}
        >
          <div style={{ marginBottom: '80px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
              <div style={{ width: '40px', height: '2px', background: '#000000' }}></div>
              <span style={{ color: '#000000', fontSize: '0.72rem', fontWeight: '600', letterSpacing: '3px', textTransform: 'uppercase' }}>Anatomy</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '20px' }}>
              <h2 style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: 'clamp(2.4rem, 4vw, 3.8rem)',
                fontWeight: '700',
                color: '#000000',
                margin: 0,
                lineHeight: '1.1'
              }}>
                Parts of the<br /><em style={{ color: '#555555' }}>Rubber Tree</em>
              </h2>
              <p style={{ color: '#666666', fontSize: '1rem', fontWeight: '300', maxWidth: '360px', margin: 0, lineHeight: '1.7' }}>
                Click on any part below to reveal detailed information about its structure and uses.
              </p>
            </div>
          </div>

          {/* Card grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
            {rubberParts.map((part, index) => {
              const isOpen = openCards.has(index);
              return (
                <div
                  key={index}
                  onClick={() => toggleCard(index)}
                  style={{
                    background: '#FFFFFF',
                    borderRadius: '0',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    transition: 'all 0.35s cubic-bezier(0.16,1,0.3,1)',
                    boxShadow: isOpen
                      ? `0 24px 60px rgba(0,0,0,0.15), 0 0 0 2px ${part.color}`
                      : '0 4px 20px rgba(0,0,0,0.07)',
                    transform: isOpen ? 'translateY(-8px) scale(1.01)' : 'translateY(0) scale(1)',
                    animation: `cardReveal 0.5s ${index * 0.08}s both`,
                    border: '1px solid #EEEEEE'
                  }}
                  onMouseEnter={(e) => {
                    if (!isOpen) {
                      e.currentTarget.style.transform = 'translateY(-6px)';
                      e.currentTarget.style.boxShadow = `0 16px 40px rgba(0,0,0,0.12), 0 0 0 1px ${part.color}60`;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isOpen) {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.07)';
                    }
                  }}
                >
                  {/* Image */}
                  <div style={{ width: '100%', height: isOpen ? '200px' : '180px', overflow: 'hidden', position: 'relative', transition: 'height 0.4s ease' }}>
                    <img
                      src={part.image}
                      alt={part.title}
                      style={{
                        width: '100%', height: '100%',
                        objectFit: 'cover',
                        transition: 'transform 0.6s ease',
                        transform: isOpen ? 'scale(1.08)' : 'scale(1)',
                        display: 'block'
                      }}
                    />
                    {/* Color overlay on hover/open */}
                    <div style={{
                      position: 'absolute', inset: 0,
                      background: `linear-gradient(to top, ${part.color}CC 0%, transparent 50%)`,
                      opacity: isOpen ? 1 : 0,
                      transition: 'opacity 0.4s ease'
                    }} />
                    {/* Part number */}
                    <div style={{
                      position: 'absolute', top: '14px', left: '14px',
                      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
                      color: 'white', width: '32px', height: '32px',
                      borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.75rem', fontWeight: '700'
                    }}>
                      {String(index + 1).padStart(2, '0')}
                    </div>
                  </div>

                  {/* Card content */}
                  <div style={{ padding: '24px 24px 28px' }}>
                    <div style={{ marginBottom: '6px' }}>
                      <span style={{ color: '#999999', fontSize: '0.7rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '2px' }}>{part.subtitle}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isOpen ? '20px' : '0' }}>
                      <h3 style={{
                        fontFamily: "'Cormorant Garamond', serif",
                        color: '#000000',
                        fontWeight: '700',
                        fontSize: '1.6rem',
                        margin: 0,
                        lineHeight: '1'
                      }}>{part.title}</h3>
                      <div style={{
                        width: '32px', height: '32px', borderRadius: '50%',
                        border: `1.5px solid ${part.color}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: part.color, fontSize: '1rem', fontWeight: '300',
                        flexShrink: 0,
                        transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
                        transition: 'transform 0.3s ease'
                      }}>
                        +
                      </div>
                    </div>

                    {/* Expanded description */}
                    {isOpen && (
                      <div style={{ animation: 'expandIn 0.35s cubic-bezier(0.16,1,0.3,1) both' }}>
                        <div style={{ width: '40px', height: '2px', background: part.color, marginBottom: '16px' }}></div>
                        <p style={{
                          color: '#4a4a4a',
                          fontSize: '0.88rem',
                          lineHeight: '1.85',
                          margin: 0,
                          fontWeight: '300'
                        }}>
                          {part.description}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <GreenSectionDivider />

        {/* ═══════════════════════════════════════
            ENVIRONMENTAL ROLE — FULL BLEED WHITE
        ═══════════════════════════════════════ */}
        <div
          ref={el => addRef(el, 3)}
          style={{
            background: '#FFFFFF',
            padding: '0',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            minHeight: '600px',
            opacity: visibleSections.has(3) ? 1 : 0,
            transform: visibleSections.has(3) ? 'translateY(0)' : 'translateY(40px)',
            transition: 'all 0.9s cubic-bezier(0.16,1,0.3,1)'
          }}
        >
          {/* Left: Image */}
          <div style={{ position: 'relative', overflow: 'hidden', minHeight: '500px' }}>
            <img
              src={leafsImg}
              alt="Leaves"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', position: 'absolute', inset: 0 }}
            />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, transparent 60%, #FFFFFF 100%)' }} />
            {/* Big stat overlay */}
            <div style={{ position: 'absolute', bottom: '48px', left: '48px' }}>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '5rem', fontWeight: '700', color: '#000000', lineHeight: '1', textShadow: '0 4px 24px rgba(255,255,255,0.8)' }}>72kg</div>
              <div style={{ color: '#333333', fontSize: '0.9rem', fontWeight: '400', letterSpacing: '1px', marginTop: '6px' }}>CO₂ absorbed per tree / year</div>
            </div>
          </div>

          {/* Right: Text */}
          <div style={{ padding: '80px 80px 80px 60px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '28px' }}>
              <div style={{ width: '40px', height: '1px', background: '#000000' }}></div>
              <span style={{ color: '#000000', fontSize: '0.72rem', fontWeight: '600', letterSpacing: '3px', textTransform: 'uppercase' }}>Ecology</span>
            </div>
            <h2 style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 'clamp(2rem, 3.5vw, 3rem)',
              fontWeight: '600',
              color: '#000000',
              lineHeight: '1.15',
              marginBottom: '28px'
            }}>
              Environmental<br /><em style={{ color: '#555555' }}>Role</em>
            </h2>
            <p style={{ color: '#333333', fontSize: '1rem', lineHeight: '2', fontWeight: '300', margin: '0 0 20px 0' }}>
              Rubber plantations act as significant carbon sinks, with a mature rubber tree absorbing roughly <strong style={{ color: '#000000', fontWeight: '500' }}>72 kg of CO₂ per year</strong>. Large-scale plantations across Southeast Asia collectively sequester millions of tons of carbon annually.
            </p>
            <p style={{ color: '#333333', fontSize: '1rem', lineHeight: '2', fontWeight: '300', margin: 0 }}>
              Well-managed plantations support biodiversity, providing habitat for birds, insects, small mammals, and ground-dwelling plants. The deep root systems stabilize soil, reduce erosion on slopes, and improve water infiltration. Natural rubber itself is a <strong style={{ color: '#000000', fontWeight: '500' }}>renewable, biodegradable alternative</strong> to petroleum-derived synthetic rubber.
            </p>
          </div>
        </div>
        <GreenSectionDivider />

        {/* ═══════════════════════════════════════
            WHY IT MATTERS — FULL BLEED WHITE
        ═══════════════════════════════════════ */}
        <div
          ref={el => addRef(el, 4)}
          style={{
            background: '#FFFFFF',
            padding: '120px 80px 80px 80px',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '100px',
            alignItems: 'center',
            opacity: visibleSections.has(4) ? 1 : 0,
            transform: visibleSections.has(4) ? 'translateY(0)' : 'translateY(40px)',
            transition: 'all 0.9s cubic-bezier(0.16,1,0.3,1)'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '28px' }}>
              <div style={{ width: '40px', height: '2px', background: '#000000' }}></div>
              <span style={{ color: '#000000', fontSize: '0.72rem', fontWeight: '600', letterSpacing: '3px', textTransform: 'uppercase' }}>Impact</span>
            </div>
            <h2 style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 'clamp(2.4rem, 4vw, 3.8rem)',
              fontWeight: '700',
              color: '#000000',
              lineHeight: '1.1',
              margin: 0
            }}>
              Why It<br /><em style={{ color: '#555555' }}>Matters</em>
            </h2>
          </div>

          <div>
            <p style={{ color: '#333333', fontSize: '1.05rem', lineHeight: '2', fontWeight: '300', margin: '0 0 24px 0' }}>
              From the tires on our vehicles to the gloves in hospitals, from furniture in our homes to elastic in our clothing — the rubber tree touches nearly every aspect of modern life.
            </p>
            <p style={{ color: '#333333', fontSize: '1.05rem', lineHeight: '2', fontWeight: '300', margin: '0 0 40px 0' }}>
              Cultivated across millions of hectares in Asia, Africa, and Latin America, it supports the livelihoods of <strong style={{ color: '#000000', fontWeight: '600' }}>over 30 million smallholder farmers</strong> worldwide.
            </p>

            {/* Impact chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {['Transportation', 'Healthcare', 'Manufacturing', 'Construction', 'Agriculture', 'Clean Energy'].map((tag, i) => (
                <span key={i} style={{
                  background: '#F5F5F5',
                  color: '#000000',
                  padding: '8px 18px',
                  borderRadius: '100px',
                  fontSize: '0.82rem',
                  fontWeight: '500',
                  border: '1px solid #EEEEEE',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                  transition: 'all 0.2s ease',
                  cursor: 'default'
                }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#000000'; e.currentTarget.style.color = '#FFFFFF'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#F5F5F5'; e.currentTarget.style.color = '#000000'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
        <GreenSectionDivider />

      </div>

      <UserFooter />

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { padding-top: 64px; background: #FFFFFF; }

        @keyframes heroReveal {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes expandIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes cardReveal {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes factReveal {
          from { opacity: 0; transform: translateX(-16px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes scrollPulse {
          0%, 100% { opacity: 0.3; transform: scaleY(0.8); }
          50% { opacity: 1; transform: scaleY(1); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.9); }
        }

        @media (max-width: 1024px) {
          [style*="gridTemplateColumns: '1fr 1fr'"] {
            grid-template-columns: 1fr !important;
          }
          [style*="padding: '120px 80px'"] {
            padding: 80px 32px !important;
          }
          [style*="padding: '100px 80px'"] {
            padding: 70px 32px !important;
          }
          [style*="gridTemplateColumns: 'repeat(3, 1fr)'"] {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 640px) {
          [style*="gridTemplateColumns: 'repeat(2, 1fr)'"],
          [style*="gridTemplateColumns: 'repeat(3, 1fr)'"] {
            grid-template-columns: 1fr !important;
          }
          [style*="padding: '80px 80px'"] {
            padding: 60px 24px !important;
          }
          h1 { font-size: 3rem !important; }
        }
      `}</style>
    </>
  );
};

export default AboutRubber;