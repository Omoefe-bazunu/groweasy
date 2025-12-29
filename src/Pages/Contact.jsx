import { useState } from "react";
import { MessageCircle, Mail, Globe, MapPin, Send, Phone } from "lucide-react";
import { db } from "../lib/firebase";
import { collection, addDoc } from "firebase/firestore";
import { toast } from "react-toastify"; // Consistent with your other pages

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await addDoc(collection(db, "contacts"), {
        name: formData.name,
        email: formData.email,
        message: formData.message,
        createdAt: new Date().toISOString(),
      });
      toast.success("Message sent! We'll get back to you soon.");
      setFormData({ name: "", email: "", message: "" });
    } catch (err) {
      toast.error("Failed to send message. Please try again.");
      console.error("Contact form error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsAppClick = () => {
    const phoneNumber = "+2349043970401";
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(
      "Hello, I would like to contact GrowEasy!"
    )}`;
    window.open(whatsappUrl, "_blank");
  };

  return (
    <div className="min-h-screen bg-gray-50/50 pb-32 pt-8 px-4 md:px-12">
      <div className="max-w-6xl mx-auto">
        {/* Header Banner - Matches Dashboard Style */}
        <div className="bg-[#5247bf] rounded-2xl p-8 mb-10 shadow-xl text-center">
          <h1 className="text-3xl md:text-5xl font-black text-white mb-2">
            Get In Touch
          </h1>
          <p className="text-indigo-100 opacity-80 max-w-lg mx-auto">
            Have questions about GrowEasy? We are here to help your business
            scale.
          </p>
        </div>

        {/* Main Content: Split Grid on Desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left Column: Contact Details (5/12 Columns) */}
          <div className="lg:col-span-5 space-y-6 order-2 lg:order-1">
            <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100">
              <h2 className="text-2xl font-black text-gray-900 mb-6">
                Contact Information
              </h2>

              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="bg-indigo-50 p-3 rounded-xl text-[#5247bf]">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                      Email Us
                    </p>
                    <p className="text-gray-700 font-medium">
                      support@higher.com.ng
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="bg-green-50 p-3 rounded-xl text-green-600">
                    <Phone className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                      Call / WhatsApp
                    </p>
                    <p className="text-gray-700 font-medium">+2349043970401</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="bg-blue-50 p-3 rounded-xl text-blue-600">
                    <Globe className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                      Website
                    </p>
                    <a
                      href="https://www.higher.com.ng"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#5247bf] font-medium hover:underline"
                    >
                      www.higher.com.ng
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="bg-orange-50 p-3 rounded-xl text-orange-600">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                      Headquarters
                    </p>
                    <p className="text-gray-700 font-medium">
                      Nigeria (Operating Remotely)
                    </p>
                  </div>
                </div>
              </div>

              {/* WhatsApp CTA Card */}
              <div className="mt-10 p-6 bg-green-50 rounded-2xl border border-green-100 text-center">
                <p className="text-green-800 font-bold mb-4">
                  Need a faster response?
                </p>
                <button
                  onClick={handleWhatsAppClick}
                  className="w-full flex items-center justify-center space-x-2 bg-green-500 text-white py-3 rounded-xl hover:bg-green-600 transition-all shadow-lg shadow-green-100"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span className="font-bold">Chat on WhatsApp</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Contact Form (7/12 Columns) */}
          <div className="lg:col-span-7 order-1 lg:order-2">
            <div className="bg-white p-8 md:p-12 rounded-3xl shadow-xl border border-gray-100">
              <h2 className="text-2xl font-black text-gray-900 mb-8">
                Send us a Message
              </h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full p-4 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-[#5247bf] text-gray-700 transition-all"
                      placeholder="John Doe"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full p-4 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-[#5247bf] text-gray-700 transition-all"
                      placeholder="john@example.com"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                    Your Message
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    className="w-full p-4 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-[#5247bf] text-gray-700 h-44 resize-none transition-all"
                    placeholder="How can we help you today?"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#5247bf] text-white py-4 rounded-2xl font-black text-lg hover:bg-[#4238a6] transition-all flex items-center justify-center gap-2 shadow-xl shadow-indigo-100 disabled:opacity-50"
                >
                  {loading ? (
                    "Sending..."
                  ) : (
                    <>
                      <Send className="w-5 h-5" /> Send Message
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
