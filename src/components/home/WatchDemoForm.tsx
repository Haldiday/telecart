import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Play } from 'lucide-react';

interface WatchDemoFormProps {
  subcategoryId?: string;
  demoLink?: string | null;
  demoFormHeading?: string | null;
  demoButtonLabel?: string | null;
  buttonBgColor?: string | null;
  buttonTextColor?: string | null;
}

export default function WatchDemoForm({ 
  subcategoryId, 
  demoLink, 
  demoFormHeading, 
  demoButtonLabel,
  buttonBgColor,
  buttonTextColor
}: WatchDemoFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    organization: '',
    termsAccepted: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string) => {
    // Basic phone validation - allows numbers, spaces, +, -, (, )
    const phoneRegex = /^[\d\s\+\-\(\)]+$/;
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      toast.error('Name is required');
      return;
    }
    if (!formData.phone.trim()) {
      toast.error('Phone number is required');
      return;
    }
    if (!validatePhone(formData.phone)) {
      toast.error('Please enter a valid phone number');
      return;
    }
    if (!formData.email.trim()) {
      toast.error('Email is required');
      return;
    }
    if (!validateEmail(formData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }
    if (!formData.organization.trim()) {
      toast.error('Organization is required');
      return;
    }
    if (!formData.termsAccepted) {
      toast.error('Please accept the Terms and Privacy Policy');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('leads' as any).insert({
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        organization: formData.organization.trim(),
        terms_accepted: formData.termsAccepted,
        subcategory_id: subcategoryId || null,
      });

      if (error) throw error;

      toast.success('Thank you! Your demo request has been submitted.');

      // Redirect to demo link if provided
      if (demoLink && demoLink.trim()) {
        const normalizedUrl = demoLink.trim().startsWith('http') 
          ? demoLink.trim() 
          : `https://${demoLink.trim()}`;
        window.open(normalizedUrl, '_blank', 'noopener,noreferrer');
      }

      // Reset form
      setFormData({
        name: '',
        phone: '',
        email: '',
        organization: '',
        termsAccepted: false,
      });
    } catch (error) {
      console.error('Error submitting demo request:', error);
      toast.error('Failed to submit demo request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full lg:w-[400px] rounded-none p-[33px_40px_40px] bg-[#f4f2f0] shadow-sm">
      <div className="mb-3">
        <h3 className="text-lg font-semibold text-foreground text-center">{demoFormHeading || 'See The Software In Action\nWatch Free Demo!'}</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-1">
          
          <Input
            id="name"
            type="text"
            placeholder="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            disabled={isSubmitting}
            className="h-11"
          />
        </div>

        <div className="space-y-1">
          
          <Input
            id="phone"
            type="tel"
            placeholder="Phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            required
            disabled={isSubmitting}
            className="h-11"
          />
        </div>

        <div className="space-y-1">
          
          <Input
            id="email"
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            disabled={isSubmitting}
            className="h-11"
          />
        </div>

        <div className="space-y-1">
          
          <Input
            id="organization"
            type="text"
            placeholder="Organization"
            value={formData.organization}
            onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
            required
            disabled={isSubmitting}
            className="h-11"
          />
        </div>

        <div className="flex items-start space-x-2 pt-1">
          <Checkbox
            id="terms"
            checked={formData.termsAccepted}
            onCheckedChange={(checked) => 
              setFormData({ ...formData, termsAccepted: checked as boolean })
            }
            disabled={isSubmitting}
          />
          <Label
            htmlFor="terms"
            className="text-sm font-normal leading-5 text-muted-foreground cursor-pointer"
          >
            I accept the{' '}
            <a href="/terms" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
              Terms
            </a>
            {' '}and{' '}
            <a href="/privacy" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
              Privacy Policy
            </a>
          </Label>
        </div>

        <Button
          type="submit"
          className="w-full h-11 transition-colors"
          style={{ 
            backgroundColor: buttonBgColor || '#16a34a',
            color: buttonTextColor || '#ffffff'
          }}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Submitting...' : (demoButtonLabel || 'Get Free Advice')}
        </Button>
      </form>
    </div>
  );
}
