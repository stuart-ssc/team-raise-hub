import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PaymentSetupPlaceholderProps {
  level: 'organization' | 'group';
  organizationId?: string;
  groupId?: string;
}

export const PaymentSetupPlaceholder = ({ 
  level, 
  organizationId, 
  groupId 
}: PaymentSetupPlaceholderProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Processor Setup</CardTitle>
      </CardHeader>
      <CardContent>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Payment processor integration is coming soon. This will allow you to:
            <ul className="list-disc ml-6 mt-2">
              <li>Connect your bank account</li>
              <li>Receive donations directly</li>
              <li>Issue tax receipts automatically</li>
            </ul>
            <p className="mt-4 text-sm text-muted-foreground">
              You can create draft campaigns now, but they cannot be published until 
              payment processing is configured.
            </p>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};
