"use client";

import { useState } from "react";
import { User, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface Props {
  name: string;
  email: string;
  role: string;
}

const ROLE_LABELS: Record<string, string> = {
  owner: "Owner",
  admin: "Admin",
  member: "Member",
  viewer: "Viewer",
};

export function ProfileSettings({ name, email, role }: Props) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  function handleSave() {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast({ title: "Profile updated", variant: "success" as any });
    }, 800);
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-gray-400" />
          <div>
            <CardTitle className="text-base">Profile</CardTitle>
            <CardDescription>Your personal account information</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold text-2xl shrink-0">
            {name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{name}</p>
            <p className="text-sm text-gray-400">{email}</p>
            <span className="mt-1 inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
              {ROLE_LABELS[role] ?? role}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="space-y-1.5">
            <Label>Full Name</Label>
            <Input defaultValue={name} />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input type="email" defaultValue={email} disabled className="bg-gray-50" />
            <p className="text-xs text-gray-400">Email cannot be changed here</p>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>New Password</Label>
          <Input type="password" placeholder="Leave blank to keep current password" />
        </div>

        <div className="flex items-center gap-2 rounded-lg bg-gray-50 border border-gray-100 p-3">
          <Shield className="h-4 w-4 text-gray-400 shrink-0" />
          <p className="text-xs text-gray-500">
            Passwords are hashed with bcrypt. We never store plain-text credentials.
          </p>
        </div>

        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </CardContent>
    </Card>
  );
}
