import { PageHeader } from "@/components/portal/page-header";
import { LimboPacket } from "@/components/limbo/limbo-packet";

export default function DailyPacket() {
  return (
    <>
      <PageHeader section="FTO" title="Daily Packet" photo="cruiser-dusk" />
      <LimboPacket />
    </>
  );
}
