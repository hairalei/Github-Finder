import React, { useState, useEffect } from "react";
import mockUser from "./mockData.js/mockUser";
import mockRepos from "./mockData.js/mockRepos";
import mockFollowers from "./mockData.js/mockFollowers";
import axios from "axios";

const rootUrl = "https://api.github.com";

const GithubContext = React.createContext();

const GithubProvider = ({ children }) => {
  const [githubUser, setGithubUser] = useState("webdevsimplified");
  const [repos, setRepos] = useState([]);
  const [followers, setFollowers] = useState([]);

  const [requests, setRequests] = useState(0);
  const [error, setError] = useState({ show: false, msg: "" });
  const [isLoading, setIsLoading] = useState(false);

  const searchGithubUser = async (user) => {
    toggleError();
    setIsLoading(true);

    try {
      const res = await axios(`${rootUrl}/users/${user}`);
      const { data } = res;

      if (res) {
        setGithubUser(data);

        const { login, followers_url } = data;

        await Promise.allSettled([
          axios(`${rootUrl}/users/${login}/repos?per_page=100`),
          axios(`${followers_url}?per_page=100`),
        ])
          .then((results) => {
            const [userRepos, userFollowers] = results;
            const status = "fulfilled";

            if (userRepos.status === status) {
              setRepos(userRepos.value.data);
            }

            if (userFollowers.status === status) {
              setFollowers(userFollowers.value.data);
            }
          })
          .catch((err) => {
            console.log(err);
            toggleError(true, err.message);
          });
      } else {
        toggleError(true, "User does not exist");
      }
    } catch (error) {
      console.log(error);
      setIsLoading(false);
      toggleError(true, "User does not exist");
    }

    checkRequests();
    setIsLoading(false);
  };

  //Check rate
  const checkRequests = async () => {
    try {
      const res = await axios(`${rootUrl}/rate_limit`);
      const { data } = res;

      let {
        rate: { remaining },
      } = data;
      setRequests(remaining);

      if (remaining === 0) {
        toggleError(true, "sorry, you have exceeded your hourly rate limit!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  function toggleError(show = false, msg = "") {
    setError({ show, msg });
  }

  useEffect(() => {
    searchGithubUser(githubUser);
  }, []);

  return (
    <GithubContext.Provider
      value={{
        githubUser,
        repos,
        followers,
        requests,
        error,
        searchGithubUser,
        isLoading,
      }}
    >
      {children}
    </GithubContext.Provider>
  );
};

const useGlobalContext = () => React.useContext(GithubContext);

export { GithubProvider, useGlobalContext };
