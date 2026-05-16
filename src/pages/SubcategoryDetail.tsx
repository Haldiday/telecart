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
  ChevronDown,
  ChevronUp,
  Info,
  Play,
  Maximize2,
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
  { label: 'Try For Free', link: null, is_visible: true },
  { label: 'Get Quote', link: null, is_visible: true },
  { label: 'Call Now', link: null, is_visible: true },
  { label: 'Contact', link: null, is_visible: true },
];

const defaultOverviewPointsHeading = 'Header';

interface Subcategory {
  id: string;
  name: string;
  link: string | null;
  custom_link?: string | null;
  video_url?: string | null;
  video_url_2?: string[] | null;
  schedule_link?: string | null;
  schedule_link_2?: string | null;
  show_schedule_2_in_separate_tab?: boolean;
  show_schedule_in_separate_tab?: boolean;
  form_link?: string | null;
  show_form_in_separate_tab?: boolean;
  about_heading?: string | null;
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
  hero_background_color?: string | null;
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
  sort_order: number;
}

interface CategoryOverviewPoint {
  id: string;
  category_id: string;
  text: string;
  is_highlighted: boolean;
  highlight_color?: 'green' | 'blue';
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
  'rich-html-content font-inter font-normal text-[20px] leading-[32px] text-[#333333] prose prose-sm max-w-none ' +
  '[&_h2]:font-inter [&_h2]:font-bold [&_h2]:text-[32px] [&_h2]:leading-[40px] [&_h2]:text-[#111111] [&_h2]:mb-4 [&_p]:whitespace-pre-wrap [&_p]:mb-4 [&_p]:min-h-[1.5em] ' +
  '[&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:bg-muted/60 ' +
  '[&_blockquote]:px-4 [&_blockquote]:py-3 [&_blockquote]:my-4 [&_blockquote]:italic ' +
  '[&_blockquote_p]:my-0 [&_blockquote_p]:whitespace-normal ' +
  '[&_.rich-blockquote]:border-l-4 [&_.rich-blockquote]:border-primary [&_.rich-blockquote]:bg-muted/60 ' +
  '[&_.rich-blockquote]:px-4 [&_.rich-blockquote]:py-3 [&_.rich-blockquote]:my-4 [&_.rich-blockquote]:italic ' +
  '[&_strong]:font-semibold [&_em]:italic [&_u]:underline [&_a]:text-primary [&_a]:hover:underline';

const SECTION_HEADING_CLASS = 'font-inter font-bold text-[32px] leading-[40px] text-[#111111] mb-6';
const SECTION_SUBTEXT_CLASS = 'font-inter font-normal text-[20px] leading-[32px] text-[#333333]';

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
  const [aboutHeading, setAboutHeading] = useState('About');
  const [aboutContent, setAboutContent] = useState('');
  const [aboutBgColor, setAboutBgColor] = useState('#013737');
  const [aboutHeadingColor, setAboutHeadingColor] = useState('#ffffff');
  const [aboutSubheadingColor, setAboutSubheadingColor] = useState('#9af24d');
  const [aboutDescriptionColor, setAboutDescriptionColor] = useState('#ffffff');
  const [aboutButtonBgColor, setAboutButtonBgColor] = useState('#16a34a');
  const [aboutButtonTextColor, setAboutButtonTextColor] = useState('#ffffff');
  const [isAboutExpanded, setIsAboutExpanded] = useState(false);
  const [aboutSections, setAboutSections] = useState<SubcategoryAboutSection[]>([]);
  const [expandedAboutSection, setExpandedAboutSection] = useState(false);
  const [subcategorySections, setSubcategorySections] = useState<SubcategoryPageSection[]>([]);
  const [demoFormHeading, setDemoFormHeading] = useState('See The Software In Action\nWatch Free Demo!');
  const [demoButtonLabel, setDemoButtonLabel] = useState('Get Free Advice');

  const [brands, setBrands] = useState<BrandItem[]>([]);

