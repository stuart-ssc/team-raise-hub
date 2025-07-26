import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useSchoolUser } from "@/hooks/useSchoolUser";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  name: z.string().min(1, "Campaign name is required"),
  description: z.string().optional(),
  goalAmount: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  groupId: z.string().min(1, "Group is required"),
  campaignTypeId: z.string().min(1, "Campaign type is required"),
});

interface AddCampaignFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCampaignAdded: () => void;
}

interface Group {
  id: string;
  group_name: string;
}

interface CampaignType {
  id: string;
  name: string;
}

export function AddCampaignForm({ open, onOpenChange, onCampaignAdded }: AddCampaignFormProps) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [campaignTypes, setCampaignTypes] = useState<CampaignType[]>([]);
  const [loading, setLoading] = useState(false);
  const { schoolUser } = useSchoolUser();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      goalAmount: "",
      startDate: "",
      endDate: "",
      groupId: "",
      campaignTypeId: "",
    },
  });

  const fetchGroups = async () => {
    if (!schoolUser) return;

    try {
      let query = supabase
        .from("groups")
        .select("id, group_name, school_id")
        .eq("status", true);

      // Filter groups based on user role
      if (schoolUser.user_type.name === 'Principal') {
        // Principal can see all groups in their school
        query = query.eq('school_id', schoolUser.school_id);
      } else if (schoolUser.user_type.name === 'Athletic Director') {
        // Athletic Director can see sports teams only
        query = query
          .eq('school_id', schoolUser.school_id)
          .in('group_type_id', [/* Add sports group type IDs here */]);
      } else {
        // Coach, Club Sponsor, Booster Leader can only create campaigns for their groups
        if (schoolUser.group_id) {
          query = query.eq('id', schoolUser.group_id);
        } else {
          setGroups([]);
          return;
        }
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching groups:", error);
        return;
      }

      setGroups(data || []);
    } catch (error) {
      console.error("Error fetching groups:", error);
    }
  };

  const fetchCampaignTypes = async () => {
    try {
      const { data, error } = await supabase
        .from("campaign_type")
        .select("id, name")
        .order("name");

      if (error) {
        console.error("Error fetching campaign types:", error);
        return;
      }

      setCampaignTypes(data || []);
    } catch (error) {
      console.error("Error fetching campaign types:", error);
    }
  };

  useEffect(() => {
    if (open) {
      fetchGroups();
      fetchCampaignTypes();
    }
  }, [open, schoolUser]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!schoolUser) return;

    setLoading(true);
    try {
      const campaignData = {
        name: values.name,
        description: values.description || null,
        goal_amount: values.goalAmount ? parseFloat(values.goalAmount) : null,
        start_date: values.startDate || null,
        end_date: values.endDate || null,
        group_id: values.groupId,
        campaign_type_id: values.campaignTypeId,
        status: true,
      };

      const { error } = await supabase
        .from("campaigns")
        .insert([campaignData]);

      if (error) {
        console.error("Error creating campaign:", error);
        toast({
          title: "Error",
          description: "Failed to create campaign. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Campaign created successfully!",
      });

      form.reset();
      onOpenChange(false);
      onCampaignAdded();
    } catch (error) {
      console.error("Error creating campaign:", error);
      toast({
        title: "Error",
        description: "Failed to create campaign. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add New Campaign</DialogTitle>
          <DialogDescription>
            Create a new fundraising campaign for your group.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Campaign Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter campaign name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter campaign description" 
                      className="resize-none"
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="groupId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Group *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select group" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {groups.map((group) => (
                          <SelectItem key={group.id} value={group.id}>
                            {group.group_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="campaignTypeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Campaign Type *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {campaignTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="goalAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Goal Amount</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01"
                      placeholder="0.00" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Campaign"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}