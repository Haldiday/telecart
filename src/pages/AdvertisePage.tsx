
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

interface AdvertiseSettings {
  id?: string;
  hero_small_heading: string;
  hero_main_heading: string;
  hero_description: string;
  hero_button_text?: string | null;
  hero_button_link?: string | null;
  hero_image_url?: string | null;
  hero_image_visible: boolean;
  hero_visible: boolean;
  marketing_cards_main_heading: string;
  marketing_cards_subheading: string;
  section3_small_heading: string;
  section3_main_heading: string;
  section3_description: string;
  section3_image_url?: string | null;
  section3_background_color?: string | null;
  section3_visible: boolean;
  section4_small_heading: string;
  section4_main_heading: string;
  section4_description: string;
  section4_button_text?: string | null;
  section4_button_link?: string | null;
  section4_image_url?: string | null;
  section4_visible: boolean;
  dynamic_sections_heading_part1: string;
  dynamic_sections_heading_part2: string;
}

interface AdvertiseCard {
  id: string;
  logo_url?: string | null;
  heading: string;
  description: string;
  sort_order: number;
  is_visible: boolean;
}

interface AdvertiseSection {
  id: string;
  small_heading: string;
  main_heading: string;
  description: string;
  button_text?: string | null;
  button_link?: string | null;
  image_url?: string | null;
  sort_order: number;
  is_visible: boolean;
}