  const hasVideoResource = Boolean(videoUrl.trim());
  const hasVideoResource2 = videoUrl2.some(url => url?.trim());
  const showDownloadsTab = subcategory?.show_downloads !== false;
  const showProductsTab = category?.show_products_tab !== false;
  const showBrandsTab = subcategory?.show_brands !== false && brands.length > 0;
  const showBrandsInOverview = subcategory?.show_brands !== false && brands.length > 0;
  const showPricingPlansTab = subcategory?.show_pricing_plans !== false && pricingPlans.filter(p => p.is_visible !== false).length > 0;
  const showPricingPlansInOverview = subcategory?.show_pricing_plans !== false && pricingPlans.filter(p => p.is_visible !== false).length > 0;
  const showFormAsTab = Boolean(formLink.trim() && showFormTab);
  const showResourcesTab = subcategory?.show_resources !== false;
  const showAboutSection = subcategory?.show_about_section !== false;
  const showHeaderPointsSection = subcategory?.show_header_points_section !== false;
  const showHeaderPointsTab = showHeaderPointsSection && overviewPoints.length > 0;

  const tabs = [
    { key: 'overview', label: 'Overview', icon: <Info className="h-4 w-4" /> },
  ];

  if (showResourcesTab) tabs.push({ key: 'resources', label: subcategory?.resources_tab_label || 'Resources', icon: <Play className="h-4 w-4" /> });
  if (showDownloadsTab) tabs.push({ key: 'downloads', label: subcategory?.downloads_tab_label || 'Downloads', icon: <Download className="h-4 w-4" /> });
  if (showHeaderPointsTab) tabs.push({ key: 'key_features', label: subcategory?.key_features_tab_label || 'Key Features', icon: <CheckCircle2 className="h-4 w-4" /> });
  if (showPricingPlansTab) tabs.push({ key: 'pricing', label: 'Pricing', icon: <Package className="h-4 w-4" /> });
  if (showBrandsTab) tabs.push({ key: 'brands', label: subcategory?.brands_tab_label || 'Brands', icon: <Image className="h-4 w-4" /> });
  if (showFormAsTab) tabs.push({ key: 'form', label: 'Form', icon: <FileText className="h-4 w-4" /> });

  const resourcesTabIndex = tabs.findIndex((tab) => tab.key === 'resources');
  const pricingTabIndex = tabs.findIndex((tab) => tab.key === 'pricing');
  const downloadsTabIndex = tabs.findIndex((tab) => tab.key === 'downloads');
  const brandsTabIndex = tabs.findIndex((tab) => tab.key === 'brands');
  const formTabIndex = tabs.findIndex((tab) => tab.key === 'form');
  const keyFeaturesTabIndex = tabs.findIndex((tab) => tab.key === 'key_features');

  const resourcesTabLabel = subcategory?.resources_tab_label?.trim() || 'Resources';
  const downloadsTabLabel = subcategory?.downloads_tab_label?.trim() || 'Downloads';
  const brandsTabLabel = subcategory?.brands_tab_label?.trim() || 'Brands';

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
              sort_order: brand.sort_order ?? 0,
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
      const [{ data: categoryData }, { data: subcategoryData }, { data: downloadData }, { data: pricingPlansData }, { data: productData }, { data: buttonData }, { data: overviewPointData }, { data: brandData }, { data: aboutSectionsData }, { data: subcategorySectionsData }] = await Promise.all([
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
      ]);

      if (!mounted) return;

      if (categoryData) {
        setCategory(categoryData);
      }

