import React, { useEffect, useState } from "react";
import { useAdminStore } from "../store/useAdminStore";
import DeleteCard from "../components/DeleteCard";

export const DeleteUser = () => {
  const { searched_user, getUserByEmail } = useAdminStore();
  const [email, setEmail] = useState("");
  const handleSearch = (e) => {
    e.preventDefault();
    getUserByEmail(email);
  };

  return (
    <div className="mt-16 px-4">
      <form
        className="flex flex-col sm:flex-row items-center w-full max-w-md mx-auto bg-white rounded-lg shadow-md p-4"
        onSubmit={handleSearch}
      >
        <input
          type="text"
          placeholder="Search here"
          className="w-full sm:flex-grow rounded-md border px-3 py-2 mb-3 sm:mb-0 focus:outline-none focus:ring-2 focus:ring-red-600"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
          }}
        />
        <button
          type="submit"
          className="w-full sm:w-auto bg-red-600 text-white rounded-md px-4 py-2 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-600"
        >
          Search
        </button>
      </form>
      {searched_user?.length ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-8">
          
          {searched_user.map((user) => (
            <DeleteCard user={user} key={user._id} />
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-600 mt-8">No users found.</p>
      )}
    </div>
  );
};

