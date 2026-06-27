
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ChevronDown, ChevronUp, Minus } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

interface GetListedPlan {
  id: string;
  plan_name: string;
  price_inr: number;
  duration: string;
  button_text?: string | null;
  button_link?: string | null;
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
}

const GetListedPage = () => {
  const [plans, setPlans] = useState<GetListedPlan[]>([]);
  const [features, setFeatures] = useState<GetListedPlanFeature[]>([]);
  const [comparisonRows, setComparisonRows] = useState<GetListedComparisonRow[]>([]);
  const [comparisonCells, setComparisonCells] = useState<GetListedComparisonCell[]>([]);
  const [settings, setSettings] = useState<GetListedSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currency, setCurrency] = useState<'INR' | 'USD'>('INR');
  const [exchangeRate, setExchangeRate] = useState<number>(0.012); // Default fallback
  const [expandedPlans, setExpandedPlans] = useState<string[]>([]);

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
      const settingsResult = await supabase.from('get_listed_settings').select('*').limit(1).maybeSingle();
      if (settingsResult.data) {
        setSettings(settingsResult.data as GetListedSettings);
      } else {
        // Initialize with defaults if no data
        setSettings({
          id: '',
          main_heading: 'Choose the best plan for your business.',
          comparison_heading: 'Detailed pricing'
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
          const settingsResult = await supabase.from('get_listed_settings').select('*').limit(1).maybeSingle();
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

  useEffect(() => {
    const fetchExchangeRate = async () => {
      try {
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/INR');
        const data = await response.json();
        if (data.rates && data.rates.USD) {
          setExchangeRate(data.rates.USD);
        }
      } catch (error) {
        console.error('Failed to fetch exchange rate:', error);
      }
    };
    fetchExchangeRate();
  }, []);

  const getPrice = (priceInr: number) => {
    if (currency === 'INR') {
      return `₹${priceInr.toLocaleString('en-IN')}`;
    }
    const priceUsd = priceInr * exchangeRate;
    return `$${priceUsd.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
  };

  const getPlanFeatures = (planId: string) => {
    return features.filter(f => f.plan_id === planId);
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
      return <CheckCircle2 className="w-6 h-6 text-green-500 mx-auto" />;
    }
    if (cell.custom_text) {
      return <span className="text-gray-700 font-medium">{cell.custom_text}</span>;
    }
    return <Minus className="w-4 h-4 text-gray-400 mx-auto" />;
  };

  const visiblePlans = plans.filter(p => p.visible);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Pricing Section */}
      <section className="py-16 px-4 md:px-8 mt-20 md:mt-24">
        <div className="max-w-5xl mx-auto">
          {!isLoading && (
            <h1 className="text-[32px] font-bold text-center text-gray-900 mb-4">
              {settings?.main_heading || 'Choose the best plan for your business.'}
            </h1>
          )}

          {/* Currency Toggle */}
          <div className="flex justify-center mb-12">
            <div className="bg-white p-1 rounded-full shadow-sm inline-flex">
              <button
                onClick={() => setCurrency('INR')}
                className={`px-6 py-2 rounded-full font-medium transition-all ${
                  currency === 'INR' 
                    ? 'bg-blue-700 text-white' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                INR
              </button>
              <button
                onClick={() => setCurrency('USD')}
                className={`px-6 py-2 rounded-full font-medium transition-all ${
                  currency === 'USD' 
                    ? 'bg-blue-700 text-white' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                USD
              </button>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
                  className="bg-white rounded-lg shadow-lg relative overflow-hidden border-2 border-transparent transition-all duration-300 hover:border-blue-600 hover:scale-105 hover:shadow-xl"
                >
                  {plan.popular && (
                    <div className="absolute top-4 right-0 bg-orange-500 text-white text-[10px] font-semibold px-7 py-2 rotate-45 translate-x-8">
                      MOST POPULAR
                    </div>
                  )}

                  <div className="p-8">
                    <h3 className="text-xl font-medium text-gray-800 mb-2">{plan.plan_name}</h3>
                    <p className="text-4xl font-bold text-gray-900 mb-4">{getPrice(plan.price_inr)}</p>
                    <div className="border-t border-gray-200 my-4"></div>
                    <p className="text-sm text-gray-600 mb-6">{plan.duration}</p>

                    <ul className="space-y-3 mb-8">
                      {visibleFeatures.map((feature) => (
                        <li key={feature.id} className="flex items-start gap-2">
                          <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">{feature.feature_text}</span>
                        </li>
                      ))}
                    </ul>

                    {plan.show_view_more && planFeatures.length > 5 && (
                      <button
                        onClick={() => toggleExpand(plan.id)}
                        className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6 mx-auto"
                      >
                        {isExpanded ? 'View Less' : 'View More'}
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    )}

                    {plan.button_visible && plan.button_text && (
                      <Button className="w-full bg-blue-800 hover:bg-blue-900 text-white">
                        {plan.button_link ? (
                          <a href={plan.button_link}>{plan.button_text}</a>
                        ) : (
                          plan.button_text
                        )}
                      </Button>
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
        <section className="py-16 px-4 md:px-8 bg-white mt-8">
          <div className="max-w-5xl mx-auto">
            {!isLoading && (
              <h2 className="text-[32px] font-bold text-gray-900 mb-8">
                {settings?.comparison_heading || 'Detailed pricing'}
              </h2>
            )}
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-blue-800">
                    <th className="text-left py-4 px-6 font-bold text-gray-700 w-1/4"></th>
                    {visiblePlans.map((plan) => (
                      <th key={plan.id} className="text-center py-4 px-6 font-bold text-blue-800 text-lg">
                        {plan.plan_name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* Engagement Duration Row (Auto) */}
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <td className="py-4 px-6 font-semibold text-gray-700">Engagement Duration</td>
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
                        <td className="py-4 px-6 font-medium text-gray-700">{row.row_title}</td>
                        {visiblePlans.map((plan) => (
                          <td key={`${row.id}-${plan.id}`} className="py-4 px-6 text-center">
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

      <Footer />
    </div>
  );
};

export default GetListedPage;
