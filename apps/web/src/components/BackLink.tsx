import Link from "next/link";

export default function BackLink({
  href = "/",
  label = "ย้อนกลับ",
  className = "",
}: {
  href?: string;
  label?: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={
        "inline-flex items-center text-sm text-slate-600 hover:text-brand " +
        className
      }
    >
      ← {label}
    </Link>
  );
}
