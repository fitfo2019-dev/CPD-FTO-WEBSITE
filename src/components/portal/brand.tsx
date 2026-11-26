import Image from "next/image";
import { BadgeMark } from "./badge-mark";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      {!compact && (
        <div className="flex items-center gap-[18px]">
          <BadgeMark height={52} />
          <span aria-hidden="true" className="h-10 w-px bg-white/35" />
          <Image src="/patch.png" alt="Columbus Division of Police patch" width={44} height={52} className="h-[52px] w-auto" />
        </div>
      )}
      <div className="rounded-md bg-white px-3 py-2">
        <Image src="/wm.png" alt="The City of Columbus" width={170} height={48} priority className="h-auto w-[150px]" />
      </div>
      <p className="shell-caps text-[11px] leading-4 text-white/75">
        Division of Police
        <br />
        Field Training Office
      </p>
    </div>
  );
}
