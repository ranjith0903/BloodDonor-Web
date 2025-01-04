import React from "react";
import { useUserStore } from "../store/useUserStore";


const HomePage = () => {
 
  const { user } = useUserStore();
  return !user ? (
    <div className="bg-gray-50 min-h-screen">
      {/* Hero Section */}
      <section className="bg-red-600 text-white py-16">
        <div className="container mx-auto px-6 flex flex-col lg:flex-row items-center">
          <div className="lg:w-1/2 text-center lg:text-left">
            <h1 className="text-5xl font-extrabold">
              Save Lives, Share <span className="text-yellow-300">Hope</span>
            </h1>
            <p className="mt-6 text-lg">
              Join the community of lifesavers. Every drop counts!
            </p>
            <div className="mt-8 flex flex-col lg:flex-row gap-4 justify-center lg:justify-start">
              <a
                href="/signup"
                className="bg-yellow-400 text-blue-600 font-semibold py-4 px-8 rounded-full shadow-lg hover:bg-yellow-300"
              >
                Donate Now
              </a>
              <a
                href="#learn-more"
                className="bg-white text-red-600 font-semibold py-4 px-8 rounded-full shadow-lg hover:bg-gray-200"
              >
                Learn More
              </a>
            </div>
          </div>
          <div className="lg:w-1/2">
            <img
              src="https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=800&q=80"
              alt="Blood Donation"
              className="rounded-xl shadow-2xl"
            />
          </div>
        </div>
      </section>

      {/* Why Donate Section */}
      <section className="py-16 bg-gray-100">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold text-red-600">Why Donate Blood?</h2>
          <p className="mt-4 text-lg text-gray-600">
            Your donation can save up to three lives. Be a hero today!
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <img
                src="https://res.cloudinary.com/dfj48q4my/image/upload/v1735147289/ehxbtpbshkyzb8udahu1.jpg"
                alt="Save Lives"
                className="mx-auto mb-4"
              />
              <h3 className="text-xl font-bold text-red-600">Save Lives</h3>
              <p className="mt-2 text-gray-600">
                Help patients in need of surgeries or fighting illnesses.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <img
                src="https://res.cloudinary.com/dfj48q4my/image/upload/v1735147541/pycvbqeudbhgewe2zalm.jpg"
                alt="Community"
                className="mx-auto mb-4"
              />
              <h3 className="text-xl font-bold text-red-600">
                Community Impact
              </h3>
              <p className="mt-2 text-gray-600">
                Join a network of donors making a real difference.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <img
                src="https://res.cloudinary.com/dfj48q4my/image/upload/v1735147889/genrruurexw187g05ebg.png"
                alt="Quick & Safe"
                className="mx-auto mb-4"
              />
              <h3 className="text-xl font-bold text-red-600">Quick & Safe</h3>
              <p className="mt-2 text-gray-600">
                Experience a safe, fast, and hassle-free donation process.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-white">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold text-red-600">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <div className="bg-gray-50 p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-bold text-red-600">1. Register</h3>
              <p className="mt-2 text-gray-600">
                Sign up and create your profile in minutes.
              </p>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-bold text-red-600">2. Donate</h3>
              <p className="mt-2 text-gray-600">
                Visit a nearby donation center or attend a campaign.
              </p>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-bold text-red-600">3. Save Lives</h3>
              <p className="mt-2 text-gray-600">
                Your contribution will save lives and bring hope.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-6">
        <div className="container mx-auto text-center">
          <p>&copy; 2024 Blood Donor Connect. All rights reserved.</p>
          <div className="flex justify-center gap-6 mt-4">
            <a href="#" className="hover:text-gray-300">
              Contact
            </a>
            <a href="#" className="hover:text-gray-300">
              FAQs
            </a>
            <a href="#" className="hover:text-gray-300">
              Privacy Policy
            </a>
          </div>
        </div>
      </footer>
    </div>
  ) : (
    <div
      className="min-h-screen flex flex-col bg-gradient-to-b from-red-50 via-white to-red-100"
      style={{
        backgroundImage: `url('/images/blood-donation-pattern.png'), 
                        linear-gradient(to bottom, rgba(255, 255, 255, 0.9), rgba(255, 99, 71, 0.1))`,
        backgroundSize: "cover, contain",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center top",
      }}
    >
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-8">
          {/* Welcome Section */}
          <section className="text-center mb-12">
            <h2 className="text-4xl font-bold text-red-600 mb-4">
              Welcome to Blood Donor Connect
            </h2>
            <p className="text-gray-700 text-lg">
              Saving lives, one drop at a time. Join our community of donors and
              recipients to make a real difference.
            </p>
          </section>

          {/* Options Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 items-center justify-center">
            {/* Find Donors */}
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <img
                src="https://res.cloudinary.com/dfj48q4my/image/upload/v1735148016/qzy8zb3yswst4wvaqxds.jpg"
                alt="Find Donors"
                className="w-32 h-32 mx-auto mb-4"
              />
              <h3 className="text-xl font-semibold mb-2">Find Donors</h3>
              <p className="text-gray-600 mb-4">
                Locate nearby donors quickly and save lives in emergencies.
              </p>
              <a
                href="/findDonors"
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Search Now
              </a>
            </div>
            {/* Campaigns */}
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <img
                src="https://res.cloudinary.com/dfj48q4my/image/upload/v1735148217/rditxeg3mvqq3axpbggq.jpg"
                alt="Campaigns"
                className="w-32 h-32 mx-auto mb-4"
              />
              <h3 className="text-xl font-semibold mb-2">Campaigns</h3>
              <p className="text-gray-600 mb-4">
                Join or view ongoing blood donation campaigns in your area.
              </p>
              <a
                href="/findCampaign"
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                View Campaigns
              </a>
            </div>
            {/* Register Campaign */}
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <img
                src="https://res.cloudinary.com/dfj48q4my/image/upload/v1735986882/z9ldia65gqzmlqyzlalg.png"
                alt="Register Campaign"
                className="w-32 h-32 mx-auto mb-4"
              />
              <h3 className="text-xl font-semibold mb-2">Register Campaign</h3>
              <p className="text-gray-600 mb-4">
                Register blood donation campaigns in your area.
              </p>
              <a
                href="/registerCampaign"
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Register Now
              </a>
            </div>
          </div>
    
        

          {/* Horizontal Scrolling Section */}
          <section className="mb-12">
            <h3 className="text-3xl font-bold text-center text-red-600 mb-6">
              Our Impact
            </h3>
            <div className="overflow-x-auto">
              <div className="flex gap-4 px-4">
                {[
                  {
                    title: "Emergency Response",
                    image: "https://res.cloudinary.com/dfj48q4my/image/upload/v1735224819/jidskddcikxhgs0p2o3b.jpg",
                  },
                  { title: "Community Drives", image: "https://res.cloudinary.com/dfj48q4my/image/upload/v1735149068/znbt1tzoukso0x6gkiux.jpg" },
                  { title: "Inspiring Stories", image: "https://res.cloudinary.com/dfj48q4my/image/upload/v1735149069/lishvmqx6bpiv3yvsubi.jpg" },
                ].map((item, index) => (
                  <div
                    key={index}
                    className="min-w-[350px] bg-white shadow-lg rounded-lg p-4 transform hover:scale-105 transition duration-300"
                  >
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <h4 className="text-lg font-bold mt-4">{item.title}</h4>
                    <p className="text-gray-600 mt-2">
                      Learn about how blood donations are changing lives.
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Benefits Section */}
          <section className="bg-red-50 py-12 mb-12">
            <h3 className="text-3xl font-bold text-center text-red-600 mb-6">
              Why Donate Blood?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-md text-center">
                <h4 className="text-xl font-semibold text-red-600">
                  Save Lives
                </h4>
                <p className="mt-2 text-gray-600">
                  Each donation can save up to three lives.
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md text-center">
                <h4 className="text-xl font-semibold text-red-600">
                  Feel Good
                </h4>
                <p className="mt-2 text-gray-600">
                  Blood donation is a selfless and rewarding act.
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md text-center">
                <h4 className="text-xl font-semibold text-red-600">
                  Health Benefits
                </h4>
                <p className="mt-2 text-gray-600">
                  Regular donation can improve your health and blood flow.
                </p>
              </div>
            </div>
          </section>

          {/* Testimonials Section */}
          <section className="py-12 mb-12">
            <h3 className="text-3xl font-bold text-center text-red-600 mb-6">
              Testimonials
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                "Blood Donor Connect made donating simple and impactful!",
                "I found a donor within minutes during an emergency.",
                "Joining campaigns has been a fulfilling experience.",
              ].map((quote, index) => (
                <div
                  key={index}
                  className="bg-white p-6 rounded-lg shadow-md text-center"
                >
                  <p className="text-gray-600 mb-4">"{quote}"</p>
                  <h4 className="text-lg font-bold text-red-600">
                    User {index + 1}
                  </h4>
                </div>
              ))}
            </div>
          </section>

          {/* FAQs Section */}
          <section className="bg-red-50 py-12 mb-12">
            <h3 className="text-3xl font-bold text-center text-red-600 mb-6">
              Frequently Asked Questions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                {
                  q: "Who can donate blood?",
                  a: "Anyone healthy, aged 18–65.",
                },
                {
                  q: "How often can I donate?",
                  a: "Every 56 days for whole blood.",
                },
              ].map((faq, index) => (
                <div key={index} className="bg-white p-6 rounded-lg shadow-md">
                  <h4 className="text-lg font-bold text-red-600">{faq.q}</h4>
                  <p className="text-gray-600 mt-2">{faq.a}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Call-to-Action Section */}
          <section className="bg-red-600 text-white py-12 text-center">
            <h3 className="text-3xl font-bold mb-4">Ready to Save Lives?</h3>
            <p className="text-lg mb-6">
              Register today and become a lifesaver in your community.
            </p>
            <a
              href="/signup"
              className="bg-white text-red-600 px-6 py-3 rounded-full font-semibold hover:bg-gray-200 transition"
            >
              Register Now
            </a>
          </section>
        </div>
      </main>

      {/* Footer Section */}
      <footer className="bg-gray-800 text-white py-4">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; 2024 Blood Donor Connect. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
