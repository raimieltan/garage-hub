import { redirect } from "next/navigation";

// The mobile nav "Post" button links here. Since post creation is handled
// via a dialog on the feed page, redirect users there.
export default function NewPostPage() {
  redirect("/feed");
}
