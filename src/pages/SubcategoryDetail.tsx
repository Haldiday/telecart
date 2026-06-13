import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import FeaturedCards from '@/components/home/FeaturedCards';
import OffersSection from '@/components/home/OffersSection';
import Ads1ColSection from '@/components/home/Ads1ColSection';
import Ads2ColSection from '@/components/home/Ads2ColSection';
import Ads3ColSection from '@/components/home/Ads3ColSection';
import LogoStepsSection from '@/components/home/LogoStepsSection';
import WatchDemoForm from '@/components/home/WatchDemoForm';

import { toast } from 'sonner';
import {
  Download,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Info,
  Play,
  Maximize2,
  Plus,
  X,
  Package,
  FileText,
  CheckCircle2,
  Image,
  Mail,
} from 'lucide-react';
import { DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';

const db = supabase as any;

const SUBCATEGORY_BRANDS_TABLE = 'subcategory_brands';
const INITIAL_OVERVIEW_POINTS_COUNT = 8;

const defaultCategoryButtons = [
  { label: 'Try For Free', link: null, is_visible: false },
  { label: 'Get Quote', link: null, is_visible: false },
  { label: 'Call Now', link: null, is_visible: false },
  { label: 'Contact', link: null, is_visible: false },
];

const defaultOverviewPointsHeading = 'Header';

interface Subcategory {
  id: string;
  name: string;
  link: string | null;
  custom_link?: string | null;
  custom_link_type?: 'link' | 'iframe' | null;
  video_url?: string | null;
  video_url_2?: string[] | null;
  schedule_link?: string | null;
  schedule_link_2?: string | null;
  show_schedule_2_in_separate_tab?: boolean;
  show_schedule_in_separate_tab?: boolean;
  form_link?: string | null;
  show_form_in_separate_tab?: boolean;
  about_heading?: string | null;
  about_subheading?: string | null;
  about_content?: string | null;
  detail_heading?: string | null;
  detail_description?: string | null;
  show_downloads?: boolean;
  show_brands?: boolean;
  show_resources?: boolean;
  show_pricing_plans?: boolean;
  show_about_section?: boolean;
  show_header_points_section?: boolean;
  category_id: string;
  image_url?: string | null;
  resources_tab_label?: string | null;
  downloads_tab_label?: string | null;
  brands_tab_label?: string | null;
  key_features_tab_label?: string | null;
  pricing_plans_tab_label?: string | null;
  hero_background_color?: string | null;
  tab_order?: string[] | null;
  about_bg_color?: string | null;
  about_heading_color?: string | null;
  about_subheading_color?: string | null;
  about_description_color?: string | null;
  about_button_bg_color?: string | null;
  about_button_text_color?: string | null;
}

interface Category {
  id: string;
  name: string;
  icon_url: string | null;
  bg_color: string;
  detail_heading?: string | null;
  detail_description?: string | null;
  overview_points_heading?: string | null;
  show_downloads_tab?: boolean;
  show_overview_section?: boolean;
  show_products_tab?: boolean;
  show_brands_tab?: boolean;
}

interface CategoryButton {
  id?: string;
  subcategory_id?: string;
  label: string;
  link?: string | null;
  is_visible: boolean;
  sort_order: number;
}

interface Download {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string;
}

interface PricingPlan {
  id: string;
  subcategory_id: string;
  plan_name: string;
  price: string;
  currency: string;
  duration: string;
  description: string | null;
  features: string[];
  button_label: string;
  button_link: string | null;
  razorpay_link: string | null;
  is_popular: boolean;
  is_visible: boolean;
  sort_order: number;
  card_bg_color?: string | null;
  button_bg_color?: string | null;
}

interface CategoryProduct {
  id: string;
  title: string;
  link: string;
  sort_order: number;
}

interface BrandItem {
  id: string;
  name: string;
  link: string;
  logo_url?: string | null;
  description?: string | null;
  buttons?: CategoryButton[];
  sort_order: number;
  primary_cta_label?: string | null;
  primary_cta_link?: string | null;
  primary_cta_visible?: boolean;
  more_actions_label?: string | null;
  more_actions_visible?: boolean;
  join_network_label?: string | null;
  join_network_link?: string | null;
  join_network_visible?: boolean;
}

interface CategoryOverviewPoint {
  id: string;
  subcategory_id: string;
  section_id?: string;
  text: string;
  is_highlighted: boolean;
  highlight_color?: 'green' | 'blue';
  sort_order: number;
}

interface SubcategoryKeyFeaturesSection {
  id: string;
  subcategory_id: string;
  heading: string;
  is_visible: boolean;
  sort_order: number;
}

interface ProductCardItem {
  id: string;
  title: string;
  link: string;
}

interface SubcategoryAboutSection {
  id: string;
  subcategory_id: string;
  heading: string;
  content: string | null;
  background_color?: string;
  heading_color?: string;
  sort_order: number;
  is_visible?: boolean;
  created_at: string;
  updated_at: string;
}

const RICH_HTML_CONTENT_CLASS =
  'rich-html-content font-inter font-normal text-[20px] leading-[32px] text-[#333333] prose prose-sm max-w-none overflow-x-hidden break-words ' +
  '[&_h2]:font-inter [&_h2]:font-bold [&_h2]:text-[32px] [&_h2]:leading-[40px] [&_h2]:text-[#111111] [&_h2]:mb-3 [&_p]:whitespace-pre-wrap [&_p]:mb-[1.25rem] ' +
  '[&_>_*:last-child]:mb-0!important [&_*:last-child]:mb-0!important [&_>_*:first-child]:mt-0 ' +
  '[&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:list-inside ' +
  '[&_ol]:mb-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:list-inside ' +
  '[&_li]:mb-1 [&_li_p]:inline [&_li_p]:m-0 ' +
  '[&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:bg-muted/60 ' +
  '[&_blockquote]:px-4 [&_blockquote]:py-3 [&_blockquote]:my-4 [&_blockquote]:italic ' +
  '[&_blockquote_p]:my-0 [&_blockquote_p]:whitespace-normal ' +
  '[&_.rich-blockquote]:border-l-4 [&_.rich-blockquote]:border-primary [&_.rich-blockquote]:bg-muted/60 ' +
  '[&_.rich-blockquote]:px-4 [&_.rich-blockquote]:py-3 [&_.rich-blockquote]:my-4 [&_.rich-blockquote]:italic ' +
  '[&_strong]:font-semibold [&_em]:italic [&_u]:underline [&_a]:text-primary [&_a]:hover:underline';

const SECTION_HEADING_CLASS = 'section-heading';
const SECTION_SUBTEXT_CLASS = 'section-subtext';

interface SubcategoryPageSection {
  id: string;
  subcategory_id: string;
  section_type: 'cards' | 'offers' | 'ads_1col' | 'ads_2col' | 'ads_3col' | 'logo_steps';
  sort_order: number;
  is_visible: boolean;
  background_color: string | null;
}

const getYouTubeVideoId = (url: string): string | null => {
  const regexPatterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];

  for (const pattern of regexPatterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
};

const getYouTubeEmbedUrl = (videoId: string): string => `https://www.youtube.com/embed/${videoId}?`;

const detectLinkType = (content: string): 'link' | 'iframe' | 'embed_code' => {
  if (!content) return 'link';
  const trimmed = content.trim();
  if (trimmed.startsWith('<iframe') || (trimmed.includes('<iframe') && trimmed.includes('</iframe>'))) return 'iframe';
  if (trimmed.startsWith('<div') || trimmed.includes('<script')) return 'embed_code';
  return 'link';
};

const normalizeExternalUrl = (url: string) => {
  const trimmedUrl = url.trim();
  if (!trimmedUrl) return null;
  return /^https?:\/\//i.test(trimmedUrl) ? trimmedUrl : `https://${trimmedUrl}`;
};

const getDownloadFileType = (fileName?: string | null) => {
  const extension = fileName?.split('.').pop()?.trim().toLowerCase();
  if (!extension) return 'other';

  const supportedTypes = new Set(['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'zip']);
  return supportedTypes.has(extension) ? extension : 'other';
};

// Adjust these values to control the desktop download card size.

export default function SubcategoryDetail() {
  const { categoryId, subcategoryId } = useParams<{ categoryId: string; subcategoryId: string }>();

  const [category, setCategory] = useState<Category | null>(null);
  const [subcategory, setSubcategory] = useState<Subcategory | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [showVideoFullscreen, setShowVideoFullscreen] = useState(false);
  const [downloads, setDownloads] = useState<Download[]>([]);
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([]);
  const [products, setProducts] = useState<CategoryProduct[]>([]);
  const [buttons, setButtons] = useState<CategoryButton[]>([]);
  const [overviewPoints, setOverviewPoints] = useState<CategoryOverviewPoint[]>([]);
  const [detailHeading, setDetailHeading] = useState('');
  const [detailDescription, setDetailDescription] = useState('');
  const [overviewPointsHeading, setOverviewPointsHeading] = useState(defaultOverviewPointsHeading);
  const [isSaving, setIsSaving] = useState(false);
  const [showOverviewPointsSection, setShowOverviewPointsSection] = useState(true);
  const [showAllOverviewPoints, setShowAllOverviewPoints] = useState(false);
  const [allSectionsVisible, setAllSectionsVisible] = useState(true);

  const handleShowOverviewSectionChange = async (value: boolean) => {
    setShowOverviewPointsSection(value);
    try {
      await supabase.from('categories').update({ show_overview_section: value }).eq('id', categoryId);
      setCategory((current) => (current ? { ...current, show_overview_section: value } : current));
      toast.success(value ? 'Overview section shown.' : 'Overview section hidden.');
    } catch (error) {
      console.error('Error updating overview section visibility:', error);
      toast.error('Failed to save setting.');
      setShowOverviewPointsSection(!value);
    }
  };

  const [videoUrl, setVideoUrl] = useState('');
  const [videoUrl2, setVideoUrl2] = useState<string[]>([]);
  const [formLink, setFormLink] = useState('');
  const [showFormTab, setShowFormTab] = useState(false);
  const [aboutHeading, setAboutHeading] = useState('');
  const [aboutSubheading, setAboutSubheading] = useState('');
  const [aboutContent, setAboutContent] = useState('');
  const [aboutBgColor, setAboutBgColor] = useState('#013737');
  const [aboutHeadingColor, setAboutHeadingColor] = useState('#ffffff');
  const [aboutSubheadingColor, setAboutSubheadingColor] = useState('#9af24d');
  const [aboutDescriptionColor, setAboutDescriptionColor] = useState('#ffffff');
  const [aboutButtonBgColor, setAboutButtonBgColor] = useState('#16a34a');
  const [aboutButtonTextColor, setAboutButtonTextColor] = useState('#ffffff');
  const [isAboutExpanded, setIsAboutExpanded] = useState(false);
  const [aboutSections, setAboutSections] = useState<SubcategoryAboutSection[]>([]);
  const [keyFeaturesSections, setKeyFeaturesSections] = useState<SubcategoryKeyFeaturesSection[]>([]);
  const [expandedAboutSection, setExpandedAboutSection] = useState(false);
  const [subcategorySections, setSubcategorySections] = useState<SubcategoryPageSection[]>([]);
  const [demoFormHeading, setDemoFormHeading] = useState('See The Software In Action\nWatch Free Demo!');
  const [demoFormHeadingColor, setDemoFormHeadingColor] = useState('#000000');
  const [demoButtonLabel, setDemoButtonLabel] = useState('Get Free Advice');

  const [brands, setBrands] = useState<BrandItem[]>([]);
  const [openMoreActionsBrandId, setOpenMoreActionsBrandId] = useState<string | null>(null);

  const hasVideoResource = Boolean(videoUrl.trim());
  const hasVideoResource2 = videoUrl2.some(url => url?.trim());
  const showDownloadsTab = subcategory?.show_downloads === true;
  const showProductsTab = category?.show_products_tab !== false;
  const showBrandsTab = subcategory?.show_brands !== false && brands.length > 0;
  const showBrandsInOverview = subcategory?.show_brands !== false && brands.length > 0;
  const showPricingPlansTab = subcategory?.show_pricing_plans !== false && pricingPlans.filter(p => p.is_visible !== false).length > 0;
  const showPricingPlansInOverview = subcategory?.show_pricing_plans !== false && pricingPlans.filter(p => p.is_visible !== false).length > 0;
  const showFormAsTab = Boolean(formLink.trim() && showFormTab);
  const showResourcesTab = subcategory?.show_resources === true;
  const showHeaderPointsSection = subcategory?.show_header_points_section !== false;
  const showHeaderPointsTab = showHeaderPointsSection && overviewPoints.length > 0;
  const showAboutSection = subcategory?.show_about_section ?? true;

  const allPossibleTabs = [
    { key: 'overview', label: 'Overview', icon: <Info className="h-4 w-4" />, visible: showAboutSection },
    { key: 'resources', label: subcategory?.resources_tab_label || 'Resources', icon: <Play className="h-4 w-4" />, visible: showResourcesTab },
    { key: 'downloads', label: subcategory?.downloads_tab_label || 'Downloads', icon: <Download className="h-4 w-4" />, visible: showDownloadsTab },
    { key: 'key_features', label: subcategory?.key_features_tab_label || 'Key Features', icon: <CheckCircle2 className="h-4 w-4" />, visible: showHeaderPointsTab },
    { key: 'pricing', label: subcategory?.pricing_plans_tab_label || 'Pricing', icon: <Package className="h-4 w-4" />, visible: showPricingPlansTab },
    { key: 'brands', label: subcategory?.brands_tab_label || 'Brands', icon: <Image className="h-4 w-4" />, visible: showBrandsTab },
    { key: 'form', label: 'Form', icon: <FileText className="h-4 w-4" />, visible: showFormAsTab },
  ];

  const tabOrder = subcategory?.tab_order || ['overview', 'resources', 'downloads', 'key_features', 'pricing', 'brands', 'form'];

  const tabs = useMemo(() => {
    const orderedTabs = tabOrder
      .map(key => allPossibleTabs.find(t => t.key === key))
      .filter((t): t is typeof allPossibleTabs[0] => !!t && t.visible);

    // Add any missing tabs that might be visible but not in tabOrder
    allPossibleTabs.forEach(t => {
      if (t.visible && !orderedTabs.find(ot => ot.key === t.key)) {
        orderedTabs.push(t);
      }
    });

    return orderedTabs;
  }, [tabOrder, subcategory, showResourcesTab, showDownloadsTab, showHeaderPointsTab, showPricingPlansTab, showBrandsTab, showFormAsTab]);

  const activeTabKey = useMemo(() => tabs[activeTab]?.key, [tabs, activeTab]);

  const resourcesTabLabel = subcategory?.resources_tab_label?.trim() || 'Resources';
  const downloadsTabLabel = subcategory?.downloads_tab_label?.trim() || 'Downloads';
  const brandsTabLabel = subcategory?.brands_tab_label?.trim() || 'Brands';
  const pricingPlansTabLabel = subcategory?.pricing_plans_tab_label?.trim() || 'Pricing Plans';

  const productItems: ProductCardItem[] = useMemo(
    () =>
      products.map((product) => ({
        id: `category-product-${product.id}`,
        title: product.title,
        link: product.link,
      })),
    [products]
  );

  const visibleOverviewPoints = useMemo(
    () => overviewPoints.filter((point) => point.text.trim().length > 0).sort((a, b) => a.sort_order - b.sort_order),
    [overviewPoints]
  );

  const hasMoreOverviewPoints = visibleOverviewPoints.length > INITIAL_OVERVIEW_POINTS_COUNT;

  const displayedOverviewPoints = useMemo(
    () => (showAllOverviewPoints ? visibleOverviewPoints : visibleOverviewPoints.slice(0, INITIAL_OVERVIEW_POINTS_COUNT)),
    [showAllOverviewPoints, visibleOverviewPoints]
  );

  const aboutContentIsLong = useMemo(() => {
    const text = aboutContent.trim();
    if (!text) return false;
    return text.split('\n').length > 7 || text.length > 420;
  }, [aboutContent]);

  const primaryButtons = useMemo(
    () => buttons.slice(0, 2).filter((button) => button.is_visible),
    [buttons]
  );

  const primaryEditableButtons = useMemo(
    () => buttons.slice(0, 2),
    [buttons]
  );

  const secondaryEditableButtons = useMemo(
    () => buttons.slice(2, 4),
    [buttons]
  );

  const adminHeroEditableButtons = useMemo(
    () => buttons.slice(0, 4),
    [buttons]
  );

  const secondaryButtons = useMemo(
    () => buttons.slice(2, 4).filter((button) => button.is_visible),
    [buttons]
  );

  const heroButtons = useMemo(
    () => buttons.filter((button) => button.is_visible),
    [buttons]
  );

  const shouldShowOverviewCard = visibleOverviewPoints.length > 0 || secondaryButtons.length > 0;

  const saveCategoryField = async (payload: Partial<Category>) => {
    if (!categoryId) return;
    await supabase.from('categories').update(payload).eq('id', categoryId);
    setCategory((current) => (current ? { ...current, ...payload } : current));
  };

  const isGenericDetailHeading = (heading: string, categoryName?: string | null) => {
    const trimmed = heading.trim();
    if (!trimmed) return true;
    if (trimmed === 'About') return true;
    if (categoryName && trimmed === `About ${categoryName}`) return true;
    return false;
  };

  const isGenericDetailDescription = (description: string, categoryName?: string | null) => {
    const trimmed = description.trim();
    if (!trimmed) return true;
    if (categoryName && trimmed === `Explore all subcategories, download resources, and discover key features related to ${categoryName}.`) return true;
    return false;
  };

  useEffect(() => {
    if (!subcategoryId) return;

    const channels = [
      supabase.channel(`subcategory_brands_${subcategoryId}`).on('postgres_changes', { event: '*', schema: 'public', table: SUBCATEGORY_BRANDS_TABLE }, () => {
        supabase
          .from(SUBCATEGORY_BRANDS_TABLE as any)
          .select('*')
          .eq('subcategory_id', subcategoryId)
          .then(({ data }) => {
            const nextBrands = ((data || []) as any[]).map((brand) => ({
              id: brand.id,
              name: brand.name || '',
              link: brand.link || '',
              logo_url: brand.logo_url || null,
              description: brand.description || null,
              buttons: brand.buttons || [],
              sort_order: brand.sort_order ?? 0,
              primary_cta_label: brand.primary_cta_label,
              primary_cta_link: brand.primary_cta_link,
              primary_cta_visible: brand.primary_cta_visible,
              more_actions_label: brand.more_actions_label,
              more_actions_visible: brand.more_actions_visible,
              join_network_label: brand.join_network_label,
              join_network_link: brand.join_network_link,
              join_network_visible: brand.join_network_visible,
            }));
            setBrands(nextBrands);
          });
      }).subscribe(),
    ];

    return () => {
      channels.forEach((channel) => {
        supabase.removeChannel(channel);
      });
    };
  }, [subcategoryId]);

  useEffect(() => {
    if (!categoryId || !subcategoryId) return;

    let mounted = true;
    
    const loadData = async () => {
      const [{ data: categoryData }, { data: subcategoryData }, { data: downloadData }, { data: pricingPlansData }, { data: productData }, { data: buttonData }, { data: overviewPointData }, { data: brandData }, { data: aboutSectionsData }, { data: subcategorySectionsData }, { data: kfSectionsData }] = await Promise.all([
        supabase.from('categories').select('*').eq('id', categoryId).single(),
        supabase.from('subcategories').select('*').eq('id', subcategoryId).single(),
        supabase.from('subcategory_downloads' as any).select('*').eq('subcategory_id', subcategoryId),
        supabase.from('pricing_plans' as any).select('*').eq('subcategory_id', subcategoryId).order('sort_order'),
        supabase.from('category_products' as any).select('*').eq('category_id', categoryId).order('sort_order'),
        supabase.from('category_buttons').select('*').eq('subcategory_id', subcategoryId).order('sort_order'),
        supabase.from('subcategory_overview_points' as any).select('*').eq('subcategory_id', subcategoryId).order('sort_order'),
        supabase.from(SUBCATEGORY_BRANDS_TABLE as any).select('*').eq('subcategory_id', subcategoryId).order('sort_order'),
        supabase.from('subcategory_about_sections' as any).select('*').eq('subcategory_id', subcategoryId).order('sort_order'),
        supabase.from('subcategory_page_sections' as any).select('*').eq('subcategory_id', subcategoryId).order('sort_order'),
        supabase.from('subcategory_key_features_sections' as any).select('*').eq('subcategory_id', subcategoryId).order('sort_order'),
      ]);

      if (!mounted) return;

      if (categoryData) {
        setCategory(categoryData);
      }

      if (subcategoryData) {
        setSubcategory(subcategoryData as unknown as Subcategory);
        setVideoUrl((subcategoryData as any).video_url || '');
        setVideoUrl2((subcategoryData as any).video_url_2 || []);
        setFormLink((subcategoryData as any).form_link || '');
        setShowFormTab((subcategoryData as any).show_form_in_separate_tab || false);
        setAboutHeading((subcategoryData as any).about_heading || 'About');
        setAboutSubheading((subcategoryData as any).about_subheading || 'Talk to Solution Experts for Free.');
        setAboutContent((subcategoryData as any).about_content || '');
        setAboutBgColor((subcategoryData as any).about_bg_color || '#013737');
        setAboutHeadingColor((subcategoryData as any).about_heading_color || '#ffffff');
        setAboutSubheadingColor((subcategoryData as any).about_subheading_color || '#9af24d');
        setAboutDescriptionColor((subcategoryData as any).about_description_color || '#ffffff');
        setAboutButtonBgColor((subcategoryData as any).about_button_bg_color || '#16a34a');
        setAboutButtonTextColor((subcategoryData as any).about_button_text_color || '#ffffff');
        setOverviewPointsHeading((subcategoryData as any).key_features_tab_label || (subcategoryData as any).overview_points_heading || defaultOverviewPointsHeading);
        setDemoFormHeading((subcategoryData as any).demo_form_heading || 'See The Software In Action\nWatch Free Demo!');
        setDemoFormHeadingColor((subcategoryData as any).demo_form_heading_color || '#000000');
        setDemoButtonLabel((subcategoryData as any).demo_button_label || 'Get Free Advice');
        setShowOverviewPointsSection(true);
        const normalizedDetailHeading = isGenericDetailHeading((subcategoryData as any).detail_heading || '', subcategoryData.name)
          ? ''
          : (subcategoryData as any).detail_heading || '';
        const normalizedDetailDescription = isGenericDetailDescription((subcategoryData as any).detail_description || '', subcategoryData.name)
          ? ''
          : (subcategoryData as any).detail_description || '';
        setDetailHeading(normalizedDetailHeading);
        setDetailDescription(normalizedDetailDescription);
        setButtons(
          buttonData && buttonData.length > 0
            ? (buttonData as unknown as CategoryButton[])
            : defaultCategoryButtons.map((button, index) => ({
                id: `default-${index}`,
                subcategory_id: subcategoryId,
                label: button.label,
                link: button.link || null,
                is_visible: button.is_visible,
                sort_order: index,
              }))
        );
      }

      if (brandData && brandData.length > 0) {
        setBrands((brandData as unknown as BrandItem[]).map((brand) => ({
          id: brand.id,
          name: brand.name || '',
          link: brand.link || '',
          logo_url: brand.logo_url || null,
          description: brand.description || null,
          buttons: brand.buttons || [],
          sort_order: brand.sort_order ?? 0,
          primary_cta_label: brand.primary_cta_label,
          primary_cta_link: brand.primary_cta_link,
          primary_cta_visible: brand.primary_cta_visible,
          more_actions_label: brand.more_actions_label,
          more_actions_visible: brand.more_actions_visible,
          join_network_label: brand.join_network_label,
          join_network_link: brand.join_network_link,
          join_network_visible: brand.join_network_visible,
        })));
      } else {
        const storageKey = `subcategory-brands-${subcategoryId}`;
        const raw = localStorage.getItem(storageKey);
        if (raw) {
          try {
            const storedBrands: BrandItem[] = JSON.parse(raw);
            setBrands(storedBrands.sort((a, b) => a.sort_order - b.sort_order));
          } catch (error) {
            console.error('Failed to parse saved brands:', error);
            setBrands([]);
          }
        } else {
          setBrands([]);
        }
      }

      setOverviewPoints((overviewPointData as unknown as CategoryOverviewPoint[]) || []);
      setKeyFeaturesSections((kfSectionsData as unknown as SubcategoryKeyFeaturesSection[]) || []);
      setAboutSections((aboutSectionsData as unknown as SubcategoryAboutSection[]) || []);
      setSubcategorySections((subcategorySectionsData as unknown as SubcategoryPageSection[]) || []);
      setDownloads((downloadData as unknown as Download[]) || []);
      setPricingPlans((pricingPlansData as unknown as PricingPlan[]) || []);
    };

    loadData();

    const channel = supabase
      .channel(`subcategory_detail_${subcategoryId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories', filter: `id=eq.${categoryId}` }, loadData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subcategories', filter: `id=eq.${subcategoryId}` }, loadData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pricing_plans' as any, filter: `subcategory_id=eq.${subcategoryId}` }, loadData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subcategory_downloads', filter: `subcategory_id=eq.${subcategoryId}` }, loadData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'category_products', filter: `category_id=eq.${categoryId}` }, loadData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'category_buttons', filter: `subcategory_id=eq.${subcategoryId}` }, loadData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subcategory_overview_points' as any, filter: `subcategory_id=eq.${subcategoryId}` }, loadData)
      .on('postgres_changes', { event: '*', schema: 'public', table: SUBCATEGORY_BRANDS_TABLE, filter: `subcategory_id=eq.${subcategoryId}` }, loadData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subcategory_about_sections', filter: `subcategory_id=eq.${subcategoryId}` }, loadData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subcategory_page_sections', filter: `subcategory_id=eq.${subcategoryId}` }, loadData)
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [categoryId, subcategoryId]);

  const handleOverviewPointTextChange = (index: number, value: string) => {
    setOverviewPoints((current) => current.map((point, pointIndex) => (pointIndex === index ? { ...point, text: value } : point)));
  };

  const handleOverviewPointHighlightChange = (index: number, value: boolean) => {
    setOverviewPoints((current) =>
      current.map((point, pointIndex) => (pointIndex === index ? { ...point, is_highlighted: value } : point))
    );
  };

  const handleAddOverviewPoint = () => {
    if (!categoryId) return;

    setOverviewPoints((current) => [
      ...current,
      {
        id: `temp-${crypto.randomUUID()}`,
        subcategory_id: subcategoryId,
        text: '',
        is_highlighted: false,
        highlight_color: 'green',
        sort_order: current.length,
      },
    ]);
  };

  const handleRemoveOverviewPoint = (index: number) => {
    setOverviewPoints((current) => current.filter((_, pointIndex) => pointIndex !== index).map((point, pointIndex) => ({ ...point, sort_order: pointIndex })));
  };

  const handleOverviewPointDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setOverviewPoints((current) => {
      const oldIndex = current.findIndex((point) => point.id === active.id);
      const newIndex = current.findIndex((point) => point.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return current;

      return arrayMove(current, oldIndex, newIndex).map((point, pointIndex) => ({
        ...point,
        sort_order: pointIndex,
      }));
    });
  };

  const handleSaveAll = async () => {
    if (!categoryId || !category) return;
    setIsSaving(true);

    try {
      if (subcategoryId) {
        await supabase
          .from('subcategories')
          .update({
            video_url: videoUrl.trim() || null,
            video_url_2: videoUrl2.filter(url => url?.trim()).map(url => url.trim()) || null,
            form_link: formLink.trim() || null,
            show_form_in_separate_tab: showFormTab,
            about_heading: aboutHeading.trim() || 'About',
            about_content: aboutContent.trim() || null,
            about_bg_color: aboutBgColor || null,
            about_heading_color: aboutHeadingColor || null,
            about_subheading_color: aboutSubheadingColor || null,
            about_description_color: aboutDescriptionColor || null,
            about_button_bg_color: aboutButtonBgColor || null,
            about_button_text_color: aboutButtonTextColor || null,
            overview_points_heading: overviewPointsHeading.trim() || defaultOverviewPointsHeading,
            key_features_tab_label: overviewPointsHeading.trim() || defaultOverviewPointsHeading,
            pricing_plans_tab_label: pricingPlansTabLabel.trim() || 'Pricing Plans',
            detail_heading:
              !isGenericDetailHeading(detailHeading.trim(), subcategory?.name || '') && detailHeading.trim()
                ? detailHeading.trim()
                : null,
          } as any)
          .eq('id', subcategoryId);
      }

      await supabase.from('subcategory_overview_points' as any).delete().eq('subcategory_id', subcategoryId);

      const overviewPointPayloads = overviewPoints
        .map((point, index) => ({
          subcategory_id: subcategoryId,
          text: point.text.trim(),
          is_highlighted: point.is_highlighted,
          highlight_color: point.highlight_color || 'green',
          sort_order: index,
        }))
        .filter((point) => point.text.length > 0);

      if (overviewPointPayloads.length > 0) {
        await supabase.from('subcategory_overview_points' as any).insert(overviewPointPayloads);
      }

      const [{ data: refreshedButtons }, { data: refreshedOverviewPoints }] = await Promise.all([
        supabase.from('category_buttons').select('*').eq('subcategory_id', subcategoryId).order('sort_order'),
        supabase.from('subcategory_overview_points' as any).select('*').eq('subcategory_id', subcategoryId).order('sort_order'),
      ]);

      if (refreshedButtons) setButtons(refreshedButtons);
      if (refreshedOverviewPoints) setOverviewPoints(refreshedOverviewPoints as unknown as CategoryOverviewPoint[]);
      toast.success('Overview updated.');
    } catch (error: any) {
      console.error('Error saving subcategory detail:', error);
      const message = error?.message || 'Save failed.';
      toast.error(`Failed to save changes: ${message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const renderBrandGrid = () => {
    const detailedBrands = brands.filter(
      (b) => b.logo_url || (b.description && b.description.trim()) || (b.buttons && b.buttons.length > 0)
    );
    const simpleBrands = brands.filter((b) => !detailedBrands.some((db) => db.id === b.id));

    return (
      <div className="space-y-8">
        {/* Detailed Brands Section */}
        {detailedBrands.length > 0 && (
          <div className="grid grid-cols-1 gap-8">
            {detailedBrands.map((brand, bIndex) => (
              <div
                key={brand.id}
                className={`flex flex-col ${
                  bIndex !== detailedBrands.length - 1 ? 'border-b border-border/50 pb-8' : ''
                }`}
              >
                <div className="flex flex-col md:flex-row items-start gap-4 md:gap-6">
                  {/* Logo and Name row for mobile */}
                  <div className="flex flex-row md:flex-col items-center md:items-start gap-4 md:gap-0 w-full md:w-auto">
                    {/* Logo */}
                    <div className="flex h-20 w-20 md:h-24 md:w-40 flex-shrink-0 items-center justify-center rounded-xl border border-border/50 p-3 md:p-4 shadow-sm" style={{ backgroundColor: '#F2F1F6' }}>
                      {brand.logo_url ? (
                        <img src={brand.logo_url} alt={brand.name} className="h-full w-full object-contain" />
                      ) : (
                        <Image className="h-8 w-8 md:h-10 md:w-10 text-muted-foreground/20" />
                      )}
                    </div>
                    
                    {/* Name for mobile - shows next to logo */}
                    <div className="md:hidden">
                      <h3 className={`${SECTION_HEADING_CLASS} !mb-0 text-lg`}>{brand.name}</h3>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 w-full">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                      {/* Name for desktop - shows in right column */}
                      <h3 className={`hidden md:block ${SECTION_HEADING_CLASS} !mb-0`}>{brand.name}</h3>

                      {/* Main Action Buttons (Desktop Top Right) */}
                      <div className="hidden md:flex flex-wrap items-center gap-3">
                        {/* Button 1: Primary CTA */}
                        {brand.primary_cta_visible && brand.primary_cta_label && (() => {
                          const href = normalizeExternalUrl(brand.primary_cta_link || '');
                          return href ? (
                            <a
                              href={href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center gap-2 px-4 py-2 md:px-6 md:py-2.5 rounded-lg bg-[#2563EB] text-white text-sm md:text-[15px] font-semibold transition-all hover:bg-blue-700 shadow-sm"
                            >
                              <span>{brand.primary_cta_label}</span>
                              <ArrowUpRight className="h-4 w-4" />
                            </a>
                          ) : (
                            <div className="inline-flex items-center justify-center gap-2 px-4 py-2 md:px-6 md:py-2.5 rounded-lg bg-[#2563EB]/50 text-white/70 text-sm md:text-[15px] font-semibold cursor-not-allowed shadow-sm">
                              <span>{brand.primary_cta_label}</span>
                              <ArrowUpRight className="h-4 w-4" />
                            </div>
                          );
                        })()}

                        {/* Button 2: More Actions (Toggle for existing buttons) */}
                        {brand.more_actions_visible && (
                          <button
                            onClick={() => setOpenMoreActionsBrandId(openMoreActionsBrandId === brand.id ? null : brand.id)}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2 md:px-6 md:py-2.5 rounded-lg bg-white border border-border text-foreground text-sm md:text-[15px] font-semibold transition-all hover:bg-muted/50 shadow-sm"
                          >
                            <span>{brand.more_actions_label || 'More Actions'}</span>
                            {openMoreActionsBrandId === brand.id ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </button>
                        )}

                        {/* Button 3: Join Network */}
                        {brand.join_network_visible && brand.join_network_label && (() => {
                          const href = normalizeExternalUrl(brand.join_network_link || '');
                          return href ? (
                            <a
                              href={href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center gap-2 px-4 py-2 md:px-6 md:py-2.5 rounded-lg bg-white border border-border text-foreground text-sm md:text-[15px] font-medium transition-all hover:bg-muted/50 shadow-sm"
                            >
                              <Plus className="h-4 w-4 text-muted-foreground" />
                              <span>{brand.join_network_label}</span>
                            </a>
                          ) : (
                            <div className="inline-flex items-center justify-center gap-2 px-4 py-2 md:px-6 md:py-2.5 rounded-lg bg-white/50 border border-border/50 text-foreground/50 text-sm md:text-[15px] font-medium cursor-not-allowed shadow-sm">
                              <Plus className="h-4 w-4 text-muted-foreground/30" />
                              <span>{brand.join_network_label}</span>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                    
                    {brand.description && brand.description.trim() && (
                      <p 
                        className="text-[16px] leading-relaxed text-muted-foreground mb-5"
                        style={{ fontFamily: 'Arial, sans-serif' }}
                      >
                        {brand.description}
                      </p>
                    )}

                    {/* Brand CTA Section */}
                    <div className="flex flex-col gap-4">
                      {/* Main Action Buttons (Mobile / Fallback) */}
                      <div className="flex md:hidden flex-wrap items-center gap-3">
                        {/* Button 1: Primary CTA */}
                        {brand.primary_cta_visible && brand.primary_cta_label && (() => {
                          const href = normalizeExternalUrl(brand.primary_cta_link || '');
                          return href ? (
                            <a
                              href={href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center gap-2 px-4 py-2 md:px-6 md:py-2.5 rounded-lg bg-[#2563EB] text-white text-sm md:text-[15px] font-semibold transition-all hover:bg-blue-700 shadow-sm"
                            >
                              <span>{brand.primary_cta_label}</span>
                              <ArrowUpRight className="h-4 w-4" />
                            </a>
                          ) : (
                            <div className="inline-flex items-center justify-center gap-2 px-4 py-2 md:px-6 md:py-2.5 rounded-lg bg-[#2563EB]/50 text-white/70 text-sm md:text-[15px] font-semibold cursor-not-allowed shadow-sm">
                              <span>{brand.primary_cta_label}</span>
                              <ArrowUpRight className="h-4 w-4" />
                            </div>
                          );
                        })()}

                        {/* Button 2: More Actions (Toggle for existing buttons) */}
                        {brand.more_actions_visible && (
                          <button
                            onClick={() => setOpenMoreActionsBrandId(openMoreActionsBrandId === brand.id ? null : brand.id)}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2 md:px-6 md:py-2.5 rounded-lg bg-white border border-border text-foreground text-sm md:text-[15px] font-semibold transition-all hover:bg-muted/50 shadow-sm"
                          >
                            <span>{brand.more_actions_label || 'More Actions'}</span>
                            {openMoreActionsBrandId === brand.id ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </button>
                        )}

                        {/* Button 3: Join Network */}
                        {brand.join_network_visible && brand.join_network_label && (() => {
                          const href = normalizeExternalUrl(brand.join_network_link || '');
                          return href ? (
                            <a
                              href={href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center gap-2 px-4 py-2 md:px-6 md:py-2.5 rounded-lg bg-white border border-border text-foreground text-sm md:text-[15px] font-medium transition-all hover:bg-muted/50 shadow-sm"
                            >
                              <Plus className="h-4 w-4 text-muted-foreground" />
                              <span>{brand.join_network_label}</span>
                            </a>
                          ) : (
                            <div className="inline-flex items-center justify-center gap-2 px-4 py-2 md:px-6 md:py-2.5 rounded-lg bg-white/50 border border-border/50 text-foreground/50 text-sm md:text-[15px] font-medium cursor-not-allowed shadow-sm">
                              <Plus className="h-4 w-4 text-muted-foreground/30" />
                              <span>{brand.join_network_label}</span>
                            </div>
                          );
                        })()}
                      </div>

                      {/* Expanded Existing CTA Buttons */}
                      {openMoreActionsBrandId === brand.id && brand.buttons && brand.buttons.filter(btn => btn.is_visible !== false).length > 0 && (
                        <div className="grid grid-cols-2 md:flex md:flex-wrap gap-3 pt-2 animate-in fade-in slide-in-from-top-2 duration-200">
                          {brand.buttons
                            .filter(btn => btn.is_visible !== false)
                            .map((button, index) => {
                              let buttonStyle = '';
                              if (index === 0) {
                                buttonStyle = 'bg-[#E62415] text-white border border-[#E62415] hover:bg-white hover:text-[#E62415]';
                              } else if (index === 1) {
                                buttonStyle = 'bg-white text-[#111111] border border-[#E5E7EB] hover:border-[#111111] hover:bg-gray-50';
                              } else if (index === 2) {
                                buttonStyle = 'bg-[#17313B] text-white border border-[#17313B] hover:bg-white hover:text-[#17313B]';
                              } else if (index === 3) {
                                buttonStyle = 'bg-white text-[#111111] border border-[#E5E7EB] hover:border-[#111111] hover:bg-gray-50';
                              } else {
                                buttonStyle = 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50';
                              }

                              return (
                                <a
                                  key={button.id || index}
                                  href={normalizeExternalUrl(button.link || '') || '#'}
                                  target={button.link ? '_blank' : undefined}
                                  rel={button.link ? 'noopener noreferrer' : undefined}
                                  className={`
                                    inline-flex items-center justify-center gap-1.5 md:gap-2 px-3 py-2 md:px-5 md:py-2.5 rounded-lg text-[13px] md:text-[14px] font-semibold transition-all duration-200 shadow-sm w-full md:w-auto
                                    ${buttonStyle}
                                  `}
                                >
                                  <span className="truncate">{button.label}</span>
                                  <ArrowUpRight className="h-3.5 w-3.5 flex-shrink-0" />
                                </a>
                              );
                            })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Simple Brands Section (Old UI Style) */}
        {simpleBrands.length > 0 && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {simpleBrands.map((brand) => {
              const externalUrl = normalizeExternalUrl(brand.link || '');
              const brandBoxClassName =
                'rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-md group';
              const content = (
                <span className="block max-w-full text-base font-medium text-foreground transition-colors group-hover:text-primary">
                  {brand.name || 'Unnamed brand'}
                </span>
              );

              if (externalUrl) {
                return (
                  <a
                    key={brand.id}
                    href={externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={brandBoxClassName}
                  >
                    {content}
                  </a>
                );
              }

              return (
                <div key={brand.id} className={brandBoxClassName}>
                  {content}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderDownloadGrid = () => (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
      {downloads.map((download) => (
        <a
          key={download.id}
          href={download.file_url}
          download
          className="flex items-center rounded-xl border border-border/50 bg-background px-4 py-2 text-left text-sm md:text-base text-foreground font-normal transition-all hover:border-primary/50 hover:shadow-md hover:text-primary hover:underline"
        >
          <span>{download.file_name}</span>
        </a>
      ))}
    </div>
  );

  const renderHeaderPoints = (sectionId?: string) => {
    const sectionPoints = visibleOverviewPoints.filter(p => p.section_id === sectionId);

    if (sectionPoints.length === 0) return null;

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {(activeTabKey === 'overview' && !showAllOverviewPoints ? sectionPoints.slice(0, INITIAL_OVERVIEW_POINTS_COUNT) : sectionPoints).map((point) => (
            <div
              key={point.id}
              className={`flex items-center gap-3 rounded-xl border border-border/50 px-4 py-2 text-left text-sm md:text-base text-foreground font-normal transition-all hover:text-primary ${
                point.is_highlighted
                  ? 'bg-white'
                  : 'bg-background'
              }`}
            >
              {point.is_highlighted && (
                <CheckCircle2
                  className={`h-4 w-4 md:h-5 md:w-5 flex-shrink-0 ${
                    point.highlight_color === 'blue' ? 'text-blue-600' : 'text-emerald-600'
                  }`}
                />
              )}
              <span>{point.text}</span>
            </div>
          ))}
        </div>
        {activeTabKey === 'overview' && sectionPoints.length > INITIAL_OVERVIEW_POINTS_COUNT && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setShowAllOverviewPoints((current) => !current)}
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
            >
              {showAllOverviewPoints ? 'View Less' : 'View All'}
              {showAllOverviewPoints ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderPricingPlans = () => (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {pricingPlans.filter(p => p.is_visible !== false).map((plan) => (
        <div
          key={plan.id}
          className={`relative rounded-2xl border-2 p-6 transition-all ${
            plan.is_popular && !plan.card_bg_color
              ? 'border-primary bg-primary/5 shadow-lg scale-105'
              : 'border-border bg-background hover:border-primary/50'
          }`}
          style={plan.card_bg_color ? { backgroundColor: plan.card_bg_color, borderColor: plan.is_popular ? 'var(--primary)' : undefined } : {}}
        >
          {plan.is_popular && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-semibold text-primary-foreground">
              Popular
            </div>
          )}
          <div className="mb-4 text-center">
            <h3 className="text-xl font-bold text-foreground">{plan.plan_name}</h3>
            <div className="mt-2 flex items-baseline justify-center gap-1">
              <span className="text-3xl font-bold text-foreground">{plan.currency || '₹'}{plan.price}</span>
            <span className="text-[15px] text-muted-foreground">{plan.duration}</span>
          </div>
        </div>
        {plan.description && (
          <p className="mb-4 text-center text-[15px] text-muted-foreground">{plan.description}</p>
        )}
        <ul className="mb-6 space-y-3">
          {(plan.features || []).filter(f => f && f.trim()).map((feature, idx) => (
            <li key={idx} className="flex items-start gap-2 text-[15px] text-foreground">
              <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
          <a
            href={plan.razorpay_link || plan.button_link || '#'}
            target={plan.button_link ? '_blank' : undefined}
            rel={plan.button_link ? 'noopener noreferrer' : undefined}
            className={`block w-full rounded-xl px-4 py-3 text-center text-sm font-semibold transition-all ${
              !plan.button_bg_color && plan.is_popular
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : !plan.button_bg_color ? 'bg-secondary text-secondary-foreground hover:bg-secondary/80' : ''
            }`}
            style={plan.button_bg_color ? { backgroundColor: plan.button_bg_color, color: 'white' } : {}}
          >
            {plan.button_label}
          </a>
        </div>
      ))}
    </div>
  );

  if (!category || !subcategory) {
    return <div className="flex min-h-[100dvh] items-center justify-center">Loading...</div>;
  }

  return (
    <div className="flex flex-col bg-background min-h-screen">
      <Header />
        <main className="flex-1">
            {/* Hero Section with colored background and video */}
        <div 
          className="relative w-full max-w-none overflow-hidden border-b border-border"
          style={subcategory?.hero_background_color ? { backgroundColor: subcategory.hero_background_color } : undefined}
        >
          <div className="container mx-auto px-4 md:px-8 lg:px-10">
            <div className="flex w-full flex-col gap-y-6 pb-12 pt-12">
              <div className="flex-1 min-w-0 flex flex-col items-start justify-start gap-3 text-left">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
                  <ChevronRight className="h-3 w-3" />
                  <Link to={`/category/${category.id}/subcategories`} className="hover:text-foreground transition-colors">{category.name}</Link>
                  <ChevronRight className="h-3 w-3" />
                  <span className="text-foreground font-medium">{subcategory.name}</span>
                </div>

                {/* Category Name below breadcrumb */}
                <div className="text-sm md:text-base text-muted-foreground mb-2">
                  {category.name}
                </div>

                {/* Logo */}
                {category.icon_url && (
                  <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-[#e9ddff] shadow-sm mb-2">
                    <img src={category.icon_url} alt={category.name} className="h-11 w-11 object-contain" />
                  </div>
                )}

                {/* Subcategory Name */}
                <div className="min-w-0 mb-1">
                  <h1 className="break-words whitespace-normal font-inter font-bold text-[32px] leading-[40px] text-[#111111]">
                    {subcategory.name}
                  </h1>
                </div>

                {/* Description */}
                {detailDescription.trim() && (
                  <div className="mb-2 w-full">
                    <p className={`max-w-xl whitespace-pre-wrap ${SECTION_SUBTEXT_CLASS}`}>
                      {detailDescription}
                    </p>
                  </div>
                )}

                {/* Hero Buttons */}
                {heroButtons.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-3">
                    {heroButtons.map((button, index) => {
                      let buttonStyle = "";
                      if (index === 0) {
                        buttonStyle = "bg-[#E62415] text-white border border-[#E62415] hover:bg-white hover:text-[#E62415]";
                      } else if (index === 1) {
                        buttonStyle = "bg-white text-[#111111] border border-[#E5E7EB] hover:border-[#111111] hover:bg-gray-50";
                      } else if (index === 2) {
                        buttonStyle = "bg-[#17313B] text-white border border-[#17313B] hover:bg-white hover:text-[#17313B]";
                      } else if (index === 3) {
                        buttonStyle = "bg-white text-[#111111] border border-[#E5E7EB] hover:border-[#111111] hover:bg-gray-50";
                      } else {
                        buttonStyle = "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50";
                      }

                      return (
                        <a
                          key={button.id}
                          href={normalizeExternalUrl(button.link || '') || '#'}
                          target={button.link ? '_blank' : undefined}
                          rel={button.link ? 'noopener noreferrer' : undefined}
                          className={`
                            inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 shadow-sm
                            ${buttonStyle}
                          `}
                        >
                          {button.label}
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="border-b border-border bg-card">
          <div className="container mx-auto px-4 md:px-8 lg:px-10">
            <div className="flex gap-1 overflow-x-auto">
              {tabs.map((tab, index) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(index)}
                  className={`whitespace-nowrap border-b-2 px-5 py-3 text-sm font-medium transition-colors ${
                    activeTab === index ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {tab.icon}
                    {tab.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="w-full bg-slate-50 py-8">
          <div className="container mx-auto px-4 md:px-8 lg:px-10">
            {activeTabKey === 'overview' && (
              <div className="w-full space-y-5">
                {aboutSections
                  .filter((section) => section.is_visible !== false)
                  .map((section) => (
                  <div
                    key={section.id}
                    className={`w-full rounded-none border border-border px-6 md:px-8 shadow-sm text-left ${
                      section.heading ? 'pt-3 pb-4' : 'py-6 md:py-8'
                    }`}
                    style={{ backgroundColor: section.background_color || '#ffffff' }}
                  >
                    {section.heading && (
                      <h2 className={SECTION_HEADING_CLASS} style={{ color: section.heading_color || '#111111' }}>{section.heading}</h2>
                    )}
                    <div
                      className={RICH_HTML_CONTENT_CLASS}
                      dangerouslySetInnerHTML={{ __html: section.content || '' }}
                    />
                  </div>
                ))}

                {/* Multi-section Key Features */}
                {keyFeaturesSections
                  .filter(section => section.is_visible)
                  .map((section) => (
                  <div 
                    key={section.id} 
                    className={`w-full rounded-none border border-border bg-card px-6 md:px-8 shadow-sm ${
                      section.heading ? 'pt-3 pb-4' : 'py-6 md:py-8'
                    }`}
                  >
                    {section.heading && (
                      <h2 className={SECTION_HEADING_CLASS}>{section.heading}</h2>
                    )}
                    {renderHeaderPoints(section.id)}
                  </div>
                ))}

                {/* Legacy/Fallback Overview Card (only if no sections exist) */}
                {keyFeaturesSections.length === 0 && shouldShowOverviewCard && showOverviewPointsSection && showHeaderPointsSection && visibleOverviewPoints.length > 0 && (
                  <div className="w-full rounded-none border border-border bg-card pt-3 pb-4 px-6 md:pl-8 shadow-sm">
                    <h2 className={SECTION_HEADING_CLASS}>
                      {subcategory?.key_features_tab_label || defaultOverviewPointsHeading}
                    </h2>
                    {renderHeaderPoints()}
                  </div>
                )}

                {/* Video Resources in Overview - only show when Resources tab is visible */}
                {showResourcesTab && videoUrl2.filter(url => url?.trim()).length > 0 && (
                  <div className="w-full rounded-none border border-border bg-card p-6 shadow-sm">
                    <h2 className={SECTION_HEADING_CLASS}>{resourcesTabLabel}</h2>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {videoUrl2.filter(url => url?.trim()).map((url, index) => {
                        const youtubeId = getYouTubeVideoId(url);
                        const isYouTube = youtubeId !== null;

                        return (
                          <div key={index} className="w-full overflow-hidden rounded-xl border border-border bg-card">
                            <div className="group relative aspect-video bg-muted">
                              {isYouTube ? (
                                <iframe
                                  src={getYouTubeEmbedUrl(youtubeId)}
                                  title={`Video Resource ${index + 1}`}
                                  className="h-full w-full"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                />
                              ) : (
                                <>
                                  <video
                                    src={url}
                                    className="h-full w-full object-cover"
                                    controls
                                    preload="metadata"
                                    poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 9'%3E%3Crect fill='%23e5e7eb' width='16' height='9'/%3E%3C/svg%3E"
                                  />
                                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/40 transition-colors group-hover:bg-black/50">
                                    <div className="cursor-pointer rounded-full bg-primary p-5 text-primary-foreground transition-transform group-hover:scale-110">
                                      <Play className="h-6 w-6 fill-current" />
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {showDownloadsTab && (
                  <div className="w-full rounded-none border border-border bg-card pt-3 pb-4 px-6 md:pl-8 shadow-sm">
                    <h2 className={SECTION_HEADING_CLASS}>{downloadsTabLabel}</h2>
                    {downloads.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No downloads available.</p>
                    ) : (
                      renderDownloadGrid()
                    )}
                  </div>
                )}

                {showBrandsInOverview && (
                  <div className="w-full rounded-none border border-border bg-card pt-3 pb-4 px-6 md:pl-8 shadow-sm">
                    <h2 className={SECTION_HEADING_CLASS}>{brandsTabLabel}</h2>
                    {brands.length > 0 ? (
                      renderBrandGrid()
                    ) : (
                      <p className="text-sm text-muted-foreground">No brands available yet.</p>
                    )}
                  </div>
                )}

                {showPricingPlansInOverview && (
                  <div className="w-full rounded-none border border-border bg-card pt-3 pb-4 px-6 md:pl-8 shadow-sm">
                    <h2 className={SECTION_HEADING_CLASS}>{pricingPlansTabLabel}</h2>
                    {renderPricingPlans()}
                  </div>
                )}

                {productItems.length > 0 && (
                  <div className="w-full rounded-none border border-border bg-card pt-3 pb-4 px-6 md:pl-8 shadow-sm">
                    <h2 className={SECTION_HEADING_CLASS}>Products</h2>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {productItems.map((product) => (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => {
                            const externalUrl = normalizeExternalUrl(product.link);
                            if (externalUrl) {
                              window.open(externalUrl, '_blank', 'noopener,noreferrer');
                            }
                          }}
                          className="group flex items-center justify-between rounded-xl border border-border/50 bg-card px-5 py-2 text-left transition-all hover:border-primary/50 hover:shadow-md"
                        >
                          <span className="truncate pr-4 text-sm md:text-base font-normal text-foreground group-hover:text-primary group-hover:underline">{product.title}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {subcategorySections
                  .filter((section) => section.is_visible !== false)
                  .sort((a, b) => a.sort_order - b.sort_order)
                  .map((section) => {
                    if (section.section_type === 'cards') {
                      return (
                        <FeaturedCards
                          key={section.id}
                          sectionId={section.id}
                          sectionTable="subcategory_page_sections"
                          cardsTable="subcategory_featured_cards"
                          hideSeeAllOnMobile={true}
                          compact
                          backgroundColor={section.background_color}
                          headingClassName={SECTION_HEADING_CLASS}
                        />
                      );
                    }
                    if (section.section_type === 'offers') {
                      return (
                        <OffersSection
                          key={section.id}
                          sectionId={section.id}
                          sectionTable="subcategory_page_sections"
                          offersTable="subcategory_offers"
                          compact
                          isSubcategory={true}
                          backgroundColor={section.background_color}
                          headingClassName={SECTION_HEADING_CLASS}
                        />
                      );
                    }
                    if (section.section_type === 'ads_1col') {
                      return (
                        <Ads1ColSection
                          key={section.id}
                          sectionId={section.id}
                          sectionTable="subcategory_page_sections"
                          adsTable="subcategory_ads_2col"
                          compact
                          backgroundColor={section.background_color}
                          headingClassName={SECTION_HEADING_CLASS}
                        />
                      );
                    }
                    if (section.section_type === 'ads_2col') {
                      return (
                        <Ads2ColSection
                          key={section.id}
                          sectionId={section.id}
                          sectionTable="subcategory_page_sections"
                          adsTable="subcategory_ads_2col"
                          compact
                          backgroundColor={section.background_color}
                          headingClassName={SECTION_HEADING_CLASS}
                        />
                      );
                    }
                    if (section.section_type === 'ads_3col') {
                      return (
                        <Ads3ColSection
                          key={section.id}
                          sectionId={section.id}
                          sectionTable="subcategory_page_sections"
                          adsTable="subcategory_ads_3col"
                          compact
                          backgroundColor={section.background_color}
                          headingClassName={SECTION_HEADING_CLASS}
                        />
                      );
                    }
                    if (section.section_type === 'logo_steps') {
                      return (
                        <LogoStepsSection
                          key={section.id}
                          sectionId={section.id}
                          sectionTable="subcategory_page_sections"
                          stepsTable="subcategory_logo_steps"
                          compact
                          backgroundColor={section.background_color}
                          headingClassName={SECTION_HEADING_CLASS}
                        />
                      );
                    }
                    return null;
                  })}
            </div>
          )}


          {activeTabKey === 'key_features' && showHeaderPointsTab && (
            <div className="w-full space-y-8">
              {keyFeaturesSections
                .filter(section => section.is_visible)
                .map((section) => (
                <div 
                  key={section.id}
                  className={section.heading ? '' : 'py-6 md:py-8'}
                >
                  {section.heading && (
                    <h2 className={SECTION_HEADING_CLASS}>{section.heading}</h2>
                  )}
                  {renderHeaderPoints(section.id)}
                </div>
              ))}
              
              {/* Legacy fallback if no sections defined but points exist */}
              {keyFeaturesSections.length === 0 && (
                <div>
                  <h2 className={SECTION_HEADING_CLASS}>
                    {subcategory?.key_features_tab_label || 'Key Features'}
                  </h2>
                  {renderHeaderPoints()}
                </div>
              )}
            </div>
          )}

          {activeTabKey === 'resources' && showResourcesTab && (
            <div className="w-full">
              <h2 className={SECTION_HEADING_CLASS}>{resourcesTabLabel}</h2>
              {videoUrl2.filter(url => url?.trim()).length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No resources available.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {videoUrl2.filter(url => url?.trim()).map((url, index) => {
                    const youtubeId = getYouTubeVideoId(url);
                    const isYouTube = youtubeId !== null;

                    return (
                      <div key={index} className="w-full overflow-hidden rounded-xl border border-border bg-card">
                        <div className="group relative aspect-video bg-muted">
                          {isYouTube ? (
                            <iframe
                              src={getYouTubeEmbedUrl(youtubeId)}
                              title={`Video Resource ${index + 1}`}
                              className="h-full w-full"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          ) : (
                            <>
                              <video
                                src={url}
                                className="h-full w-full object-cover"
                                controls
                                preload="metadata"
                                poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 9'%3E%3Crect fill='%23e5e7eb' width='16' height='9'/%3E%3C/svg%3E"
                              />
                              <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/40 transition-colors group-hover:bg-black/50">
                                <div className="cursor-pointer rounded-full bg-primary p-5 text-primary-foreground transition-transform group-hover:scale-110">
                                  <Play className="h-6 w-6 fill-current" />
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                                              </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTabKey === 'downloads' && showDownloadsTab && (
            <div className="w-full">
              <h2 className={SECTION_HEADING_CLASS}>{downloadsTabLabel}</h2>

              {downloads.length === 0 ? (
                <p className="text-sm text-muted-foreground">No downloads available.</p>
              ) : (
                renderDownloadGrid()
              )}
            </div>
          )}


          {activeTabKey === 'brands' && showBrandsTab && (
            <div className="w-full">
              <h2 className={SECTION_HEADING_CLASS}>{brandsTabLabel}</h2>
              {brands.length > 0 ? (
                renderBrandGrid()
              ) : (
                <p className="text-sm text-muted-foreground">No brands available yet.</p>
              )}
            </div>
          )}

          {activeTabKey === 'pricing' && showPricingPlansTab && (
            <div className="w-full">
              <h2 className={SECTION_HEADING_CLASS}>{pricingPlansTabLabel}</h2>
              {renderPricingPlans()}
            </div>
          )}

          {activeTabKey === 'form' && showFormAsTab && formLink.trim() && (
            <div className="w-full">
              <h2 className={SECTION_HEADING_CLASS}>Form</h2>
              <a 
                href={formLink.trim()} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                Open form in new tab
                <ArrowUpRight className="h-4 w-4" />
              </a>
            </div>
          )}
        </div>
        </div>
      </main>

      {showAboutSection && !subcategory?.custom_link && (
        <section className="pb-6 md:pb-8">
          <div className="container mx-auto px-4 md:px-8 lg:px-10">
            <div 
              className="rounded-none py-6 md:py-10 px-6 md:px-12 shadow-sm"
              style={{ backgroundColor: aboutBgColor }}
            >
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:items-start md:gap-10">
              <div className="md:pl-4">
                <div 
                  className="mb-5 inline-flex h-16 w-16 items-center justify-center rounded-full"
                  style={{ backgroundColor: `${aboutHeadingColor}e6`, color: aboutBgColor }}
                >
                  {subcategory?.link?.trim() ? (
                    <img src={subcategory.link.trim()} alt="Contact" className="h-8 w-8 object-contain" />
                  ) : (
                    <Mail className="h-5 w-5" />
                  )}
                </div>
                <h3 
                  className={`max-w-[560px] ${SECTION_HEADING_CLASS}`}
                  style={{ color: aboutHeadingColor }}
                >
                  {(aboutHeading || '').trim() || 'Need Help Deciding?'}
                </h3>
                <p 
                  className={`mt-3 ${SECTION_SUBTEXT_CLASS} font-semibold`}
                  style={{ color: aboutSubheadingColor }}
                >
                  {aboutSubheading}
                </p>
                <p 
                  className={`mt-5 max-w-[560px] ${SECTION_SUBTEXT_CLASS}`}
                  style={{ color: aboutDescriptionColor }}
                >
                  {(aboutContent || '').trim() || "We'll help you find the right tools that fit your budget and business needs. Just fill in the form and we'll get back to you."}
                </p>
              </div>
              <div className="flex justify-center md:justify-center">
                <WatchDemoForm 
                  subcategoryId={subcategoryId} 
                  demoLink={subcategory?.schedule_link} 
                  demoFormHeading={demoFormHeading} 
                  demoFormHeadingColor={demoFormHeadingColor}
                  demoButtonLabel={demoButtonLabel}
                  buttonBgColor={aboutButtonBgColor}
                  buttonTextColor={aboutButtonTextColor}
                />
              </div>
            </div>
            </div>
          </div>
        </section>
      )}

      {showVideoFullscreen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black p-4">
          <button type="button" onClick={() => setShowVideoFullscreen(false)} className="absolute right-4 top-4 rounded-lg p-2 transition-colors hover:bg-white/10" title="Close">
            <X className="h-6 w-6 text-white" />
          </button>
          <video
            src={videoUrl}
            controls
            autoPlay
            preload="auto"
            crossOrigin="anonymous"
            className="max-h-full max-w-full"
            style={{ width: '95vw', height: '95vh', objectFit: 'contain' }}
          />
        </div>
      )}

      <Footer />
    </div>
  );
}