const AdvertisePage = () => {
  const [settings, setSettings] = useState<AdvertiseSettings | null>(null);
  const [cards, setCards] = useState<AdvertiseCard[]>([]);
  const [sections, setSections] = useState<AdvertiseSection[]>([]);

  useEffect(() => {
    const loadData = async () => {
      console.log('AdvertisePage: Loading data...');
      
      // Load settings
      const settingsResult = await supabase.from('advertise_page_settings').select('*').limit(1).maybeSingle();
      console.log('advertise_page_settings result:', settingsResult);
      if (settingsResult.data) {
        setSettings(settingsResult.data);
        console.log('Set settings:', settingsResult.data);
      } else {
        console.log('No settings data found');
      }

      // Load cards
      const cardsResult = await supabase.from('advertise_cards').select('*').order('sort_order');
      console.log('advertise_cards result:', cardsResult);
      if (cardsResult.data) setCards(cardsResult.data);

      // Load sections
      const sectionsResult = await supabase.from('advertise_sections').select('*').order('sort_order');
      console.log('advertise_sections result:', sectionsResult);
      if (sectionsResult.data) setSections(sectionsResult.data);
    };
    loadData();

    // Subscribe to changes
    const settingsChannel = supabase
      .channel('advertise_settings_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'advertise_page_settings' },
        () => {
          loadData();
        }
      )
      .subscribe();

    const cardsChannel = supabase
      .channel('advertise_cards_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'advertise_cards' },
        () => {
          loadData();
        }
      )
      .subscribe();

    const sectionsChannel = supabase
      .channel('advertise_sections_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'advertise_sections' },
        () => {
          loadData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(settingsChannel);
      supabase.removeChannel(cardsChannel);
      supabase.removeChannel(sectionsChannel);
    };
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      {settings?.hero_visible && (
        <section className="py-[128px] px-4 md:px-8 bg-gradient-to-br from-gray-50 to-white">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="space-y-1">
                {settings.hero_small_heading && (
                  <p className="font-['Roboto',system-ui] text-[36px] font-normal leading-[39.6px] text-[#24272C]">
                    {settings.hero_small_heading}
                  </p>
                )}
                <h1 className="text-[32px] md:text-[44px] font-medium text-[#24272C] leading-tight">
                  {settings.hero_main_heading}
                </h1>
                <p className="text-[16px] font-normal text-[#777777] text-justify leading-relaxed">
                  {settings.hero_description}
                </p>
                {settings.hero_button_text && settings.hero_button_link && (
                  <Button className="bg-[#1d4ed8] hover:bg-[#1540b5] text-white text-lg px-8 py-6">
                    <a href={settings.hero_button_link}>{settings.hero_button_text}</a>
                  </Button>
                )}
              </div>
              {settings.hero_image_visible && settings.hero_image_url && (
                <div className="relative">
                  <img
                    src={settings.hero_image_url}
                    alt="Hero"
                    className="w-full"
                  />
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Marketing Strategy Cards */}
      {settings && cards.filter(card => card.is_visible).length > 0 && (
        <section className="py-16 px-4 md:px-8 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="font-['Roboto',system-ui] text-[30px] font-medium leading-[33px] text-[#24272C] mb-2">
                {settings.marketing_cards_main_heading}
              </h2>
              <p className="font-['Roboto',system-ui] text-[14px] font-medium leading-[25.2px] text-[#24272C]">{settings.marketing_cards_subheading}</p>
              <div className="w-16 h-1 bg-[#1d4ed8] mx-auto mt-4 rounded-full"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {cards
                .filter(card => card.is_visible)
                .map(card => (
                  <div
                    key={card.id}
                    className="bg-white p-[30px] rounded-[15px] border border-[#ccc] shadow-[0_1px_4px_rgba(0,0,0,0.16)] transition-all duration-300 hover:shadow-[0_2px_8px_rgba(0,0,0,0.18)] "
                  >
                    {card.logo_url && (
                      <div className="mb-6 flex justify-center">
                        <img
                          src={card.logo_url}
                          alt={card.heading}
                          className="w-16 h-16 object-contain"
                        />
                      </div>
                    )}
                    <h3 className="font-['Roboto',system-ui] text-[20px] font-medium leading-[24px] flex justify-center items-center text-[#24272C] mb-4">{card.heading}</h3>
                    <p className="font-['Roboto',system-ui] text-[14px] font-normal leading-[21px] text-[#24272C] text-center">{card.description}</p>
                  </div>
                ))}
            </div>
          </div>
        </section>
      )}

      {/* Section 3 (Content only) */}
      {settings?.section3_visible && (
        <section className="py-16 px-4 md:px-8 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="max-w-3xl mx-auto">
              <div className="space-y-6">
                {settings.section3_small_heading && (
                  <p className="text-[#1d4ed8] font-semibold text-lg tracking-wide">
                    {settings.section3_small_heading}
                  </p>
                )}
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
                  {settings.section3_main_heading}
                </h2>
                <p className="text-xl text-gray-600 leading-relaxed">
                  {settings.section3_description}
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Section 4 (Content only) */}
      {settings?.section4_visible && (
        <section className="py-16 px-4 md:px-8 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <div className="max-w-3xl mx-auto">
              <div className="space-y-6">
                {settings.section4_small_heading && (
                  <p className="text-[#1d4ed8] font-semibold text-lg tracking-wide">
                    {settings.section4_small_heading}
                  </p>
                )}
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
                  {settings.section4_main_heading}
                </h2>
                <p className="text-xl text-gray-600 leading-relaxed">
                  {settings.section4_description}
                </p>
                {settings.section4_button_text && settings.section4_button_link && (
                  <Button className="bg-[#1d4ed8] hover:bg-[#1540b5] text-white text-lg px-8 py-6">
                    <a href={settings.section4_button_link}>{settings.section4_button_text}</a>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Dynamic Sections Heading */}
      {settings && (settings.dynamic_sections_heading_part1 || settings.dynamic_sections_heading_part2) && (
        <section className="py-8 pt-2 -mt-24 px-4 md:px-8 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="text-center">
              <h2 className="font-['Roboto',system-ui] text-[30px] leading-[33px] text-[#24272C]">
                <span className="font-normal">{settings.dynamic_sections_heading_part1}</span>
                <span className="font-medium">{settings.dynamic_sections_heading_part2}</span>
              </h2>
              <div className="w-16 h-1 bg-[#1d4ed8] mx-auto mt-4 rounded-full"></div>
            </div>
          </div>
        </section>
      )}

      {/* Dynamic Sections */}
      {sections.filter(section => section.is_visible).map((section, index) => {
        const isEven = index % 2 === 0;
        return (
          <section key={section.id} className="py-10 px-4 md:px-6 bg-gray-50">
            <div className="max-w-7xl mx-auto">
              <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 items-center ${isEven ? '' : 'md:grid-cols-2-reverse'}`}>
                <div className={isEven ? '' : 'order-2'}>
                  <div className="relative flex items-center justify-start md:justify-center">
                    {/* Background blob/shape */}
                    <div className="absolute -z-10 w-[80%] h-[80%] md:w-[90%] md:h-[90%] bg-blue-500 rounded-full opacity-20 -left-4 top-1/2 -translate-y-1/2 md:left-auto"></div>
                    {section.image_url && (
                      <img
                        src={section.image_url}
                        alt={section.main_heading}
                        className="w-full md:w-[90%] max-w-none h-[260px] md:h-[380px] lg:h-[460px] object-contain"
                      />
                    )}
                  </div>
                </div>
                <div className={`space-y-5 ${isEven ? '' : 'order-1 md:pl-12'} max-w-sm`}>
                  
                  <h2 className="font-['Roboto',system-ui] text-[24px] font-medium leading-[26.4px] text-[#24272C]">
                    {section.main_heading}
                  </h2>
                  <p className="font-['Roboto',system-ui] text-[16px] font-normal leading-[24px] text-[#24272C]">
                    {section.description}
                  </p>
                  {section.button_text && section.button_link && (
                    <Button className="bg-[#1d4ed8] hover:bg-[#1540b5] text-white text-lg px-8 py-6">
                      <a href={section.button_link}>{section.button_text}</a>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </section>
        );
      })}

      <Footer />
    </div>
  );
};

export default AdvertisePage;
