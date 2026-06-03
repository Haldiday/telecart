import { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSectionInstances } from '@/hooks/useSectionInstances';
import { useScopedSectionInstances, type ScopedPageSection } from '@/hooks/useScopedSectionInstances';
import { toast } from 'sonner';
import ImageUpload from '@/components/admin/ImageUpload';
import ImageCropper from '@/components/admin/ImageCropper';
import FileUpload from '@/components/admin/FileUpload';
import RichTextEditor from '@/components/admin/RichTextEditor';
import TipTapEditor from '@/components/admin/TipTapEditor';
import { Switch } from '@/components/ui/switch';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVertical, Plus, Pencil, Trash2, LogOut, Home, X, Save,
  LayoutDashboard, Type, Layers, CreditCard, Tag, Star, Image, Lock, Unlock, ArrowLeft, CheckCircle2, ChevronDown
} from 'lucide-react';

interface PageSection { id: string; section_type: string; name: string; sort_order: number; is_visible: boolean; is_locked: boolean; heading: string; description: string | null; show_heading: boolean; background_color?: string | null; }
interface FeaturedCard { id: string; title: string; description: string; logo_url: string | null; link: string | null; sort_order: number; section_id: string; is_fixed: boolean; show_border: boolean; border_color: string | null; background_color?: string | null; }
interface Category { id: string; name: string; icon_url?: string | null; video_url?: string; image_url?: string; bg_color: string; sort_order: number; section_id: string; show_downloads_tab?: boolean; show_brands_tab?: boolean; is_visible?: boolean; }
interface Subcategory {
  id: string;
  category_id: string;
  name: string;
  link: string | null;
  custom_link?: string | null;
  custom_link_type?: 'link' | 'iframe' | 'embed_code' | null;
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
  overview_points_heading?: string | null;
  detail_heading?: string | null;
  detail_description?: string | null;
  show_downloads?: boolean;
  show_brands?: boolean;
  show_resources?: boolean;
  show_pricing_plans?: boolean;
  show_about_section?: boolean;
  show_header_points_section?: boolean;
  sort_order: number;
  demo_form_heading?: string | null;
  about_subheading?: string | null;
  demo_button_label?: string | null;
  image_url?: string | null;
  resources_tab_label?: string | null;
  downloads_tab_label?: string | null;
  brands_tab_label?: string | null;
  pricing_plans_tab_label?: string | null;
  key_features_tab_label?: string | null;
  hero_background_color?: string | null;
  tab_order?: string[] | null;
  about_bg_color?: string | null;
  about_heading_color?: string | null;
  about_subheading_color?: string | null;
  about_description_color?: string | null;
  about_button_bg_color?: string | null;
  about_button_text_color?: string | null;
  demo_form_heading_color?: string | null;
}
interface CategoryButton { id?: string; subcategory_id?: string; label: string; link: string | null; is_visible: boolean; sort_order?: number; }
interface SubcategoryDownload { id?: string; file_name: string; file_url: string; file_type: string; }
interface CategoryDownload { id: string; category_id: string; file_name: string; file_url: string; file_type: string; }
interface SubcategoryBrand { 
  id?: string; 
  name: string; 
  logo_url: string | null; 
  link: string | null; 
  description?: string | null;
  buttons?: CategoryButton[];
  is_visible: boolean; 
  primary_cta_label?: string | null;
  primary_cta_link?: string | null;
  primary_cta_visible?: boolean;
  more_actions_label?: string | null;
  more_actions_visible?: boolean;
  join_network_label?: string | null;
  join_network_link?: string | null;
  join_network_visible?: boolean;
}
interface SubcategoryOverviewPoint { id?: string; subcategory_id: string; section_id?: string; text: string; is_highlighted: boolean; highlight_color?: 'green' | 'blue'; sort_order: number; }
interface SubcategoryKeyFeaturesSection { id: string; subcategory_id: string; heading: string; is_visible: boolean; sort_order: number; }
interface SubcategoryAboutSection { id: string; subcategory_id: string; heading: string; content: string | null; background_color?: string; heading_color?: string; sort_order: number; created_at: string; updated_at: string; }
interface PricingPlan { id?: string; subcategory_id?: string; plan_name: string; price: string; currency: string; duration: string; description: string | null; features: string[]; button_label: string; button_link: string | null; razorpay_link: string | null; button_bg_color?: string | null; card_bg_color?: string | null; is_popular: boolean; is_visible: boolean; sort_order: number; }
interface Offer { id: string; image_url: string | null; heading: string; description: string | null; link: string | null; sort_order: number; section_id: string; is_fixed: boolean; show_border: boolean; border_color: string | null; }
interface Ad2 { id: string; image_url: string | null; link: string | null; sort_order: number; section_id: string; is_fixed: boolean; show_border: boolean; border_color: string | null; }
interface Ad3 { id: string; image_url: string | null; heading: string | null; description: string | null; link: string | null; sort_order: number; section_id: string; is_fixed: boolean; show_border: boolean; border_color: string | null; }
interface Lead { id: string; name: string; email: string | null; phone: string | null; message: string | null; created_at: string; organization?: string | null; subcategory_id?: string | null; terms_accepted?: boolean; }
interface HeaderSettings {
  id?: string;
  leave_review_text: string;
  leave_review_link: string;
  leave_review_visible: boolean;
  for_providers_text: string;
  for_providers_link: string;
  for_providers_visible: boolean;
  sign_in_text: string;
  sign_in_visible: boolean;
  join_text: string;
  join_link: string;
  join_visible: boolean;
  submit_button_text: string;
  submit_button_link: string;
  submit_button_visible: boolean;
}

// Product Tab Sections types and constants
const PRODUCT_SECTION_TABLE = 'subcategory_page_sections';
const PRODUCT_CARDS_TABLE = 'subcategory_featured_cards';
const PRODUCT_OFFERS_TABLE = 'subcategory_offers';
const PRODUCT_ADS_2_TABLE = 'subcategory_ads_2col';
const PRODUCT_ADS_3_TABLE = 'subcategory_ads_3col';
const PRODUCT_LOGO_STEPS_TABLE = 'subcategory_logo_steps';

type ProductAdminTab = 'layout' | 'cards' | 'offers' | 'ads_1col' | 'ads_2col' | 'ads_3col' | 'logo_steps';

const PRODUCT_ADMIN_TABS: { key: ProductAdminTab; label: string; icon: React.ReactNode }[] = [
  { key: 'layout', label: 'Sections', icon: <Layers className="h-4 w-4" /> },
  { key: 'cards', label: 'Feature Cards', icon: <CreditCard className="h-4 w-4" /> },
  { key: 'offers', label: 'Offers', icon: <Star className="h-4 w-4" /> },
  { key: 'ads_1col', label: 'Ad 1', icon: <Image className="h-4 w-4" /> },
  { key: 'ads_2col', label: 'Ad 2', icon: <Image className="h-4 w-4" /> },
  { key: 'ads_3col', label: 'Ad 3', icon: <Image className="h-4 w-4" /> },
  { key: 'logo_steps', label: 'Logo Steps', icon: <CheckCircle2 className="h-4 w-4" /> },
];

const PRODUCT_SECTION_TYPE_OPTIONS = [
  { value: 'cards', label: 'Feature Cards' },
  { value: 'offers', label: 'Offers' },
  { value: 'ads_1col', label: 'Ad 1' },
  { value: 'ads_2col', label: 'Ad 2' },
  { value: 'ads_3col', label: 'Ad 3' },
  { value: 'logo_steps', label: 'Logo Steps' },
];

interface FeaturedCardItem {
  id: string;
  title: string;
  description: string;
  logo_url: string | null;
  link: string | null;
  sort_order: number;
  section_id: string;
  is_fixed: boolean;
  show_border: boolean;
  border_color: string | null;
  background_color?: string | null;
}

interface OfferItem {
  id: string;
  image_url: string | null;
  heading: string;
  description: string | null;
  link: string | null;
  sort_order: number;
  section_id: string;
  is_fixed: boolean;
  show_border: boolean;
  border_color: string | null;
}

interface Ad2Item {
  id: string;
  image_url: string | null;
  link: string | null;
  sort_order: number;
  section_id: string;
  is_fixed: boolean;
  show_border: boolean;
  border_color: string | null;
}

interface Ad3Item extends Ad2Item {
  heading: string | null;
  description: string | null;
}

interface LogoStepItem {
  id: string;
  title: string;
  description: string | null;
  logo_url: string | null;
  link: string | null;
  sort_order: number;
  section_id: string;
}

type Tab = 'dashboard' | 'hero' | 'header' | 'sections' | 'cards' | 'categories' | 'offers' | 'ads_1col' | 'ads_2col' | 'ads_3col' | 'leads' | 'contact';

function SortableItem({ id, children, disabled }: { id: string; children: React.ReactNode; disabled?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id, disabled });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-3 p-3 bg-card rounded-lg border border-border mb-2">
      <button
        {...(disabled ? {} : { ...attributes, ...listeners })}
        type="button"
        className={`text-muted-foreground ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-grab hover:text-foreground'}`}
        aria-label={disabled ? 'Fixed section' : 'Drag to reorder section'}
      >
        {disabled ? <Lock className="w-5 h-5" /> : <GripVertical className="w-5 h-5" />}
      </button>
      <div className="flex-1">{children}</div>
    </div>
  );
}

// Custom sortable item for About sections that isolates the RichTextEditor from drag operations
function SortableAboutSectionItem({ id, children, disabled }: { id: string; children: React.ReactNode; disabled?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id, disabled });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <div ref={setNodeRef} style={style} className="w-full space-y-3">
      <div className="flex items-center gap-3">
        <button
          {...(disabled ? {} : { ...attributes, ...listeners })}
          type="button"
          className={`text-muted-foreground ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-grab hover:text-foreground'}`}
          aria-label={disabled ? 'Fixed section' : 'Drag to reorder section'}
        >
          {disabled ? <Lock className="w-5 h-5" /> : <GripVertical className="w-5 h-5" />}
        </button>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}

function SortableOfferItem({ id, children, disabled }: { id: string; children: React.ReactNode; disabled?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id, disabled });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border">
      <button
        {...(disabled ? {} : { ...attributes, ...listeners })}
        type="button"
        className={`text-muted-foreground ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-grab hover:text-foreground'}`}
        aria-label={disabled ? 'Fixed mode disabled' : 'Drag to reorder offer'}
      >
        {disabled ? <Lock className="w-4 h-4" /> : <GripVertical className="w-4 h-4" />}
      </button>
      {children}
    </div>
  );
}

function SortableCategoryItem({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border">
      <button
        {...attributes}
        {...listeners}
        type="button"
        className="text-muted-foreground cursor-grab hover:text-foreground"
        aria-label="Drag to reorder category"
      >
        <GripVertical className="w-4 h-4" />
      </button>
      {children}
    </div>
  );
}

function SortableAdminItem({
  id,
  children,
  disabled = false,
}: {
  id: string;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id, disabled });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 justify-start"
    >
      <button
        type="button"
        {...(disabled ? {} : { ...attributes, ...listeners })}
        className={`text-muted-foreground ${disabled ? 'cursor-not-allowed opacity-40' : 'cursor-grab hover:text-foreground'}`}
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-3" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-card p-5 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="pr-2 text-lg font-bold">{title}</h3>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

const SIDEBAR_ITEMS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { key: 'hero', label: 'Hero Section', icon: <Type className="w-5 h-5" /> },
  { key: 'header', label: 'Header Options', icon: <Layers className="w-5 h-5" /> },
  { key: 'sections', label: 'Page Layout', icon: <Layers className="w-5 h-5" /> },
  { key: 'cards', label: 'Feature Cards', icon: <CreditCard className="w-5 h-5" /> },
  { key: 'categories', label: 'Categories', icon: <Tag className="w-5 h-5" /> },
  { key: 'offers', label: 'Offers', icon: <Star className="w-5 h-5" /> },
  { key: 'ads_1col', label: '1-Col Ad', icon: <Image className="w-5 h-5" /> },
  { key: 'ads_2col', label: '2-Col Ads', icon: <Image className="w-5 h-5" /> },
  { key: 'ads_3col', label: '3-Col Ads', icon: <Image className="w-5 h-5" /> },
  { key: 'leads', label: 'Demo Leads', icon: <Star className="w-5 h-5" /> },
  { key: 'contact', label: 'Contact Page', icon: <Home className="w-5 h-5" /> },
];

const detectLinkType = (content: string): 'link' | 'iframe' | 'embed_code' => {
  if (!content) return 'link';
  const trimmed = content.trim();
  if (trimmed.startsWith('<iframe') || (trimmed.includes('<iframe') && trimmed.includes('</iframe>'))) return 'iframe';
  if (trimmed.startsWith('<div') || trimmed.includes('<script')) return 'embed_code';
  return 'link';
};

const TRUSTED_DOMAINS = [
  'forms.zohopublic.in',
  'zohopublic.in',
  'docs.google.com/forms',
  'forms.gle',
  'tally.so',
  'typeform.com'
];

const validateEmbedCode = (content: string): { isValid: boolean; message?: string } => {
  if (!content) return { isValid: true };
  const type = detectLinkType(content);
  if (type === 'link') return { isValid: true };

  // Check for trusted domains
  const hasTrustedDomain = TRUSTED_DOMAINS.some(domain => content.includes(domain));
  if (!hasTrustedDomain) {
    return { 
      isValid: false, 
      message: 'Unsupported provider. Please use trusted forms like Zoho, Google Forms, Tally, or Typeform.' 
    };
  }
  return { isValid: true };
};

