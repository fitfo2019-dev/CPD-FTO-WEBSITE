import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function DataPanel({ title, columns, empty, aside }: { title: string; columns: string[]; empty: string; aside?: React.ReactNode }) {
  return (
    <Card className="rounded-lg py-0 shadow-none">
      <CardHeader className="flex flex-row items-center justify-between border-b px-5 py-4">
        <CardTitle className="shell-caps text-[13px] font-extrabold text-navy">{title}</CardTitle>
        {aside}
      </CardHeader>
      <CardContent className="overflow-x-auto px-0">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((c) => (
                <TableHead key={c} className="shell-caps px-5 text-[11px] font-bold text-muted-foreground">
                  {c}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={columns.length} className="px-5 py-10 text-center text-sm text-muted-foreground">
                {empty}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