      if (subcategoryData) {
        setSubcategory(subcategoryData);
        setVideoUrl((subcategoryData as any).video_url || '');
        setVideoUrl2((subcategoryData as any).video_url_2 || []);
        setFormLink((subcategoryData as any).form_link || '');
        setShowFormTab((subcategoryData as any).show_form_in_separate_tab || false);
        setAboutHeading((subcategoryData as any).about_heading || 'About');
        setAboutContent((subcategoryData as any).about_content || '');
        setAboutBgColor((subcategoryData as any).about_bg_color || '#013737');
        setAboutHeadingColor((subcategoryData as any).about_heading_color || '#ffffff');
        setAboutSubheadingColor((subcategoryData as any).about_subheading_color || '#9af24d');
        setAboutDescriptionColor((subcategoryData as any).about_description_color || '#ffffff');
        setAboutButtonBgColor((subcategoryData as any).about_button_bg_color || '#16a34a');
        setAboutButtonTextColor((subcategoryData as any).about_button_text_color || '#ffffff');
        setOverviewPointsHeading((subcategoryData as any).key_features_tab_label || (subcategoryData as any).overview_points_heading || defaultOverviewPointsHeading);
        setDemoFormHeading((subcategoryData as any).demo_form_heading || 'See The Software In Action\nWatch Free Demo!');
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
                category_id: subcategoryId,
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
          sort_order: brand.sort_order ?? 0,
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
        category_id: categoryId,
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

  const renderBrandGrid = () => (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
      {brands.map((brand) => {
        const externalUrl = normalizeExternalUrl(brand.link || '');
        const brandBoxClassName =
          'flex items-center rounded-xl border border-border bg-background px-4 py-3 text-left text-base md:text-lg text-black font-medium transition-all';
        const content = <span>{brand.name || 'Unnamed brand'}</span>;

        if (externalUrl) {
          return (
            <a
              key={brand.id}
              href={externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`${brandBoxClassName} hover:border-primary/50 hover:shadow-md hover:text-primary`}
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
  );

  const renderDownloadGrid = () => (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
      {downloads.map((download) => (
        <a
          key={download.id}
          href={download.file_url}
          download
          className="flex items-center rounded-xl border border-border bg-background px-4 py-3 text-left text-base md:text-lg text-black font-medium transition-all hover:border-primary/50 hover:shadow-md hover:text-primary"
        >
          <span>{download.file_name}</span>
        </a>
      ))}
    </div>
  );

  const renderHeaderPoints = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {(activeTab === 0 && !showAllOverviewPoints ? visibleOverviewPoints.slice(0, INITIAL_OVERVIEW_POINTS_COUNT) : visibleOverviewPoints).map((point) => (
          <div
            key={point.id}
            className={`flex items-center gap-3 rounded-xl border border-border px-4 py-3 text-left text-base md:text-lg text-black font-medium transition-all ${
              point.is_highlighted
                ? 'bg-white'
                : 'bg-background'
            }`}
          >
            <CheckCircle2
              className={`h-5 w-5 flex-shrink-0 ${
                point.highlight_color === 'blue' ? 'text-blue-600' : 'text-emerald-600'
              }`}
            />
            <span>{point.text}</span>
          </div>
        ))}
      </div>
      {activeTab === 0 && hasMoreOverviewPoints && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setShowAllOverviewPoints((current) => !current)}
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            {showAllOverviewPoints ? 'View Less' : 'View All'}
            {showAllOverviewPoints ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      )}
    </div>
  );

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
              <span className="text-3xl font-bold text-foreground">{plan.currency}{plan.price}</span>
              <span className="text-sm text-muted-foreground">{plan.duration}</span>
            </div>
          </div>
          {plan.description && (
            <p className="mb-4 text-center text-sm text-muted-foreground">{plan.description}</p>
          )}
          <ul className="mb-6 space-y-3">
            {plan.features.map((feature, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-foreground">
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
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        {/* Hero Section with colored background and video */}
        <div 
          className="relative w-full max-w-none overflow-hidden border-b border-border"
          style={subcategory?.hero_background_color ? { backgroundColor: subcategory.hero_background_color } : undefined}
        >
          <div className="container mx-auto px-4 md:px-8 lg:px-10">
            <div className="flex w-full flex-col gap-y-6 pb-12 pt-12">
              <div className="flex-1 min-w-0 flex flex-col items-start justify-start gap-3 text-left md:gap-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-center">
                  {category.icon_url && (
                    <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-[#e9ddff] shadow-lg">
                      <img src={category.icon_url} alt={category.name} className="h-11 w-11 object-contain" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <h1 className={`break-words whitespace-normal ${SECTION_HEADING_CLASS}`}>
                      {subcategory.name}
                    </h1>
                  </div>
                </div>
                {detailDescription.trim() && (
                  <div className="mt-2 w-full md:mt-3">
                    <p className={`max-w-xl whitespace-pre-wrap ${SECTION_SUBTEXT_CLASS}`}>
                      {detailDescription}
                    </p>
                  </div>
                )}
                {/* Hero Buttons */}
                {heroButtons.length > 0 && (
                  <div className="mt-6 flex flex-wrap gap-3">
                    {heroButtons.map((button, index) => (
                      <a
                        key={button.id}
                        href={normalizeExternalUrl(button.link || '') || '#'}
                        target={button.link ? '_blank' : undefined}
                        rel={button.link ? 'noopener noreferrer' : undefined}
                        className={`
                          px-8 py-3 rounded-2xl text-lg font-medium transition-all duration-200
                          ${index === 0 || index === 2 
                            ? 'bg-blue-500 text-white shadow-md hover:bg-blue-600 hover:shadow-lg' 
                            : 'bg-white text-gray-800 border-2 border-gray-200 shadow-sm hover:border-gray-300 hover:shadow-md'
                          }
                        `}
                      >
                        {button.label}
                      </a>
                    ))}
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
            {activeTab === 0 && (
              <div className="w-full space-y-8">
                {aboutSections.length > 0 && (
                  <div className="space-y-6">
                    {aboutSections
                      .filter((section) => section.is_visible !== false)
                      .map((section) => (
                      <div
                        key={section.id}
                        className="w-full rounded-2xl border border-border p-4 md:p-6 shadow-sm text-left"
                        style={{ backgroundColor: section.background_color || '#ffffff' }}
                      >
                        <h2 className={`${SECTION_HEADING_CLASS} !mb-6`} style={{ color: section.heading_color || '#111111' }}>{section.heading}</h2>
                        <div
                          className={RICH_HTML_CONTENT_CLASS}
                          dangerouslySetInnerHTML={{ __html: section.content || '' }}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {shouldShowOverviewCard && showOverviewPointsSection && showHeaderPointsSection && visibleOverviewPoints.length > 0 && (
                  <div className="w-full rounded-2xl border border-border bg-card p-6 shadow-sm">
                    <h2 className={SECTION_HEADING_CLASS}>
                      {subcategory?.key_features_tab_label || defaultOverviewPointsHeading}
                    </h2>
                    {renderHeaderPoints()}
                  </div>
                )}

                {/* Video Resources in Overview - only show when Resources tab is visible */}
                {showResourcesTab && videoUrl2.filter(url => url?.trim()).length > 0 && (
                  <div className="w-full rounded-2xl border border-border bg-card p-6 shadow-sm">
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
                  <div className="w-full rounded-2xl border border-border bg-card p-6 shadow-sm">
                    <h2 className={SECTION_HEADING_CLASS}>{downloadsTabLabel}</h2>
                    {downloads.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No downloads available.</p>
                    ) : (
                      renderDownloadGrid()
                    )}
                  </div>
                )}

                {showBrandsInOverview && (
                  <div className="w-full rounded-2xl border border-border bg-card p-6 shadow-sm">
                    <h2 className={SECTION_HEADING_CLASS}>{brandsTabLabel}</h2>
                    {brands.length > 0 ? (
                      renderBrandGrid()
                    ) : (
                      <p className="text-sm text-muted-foreground">No brands available yet.</p>
                    )}
                  </div>
                )}

                {showPricingPlansInOverview && (
                  <div className="w-full rounded-2xl border border-border bg-card p-6 shadow-sm">
                    <h2 className={SECTION_HEADING_CLASS}>Pricing Plans</h2>
                    {renderPricingPlans()}
                  </div>
                )}

                {productItems.length > 0 && (
                  <div className="w-full rounded-2xl border border-border bg-card p-6 shadow-sm">
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
                          className="flex items-center justify-between rounded-xl border border-border bg-card px-5 py-4 text-left transition-all hover:border-primary/50 hover:shadow-md"
                        >
                          <span className="truncate pr-4 text-base font-medium text-foreground">{product.title}</span>
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

              {activeTab === formTabIndex && showFormAsTab && formLink.trim() && (
                <div className="w-full">
                  <h2 className={SECTION_HEADING_CLASS}>Form</h2>
                  <div className="w-full overflow-hidden rounded-xl border border-border bg-card">
                    <div className="h-[60vh] w-full bg-muted md:min-h-[650px]">
                      <iframe src={formLink.trim()} title="Form" scrolling="auto" className="h-full w-full" style={{ border: 'none' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}


          {activeTab === keyFeaturesTabIndex && showHeaderPointsTab && (
            <div className="w-full">
              <h2 className={SECTION_HEADING_CLASS}>
                {subcategory?.key_features_tab_label || 'Key Features'}
              </h2>
              {renderHeaderPoints()}
            </div>
          )}

          {activeTab === resourcesTabIndex && showResourcesTab && (
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

          {activeTab === downloadsTabIndex && showDownloadsTab && (
            <div className="w-full">
              <h2 className={SECTION_HEADING_CLASS}>{downloadsTabLabel}</h2>

              {downloads.length === 0 ? (
                <p className="text-sm text-muted-foreground">No downloads available.</p>
              ) : (
                renderDownloadGrid()
              )}
            </div>
          )}


          {activeTab === brandsTabIndex && showBrandsTab && (
            <div className="w-full">
              <h2 className={SECTION_HEADING_CLASS}>{brandsTabLabel}</h2>
              {brands.length > 0 ? (
                renderBrandGrid()
              ) : (
                <p className="text-sm text-muted-foreground">No brands available yet.</p>
              )}
            </div>
          )}

          {activeTab === pricingTabIndex && showPricingPlansTab && (
            <div className="w-full">
              <h2 className={SECTION_HEADING_CLASS}>Pricing Plans</h2>
              {renderPricingPlans()}
            </div>
          )}

          {activeTab === formTabIndex && showFormAsTab && formLink.trim() && (
            <div className="w-full">
              <h2 className={SECTION_HEADING_CLASS}>Form</h2>
              <div className="w-full overflow-hidden rounded-xl border border-border bg-card">
                <div className="h-[60vh] w-full bg-muted md:min-h-[650px]">
                  <iframe src={formLink.trim()} title="Form" scrolling="auto" className="h-full w-full" style={{ border: 'none' }} />
                </div>
              </div>
            </div>
          )}
        </div>
        </div>
      </main>

      {showAboutSection && (
        <section className="pb-10 md:pb-12">
          <div className="container mx-auto px-4 md:px-8 lg:px-10">
            <div 
              className="rounded-none p-5 md:pt-20 md:pl-20 md:pr-10 md:pb-10"
              style={{ backgroundColor: aboutBgColor }}
            >
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:items-start md:gap-10">
              <div className="md:pl-4 md:pt-2">
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
                  Talk to Solution Experts for Free.
                </p>
                <p 
                  className={`mt-5 max-w-[560px] ${SECTION_SUBTEXT_CLASS}`}
                  style={{ color: aboutDescriptionColor }}
                >
                  {(aboutContent || '').trim() || "We'll help you find the right tools that fit your budget and business needs. Just fill in the form and we'll get back to you."}
                </p>
              </div>
              <div className="flex justify-center md:justify-end">
                <WatchDemoForm 
                  subcategoryId={subcategoryId} 
                  demoLink={subcategory?.schedule_link} 
                  demoFormHeading={demoFormHeading} 
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

