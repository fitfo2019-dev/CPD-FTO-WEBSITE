import { PageHeader } from "@/components/portal/page-header";
import { DataPanel } from "@/components/portal/data-panel";
import { StatCard } from "@/components/portal/stat-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function PoProgress() {
  return (
    <>
      <PageHeader section="Coordinator" title="PO Progress" />
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-5">
        <StatCard label="Struggling" value={0} variant="err" />
        <StatCard label="Watch" value={0} variant="warn" />
        <StatCard label="On Track" value={0} variant="ok" />
        <StatCard label="Above Class UA %" value={0} />
        <StatCard label="Class UA %" value="0.0%" />
      </div>
      <Tabs defaultValue="cards">
        <TabsList>
          <TabsTrigger value="cards" className="shell-caps text-[12px] font-bold">Cards</TabsTrigger>
          <TabsTrigger value="board" className="shell-caps text-[12px] font-bold">Class Board</TabsTrigger>
        </TabsList>
        <TabsContent value="cards" className="mt-4">
          <DataPanel title="Probationary Officers" columns={["PO", "FTO", "Status", "UA % vs Class", "Trend"]} empty="No probationary officers in this class" />
        </TabsContent>
        <TabsContent value="board" className="mt-4">
          <DataPanel title="Class Board" columns={["PO", "Status", "Phase I", "Phase II", "Phase III", "Phase IV", "Trend"]} empty="No probationary officers in this class" />
        </TabsContent>
      </Tabs>
    </>
  );
}
