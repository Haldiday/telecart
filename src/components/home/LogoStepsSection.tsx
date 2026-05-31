import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import SubcategorySectionShell from './SubcategorySectionShell';

interface LogoStep {
  id: string;
  title: string;
  description: string | null;
  logo_url: string | null;
  link: string | null;
  sort_order: number;
}

const normalizeExternalUrl = (url: string) => {
  const trimmedUrl = url.trim();
  if (!trimmedUrl) return null;
  return /^https?:\/\//i.test(trimmedUrl) ? trimmedUrl : `https://${trimmedUrl}`;
};

interface LogoStepsSectionProps {
  sectionId: string;
  sectionTable?: string;
  stepsTable?: string;
  compact?: boolean;
  backgroundColor?: string | null;
  headingClassName?: string;
}

export default function LogoStepsSection({
  sectionId,
  sectionTable = 'subcategory_page_sections',
  stepsTable = 'subcategory_logo_steps',
  compact = false,
  backgroundColor,
  headingClassName,
}: LogoStepsSectionProps) {
  const db = supabase as any;
  const [steps, setSteps] = useState<LogoStep[]>([]);
  const [heading, setHeading] = useState('How It Helps You');
  const [showHeading, setShowHeading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadSteps = () => {
      db.from(stepsTable)
        .select('*')
        .eq('section_id', sectionId)
        .order('sort_order')
        .then(({ data }: { data: LogoStep[] | null }) => {
          if (data && mounted) setSteps(data);
        });
    };

    const loadSection = async () => {
      const { data } = await db
        .from(sectionTable)
        .select('heading, show_heading')
        .eq('id', sectionId)
        .single();

      if (data && mounted) {
        setHeading(data.heading || 'How It Helps You');
        setShowHeading(data.show_heading !== false);
      }
    };

    loadSteps();
    loadSection();

    const stepsChannel = supabase
      .channel(`logo_steps_${sectionId}_live`)
      .on('postgres_changes', { event: '*', schema: 'public', table: stepsTable }, loadSteps)
      .subscribe();

    const sectionsChannel = supabase
      .channel(`page_sections_logo_steps_${sectionId}_live`)
      .on('postgres_changes', { event: '*', schema: 'public', table: sectionTable }, loadSection)
      .subscribe();

    return () => {
      mounted = false;
      stepsChannel.unsubscribe();
      sectionsChannel.unsubscribe();
    };
  }, [db, sectionId, sectionTable, stepsTable]);

  if (steps.length === 0) return null;

  return (
    <SubcategorySectionShell compact={compact} backgroundColor={backgroundColor} hasHeading={showHeading}>
    <div className={compact ? '' : 'py-6 md:py-8'}>
      <div className={compact ? '' : 'mx-auto max-w-[1580px] px-6 md:px-12'}>
        {showHeading && (
          <h2 className={headingClassName || `section-heading ${compact ? 'mt-0' : ''}`}>
            {heading}
          </h2>
        )}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {steps.map((step, index) => {
            const externalUrl = step.link ? normalizeExternalUrl(step.link) : null;
            const Component = externalUrl ? 'a' : 'div';
            
            return (
              <Component
                key={step.id}
                href={externalUrl || undefined}
                target={externalUrl ? '_blank' : undefined}
                rel={externalUrl ? 'noopener noreferrer' : undefined}
                className={`flex items-start gap-4 rounded-xl border border-border bg-background p-4 md:p-5 ${externalUrl ? 'cursor-pointer transition-all hover:border-primary/50 hover:shadow-md group' : ''}`}
              >
                {step.logo_url && (
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center md:h-14 md:w-14">
                    <img src={step.logo_url} alt={step.title} className="h-full w-full object-contain" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h3 className={`mb-1 text-base font-semibold text-foreground md:text-lg ${externalUrl ? 'group-hover:text-primary transition-colors' : ''}`}>{step.title}</h3>
                  {step.description?.trim() && (
                    <p className="text-sm leading-relaxed text-muted-foreground md:text-base">{step.description}</p>
                  )}
                </div>
              </Component>
            );
          })}
        </div>
      </div>
    </div>
    </SubcategorySectionShell>
  );
}
