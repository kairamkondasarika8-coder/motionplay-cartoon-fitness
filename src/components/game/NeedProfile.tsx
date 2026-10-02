import { Link } from "@tanstack/react-router";

export function NeedProfile() {
  return (
    <div className="mx-auto max-w-md rounded-3xl border-4 border-foreground bg-card p-8 text-center shadow-pop">
      <div className="text-5xl">👤</div>
      <h2 className="mt-2 font-display text-2xl">Create your player profile first</h2>
      <p className="mt-1 text-muted-foreground">Pick your coach and tell us your age so we can tune the workout.</p>
      <Link to="/" className="mt-4 inline-block rounded-full bg-primary px-6 py-3 font-display text-primary-foreground">Set up profile</Link>
    </div>
  );
}