export default function AdminDashboard() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Use the new section instances hook
  const {
    sections: sectionsFromHook,
    addSection,
    deleteSection,
    toggleVisibility,
    toggleLockState,
    updateSectionName,
    updateSortOrder,
    updateHeading,
    toggleShowHeading,
  } = useSectionInstances();

  const [sections, setSections] = useState<PageSection[]>([]);
  const [heroText, setHeroText] = useState('');
  const [heroWords, setHeroWords] = useState('');
  const [cards, setCards] = useState<FeaturedCard[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [categoryDownloads, setCategoryDownloads] = useState<CategoryDownload[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [ads2, setAds2] = useState<Ad2[]>([]);
  const [ads3, setAds3] = useState<Ad3[]>([]);
  const [buttons, setButtons] = useState<CategoryButton[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [subcategoriesMap, setSubcategoriesMap] = useState<Record<string, string>>({});
  const [activeAccordion, setActiveAccordion] = useState<string | null>(null);

  const [contactSettings, setContactSettings] = useState({
    heading: '',
    email_label: '',
    email: '',
    description_1: '',
    description_2: '',
    image_url: '',
  });
  const [headerSettings, setHeaderSettings] = useState<HeaderSettings>({
    leave_review_text: 'Leave a Review',
    leave_review_link: '#',
    leave_review_visible: true,
    for_providers_text: 'For Providers',
    for_providers_link: '#',
    for_providers_visible: true,
    sign_in_text: 'Sign In',
    sign_in_visible: true,
    join_text: 'Join',
    join_link: '#',
    join_visible: true,
    submit_button_text: 'Submit',
    submit_button_link: '#',
    submit_button_visible: true,
  });
  const [isSavingContact, setIsSavingContact] = useState(false);
  const [isSavingHeader, setIsSavingHeader] = useState(false);

  const [editCard, setEditCard] = useState<Partial<FeaturedCard> | null>(null);
  const [editCategory, setEditCategory] = useState<Partial<Category> | null>(null);
  const [editSubs, setEditSubs] = useState<Subcategory[]>([]);
  const [editSubcategory, setEditSubcategory] = useState<Partial<Subcategory> | null>(null);
  const [editDownloads, setEditDownloads] = useState<Partial<CategoryDownload>[]>([]);
  const [editOffer, setEditOffer] = useState<Partial<Offer> | null>(null);
  const [editAd2, setEditAd2] = useState<Partial<Ad2> | null>(null);
  const [editAd3, setEditAd3] = useState<Partial<Ad3> | null>(null);
  const [editButtons, setEditButtons] = useState<CategoryButton[]>([]);
  const [editButtonsState, setEditButtonsState] = useState<Record<string, CategoryButton[]>>({});
  const [editSubDownloads, setEditSubDownloads] = useState<SubcategoryDownload[]>([]);
  const [editSubDownloadsState, setEditSubDownloadsState] = useState<Record<string, SubcategoryDownload[]>>({});
  const [editShowDownloadsState, setEditShowDownloadsState] = useState<Record<string, boolean>>({});
  const [editSubBrands, setEditSubBrands] = useState<SubcategoryBrand[]>([]);
  const [editSubBrandsState, setEditSubBrandsState] = useState<Record<string, SubcategoryBrand[]>>({});
  const [editShowBrandsState, setEditShowBrandsState] = useState<Record<string, boolean>>({});
  const [editShowResourcesState, setEditShowResourcesState] = useState<Record<string, boolean>>({});
  const [editResourcesTabLabelState, setEditResourcesTabLabelState] = useState<Record<string, string>>({});
  const [editDownloadsTabLabelState, setEditDownloadsTabLabelState] = useState<Record<string, string>>({});
  const [editBrandsTabLabelState, setEditBrandsTabLabelState] = useState<Record<string, string>>({});
  const [editPricingPlansTabLabelState, setEditPricingPlansTabLabelState] = useState<Record<string, string>>({});
  const [editKeyFeaturesTabLabelState, setEditKeyFeaturesTabLabelState] = useState<Record<string, string>>({});
  const [editTabOrderState, setEditTabOrderState] = useState<Record<string, string[]>>({});
  const [editAd1, setEditAd1] = useState<Partial<Ad2> | null>(null);
  const [editSubOverviewPoints, setEditSubOverviewPoints] = useState<SubcategoryOverviewPoint[]>([]);
  const [editSubOverviewPointsState, setEditSubOverviewPointsState] = useState<Record<string, SubcategoryOverviewPoint[]>>({});
  const [keyFeaturesSections, setKeyFeaturesSections] = useState<SubcategoryKeyFeaturesSection[]>([]);
  const [editKeyFeaturesSections, setEditKeyFeaturesSections] = useState<Record<string, SubcategoryKeyFeaturesSection[]>>({});

  // State for pricing plans
  const [editPricingPlans, setEditPricingPlans] = useState<PricingPlan[]>([]);
  const [editPricingPlansState, setEditPricingPlansState] = useState<Record<string, PricingPlan[]>>({});
  const [editShowPricingPlansState, setEditShowPricingPlansState] = useState<Record<string, boolean>>({});
  const [editShowAboutSectionState, setEditShowAboutSectionState] = useState<Record<string, boolean>>({});
  const [editShowHeaderPointsSectionState, setEditShowHeaderPointsSectionState] = useState<Record<string, boolean>>({});

  // State for multiple About sections
  const [aboutSections, setAboutSections] = useState<SubcategoryAboutSection[]>([]);
  const [editAboutSections, setEditAboutSections] = useState<Record<string, SubcategoryAboutSection[]>>({});
  const [editAboutSectionVisibility, setEditAboutSectionVisibility] = useState<Record<string, Record<string, boolean>>>({});
  const [editingAboutSection, setEditingAboutSection] = useState<Partial<SubcategoryAboutSection> | null>(null);

  // Inline edit view state for subcategories
  const [editingSubcategoryId, setEditingSubcategoryId] = useState<string | null>(null);
  const [isSavingCategory, setIsSavingCategory] = useState(false);

  // Modal state for adding sections
  const [showAddSectionModal, setShowAddSectionModal] = useState(false);
  const [addSectionType, setAddSectionType] = useState<string>('');
  const [addSectionName, setAddSectionName] = useState('');
  const [addingSectionLoading, setAddingSectionLoading] = useState(false);

  // State for editing section names
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editingSectionName, setEditingSectionName] = useState('');

  // State for editing section headings
  const [editingHeadingSectionId, setEditingHeadingSectionId] = useState<string | null>(null);
  const [editingHeadingText, setEditingHeadingText] = useState('');
  const [editingHeadingVisible, setEditingHeadingVisible] = useState(true);
  const [editingHeadingBackgroundColor, setEditingHeadingBackgroundColor] = useState('');

  // Track which section instance is being edited for each type
  const [selectedCardsSectionId, setSelectedCardsSectionId] = useState<string>('');
  const [selectedCategoriesSectionId, setSelectedCategoriesSectionId] = useState<string>('');
  const [selectedOffersSectionId, setSelectedOffersSectionId] = useState<string>('');
  const [selectedAds2SectionId, setSelectedAds2SectionId] = useState<string>('');
  const [selectedAds3SectionId, setSelectedAds3SectionId] = useState<string>('');
  const [selectedAds1SectionId, setSelectedAds1SectionId] = useState<string>('');
  const [productAdminTab, setProductAdminTab] = useState<ProductAdminTab>('layout');
  const [productCards, setProductCards] = useState<FeaturedCardItem[]>([]);
  const [productOffers, setProductOffers] = useState<OfferItem[]>([]);
  const [productAds2, setProductAds2] = useState<Ad2Item[]>([]);
  const [productAds3, setProductAds3] = useState<Ad3Item[]>([]);
  const [productLogoSteps, setProductLogoSteps] = useState<LogoStepItem[]>([]);
  const [productSelectedCardsSectionId, setProductSelectedCardsSectionId] = useState('');
  const [productSelectedOffersSectionId, setProductSelectedOffersSectionId] = useState('');
  const [productSelectedAds1SectionId, setProductSelectedAds1SectionId] = useState('');
  const [productSelectedAds2SectionId, setProductSelectedAds2SectionId] = useState('');
  const [productSelectedAds3SectionId, setProductSelectedAds3SectionId] = useState('');
  const [productSelectedLogoStepsSectionId, setProductSelectedLogoStepsSectionId] = useState('');
  const [productShowAddSectionModal, setProductShowAddSectionModal] = useState(false);
  const [productAddSectionType, setProductAddSectionType] = useState<ProductAdminTab>('cards');
  const [productAddSectionName, setProductAddSectionName] = useState('');
  const [productHeadingModalSectionId, setProductHeadingModalSectionId] = useState('');
  const [productHeadingModalValue, setProductHeadingModalValue] = useState('');
  const [productHeadingVisible, setProductHeadingVisible] = useState(true);
  const [productHeadingBackgroundColor, setProductHeadingBackgroundColor] = useState('');
  const [productEditCard, setProductEditCard] = useState<Partial<FeaturedCardItem> | null>(null);
  const [productEditOffer, setProductEditOffer] = useState<Partial<OfferItem> | null>(null);
  const [productEditAd1, setProductEditAd1] = useState<Partial<Ad2Item> | null>(null);
  const [productEditAd2, setProductEditAd2] = useState<Partial<Ad2Item> | null>(null);
  const [productEditAd3, setProductEditAd3] = useState<Partial<Ad3Item> | null>(null);
  const [productEditLogoStep, setProductEditLogoStep] = useState<Partial<LogoStepItem> | null>(null);
  const [productSectionsLocal, setProductSectionsLocal] = useState<ScopedPageSection[]>([]);

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const productSensors = sensors;
  const {
    sections: productSections,
    addSection: addProductSection,
    deleteSection: deleteProductSection,
    updateSection: updateProductSection,
    refetch: refetchProductSections,
  } = useScopedSectionInstances({
    tableName: PRODUCT_SECTION_TABLE,
    scopeColumn: 'subcategory_id',
    scopeValue: editingSubcategoryId || '',
  });

  // Sync sections from hook to local state
  useEffect(() => {
    setSections(sectionsFromHook);

    const getFirstSectionIdByType = (type: string) => sectionsFromHook.find(s => s.section_type === type)?.id || '';

    setSelectedCardsSectionId((current) => current && sectionsFromHook.some(s => s.id === current) ? current : getFirstSectionIdByType('cards'));
    setSelectedCategoriesSectionId((current) => current && sectionsFromHook.some(s => s.id === current) ? current : getFirstSectionIdByType('categories'));
    setSelectedOffersSectionId((current) => current && sectionsFromHook.some(s => s.id === current) ? current : getFirstSectionIdByType('offers'));
    setSelectedAds2SectionId((current) => current && sectionsFromHook.some(s => s.id === current) ? current : getFirstSectionIdByType('ads_2col'));
    setSelectedAds3SectionId((current) => current && sectionsFromHook.some(s => s.id === current) ? current : getFirstSectionIdByType('ads_3col'));
    setSelectedAds1SectionId((current) => current && sectionsFromHook.some(s => s.id === current) ? current : getFirstSectionIdByType('ads_1col'));
  }, [sectionsFromHook]);

  const selectedCardsSection = sections.find(s => s.id === selectedCardsSectionId);
  const selectedOffersSection = sections.find(s => s.id === selectedOffersSectionId);
  const selectedAds2Section = sections.find(s => s.id === selectedAds2SectionId);
  const selectedAds3Section = sections.find(s => s.id === selectedAds3SectionId) || sections.find(s => s.section_type === 'ads_3col');

  useEffect(() => {
    setProductSectionsLocal(productSections);
  }, [productSections]);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) navigate('/admin/login');
  }, [loading, user, isAdmin]);

  useEffect(() => {
    let mounted = true;
    
      const loadAllSafe = async () => {
        try {
          const [s, h, header, c, cat, sub, downloads, o, a2, a3, btns, subDownloads, aboutSects, leadsData, pricingPlans, contact, kfSections] = await Promise.all([
            supabase.from('page_sections').select('*').order('sort_order'),
            supabase.from('hero_settings').select('*').limit(1).single(),
            supabase.from('header_settings' as any).select('*').limit(1).single(),
            supabase.from('featured_cards').select('*').order('sort_order'),
            supabase.from('categories').select('*').order('sort_order'),
            supabase.from('subcategories').select('*').order('sort_order'),
            supabase.from('category_downloads').select('*'),
            supabase.from('offers').select('*').order('sort_order'),
            supabase.from('ads_2col').select('*').order('sort_order'),
            supabase.from('ads_3col').select('*').order('sort_order'),
            supabase.from('category_buttons').select('*').order('sort_order'),
            supabase.from('subcategory_downloads' as any).select('*'),
            supabase.from('subcategory_about_sections' as any).select('*').order('sort_order'),
            supabase.from('leads' as any).select('*').order('created_at', { ascending: false }),
            supabase.from('pricing_plans' as any).select('*').order('sort_order', { ascending: true }),
            supabase.from('contact_settings' as any).select('*').limit(1).single(),
            supabase.from('subcategory_key_features_sections' as any).select('*').order('sort_order'),
          ]);

          let subBrands;
          try {
            const result = await supabase.from('subcategory_brands' as any).select('*');
            subBrands = result;
          } catch {
            subBrands = { data: [] };
          }
          let subOverviewPoints;
          try {
            const result = await supabase.from('subcategory_overview_points' as any).select('*');
            subOverviewPoints = result;
          } catch {
            subOverviewPoints = { data: [] };
          }
          
          if (!mounted) return;

          if (s.data) setSections(s.data);
          if (contact.data) setContactSettings(contact.data as any);
          if (header.data) setHeaderSettings(header.data as any);
          if (h.data) { setHeroText(h.data.main_text); setHeroWords(h.data.animated_words.join(', ')); }
          if (c.data) setCards((c.data as any[]).map(card => ({ ...card, link: card.link ?? null, is_fixed: card.is_fixed ?? false, show_border: card.show_border ?? false, border_color: card.border_color ?? null })));
          if (cat.data) setCategories(cat.data);
      if (sub.data) {
        setSubcategories(sub.data as unknown as Subcategory[]);
        const map: Record<string, string> = {};
        const pricingLabels: Record<string, string> = {};
        const keyFeaturesLabels: Record<string, string> = {};
        const brandsLabels: Record<string, string> = {};
        const downloadsLabels: Record<string, string> = {};
        const resourcesLabels: Record<string, string> = {};
        
        sub.data.forEach((s: any) => { 
          map[s.id] = s.name; 
          pricingLabels[s.id] = s.pricing_plans_tab_label || 'Pricing Plans';
          keyFeaturesLabels[s.id] = s.key_features_tab_label || 'Key Features';
          brandsLabels[s.id] = s.brands_tab_label || 'Brands';
          downloadsLabels[s.id] = s.downloads_tab_label || 'Downloads';
          resourcesLabels[s.id] = s.resources_tab_label || 'Resources';
        });
        setSubcategoriesMap(map);
        setEditPricingPlansTabLabelState(pricingLabels);
        setEditKeyFeaturesTabLabelState(keyFeaturesLabels);
        setEditBrandsTabLabelState(brandsLabels);
        setEditDownloadsTabLabelState(downloadsLabels);
        setEditResourcesTabLabelState(resourcesLabels);
      }
      if (downloads.data) setCategoryDownloads(downloads.data);
      if (o.data) setOffers((o.data as any[]).map(offer => ({ ...offer, is_fixed: offer.is_fixed ?? false, show_border: offer.show_border ?? false, border_color: offer.border_color ?? null })));
      if (a2.data) setAds2((a2.data as any[]).map(ad => ({ ...ad, is_fixed: ad.is_fixed ?? false, show_border: ad.show_border ?? false, border_color: ad.border_color ?? null })));
      if (a3.data) setAds3((a3.data as any[]).map(ad => ({ ...ad, is_fixed: ad.is_fixed ?? false, show_border: ad.show_border ?? false, border_color: ad.border_color ?? null })));
      if (btns.data) {
        setButtons(btns.data);
        const buttonsBySubcategory: Record<string, CategoryButton[]> = {};
        btns.data.forEach((btn: any) => {
          if (btn.subcategory_id) {
            if (!buttonsBySubcategory[btn.subcategory_id]) {
              buttonsBySubcategory[btn.subcategory_id] = [];
            }
            buttonsBySubcategory[btn.subcategory_id].push({
              id: btn.id,
              label: btn.label,
              link: btn.link,
              is_visible: btn.is_visible,
            });
          }
        });
        setEditButtonsState(buttonsBySubcategory);
      }
      if (subDownloads.data) {
        setEditSubDownloads(subDownloads.data as unknown as SubcategoryDownload[]);
        const groupedDownloads: Record<string, SubcategoryDownload[]> = {};
        subDownloads.data.forEach((download: any) => {
          if (!groupedDownloads[download.subcategory_id]) groupedDownloads[download.subcategory_id] = [];
          groupedDownloads[download.subcategory_id].push({
            id: download.id,
            file_name: download.file_name,
            file_url: download.file_url,
            file_type: download.file_type,
          });
        });
        setEditSubDownloadsState(groupedDownloads);
      }
      if (subBrands.data) {
        const brandsBySubcategory: Record<string, SubcategoryBrand[]> = {};
        subBrands.data.forEach((brand: any) => {
          if (!brandsBySubcategory[brand.subcategory_id]) {
            brandsBySubcategory[brand.subcategory_id] = [];
          }
          brandsBySubcategory[brand.subcategory_id].push({
            id: brand.id,
            name: brand.name,
            logo_url: brand.logo_url,
            link: brand.link,
            description: brand.description,
            buttons: brand.buttons || [],
            is_visible: brand.is_visible,
            primary_cta_label: brand.primary_cta_label,
            primary_cta_link: brand.primary_cta_link,
            primary_cta_visible: brand.primary_cta_visible,
            more_actions_label: brand.more_actions_label,
            more_actions_visible: brand.more_actions_visible,
            join_network_label: brand.join_network_label,
            join_network_link: brand.join_network_link,
            join_network_visible: brand.join_network_visible
          });
        });
        setEditSubBrandsState(brandsBySubcategory);
      }
      if (subOverviewPoints.data) {
        const pointsBySubcategory: Record<string, SubcategoryOverviewPoint[]> = {};
        subOverviewPoints.data.forEach((point: any) => {
          if (!pointsBySubcategory[point.subcategory_id]) {
            pointsBySubcategory[point.subcategory_id] = [];
          }
          pointsBySubcategory[point.subcategory_id].push({
            id: point.id,
            subcategory_id: point.subcategory_id,
            section_id: point.section_id,
            text: point.text,
            is_highlighted: point.is_highlighted,
            highlight_color: point.highlight_color === 'blue' ? 'blue' : 'green',
            sort_order: point.sort_order,
          });
        });
        setEditSubOverviewPointsState(pointsBySubcategory);
      }
      if (aboutSects.data) {
        setAboutSections(aboutSects.data as unknown as SubcategoryAboutSection[]);
        const aboutSectionsBySubcategory: Record<string, SubcategoryAboutSection[]> = {};
        const aboutSectionVisibilityBySubcategory: Record<string, Record<string, boolean>> = {};
        aboutSects.data.forEach((section: any) => {
          if (!aboutSectionsBySubcategory[section.subcategory_id]) {
            aboutSectionsBySubcategory[section.subcategory_id] = [];
            aboutSectionVisibilityBySubcategory[section.subcategory_id] = {};
          }
          aboutSectionsBySubcategory[section.subcategory_id].push({
            id: section.id,
            subcategory_id: section.subcategory_id,
            heading: section.heading,
            content: section.content,
            background_color: section.background_color || '#ffffff',
            heading_color: section.heading_color || '#000000',
            sort_order: section.sort_order,
            created_at: section.created_at,
            updated_at: section.updated_at,
          });
          aboutSectionVisibilityBySubcategory[section.subcategory_id][section.id] = section.is_visible ?? true;
        });
        setEditAboutSections(aboutSectionsBySubcategory);
        setEditAboutSectionVisibility(aboutSectionVisibilityBySubcategory);
      }
      if (pricingPlans.data) {
        const pricingPlansBySubcategory: Record<string, PricingPlan[]> = {};
        pricingPlans.data.forEach((plan: any) => {
          if (!pricingPlansBySubcategory[plan.subcategory_id]) {
            pricingPlansBySubcategory[plan.subcategory_id] = [];
          }
          // Handle features field - it might be stored as string or array
          let features: string[] = [];
          if (Array.isArray(plan.features)) {
            features = plan.features;
          } else if (typeof plan.features === 'string') {
            features = plan.features.split('\n').filter(f => f.trim());
          }
          pricingPlansBySubcategory[plan.subcategory_id].push({
            id: plan.id,
            subcategory_id: plan.subcategory_id,
            plan_name: plan.plan_name,
            price: plan.price,
            currency: plan.currency,
            duration: plan.duration,
            description: plan.description,
            features: features,
            button_label: plan.button_label,
            button_link: plan.button_link,
            razorpay_link: plan.razorpay_link,
            button_bg_color: plan.button_bg_color || null,
            card_bg_color: plan.card_bg_color || null,
            is_popular: plan.is_popular,
            is_visible: plan.is_visible,
            sort_order: plan.sort_order,
          });
        });
        console.log('Loaded pricing plans by subcategory:', pricingPlansBySubcategory);
        setEditPricingPlansState(pricingPlansBySubcategory);
      }
      if (kfSections.data) {
        setKeyFeaturesSections(kfSections.data as unknown as SubcategoryKeyFeaturesSection[]);
        const groupedKFSections: Record<string, SubcategoryKeyFeaturesSection[]> = {};
        kfSections.data.forEach((section: any) => {
          if (!groupedKFSections[section.subcategory_id]) groupedKFSections[section.subcategory_id] = [];
          groupedKFSections[section.subcategory_id].push({
            id: section.id,
            subcategory_id: section.subcategory_id,
            heading: section.heading,
            is_visible: section.is_visible,
            sort_order: section.sort_order,
          });
        });
        setEditKeyFeaturesSections(groupedKFSections);
      }
      if (leadsData.data) setLeads(leadsData.data as unknown as Lead[]);
        } catch (error) {
          console.error('Error in loadAllSafe:', error);
        }
      };

    loadAllSafe();

    const channel = supabase
      .channel('admin-dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'page_sections' }, loadAllSafe)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'hero_settings' }, loadAllSafe)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'featured_cards' }, loadAllSafe)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, loadAllSafe)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subcategories' }, loadAllSafe)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'category_downloads' }, loadAllSafe)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'offers' }, loadAllSafe)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ads_2col' }, loadAllSafe)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ads_3col' }, loadAllSafe)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'category_buttons' }, loadAllSafe)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subcategory_downloads' }, loadAllSafe)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subcategory_brands' }, loadAllSafe)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subcategory_overview_points' as any }, loadAllSafe)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subcategory_about_sections' }, loadAllSafe)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subcategory_key_features_sections' as any }, loadAllSafe)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pricing_plans' as any }, loadAllSafe)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, loadAllSafe)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'header_settings' as any }, loadAllSafe)
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  async function loadAll() {
    const [s, h, c, cat, sub, downloads, o, a2, a3, btns, subDownloads, aboutSects, pricingPlans, kfSections] = await Promise.all([
      supabase.from('page_sections').select('*').order('sort_order'),
      supabase.from('hero_settings').select('*').limit(1).single(),
      supabase.from('featured_cards').select('*').order('sort_order'),
      supabase.from('categories').select('*').order('sort_order'),
      supabase.from('subcategories').select('*').order('sort_order'),
      supabase.from('category_downloads').select('*'),
      supabase.from('offers').select('*').order('sort_order'),
      supabase.from('ads_2col').select('*').order('sort_order'),
      supabase.from('ads_3col').select('*').order('sort_order'),
      supabase.from('category_buttons').select('*').order('sort_order'),
      supabase.from('subcategory_downloads' as any).select('*'),
      supabase.from('subcategory_about_sections' as any).select('*').order('sort_order'),
      supabase.from('pricing_plans' as any).select('*').order('sort_order', { ascending: true }),
      supabase.from('subcategory_key_features_sections' as any).select('*').order('sort_order'),
    ]);
    let subBrands;
    try {
      const result = await supabase.from('subcategory_brands' as any).select('*');
      subBrands = result;
    } catch {
      subBrands = { data: [] };
    }
    let subOverviewPoints;
    try {
      const result = await supabase.from('subcategory_overview_points' as any).select('*');
      subOverviewPoints = result;
    } catch {
      subOverviewPoints = { data: [] };
    }
    if (s.data) setSections(s.data);
    if (h.data) { setHeroText(h.data.main_text); setHeroWords(h.data.animated_words.join(', ')); }
    if (c.data) setCards((c.data as any[]).map(card => ({ ...card, link: card.link ?? null, is_fixed: card.is_fixed ?? false, show_border: card.show_border ?? false, border_color: card.border_color ?? null })));
    if (cat.data) setCategories(cat.data);
    if (sub.data) setSubcategories(sub.data as unknown as Subcategory[]);
    if (downloads.data) setCategoryDownloads(downloads.data);
    if (o.data) setOffers((o.data as any[]).map(offer => ({ ...offer, is_fixed: offer.is_fixed ?? false, show_border: offer.show_border ?? false, border_color: offer.border_color ?? null })));
    if (a2.data) setAds2((a2.data as any[]).map(ad => ({ ...ad, is_fixed: ad.is_fixed ?? false, show_border: ad.show_border ?? false, border_color: ad.border_color ?? null })));
    if (a3.data) setAds3((a3.data as any[]).map(ad => ({ ...ad, is_fixed: ad.is_fixed ?? false, show_border: ad.show_border ?? false, border_color: ad.border_color ?? null })));
    if (btns.data) {
      setButtons(btns.data);
      // Populate editButtonsState with buttons keyed by subcategory_id
      const buttonsBySubcategory: Record<string, CategoryButton[]> = {};
      btns.data.forEach((btn: any) => {
        if (btn.subcategory_id) {
          if (!buttonsBySubcategory[btn.subcategory_id]) {
            buttonsBySubcategory[btn.subcategory_id] = [];
          }
          buttonsBySubcategory[btn.subcategory_id].push({
            id: btn.id,
            label: btn.label,
            link: btn.link,
            is_visible: btn.is_visible,
          });
        }
      });
      setEditButtonsState(buttonsBySubcategory);
    }
    if (subDownloads.data) {
      const groupedDownloads: Record<string, SubcategoryDownload[]> = {};
      subDownloads.data.forEach((download: any) => {
        if (!groupedDownloads[download.subcategory_id]) groupedDownloads[download.subcategory_id] = [];
        groupedDownloads[download.subcategory_id].push({
          id: download.id,
          file_name: download.file_name,
          file_url: download.file_url,
          file_type: download.file_type,
        });
      });
      setEditSubDownloadsState(groupedDownloads);
    }
    if (subBrands.data) {
      const brandsBySubcategory: Record<string, SubcategoryBrand[]> = {};
      subBrands.data.forEach((brand: any) => {
        if (!brandsBySubcategory[brand.subcategory_id]) {
          brandsBySubcategory[brand.subcategory_id] = [];
        }
        brandsBySubcategory[brand.subcategory_id].push({
          id: brand.id,
          name: brand.name,
          logo_url: brand.logo_url,
          link: brand.link,
          description: brand.description,
          buttons: brand.buttons || [],
          is_visible: brand.is_visible,
          primary_cta_label: brand.primary_cta_label,
          primary_cta_link: brand.primary_cta_link,
          primary_cta_visible: brand.primary_cta_visible,
          more_actions_label: brand.more_actions_label,
          more_actions_visible: brand.more_actions_visible,
          join_network_label: brand.join_network_label,
          join_network_link: brand.join_network_link,
          join_network_visible: brand.join_network_visible
        });
      });
      setEditSubBrandsState(brandsBySubcategory);
    }
    if (subOverviewPoints.data) {
      const pointsBySubcategory: Record<string, SubcategoryOverviewPoint[]> = {};
      subOverviewPoints.data.forEach((point: any) => {
        if (!pointsBySubcategory[point.subcategory_id]) {
          pointsBySubcategory[point.subcategory_id] = [];
        }
        pointsBySubcategory[point.subcategory_id].push({
          id: point.id,
          subcategory_id: point.subcategory_id,
          section_id: point.section_id,
          text: point.text,
          is_highlighted: point.is_highlighted,
          highlight_color: point.highlight_color === 'blue' ? 'blue' : 'green',
          sort_order: point.sort_order,
        });
      });
      setEditSubOverviewPointsState(pointsBySubcategory);
    }
    if (aboutSects.data) {
      setAboutSections(aboutSects.data as unknown as SubcategoryAboutSection[]);
      const aboutSectionsBySubcategory: Record<string, SubcategoryAboutSection[]> = {};
      aboutSects.data.forEach((section: any) => {
        if (!aboutSectionsBySubcategory[section.subcategory_id]) {
          aboutSectionsBySubcategory[section.subcategory_id] = [];
        }
        aboutSectionsBySubcategory[section.subcategory_id].push({
          id: section.id,
          subcategory_id: section.subcategory_id,
          heading: section.heading,
          content: section.content,
          background_color: section.background_color || '#ffffff',
          heading_color: section.heading_color || '#000000',
          sort_order: section.sort_order,
          created_at: section.created_at,
          updated_at: section.updated_at,
        });
      });
      setEditAboutSections(aboutSectionsBySubcategory);
    }
    if (pricingPlans.data) {
      const pricingPlansBySubcategory: Record<string, PricingPlan[]> = {};
      pricingPlans.data.forEach((plan: any) => {
        if (!pricingPlansBySubcategory[plan.subcategory_id]) {
          pricingPlansBySubcategory[plan.subcategory_id] = [];
        }
        // Handle features field - it might be stored as string or array
        let features: string[] = [];
        if (Array.isArray(plan.features)) {
          features = plan.features;
        } else if (typeof plan.features === 'string') {
          features = plan.features.split('\n').filter(f => f.trim());
        }
        pricingPlansBySubcategory[plan.subcategory_id].push({
          id: plan.id,
          subcategory_id: plan.subcategory_id,
          plan_name: plan.plan_name,
          price: plan.price,
          currency: plan.currency,
          duration: plan.duration,
          description: plan.description,
          features: features,
          button_label: plan.button_label,
          button_link: plan.button_link,
          razorpay_link: plan.razorpay_link,
          button_bg_color: plan.button_bg_color || null,
          card_bg_color: plan.card_bg_color || null,
          is_popular: plan.is_popular,
          is_visible: plan.is_visible,
          sort_order: plan.sort_order,
        });
      });
      setEditPricingPlansState(pricingPlansBySubcategory);
    }
    if (kfSections.data) {
      setKeyFeaturesSections(kfSections.data as unknown as SubcategoryKeyFeaturesSection[]);
      const groupedKFSections: Record<string, SubcategoryKeyFeaturesSection[]> = {};
      kfSections.data.forEach((section: any) => {
        if (!groupedKFSections[section.subcategory_id]) groupedKFSections[section.subcategory_id] = [];
        groupedKFSections[section.subcategory_id].push({
          id: section.id,
          subcategory_id: section.subcategory_id,
          heading: section.heading,
          is_visible: section.is_visible,
          sort_order: section.sort_order,
        });
      });
      setEditKeyFeaturesSections(groupedKFSections);
    }
  }

  function getSectionDisplayName(section: PageSection | undefined) {
    if (!section) return '';
    return section.name || section.heading?.trim() || section.section_type;
  }

  async function handleSectionDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const activeSection = sections.find(s => s.id === active.id);
    const overSection = sections.find(s => s.id === over.id);
    if (!activeSection || !overSection) return;
    if (activeSection.is_locked || overSection.is_locked) return;

    const oldIndex = sections.findIndex(s => s.id === active.id);
    const newIndex = sections.findIndex(s => s.id === over.id);
    const newSections = arrayMove(sections, oldIndex, newIndex).map((s, i) => ({ ...s, sort_order: i }));
    setSections(newSections);
    for (const s of newSections) {
      await updateSortOrder(s.id, s.sort_order);
    }
    toast.success('Section order saved!');
  }

  const selectedOffers = selectedOffersSectionId
    ? offers.filter((o) => o.section_id === selectedOffersSectionId).sort((a, b) => a.sort_order - b.sort_order)
    : [];
  const offersFixedModeEnabled = selectedOffers.some((o) => o.is_fixed);

  const selectedCards = selectedCardsSectionId
    ? cards.filter((c) => c.section_id === selectedCardsSectionId).sort((a, b) => a.sort_order - b.sort_order)
    : [];
  const cardsFixedModeEnabled = selectedCards.some((c) => c.is_fixed);

  const selectedAds2 = selectedAds2SectionId
    ? ads2.filter((a) => a.section_id === selectedAds2SectionId).sort((a, b) => a.sort_order - b.sort_order)
    : [];
  const ads2FixedModeEnabled = selectedAds2.some((a) => a.is_fixed);

  const selectedAds3 = selectedAds3SectionId
    ? ads3.filter((a) => a.section_id === selectedAds3SectionId).sort((a, b) => a.sort_order - b.sort_order)
    : [];
  const ads3FixedModeEnabled = selectedAds3.some((a) => a.is_fixed);

  const selectedAds1 = selectedAds1SectionId
    ? ads2.filter((a) => a.section_id === selectedAds1SectionId).sort((a, b) => a.sort_order - b.sort_order)
    : [];
  const ads1FixedModeEnabled = selectedAds1.some((a) => a.is_fixed);
  const selectedCategories = selectedCategoriesSectionId
    ? categories.filter((c) => c.section_id === selectedCategoriesSectionId).sort((a, b) => a.sort_order - b.sort_order)
    : [];

  async function handleOfferDragEnd(event: DragEndEvent) {
    if (!offersFixedModeEnabled) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = selectedOffers.findIndex((offer) => offer.id === active.id);
    const newIndex = selectedOffers.findIndex((offer) => offer.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const newOrder = arrayMove(selectedOffers, oldIndex, newIndex).map((offer, index) => ({ ...offer, sort_order: index }));
    setOffers((prev) => prev.map((offer) => {
      const updated = newOrder.find((item) => item.id === offer.id);
      return updated ? updated : offer;
    }));

    for (const offer of newOrder) {
      await updateOfferSortOrder(offer.id, offer.sort_order);
    }

    toast.success('Offer order saved!');
  }

  async function handleCardDragEnd(event: DragEndEvent) {
    if (!cardsFixedModeEnabled) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = selectedCards.findIndex((card) => card.id === active.id);
    const newIndex = selectedCards.findIndex((card) => card.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const newOrder = arrayMove(selectedCards, oldIndex, newIndex).map((card, index) => ({ ...card, sort_order: index }));
    setCards((prev) => prev.map((card) => {
      const updated = newOrder.find((item) => item.id === card.id);
      return updated ? updated : card;
    }));

    for (const card of newOrder) {
      await updateCardSortOrder(card.id, card.sort_order);
    }

    toast.success('Card order saved!');
  }

  // Functions for managing multiple About sections
  const addAboutSection = (subcategoryId: string) => {
    const newSection: SubcategoryAboutSection = {
      id: `temp-${crypto.randomUUID()}`,
      subcategory_id: subcategoryId,
      heading: 'About',
      content: '',
      background_color: '#ffffff',
      heading_color: '#000000',
      sort_order: (editAboutSections[subcategoryId] || []).length,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setEditAboutSections(prev => ({
      ...prev,
      [subcategoryId]: [...(prev[subcategoryId] || []), newSection]
    }));
  };

  const updateAboutSection = useCallback((subcategoryId: string, sectionId: string, updates: Partial<SubcategoryAboutSection>) => {
    setEditAboutSections(prev => ({
      ...prev,
      [subcategoryId]: (prev[subcategoryId] || []).map(section =>
        section.id === sectionId ? { ...section, ...updates } : section
      )
    }));
  }, []);

  // Create a stable onChange handler for each section to prevent re-renders
  const createAboutSectionChangeHandler = useCallback((subcategoryId: string, sectionId: string) => {
    return (value: string) => {
      updateAboutSection(subcategoryId, sectionId, { content: value });
    };
  }, [updateAboutSection]);

  const deleteAboutSection = async (subcategoryId: string, sectionId: string) => {
    if (!window.confirm('Delete this About section?')) return;

    try {
      await supabase.from('subcategory_about_sections' as any).delete().eq('id', sectionId);
      setEditAboutSections(prev => ({
        ...prev,
        [subcategoryId]: (prev[subcategoryId] || []).filter(section => section.id !== sectionId)
      }));
      toast.success('About section deleted.');
    } catch (error) {
      console.error('Error deleting about section:', error);
      toast.error('Failed to delete about section.');
    }
  };

  // Functions for managing multiple Key Features sections
  const addKeyFeaturesSection = (subcategoryId: string) => {
    const newSection: SubcategoryKeyFeaturesSection = {
      id: `temp-${crypto.randomUUID()}`,
      subcategory_id: subcategoryId,
      heading: 'Key Features',
      is_visible: true,
      sort_order: (editKeyFeaturesSections[subcategoryId] || []).length,
    };

    setEditKeyFeaturesSections(prev => ({
      ...prev,
      [subcategoryId]: [...(prev[subcategoryId] || []), newSection]
    }));
  };

  const updateKeyFeaturesSection = (subcategoryId: string, sectionId: string, updates: Partial<SubcategoryKeyFeaturesSection>) => {
    setEditKeyFeaturesSections(prev => ({
      ...prev,
      [subcategoryId]: (prev[subcategoryId] || []).map(section =>
        section.id === sectionId ? { ...section, ...updates } : section
      )
    }));
  };

  const deleteKeyFeaturesSection = async (subcategoryId: string, sectionId: string) => {
    if (!window.confirm('Delete this Key Features section?')) return;

    setEditKeyFeaturesSections(prev => ({
      ...prev,
      [subcategoryId]: (prev[subcategoryId] || []).filter(section => section.id !== sectionId)
    }));
    // Associated points will be filtered out by UI and re-saved correctly
  };

  const saveKeyFeaturesSections = async (subcategoryId: string, points: SubcategoryOverviewPoint[]) => {
    const sections = editKeyFeaturesSections[subcategoryId] || [];

    try {
      // Clear existing sections and points for this subcategory
      // Points will be deleted by cascade when sections are deleted, but we also delete points without sections
      await supabase.from('subcategory_overview_points' as any).delete().eq('subcategory_id', subcategoryId);
      await supabase.from('subcategory_key_features_sections' as any).delete().eq('subcategory_id', subcategoryId);

      for (let i = 0; i < sections.length; i++) {
        const section = sections[i];
        const { data: newSection, error: sectionError } = await supabase
          .from('subcategory_key_features_sections' as any)
          .insert({
            subcategory_id: subcategoryId,
            heading: section.heading || 'Key Features',
            is_visible: section.is_visible,
            sort_order: section.sort_order,
          })
          .select()
          .single();

        if (sectionError) throw sectionError;

        const sectionPoints = points.filter(p => p.section_id === section.id);
        if (sectionPoints.length > 0) {
          const pointsToInsert = sectionPoints.map((p, idx) => ({
            subcategory_id: subcategoryId,
            section_id: (newSection as any).id,
            text: p.text.trim(),
            is_highlighted: p.is_highlighted,
            highlight_color: p.highlight_color || 'green',
            sort_order: idx,
          }));
          const { error: pointsError } = await supabase.from('subcategory_overview_points' as any).insert(pointsToInsert);
          if (pointsError) throw pointsError;
        }
      }
    } catch (error) {
      console.error('Error saving key features sections:', error);
      throw error;
    }
  };

  const saveAboutSections = async (subcategoryId: string) => {
    const sections = editAboutSections[subcategoryId] || [];
    console.log('Saving About Sections for subcategory:', subcategoryId, 'Sections:', sections);

    try {
      // Clear existing sections for this subcategory
      const { error: deleteError } = await supabase.from('subcategory_about_sections' as any).delete().eq('subcategory_id', subcategoryId);
      if (deleteError) {
        console.error('Error deleting existing about sections:', deleteError);
        throw deleteError;
      }

      // Insert updated sections - save all sections
      const sectionsToInsert = sections.map((section, index) => ({
        id: section.id.startsWith('temp-') ? crypto.randomUUID() : section.id,
        subcategory_id: subcategoryId,
        heading: section.heading || '',
        content: section.content || '',
        background_color: section.background_color || '#ffffff',
        heading_color: section.heading_color || '#000000',
        sort_order: index,
        is_visible: editAboutSectionVisibility[subcategoryId]?.[section.id] ?? true,
      }));

      console.log('Sections to insert:', sectionsToInsert);

      if (sectionsToInsert.length > 0) {
        const { error: insertError } = await supabase.from('subcategory_about_sections' as any).insert(sectionsToInsert);
        if (insertError) {
          console.error('Error inserting about sections:', insertError);
          throw insertError;
        }
      }

      console.log('About Sections saved successfully for subcategory:', subcategoryId);
    } catch (error) {
      console.error('Error saving about sections:', error);
      toast.error('Failed to save about sections.');
      throw error; // Re-throw to ensure saveCategory knows about the error
    }
  };

  const handleAboutSectionDragEnd = (subcategoryId: string) => (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const sections = editAboutSections[subcategoryId] || [];
    const oldIndex = sections.findIndex((section) => section.id === active.id);
    const newIndex = sections.findIndex((section) => section.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const newOrder = arrayMove(sections, oldIndex, newIndex).map((section, index) => ({ ...section, sort_order: index }));
    setEditAboutSections(prev => ({
      ...prev,
      [subcategoryId]: newOrder
    }));
  };

  async function handleAds2DragEnd(event: DragEndEvent) {
    if (!ads2FixedModeEnabled) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = selectedAds2.findIndex((ad) => ad.id === active.id);
    const newIndex = selectedAds2.findIndex((ad) => ad.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const newOrder = arrayMove(selectedAds2, oldIndex, newIndex).map((ad, index) => ({ ...ad, sort_order: index }));
    setAds2((prev) => prev.map((ad) => {
      const updated = newOrder.find((item) => item.id === ad.id);
      return updated ? updated : ad;
    }));

    for (const ad of newOrder) {
      await updateAds2SortOrder(ad.id, ad.sort_order);
    }

    toast.success('Ad order saved!');
  }

  async function handleAds1DragEnd(event: DragEndEvent) {
    if (!ads1FixedModeEnabled) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = selectedAds1.findIndex((ad) => ad.id === active.id);
    const newIndex = selectedAds1.findIndex((ad) => ad.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const newOrder = arrayMove(selectedAds1, oldIndex, newIndex).map((ad, index) => ({ ...ad, sort_order: index }));
    setAds2((prev) => prev.map((ad) => {
      const updated = newOrder.find((item) => item.id === ad.id);
      return updated ? updated : ad;
    }));

    for (const ad of newOrder) {
      await updateAds2SortOrder(ad.id, ad.sort_order);
    }

    toast.success('Ad order saved!');
  }

  async function handleAds3DragEnd(event: DragEndEvent) {
    if (!ads3FixedModeEnabled) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = selectedAds3.findIndex((ad) => ad.id === active.id);
    const newIndex = selectedAds3.findIndex((ad) => ad.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const newOrder = arrayMove(selectedAds3, oldIndex, newIndex).map((ad, index) => ({ ...ad, sort_order: index }));
    setAds3((prev) => prev.map((ad) => {
      const updated = newOrder.find((item) => item.id === ad.id);
      return updated ? updated : ad;
    }));

    for (const ad of newOrder) {
      await updateAds3SortOrder(ad.id, ad.sort_order);
    }

    toast.success('Ad order saved!');
  }

  async function handleCategoryDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = selectedCategories.findIndex((category) => category.id === active.id);
    const newIndex = selectedCategories.findIndex((category) => category.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const newOrder = arrayMove(selectedCategories, oldIndex, newIndex).map((category, index) => ({
      ...category,
      sort_order: index,
    }));

    setCategories((prev) => prev.map((category) => {
      const updated = newOrder.find((item) => item.id === category.id);
      return updated ? updated : category;
    }));

    for (const category of newOrder) {
      await updateCategorySortOrder(category.id, category.sort_order);
    }

    toast.success('Category order saved!');
  }

  async function saveHero() {
    const words = heroWords.split(',').map(w => w.trim()).filter(Boolean);
    const { data } = await supabase.from('hero_settings').select('id').limit(1).single();
    if (data) {
      await supabase.from('hero_settings').update({ main_text: heroText, animated_words: words }).eq('id', data.id);
    }
    toast.success('Hero saved!');
  }

  async function saveCard() {
    if (!editCard) return;
    if (!editCard.title?.trim() || !editCard.description?.trim()) {
      toast.error('Title and description are required.');
      return;
    }
    try {
      if (editCard.id) {
        const updateData: any = { 
          title: editCard.title.trim(), 
          description: editCard.description.trim(), 
          logo_url: editCard.logo_url, 
          link: editCard.link || null, 
          show_border: editCard.show_border ?? false, 
          border_color: editCard.border_color ?? null,
          background_color: editCard.background_color ?? null 
        };
        if (cardsFixedModeEnabled !== undefined) {
          updateData.is_fixed = cardsFixedModeEnabled;
        }
        const { error } = await supabase.from('featured_cards').update(updateData).eq('id', editCard.id);
        if (error) throw error;
      } else {
        const insertData: any = { 
          title: editCard.title.trim(), 
          description: editCard.description.trim(), 
          logo_url: editCard.logo_url, 
          link: editCard.link || null, 
          show_border: editCard.show_border ?? false, 
          border_color: editCard.border_color ?? null, 
          background_color: editCard.background_color ?? null,
          sort_order: cards.length, 
          section_id: selectedCardsSectionId 
        };
        if (cardsFixedModeEnabled !== undefined) {
          insertData.is_fixed = cardsFixedModeEnabled;
        }
        const { error } = await supabase.from('featured_cards').insert(insertData);
        if (error) throw error;
      }
      setEditCard(null);
      loadAll();
      toast.success('Card saved!');
    } catch (error) {
      console.error('Error saving card:', error instanceof Error ? error.message : JSON.stringify(error));
      toast.error('Failed to save card. Check console for details.');
    }
  }

  async function deleteCard(id: string) {
    try {
      const { error } = await supabase.from('featured_cards').delete().eq('id', id);
      if (error) throw error;
      loadAll();
      toast.success('Deleted!');
    } catch (error) {
      console.error('Error deleting card:', error instanceof Error ? error.message : JSON.stringify(error));
      toast.error('Failed to delete card.');
    }
  }

  async function updateOfferSortOrder(offerId: string, newOrder: number) {
    try {
      const { error } = await supabase.from('offers').update({ sort_order: newOrder }).eq('id', offerId);
      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Error updating offer order:', err instanceof Error ? err.message : JSON.stringify(err));
      toast.error('Failed to save offer order.');
      return false;
    }
  }

  async function updateCardSortOrder(cardId: string, newOrder: number) {
    try {
      const { error } = await supabase.from('featured_cards').update({ sort_order: newOrder }).eq('id', cardId);
      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Error updating card order:', err instanceof Error ? err.message : JSON.stringify(err));
      toast.error('Failed to save card order.');
      return false;
    }
  }

  async function updateAds2SortOrder(adId: string, newOrder: number) {
    try {
      const { error } = await supabase.from('ads_2col').update({ sort_order: newOrder }).eq('id', adId);
      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Error updating ad order:', err instanceof Error ? err.message : JSON.stringify(err));
      toast.error('Failed to save ad order.');
      return false;
    }
  }

  // Product Tab Sections helper functions for Edit Subcategory view
  const db = supabase as any;

  const loadProductSectionContent = useCallback(async (subcategoryId: string) => {
    const sectionIds = productSections.map((section) => section.id);

    if (sectionIds.length === 0) {
      setProductCards([]);
      setProductOffers([]);
      setProductAds2([]);
      setProductAds3([]);
      setProductLogoSteps([]);
      return;
    }

    const [{ data: cardsData }, { data: offersData }, { data: ads2Data }, { data: ads3Data }, { data: logoStepsData }] = await Promise.all([
      db.from(PRODUCT_CARDS_TABLE).select('*').in('section_id', sectionIds).order('sort_order'),
      db.from(PRODUCT_OFFERS_TABLE).select('*').in('section_id', sectionIds).order('sort_order'),
      db.from(PRODUCT_ADS_2_TABLE).select('*').in('section_id', sectionIds).order('sort_order'),
      db.from(PRODUCT_ADS_3_TABLE).select('*').in('section_id', sectionIds).order('sort_order'),
      db.from(PRODUCT_LOGO_STEPS_TABLE).select('*').in('section_id', sectionIds).order('sort_order'),
    ]);

    setProductCards(((cardsData || []) as FeaturedCardItem[]).map((card) => ({ ...card, link: card.link ?? null, is_fixed: card.is_fixed ?? false, show_border: card.show_border ?? false, border_color: card.border_color ?? null })));
    setProductOffers(((offersData || []) as OfferItem[]).map((offer) => ({ ...offer, link: offer.link ?? null, is_fixed: offer.is_fixed ?? false, show_border: offer.show_border ?? false, border_color: offer.border_color ?? null })));
    setProductAds2(((ads2Data || []) as Ad2Item[]).map((ad) => ({ ...ad, link: ad.link ?? null, is_fixed: ad.is_fixed ?? false, show_border: ad.show_border ?? false, border_color: ad.border_color ?? null })));
    setProductAds3(((ads3Data || []) as Ad3Item[]).map((ad) => ({ ...ad, link: ad.link ?? null, is_fixed: ad.is_fixed ?? false, show_border: ad.show_border ?? false, border_color: ad.border_color ?? null })));
    setProductLogoSteps(((logoStepsData || []) as LogoStepItem[]).map((step) => ({ ...step, description: step.description ?? null, logo_url: step.logo_url ?? null })));
  }, [productSections]);

  const productOpenAddSectionModal = (sectionType: ProductAdminTab = 'cards') => {
    setProductAddSectionType(sectionType);
    setProductAddSectionName('');
    setProductShowAddSectionModal(true);
  };

  const productHandleAddSection = async (subcategoryId: string) => {
    const sectionType = productAddSectionType === 'layout' ? 'cards' : productAddSectionType;
    try {
      const newSection = await addProductSection(sectionType, productAddSectionName.trim() || undefined);
      setProductShowAddSectionModal(false);
      if (newSection?.id) {
        if (sectionType === 'logo_steps') setProductSelectedLogoStepsSectionId(newSection.id);
        if (sectionType === 'cards') setProductSelectedCardsSectionId(newSection.id);
        if (sectionType === 'offers') setProductSelectedOffersSectionId(newSection.id);
        if (sectionType === 'ads_1col') setProductSelectedAds1SectionId(newSection.id);
        if (sectionType === 'ads_2col') setProductSelectedAds2SectionId(newSection.id);
        if (sectionType === 'ads_3col') setProductSelectedAds3SectionId(newSection.id);
      }
      toast.success('Section added.');
      await loadProductSectionContent(subcategoryId);
    } catch (error) {
      console.error('Error adding product section:', error);
      toast.error('Failed to add section.');
    }
  };

  const productOpenHeadingModal = (sectionId: string, productSections: ScopedPageSection[]) => {
    const section = productSections.find((item) => item.id === sectionId);
    if (!section) return;
    setProductHeadingModalSectionId(sectionId);
    setProductHeadingModalValue(section.heading || section.name);
    setProductHeadingVisible(section.show_heading !== false);
    setProductHeadingBackgroundColor(section.background_color || '');
  };

  const productSaveHeadingModal = async (sectionId: string, subcategoryId: string) => {
    if (!productHeadingModalSectionId) return;

    try {
      await updateProductSection(productHeadingModalSectionId, {
        heading: productHeadingModalValue.trim(),
        show_heading: productHeadingVisible,
        background_color: productHeadingBackgroundColor || null,
      });
      setProductHeadingModalSectionId('');
      toast.success('Section updated.');
    } catch (error) {
      console.error('Error saving section heading:', error);
      toast.error('Failed to update section.');
    }
  };

  const productToggleSectionVisibility = async (sectionId: string, visible: boolean, subcategoryId: string) => {
    try {
      await updateProductSection(sectionId, { is_visible: visible });
    } catch (error) {
      console.error('Error toggling section visibility:', error);
      toast.error('Failed to update visibility.');
    }
  };

  const productDeleteSection = async (sectionId: string, subcategoryId: string) => {
    if (!window.confirm('Delete this section and its items?')) return;
    try {
      await deleteProductSection(sectionId);
      toast.success('Section deleted.');
      await loadProductSectionContent(subcategoryId);
    } catch (error) {
      console.error('Error deleting product section:', error);
      toast.error('Failed to delete section.');
    }
  };

  const productUpdateSectionOrder = async (orderedSections: ScopedPageSection[]) => {
    const updates = orderedSections.map((section, index) =>
      db.from(PRODUCT_SECTION_TABLE).update({ sort_order: index }).eq('id', section.id)
    );
    const results = await Promise.all(updates);
    const failed = results.find((result) => result.error);
    if (failed?.error) throw failed.error;
    void refetchProductSections();
    toast.success('Section order saved.');
  };

  const productHandleSectionDragEnd = async (event: DragEndEvent, currentSections: ScopedPageSection[], subcategoryId: string) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = currentSections.findIndex((section) => section.id === active.id);
    const newIndex = currentSections.findIndex((section) => section.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(currentSections, oldIndex, newIndex);
    setProductSectionsLocal(reordered);
    try {
      await productUpdateSectionOrder(reordered);
    } catch (error) {
      console.error('Error updating section order:', error);
      toast.error('Failed to save section order.');
      await refetchProductSections();
    }
  };

  const productUpdateItemOrder = async (tableName: string, items: { id: string }[]) => {
    for (const [index, item] of items.entries()) {
      await db.from(tableName).update({ sort_order: index }).eq('id', item.id);
    }
  };

  const productCreateItemDragHandler = (
    items: { id: string; sort_order: number }[],
    tableName: string,
    enabled: boolean
  ) => {
    return async (event: DragEndEvent) => {
      if (!enabled) return;
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = arrayMove(items, oldIndex, newIndex);
      await productUpdateItemOrder(tableName, reordered);
      toast.success('Item order saved.');
    };
  };

  const productToggleFixedMode = async (tableName: string, sectionId: string, enabled: boolean, subcategoryId: string) => {
    try {
      await db.from(tableName).update({ is_fixed: enabled }).eq('section_id', sectionId);
      await loadProductSectionContent(subcategoryId);
      toast.success(`Fixed mode ${enabled ? 'enabled' : 'disabled'}.`);
    } catch (error) {
      console.error('Error toggling fixed mode:', error);
      toast.error('Failed to update fixed mode.');
    }
  };

  const productSaveCard = async (subcategoryId: string) => {
    if (!productEditCard?.title?.trim() || !productEditCard.description?.trim() || !productSelectedCardsSectionId) {
      toast.error('Title, description, and section are required.');
      return;
    }

    const selectedCards = productCards.filter((card) => card.section_id === productSelectedCardsSectionId).sort((a, b) => a.sort_order - b.sort_order);
    const cardsFixedModeEnabled = selectedCards.some((card) => card.is_fixed);

    try {
      if (productEditCard.id) {
        await db
          .from(PRODUCT_CARDS_TABLE)
          .update({
            title: productEditCard.title.trim(),
            description: productEditCard.description.trim(),
            logo_url: productEditCard.logo_url || null,
            link: productEditCard.link || null,
            show_border: productEditCard.show_border ?? false,
            border_color: productEditCard.border_color ?? null,
            background_color: productEditCard.background_color ?? null,
            is_fixed: cardsFixedModeEnabled,
          })
          .eq('id', productEditCard.id);
      } else {
        await db.from(PRODUCT_CARDS_TABLE).insert({
          title: productEditCard.title.trim(),
          description: productEditCard.description.trim(),
          logo_url: productEditCard.logo_url || null,
          link: productEditCard.link || null,
          show_border: productEditCard.show_border ?? false,
          border_color: productEditCard.border_color ?? null,
          background_color: productEditCard.background_color ?? null,
          sort_order: selectedCards.length,
          section_id: productSelectedCardsSectionId,
          is_fixed: cardsFixedModeEnabled,
        });
      }

      setProductEditCard(null);
      await loadProductSectionContent(subcategoryId);
      toast.success('Card saved.');
    } catch (error) {
      console.error('Error saving card:', error);
      toast.error('Failed to save card.');
    }
  };

  const productSaveOffer = async (subcategoryId: string) => {
    const hasOfferContent =
      Boolean(productEditOffer?.image_url) ||
      Boolean(productEditOffer?.heading?.trim()) ||
      Boolean(productEditOffer?.description?.trim());

    if (!hasOfferContent || !productSelectedOffersSectionId) {
      toast.error('Add an image, heading, or description.');
      return;
    }

    const selectedOffers = productOffers.filter((offer) => offer.section_id === productSelectedOffersSectionId).sort((a, b) => a.sort_order - b.sort_order);
    const offersFixedModeEnabled = selectedOffers.some((offer) => offer.is_fixed);

    try {
      if (productEditOffer.id) {
        await db
          .from(PRODUCT_OFFERS_TABLE)
          .update({
            heading: productEditOffer.heading?.trim() || '',
            description: productEditOffer.description || null,
            image_url: productEditOffer.image_url || null,
            link: productEditOffer.link || null,
            show_border: productEditOffer.show_border ?? false,
            border_color: productEditOffer.border_color ?? null,
            is_fixed: offersFixedModeEnabled,
          })
          .eq('id', productEditOffer.id);
      } else {
        await db.from(PRODUCT_OFFERS_TABLE).insert({
          heading: productEditOffer.heading?.trim() || '',
          description: productEditOffer.description || null,
          image_url: productEditOffer.image_url || null,
          link: productEditOffer.link || null,
          show_border: productEditOffer.show_border ?? false,
          border_color: productEditOffer.border_color ?? null,
          sort_order: selectedOffers.length,
          section_id: productSelectedOffersSectionId,
          is_fixed: offersFixedModeEnabled,
        });
      }

      setProductEditOffer(null);
      await loadProductSectionContent(subcategoryId);
      toast.success('Offer saved.');
    } catch (error) {
      console.error('Error saving offer:', error);
      toast.error('Failed to save offer.');
    }
  };

  const productSaveAd1 = async (subcategoryId: string) => {
    if (!productSelectedAds1SectionId) {
      toast.error('Please select an Ad 1 section.');
      return;
    }

    const selectedAds1 = productAds2.filter((ad) => ad.section_id === productSelectedAds1SectionId).sort((a, b) => a.sort_order - b.sort_order);
    const ads1FixedModeEnabled = selectedAds1.some((ad) => ad.is_fixed);

    try {
      if (productEditAd1?.id) {
        await db
          .from(PRODUCT_ADS_2_TABLE)
          .update({
            image_url: productEditAd1.image_url || null,
            link: productEditAd1.link || null,
            show_border: productEditAd1.show_border ?? false,
            border_color: productEditAd1.border_color ?? null,
            is_fixed: ads1FixedModeEnabled,
          })
          .eq('id', productEditAd1.id);
      } else {
        await db.from(PRODUCT_ADS_2_TABLE).insert({
          image_url: productEditAd1?.image_url || null,
          link: productEditAd1?.link || null,
          show_border: productEditAd1?.show_border ?? false,
          border_color: productEditAd1?.border_color ?? null,
          sort_order: selectedAds1.length,
          section_id: productSelectedAds1SectionId,
          is_fixed: ads1FixedModeEnabled,
        });
      }

      setProductEditAd1(null);
      await loadProductSectionContent(subcategoryId);
      toast.success('Ad saved.');
    } catch (error) {
      console.error('Error saving ad 1:', error);
      toast.error('Failed to save ad.');
    }
  };

  const productSaveAd2 = async (subcategoryId: string) => {
    if (!productSelectedAds2SectionId) {
      toast.error('Please select an Ad 2 section.');
      return;
    }

    const selectedAds2 = productAds2.filter((ad) => ad.section_id === productSelectedAds2SectionId).sort((a, b) => a.sort_order - b.sort_order);
    const ads2FixedModeEnabled = selectedAds2.some((ad) => ad.is_fixed);

    try {
      if (productEditAd2?.id) {
        await db
          .from(PRODUCT_ADS_2_TABLE)
          .update({
            image_url: productEditAd2.image_url || null,
            link: productEditAd2.link || null,
            show_border: productEditAd2.show_border ?? false,
            border_color: productEditAd2.border_color ?? null,
            is_fixed: ads2FixedModeEnabled,
          })
          .eq('id', productEditAd2.id);
      } else {
        await db.from(PRODUCT_ADS_2_TABLE).insert({
          image_url: productEditAd2?.image_url || null,
          link: productEditAd2?.link || null,
          show_border: productEditAd2?.show_border ?? false,
          border_color: productEditAd2?.border_color ?? null,
          sort_order: selectedAds2.length,
          section_id: productSelectedAds2SectionId,
          is_fixed: ads2FixedModeEnabled,
        });
      }

      setProductEditAd2(null);
      await loadProductSectionContent(subcategoryId);
      toast.success('Ad saved.');
    } catch (error) {
      console.error('Error saving ad 2:', error);
      toast.error('Failed to save ad.');
    }
  };

  const productSaveAd3 = async (subcategoryId: string) => {
    if (!productSelectedAds3SectionId) {
      toast.error('Please select an Ad 3 section.');
      return;
    }

    const selectedAds3 = productAds3.filter((ad) => ad.section_id === productSelectedAds3SectionId).sort((a, b) => a.sort_order - b.sort_order);
    const ads3FixedModeEnabled = selectedAds3.some((ad) => ad.is_fixed);

    try {
      if (productEditAd3?.id) {
        await db
          .from(PRODUCT_ADS_3_TABLE)
          .update({
            image_url: productEditAd3.image_url || null,
            heading: productEditAd3.heading || null,
            description: productEditAd3.description || null,
            link: productEditAd3.link || null,
            show_border: productEditAd3.show_border ?? false,
            border_color: productEditAd3.border_color ?? null,
            is_fixed: ads3FixedModeEnabled,
          })
          .eq('id', productEditAd3.id);
      } else {
        await db.from(PRODUCT_ADS_3_TABLE).insert({
          image_url: productEditAd3?.image_url || null,
          heading: productEditAd3?.heading || null,
          description: productEditAd3?.description || null,
          link: productEditAd3?.link || null,
          show_border: productEditAd3?.show_border ?? false,
          border_color: productEditAd3?.border_color ?? null,
          sort_order: selectedAds3.length,
          section_id: productSelectedAds3SectionId,
          is_fixed: ads3FixedModeEnabled,
        });
      }

      setProductEditAd3(null);
      await loadProductSectionContent(subcategoryId);
      toast.success('Ad saved.');
    } catch (error) {
      console.error('Error saving ad 3:', error);
      toast.error('Failed to save ad.');
    }
  };

  const productSaveLogoStep = async (subcategoryId: string) => {
    if (!productEditLogoStep?.title?.trim() || !productSelectedLogoStepsSectionId) {
      toast.error('Title and section are required.');
      return;
    }

    const selectedLogoSteps = productLogoSteps.filter((step) => step.section_id === productSelectedLogoStepsSectionId).sort((a, b) => a.sort_order - b.sort_order);

    try {
      if (productEditLogoStep.id) {
        const { error } = await db
          .from(PRODUCT_LOGO_STEPS_TABLE)
          .update({
            title: productEditLogoStep.title.trim(),
            description: productEditLogoStep.description || null,
            logo_url: productEditLogoStep.logo_url || null,
            link: productEditLogoStep.link || null,
          })
          .eq('id', productEditLogoStep.id);
        if (error) throw error;
      } else {
        const { error } = await db.from(PRODUCT_LOGO_STEPS_TABLE).insert({
          title: productEditLogoStep.title.trim(),
          description: productEditLogoStep.description || null,
          logo_url: productEditLogoStep.logo_url || null,
          link: productEditLogoStep.link || null,
          sort_order: selectedLogoSteps.length,
          section_id: productSelectedLogoStepsSectionId,
        });
        if (error) throw error;
      }

      setProductEditLogoStep(null);
      await loadProductSectionContent(subcategoryId);
      toast.success('Logo step saved.');
    } catch (error) {
      console.error('Error saving logo step:', error);
      const message = error instanceof Error ? error.message : 'Failed to save logo step.';
      toast.error(message);
    }
  };

  const productDeleteItem = async (tableName: string, itemId: string, subcategoryId: string) => {
    try {
      await db.from(tableName).delete().eq('id', itemId);
      await loadProductSectionContent(subcategoryId);
      toast.success('Deleted.');
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Failed to delete item.');
    }
  };

  useEffect(() => {
    if (!editingSubcategoryId) return;
    loadProductSectionContent(editingSubcategoryId);
  }, [editingSubcategoryId, productSections, loadProductSectionContent]);

  useEffect(() => {
    const firstByType = (type: string) => productSections.find((s) => s.section_type === type)?.id || '';
    setProductSelectedCardsSectionId((current) => current && productSections.some((s) => s.id === current) ? current : firstByType('cards'));
    setProductSelectedOffersSectionId((current) => current && productSections.some((s) => s.id === current) ? current : firstByType('offers'));
    setProductSelectedAds1SectionId((current) => current && productSections.some((s) => s.id === current) ? current : firstByType('ads_1col'));
    setProductSelectedAds2SectionId((current) => current && productSections.some((s) => s.id === current) ? current : firstByType('ads_2col'));
    setProductSelectedAds3SectionId((current) => current && productSections.some((s) => s.id === current) ? current : firstByType('ads_3col'));
    setProductSelectedLogoStepsSectionId((current) => current && productSections.some((s) => s.id === current) ? current : firstByType('logo_steps'));
  }, [productSections]);

  async function updateAds3SortOrder(adId: string, newOrder: number) {
    try {
      const { error } = await supabase.from('ads_3col').update({ sort_order: newOrder }).eq('id', adId);
      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Error updating ad order:', err instanceof Error ? err.message : JSON.stringify(err));
      toast.error('Failed to save ad order.');
      return false;
    }
  }

  async function toggleOffersFixedMode(sectionId: string, enabled: boolean) {
    try {
      const { error } = await supabase.from('offers').update({ is_fixed: enabled }).eq('section_id', sectionId);
      if (error) throw error;
      setOffers((prev) => prev.map((offer) => offer.section_id === sectionId ? { ...offer, is_fixed: enabled } : offer));
      toast.success(`Fixed Mode ${enabled ? 'enabled' : 'disabled'}!`);
      return true;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error('Error toggling fixed mode:', err);
      toast.error(`Failed to update Fixed Mode: ${errorMessage}`);
      return false;
    }
  }

  async function toggleCardsFixedMode(sectionId: string, enabled: boolean) {
    try {
      const { error } = await supabase.from('featured_cards').update({ is_fixed: enabled } as any).eq('section_id', sectionId);
      if (error) throw error;
      setCards((prev) => prev.map((card) => card.section_id === sectionId ? { ...card, is_fixed: enabled } : card));
      toast.success(`Fixed Mode ${enabled ? 'enabled' : 'disabled'}!`);
      return true;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error('Error toggling fixed mode:', err);
      toast.error(`Failed to update Fixed Mode: ${errorMessage}`);
      return false;
    }
  }

  async function toggleAds2FixedMode(sectionId: string, enabled: boolean) {
    try {
      const { error } = await supabase.from('ads_2col').update({ is_fixed: enabled } as any).eq('section_id', sectionId);
      if (error) throw error;
      setAds2((prev) => prev.map((ad) => ad.section_id === sectionId ? { ...ad, is_fixed: enabled } : ad));
      toast.success(`Fixed Mode ${enabled ? 'enabled' : 'disabled'}!`);
      return true;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error('Error toggling fixed mode:', err);
      toast.error(`Failed to update Fixed Mode: ${errorMessage}`);
      return false;
    }
  }

  async function toggleAds3FixedMode(sectionId: string, enabled: boolean) {
    try {
      const { error } = await supabase.from('ads_3col').update({ is_fixed: enabled } as any).eq('section_id', sectionId);
      if (error) throw error;
      setAds3((prev) => prev.map((ad) => ad.section_id === sectionId ? { ...ad, is_fixed: enabled } : ad));
      toast.success(`Fixed Mode ${enabled ? 'enabled' : 'disabled'}!`);
      return true;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error('Error toggling fixed mode:', err);
      toast.error(`Failed to update Fixed Mode: ${errorMessage}`);
      return false;
    }
  }

  async function deleteCategory(id: string) {
    try {
      const { error } = await supabase.from('categories' as any).delete().eq('id', id);
      if (error) throw error;
      loadAll();
      toast.success('Deleted!');
    } catch (error) {
      console.error('Error deleting category:', error instanceof Error ? error.message : JSON.stringify(error));
      toast.error('Failed to delete category.');
    }
  }

  async function toggleCategoryVisibility(id: string, isVisible: boolean) {
    try {
      const { error } = await supabase
        .from('categories' as any)
        .update({ is_visible: isVisible })
        .eq('id', id);
      if (error) throw error;
      loadAll();
      toast.success(isVisible ? 'Category is now visible.' : 'Category is now hidden.');
    } catch (error) {
      console.error('Error toggling category visibility:', error instanceof Error ? error.message : JSON.stringify(error));
      toast.error('Failed to update category visibility.');
    }
  }

  async function updateCategorySortOrder(categoryId: string, newOrder: number) {
    try {
      const { error } = await supabase.from('categories' as any).update({ sort_order: newOrder }).eq('id', categoryId);
      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Error updating category order:', err instanceof Error ? err.message : JSON.stringify(err));
      toast.error('Failed to save category order.');
      return false;
    }
  }

  async function saveCategory() {
    if (!editCategory) return;
    if (!editCategory.name?.trim()) {
      toast.error('Category name is required.');
      return;
    }
    if (!selectedCategoriesSectionId) {
      toast.error('Please select a section first.');
      return;
    }

    setIsSavingCategory(true);
    try {
      const activeSubId = editingSubcategoryId || '';
      const effectiveButtonsState = activeSubId
        ? { ...editButtonsState, [activeSubId]: editButtons }
        : editButtonsState;
      const effectiveSubDownloadsState = activeSubId
        ? { ...editSubDownloadsState, [activeSubId]: editSubDownloads }
        : editSubDownloadsState;
      const effectiveSubBrandsState = activeSubId
        ? { ...editSubBrandsState, [activeSubId]: editSubBrands }
        : editSubBrandsState;
      const effectiveSubOverviewPointsState = activeSubId
        ? { ...editSubOverviewPointsState, [activeSubId]: editSubOverviewPoints }
        : editSubOverviewPointsState;
      const effectivePricingPlansState = activeSubId
        ? { ...editPricingPlansState, [activeSubId]: editPricingPlans }
        : editPricingPlansState;

      let categoryId = editCategory.id;

      // Save category
      if (categoryId) {
        // Update existing category
        const { error: catError } = await supabase
          .from('categories' as any)
          .update({
            name: editCategory.name,
            icon_url: editCategory.icon_url,
            bg_color: editCategory.bg_color,
            show_downloads_tab: editCategory.show_downloads_tab ?? true,
            show_brands_tab: editCategory.show_brands_tab ?? true,
            is_visible: editCategory.is_visible ?? true,
            section_id: selectedCategoriesSectionId
          })
          .eq('id', categoryId);
        if (catError) throw catError;
      } else {
        // Create new category
        const { data: newCat, error: catError } = await supabase
          .from('categories' as any)
          .insert({
            name: editCategory.name,
            icon_url: editCategory.icon_url,
            bg_color: editCategory.bg_color,
            show_downloads_tab: editCategory.show_downloads_tab ?? true,
            show_brands_tab: editCategory.show_brands_tab ?? true,
            is_visible: editCategory.is_visible ?? true,
            section_id: selectedCategoriesSectionId,
            sort_order: selectedCategories.length
          })
          .select()
          .single();
        if (catError) throw catError;
        categoryId = (newCat as any).id;
      }

      // Save subcategories
      if (categoryId) {
        // Upsert subcategories (handles both insert and update)
        const subsToUpsert = editSubs.map((sub, index) => ({
          id: sub.id,
          category_id: categoryId,
          name: sub.name,
          link: sub.link || null,
          custom_link: sub.custom_link || null,
          custom_link_type: sub.custom_link_type || 'link',
          video_url: sub.video_url,
          video_url_2: (sub.video_url_2 || []).filter(url => url?.trim()).map(url => url.trim()) || null,
          schedule_link: sub.schedule_link,
          show_schedule_in_separate_tab: sub.show_schedule_in_separate_tab ?? false,
          schedule_link_2: sub.schedule_link_2,
          show_schedule_2_in_separate_tab: sub.show_schedule_2_in_separate_tab ?? false,
          about_heading: sub.about_heading || 'About',
          about_subheading: sub.about_subheading || null,
          about_content: sub.about_content || null,
          demo_form_heading: sub.demo_form_heading || 'See The Software In Action\nWatch Free Demo!',
          demo_button_label: sub.demo_button_label || 'Get Free Advice',
          overview_points_heading: editKeyFeaturesTabLabelState[sub.id] || sub.overview_points_heading || 'Header',
          detail_description: sub.detail_description || null,
          hero_background_color: sub.hero_background_color || null,
          show_downloads: editShowDownloadsState[sub.id] ?? false,
          show_brands: editShowBrandsState[sub.id] ?? true,
          show_resources: editShowResourcesState[sub.id] ?? false,
          show_about_section: editShowAboutSectionState[sub.id] ?? true,
          show_header_points_section: editShowHeaderPointsSectionState[sub.id] ?? true,
          show_pricing_plans: editShowPricingPlansState[sub.id] ?? true,
          resources_tab_label: editResourcesTabLabelState[sub.id] ?? 'Resources',
          downloads_tab_label: editDownloadsTabLabelState[sub.id] ?? 'Downloads',
          brands_tab_label: editBrandsTabLabelState[sub.id] ?? 'Brands',
          pricing_plans_tab_label: editPricingPlansTabLabelState[sub.id] || 'Pricing Plans',
          key_features_tab_label: editKeyFeaturesTabLabelState[sub.id] || 'Key Features',
          form_link: sub.form_link || null,
          show_form_in_separate_tab: sub.show_form_in_separate_tab ?? false,
          tab_order: editTabOrderState[sub.id] || ['overview', 'resources', 'downloads', 'key_features', 'pricing', 'brands', 'form'],
          about_bg_color: sub.about_bg_color || null,
          about_heading_color: sub.about_heading_color || null,
          about_subheading_color: sub.about_subheading_color || null,
          about_description_color: sub.about_description_color || null,
          about_button_bg_color: sub.about_button_bg_color || null,
          about_button_text_color: sub.about_button_text_color || null,
          demo_form_heading_color: sub.demo_form_heading_color || null,
          sort_order: index,
        }));
        
        const { error: subError } = await supabase.from('subcategories').upsert(subsToUpsert as any);
        if (subError) throw subError;

        // Delete any subcategories in the database that are no longer in editSubs
        const subIds = editSubs.map(s => s.id);
        const deleteSubcategories = supabase.from('subcategories').delete().eq('category_id', categoryId).not('id', 'in', `(${subIds.join(',')})`);
        // When editing a specific subcategory, only delete its data; otherwise delete all
        const deleteButtons = activeSubId
          ? supabase.from('category_buttons').delete().eq('subcategory_id', activeSubId)
          : supabase.from('category_buttons').delete().in('subcategory_id', subIds);
        const deleteSubDownloads = activeSubId
          ? supabase.from('subcategory_downloads' as any).delete().eq('subcategory_id', activeSubId)
          : supabase.from('subcategory_downloads' as any).delete().in('subcategory_id', subIds);
        const deleteSubBrands = activeSubId
          ? supabase.from('subcategory_brands' as any).delete().eq('subcategory_id', activeSubId)
          : supabase.from('subcategory_brands' as any).delete().in('subcategory_id', subIds);
        const deletePricingPlans = activeSubId
          ? supabase.from('pricing_plans' as any).delete().eq('subcategory_id', activeSubId)
          : supabase.from('pricing_plans' as any).delete().in('subcategory_id', subIds);

        // Run all deletes in parallel
        await Promise.all([
          deleteSubcategories,
          deleteButtons,
          deleteSubDownloads,
          deleteSubBrands,
          deletePricingPlans,
        ]);

        // Insert new buttons for each subcategory
        const buttonsToInsert = [];
        if (activeSubId) {
          // Only save buttons for the actively edited subcategory
          const subButtons = effectiveButtonsState[activeSubId] || [];
          subButtons.forEach((button, index) => {
            if (button.label?.trim() || button.link?.trim()) {
              buttonsToInsert.push({
                id: button.id || crypto.randomUUID(),
                subcategory_id: activeSubId,
                label: button.label?.trim() || 'Button',
                link: button.link?.trim() || null,
                is_visible: button.is_visible,
                sort_order: index,
              });
            }
          });
        } else {
          // Save buttons for all subcategories when editing the whole category
          for (const sub of editSubs) {
            const subButtons = effectiveButtonsState[sub.id] || [];
            subButtons.forEach((button, index) => {
              if (button.label?.trim() || button.link?.trim()) {
                buttonsToInsert.push({
                  id: button.id || crypto.randomUUID(),
                  subcategory_id: sub.id,
                  label: button.label?.trim() || 'Button',
                  link: button.link?.trim() || null,
                  is_visible: button.is_visible,
                  sort_order: index,
                });
              }
            });
          }
        }

        // Insert new subcategory downloads
        const subDownloadsToInsert = [];
        if (activeSubId) {
          // Only save downloads for the actively edited subcategory
          const subDownloads = effectiveSubDownloadsState[activeSubId] || [];
          subDownloads.forEach((download, index) => {
            if (download.file_name && download.file_url) {
              subDownloadsToInsert.push({
                id: download.id || crypto.randomUUID(),
                subcategory_id: activeSubId,
                file_name: download.file_name,
                file_url: download.file_url,
                file_type: download.file_type || 'pdf',
              });
            }
          });
        } else {
          // Save downloads for all subcategories when editing the whole category
          for (const subId of subIds) {
            const subDownloads = effectiveSubDownloadsState[subId] || [];
            subDownloads.forEach((download, index) => {
              if (download.file_name && download.file_url) {
                subDownloadsToInsert.push({
                  id: download.id || crypto.randomUUID(),
                  subcategory_id: subId,
                  file_name: download.file_name,
                  file_url: download.file_url,
                  file_type: download.file_type || 'pdf',
                });
              }
            });
          }
        }

        // Insert new subcategory brands
        const subBrandsToInsert = [];
        if (activeSubId) {
          // Only save brands for the actively edited subcategory
          const subBrands = effectiveSubBrandsState[activeSubId] || [];
          subBrands.forEach((brand, index) => {
            if (brand.name) {
              subBrandsToInsert.push({
                id: brand.id || crypto.randomUUID(),
                subcategory_id: activeSubId,
                name: brand.name,
                logo_url: brand.logo_url,
                link: brand.link,
                description: brand.description,
                buttons: brand.buttons || [],
                is_visible: brand.is_visible,
                sort_order: index,
                primary_cta_label: brand.primary_cta_label,
                primary_cta_link: brand.primary_cta_link,
                primary_cta_visible: brand.primary_cta_visible,
                more_actions_label: brand.more_actions_label,
                more_actions_visible: brand.more_actions_visible,
                join_network_label: brand.join_network_label,
                join_network_link: brand.join_network_link,
                join_network_visible: brand.join_network_visible,
              });
            }
          });
        } else {
          // Save brands for all subcategories when editing the whole category
          for (const subId of subIds) {
            const subBrands = effectiveSubBrandsState[subId] || [];
            subBrands.forEach((brand, index) => {
              if (brand.name) {
                subBrandsToInsert.push({
                  id: brand.id || crypto.randomUUID(),
                  subcategory_id: subId,
                  name: brand.name,
                  logo_url: brand.logo_url,
                  link: brand.link,
                  description: brand.description,
                  buttons: brand.buttons || [],
                  is_visible: brand.is_visible,
                  sort_order: index,
                  primary_cta_label: brand.primary_cta_label,
                  primary_cta_link: brand.primary_cta_link,
                  primary_cta_visible: brand.primary_cta_visible,
                  more_actions_label: brand.more_actions_label,
                  more_actions_visible: brand.more_actions_visible,
                  join_network_label: brand.join_network_label,
                  join_network_link: brand.join_network_link,
                  join_network_visible: brand.join_network_visible,
                });
              }
            });
          }
        }

        // Insert new pricing plans
        const pricingPlansToInsert = [];
        if (activeSubId) {
          // Only save pricing plans for the actively edited subcategory
          const pricingPlans = effectivePricingPlansState[activeSubId] || [];
          pricingPlans.forEach((plan, index) => {
            if (plan.plan_name.trim() && plan.price.trim()) {
              pricingPlansToInsert.push({
                id: plan.id || crypto.randomUUID(),
                subcategory_id: activeSubId,
                plan_name: plan.plan_name.trim(),
                price: plan.price.trim(),
                currency: plan.currency || '₹',
                duration: plan.duration || '/month',
                description: plan.description?.trim() || null,
                features: (plan.features || []).filter(f => f.trim()),
                button_label: plan.button_label || 'Get started',
                button_link: plan.button_link || null,
                razorpay_link: plan.razorpay_link || null,
                button_bg_color: plan.button_bg_color || null,
                card_bg_color: plan.card_bg_color || null,
                is_popular: plan.is_popular || false,
                is_visible: plan.is_visible !== false,
                sort_order: index,
              });
            }
          });
        } else {
          // Save pricing plans for all subcategories when editing the whole category
          for (const subId of subIds) {
            const pricingPlans = effectivePricingPlansState[subId] || [];
            pricingPlans.forEach((plan, index) => {
              if (plan.plan_name.trim() && plan.price.trim()) {
                pricingPlansToInsert.push({
                  id: plan.id || crypto.randomUUID(),
                  subcategory_id: subId,
                  plan_name: plan.plan_name.trim(),
                  price: plan.price.trim(),
                  currency: plan.currency || '₹',
                  duration: plan.duration || '/month',
                  description: plan.description?.trim() || null,
                  features: (plan.features || []).filter(f => f.trim()),
                  button_label: plan.button_label || 'Get started',
                  button_link: plan.button_link || null,
                  razorpay_link: plan.razorpay_link || null,
                  button_bg_color: plan.button_bg_color || null,
                  card_bg_color: plan.card_bg_color || null,
                  is_popular: plan.is_popular || false,
                  is_visible: plan.is_visible !== false,
                  sort_order: index,
                });
              }
            });
          }
        }

        // Run all inserts in parallel
        await Promise.all([
          buttonsToInsert.length > 0 ? supabase.from('category_buttons').insert(buttonsToInsert) : Promise.resolve(),
          subDownloadsToInsert.length > 0 ? supabase.from('subcategory_downloads' as any).insert(subDownloadsToInsert) : Promise.resolve(),
          (async () => {
            if (subBrandsToInsert.length === 0) return;
            try {
              const { error } = await supabase.from('subcategory_brands' as any).insert(subBrandsToInsert);
              if (error) throw error;
            } catch (err) {
              console.warn('Failed to insert subcategory brands, retrying without new columns...', err);
              const safeBrands = subBrandsToInsert.map(({ 
                is_visible, 
                primary_cta_label, primary_cta_link, primary_cta_visible,
                more_actions_label, more_actions_visible,
                join_network_label, join_network_link, join_network_visible,
                ...rest 
              }) => rest);
              const { error: secondError } = await supabase.from('subcategory_brands' as any).insert(safeBrands);
              if (secondError) throw secondError;
            }
          })(),
          (async () => {
            if (pricingPlansToInsert.length === 0) return;
            try {
              const { error } = await supabase.from('pricing_plans' as any).insert(pricingPlansToInsert);
              if (error) throw error;
            } catch (err) {
              console.warn('Failed to insert pricing plans, retrying with safe fields...', err);
              // Fallback: try inserting without potentially new columns
              const safePricingPlans = pricingPlansToInsert.map(({ button_bg_color, card_bg_color, is_visible, ...rest }) => rest);
              const { error: secondError } = await supabase.from('pricing_plans' as any).insert(safePricingPlans);
              if (secondError) throw secondError;
            }
          })(),
        ]);

        // Save About sections for each subcategory in parallel
        await Promise.all(subIds.map(subId => saveAboutSections(subId)));
        // Save Key Features sections for each subcategory in parallel
        await Promise.all(subIds.map(subId => saveKeyFeaturesSections(subId, effectiveSubOverviewPointsState[subId] || [])));
      }

      // Save downloads
      // Delete existing downloads
      await supabase.from('category_downloads').delete().eq('category_id', categoryId);

      // Insert new downloads
      const validDownloads = editDownloads.filter(download => download.file_name && download.file_url && download.file_type);
      const downloadsToInsert = validDownloads.map(download => ({
        category_id: categoryId,
        file_name: download.file_name!,
        file_url: download.file_url!,
        file_type: download.file_type!,
      }));
      if (downloadsToInsert.length > 0) {
        const { error: downloadError } = await supabase.from('category_downloads').insert(downloadsToInsert);
        if (downloadError) throw downloadError;
      }

      toast.success('Category saved successfully!');
      setEditCategory(null);
      setEditSubs([]);
      setEditDownloads([]);
      loadAll();
    } catch (error) {
      console.error('Error saving category:', error instanceof Error ? error.message : JSON.stringify(error));
      toast.error('Failed to save category.');
    } finally {
      setIsSavingCategory(false);
    }
  }

  async function saveContactSettings() {
    setIsSavingContact(true);
    try {
      const { error } = await supabase
        .from('contact_settings' as any)
        .upsert({
          ...contactSettings,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      toast.success('Contact page settings saved successfully');
    } catch (error) {
      console.error('Error saving contact settings:', error);
      toast.error('Failed to save contact settings');
    } finally {
      setIsSavingContact(false);
    }
  }

  async function handleSaveHeader() {
    setIsSavingHeader(true);
    try {
      const { error } = await supabase
        .from('header_settings' as any)
        .upsert({
          ...headerSettings,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      toast.success('Header settings saved successfully');
    } catch (error) {
      console.error('Error saving header settings:', error);
      toast.error('Failed to save header settings');
    } finally {
      setIsSavingHeader(false);
    }
  }

  async function saveOffer() {
    if (!editOffer) return;
    const hasOfferContent =
      Boolean(editOffer.image_url) ||
      Boolean(editOffer.heading?.trim()) ||
      Boolean(editOffer.description?.trim());

    if (!hasOfferContent) {
      toast.error('Add an image, heading, or description.');
      return;
    }
    try {
      const selectedOffersCount = selectedOffers.length;

      if (editOffer.id) {
        const updateData: any = { heading: editOffer.heading?.trim() || '', description: editOffer.description, image_url: editOffer.image_url, link: editOffer.link, show_border: editOffer.show_border ?? false, border_color: editOffer.border_color ?? null };
        if (offersFixedModeEnabled !== undefined) {
          updateData.is_fixed = offersFixedModeEnabled;
        }
        const { error } = await supabase.from('offers').update(updateData).eq('id', editOffer.id);
        if (error) throw error;
      } else {
        const insertData: any = {
          heading: editOffer.heading?.trim() || '',
          description: editOffer.description,
          image_url: editOffer.image_url,
          link: editOffer.link,
          show_border: editOffer.show_border ?? false,
          border_color: editOffer.border_color ?? null,
          sort_order: selectedOffersCount,
          section_id: selectedOffersSectionId,
        };
        if (offersFixedModeEnabled !== undefined) {
          insertData.is_fixed = offersFixedModeEnabled;
        }
        const { error } = await supabase.from('offers').insert(insertData);
        if (error) throw error;
      }
      setEditOffer(null); loadAll(); toast.success('Offer saved!');
    } catch (error) {
      console.error('Error saving offer:', error instanceof Error ? error.message : JSON.stringify(error));
      toast.error('Failed to save offer.');
    }
  }

  async function deleteOffer(id: string) {
    try {
      const { error } = await supabase.from('offers').delete().eq('id', id);
      if (error) throw error;
      loadAll();
      toast.success('Deleted!');
    } catch (error) {
      console.error('Error deleting offer:', error instanceof Error ? error.message : JSON.stringify(error));
      toast.error('Failed to delete offer.');
    }
  }

  async function saveAd2() {
    if (!editAd2) return;
    try {
      if (editAd2.id) {
        const updateData: any = { image_url: editAd2.image_url, link: editAd2.link, show_border: editAd2.show_border ?? false, border_color: editAd2.border_color ?? null };
        if (ads2FixedModeEnabled !== undefined) {
          updateData.is_fixed = ads2FixedModeEnabled;
        }
        const { error } = await supabase.from('ads_2col').update(updateData).eq('id', editAd2.id);
        if (error) throw error;
      } else {
        const insertData: any = { image_url: editAd2.image_url, link: editAd2.link, show_border: editAd2.show_border ?? false, border_color: editAd2.border_color ?? null, sort_order: ads2.length, section_id: selectedAds2SectionId };
        if (ads2FixedModeEnabled !== undefined) {
          insertData.is_fixed = ads2FixedModeEnabled;
        }
        const { error } = await supabase.from('ads_2col').insert(insertData);
        if (error) throw error;
      }
      setEditAd2(null); loadAll(); toast.success('Ad saved!');
    } catch (error) {
      console.error('Error saving ad:', error instanceof Error ? error.message : JSON.stringify(error));
      toast.error('Failed to save ad.');
    }
  }

  async function saveAd1() {
    if (!editAd1) return;
    try {
      if (editAd1.id) {
        const updateData: any = { image_url: editAd1.image_url, link: editAd1.link, show_border: editAd1.show_border ?? false, border_color: editAd1.border_color ?? null };
        if (ads1FixedModeEnabled !== undefined) {
          updateData.is_fixed = ads1FixedModeEnabled;
        }
        const { error } = await supabase.from('ads_2col').update(updateData).eq('id', editAd1.id);
        if (error) throw error;
      } else {
        const insertData: any = { image_url: editAd1.image_url, link: editAd1.link, show_border: editAd1.show_border ?? false, border_color: editAd1.border_color ?? null, sort_order: selectedAds1.length, section_id: selectedAds1SectionId };
        if (ads1FixedModeEnabled !== undefined) {
          insertData.is_fixed = ads1FixedModeEnabled;
        }
        const { error } = await supabase.from('ads_2col').insert(insertData);
        if (error) throw error;
      }
      setEditAd1(null); loadAll(); toast.success('Ad saved!');
    } catch (error) {
      console.error('Error saving ad:', error instanceof Error ? error.message : JSON.stringify(error));
      toast.error('Failed to save ad.');
    }
  }

  async function deleteAd2(id: string) {
    try {
      const { error } = await supabase.from('ads_2col').delete().eq('id', id);
      if (error) throw error;
      loadAll();
      toast.success('Deleted!');
    } catch (error) {
      console.error('Error deleting ad:', error instanceof Error ? error.message : JSON.stringify(error));
      toast.error('Failed to delete ad.');
    }
  }

  async function saveAd3() {
    if (!editAd3) return;
    try {
      if (editAd3.id) {
        const updateData: any = {
          image_url: editAd3.image_url,
          heading: editAd3.heading || null,
          description: editAd3.description || null,
          link: editAd3.link,
          show_border: editAd3.show_border ?? false,
          border_color: editAd3.border_color ?? null,
        };
        if (ads3FixedModeEnabled !== undefined) {
          updateData.is_fixed = ads3FixedModeEnabled;
        }
        const { error } = await supabase.from('ads_3col').update(updateData).eq('id', editAd3.id);
        if (error) throw error;
      } else {
        const insertData: any = {
          image_url: editAd3.image_url,
          heading: editAd3.heading || null,
          description: editAd3.description || null,
          link: editAd3.link,
          show_border: editAd3.show_border ?? false,
          border_color: editAd3.border_color ?? null,
          sort_order: ads3.length,
          section_id: selectedAds3SectionId,
        };
        if (ads3FixedModeEnabled !== undefined) {
          insertData.is_fixed = ads3FixedModeEnabled;
        }
        const { error } = await supabase.from('ads_3col').insert(insertData);
        if (error) throw error;
      }
      setEditAd3(null); loadAll(); toast.success('Ad saved!');
    } catch (error) {
      console.error('Error saving ad:', error instanceof Error ? error.message : JSON.stringify(error));
      toast.error('Failed to save ad.');
    }
  }

  async function deleteAd3(id: string) {
    try {
      const { error } = await supabase.from('ads_3col').delete().eq('id', id);
      if (error) throw error;
      loadAll();
      toast.success('Deleted!');
    } catch (error) {
      console.error('Error deleting ad:', error instanceof Error ? error.message : JSON.stringify(error));
      toast.error('Failed to delete ad.');
    }
  }

  async function handleLogout() { await supabase.auth.signOut(); navigate('/admin/login'); }

  // Handle adding a new section
  async function handleAddSection() {
    if (!addSectionType.trim()) {
      toast.error('Please select a section type');
      return;
    }
    if (!addSectionName.trim()) {
      toast.error('Please enter a section name');
      return;
    }
    setAddingSectionLoading(true);
    try {
      const result = await addSection(addSectionType, addSectionName);
      if (result) {
        toast.success('Section added successfully!');
        setShowAddSectionModal(false);
        setAddSectionType('');
        setAddSectionName('');
      } else {
        toast.error('Failed to add section');
      }
    } catch (error) {
      console.error('Error adding section:', JSON.stringify(error));
      toast.error('Error adding section');
    } finally {
      setAddingSectionLoading(false);
    }
  }

  // Handle deleting a section
  async function handleDeleteSection(sectionId: string) {
    if (!window.confirm('Are you sure you want to delete this section?')) return;
    const success = await deleteSection(sectionId);
    if (success) {
      toast.success('Section deleted!');
    } else {
      toast.error('Failed to delete section');
    }
  }

  // Handle opening heading edit modal
  function openHeadingEdit(sectionId: string) {
    const section = sections.find(s => s.id === sectionId);
    if (section) {
      setEditingHeadingSectionId(sectionId);
      setEditingHeadingText(section.heading || '');
      setEditingHeadingVisible(section.show_heading !== false);
      setEditingHeadingBackgroundColor(section.background_color || '');
    }
  }

  // Handle saving heading
  async function handleSaveHeading() {
    if (!editingHeadingSectionId) return;

    try {
      const success1 = await updateHeading(editingHeadingSectionId, editingHeadingText, editingHeadingBackgroundColor);
      const success2 = await toggleShowHeading(editingHeadingSectionId, editingHeadingVisible);
      
      // Also sync the section name (tab label) with the heading text
      const success3 = await updateSectionName(editingHeadingSectionId, editingHeadingText || 'Featured Cards');

      if (success1 && success2 && success3) {
        toast.success('Heading and tab label updated!');
        setEditingHeadingSectionId(null);
        // Refetch sections
        const { data: updatedSections } = await supabase
          .from('page_sections')
          .select('*')
          .order('sort_order', { ascending: true });
        if (updatedSections) setSections(updatedSections);
      }
    } catch (error) {
      console.error('Error saving heading:', JSON.stringify(error));
      toast.error('Failed to save heading');
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  const sectionLabels: Record<string, string> = {
    hero: '🏠 Hero Section', cards: '🃏 Featured Cards', categories: '📂 Categories',
    offers: '🎁 Offers & Discounts', ads_1col: '📰 1-Column Ad', ads_2col: '📰 2-Column Ads', ads_3col: '📰 3-Column Ads',
  };

  return (
    <div className="min-h-screen flex bg-muted">
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-0 md:w-64 overflow-hidden md:overflow-visible'} transition-all duration-300 bg-sidebar text-sidebar-foreground flex flex-col fixed md:relative inset-y-0 left-0 z-40 md:z-auto`}>
        <div className="p-3 md:p-5 border-b border-sidebar-border">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-8 h-8 md:w-9 md:h-9 rounded-lg bg-sidebar-primary flex items-center justify-center flex-shrink-0">
              <span className="text-sidebar-primary-foreground font-bold text-xs md:text-sm">SM</span>
            </div>
            <div className="min-w-0">
              <h1 className="font-bold text-xs md:text-sm">Admin Panel</h1>
              <p className="text-xs opacity-60">SoftMarket</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-2 md:p-3 space-y-0.5 md:space-y-1 overflow-y-auto">
          {SIDEBAR_ITEMS.map((item) => (
            <button
              key={item.key}
              onClick={() => { setTab(item.key); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-2 md:gap-3 px-2 md:px-3 py-2 md:py-2.5 rounded-lg text-xs md:text-sm font-medium transition-colors ${
                tab === item.key
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              }`}
            >
              <span className="w-5 h-5 flex-shrink-0">{item.icon}</span>
              <span className="truncate">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-2 md:p-3 border-t border-sidebar-border space-y-0.5 md:space-y-1">
          <Link to="/" className="flex items-center gap-2 md:gap-3 px-2 md:px-3 py-2 md:py-2.5 rounded-lg text-xs md:text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent">
            <Home className="w-5 h-5 flex-shrink-0" /> <span className="truncate">View Site</span>
          </Link>
          <button onClick={handleLogout} className="w-full flex items-center gap-2 md:gap-3 px-2 md:px-3 py-2 md:py-2.5 rounded-lg text-xs md:text-sm text-red-400 hover:bg-red-500/10">
            <LogOut className="w-5 h-5 flex-shrink-0" /> <span className="truncate">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className={`flex-1 transition-all duration-300 w-full ${sidebarOpen ? 'md:ml-64' : 'md:ml-0'}`}>
        <header className="bg-card border-b border-border sticky top-0 z-30 px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-lg hover:bg-secondary md:hidden">
            <Layers className="w-5 h-5" />
          </button>
          <span className="text-xs md:text-sm text-muted-foreground truncate">{user?.email}</span>
        </header>

        <div className="p-4 md:p-6">
          {/* DASHBOARD */}
          {tab === 'dashboard' && (
            <div>
              <h2 className="text-xl md:text-2xl font-bold mb-1">Welcome to Admin Panel</h2>
              <p className="text-sm md:text-base text-muted-foreground mb-6 md:mb-8">Manage all website content from here.</p>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4 mb-6 md:mb-8">
                {[
                  { label: 'Feature Cards', count: cards.length, icon: <CreditCard className="w-5 h-5 md:w-6 md:h-6 text-primary" /> },
                  { label: 'Categories', count: categories.length, icon: <Tag className="w-5 h-5 md:w-6 md:h-6 text-primary" /> },
                  { label: 'Offers', count: offers.length, icon: <Star className="w-5 h-5 md:w-6 md:h-6 text-primary" /> },
                  { label: 'Advertisements', count: ads2.length + ads3.length, icon: <Image className="w-5 h-5 md:w-6 md:h-6 text-primary" /> },
                ].map((stat) => (
                  <div key={stat.label} className="bg-card rounded-lg md:rounded-xl border border-border p-3 md:p-5">
                    <div className="flex items-center justify-between mb-2 md:mb-3">
                      <span className="text-xs md:text-sm text-muted-foreground">{stat.label}</span>
                      {stat.icon}
                    </div>
                    <p className="text-2xl md:text-3xl font-bold">{stat.count}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                {[
                  { title: 'Edit Hero Section', desc: 'Update heading and animated words', action: () => setTab('hero'), icon: <Type className="w-6 h-6 md:w-8 md:h-8 text-primary" /> },
                  { title: 'Page Layout', desc: 'Drag & drop sections order', action: () => setTab('sections'), icon: <Layers className="w-6 h-6 md:w-8 md:h-8 text-primary" /> },
                  { title: 'Categories', desc: 'Manage category groups', action: () => setTab('categories'), icon: <Tag className="w-6 h-6 md:w-8 md:h-8 text-primary" /> },
                  { title: 'Offers', desc: 'Manage offers & discounts', action: () => setTab('offers'), icon: <Star className="w-6 h-6 md:w-8 md:h-8 text-primary" /> },
                ].map((item) => (
                  <button key={item.title} onClick={item.action} className="bg-card rounded-lg md:rounded-xl border border-border p-3 md:p-5 text-left hover:shadow-md transition-shadow">
                    <div className="mb-2 md:mb-3">{item.icon}</div>
                    <h3 className="font-semibold text-sm md:text-base mb-1">{item.title}</h3>
                    <p className="text-xs md:text-sm text-muted-foreground">{item.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* HERO */}
          {tab === 'hero' && (
            <div className="max-w-lg space-y-4">
              <h2 className="text-xl font-bold mb-4">Edit Hero Section</h2>
              <div>
                <label className="block text-sm font-medium mb-1.5">Main Text</label>
                <input value={heroText} onChange={(e) => setHeroText(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-input bg-background" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Animated Words (comma-separated)</label>
                <input value={heroWords} onChange={(e) => setHeroWords(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-input bg-background" />
              </div>
              <button onClick={saveHero} className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold flex items-center gap-2">
                <Save className="w-4 h-4" /> Save Hero
              </button>
            </div>
          )}

          {/* HEADER OPTIONS */}
          {tab === 'header' && (
            <div className="max-w-2xl space-y-8">
              <div>
                <h2 className="text-xl font-bold mb-1">Header Options</h2>
                <p className="text-sm text-muted-foreground mb-6">Manage the top header bar items.</p>
              </div>

              <div className="grid gap-6">
                {/* Leave a Review */}
                <div className="bg-card rounded-xl border border-border p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold">Leave a Review</h3>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={headerSettings.leave_review_visible}
                        onCheckedChange={(checked) => setHeaderSettings({ ...headerSettings, leave_review_visible: checked })}
                      />
                      <span className="text-sm font-medium">{headerSettings.leave_review_visible ? 'Visible' : 'Hidden'}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Text</label>
                      <input
                        value={headerSettings.leave_review_text}
                        onChange={(e) => setHeaderSettings({ ...headerSettings, leave_review_text: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-lg border border-input bg-background"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Link</label>
                      <input
                        value={headerSettings.leave_review_link}
                        onChange={(e) => setHeaderSettings({ ...headerSettings, leave_review_link: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-lg border border-input bg-background"
                      />
                    </div>
                  </div>
                </div>

                {/* For Providers */}
                <div className="bg-card rounded-xl border border-border p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold">For Providers</h3>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={headerSettings.for_providers_visible}
                        onCheckedChange={(checked) => setHeaderSettings({ ...headerSettings, for_providers_visible: checked })}
                      />
                      <span className="text-sm font-medium">{headerSettings.for_providers_visible ? 'Visible' : 'Hidden'}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Text</label>
                      <input
                        value={headerSettings.for_providers_text}
                        onChange={(e) => setHeaderSettings({ ...headerSettings, for_providers_text: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-lg border border-input bg-background"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Link</label>
                      <input
                        value={headerSettings.for_providers_link}
                        onChange={(e) => setHeaderSettings({ ...headerSettings, for_providers_link: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-lg border border-input bg-background"
                      />
                    </div>
                  </div>
                </div>

                {/* Sign In */}
                <div className="bg-card rounded-xl border border-border p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold">Sign In</h3>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={headerSettings.sign_in_visible}
                        onCheckedChange={(checked) => setHeaderSettings({ ...headerSettings, sign_in_visible: checked })}
                      />
                      <span className="text-sm font-medium">{headerSettings.sign_in_visible ? 'Visible' : 'Hidden'}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Text</label>
                    <input
                      value={headerSettings.sign_in_text}
                      onChange={(e) => setHeaderSettings({ ...headerSettings, sign_in_text: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg border border-input bg-background"
                    />
                  </div>
                </div>

                {/* Join */}
                <div className="bg-card rounded-xl border border-border p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold">Join</h3>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={headerSettings.join_visible}
                        onCheckedChange={(checked) => setHeaderSettings({ ...headerSettings, join_visible: checked })}
                      />
                      <span className="text-sm font-medium">{headerSettings.join_visible ? 'Visible' : 'Hidden'}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Text</label>
                      <input
                        value={headerSettings.join_text}
                        onChange={(e) => setHeaderSettings({ ...headerSettings, join_text: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-lg border border-input bg-background"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Link (WhatsApp or any URL)</label>
                      <input
                        value={headerSettings.join_link}
                        onChange={(e) => setHeaderSettings({ ...headerSettings, join_link: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-lg border border-input bg-background"
                      />
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="bg-card rounded-xl border border-border p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold">Submit Button (Main Header)</h3>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={headerSettings.submit_button_visible}
                        onCheckedChange={(checked) => setHeaderSettings({ ...headerSettings, submit_button_visible: checked })}
                      />
                      <span className="text-sm font-medium">{headerSettings.submit_button_visible ? 'Visible' : 'Hidden'}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Button Text</label>
                      <input
                        value={headerSettings.submit_button_text}
                        onChange={(e) => setHeaderSettings({ ...headerSettings, submit_button_text: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-lg border border-input bg-background"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Button Link</label>
                      <input
                        value={headerSettings.submit_button_link}
                        onChange={(e) => setHeaderSettings({ ...headerSettings, submit_button_link: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-lg border border-input bg-background"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={handleSaveHeader}
                disabled={isSavingHeader}
                className="w-full md:w-auto px-8 py-3 rounded-lg bg-primary text-primary-foreground font-bold flex items-center justify-center gap-2 shadow-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isSavingHeader ? 'Saving...' : <><Save className="w-5 h-5" /> Save Header Options</>}
              </button>
            </div>
          )}

          {/* SECTIONS */}
          {tab === 'sections' && (
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-bold mb-2">Page Layout - Manage Sections</h2>
                <p className="text-sm text-muted-foreground">Drag to reorder sections. Manage visibility and edit individual sections from their tabs.</p>
              </div>

              {sections.length > 0 ? (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleSectionDragEnd}>
                  <SortableContext
                    items={sections.map(s => s.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-3 md:space-y-4">
                      {sections.map((s) => {
                        // Count items in this section
                        let itemCount = 0;
                        if (s.section_type === 'cards') itemCount = cards.filter(c => c.section_id === s.id).length;
                        else if (s.section_type === 'categories') itemCount = categories.filter(c => c.section_id === s.id).length;
                        else if (s.section_type === 'offers') itemCount = offers.filter(o => o.section_id === s.id).length;
                        else if (s.section_type === 'ads_1col') itemCount = ads2.filter(a => a.section_id === s.id).length;
                        else if (s.section_type === 'ads_2col') itemCount = ads2.filter(a => a.section_id === s.id).length;
                        else if (s.section_type === 'ads_3col') itemCount = ads3.filter(a => a.section_id === s.id).length;

                        return (
                          <SortableItem key={s.id} id={s.id} disabled={s.is_locked}>
                            <div className="bg-card border border-border rounded-lg p-3 md:p-4 hover:border-primary/50 transition-colors group">
                              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:mb-0">
                                <div className="flex items-start md:items-center gap-2 md:gap-3 flex-1 min-w-0">
                                  <GripVertical className="w-6 md:w-8 h-6 md:h-8 text-muted-foreground cursor-grab active:cursor-grabbing opacity-50 group-hover:opacity-100 flex-shrink-0 mt-1 md:mt-0" />
                                  <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-sm md:text-base break-words">{getSectionDisplayName(s)}</h3>
                                    <p className="text-xs md:text-sm text-muted-foreground">{itemCount} items • {s.section_type}</p>
                                  </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-2 md:gap-3 w-full md:w-auto">
                                  <label className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm cursor-pointer">
                                    <Switch
                                      checked={s.is_visible}
                                      onCheckedChange={async (checked) => {
                                        await toggleVisibility(s.id, Boolean(checked));
                                      }}
                                    />
                                    <span className="text-xs whitespace-nowrap">{s.is_visible ? 'ON' : 'OFF'}</span>
                                  </label>

                                  <label className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm cursor-pointer">
                                    <Switch
                                      checked={s.is_locked}
                                      onCheckedChange={async (checked) => {
                                        await toggleLockState(s.id, Boolean(checked));
                                      }}
                                    />
                                    <span className="text-xs whitespace-nowrap">{s.is_locked ? 'Fixed' : 'Moving'}</span>
                                  </label>

                                  <button
                                    onClick={() => handleDeleteSection(s.id)}
                                    className="p-1 md:p-1.5 rounded text-destructive hover:bg-destructive/10 transition-colors opacity-0 md:opacity-100 group-hover:opacity-100"
                                    title="Delete section"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </SortableItem>
                        );
                      })}
                    </div>
                  </SortableContext>
                </DndContext>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">No sections added yet. Create sections from the tabs above.</p>
              )}
            </div>
          )}

          {/* CARDS */}
          {tab === 'cards' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Featured Cards</h2>
                <button
                  onClick={() => {
                    setAddSectionType('cards');
                    setShowAddSectionModal(true);
                  }}
                  className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold flex items-center gap-1.5 hover:bg-green-700"
                >
                  <Plus className="w-4 h-4" /> Add New Section
                </button>
              </div>

              {/* Section instances tabs */}
              {sections.filter(s => s.section_type === 'cards').length > 0 && (
                <div className="mb-6 hidden md:block">
                  <div className="flex gap-2 flex-wrap mb-4 overflow-x-auto pb-2">
                    {sections.filter(s => s.section_type === 'cards').map(section => (
                      <button
                        key={section.id}
                        onClick={() => setSelectedCardsSectionId(section.id)}
                        className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                          selectedCardsSectionId === section.id
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-card border border-border text-foreground hover:bg-muted'
                        }`}
                      >
                        {getSectionDisplayName(section)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-4 mb-4">
                <p className="text-xs md:text-sm text-muted-foreground">
                  {selectedCardsSectionId ? `Adding cards to: ${getSectionDisplayName(sections.find(s => s.id === selectedCardsSectionId))}` : 'No section selected'}
                </p>
                {selectedCardsSectionId && (
                  <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                    <label className="flex items-center gap-2 text-sm self-center md:self-auto">
                      <Switch
                        checked={cardsFixedModeEnabled}
                        onCheckedChange={async (checked) => {
                          await toggleCardsFixedMode(selectedCardsSectionId, Boolean(checked));
                        }}
                      />
                      <span className="text-xs">Fixed Mode</span>
                      <span className="text-xs">{cardsFixedModeEnabled ? 'ON' : 'OFF'}</span>
                    </label>
                    <button
                      onClick={() => openHeadingEdit(selectedCardsSectionId)}
                      className="px-3 py-2 md:px-4 md:py-2 rounded-lg bg-blue-600 text-white text-xs md:text-sm font-semibold flex items-center justify-center gap-1.5 hover:bg-blue-700"
                    >
                      <Pencil className="w-4 h-4" />
                      <span className="hidden md:inline">Edit Heading</span>
                      <span className="md:hidden">Edit</span>
                    </button>
                    <button
                      onClick={() => handleDeleteSection(selectedCardsSectionId)}
                      className="px-3 py-2 md:px-4 md:py-2 rounded-lg bg-destructive text-destructive-foreground text-xs md:text-sm font-semibold flex items-center justify-center gap-1.5"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="hidden md:inline">Delete Section</span>
                      <span className="md:hidden">Delete</span>
                    </button>
                    <button
                      onClick={() => setEditCard({ title: '', description: '', logo_url: null, link: null, show_border: false, border_color: null, background_color: null })}
                      className="px-3 py-2 md:px-4 md:py-2 rounded-lg bg-primary text-primary-foreground text-xs md:text-sm font-semibold flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span className="hidden md:inline">Add Card</span>
                      <span className="md:hidden">Add</span>
                    </button>
                  </div>
                )}
              </div>

              {cardsFixedModeEnabled ? (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleCardDragEnd}>
                  <SortableContext items={selectedCards.map((card) => card.id)} strategy={verticalListSortingStrategy}>
                    <div className="grid gap-3">
                      {selectedCards.map((card) => (
                        <SortableOfferItem key={card.id} id={card.id} disabled={!cardsFixedModeEnabled}>
                          {card.logo_url && <img src={card.logo_url} alt="" className="w-12 h-12 rounded-lg object-contain bg-muted p-1" />}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm">{card.title}</h3>
                            <p className="text-xs text-muted-foreground truncate">{card.description}</p>
                          </div>
                          <button onClick={() => setEditCard(card)} className="p-2 text-muted-foreground hover:text-foreground"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => deleteCard(card.id)} className="p-2 text-destructive"><Trash2 className="w-4 h-4" /></button>
                        </SortableOfferItem>
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              ) : (
                <div className="grid gap-3">
                  {cards
                    .filter(c => selectedCardsSectionId ? c.section_id === selectedCardsSectionId : true)
                    .map((card) => (
                    <div key={card.id} className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border">
                      {card.logo_url && <img src={card.logo_url} alt="" className="w-12 h-12 rounded-lg object-contain bg-muted p-1" />}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm">{card.title}</h3>
                        <p className="text-xs text-muted-foreground truncate">{card.description}</p>
                      </div>
                      <button onClick={() => setEditCard(card)} className="p-2 text-muted-foreground hover:text-foreground"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => deleteCard(card.id)} className="p-2 text-destructive"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              )}
              {editCard && (
                <Modal title={editCard.id ? 'Edit Card' : 'Add Card'} onClose={() => setEditCard(null)}>
                  <div className="space-y-4">
                    <ImageUpload label="Logo" value={editCard.logo_url || null} onChange={(url) => setEditCard({ ...editCard, logo_url: url })} folder="cards" />
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Title</label>
                      <input value={editCard.title || ''} onChange={(e) => setEditCard({ ...editCard, title: e.target.value })} className="w-full px-4 py-2.5 rounded-lg border border-input bg-background" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Description</label>
                      <textarea value={editCard.description || ''} onChange={(e) => setEditCard({ ...editCard, description: e.target.value })} className="w-full px-4 py-2.5 rounded-lg border border-input bg-background" rows={3} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Link (optional)</label>
                      <input value={editCard.link || ''} onChange={(e) => setEditCard({ ...editCard, link: e.target.value || null })} className="w-full px-4 py-2.5 rounded-lg border border-input bg-background" />
                    </div>
                    <label className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Switch checked={editCard.show_border ?? false} onCheckedChange={(checked) => setEditCard({ ...editCard, show_border: Boolean(checked) })} />
                      <span>Enable Border</span>
                    </label>
                    {editCard.show_border && (
                      <div>
                        <label className="block text-sm font-medium mb-1.5">Border Color</label>
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            value={editCard.border_color || '#000000'}
                            onChange={(e) => setEditCard({ ...editCard, border_color: e.target.value })}
                            className="h-10 w-20 rounded cursor-pointer border-0"
                          />
                          <input
                            type="text"
                            value={editCard.border_color || ''}
                            onChange={(e) => setEditCard({ ...editCard, border_color: e.target.value || null })}
                            placeholder="#000000"
                            className="flex-1 px-4 py-2.5 rounded-lg border border-input bg-background"
                          />
                        </div>
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Card Background Color</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={editCard.background_color || '#fcf9f5'}
                          onChange={(e) => setEditCard({ ...editCard, background_color: e.target.value })}
                          className="h-10 w-20 rounded cursor-pointer border-0"
                        />
                        <input
                          type="text"
                          value={editCard.background_color || ''}
                          onChange={(e) => setEditCard({ ...editCard, background_color: e.target.value || null })}
                          placeholder="#fcf9f5"
                          className="flex-1 px-4 py-2.5 rounded-lg border border-input bg-background"
                        />
                      </div>
                    </div>
                    <button onClick={saveCard} className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold">Save</button>
                  </div>
                </Modal>
              )}
            </div>
          )}

          {/* CATEGORIES */}
          {tab === 'categories' && (
            <div>
              {!editingSubcategoryId ? (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold">Categories</h2>
                    <button
                      onClick={() => {
                        setAddSectionType('categories');
                        setShowAddSectionModal(true);
                      }}
                      className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold flex items-center gap-1.5 hover:bg-green-700"
                    >
                      <Plus className="w-4 h-4" /> Add New Section
                    </button>
                  </div>

                  {/* Section instances tabs */}
                  {sections.filter(s => s.section_type === 'categories').length > 0 && (
                    <div className="mb-6 hidden md:block">
                      <div className="flex gap-2 flex-wrap mb-4 overflow-x-auto pb-2">
                        {sections.filter(s => s.section_type === 'categories').map(section => (
                          <button
                            key={section.id}
                            onClick={() => setSelectedCategoriesSectionId(section.id)}
                            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                              selectedCategoriesSectionId === section.id
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-card border border-border text-foreground hover:bg-muted'
                            }`}
                          >
                            {getSectionDisplayName(section)}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-4 mb-4">
                    <p className="text-xs md:text-sm text-muted-foreground">
                      {selectedCategoriesSectionId ? `Adding categories to: ${getSectionDisplayName(sections.find(s => s.id === selectedCategoriesSectionId))}` : 'No section selected'}
                    </p>
                    {selectedCategoriesSectionId && (
                      <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                        <button
                          onClick={() => openHeadingEdit(selectedCategoriesSectionId)}
                          className="px-3 py-2 md:px-4 md:py-2 rounded-lg bg-blue-600 text-white text-xs md:text-sm font-semibold flex items-center justify-center gap-1.5 hover:bg-blue-700"
                        >
                          <Pencil className="w-4 h-4" />
                          <span className="hidden md:inline">Edit Heading</span>
                          <span className="md:hidden">Edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteSection(selectedCategoriesSectionId)}
                          className="px-3 py-2 md:px-4 md:py-2 rounded-lg bg-destructive text-destructive-foreground text-xs md:text-sm font-semibold flex items-center justify-center gap-1.5"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="hidden md:inline">Delete Section</span>
                          <span className="md:hidden">Delete</span>
                        </button>
                        <button
                          onClick={() => { setEditCategory({ name: '', bg_color: '#FFF9C4', icon_url: null, show_downloads_tab: true, show_brands_tab: true }); setEditSubs([]); setEditDownloads([]); setEditSubcategory(null); }}
                          className="px-3 py-2 md:px-4 md:py-2 rounded-lg bg-primary text-primary-foreground text-xs md:text-sm font-semibold flex items-center justify-center gap-1.5"
                        >
                          <Plus className="w-4 h-4" />
                          <span className="hidden md:inline">Add Category</span>
                          <span className="md:hidden">Add</span>
                        </button>
                      </div>
                    )}
                  </div>

              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleCategoryDragEnd}>
                <SortableContext items={selectedCategories.map((cat) => cat.id)} strategy={verticalListSortingStrategy}>
                  <div className="grid gap-3">
                    {selectedCategories.map((cat) => (
                      <div key={cat.id}>
                        <SortableCategoryItem id={cat.id}>
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: cat.bg_color }}>
                            {cat.icon_url && <img src={cat.icon_url} alt="" className="w-6 h-6 object-contain" />}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-sm">{cat.name}</h3>
                            <p className="text-xs text-muted-foreground">
                              {subcategories.filter(s => s.category_id === cat.id).length} subcategories, {categoryDownloads.filter((download) => download.category_id === cat.id).length} downloads
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 bg-muted/50 px-2 py-1 rounded-lg border border-border">
                              <Switch
                                checked={cat.is_visible ?? true}
                                onCheckedChange={(checked) => toggleCategoryVisibility(cat.id, Boolean(checked))}
                              />
                              <span className="text-[10px] font-medium text-muted-foreground uppercase">{(cat.is_visible ?? true) ? 'ON' : 'OFF'}</span>
                            </div>
                            <button onClick={() => { setEditCategory(cat); setEditSubs(subcategories.filter(s => s.category_id === cat.id)); setEditDownloads(categoryDownloads.filter((download) => download.category_id === cat.id)); setEditSubcategory(null); }} className="p-2 text-muted-foreground hover:text-foreground"><Pencil className="w-4 h-4" /></button>
                            <button onClick={() => deleteCategory(cat.id)} className="p-2 text-destructive"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </SortableCategoryItem>
                        {editCategory?.id === cat.id && (
                          <div className="rounded-2xl border border-border bg-card p-6 space-y-6">
                            <div className="flex items-center justify-between gap-4">
                              <div>
                                <h3 className="text-lg font-semibold">{editCategory.id ? 'Edit Category' : 'Add Category'}</h3>
                                <p className="text-sm text-muted-foreground">Edit category details and subcategories below.</p>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => { setEditCategory(null); setEditSubs([]); setEditDownloads([]); setEditSubcategory(null); }}
                                  className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
                                >
                                  Cancel
                                </button>
                                <button onClick={async () => {
                                  if (editingSubcategoryId) {
                                    const editingSub = editSubs.find(s => s.id === editingSubcategoryId);
                                    if (editingSub) {
                                      setEditPricingPlansState(prev => ({ ...prev, [editingSub.id]: editPricingPlans }));
                                      setEditButtonsState(prev => ({ ...prev, [editingSub.id]: editButtons }));
                                      setEditSubOverviewPointsState(prev => ({ ...prev, [editingSub.id]: editSubOverviewPoints }));
                                      setEditSubDownloadsState(prev => ({ ...prev, [editingSub.id]: editSubDownloads }));
                                      setEditSubBrandsState(prev => ({ ...prev, [editingSub.id]: editSubBrands }));
                                    }
                                  }
                                  await saveCategory();
                                }} disabled={isSavingCategory} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed">
                                  {isSavingCategory ? 'Saving...' : 'Save'}
                                </button>
                              </div>
                            </div>

                            <div className="space-y-4">
                              <ImageUpload label="Icon" value={editCategory.icon_url || null} onChange={(url) => setEditCategory({ ...editCategory, icon_url: url })} folder="categories" />
                              <div>
                                <label className="block text-sm font-medium mb-1.5">Name</label>
                                <input value={editCategory.name || ''} onChange={(e) => setEditCategory({ ...editCategory, name: e.target.value })} className="w-full px-4 py-2.5 rounded-lg border border-input bg-background" />
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-1.5">Background Color</label>
                                <div className="flex items-center gap-3">
                                  <input type="color" value={editCategory.bg_color || '#FFF9C4'} onChange={(e) => setEditCategory({ ...editCategory, bg_color: e.target.value })} className="w-12 h-10 rounded border border-input cursor-pointer" />
                                  <input value={editCategory.bg_color || ''} onChange={(e) => setEditCategory({ ...editCategory, bg_color: e.target.value })} className="flex-1 px-4 py-2.5 rounded-lg border border-input bg-background" />
                                </div>
                              </div>
                              
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <label className="text-sm font-medium">Subcategories</label>
                                  <button
                                    type="button"
                                    onClick={() => setEditSubcategory({ id: crypto.randomUUID(), category_id: editCategory.id || '', name: '', link: null, video_url: null, image_url: null, sort_order: editSubs.length, show_downloads: false, show_resources: false })}
                                    className="text-sm text-primary font-semibold"
                                  >
                                    + Add
                                  </button>
                                </div>
                                {editSubs.length === 0 ? (
                                  <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                                    No subcategories added yet.
                                  </div>
                                ) : (
                                  <div className="space-y-3">
                                    {editSubs.map((sub) => (
                                      <div key={sub.id} className="flex flex-col items-start gap-3 rounded-lg border border-border bg-muted/30 p-3 md:flex-row md:items-center md:justify-between">
                                        <div className="min-w-0">
                                          <p className="truncate font-semibold text-sm">{sub.name || 'Untitled subcategory'}</p>
                                          <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setEditingSubcategoryId(sub.id);
                                              setEditButtons(editButtonsState[sub.id] || []);
                                              setEditSubDownloads(editSubDownloadsState[sub.id] || []);
                                              setEditShowDownloadsState((prev) => ({ ...prev, [sub.id]: (sub as any).show_downloads ?? false }));
                                              setEditSubBrands(editSubBrandsState[sub.id] || []);
                                              setEditShowBrandsState((prev) => ({ ...prev, [sub.id]: sub.show_brands ?? true }));
                                              setEditShowResourcesState((prev) => ({ ...prev, [sub.id]: sub.show_resources ?? false }));
                                              setEditShowAboutSectionState((prev) => ({ ...prev, [sub.id]: (sub as any).show_about_section ?? true }));
                                              setEditShowHeaderPointsSectionState((prev) => ({ ...prev, [sub.id]: (sub as any).show_header_points_section ?? true }));
                                              setEditResourcesTabLabelState((prev) => ({ ...prev, [sub.id]: (sub as any).resources_tab_label || 'Resources' }));
                                              setEditDownloadsTabLabelState((prev) => ({ ...prev, [sub.id]: (sub as any).downloads_tab_label || 'Downloads' }));
                                              setEditBrandsTabLabelState((prev) => ({ ...prev, [sub.id]: (sub as any).brands_tab_label || 'Brands' }));
                                              setEditPricingPlansTabLabelState((prev) => ({ ...prev, [sub.id]: (sub as any).pricing_plans_tab_label || 'Pricing Plans' }));
                                              setEditKeyFeaturesTabLabelState((prev) => ({ ...prev, [sub.id]: (sub as any).key_features_tab_label || 'Key Features' }));
                                              setEditTabOrderState((prev) => ({ ...prev, [sub.id]: sub.tab_order || ['overview', 'resources', 'downloads', 'key_features', 'pricing', 'brands', 'form'] }));
                                              setEditPricingPlans(editPricingPlansState[sub.id] || []);
                                              setEditShowPricingPlansState((prev) => ({ ...prev, [sub.id]: (sub as any).show_pricing_plans ?? true }));
                                              setEditSubOverviewPoints(editSubOverviewPointsState[sub.id] || []);
                                              setEditKeyFeaturesSections(prev => ({
                                                ...prev,
                                                [sub.id]: editKeyFeaturesSections[sub.id] || keyFeaturesSections.filter(s => s.subcategory_id === sub.id)
                                              }));
                                              setEditAboutSections(prev => ({
                                                ...prev,
                                                [sub.id]: editAboutSections[sub.id] || aboutSections.filter(s => s.subcategory_id === sub.id)
                                              }));
                                            }}
                                            className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
                                          >
                                            Edit
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => setEditSubs(editSubs.filter((item) => item.id !== sub.id))}
                                            className="rounded-lg p-2 text-destructive hover:bg-destructive/10"
                                          >
                                            <X className="w-4 h-4" />
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <div>
                                
                                <div className="space-y-3">
                                  {editDownloads.map((download, i) => (
                                    <div key={download.id || i} className="rounded-xl border border-border p-3">
                                      <div className="mb-3 flex items-center justify-between">
                                        <span className="text-sm font-medium">Download {i + 1}</span>
                                        <button type="button" onClick={() => setEditDownloads(editDownloads.filter((_, index) => index !== i))} className="p-1 text-destructive">
                                          <X className="w-4 h-4" />
                                        </button>
                                      </div>
                                      <FileUpload
                                        label="Document"
                                        value={download.file_url || null}
                                        fileName={download.file_name}
                                        folder="downloads"
                                        onChange={(file) => {
                                          const nextDownloads = [...editDownloads];
                                          nextDownloads[i] = {
                                            ...nextDownloads[i],
                                            file_name: file.name,
                                            file_url: file.url,
                                            file_type: file.type,
                                          };
                                          setEditDownloads(nextDownloads);
                                        }}
                                        onRemove={() => {
                                          const nextDownloads = [...editDownloads];
                                          nextDownloads[i] = {
                                            ...nextDownloads[i],
                                            file_name: '',
                                            file_url: '',
                                            file_type: 'file',
                                          };
                                          setEditDownloads(nextDownloads);
                                        }}
                                      />
                                      <input
                                        placeholder="Button label"
                                        value={download.file_name || ''}
                                        onChange={(e) => {
                                          const nextDownloads = [...editDownloads];
                                          nextDownloads[i] = { ...nextDownloads[i], file_name: e.target.value };
                                          setEditDownloads(nextDownloads);
                                        }}
                                        className="mt-3 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
              {editCategory && !editCategory.id && (
                <div className="rounded-2xl border border-border bg-card p-6 space-y-6">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold">Add Category</h3>
                      <p className="text-sm text-muted-foreground">Create a new category below.</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => { setEditCategory(null); setEditSubs([]); setEditDownloads([]); setEditSubcategory(null); }}
                        className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
                      >
                        Cancel
                      </button>
                      <button onClick={async () => {
                        if (editingSubcategoryId) {
                          const editingSub = editSubs.find(s => s.id === editingSubcategoryId);
                          if (editingSub) {
                            setEditPricingPlansState(prev => ({ ...prev, [editingSub.id]: editPricingPlans }));
                            setEditButtonsState(prev => ({ ...prev, [editingSub.id]: editButtons }));
                            setEditSubOverviewPointsState(prev => ({ ...prev, [editingSub.id]: editSubOverviewPoints }));
                            setEditSubDownloadsState(prev => ({ ...prev, [editingSub.id]: editSubDownloads }));
                            setEditSubBrandsState(prev => ({ ...prev, [editingSub.id]: editSubBrands }));
                          }
                        }
                        await saveCategory();
                      }} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
                        Save
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <ImageUpload label="Icon" value={editCategory.icon_url || null} onChange={(url) => setEditCategory({ ...editCategory, icon_url: url })} folder="categories" />
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Name</label>
                      <input value={editCategory.name || ''} onChange={(e) => setEditCategory({ ...editCategory, name: e.target.value })} className="w-full px-4 py-2.5 rounded-lg border border-input bg-background" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Background Color</label>
                      <div className="flex items-center gap-3">
                        <input type="color" value={editCategory.bg_color || '#FFF9C4'} onChange={(e) => setEditCategory({ ...editCategory, bg_color: e.target.value })} className="w-12 h-10 rounded border border-input cursor-pointer" />
                        <input value={editCategory.bg_color || ''} onChange={(e) => setEditCategory({ ...editCategory, bg_color: e.target.value })} className="flex-1 px-4 py-2.5 rounded-lg border border-input bg-background" />
                      </div>
                    </div>
                    <label className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Switch checked={editCategory.show_downloads_tab ?? true} onCheckedChange={(checked) => setEditCategory({ ...editCategory, show_downloads_tab: Boolean(checked) })} />
                      <span>Show Downloads tab</span>
                    </label>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium">Subcategories</label>
                        <button
                          type="button"
                          onClick={() => setEditSubcategory({ id: crypto.randomUUID(), category_id: editCategory.id || '', name: '', link: null, video_url: null, image_url: null, sort_order: editSubs.length, show_downloads: false, show_resources: false })}
                          className="text-sm text-primary font-semibold"
                        >
                          + Add
                        </button>
                      </div>
                      {editSubs.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                          No subcategories added yet.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {editSubs.map((sub) => (
                            <div key={sub.id} className="flex flex-col items-start gap-3 rounded-lg border border-border bg-muted/30 p-3 md:flex-row md:items-center md:justify-between">
                              <div className="min-w-0">
                                <p className="truncate font-semibold text-sm">{sub.name || 'Untitled subcategory'}</p>
                                <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    console.log('Editing subcategory:', sub.id);
                                    console.log('editPricingPlansState:', editPricingPlansState);
                                    console.log('Pricing plans for this subcategory:', editPricingPlansState[sub.id]);
                                    setEditingSubcategoryId(sub.id);
                                    setEditButtons(editButtonsState[sub.id] || []);
                                    setEditSubDownloads(editSubDownloadsState[sub.id] || []);
                                    setEditShowDownloadsState((prev) => ({ ...prev, [sub.id]: (sub as any).show_downloads ?? true }));
                                    setEditSubBrands(editSubBrandsState[sub.id] || []);
                                    setEditShowBrandsState((prev) => ({ ...prev, [sub.id]: sub.show_brands ?? true }));
                                    setEditShowResourcesState((prev) => ({ ...prev, [sub.id]: sub.show_resources ?? true }));
                                    setEditShowAboutSectionState((prev) => ({ ...prev, [sub.id]: (sub as any).show_about_section ?? true }));
                                    setEditShowHeaderPointsSectionState((prev) => ({ ...prev, [sub.id]: (sub as any).show_header_points_section ?? true }));
                                    setEditResourcesTabLabelState((prev) => ({ ...prev, [sub.id]: (sub as any).resources_tab_label || 'Resources' }));
                                    setEditDownloadsTabLabelState((prev) => ({ ...prev, [sub.id]: (sub as any).downloads_tab_label || 'Downloads' }));
                                    setEditBrandsTabLabelState((prev) => ({ ...prev, [sub.id]: (sub as any).brands_tab_label || 'Brands' }));
                                    setEditTabOrderState((prev) => ({ ...prev, [sub.id]: sub.tab_order || ['overview', 'resources', 'downloads', 'key_features', 'pricing', 'brands', 'form'] }));
                                    setEditPricingPlans(editPricingPlansState[sub.id] || []);
                                    setEditShowPricingPlansState((prev) => ({ ...prev, [sub.id]: (sub as any).show_pricing_plans ?? true }));
                                    setEditSubOverviewPoints(editSubOverviewPointsState[sub.id] || []);
                                    setEditKeyFeaturesSections(prev => ({
                                      ...prev,
                                      [sub.id]: editKeyFeaturesSections[sub.id] || keyFeaturesSections.filter(s => s.subcategory_id === sub.id)
                                    }));
                                    setEditAboutSections(prev => ({
                                      ...prev,
                                      [sub.id]: editAboutSections[sub.id] || aboutSections.filter(s => s.subcategory_id === sub.id)
                                    }));
                                  }}
                                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditSubs(editSubs.filter((item) => item.id !== sub.id))}
                                  className="rounded-lg p-2 text-destructive hover:bg-destructive/10"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium">Overview Downloads</label>
                        <button
                          type="button"
                          onClick={() => {
                            setEditDownloads([
                              ...editDownloads,
                              { id: crypto.randomUUID(), category_id: editCategory.id || '', file_name: '', file_url: '', file_type: 'file' },
                            ]);
                          }}
                          className="text-sm text-primary font-semibold"
                        >
                          + Add
                        </button>
                      </div>
                      <div className="space-y-3">
                        {editDownloads.map((download, i) => (
                          <div key={download.id || i} className="rounded-xl border border-border p-3">
                            <div className="mb-3 flex items-center justify-between">
                              <span className="text-sm font-medium">Download {i + 1}</span>
                              <button type="button" onClick={() => setEditDownloads(editDownloads.filter((_, index) => index !== i))} className="p-1 text-destructive">
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                            <FileUpload
                              label="Document"
                              value={download.file_url || null}
                              fileName={download.file_name}
                              folder="downloads"
                              onChange={(file) => {
                                const nextDownloads = [...editDownloads];
                                nextDownloads[i] = {
                                  ...nextDownloads[i],
                                  file_name: file.name,
                                  file_url: file.url,
                                  file_type: file.type,
                                };
                                setEditDownloads(nextDownloads);
                              }}
                              onRemove={() => {
                                const nextDownloads = [...editDownloads];
                                nextDownloads[i] = {
                                  ...nextDownloads[i],
                                  file_name: '',
                                  file_url: '',
                                  file_type: 'file',
                                };
                                setEditDownloads(nextDownloads);
                              }}
                            />
                            <input
                              placeholder="Button label"
                              value={download.file_name || ''}
                              onChange={(e) => {
                                const nextDownloads = [...editDownloads];
                                nextDownloads[i] = { ...nextDownloads[i], file_name: e.target.value };
                                setEditDownloads(nextDownloads);
                              }}
                              className="mt-3 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {editSubcategory && !editSubs.some((sub) => sub.id === editSubcategory.id) && (
                <Modal
                  title="Add Subcategory"
                  onClose={() => setEditSubcategory(null)}
                >
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Name</label>
                      <input
                        value={editSubcategory.name || ''}
                        onChange={(e) => setEditSubcategory({ ...editSubcategory, name: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-lg border border-input bg-background"
                      />
                    </div>
                    <div className="flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setEditSubcategory(null)}
                        className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (!editSubcategory.name?.trim()) return;
                          const nextSub: Subcategory = {
                            id: editSubcategory.id || crypto.randomUUID(),
                            category_id: editSubcategory.category_id || editCategory?.id || '',
                            name: editSubcategory.name.trim(),
                            link: editSubcategory.link?.trim() || null,
                            video_url: editSubcategory.video_url?.trim() || null,
                            image_url: editSubcategory.image_url?.trim() || null,
                            video_url_2: (editSubcategory.video_url_2 || []).filter(url => url?.trim()).map(url => url.trim()) || null,
                            detail_description: editSubcategory.detail_description?.trim() || null,
                            show_downloads: editShowDownloadsState[editSubcategory.id || 'new'] ?? false,
                            show_brands: editShowBrandsState[editSubcategory.id || 'new'] ?? true,
                            show_resources: editShowResourcesState[editSubcategory.id || 'new'] ?? false,
                            show_about_section: editShowAboutSectionState[editSubcategory.id || 'new'] ?? true,
                            show_header_points_section: editShowHeaderPointsSectionState[editSubcategory.id || 'new'] ?? true,
                            show_pricing_plans: editShowPricingPlansState[editSubcategory.id || 'new'] ?? true,
                            sort_order: editSubs.length,
                          };
                          setEditSubs((current) => {
                            const existingIndex = current.findIndex((sub) => sub.id === nextSub.id);
                            if (existingIndex >= 0) {
                              const next = [...current];
                              next[existingIndex] = { ...next[existingIndex], ...nextSub };
                              return next;
                            }
                            return [...current, nextSub];
                          });
                          const subcategoryId = nextSub.id;
                          setEditShowDownloadsState((prev) => ({ ...prev, [subcategoryId]: editShowDownloadsState[editSubcategory.id || 'new'] ?? false }));
                          setEditShowBrandsState((prev) => ({ ...prev, [subcategoryId]: editShowBrandsState[editSubcategory.id || 'new'] ?? true }));
                          setEditShowResourcesState((prev) => ({ ...prev, [subcategoryId]: editShowResourcesState[editSubcategory.id || 'new'] ?? false }));
                          setEditShowAboutSectionState((prev) => ({ ...prev, [subcategoryId]: editShowAboutSectionState[editSubcategory.id || 'new'] ?? true }));
                          setEditShowHeaderPointsSectionState((prev) => ({ ...prev, [subcategoryId]: editShowHeaderPointsSectionState[editSubcategory.id || 'new'] ?? true }));
                          setEditShowPricingPlansState((prev) => ({ ...prev, [subcategoryId]: editShowPricingPlansState[editSubcategory.id || 'new'] ?? true }));
                          setEditSubcategory(null);
                          toast.success('Subcategory added! Click the main Save button to persist changes.');
                        }}
                        className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </Modal>
              )}
                </>
              ) : (
                <>
                  {/* Inline Edit Subcategory View */}
                  {(() => {
                    const editingSub = editSubs.find(s => s.id === editingSubcategoryId);
                    if (!editingSub) return null;
                    return (
                      <div className="rounded-2xl border border-border bg-card p-6 space-y-6">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <h2 className="text-xl font-bold">Edit Subcategory</h2>
                            <p className="text-sm text-muted-foreground">{editingSub.name}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setEditPricingPlansState(prev => ({ ...prev, [editingSub.id]: editPricingPlans }));
                                setEditButtonsState(prev => ({ ...prev, [editingSub.id]: editButtons }));
                                setEditSubOverviewPointsState(prev => ({ ...prev, [editingSub.id]: editSubOverviewPoints }));
                                setEditSubDownloadsState(prev => ({ ...prev, [editingSub.id]: editSubDownloads }));
                                setEditSubBrandsState(prev => ({ ...prev, [editingSub.id]: editSubBrands }));
                                setEditingSubcategoryId(null);
                              }}
                              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted flex items-center gap-2"
                            >
                              <ArrowLeft className="w-4 h-4" />
                              Back
                            </button>
                            <button
                              onClick={async () => {
                                setEditPricingPlansState(prev => ({ ...prev, [editingSub.id]: editPricingPlans }));
                                setEditButtonsState(prev => ({ ...prev, [editingSub.id]: editButtons }));
                                setEditSubOverviewPointsState(prev => ({ ...prev, [editingSub.id]: editSubOverviewPoints }));
                                setEditSubDownloadsState(prev => ({ ...prev, [editingSub.id]: editSubDownloads }));
                                setEditSubBrandsState(prev => ({ ...prev, [editingSub.id]: editSubBrands }));
                                setEditShowDownloadsState(prev => ({ ...prev, [editingSub.id]: editShowDownloadsState[editingSub.id] ?? false }));
                                setEditShowBrandsState(prev => ({ ...prev, [editingSub.id]: editShowBrandsState[editingSub.id] ?? true }));
                                setEditShowResourcesState(prev => ({ ...prev, [editingSub.id]: editShowResourcesState[editingSub.id] ?? false }));
                                setEditShowAboutSectionState(prev => ({ ...prev, [editingSub.id]: editShowAboutSectionState[editingSub.id] ?? true }));
                                setEditShowHeaderPointsSectionState(prev => ({ ...prev, [editingSub.id]: editShowHeaderPointsSectionState[editingSub.id] ?? true }));
                                setEditShowPricingPlansState(prev => ({ ...prev, [editingSub.id]: editShowPricingPlansState[editingSub.id] ?? true }));
                                setEditResourcesTabLabelState(prev => ({ ...prev, [editingSub.id]: editResourcesTabLabelState[editingSub.id] ?? 'Resources' }));
                                setEditDownloadsTabLabelState(prev => ({ ...prev, [editingSub.id]: editDownloadsTabLabelState[editingSub.id] ?? 'Downloads' }));
                                setEditBrandsTabLabelState(prev => ({ ...prev, [editingSub.id]: editBrandsTabLabelState[editingSub.id] ?? 'Brands' }));
                                setEditPricingPlansTabLabelState(prev => ({ ...prev, [editingSub.id]: editPricingPlansTabLabelState[editingSub.id] ?? 'Pricing Plans' }));
                                setEditKeyFeaturesTabLabelState(prev => ({ ...prev, [editingSub.id]: editKeyFeaturesTabLabelState[editingSub.id] ?? 'Key Features' }));
                                await saveCategory();
                                setEditingSubcategoryId(null);
                              }}
                              disabled={isSavingCategory}
                              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Save className="w-4 h-4" />
                              {isSavingCategory ? 'Saving...' : 'Save'}
                            </button>
                          </div>
                        </div>

                    <div>
                      <label className="block text-sm font-medium mb-1.5">Name</label>
                      <input
                        value={editingSub.name || ''}
                        onChange={(e) => {
                          setEditSubs(editSubs.map(s => s.id === editingSub.id ? { ...s, name: e.target.value } : s));
                        }}
                        className="w-full px-4 py-2.5 rounded-lg border border-input bg-background"
                      />
                    </div>

                    <div className="space-y-3 border-t pt-4">
                      <label className="block text-sm font-medium">Description 1</label>
                      <textarea
                        value={editingSub.detail_description || ''}
                        onChange={(e) => {
                          setEditSubs(editSubs.map(s => s.id === editingSub.id ? { ...s, detail_description: e.target.value } : s));
                        }}
                        className="min-h-[80px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                        placeholder="Enter first description here..."
                      />
                    </div>

                    <div className="space-y-3 border-t pt-4">
                      <label className="block text-sm font-medium">Custom Redirect Link (Optional)</label>
                      <textarea
                        value={editingSub.custom_link || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          const type = detectLinkType(val);
                          setEditSubs(editSubs.map(s => s.id === editingSub.id ? { ...s, custom_link: val || undefined, custom_link_type: type } : s));
                        }}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm min-h-[80px]"
                        placeholder="Paste normal URL or trusted embed code like Zoho Form iframe/script"
                      />
                      {editingSub.custom_link && !validateEmbedCode(editingSub.custom_link).isValid && (
                        <p className="text-xs text-destructive">{validateEmbedCode(editingSub.custom_link).message}</p>
                      )}
                    </div>

                    <div className="space-y-3 border-t pt-4">
                      <label className="block text-sm font-medium">Hero Background Color (Optional)</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={editingSub.hero_background_color || '#ffffff'}
                          onChange={(e) => {
                            setEditSubs(editSubs.map(s => s.id === editingSub.id ? { ...s, hero_background_color: e.target.value } : s));
                          }}
                          className="w-12 h-10 rounded border border-input cursor-pointer"
                        />
                        <input
                          value={editingSub.hero_background_color || ''}
                          onChange={(e) => {
                            setEditSubs(editSubs.map(s => s.id === editingSub.id ? { ...s, hero_background_color: e.target.value } : s));
                          }}
                          className="flex-1 px-4 py-2.5 rounded-lg border border-input bg-background"
                          placeholder="#ffffff"
                        />
                      </div>
                    </div>
                    <div className="border-t">
                      <button
                        type="button"
                        onClick={() => setActiveAccordion(activeAccordion === 'about-sections' ? null : 'about-sections')}
                        className="flex w-full items-center justify-between py-4 text-left hover:bg-muted/50 px-2 rounded-lg transition-colors"
                      >
                        <label className="text-lg font-bold cursor-pointer">About Sections</label>
                        <ChevronDown className={`h-5 w-5 transition-transform ${activeAccordion === 'about-sections' ? 'rotate-180' : ''}`} />
                      </button>
                      
                      {activeAccordion === 'about-sections' && (
                        <div className="space-y-4 pb-6 px-2">
                          <div className="flex items-center justify-between mb-4">
                            <label className="text-sm font-medium">Manage multiple about content sections</label>
                            <button
                              type="button"
                              onClick={() => addAboutSection(editingSub.id)}
                              className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                            >
                              <Plus className="h-4 w-4" /> Add More
                            </button>
                          </div>
                          
                          {(editAboutSections[editingSub.id] || []).length === 0 ? (
                            <p className="text-sm text-muted-foreground py-4">No About sections added yet. Click "Add More" to create your first About section.</p>
                          ) : (
                            <div className="space-y-3">
                                  {(editAboutSections[editingSub.id] || []).map((section, index) => (
                                    <div key={section.id} className="w-full space-y-3" style={{ backgroundColor: section.background_color || '#ffffff', padding: '16px', borderRadius: '8px' }}>
                                      <div className="flex items-center justify-between gap-3">
                                        <input
                                          value={section.heading}
                                          onChange={(e) => updateAboutSection(editingSub.id, section.id, { heading: e.target.value })}
                                          className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-sm"
                                          placeholder="About heading"
                                        />
                                        <div className="flex items-center gap-2">
                                          <Switch
                                            checked={editAboutSectionVisibility[editingSub.id]?.[section.id] ?? true}
                                            onCheckedChange={(value) => setEditAboutSectionVisibility(prev => ({
                                              ...prev,
                                              [editingSub.id]: {
                                                ...(prev[editingSub.id] || {}),
                                                [section.id]: value
                                              }
                                            }))}
                                          />
                                          <button
                                            type="button"
                                            onClick={() => deleteAboutSection(editingSub.id, section.id)}
                                            className="text-destructive hover:text-destructive/80 p-1"
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </button>
                                        </div>
                                      </div>
                                      {editAboutSectionVisibility[editingSub.id]?.[section.id] !== false && (
                                        <>
                                          <div className="flex items-center gap-3">
                                            <label className="text-sm text-muted-foreground">Background:</label>
                                            <input
                                              type="color"
                                              value={section.background_color || '#ffffff'}
                                              onChange={(e) => updateAboutSection(editingSub.id, section.id, { background_color: e.target.value })}
                                              className="w-10 h-10 rounded cursor-pointer border border-input"
                                            />
                                            <label className="text-sm text-muted-foreground ml-4">Logo BG Color:</label>
                                            <input
                                              type="color"
                                              value={section.heading_color || '#000000'}
                                              onChange={(e) => updateAboutSection(editingSub.id, section.id, { heading_color: e.target.value })}
                                              className="w-10 h-10 rounded cursor-pointer border border-input"
                                            />
                                          </div>
                                          <TipTapEditor
                                            key={section.id}
                                            value={section.content || ''}
                                            onChange={createAboutSectionChangeHandler(editingSub.id, section.id)}
                                            className="min-h-[100px] w-full"
                                            placeholder="Enter about section content here..."
                                          />
                                        </>
                                      )}
                                    </div>
                                  ))}
                                </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="border-t">
                      <button
                        type="button"
                        onClick={() => setActiveAccordion(activeAccordion === 'key-features' ? null : 'key-features')}
                        className="flex w-full items-center justify-between py-4 text-left hover:bg-muted/50 px-2 rounded-lg transition-colors"
                      >
                        <label className="text-lg font-bold cursor-pointer">Key Features Tab</label>
                        <ChevronDown className={`h-5 w-5 transition-transform ${activeAccordion === 'key-features' ? 'rotate-180' : ''}`} />
                      </button>

                      {activeAccordion === 'key-features' && (
                        <div className="space-y-4 pb-6 px-2">
                          <div className="space-y-3 border-b pb-6">
                            <div className="flex items-center justify-between">
                              <label className="block text-sm font-medium">Enable Key Features Tab</label>
                              <Switch
                                checked={editShowHeaderPointsSectionState[editingSub.id] ?? true}
                                onCheckedChange={(value) => setEditShowHeaderPointsSectionState({ ...editShowHeaderPointsSectionState, [editingSub.id]: value })}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1.5">Tab Label</label>
                              <input
                                value={editKeyFeaturesTabLabelState[editingSub.id] ?? 'Key Features'}
                                onChange={(e) => setEditKeyFeaturesTabLabelState({ ...editKeyFeaturesTabLabelState, [editingSub.id]: e.target.value })}
                                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                                placeholder="Key Features"
                              />
                            </div>
                          </div>

                          <div className="flex items-center justify-between mb-4">
                            <button
                              type="button"
                              onClick={() => addKeyFeaturesSection(editingSub.id)}
                              className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                            >
                              <Plus className="h-4 w-4" /> Add More
                            </button>
                          </div>
                          
                          {(editKeyFeaturesSections[editingSub.id] || []).length === 0 ? (
                            <p className="text-sm text-muted-foreground py-4">No Key Features sections added yet. Click "Add More" to create your first section.</p>
                          ) : (
                            <div className="space-y-6">
                              {(editKeyFeaturesSections[editingSub.id] || []).map((section, sectionIndex) => (
                                <div key={section.id} className="w-full space-y-4 rounded-xl border border-border bg-card p-4 shadow-sm">
                                  <div className="flex items-center justify-between gap-3">
                                    <input
                                      value={section.heading}
                                      onChange={(e) => updateKeyFeaturesSection(editingSub.id, section.id, { heading: e.target.value })}
                                      className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-sm font-bold"
                                      placeholder="Section heading (e.g., Key Features)"
                                    />
                                    <div className="flex items-center gap-2">
                                      <Switch
                                        checked={section.is_visible}
                                        onCheckedChange={(value) => updateKeyFeaturesSection(editingSub.id, section.id, { is_visible: value })}
                                      />
                                      <button
                                        type="button"
                                        onClick={() => deleteKeyFeaturesSection(editingSub.id, section.id)}
                                        className="text-destructive hover:text-destructive/80 p-1"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    </div>
                                  </div>

                                  {section.is_visible && (
                                    <div className="space-y-3 pl-4 border-l-2 border-primary/20">
                                      {editSubOverviewPoints
                                        .filter(p => p.section_id === section.id)
                                        .map((point, pointIndex) => {
                                          return (
                                            <div key={point.id || pointIndex} className="flex flex-col gap-3 rounded-lg border border-border bg-muted/30 p-3">
                                              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                                <input
                                                  type="text"
                                                  value={point.text}
                                                  onChange={(e) => {
                                                    const newPoints = [...editSubOverviewPoints];
                                                    const pointToUpdateIdx = newPoints.findIndex(p => p.id === point.id);
                                                    if (pointToUpdateIdx !== -1) {
                                                      newPoints[pointToUpdateIdx] = { ...newPoints[pointToUpdateIdx], text: e.target.value };
                                                      setEditSubOverviewPoints(newPoints);
                                                    }
                                                  }}
                                                  placeholder={`Point ${pointIndex + 1}`}
                                                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                                                />
                                                <div className="flex items-center gap-3">
                                                  <div className="flex items-center gap-2">
                                                    <button
                                                      type="button"
                                                      onClick={() => {
                                                        const newPoints = [...editSubOverviewPoints];
                                                        const pointToUpdateIdx = newPoints.findIndex(p => p.id === point.id);
                                                        if (pointToUpdateIdx !== -1) {
                                                          newPoints[pointToUpdateIdx] = { ...newPoints[pointToUpdateIdx], highlight_color: 'green' };
                                                          setEditSubOverviewPoints(newPoints);
                                                        }
                                                      }}
                                                      className={`h-7 w-7 rounded-full border-2 ${point.highlight_color !== 'blue' ? 'border-emerald-700 ring-2 ring-emerald-200' : 'border-border'}`}
                                                      style={{ backgroundColor: '#10b981' }}
                                                    />
                                                    <button
                                                      type="button"
                                                      onClick={() => {
                                                        const newPoints = [...editSubOverviewPoints];
                                                        const pointToUpdateIdx = newPoints.findIndex(p => p.id === point.id);
                                                        if (pointToUpdateIdx !== -1) {
                                                          newPoints[pointToUpdateIdx] = { ...newPoints[pointToUpdateIdx], highlight_color: 'blue' };
                                                          setEditSubOverviewPoints(newPoints);
                                                        }
                                                      }}
                                                      className={`h-7 w-7 rounded-full border-2 ${point.highlight_color === 'blue' ? 'border-blue-700 ring-2 ring-blue-200' : 'border-border'}`}
                                                      style={{ backgroundColor: '#2563eb' }}
                                                    />
                                                  </div>
                                                  <div className="flex items-center gap-2 border-l pl-3">
                                                    <label className="text-xs text-muted-foreground">Highlight</label>
                                                    <Switch
                                                      checked={point.is_highlighted}
                                                      onCheckedChange={(value) => {
                                                        const newPoints = [...editSubOverviewPoints];
                                                        const pointToUpdateIdx = newPoints.findIndex(p => p.id === point.id);
                                                        if (pointToUpdateIdx !== -1) {
                                                          newPoints[pointToUpdateIdx] = { ...newPoints[pointToUpdateIdx], is_highlighted: value };
                                                          setEditSubOverviewPoints(newPoints);
                                                        }
                                                      }}
                                                    />
                                                  </div>
                                                  <button
                                                    type="button"
                                                    onClick={() => {
                                                      const newPoints = editSubOverviewPoints.filter(p => p.id !== point.id);
                                                      setEditSubOverviewPoints(newPoints);
                                                    }}
                                                    className="rounded-lg p-2 text-destructive hover:bg-destructive/10"
                                                  >
                                                    <Trash2 className="w-4 h-4" />
                                                  </button>
                                                </div>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      <button
                                        type="button"
                                        onClick={() => setEditSubOverviewPoints([...editSubOverviewPoints, { id: crypto.randomUUID(), subcategory_id: editingSub.id, section_id: section.id, text: '', is_highlighted: false, highlight_color: 'green', sort_order: editSubOverviewPoints.filter(p => p.section_id === section.id).length }])}
                                        className="flex items-center gap-2 text-sm text-primary font-semibold hover:underline"
                                      >
                                        <Plus className="w-4 h-4" /> Add Point
                                      </button>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="border-t">
                      <button
                        type="button"
                        onClick={() => setActiveAccordion(activeAccordion === 'buttons' ? null : 'buttons')}
                        className="flex w-full items-center justify-between py-4 text-left hover:bg-muted/50 px-2 rounded-lg transition-colors"
                      >
                        <label className="text-lg font-bold cursor-pointer">Buttons</label>
                        <ChevronDown className={`h-5 w-5 transition-transform ${activeAccordion === 'buttons' ? 'rotate-180' : ''}`} />
                      </button>

                      {activeAccordion === 'buttons' && (
                        <div className="space-y-4 pb-6 px-2">
                          <p className="text-sm text-muted-foreground">Add up to 4 custom buttons for this subcategory.</p>
                          {editButtons.length > 0 && (
                            <div className="grid gap-4 sm:grid-cols-2">
                              {editButtons.map((button, index) => (
                                <div key={button.id || index} className="rounded-3xl border border-border bg-card p-4 shadow-sm">
                                  <div className="flex items-center justify-between gap-3">
                                    <input
                                      type="text"
                                      value={button.label}
                                      onChange={(e) => {
                                        const newButtons = [...editButtons];
                                        newButtons[index] = { ...newButtons[index], label: e.target.value };
                                        setEditButtons(newButtons);
                                      }}
                                      placeholder="Button label"
                                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                                    />
                                    <Switch
                                      checked={button.is_visible ?? false}
                                      onCheckedChange={(value) => {
                                        const newButtons = [...editButtons];
                                        newButtons[index] = { ...newButtons[index], is_visible: value };
                                        setEditButtons(newButtons);
                                      }}
                                      className="shrink-0"
                                    />
                                  </div>
                                  <input
                                    type="text"
                                    value={button.link || ''}
                                    onChange={(e) => {
                                      const newButtons = [...editButtons];
                                      newButtons[index] = { ...newButtons[index], link: e.target.value || null };
                                      setEditButtons(newButtons);
                                    }}
                                    placeholder="Button link"
                                    className="mt-3 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                                  />
                                  <p className="mt-2 text-xs text-muted-foreground">{button.is_visible ? 'Visible' : 'Hidden'}</p>
                                </div>
                              ))}
                            </div>
                          )}
                          {editButtons.length < 4 && (
                            <button
                              type="button"
                              onClick={() => setEditButtons([...editButtons, { id: crypto.randomUUID(), label: '', link: null, is_visible: true }])}
                              className="flex items-center gap-2 text-sm text-primary font-semibold hover:underline"
                            >
                              <Plus className="w-4 h-4" /> Add Button
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="border-t">
                      <button
                        type="button"
                        onClick={() => setActiveAccordion(activeAccordion === 'resources' ? null : 'resources')}
                        className="flex w-full items-center justify-between py-4 text-left hover:bg-muted/50 px-2 rounded-lg transition-colors"
                      >
                        <label className="text-lg font-bold cursor-pointer">Resources</label>
                        <ChevronDown className={`h-5 w-5 transition-transform ${activeAccordion === 'resources' ? 'rotate-180' : ''}`} />
                      </button>

                      {activeAccordion === 'resources' && (
                        <div className="space-y-4 pb-6 px-2">
                          <div className="flex items-center justify-between">
                            <label className="block text-sm font-medium">Enable Resources Section</label>
                            <Switch
                              checked={editShowResourcesState[editingSub.id] ?? false}
                              onCheckedChange={(value) => setEditShowResourcesState({ ...editShowResourcesState, [editingSub.id]: value })}
                            />
                          </div>
                          {editShowResourcesState[editingSub.id] !== false && (
                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm font-medium mb-1.5">Tab Label</label>
                                <input
                                  value={editResourcesTabLabelState[editingSub.id] ?? 'Resources'}
                                  onChange={(e) => setEditResourcesTabLabelState({ ...editResourcesTabLabelState, [editingSub.id]: e.target.value })}
                                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                                  placeholder="Resources"
                                />
                              </div>

                              <div className="space-y-3 pt-2">
                                <label className="block text-sm font-medium">Video URLs (Resources)</label>
                                <div className="space-y-3">
                                  {(editingSub.video_url_2 || []).map((url, index) => (
                                    <div key={index} className="flex gap-2">
                                      <input
                                        type="text"
                                        value={url || ''}
                                        onChange={(e) => {
                                          const newUrls = [...(editingSub.video_url_2 || [])];
                                          newUrls[index] = e.target.value;
                                          setEditSubs(editSubs.map(s => s.id === editingSub.id ? { ...s, video_url_2: newUrls } : s));
                                        }}
                                        placeholder="Enter YouTube or video URL"
                                        className="flex-1 px-4 py-2.5 rounded-lg border border-input bg-background text-sm"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const newUrls = (editingSub.video_url_2 || []).filter((_, i) => i !== index);
                                          setEditSubs(editSubs.map(s => s.id === editingSub.id ? { ...s, video_url_2: newUrls } : s));
                                        }}
                                        className="px-3 py-2 rounded-lg bg-destructive text-destructive-foreground"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  ))}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newUrls = [...(editingSub.video_url_2 || []), ''];
                                      setEditSubs(editSubs.map(s => s.id === editingSub.id ? { ...s, video_url_2: newUrls } : s));
                                    }}
                                    className="flex items-center gap-2 text-sm text-primary font-semibold hover:underline"
                                  >
                                    <Plus className="w-4 h-4" /> Add Video URL
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="border-t">
                      <button
                        type="button"
                        onClick={() => setActiveAccordion(activeAccordion === 'downloads' ? null : 'downloads')}
                        className="flex w-full items-center justify-between py-4 text-left hover:bg-muted/50 px-2 rounded-lg transition-colors"
                      >
                        <label className="text-lg font-bold cursor-pointer">Downloads</label>
                        <ChevronDown className={`h-5 w-5 transition-transform ${activeAccordion === 'downloads' ? 'rotate-180' : ''}`} />
                      </button>

                      {activeAccordion === 'downloads' && (
                        <div className="space-y-4 pb-6 px-2">
                          <div className="flex items-center justify-between">
                            <label className="block text-sm font-medium">Downloads</label>
                            <Switch
                              checked={editShowDownloadsState[editingSub.id] ?? false}
                              onCheckedChange={(value) => setEditShowDownloadsState({ ...editShowDownloadsState, [editingSub.id]: value })}
                            />
                          </div>
                          {editShowDownloadsState[editingSub.id] === true && (
                            <>
                              <div>
                                <label className="block text-sm font-medium mb-1.5">Tab Label</label>
                                <input
                                  value={editDownloadsTabLabelState[editingSub.id] ?? 'Downloads'}
                                  onChange={(e) => setEditDownloadsTabLabelState({ ...editDownloadsTabLabelState, [editingSub.id]: e.target.value })}
                                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                                  placeholder="Downloads"
                                />
                              </div>
                              <div className="space-y-3">
                                {editSubDownloads.map((download, index) => (
                                  <div key={download.id || index} className="rounded-xl border border-border p-3">
                                    <div className="mb-3 flex items-center justify-between">
                                      <span className="text-sm font-medium">Download {index + 1}</span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const newDownloads = [...editSubDownloads];
                                          newDownloads.splice(index, 1);
                                          setEditSubDownloads(newDownloads);
                                        }}
                                        className="p-1 text-destructive"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    </div>
                                    <input
                                      placeholder="File name"
                                      value={download.file_name || ''}
                                      onChange={(e) => {
                                        const newDownloads = [...editSubDownloads];
                                        newDownloads[index] = { ...newDownloads[index], file_name: e.target.value };
                                        setEditSubDownloads(newDownloads);
                                      }}
                                      className="mb-3 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                                    />
                                    <FileUpload
                                      label="Upload File"
                                      value={download.file_url || null}
                                      fileName={download.file_name || undefined}
                                      folder="downloads"
                                      onChange={({ url, name }) => {
                                        const newDownloads = [...editSubDownloads];
                                        newDownloads[index] = {
                                          ...newDownloads[index],
                                          file_url: url,
                                          file_name: newDownloads[index].file_name?.trim() ? newDownloads[index].file_name : name,
                                        };
                                        setEditSubDownloads(newDownloads);
                                      }}
                                      onRemove={() => {
                                        const newDownloads = [...editSubDownloads];
                                        newDownloads[index] = { ...newDownloads[index], file_url: '' };
                                        setEditSubDownloads(newDownloads);
                                      }}
                                    />
                                    <select
                                      value={download.file_type || 'pdf'}
                                      onChange={(e) => {
                                        const newDownloads = [...editSubDownloads];
                                        newDownloads[index] = { ...newDownloads[index], file_type: e.target.value };
                                        setEditSubDownloads(newDownloads);
                                      }}
                                      className="mt-3 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                                    >
                                      <option value="pdf">PDF</option>
                                      <option value="file">File</option>
                                      <option value="image">Image</option>
                                      <option value="video">Video</option>
                                    </select>
                                  </div>
                                ))}
                              </div>
                              {editSubDownloads.length < 10 && (
                                <button
                                  type="button"
                                  onClick={() => setEditSubDownloads([...editSubDownloads, { id: crypto.randomUUID(), file_name: '', file_url: '', file_type: 'pdf' }])}
                                  className="flex items-center gap-2 text-sm text-primary font-semibold hover:underline"
                                >
                                  <Plus className="w-4 h-4" /> Add Download
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="border-t">
                      <button
                        type="button"
                        onClick={() => setActiveAccordion(activeAccordion === 'brands' ? null : 'brands')}
                        className="flex w-full items-center justify-between py-4 text-left hover:bg-muted/50 px-2 rounded-lg transition-colors"
                      >
                        <label className="text-lg font-bold cursor-pointer">Brands</label>
                        <ChevronDown className={`h-5 w-5 transition-transform ${activeAccordion === 'brands' ? 'rotate-180' : ''}`} />
                      </button>

                      {activeAccordion === 'brands' && (
                        <div className="space-y-4 pb-6 px-2">
                          <div className="flex items-center justify-between">
                            <label className="block text-sm font-medium">Enable Brands Section</label>
                            <Switch
                              checked={editShowBrandsState[editingSub.id] ?? true}
                              onCheckedChange={(value) => setEditShowBrandsState({ ...editShowBrandsState, [editingSub.id]: value })}
                            />
                          </div>
                          {editShowBrandsState[editingSub.id] !== false && (
                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm font-medium mb-1.5">Tab Label</label>
                                <input
                                  value={editBrandsTabLabelState[editingSub.id] ?? 'Brands'}
                                  onChange={(e) => setEditBrandsTabLabelState({ ...editBrandsTabLabelState, [editingSub.id]: e.target.value })}
                                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                                  placeholder="Brands"
                                />
                              </div>
                              <div className="space-y-3">
                                {editSubBrands.map((brand, index) => (
                                  <div key={brand.id || index} className="rounded-xl border border-border p-3">
                                    <div className="mb-3 flex items-center justify-between">
                                      <span className="text-sm font-medium">Brand {index + 1}</span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const newBrands = [...editSubBrands];
                                          newBrands.splice(index, 1);
                                          setEditSubBrands(newBrands);
                                        }}
                                        className="p-1 text-destructive"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    </div>
                                    <div className="mb-3">
                                      <ImageUpload
                                        label="Logo"
                                        value={brand.logo_url}
                                        onChange={(url) => {
                                          const newBrands = [...editSubBrands];
                                          newBrands[index] = { ...newBrands[index], logo_url: url };
                                          setEditSubBrands(newBrands);
                                        }}
                                        folder="brands"
                                      />
                                    </div>
                                    <input
                                      placeholder="Brand name"
                                      value={brand.name || ''}
                                      onChange={(e) => {
                                        const newBrands = [...editSubBrands];
                                        newBrands[index] = { ...newBrands[index], name: e.target.value };
                                        setEditSubBrands(newBrands);
                                      }}
                                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                                    />
                                    <textarea
                                      placeholder="Description"
                                      value={brand.description || ''}
                                      onChange={(e) => {
                                        const newBrands = [...editSubBrands];
                                        newBrands[index] = { ...newBrands[index], description: e.target.value };
                                        setEditSubBrands(newBrands);
                                      }}
                                      className="mt-3 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm min-h-[80px]"
                                    />
                                    <input
                                      placeholder="Primary link (optional)"
                                      value={brand.link || ''}
                                      onChange={(e) => {
                                        const newBrands = [...editSubBrands];
                                        newBrands[index] = { ...newBrands[index], link: e.target.value || null };
                                        setEditSubBrands(newBrands);
                                      }}
                                      className="mt-3 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                                    />

                                    {/* New CTA Buttons Configuration */}
                                    <div className="mt-4 space-y-4 border-t pt-4">
                                      <h4 className="text-sm font-semibold text-foreground">CTA Buttons Configuration</h4>
                                      
                                      {/* Primary CTA */}
                                      <div className="space-y-2 rounded-lg border border-border p-3 bg-muted/30">
                                        <div className="flex items-center justify-between mb-2">
                                          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Button 1 (Primary CTA)</span>
                                          <div className="flex items-center gap-2">
                                            <Switch
                                              checked={brand.primary_cta_visible ?? false}
                                              onCheckedChange={(checked) => {
                                                const newBrands = [...editSubBrands];
                                                newBrands[index] = { ...newBrands[index], primary_cta_visible: checked };
                                                setEditSubBrands(newBrands);
                                              }}
                                            />
                                            <span className="text-[10px] font-medium uppercase text-muted-foreground">{(brand.primary_cta_visible ?? false) ? 'Visible' : 'Hidden'}</span>
                                          </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                          <input
                                            placeholder="Button Label"
                                            value={brand.primary_cta_label || ''}
                                            onChange={(e) => {
                                              const newBrands = [...editSubBrands];
                                              newBrands[index] = { ...newBrands[index], primary_cta_label: e.target.value };
                                              setEditSubBrands(newBrands);
                                            }}
                                            className="rounded-lg border border-input bg-background px-3 py-2 text-xs"
                                          />
                                          <input
                                            placeholder="Button Link"
                                            value={brand.primary_cta_link || ''}
                                            onChange={(e) => {
                                              const newBrands = [...editSubBrands];
                                              newBrands[index] = { ...newBrands[index], primary_cta_link: e.target.value };
                                              setEditSubBrands(newBrands);
                                            }}
                                            className="rounded-lg border border-input bg-background px-3 py-2 text-xs"
                                          />
                                        </div>
                                      </div>

                                      {/* More Actions / Contact */}
                                      <div className="space-y-2 rounded-lg border border-border p-3 bg-muted/30">
                                        <div className="flex items-center justify-between mb-2">
                                          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Button 2 (More Actions)</span>
                                          <div className="flex items-center gap-2">
                                            <Switch
                                              checked={brand.more_actions_visible ?? false}
                                              onCheckedChange={(checked) => {
                                                const newBrands = [...editSubBrands];
                                                newBrands[index] = { ...newBrands[index], more_actions_visible: checked };
                                                setEditSubBrands(newBrands);
                                              }}
                                            />
                                            <span className="text-[10px] font-medium uppercase text-muted-foreground">{(brand.more_actions_visible ?? false) ? 'Visible' : 'Hidden'}</span>
                                          </div>
                                        </div>
                                        <input
                                          placeholder="Button Label (e.g. Contact)"
                                          value={brand.more_actions_label || ''}
                                          onChange={(e) => {
                                            const newBrands = [...editSubBrands];
                                            newBrands[index] = { ...newBrands[index], more_actions_label: e.target.value };
                                            setEditSubBrands(newBrands);
                                          }}
                                          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs"
                                        />
                                        <p className="text-[10px] text-muted-foreground italic">Note: This button will trigger the existing CTA buttons below.</p>
                                      </div>

                                      {/* Join Network */}
                                      <div className="space-y-2 rounded-lg border border-border p-3 bg-muted/30">
                                        <div className="flex items-center justify-between mb-2">
                                          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Button 3 (Join Network)</span>
                                          <div className="flex items-center gap-2">
                                            <Switch
                                              checked={brand.join_network_visible ?? false}
                                              onCheckedChange={(checked) => {
                                                const newBrands = [...editSubBrands];
                                                newBrands[index] = { ...newBrands[index], join_network_visible: checked };
                                                setEditSubBrands(newBrands);
                                              }}
                                            />
                                            <span className="text-[10px] font-medium uppercase text-muted-foreground">{(brand.join_network_visible ?? false) ? 'Visible' : 'Hidden'}</span>
                                          </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                          <input
                                            placeholder="Button Label"
                                            value={brand.join_network_label || ''}
                                            onChange={(e) => {
                                              const newBrands = [...editSubBrands];
                                              newBrands[index] = { ...newBrands[index], join_network_label: e.target.value };
                                              setEditSubBrands(newBrands);
                                            }}
                                            className="rounded-lg border border-input bg-background px-3 py-2 text-xs"
                                          />
                                          <input
                                            placeholder="Join Link (WhatsApp/Telegram/etc)"
                                            value={brand.join_network_link || ''}
                                            onChange={(e) => {
                                              const newBrands = [...editSubBrands];
                                              newBrands[index] = { ...newBrands[index], join_network_link: e.target.value };
                                              setEditSubBrands(newBrands);
                                            }}
                                            className="rounded-lg border border-input bg-background px-3 py-2 text-xs"
                                          />
                                        </div>
                                      </div>
                                    </div>

                                    <div className="mt-4 space-y-2 border-t pt-3">
                                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Existing CTA Buttons (triggered by Button 2)</label>
                                      {(brand.buttons || []).map((btn, btnIndex) => (
                                        <div key={btnIndex} className="flex gap-2 items-center">
                                          <input
                                            placeholder="Label"
                                            value={btn.label}
                                            onChange={(e) => {
                                              const newBrands = [...editSubBrands];
                                              const newButtons = [...(newBrands[index].buttons || [])];
                                              newButtons[btnIndex] = { ...newButtons[btnIndex], label: e.target.value };
                                              newBrands[index] = { ...newBrands[index], buttons: newButtons };
                                              setEditSubBrands(newBrands);
                                            }}
                                            className="flex-1 rounded-lg border border-input bg-background px-3 py-1.5 text-xs"
                                          />
                                          <input
                                            placeholder="Link"
                                            value={btn.link || ''}
                                            onChange={(e) => {
                                              const newBrands = [...editSubBrands];
                                              const newButtons = [...(newBrands[index].buttons || [])];
                                              newButtons[btnIndex] = { ...newButtons[btnIndex], link: e.target.value };
                                              newBrands[index] = { ...newBrands[index], buttons: newButtons };
                                              setEditSubBrands(newBrands);
                                            }}
                                            className="flex-[2] rounded-lg border border-input bg-background px-3 py-1.5 text-xs"
                                          />
                                          <div className="flex items-center gap-1 bg-muted/50 px-2 py-1 rounded-lg border border-border">
                                            <Switch
                                              checked={btn.is_visible ?? true}
                                              onCheckedChange={(checked) => {
                                                const newBrands = [...editSubBrands];
                                                const newButtons = [...(newBrands[index].buttons || [])];
                                                newButtons[btnIndex] = { ...newButtons[btnIndex], is_visible: Boolean(checked) };
                                                newBrands[index] = { ...newBrands[index], buttons: newButtons };
                                                setEditSubBrands(newBrands);
                                              }}
                                            />
                                            <span className="text-[10px] font-medium text-muted-foreground uppercase">{(btn.is_visible ?? true) ? 'ON' : 'OFF'}</span>
                                          </div>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const newBrands = [...editSubBrands];
                                              const newButtons = [...(newBrands[index].buttons || [])];
                                              newButtons.splice(btnIndex, 1);
                                              newBrands[index] = { ...newBrands[index], buttons: newButtons };
                                              setEditSubBrands(newBrands);
                                            }}
                                            className="p-1.5 text-destructive"
                                          >
                                            <X className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      ))}
                                      {(brand.buttons || []).length < 4 && (
                                         <button
                                           type="button"
                                           onClick={() => {
                                             const newBrands = [...editSubBrands];
                                             const newButtons = [...(newBrands[index].buttons || []), { label: '', link: '', is_visible: true }];
                                             newBrands[index] = { ...newBrands[index], buttons: newButtons };
                                             setEditSubBrands(newBrands);
                                           }}
                                           className="flex items-center gap-1.5 text-xs text-primary font-medium hover:underline"
                                         >
                                           <Plus className="w-3.5 h-3.5" /> Add Button
                                         </button>
                                       )}
                                    </div>
                                  </div>
                                ))}
                                {editSubBrands.length < 10 && (
                                  <button
                                    type="button"
                                    onClick={() => setEditSubBrands([...editSubBrands, { 
                                      id: crypto.randomUUID(), 
                                      name: '', 
                                      logo_url: null, 
                                      link: null, 
                                      description: '', 
                                      buttons: [], 
                                      is_visible: true,
                                      primary_cta_label: 'Submit RFP',
                                      primary_cta_link: '',
                                      primary_cta_visible: false,
                                      more_actions_label: 'Contact',
                                      more_actions_visible: false,
                                      join_network_label: '+ Join their Network',
                                      join_network_link: '',
                                      join_network_visible: false
                                    }])}
                                    className="flex items-center gap-2 text-sm text-primary font-semibold hover:underline"
                                  >
                                    <Plus className="w-4 h-4" /> Add Brand
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="border-t">
                      <button
                        type="button"
                        onClick={() => setActiveAccordion(activeAccordion === 'pricing' ? null : 'pricing')}
                        className="flex w-full items-center justify-between py-4 text-left hover:bg-muted/50 px-2 rounded-lg transition-colors"
                      >
                        <label className="text-lg font-bold cursor-pointer">Pricing</label>
                        <ChevronDown className={`h-5 w-5 transition-transform ${activeAccordion === 'pricing' ? 'rotate-180' : ''}`} />
                      </button>

                      {activeAccordion === 'pricing' && (
                        <div className="space-y-4 pb-6 px-2">
                          <div className="flex items-center justify-between">
                            <label className="block text-sm font-medium">Enable Pricing Section</label>
                            <Switch
                              checked={editShowPricingPlansState[editingSub.id] ?? true}
                              onCheckedChange={(value) => setEditShowPricingPlansState({ ...editShowPricingPlansState, [editingSub.id]: value })}
                            />
                          </div>
                          {editShowPricingPlansState[editingSub.id] !== false && (
                            <div className="space-y-3">
                              <div>
                                <label className="block text-sm font-medium mb-1.5">Tab Label</label>
                                <input
                                  value={editPricingPlansTabLabelState[editingSub.id] ?? 'Pricing Plans'}
                                  onChange={(e) => setEditPricingPlansTabLabelState({ ...editPricingPlansTabLabelState, [editingSub.id]: e.target.value })}
                                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                                  placeholder="Pricing Plans"
                                />
                              </div>
                              {editPricingPlans.map((plan, index) => (
                                <div key={plan.id || index} className="rounded-xl border border-border p-3">
                                  <div className="mb-3 flex items-center justify-between">
                                    <span className="text-sm font-medium">Plan {index + 1}</span>
                                    <div className="flex items-center gap-2">
                                      <div className="flex items-center gap-1 bg-muted/50 px-2 py-1 rounded-lg border border-border">
                                        <Switch
                                          checked={plan.is_visible ?? true}
                                          onCheckedChange={(checked) => {
                                            const newPlans = [...editPricingPlans];
                                            newPlans[index] = { ...newPlans[index], is_visible: Boolean(checked) };
                                            setEditPricingPlans(newPlans);
                                          }}
                                        />
                                        <span className="text-[10px] font-medium text-muted-foreground uppercase">{(plan.is_visible ?? true) ? 'ON' : 'OFF'}</span>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const newPlans = [...editPricingPlans];
                                          newPlans.splice(index, 1);
                                          setEditPricingPlans(newPlans);
                                        }}
                                        className="p-1 text-destructive"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-2 gap-3 mb-3">
                                    <input
                                      placeholder="Plan name (e.g., Basic plan)"
                                      value={plan.plan_name || ''}
                                      onChange={(e) => {
                                        const newPlans = [...editPricingPlans];
                                        newPlans[index] = { ...newPlans[index], plan_name: e.target.value };
                                        setEditPricingPlans(newPlans);
                                      }}
                                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                                    />
                                    <div className="flex gap-2">
                                      <select
                                        value={plan.currency || '₹'}
                                        onChange={(e) => {
                                          const newPlans = [...editPricingPlans];
                                          newPlans[index] = { ...newPlans[index], currency: e.target.value };
                                          setEditPricingPlans(newPlans);
                                        }}
                                        className="w-16 rounded-lg border border-input bg-background px-1 py-2 text-sm"
                                      >
                                        <option value="₹">₹</option>
                                        <option value="$">$</option>
                                        <option value="£">£</option>
                                        <option value="€">€</option>
                                        <option value="¥">¥</option>
                                      </select>
                                      <input
                                        placeholder="Price"
                                        value={plan.price || ''}
                                        onChange={(e) => {
                                          const newPlans = [...editPricingPlans];
                                          newPlans[index] = { ...newPlans[index], price: e.target.value };
                                          setEditPricingPlans(newPlans);
                                        }}
                                        className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm"
                                      />
                                    </div>
                                  </div>
                                  <input
                                    placeholder="Duration (e.g., /month)"
                                    value={plan.duration || '/month'}
                                    onChange={(e) => {
                                      const newPlans = [...editPricingPlans];
                                      newPlans[index] = { ...newPlans[index], duration: e.target.value };
                                      setEditPricingPlans(newPlans);
                                    }}
                                    className="mb-3 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                                  />
                                  <textarea
                                    placeholder="Description (optional)"
                                    value={plan.description || ''}
                                    onChange={(e) => {
                                      const newPlans = [...editPricingPlans];
                                      newPlans[index] = { ...newPlans[index], description: e.target.value };
                                      setEditPricingPlans(newPlans);
                                    }}
                                    className="mb-3 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                                    rows={2}
                                  />
                                  <div className="mb-3">
                                    <label className="block text-xs font-medium mb-1.5">Features (one per line)</label>
                                    <textarea
                                      placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
                                      value={plan.features.join('\n') || ''}
                                      onChange={(e) => {
                                        const newPlans = [...editPricingPlans];
                                        newPlans[index] = { ...newPlans[index], features: e.target.value.split('\n') };
                                        setEditPricingPlans(newPlans);
                                      }}
                                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                                      rows={4}
                                    />
                                  </div>
                                  <div className="grid grid-cols-2 gap-3 mb-3">
                                    <input
                                      placeholder="Button label (e.g., Get started)"
                                      value={plan.button_label || 'Get started'}
                                      onChange={(e) => {
                                        const newPlans = [...editPricingPlans];
                                        newPlans[index] = { ...newPlans[index], button_label: e.target.value };
                                        setEditPricingPlans(newPlans);
                                      }}
                                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                                    />
                                    <input
                                      placeholder="Button link"
                                      value={plan.button_link || ''}
                                      onChange={(e) => {
                                        const newPlans = [...editPricingPlans];
                                        newPlans[index] = { ...newPlans[index], button_link: e.target.value || null };
                                        setEditPricingPlans(newPlans);
                                      }}
                                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                                    />
                                  </div>
                                  <input
                                    placeholder="Razorpay payment link (optional)"
                                    value={plan.razorpay_link || ''}
                                    onChange={(e) => {
                                      const newPlans = [...editPricingPlans];
                                      newPlans[index] = { ...newPlans[index], razorpay_link: e.target.value || null };
                                      setEditPricingPlans(newPlans);
                                    }}
                                    className="mb-3 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                                  />
                                  <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <div>
                                      <label className="mb-1.5 block text-xs font-medium">Card Background Color</label>
                                      <div className="flex items-center gap-2">
                                        <input
                                          type="color"
                                          value={plan.card_bg_color || '#ffffff'}
                                          onChange={(e) => {
                                            const newPlans = [...editPricingPlans];
                                            newPlans[index] = { ...newPlans[index], card_bg_color: e.target.value };
                                            setEditPricingPlans(newPlans);
                                          }}
                                          className="h-10 w-12 cursor-pointer rounded border border-input"
                                        />
                                        <input
                                          value={plan.card_bg_color || '#ffffff'}
                                          onChange={(e) => {
                                            const newPlans = [...editPricingPlans];
                                            newPlans[index] = { ...newPlans[index], card_bg_color: e.target.value };
                                            setEditPricingPlans(newPlans);
                                          }}
                                          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs"
                                          placeholder="#ffffff"
                                        />
                                      </div>
                                    </div>
                                    <div>
                                      <label className="mb-1.5 block text-xs font-medium">Button Color</label>
                                      <div className="flex items-center gap-2">
                                        <input
                                          type="color"
                                          value={plan.button_bg_color || '#0f7fb3'}
                                          onChange={(e) => {
                                            const newPlans = [...editPricingPlans];
                                            newPlans[index] = { ...newPlans[index], button_bg_color: e.target.value };
                                            setEditPricingPlans(newPlans);
                                          }}
                                          className="h-10 w-12 cursor-pointer rounded border border-input"
                                        />
                                        <input
                                          value={plan.button_bg_color || '#0f7fb3'}
                                          onChange={(e) => {
                                            const newPlans = [...editPricingPlans];
                                            newPlans[index] = { ...newPlans[index], button_bg_color: e.target.value };
                                            setEditPricingPlans(newPlans);
                                          }}
                                          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs"
                                          placeholder="#0f7fb3"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <label className="flex items-center gap-2 text-sm">
                                      <input
                                        type="checkbox"
                                        checked={plan.is_popular}
                                        onChange={(e) => {
                                          const newPlans = [...editPricingPlans];
                                          newPlans[index] = { ...newPlans[index], is_popular: e.target.checked };
                                          setEditPricingPlans(newPlans);
                                        }}
                                        className="w-4 h-4"
                                      />
                                      Mark as Popular
                                    </label>
                                    <span className="text-xs text-muted-foreground">{plan.is_visible ? 'Visible' : 'Hidden'}</span>
                                  </div>
                                </div>
                              ))}
                              <button
                                type="button"
                                onClick={() => setEditPricingPlans([...editPricingPlans, { id: crypto.randomUUID(), plan_name: '', price: '', currency: '₹', duration: '/month', description: null, features: [], button_label: 'Get started', button_link: null, razorpay_link: null, button_bg_color: '#0f7fb3', card_bg_color: '#ffffff', is_popular: false, is_visible: true, sort_order: editPricingPlans.length }])}
                                className="flex items-center gap-2 text-sm text-primary font-semibold hover:underline"
                              >
                                <Plus className="w-4 h-4" /> Add Pricing Plan
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="border-t">
                      <button
                        type="button"
                        onClick={() => setActiveAccordion(activeAccordion === 'bottom-demo' ? null : 'bottom-demo')}
                        className="flex w-full items-center justify-between py-4 text-left hover:bg-muted/50 px-2 rounded-lg transition-colors"
                      >
                        <h3 className="text-lg font-bold">Watch Demo Section</h3>
                        <ChevronDown className={`h-5 w-5 transition-transform ${activeAccordion === 'bottom-demo' ? 'rotate-180' : ''}`} />
                      </button>

                      {activeAccordion === 'bottom-demo' && (
                        <div className="space-y-4 pb-6 px-2">
                          <p className="text-sm text-muted-foreground">Manage the "About / Need Help Deciding?" section for this specific subcategory.</p>

                          <ImageUpload
                            label="Logo"
                            value={editingSub.link || ''}
                            onChange={(url) => {
                              setEditSubs(editSubs.map(s => s.id === editingSub.id ? { ...s, link: url } : s));
                            }}
                            folder="logos"
                          />

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium mb-1.5">Section Heading</label>
                              <input
                                value={editingSub.about_heading || ''}
                                onChange={(e) => {
                                  setEditSubs(editSubs.map(s => s.id === editingSub.id ? { ...s, about_heading: e.target.value } : s));
                                }}
                                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                                placeholder="Need Help Deciding?"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1.5">Logo BG Color</label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="color"
                                  value={editingSub.about_heading_color || '#ffffff'}
                                  onChange={(e) => {
                                    setEditSubs(editSubs.map(s => s.id === editingSub.id ? { ...s, about_heading_color: e.target.value } : s));
                                  }}
                                  className="w-10 h-10 rounded border border-input cursor-pointer"
                                />
                                <input
                                  value={editingSub.about_heading_color || ''}
                                  onChange={(e) => {
                                    setEditSubs(editSubs.map(s => s.id === editingSub.id ? { ...s, about_heading_color: e.target.value } : s));
                                  }}
                                  className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-sm"
                                  placeholder="#ffffff"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium mb-1.5">Section Subheading</label>
                              <input
                                value={editingSub.about_subheading || ''}
                                onChange={(e) => {
                                  setEditSubs(editSubs.map(s => s.id === editingSub.id ? { ...s, about_subheading: e.target.value } : s));
                                }}
                                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                                placeholder="Talk to Solution Experts for Free."
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1.5">Subheading Color</label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="color"
                                  value={editingSub.about_subheading_color || '#9af24d'}
                                  onChange={(e) => {
                                    setEditSubs(editSubs.map(s => s.id === editingSub.id ? { ...s, about_subheading_color: e.target.value } : s));
                                  }}
                                  className="w-10 h-10 rounded border border-input cursor-pointer"
                                />
                                <input
                                  value={editingSub.about_subheading_color || ''}
                                  onChange={(e) => {
                                    setEditSubs(editSubs.map(s => s.id === editingSub.id ? { ...s, about_subheading_color: e.target.value } : s));
                                  }}
                                  className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-sm"
                                  placeholder="#9af24d"
                                />
                                </div>
                              </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium mb-1.5">Section Description</label>
                              <textarea
                                value={editingSub.about_content || ''}
                                onChange={(e) => {
                                  setEditSubs(editSubs.map(s => s.id === editingSub.id ? { ...s, about_content: e.target.value } : s));
                                }}
                                className="min-h-[90px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                                placeholder="We'll help you find the right tools..."
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1.5">Description Color</label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="color"
                                  value={editingSub.about_description_color || '#ffffff'}
                                  onChange={(e) => {
                                    setEditSubs(editSubs.map(s => s.id === editingSub.id ? { ...s, about_description_color: e.target.value } : s));
                                  }}
                                  className="w-10 h-10 rounded border border-input cursor-pointer"
                                />
                                <input
                                  value={editingSub.about_description_color || ''}
                                  onChange={(e) => {
                                    setEditSubs(editSubs.map(s => s.id === editingSub.id ? { ...s, about_description_color: e.target.value } : s));
                                  }}
                                  className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-sm"
                                  placeholder="#ffffff"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="space-y-3 border-t pt-4">
                            <h4 className="text-sm font-semibold">Demo Form Settings</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium mb-1.5">Demo Form Heading</label>
                                <textarea
                                  value={editingSub.demo_form_heading || ''}
                                  onChange={(e) => {
                                    setEditSubs(editSubs.map(s => s.id === editingSub.id ? { ...s, demo_form_heading: e.target.value } : s));
                                  }}
                                  className="min-h-[60px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                                  placeholder="See The Software In Action&#10;Watch Free Demo!"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-1.5">Demo Heading Color</label>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="color"
                                    value={editingSub.demo_form_heading_color || '#000000'}
                                    onChange={(e) => {
                                      setEditSubs(editSubs.map(s => s.id === editingSub.id ? { ...s, demo_form_heading_color: e.target.value } : s));
                                    }}
                                    className="w-10 h-10 rounded border border-input cursor-pointer"
                                  />
                                  <input
                                    value={editingSub.demo_form_heading_color || ''}
                                    onChange={(e) => {
                                      setEditSubs(editSubs.map(s => s.id === editingSub.id ? { ...s, demo_form_heading_color: e.target.value } : s));
                                    }}
                                    className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-sm"
                                    placeholder="#000000"
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium mb-1.5">Demo Button Label</label>
                                <input
                                  value={editingSub.demo_button_label || ''}
                                  onChange={(e) => {
                                    setEditSubs(editSubs.map(s => s.id === editingSub.id ? { ...s, demo_button_label: e.target.value } : s));
                                  }}
                                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                                  placeholder="Get Free Advice"
                                />
                              </div>
                              <div>
                                <div className="flex items-center gap-6">
                                  <div>
                                    <label className="block text-sm font-medium tracking-wider mb-1.5">Button BG Color</label>
                                    <input
                                      type="color"
                                      value={editingSub.about_button_bg_color || '#16a34a'}
                                      onChange={(e) => {
                                        setEditSubs(editSubs.map(s => s.id === editingSub.id ? { ...s, about_button_bg_color: e.target.value } : s));
                                      }}
                                      className="w-10 h-10 rounded-lg border border-input cursor-pointer p-1 bg-background"
                                      title="Button Background"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium tracking-wider mb-1.5">Button Text Color</label>
                                    <input
                                      type="color"
                                      value={editingSub.about_button_text_color || '#ffffff'}
                                      onChange={(e) => {
                                        setEditSubs(editSubs.map(s => s.id === editingSub.id ? { ...s, about_button_text_color: e.target.value } : s));
                                      }}
                                      className="w-10 h-10 rounded-lg border border-input cursor-pointer p-1 bg-background"
                                      title="Button Text Color"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-3 border-t pt-4">
                            <h4 className="text-sm font-semibold">Section Colors</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium mb-1.5">Background Color</label>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="color"
                                    value={editingSub.about_bg_color || '#013737'}
                                    onChange={(e) => {
                                      setEditSubs(editSubs.map(s => s.id === editingSub.id ? { ...s, about_bg_color: e.target.value } : s));
                                    }}
                                    className="w-10 h-10 rounded border border-input cursor-pointer"
                                  />
                                  <input
                                    value={editingSub.about_bg_color || ''}
                                    onChange={(e) => {
                                      setEditSubs(editSubs.map(s => s.id === editingSub.id ? { ...s, about_bg_color: e.target.value } : s));
                                    }}
                                    className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-sm"
                                    placeholder="#013737"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="border-t">
                      <button
                        type="button"
                        onClick={() => setActiveAccordion(activeAccordion === 'admin-sections' ? null : 'admin-sections')}
                        className="flex w-full items-center justify-between py-4 text-left hover:bg-muted/50 px-2 rounded-lg transition-colors"
                      >
                        <label className="text-lg font-bold cursor-pointer">Section Layout</label>
                        <ChevronDown className={`h-5 w-5 transition-transform ${activeAccordion === 'admin-sections' ? 'rotate-180' : ''}`} />
                      </button>

                      {activeAccordion === 'admin-sections' && (
                        <div className="space-y-4 pb-6 px-2">
                          <div className="flex items-center justify-between">
                            <label className="block text-sm font-medium">Manage Section Data</label>
                            <button type="button" onClick={() => productOpenAddSectionModal(productAdminTab === 'layout' ? 'cards' : productAdminTab)} className="rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:bg-green-700">Add Section</button>
                          </div>
                      <div className="flex flex-wrap gap-2">
                        {PRODUCT_ADMIN_TABS.map((item) => (
                          <button
                            key={item.key}
                            type="button"
                            onClick={() => setProductAdminTab(item.key)}
                            className={`rounded-lg px-3 py-2 text-xs font-medium ${productAdminTab === item.key ? 'bg-primary text-primary-foreground' : 'border border-border bg-card'}`}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                      {productAdminTab === 'layout' ? (
                        <DndContext sensors={productSensors} collisionDetection={closestCenter} onDragEnd={(event) => productHandleSectionDragEnd(event, productSectionsLocal, editingSub.id)}>
                          <SortableContext items={productSectionsLocal.map((section) => section.id)} strategy={verticalListSortingStrategy}>
                            <div className="grid gap-2">
                              {productSectionsLocal.map((section) => (
                                <SortableAdminItem key={section.id} id={section.id}>
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <span className="text-sm font-medium">{section.heading?.trim() || section.name}</span>
                                    <div className="flex items-center gap-2">
                                      <Switch checked={section.is_visible} onCheckedChange={(checked) => productToggleSectionVisibility(section.id, Boolean(checked), editingSub.id)} />
                                      <button type="button" onClick={() => productOpenHeadingModal(section.id, productSectionsLocal)} className="rounded bg-blue-600 px-2 py-1 text-xs text-white">Edit Heading</button>
                                      <button type="button" onClick={() => productDeleteSection(section.id, editingSub.id)} className="rounded bg-destructive px-2 py-1 text-xs text-destructive-foreground">Delete</button>
                                    </div>
                                  </div>
                                </SortableAdminItem>
                              ))}
                              {productSectionsLocal.length === 0 && <p className="text-xs text-muted-foreground">No sections added yet.</p>}
                            </div>
                          </SortableContext>
                        </DndContext>
                      ) : null}

                      {productAdminTab === 'cards' && (
                        <div className="space-y-3">
                          {(() => {
                            const selectedCards = productCards.filter((c) => c.section_id === productSelectedCardsSectionId).sort((a, b) => a.sort_order - b.sort_order);
                            const cardsFixedModeEnabled = selectedCards.some((c) => c.is_fixed);
                            const selectedCardsSection = productSections.find((s) => s.id === productSelectedCardsSectionId);
                            return (
                              <>
                          <div className="flex flex-wrap gap-2">
                            {productSections.filter((s) => s.section_type === 'cards').map((s) => (
                              <button key={s.id} type="button" onClick={() => setProductSelectedCardsSectionId(s.id)} className={`rounded-lg px-3 py-2 text-xs ${productSelectedCardsSectionId === s.id ? 'bg-primary text-primary-foreground' : 'border border-border bg-card'}`}>{getSectionDisplayName(s as any)}</button>
                            ))}
                          </div>
                          {selectedCardsSection && (
                            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border p-2">
                              <Switch checked={selectedCardsSection.is_visible} onCheckedChange={(checked) => productToggleSectionVisibility(selectedCardsSection.id, Boolean(checked), editingSub.id)} />
                              <button type="button" onClick={() => productOpenHeadingModal(selectedCardsSection.id, productSections)} className="rounded bg-blue-600 px-2 py-1 text-xs text-white">Edit Heading</button>
                              <button type="button" onClick={() => productDeleteSection(selectedCardsSection.id, editingSub.id)} className="rounded bg-destructive px-2 py-1 text-xs text-destructive-foreground">Delete Section</button>
                            </div>
                          )}
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                if (!productSelectedCardsSectionId) {
                                  toast.error('Please add/select a Feature Cards section first.');
                                  productOpenAddSectionModal('cards');
                                  return;
                                }
                                setProductEditCard({ title: '', description: '', logo_url: null, link: null, show_border: false, background_color: null });
                              }}
                              className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"
                            >
                              Add Card
                            </button>
                          </div>
                          {productSelectedCardsSectionId && (
                            <label className="flex items-center gap-2 text-xs">
                              <Switch checked={cardsFixedModeEnabled} onCheckedChange={(checked) => productToggleFixedMode(PRODUCT_CARDS_TABLE, productSelectedCardsSectionId, Boolean(checked), editingSub.id)} />
                              <span>Fixed Mode {cardsFixedModeEnabled ? 'ON' : 'OFF'}</span>
                            </label>
                          )}
                          {cardsFixedModeEnabled ? (
                            <DndContext sensors={productSensors} collisionDetection={closestCenter} onDragEnd={productCreateItemDragHandler(selectedCards, PRODUCT_CARDS_TABLE, cardsFixedModeEnabled)}>
                              <SortableContext items={selectedCards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
                                <div className="grid gap-2">
                                  {selectedCards.map((card) => (
                                    <SortableOfferItem key={card.id} id={card.id} disabled={!cardsFixedModeEnabled}>
                                      {card.logo_url && (
                                        <img src={card.logo_url} alt="" className="w-10 h-10 object-contain rounded bg-muted/50 p-1" />
                                      )}
                                      <div className="flex-1 min-w-0"><span className="text-sm font-medium">{card.title}</span></div>
                                      <button type="button" onClick={() => setProductEditCard(card)} className="rounded bg-blue-600 px-2 py-1 text-xs text-white">Edit</button>
                                      <button type="button" onClick={() => productDeleteItem(PRODUCT_CARDS_TABLE, card.id, editingSub.id)} className="rounded bg-destructive px-2 py-1 text-xs text-destructive-foreground">Delete</button>
                                    </SortableOfferItem>
                                  ))}
                                </div>
                              </SortableContext>
                            </DndContext>
                          ) : (
                            <div className="grid gap-2">
                              {selectedCards.map((card) => (
                                <div key={card.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                                  <div className="flex items-center gap-3 flex-1 min-w-0">
                                    {card.logo_url && (
                                      <img src={card.logo_url} alt="" className="w-10 h-10 object-contain rounded bg-muted/50 p-1" />
                                    )}
                                    <span className="text-sm font-medium truncate">{card.title}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button type="button" onClick={() => setProductEditCard(card)} className="rounded bg-blue-600 px-2 py-1 text-xs text-white">Edit</button>
                                    <button type="button" onClick={() => productDeleteItem(PRODUCT_CARDS_TABLE, card.id, editingSub.id)} className="rounded bg-destructive px-2 py-1 text-xs text-destructive-foreground">Delete</button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                              </>
                            );
                          })()}
                        </div>
                      )}

                      {productAdminTab === 'offers' && (
                        <div className="space-y-3">
                          {(() => {
                            const selectedOffers = productOffers.filter((o) => o.section_id === productSelectedOffersSectionId).sort((a, b) => a.sort_order - b.sort_order);
                            const offersFixedModeEnabled = selectedOffers.some((o) => o.is_fixed);
                            const selectedOffersSection = productSections.find((s) => s.id === productSelectedOffersSectionId);
                            return (
                              <>
                          <div className="flex flex-wrap gap-2">
                            {productSections.filter((s) => s.section_type === 'offers').map((s) => (
                              <button key={s.id} type="button" onClick={() => setProductSelectedOffersSectionId(s.id)} className={`rounded-lg px-3 py-2 text-xs ${productSelectedOffersSectionId === s.id ? 'bg-primary text-primary-foreground' : 'border border-border bg-card'}`}>{getSectionDisplayName(s as any)}</button>
                            ))}
                          </div>
                          {selectedOffersSection && (
                            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border p-2">
                              <Switch checked={selectedOffersSection.is_visible} onCheckedChange={(checked) => productToggleSectionVisibility(selectedOffersSection.id, Boolean(checked), editingSub.id)} />
                              <button type="button" onClick={() => productOpenHeadingModal(selectedOffersSection.id, productSections)} className="rounded bg-blue-600 px-2 py-1 text-xs text-white">Edit Heading</button>
                              <button type="button" onClick={() => productDeleteSection(selectedOffersSection.id, editingSub.id)} className="rounded bg-destructive px-2 py-1 text-xs text-destructive-foreground">Delete Section</button>
                            </div>
                          )}
                          {productSelectedOffersSectionId && <button type="button" onClick={() => setProductEditOffer({ heading: '', description: '', image_url: null, link: null, show_border: false })} className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground">Add Offer</button>}
                          {productSelectedOffersSectionId && (
                            <label className="flex items-center gap-2 text-xs">
                              <Switch checked={offersFixedModeEnabled} onCheckedChange={(checked) => productToggleFixedMode(PRODUCT_OFFERS_TABLE, productSelectedOffersSectionId, Boolean(checked), editingSub.id)} />
                              <span>Fixed Mode {offersFixedModeEnabled ? 'ON' : 'OFF'}</span>
                            </label>
                          )}
                          {offersFixedModeEnabled ? (
                            <DndContext sensors={productSensors} collisionDetection={closestCenter} onDragEnd={productCreateItemDragHandler(selectedOffers, PRODUCT_OFFERS_TABLE, offersFixedModeEnabled)}>
                              <SortableContext items={selectedOffers.map((o) => o.id)} strategy={verticalListSortingStrategy}>
                                <div className="grid gap-2">
                                  {selectedOffers.map((offer) => (
                                    <SortableOfferItem key={offer.id} id={offer.id} disabled={!offersFixedModeEnabled}>
                                      {offer.image_url && (
                                        <img src={offer.image_url} alt="" className="w-12 h-12 object-cover rounded bg-muted/50" />
                                      )}
                                      <div className="flex-1 min-w-0"><span className="text-sm font-medium">{offer.heading}</span></div>
                                      <button type="button" onClick={() => setProductEditOffer(offer)} className="rounded bg-blue-600 px-2 py-1 text-xs text-white">Edit</button>
                                      <button type="button" onClick={() => productDeleteItem(PRODUCT_OFFERS_TABLE, offer.id, editingSub.id)} className="rounded bg-destructive px-2 py-1 text-xs text-destructive-foreground">Delete</button>
                                    </SortableOfferItem>
                                  ))}
                                </div>
                              </SortableContext>
                            </DndContext>
                          ) : (
                            <div className="grid gap-2">
                              {selectedOffers.map((offer) => (
                                <div key={offer.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                                  <div className="flex items-center gap-3 flex-1 min-w-0">
                                    {offer.image_url && (
                                      <img src={offer.image_url} alt="" className="w-12 h-12 object-cover rounded bg-muted/50" />
                                    )}
                                    <span className="text-sm font-medium truncate">{offer.heading}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button type="button" onClick={() => setProductEditOffer(offer)} className="rounded bg-blue-600 px-2 py-1 text-xs text-white">Edit</button>
                                    <button type="button" onClick={() => productDeleteItem(PRODUCT_OFFERS_TABLE, offer.id, editingSub.id)} className="rounded bg-destructive px-2 py-1 text-xs text-destructive-foreground">Delete</button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                              </>
                            );
                          })()}
                        </div>
                      )}

                      {productAdminTab === 'ads_1col' && (
                        <div className="space-y-3">
                          {(() => {
                            const selectedAds1 = productAds2.filter((a) => a.section_id === productSelectedAds1SectionId).sort((a, b) => a.sort_order - b.sort_order);
                            const ads1FixedModeEnabled = selectedAds1.some((a) => a.is_fixed);
                            const selectedAds1Section = productSections.find((s) => s.id === productSelectedAds1SectionId);
                            return (
                              <>
                          <div className="flex flex-wrap gap-2">
                            {productSections.filter((s) => s.section_type === 'ads_1col').map((s) => (
                              <button key={s.id} type="button" onClick={() => setProductSelectedAds1SectionId(s.id)} className={`rounded-lg px-3 py-2 text-xs ${productSelectedAds1SectionId === s.id ? 'bg-primary text-primary-foreground' : 'border border-border bg-card'}`}>{getSectionDisplayName(s as any)}</button>
                            ))}
                          </div>
                          {selectedAds1Section && (
                            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border p-2">
                              <Switch checked={selectedAds1Section.is_visible} onCheckedChange={(checked) => productToggleSectionVisibility(selectedAds1Section.id, Boolean(checked), editingSub.id)} />
                              <button type="button" onClick={() => productOpenHeadingModal(selectedAds1Section.id, productSections)} className="rounded bg-blue-600 px-2 py-1 text-xs text-white">Edit Heading</button>
                              <button type="button" onClick={() => productDeleteSection(selectedAds1Section.id, editingSub.id)} className="rounded bg-destructive px-2 py-1 text-xs text-destructive-foreground">Delete Section</button>
                            </div>
                          )}
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                if (!productSelectedAds1SectionId) {
                                  toast.error('Please add/select an Ad 1 section first.');
                                  productOpenAddSectionModal('ads_1col');
                                  return;
                                }
                                setProductEditAd1({ image_url: null, link: null, show_border: false });
                              }}
                              className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"
                            >
                              Add Ad 1
                            </button>
                          </div>
                          {productSelectedAds1SectionId && (
                            <label className="flex items-center gap-2 text-xs">
                              <Switch checked={ads1FixedModeEnabled} onCheckedChange={(checked) => productToggleFixedMode(PRODUCT_ADS_2_TABLE, productSelectedAds1SectionId, Boolean(checked), editingSub.id)} />
                              <span>Fixed Mode {ads1FixedModeEnabled ? 'ON' : 'OFF'}</span>
                            </label>
                          )}
                          {ads1FixedModeEnabled ? (
                            <DndContext sensors={productSensors} collisionDetection={closestCenter} onDragEnd={productCreateItemDragHandler(selectedAds1, PRODUCT_ADS_2_TABLE, ads1FixedModeEnabled)}>
                              <SortableContext items={selectedAds1.map((a) => a.id)} strategy={verticalListSortingStrategy}>
                                <div className="grid gap-2">
                                  {selectedAds1.map((ad) => (
                                    <SortableOfferItem key={ad.id} id={ad.id} disabled={!ads1FixedModeEnabled}>
                                      {ad.image_url && (
                                        <img src={ad.image_url} alt="" className="w-16 h-10 object-cover rounded bg-muted/50" />
                                      )}
                                      <div className="flex-1 min-w-0"><span className="text-sm font-medium">Ad</span></div>
                                      <button type="button" onClick={() => setProductEditAd1(ad)} className="rounded bg-blue-600 px-2 py-1 text-xs text-white">Edit</button>
                                      <button type="button" onClick={() => productDeleteItem(PRODUCT_ADS_2_TABLE, ad.id, editingSub.id)} className="rounded bg-destructive px-2 py-1 text-xs text-destructive-foreground">Delete</button>
                                    </SortableOfferItem>
                                  ))}
                                </div>
                              </SortableContext>
                            </DndContext>
                          ) : (
                            <div className="grid gap-2">
                              {selectedAds1.map((ad) => (
                                <div key={ad.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                                  <div className="flex items-center gap-3 flex-1 min-w-0">
                                    {ad.image_url && (
                                      <img src={ad.image_url} alt="" className="w-16 h-10 object-cover rounded bg-muted/50" />
                                    )}
                                    <span className="text-sm font-medium">Ad</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button type="button" onClick={() => setProductEditAd1(ad)} className="rounded bg-blue-600 px-2 py-1 text-xs text-white">Edit</button>
                                    <button type="button" onClick={() => productDeleteItem(PRODUCT_ADS_2_TABLE, ad.id, editingSub.id)} className="rounded bg-destructive px-2 py-1 text-xs text-destructive-foreground">Delete</button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                              </>
                            );
                          })()}
                        </div>
                      )}

                      {productAdminTab === 'ads_2col' && (
                        <div className="space-y-3">
                          {(() => {
                            const selectedAds2 = productAds2.filter((a) => a.section_id === productSelectedAds2SectionId).sort((a, b) => a.sort_order - b.sort_order);
                            const ads2FixedModeEnabled = selectedAds2.some((a) => a.is_fixed);
                            const selectedAds2Section = productSections.find((s) => s.id === productSelectedAds2SectionId);
                            return (
                              <>
                          <div className="flex flex-wrap gap-2">
                            {productSections.filter((s) => s.section_type === 'ads_2col').map((s) => (
                              <button key={s.id} type="button" onClick={() => setProductSelectedAds2SectionId(s.id)} className={`rounded-lg px-3 py-2 text-xs ${productSelectedAds2SectionId === s.id ? 'bg-primary text-primary-foreground' : 'border border-border bg-card'}`}>{getSectionDisplayName(s as any)}</button>
                            ))}
                          </div>
                          {selectedAds2Section && (
                            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border p-2">
                              <Switch checked={selectedAds2Section.is_visible} onCheckedChange={(checked) => productToggleSectionVisibility(selectedAds2Section.id, Boolean(checked), editingSub.id)} />
                              <button type="button" onClick={() => productOpenHeadingModal(selectedAds2Section.id, productSections)} className="rounded bg-blue-600 px-2 py-1 text-xs text-white">Edit Heading</button>
                              <button type="button" onClick={() => productDeleteSection(selectedAds2Section.id, editingSub.id)} className="rounded bg-destructive px-2 py-1 text-xs text-destructive-foreground">Delete Section</button>
                            </div>
                          )}
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                if (!productSelectedAds2SectionId) {
                                  toast.error('Please add/select an Ad 2 section first.');
                                  productOpenAddSectionModal('ads_2col');
                                  return;
                                }
                                setProductEditAd2({ image_url: null, link: null, show_border: false });
                              }}
                              className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"
                            >
                              Add Ad 2
                            </button>
                          </div>
                          {productSelectedAds2SectionId && (
                            <label className="flex items-center gap-2 text-xs">
                              <Switch checked={ads2FixedModeEnabled} onCheckedChange={(checked) => productToggleFixedMode(PRODUCT_ADS_2_TABLE, productSelectedAds2SectionId, Boolean(checked), editingSub.id)} />
                              <span>Fixed Mode {ads2FixedModeEnabled ? 'ON' : 'OFF'}</span>
                            </label>
                          )}
                          {ads2FixedModeEnabled ? (
                            <DndContext sensors={productSensors} collisionDetection={closestCenter} onDragEnd={productCreateItemDragHandler(selectedAds2, PRODUCT_ADS_2_TABLE, ads2FixedModeEnabled)}>
                              <SortableContext items={selectedAds2.map((a) => a.id)} strategy={verticalListSortingStrategy}>
                                <div className="grid gap-2">
                                  {selectedAds2.map((ad) => (
                                    <SortableOfferItem key={ad.id} id={ad.id} disabled={!ads2FixedModeEnabled}>
                                      {ad.image_url && (
                                        <img src={ad.image_url} alt="" className="w-16 h-10 object-cover rounded bg-muted/50" />
                                      )}
                                      <div className="flex-1 min-w-0"><span className="text-sm font-medium">Ad</span></div>
                                      <button type="button" onClick={() => setProductEditAd2(ad)} className="rounded bg-blue-600 px-2 py-1 text-xs text-white">Edit</button>
                                      <button type="button" onClick={() => productDeleteItem(PRODUCT_ADS_2_TABLE, ad.id, editingSub.id)} className="rounded bg-destructive px-2 py-1 text-xs text-destructive-foreground">Delete</button>
                                    </SortableOfferItem>
                                  ))}
                                </div>
                              </SortableContext>
                            </DndContext>
                          ) : (
                            <div className="grid gap-2">
                              {selectedAds2.map((ad) => (
                                <div key={ad.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                                  <div className="flex items-center gap-3 flex-1 min-w-0">
                                    {ad.image_url && (
                                      <img src={ad.image_url} alt="" className="w-16 h-10 object-cover rounded bg-muted/50" />
                                    )}
                                    <span className="text-sm font-medium">Ad</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button type="button" onClick={() => setProductEditAd2(ad)} className="rounded bg-blue-600 px-2 py-1 text-xs text-white">Edit</button>
                                    <button type="button" onClick={() => productDeleteItem(PRODUCT_ADS_2_TABLE, ad.id, editingSub.id)} className="rounded bg-destructive px-2 py-1 text-xs text-destructive-foreground">Delete</button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                              </>
                            );
                          })()}
                        </div>
                      )}

                      {productAdminTab === 'ads_3col' && (
                        <div className="space-y-3">
                          {(() => {
                            const selectedAds3 = productAds3.filter((a) => a.section_id === productSelectedAds3SectionId).sort((a, b) => a.sort_order - b.sort_order);
                            const ads3FixedModeEnabled = selectedAds3.some((a) => a.is_fixed);
                            const selectedAds3Section = productSections.find((s) => s.id === productSelectedAds3SectionId);
                            return (
                              <>
                          <div className="flex flex-wrap gap-2">
                            {productSections.filter((s) => s.section_type === 'ads_3col').map((s) => (
                              <button key={s.id} type="button" onClick={() => setProductSelectedAds3SectionId(s.id)} className={`rounded-lg px-3 py-2 text-xs ${productSelectedAds3SectionId === s.id ? 'bg-primary text-primary-foreground' : 'border border-border bg-card'}`}>{getSectionDisplayName(s as any)}</button>
                            ))}
                          </div>
                          {selectedAds3Section && (
                            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border p-2">
                              <Switch checked={selectedAds3Section.is_visible} onCheckedChange={(checked) => productToggleSectionVisibility(selectedAds3Section.id, Boolean(checked), editingSub.id)} />
                              <button type="button" onClick={() => productOpenHeadingModal(selectedAds3Section.id, productSections)} className="rounded bg-blue-600 px-2 py-1 text-xs text-white">Edit Heading</button>
                              <button type="button" onClick={() => productDeleteSection(selectedAds3Section.id, editingSub.id)} className="rounded bg-destructive px-2 py-1 text-xs text-destructive-foreground">Delete Section</button>
                            </div>
                          )}
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                if (!productSelectedAds3SectionId) {
                                  toast.error('Please add/select an Ad 3 section first.');
                                  productOpenAddSectionModal('ads_3col');
                                  return;
                                }
                                setProductEditAd3({ image_url: null, heading: '', description: '', link: null, show_border: false });
                              }}
                              className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"
                            >
                              Add Ad 3
                            </button>
                          </div>
                          {productSelectedAds3SectionId && (
                            <label className="flex items-center gap-2 text-xs">
                              <Switch checked={ads3FixedModeEnabled} onCheckedChange={(checked) => productToggleFixedMode(PRODUCT_ADS_3_TABLE, productSelectedAds3SectionId, Boolean(checked), editingSub.id)} />
                              <span>Fixed Mode {ads3FixedModeEnabled ? 'ON' : 'OFF'}</span>
                            </label>
                          )}
                          {ads3FixedModeEnabled ? (
                            <DndContext sensors={productSensors} collisionDetection={closestCenter} onDragEnd={productCreateItemDragHandler(selectedAds3, PRODUCT_ADS_3_TABLE, ads3FixedModeEnabled)}>
                              <SortableContext items={selectedAds3.map((a) => a.id)} strategy={verticalListSortingStrategy}>
                                <div className="grid gap-2">
                                  {selectedAds3.map((ad) => (
                                    <SortableOfferItem key={ad.id} id={ad.id} disabled={!ads3FixedModeEnabled}>
                                      {ad.image_url && (
                                        <img src={ad.image_url} alt="" className="w-16 h-10 object-cover rounded bg-muted/50" />
                                      )}
                                      <div className="flex-1 min-w-0"><span className="text-sm font-medium">{ad.heading?.trim() || 'Ad'}</span></div>
                                      <button type="button" onClick={() => setProductEditAd3(ad)} className="rounded bg-blue-600 px-2 py-1 text-xs text-white">Edit</button>
                                      <button type="button" onClick={() => productDeleteItem(PRODUCT_ADS_3_TABLE, ad.id, editingSub.id)} className="rounded bg-destructive px-2 py-1 text-xs text-destructive-foreground">Delete</button>
                                    </SortableOfferItem>
                                  ))}
                                </div>
                              </SortableContext>
                            </DndContext>
                          ) : (
                            <div className="grid gap-2">
                              {selectedAds3.map((ad) => (
                                <div key={ad.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                                  <div className="flex items-center gap-3 flex-1 min-w-0">
                                    {ad.image_url && (
                                      <img src={ad.image_url} alt="" className="w-16 h-10 object-cover rounded bg-muted/50" />
                                    )}
                                    <span className="text-sm font-medium truncate">{ad.heading?.trim() || 'Ad'}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button type="button" onClick={() => setProductEditAd3(ad)} className="rounded bg-blue-600 px-2 py-1 text-xs text-white">Edit</button>
                                    <button type="button" onClick={() => productDeleteItem(PRODUCT_ADS_3_TABLE, ad.id, editingSub.id)} className="rounded bg-destructive px-2 py-1 text-xs text-destructive-foreground">Delete</button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                              </>
                            );
                          })()}
                        </div>
                      )}

                      {productAdminTab === 'logo_steps' && (
                        <div className="space-y-3">
                          {(() => {
                            const selectedLogoSteps = productLogoSteps.filter((s) => s.section_id === productSelectedLogoStepsSectionId).sort((a, b) => a.sort_order - b.sort_order);
                            const selectedLogoSection = productSections.find((s) => s.id === productSelectedLogoStepsSectionId);
                            return (
                              <>
                          <div className="flex flex-wrap gap-2">
                            {productSections.filter((s) => s.section_type === 'logo_steps').map((s) => (
                              <button key={s.id} type="button" onClick={() => setProductSelectedLogoStepsSectionId(s.id)} className={`rounded-lg px-3 py-2 text-xs ${productSelectedLogoStepsSectionId === s.id ? 'bg-primary text-primary-foreground' : 'border border-border bg-card'}`}>{getSectionDisplayName(s as any)}</button>
                            ))}
                          </div>
                          {selectedLogoSection && (
                            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border p-2">
                              <Switch checked={selectedLogoSection.is_visible} onCheckedChange={(checked) => productToggleSectionVisibility(selectedLogoSection.id, Boolean(checked), editingSub.id)} />
                              <button type="button" onClick={() => productOpenHeadingModal(selectedLogoSection.id, productSections)} className="rounded bg-blue-600 px-2 py-1 text-xs text-white">Edit Heading</button>
                              <button type="button" onClick={() => productDeleteSection(selectedLogoSection.id, editingSub.id)} className="rounded bg-destructive px-2 py-1 text-xs text-destructive-foreground">Delete Section</button>
                            </div>
                          )}
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                if (!productSelectedLogoStepsSectionId) {
                                  toast.error('Please add/select a Logo Steps section first.');
                                  productOpenAddSectionModal('logo_steps');
                                  return;
                                }
                                setProductEditLogoStep({ title: '', description: '', logo_url: null });
                              }}
                              className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"
                            >
                              Add Logo Step
                            </button>
                          </div>
                          {productSections.filter((s) => s.section_type === 'logo_steps').length === 0 && (
                            <p className="text-xs text-muted-foreground">No Logo Steps section yet. Add a section first using the &quot;Add Section&quot; button, then add steps.</p>
                          )}
                          <div className="grid gap-2">
                            <DndContext sensors={productSensors} collisionDetection={closestCenter} onDragEnd={productCreateItemDragHandler(selectedLogoSteps, PRODUCT_LOGO_STEPS_TABLE, true)}>
                              <SortableContext items={selectedLogoSteps.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                                <div className="grid gap-2">
                                  {selectedLogoSteps.map((step) => (
                                    <SortableOfferItem key={step.id} id={step.id} disabled={false}>
                                      {step.logo_url && (
                                        <img src={step.logo_url} alt="" className="w-10 h-10 object-contain rounded bg-muted/50 p-1" />
                                      )}
                                      <div className="flex-1 min-w-0"><span className="text-sm font-medium">{step.title}</span></div>
                                      <button type="button" onClick={() => setProductEditLogoStep(step)} className="rounded bg-blue-600 px-2 py-1 text-xs text-white">Edit</button>
                                      <button type="button" onClick={() => productDeleteItem(PRODUCT_LOGO_STEPS_TABLE, step.id, editingSub.id)} className="rounded bg-destructive px-2 py-1 text-xs text-destructive-foreground">Delete</button>
                                    </SortableOfferItem>
                                  ))}
                                </div>
                              </SortableContext>
                            </DndContext>
                          </div>
                              </>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                    {productShowAddSectionModal && (
                      <Modal title="Add Subcategory Section" onClose={() => setProductShowAddSectionModal(false)}>
                        <div className="space-y-3">
                          <select value={productAddSectionType} onChange={(e) => setProductAddSectionType(e.target.value as ProductAdminTab)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                            {PRODUCT_SECTION_TYPE_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                          </select>
                          <input value={productAddSectionName} onChange={(e) => setProductAddSectionName(e.target.value)} placeholder="Section name (optional)" className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
                          <button type="button" onClick={() => productHandleAddSection(editingSub.id)} className="w-full rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground">Create</button>
                        </div>
                      </Modal>
                    )}
                    {productHeadingModalSectionId && (
                      <Modal title="Edit Section Heading" onClose={() => setProductHeadingModalSectionId('')}>
                        <div className="space-y-3">
                          <input value={productHeadingModalValue} onChange={(e) => setProductHeadingModalValue(e.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
                          <label className="flex items-center gap-2 text-sm">
                            <Switch checked={productHeadingVisible} onCheckedChange={(checked) => setProductHeadingVisible(Boolean(checked))} />
                            <span>Show heading</span>
                          </label>
                          <div>
                            <label className="block text-sm font-medium mb-2">Background Color</label>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={productHeadingBackgroundColor || '#ffffff'}
                                onChange={(e) => setProductHeadingBackgroundColor(e.target.value)}
                                className="h-10 w-16 rounded cursor-pointer border border-input"
                              />
                              <input
                                type="text"
                                value={productHeadingBackgroundColor || ''}
                                onChange={(e) => setProductHeadingBackgroundColor(e.target.value)}
                                placeholder="#ffffff or leave empty for default"
                                className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm"
                              />
                            </div>
                          </div>
                          <button type="button" onClick={() => productSaveHeadingModal(productHeadingModalSectionId, editingSub.id)} className="w-full rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground">Save</button>
                        </div>
                      </Modal>
                    )}
                    {productEditCard && (
                      <Modal title={productEditCard.id ? 'Edit Card' : 'Add Card'} onClose={() => setProductEditCard(null)}>
                        <div className="space-y-3">
                          <ImageCropper label="Logo" value={productEditCard.logo_url || null} onChange={(url) => setProductEditCard({ ...productEditCard, logo_url: url })} folder="cards" previewAspectRatio={1} previewLabel="Preview" />
                          <input value={productEditCard.title || ''} onChange={(e) => setProductEditCard({ ...productEditCard, title: e.target.value })} placeholder="Title" className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
                          <textarea value={productEditCard.description || ''} onChange={(e) => setProductEditCard({ ...productEditCard, description: e.target.value })} placeholder="Description" className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" rows={3} />
                          <input value={productEditCard.link || ''} onChange={(e) => setProductEditCard({ ...productEditCard, link: e.target.value || null })} placeholder="Link (optional)" className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
                          <label className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Switch checked={productEditCard.show_border ?? false} onCheckedChange={(checked) => setProductEditCard({ ...productEditCard, show_border: Boolean(checked) })} />
                            <span>Enable Border</span>
                          </label>
                          {productEditCard.show_border && (
                            <div>
                              <label className="block text-sm font-medium mb-1.5">Border Color</label>
                              <div className="flex items-center gap-3">
                                <input
                                  type="color"
                                  value={productEditCard.border_color || '#000000'}
                                  onChange={(e) => setProductEditCard({ ...productEditCard, border_color: e.target.value })}
                                  className="h-10 w-20 rounded cursor-pointer border-0"
                                />
                                <input
                                  type="text"
                                  value={productEditCard.border_color || ''}
                                  onChange={(e) => setProductEditCard({ ...productEditCard, border_color: e.target.value || null })}
                                  placeholder="#000000"
                                  className="flex-1 px-3 py-2 rounded-lg border border-input bg-background"
                                />
                              </div>
                            </div>
                          )}
                          <div>
                            <label className="block text-sm font-medium mb-1.5">Card Background Color</label>
                            <div className="flex items-center gap-3">
                              <input
                                type="color"
                                value={productEditCard.background_color || '#fcf9f5'}
                                onChange={(e) => setProductEditCard({ ...productEditCard, background_color: e.target.value })}
                                className="h-10 w-20 rounded cursor-pointer border-0"
                              />
                              <input
                                type="text"
                                value={productEditCard.background_color || ''}
                                onChange={(e) => setProductEditCard({ ...productEditCard, background_color: e.target.value || null })}
                                placeholder="#fcf9f5"
                                className="flex-1 px-3 py-2 rounded-lg border border-input bg-background"
                              />
                            </div>
                          </div>
                          <button type="button" onClick={() => productSaveCard(editingSub.id)} className="w-full rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground">Save</button>
                        </div>
                      </Modal>
                    )}
                    {productEditOffer && (
                      <Modal title={productEditOffer.id ? 'Edit Offer' : 'Add Offer'} onClose={() => setProductEditOffer(null)}>
                        <div className="space-y-3">
                          <ImageCropper label="Image" value={productEditOffer.image_url || null} onChange={(url) => setProductEditOffer({ ...productEditOffer, image_url: url })} folder="offers" previewAspectRatio={16/9} previewLabel="Preview" />
                          <input value={productEditOffer.heading || ''} onChange={(e) => setProductEditOffer({ ...productEditOffer, heading: e.target.value })} placeholder="Heading (optional)" className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
                          <textarea value={productEditOffer.description || ''} onChange={(e) => setProductEditOffer({ ...productEditOffer, description: e.target.value || null })} placeholder="Description (optional)" className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" rows={3} />
                          <input value={productEditOffer.link || ''} onChange={(e) => setProductEditOffer({ ...productEditOffer, link: e.target.value || null })} placeholder="Link (optional)" className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
                          <label className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Switch checked={productEditOffer.show_border ?? false} onCheckedChange={(checked) => setProductEditOffer({ ...productEditOffer, show_border: Boolean(checked) })} />
                            <span>Enable Border</span>
                          </label>
                          {productEditOffer.show_border && (
                            <div>
                              <label className="block text-sm font-medium mb-1.5">Border Color</label>
                              <div className="flex items-center gap-3">
                                <input
                                  type="color"
                                  value={productEditOffer.border_color || '#000000'}
                                  onChange={(e) => setProductEditOffer({ ...productEditOffer, border_color: e.target.value })}
                                  className="h-10 w-20 rounded cursor-pointer border-0"
                                />
                                <input
                                  type="text"
                                  value={productEditOffer.border_color || ''}
                                  onChange={(e) => setProductEditOffer({ ...productEditOffer, border_color: e.target.value || null })}
                                  placeholder="#000000"
                                  className="flex-1 px-3 py-2 rounded-lg border border-input bg-background"
                                />
                              </div>
                            </div>
                          )}
                          <button type="button" onClick={() => productSaveOffer(editingSub.id)} className="w-full rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground">Save</button>
                        </div>
                      </Modal>
                    )}
                    {productEditAd1 && (
                      <Modal title={productEditAd1.id ? 'Edit Ad 1' : 'Add Ad 1'} onClose={() => setProductEditAd1(null)}>
                        <div className="space-y-3">
                          <ImageCropper label="Image" value={productEditAd1.image_url || null} onChange={(url) => setProductEditAd1({ ...productEditAd1, image_url: url })} folder="ads" previewAspectRatio={2/1} previewLabel="Preview" />
                          <input value={productEditAd1.link || ''} onChange={(e) => setProductEditAd1({ ...productEditAd1, link: e.target.value || null })} placeholder="Link (optional)" className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
                          <label className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Switch checked={productEditAd1.show_border ?? false} onCheckedChange={(checked) => setProductEditAd1({ ...productEditAd1, show_border: Boolean(checked) })} />
                            <span>Enable Border</span>
                          </label>
                          {productEditAd1.show_border && (
                            <div>
                              <label className="block text-sm font-medium mb-1.5">Border Color</label>
                              <div className="flex items-center gap-3">
                                <input
                                  type="color"
                                  value={productEditAd1.border_color || '#000000'}
                                  onChange={(e) => setProductEditAd1({ ...productEditAd1, border_color: e.target.value })}
                                  className="h-10 w-20 rounded cursor-pointer border-0"
                                />
                                <input
                                  type="text"
                                  value={productEditAd1.border_color || ''}
                                  onChange={(e) => setProductEditAd1({ ...productEditAd1, border_color: e.target.value || null })}
                                  placeholder="#000000"
                                  className="flex-1 px-3 py-2 rounded-lg border border-input bg-background"
                                />
                              </div>
                            </div>
                          )}
                          <button type="button" onClick={() => productSaveAd1(editingSub.id)} className="w-full rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground">Save</button>
                        </div>
                      </Modal>
                    )}
                    {productEditAd2 && (
                      <Modal title={productEditAd2.id ? 'Edit Ad 2' : 'Add Ad 2'} onClose={() => setProductEditAd2(null)}>
                        <div className="space-y-3">
                          <ImageCropper label="Image" value={productEditAd2.image_url || null} onChange={(url) => setProductEditAd2({ ...productEditAd2, image_url: url })} folder="ads" previewAspectRatio={2/1} previewLabel="Preview" />
                          <input value={productEditAd2.link || ''} onChange={(e) => setProductEditAd2({ ...productEditAd2, link: e.target.value || null })} placeholder="Link (optional)" className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
                          <label className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Switch checked={productEditAd2.show_border ?? false} onCheckedChange={(checked) => setProductEditAd2({ ...productEditAd2, show_border: Boolean(checked) })} />
                            <span>Enable Border</span>
                          </label>
                          {productEditAd2.show_border && (
                            <div>
                              <label className="block text-sm font-medium mb-1.5">Border Color</label>
                              <div className="flex items-center gap-3">
                                <input
                                  type="color"
                                  value={productEditAd2.border_color || '#000000'}
                                  onChange={(e) => setProductEditAd2({ ...productEditAd2, border_color: e.target.value })}
                                  className="h-10 w-20 rounded cursor-pointer border-0"
                                />
                                <input
                                  type="text"
                                  value={productEditAd2.border_color || ''}
                                  onChange={(e) => setProductEditAd2({ ...productEditAd2, border_color: e.target.value || null })}
                                  placeholder="#000000"
                                  className="flex-1 px-3 py-2 rounded-lg border border-input bg-background"
                                />
                              </div>
                            </div>
                          )}
                          <button type="button" onClick={() => productSaveAd2(editingSub.id)} className="w-full rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground">Save</button>
                        </div>
                      </Modal>
                    )}
                    {productEditAd3 && (
                      <Modal title={productEditAd3.id ? 'Edit Ad 3' : 'Add Ad 3'} onClose={() => setProductEditAd3(null)}>
                        <div className="space-y-3">
                          <ImageCropper label="Image" value={productEditAd3.image_url || null} onChange={(url) => setProductEditAd3({ ...productEditAd3, image_url: url })} folder="ads" previewAspectRatio={16/9} previewLabel="Preview" />
                          <input value={productEditAd3.heading || ''} onChange={(e) => setProductEditAd3({ ...productEditAd3, heading: e.target.value || null })} placeholder="Heading (optional)" className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
                          <textarea value={productEditAd3.description || ''} onChange={(e) => setProductEditAd3({ ...productEditAd3, description: e.target.value || null })} placeholder="Description (optional)" className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" rows={3} />
                          <input value={productEditAd3.link || ''} onChange={(e) => setProductEditAd3({ ...productEditAd3, link: e.target.value || null })} placeholder="Link (optional)" className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
                          <label className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Switch checked={productEditAd3.show_border ?? false} onCheckedChange={(checked) => setProductEditAd3({ ...productEditAd3, show_border: Boolean(checked) })} />
                            <span>Enable Border</span>
                          </label>
                          {productEditAd3.show_border && (
                            <div>
                              <label className="block text-sm font-medium mb-1.5">Border Color</label>
                              <div className="flex items-center gap-3">
                                <input
                                  type="color"
                                  value={productEditAd3.border_color || '#000000'}
                                  onChange={(e) => setProductEditAd3({ ...productEditAd3, border_color: e.target.value })}
                                  className="h-10 w-20 rounded cursor-pointer border-0"
                                />
                                <input
                                  type="text"
                                  value={productEditAd3.border_color || ''}
                                  onChange={(e) => setProductEditAd3({ ...productEditAd3, border_color: e.target.value || null })}
                                  placeholder="#000000"
                                  className="flex-1 px-3 py-2 rounded-lg border border-input bg-background"
                                />
                              </div>
                            </div>
                          )}
                          <button type="button" onClick={() => productSaveAd3(editingSub.id)} className="w-full rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground">Save</button>
                        </div>
                      </Modal>
                    )}
                    {productEditLogoStep && (
                      <Modal title={productEditLogoStep.id ? 'Edit Logo Step' : 'Add Logo Step'} onClose={() => setProductEditLogoStep(null)}>
                        <div className="space-y-3">
                          <ImageCropper label="Logo" value={productEditLogoStep.logo_url || null} onChange={(url) => setProductEditLogoStep({ ...productEditLogoStep, logo_url: url })} folder="logos" previewAspectRatio={1} previewLabel="Preview" />
                          <input value={productEditLogoStep.title || ''} onChange={(e) => setProductEditLogoStep({ ...productEditLogoStep, title: e.target.value })} placeholder="Title" className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
                          <textarea value={productEditLogoStep.description || ''} onChange={(e) => setProductEditLogoStep({ ...productEditLogoStep, description: e.target.value || null })} placeholder="Description (optional)" className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" rows={3} />
                          <input value={productEditLogoStep.link || ''} onChange={(e) => setProductEditLogoStep({ ...productEditLogoStep, link: e.target.value || null })} placeholder="Link (optional)" className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
                          <button type="button" onClick={() => productSaveLogoStep(editingSub.id)} className="w-full rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground">Save</button>
                        </div>
                      </Modal>
                    )}

                  </div>
                );
              })()}
                </>
              )}
            </div>
          )}

          {/* OFFERS */}
          {tab === 'offers' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Offers & Discounts</h2>
                <button
                  onClick={() => {
                    setAddSectionType('offers');
                    setShowAddSectionModal(true);
                  }}
                  className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold flex items-center gap-1.5 hover:bg-green-700"
                >
                  <Plus className="w-4 h-4" /> Add New Section
                </button>
              </div>

              {/* Section instances tabs */}
              {sections.filter(s => s.section_type === 'offers').length > 0 && (
                <div className="mb-6 hidden md:block">
                  <div className="flex gap-2 flex-wrap mb-4 overflow-x-auto pb-2">
                    {sections.filter(s => s.section_type === 'offers').map(section => (
                      <button
                        key={section.id}
                        onClick={() => setSelectedOffersSectionId(section.id)}
                        className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                          selectedOffersSectionId === section.id
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-card border border-border text-foreground hover:bg-muted'
                        }`}
                      >
                        {getSectionDisplayName(section)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
                <div className="flex flex-col gap-2">
                  <p className="text-xs md:text-sm text-muted-foreground">
                    {selectedOffersSectionId ? `Adding offers to: ${getSectionDisplayName(selectedOffersSection)}` : 'No section selected'}
                  </p>
                  {selectedOffersSection && (
                    <div className="flex flex-wrap gap-2">
                      <label className="flex items-center gap-2 text-sm">
                        <Switch
                          checked={selectedOffersSection.is_visible}
                          onCheckedChange={async (checked) => {
                            await toggleVisibility(selectedOffersSection.id, Boolean(checked));
                          }}
                        />
                        <span className="text-xs">{selectedOffersSection.is_visible ? 'ON' : 'OFF'}</span>
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <Switch
                          checked={offersFixedModeEnabled}
                          onCheckedChange={async (checked) => {
                            await toggleOffersFixedMode(selectedOffersSection.id, Boolean(checked));
                          }}
                        />
                        <span className="text-xs">Fixed Mode</span>
                        <span className="text-xs">{offersFixedModeEnabled ? 'ON' : 'OFF'}</span>
                      </label>
                    </div>
                  )}
                </div>
                {selectedOffersSectionId && (
                  <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                    <button
                      onClick={() => openHeadingEdit(selectedOffersSectionId)}
                      className="px-3 py-2 md:px-4 md:py-2 rounded-lg bg-blue-600 text-white text-xs md:text-sm font-semibold flex items-center justify-center gap-1.5 hover:bg-blue-700"
                    >
                      <Pencil className="w-4 h-4" />
                      <span className="hidden md:inline">Edit Heading</span>
                      <span className="md:hidden">Edit</span>
                    </button>
                    <button
                      onClick={() => handleDeleteSection(selectedOffersSectionId)}
                      className="px-3 py-2 md:px-4 md:py-2 rounded-lg bg-destructive text-destructive-foreground text-xs md:text-sm font-semibold flex items-center justify-center gap-1.5"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="hidden md:inline">Delete Section</span>
                      <span className="md:hidden">Delete</span>
                    </button>
                    <button
                      onClick={() => setEditOffer({ heading: '', description: '', image_url: null, link: null, show_border: false, border_color: null })}
                      className="px-3 py-2 md:px-4 md:py-2 rounded-lg bg-primary text-primary-foreground text-xs md:text-sm font-semibold flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span className="hidden md:inline">Add Offer</span>
                      <span className="md:hidden">Add</span>
                    </button>
                  </div>
                )}
              </div>

              {offersFixedModeEnabled ? (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleOfferDragEnd}>
                  <SortableContext items={selectedOffers.map((offer) => offer.id)} strategy={verticalListSortingStrategy}>
                    <div className="grid gap-3">
                      {selectedOffers.map((offer) => (
                        <SortableOfferItem key={offer.id} id={offer.id} disabled={!offersFixedModeEnabled}>
                          {offer.image_url && <img src={offer.image_url} alt="" className="w-20 h-14 rounded-lg object-cover" />}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm">{offer.heading}</h3>
                            {offer.description && <p className="text-xs text-muted-foreground truncate">{offer.description}</p>}
                          </div>
                          <button onClick={() => setEditOffer(offer)} className="p-2 text-muted-foreground hover:text-foreground"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => deleteOffer(offer.id)} className="p-2 text-destructive"><Trash2 className="w-4 h-4" /></button>
                        </SortableOfferItem>
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              ) : (
                <div className="grid gap-3">
                  {selectedOffers.map((offer) => (
                    <div key={offer.id} className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border">
                      {offer.image_url && <img src={offer.image_url} alt="" className="w-20 h-14 rounded-lg object-cover" />}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm">{offer.heading}</h3>
                        {offer.description && <p className="text-xs text-muted-foreground truncate">{offer.description}</p>}
                      </div>
                      <button onClick={() => setEditOffer(offer)} className="p-2 text-muted-foreground hover:text-foreground"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => deleteOffer(offer.id)} className="p-2 text-destructive"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              )}
              {editOffer && (
                <Modal title={editOffer.id ? 'Edit Offer' : 'Add Offer'} onClose={() => setEditOffer(null)}>
                  <div className="space-y-4">
                    <ImageCropper label="Offer Image" value={editOffer.image_url || null} onChange={(url) => setEditOffer({ ...editOffer, image_url: url })} folder="offers" previewAspectRatio={16/9} previewLabel="Homepage Preview" />
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Heading</label>
                      <input value={editOffer.heading || ''} onChange={(e) => setEditOffer({ ...editOffer, heading: e.target.value })} className="w-full px-4 py-2.5 rounded-lg border border-input bg-background" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Description</label>
                      <textarea value={editOffer.description || ''} onChange={(e) => setEditOffer({ ...editOffer, description: e.target.value })} className="w-full px-4 py-2.5 rounded-lg border border-input bg-background" rows={3} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Link (optional)</label>
                      <input value={editOffer.link || ''} onChange={(e) => setEditOffer({ ...editOffer, link: e.target.value || null })} className="w-full px-4 py-2.5 rounded-lg border border-input bg-background" />
                    </div>
                    <label className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Switch checked={editOffer.show_border ?? false} onCheckedChange={(checked) => setEditOffer({ ...editOffer, show_border: Boolean(checked) })} />
                      <span>Enable Border</span>
                    </label>
                    {editOffer.show_border && (
                      <div>
                        <label className="block text-sm font-medium mb-1.5">Border Color</label>
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            value={editOffer.border_color || '#000000'}
                            onChange={(e) => setEditOffer({ ...editOffer, border_color: e.target.value })}
                            className="h-10 w-20 rounded cursor-pointer border-0"
                          />
                          <input
                            type="text"
                            value={editOffer.border_color || ''}
                            onChange={(e) => setEditOffer({ ...editOffer, border_color: e.target.value || null })}
                            placeholder="#000000"
                            className="flex-1 px-4 py-2.5 rounded-lg border border-input bg-background"
                          />
                        </div>
                      </div>
                    )}
                    <button onClick={saveOffer} className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold">Save</button>
                  </div>
                </Modal>
              )}
            </div>
          )}

          {/* 2-COL ADS */}
          {tab === 'ads_2col' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">2-Column Ads</h2>
                <button
                  onClick={() => {
                    setAddSectionType('ads_2col');
                    setShowAddSectionModal(true);
                  }}
                  className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold flex items-center gap-1.5 hover:bg-green-700"
                >
                  <Plus className="w-4 h-4" /> Add New Section
                </button>
              </div>

              {sections.filter(s => s.section_type === 'ads_2col').length > 0 && (
                <div className="mb-6 hidden md:block">
                  <div className="flex gap-2 flex-wrap mb-4 overflow-x-auto pb-2">
                    {sections.filter(s => s.section_type === 'ads_2col').map(section => (
                      <button
                        key={section.id}
                        onClick={() => setSelectedAds2SectionId(section.id)}
                        className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                          selectedAds2SectionId === section.id
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-card border border-border text-foreground hover:bg-muted'
                        }`}
                      >
                        {getSectionDisplayName(section)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-4 mb-4">
                <p className="text-xs md:text-sm text-muted-foreground">
                  {selectedAds2SectionId ? `Section: ${getSectionDisplayName(sections.find(s => s.id === selectedAds2SectionId))}` : 'No section selected'}
                </p>
                {selectedAds2SectionId && (
                  <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                    <label className="flex items-center gap-2 text-sm self-center md:self-auto">
                      <Switch
                        checked={ads2FixedModeEnabled}
                        onCheckedChange={async (checked) => {
                          await toggleAds2FixedMode(selectedAds2SectionId, Boolean(checked));
                        }}
                      />
                      <span className="text-xs">Fixed Mode</span>
                      <span className="text-xs">{ads2FixedModeEnabled ? 'ON' : 'OFF'}</span>
                    </label>
                    <button
                      onClick={() => openHeadingEdit(selectedAds2SectionId)}
                      className="px-3 py-2 md:px-4 md:py-2 rounded-lg bg-blue-600 text-white text-xs md:text-sm font-semibold flex items-center justify-center gap-1.5 hover:bg-blue-700"
                    >
                      <Pencil className="w-4 h-4" />
                      <span className="hidden md:inline">Edit Heading</span>
                      <span className="md:hidden">Edit</span>
                    </button>
                    <button
                      onClick={() => handleDeleteSection(selectedAds2SectionId)}
                      className="px-3 py-2 md:px-4 md:py-2 rounded-lg bg-destructive text-destructive-foreground text-xs md:text-sm font-semibold flex items-center justify-center gap-1.5"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="hidden md:inline">Delete Section</span>
                      <span className="md:hidden">Delete</span>
                    </button>
                    <button onClick={() => setEditAd2({ image_url: null, link: null, show_border: false, border_color: null })} className="px-3 py-2 md:px-4 md:py-2 rounded-lg bg-primary text-primary-foreground text-xs md:text-sm font-semibold flex items-center justify-center gap-1.5">
                      <Plus className="w-4 h-4" />
                      <span className="hidden md:inline">Add Item</span>
                      <span className="md:hidden">Add</span>
                    </button>
                  </div>
                )}
              </div>

              {ads2FixedModeEnabled ? (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleAds2DragEnd}>
                  <SortableContext items={selectedAds2.map((ad) => ad.id)} strategy={verticalListSortingStrategy}>
                    <div className="grid gap-3">
                      {selectedAds2.map((ad) => (
                        <SortableOfferItem key={ad.id} id={ad.id} disabled={!ads2FixedModeEnabled}>
                          {ad.image_url && <img src={ad.image_url} alt="" className="w-20 h-14 rounded-lg object-cover" />}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm">Ad {selectedAds2.indexOf(ad) + 1}</h3>
                          </div>
                          <button onClick={() => setEditAd2(ad)} className="p-2 text-muted-foreground hover:text-foreground"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => deleteAd2(ad.id)} className="p-2 text-destructive"><Trash2 className="w-4 h-4" /></button>
                        </SortableOfferItem>
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {ads2
                    .filter(a => selectedAds2SectionId ? a.section_id === selectedAds2SectionId : true)
                    .map((ad) => (
                    <div key={ad.id} className="relative rounded-xl overflow-hidden border border-border aspect-[2/1] bg-muted group">
                      {ad.image_url && <img src={ad.image_url} alt="" className="w-full h-full object-cover" />}
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setEditAd2(ad)} className="w-8 h-8 rounded-full bg-card shadow flex items-center justify-center"><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={() => deleteAd2(ad.id)} className="w-8 h-8 rounded-full bg-destructive text-destructive-foreground shadow flex items-center justify-center"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {editAd2 && (
                <Modal title={editAd2.id ? 'Edit 2-Col Ad' : 'Add 2-Col Ad'} onClose={() => setEditAd2(null)}>
                  <div className="space-y-4">
                    <ImageCropper label="Ad Image" value={editAd2.image_url || null} onChange={(url) => setEditAd2({ ...editAd2, image_url: url })} folder="ads" previewAspectRatio={2/1} previewLabel="Desktop Preview (2:1)" />
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Link (optional)</label>
                      <input value={editAd2.link || ''} onChange={(e) => setEditAd2({ ...editAd2, link: e.target.value || null })} className="w-full px-4 py-2.5 rounded-lg border border-input bg-background" />
                    </div>
                    <label className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Switch checked={editAd2.show_border ?? false} onCheckedChange={(checked) => setEditAd2({ ...editAd2, show_border: Boolean(checked) })} />
                      <span>Enable Border</span>
                    </label>
                    {editAd2.show_border && (
                      <div>
                        <label className="block text-sm font-medium mb-1.5">Border Color</label>
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            value={editAd2.border_color || '#000000'}
                            onChange={(e) => setEditAd2({ ...editAd2, border_color: e.target.value })}
                            className="h-10 w-20 rounded cursor-pointer border-0"
                          />
                          <input
                            type="text"
                            value={editAd2.border_color || ''}
                            onChange={(e) => setEditAd2({ ...editAd2, border_color: e.target.value || null })}
                            placeholder="#000000"
                            className="flex-1 px-4 py-2.5 rounded-lg border border-input bg-background"
                          />
                        </div>
                      </div>
                    )}
                    <button onClick={saveAd2} className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold">Save</button>
                  </div>
                </Modal>
              )}
            </div>
          )}

          {/* 1-COL ADS */}
          {tab === 'ads_1col' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">1-Column Ad</h2>
                <button
                  onClick={() => {
                    setAddSectionType('ads_1col');
                    setShowAddSectionModal(true);
                  }}
                  className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold flex items-center gap-1.5 hover:bg-green-700"
                >
                  <Plus className="w-4 h-4" /> Add New Section
                </button>
              </div>

              {sections.filter(s => s.section_type === 'ads_1col').length > 0 && (
                <div className="mb-6 hidden md:block">
                  <div className="flex gap-2 flex-wrap mb-4 overflow-x-auto pb-2">
                    {sections.filter(s => s.section_type === 'ads_1col').map(section => (
                      <button
                        key={section.id}
                        onClick={() => setSelectedAds1SectionId(section.id)}
                        className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                          selectedAds1SectionId === section.id
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-card border border-border text-foreground hover:bg-muted'
                        }`}
                      >
                        {getSectionDisplayName(section)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-4 mb-4">
                <p className="text-xs md:text-sm text-muted-foreground">
                  {selectedAds1SectionId ? `Section: ${getSectionDisplayName(sections.find(s => s.id === selectedAds1SectionId))}` : 'No section selected'}
                </p>
                {selectedAds1SectionId && (
                  <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                    <label className="flex items-center gap-2 text-sm self-center md:self-auto">
                      <Switch
                        checked={ads1FixedModeEnabled}
                        onCheckedChange={async (checked) => {
                          await toggleAds2FixedMode(selectedAds1SectionId, Boolean(checked));
                        }}
                      />
                      <span className="text-xs">Fixed Mode</span>
                      <span className="text-xs">{ads1FixedModeEnabled ? 'ON' : 'OFF'}</span>
                    </label>
                    <button
                      onClick={() => openHeadingEdit(selectedAds1SectionId)}
                      className="px-3 py-2 md:px-4 md:py-2 rounded-lg bg-blue-600 text-white text-xs md:text-sm font-semibold flex items-center justify-center gap-1.5 hover:bg-blue-700"
                    >
                      <Pencil className="w-4 h-4" />
                      <span className="hidden md:inline">Edit Heading</span>
                      <span className="md:hidden">Edit</span>
                    </button>
                    <button
                      onClick={() => handleDeleteSection(selectedAds1SectionId)}
                      className="px-3 py-2 md:px-4 md:py-2 rounded-lg bg-destructive text-destructive-foreground text-xs md:text-sm font-semibold flex items-center justify-center gap-1.5"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="hidden md:inline">Delete Section</span>
                      <span className="md:hidden">Delete</span>
                    </button>
                    <button onClick={() => setEditAd1({ image_url: null, link: null, show_border: false, border_color: null })} className="px-3 py-2 md:px-4 md:py-2 rounded-lg bg-primary text-primary-foreground text-xs md:text-sm font-semibold flex items-center justify-center gap-1.5">
                      <Plus className="w-4 h-4" />
                      <span className="hidden md:inline">Add Item</span>
                      <span className="md:hidden">Add</span>
                    </button>
                  </div>
                )}
              </div>

              {ads1FixedModeEnabled ? (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleAds1DragEnd}>
                  <SortableContext items={selectedAds1.map((ad) => ad.id)} strategy={verticalListSortingStrategy}>
                    <div className="grid gap-3">
                      {selectedAds1.map((ad) => (
                        <SortableOfferItem key={ad.id} id={ad.id} disabled={!ads1FixedModeEnabled}>
                          {ad.image_url && <img src={ad.image_url} alt="" className="w-20 h-14 rounded-lg object-cover" />}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm">Ad {selectedAds1.indexOf(ad) + 1}</h3>
                          </div>
                          <button onClick={() => setEditAd1(ad)} className="p-2 text-muted-foreground hover:text-foreground"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => deleteAd2(ad.id)} className="p-2 text-destructive"><Trash2 className="w-4 h-4" /></button>
                        </SortableOfferItem>
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              ) : (
                <div className="grid gap-3">
                  {selectedAds1.map((ad) => (
                    <div key={ad.id} className="relative rounded-xl overflow-hidden border border-border aspect-[2/1] bg-muted group">
                      {ad.image_url && <img src={ad.image_url} alt="" className="w-full h-full object-cover" />}
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setEditAd1(ad)} className="w-8 h-8 rounded-full bg-card shadow flex items-center justify-center"><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={() => deleteAd2(ad.id)} className="w-8 h-8 rounded-full bg-destructive text-destructive-foreground shadow flex items-center justify-center"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {editAd1 && (
                <Modal title={editAd1.id ? 'Edit 1-Col Ad' : 'Add 1-Col Ad'} onClose={() => setEditAd1(null)}>
                  <div className="space-y-4">
                    <ImageCropper label="Ad Image" value={editAd1.image_url || null} onChange={(url) => setEditAd1({ ...editAd1, image_url: url })} folder="ads" previewAspectRatio={2/1} previewLabel="Desktop Preview (2:1)" />
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Link (optional)</label>
                      <input value={editAd1.link || ''} onChange={(e) => setEditAd1({ ...editAd1, link: e.target.value || null })} className="w-full px-4 py-2.5 rounded-lg border border-input bg-background" />
                    </div>
                    <label className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Switch checked={editAd1.show_border ?? false} onCheckedChange={(checked) => setEditAd1({ ...editAd1, show_border: Boolean(checked) })} />
                      <span>Enable Border</span>
                    </label>
                    {editAd1.show_border && (
                      <div>
                        <label className="block text-sm font-medium mb-1.5">Border Color</label>
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            value={editAd1.border_color || '#000000'}
                            onChange={(e) => setEditAd1({ ...editAd1, border_color: e.target.value })}
                            className="h-10 w-20 rounded cursor-pointer border-0"
                          />
                          <input
                            type="text"
                            value={editAd1.border_color || ''}
                            onChange={(e) => setEditAd1({ ...editAd1, border_color: e.target.value || null })}
                            placeholder="#000000"
                            className="flex-1 px-4 py-2.5 rounded-lg border border-input bg-background"
                          />
                        </div>
                      </div>
                    )}
                    <button onClick={saveAd1} className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold">Save</button>
                  </div>
                </Modal>
              )}
            </div>
          )}

          {/* 3-COL ADS */}
          {tab === 'ads_3col' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">3-Column Ads</h2>
                <button
                  onClick={() => {
                    setAddSectionType('ads_3col');
                    setShowAddSectionModal(true);
                  }}
                  className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold flex items-center gap-1.5 hover:bg-green-700"
                >
                  <Plus className="w-4 h-4" /> Add New Section
                </button>
              </div>

              {sections.filter(s => s.section_type === 'ads_3col').length > 0 && (
                <div className="mb-6 hidden md:block">
                  <div className="flex gap-2 flex-wrap mb-4 overflow-x-auto pb-2">
                    {sections.filter(s => s.section_type === 'ads_3col').map(section => (
                      <button
                        key={section.id}
                        onClick={() => setSelectedAds3SectionId(section.id)}
                        className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                          selectedAds3SectionId === section.id
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-card border border-border text-foreground hover:bg-muted'
                        }`}
                      >
                        {getSectionDisplayName(section)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-4 mb-4">
                <p className="text-xs md:text-sm text-muted-foreground">
                  {selectedAds3Section ? `Section: ${getSectionDisplayName(selectedAds3Section)}` : 'No section selected'}
                </p>
                {selectedAds3Section && (
                  <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                    <label className="flex items-center gap-2 text-sm self-center md:self-auto">
                      <Switch
                        checked={ads3FixedModeEnabled}
                        onCheckedChange={async (checked) => {
                          await toggleAds3FixedMode(selectedAds3Section.id, Boolean(checked));
                        }}
                      />
                      <span className="text-xs">Fixed Mode</span>
                      <span className="text-xs">{ads3FixedModeEnabled ? 'ON' : 'OFF'}</span>
                    </label>
                    <button
                      onClick={() => openHeadingEdit(selectedAds3Section.id)}
                      className="px-3 py-2 md:px-4 md:py-2 rounded-lg bg-blue-600 text-white text-xs md:text-sm font-semibold flex items-center justify-center gap-1.5 hover:bg-blue-700"
                    >
                      <Pencil className="w-4 h-4" />
                      <span className="hidden md:inline">Edit Heading</span>
                      <span className="md:hidden">Edit</span>
                    </button>
                    <button
                      onClick={() => handleDeleteSection(selectedAds3Section.id)}
                      className="px-3 py-2 md:px-4 md:py-2 rounded-lg bg-destructive text-destructive-foreground text-xs md:text-sm font-semibold flex items-center justify-center gap-1.5"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="hidden md:inline">Delete Section</span>
                      <span className="md:hidden">Delete</span>
                    </button>
                    <button onClick={() => setEditAd3({ image_url: null, heading: '', description: '', link: null, show_border: false, border_color: null })} className="px-3 py-2 md:px-4 md:py-2 rounded-lg bg-primary text-primary-foreground text-xs md:text-sm font-semibold flex items-center justify-center gap-1.5">
                      <Plus className="w-4 h-4" />
                      <span className="hidden md:inline">Add Item</span>
                      <span className="md:hidden">Add</span>
                    </button>
                  </div>
                )}
              </div>

              {ads3FixedModeEnabled ? (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleAds3DragEnd}>
                  <SortableContext items={selectedAds3.map((ad) => ad.id)} strategy={verticalListSortingStrategy}>
                    <div className="grid gap-3">
                      {selectedAds3.map((ad) => (
                        <SortableOfferItem key={ad.id} id={ad.id} disabled={!ads3FixedModeEnabled}>
                          {ad.image_url && <img src={ad.image_url} alt="" className="w-20 h-14 rounded-lg object-cover" />}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm">{ad.heading?.trim() || `Ad ${selectedAds3.indexOf(ad) + 1}`}</h3>
                            {ad.description && <p className="text-xs text-muted-foreground truncate">{ad.description}</p>}
                          </div>
                          <button onClick={() => setEditAd3(ad)} className="p-2 text-muted-foreground hover:text-foreground"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => deleteAd3(ad.id)} className="p-2 text-destructive"><Trash2 className="w-4 h-4" /></button>
                        </SortableOfferItem>
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {ads3
                    .filter(a => selectedAds3SectionId ? a.section_id === selectedAds3SectionId : true)
                    .map((ad) => (
                    <div key={ad.id} className="relative rounded-xl overflow-hidden border border-border aspect-[16/9] bg-muted group">
                      {ad.image_url && <img src={ad.image_url} alt="" className="w-full h-full object-cover" />}
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setEditAd3(ad)} className="w-8 h-8 rounded-full bg-card shadow flex items-center justify-center"><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={() => deleteAd3(ad.id)} className="w-8 h-8 rounded-full bg-destructive text-destructive-foreground shadow flex items-center justify-center"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {editAd3 && (
                <Modal title={editAd3.id ? 'Edit 3-Col Ad' : 'Add 3-Col Ad'} onClose={() => setEditAd3(null)}>
                  <div className="space-y-4">
                    <ImageCropper label="Ad Image" value={editAd3.image_url || null} onChange={(url) => setEditAd3({ ...editAd3, image_url: url })} folder="ads" previewAspectRatio={16/9} previewLabel="Desktop Preview (16:9)" />
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Heading (optional)</label>
                      <input value={editAd3.heading || ''} onChange={(e) => setEditAd3({ ...editAd3, heading: e.target.value || null })} className="w-full px-4 py-2.5 rounded-lg border border-input bg-background" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Description (optional)</label>
                      <textarea value={editAd3.description || ''} onChange={(e) => setEditAd3({ ...editAd3, description: e.target.value || null })} className="w-full px-4 py-2.5 rounded-lg border border-input bg-background" rows={3} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Link (optional)</label>
                      <input value={editAd3.link || ''} onChange={(e) => setEditAd3({ ...editAd3, link: e.target.value || null })} className="w-full px-4 py-2.5 rounded-lg border border-input bg-background" />
                    </div>
                    <label className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Switch checked={editAd3.show_border ?? false} onCheckedChange={(checked) => setEditAd3({ ...editAd3, show_border: Boolean(checked) })} />
                      <span>Enable Border</span>
                    </label>
                    {editAd3.show_border && (
                      <div>
                        <label className="block text-sm font-medium mb-1.5">Border Color</label>
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            value={editAd3.border_color || '#000000'}
                            onChange={(e) => setEditAd3({ ...editAd3, border_color: e.target.value })}
                            className="h-10 w-20 rounded cursor-pointer border-0"
                          />
                          <input
                            type="text"
                            value={editAd3.border_color || ''}
                            onChange={(e) => setEditAd3({ ...editAd3, border_color: e.target.value || null })}
                            placeholder="#000000"
                            className="flex-1 px-4 py-2.5 rounded-lg border border-input bg-background"
                          />
                        </div>
                      </div>
                    )}
                    <button onClick={saveAd3} className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold">Save</button>
                  </div>
                </Modal>
              )}
            </div>
          )}

          {/* DEMO LEADS */}
          {tab === 'leads' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Demo Requests</h2>
              </div>

              {leads.length === 0 ? (
                <div className="text-center py-12 bg-card rounded-xl border border-border">
                  <p className="text-muted-foreground">No demo requests yet.</p>
                </div>
              ) : (
                <div className="bg-card rounded-xl border border-border overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Date</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Name</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Phone</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Email</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Organization</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Subcategory</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Terms</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leads.map((lead) => (
                          <tr key={lead.id} className="border-t border-border">
                            <td className="px-4 py-3 text-sm">
                              {new Date(lead.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3 text-sm font-medium">{lead.name}</td>
                            <td className="px-4 py-3 text-sm">{lead.phone}</td>
                            <td className="px-4 py-3 text-sm">{lead.email}</td>
                            <td className="px-4 py-3 text-sm">{lead.organization}</td>
                            <td className="px-4 py-3 text-sm">
                              {lead.subcategory_id ? subcategoriesMap[lead.subcategory_id] || 'Unknown' : 'N/A'}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {lead.terms_accepted ? (
                                <span className="inline-flex items-center gap-1 text-green-600">
                                  <CheckCircle2 className="w-4 h-4" /> Accepted
                                </span>
                              ) : (
                                <span className="text-red-600">Not Accepted</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* CONTACT PAGE SETTINGS */}
          {tab === 'contact' && (
            <div className="max-w-4xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Contact Page Settings</h2>
                <button
                  onClick={saveContactSettings}
                  disabled={isSavingContact}
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold flex items-center gap-2 hover:bg-primary/90 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {isSavingContact ? 'Saving...' : 'Save Settings'}
                </button>
              </div>

              <div className="space-y-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Page Heading</label>
                      <input
                        value={contactSettings.heading}
                        onChange={(e) => setContactSettings({ ...contactSettings, heading: e.target.value })}
                        placeholder="e.g., Contact"
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Email Label</label>
                      <input
                        value={contactSettings.email_label}
                        onChange={(e) => setContactSettings({ ...contactSettings, email_label: e.target.value })}
                        placeholder="e.g., You can contact our Support Team by email:"
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Email Address</label>
                      <input
                        type="email"
                        value={contactSettings.email}
                        onChange={(e) => setContactSettings({ ...contactSettings, email: e.target.value })}
                        placeholder="e.g., office@freeprivacypolicy.com"
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <ImageUpload
                      label="Side Image"
                      value={contactSettings.image_url}
                      onChange={(url) => setContactSettings({ ...contactSettings, image_url: url })}
                      folder="site"
                    />
                  </div>
                </div>

                <div className="space-y-4 border-t pt-6">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Description Paragraph 1</label>
                    <textarea
                      value={contactSettings.description_1}
                      onChange={(e) => setContactSettings({ ...contactSettings, description_1: e.target.value })}
                      placeholder="Enter the first paragraph of description"
                      className="min-h-[100px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Description Paragraph 2</label>
                    <textarea
                      value={contactSettings.description_2}
                      onChange={(e) => setContactSettings({ ...contactSettings, description_2: e.target.value })}
                      placeholder="Enter the second paragraph of description"
                      className="min-h-[100px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ADD SECTION MODAL */}
          {showAddSectionModal && (
            <Modal
              title="Add New Section"
              onClose={() => {
                setShowAddSectionModal(false);
                setAddSectionType('');
                setAddSectionName('');
              }}
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Section Name</label>
                  <input
                    type="text"
                    value={addSectionName}
                    onChange={(e) => setAddSectionName(e.target.value)}
                    placeholder={`Enter a name for this section`}
                    className="w-full px-4 py-2.5 rounded-lg border border-input bg-background"
                  />
                </div>
                <button
                  onClick={handleAddSection}
                  disabled={addingSectionLoading}
                  className="w-full px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold disabled:opacity-50"
                >
                  {addingSectionLoading ? 'Creating...' : 'Create Section'}
                </button>
              </div>
            </Modal>
          )}

          {/* EDIT HEADING MODAL */}
          {editingHeadingSectionId && (
            <Modal
              title="Edit Section Heading"
              onClose={() => {
                setEditingHeadingSectionId(null);
                setEditingHeadingText('');
              }}
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Heading Text</label>
                  <input
                    type="text"
                    value={editingHeadingText}
                    onChange={(e) => setEditingHeadingText(e.target.value)}
                    placeholder="Enter heading text"
                    className="w-full px-4 py-2.5 rounded-lg border border-input bg-background"
                  />
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <input
                    type="checkbox"
                    checked={editingHeadingVisible}
                    onChange={(e) => setEditingHeadingVisible(e.target.checked)}
                    id="show-heading-toggle"
                    className="w-4 h-4 rounded"
                  />
                  <label htmlFor="show-heading-toggle" className="text-sm font-medium cursor-pointer">
                    Show heading on page
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Background Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={editingHeadingBackgroundColor || '#ffffff'}
                      onChange={(e) => setEditingHeadingBackgroundColor(e.target.value)}
                      className="h-10 w-16 rounded cursor-pointer border border-input"
                    />
                    <input
                      type="text"
                      value={editingHeadingBackgroundColor || ''}
                      onChange={(e) => setEditingHeadingBackgroundColor(e.target.value)}
                      placeholder="#ffffff or leave empty for default"
                      className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>
                </div>
                <button
                  onClick={handleSaveHeading}
                  className="w-full px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold"
                >
                  Save Heading
                </button>
              </div>
            </Modal>
          )}

        </div>
      </main>
    </div>
  );
}
