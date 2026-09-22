import Link from "next/link";
export default function Page() {
  return (
    <section className="container section">
      <div className="panel">
        <h1>Your local team starts here.</h1>
        <p>
          Access your employer workspace to post jobs and manage applications.
        </p>
        <Link
          className="button button-primary"
          style={{ marginTop: 24 }}
          href="/login?role=employer"
        >
          Continue to Employer Login
        </Link>
      </div>
    </section>
  );
}
