import { redirect } from "next/navigation";

// Root page - middleware handles redirect based on auth status
// This is a fallback for any edge cases
export default function Home() {
  redirect("/login");
}
