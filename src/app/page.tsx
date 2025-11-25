// src/app/page.tsx
import { redirect } from "next/navigation";

export default function Home() {
  // For now, always send people to login.
  redirect("/login");
}
