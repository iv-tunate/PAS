const pillars = [
  {
    label: "Eternal truths",
    body: "We focus on timeless biblical principles that build a lasting foundation for your life.",
  },
  {
    label: "A quiet mind",
    body: "We help you protect your time and attention from the endless pull of social media.",
  },
  {
    label: "Practical faith",
    body: "We turn deep teaching into simple, daily actions that shape your choices.",
  },
];

export default function Philosophy() {
  return (
    <section id="philosophy" className="max-w-6xl mx-auto px-6 py-24">
      <p className="text-sm tracking-wide text-accent mb-3">Our philosophy</p>
      <h2 className="font-display text-3xl md:text-4xl max-w-xl mb-16">
        Living what you learn
      </h2>

      <div className="grid md:grid-cols-3 gap-10">
        {pillars.map((p) => (
          <div key={p.label} className="border-t border-current/15 pt-6">
            <h3 className="font-display text-xl italic mb-3">{p.label}</h3>
            <p className="text-sm text-stone dark:text-stone-light leading-relaxed">
              {p.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
