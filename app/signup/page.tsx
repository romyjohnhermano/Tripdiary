import Link from "next/link";
import AuthShell from "@/components/AuthShell";
import { signup } from "../actions";
import { COURSES, GENDERS } from "@/lib/moderation";

export default function SignupPage() {
  const today = new Date().toISOString().slice(0, 10);
  return (
    <AuthShell title="Create your account" sub="It takes a minute. Only your username, picture and course are shown to others.">
      <form action={signup} className="auth-form">
        <div className="field-row">
          <div className="field"><label htmlFor="un">Username</label><input id="un" name="username" type="text" required maxLength={50} /></div>
          <div className="field"><label htmlFor="em">Email</label><input id="em" name="email" type="email" required maxLength={150} /></div>
        </div>
        <div className="field">
          <label htmlFor="ps">Password</label>
          <input id="ps" name="password" type="password" required minLength={4} maxLength={200} />
        </div>
        <div className="field-row">
          <div className="field"><label htmlFor="age">Age</label><input id="age" name="age" type="number" required min={10} max={100} /></div>
          <div className="field"><label htmlFor="bd">Birth date</label><input id="bd" name="birthdate" type="date" required min="1900-01-01" max={today} /></div>
        </div>
        <div className="field">
          <span className="label">Gender</span>
          <div className="choices">
            {GENDERS.map((g, i) => (
              <label key={g} className="choice">
                <input type="radio" name="gender" value={g} required={i === 0} />
                <span>{g}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="field">
          <span className="label">Course</span>
          <div className="choices">
            {COURSES.map((c) => (
              <label key={c} className="choice">
                <input type="checkbox" name="course" value={c} />
                <span>{c}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="field">
          <label htmlFor="pic">Profile picture <span className="optional">optional · JPG, PNG or GIF · max 3 MB</span></label>
          <input id="pic" name="profile_pic" type="file" accept="image/jpeg,image/png,image/gif" />
        </div>
        <div className="signup-actions">
          <button type="reset" className="button ghost block">Reset</button>
          <button className="button block">Create account</button>
        </div>
      </form>
      <p className="auth-switch">Or <Link href="/feed"><b>view only</b></Link> — look around without an account.</p>
      <p className="auth-switch">Already have an account? <Link href="/login"><b>Log in</b></Link></p>
    </AuthShell>
  );
}
