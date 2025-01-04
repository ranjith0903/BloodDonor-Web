import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
} from "@headlessui/react";
import { Bars3Icon, BellIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useUserStore } from "../store/useUserStore";

const navigation = [
  { name: "Home", href: "/", current: true },
  { name: "Find Donors", href: "/findDonors", current: false },
  { name: "Register Campaigns", href: "/registerCampaign", current: false },
  { name: "About", href: "/about", current: false },
];

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function Navbar() {
  const { user, checkAuth, logout } = useUserStore();
  const admin = user?.role === "admin";

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <Disclosure as="nav" className="bg-gray-800">
      <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
        <div className="relative flex h-16 items-center justify-between">
          {/* Mobile menu button */}
          <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
            <DisclosureButton className="group relative inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white">
              <span className="absolute -inset-0.5" />
              <span className="sr-only">Open main menu</span>
              <Bars3Icon
                aria-hidden="true"
                className="block size-6 group-data-[open]:hidden"
              />
              <XMarkIcon
                aria-hidden="true"
                className="hidden size-6 group-data-[open]:block"
              />
            </DisclosureButton>
          </div>

          <div className="flex items-center justify-center sm:items-stretch sm:justify-start">
  {/* Logo */}
  <div className="flex-shrink-0 items-center sm:items-center sm:justify-center">
    <Link to="/">
      <img
        alt="BloodNet"
        src="https://res.cloudinary.com/dfj48q4my/image/upload/v1735985518/mqvnu7muy71ls33hxjlg.png"
        className="h-16 w-auto"
      />
    </Link>
  </div>

  {/* Navigation Links */}
  <div className="hidden sm:ml-6 sm:block">
    <div className="flex space-x-4 items-center h-full">
      {navigation.map((item) => (
        <a
          key={item.name}
          href={item.href}
          aria-current={item.current ? "page" : undefined}
          className={classNames(
            item.current
              ? "bg-gray-900 text-white"
              : "text-gray-300 hover:bg-gray-700 hover:text-white",
            "rounded-md px-3 py-2 text-sm font-medium flex items-center"
          )}
        >
          {item.name}
        </a>
      ))}
    </div>
  </div>
</div>

          {/* User actions */}
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
            {user ? (
              <>
                {admin && (
                  <Link to="/admin">
                    <button className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium mr-2">
                      Dashboard
                    </button>
                  </Link>
                )}
                {/* Profile dropdown */}
                <Menu as="div" className="relative ml-3">
                  <div className="flex items-center">
                    <MenuButton className="relative flex items-center justify-center rounded-full bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800 w-10 h-10 sm:w-12 sm:h-12">
                      <span className="absolute -inset-1.5" />
                      <span className="sr-only">Open user menu</span>
                      <img
                        alt="Profile"
                        src={user?.profilePicture}
                        className="h-full w-full rounded-full"
                      />
                    </MenuButton>
                  </div>
                  <MenuItems
                    transition
                    className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black/5 transition focus:outline-none data-[closed]:scale-95 data-[closed]:transform data-[closed]:opacity-0 data-[enter]:duration-100 data-[leave]:duration-75 data-[enter]:ease-out data-[leave]:ease-in"
                  >
                    <MenuItem>
                      <a
                        href="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 data-[focus]:bg-gray-100 data-[focus]:outline-none"
                      >
                        Your Profile
                      </a>
                    </MenuItem>
                    <MenuItem>
                      <button
                        className="block px-4 py-2 text-sm text-gray-700 data-[focus]:bg-gray-100 data-[focus]:outline-none"
                        onClick={logout}
                      >
                        Sign out
                      </button>
                    </MenuItem>
                  </MenuItems>
                </Menu>
              </>
            ) : (
              <>
                <Link to="/login">
                  <button className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium mr-2">
                    Login
                  </button>
                </Link>
                <Link to="/signup">
                  <button className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                    Sign Up
                  </button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu panel */}
      <DisclosurePanel className="sm:hidden">
        <div className="space-y-1 px-2 pb-3 pt-2">
          {navigation.map((item) => (
            <DisclosureButton
              key={item.name}
              as="a"
              href={item.href}
              aria-current={item.current ? "page" : undefined}
              className={classNames(
                item.current
                  ? "bg-gray-900 text-white"
                  : "text-gray-300 hover:bg-gray-700 hover:text-white",
                "block rounded-md px-3 py-2 text-base font-medium"
              )}
            >
              {item.name}
            </DisclosureButton>
          ))}
        </div>
      </DisclosurePanel>
    </Disclosure>
  );
}
