
import React, { useState } from "react";
import WorksheetForm, { FormData } from "@/components/WorksheetForm";
import TrackingFormWrapper from "@/components/WorksheetForm/TrackingFormWrapper";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";

interface FormViewProps {
  onSubmit: (data: FormData) => void;
  userId?: string;
  onStudentChange?: (studentId: string | null) => void;
  preSelectedStudent?: { id: string; name: string } | null;
  isRegisteredUser?: boolean;
  variant?: 'landing' | 'dashboard';
}

const FormView: React.FC<FormViewProps> = ({ 
  onSubmit, 
  userId, 
  onStudentChange, 
  preSelectedStudent,
  isRegisteredUser = false,
  variant = 'dashboard'
}) => {
  const isMobile = useIsMobile();
  const [couponCode, setCouponCode] = useState("");
  const [showCouponDialog, setShowCouponDialog] = useState(false);

  const handleSubscriptionWithCoupon = async (planType: string, monthlyLimit: number, price: number, planName: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('create-subscription', {
        body: {
          planType,
          monthlyLimit,
          price,
          planName,
          couponCode: couponCode.trim() || undefined
        }
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Subscription error:', error);
    }
  };

  if (variant === 'landing') {
    return (
      <TrackingFormWrapper userId={userId}>
        <div className={`max-w-5xl mx-auto ${isMobile ? 'px-2' : 'px-4'}`}>
          <p className="text-center text-sm text-muted-foreground mb-3">
            Describe your lesson — AI handles the rest
          </p>
          <div className="bg-background rounded-2xl shadow-xl shadow-muted/50 border border-border overflow-hidden p-1">
            <WorksheetForm 
              onSubmit={onSubmit} 
              onStudentChange={onStudentChange} 
              preSelectedStudent={preSelectedStudent}
            />
          </div>
          <p className="text-center text-xs text-muted-foreground mt-3">
            No signup needed. No credit card. Just try it.
          </p>
        </div>

        {/* Coupon dialog */}
        <Dialog open={showCouponDialog} onOpenChange={setShowCouponDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Coupon Code</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Enter coupon code (optional)"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
              />
              <div className="flex gap-2">
                <Button onClick={() => setShowCouponDialog(false)} variant="outline">
                  Cancel
                </Button>
                <Button onClick={() => setShowCouponDialog(false)}>
                  Apply & Continue
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </TrackingFormWrapper>
    );
  }

  // variant === 'dashboard'
  return (
    <TrackingFormWrapper userId={userId}>
      <div className="max-w-5xl mx-auto">
        <WorksheetForm 
          onSubmit={onSubmit} 
          onStudentChange={onStudentChange} 
          preSelectedStudent={preSelectedStudent}
        />
      </div>

      {/* Coupon dialog */}
      <Dialog open={showCouponDialog} onOpenChange={setShowCouponDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Coupon Code</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Enter coupon code (optional)"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
            />
            <div className="flex gap-2">
              <Button onClick={() => setShowCouponDialog(false)} variant="outline">
                Cancel
              </Button>
              <Button onClick={() => setShowCouponDialog(false)}>
                Apply & Continue
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </TrackingFormWrapper>
  );
};

export default FormView;
