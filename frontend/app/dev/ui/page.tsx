import HealthBadge from "@/components/catalog/HealthBadge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SectionLabel from "@/components/ui/section-label";
import SeverityBadge from "@/components/ui/SeverityBadge";
import Sparkline from "@/components/ui/sparkline";
import StatusBadge from "@/components/ui/StatusBadge";

export default function UiShowcasePage() {
  return (
    <div className="space-y-8 p-6">
      <h1 className="text-xl font-semibold">UI primitives</h1>

      <section className="space-y-3">
        <SectionLabel>Buttons</SectionLabel>
        <div className="flex flex-wrap gap-2">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
        </div>
      </section>

      <section className="space-y-3">
        <SectionLabel>Badges</SectionLabel>
        <div className="flex flex-wrap gap-2">
          <SeverityBadge severity="critical" />
          <SeverityBadge severity="high" />
          <StatusBadge status="monitoring" />
          <HealthBadge level="critical" />
        </div>
      </section>

      <section className="space-y-3">
        <SectionLabel>Card + Sparkline</SectionLabel>
        <Card className="max-w-sm">
          <CardHeader>
            <CardTitle>Return rate</CardTitle>
          </CardHeader>
          <CardContent>
            <Sparkline data={[0.12, 0.14, 0.17, 0.19, 0.225]} className="h-12" />
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3">
        <SectionLabel>Avatar</SectionLabel>
        <Avatar>
          <AvatarFallback>PF</AvatarFallback>
        </Avatar>
      </section>
    </div>
  );
}
