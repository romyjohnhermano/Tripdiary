import Link from "next/link";
import AuthShell from "@/components/AuthShell";
import { signup } from "../actions";
import { COURSES, GENDERS } from "@/lib/moderation";

export default function SignupPage() {
  const today = new Date().toISOString().slice(0, 10);
  return (
    <AuthShell title="Create your account" sub="It takes a minute. Only your username, picture and course are shown to others.">
      <form action={signup}>
        <div className="field-row">
          <div><label htmlFor="un">Username</label><input id="un" name="username" required maxLength={50} /></div>
          <div><label htmlFor="em">Email</label><input id="em" name="email" type="email" required maxLength={150} /></div>
        </div>
        <label htmlFor="ps">Password</label><input id="ps" name="password" type="password" required minLength={4} maxLength={200} />
        <div className="field-row">
          <div><label htmlFor="age">Age</label><input id="age" name="age" type="number" required min={10} max={100} /></div>
          <div><label htmlFor="bd">Birth date</label><input id="bd" name="birthdate" type="date" required min="1900-01-01" max={today} /></div>
        </div>
        <label>Gender</label>
        <div className="choices">{GENDERS.map((g, i) => <label key={g}><input type="radio" name="gender" value={g} required={i === 0} /> {g}</label>)}</div>
        <label>Course</label>
        <div className="choices">{COURSES.map((c) => <label key={c}><input type="checkbox" name="course" value={c} /> {c}</label>)}</div>
        <label htmlFor="pic">Profile picture <span className="muted small">optional · JPG, PNG or GIF · max 3 MB</span></label>
        <input id="pic" name="profile_pic" type="file" accept="image/jpeg,image/png,image/gif" />
        <button className="button block">Create account</button>
      </form>
      <p className="small">Already have an account? <Link href="/login"><b>Log in</b></Link></p>
    </AuthShell>
  );
}
