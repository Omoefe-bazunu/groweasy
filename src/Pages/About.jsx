const About = () => {
  return (
    <section className="min-h-screen bg-gradient-to-b from-purple-50 to-white pt-10 pb-30 px-6 flex items-center">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl p-10 md:p-14 border border-gray-100">
        <h1 className="text-4xl font-extrabold text-[#5247bf] mb-6 text-center tracking-tight">
          About GrowEasy
        </h1>

        <p className="text-gray-700 text-lg leading-relaxed text-justify mb-4">
          <strong className="text-[#5247bf] font-semibold">GrowEasy</strong> is
          a free digital business tool built by{" "}
          <span className="font-medium">HIGH-ER ENTERPRISES</span>, a digital
          solutions startup (
          <a
            href="https://www.higher.com.ng"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#5247bf] hover:underline font-medium"
          >
            www.higher.com.ng
          </a>
          ), created to help businesses of all sizes improve their performance
          and workflow.
        </p>

        <p className="text-gray-700 text-lg leading-relaxed text-justify mb-4">
          With GrowEasy, you can seamlessly generate essential business
          documents such as <span className="font-medium">receipts</span>,{" "}
          <span className="font-medium">invoices</span>, and{" "}
          <span className="font-medium">business profiles or portfolios</span>.
          It also helps you keep accurate financial records, enabling you to
          track your cash flow, analyze performance over time, and make
          profitable business decisions.
        </p>

        <p className="text-gray-700 text-lg leading-relaxed text-justify mt-6 italic">
          We welcome your reviews and suggestions to make the platform even
          better for you. Feel free to{" "}
          <span className="font-semibold">get in touch anytime!</span>
        </p>
      </div>
    </section>
  );
};

export default About;
