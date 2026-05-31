"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { showToast } from "@/components/ui/toast";
import { checkPlanLimit } from "@/lib/plan-limit";
import { ArrowLeft, Upload, FileText, Loader2, CheckCircle2 } from "lucide-react";
import Link from "next/link";

interface ParsedLead {
  full_name: string;
  email: string | null;
  phone: string | null;
  source: string;
}

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [parsedLeads, setParsedLeads] = useState<ParsedLead[]>([]);
  const [columnMapping, setColumnMapping] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [step, setStep] = useState<"upload" | "map" | "review" | "done">("upload");
  const [loading, setLoading] = useState(false);
  const [imported, setImported] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const supabase = createClient();

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split("\n").filter((l) => l.trim());
      if (lines.length < 2) {
        setErrors(["CSV file is empty or has no data rows"]);
        return;
      }

      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
      const rows = lines.slice(1).map((line) => {
        const values = line.split(",").map((v) => v.trim());
        const row: Record<string, string> = {};
        headers.forEach((h, i) => {
          row[h] = values[i] || "";
        });
        return row;
      });

      // Auto-detect columns
      const nameCol = headers.find((h) =>
        ["name", "full_name", "fullname", "contact", "lead"].includes(h)
      );
      const emailCol = headers.find((h) =>
        ["email", "email_address", "emailaddress"].includes(h)
      );
      const phoneCol = headers.find((h) =>
        ["phone", "phone_number", "phonenumber", "mobile", "cell"].includes(h)
      );

      setColumnMapping({
        name: nameCol || headers[0] || "",
        email: emailCol || "",
        phone: phoneCol || "",
      });

      setParsedLeads(
        rows.map((row) => ({
          full_name: nameCol ? row[nameCol] : "",
          email: emailCol ? row[emailCol] || null : null,
          phone: phoneCol ? row[phoneCol] || null : null,
          source: "csv_import",
        }))
      );

      setStep("map");
    };
    reader.readAsText(selectedFile);
  }

  async function handleImport() {
    setLoading(true);
    setErrors([]);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setErrors(["Not authenticated"]);
      setLoading(false);
      return;
    }

    // Check plan limit before importing
    const limit = await checkPlanLimit();
    if (!limit.allowed) {
      showToast(
        `Free plan limited to ${limit.maxAllowed} active leads. Upgrade to Pro for unlimited.`,
        "error",
        { label: "Upgrade to Pro", href: "/settings/billing" }
      );
      setLoading(false);
      return;
    }

    // Warn if import would exceed limit
    const remaining = limit.maxAllowed - limit.currentCount;
    if (parsedLeads.length > remaining) {
      showToast(
        `You can only import ${remaining} more leads on the Free plan. ${parsedLeads.length - remaining} leads will be skipped.`,
        "info",
        { label: "Upgrade to Pro", href: "/settings/billing" }
      );
    }

    let successCount = 0;
    const newErrors: string[] = [];

    for (const lead of parsedLeads) {
      if (!lead.full_name.trim()) {
        newErrors.push(`Skipping row: empty name`);
        continue;
      }

      // Stop importing if limit reached
      if (successCount >= remaining) {
        newErrors.push(`Skipped "${lead.full_name}": free plan limit reached`);
        continue;
      }

      const { error } = await supabase.from("leads").insert({
        user_id: user.id,
        full_name: lead.full_name,
        email: lead.email,
        phone: lead.phone,
        source: "csv_import",
        pipeline_stage: "new_lead",
      });

      if (error) {
        newErrors.push(`Failed to import ${lead.full_name}: ${error.message}`);
      } else {
        successCount++;
      }
    }

    setImported(successCount);
    setErrors(newErrors);
    setStep("done");
    setLoading(false);
  }

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <Link
          href="/leads"
          className="inline-flex items-center gap-1 text-sm text-surface-500 hover:text-surface-700 mb-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to leads
        </Link>
        <h1 className="font-heading text-2xl font-bold text-surface-900">Import Contacts</h1>
        <p className="text-surface-500 text-sm mt-1">
          Upload a CSV file from your phone or old CRM
        </p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2 mb-6">
        {["upload", "map", "review", "done"].map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === s
                  ? "bg-primary text-white"
                  : ["upload", "map", "review", "done"].indexOf(step) > i
                  ? "bg-primary-100 text-primary"
                  : "bg-surface-100 text-surface-400"
              }`}
            >
              {i + 1}
            </div>
            {i < 3 && <div className="w-8 h-0.5 bg-surface-200" />}
          </div>
        ))}
      </div>

      {/* Upload Step */}
      {step === "upload" && (
        <Card>
          <div
            className="border-2 border-dashed border-surface-200 rounded-lg p-8 text-center cursor-pointer hover:border-primary hover:bg-primary-50 transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="h-10 w-10 text-surface-400 mx-auto mb-3" />
            <p className="text-surface-700 font-medium mb-1">
              Click to upload CSV
            </p>
            <p className="text-sm text-surface-400">
              Or drag and drop your file here
            </p>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="hidden"
          />
        </Card>
      )}

      {/* Map Step */}
      {step === "map" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Map Columns
            </CardTitle>
          </CardHeader>
          <p className="text-sm text-surface-500 mb-4">
            Match your CSV columns to lead fields. Found {parsedLeads.length} rows.
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">
                Name column <span className="text-destructive">*</span>
              </label>
              <select
                value={columnMapping.name}
                onChange={(e) =>
                  setColumnMapping({ ...columnMapping, name: e.target.value })
                }
                className="input-field"
              >
                <option value="">Select column</option>
                {Object.keys(parsedLeads[0] || {}).map((col) => (
                  <option key={col} value={col}>
                    {col}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">
                Email column
              </label>
              <select
                value={columnMapping.email}
                onChange={(e) =>
                  setColumnMapping({ ...columnMapping, email: e.target.value })
                }
                className="input-field"
              >
                <option value="">None</option>
                {Object.keys(parsedLeads[0] || {}).map((col) => (
                  <option key={col} value={col}>
                    {col}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">
                Phone column
              </label>
              <select
                value={columnMapping.phone}
                onChange={(e) =>
                  setColumnMapping({ ...columnMapping, phone: e.target.value })
                }
                className="input-field"
              >
                <option value="">None</option>
                {Object.keys(parsedLeads[0] || {}).map((col) => (
                  <option key={col} value={col}>
                    {col}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Preview */}
          <div className="mt-6">
            <h3 className="text-sm font-medium text-surface-700 mb-2">Preview (first 3 rows)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-200">
                    <th className="text-left py-2 text-surface-500">Name</th>
                    <th className="text-left py-2 text-surface-500">Email</th>
                    <th className="text-left py-2 text-surface-500">Phone</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedLeads.slice(0, 3).map((lead, i) => (
                    <tr key={i} className="border-b border-surface-100">
                      <td className="py-2">{lead.full_name}</td>
                      <td className="py-2 text-surface-500">{lead.email || "-"}</td>
                      <td className="py-2 text-surface-500">{lead.phone || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button variant="secondary" onClick={() => setStep("upload")} className="flex-1">
              Back
            </Button>
            <Button
              onClick={handleImport}
              disabled={!columnMapping.name}
              loading={loading}
              className="flex-1"
            >
              Import {parsedLeads.length} leads
            </Button>
          </div>
        </Card>
      )}

      {/* Done Step */}
      {step === "done" && (
        <Card>
          <div className="text-center py-4">
            <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
            <h2 className="font-heading text-xl font-semibold text-surface-900 mb-1">
              Import Complete
            </h2>
            <p className="text-surface-500 mb-4">
              {imported} leads imported successfully
            </p>
            {errors.length > 0 && (
              <div className="text-left bg-destructive-50 rounded-lg p-3 mb-4">
                <p className="text-sm font-medium text-destructive mb-1">
                  {errors.length} errors:
                </p>
                {errors.slice(0, 5).map((err, i) => (
                  <p key={i} className="text-xs text-destructive-700">
                    {err}
                  </p>
                ))}
              </div>
            )}
            <Button onClick={() => router.push("/leads")} className="w-full">
              View all leads
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
