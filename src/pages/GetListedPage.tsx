import { useEffect, useState, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Minus } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import RichTextContent from '@/components/shared/RichTextContent';
import { getVisibleComparisonPlans } from '@/lib/getListedComparisonVisibility';

interface GetListedPlan {
  id: string;
  plan_name: string;
  comparison_header?: string | null;
  price_inr: number;
  price_usd: number;
  duration: string;
  button_text?: string | null;
  button_link?: string | null;
  button_link_usd?: string | null;
  button_visible: boolean;
  popular: boolean;
  visible: boolean;
  show_view_more: boolean;
  sort_order: number;
}

interface GetListedPlanFeature {
  id: string;
  plan_id: string;
  feature_text: string;
  visible?: boolean;
  sort_order: number;
}

interface GetListedComparisonRow {
  id: string;
  row_title: string;
  visible: boolean;
  sort_order: number;
}

interface GetListedComparisonCell {
  id: string;
  row_id: string;
  plan_id: string;
  tick_enabled: boolean;
  custom_text?: string | null;
}

interface GetListedSettings {
  id: string;
  main_heading: string;
  comparison_heading: string;
  comparison_footer_content?: string | null;
  comparison_footer_line?: string | null;
  show_currency_toggle?: boolean;
  show_pricing_section?: boolean;
  show_comparison_section?: boolean;
  show_comparison_footer?: boolean;
}

