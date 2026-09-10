import { Link } from 'react-router-dom';
import { Zap, Target, Timer, Trophy, Shield, Users } from 'lucide-react';

const features = [
  {
    icon: Target,
    title: 'Goal Widgets',
    desc: 'Create animated donation goals with progress bars & embed them in OBS.',
  },
  {
    icon: Timer,
    title: 'Marathon Timer',
    desc: 'Run stream marathons with donation-powered time extensions.',
  },
  {
    icon: Trophy,
    title: 'Live Leaderboard',
    desc: 'Real-time supporter rankings with scrolling ticker overlays.',
  },
  {
    icon: Shield,
    title: 'Role-Based Access',
    desc: 'Invite moderators with granular permissions to manage your stream.',
  },
  {
    icon: Users,
    title: 'Workspace System',
    desc: 'Organize streams into workspaces. Own yours, mod for others.',
  },
  {
    icon: Zap,
    title: 'Real-Time Updates',
    desc: 'WebSocket-powered live updates for all widgets and dashboards.',
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-surface">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 glass">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-7 h-7 text-primary" />
            <span className="text-xl font-bold gradient-text">StreamOverlay</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className="px-4 py-2 text-sm text-text-muted hover:text-text transition-colors"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="px-5 py-2 text-sm font-medium bg-primary hover:bg-primary-dark rounded-lg transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full bg-surface-light border border-border text-sm text-text-muted">
            <Zap className="w-4 h-4 text-accent" />
            Built for streamers, by streamers
          </div>
          <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6">
            <span className="gradient-text">Stream Overlays</span>
            <br />
            <span className="text-text">Made Powerful</span>
          </h1>
          <p className="text-lg md:text-xl text-text-muted max-w-2xl mx-auto mb-10">
            Goal widgets, marathon timers, leaderboards, and moderator tools —
            all in one dashboard. Embed anywhere with a single link.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              to="/register"
              className="px-8 py-3.5 font-semibold bg-primary hover:bg-primary-dark rounded-xl transition-all hover:shadow-lg hover:shadow-primary/25 text-lg"
            >
              Start Free →
            </Link>
            <a
              href="#features"
              className="px-8 py-3.5 font-semibold border border-border hover:border-primary rounded-xl transition-colors text-text-muted hover:text-text text-lg"
            >
              Learn More
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Everything you need to <span className="gradient-text">level up</span>
          </h2>
          <p className="text-text-muted text-center mb-16 max-w-xl mx-auto">
            Powerful tools for streamers with a moderator-assisted workflow
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="group p-6 rounded-2xl bg-surface-light border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <f.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                <p className="text-text-muted text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-sm text-text-muted">
          <span>© 2026 StreamOverlay. Open source.</span>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            <span>UPI Stream Overlay</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
