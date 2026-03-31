import { ArrowRight, Leaf } from '@phosphor-icons/react'

export default function Landing({ onSignIn, onGetStarted }) {
  return (
    <div className="min-h-dvh bg-cream flex flex-col overflow-x-hidden">

      {/* Nav */}
      <nav className="flex items-center justify-between px-6 pt-8 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-forest-700 rounded-lg flex items-center justify-center">
            <Leaf size={14} weight="fill" className="text-lime" />
          </div>
          <span className="font-display font-bold text-forest-700 text-base tracking-tight">EcoEats</span>
        </div>
        <button
          onClick={onSignIn}
          className="font-body text-sm font-medium text-forest-700 underline underline-offset-4"
        >
          Sign in
        </button>
      </nav>

      {/* Hero — editorial big text */}
      <div className="px-6 pt-10 pb-8">
        <p className="font-body text-xs font-medium text-gray-400 uppercase tracking-widest mb-4">
          Campus Food Network
        </p>
        <h1 className="font-display font-extrabold text-[3.25rem] leading-[1.0] tracking-tight text-forest-700">
          your campus feeds you.
        </h1>
        <p className="font-body text-base text-gray-500 mt-5 leading-relaxed max-w-xs">
          Departments, clubs, and events share their food with the campus community — find what's near you, always free.
        </p>

        {/* Primary CTA */}
        <button
          onClick={onGetStarted}
          className="mt-8 flex items-center gap-3 bg-forest-700 text-white px-6 py-4 rounded-full font-body font-semibold text-sm active:scale-95 transition-transform"
        >
          Get started
          <ArrowRight size={16} weight="bold" />
        </button>
      </div>

      {/* Divider */}
      <div className="mx-6 h-px bg-gray-200" />

      {/* Stats row */}
      <div className="flex items-center divide-x divide-gray-200 mx-6 py-6">
        {[
          { val: '100%', label: 'Free' },
          { val: '0', label: 'Waste' },
          { val: '∞', label: 'Impact' },
        ].map(({ val, label }) => (
          <div key={label} className="flex-1 text-center first:pl-0 last:pr-0 px-4">
            <p className="font-display font-extrabold text-2xl text-forest-700">{val}</p>
            <p className="font-body text-xs text-gray-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div className="mx-6 h-px bg-gray-200" />

      {/* Numbered philosophy sections */}
      <div className="px-6 pt-8 pb-4 flex flex-col gap-0">
        {[
          {
            num: '01',
            title: 'Share extra food',
            desc: 'Post food from your event in seconds. Set a pickup window and watch it go.',
          },
          {
            num: '02',
            title: 'Find it near you',
            desc: 'Browse the live feed or map. Claim what looks good before time runs out.',
          },
          {
            num: '03',
            title: 'Good for everyone',
            desc: 'Less waste, more full stomachs. Every meal shared is a small win for the planet.',
          },
        ].map(({ num, title, desc }, i, arr) => (
          <div key={num}>
            <div className="flex items-start gap-4 py-6">
              <span className="font-display font-bold text-xs text-gray-300 mt-1 w-6 shrink-0">{num}</span>
              <div>
                <p className="font-display font-bold text-lg text-forest-700 leading-snug">{title}</p>
                <p className="font-body text-sm text-gray-500 mt-1.5 leading-relaxed">{desc}</p>
              </div>
            </div>
            {i < arr.length - 1 && <div className="h-px bg-gray-100" />}
          </div>
        ))}
      </div>

      {/* Bottom CTA block */}
      <div className="mx-6 mt-4 mb-10 bg-forest-700 rounded-[20px] p-6 flex flex-col gap-4">
        <p className="font-display font-extrabold text-2xl text-white leading-tight">
          Ready to eat well?
        </p>
        <p className="font-body text-sm text-white/60 leading-relaxed">
          Join thousands of students and departments already on EcoEats.
        </p>
        <button
          onClick={onGetStarted}
          className="flex items-center justify-center gap-2 bg-lime text-forest-700 h-[52px] rounded-full font-body font-bold text-sm active:scale-95 transition-transform"
        >
          Create free account
          <ArrowRight size={16} weight="bold" />
        </button>
      </div>

    </div>
  )
}
