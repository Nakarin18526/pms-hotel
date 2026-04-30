import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getSiteSettings } from "@/lib/site";
import BookClient from "./BookClient";

export const dynamic = "force-dynamic";

export default async function BookPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/book");
  }
  const site = await getSiteSettings();
  return (
    <BookClient
      hotelName={site.hotelName}
      brandTagline={site.brandTagline}
      cancellationPolicy={site.cancellationPolicy}
      vatPercent={Number(site.vatPercent ?? 0)}
      vatLabel={site.vatLabel ?? "VAT"}
    />
  );
}
