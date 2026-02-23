import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { DocumentUpload } from "@/components/DocumentUpload";

const nonprofitSchema = z.object({
  name: z.string()
    .trim()
    .min(1, "Organization name is required")
    .max(100, "Name must be less than 100 characters"),
  ein: z.string()
    .trim()
    .regex(/^\d{2}-?\d{7}$/, "EIN must be in format XX-XXXXXXX or XXXXXXXXX")
    .optional()
    .or(z.literal("")),
  city: z.string()
    .trim()
    .min(1, "City is required")
    .max(50, "City must be less than 50 characters"),
  state: z.string()
    .trim()
    .min(2, "State is required")
    .max(2, "State must be 2 characters"),
  zip: z.string()
    .trim()
    .regex(/^\d{5}(-\d{4})?$/, "ZIP code must be in format 12345 or 12345-6789")
    .min(5, "ZIP code is required"),
  phone: z.string()
    .trim()
    .regex(/^[\d\s\-\(\)]+$/, "Invalid phone number format")
    .min(10, "Phone number must be at least 10 digits")
    .max(20, "Phone number must be less than 20 characters")
    .optional()
    .or(z.literal("")),
  email: z.string()
    .trim()
    .email("Valid email is required")
    .max(100, "Email must be less than 100 characters"),
  mission_statement: z.string()
    .trim()
    .max(500, "Mission statement must be less than 500 characters")
    .optional()
    .or(z.literal("")),
  tax_deductible: z.boolean().default(false),
  user_role: z.string().min(1, "Please select your role"),
});

type NonProfitFormData = z.infer<typeof nonprofitSchema>;

interface NonProfitSetupFormProps {
  userId: string;
  onComplete: () => void;
  onBack: () => void;
}

export const NonProfitSetupForm = ({ userId, onComplete, onBack }: NonProfitSetupFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationDocUrl, setVerificationDocUrl] = useState<string>("");
  const { toast } = useToast();

  const form = useForm<NonProfitFormData>({
    resolver: zodResolver(nonprofitSchema),
    defaultValues: {
      name: "",
      ein: "",
      city: "",
      state: "",
      zip: "",
      phone: "",
      email: "",
      mission_statement: "",
      tax_deductible: false,
      user_role: "",
    },
  });

  const onSubmit = async (data: NonProfitFormData) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.rpc('register_nonprofit' as any, {
        p_name: data.name,
        p_city: data.city,
        p_state: data.state,
        p_zip: data.zip,
        p_phone: data.phone || null,
        p_email: data.email,
        p_ein: data.ein || null,
        p_mission_statement: data.mission_statement || null,
        p_tax_deductible: data.tax_deductible,
        p_user_role: data.user_role,
        p_verification_doc_url: verificationDocUrl || null,
      });

      if (error) throw error;

      toast({
        title: "Success!",
        description: data.tax_deductible 
          ? "Your organization has been created. Verification required before accepting donations."
          : "Your organization has been created successfully!",
      });

      onComplete();
    } catch (error: any) {
      console.error('Error creating non-profit:', error);
      const errorMessage = error?.message || error?.details || "An unexpected error occurred";
      toast({
        title: "Error",
        description: `Failed to create organization: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-foreground">Non-Profit Organization Details</h2>
            <p className="text-sm text-muted-foreground">Tell us about your organization</p>
          </div>

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Organization Name *</FormLabel>
                <FormControl>
                  <Input placeholder="Community Outreach Foundation" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="ein"
            render={({ field }) => (
              <FormItem>
                <FormLabel>EIN (Employer Identification Number)</FormLabel>
                <FormControl>
                  <Input placeholder="12-3456789" {...field} />
                </FormControl>
                <FormDescription>
                  Required if you want to issue tax-deductible receipts
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City *</FormLabel>
                  <FormControl>
                    <Input placeholder="San Francisco" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>State *</FormLabel>
                  <FormControl>
                    <Input placeholder="CA" maxLength={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="zip"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ZIP Code *</FormLabel>
                  <FormControl>
                    <Input placeholder="94102" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input placeholder="(555) 123-4567" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Organization Email *</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="info@organization.org" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="mission_statement"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mission Statement</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe your organization's mission and goals..."
                    rows={3}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="user_role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Your Role *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Executive Director">Executive Director</SelectItem>
                    <SelectItem value="Program Director">Program Director</SelectItem>
                    <SelectItem value="Board Member">Board Member</SelectItem>
                    <SelectItem value="Volunteer">Volunteer</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="tax_deductible"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    Will donations be tax-deductible?
                  </FormLabel>
                  <FormDescription>
                    Checking this will require verification before you can accept donations
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          {/* Verification Document Upload */}
          {form.watch("tax_deductible") && (
            <div className="space-y-2">
              <DocumentUpload
                userId={userId}
                onUploadComplete={(url) => {
                  setVerificationDocUrl(url);
                }}
                label="501(c)(3) Status Document *"
                description="Upload your IRS 501(c)(3) determination letter (PDF, max 10MB)"
              />
              {!verificationDocUrl && (
                <p className="text-sm text-destructive">
                  Required for tax-deductible donations
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            disabled={isSubmitting}
            className="flex-1"
          >
            Back
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || (form.watch("tax_deductible") && !verificationDocUrl)}
            className="flex-1"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Complete Setup"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};
