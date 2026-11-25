import { PageHeader } from "@/components/portal/page-header";
import { ActionBar } from "@/components/portal/action-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CATEGORIES, RATINGS } from "@/config/categories";

const HEADER = ["Probationary Officer", "Date", "Phase · Week", "Tour"];

export default function DailyPacket() {
  return (
    <>
      <PageHeader section="FTO" title="Daily Packet" />
      <Card className="mb-5 rounded-lg py-4 shadow-none">
        <CardContent className="grid grid-cols-2 gap-4 px-5 md:grid-cols-4">
          {HEADER.map((k) => (
            <div key={k}>
              <p className="shell-caps text-[11px] font-bold text-muted-foreground">{k}</p>
              <p className="mt-1 font-bold">—</p>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card className="rounded-lg py-0 shadow-none">
        <CardHeader className="border-b px-5 py-4">
          <CardTitle className="shell-caps text-[13px] font-extrabold text-navy">Performance Categories</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="shell-caps w-12 px-5 text-[11px] font-bold text-muted-foreground">#</TableHead>
                <TableHead className="shell-caps text-[11px] font-bold text-muted-foreground">Category</TableHead>
                {RATINGS.map((r) => (
                  <TableHead key={r} className="shell-caps w-14 text-center text-[11px] font-bold text-muted-foreground">{r}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {CATEGORIES.map((c) => (
                <TableRow key={c.n}>
                  <TableCell className="px-5 tabular-nums text-muted-foreground">{c.n}</TableCell>
                  <TableCell className="whitespace-nowrap">{c.name}</TableCell>
                  {RATINGS.map((r) => {
                    const unavailable = r === "RT" && !c.rtAllowed;
                    return (
                      <TableCell key={r} className="text-center">
                        <input
                          type="radio"
                          name={`cat-${c.n}`}
                          value={r}
                          disabled={unavailable}
                          aria-label={`${c.name}: ${r}`}
                          className="size-4 accent-navy disabled:opacity-30"
                        />
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <ActionBar>
        <Button variant="outline" className="shell-caps h-10 px-5 font-bold">Save Local Draft</Button>
        <Button className="shell-caps h-10 px-5 font-bold" disabled>Finalize and Submit to Coordinator</Button>
      </ActionBar>
    </>
  );
}
