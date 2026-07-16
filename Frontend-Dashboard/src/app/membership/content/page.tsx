import { redirect } from "next/navigation";

/**
 * Keep membership inside the main dashboard shell so sidebar/header match
 * every other module in the project.
 */
export default function MembershipContentPage() {
  redirect("/dashboard/resources");
}
