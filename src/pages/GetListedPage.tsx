
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ChevronDown, ChevronUp, Minus } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import RichTextContent from '@/components/shared/RichTextContent';

interface GetListedPlan {
  id: string;
  plan_name: string;
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
      
      // Load plans
      const plansResult = await supabase.from('get_listed_plans').select('*').order('sort_order');
      if (plansResult.data) setPlans(plansResult.data);

      // Load features
      const featuresResult = await supabase.from('get_listed_plan_features').select('*').order('sort_order');
      if (featuresResult.data) setFeatures(featuresResult.data);

      // Load comparison rows
      const rowsResult = await supabase.from('get_listed_comparison_rows').select('*').order('sort_order');
      if (rowsResult.data) setComparisonRows(rowsResult.data);

      // Load comparison cells
      const cellsResult = await supabase.from('get_listed_comparison_cells').select('*');
      if (cellsResult.data) setComparisonCells(cellsResult.data);

      // Load settings first to avoid flicker - don't set isLoading until after settings are loaded
      const settingsResult = await supabase
        .from('get_listed_settings')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
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
      setIsLoading(false);
    };
    loadData();

    // Subscribe to changes
    const plansChannel = supabase
      .channel('get_listed_plans_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'get_listed_plans' },
        () => {
          loadData();
        }
      )
      .subscribe();

    const featuresChannel = supabase
      .channel('get_listed_plan_features_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'get_listed_plan_features' },
        () => {
          loadData();
        }
      )
      .subscribe();

    const rowsChannel = supabase
      .channel('get_listed_comparison_rows_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'get_listed_comparison_rows' },
        () => {
          loadData();
        }
      )
      .subscribe();

    const cellsChannel = supabase
      .channel('get_listed_comparison_cells_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'get_listed_comparison_cells' },
        () => {
          loadData();
        }
      )
      .subscribe();

    const settingsChannel = supabase
      .channel('get_listed_settings_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'get_listed_settings' },
        async () => {
          // Just update settings without full reload all
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

  const getPrice = (plan: GetListedPlan) => {
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
  };

  const getButtonLink = (plan: GetListedPlan) => {
    if (currency === 'INR') {
      return plan.button_link;
    }
    return plan.button_link_usd;
  };

  const getPlanFeatures = (planId: string) => {
    return features.filter(f => f.plan_id === planId && (f.visible ?? true));
  };

  const toggleExpand = (planId: string) => {
    setExpandedPlans(prev => 
      prev.includes(planId) 
        ? prev.filter(id => id !== planId) 
        : [...prev, planId]
    );
  };

  const getCellContent = (rowId: string, planId: string) => {
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
  };

  const visiblePlans = plans.filter(p => p.visible);

  return (
    <div className="min-h-[100dvh] flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1">
        {/* Pricing Section */}
        <section className="py-8 px-8 md:px-16 lg:px-24 mt-20 md:mt-24">
          <div className={pageContentContainerClassName}>
            {!isLoading && (
              <h1 className="font-['Golos Text',sans-serif'] text-[32px] font-semibold leading-normal text-[#222222] text-center mb-12">
                {settings?.main_heading || 'Choose the best plan for your business.'}
              </h1>
            )}

            {/* Currency Toggle */}
            {(settings?.show_currency_toggle ?? true) && (
              <div className="flex justify-center mb-12">
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
              {visiblePlans.map((plan) => {
                const planFeatures = getPlanFeatures(plan.id);
                const isExpanded = expandedPlans.includes(plan.id);
                const showAllFeatures = !plan.show_view_more;
                const visibleFeatures = showAllFeatures 
                  ? planFeatures 
                  : isExpanded 
                    ? planFeatures 
                    : planFeatures.slice(0, 5);

                return (
                  <div 
                    key={plan.id} 
                    className="bg-white rounded-lg shadow-lg relative overflow-hidden border-2 border-transparent transition-all duration-300 hover:border-[#001965] hover:scale-105 hover:shadow-xl w-full md:w-[calc(50%-1rem)] lg:w-[calc(33.333%-1.5rem)]"
                  >
                    {plan.popular && (
                      <div className="absolute top-4 right-0 bg-orange-500 text-white text-[10px] font-semibold px-7 py-2 rotate-45 translate-x-8 shadow-xl">
                        MOST POPULAR
                      </div>
                    )}

                    <div className="pt-0 px-8 pb-8">
                      <h3 className="text-[22px] font-semibold leading-normal text-[#222222] mb-2">{plan.plan_name}</h3>
                      <p className="text-[28px] font-semibold leading-normal text-[#000000] mb-4">{getPrice(plan)}</p>
                      <div className="border-t border-gray-200 my-4"></div>
                      <p className="text-[16px] font-normal leading-normal text-[#606F7B] mb-6">{plan.duration}</p>

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

        {/* Comparison Table Section */}
        {comparisonRows.filter(r => r.visible).length > 0 && visiblePlans.length > 0 && (
          <section className="pt-8 pb-16 px-8 md:px-16 lg:px-24 bg-white mt-8">
            <div className={pageContentContainerClassName}>
              {!isLoading && (
                <h2 className="text-[32px] font-semibold text-[#222222] mb-6">
                  {settings?.comparison_heading || 'Detailed pricing'}
                </h2>
              )}
              
              <div className="overflow-x-auto border border-gray-200 rounded-lg overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.15)]">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b-2 border-blue-800">
                      <th className="text-left py-4 px-6 font-bold text-gray-700 w-1/3"></th>
                      {visiblePlans.map((plan) => (
                        <th key={plan.id} className="text-center py-4 px-6 text-[22px] font-normal leading-normal text-[#001965]">
                          {plan.plan_name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {/* Engagement Duration Row (Auto) */}
                    <tr className="border-b border-gray-200 bg-gray-50">
                      
                      {visiblePlans.map((plan) => (
                        <td key={plan.id} className="py-4 px-6 text-center text-gray-700">
                          {plan.duration}
                        </td>
                      ))}
                    </tr>

                    {/* Comparison Rows */}
                    {comparisonRows
                      .filter(row => row.visible)
                      .map((row, index) => (
                        <tr 
                          key={row.id} 
                          className={`border-b border-gray-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                        >
                          <td className="py-4 px-6 text-[18px] font-normal leading-[21.4286px] text-[#001965]">{row.row_title}</td>
                          {visiblePlans.map((plan) => (
                            <td key={`${row.id}-${plan.id}`} className="py-4 px-6 text-center text-[15px] font-normal leading-[21.4286px] text-[#606F7B]">
                              {getCellContent(row.id, plan.id)}
                            </td>
                          ))}
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

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
    </div>
  );
};

export default GetListedPage;
