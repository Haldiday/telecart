import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export default function HeroSection() {
  const [mainTextPart1, setMainTextPart1] = useState('');
  const [mainTextPart2, setMainTextPart2] = useState('');
  const [words, setWords] = useState<string[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const videoRef = (element: HTMLVideoElement | null) => {
    if (element) {
      element.play().catch(() => {
        // Autoplay might fail silently on some devices/browsers
      });
    }
  };

  useEffect(() => {
    let mounted = true;
    
    supabase
      .from('hero_settings')
      .select('*')
      .limit(1)
      .single()
      .then(({ data }) => {
        if (data && mounted) {
          const heroData = data as any;
          const mainText = heroData.main_text || '';
          let part1 = '';
          let part2 = '';
          if (mainText.includes('|||')) {
            const split = mainText.split('|||');
            part1 = split[0] || '';
            part2 = split[1] || '';
          } else {
            part1 = mainText;
          }
          setMainTextPart1(part1);
          setMainTextPart2(part2);
          setWords(heroData.animated_words);
        }
      });
    
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (words.length <= 1) return;

    // Stay visible for 2.5 seconds
    const stayTimeout = setTimeout(() => {
      setIsTransitioning(true);
      // After transitioning, switch to next word
      const transitionTimeout = setTimeout(() => {
        setCurrentWordIndex((prev) => (prev + 1) % words.length);
        setIsTransitioning(false);
      }, 500);
      return () => clearTimeout(transitionTimeout);
    }, 2500);

    return () => clearTimeout(stayTimeout);
  }, [currentWordIndex, words]);

  return (
    <section
      id="hero"
      className="relative py-20 md:py-32 overflow-hidden"
    >
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        className="absolute left-0 right-0 w-full object-cover opacity-50 -z-10"
        style={{
          top: '28px',
          height: 'calc(100% + 28px)',
        }}
      >
        <source src="/videos/header-video.mp4" type="video/mp4" />
      </video>
      <div className="container mx-auto px-4 md:px-8 lg:px-12 text-center">

        {/* HEADING */}
        <h1
          className="mb-4 text-[#1c1c1c] text-[30px] sm:text-[34px] md:text-[44px] leading-[1.3]"
          style={{
            fontFamily: 'Trustpilot Display, Inter, sans-serif',
            fontWeight: 800,
            wordWrap: 'break-word',
            overflowWrap: 'break-word',
            hyphens: 'auto',
          }}
        >
          {mainTextPart1}
          {mainTextPart1 && mainTextPart2 && ' '}
          <span style={{ color: '#1d4ed8' }}>{mainTextPart2}</span>
        </h1>


        {/* ANIMATED TEXT */}
        <div
          className="min-h-[50px] flex items-center justify-center relative"
          style={{
            fontFamily: 'Trustpilot Display, Arial, sans-serif',
            fontSize: '24px',
            fontWeight: 60,
            lineHeight: '1.4',
          }}
        >
          {words.length > 1 ? (
            <>
              {/* Current Word - Slides Out Down */}
              <div 
                key={`current-${currentWordIndex}`}
                className="absolute text-[#121511] transition-all duration-500 ease-in-out text-center"
                style={{
                  transform: isTransitioning ? 'translateY(150%)' : 'translateY(0)',
                  opacity: isTransitioning ? 0 : 1,
                  width: '100%',
                  wordWrap: 'break-word',
                }}
              >
                {words[currentWordIndex]}
              </div>
              {/* Next Word - Slides In From Top */}
              <div 
                key={`next-${currentWordIndex}`}
                className="absolute text-[#121511] transition-all duration-500 ease-in-out text-center"
                style={{
                  transform: isTransitioning ? 'translateY(0)' : 'translateY(-150%)',
                  opacity: isTransitioning ? 1 : 0,
                  width: '100%',
                  wordWrap: 'break-word',
                }}
              >
                {words[(currentWordIndex + 1) % words.length]}
              </div>
            </>
          ) : (
            <div className="text-[#121511] text-center w-full" style={{ wordWrap: 'break-word' }}>
              {words[0]}
            </div>
          )}
        </div>

      </div>
    </section>
  );
}
