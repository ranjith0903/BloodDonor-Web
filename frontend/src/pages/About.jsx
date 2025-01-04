import React from 'react';
import { Heart, HandHeart, Clock, Award, Users, Droplet, Code } from 'lucide-react';

const About = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white">
      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <Heart className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Connecting Lives Through Blood Donation
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Every drop counts in our mission to save lives. Join our community of donors
            and help those in need.
          </p>
        </div>

        {/* Donors Section */}
        <div className="mb-16">
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 flex items-center">
              <HandHeart className="w-8 h-8 text-red-500 mr-3" />
              For Blood Donors
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="flex flex-col items-center text-center">
                <Clock className="w-12 h-12 text-red-500 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Quick Process</h3>
                <p className="text-gray-600">
                  The entire donation process takes only 30-45 minutes of your time
                </p>
              </div>
              <div className="flex flex-col items-center text-center">
                <Award className="w-12 h-12 text-red-500 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Save Lives</h3>
                <p className="text-gray-600">
                  One donation can save up to three lives in your community
                </p>
              </div>
              <div className="flex flex-col items-center text-center">
                <Users className="w-12 h-12 text-red-500 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Join Community</h3>
                <p className="text-gray-600">
                  Become part of a caring community dedicated to helping others
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recipients Section */}
        <div>
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 flex items-center">
              <Droplet className="w-8 h-8 text-red-500 mr-3" />
              For Recipients
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-red-50 rounded-xl p-6">
                <h3 className="text-xl font-semibold mb-4">Emergency Support</h3>
                <p className="text-gray-700">
                  Quick access to blood supplies during emergencies with our network
                  of regular donors and blood banks.
                </p>
              </div>
              <div className="bg-red-50 rounded-xl p-6">
                <h3 className="text-xl font-semibold mb-4">Verified Donors</h3>
                <p className="text-gray-700">
                  All donations undergo thorough screening and testing to ensure
                  safety and compatibility.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-16 pb-8 text-center">
          <div className="flex items-center justify-center text-gray-600">
            <Code className="w-4 h-4 mr-2" />
            <p>Created and designed by Ranjith HK</p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default About;