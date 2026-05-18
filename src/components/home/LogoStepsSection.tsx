import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import SubcategorySectionShell from './SubcategorySectionShell';

interface LogoStep {
  id: string;
  title: string;
  description: string | null;
  logo_url: string | null;
  sort_order: number;
}

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
    <SubcategorySectionShell compact={compact} backgroundColor={backgroundColor}>
    <div className={compact ? '' : 'py-10 md:py-14'}>
      <div className={compact ? '' : 'mx-auto max-w-[1580px] px-6 md:px-12'}>
        {showHeading && (
          <h2 className={headingClassName || `section-heading ${compact ? 'mt-0' : ''}`}>
            {heading}
          </h2>
        )}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className="flex items-start gap-4 rounded-xl border border-border bg-background p-4 md:p-5"
            >
              <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-[#fcf9f5] text-lg font-semibold text-primary md:h-16 md:w-16">
                {step.logo_url ? (
                  <img src={step.logo_url} alt={step.title} className="h-10 w-10 object-contain md:h-12 md:w-12" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="mb-1 text-base font-semibold text-foreground md:text-lg">{step.title}</h3>
                {step.description?.trim() && (
                  <p className="text-sm leading-relaxed text-muted-foreground md:text-base">{step.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
    </SubcategorySectionShell>
  );
}
