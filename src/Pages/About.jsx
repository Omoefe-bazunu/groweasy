import { Rocket, ShieldCheck, PieChart, Users, ArrowRight } from "lucide-react";

const About = () => {
  return (
    <section className="min-h-screen bg-white md:bg-gray-50/50 pt-10 pb-32 px-4 md:px-12 flex items-center justify-center">
      <div className="max-w-6xl mx-auto flex flex-col gap-12">
        {/* Header Section */}
        <div className="text-center md:mb-4">
          <h1 className="text-4xl md:text-6xl font-black text-[#5247bf] tracking-tight mb-4">
            About GrowEasy
          </h1>
          <p className="text-gray-500 text-lg md:text-xl max-w-2xl mx-auto">
            Empowering the next generation of Nigerian entrepreneurs with tools
            for sustainable growth.
          </p>
        </div>

        {/* Main Content: Split Layout on Desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          {/* Left Column: Mission Statement */}
          <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 border border-gray-100 flex flex-col justify-center">
            <div className="bg-indigo-50 w-16 h-16 rounded-2xl flex items-center justify-center mb-8">
              <Rocket className="w-8 h-8 text-[#5247bf]" />
            </div>
            <p className="text-gray-700 text-lg md:text-xl leading-relaxed mb-6">
              <strong className="text-[#5247bf] font-bold">GrowEasy</strong> is
              a digital business tool built by{" "}
              <span className="font-semibold">HIGH-ER ENTERPRISES</span>, a
              digital solutions startup based in Nigeria.
            </p>
            <p className="text-gray-600 text-lg leading-relaxed">
              We created this platform to help businesses of all sizes improve
              their performance and workflow by removing the complexities of
              administrative management.
            </p>
            <div className="mt-8 pt-8 border-t border-gray-50">
              <a
                href="https://www.higher.com.ng"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-[#5247bf] font-bold hover:gap-4 transition-all"
              >
                Visit HIGH-ER ENTERPRISES <ArrowRight className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Right Column: Feature Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-50">
              <ShieldCheck className="w-8 h-8 text-green-500 mb-4" />
              <h3 className="font-bold text-gray-800 mb-2">Documentation</h3>
              <p className="text-sm text-gray-500">
                Generate professional receipts, invoices, quotations, and
                payrolls instantly.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-50">
              <PieChart className="w-8 h-8 text-blue-500 mb-4" />
              <h3 className="font-bold text-gray-800 mb-2">Finance</h3>
              <p className="text-sm text-gray-500">
                Keep accurate records, track cash flow, and analyze performance
                over time.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-50">
              <Users className="w-8 h-8 text-purple-500 mb-4" />
              <h3 className="font-bold text-gray-800 mb-2">Visibility</h3>
              <p className="text-sm text-gray-500">
                Create a business profile or portfolio that you can share with
                the public.
              </p>
            </div>

            <div className="bg-[#5247bf] p-6 rounded-2xl shadow-md text-white">
              <h3 className="font-bold mb-2">Our Goal</h3>
              <p className="text-sm text-indigo-100 italic">
                "Helping you make profitable business decisions with data-driven
                tools."
              </p>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-100 text-center">
          <p className="text-gray-700 text-lg italic">
            We welcome your reviews and suggestions to make the platform even
            better. Feel free to{" "}
            <span className="font-bold text-[#5247bf]">
              get in touch anytime!
            </span>
          </p>
        </div>
      </div>
    </section>
  );
};

export default About;
