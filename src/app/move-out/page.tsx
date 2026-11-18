import { redirect } from "next/navigation";

/** Old address. Move-out is an event tag, shown in Browse. */
export default function MoveOutPage() {
  redirect("/browse?event=senior-move-out");
}
