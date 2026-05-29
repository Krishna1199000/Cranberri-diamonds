"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export interface LeadRecord {
  id: string;
  companyName: string;
  ownerName?: string;
  phoneNo?: string;
  email?: string;
  state?: string;
  country?: string;
  city?: string;
  addressLine1?: string;
  postalCode?: string;
}

interface AddNewLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLeadCreated: (lead: LeadRecord) => void;
}

export function AddNewLeadDialog({
  open,
  onOpenChange,
  onLeadCreated,
}: AddNewLeadDialogProps) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    companyName: "",
    personName: "",
    phoneNumber: "",
    email: "",
    state: "",
    country: "India",
    addressLine1: "",
    city: "",
    postalCode: "",
  });

  const reset = () => {
    setForm({
      companyName: "",
      personName: "",
      phoneNumber: "",
      email: "",
      state: "",
      country: "India",
      addressLine1: "",
      city: "",
      postalCode: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await fetch("/api/requirements/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to register lead");
      }
      toast.success("New lead registered and added to master list");
      onLeadCreated(data.lead);
      reset();
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to register lead");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Register New Lead</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="lead-company">Company Name *</Label>
            <Input
              id="lead-company"
              value={form.companyName}
              onChange={(e) => setForm((p) => ({ ...p, companyName: e.target.value }))}
              required
            />
          </div>
          <div>
            <Label htmlFor="lead-person">Person Name *</Label>
            <Input
              id="lead-person"
              value={form.personName}
              onChange={(e) => setForm((p) => ({ ...p, personName: e.target.value }))}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="lead-phone">Contact Number</Label>
              <Input
                id="lead-phone"
                type="tel"
                value={form.phoneNumber}
                onChange={(e) => setForm((p) => ({ ...p, phoneNumber: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="lead-email">Email</Label>
              <Input
                id="lead-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="lead-state">State *</Label>
              <Input
                id="lead-state"
                value={form.state}
                onChange={(e) => setForm((p) => ({ ...p, state: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="lead-country">Country</Label>
              <Input
                id="lead-country"
                value={form.country}
                onChange={(e) => setForm((p) => ({ ...p, country: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="lead-address">Address Line 1</Label>
            <Input
              id="lead-address"
              value={form.addressLine1}
              onChange={(e) => setForm((p) => ({ ...p, addressLine1: e.target.value }))}
              placeholder="Optional — defaults if blank"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="lead-city">City</Label>
              <Input
                id="lead-city"
                value={form.city}
                onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="lead-postal">Postal Code</Label>
              <Input
                id="lead-postal"
                value={form.postalCode}
                onChange={(e) => setForm((p) => ({ ...p, postalCode: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Lead
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