const GetListedPage = () => {
  const [plans, setPlans] = useState<GetListedPlan[]>([]);
  const [features, setFeatures] = useState<GetListedPlanFeature[]>([]);
  const [comparisonRows, setComparisonRows] = useState<GetListedComparisonRow[]>([]);
  const [comparisonCells, setComparisonCells] = useState<GetListedComparisonCell[]>([]);
  const [settings, setSettings] = useState<GetListedSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currency, setCurrency] = useState<'INR' | 'USD'>('INR');
  const [expandedPlans, setExpandedPlans] = useState<string[]>([]);
  const pageContentContainerClassName = "max-w-10xl mx-auto";

  useEffect(() => {
    const loadData = async () => {
      console.log('GetListedPage: Loading data...');
      setIsLoading(true);
      
      try {
        // Load all data in parallel using Promise.all
        const [
          plansResult,
          featuresResult,
          rowsResult,
          cellsResult,
          settingsResult
        ] = await Promise.all([
          supabase.from('get_listed_plans').select('*').order('sort_order'),
          supabase.from('get_listed_plan_features').select('*').order('sort_order'),
          supabase.from('get_listed_comparison_rows').select('*').order('sort_order'),
          supabase.from('get_listed_comparison_cells').select('*'),
          supabase
            .from('get_listed_settings')
            .select('*')
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle()
        ]);

        if (plansResult.data) setPlans(plansResult.data);
        if (featuresResult.data) setFeatures(featuresResult.data);
        if (rowsResult.data) setComparisonRows(rowsResult.data);
        if (cellsResult.data) setComparisonCells(cellsResult.data);
        
        if (settingsResult.data) {
          setSettings(settingsResult.data as GetListedSettings);
        } else {
          // Initialize with defaults if no data
          setSettings({
            id: '',
            main_heading: 'Choose the best plan for your business.',
            comparison_heading: 'Detailed pricing',
            comparison_footer_content: '',
            comparison_footer_line: ''
          } as any);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();

    // Subscribe to changes with optimized updates
    const plansChannel = supabase
      .channel('get_listed_plans_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'get_listed_plans' },
        async (payload) => {
          if (payload.eventType === 'INSERT' && payload.new) {
            setPlans(prev => [...prev, payload.new as GetListedPlan]);
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            setPlans(prev => prev.map(p => p.id === (payload.new as GetListedPlan).id ? payload.new as GetListedPlan : p));
          } else if (payload.eventType === 'DELETE' && payload.old) {
            setPlans(prev => prev.filter(p => p.id !== (payload.old as GetListedPlan).id));
          }
        }
      )
      .subscribe();

    const featuresChannel = supabase
      .channel('get_listed_plan_features_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'get_listed_plan_features' },
        async (payload) => {
          if (payload.eventType === 'INSERT' && payload.new) {
            setFeatures(prev => [...prev, payload.new as GetListedPlanFeature]);
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            setFeatures(prev => prev.map(f => f.id === (payload.new as GetListedPlanFeature).id ? payload.new as GetListedPlanFeature : f));
          } else if (payload.eventType === 'DELETE' && payload.old) {
            setFeatures(prev => prev.filter(f => f.id !== (payload.old as GetListedPlanFeature).id));
          }
        }
      )
      .subscribe();

    const rowsChannel = supabase
      .channel('get_listed_comparison_rows_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'get_listed_comparison_rows' },
        async (payload) => {
          if (payload.eventType === 'INSERT' && payload.new) {
            setComparisonRows(prev => [...prev, payload.new as GetListedComparisonRow]);
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            setComparisonRows(prev => prev.map(r => r.id === (payload.new as GetListedComparisonRow).id ? payload.new as GetListedComparisonRow : r));
          } else if (payload.eventType === 'DELETE' && payload.old) {
            setComparisonRows(prev => prev.filter(r => r.id !== (payload.old as GetListedComparisonRow).id));
          }
        }
      )
      .subscribe();

    const cellsChannel = supabase
      .channel('get_listed_comparison_cells_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'get_listed_comparison_cells' },
        async (payload) => {
          if (payload.eventType === 'INSERT' && payload.new) {
            setComparisonCells(prev => [...prev, payload.new as GetListedComparisonCell]);
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            setComparisonCells(prev => prev.map(c => c.id === (payload.new as GetListedComparisonCell).id ? payload.new as GetListedComparisonCell : c));
          } else if (payload.eventType === 'DELETE' && payload.old) {
            setComparisonCells(prev => prev.filter(c => c.id !== (payload.old as GetListedComparisonCell).id));
          }
        }
      )
      .subscribe();

    const settingsChannel = supabase
      .channel('get_listed_settings_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'get_listed_settings' },
        async () => {
          const settingsResult = await supabase
            .from('get_listed_settings')
            .select('*')
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          if (settingsResult.data) {
            setSettings(settingsResult.data as GetListedSettings);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(plansChannel);
      supabase.removeChannel(featuresChannel);
      supabase.removeChannel(rowsChannel);
      supabase.removeChannel(cellsChannel);
      supabase.removeChannel(settingsChannel);
    };
  }, []);

  const getPrice = useCallback((plan: GetListedPlan) => {
    const price = currency === 'INR' ? plan.price_inr : plan.price_usd;
    if (price === 0) {
      return null;
    }
    if (currency === 'INR') {
      return (
        <>
          <span className="font-sans">₹</span>{plan.price_inr.toLocaleString('en-IN')}
        </>
      );
    }
    return (
      <>
        <span className="font-sans">$</span>{plan.price_usd.toLocaleString('en-US', { maximumFractionDigits: 2 })}
      </>
    );
  }, [currency]);

  const getButtonLink = useCallback((plan: GetListedPlan) => {
    if (currency === 'INR') {
      return plan.button_link;
    }
    return plan.button_link_usd;
  }, [currency]);

  const getPlanFeatures = useCallback((planId: string) => {
    return features.filter(f => f.plan_id === planId && (f.visible ?? true));
  }, [features]);

  const toggleExpand = useCallback((planId: string) => {
    setExpandedPlans(prev => 
      prev.includes(planId) 
        ? prev.filter(id => id !== planId) 
        : [...prev, planId]
    );
  }, []);

  const getCellContent = useCallback((rowId: string, planId: string) => {
    const cell = comparisonCells.find(c => c.row_id === rowId && c.plan_id === planId);
    if (!cell) {
      return <Minus className="w-4 h-4 text-gray-400 mx-auto" />;
    }
    if (cell.tick_enabled) {
      return <CheckCircle2 className="w-6 h-6 text-[#1d4ed8] mx-auto" />;
    }
    if (cell.custom_text) {
      return <span className="text-gray-700 font-medium">{cell.custom_text}</span>;
    }
    return <Minus className="w-4 h-4 text-gray-400 mx-auto" />;
  }, [comparisonCells]);

  const visiblePricingPlans = useMemo(() => plans.filter(p => p.visible), [plans]);
  const visibleComparisonPlans = useMemo(
    () => getVisibleComparisonPlans(plans),
    [plans]
  );

  // Fade-up animation keyframes and classes
  const fadeUpAnimation = `
    @keyframes fadeUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `;

  return (
    <div className="min-h-[100dvh] flex flex-col bg-gray-50">
      <style>{fadeUpAnimation}</style>
      
      {!isLoading ? (
        <>
          <Header />

          <main className="flex-1">
            {/* Pricing Section */}
            {(settings?.show_pricing_section ?? true) && (
              <section className="py-8 px-8 md:px-16 lg:px-24 mt-20 md:mt-24">
              <div className={pageContentContainerClassName}>
                <h1 
                  className="font-['Golos Text',sans-serif] text-[32px] font-semibold leading-normal text-[#222222] text-center mb-12"
                  style={{
                    opacity: 0,
                    animation: 'fadeUp 0.6s ease-out forwards',
                    animationDelay: '0.1s'
                  }}
                >
                  {settings?.main_heading || 'Choose the best plan for your business.'}
                </h1>

                {/* Currency Toggle */}
                {settings?.show_currency_toggle && (
                  <div 
                    className="flex justify-center mb-12"
                    style={{
                      opacity: 0,
                      animation: 'fadeUp 0.6s ease-out forwards',
                      animationDelay: '0.2s'
                    }}
                  >
                    <div className="bg-white p-1 rounded-full shadow-sm inline-flex">
                      <button
                        onClick={() => setCurrency('INR')}
                        className={`px-6 py-2 rounded-full font-medium transition-all ${
                          currency === 'INR' 
                            ? 'bg-[#001965] text-white' 
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        INR
                      </button>
                      <button
                        onClick={() => setCurrency('USD')}
                        className={`px-6 py-2 rounded-full font-medium transition-all ${
                          currency === 'USD' 
                            ? 'bg-[#001965] text-white' 
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        USD
                      </button>
                    </div>
                  </div>
                )}

                {/* Pricing Cards */}
                <div className="flex flex-wrap justify-center gap-8">
                  {visiblePricingPlans.map((plan, index) => {
                    const planFeatures = getPlanFeatures(plan.id);
                    const visibleFeatures = planFeatures;

                    return (
                      <div 
                        key={plan.id} 
                        className="bg-white rounded-lg shadow-lg relative overflow-visible border-2 border-transparent transition-all duration-300  hover:scale-105 hover:shadow-2xl w-full md:w-[calc(50%-1rem)] lg:w-[calc(33.333%-1.5rem)]"
                        style={{
                          opacity: 0,
                          animation: 'fadeUp 0.6s ease-out forwards',
                          animationDelay: `${0.3 + index * 0.1}s`
                        }}
                      >
                        {plan.popular && (
                          <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 bg-orange-500 text-white text-[13px] font-semibold px-7 py-2 shadow-xl z-10">
                            MOST POPULAR
                          </div>
                        )}

                        <div className="pt-8 px-8 pb-8">
                          <h3 className="text-[22px] font-semibold leading-normal text-[#222222] mb-2">{plan.plan_name}</h3>
                          <div className="flex items-center gap-2 mb-4">
                            {getPrice(plan) && (
                              <p className="text-[28px] font-semibold leading-normal text-[#000000]">{getPrice(plan)}</p>
                            )}
                            <p className="text-[16px] font-normal leading-normal text-[#606F7B]">{plan.duration}</p>
                          </div>
                          <div className="border-t border-gray-200 my-4"></div>

                          <ul className="space-y-3 mb-8">
                            {visibleFeatures.map((feature) => (
                              <li key={feature.id} className="flex items-start gap-2">
                                <CheckCircle2 className="w-5 h-5 text-[#1d4ed8] mt-0.5 flex-shrink-0" />
                                <span className="text-gray-700">{feature.feature_text}</span>
                              </li>
                            ))}
                          </ul>

                          {plan.button_visible && plan.button_text && (
                            getButtonLink(plan) ? (
                              <Button asChild className="w-full bg-[#001965] hover:bg-[#001965] text-white">
                                <a href={getButtonLink(plan)}>{plan.button_text}</a>
                              </Button>
                            ) : (
                              <Button className="w-full bg-[#001965] hover:bg-[#001965] text-white">
                                {plan.button_text}
                              </Button>
                            )
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              </section>
            )}

            {/* Comparison Table Section */}
            {(settings?.show_comparison_section ?? true) && comparisonRows.filter(r => r.visible).length > 0 && visibleComparisonPlans.length > 0 && (
              <section 
                className="pt-8 pb-8 px-8 md:px-16 lg:px-24 bg-white mt-8"
                style={{
                  opacity: 0,
                  animation: 'fadeUp 0.6s ease-out forwards',
                  animationDelay: `${0.5 + visibleComparisonPlans.length * 0.1}s`
                }}
              >
                <div className={pageContentContainerClassName}>
                  <h2 className="text-[32px] font-semibold text-[#222222] mb-6">
                    {settings?.comparison_heading || 'Detailed pricing'}
                  </h2>
                  
                  <div className="overflow-x-auto border border-gray-200 rounded-lg overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.15)]">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b-2 border-blue-800">
                          <th className="text-left py-4 px-4 font-bold text-gray-700 w-1/4"></th>
                          {visibleComparisonPlans.map((plan) => (
                            <th key={plan.id} className="text-center py-4 px-4 text-[22px] font-normal leading-normal text-[#001965]">
                              {plan.comparison_header || plan.plan_name}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        

                        {/* Comparison Rows */}
                        {comparisonRows
                          .filter(row => row.visible)
                          .map((row, index) => (
                            <tr 
                              key={row.id} 
                              className={`border-b border-gray-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                            >
                              <td className="py-4 px-4 text-[18px] font-normal leading-[21.4286px] text-[#001965]">{row.row_title}</td>
                              {visibleComparisonPlans.map((plan) => (
                                <td key={`${row.id}-${plan.id}`} className="py-4 px-4 text-center text-[15px] font-normal leading-[21.4286px] text-[#606F7B]">
                                  {getCellContent(row.id, plan.id)}
                                </td>
                              ))}
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            )}

            {/* Comparison Footer Section */}
            {(settings?.show_comparison_footer ?? true) && (
              <section className="pt-0 pb-16 px-8 md:px-16 lg:px-24 bg-white">
                <div className={pageContentContainerClassName}>
                  {settings?.comparison_footer_content && (
                    <RichTextContent
                      content={settings.comparison_footer_content}
                      className="mt-6 bg-white border border-gray-200 rounded-lg p-6 shadow-[0_0_20px_rgba(0,0,0,0.15)] text-[15px] font-normal leading-[21.4286px] text-[#606F7B] [&_ul]:pl-5 [&_ul]:list-disc [&_li]:my-1"
                    />
                  )}

                  {settings?.comparison_footer_line && (
                    <div className="mt-4 translate-x-6 text-[15px] font-normal leading-[21.4286px] text-[#606F7B]">
                      {settings.comparison_footer_line}
                    </div>
                  )}
                </div>
              </section>
            )}
          </main>

          <Footer />
        </>
      ) : null}
    </div>
  );
};

export default GetListedPage;
