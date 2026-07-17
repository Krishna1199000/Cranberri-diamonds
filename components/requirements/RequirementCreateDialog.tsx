"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { defaultRequirementSpec } from "@/lib/requirements/types";
import type { RequirementSpec } from "@/lib/requirements/types";
import { RequirementEntryForm } from "./RequirementEntryForm";
import { AddNewLeadDialog, type LeadRecord } from "./AddNewLeadDialog";

interface Master {
  id: string;
  companyName: string;
  ownerName?: string;
  phoneNo?: string;
  email?: string;
  state?: string;
  country?: string;
}

interface RequirementCreateDialogProps {
  loggedByName: string;
  onCreated: () => void;
}

export function RequirementCreateDialog({ loggedByName, onCreated }: RequirementCreateDialogProps) {
  const [open, setOpen] = useState(false);
  const [leadOpen, setLeadOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [masters, setMasters] = useState<Master[]>([]);
  const [loadingMasters, setLoadingMasters] = useState(false);

  const [masterId, setMasterId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [personName, setPersonName] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [requirementDate, setRequirementDate] = useState(
    () => new Date().toISOString().split("T")[0]
  );
  const [notes, setNotes] = useState("");
  const [budget, setBudget] = useState("");
  // Support multiple specs
  const [specs, setSpecs] = useState<RequirementSpec[]>([defaultRequirementSpec()]);

  const fetchMasters = async () => {
    setLoadingMasters(true);
    try {
      const response = await fetch("/api/companies/search", { credentials: "include" });
      const data = await response.json();
      if (data.success && Array.isArray(data.companies)) {
        setMasters(
          data.companies.map(
            (c: {
              id: string;
              name: string;
              ownerName?: string;
              phoneNo?: string;
              email?: string;
              state?: string;
              country?: string;
            }) => ({
              id: c.id,
              companyName: c.name,
              ownerName: c.ownerName,
              phoneNo: c.phoneNo,
              email: c.email,
              state: c.state,
              country: c.country,
            })
          )
        );
      }
    } catch {
      toast.error("Failed to load company list");
    } finally {
      setLoadingMasters(false);
    }
  };

  useEffect(() => {
    if (open) fetchMasters();
  }, [open]);

  const applyMaster = (m: Master) => {
    setMasterId(m.id);
    setCustomerName(m.companyName);
    setPersonName(m.ownerName || "");
    setPhoneNumber(m.phoneNo || "");
    setEmail(m.email || "");
    setState(m.state || "");
    setCountry(m.country || "");
  };

  const applyLead = (lead: LeadRecord) => {
    setMasters((prev) => {
      if (prev.some((x) => x.id === lead.id)) return prev;
      return [
        ...prev,
        {
          id: lead.id,
          companyName: lead.companyName,
          ownerName: lead.ownerName,
          phoneNo: lead.phoneNo,
          email: lead.email,
          state: lead.state,
          country: lead.country,
        },
      ];
    });
    applyMaster({
      id: lead.id,
      companyName: lead.companyName,
      ownerName: lead.ownerName,
      phoneNo: lead.phoneNo,
      email: lead.email,
      state: lead.state,
      country: lead.country,
    });
  };

  const resetForm = () => {
    setMasterId("");
    setCustomerName("");
    setPersonName("");
    setState("");
    setCountry("");
    setPhoneNumber("");
    setEmail("");
    setRequirementDate(new Date().toISOString().split("T")[0]);
    setNotes("");
    setBudget("");
    setSpecs([defaultRequirementSpec()]);
  };

  const handleAddSpec = () => {
    setSpecs((prev) => [...prev, defaultRequirementSpec()]);
  };

  const handleRemoveSpec = (index: number) => {
    setSpecs((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSpecChange = (index: number, updatedSpec: RequirementSpec) => {
    setSpecs((prev) => prev.map((s, i) => (i === index ? updatedSpec : s)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !personName.trim() || !state.trim()) {
      toast.error("Company name, person name, and state are required");
      return;
    }
    for (let i = 0; i < specs.length; i++) {
      if (!specs[i].shape?.trim()) {
        toast.error(`Shape is required for specification #${i + 1}`);
        return;
      }
    }

    setCreating(true);
    try {
      const response = await fetch("/api/requirements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          masterId: masterId || null,
          customerName: customerName.trim(),
          personName: personName.trim(),
          state: state.trim(),
          country: country.trim(),
          phoneNumber,
          email,
          requirementDate,
          notes,
          budget: budget === "" ? null : Number(budget),
          specs,
        }),
      });
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || "Failed to create requirement");
      }
      toast.success("Requirement created successfully");
      resetForm();
      setOpen(false);
      onCreated();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create requirement");
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Requirement
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Requirement</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex flex-wrap gap-2 items-end">
              <div className="flex-1 min-w-[200px]">
                <Label>Company (master)</Label>
                <Select
                  value={masterId}
                  onValueChange={(id) => {
                    const m = masters.find((x) => x.id === id);
                    if (m) applyMaster(m);
                  }}
                  disabled={loadingMasters}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={loadingMasters ? "Loading…" : "Select company or add lead"}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {masters.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.companyName}
                        {m.ownerName ? ` — ${m.ownerName}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="button" variant="outline" onClick={() => setLeadOpen(true)}>
                Add New Lead
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Company name *</Label>
                <Input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label>Person name *</Label>
                <Input
                  value={personName}
                  onChange={(e) => setPersonName(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label>State *</Label>
                <Input value={state} onChange={(e) => setState(e.target.value)} required />
              </div>
              <div>
                <Label>Country</Label>
                <Input value={country} onChange={(e) => setCountry(e.target.value)} />
              </div>
              <div>
                <Label>Contact number</Label>
                <Input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div>
                <Label>Requirement date</Label>
                <Input
                  type="date"
                  value={requirementDate}
                  onChange={(e) => setRequirementDate(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label>Budget (optional)</Label>
                <Input
                  type="number"
                  min="0"
                  step="1"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="INR / USD"
                />
              </div>
            </div>

            <div>
              <Label>Logged by</Label>
              <Input value={loggedByName || "—"} readOnly className="bg-muted" />
            </div>

            {/* Multiple Specs */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm text-slate-700">
                  Diamond Specifications ({specs.length})
                </h3>
              </div>

              {specs.map((spec, index) => (
                <div key={index} className="relative">
                  {specs.length > 1 && (
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Specification #{index + 1}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-destructive hover:text-destructive"
                        onClick={() => handleRemoveSpec(index)}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Remove
                      </Button>
                    </div>
                  )}
                  <RequirementEntryForm
                    spec={spec}
                    onChange={(updated) => handleSpecChange(index, updated)}
                  />
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full border-dashed"
                onClick={handleAddSpec}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Another Specification
              </Button>
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Additional notes for this requirement"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={creating}>
                {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Submit requirement
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AddNewLeadDialog open={leadOpen} onOpenChange={setLeadOpen} onLeadCreated={applyLead} />
    </>
  );
}
