import { Leaf, HandHeart, MapPin, Lightning } from '@phosphor-icons/react'

export default function Landing({ onSignIn, onGetStarted }) {
  return (
    <div className="min-h-dvh bg-cream flex flex-col">
      {/* Hero */}
      <div className="flex flex-col items-center text-center px-6 pt-16 pb-10">
        <div className="w-20 h-20 bg-forest-700 rounded-3xl flex items-center justify-center shadow-card mb-5">
          <Leaf size={40} weight="fill" className="text-lime" />
        </div>
        <h1 className="font-display font-bold text-4xl text-forest-700 mb-2">EcoEats</h1>
        <p className="text-gray-500 font-body text-base mb-1">rescue food. feed people.</p>
        <p className="text-gray-400 font-body text-sm max-w-xs">
          Connect campus departments with excess food to students who need it — before it goes to waste.
        </p>
      </div>

      {/* Feature cards */}
      <div className="px-5 flex flex-col gap-3 mb-10">
        {[
          {
            icon: HandHeart,
            title: 'Hosts share surplus food',
            desc: 'Post leftovers from events, meetings, or catering in seconds.',
            color: 'bg-forest-100 text-forest-700',
          },
          {
            icon: MapPin,
            title: 'Students find it nearby',
            desc: 'Browse a live feed or map to claim food before it expires.',
            color: 'bg-lime/30 text-forest-700',
          },
          {
            icon: Lightning,
            title: 'Track your impact',
            desc: 'See how many meals rescued and CO₂ saved — together.',
            color: 'bg-amber-100 text-amber-700',
          },
        ].map(({ icon: Icon, title, desc, color }) => (
          <div key={title} className="bg-white rounded-card shadow-card p-4 flex items-start gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
              <Icon size={20} weight="fill" />
            </div>
            <div>
              <p className="font-display font-bold text-gray-900 text-sm">{title}</p>
              <p className="text-xs text-gray-500 font-body mt-0.5">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* CTAs */}
      <div className="px-5 flex flex-col gap-3 mt-auto pb-10">
        <button
          onClick={onGetStarted}
          className="w-full h-[52px] bg-forest-700 text-white rounded-card font-body font-semibold text-base shadow-card active:scale-[0.98] transition-transform"
        >
          Get Started — It's Free
        </button>
        <button
          onClick={onSignIn}
          className="w-full h-[52px] bg-white border border-gray-200 text-forest-700 rounded-card font-body font-semibold text-base shadow-card active:scale-[0.98] transition-transform"
        >
          Sign In
        </button>
      </div>
    </div>
  )
}
